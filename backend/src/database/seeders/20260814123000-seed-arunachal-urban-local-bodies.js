'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Seed `urban_local_bodies` from Excel sheet "ARUNACHAL URBAN TOWNS"
 * (ULB ARUNACHAL PRADESH.xlsx).
 *
 * Insert-only by `localbody_code` — never updates/deletes existing rows.
 * District codes are resolved from `districts` (state_code 12) by name.
 *
 * Run:
 *   npx sequelize-cli db:seed --seed 20260814123000-seed-arunachal-urban-local-bodies.js
 */

const STATE_CODE = 12;
const STATE_NAME = 'ARUNACHAL PRADESH';

/** Fallback LGD-style type codes when no existing row of that type is found. */
const TYPE_CODE_FALLBACK = {
  'Municipal Corporation': 1,
  Municipality: 2,
  'Town Panchayat': 3,
};

/** Excel district_name → alternate names present in `districts`. */
const DISTRICT_NAME_ALIASES = {
  'Pakke Kessang': ['Pakke Kessang', 'Pakke-Kessang'],
  'Shi Yomi': ['Shi Yomi', 'Shi-Yomi'],
  Leparada: ['Leparada', 'Lepa Rada', 'Lepa-Rada'],
  'Papum Pare': ['Papum Pare', 'Pappum Pare'],
};

/**
 * Rows from ARUNACHAL URBAN TOWNS:
 * ULB/UDA_Code → localbody_code
 * short ULB name + type from "ULB_Name / UDA Name"
 */
const URBAN_LOCAL_BODIES = [
  
  { localbody_code: 990082, district_name: 'Anjaw', local_body_name: 'Hawai', localbody_type_name: 'Town Panchayat' },
  { localbody_code: 249711, district_name: 'Changlang', local_body_name: 'Changlang', localbody_type_name: 'Town Panchayat' },
  { localbody_code: 990084, district_name: 'Changlang', local_body_name: 'Miao', localbody_type_name: 'Town Panchayat' },
  { localbody_code: 801445, district_name: 'Dibang Valley', local_body_name: 'Anini', localbody_type_name: 'Town Panchayat' },
  { localbody_code: 990075, district_name: 'Kra Daadi', local_body_name: 'Palin', localbody_type_name: 'Town Panchayat' },
  { localbody_code: 990074, district_name: 'Kurung Kumey', local_body_name: 'Koloriang', localbody_type_name: 'Town Panchayat' },
  { localbody_code: 299596, district_name: 'Keyi Panyor', local_body_name: 'Yachuli', localbody_type_name: 'Town Panchayat' },
  { localbody_code: 264496, district_name: 'Longding', local_body_name: 'Kanubari', localbody_type_name: 'Town Panchayat' },
  { localbody_code: 990085, district_name: 'Longding', local_body_name: 'Longding', localbody_type_name: 'Town Panchayat' },
  { localbody_code: 263722, district_name: 'Lower Siang', local_body_name: 'Likabali', localbody_type_name: 'Town Panchayat' },
  { localbody_code: 990072, district_name: 'Papum Pare', local_body_name: 'Sagalee', localbody_type_name: 'Town Panchayat' },
  { localbody_code: 263447, district_name: 'Siang', local_body_name: 'Kaying', localbody_type_name: 'Town Panchayat' },
  { localbody_code: 990080, district_name: 'Siang', local_body_name: 'Boleng', localbody_type_name: 'Town Panchayat' },
  { localbody_code: 990081, district_name: 'Siang', local_body_name: 'Pangin', localbody_type_name: 'Town Panchayat' },
  { localbody_code: 990078, district_name: 'Upper Siang', local_body_name: 'Yingkiong', localbody_type_name: 'Town Panchayat' },
  { localbody_code: 990079, district_name: 'Upper Siang', local_body_name: 'Mariyang', localbody_type_name: 'Town Panchayat' },
  { localbody_code: 801425, district_name: 'West Kameng', local_body_name: 'Dirang', localbody_type_name: 'Town Panchayat' },
  { localbody_code: 249705, district_name: 'West Siang', local_body_name: 'Aalo', localbody_type_name: 'Town Panchayat' },
];

