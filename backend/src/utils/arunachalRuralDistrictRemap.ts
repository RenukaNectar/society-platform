import fs from 'fs';
import path from 'path';
import { QueryTypes, Transaction } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import sequelize from '../config/sequelize';
import logger from './logger';

type VillageRef = { name?: string; code?: number } | number;

type RemapTarget = {
  district_code: number;
  district_name: string;
  source_district_names: string[];
  block_name_aliases?: Record<string, string[]>;
  blocks: Record<string, VillageRef[]>;
};

type RemapConfig = {
  state_code: number;
  state_name?: string;
  targets: Record<string, RemapTarget>;
};

export type ArunachalRuralRemapResult = {
  districtsEnsured: string[];
  gpVillageRowsUpdated: number;
  blocksMovedOrCreated: number;
  societyRegistrationsUpdated: number;
  diagnostics: string[];
};

const CONFIG_PATH = path.resolve(process.cwd(), 'src/data/arunachal-rural-district-remap.json');

const normalizeName = (s: unknown): string =>
  String(s || '')
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function loadArunachalRuralDistrictRemapConfig(): RemapConfig {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  return JSON.parse(raw) as RemapConfig;
}

function flattenTarget(target: RemapTarget) {
  const villageCodes: number[] = [];
  const villageNames: string[] = [];
  const blockAliases: string[] = [];
  for (const [blockName, villages] of Object.entries(target.blocks || {})) {
    const aliases = target.block_name_aliases?.[blockName] || [blockName];
    for (const a of aliases) blockAliases.push(normalizeName(a));
    for (const v of villages || []) {
      if (v && typeof v === 'object') {
        if (v.code != null) villageCodes.push(Number(v.code));
        if (v.name) villageNames.push(normalizeName(v.name));
      } else if (typeof v === 'number') {
        villageCodes.push(v);
      }
    }
  }
  return {
    villageCodes: [...new Set(villageCodes)],
    villageNames: [...new Set(villageNames.filter(Boolean))],
    blockAliases: [...new Set(blockAliases)],
    sourceNames: (target.source_district_names || []).map(normalizeName),
  };
}

async function ensureDistrict(
  t: Transaction | undefined,
  stateCode: number,
  districtCode: number,
  name: string
): Promise<{ id: string; district_code: number; name: string; created: boolean }> {
  const rows = (await sequelize.query(
    `SELECT id, district_code, name FROM districts
     WHERE state_code = :stateCode AND district_code = :districtCode
     LIMIT 1`,
    { replacements: { stateCode, districtCode }, type: QueryTypes.SELECT, transaction: t }
  )) as Array<{ id: string; district_code: number; name: string }>;

  if (rows[0]) {
    if (rows[0].name !== name) {
      await sequelize.query(
        `UPDATE districts SET name = :name, updated_at = NOW() WHERE id = :id`,
        { replacements: { name, id: rows[0].id }, transaction: t }
      );
    }
    return { ...rows[0], name, created: false };
  }

  const byName = (await sequelize.query(
    `SELECT id, district_code, name FROM districts
     WHERE state_code = :stateCode AND LOWER(TRIM(name)) = LOWER(TRIM(:name))
     LIMIT 1`,
    { replacements: { stateCode, name }, type: QueryTypes.SELECT, transaction: t }
  )) as Array<{ id: string; district_code: number; name: string }>;

  if (byName[0]) {
    await sequelize.query(
      `UPDATE districts SET district_code = :districtCode, name = :name, updated_at = NOW() WHERE id = :id`,
      { replacements: { districtCode, name, id: byName[0].id }, transaction: t }
    );
    return { id: byName[0].id, district_code: districtCode, name, created: false };
  }

  const id = uuidv4();
  await sequelize.query(
    `INSERT INTO districts (id, state_code, district_code, name, created_at, updated_at)
     VALUES (:id, :stateCode, :districtCode, :name, NOW(), NOW())`,
    { replacements: { id, stateCode, districtCode, name }, transaction: t }
  );
  return { id, district_code: districtCode, name, created: true };
}

