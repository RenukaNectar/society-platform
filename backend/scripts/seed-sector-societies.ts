/**
 * Seed one draft society_registration per NCD sector key, with real FK mapping
 * and additional_data from cooperative_registrations.json.
 *
 * Usage:
 *   npx ts-node --transpile-only scripts/seed-sector-societies.ts
 *   npx ts-node --transpile-only scripts/seed-sector-societies.ts --dry-run
 */
import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import mysql, { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

const DRY_RUN = process.argv.includes('--dry-run');

/** User-facing NCD keys (normalize singular Registration* → Registrations*) */
const REQUESTED_NCD_KEYS = [
  'CooperativeRegistrationsConsumer',
  'CooperativeRegistrationsMarketing',
  'CooperativeRegistrationsEducation',
  'CooperativeRegistrationsJute',
  'CooperativeRegistrationsSericulture',
  'CooperativeRegistrationsSocial',
  'CooperativeRegistrationsTourism',
  'CooperativeRegistrationsTribal',
  'CooperativeRegistrationsKhadiGram',
  'CooperativeRegistrationsPacs',
  'CooperativeRegistrationsUcb',
  'CooperativeRegistrationsDairy',
  'CooperativeRegistrationsFishery',
  'CooperativeRegistrationsSugar',
  'CooperativeRegistrationsHandloom',
  'CooperativeRegistrationsHandicraft',
  'CooperativeRegistrationsWocoop',
  'CooperativeRegistrationsMulti',
  'CooperativeRegistrationsCreditThrift',
  'CooperativeRegistrationsMiscellaneous',
  'CooperativeRegistrationsProcessing',
  'CooperativeRegistrationsCmiscellaneous',
  'CooperativeRegistrationsHousing',
  'CooperativeRegistrationsLabour',
  'CooperativeRegistrationsLivestock',
  'CooperativeRegistrationsTransport',
  'CooperativeRegistrationsAgriculture',
  'CooperativeRegistrationsBee'
];

/** Map NCD payload key → possible sector_of_operations.respective_table values */
const NCD_KEY_TO_RESPECTIVE_TABLES: Record<string, string[]> = {
  CooperativeRegistrationsConsumer: ['cooperative_registrations_consumer'],
  CooperativeRegistrationsMarketing: ['cooperative_registrations_marketing'],
  CooperativeRegistrationsEducation: ['cooperative_registrations_education'],
  CooperativeRegistrationsJute: ['cooperative_registrations_jute'],
  CooperativeRegistrationsSericulture: ['cooperative_registrations_sericulture'],
  CooperativeRegistrationsSocial: ['cooperative_registrations_social'],
  CooperativeRegistrationsTourism: ['cooperative_registrations_tourism'],
  CooperativeRegistrationsTribal: ['cooperative_registrations_tribal'],
  CooperativeRegistrationsKhadiGram: ['cooperative_registrations_khadi_gram'],
  CooperativeRegistrationsPacs: [
    'cooperative_registrations_pacs',
    'cooperative_registration_pacs',
    'cooperative_registration_primary'
  ],
  CooperativeRegistrationsUcb: ['cooperative_registrations_ucb'],
  CooperativeRegistrationsDairy: ['cooperative_registrations_dairy', 'cooperative_registration_dairy'],
  CooperativeRegistrationsFishery: [
    'cooperative_registrations_fishery',
    'cooperative_registration_fishery'
  ],
  CooperativeRegistrationsSugar: ['cooperative_registrations_sugar'],
  CooperativeRegistrationsHandloom: ['cooperative_registrations_handloom'],
  CooperativeRegistrationsHandicraft: ['cooperative_registrations_handicraft'],
  CooperativeRegistrationsWocoop: ['cooperative_registrations_wocoop'],
  CooperativeRegistrationsMulti: ['cooperative_registrations_multi'],
  CooperativeRegistrationsCreditThrift: ['cooperative_registrations_credit_thrift'],
  CooperativeRegistrationsMiscellaneous: ['cooperative_registrations_miscellaneous'],
  CooperativeRegistrationsProcessing: ['cooperative_registrations_processing'],
  CooperativeRegistrationsCmiscellaneous: ['cooperative_registrations_cmiscellaneous'],
  CooperativeRegistrationsHousing: ['cooperative_registrations_housing'],
  CooperativeRegistrationsLabour: ['cooperative_registrations_labour'],
  CooperativeRegistrationsLivestock: ['cooperative_registrations_livestock'],
  CooperativeRegistrationsTransport: ['cooperative_registrations_transport'],
  CooperativeRegistrationsAgriculture: ['cooperative_registrations_agriculture'],
  CooperativeRegistrationsBee: [
    'cooperative_registrations_bee',
    'cooperative_registration_bee'
  ]
};

/** NCD sector codes that are Credit type (from Real Time Integration doc) */
const CREDIT_SECTOR_CODES = new Set(['001', '007', '018', '035', '1', '7', '18', '35']);

function normalizeUserKey(key: string): string {
  return key.replace(/^CooperativeRegistration(?!s)/, 'CooperativeRegistrations');
}

function loadSectorTemplates(): Record<string, unknown[]> {
  const file = path.join(__dirname, '../src/utils/cooperative_registrations.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

async function q<T extends RowDataPacket[]>(
  pool: Pool,
  sql: string,
  params: unknown[] = []
): Promise<T> {
  const [rows] = await pool.query<T>(sql, params);
  return rows;
}

async function main() {
  const templates = loadSectorTemplates();
  const pool = mysql.createPool({
    host: process.env.DB_HOST?.trim(),
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5
  });

  try {
    // --- Resolve shared FKs from live DB ---
    const state = (
      await q<RowDataPacket[]>(
        pool,
        `SELECT id, name, state_code FROM states WHERE state_code = 12 OR name LIKE '%Arunachal%' LIMIT 1`
      )
    )[0];
    if (!state) throw new Error('No state found');

    const district = (
      await q<RowDataPacket[]>(
        pool,
        `SELECT id, name, district_code, state_code FROM districts WHERE state_code = ? LIMIT 1`,
        [state.state_code]
      )
    )[0];
    if (!district) throw new Error('No district found for state');

    const block = (
      await q<RowDataPacket[]>(
        pool,
        `SELECT id, name, block_code, district_code FROM blocks WHERE district_code = ? LIMIT 1`,
        [district.district_code]
      )
    )[0];
    if (!block) throw new Error('No block found for district');

    const dbg = (
      await q<RowDataPacket[]>(
        pool,
        `SELECT * FROM districts_blocks_gp_villages
         WHERE district_code = ? AND block_code = ? LIMIT 1`,
        [district.district_code, block.block_code]
      )
    )[0] || (
      await q<RowDataPacket[]>(
        pool,
        `SELECT * FROM districts_blocks_gp_villages WHERE district_code = ? LIMIT 1`,
        [district.district_code]
      )
    )[0];
    if (!dbg) throw new Error('No districts_blocks_gp_villages row for geo chain');

    const registrationAuthority = (
      await q<RowDataPacket[]>(pool, `SELECT id, name FROM registration_authorities LIMIT 1`)
    )[0];
    const cooperativeSocietyType = (
      await q<RowDataPacket[]>(
        pool,
        `SELECT id, name FROM cooperative_society_types WHERE name LIKE '%Primary%' LIMIT 1`
      )
    )[0] || (
      await q<RowDataPacket[]>(pool, `SELECT id, name FROM cooperative_society_types LIMIT 1`)
    )[0];
    const societyType = (
      await q<RowDataPacket[]>(pool, `SELECT id, title AS name FROM society_types LIMIT 1`)
    )[0];
    const creditType = (
      await q<RowDataPacket[]>(
        pool,
        `SELECT id, name, \`key\` FROM sector_of_operations_type WHERE \`key\` = 'credit' LIMIT 1`
      )
    )[0];
    const nonCreditType = (
      await q<RowDataPacket[]>(
        pool,
        `SELECT id, name, \`key\` FROM sector_of_operations_type WHERE \`key\` = 'no_credit' LIMIT 1`
      )
    )[0];
    const areaOfOperation = (
      await q<RowDataPacket[]>(
        pool,
        `SELECT id, name FROM area_of_operation_levels WHERE level_type = 'district' LIMIT 1`
      )
    )[0] || (
      await q<RowDataPacket[]>(pool, `SELECT id, name FROM area_of_operation_levels LIMIT 1`)
    )[0];
    const functionalStatus = (
      await q<RowDataPacket[]>(
        pool,
        `SELECT id, name FROM functional_status WHERE name LIKE '%Functional%' LIMIT 1`
      )
    )[0];
    const draftStatus = (
      await q<RowDataPacket[]>(
        pool,
        `SELECT id, \`key\` FROM statuses WHERE \`key\` = 'draft' LIMIT 1`
      )
    )[0];
    const applicant = (
      await q<RowDataPacket[]>(
        pool,
        `SELECT u.id, u.email FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE r.name = 'applicant' AND u.is_active = 1 LIMIT 1`
      )
    )[0];

    if (!registrationAuthority || !cooperativeSocietyType || !societyType) {
      throw new Error('Missing registration_authorities / cooperative_society_types / society_types');
    }
    if (!creditType || !nonCreditType || !areaOfOperation || !functionalStatus || !draftStatus) {
      throw new Error('Missing sector type / area / functional status / draft status');
    }
    if (!applicant) throw new Error('No active applicant user found');

    const sectors = await q<RowDataPacket[]>(
      pool,
      `SELECT id, code, name, respective_table FROM sector_of_operations`
    );

    console.log('Shared FKs:', {
      state: `${state.name} (${state.id})`,
      district: `${district.name} (${district.id})`,
      block: `${block.name} (${block.id})`,
      village_row: dbg.id,
      applicant: applicant.email,
      dryRun: DRY_RUN
    });

    const results: Array<{ ncdKey: string; status: string; societyId?: string; name?: string }> = [];

    for (const rawKey of REQUESTED_NCD_KEYS) {
      const ncdKey = normalizeUserKey(rawKey);
      const tables = NCD_KEY_TO_RESPECTIVE_TABLES[ncdKey];
      if (!tables) {
        results.push({ ncdKey, status: 'SKIP_NO_MAP' });
        continue;
      }

      const sector = sectors.find((s) => tables.includes(String(s.respective_table || '')));
      if (!sector) {
        results.push({ ncdKey, status: `SKIP_SECTOR_NOT_FOUND (${tables.join('|')})` });
        continue;
      }

      const templateArr = templates[ncdKey];
      const sectorObj =
        Array.isArray(templateArr) && templateArr[0] && typeof templateArr[0] === 'object'
          ? { ...(templateArr[0] as Record<string, unknown>) }
          : {};

      const codeStr = String(sector.code ?? '').padStart(3, '0');
      const isCredit =
        CREDIT_SECTOR_CODES.has(codeStr) ||
        CREDIT_SECTOR_CODES.has(String(sector.code)) ||
        /pacs|ucb|credit|cmiscellaneous|thrift/i.test(String(sector.respective_table));

      const societyName = `NCD Seed - ${sector.name}`;
      const existing = await q<RowDataPacket[]>(
        pool,
        `SELECT id FROM society_registrations WHERE cooperative_society_name = ? AND sector_of_operation = ? LIMIT 1`,
        [societyName, sector.id]
      );
      if (existing[0]) {
        results.push({
          ncdKey,
          status: 'EXISTS',
          societyId: existing[0].id,
          name: societyName
        });
        continue;
      }

      const id = uuidv4();
      const societyId = `SOC${Math.floor(100000 + Math.random() * 900000)}`;
      const year = new Date().getFullYear();
      const additionalData = {
        [ncdKey]: [
          {
            ...sectorObj,
            ncd_id: sectorObj.ncd_id || '',
            dist_code: Number(district.district_code) || 0,
            st_code: Number(state.state_code) || 0
          }
        ]
      };

      const row = {
        id,
        society_id: societyId,
        cooperative_society_name: societyName,
        local_langauge_society_name: societyName,
        registration_authoritie_id: registrationAuthority.id,
        reference_year: year,
        date_registration: new Date().toISOString().slice(0, 10),
        registration_number: `NO.COOP(ORG)SEED-${codeStr}-${Date.now().toString().slice(-6)}/${year}`,
        cooperative_society_type_id: cooperativeSocietyType.id,
        area_of_operation_id: areaOfOperation.id,
        water_body_type_id: null,
        sector_of_operation_type: isCredit ? creditType.id : nonCreditType.id,
        sector_of_operation: sector.id,
        functional_status: functionalStatus.id,
        location_of_head_quarter: '1',
        state_id: state.id,
        district_id: district.id,
        block_id: block.id,
        gram_panchayat_id: dbg.id,
        village_code: dbg.id,
        pincode: '791001',
        full_address: `${dbg.village_name || 'Village'}, ${dbg.block_name || block.name}, ${district.name}, ${state.name}`,
        contact_person: 'NCD Seed Promoter',
        designation: 'Promoter',
        mobile: '9876543210',
        landline: '',
        email: `ncd.seed.${codeStr.toLowerCase()}@example.com`,
        financial_audit: 'no',
        is_profit_making: 'no',
        annual_turnover: 0,
        annual_profit: 0,
        annual_loss: 0,
        is_msme: 0,
        is_dividend_paid: 'no',
        dividend_rate: 0,
        operation_area_location: 'rural',
        bank_type: 'commercial',
        pan_no: 'ABCDE1234F',
        how_many_branches: '0',
        full_time_secretary: 'no',
        is_affiliated_union_federation: 'no',
        society_type: societyType.id,
        status: draftStatus.id,
        additional_data: JSON.stringify(additionalData),
        created_by: applicant.id,
        status_changed_by: applicant.id,
        status_changed_at: new Date()
      };

      if (DRY_RUN) {
        results.push({ ncdKey, status: 'DRY_RUN', name: societyName });
        console.log(`[dry-run] ${ncdKey} → ${sector.name} (${sector.respective_table}) credit=${isCredit}`);
        continue;
      }

      await pool.query(
        `INSERT INTO society_registrations SET ?`,
        [row]
      );

      results.push({ ncdKey, status: 'CREATED', societyId: id, name: societyName });
      console.log(`CREATED ${ncdKey} → ${id} (${sector.name})`);
    }

    console.log('\n=== Summary ===');
    for (const r of results) {
      console.log(`${r.status.padEnd(12)} ${r.ncdKey}${r.societyId ? ` ${r.societyId}` : ''}`);
    }
    console.log(
      `\nCreated: ${results.filter((r) => r.status === 'CREATED').length}, ` +
        `Exists: ${results.filter((r) => r.status === 'EXISTS').length}, ` +
        `Skipped: ${results.filter((r) => r.status.startsWith('SKIP')).length}`
    );
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
