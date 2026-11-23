'use strict';

/**
 * Creates one society_registration per sector_of_operation (30),
 * assigning each to one of the 30 seeded applicants (applicant01..30@seed.test).
 * Society names end with " TEST-NCD".
 *
 * Prerequisite:
 *   npx sequelize-cli db:seed --seed 20260917170300-seed-30-applicant-users.js
 *
 * Run:
 *   npx sequelize-cli db:seed --seed 20260917173000-seed-test-ncd-societies-per-sector.js
 *
 * Undo:
 *   npx sequelize-cli db:seed:undo --seed 20260917173000-seed-test-ncd-societies-per-sector.js
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const NAME_SUFFIX = ' TEST-NCD';
const APPLICANT_EMAIL_DOMAIN = 'seed.test';
const APPLICANT_EMAIL_PREFIX = 'applicant';
const APPLICANT_COUNT = 30;

const CREDIT_TABLE_RE = /pacs|ucb|credit|cmiscellaneous|thrift|primary/i;

const RESPECTIVE_TABLE_TO_NCD_KEY = {
  cooperative_registrations_agriculture: 'CooperativeRegistrationsAgriculture',
  cooperative_registrations_processing: 'CooperativeRegistrationsProcessing',
  cooperative_registrations_bee: 'CooperativeRegistrationsBee',
  cooperative_registrations_consumer: 'CooperativeRegistrationsConsumer',
  cooperative_registrations_credit_thrift: 'CooperativeRegistrationsCreditThrift',
  cooperative_registration_dairy: 'CooperativeRegistrationDairy',
  cooperative_registrations_dairy: 'CooperativeRegistrationDairy',
  cooperative_registrations_education: 'CooperativeRegistrationsEducation',
  cooperative_registration_fishery: 'CooperativeRegistrationFishery',
  cooperative_registrations_fishery: 'CooperativeRegistrationFishery',
  cooperative_registrations_handicraft: 'CooperativeRegistrationsHandicraft',
  cooperative_registrations_handloom: 'CooperativeRegistrationsHandloom',
  cooperative_registrations_housing: 'CooperativeRegistrationsHousing',
  cooperative_registrations_jute: 'CooperativeRegistrationsJute',
  cooperative_registrations_labour: 'CooperativeRegistrationsLabour',
  cooperative_registrations_livestock: 'CooperativeRegistrationsLivestock',
  cooperative_registrations_marketing: 'CooperativeRegistrationsMarketing',
  cooperative_registrations_cmiscellaneous: 'CooperativeRegistrationsCmiscellaneous',
  cooperative_registrations_miscellaneous: 'CooperativeRegistrationsMiscellaneous',
  cooperative_registrations_multi: 'CooperativeRegistrationsMulti',
  cooperative_registration_primary: 'CooperativeRegistrationPacs',
  cooperative_registrations_pacs: 'CooperativeRegistrationPacs',
  cooperative_registration_pacs: 'CooperativeRegistrationPacs',
  cooperative_registrations_sericulture: 'CooperativeRegistrationsSericulture',
  cooperative_registrations_social: 'CooperativeRegistrationsSocial',
  cooperative_registrations_sugar: 'CooperativeRegistrationsSugar',
  cooperative_registrations_tourism: 'CooperativeRegistrationsTourism',
  cooperative_registrations_transport: 'CooperativeRegistrationsTransport',
  cooperative_registrations_tribal: 'CooperativeRegistrationsTribal',
  cooperative_registrations_ucb: 'CooperativeRegistrationsUcb',
  cooperative_registrations_wocoop: 'CooperativeRegistrationsWocoop',
  cooperative_registrations_khadi_gram: 'CooperativeRegistrationsKhadiGram'
};

function loadSectorTemplates() {
  const file = path.join(__dirname, '../../utils/cooperative_registrations.json');
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function applicantEmail(index) {
  return `${APPLICANT_EMAIL_PREFIX}${String(index).padStart(2, '0')}@${APPLICANT_EMAIL_DOMAIN}`;
}

function buildNcdId(stateCode, sectorCode, runningNumber) {
  const statePart = String(stateCode);
  const sectorPart = String(sectorCode).padStart(3, '0');
  const numPart = String(runningNumber).padStart(7, '0');
  return `C${statePart}${sectorPart}${numPart}`;
}

function societyNameForSector(sectorName) {
  return `${sectorName}${NAME_SUFFIX}`;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const templates = loadSectorTemplates();
    const now = new Date();
    const year = now.getFullYear();

    // --- Applicants (exactly the 30 seeded users) ---
    const applicantEmails = [];
    for (let i = 1; i <= APPLICANT_COUNT; i++) applicantEmails.push(applicantEmail(i));

    const applicants = await queryInterface.sequelize.query(
      `SELECT u.id, u.email
       FROM users u
       INNER JOIN roles r ON r.id = u.role_id
       WHERE r.name = 'applicant'
         AND u.email IN (:emails)
       ORDER BY u.email ASC`,
      {
        replacements: { emails: applicantEmails },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (!applicants || applicants.length < APPLICANT_COUNT) {
      throw new Error(
        `Expected ${APPLICANT_COUNT} applicants (${applicantEmail(1)}..${applicantEmail(APPLICANT_COUNT)}). ` +
          `Found ${applicants ? applicants.length : 0}. Run 20260917170300-seed-30-applicant-users.js first.`
      );
    }

    // --- Shared masters ---
    let stateRows = await queryInterface.sequelize.query(
      `SELECT id, name, state_code FROM states
       WHERE state_code = 12 OR name LIKE '%Arunachal%'
       LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (!stateRows || stateRows.length === 0) {
      stateRows = await queryInterface.sequelize.query(
        `SELECT id, name, state_code FROM states LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT }
      );
    }
    const state = stateRows && stateRows[0];
    if (!state) throw new Error('No state found');

    const [district] = await queryInterface.sequelize.query(
      `SELECT id, name, district_code, state_code FROM districts
       WHERE state_code = :stateCode LIMIT 1`,
      {
        replacements: { stateCode: state.state_code },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    if (!district) throw new Error('No district found for state');

    const [block] = await queryInterface.sequelize.query(
      `SELECT id, name, block_code, district_code FROM blocks
       WHERE district_code = :districtCode LIMIT 1`,
      {
        replacements: { districtCode: district.district_code },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    if (!block) throw new Error('No block found for district');

    let [gp] = await queryInterface.sequelize.query(
      `SELECT * FROM districts_blocks_gp_villages
       WHERE district_code = :districtCode AND block_code = :blockCode
       LIMIT 1`,
      {
        replacements: {
          districtCode: district.district_code,
          blockCode: block.block_code
        },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    if (!gp) {
      [gp] = await queryInterface.sequelize.query(
        `SELECT * FROM districts_blocks_gp_villages
         WHERE district_code = :districtCode LIMIT 1`,
        {
          replacements: { districtCode: district.district_code },
          type: Sequelize.QueryTypes.SELECT
        }
      );
    }
    if (!gp) throw new Error('No gram panchayat / village geo row found');

    const [registrationAuthority] = await queryInterface.sequelize.query(
      `SELECT id FROM registration_authorities LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    let [cooperativeSocietyType] = await queryInterface.sequelize.query(
      `SELECT id FROM cooperative_society_types WHERE name LIKE '%Primary%' LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (!cooperativeSocietyType) {
      [cooperativeSocietyType] = await queryInterface.sequelize.query(
        `SELECT id FROM cooperative_society_types LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT }
      );
    }
    const [societyType] = await queryInterface.sequelize.query(
      `SELECT id FROM society_types LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const [creditType] = await queryInterface.sequelize.query(
      `SELECT id FROM sector_of_operations_type WHERE \`key\` = 'credit' LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const [nonCreditType] = await queryInterface.sequelize.query(
      `SELECT id FROM sector_of_operations_type WHERE \`key\` IN ('no_credit', 'non_credit') LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    let [areaOfOperation] = await queryInterface.sequelize.query(
      `SELECT id FROM area_of_operation_levels WHERE level_type = 'district' LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (!areaOfOperation) {
      [areaOfOperation] = await queryInterface.sequelize.query(
        `SELECT id FROM area_of_operation_levels LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT }
      );
    }
    let [functionalStatus] = await queryInterface.sequelize.query(
      `SELECT id FROM functional_status
       WHERE name LIKE 'Functional%' AND name NOT LIKE '%Non%'
       LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (!functionalStatus) {
      [functionalStatus] = await queryInterface.sequelize.query(
        `SELECT id FROM functional_status LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT }
      );
    }
    const [draftStatus] = await queryInterface.sequelize.query(
      `SELECT id FROM statuses WHERE \`key\` = 'draft' LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!registrationAuthority || !cooperativeSocietyType || !societyType) {
      throw new Error('Missing registration_authorities / cooperative_society_types / society_types');
    }
    if (!creditType || !nonCreditType || !areaOfOperation || !functionalStatus || !draftStatus) {
      throw new Error('Missing sector type / area / functional status / draft status');
    }

    const sectors = await queryInterface.sequelize.query(
      `SELECT id, code, name, respective_table
       FROM sector_of_operations
       ORDER BY CAST(code AS UNSIGNED) ASC, name ASC`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!sectors.length) throw new Error('No sector_of_operations found');

    const maxSectors = Math.min(sectors.length, applicants.length);
    let created = 0;
    let skipped = 0;

    // Base running number for ncd_id uniqueness in this seed batch
    let running = 9000000 + Date.now() % 100000;

    for (let i = 0; i < maxSectors; i++) {
      const sector = sectors[i];
      const applicant = applicants[i];
      const name = societyNameForSector(sector.name);

      const existing = await queryInterface.sequelize.query(
        `SELECT id FROM society_registrations
         WHERE cooperative_society_name = :name
         LIMIT 1`,
        {
          replacements: { name },
          type: Sequelize.QueryTypes.SELECT
        }
      );
      if (existing && existing.length > 0) {
        console.log(`⚠ Exists: ${name}`);
        skipped += 1;
        continue;
      }

      const codeStr = String(sector.code ?? '').padStart(3, '0');
      const table = String(sector.respective_table || '').trim();
      const isCredit =
        CREDIT_TABLE_RE.test(table) || /credit/i.test(String(sector.name || ''));

      const ncdKey = RESPECTIVE_TABLE_TO_NCD_KEY[table] || null;
      running += 1;
      const ncdId = buildNcdId(state.state_code, sector.code || codeStr, running);

      let additionalData = {};
      if (ncdKey) {
        const templateArr = templates[ncdKey];
        const sectorObj =
          Array.isArray(templateArr) && templateArr[0] && typeof templateArr[0] === 'object'
            ? { ...(templateArr[0]) }
            : {};
        sectorObj.ncd_id = ncdId;
        sectorObj.dist_code = Number(district.district_code) || 0;
        sectorObj.st_code = Number(state.state_code) || 0;
        additionalData = { [ncdKey]: [sectorObj] };
      }

      const id = uuidv4();
      const societyId = `SOC${Math.floor(100000 + Math.random() * 900000)}`;

      await queryInterface.bulkInsert('society_registrations', [
        {
          id,
          society_id: societyId,
          cooperative_society_name: name,
          local_langauge_society_name: name,
          registration_authoritie_id: registrationAuthority.id,
          reference_year: year,
          date_registration: now.toISOString().slice(0, 10),
          registration_number: `NO.COOP(ORG)TEST-NCD-${codeStr}-${String(i + 1).padStart(2, '0')}/${year}`,
          cooperative_society_type_id: cooperativeSocietyType.id,
          area_of_operation_id: areaOfOperation.id,
          water_body_type_id: null,
          sector_of_operation_type: isCredit ? creditType.id : nonCreditType.id,
          sector_of_operation: sector.id,
          functional_status: functionalStatus.id,
          location_of_head_quarter: '2',
          state_id: state.id,
          district_id: district.id,
          block_id: block.id,
          gram_panchayat_id: gp.id,
          village_code: gp.id,
          pincode: '791001',
          full_address: `${gp.village_name || 'Village'}, ${gp.block_name || block.name}, ${district.name}, ${state.name}`,
          contact_person: `${applicant.email.split('@')[0]} Promoter`,
          designation: 'Promoter',
          mobile: String(9800000000 + (i + 1)),
          landline: '',
          email: applicant.email,
          financial_audit: 'no',
          is_profit_making: 'no',
          annual_turnover: 0,
          annual_profit: 0,
          annual_loss: 0,
          is_msme: false,
          is_dividend_paid: 'no',
          dividend_rate: 0,
          operation_area_location: 'rural',
          bank_type: 'commercial',
          pan_no: `SEEDA${String(1000 + i + 1).slice(-4)}Z`,
          how_many_branches: '0',
          full_time_secretary: 'no',
          is_affiliated_union_federation: 'no',
          society_type: societyType.id,
          status: draftStatus.id,
          additional_data: JSON.stringify(additionalData),
          ncd_id: ncdId,
          ncd_running_number: running,
          created_by: applicant.id,
          status_changed_by: applicant.id,
          status_changed_at: now,
          created_at: now,
          updated_at: now
        }
      ]);

      console.log(
        `✓ ${name} → ${applicant.email} (sector=${sector.code} ${sector.name}) ncd_id=${ncdId}`
      );
      created += 1;
    }

    console.log(
      `\n✅ TEST-NCD societies done. created=${created}, skipped=${skipped}, ` +
        `sectors=${sectors.length}, applicants=${applicants.length}`
    );
    if (sectors.length > applicants.length) {
      console.log(
        `⚠ ${sectors.length - applicants.length} sector(s) not seeded (not enough applicants).`
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `DELETE FROM society_registrations
       WHERE cooperative_society_name LIKE :suffix`,
      {
        replacements: { suffix: `%${NAME_SUFFIX}` }
      }
    );
  }
};
