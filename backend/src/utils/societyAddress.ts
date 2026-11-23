import SocietyRegistration from '../models/SocietyRegistration';
import LocationType from '../models/LocationType';
import District from '../models/District';
import Block from '../models/Block';
import DistrictsBlocksGpVillage from '../models/DistrictsBlocksGpVillage';
import UrbanLocalBody from '../models/UrbanLocalBody';
import UrbanLocalBodiesWard from '../models/UrbanLocalBodiesWard';
import logger from './logger';

export type LocationCategory = 'urban' | 'rural' | 'unknown';

export interface SocietyAddressParts {
  village_name?: string | null;
  block_name?: string | null;
  district_name?: string | null;
  local_body_name?: string | null;
  ward_name?: string | null;
}

export interface SocietyAddressResult {
  society_id: string | null;
  registration_id: string | null;
  location_type: LocationCategory;
  address: string | null;
  parts: SocietyAddressParts;
}

/**
 * Joins non-empty parts with ", " (skips null/undefined/empty strings).
 */
const joinParts = (parts: Array<string | null | undefined>): string | null => {
  const cleaned = parts
    .map((p) => (p == null ? '' : String(p).trim()))
    .filter((p) => p.length > 0);
  return cleaned.length > 0 ? cleaned.join(', ') : null;
};

/**
 * Looks up the society first by primary key (UUID `id`), then by business
 * key `society_id`. Returns null if not found.
 */
const findSocietyByAnyId = async (societyId: string) => {
  let society = await SocietyRegistration.findByPk(societyId).catch(() => null);
  if (!society) {
    society = await SocietyRegistration.findOne({ where: { society_id: societyId } }).catch(
      () => null
    );
  }
  return society;
};

/**
 * Resolves the location category (urban / rural) from the LocationType row
 * referenced by `society_registrations.location_of_head_quarter`.
 */
const resolveLocationCategory = async (
  locationOfHeadQuarter: string | null
): Promise<LocationCategory> => {
  if (!locationOfHeadQuarter) return 'unknown';
  try {
    const locationType = await LocationType.findByPk(locationOfHeadQuarter);
    const name = locationType?.name?.toLowerCase().trim();
    if (name === 'urban') return 'urban';
    if (name === 'rural') return 'rural';
    return 'unknown';
  } catch {
    return 'unknown';
  }
};

/**
 * Returns the formatted address of a society based on its head-quarter
 * location type.
 *
 * Format:
 *   - Rural : "{village_name}, {block_name}, {district_name}"
 *   - Urban : "{local_body_name}, {ward_name}, {district_name}"
 *
 * @param societyId  Either the `society_registrations.id` (UUID) or the
 *                   business `society_id` value.
 */
export const getSocietyAddress = async (
  societyId: string
): Promise<SocietyAddressResult> => {
  const empty: SocietyAddressResult = {
    society_id: null,
    registration_id: null,
    location_type: 'unknown',
    address: null,
    parts: {},
  };

  if (!societyId) return empty;

  try {
    const society = await findSocietyByAnyId(societyId);
    if (!society) return empty;

    const category = await resolveLocationCategory(society.location_of_head_quarter);

    const districtPromise = society.district_id
      ? District.findByPk(society.district_id).catch(() => null)
      : Promise.resolve(null);

    if (category === 'rural') {
      const [district, block, village] = await Promise.all([
        districtPromise,
        society.block_id
          ? Block.findByPk(society.block_id).catch(() => null)
          : Promise.resolve(null),
        society.village_code
          ? resolveRegistrationVillageRow(society.village_code)
          : Promise.resolve(null),
      ]);

      const parts: SocietyAddressParts = {
        village_name: village?.village_name?.trim() ?? null,
        block_name: block?.name ?? null,
        district_name: district?.name ?? null,
      };

      return {
        society_id: society.society_id ?? null,
        registration_id: society.id ?? null,
        location_type: 'rural',
        address: joinParts([parts.village_name, parts.block_name, parts.district_name]),
        parts,
      };
    }

    if (category === 'urban') {
      const [district, localBody, ward] = await Promise.all([
        districtPromise,
        society.urban_local_body_type
          ? UrbanLocalBody.findByPk(society.urban_local_body_type).catch(() => null)
          : Promise.resolve(null),
        society.locality_ward_code
          ? UrbanLocalBodiesWard.findByPk(society.locality_ward_code).catch(() => null)
          : Promise.resolve(null),
      ]);

      const parts: SocietyAddressParts = {
        local_body_name: localBody?.local_body_name ?? null,
        ward_name: ward?.ward_name ?? null,
        district_name: district?.name ?? null,
      };

      return {
        society_id: society.society_id ?? null,
        registration_id: society.id ?? null,
        location_type: 'urban',
        address: joinParts([parts.local_body_name, parts.ward_name, parts.district_name]),
        parts,
      };
    }

    const district = await districtPromise;
    return {
      society_id: society.society_id ?? null,
      registration_id: society.id ?? null,
      location_type: 'unknown',
      address: joinParts([district?.name ?? null]),
      parts: { district_name: district?.name ?? null },
    };
  } catch (error) {
    logger.error('getSocietyAddress failed', { societyId, error });
    return empty;
  }
};

