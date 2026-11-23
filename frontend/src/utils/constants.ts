import moment from "moment";
import { SocietyFormData } from "../types";
import logo from "../assets/images/02c8b4d8-fe4e-4aa7-91e5-fde6d9679376.jpg";

export const appLogo = logo;

export const appName = "Society"
export const maxSize = 10 * 1024 * 1024; // 10MB (matches backend multer limit)

export const areaOfOperationList = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export const steps = [
  { id: 1, title: 'Basic Details' },
  { id: 2, title: 'Sector & Membership Details' },
  { id: 3, title: 'Financial & Administrative Details' },
  { id: 4, title: 'Declaration' },
];

export const societyInitialValues: SocietyFormData = {
  cooperative_society_name: '',
  local_langauge_society_name: '',
  cooperative_society_type_id: '',
  area_of_operation_id: '',
  water_body_type_id: '',
  sector_of_operation_type: '',
  sector_of_operation: '',
  society_type: '',
  functional_status: '',
  location_of_head_quarter: '',
  state_id: '',
  district_id: '',
  block_id: '',
  gram_panchayat_id: '',
  village_code: '',
  urban_local_body_type: '',
  urban_local_body_code: '',
  locality_ward_code: '',
  pincode: '',
  full_address: '',
  address_line: '',
  contact_person: '',
  designation: '',
  mobile: '',
  district_code: '',
  block_code: '',
  gram_panchayat_code: '',
  landline: '',
  email: '',
  financial_audit: '',
  audit_complete_year: '',
  category_audit: '',
  is_profit_making: '',
  annual_turnover: 0,
  annual_profit: 0,
  annual_loss: 0,
  is_msme: 0,
  udyam_no: '',
  is_dividend_paid: '',
  dividend_rate: 0,
  gst_no: '',
  pan_no: '',
  operation_area_location: '',
  bank_type: '',
  cooperative_society_bank_id: '',
  other_bank: '',
  how_many_branches: '',
  secretary_name: '',
  mobile_number_of_secretary: '',
  full_time_secretary: '',
  reference_year: moment().year(),
  date_registration: moment().format('YYYY-MM-DD'),
  registration_authoritie_id: '',
  members: [],
  email_agreement: false,
  terms_agreement: false,
  is_adjacent_to_water_body: '',

  // NEW FIELDS
  is_affiliated_union_federation: '',
  affiliated_union_level: '',
  affiliated_union_name: '',

  non_family_coop_certificate: '',
  site_inspection_report: '',
  circular_minutes_of_meeting: '',
  land_document: '',
  full_particulars_of_the_promoter: '',
  circular_for_promoters_meeting: '',
  minutes_of_meeting_of_promoters_meeting: '',
  additional_data: null,
}