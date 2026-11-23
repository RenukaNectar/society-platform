import https from 'https';
import axios from 'axios';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import sequelize from '../config/sequelize';
import SocietyRegistration from '../models/SocietyRegistration';
import State from '../models/State';
import District from '../models/District';
import Block from '../models/Block';
import DistrictsBlocksGpVillage from '../models/DistrictsBlocksGpVillage';
import SectorOfOperation from '../models/SectorOfOperation';
import SectorOfOperationsType from '../models/SectorOfOperationsType';
import FunctionalStatus from '../models/FunctionalStatus';
import CooperativeSocietyType from '../models/CooperativeSocietyType';
import RegistrationAuthority from '../models/RegistrationAuthority';
import AreaOfOperationLevel from '../models/AreaOfOperationLevel';
import LocationType from '../models/LocationType';
import Bank from '../models/Bank';
import UrbanLocalBody from '../models/UrbanLocalBody';
import UrbanLocalBodiesWard from '../models/UrbanLocalBodiesWard';
import SocietyType from '../models/SocietyType';
import { findStatusByKey } from './StatusService';
import { findRoleByIdOrName } from './RoleService';
import { createUser, findUserByEmail, findUserByPhoneNumber } from './UserService';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

const DEFAULT_URL = 'https://api.cooperatives.gov.in/Api/cooperativeData';
const FETCH_TIMEOUT_MS = 120_000;
const MAX_PAGES_PER_CALL = 1000;
const MAX_REPORTED_ISSUES = 40;
const NCD_MAX_RETRIES = 2;
const NCD_RETRY_BACKOFF_MS = 1500;
/** Postman listing that succeeds uses IPv4. Node fetch often picks a broken IPv6 route and throws "fetch failed". */
const ncdHttpsAgent = new https.Agent({ family: 4, keepAlive: true });

const CREDIT_TABLE_RE = /pacs|ucb|credit|cmiscellaneous|thrift|primary/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const KNOWN_RESULT_KEYS = new Set([
  'Cooperative Details',
  'Members Details',
  'Area of Operation (Rural)',
  'Area of Operation (Urban)',
  'Affiliated Unions',
  'Board of Director'
]);

export interface SyncNcdSocietiesOptions {
  key: string;
  state?: string;
  /** Same field as the working cooperativeData listing call. Defaults to "1". */
  level?: string;
  sector?: string;
  url?: string;
}

export interface SyncNcdSocietiesResult {
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  applicants_created: number;
  applicants_linked: number;
  pages_processed: number;
  next_page: number | null;
  meta: {
    current_page: number;
    per_page: number;
    records_on_page: number;
    has_next_page: boolean;
    total_records: number;
    total_pages: number;
  } | null;
  errors: Array<{ ncd_id?: string; message: string }>;
  warnings: Array<{ ncd_id?: string; message: string }>;
}

interface NcdPage {
  result: Record<string, unknown>[];
  meta: SyncNcdSocietiesResult['meta'];
}

interface NamedRow {
  id: string;
  name: string;
}

interface SectorRow {
  id: string;
  code: string | null;
  name: string;
  respective_table: string | null;
  credit: boolean;
}

interface GeoCache {
  states: Map<string, string>;
  districts: Map<string, string>;
  blocks: Map<string, string>;
  villagesByCode: Map<string, { id: string }>;
  gpByCode: Map<string, { id: string }>;
  sectors: Map<string, SectorRow>;
  creditTypeId: string | null;
  nonCreditTypeId: string | null;
  functional: NamedRow[];
  societyTypes: NamedRow[];
  authorities: NamedRow[];
  societyTypesMaster: NamedRow[];
  areaLevels: Map<string, string>;
  locationTypes: Map<string, string>;
  banks: Map<string, string>;
  certificateStatusId: string | null;
  applicantRoleId: string | null;
}

function clip(value: unknown, max: number): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  if (!text || text.toUpperCase() === 'NULL') return null;
  return text.slice(0, max);
}

function asNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const text = String(value).trim();
  if (!text || text.toUpperCase() === 'NULL') return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

function codeKey(value: unknown): string | null {
  const n = asNumber(value);
  if (n == null) return null;
  return String(n);
}

function yesNo(value: unknown): string {
  const n = asNumber(value);
  if (n === 1) return 'yes';
  const text = String(value ?? '').trim().toLowerCase();
  if (text === 'yes' || text === 'true') return 'yes';
  return 'no';
}