/**
 * Convenience wrapper that returns only the formatted address string
 * (or null when nothing can be resolved).
 */
export const getSocietyAddressString = async (
  societyId: string
): Promise<string | null> => {
  const result = await getSocietyAddress(societyId);
  return result.address;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** True when area_of_operation_levels is Block Level or Village Level. */
export const isBlockOrVillageAreaOfOperation = (
  levelName?: string | null,
  levelType?: string | null
): boolean => {
  const n = levelName?.trim();
  const t = levelType?.trim().toLowerCase();
  if (n === 'Block Level' || n === 'Village Level') return true;
  return t === 'block' || t === 'village';
};

export const normalizeAreaOfOperationLevelName = (levelName?: string | null): string | null => {
  const n = levelName?.trim();
  if (!n) return null;
  if (n === 'District Level') return 'district';
  if (n === 'Block Level') return 'block';
  if (n === 'Village Level') return 'village';
  if (n === 'State Level') return 'state';
  if (n === 'National Level') return 'national';
  const lower = n.toLowerCase();
  if (lower === 'district' || lower === 'block' || lower === 'village' || lower === 'state' || lower === 'national') {
    return lower;
  }
  return n;
};

/**
 * Load village row from `districts_blocks_gp_villages` using society_registrations.village_code.
 */
export const resolveRegistrationVillageRow = async (
  villageCode: string | number | null | undefined
): Promise<DistrictsBlocksGpVillage | null> => {
  if (villageCode == null || String(villageCode).trim() === '') return null;
  const raw = String(villageCode).trim();
  try {
    if (UUID_RE.test(raw)) {
      const byId = await DistrictsBlocksGpVillage.findByPk(raw);
      if (byId) return byId;
    }
    const numericCode = Number(raw);
    if (!Number.isNaN(numericCode)) {
      return await DistrictsBlocksGpVillage.findOne({ where: { village_code: numericCode } });
    }
    return null;
  } catch (error) {
    logger.warn('resolveRegistrationVillageRow failed', { villageCode: raw, error });
    return null;
  }
};

export const resolveRegistrationVillageName = async (
  villageCode: string | number | null | undefined
): Promise<string | null> => {
  const row = await resolveRegistrationVillageRow(villageCode);
  return row?.village_name?.trim() || null;
};

/** Village code + name from registration selection (Block/Village area of operation). */
export const resolveRegistrationVillageDetails = async (
  villageCode: string | number | null | undefined
): Promise<{ village_code: string | null; village_name: string | null }> => {
  if (villageCode == null || String(villageCode).trim() === '') {
    return { village_code: null, village_name: null };
  }
  const storedCode = String(villageCode).trim();
  const row = await resolveRegistrationVillageRow(villageCode);
  return {
    village_code: row?.village_code != null ? String(row.village_code) : storedCode,
    village_name: row?.village_name?.trim() || null
  };
};

const stripAreaLevelSuffix = (name: string): string =>
  name.replace(/\s+(District|State|National|Block|Village|Town)$/i, '').trim() || name;

const stripVillageSuffix = (name: string): string =>
  name.replace(/\s+(Village|Town)$/i, '').trim() || name;

const withDistrictSuffix = (districtName?: string | null): string => {
  const base = stripAreaLevelSuffix(districtName?.trim() || 'N/A');
  return `${base} District`;
};

/**
 * Phrase after "shall be confined to …" — society certificate & notification only.
 *
 * - State Level: "the state of Arunachal Pradesh"
 * - Block Level: "{Block or Village/Town} Block of Papum Pare District of Arunachal Pradesh"
 * - Village Level: "{Village} village of Papum Pare District of Arunachal Pradesh"
 * - District / default: "Papum Pare District of Arunachal Pradesh"
 */
export const buildAreaOfOperationConfinedTo = (params: {
  districtName: string;
  stateName: string;
  village_name?: string | null;
  blockName?: string | null;
  areaOfOperationLevelName?: string | null;
}): string => {
  const state = params.stateName?.trim() || 'Arunachal Pradesh';
  const level = normalizeAreaOfOperationLevelName(params.areaOfOperationLevelName);
  const districtLabel = withDistrictSuffix(params.districtName);
  const village = params.village_name?.trim();
  const block = params.blockName?.trim();

  if (level === 'state') {
    return `the state of ${state}`;
  }

  if (level === 'national') {
    return 'the territory of India';
  }

  if (level === 'block') {
    const selectedPlace =
      (block && stripAreaLevelSuffix(block)) ||
      (village && stripVillageSuffix(village)) ||
      null;
    if (selectedPlace) {
      return `${selectedPlace} Block of ${districtLabel} of ${state}`;
    }
    return `${districtLabel} of ${state}`;
  }

  if (level === 'village' && village) {
    return `${stripVillageSuffix(village)} village of ${districtLabel} of ${state}`;
  }

  if (village) {
    return `${stripVillageSuffix(village)} village of ${districtLabel} of ${state}`;
  }

  return `${districtLabel} of ${state}`;
};

export default getSocietyAddress;
