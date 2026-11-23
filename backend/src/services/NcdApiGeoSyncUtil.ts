import sequelize from '../config/sequelize';
import State from '../models/State';
import District from '../models/District';
import Block from '../models/Block';
import DistrictsBlocksGpVillage from '../models/DistrictsBlocksGpVillage';
import UrbanLocalBody from '../models/UrbanLocalBody';
import UrbanLocalBodiesWard from '../models/UrbanLocalBodiesWard';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { applyArunachalRuralDistrictRemap } from '../utils/arunachalRuralDistrictRemap';

const TIMEOUT_MS = 120_000;

/** `/Api/...` without `/en/` — see ExternalApiService. */
const DEFAULT_FIND_STATE_URL = 'https://api.cooperatives.gov.in/Api/findStateLgCode';
const DEFAULT_FIND_DISTRICT_URL = 'https://api.cooperatives.gov.in/Api/districtdetailsbystate';
const DEFAULT_GP_VILLAGES_URL = 'https://api.cooperatives.gov.in/Api/apiforvillagesdata';
const DEFAULT_BLOCKS_URL = 'https://api.cooperatives.gov.in/Api/apiforblocksdata';
const DEFAULT_ULB_URL = 'https://api.cooperatives.gov.in/Api/apiforulbdata';
const DEFAULT_ULB_WARD_URL = 'https://api.cooperatives.gov.in/Api/apiforulbwarddata';

const GP_DETAIL_KEY = 'Districts - Blocks - GP - Villages Details';
const BLOCKS_DETAIL_KEY = 'Blocks Details';
const DISTRICT_DETAIL_KEY = 'District Details';
const ULB_DETAIL_KEY = 'Urban Local Bodies Details';
const ULB_WARD_DETAIL_KEY = 'Urban Local Bodies Ward Details';
const COOPERATIVES_MAX_RETRIES = 2;
const RETRY_BACKOFF_MS = 1500;

/** Default request codes when caller does not pass `state_code` / `sector_code` (no .env). */
const DEFAULT_REQUEST_STATE_CODE = '12';
const DEFAULT_REQUEST_SECTOR_CODE = '1';

function requireCooperativesKey(key: string | undefined): string {
  const k = typeof key === 'string' ? key.trim() : '';
  if (!k) {
    throw new AppError(
      'Cooperatives API key is required: send `key` in the admin sync POST body (env is not used).',
      400
    );
  }
  return k;
}

export interface SyncCooperativesStatesResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: Array<{ message: string; row?: unknown }>;
}

export type SyncCooperativesDistrictsResult = SyncCooperativesStatesResult;
export type SyncCooperativesGpVillagesResult = SyncCooperativesStatesResult;
export type SyncCooperativesBlocksResult = SyncCooperativesStatesResult;
export type SyncCooperativesUlbResult = SyncCooperativesStatesResult;
export type SyncCooperativesUlbWardsResult = SyncCooperativesStatesResult;

type CooperativesEndpoint = 'findStateLgCode' | 'findDistrictLgCode' | 'districtdetailsbystate';

/**
 * Resolves cooperatives.gov.in URLs. Strips `/en/` (breaks routing → "Controller class En"),
 * appends `/Api/{endpoint}` when needed. Matches patterns in `ExternalApiService`.
 */
function normalizeCooperativesUrl(raw: string, endpoint: CooperativesEndpoint): string {
  const path = `/Api/${endpoint}`;
  const defaultFull = `https://api.cooperatives.gov.in${path}`;

  let u = raw.trim();
  if (!u) return defaultFull;

  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    throw new AppError('Cooperatives API URL must start with https://', 500);
  }

  // Strip locale segment /en/ — server treats "en" as a controller name on some paths
  u = u.replace(/^(https?:\/\/api\.cooperatives\.gov\.in)\/en(?=\/|$)/i, '$1');

  const noTrail = u.replace(/\/+$/, '');
  if (noTrail.toLowerCase().includes(path.toLowerCase())) {
    return noTrail;
  }

  const hostOnly = /^https?:\/\/api\.cooperatives\.gov\.in$/i.test(noTrail);
  if (hostOnly) {
    return defaultFull;
  }

  const localeOnly = /\/en$/i.test(noTrail) && !noTrail.includes('/Api/');
  if (localeOnly) {
    const base = noTrail.replace(/\/en$/i, '');
    const fixed = `${base}${path}`;
    logger.warn('Cooperatives URL had trailing /en; fixed to /Api path', {
      input: raw,
      resolved: fixed,
      endpoint
    });
    return fixed;
  }

  if (!noTrail.includes('/Api/')) {
    const fixed = `${noTrail}${path}`;
    logger.warn('Cooperatives URL was incomplete; using full API path', {
      input: raw,
      resolved: fixed,
      endpoint
    });
    return fixed;
  }

  return noTrail;
}

/** apifordistrictsblocksgpvillagesdata — path is not find*LgCode. */
function normalizeGpVillagesUrl(raw: string): string {
  const defaultFull = DEFAULT_GP_VILLAGES_URL;
  let u = raw.trim();
  if (!u) return defaultFull;

  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    throw new AppError('Cooperatives API URL must start with https://', 500);
  }

  u = u.replace(/^(https?:\/\/api\.cooperatives\.gov\.in)\/en(?=\/|$)/i, '$1');

  const noTrail = u.replace(/\/+$/, '');
  if (noTrail.toLowerCase().includes('apifordistrictsblocksgpvillagesdata')) {
    return noTrail;
  }

  if (/^https?:\/\/api\.cooperatives\.gov\.in$/i.test(noTrail)) {
    return defaultFull;
  }

  if (!noTrail.includes('/Api/')) {
    const fixed = `${noTrail}/Api/apifordistrictsblocksgpvillagesdata`;
    logger.warn('GP villages URL was incomplete; using full API path', { input: raw, resolved: fixed });
    return fixed;
  }

  return noTrail;
}