function mobile10(value: unknown): string | null {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return null;
  return digits.slice(-10);
}

function pincode6(value: unknown): string | null {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return null;
  return digits.slice(0, 6);
}

function decimalOrNull(value: unknown): number | null {
  return asNumber(value);
}

function runningNumber(ncdId: string): number | null {
  const match = ncdId.match(/(\d{1,7})$/);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

function splitContactName(value: unknown): { first_name: string; last_name: string } {
  const parts = String(value ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6);
  const first = (parts[0] || 'Applicant').slice(0, 100);
  const last = (parts.slice(1).join(' ') || 'User').slice(0, 100);
  return { first_name: first, last_name: last };
}

async function resolveApplicant(input: {
  ncdId: string;
  emailRaw: unknown;
  contactRaw: unknown;
  mobileRaw: unknown;
  stateId: string | null;
  districtId: string | null;
  roleId: string | null;
  warnings: SyncNcdSocietiesResult['warnings'];
}): Promise<{ userId: string | null; action: 'created' | 'linked' | 'none' }> {
  const email = String(input.emailRaw ?? '').trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email) || email.length > 255) {
    pushIssue(input.warnings, input.ncdId, 'Applicant not created: email is missing or invalid');
    return { userId: null, action: 'none' };
  }
  if (!input.roleId) {
    pushIssue(input.warnings, input.ncdId, 'Applicant not created: applicant role was not found');
    return { userId: null, action: 'none' };
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    if (existingUser.role_id !== input.roleId) {
      pushIssue(input.warnings, input.ncdId, 'Applicant not linked: this email belongs to another role');
      return { userId: null, action: 'none' };
    }
    const owned = await SocietyRegistration.findOne({
      where: { created_by: existingUser.id },
      attributes: ['id', 'ncd_id']
    });
    if (owned && owned.ncd_id !== input.ncdId) {
      pushIssue(input.warnings, input.ncdId, 'Applicant not linked: this email already has another society');
      return { userId: null, action: 'none' };
    }
    return { userId: existingUser.id, action: 'linked' };
  }

  const phone = mobile10(input.mobileRaw);
  let phoneToSave: string | undefined;
  if (phone) {
    const phoneOwner = await findUserByPhoneNumber(phone);
    if (!phoneOwner) phoneToSave = phone;
  }

  const name = splitContactName(input.contactRaw);
  try {
    const created = await createUser({
      email,
      password: 'Test@123',
      // password: randomBytes(24).toString('hex'),
      first_name: name.first_name,
      last_name: name.last_name,
      ...(phoneToSave ? { phone: phoneToSave } : {}),
      role_id: input.roleId,
      is_email_verified: false,
      ...(input.stateId ? { state_id: input.stateId } : {}),
      ...(input.districtId ? { district_id: input.districtId } : {})
    });
    return { userId: created.id, action: 'created' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create applicant';
    pushIssue(input.warnings, input.ncdId, `Applicant not created: ${message}`);
    return { userId: null, action: 'none' };
  }
}

function pushIssue(
  list: Array<{ ncd_id?: string; message: string }>,
  ncdId: string | undefined,
  message: string
) {
  if (list.length >= MAX_REPORTED_ISSUES) return;
  list.push({ ...(ncdId ? { ncd_id: ncdId } : {}), message });
}

function findByName(rows: NamedRow[], needle: string): string | null {
  const want = needle.toLowerCase();
  const hit = rows.find((row) => row.name.toLowerCase().includes(want));
  return hit?.id ?? null;
}

function functionalStatusId(code: number | null, rows: NamedRow[]): string | null {
  if (code === 3) return findByName(rows, 'liquid');
  if (code === 2) return findByName(rows, 'non');
  if (code === 1) {
    const functional = rows.find((row) => {
      const name = row.name.toLowerCase();
      return name.includes('func') && !name.includes('non');
    });
    return functional?.id ?? null;
  }
  return null;
}

function societyTypeId(code: number | null, rows: NamedRow[]): string | null {
  if (code === 1) return findByName(rows, 'primary');
  if (code === 2) return findByName(rows, 'district');
  if (code === 3) return findByName(rows, 'state');
  return null;
}

