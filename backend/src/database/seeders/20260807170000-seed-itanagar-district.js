'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Seed district: ITANAGAR (state_code 12, district_code 237)
 *
 * Intentionally shares district_code 237 with existing Papum Pare.
 * Never updates/deletes any non-ITANAGAR row (e.g. Papum Pare).
 *
 * Run:
 *   npx sequelize-cli db:seed --seed 20260807170000-seed-itanagar-district.js
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const stateCode = 12;
    const districtCode = 237;
    const name = 'Itanagar Capital Complex';

    const byName = await queryInterface.sequelize.query(
      `SELECT id, district_code, name FROM districts
       WHERE state_code = :stateCode AND LOWER(TRIM(name)) = LOWER(TRIM(:name))
       LIMIT 1`,
      {
        replacements: { stateCode, name },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (byName?.[0]) {
      if (Number(byName[0].district_code) === districtCode) {
        console.log(`District ${name} (${districtCode}) already exists; skipping. Papum Pare left unchanged.`);
        return;
      }

      // Only touch the ITANAGAR row — never Papum Pare / other 237 rows
      await queryInterface.sequelize.query(
        `UPDATE districts
         SET district_code = :districtCode, updated_at = NOW()
         WHERE id = :id`,
        { replacements: { districtCode, id: byName[0].id } }
      );
      console.log(`Updated existing "${name}" row district_code → ${districtCode}. Papum Pare left unchanged.`);
      return;
    }

    await queryInterface.bulkInsert('districts', [
      {
        id: uuidv4(),
        state_code: stateCode,
        district_code: districtCode,
        name,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
    console.log(
      `Inserted district ${name} (state_code=${stateCode}, district_code=${districtCode}) alongside existing Papum Pare.`
    );
  },

  async down(queryInterface) {
    // Only remove ITANAGAR — never Papum Pare
    await queryInterface.sequelize.query(
      `DELETE FROM districts
       WHERE state_code = 12 AND district_code = 237 AND LOWER(TRIM(name)) = 'itanagar capital complex'`
    );
  },
};