function normalizeUlbUrl(raw: string): string {
  const defaultFull = DEFAULT_ULB_URL;
  let u = raw.trim();
  if (!u) return defaultFull;

  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    throw new AppError('Cooperatives API URL must start with https://', 500);
  }

  u = u.replace(/^(https?:\/\/api\.cooperatives\.gov\.in)\/en(?=\/|$)/i, '$1');

  const noTrail = u.replace(/\/+$/, '');
  if (noTrail.toLowerCase().includes('apiforulbdata')) {
    return noTrail;
  }

  if (/^https?:\/\/api\.cooperatives\.gov\.in$/i.test(noTrail)) {
    return defaultFull;
  }

  if (!noTrail.includes('/Api/')) {
    const fixed = `${noTrail}/Api/apiforulbdata`;
    logger.warn('ULB URL was incomplete; using full API path', { input: raw, resolved: fixed });
    return fixed;
  }

  return noTrail;
}

function normalizeBlocksUrl(raw: string): string {
  const defaultFull = DEFAULT_BLOCKS_URL;
  let u = raw.trim();
  if (!u) return defaultFull;

  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    throw new AppError('Cooperatives API URL must start with https://', 500);
  }

  u = u.replace(/^(https?:\/\/api\.cooperatives\.gov\.in)\/en(?=\/|$)/i, '$1');

  const noTrail = u.replace(/\/+$/, '');
  if (noTrail.toLowerCase().includes('apiforblocksdata')) {
    return noTrail;
  }

  if (/^https?:\/\/api\.cooperatives\.gov\.in$/i.test(noTrail)) {
    return defaultFull;
  }

  if (!noTrail.includes('/Api/')) {
    const fixed = `${noTrail}/Api/apiforblocksdata`;
    logger.warn('Blocks URL was incomplete; using full API path', { input: raw, resolved: fixed });
    return fixed;
  }

  return noTrail;
}

function normalizeUlbWardUrl(raw: string): string {
  const defaultFull = DEFAULT_ULB_WARD_URL;
  let u = raw.trim();
  if (!u) return defaultFull;

  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    throw new AppError('Cooperatives API URL must start with https://', 500);
  }

  u = u.replace(/^(https?:\/\/api\.cooperatives\.gov\.in)\/en(?=\/|$)/i, '$1');

  const noTrail = u.replace(/\/+$/, '');
  if (noTrail.toLowerCase().includes('apiforulbwarddata')) {
    return noTrail;
  }

  if (/^https?:\/\/api\.cooperatives\.gov\.in$/i.test(noTrail)) {
    return defaultFull;
  }

  if (!noTrail.includes('/Api/')) {
    const fixed = `${noTrail}/Api/apiforulbwarddata`;
    logger.warn('ULB ward URL was incomplete; using full API path', { input: raw, resolved: fixed });
    return fixed;
  }

  return noTrail;
}

function num(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : parseInt(String(v).trim(), 10);
  return Number.isNaN(n) ? null : n;
}

/** Case-insensitive lookup for cooperatives.gov.in rows (mixed key casing/spacing). */
function pickRecordValue(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const direct = record[key];
    if (direct != null && direct !== '') return direct;
  }
  const normalized = new Map<string, unknown>();
  for (const [key, value] of Object.entries(record)) {
    normalized.set(key.toLowerCase().replace(/\s+/g, ' ').trim(), value);
  }
  for (const key of keys) {
    const value = normalized.get(key.toLowerCase().replace(/\s+/g, ' ').trim());
    if (value != null && value !== '') return value;
  }
  return undefined;
}

function unwrapDistrictRow(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const wrapper = raw as Record<string, unknown>;
  const nested =
    wrapper[DISTRICT_DETAIL_KEY] ??
    wrapper['District Details'] ??
    wrapper['district details'];
  if (nested && typeof nested === 'object') {
    return nested as Record<string, unknown>;
  }
  return wrapper;
}

function resolveDistrictFields(
  raw: Record<string, unknown>,
): { district_code: number | null; name: string | null } {
  const district_code = num(
    pickRecordValue(raw, [
      'district_code',
      'district_lgd_code',
      'lgd_district_code',
      'District LGD code',
      'District LGD Code',
      'District code',
      'district lgd code',
      'lgd_code',
    ]),
  );
  const nameRaw = pickRecordValue(raw, [
    'district_name',
    'District name',
    'District Name',
    'district name',
    'District name in English',
    'district_name_english',
    'name',
  ]);
  const name = nameRaw != null ? String(nameRaw).trim() : '';
  return { district_code, name: name || null };
}

function extractCooperativesDistrictList(o: Record<string, unknown>): unknown[] {
  const dataNode = o.data as Record<string, unknown> | undefined;
  const candidates: unknown[] = [
    o.result,
    Array.isArray(o.message) ? o.message : null,
    dataNode?.districts,
    dataNode?.Districts,
    dataNode?.district,
    Array.isArray(dataNode) ? dataNode : null,
    dataNode?.message,
    dataNode?.result,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate;
    }
  }
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function strOrNull(raw: unknown): string | null {
  if (raw == null) return null;
  const value = String(raw).trim();
  return value || null;
}

function unwrapGpVillageRow(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const wrapper = raw as Record<string, unknown>;
  const nested =
    wrapper[GP_DETAIL_KEY] ??
    wrapper['Districts - Blocks - GP - Villages Details'] ??
    wrapper['districts - blocks - gp - villages details'];
  if (nested && typeof nested === 'object') {
    return nested as Record<string, unknown>;
  }
  return wrapper;
}

