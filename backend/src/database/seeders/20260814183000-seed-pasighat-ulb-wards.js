'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Seed `urban_local_bodies_wards` for PASIGHAT (local_body_code 276622)
 * from Excel sheet "PASIGHAT REGION" (ULB ARUNACHAL PRADESH.xlsx).
 *
 * Insert-only: existing rows are never updated or deleted.
 * A ward is skipped when the same (local_body_code, ward_name) already exists.
 *
 * The sheet has no LGD ward codes, so each new ward is given a free 7-digit
 * `ward_code` that is not yet used anywhere in the table.
 *
 * Run:
 *   npx sequelize-cli db:seed --seed 20260814183000-seed-pasighat-ulb-wards.js
 */

const STATE_CODE = 12;
const STATE_NAME = 'ARUNACHAL PRADESH';
const LOCAL_BODY_CODE = 276622;
const LOCAL_BODY_NAME = 'Pasighat';

/** ward_code must stay a 7-digit number and unique across the whole table. */
const WARD_CODE_MIN = 1000000;
const WARD_CODE_MAX = 9999999;
/** Allocation starts high to stay clear of official LGD ward codes. */
const WARD_CODE_ALLOC_START = 900001;

/** Every non-empty value from "Principal Localities / Areas Covered*" (column C). */
const WARDS = [
  { ward_name: 'GTC (Government Town Colony)' },
  { ward_name: 'adjoining residential areas' },
  { ward_name: 'JNC Campus' },
  { ward_name: 'Upper Paglek' },
  { ward_name: 'APST Bus Station Area' },
  { ward_name: 'D.E.M. Middle School Neighbourhood' },
  { ward_name: 'Adjoining Residential Area' },
  { ward_name: 'D.E.M. Higher Secondary School Locality' },
  { ward_name: 'Paglek Extension' },
  { ward_name: 'Officer Colony' },
  { ward_name: 'Surrounding Government Residential Quarters' },
  { ward_name: 'Paglek' },
  { ward_name: 'Government Middle School Area' },
  { ward_name: 'L.B.S. Government Middle School Locality' },
  { ward_name: 'Nearby Residential Areas' },
  { ward_name: 'Educational Colony' },
  { ward_name: 'Town Middle School Area' },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const select = (sql, replacements) =>
      queryInterface.sequelize.query(sql, {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
      });

    const existingWards = await select(
      `SELECT LOWER(TRIM(ward_name)) AS ward_name
       FROM urban_local_bodies_wards
       WHERE local_body_code = :localBodyCode`,
      { localBodyCode: LOCAL_BODY_CODE }
    );
    const existingWardNames = new Set(
      (existingWards || []).map((row) => String(row.ward_name || ''))
    );

    const usedCodeRows = await select(
      `SELECT ward_code FROM urban_local_bodies_wards WHERE ward_code IS NOT NULL`,
      {}
    );
    const usedWardCodes = new Set(
      (usedCodeRows || []).map((row) => Number(row.ward_code))
    );

    let nextCandidate = WARD_CODE_ALLOC_START;
    const allocateWardCode = () => {
      while (nextCandidate <= WARD_CODE_MAX) {
        const candidate = nextCandidate;
        nextCandidate += 1;
        if (candidate >= WARD_CODE_MIN && !usedWardCodes.has(candidate)) {
          usedWardCodes.add(candidate);
          return candidate;
        }
      }
      return null;
    };

    const now = new Date();
    const toInsert = [];
    let skippedExisting = 0;

    for (const ward of WARDS) {
      if (existingWardNames.has(ward.ward_name.toLowerCase())) {
        skippedExisting += 1;
        continue;
      }

      const wardCode = allocateWardCode();
      if (wardCode == null) {
        throw new Error(
          `No free 7-digit ward_code available for ${LOCAL_BODY_NAME} ${ward.ward_name}`
        );
      }

      toInsert.push({
        id: uuidv4(),
        state_code: STATE_CODE,
        state_name: STATE_NAME,
        local_body_code: LOCAL_BODY_CODE,
        local_body_name: LOCAL_BODY_NAME,
        local_body_name_hindi: null,
        ward_code: wardCode,
        ward_name: ward.ward_name,
        ward_name_hindi: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('urban_local_bodies_wards', toInsert, {});
    }

    console.log(
      `urban_local_bodies_wards (${LOCAL_BODY_NAME}/${LOCAL_BODY_CODE}) seed: ` +
        `inserted=${toInsert.length}, skipped_existing=${skippedExisting}` +
        (toInsert.length
          ? `, ward_codes=${toInsert.map((r) => r.ward_code).join(',')}`
          : '')
    );
  },

  async down(queryInterface) {
    // Removes only the wards seeded here — other local bodies stay untouched.
    await queryInterface.sequelize.query(
      `DELETE FROM urban_local_bodies_wards
       WHERE local_body_code = :localBodyCode
         AND ward_name IN (:wardNames)`,
      {
        replacements: {
          localBodyCode: LOCAL_BODY_CODE,
          wardNames: WARDS.map((w) => w.ward_name),
        },
      }
    );
  },
};