/** NCD registration_authoritie_id has no code column here. 1 = State RCS. */
function authorityId(code: number | null, rows: NamedRow[]): string | null {
  if (code === 1) return findByName(rows, 'state');
  if (code === 2) return findByName(rows, 'district');
  if (code === 3) return findByName(rows, 'central');
  return null;
}

function designationName(code: number | null): string | null {
  if (code === 1) return 'Chairman';
  if (code === 2) return 'Secretary';
  return null;
}

function bankTypeName(value: unknown): string | null {
  const code = codeKey(value);
  if (code === '1') return 'cooperative';
  if (code === '2') return 'commercial';
  return clip(value, 40);
}

/** Official NCD: 1 Urban, 2 Rural, 3 Both. */
function locationWord(code: number | null): 'urban' | 'rural' | 'both' | null {
  if (code === 1) return 'urban';
  if (code === 2) return 'rural';
  if (code === 3) return 'both';
  return null;
}

function societyTypeMasterId(sector: SectorRow | undefined, rows: NamedRow[]): string | null {
  const blob = `${sector?.name || ''} ${sector?.respective_table || ''}`.toLowerCase();
  const pairs: Array<[string, string]> = [
    ['dairy', 'dairy'],
    ['housing', 'housing'],
    ['consumer', 'consumer'],
    ['pacs', 'credit'],
    ['thrift', 'credit'],
    ['ucb', 'credit'],
    ['credit', 'credit'],
    ['agri', 'agricultural'],
    ['industrial', 'industrial'],
    ['service', 'service']
  ];
  for (const [needle, title] of pairs) {
    if (!blob.includes(needle)) continue;
    const hit = rows.find((row) => row.name.toLowerCase() === title);
    if (hit) return hit.id;
  }
  return rows.find((row) => row.name.toLowerCase() === 'other')?.id ?? rows[0]?.id ?? null;
}

function areaLevelType(code: number | null, hasVillage: boolean, hasBlock: boolean, urban: boolean): string {
  if (code === 1) return 'village';
  if (code === 2) return 'block';
  if (code === 3) return 'district';
  if (code === 4) return 'state';
  if (code === 5) return 'national';
  if (hasVillage) return 'village';
  if (hasBlock) return 'block';
  if (urban) return 'district';
  return 'village';
}

function parseAdditional(raw: unknown): Record<string, unknown> {
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
    return {};
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  return {};
}

function ncdNetworkDetail(error: unknown): { code: string; detail: string; retryable: boolean } {
  const ax = axios.isAxiosError(error) ? error : null;
  const cause = (ax?.cause ?? (error as { cause?: { code?: string; message?: string } })?.cause) as
    | { code?: string; message?: string }
    | undefined;
  const code = String(ax?.code || cause?.code || '');
  const detail = cause?.message || ax?.message || (error instanceof Error ? error.message : 'Network error');
  const retryable = ['ECONNRESET', 'ECONNABORTED', 'ETIMEDOUT', 'EAI_AGAIN', 'UND_ERR_CONNECT_TIMEOUT'].includes(
    code.toUpperCase()
  );
  return { code, detail, retryable };
}

async function fetchNcdPage(url: string, body: Record<string, string>): Promise<NcdPage> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= NCD_MAX_RETRIES; attempt += 1) {
    try {
      const response = await axios.post(url, body, {
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        timeout: FETCH_TIMEOUT_MS,
        httpsAgent: ncdHttpsAgent,
        proxy: false,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        validateStatus: () => true,
        transitional: { clarifyTimeoutError: true }
      });
      const payload =
        response.data && typeof response.data === 'object'
          ? (response.data as Record<string, unknown>)
          : {};
      if (typeof response.data === 'string') {
        throw new AppError('NCD society API returned invalid JSON', 502);
      }
      if (response.status < 200 || response.status >= 300 || String(payload.status ?? '').toLowerCase() !== 'success') {
        const message = typeof payload.message === 'string' ? payload.message : `HTTP ${response.status}`;
        throw new AppError(`NCD society API failed: ${message}`, 502);
      }
      const metaRaw = payload.meta;
      const meta =
        metaRaw && typeof metaRaw === 'object'
          ? {
              current_page: asNumber((metaRaw as Record<string, unknown>).current_page) ?? 1,
              per_page: asNumber((metaRaw as Record<string, unknown>).per_page) ?? 0,
              records_on_page: asNumber((metaRaw as Record<string, unknown>).records_on_page) ?? 0,
              has_next_page: Boolean((metaRaw as Record<string, unknown>).has_next_page),
              total_records: asNumber((metaRaw as Record<string, unknown>).total_records) ?? 0,
              total_pages: asNumber((metaRaw as Record<string, unknown>).total_pages) ?? 0
            }
          : null;
      const result = Array.isArray(payload.result) ? (payload.result as Record<string, unknown>[]) : [];
      return { result, meta };
    } catch (error) {
      if (error instanceof AppError) throw error;
      const info = ncdNetworkDetail(error);
      if (info.retryable && attempt < NCD_MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, NCD_RETRY_BACKOFF_MS * (attempt + 1)));
        continue;
      }
      lastError = error;
      break;
    }
  }
  const info = ncdNetworkDetail(lastError);
  if (info.code === 'ECONNABORTED' || info.code === 'ETIMEDOUT') {
    throw new AppError(`NCD society API timeout after ${FETCH_TIMEOUT_MS}ms`, 504);
  }
  const code = info.code ? ` (${info.code})` : '';
  throw new AppError(`NCD society API network error${code}: ${info.detail}`, 502);
}