function resolveGpVillageRow(raw: Record<string, unknown>) {
  const village_code = num(
    pickRecordValue(raw, [
      'village_code',
      'Village code',
      'Village LGD code',
      'Village LGD Code',
      'village lgd code',
      'village_lgd_code',
    ]),
  );

  return {
    state_code: num(pickRecordValue(raw, ['state_code', 'State code', 'state', 'State LGD code'])),
    state_name: strOrNull(pickRecordValue(raw, ['state_name', 'State name', 'State Name'])),
    district_code: num(
      pickRecordValue(raw, ['district_code', 'District code', 'District LGD code', 'District LGD Code']),
    ),
    district_name: strOrNull(pickRecordValue(raw, ['district_name', 'District name', 'District Name'])),
    block_code: num(pickRecordValue(raw, ['block_code', 'Block code', 'Block LGD code', 'Block LGD Code'])),
    block_name: strOrNull(pickRecordValue(raw, ['block_name', 'Block name', 'Block Name'])),
    gram_panchayat_code: num(
      pickRecordValue(raw, [
        'gram_panchayat_code',
        'Gram Panchayat code',
        'Gram panchayat code',
        'GP code',
        'Gram Panchayat LGD code',
      ]),
    ),
    gram_panchayat_name: strOrNull(
      pickRecordValue(raw, ['gram_panchayat_name', 'Gram Panchayat name', 'Gram panchayat name']),
    ),
    gram_panchayat_name_hindi: strOrNull(
      pickRecordValue(raw, [
        'gram_panchayat_name_hindi',
        'Gram Panchayat name hindi',
        'Gram Panchayat name in Hindi',
        'Gram Panchayat name (Hindi)',
      ]),
    ),
    village_code,
    village_name: strOrNull(pickRecordValue(raw, ['village_name', 'Village name', 'Village Name'])),
  };
}

function extractCooperativesGpVillageList(o: Record<string, unknown>): unknown[] {
  const dataNode = o.data as Record<string, unknown> | undefined;
  const candidates: unknown[] = [
    o.result,
    Array.isArray(o.message) ? o.message : null,
    dataNode?.villages,
    dataNode?.gp_villages,
    dataNode?.result,
    Array.isArray(dataNode) ? dataNode : null,
    dataNode?.message,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate;
    }
  }
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function unwrapUlbRow(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const wrapper = raw as Record<string, unknown>;
  const nested =
    wrapper[ULB_DETAIL_KEY] ??
    wrapper['Urban Local Bodies Details'] ??
    wrapper['urban local bodies details'];
  if (nested && typeof nested === 'object') {
    return nested as Record<string, unknown>;
  }
  return wrapper;
}

function resolveUlbRow(
  raw: Record<string, unknown>,
  fallback: { state_code: number | null; state_name: string | null },
) {
  const localbody_code = num(
    pickRecordValue(raw, [
      'localbody_code',
      'local_body_code',
      'Local body code',
      'Local Body code',
      'ULB code',
    ]),
  );

  return {
    state_code:
      num(pickRecordValue(raw, ['state_code', 'State code', 'state', 'State LGD code'])) ??
      fallback.state_code,
    state_name:
      strOrNull(pickRecordValue(raw, ['state_name', 'State name', 'State Name'])) ??
      fallback.state_name,
    district_code: num(
      pickRecordValue(raw, ['district_code', 'District code', 'District LGD code', 'District LGD Code']),
    ),
    district_name: strOrNull(
      pickRecordValue(raw, ['district_name', 'District name', 'District Name']),
    ),
    localbody_type_code: num(
      pickRecordValue(raw, [
        'localbody_type_code',
        'local_body_type_code',
        'Local body type code',
        'Local Body type code',
      ]),
    ),
    localbody_type_name: strOrNull(
      pickRecordValue(raw, [
        'localbody_type_name',
        'local_body_type_name',
        'Local body type name',
        'Local Body type name',
      ]),
    ),
    localbody_type_name_hindi: strOrNull(
      pickRecordValue(raw, [
        'localbody_type_name_hindi',
        'local_body_type_name_hindi',
        'Local body type name hindi',
        'Local Body type name in Hindi',
      ]),
    ),
    localbody_code,
    local_body_name: strOrNull(
      pickRecordValue(raw, [
        'local_body_name',
        'Local body name',
        'Local Body name',
        'ULB name',
        'localbody_name',
      ]),
    ),
    local_body_name_hindi: strOrNull(
      pickRecordValue(raw, [
        'local_body_name_hindi',
        'local_body_hindi',
        'Local body name hindi',
        'Local Body name in Hindi',
      ]),
    ),
  };
}

function extractCooperativesUlbList(o: Record<string, unknown>): unknown[] {
  const dataNode = o.data as Record<string, unknown> | undefined;
  const candidates: unknown[] = [
    o.result,
    o.records,
    Array.isArray(o.message) ? o.message : null,
    dataNode?.ulb,
    dataNode?.urban_local_bodies,
    dataNode?.result,
    Array.isArray(dataNode) ? dataNode : null,
    dataNode?.message,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate;
    }
  }
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function unwrapUlbWardRow(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const wrapper = raw as Record<string, unknown>;
  const nested =
    wrapper[ULB_WARD_DETAIL_KEY] ??
    wrapper['Urban Local Bodies Ward Details'] ??
    wrapper['urban local bodies ward details'];
  if (nested && typeof nested === 'object') {
    return nested as Record<string, unknown>;
  }
  return wrapper;
}

