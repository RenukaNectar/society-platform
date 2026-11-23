/**
 * NCD (National Cooperative Database) API payload builder.
 * Sector key name is resolved from cooperative_registrations.json (e.g. CooperativeRegistrationPacs);
 * sector object fields are merged with JSON template defaults (missing keys → null).
 */

import sectorSchema from './cooperative_registrations.json';

export type SectorSchema = Record<string, Record<string, unknown>[]>;

/** Top-level sector keys from cooperative_registrations.json */
const SECTOR_SCHEMA = sectorSchema as SectorSchema;
const SECTOR_SCHEMA_KEYS = Object.keys(SECTOR_SCHEMA);

/**
 * Map respective_table / name suffixes that do not match JSON keys directly.
 * Dairy / Fishery / PACS use singular CooperativeRegistration* keys in the schema.
 * cooperative_registration_primary is treated as pacs (not a separate Primary key).
 */
const SECTOR_KEY_ALIASES: Record<string, string> = {
  pacs: 'CooperativeRegistrationPacs',
  primary: 'CooperativeRegistrationPacs',
  dairy: 'CooperativeRegistrationDairy',
  fishery: 'CooperativeRegistrationFishery'
};

const PACS_PRIMARY_STORED_KEYS = [
  'CooperativeRegistrationsPrimary',
  'CooperativeRegistrationPrimary',
  'cooperative_registrations_primary',
  'cooperative_registration_primary'
];

export interface NcdApiPayload {
  state_name: string;
  state_code: number;
  sector_of_operation: number;
  cooperative_id: string;
  secure_key: string;
  CooperativeRegistrations: NcdCooperativeRegistrationItem[];
  MembersDetails: NcdMembersDetailsItem[];
  AreaOfOperationLevelUrban: NcdAreaOfOperationUrbanItem[];
  AreaOfOperationLevel: NcdAreaOfOperationLevelItem[];
  SocietyImplementingSchemes: NcdSocietyImplementingSchemeItem[];
  CooperativeRegistrationsLands: NcdCooperativeRegistrationsLandsItem[];
  AffiliatedUnions: NcdAffiliatedUnionItem[];
  [sectorKey: string]: unknown;
}

export interface NcdCooperativeRegistrationItem {
  registration_authoritie_id: number;
  cooperative_society_name: string;
  local_langauge_society_name: string | null;
  reference_year: number;
  date_registration: string;
  registration_number: string;
  cooperative_society_type_id: number;
  area_of_operation_id: number;
  water_body_type_id: number | null;
  is_approved: number;
  sector_of_operation: number;
  sector_of_operation_type: number;
  functional_status: number;
  pacs_id: string;
  pan_no: string | null;
  gst_no: string | null;
  how_many_branches: number | null;
  full_time_secretary: number | null;
  mobile_number_of_secretary: string | null;
  alternate_contact_no_for_pacs: string | null;
  location_of_head_quarter: number;
  state_code: number;
  district_code: number;
  block_code: number;
  gram_panchayat_code: number | null;
  village_code: number | null;
  urban_local_body_type_code: number | null;
  urban_local_body_code: number | null;
  locality_ward_code: number | null;
  subdistrict_code: number | null;
  pincode: string | null;
  address_line: string;
  full_address: string;
  contact_person: string | null;
  designation: number;
  mobile: string;
  landline: string;
  email: string | null;
  operation_area_location: number;
  is_coastal: number;
  is_affiliated_union_federation: number;
  members_of_society: number;
  financial_audit: number;
  audit_complete_year: number;
  category_audit: number;
  is_profit_making: number;
  annual_turnover: string;
  annual_profit: string;
  annual_loss: string;
  is_msme: number;
  udyam_no: string | null;
  is_dividend_paid: number;
  dividend_rate: string;
  bank_type: string;
  cooperative_society_bank_id: string;
  other_bank: string;
  status: number;
}

export interface NcdMembersDetailsItem {
  m_general: number | null;
  m_sc: number | null;
  m_st: number | null;
  m_obc: number | null;
  f_general: number | null;
  f_sc: number | null;
  f_st: number | null;
  f_obc: number | null;
  t_general: number | null;
  t_sc: number | null;
  t_st: number | null;
  t_obc: number | null;
}