async function loadCache(stateCode: string): Promise<GeoCache> {
  const stateNum = Number(stateCode);
  const stateWhere = Number.isFinite(stateNum)
    ? { [Op.or]: [{ state_code: stateNum }, { state_code: String(stateNum) }] }
    : {};

  const [
    states,
    districts,
    blocks,
    sectors,
    sectorTypes,
    functional,
    societyTypes,
    authorities,
    societyTypesMaster,
    areaLevels,
    locationTypes,
    banks,
    certificateStatus,
    applicantRole
  ] = await Promise.all([
    State.findAll({ attributes: ['id', 'state_code'] }),
    District.findAll({ where: stateWhere, attributes: ['id', 'district_code'] }),
    Block.findAll({ where: stateWhere, attributes: ['id', 'block_code'] }),
    SectorOfOperation.findAll({ attributes: ['id', 'code', 'name', 'respective_table'] }),
    SectorOfOperationsType.findAll({ attributes: ['id', 'key', 'name'] }),
    FunctionalStatus.findAll({ attributes: ['id', 'name'] }),
    CooperativeSocietyType.findAll({ attributes: ['id', 'name'] }),
    RegistrationAuthority.findAll({ attributes: ['id', 'name'] }),
    SocietyType.findAll({ attributes: ['id', 'title', 'active'] }),
    AreaOfOperationLevel.findAll({ attributes: ['id', 'level_type', 'name'] }),
    LocationType.findAll({ attributes: ['id', 'name'] }),
    Bank.findAll({ attributes: ['id', 'code'] }),
    findStatusByKey('certificate_issued'),
    findRoleByIdOrName('applicant')
  ]);

  const stateMap = new Map<string, string>();
  for (const row of states) {
    const key = codeKey((row as any).state_code);
    if (key) stateMap.set(key, row.id);
  }
  const districtMap = new Map<string, string>();
  for (const row of districts) {
    const key = codeKey((row as any).district_code);
    if (key) districtMap.set(key, row.id);
  }
  const blockMap = new Map<string, string>();
  for (const row of blocks) {
    const key = codeKey((row as any).block_code);
    if (key) blockMap.set(key, row.id);
  }
  const sectorMap = new Map<string, SectorRow>();
  for (const row of sectors) {
    const key = codeKey(row.code);
    if (!key) continue;
    const table = row.respective_table ?? '';
    const credit = CREDIT_TABLE_RE.test(table) || CREDIT_TABLE_RE.test(row.name || '');
    sectorMap.set(key, {
      id: row.id,
      code: row.code ?? null,
      name: row.name,
      respective_table: table || null,
      credit
    });
  }

  const typeKey = (row: SectorOfOperationsType) => String(row.key || row.name || '').toLowerCase();
  const creditType = sectorTypes.find((row) => typeKey(row) === 'credit');
  const nonCreditType = sectorTypes.find((row) => {
    const key = typeKey(row);
    return key === 'no_credit' || key === 'non_credit' || key.includes('non');
  });

  const areaMap = new Map<string, string>();
  for (const row of areaLevels) {
    const level = String((row as any).level_type || (row as any).name || '').toLowerCase();
    if (level.includes('village')) areaMap.set('village', row.id);
    else if (level.includes('block')) areaMap.set('block', row.id);
    else if (level.includes('district')) areaMap.set('district', row.id);
    else if (level.includes('state')) areaMap.set('state', row.id);
    else if (level.includes('national')) areaMap.set('national', row.id);
  }

  const locationMap = new Map<string, string>();
  for (const row of locationTypes) {
    const name = String(row.name || '').toLowerCase();
    if (name.includes('urban')) locationMap.set('urban', row.id);
    if (name.includes('rural')) locationMap.set('rural', row.id);
  }

  const bankMap = new Map<string, string>();
  for (const row of banks) {
    const code = clip(row.code, 50);
    if (code) bankMap.set(code.toLowerCase(), row.id);
  }

  return {
    states: stateMap,
    districts: districtMap,
    blocks: blockMap,
    villagesByCode: new Map(),
    gpByCode: new Map(),
    sectors: sectorMap,
    creditTypeId: creditType?.id ?? null,
    nonCreditTypeId: nonCreditType?.id ?? null,
    functional: functional.map((row) => ({ id: row.id, name: row.name })),
    societyTypes: societyTypes.map((row) => ({ id: row.id, name: row.name })),
    authorities: authorities.map((row) => ({ id: row.id, name: row.name })),
    societyTypesMaster: societyTypesMaster
      .filter((row) => row.active !== false)
      .map((row) => ({ id: row.id, name: row.title })),
    areaLevels: areaMap,
    locationTypes: locationMap,
    banks: bankMap,
    certificateStatusId: certificateStatus?.id ?? null,
    applicantRoleId: applicantRole?.id ?? null
  };
}

