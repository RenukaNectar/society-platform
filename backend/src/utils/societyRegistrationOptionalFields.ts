/**
 * Society registration fields that may be omitted or sent as empty strings.
 * Empty / whitespace-only values are stored as null (avoids invalid FK references).
 */
export const SOCIETY_REGISTRATION_OPTIONAL_NULLABLE_FIELDS = [
  'block_id',
  'gram_panchayat_id',
  'village_code',
  'urban_local_body_type',
  'urban_local_body_code',
  'locality_ward_code'
] as const;

export type SocietyRegistrationOptionalNullableField =
  (typeof SOCIETY_REGISTRATION_OPTIONAL_NULLABLE_FIELDS)[number];

const RURAL_GEO_FIELDS = ['block_id', 'gram_panchayat_id', 'village_code'] as const;
const URBAN_GEO_FIELDS = [
  'urban_local_body_type',
  'urban_local_body_code',
  'locality_ward_code'
] as const;

function unwrapId(value: unknown): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value) && 'id' in (value as object)) {
    return (value as { id?: unknown }).id;
  }
  return value;
}

function geoToken(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value === 'object' && !Array.isArray(value)) {
    const o = value as { name?: unknown; key?: unknown; id?: unknown };
    const name = String(o.name ?? o.key ?? '')
      .trim()
      .toLowerCase();
    if (name) return name;
    return String(o.id ?? '')
      .trim()
      .toLowerCase();
  }
  return String(value).trim().toLowerCase();
}

/** LocationType: 1 = Urban, 2 = Rural. Also accepts "urban" / "rural". */
function resolveSocietyGeoCategory(
  locationOfHeadQuarter?: unknown,
  operationAreaLocation?: unknown
): 'urban' | 'rural' | null {
  const tokens = [geoToken(locationOfHeadQuarter), geoToken(operationAreaLocation)].filter(Boolean);
  for (const t of tokens) {
    if (t === '1' || t === 'urban' || t === 'u') return 'urban';
    if (t === '2' || t === 'rural' || t === 'r') return 'rural';
  }
  return null;
}

/**
 * Urban → rural geo columns always null (even if client sent them).
 * Rural → urban geo columns always null (even if client sent them).
 */
export function applyHqGeoExclusiveFields<T extends Record<string, unknown>>(
  data: T,
  existing?: Record<string, unknown> | null
): T {
  const out: Record<string, unknown> = { ...data };
  const pick = (key: string) => (key in out ? out[key] : existing?.[key]);

  if ('location_of_head_quarter' in out) {
    out.location_of_head_quarter = unwrapId(out.location_of_head_quarter);
  }

  const category = resolveSocietyGeoCategory(
    pick('location_of_head_quarter'),
    pick('operation_area_location')
  );

  if (category === 'urban') {
    for (const key of RURAL_GEO_FIELDS) out[key] = null;
  }
  if (category === 'rural') {
    for (const key of URBAN_GEO_FIELDS) out[key] = null;
  }

  return out as T;
}

/** Map common client field names to DB column names. */
export function mapSocietyRegistrationBodyAliases(
  data: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };

  // Keep pan/gst for NCD (do not strip). Alias pan_number → pan_no.
  if (out.pan_number != null && out.pan_no == null) {
    out.pan_no = out.pan_number;
  }
  delete out.pan_number;

  if (out.secretary_mobile_number != null && out.mobile_number_of_secretary == null) {
    out.mobile_number_of_secretary = out.secretary_mobile_number;
  }
  delete out.secretary_mobile_number;

  if (out.secretary_mobile != null && out.mobile_number_of_secretary == null) {
    out.mobile_number_of_secretary = out.secretary_mobile;
  }
  delete out.secretary_mobile;

  if (out.local_bodies != null && out.urban_local_body_code == null && out.urban_local_body_type == null) {
    out.urban_local_body_code = out.local_bodies;
  }
  delete out.local_bodies;

  if (out.local_body_ward != null && out.locality_ward_code == null) {
    out.locality_ward_code = out.local_body_ward;
  }
  delete out.local_body_ward;

  if (out.gram_panchayat != null && out.gram_panchayat_id == null) {
    out.gram_panchayat_id = out.gram_panchayat;
  }
  delete out.gram_panchayat;

  return out;
}

function toNullableOptionalValue(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
  return String(value);
}

export function normalizeOptionalSocietyRegistrationFields<T extends Record<string, unknown>>(
  data: T,
  existing?: Record<string, unknown> | null
): T {
  const mapped = mapSocietyRegistrationBodyAliases(data as Record<string, unknown>);
  const out = { ...mapped } as T;

  for (const key of SOCIETY_REGISTRATION_OPTIONAL_NULLABLE_FIELDS) {
    if (!(key in out)) continue;
    const normalized = toNullableOptionalValue((out as Record<string, unknown>)[key]);
    if (normalized !== undefined) {
      (out as Record<string, unknown>)[key] = normalized;
    }
  }

  return applyHqGeoExclusiveFields(out, existing);
}