function resolveUlbWardRow(
  raw: Record<string, unknown>,
  fallback: { state_code: number | null; state_name: string | null },
) {
  const ward_code = num(
    pickRecordValue(raw, [
      'ward_code',
      'Ward code',
      'Ward LGD code',
      'Ward LGD Code',
      'ward lgd code',
    ]),
  );

  return {
    state_code:
      num(pickRecordValue(raw, ['state_code', 'State code', 'state', 'State LGD code'])) ??
      fallback.state_code,
    state_name:
      strOrNull(pickRecordValue(raw, ['state_name', 'State name', 'State Name'])) ??
      fallback.state_name,
    local_body_code: num(
      pickRecordValue(raw, [
        'local_body_code',
        'localbody_code',
        'Local body code',
        'Local Body code',
        'ULB code',
      ]),
    ),
    local_body_name: strOrNull(
      pickRecordValue(raw, [
        'local_body_name',
        'Local body name',
        'Local Body name',
        'ULB name',
        'localbody_name',
      ]),
    ),
    local_body_name_hindi: strOrNull(
      pickRecordValue(raw, [
        'local_body_name_hindi',
        'local_body_hindi',
        'Local body name hindi',
        'Local Body name in Hindi',
      ]),
    ),
    ward_code,
    ward_name: strOrNull(pickRecordValue(raw, ['ward_name', 'Ward name', 'Ward Name'])),
    ward_name_hindi: strOrNull(
      pickRecordValue(raw, ['ward_name_hindi', 'Ward name hindi', 'Ward name in Hindi']),
    ),
  };
}

function extractCooperativesUlbWardList(o: Record<string, unknown>): unknown[] {
  const dataNode = o.data as Record<string, unknown> | undefined;
  const candidates: unknown[] = [
    o.result,
    o.records,
    Array.isArray(o.message) ? o.message : null,
    dataNode?.wards,
    dataNode?.ulb_wards,
    dataNode?.urban_local_bodies_wards,
    dataNode?.result,
    Array.isArray(dataNode) ? dataNode : null,
    dataNode?.message,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate;
    }
  }
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

/** Prefer driver/DB message (Sequelize wraps many errors on `parent`). */
function sequelizeRowErrorMessage(err: unknown): string {
  const e = err as {
    message?: string;
    parent?: { message?: string };
    original?: { message?: string };
  };
  const fromDriver = e?.parent?.message ?? e?.original?.message;
  if (fromDriver && String(fromDriver).trim() !== '') {
    return String(fromDriver).trim();
  }
  if (err instanceof Error && err.message.trim() !== '') {
    return err.message.trim();
  }
  return 'upsert failed';
}

function isRetryableNetworkError(err: unknown): boolean {
  const e = err as {
    name?: string;
    message?: string;
    cause?: { code?: string; message?: string };
  };
  if (e?.name === 'AbortError') return true;
  const code = String(e?.cause?.code ?? '').toUpperCase();
  return (
    code === 'UND_ERR_CONNECT_TIMEOUT' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    code === 'EAI_AGAIN'
  );
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function cooperativesPost(
  url: string,
  body: Record<string, string>
): Promise<unknown> {
  let lastNetworkError: unknown = null;
  for (let attempt = 0; attempt <= COOPERATIVES_MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      let res: Response;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal
        });
      } catch (err: unknown) {
        if (isRetryableNetworkError(err) && attempt < COOPERATIVES_MAX_RETRIES) {
          await delay(RETRY_BACKOFF_MS * (attempt + 1));
          continue;
        }
        lastNetworkError = err;
        break;
      }

      const text = await res.text();
      let payload: unknown;
      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        throw new AppError('Cooperatives API: invalid JSON response', 502);
      }
      if (!res.ok) {
        const msg = (payload as any)?.message || (payload as any)?.error || `HTTP ${res.status}`;
        throw new AppError(`Cooperatives API failed: ${msg}`, res.status >= 400 ? res.status : 502);
      }
      return payload;
    } finally {
      clearTimeout(timer);
    }
  }
  const e = lastNetworkError as { name?: string; message?: string; cause?: { code?: string; message?: string } };
  if (e?.name === 'AbortError') {
    throw new AppError(`Cooperatives API timeout after ${TIMEOUT_MS}ms`, 504);
  }
  const code = e?.cause?.code ? ` (${e.cause.code})` : '';
  const detail = e?.cause?.message || e?.message || 'Network error';
  throw new AppError(`Cooperatives API network error${code}: ${detail}`, 502);
}

async function cooperativesGet(url: string): Promise<unknown> {
  let lastNetworkError: unknown = null;
  for (let attempt = 0; attempt <= COOPERATIVES_MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      let res: Response;
      try {
        res = await fetch(url, {
          method: 'GET',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          signal: controller.signal
        });
      } catch (err: unknown) {
        if (isRetryableNetworkError(err) && attempt < COOPERATIVES_MAX_RETRIES) {
          await delay(RETRY_BACKOFF_MS * (attempt + 1));
          continue;
        }
        lastNetworkError = err;
        break;
      }

      const text = await res.text();
      let payload: unknown;
      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        throw new AppError('Cooperatives API: invalid JSON response', 502);
      }
      if (!res.ok) {
        const msg = (payload as any)?.message || (payload as any)?.error || `HTTP ${res.status}`;
        throw new AppError(`Cooperatives API failed: ${msg}`, res.status >= 400 ? res.status : 502);
      }
      return payload;
    } finally {
      clearTimeout(timer);
    }
  }
  const e = lastNetworkError as { name?: string; message?: string; cause?: { code?: string; message?: string } };
  if (e?.name === 'AbortError') {
    throw new AppError(`Cooperatives API timeout after ${TIMEOUT_MS}ms`, 504);
  }
  const code = e?.cause?.code ? ` (${e.cause.code})` : '';
  const detail = e?.cause?.message || e?.message || 'Network error';
  throw new AppError(`Cooperatives API network error${code}: ${detail}`, 502);
}

/**
 * cooperatives.gov.in findStateLgCode → POST → `states` table create/update.
 * Caller must pass `key` (e.g. admin POST body). Optional `url`, `state_code`, `sector_code`.
 */