function districtLookupNames(excelDistrictName) {
  return DISTRICT_NAME_ALIASES[excelDistrictName] || [excelDistrictName];
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const select = (sql, replacements) =>
      queryInterface.sequelize.query(sql, {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
      });

    // Prefer type codes already used in DB for consistency with NCD sync data.
    const typeRows = await select(
      `SELECT localbody_type_name, localbody_type_code
       FROM urban_local_bodies
       WHERE localbody_type_name IS NOT NULL AND localbody_type_code IS NOT NULL
       GROUP BY localbody_type_name, localbody_type_code`,
      {}
    );
    const typeCodeByName = { ...TYPE_CODE_FALLBACK };
    for (const row of typeRows || []) {
      const name = String(row.localbody_type_name || '').trim();
      const code = Number(row.localbody_type_code);
      if (name && Number.isFinite(code) && code > 0) {
        typeCodeByName[name] = code;
      }
    }

    const existingCodes = await select(
      `SELECT localbody_code FROM urban_local_bodies
       WHERE localbody_code IN (:codes)`,
      { codes: URBAN_LOCAL_BODIES.map((r) => r.localbody_code) }
    );
    const existingSet = new Set(
      (existingCodes || []).map((r) => Number(r.localbody_code))
    );

    const now = new Date();
    const toInsert = [];
    let skippedExisting = 0;
    let skippedNoDistrict = 0;

    for (const ulb of URBAN_LOCAL_BODIES) {
      if (existingSet.has(ulb.localbody_code)) {
        skippedExisting += 1;
        continue;
      }

      const names = districtLookupNames(ulb.district_name);
      let districtRow = null;
      for (const name of names) {
        const found = await select(
          `SELECT district_code, name FROM districts
           WHERE state_code = :stateCode
             AND LOWER(TRIM(name)) = LOWER(TRIM(:name))
           ORDER BY district_code ASC
           LIMIT 1`,
          { stateCode: STATE_CODE, name }
        );
        if (found?.[0]) {
          districtRow = found[0];
          break;
        }
      }

      if (!districtRow?.district_code) {
        console.warn(
          `Skip ULB ${ulb.localbody_code} (${ulb.local_body_name}): district not found for "${ulb.district_name}"`
        );
        skippedNoDistrict += 1;
        continue;
      }

      const typeCode =
        typeCodeByName[ulb.localbody_type_name] ||
        TYPE_CODE_FALLBACK[ulb.localbody_type_name];
      if (!typeCode) {
        console.warn(
          `Skip ULB ${ulb.localbody_code} (${ulb.local_body_name}): unknown type "${ulb.localbody_type_name}"`
        );
        continue;
      }

      toInsert.push({
        id: uuidv4(),
        state_code: STATE_CODE,
        state_name: STATE_NAME,
        district_code: Number(districtRow.district_code),
        district_name: String(districtRow.name || ulb.district_name).trim(),
        localbody_type_code: typeCode,
        localbody_type_name: ulb.localbody_type_name,
        localbody_type_name_hindi: null,
        localbody_code: ulb.localbody_code,
        local_body_name: ulb.local_body_name,
        local_body_name_hindi: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('urban_local_bodies', toInsert, {});
    }

    console.log(
      `urban_local_bodies seed: inserted=${toInsert.length}, skipped_existing=${skippedExisting}, skipped_no_district=${skippedNoDistrict}`
    );
  },

  async down(queryInterface) {
    // Removes these Excel ULB codes only — does not touch other localbody_code values.
    const codes = URBAN_LOCAL_BODIES.map((r) => r.localbody_code);
    await queryInterface.sequelize.query(
      `DELETE FROM urban_local_bodies WHERE localbody_code IN (:codes)`,
      { replacements: { codes } }
    );
  },
};