async function loadVillages(cache: GeoCache, items: Record<string, unknown>[]) {
  const villageCodes = new Set<number>();
  const gpCodes = new Set<number>();
  for (const item of items) {
    const details = item['Cooperative Details'];
    if (!details || typeof details !== 'object') continue;
    const row = details as Record<string, unknown>;
    const village = asNumber(row.village_code);
    const gp = asNumber(row.gram_panchayat_code);
    if (village) villageCodes.add(village);
    if (gp) gpCodes.add(gp);
  }
  if (villageCodes.size === 0 && gpCodes.size === 0) return;

  const or: Record<string, unknown>[] = [];
  if (villageCodes.size) or.push({ village_code: { [Op.in]: [...villageCodes] } });
  if (gpCodes.size) or.push({ gram_panchayat_code: { [Op.in]: [...gpCodes] } });

  const rows = await DistrictsBlocksGpVillage.findAll({
    where: { [Op.or]: or },
    attributes: ['id', 'village_code', 'gram_panchayat_code']
  });
  for (const row of rows) {
    const villageKey = codeKey(row.village_code);
    const gpKey = codeKey(row.gram_panchayat_code);
    if (villageKey && !cache.villagesByCode.has(villageKey)) {
      cache.villagesByCode.set(villageKey, { id: row.id });
    }
    if (gpKey && !cache.gpByCode.has(gpKey)) {
      cache.gpByCode.set(gpKey, { id: row.id });
    }
  }
}

async function resolveUrban(
  details: Record<string, unknown>,
  cache: Map<string, string | null>
): Promise<{ typeId: string | null; bodyId: string | null; wardId: string | null }> {
  const typeCode = asNumber(details.urban_local_body_type_code);
  const bodyCode = asNumber(details.urban_local_body_code);
  const wardCode = asNumber(details.locality_ward_code);
  const districtCode = asNumber(details.district_code);
  if (typeCode == null && bodyCode == null && wardCode == null) {
    return { typeId: null, bodyId: null, wardId: null };
  }

  const bodyKey = `ulb:${bodyCode ?? ''}:${districtCode ?? ''}`;
  let bodyId = cache.get(bodyKey) ?? null;
  if (!cache.has(bodyKey) && bodyCode != null) {
    const where: Record<string, unknown> = { localbody_code: bodyCode };
    if (districtCode != null) where.district_code = districtCode;
    const ulb = await UrbanLocalBody.findOne({
      where,
      attributes: ['id', 'localbody_type_code']
    });
    bodyId = ulb?.id ?? null;
    cache.set(bodyKey, bodyId);
    if (ulb && typeCode != null) {
      cache.set(`ulb-type:${typeCode}:${districtCode ?? ''}`, ulb.id);
    }
  }

  let typeId = bodyId;
  if (typeCode != null && bodyId == null) {
    const typeKey = `ulb-type:${typeCode}:${districtCode ?? ''}`;
    if (!cache.has(typeKey)) {
      const where: Record<string, unknown> = { localbody_type_code: typeCode };
      if (districtCode != null) where.district_code = districtCode;
      const ulb = await UrbanLocalBody.findOne({ where, attributes: ['id'] });
      cache.set(typeKey, ulb?.id ?? null);
    }
    typeId = cache.get(`ulb-type:${typeCode}:${districtCode ?? ''}`) ?? null;
  }

  let wardId: string | null = null;
  if (wardCode != null) {
    const wardKey = `ward:${wardCode}:${bodyCode ?? ''}`;
    if (!cache.has(wardKey)) {
      const where: Record<string, unknown> = { ward_code: wardCode };
      if (bodyCode != null) where.local_body_code = bodyCode;
      const ward = await UrbanLocalBodiesWard.findOne({ where, attributes: ['id'] });
      cache.set(wardKey, ward?.id ?? null);
    }
    wardId = cache.get(`ward:${wardCode}:${bodyCode ?? ''}`) ?? null;
  }

  return { typeId, bodyId, wardId };
}

