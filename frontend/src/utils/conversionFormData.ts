const SOCIETY_FORM_TYPE_LABELS: Record<string, string> = {
  CooperativeRegistrationsAgriculture: "Agriculture Cooperative Society",
  cooperative_registrations_agriculture: "Agriculture Cooperative Society",
  CooperativeRegistrationsProcessing: "Processing Cooperative Society",
  cooperative_registrations_processing: "Processing Cooperative Society",
  CooperativeRegistrationsBee: "Bee Keeping Cooperative Society",
  cooperative_registrations_bee: "Bee Keeping Cooperative Society",
  CooperativeRegistrationsConsumer: "Consumer Cooperative Society",
  cooperative_registrations_consumer: "Consumer Cooperative Society",
  CooperativeRegistrationsCreditThrift: "Credit & Thrift Cooperative Society",
  cooperative_registrations_credit_thrift: "Credit & Thrift Cooperative Society",
  CooperativeRegistrationDairy: "Dairy Cooperative Society",
  cooperative_registration_dairy: "Dairy Cooperative Society",
  CooperativeRegistrationsEducation: "Education Cooperative Society",
  cooperative_registrations_education: "Education Cooperative Society",
  CooperativeRegistrationFarmer: "Farmer Cooperative Society",
  cooperative_registration_farmer: "Farmer Cooperative Society",
  CooperativeRegistrationFishery: "Fishery Cooperative Society",
  cooperative_registration_fishery: "Fishery Cooperative Society",
  CooperativeRegistrationsHandicraft: "Handicraft Cooperative Society",
  cooperative_registrations_handicraft: "Handicraft Cooperative Society",
  CooperativeRegistrationsHandloom: "Handloom Cooperative Society",
  cooperative_registrations_handloom: "Handloom Cooperative Society",
  CooperativeRegistrationsHousing: "Housing Cooperative Society",
  cooperative_registrations_housing: "Housing Cooperative Society",
  CooperativeRegistrationsJute: "Jute Cooperative Society",
  cooperative_registrations_jute: "Jute Cooperative Society",
  CooperativeRegistrationsLabour: "Labour Cooperative Society",
  cooperative_registrations_labour: "Labour Cooperative Society",
  CooperativeRegistrationLargeArea: "Large Area Multipurpose Cooperative Society",
  cooperative_registration_large_area: "Large Area Multipurpose Cooperative Society",
  CooperativeRegistrationsLivestock: "Livestock Cooperative Society",
  cooperative_registrations_livestock: "Livestock Cooperative Society",
  CooperativeRegistrationsMarketing: "Marketing Cooperative Society",
  cooperative_registrations_marketing: "Marketing Cooperative Society",
  CooperativeRegistrationsCmiscellaneous: "Miscellaneous (Central) Cooperative Society",
  cooperative_registrations_cmiscellaneous: "Miscellaneous (Central) Cooperative Society",
  CooperativeRegistrationsMiscellaneous: "Miscellaneous Cooperative Society",
  cooperative_registrations_miscellaneous: "Miscellaneous Cooperative Society",
  CooperativeRegistrationsMulti: "Multipurpose Cooperative Society",
  cooperative_registrations_multi: "Multipurpose Cooperative Society",
  CooperativeRegistrationsPrimary: "Primary Cooperative Society",
  cooperative_registration_primary: "Primary Cooperative Society",
  CooperativeRegistrationsSericulture: "Sericulture Cooperative Society",
  cooperative_registrations_sericulture: "Sericulture Cooperative Society",
  CooperativeRegistrationsSocial: "Social Cooperative Society",
  cooperative_registrations_social: "Social Cooperative Society",
  CooperativeRegistrationsSugar: "Sugar Cooperative Society",
  cooperative_registrations_sugar: "Sugar Cooperative Society",
  CooperativeRegistrationsTourism: "Tourism Cooperative Society",
  cooperative_registrations_tourism: "Tourism Cooperative Society",
  CooperativeRegistrationsTransport: "Transport Cooperative Society",
  cooperative_registrations_transport: "Transport Cooperative Society",
  CooperativeRegistrationsTribal: "Tribal Cooperative Society",
  cooperative_registrations_tribal: "Tribal Cooperative Society",
  CooperativeRegistrationsUcb: "Urban Cooperative Bank",
  cooperative_registrations_ucb: "Urban Cooperative Bank",
  CooperativeRegistrationsWocoop: "Workers Cooperative Society",
  cooperative_registrations_wocoop: "Workers Cooperative Society",
  CooperativeRegistrationsKhadiGram: "Khadi Gram Cooperative Society",
  cooperative_registrations_khadi_gram: "Khadi Gram Cooperative Society",
};

