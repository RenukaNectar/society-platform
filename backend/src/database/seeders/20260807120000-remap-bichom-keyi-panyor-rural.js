'use strict';

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Move rural villages/blocks:
 *   Lower Subansiri → Keyi Panyor (LGD 786)
 *   East/West Kameng → Bichom (LGD 787)
 *
 * Matches by village_code OR village_name OR (block_name + source district_name),
 * because Excel census codes often differ from LGD village_code in DB.
 *
 * Run:
 *   npx sequelize-cli db:seed --seed 20260807120000-remap-bichom-keyi-panyor-rural.js
 */

const CONFIG_PATH = path.resolve(
  __dirname,
  '../../data/arunachal-rural-district-remap.json'
);

function normalizeName(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (!fs.existsSync(CONFIG_PATH)) {
      throw new Error(`Remap config not found: ${CONFIG_PATH}`);
    }
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    const stateCode = config.state_code;

    await queryInterface.sequelize.transaction(async (transaction) => {
      const select = (sql, replacements) =>
        queryInterface.sequelize.query(sql, {
          replacements,
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        });
      const exec = (sql, replacements) =>
        queryInterface.sequelize.query(sql, { replacements, transaction });

      const totalGp = await select(
        `SELECT COUNT(*) AS c FROM districts_blocks_gp_villages WHERE state_code = :stateCode`,
        { stateCode }
      );
      console.log(
        `districts_blocks_gp_villages rows for state_code=${stateCode}: ${totalGp[0]?.c ?? 0}`
      );

      for (const target of Object.values(config.targets)) {
        // --- ensure target district ---
        let districtRow = (
          await select(
            `SELECT id, district_code, name FROM districts
             WHERE state_code = :stateCode AND district_code = :districtCode
             LIMIT 1`,
            { stateCode, districtCode: target.district_code }
          )
        )[0];

        if (!districtRow) {
          const byName = (
            await select(
              `SELECT id FROM districts
               WHERE state_code = :stateCode AND LOWER(TRIM(name)) = LOWER(TRIM(:name))
               LIMIT 1`,
              { stateCode, name: target.district_name }
            )
          )[0];
          if (byName) {
            await exec(
              `UPDATE districts
               SET district_code = :districtCode, name = :name, updated_at = NOW()
               WHERE id = :id`,
              {
                districtCode: target.district_code,
                name: target.district_name,
                id: byName.id,
              }
            );
            districtRow = {
              id: byName.id,
              district_code: target.district_code,
              name: target.district_name,
            };
          } else {
            const id = uuidv4();
            await exec(
              `INSERT INTO districts (id, state_code, district_code, name, created_at, updated_at)
               VALUES (:id, :stateCode, :districtCode, :name, NOW(), NOW())`,
              {
                id,
                stateCode,
                districtCode: target.district_code,
                name: target.district_name,
              }
            );
            districtRow = {
              id,
              district_code: target.district_code,
              name: target.district_name,
            };
            console.log(`Created district ${target.district_name} (${target.district_code})`);
          }
        } else {
          await exec(
            `UPDATE districts SET name = :name, updated_at = NOW() WHERE id = :id`,
            { name: target.district_name, id: districtRow.id }
          );
        }

        const villageCodes = [];
        const villageNames = [];
        const blockAliases = [];
        for (const [blockName, villages] of Object.entries(target.blocks || {})) {
          const aliases =
            (target.block_name_aliases && target.block_name_aliases[blockName]) || [
              blockName,
            ];
          for (const a of aliases) blockAliases.push(normalizeName(a));
          for (const v of villages) {
            if (v && typeof v === 'object') {
              if (v.code != null) villageCodes.push(Number(v.code));
              if (v.name) villageNames.push(normalizeName(v.name));
            } else if (typeof v === 'number') {
              villageCodes.push(v);
            }
          }
        }
        const uniqueCodes = [...new Set(villageCodes)];
        const uniqueNames = [...new Set(villageNames.filter(Boolean))];
        const uniqueBlocks = [...new Set(blockAliases)];
        const sourceNames = (target.source_district_names || []).map((n) =>
          normalizeName(n)
        );

        // Diagnostic: how many rows match before update
        const beforeByCode = uniqueCodes.length
          ? await select(
              `SELECT COUNT(*) AS c FROM districts_blocks_gp_villages
               WHERE village_code IN (:codes)`,
              { codes: uniqueCodes }
            )
          : [{ c: 0 }];
        const beforeByBlock = uniqueBlocks.length
          ? await select(
              `SELECT COUNT(*) AS c FROM districts_blocks_gp_villages
               WHERE state_code = :stateCode
                 AND LOWER(TRIM(REPLACE(REPLACE(block_name, '-', ' '), '  ', ' '))) IN (:blocks)
                 AND LOWER(TRIM(district_name)) IN (:sources)`,
              { stateCode, blocks: uniqueBlocks, sources: sourceNames }
            )
          : [{ c: 0 }];

        console.log(
          `[${target.district_name}] match preview: by village_code=${beforeByCode[0]?.c ?? 0}, by block+source=${beforeByBlock[0]?.c ?? 0}`
        );

        // --- update GP/village rows ---
        // 1) by village_code (any state_code)
        let updatedByCode = 0;
        if (uniqueCodes.length) {
          const [r1] = await exec(
            `UPDATE districts_blocks_gp_villages
             SET district_code = :districtCode,
                 district_name = :districtName,
                 updated_at = NOW()
             WHERE village_code IN (:codes)`,
            {
              districtCode: target.district_code,
              districtName: target.district_name,
              codes: uniqueCodes,
            }
          );
          updatedByCode = Number(r1?.affectedRows ?? 0);
        }

        // 2) by block_name under source districts
        let updatedByBlock = 0;
        if (uniqueBlocks.length && sourceNames.length) {
          const [r2] = await exec(
            `UPDATE districts_blocks_gp_villages
             SET district_code = :districtCode,
                 district_name = :districtName,
                 updated_at = NOW()
             WHERE state_code = :stateCode
               AND LOWER(TRIM(REPLACE(REPLACE(IFNULL(block_name,''), '-', ' '), '  ', ' '))) IN (:blocks)
               AND LOWER(TRIM(IFNULL(district_name,''))) IN (:sources)`,
            {
              districtCode: target.district_code,
              districtName: target.district_name,
              stateCode,
              blocks: uniqueBlocks,
              sources: sourceNames,
            }
          );
          updatedByBlock = Number(r2?.affectedRows ?? 0);
        }

        // 3) by village_name under source districts (Excel names vs DB names)
        let updatedByName = 0;
        if (uniqueNames.length && sourceNames.length) {
          const [r3] = await exec(
            `UPDATE districts_blocks_gp_villages
             SET district_code = :districtCode,
                 district_name = :districtName,
                 updated_at = NOW()
             WHERE state_code = :stateCode
               AND LOWER(TRIM(IFNULL(district_name,''))) IN (:sources)
               AND LOWER(TRIM(REPLACE(REPLACE(REPLACE(IFNULL(village_name,''), '(', ''), ')', ''), '  ', ' '))) IN (:names)`,
            {
              districtCode: target.district_code,
              districtName: target.district_name,
              stateCode,
              sources: sourceNames,
              names: uniqueNames,
            }
          );
          updatedByName = Number(r3?.affectedRows ?? 0);
        }

        // --- move / create blocks under target district ---
        let blocksTouched = 0;
        for (const [blockName, aliasesCfg] of Object.entries(
          target.block_name_aliases || {}
        )) {
          const aliases = (aliasesCfg || [blockName]).map(normalizeName);
          // Prefer block_code from already-remapped village rows
          const sample = await select(
            `SELECT block_code, block_name
             FROM districts_blocks_gp_villages
             WHERE state_code = :stateCode
               AND district_code = :districtCode
               AND LOWER(TRIM(REPLACE(REPLACE(IFNULL(block_name,''), '-', ' '), '  ', ' '))) IN (:aliases)
               AND block_code IS NOT NULL
             LIMIT 1`,
            {
              stateCode,
              districtCode: target.district_code,
              aliases,
            }
          );

          let blockCode = sample[0]?.block_code ?? null;
          const resolvedName = sample[0]?.block_name || blockName;

          if (blockCode == null) {
            const byName = await select(
              `SELECT b.block_code, b.name
               FROM blocks b
               INNER JOIN districts d
                 ON d.district_code = b.district_code AND d.state_code = b.state_code
               WHERE b.state_code = :stateCode
                 AND LOWER(TRIM(REPLACE(REPLACE(IFNULL(b.name,''), '-', ' '), '  ', ' '))) IN (:aliases)
                 AND LOWER(TRIM(IFNULL(d.name,''))) IN (:sources)
               LIMIT 1`,
              { stateCode, aliases, sources: sourceNames }
            );
            blockCode = byName[0]?.block_code ?? null;
          }

          if (blockCode == null) {
            console.warn(
              `[${target.district_name}] block "${blockName}" not found in DB (after village remap).`
            );
            continue;
          }

          const underTarget = await select(
            `SELECT id FROM blocks
             WHERE state_code = :stateCode AND district_code = :districtCode AND block_code = :blockCode
             LIMIT 1`,
            {
              stateCode,
              districtCode: target.district_code,
              blockCode,
            }
          );

          if (underTarget[0]) {
            await exec(
              `UPDATE blocks SET name = :name, updated_at = NOW() WHERE id = :id`,
              { name: resolvedName, id: underTarget[0].id }
            );
          } else {
            const movable = await select(
              `SELECT b.id
               FROM blocks b
               INNER JOIN districts d
                 ON d.district_code = b.district_code AND d.state_code = b.state_code
               WHERE b.state_code = :stateCode
                 AND b.block_code = :blockCode
                 AND LOWER(TRIM(IFNULL(d.name,''))) IN (:sources)
               LIMIT 1`,
              { stateCode, blockCode, sources: sourceNames }
            );
            if (movable[0]) {
              await exec(
                `UPDATE blocks
                 SET district_code = :districtCode, name = :name, updated_at = NOW()
                 WHERE id = :id`,
                {
                  districtCode: target.district_code,
                  name: resolvedName,
                  id: movable[0].id,
                }
              );
            } else {
              await exec(
                `INSERT INTO blocks
                   (id, state_code, district_code, block_code, name, created_at, updated_at)
                 VALUES
                   (:id, :stateCode, :districtCode, :blockCode, :name, NOW(), NOW())`,
                {
                  id: uuidv4(),
                  stateCode,
                  districtCode: target.district_code,
                  blockCode,
                  name: resolvedName,
                }
              );
            }
          }
          blocksTouched += 1;
        }

        // --- society_registrations ---
        let societiesUpdated = 0;
        if (uniqueCodes.length) {
          const [sr] = await exec(
            `UPDATE society_registrations sr
             INNER JOIN districts d_new
               ON d_new.state_code = :stateCode AND d_new.district_code = :districtCode
             LEFT JOIN districts_blocks_gp_villages v
               ON v.village_code = CAST(sr.village_code AS UNSIGNED)
             LEFT JOIN blocks b_new
               ON b_new.state_code = :stateCode
              AND b_new.district_code = :districtCode
              AND b_new.block_code = v.block_code
             SET sr.district_id = d_new.id,
                 sr.block_id = COALESCE(b_new.id, sr.block_id),
                 sr.updated_at = NOW()
             WHERE sr.village_code IS NOT NULL
               AND sr.village_code <> ''
               AND CAST(sr.village_code AS UNSIGNED) IN (:codes)`,
            {
              stateCode,
              districtCode: target.district_code,
              codes: uniqueCodes,
            }
          );
          societiesUpdated = Number(sr?.affectedRows ?? 0);
        }

        // Also point societies whose village row is now under the new district
        const [sr2] = await exec(
          `UPDATE society_registrations sr
           INNER JOIN districts_blocks_gp_villages v
             ON v.village_code = CAST(sr.village_code AS UNSIGNED)
            AND v.district_code = :districtCode
           INNER JOIN districts d_new
             ON d_new.state_code = :stateCode AND d_new.district_code = :districtCode
           LEFT JOIN blocks b_new
             ON b_new.state_code = :stateCode
            AND b_new.district_code = :districtCode
            AND b_new.block_code = v.block_code
           SET sr.district_id = d_new.id,
               sr.block_id = COALESCE(b_new.id, sr.block_id),
               sr.updated_at = NOW()
           WHERE sr.village_code IS NOT NULL AND sr.village_code <> ''`,
          { stateCode, districtCode: target.district_code }
        );
        societiesUpdated += Number(sr2?.affectedRows ?? 0);

        const after = await select(
          `SELECT COUNT(*) AS c FROM districts_blocks_gp_villages
           WHERE state_code = :stateCode AND district_code = :districtCode`,
          { stateCode, districtCode: target.district_code }
        );

        console.log(
          `[${target.district_name}] UPDATED gp rows: code=${updatedByCode}, block=${updatedByBlock}, name=${updatedByName}; blocksTouched=${blocksTouched}; societies=${societiesUpdated}; now in district=${after[0]?.c ?? 0}`
        );

        if (
          updatedByCode === 0 &&
          updatedByBlock === 0 &&
          updatedByName === 0
        ) {
          console.warn(
            `[${target.district_name}] No village rows updated. Sync GP/villages first:\n` +
              `  POST /api/v1/admin/sync/cooperatives-gp-villages\n` +
              `Then re-run this seeder. Check source district/block names in DB.`
          );
          // Show sample blocks under source districts to help debug
          if (sourceNames.length) {
            const samples = await select(
              `SELECT DISTINCT district_name, block_name, COUNT(*) AS c
               FROM districts_blocks_gp_villages
               WHERE state_code = :stateCode
                 AND LOWER(TRIM(IFNULL(district_name,''))) IN (:sources)
               GROUP BY district_name, block_name
               ORDER BY district_name, block_name
               LIMIT 40`,
              { stateCode, sources: sourceNames }
            );
            console.log(
              `[${target.district_name}] sample blocks under source districts:`,
              samples
            );
          }
        }
      }
    });
  },

  async down() {
    console.log(
      'Down not supported: village remaps cannot be reversed safely without a backup.'
    );
  },
};