async function importOne(
  item: Record<string, unknown>,
  cache: GeoCache,
  urbanCache: Map<string, string | null>,
  warnings: SyncNcdSocietiesResult['warnings']
): Promise<{ status: 'inserted' | 'updated' | 'skipped'; applicant: 'created' | 'linked' | 'none' }> {
  const detailsRaw = item['Cooperative Details'];
  if (!detailsRaw || typeof detailsRaw !== 'object') {
    throw new AppError('Cooperative Details missing', 400);
  }
  const details = detailsRaw as Record<string, unknown>;
  const ncdId = clip(details.cooperative_id, 40);
  if (!ncdId) throw new AppError('cooperative_id missing', 400);

  const name = clip(details.cooperative_society_name, 5000);
  if (!name) throw new AppError('cooperative_society_name missing', 400);

  const existing = await SocietyRegistration.findOne({ where: { ncd_id: ncdId } });
  if (existing?.created_by) {
    pushIssue(warnings, ncdId, 'Skipped because an applicant already owns this society');
    return { status: 'skipped', applicant: 'none' };
  }

  const stateId = cache.states.get(codeKey(details.state_code) || '') ?? null;
  const districtId = cache.districts.get(codeKey(details.district_code) || '') ?? null;
  const blockId = cache.blocks.get(codeKey(details.block_code) || '') ?? null;
  const villageKey = codeKey(details.village_code);
  const gpKey = codeKey(details.gram_panchayat_code);
  const villageHit = villageKey ? cache.villagesByCode.get(villageKey) : undefined;
  const gpHit = gpKey ? cache.gpByCode.get(gpKey) : undefined;
  const geoRow = villageHit || gpHit;
  if (!districtId) pushIssue(warnings, ncdId, `District code ${details.district_code} was not found`);
  if (!blockId && asNumber(details.block_code)) {
    pushIssue(warnings, ncdId, `Block code ${details.block_code} was not found`);
  }
  if (!geoRow && (villageKey || gpKey)) {
    pushIssue(warnings, ncdId, `Village ${villageKey ?? '-'} / GP ${gpKey ?? '-'} was not found`);
  }
  if (villageHit && gpKey && gpHit && villageHit.id !== gpHit.id) {
    pushIssue(warnings, ncdId, `GP code ${gpKey} does not match village ${villageKey}; village row was used`);
  }

  const sectorKey = codeKey(details.sector_of_operation);
  const sector = sectorKey ? cache.sectors.get(sectorKey) : undefined;
  if (!sector) pushIssue(warnings, ncdId, `Sector code ${details.sector_of_operation} was not found`);

  const bankCode = clip(details.cooperative_society_bank_id, 50);
  const bankId = bankCode ? cache.banks.get(bankCode.toLowerCase()) ?? null : null;
  if (bankCode && !bankId) {
    pushIssue(warnings, ncdId, `Bank code ${bankCode} was not found`);
  }

  const hqCode = asNumber(details.location_of_head_quarter);
  const opCode = asNumber(details.operation_area_location);
  const hqWord = locationWord(hqCode) === 'both' ? 'rural' : locationWord(hqCode);
  const opWord = locationWord(opCode);
  const locationTypeId = hqWord ? cache.locationTypes.get(hqWord) ?? null : null;

  const areaCode = asNumber(
    (Array.isArray(item['Area of Operation (Rural)'])
      ? (item['Area of Operation (Rural)'] as Record<string, unknown>[])[0]?.area_of_operation_id
      : null) ?? null
  );
  const levelType = areaLevelType(areaCode, Boolean(villageKey), Boolean(blockId), hqWord === 'urban');
  if (areaCode != null && areaCode > 5) {
    pushIssue(warnings, ncdId, `Area code ${areaCode} is outside 1-5; stored as ${levelType}`);
  }
  const areaId = cache.areaLevels.get(levelType) ?? null;

  const urban = await resolveUrban(details, urbanCache);
  const dateRegistration = clip(details.date_registration, 40);
  const referenceYear = dateRegistration ? dateRegistration.slice(0, 4) : null;

  // Sector master missing → do not store NCD JSON payloads in additional_data.
  let additionalData: Record<string, unknown> | null = null;
  if (sector) {
    const extraSector: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(item)) {
      if (!KNOWN_RESULT_KEYS.has(key)) extraSector[key] = value;
    }

    const urbanAreas = Array.isArray(item['Area of Operation (Urban)'])
      ? (item['Area of Operation (Urban)'] as Record<string, unknown>[])
      : [];

    const ncdImport = {
      primary_activity: details.primary_activity ?? null,
      is_coastal: details.is_coastal ?? null,
      address_line: details.address_line ?? null,
      members_of_society: details.members_of_society ?? null,
      area_of_operation_code: areaCode,
      bank_code: bankCode,
      gram_panchayat_code: details.gram_panchayat_code ?? null,
      cooperative_society_bank_id: details.cooperative_society_bank_id ?? null
    };

    const previousAdditional = parseAdditional(existing?.additional_data);
    additionalData = {
      ...previousAdditional,
      ...extraSector,
      ncd_import: ncdImport,
      ncd_members_details: item['Members Details'] ?? [],
      ncd_urban_areas: urbanAreas,
      ncd_rural_areas: item['Area of Operation (Rural)'] ?? []
    };
  }

  const unions = Array.isArray(item['Affiliated Unions']) ? (item['Affiliated Unions'] as Record<string, unknown>[]) : [];
  const firstUnion = unions[0] && typeof unions[0] === 'object' ? unions[0] : null;

  const applicant = await resolveApplicant({
    ncdId,
    emailRaw: details.email,
    contactRaw: details.contact_person,
    mobileRaw: details.mobile,
    stateId,
    districtId,
    roleId: cache.applicantRoleId,
    warnings
  });

  const fields: Record<string, unknown> = {
    cooperative_society_name: name,
    registration_authoritie_id: authorityId(asNumber(details.registration_authoritie_id), cache.authorities),
    reference_year: referenceYear,
    date_registration: dateRegistration,
    registration_number: clip(details.registration_number, 255),
    cooperative_society_type_id: societyTypeId(asNumber(details.cooperative_society_type_id), cache.societyTypes),
    society_type: societyTypeMasterId(sector, cache.societyTypesMaster),
    area_of_operation_id: areaId,
    water_body_type_id: null,
    sector_of_operation_type: sector ? (sector.credit ? cache.creditTypeId : cache.nonCreditTypeId) : null,
    sector_of_operation: sector?.id ?? null,
    functional_status: functionalStatusId(asNumber(details.functional_status), cache.functional),
    location_of_head_quarter: locationTypeId,
    state_id: stateId,
    district_id: districtId,
    block_id: blockId,
    gram_panchayat_id: geoRow?.id ?? null,
    village_code: villageKey,
    urban_local_body_type: urban.typeId,
    urban_local_body_code: urban.bodyId,
    locality_ward_code: urban.wardId,
    pincode: pincode6(details.pincode),
    full_address: clip(details.full_address, 65000) || clip(details.address_line, 65000),
    contact_person: clip(details.contact_person, 40),
    designation: designationName(asNumber(details.designation)),
    mobile: mobile10(details.mobile),
    email: clip(details.email, 40),
    financial_audit: yesNo(details.financial_audit),
    audit_complete_year: clip(details.audit_complete_year, 5),
    category_audit: clip(details.category_audit, 40),
    is_profit_making: yesNo(details.is_profit_making),
    annual_turnover: decimalOrNull(details.annual_turnover ?? details.an_turnover),
    annual_profit: decimalOrNull(details.annual_profit),
    annual_loss: decimalOrNull(details.annual_loss),
    is_msme: asNumber(details.is_msme) === 1,
    udyam_no: clip(details.udyam_no, 5000),
    is_dividend_paid: yesNo(details.is_dividend_paid),
    dividend_rate: decimalOrNull(details.dividend_rate),
    operation_area_location: opWord,
    bank_type: bankTypeName(details.bank_type),
    cooperative_society_bank_id: bankId,
    other_bank: clip(details.other_bank, 40),
    is_affiliated_union_federation: unions.length > 0 ? 'yes' : yesNo(details.is_affiliated_union_federation),
    affiliated_union_level: clip(
      firstUnion?.affiliated_union_federation_level ?? firstUnion?.level,
      100
    ),
    affiliated_union_name: clip(
      firstUnion?.affiliated_union_federation_name ?? firstUnion?.name,
      5000
    ),
    additional_data: additionalData,
    ncd_id: ncdId,
    ncd_running_number: runningNumber(ncdId),
    ...(applicant.userId ? { created_by: applicant.userId } : {})
  };

  await sequelize.transaction(async (transaction) => {
    let registrationId = existing?.id;
    let businessSocietyId = existing?.society_id;
    if (!existing) {
      registrationId = uuidv4();
      businessSocietyId = ncdId;
      await SocietyRegistration.create(
        {
          ...(fields as any),
          id: registrationId,
          society_id: businessSocietyId,
          status: cache.certificateStatusId,
          workflow_status: null,
          created_by: applicant.userId,
          updated_by: null
        },
        { transaction }
      );
    } else {
      await existing.update(fields, { transaction });
    }
  });

  return { status: existing ? 'updated' : 'inserted', applicant: applicant.action };
}