const COOPERATIVE_FIELD_LABELS: Record<string, string> = {
  society_form_type: "Society Form Type",
  authorised_share: "Authorised Share Capital (Rs)",
  paid_up_members: "Shareholders' Contribution / Promoters (Rs)",
  paid_up_government_bodies: "Government Bodies Share Capital (Rs)",
  paid_up_total: "Total Paid Up Share Capital (Rs)",
  paid_up_share_date: "Paid Up Share Date",
  annual_turn_over: "Annual Turnover (Rs)",
  total_deposit: "Total Deposit (Rs)",
  total_deposit_members: "Members' Deposits (Rs)",
  individual_member: "Individual Members",
  institutional_member: "Institutional Members",
  total_member: "Total Members",
  pack_total_outstanding_loan: "Total Outstanding Loan (Rs)",
  sec_activity: "Secondary Activities",
  type_society: "Type of Society",
  has_building: "Has Building",
  building_type: "Building Type",
  has_storage: "Has Storage Facility",
  storage_capacity: "Storage Capacity",
  provide_raw: "Provides Raw Material",
  guidance_by_member: "Guidance by Members",
  is_operate_retail: "Operates Retail Shops",
  no_of_retail: "Number of Retail Shops",
  is_product_sale_out: "Sells Products Outside Area",
  facilities: "Facilities",
  processing_unit: "Has Processing Unit",
  processing_unit_number: "Number of Processing Units",
  processing_by_members: "Processing by Members",
  work_divided: "Work Divided by Skill",
};

const YES_NO_FIELDS = new Set([
  "has_building",
  "has_storage",
  "provide_raw",
  "guidance_by_member",
  "is_operate_retail",
  "is_product_sale_out",
  "processing_unit",
  "processing_by_members",
  "work_divided",
]);

const CURRENCY_FIELDS = new Set([
  "authorised_share",
  "paid_up_members",
  "paid_up_government_bodies",
  "paid_up_total",
  "annual_turn_over",
  "total_deposit",
  "total_deposit_members",
  "pack_total_outstanding_loan",
]);

/** Human-readable label for cooperative-form field keys. */
export const getConversionFieldLabel = (key: string): string => {
  if (COOPERATIVE_FIELD_LABELS[key]) return COOPERATIVE_FIELD_LABELS[key];
  return key
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const toSnakeCaseKey = (key: string): string =>
  key
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();

const pascalCaseToLabel = (key: string): string =>
  key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^Cooperative Registrations? /i, "")
    .replace(/^Cooperative Registration /i, "")
    .trim();

export const formatSocietyFormType = (key: string): string => {
  const normalized = String(key || "").trim();
  if (!normalized) return "-";

  if (SOCIETY_FORM_TYPE_LABELS[normalized]) {
    return SOCIETY_FORM_TYPE_LABELS[normalized];
  }

  const snakeKey = toSnakeCaseKey(normalized);
  if (SOCIETY_FORM_TYPE_LABELS[snakeKey]) {
    return SOCIETY_FORM_TYPE_LABELS[snakeKey];
  }

  const label = pascalCaseToLabel(normalized);
  return label ? `${label} Cooperative Society` : normalized;
};

export const formatCooperativeFieldValue = (
  key: string,
  value: unknown,
): string => {
  if (value === null || value === undefined || value === "") return "-";

  if (key === "society_form_type") {
    return formatSocietyFormType(String(value));
  }

  if (YES_NO_FIELDS.has(key)) {
    if (value === 1 || value === "1" || value === true) return "Yes";
    if (value === 0 || value === "0" || value === false) return "No";
  }

  if (CURRENCY_FIELDS.has(key) && !Number.isNaN(Number(value))) {
    return `₹ ${Number(value).toLocaleString("en-IN")}`;
  }

  if (typeof value === "number") {
    return value.toLocaleString("en-IN");
  }

  return String(value);
};

/**
 * Flatten nested cooperative form payload
 * e.g. { CooperativeRegistrationsMulti: [{ authorised_share, ... }] }
 */
export const normalizeConversionFormData = (
  data: unknown,
): Record<string, unknown> | null => {
  if (data == null) return null;

  let parsed: unknown = data;
  if (typeof data === "string") {
    try {
      parsed = JSON.parse(data);
    } catch {
      return null;
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  const record = parsed as Record<string, unknown>;
  const keys = Object.keys(record);

  if (keys.length === 1 && Array.isArray(record[keys[0]])) {
    const first = (record[keys[0]] as unknown[])[0];
    if (first && typeof first === "object" && !Array.isArray(first)) {
      return {
        society_form_type: keys[0],
        ...(first as Record<string, unknown>),
      };
    }
  }

  return record;
};

export const hasConversionFormData = (data: unknown): boolean => {
  const normalized = normalizeConversionFormData(data);
  return Boolean(normalized && Object.keys(normalized).length > 0);
};