export async function syncCooperativesStates(options?: {
  key?: string;
  state?: string;
  sector_code?: string;
  url?: string;
}): Promise<SyncCooperativesStatesResult> {
  const key = requireCooperativesKey(options?.key);

  const url = normalizeCooperativesUrl(options?.url || DEFAULT_FIND_STATE_URL, 'findStateLgCode');

  const body = {
    key,
    state: options?.state ?? DEFAULT_REQUEST_STATE_CODE,
    sector_code: options?.sector_code ?? DEFAULT_REQUEST_SECTOR_CODE
  };

  const payload = await cooperativesPost(url, body);
  const o = payload as Record<string, unknown>;
  if (String(o.status ?? '').toLowerCase() !== 'success') {
    const msg = typeof o.message === 'string' ? o.message : JSON.stringify(o.message ?? o);
    throw new AppError(`Cooperatives API: ${msg}`, 502);
  }

  const list = Array.isArray(o.message) ? o.message : [];
  const result: SyncCooperativesStatesResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  const mapUt = (raw: unknown): string | null => {
    if (raw == null) return null;
    const v = String(raw).trim().toUpperCase();
    if (v === 'S') return 'State';
    if (v === 'U') return 'Union Territory';
    return String(raw).trim();
  };

  const normCode = (code: string | number): string => {
    const n = parseInt(String(code).trim(), 10);
    return Number.isNaN(n) ? String(code).trim() : String(n);
  };

  await sequelize.transaction(async (t) => {
    for (const raw of list) {
      if (!raw || typeof raw !== 'object') {
        result.skipped += 1;
        continue;
      }
      const r = raw as Record<string, unknown>;
      const code = r.state_code;
      const name = r.name;
      if (code == null || name == null || String(name).trim() === '') {
        result.skipped += 1;
        continue;
      }

      const state_code = normCode(code as string | number);
      const row = {
        state_code,
        name: String(name).trim(),
        hindi_name: r.hindi_name != null ? String(r.hindi_name) : null,
        state_or_ut: mapUt(r.state_or_ut),
        updated_at: new Date()
      };

      try {
        const existing = await State.findOne({ where: { state_code }, transaction: t });
        if (existing) {
          await existing.update(row, { transaction: t });
          result.updated += 1;
        } else {
          await State.create({ ...row, created_at: new Date() }, { transaction: t });
          result.inserted += 1;
        }
      } catch (err: any) {
        result.errors.push({ message: sequelizeRowErrorMessage(err), row: raw });
      }
    }
  });

  logger.info('syncCooperativesStates done', {
    inserted: result.inserted,
    updated: result.updated,
    skipped: result.skipped,
    errorCount: result.errors.length
  });
  return result;
}

/**
 * cooperatives.gov.in findDistrictLgCode → POST → `districts` table create/update.
 * Response uses `result` array and `State/ UT code` for LGD state code.
 * Caller must pass `key`. Optional `url`, `state_code`, `sector_code`.
 */
export async function syncCooperativesDistricts(options?: {
  key?: string;
  state_code?: string;
  sector_code?: string;
  url?: string;
}): Promise<SyncCooperativesDistrictsResult> {
  const key = requireCooperativesKey(options?.key);

  const districtUrlRaw = options?.url || DEFAULT_FIND_DISTRICT_URL;
  const districtEndpoint: CooperativesEndpoint =
    districtUrlRaw.toLowerCase().includes('districtdetailsbystate')
      ? 'districtdetailsbystate'
      : 'findDistrictLgCode';
  const url = normalizeCooperativesUrl(districtUrlRaw, districtEndpoint);

  const body = {
    key,
    state_code: options?.state_code ?? DEFAULT_REQUEST_STATE_CODE,
    sector_code: options?.sector_code ?? DEFAULT_REQUEST_SECTOR_CODE
  };

  const payload =
    districtEndpoint === 'districtdetailsbystate'
      ? await cooperativesPost(url, {
          key: body.key,
          state: body.state_code,
          state_code: body.state_code,
          sector_code: body.sector_code
        })
      : await cooperativesPost(url, body);
  const o = payload as Record<string, unknown>;
  const status = String(o.status ?? '').toLowerCase();
  if (status && status !== 'success') {
    const msg = typeof o.message === 'string' ? o.message : JSON.stringify(o.message ?? o);
    throw new AppError(`Cooperatives API: ${msg}`, 502);
  }

  const rawStateCode =
    o['State/ UT code'] ??
    o.state_code ??
    (o.data as Record<string, unknown> | undefined)?.state_code ??
    (o.data as Record<string, unknown> | undefined)?.state;
  let stateCodeNum =
    typeof rawStateCode === 'number' && !Number.isNaN(rawStateCode)
      ? rawStateCode
      : parseInt(String(rawStateCode ?? '').trim(), 10);
  if (Number.isNaN(stateCodeNum)) {
    stateCodeNum = parseInt(body.state_code, 10);
  }
  if (Number.isNaN(stateCodeNum)) {
    throw new AppError('Cooperatives district API: could not resolve state code for districts', 502);
  }

  const list = extractCooperativesDistrictList(o);
  const result: SyncCooperativesDistrictsResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  if (list.length === 0) {
    logger.warn('syncCooperativesDistricts: cooperatives API returned no district rows', {
      stateCode: stateCodeNum,
      topLevelKeys: Object.keys(o),
      dataKeys: o.data && typeof o.data === 'object' ? Object.keys(o.data as object) : [],
    });
  }

  await sequelize.transaction(async (t) => {
    for (const raw of list) {
      const r = unwrapDistrictRow(raw);
      if (!r) {
        result.skipped += 1;
        continue;
      }

      const { district_code, name } = resolveDistrictFields(r);
      if (district_code == null || !name) {
        result.skipped += 1;
        continue;
      }

      const row = {
        state_code: stateCodeNum,
        district_code,
        name,
        updated_at: new Date()
      };

      try {
        const existing = await District.findOne({
          where: { state_code: stateCodeNum, district_code },
          transaction: t
        });
        if (existing) {
          await existing.update(row, { transaction: t });
          result.updated += 1;
        } else {
          await District.create({ ...row, created_at: new Date() }, { transaction: t });
          result.inserted += 1;
        }
      } catch (err: any) {
        result.errors.push({ message: sequelizeRowErrorMessage(err), row: raw });
      }
    }
  });

  logger.info('syncCooperativesDistricts done', {
    stateCode: stateCodeNum,
    rowCount: list.length,
    inserted: result.inserted,
    updated: result.updated,
    skipped: result.skipped,
    errorCount: result.errors.length
  });
  if (result.skipped > 0 && result.inserted === 0 && result.updated === 0 && list.length > 0) {
    const sample = unwrapDistrictRow(list[0]);
    logger.warn('syncCooperativesDistricts: all rows skipped — check API field names', {
      stateCode: stateCodeNum,
      sampleKeys: sample ? Object.keys(sample) : [],
    });
  }

  // Keep Keyi Panyor / Bichom rural remaps after cooperatives district sync.
  try {
    const remap = await applyArunachalRuralDistrictRemap();
    (result as SyncCooperativesDistrictsResult & { ruralRemap?: unknown }).ruralRemap = remap;
  } catch (remapErr: any) {
    logger.warn('syncCooperativesDistricts: rural district remap failed (non-fatal)', {
      error: remapErr?.message || String(remapErr),
    });
  }

  return result;
}