/**
 * Pull every page from NCD `cooperativeData` and upsert society_registrations.
 * Pages are fetched internally in batches of 100 until NCD reports no next page.
 */
export async function syncNcdSocieties(options: SyncNcdSocietiesOptions): Promise<SyncNcdSocietiesResult> {
  const key = String(options.key || '').trim();
  if (!key) throw new AppError('NCD API key is required', 400);

  const state = String(options.state || '12').trim();
  const level = String(options.level || '1').trim() || '1';
  const sector = String(options.sector || '').trim();
  let page = 1;
  const url = (options.url || DEFAULT_URL).trim();

  const cache = await loadCache(state);
  const urbanCache = new Map<string, string | null>();
  const result: SyncNcdSocietiesResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    applicants_created: 0,
    applicants_linked: 0,
    pages_processed: 0,
    next_page: null,
    meta: null,
    errors: [],
    warnings: []
  };

  for (let i = 0; i < MAX_PAGES_PER_CALL; i += 1) {
    const pageBody: Record<string, string> = {
      key,
      state,
      level
    };
    if (sector) pageBody.sector = sector;
    if (page > 1) pageBody.page = String(page);
    const fetched = await fetchNcdPage(url, pageBody);
    result.meta = fetched.meta;
    result.pages_processed += 1;
    await loadVillages(cache, fetched.result);

    for (const item of fetched.result) {
      const details = item['Cooperative Details'];
      const ncdId =
        details && typeof details === 'object'
          ? clip((details as Record<string, unknown>).cooperative_id, 40) || undefined
          : undefined;
      try {
        const outcome = await importOne(item, cache, urbanCache, result.warnings);
        result[outcome.status] += 1;
        if (outcome.applicant === 'created') result.applicants_created += 1;
        if (outcome.applicant === 'linked') result.applicants_linked += 1;
      } catch (error) {
        result.failed += 1;
        const message = error instanceof Error ? error.message : 'Failed to import society';
        pushIssue(result.errors, ncdId, message);
        logger.error('NCD society import failed', { ncdId, message });
      }
    }

    const hasNext = Boolean(fetched.meta?.has_next_page);
    if (!hasNext) {
      result.next_page = null;
      break;
    }
    page += 1;
    result.next_page = page;
    // if (i === maxPages - 1) break;
  }

  logger.info('NCD society sync batch finished', {
    inserted: result.inserted,
    updated: result.updated,
    skipped: result.skipped,
    failed: result.failed,
    pages_processed: result.pages_processed,
    next_page: result.next_page
  });
  return result;
}