/**
 * Remap rural villages/blocks from Lower Subansiri → Keyi Panyor and
 * East/West Kameng → Bichom (RURAL.xlsx). Idempotent.
 */
export async function applyArunachalRuralDistrictRemap(
  options?: { transaction?: Transaction }
): Promise<ArunachalRuralRemapResult> {
  const config = loadArunachalRuralDistrictRemapConfig();
  const outer = options?.transaction;

  const run = async (tx: Transaction | undefined) => {
    const result: ArunachalRuralRemapResult = {
      districtsEnsured: [],
      gpVillageRowsUpdated: 0,
      blocksMovedOrCreated: 0,
      societyRegistrationsUpdated: 0,
      diagnostics: [],
    };
    const stateCode = config.state_code;

    for (const target of Object.values(config.targets)) {
      const district = await ensureDistrict(tx, stateCode, target.district_code, target.district_name);
      result.districtsEnsured.push(
        `${target.district_name} (${target.district_code})${district.created ? ' [created]' : ''}`
      );

      const { villageCodes, villageNames, blockAliases, sourceNames } = flattenTarget(target);
      let updated = 0;

      if (villageCodes.length) {
        const [r] = await sequelize.query(
          `UPDATE districts_blocks_gp_villages
           SET district_code = :districtCode, district_name = :districtName, updated_at = NOW()
           WHERE village_code IN (:codes)`,
          {
            replacements: {
              districtCode: target.district_code,
              districtName: target.district_name,
              codes: villageCodes,
            },
            transaction: tx,
          }
        );
        updated += Number((r as any)?.affectedRows ?? 0);
      }

      if (blockAliases.length && sourceNames.length) {
        const [r] = await sequelize.query(
          `UPDATE districts_blocks_gp_villages
           SET district_code = :districtCode, district_name = :districtName, updated_at = NOW()
           WHERE state_code = :stateCode
             AND LOWER(TRIM(REPLACE(REPLACE(IFNULL(block_name,''), '-', ' '), '  ', ' '))) IN (:blocks)
             AND LOWER(TRIM(IFNULL(district_name,''))) IN (:sources)`,
          {
            replacements: {
              districtCode: target.district_code,
              districtName: target.district_name,
              stateCode,
              blocks: blockAliases,
              sources: sourceNames,
            },
            transaction: tx,
          }
        );
        updated += Number((r as any)?.affectedRows ?? 0);
      }

      if (villageNames.length && sourceNames.length) {
        const [r] = await sequelize.query(
          `UPDATE districts_blocks_gp_villages
           SET district_code = :districtCode, district_name = :districtName, updated_at = NOW()
           WHERE state_code = :stateCode
             AND LOWER(TRIM(IFNULL(district_name,''))) IN (:sources)
             AND LOWER(TRIM(REPLACE(REPLACE(REPLACE(IFNULL(village_name,''), '(', ''), ')', ''), '  ', ' '))) IN (:names)`,
          {
            replacements: {
              districtCode: target.district_code,
              districtName: target.district_name,
              stateCode,
              sources: sourceNames,
              names: villageNames,
            },
            transaction: tx,
          }
        );
        updated += Number((r as any)?.affectedRows ?? 0);
      }

      result.gpVillageRowsUpdated += updated;
      if (updated === 0) {
        result.diagnostics.push(
          `${target.district_name}: 0 GP rows updated (sync cooperatives-gp-villages then retry)`
        );
      }

      for (const [blockName, aliasesCfg] of Object.entries(target.block_name_aliases || {})) {
        const aliases = (aliasesCfg || [blockName]).map(normalizeName);
        const sample = (await sequelize.query(
          `SELECT block_code, block_name FROM districts_blocks_gp_villages
           WHERE state_code = :stateCode AND district_code = :districtCode
             AND LOWER(TRIM(REPLACE(REPLACE(IFNULL(block_name,''), '-', ' '), '  ', ' '))) IN (:aliases)
             AND block_code IS NOT NULL
           LIMIT 1`,
          {
            replacements: { stateCode, districtCode: target.district_code, aliases },
            type: QueryTypes.SELECT,
            transaction: tx,
          }
        )) as Array<{ block_code: number; block_name: string | null }>;

        let blockCode = sample[0]?.block_code ?? null;
        const resolvedName = sample[0]?.block_name || blockName;
        if (blockCode == null) {
          const byName = (await sequelize.query(
            `SELECT b.block_code FROM blocks b
             INNER JOIN districts d ON d.district_code = b.district_code AND d.state_code = b.state_code
             WHERE b.state_code = :stateCode
               AND LOWER(TRIM(REPLACE(REPLACE(IFNULL(b.name,''), '-', ' '), '  ', ' '))) IN (:aliases)
               AND LOWER(TRIM(IFNULL(d.name,''))) IN (:sources)
             LIMIT 1`,
            {
              replacements: { stateCode, aliases, sources: sourceNames },
              type: QueryTypes.SELECT,
              transaction: tx,
            }
          )) as Array<{ block_code: number }>;
          blockCode = byName[0]?.block_code ?? null;
        }
        if (blockCode == null) continue;

        const underTarget = (await sequelize.query(
          `SELECT id FROM blocks
           WHERE state_code = :stateCode AND district_code = :districtCode AND block_code = :blockCode
           LIMIT 1`,
          {
            replacements: { stateCode, districtCode: target.district_code, blockCode },
            type: QueryTypes.SELECT,
            transaction: tx,
          }
        )) as Array<{ id: string }>;

        if (underTarget[0]) {
          await sequelize.query(
            `UPDATE blocks SET name = :name, updated_at = NOW() WHERE id = :id`,
            { replacements: { name: resolvedName, id: underTarget[0].id }, transaction: tx }
          );
        } else {
          const movable = (await sequelize.query(
            `SELECT b.id FROM blocks b
             INNER JOIN districts d ON d.district_code = b.district_code AND d.state_code = b.state_code
             WHERE b.state_code = :stateCode AND b.block_code = :blockCode
               AND LOWER(TRIM(IFNULL(d.name,''))) IN (:sources)
             LIMIT 1`,
            {
              replacements: { stateCode, blockCode, sources: sourceNames },
              type: QueryTypes.SELECT,
              transaction: tx,
            }
          )) as Array<{ id: string }>;
          if (movable[0]) {
            await sequelize.query(
              `UPDATE blocks SET district_code = :districtCode, name = :name, updated_at = NOW() WHERE id = :id`,
              {
                replacements: {
                  districtCode: target.district_code,
                  name: resolvedName,
                  id: movable[0].id,
                },
                transaction: tx,
              }
            );
          } else {
            await sequelize.query(
              `INSERT INTO blocks (id, state_code, district_code, block_code, name, created_at, updated_at)
               VALUES (:id, :stateCode, :districtCode, :blockCode, :name, NOW(), NOW())`,
              {
                replacements: {
                  id: uuidv4(),
                  stateCode,
                  districtCode: target.district_code,
                  blockCode,
                  name: resolvedName,
                },
                transaction: tx,
              }
            );
          }
        }
        result.blocksMovedOrCreated += 1;
      }

      const [sr] = await sequelize.query(
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
        {
          replacements: { stateCode, districtCode: target.district_code },
          transaction: tx,
        }
      );
      result.societyRegistrationsUpdated += Number((sr as any)?.affectedRows ?? 0);
    }

    logger.info('applyArunachalRuralDistrictRemap done', result);
    return result;
  };

  if (outer) return run(outer);
  return sequelize.transaction(async (tx) => run(tx));
}