/**
 * apifordistrictsblocksgpvillagesdata → `districts_blocks_gp_villages` upsert by `village_code`.
 * Each `result[]` item wraps one row under key `Districts - Blocks - GP - Villages Details`.
 * Caller must pass `key`. Optional `url`, `state_code`, `sector_code`.
 */
export async function syncCooperativesGpVillages(options?: {
  key?: string;
  state?: string;
  state_code?: string;
  sector_code?: string;
  url?: string;
}): Promise<SyncCooperativesGpVillagesResult> {
  const key = requireCooperativesKey(options?.key);

  const url = normalizeGpVillagesUrl(options?.url || DEFAULT_GP_VILLAGES_URL);
  const stateCode = options?.state ?? options?.state_code ?? DEFAULT_REQUEST_STATE_CODE;

  const body = {
    key,
    state: stateCode,
    state_code: stateCode,
    sector_code: options?.sector_code ?? DEFAULT_REQUEST_SECTOR_CODE
  };

  const payload = await cooperativesPost(url, body);
  const o = payload as Record<string, unknown>;
  const status = String(o.status ?? '').toLowerCase();
  if (status && status !== 'success') {
    const msg = typeof o.message === 'string' ? o.message : JSON.stringify(o.message ?? o);
    throw new AppError(`Cooperatives API: ${msg}`, 502);
  }

  const list = extractCooperativesGpVillageList(o);
  const result: SyncCooperativesGpVillagesResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  if (list.length === 0) {
    logger.warn('syncCooperativesGpVillages: cooperatives API returned no GP/village rows', {
      stateCode,
      topLevelKeys: Object.keys(o),
      dataKeys: o.data && typeof o.data === 'object' ? Object.keys(o.data as object) : [],
    });
  }

  await sequelize.transaction(async (t) => {
    for (const raw of list) {
      const r = unwrapGpVillageRow(raw);
      if (!r) {
        result.skipped += 1;
        continue;
      }

      const row = {
        ...resolveGpVillageRow(r),
        updated_at: new Date(),
      };

      if (row.village_code == null) {
        result.skipped += 1;
        continue;
      }

      try {
        const existing = await DistrictsBlocksGpVillage.findOne({
          where: { village_code: row.village_code },
          transaction: t
        });
        if (existing) {
          await existing.update(row, { transaction: t });
          result.updated += 1;
        } else {
          await DistrictsBlocksGpVillage.create({ ...row, created_at: new Date() }, { transaction: t });
          result.inserted += 1;
        }
      } catch (err: any) {
        result.errors.push({ message: sequelizeRowErrorMessage(err), row: raw });
      }
    }
  });

  logger.info('syncCooperativesGpVillages done', {
    stateCode,
    rowCount: list.length,
    inserted: result.inserted,
    updated: result.updated,
    skipped: result.skipped,
    errorCount: result.errors.length
  });
  if (result.skipped > 0 && result.inserted === 0 && result.updated === 0 && list.length > 0) {
    const sample = unwrapGpVillageRow(list[0]);
    logger.warn('syncCooperativesGpVillages: all rows skipped — check API field names', {
      stateCode,
      sampleKeys: sample ? Object.keys(sample) : [],
    });
  }

  try {
    const remap = await applyArunachalRuralDistrictRemap();
    (result as SyncCooperativesGpVillagesResult & { ruralRemap?: unknown }).ruralRemap = remap;
  } catch (remapErr: any) {
    logger.warn('syncCooperativesGpVillages: rural district remap failed (non-fatal)', {
      error: remapErr?.message || String(remapErr),
    });
  }

  return result;
}

/**
 * apiforblocksdata → `blocks` upsert by (`state_code`, `district_code`, `block_code`).
 * Each `result[]` item may wrap one row under key `Blocks Details`.
 * Caller must pass `key`. Optional `url`, `state_code`, `sector_code`.
 */
