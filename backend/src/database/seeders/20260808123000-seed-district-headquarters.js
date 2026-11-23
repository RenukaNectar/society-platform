'use strict';

/**
 * Seed district_headquarters for Arunachal Pradesh districts (state_code 12)
 * from "List of districts with its HQ".
 *
 * Matches by district name (case-insensitive); aliases cover DB naming variants
 * (e.g. ITANAGAR vs Itanagar Capital Complex). Does not insert new districts.
 *
 * Run:
 *   npx sequelize-cli db:seed --seed 20260808123000-seed-district-headquarters.js
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const stateCode = 12;

    /** @type {{ names: string[]; hq: string }[]} */
    const mappings = [
      { names: ['Tawang'], hq: 'Tawang' },
      { names: ['West Kameng'], hq: 'Bomdila' },
      { names: ['Bichom'], hq: 'Napangphung' },
      { names: ['East Kameng'], hq: 'Seppa' },
      { names: ['Pakke-Kessang', 'Pakke Kessang'], hq: 'Lemmi' },
      { names: ['Kurung Kumey'], hq: 'Koloriang' },
      { names: ['Papum Pare', 'Pappum Pare'], hq: 'Yupia' },
      {
        names: ['Itanagar Capital Complex', 'ITANAGAR', 'Itanagar'],
        hq: 'Itanagar',
      },
      { names: ['Kra Daadi', 'Kra Daadi'], hq: 'Jamin' },
      { names: ['Lower Subansiri'], hq: 'Ziro' },
      { names: ['Kamle'], hq: 'Raga' },
      { names: ['Keyi Panyor'], hq: 'Yachuli' },
      { names: ['Upper Subansiri'], hq: 'Daporijo' },
      { names: ['Shi-Yomi', 'Shi Yomi'], hq: 'Tato' },
      { names: ['West Siang'], hq: 'Aalo' },
      { names: ['Siang'], hq: 'Boleng' },
      { names: ['Lower Siang'], hq: 'Likabali' },
      { names: ['Lepa-Rada', 'Lepa Rada', 'LepaRada'], hq: 'Basar' },
      { names: ['Upper Siang'], hq: 'Yingkiong' },
      { names: ['East Siang'], hq: 'Pasighat' },
      { names: ['Dibang Valley'], hq: 'Anini' },
      { names: ['Lower Dibang Valley'], hq: 'Roing' },
      { names: ['Lohit'], hq: 'Tezu' },
      { names: ['Anjaw'], hq: 'Hawai' },
      { names: ['Namsai'], hq: 'Namsai' },
      { names: ['Changlang'], hq: 'Changlang' },
      { names: ['Tirap'], hq: 'Khonsa' },
      { names: ['Longding'], hq: 'Longding' },
    ];

    let updated = 0;
    let missing = 0;

    for (const { names, hq } of mappings) {
      const result = await queryInterface.sequelize.query(
        `UPDATE districts
         SET district_headquarters = :hq, updated_at = NOW()
         WHERE state_code = :stateCode
           AND LOWER(TRIM(name)) IN (:names)`,
        {
          replacements: {
            hq,
            stateCode,
            names: names.map((n) => n.trim().toLowerCase()),
          },
        }
      );

      // MySQL/MariaDB: result[1] is affectedRows for UPDATE via sequelize.query
      const affected =
        typeof result?.[1] === 'number'
          ? result[1]
          : Number(result?.[1]?.affectedRows ?? 0);

      if (affected > 0) {
        updated += affected;
        console.log(`Updated HQ for ${names[0]} → ${hq} (${affected} row(s))`);
      } else {
        missing += 1;
        console.warn(`No district row matched for "${names.join('" / "')}" (HQ: ${hq})`);
      }
    }

    console.log(`District headquarters seed done. updated=${updated}, unmatched=${missing}`);
  },

  async down(queryInterface, Sequelize) {
    const stateCode = 12;
    const names = [
      'Tawang',
      'West Kameng',
      'Bichom',
      'East Kameng',
      'Pakke-Kessang',
      'Pakke Kessang',
      'Kurung Kumey',
      'Papum Pare',
      'Pappum Pare',
      'Itanagar Capital Complex',
      'ITANAGAR',
      'Itanagar',
      'Kra Daadi',
      'Lower Subansiri',
      'Kamle',
      'Keyi Panyor',
      'Upper Subansiri',
      'Shi-Yomi',
      'Shi Yomi',
      'West Siang',
      'Siang',
      'Lower Siang',
      'Lepa-Rada',
      'Lepa Rada',
      'LepaRada',
      'Upper Siang',
      'East Siang',
      'Dibang Valley',
      'Lower Dibang Valley',
      'Lohit',
      'Anjaw',
      'Namsai',
      'Changlang',
      'Tirap',
      'Longding',
    ];

    await queryInterface.sequelize.query(
      `UPDATE districts
       SET district_headquarters = NULL, updated_at = NOW()
       WHERE state_code = :stateCode
         AND LOWER(TRIM(name)) IN (:names)`,
      {
        replacements: {
          stateCode,
          names: names.map((n) => n.trim().toLowerCase()),
        },
        type: Sequelize.QueryTypes.UPDATE,
      }
    );
  },
};