export interface NcdAreaOfOperationUrbanItem {
  area_of_operation_id: number;
  state_code: number;
  district_code: number;
  local_body_type_code: number;
  local_body_code: number;
  locality_ward_code: number;
}

export interface NcdAreaOfOperationLevelItem {
  area_of_operation_id: number;
  state_code: number;
  district_code: number;
  block_code: number;
  panchayat_code: number | null;
  village_code: number | null;
  gp_village_all: number;
}

export interface NcdSocietyImplementingSchemeItem {
  gov_scheme_name: string;
  gov_scheme_type: string;
  total_amount: number | null;
  dist_code: number;
}

export interface NcdCooperativeRegistrationsLandsItem {
  land_owned: string;
  land_leased: string;
  land_allotted: string;
  land_total: string;
  dist_code: number;
}

export interface NcdAffiliatedUnionItem {
  affiliated_union_federation_level: string | number | null;
  affiliated_union_federation_name: string | number | null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(v: unknown): boolean {
  return typeof v === 'string' && UUID_RE.test(v.trim());
}

function toNum(v: unknown, def: number = 0): number {
  if (v === null || v === undefined || v === '') return def;
  if (typeof v === 'string' && isUuid(v)) return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function toStr(v: unknown, def: string = ''): string {
  if (v === null || v === undefined) return def;
  return String(v);
}

/** yes/no / true/false / 1/0 → 0|1 */
function toYesNo(v: unknown, def: number = 0): number {
  if (v === null || v === undefined || v === '') return def;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'number') return v ? 1 : 0;
  const s = String(v).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y'].includes(s)) return 1;
  if (['0', 'false', 'no', 'n'].includes(s)) return 0;
  const n = Number(s);
  if (Number.isFinite(n)) return n ? 1 : 0;
  return def;
}

/** rural=1, urban=2 (NCD operation_area_location / HQ location) */
function toRuralUrban(v: unknown, def: number = 2): number {
  if (v === null || v === undefined || v === '') return def;
  if (typeof v === 'number' && (v === 1 || v === 2)) return v;
  const s = String(v).trim().toLowerCase();
  if (s === '1' || s === 'rural' || s === 'r') return 1;
  if (s === '2' || s === 'urban' || s === 'u') return 2;
  return def;
}

/** Functional status → NCD numeric (1 Functional, 2 Non-functional, 3 Under Liquidation, 4 New) */
function toFunctionalStatusNcd(society: any): number {
  const raw = society?.functional_status;
  const name = String(
    society?.functionalStatus?.name ||
      (typeof raw === 'string' && !isUuid(raw) ? raw : '') ||
      ''
  )
    .trim()
    .toLowerCase();

  if (name.includes('liquid')) return 3;
  if (name.includes('non') && name.includes('func')) return 2;
  // if (name.includes('new')) return 4;
  if (name.includes('func')) return 1;

  const n = toNum(raw, NaN);
  return Number.isFinite(n) ? n : 1;
}

/** Credit=1, Non-Credit=2 */
function toSectorOfOperationTypeNcd(society: any): number {
  const assoc = society?.sectorOfOperationType;
  const key = String(assoc?.key || '').toLowerCase();
  const name = String(assoc?.name || '').toLowerCase();
  if (key === 'credit' || name === 'credit') return 1;
  if (key === 'no_credit' || key === 'non_credit' || name.includes('non')) return 2;

  const raw = society?.sector_of_operation_type;
  const n = toNum(raw, NaN);
  if (Number.isFinite(n) && (n === 1 || n === 2)) return n;
  return 2;
}

/** Primary=1, District=2, State=3 */
function toCooperativeSocietyTypeNcd(society: any): number {
  const name = String(society?.cooperativeSocietyType?.name || '').toLowerCase();
  if (name.includes('primary')) return 1;
  if (name.includes('district')) return 2;
  if (name.includes('state')) return 3;
  const n = toNum(society?.cooperative_society_type_id, NaN);
  return Number.isFinite(n) ? n : 1;
}

/** village=1, block=2, district=3, state=4, national=5 */
function toAreaOfOperationNcd(society: any): number {
  const level = String(
    society?.areaOfOperationLevel?.level_type ||
      society?.areaOfOperationLevel?.name ||
      ''
  )
    .trim()
    .toLowerCase();
  if (level.includes('village')) return 1;
  if (level.includes('block')) return 2;
  if (level.includes('district')) return 3;
  if (level.includes('state')) return 4;
  if (level.includes('national')) return 5;
  const n = toNum(society?.area_of_operation_id, NaN);
  return Number.isFinite(n) ? n : 1;
}

/** Best-effort registration authority NCD id */
function toRegistrationAuthorityNcd(society: any): number {
  const name = String(society?.registrationAuthority?.name || '').toLowerCase();
  if (name.includes('central')) return 1;
  if (name.includes('registrar') || name.includes('rcs')) return 1;
  const n = toNum(society?.registration_authoritie_id, NaN);
  return Number.isFinite(n) ? n : 1;
}

function toDesignationNcd(v: unknown): number {
  const n = toNum(v, NaN);
  if (Number.isFinite(n) && n > 0) return n;
  const s = String(v || '')
    .trim()
    .toLowerCase();
  if (!s) return 1;
  if (s.includes('secretary')) return 2;
  if (s.includes('president') || s.includes('chairman')) return 1;
  if (s.includes('promoter')) return 1;
  return 1;
}

function toBankTypeNcd(v: unknown): string {
  const s = String(v || '')
    .trim()
    .toLowerCase();
  if (!s) return '';
  if (s.includes('coop')) return '1';
  if (s.includes('commercial') || s.includes('schedule')) return '2';
  if (s === '1' || s === '2' || s === '3') return s;
  return toStr(v, '');
}

function resolveVillageCode(society: any, gp: any): number | null {
  const fromGp = gp?.village_code != null ? toNum(gp.village_code, NaN) : NaN;
  if (Number.isFinite(fromGp) && fromGp > 0) return fromGp;

  const raw = society?.village_code;
  if (raw == null || raw === '') return null;
  if (isUuid(raw)) {
    const fromVillage = society?.village?.village_code;
    if (fromVillage != null) {
      const n = toNum(fromVillage, NaN);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return null;
  }
  const n = toNum(raw, NaN);
  return Number.isFinite(n) ? n : null;
}

function resolveLocalBodyTypeCode(society: any): number | null {
  if (society.urbanLocalBodyType?.localbody_type_code != null) {
    return toNum(society.urbanLocalBodyType.localbody_type_code, 0);
  }
  if (society.urbanLocalBodyCode?.localbody_type_code != null) {
    return toNum(society.urbanLocalBodyCode.localbody_type_code, 0);
  }
  return null;
}

function resolveLocalBodyCode(society: any): number | null {
  if (society.urbanLocalBodyType?.localbody_code != null) {
    return toNum(society.urbanLocalBodyType.localbody_code, 0);
  }
  if (society.urbanLocalBodyCode?.localbody_code != null) {
    return toNum(society.urbanLocalBodyCode.localbody_code, 0);
  }
  const raw = society.urban_local_body_code;
  if (raw != null && !isUuid(raw)) {
    const n = toNum(raw, NaN);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function resolveLocalityWardCode(society: any): number | null {
  if (society.localityWard?.ward_code != null) {
    return toNum(society.localityWard.ward_code, 0);
  }
  const raw = society.locality_ward_code;
  if (raw != null && !isUuid(raw)) {
    const n = toNum(raw, NaN);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** Normalize respective_table / name to suffix, e.g. cooperative_registrations_agriculture -> agriculture */
function getSectorSuffix(sector: { respective_table?: string; name?: string } | null): string | null {
  const table = (sector?.respective_table || '').trim();
  if (table) {
    const norm = table.replace(/^cooperative_registrations?_/i, '').toLowerCase();
    if (norm === 'primary') return 'pacs';
    if (norm) return norm;
  }
  const name = (sector?.name || '').trim().toLowerCase();
  if (!name) return null;
  if (/\bpacs\b/.test(name) || /primary agricultural credit/.test(name)) return 'pacs';
  if (/\bucb\b/.test(name) || /urban cooperative bank/.test(name)) return 'ucb';
  if (/\bdairy\b/.test(name)) return 'dairy';
  if (/\bfishery\b|\bfisheries\b/.test(name)) return 'fishery';
  return null;
}

/**
 * Resolve sector payload key-name from cooperative_registrations.json.
 * Tries both CooperativeRegistrationsX (plural) and CooperativeRegistrationX (singular).
 */
function getSectorPayloadKey(sector: { respective_table?: string; name?: string } | null): string | null {
  const suffix = getSectorSuffix(sector);
  if (!suffix) return null;

  const alias = SECTOR_KEY_ALIASES[suffix];
  if (alias && SECTOR_SCHEMA_KEYS.includes(alias)) return alias;

  const pascal = suffix
    .split('_')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join('');

  const candidates = [
    `CooperativeRegistrations${pascal}`,
    `CooperativeRegistration${pascal}`
  ];

  for (const candidate of candidates) {
    if (SECTOR_SCHEMA_KEYS.includes(candidate)) return candidate;
    const matched = SECTOR_SCHEMA_KEYS.find((k) => k.toLowerCase() === candidate.toLowerCase());
    if (matched) return matched;
  }

  return null;
}

function toSnakeKey(pascalKey: string): string {
  return pascalKey.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}

function normalizeAdditionalData(additionalData: unknown): Record<string, unknown> {
  if (additionalData == null) return {};
  if (typeof additionalData === 'string') {
    try {
      const p = JSON.parse(additionalData) as Record<string, unknown>;
      return p && typeof p === 'object' && !Array.isArray(p) ? p : {};
    } catch {
      return {};
    }
  }
  if (typeof additionalData === 'object' && additionalData !== null && !Array.isArray(additionalData)) {
    return additionalData as Record<string, unknown>;
  }
  return {};
}

function categoryToNcdKey(cat: string | null): string {
  if (!cat) return 'general';
  const c = String(cat).toLowerCase().trim();
  if (c === 'sc' || c === 'schedule caste') return 'sc';
  if (c === 'st' || c === 'schedule tribe') return 'st';
  if (c === 'obc') return 'obc';
  return 'general';
}

function toArrayValue(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (v != null && typeof v === 'object' && Object.keys(v as object).length > 0) return [v];
  return [];
}

/** Move CooperativeRegistrationsPrimary nested fields onto the PACS item itself. */
function flattenPrimaryIntoPacsItem(item: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...item };
  for (const key of PACS_PRIMARY_STORED_KEYS) {
    if (!(key in out)) continue;
    const nested = toArrayValue(out[key]);
    delete out[key];
    for (const row of nested) {
      if (row && typeof row === 'object' && !Array.isArray(row)) {
        Object.assign(out, row as Record<string, unknown>);
      }
    }
  }
  return out;
}

function flattenPrimaryIntoPacsItems(items: Record<string, unknown>[]): Record<string, unknown>[] {
  return items.map(flattenPrimaryIntoPacsItem);
}

/**
 * Merge stored sector row(s) with cooperative_registrations.json template keys.
 * Template defines the full key set; missing keys become null. Stored values win.
 * Extra keys present only in stored data are kept.
 */
function mergeSectorItemsWithTemplate(
  sectorKey: string,
  stored: unknown
): Record<string, unknown>[] {
  const templateArr = SECTOR_SCHEMA[sectorKey];
  const templateObj =
    Array.isArray(templateArr) &&
    templateArr[0] &&
    typeof templateArr[0] === 'object' &&
    !Array.isArray(templateArr[0])
      ? (templateArr[0] as Record<string, unknown>)
      : {};

  const defaults: Record<string, null> = {};
  for (const k of Object.keys(templateObj)) {
    defaults[k] = null;
  }

  const storedItems = toArrayValue(stored).filter(
    (item): item is Record<string, unknown> =>
      item != null && typeof item === 'object' && !Array.isArray(item)
  );

  if (storedItems.length === 0) {
    return Object.keys(defaults).length > 0 ? [{ ...defaults }] : [];
  }

  return storedItems.map((item) => {
    const merged: Record<string, unknown> = { ...defaults };
    for (const [k, v] of Object.entries(item)) {
      merged[k] = v;
    }
    // Keep template key order first, then any extra stored-only keys
    const ordered: Record<string, unknown> = {};
    for (const k of Object.keys(defaults)) {
      ordered[k] = merged[k] !== undefined ? merged[k] : null;
    }
    for (const k of Object.keys(merged)) {
      if (!(k in ordered)) ordered[k] = merged[k];
    }
    return ordered;
  });
}

/**
 * Build NCD API payload from society (with masters / geo / members / additional_data loaded).
 */
export function buildNcdApiPayload(society: any, options: { secureKey?: string } = {}): NcdApiPayload {
  const state = society?.state || {};
  const district = society?.district || {};
  const block = society?.block || {};
  const sector = society?.sectorOfOperation || {};
  const statusDetails = society?.statusDetails || {};
  const members: any[] = society?.members || [];
  const areaUrban: any[] = society?.areaOfOperationLevelUrban || [];
  const gp = society?.gramPanchayat || null;

  const stateCode = toNum(state.state_code, 0);
  const sectorCode = toNum(sector.code, 1);
  const districtCode = toNum(district.district_code, 0);
  const blockCode = toNum(block.block_code, 0);
  const gramPanchayatCode = gp?.gram_panchayat_code != null ? toNum(gp.gram_panchayat_code, 0) : null;
  const villageCode = resolveVillageCode(society, gp);

  const areaOfOperationNcd = toAreaOfOperationNcd(society);
  const opLocNcd = toRuralUrban(society.operation_area_location, 2);
  const hqLocNcd = toRuralUrban(society.location_of_head_quarter, opLocNcd);
  const isUrban = opLocNcd === 2;

  const localBodyTypeCode = resolveLocalBodyTypeCode(society);
  const localBodyCode = resolveLocalBodyCode(society);
  const localityWardCode = resolveLocalityWardCode(society);

  const secretaryMobile =
    society.mobile_number_of_secretary ??
    society.secretary_mobile_number ??
    society.secretary_mobile ??
    null;

  const bankIdRaw = society.cooperative_society_bank_id;
  const bankCode =
    society.bank?.code != null
      ? toStr(society.bank.code)
      : bankIdRaw != null && !isUuid(bankIdRaw)
        ? toStr(bankIdRaw)
        : toStr(bankIdRaw, '');

  const isApproved = statusDetails?.key === 'certificate_issued' ? 1 : 0;
  const membersCount = Array.isArray(members) ? members.length : 0;

  const dateReg = society.date_registration
    ? typeof society.date_registration === 'string'
      ? society.date_registration
      : new Date(society.date_registration).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const waterBodyNcd =
    society.water_body_type_id == null || society.water_body_type_id === ''
      ? null
      : toNum(society.waterBodyType?.code ?? society.water_body_type_id, 0) || null;

  const cooperativeRegistrations: NcdCooperativeRegistrationItem[] = [
    {
      registration_authoritie_id: toRegistrationAuthorityNcd(society),
      cooperative_society_name: toStr(society.cooperative_society_name, ''),
      local_langauge_society_name: society.local_langauge_society_name ?? null,
      reference_year: toNum(society.reference_year, new Date().getFullYear()),
      date_registration: dateReg,
      registration_number: toStr(society.registration_number, ''),
      cooperative_society_type_id: toCooperativeSocietyTypeNcd(society),
      area_of_operation_id: areaOfOperationNcd,
      water_body_type_id: waterBodyNcd,
      is_approved: isApproved,
      sector_of_operation: sectorCode,
      sector_of_operation_type: toSectorOfOperationTypeNcd(society),
      functional_status: toFunctionalStatusNcd(society),
      pacs_id: toStr(society.ncd_id, toStr(society.society_id, '')),
      pan_no: society.pan_no ?? society.pan_number ?? null,
      gst_no: society.gst_no ?? null,
      how_many_branches: society.how_many_branches != null ? toNum(society.how_many_branches, 0) : null,
      full_time_secretary: society.full_time_secretary != null ? toYesNo(society.full_time_secretary, 0) : null,
      mobile_number_of_secretary: secretaryMobile != null ? toStr(secretaryMobile) : null,
      alternate_contact_no_for_pacs: society.alternate_contact_no_for_pacs ?? null,
      location_of_head_quarter: hqLocNcd,
      state_code: stateCode,
      district_code: districtCode,
      block_code: blockCode,
      gram_panchayat_code: gramPanchayatCode,
      village_code: villageCode,
      urban_local_body_type_code: localBodyTypeCode,
      urban_local_body_code: localBodyCode,
      locality_ward_code: localityWardCode,
      subdistrict_code: null,
      pincode: society.pincode != null ? toStr(society.pincode) : null,
      address_line: toStr(society.full_address, ''),
      full_address: toStr(society.full_address, ''),
      contact_person: society.contact_person ?? null,
      designation: toDesignationNcd(society.designation),
      mobile: toStr(society.mobile, toStr(secretaryMobile, '')),
      landline: toStr(society.landline, ''),
      email: society.email ?? null,
      operation_area_location: opLocNcd,
      is_coastal: toYesNo(society.is_adjacent_to_water_body ?? society.is_coastal, 0),
      is_affiliated_union_federation: toYesNo(society.is_affiliated_union_federation, 0),
      members_of_society: membersCount,
      financial_audit: toYesNo(society.financial_audit, 0),
      audit_complete_year: toNum(society.audit_complete_year, new Date().getFullYear()),
      category_audit: toNum(society.category_audit, 0),
      is_profit_making: toYesNo(society.is_profit_making, 0),
      annual_turnover: society.annual_turnover != null ? toStr(society.annual_turnover) : '0.00000',
      annual_profit: society.annual_profit != null ? toStr(society.annual_profit) : '0.00000',
      annual_loss: society.annual_loss != null ? toStr(society.annual_loss) : '0.00000',
      is_msme: toYesNo(society.is_msme, 0),
      udyam_no: (() => {
        const isMsme = toYesNo(society.is_msme, 0) === 1;
        if (!isMsme) return null;
        const raw = society.udyam_no;
        if (raw == null || String(raw).trim() === '') return null;
        return String(raw).trim();
      })(),
      is_dividend_paid: toYesNo(society.is_dividend_paid, 0),
      dividend_rate: society.dividend_rate != null ? toStr(society.dividend_rate) : '0.00000',
      bank_type: toBankTypeNcd(society.bank_type),
      cooperative_society_bank_id: bankCode,
      other_bank: toStr(society.other_bank, ''),
      status: 1
    }
  ];

  const agg: NcdMembersDetailsItem = {
    m_general: 0,
    m_sc: 0,
    m_st: 0,
    m_obc: 0,
    f_general: 0,
    f_sc: 0,
    f_st: 0,
    f_obc: 0,
    t_general: 0,
    t_sc: 0,
    t_st: 0,
    t_obc: 0
  };
  for (const m of members) {
    const g = (toStr(m.gender) || 'male').toLowerCase();
    const c = categoryToNcdKey(m.category);
    const pre = g === 'female' ? 'f_' : g === 'male' ? 'm_' : 't_';
    const k = `${pre}${c}` as keyof NcdMembersDetailsItem;
    if (agg[k] !== undefined) (agg as any)[k] = ((agg as any)[k] ?? 0) + 1;
  }
  const membersDetails: NcdMembersDetailsItem[] =
    membersCount > 0
      ? [agg]
      : [
          {
            m_general: null,
            m_sc: null,
            m_st: null,
            m_obc: null,
            f_general: null,
            f_sc: null,
            f_st: null,
            f_obc: null,
            t_general: null,
            t_sc: null,
            t_st: null,
            t_obc: null
          }
        ];

  let areaOfOperationLevelUrban: NcdAreaOfOperationUrbanItem[] = areaUrban.map((u: any) => ({
    state_code: toNum(u.state_code, stateCode),
    area_of_operation_id: toNum(u.area_of_operation_id, areaOfOperationNcd),
    district_code: toNum(u.district_code, districtCode),
    local_body_type_code: toNum(u.local_body_type_code, 0),
    local_body_code: toNum(u.local_body_code, 0),
    locality_ward_code: toNum(u.locality_ward_code, 0)
  }));

  if (isUrban && areaOfOperationLevelUrban.length === 0) {
    areaOfOperationLevelUrban = [
      {
        state_code: stateCode,
        area_of_operation_id: areaOfOperationNcd,
        district_code: districtCode,
        local_body_type_code: localBodyTypeCode ?? 0,
        local_body_code: localBodyCode ?? 0,
        locality_ward_code: localityWardCode ?? 0
      }
    ];
  }
  if (areaOfOperationLevelUrban.length === 0) {
    areaOfOperationLevelUrban = [
      {
        area_of_operation_id: areaOfOperationNcd,
        state_code: stateCode,
        district_code: districtCode,
        local_body_type_code: localBodyTypeCode ?? 0,
        local_body_code: localBodyCode ?? 0,
        locality_ward_code: localityWardCode ?? 0
      }
    ];
  }

  const areaOfOperationLevel: NcdAreaOfOperationLevelItem[] = [
    {
      area_of_operation_id: areaOfOperationNcd,
      state_code: stateCode,
      district_code: districtCode,
      block_code: blockCode,
      panchayat_code: gramPanchayatCode,
      village_code: villageCode,
      gp_village_all: 0
    }
  ];

  const rawAdditional = normalizeAdditionalData(society.additional_data);
  const societyNcdId = society.ncd_id ?? null;

  const resolveAffiliatedUnionValue = (...candidates: unknown[]): string | number | null => {
    for (const v of candidates) {
      if (v === null || v === undefined || v === '') continue;
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      const s = String(v).trim();
      if (s) return s;
    }
    return null;
  };

  const affiliatedUnionsFromSociety: NcdAffiliatedUnionItem[] = [
    {
      affiliated_union_federation_level: resolveAffiliatedUnionValue(
        society.affiliated_union_level
      ),
      affiliated_union_federation_name: resolveAffiliatedUnionValue(
        society.affiliated_union_name
      )
    }
  ];

  const payload: NcdApiPayload = {
    state_name: toStr(state.name, ''),
    state_code: stateCode,
    sector_of_operation: sectorCode,
    cooperative_id: toStr(society.ncd_id, 'C**'),
    secure_key: options.secureKey ?? 'A key value will be provided',
    CooperativeRegistrations: cooperativeRegistrations,
    MembersDetails: membersDetails,
    AreaOfOperationLevel: areaOfOperationLevel,
    AreaOfOperationLevelUrban: areaOfOperationLevelUrban,
    SocietyImplementingSchemes: [],
    CooperativeRegistrationsLands: [],
    AffiliatedUnions: affiliatedUnionsFromSociety
  };

  const rootOnlyKeys = [
    'SocietyImplementingSchemes',
    'society_implementing_schemes',
    'CooperativeRegistrationsLands',
    'cooperative_registrations_lands',
    'AffiliatedUnions',
    'affiliated_unions'
  ];

  const formattedSectorKey = getSectorPayloadKey(sector);
  if (formattedSectorKey) {
    const snakeSectorKey = toSnakeKey(formattedSectorKey);
    const isPacs =
      formattedSectorKey === 'CooperativeRegistrationPacs' ||
      formattedSectorKey === 'CooperativeRegistrationsPacs';
    const singularKey = formattedSectorKey.replace(
      /^CooperativeRegistrations/,
      'CooperativeRegistration'
    );
    const pluralKey = formattedSectorKey.replace(
      /^CooperativeRegistration(?!s)/,
      'CooperativeRegistrations'
    );
    const primaryStored = isPacs
      ? PACS_PRIMARY_STORED_KEYS.map((k) => rawAdditional[k]).find((v) => v != null)
      : undefined;
    const sectorValue =
      rawAdditional[formattedSectorKey] ??
      rawAdditional[singularKey] ??
      rawAdditional[pluralKey] ??
      rawAdditional[snakeSectorKey] ??
      rawAdditional[formattedSectorKey.toLowerCase()] ??
      primaryStored;

    let sectorItems: Record<string, unknown>[];
    if (Array.isArray(sectorValue) && sectorValue.length > 0) {
      sectorItems = toArrayValue(sectorValue) as Record<string, unknown>[];
    } else if (sectorValue && typeof sectorValue === 'object') {
      sectorItems = toArrayValue(sectorValue) as Record<string, unknown>[];
    } else {
      const sectorObj: Record<string, unknown> = {};
      const sectorKeyVariants = [
        formattedSectorKey,
        singularKey,
        pluralKey,
        snakeSectorKey,
        formattedSectorKey.toLowerCase(),
        ...(isPacs ? PACS_PRIMARY_STORED_KEYS : [])
      ];
      for (const [k, v] of Object.entries(rawAdditional)) {
        if (sectorKeyVariants.includes(k) || rootOnlyKeys.includes(k)) continue;
        sectorObj[k] = v;
      }
      if (isPacs && primaryStored != null) {
        const primaryRows = toArrayValue(primaryStored) as Record<string, unknown>[];
        if (primaryRows[0] && typeof primaryRows[0] === 'object') {
          Object.assign(sectorObj, primaryRows[0]);
        }
      }
      sectorItems = Object.keys(sectorObj).length > 0 ? [sectorObj] : [];
    }

    if (isPacs) {
      sectorItems = flattenPrimaryIntoPacsItems(sectorItems);
    }

    payload[formattedSectorKey] = mergeSectorItemsWithTemplate(formattedSectorKey, sectorItems);
  }

  const explicitSchemes = toArrayValue(
    rawAdditional.SocietyImplementingSchemes ?? rawAdditional.society_implementing_schemes
  ) as NcdSocietyImplementingSchemeItem[];
  const explicitLands = toArrayValue(
    rawAdditional.CooperativeRegistrationsLands ?? rawAdditional.cooperative_registrations_lands
  ) as NcdCooperativeRegistrationsLandsItem[];
  const explicitAffiliatedUnions = toArrayValue(
    rawAdditional.AffiliatedUnions ?? rawAdditional.affiliated_unions
  ) as NcdAffiliatedUnionItem[];

  payload.SocietyImplementingSchemes = explicitSchemes;
  payload.CooperativeRegistrationsLands = explicitLands;
  payload.AffiliatedUnions =
    explicitAffiliatedUnions.length > 0 ? explicitAffiliatedUnions : affiliatedUnionsFromSociety;
  if (!Array.isArray(payload.SocietyImplementingSchemes)) payload.SocietyImplementingSchemes = [];
  if (!Array.isArray(payload.CooperativeRegistrationsLands)) payload.CooperativeRegistrationsLands = [];
  if (!Array.isArray(payload.AffiliatedUnions)) payload.AffiliatedUnions = affiliatedUnionsFromSociety;

  const arraysWithoutNcdId = [
    'AreaOfOperationLevel',
    'AreaOfOperationLevelUrban',
    'MembersDetails',
    'AffiliatedUnions'
  ];

  if (societyNcdId != null) {
    for (const [key, val] of Object.entries(payload)) {
      if (arraysWithoutNcdId.includes(key) || !Array.isArray(val)) continue;
      val.forEach((item: Record<string, unknown>) => {
        if (item && typeof item === 'object') {
          if (item.ncd_id == null || item.ncd_id === '') item.ncd_id = societyNcdId;
          for (const v of Object.values(item)) {
            if (Array.isArray(v)) {
              v.forEach((sub: Record<string, unknown>) => {
                if (sub && typeof sub === 'object' && (sub.ncd_id == null || sub.ncd_id === '')) {
                  sub.ncd_id = societyNcdId;
                }
              });
            }
          }
        }
      });
    }
  }

  for (const key of arraysWithoutNcdId) {
    const arr = payload[key];
    if (Array.isArray(arr)) {
      arr.forEach((item: Record<string, unknown>) => {
        if (item && typeof item === 'object' && 'ncd_id' in item) delete item.ncd_id;
      });
    }
  }

  return payload;
}