export async function syncCooperativesBlocks(options?: {
  key?: string;
  state_code?: string;
  sector_code?: string;
  url?: string;
}): Promise<SyncCooperativesBlocksResult> {
  const key = requireCooperativesKey(options?.key);

  const url = normalizeBlocksUrl(options?.url || DEFAULT_BLOCKS_URL);

  const body = {
    key,
    state: options?.state_code ?? DEFAULT_REQUEST_STATE_CODE,
    state_code: options?.state_code ?? DEFAULT_REQUEST_STATE_CODE,
    sector_code: options?.sector_code ?? DEFAULT_REQUEST_SECTOR_CODE
  };

  const payload = await cooperativesPost(url, body);
  const o = payload as Record<string, unknown>;
  const status = String(o.status ?? '').toLowerCase();
  if (status && status !== 'success') {
    const msg = typeof o.message === 'string' ? o.message : JSON.stringify(o.message ?? o);
    throw new AppError(`Cooperatives API: ${msg}`, 502);
  }

  const dataNode = (o as any).data;
  const list = Array.isArray(o.result)
    ? o.result
    : Array.isArray(o.message)
      ? o.message
      : Array.isArray(dataNode)
        ? dataNode
        : Array.isArray(dataNode?.blocks)
          ? dataNode.blocks
          : [];
  const result: SyncCooperativesBlocksResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  await sequelize.transaction(async (t) => {
    for (const raw of list) {
      if (!raw || typeof raw !== 'object') {
        result.skipped += 1;
        continue;
      }
      const wrapper = raw as Record<string, unknown>;
      const detail =
        wrapper[BLOCKS_DETAIL_KEY] ??
        wrapper['Blocks Details'] ??
        wrapper.block ??
        wrapper;
      if (!detail || typeof detail !== 'object') {
        result.skipped += 1;
        continue;
      }
      const r = detail as Record<string, unknown>;

      const state_code = num(r.state_code ?? r.state);
      const district_code = num(r.district_code);
      const block_code = num(r.block_code);
      const nameRaw = r.block_name ?? r.name;
      if (
        state_code == null ||
        district_code == null ||
        block_code == null ||
        nameRaw == null ||
        String(nameRaw).trim() === ''
      ) {
        result.skipped += 1;
        continue;
      }

      const row = {
        state_code,
        district_code,
        block_code,
        name: String(nameRaw).trim(),
        block_name_hindi: r.block_name_hindi != null ? String(r.block_name_hindi).trim() : null,
        name_local: r.name_local != null ? String(r.name_local).trim() : null,
        block_version: num(r.block_version),
        updated_at: new Date()
      };

      try {
        const existing = await Block.findOne({
          where: { state_code, district_code, block_code },
          transaction: t
        });
        if (existing) {
          await existing.update(row, { transaction: t });
          result.updated += 1;
        } else {
          await Block.create({ ...row, created_at: new Date() }, { transaction: t });
          result.inserted += 1;
        }
      } catch (err: any) {
        result.errors.push({ message: sequelizeRowErrorMessage(err), row: raw });
      }
    }
  });

  logger.info('syncCooperativesBlocks done', {
    inserted: result.inserted,
    updated: result.updated,
    skipped: result.skipped,
    errorCount: result.errors.length
  });

  try {
    const remap = await applyArunachalRuralDistrictRemap();
    (result as SyncCooperativesBlocksResult & { ruralRemap?: unknown }).ruralRemap = remap;
  } catch (remapErr: any) {
    logger.warn('syncCooperativesBlocks: rural district remap failed (non-fatal)', {
      error: remapErr?.message || String(remapErr),
    });
  }

  return result;
}

/**
 * apiforulbdata → `urban_local_bodies` upsert by `localbody_code`.
 * API returns flat rows in `result[]` (older payloads may nest under `Urban Local Bodies Details`).
 * Caller must pass `key`. Optional `url`, `state` / `state_code`, `sector_code`.
 */
export async function syncCooperativesUrbanLocalBodies(options?: {
  key?: string;
  state?: string;
  state_code?: string;
  sector_code?: string;
  url?: string;
}): Promise<SyncCooperativesUlbResult> {
  const key = requireCooperativesKey(options?.key);

  const url = normalizeUlbUrl(options?.url || DEFAULT_ULB_URL);
  const stateCode = options?.state ?? options?.state_code ?? DEFAULT_REQUEST_STATE_CODE;

  const body = {
    key,
    state: stateCode,
    state_code: stateCode,
    sector_code: options?.sector_code ?? DEFAULT_REQUEST_SECTOR_CODE
  };

  const payload = await cooperativesPost(url, body);
  const o = payload as Record<string, unknown>;
  const status = String(o.status ?? '').toLowerCase();
  if (status && status !== 'success') {
    const msg = typeof o.message === 'string' ? o.message : JSON.stringify(o.message ?? o);
    throw new AppError(`Cooperatives API: ${msg}`, 502);
  }

  const fallbackStateCode = num(o.state_code) ?? num(body.state);
  const fallbackStateName = o.state_name != null ? String(o.state_name).trim() : null;
  const list = extractCooperativesUlbList(o);
  const result: SyncCooperativesUlbResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  if (list.length === 0) {
    logger.warn('syncCooperativesUrbanLocalBodies: cooperatives API returned no ULB rows', {
      stateCode,
      topLevelKeys: Object.keys(o),
      dataKeys: o.data && typeof o.data === 'object' ? Object.keys(o.data as object) : [],
    });
  }

  await sequelize.transaction(async (t) => {
    for (const raw of list) {
      const r = unwrapUlbRow(raw);
      if (!r) {
        result.skipped += 1;
        continue;
      }

      const resolved = resolveUlbRow(r, {
        state_code: fallbackStateCode,
        state_name: fallbackStateName,
      });

      const row = {
        state_code: resolved.state_code ?? 0,
        state_name: resolved.state_name,
        district_code: resolved.district_code ?? 0,
        district_name: resolved.district_name ?? '',
        localbody_type_code: resolved.localbody_type_code ?? 0,
        localbody_type_name: resolved.localbody_type_name ?? '',
        localbody_type_name_hindi: resolved.localbody_type_name_hindi,
        localbody_code: resolved.localbody_code,
        local_body_name: resolved.local_body_name ?? '',
        local_body_name_hindi: resolved.local_body_name_hindi,
        updated_at: new Date(),
        is_active: true
      };

      if (
        row.localbody_code == null ||
        !row.state_code ||
        !row.district_code ||
        !row.district_name ||
        !row.localbody_type_code ||
        !row.localbody_type_name ||
        !row.local_body_name
      ) {
        result.skipped += 1;
        continue;
      }

      try {
        const existing = await UrbanLocalBody.findOne({
          where: { localbody_code: row.localbody_code },
          transaction: t
        });
        if (existing) {
          await existing.update(row, { transaction: t });
          result.updated += 1;
        } else {
          await UrbanLocalBody.create({ ...row, created_at: new Date() }, { transaction: t });
          result.inserted += 1;
        }
      } catch (err: any) {
        result.errors.push({ message: sequelizeRowErrorMessage(err), row: raw });
      }
    }
  });

  logger.info('syncCooperativesUrbanLocalBodies done', {
    stateCode,
    rowCount: list.length,
    inserted: result.inserted,
    updated: result.updated,
    skipped: result.skipped,
    errorCount: result.errors.length
  });
  if (result.skipped > 0 && result.inserted === 0 && result.updated === 0 && list.length > 0) {
    const sample = unwrapUlbRow(list[0]);
    logger.warn('syncCooperativesUrbanLocalBodies: all rows skipped — check API field names', {
      stateCode,
      sampleKeys: sample ? Object.keys(sample) : [],
    });
  }
  return result;
}

/**
 * apiforulbwarddata → `urban_local_bodies_wards` upsert by `ward_code`.
 * API returns flat rows in `result[]` (older payloads may nest under `Urban Local Bodies Ward Details`).
 * Caller must pass `key`. Optional `url`, `state` / `state_code`, `sector_code`.
 */
export async function syncCooperativesUrbanLocalBodiesWards(options?: {
  key?: string;
  state?: string;
  state_code?: string;
  sector_code?: string;
  url?: string;
}): Promise<SyncCooperativesUlbWardsResult> {
  const key = requireCooperativesKey(options?.key);

  const url = normalizeUlbWardUrl(options?.url || DEFAULT_ULB_WARD_URL);
  const stateCode = options?.state ?? options?.state_code ?? DEFAULT_REQUEST_STATE_CODE;

  const body = {
    key,
    state: stateCode,
    state_code: stateCode,
    sector_code: options?.sector_code ?? DEFAULT_REQUEST_SECTOR_CODE
  };

  const payload = await cooperativesPost(url, body);
  const o = payload as Record<string, unknown>;
  const status = String(o.status ?? '').toLowerCase();
  if (status && status !== 'success') {
    const msg = typeof o.message === 'string' ? o.message : JSON.stringify(o.message ?? o);
    throw new AppError(`Cooperatives API: ${msg}`, 502);
  }

  const fallbackStateCode = num(o.state_code) ?? num(body.state);
  const fallbackStateName = o.state_name != null ? String(o.state_name).trim() : null;
  const list = extractCooperativesUlbWardList(o);
  const result: SyncCooperativesUlbWardsResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  if (list.length === 0) {
    logger.warn('syncCooperativesUrbanLocalBodiesWards: cooperatives API returned no ward rows', {
      stateCode,
      topLevelKeys: Object.keys(o),
      dataKeys: o.data && typeof o.data === 'object' ? Object.keys(o.data as object) : [],
    });
  }

  await sequelize.transaction(async (t) => {
    for (const raw of list) {
      const r = unwrapUlbWardRow(raw);
      if (!r) {
        result.skipped += 1;
        continue;
      }

      const resolved = resolveUlbWardRow(r, {
        state_code: fallbackStateCode,
        state_name: fallbackStateName,
      });

      const row = {
        state_code: resolved.state_code ?? 0,
        state_name: resolved.state_name,
        local_body_code: resolved.local_body_code ?? 0,
        local_body_name: resolved.local_body_name ?? '',
        local_body_name_hindi: resolved.local_body_name_hindi,
        ward_code: resolved.ward_code,
        ward_name: resolved.ward_name ?? '',
        ward_name_hindi: resolved.ward_name_hindi,
        updated_at: new Date(),
        is_active: true
      };

      if (
        row.ward_code == null ||
        !row.state_code ||
        !row.local_body_code ||
        !row.local_body_name ||
        !row.ward_name
      ) {
        result.skipped += 1;
        continue;
      }

      try {
        const existing = await UrbanLocalBodiesWard.findOne({
          where: { ward_code: row.ward_code },
          transaction: t
        });
        if (existing) {
          await existing.update(row, { transaction: t });
          result.updated += 1;
        } else {
          await UrbanLocalBodiesWard.create({ ...row, created_at: new Date() }, { transaction: t });
          result.inserted += 1;
        }
      } catch (err: any) {
        result.errors.push({ message: sequelizeRowErrorMessage(err), row: raw });
      }
    }
  });

  logger.info('syncCooperativesUrbanLocalBodiesWards done', {
    stateCode,
    rowCount: list.length,
    inserted: result.inserted,
    updated: result.updated,
    skipped: result.skipped,
    errorCount: result.errors.length
  });
  if (result.skipped > 0 && result.inserted === 0 && result.updated === 0 && list.length > 0) {
    const sample = unwrapUlbWardRow(list[0]);
    logger.warn('syncCooperativesUrbanLocalBodiesWards: all rows skipped — check API field names', {
      stateCode,
      sampleKeys: sample ? Object.keys(sample) : [],
    });
  }
  return result;
}
