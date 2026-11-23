export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: any;
  roleDescription?: string;
  is_active?: boolean;
  is_available?: boolean;
  unavailable_since?: string | null;
  unavailable_until?: string | null;
  unavailable_reason?: string | null;
  created_at?: string;
  permissions?: any[];
  society?: any;
  district?: any;
  state?: any;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource?: string;
  action?: string;
  is_active?: boolean;
}
export interface Registration {
    id: string,
    applicationId: string,
    societyName: string,
    mobileNumber: string,
    typeOfSociety: string,
    status: string,
    createdAt: string,
    isActive: any
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
}

export interface FileUploadType {
  name: string;
  size: number;
  type: string;
  url?: string;
}

export interface SocietyRegistrationData {
  name: string;
  pan: string;
  resolutionDate: string;
  formationDate: string;
  resolutionNumber: string;
  memberConsent: boolean;
  images: FileUpload[];
  documents: FileUpload[];
}

export interface Application {
  id: string;
  type: string;
  date: string;
  status: 'approved' | 'pending' | 'rejected' | 'query-raised' | 'draft';
  applicantId: string;
  applicantName?: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  documents?: string[];
}

export interface DashboardStats {
  totalApplications: number;
  pendingApprovals: number;
  upcomingElections: number;
  auditDue: number;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  timestamp: string;
  isRead: boolean;
}

export interface FormDraft {
  id: string;
  moduleType: string;
  data: any;
  savedAt: string;
  userId: string;
  title: string;
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  path: string;
  category: 'module' | 'setting' | 'feature';
}

export interface FileUpload {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadedAt: string;
}

export type ThemeMode = 'light' | 'dark';

export interface AnnualReturnForm {
  societyName: string;
  registrationNumber: string;
  financialYear: string;
  totalMembers: number;
  totalShares: number;
  paidUpCapital: number;
  reserveFunds: number;
  auditedBy: string;
  auditDate: string;
  documents: FileUpload[];
  declaration: boolean;
}

export interface AmendmentForm {
  amendmentType: 'bylaws' | 'memorandum' | 'rules' | 'other';
  currentProvision: string;
  proposedAmendment: string;
  reasonForAmendment: string;
  resolutionDate: string;
  resolutionNumber: string;
  supportingDocuments: FileUpload[];
  memberConsent: boolean;
}

export interface Amendment {
  id: string;
  amendment_id: string;
  amendment_type: string;
  chairperson_name: string;
  chairperson_address: string;
  chairperson_contact: string;
  signatory_name: string;
  signatory_address: string;
  signatory_contact: string;
  members: Member[];
  resolution_extract: string;
  general_body_meeting_date: string;
  notice_days: number;
  notice_date: string;
  total_members: number;
  quorum_required: number;
  members_present: number;
  members_voted: number;
  votes_in_favour: number;
  votes_against: number;
  bylaw_number: string;
  existing_byelaw_media_id: string;
  new_proposed_byelaw_media_id: string;
  reason_for_amendment: string;
  proposed_bylaw_text: string;
  status: 'pending' | 'approved' | 'rejected' | 'draft';
  priority: 'high' | 'medium' | 'low';
  created_at: string;
  updated_at: string;
  documents: FileUpload[];
  // Media files for bylaws
  existingByelawMedia?: FileUpload;
  newProposedByelawMedia?: FileUpload;
  // Additional documents
  attendanceSheetMedia?: FileUpload;
  minutesOfMeetingMedia?: FileUpload;
  circularNoticeMedia?: FileUpload;
}

export interface AmendmentFormData {
  // Chairperson/CEO/President/MD Details
  chairperson_name: string;
  chairperson_address: string;
  chairperson_contact: string;
  
  // Signatory Details
  signatory_name: string;
  signatory_address: string;
  signatory_contact: string;
  
  // Society Type and Previous Application
  society_type: string;
  registration_number_of_previous_application?: string;
  
  // Members (replacing board members)
  members: Member[];
  
  // Resolution Details
  resolution_extract: string;
  general_body_meeting_date: string;
  notice_days: number;
  notice_date: string;
  
  // Meeting Details
  total_members: number;
  quorum_required: number;
  members_present: number;
  members_voted: number;
  votes_in_favour: number;
  votes_against: number;
  
  // Amendment Details
  byelaw_number: string;
  existing_byelaw_media_id: string;
  new_proposed_byelaw_media_id: string;
  reason_for_amendment: string;
  proposed_bylaw_text: string;
  
  // Additional Documents
  attendance_sheet_media_id?: string;
  minutes_of_meeting_media_id?: string;
  circular_notice_media_id?: string;
  meeting_notice_agenda_media_id?: string;
  district_drcs_arcs_recommendation_media_id?: string;
  
  // Documents
  documents: FileUpload[];
  
  // Additional Data for Cooperative Society
  additional_data?: any;
}

export interface Society {
  id: string;
  name: string;
  pan: string;
  address: string;
  registrationNumber: string;
  memberConsent: boolean;
  images: string;
  documents: any[];
}

export interface Member {
  id?: string;
  name: string;
  mobile: string;
  gender: string;
  category: string;
  designation: string;
  is_co_opted?: boolean;
  is_bod?: boolean;
  shareholder_category?: string;
}

export interface DeletedAmendmentMember {
  member_id?: string | null;
  name: string;
  mobile?: string | null;
  gender?: string | null;
  category?: string | null;
  designation?: string | null;
  deletion_reason: string;
  supporting_document_media_id?: string;
  supportingDocumentMedia?: { id: string; url: string; file_name?: string; original_name?: string } | null;
  deleted_at?: string;
}

export interface SocietyFormData {
  id?: string;
  society_id?: string;
  cooperative_society_name: string;
  local_langauge_society_name: string;
  registration_authoritie_id: string;
  reference_year: number;
  date_registration: string;
  is_adjacent_to_water_body: string;
  cooperative_society_type_id: string;
  area_of_operation_id: string;
  water_body_type_id: string;
  sector_of_operation_type: string;
  sector_of_operation: string;
  functional_status: string;
  location_of_head_quarter: string;
  state_id: string;
  district_id: string;
  district_code: string; // Store district code for filtering
  block_id: string;
  block_code: string; // Store block code for filtering
  gram_panchayat_id: string;
  gram_panchayat_code: string; // Store gram panchayat code for filtering
  village_code: string;
  urban_local_body_type: string;
  urban_local_body_code: string;
  locality_ward_code: string;
  pincode: string;
  full_address: string;
  address_line: string;
  status?: any;
  contact_person: string;
  designation: string;
  mobile: string;
  landline: string;
  email: string;
  bank_type: string;
  financial_audit: string;
  audit_complete_year: string;
  category_audit: string;
  is_profit_making: string;
  annual_turnover: number | string | '0';
  annual_profit: number | string | '0';
  annual_loss: number | string | '0';
  is_msme: number;
  udyam_no: string;
  is_dividend_paid: string;
  dividend_rate: number;
  society_type: string;
  operation_area_location: string;
  cooperative_society_bank_id: string;
  other_bank: string;

  pan_no: string;
  gst_no: string;
  how_many_branches: string;
  secretary_name: string;
  mobile_number_of_secretary: string;
  full_time_secretary: string;

  // NEW FIELDS
  is_affiliated_union_federation: string;
  affiliated_union_level: string;
  affiliated_union_name: string;

  members: Member[];
  // Agreements
  email_agreement: boolean;
  terms_agreement: boolean;

  // Documents
  non_family_coop_certificate: string;
  site_inspection_report: string;
  circular_minutes_of_meeting: string;
  land_document: string;
  full_particulars_of_the_promoter: string;
  circular_for_promoters_meeting: string;
  minutes_of_meeting_of_promoters_meeting: string;
  additional_data: any;
}

export interface AuditRequestData {
  society_registration_id: string;
  financial_year: string;
  auditor_name: string;
  auditor_registration_number: string;
  audit_completion_date: string;
  audit_classification: 'A' | 'B' | 'C' | 'D';
  agm_date?: string;
  bod_meeting_date?: string;
  agm_total_members_on_roll?: number;
  agm_members_attended?: number;
  bod_total_members_on_roll?: number;
  bod_members_attended?: number;
  turnover?: number;
  profit_loss?: number;
  profit_loss_type?: 'profit' | 'loss' | null;
  gross_profit?: number;
  working_capital?: number;
  accumulated_profit?: number;
  accumulated_loss?: number;
  audit_fee_paid?: number;
  declaration_accepted: boolean;
  additional_notes?: string;
  agm_bod_minutes: FileUpload[];
  auditor_appointment_letter: FileUpload[];
  registration_certificate: FileUpload[];
  abstract_closing_stock: FileUpload[];
  asset_list_depreciation: FileUpload[];
  shareholder_list: FileUpload[];
  vital_stats_form: FileUpload[];
  audit_note: FileUpload[];
  audit_accounts: FileUpload[];
}

export interface AnnualFiling {
  id: string;
  society_id: string;
  financial_year: string;
  auditor_name?: string;
  auditor_registration_no?: string;
  audit_completion_date?: string;
  audit_remarks?: string;
  audit_report_media_id?: string;
  agm_minutes_media_id?: string;
  status?: string;
  status_changed_by?: string;
  status_changed_at?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  
  // Association properties
  society?: any;
  statusDetails?: any;
  auditReportMedia?: any;
  agmMinutesMedia?: any;
  createdByUser?: any;
  updatedByUser?: any;
}

export interface InspectionForm {
  societyName: string;
  inspectionType: 'inspection' | 'liquidation';
  inspectionDate: string;
  inspectorName: string;
  reasonForInspection: string;
  remarks?: string;
  reportFile: FileUpload;
  followUpRequired: boolean;
  followUpDueDate?: string;
}

export interface Inspection {
  id: string;
  inspection_id: string;
  society_id: string;
  inspection_type: 'inspection' | 'liquidation';
  inspection_date: string;
  inspector_name: string;
  reason_for_inspection: string;
  remarks?: string;
  report_file_id?: string;
  follow_up_required: boolean;
  follow_up_due_date?: string;
  status: 'pending' | 'completed' | 'follow_up_required';
  created_at: string;
  updated_at: string;
  
  // Association properties
  society?: any;
  reportFile?: any;
}

export interface LiquidationForm {
  // Basic Society Information - using exact DB field names
  society_id: string;
  society_registration_number: string;
  society_name: string;
  society_type: string; // Store ID as number
  address: string;
  date_of_original_registration: string;
  date_of_minutes_meeting: string;
  minutes_meeting_media_id?: string;
  attendance_sheet_media_id?: string;
  date_of_circular_notice: string;
  circular_notice_media_id?: string;
  
  // Liquidation Order Details
  liquidation_order_number: string;
  date_of_liquidation_order: string;
  mode_of_liquidation: 'voluntary' | 'compulsory';
  reason_for_liquidation: string;
  
  // Financial Position at Liquidation Start
  total_assets: string;
  total_liabilities: string;
  net_position: string;
  share_capital_paid_up: string;
  reserve_funds: string;
  creditors_list_media_id?: string;
  members_list_media_id?: string;
  
  // Status and audit fields
  status?: string;
  liquidation_person?: string;
  created_by?: string;
  active?: boolean;
  declaration_accepted: boolean;
}

export interface Liquidation {
  id: string;
  society_id: string;
  society_registration_number: string;
  society_name: string;
  society_type: string; // Store ID as number
  address: string;
  date_of_original_registration: string;
  date_of_minutes_meeting: string;
  minutes_meeting_media_id?: string;
  attendance_sheet_media_id?: string;
  date_of_circular_notice: string;
  circular_notice_media_id?: string;
  liquidation_order_number: string;
  date_of_liquidation_order: string;
  mode_of_liquidation: 'voluntary' | 'compulsory';
  reason_for_liquidation: string;
  total_assets: number;
  total_liabilities: number;
  net_position: number;
  share_capital_paid_up: number;
  reserve_funds: number;
  creditors_list_media_id?: string;
  members_list_media_id?: string;
  status?: string;
  liquidation_person?: string;
  created_by?: string;
  active?: boolean;
  created_at: string;
  updated_at: string;
  
  // Association properties
  society?: any;
  societyType?: any; // Added to store society type details
  minutesMeetingMedia?: any;
  attendanceSheetMedia?: any;
  circularNoticeMedia?: any;
  creditorsListMedia?: any;
  membersListMedia?: any;
}

export interface ElectionRequest {
  id: string;
  society_registration_id: string;
  last_election_held_date: string;
  last_elected_committee_expiry_date: string;
  reason_for_election_request: 'Regular Term' | 'Early Dissolution' | 'Court Order' | 'Other';
  proposed_election_date: string;
  proposed_venue: string;
  number_of_members_eligible_to_vote: number;
  member_list_media_id?: string;
  meeting_resolution_copy_media_id?: string;
  previous_election_report_media_id?: string;
  status_id?: string;
  submission_date?: string;
  assigned_officer_id?: string;
  officer_review_date?: string;
  approval_order_issued: boolean;
  approval_order_number?: string;
  approval_order_date?: string;
  approval_order_document_path?: string;
  rejection_reason?: string;
  rejection_date?: string;
  additional_notes?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  
  // Association properties
  societyRegistration?: any;
  status?: any;
  memberListMedia?: any;
  meetingResolutionCopyMedia?: any;
  previousElectionReportMedia?: any;
  createdBy?: any;
  updatedBy?: any;
  assignedOfficer?: any;
}

export interface Appeal {
  id: string;
  appeal_id: string; // Auto-generated
  appellant_type: 'society' | 'member';
  society_registration_no?: string; // Lookup if society
  appellant_name: string;
  appellant_contact: string;
  appellant_email: string;
  
  // Order Details
  order_type: 'registration' | 'election' | 'liquidation' | 'penalty' | 'other';
  order_number: string;
  order_date: string;
  
  // Appeal Details
  grounds_of_appeal: string;
  relief_sought: string;
  supporting_documents_media_id?: string;
  filing_date: string; // Auto-generated
  
  // Review Details (Officer/Appellate Authority)
  officer_remarks?: string;
  hearing_date?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'modified' | 'sent_back_for_review';
  final_decision_remarks?: string;
  decision_order_media_id?: string;
  decision_date?: string;
  
  // Audit fields
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  
  // Association properties
  society?: any;
  supportingDocumentsMedia?: any;
  decisionOrderMedia?: any;
  createdBy?: any;
  updatedBy?: any;
}

export interface EnquiryInspection {
  id: string;
  enquiry_id: string; // Auto-generated
  applicant_name: string;
  applicant_type: 'member' | 'office_bearer' | 'general_public' | 'other';
  contact_number: string;
  email_id: string;
  address: string;
  
  // Society Details
  society_registration_number: string;
  society_name: string;
  society_address: string;
  district: string;
  subdivision: string;
  state: string;
  
  // Enquiry/Inspection Details
  subject_reason: 'complaint' | 'irregularity' | 'routine_check' | 'other';
  detailed_description: string;
  preferred_office_level: 'state' | 'district' | 'subdivision';
  incident_date?: string;
  
  // Supporting Information
  supporting_documents_media_id?: string;
  previous_reference_number?: string;
  
  // Status and Review
  status: 'pending' | 'under_review' | 'in_progress' | 'completed' | 'rejected';
  officer_remarks?: string;
  assigned_officer_id?: string;
  review_date?: string;
  completion_date?: string;
  completion_remarks?: string;
  
  // Audit fields
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  
  // Association properties
  society?: any;
  supportingDocumentsMedia?: any;
  assignedOfficer?: any;
  createdBy?: any;
  updatedBy?: any;
}

export interface AnnualGeneralMeeting {
  id: string;
  society_id: string;
  society_name: string;
  meeting_date: string;
  chairman_name?: string;
  total_shareholders: number;
  attended_shareholders: number;
  media_id?: string;
  minutes_of_meeting_id?: string;
  notice_id?: string;
  attendance_sheet_id?: string;
  issued_proceedings_document_id?: string;
  comments?: string;
  elected_bod_members?: ElectedBodMember[];
  deleted_members?: DeletedAmendmentMember[];
  created_by?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  status?: { id: string; key: string; title: string };
  statusDetails?: { id: string; key: string; title: string };
  
  // Association properties
  society?: any;
  media?: any;
  issuedProceedingsDocument?: { id: string; url: string };
  createdBy?: any;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface AnnualGeneralMeetingForm {
  society_id: string;
  society_name: string;
  meeting_date: string;
  chairman_name?: string;
  total_shareholders: number;
  attended_shareholders: number;
  media_id?: string;
  minutes_of_meeting_id?: string;
  notice_id?: string;
  attendance_sheet_id?: string;
  comments?: string;
  elected_bod_members?: ElectedBodMember[];
  deleted_members?: DeletedAmendmentMember[];
  declaration_accepted: boolean;
}

export interface ElectedBodMember {
  member_id?: string;
  name: string;
  designation: string;
  gender?: string;
  category?: string;
  mobile?: string;
  is_co_opted?: boolean;
  is_selected_for_bod?: boolean;
  shareholder_category?: string;
}

export interface BodMeeting extends AnnualGeneralMeeting {}

export interface BodMeetingForm extends AnnualGeneralMeetingForm {}

export interface SpecialAnnualGeneralMeeting {
  id: string;
  society_id: string;
  society_name: string;
  notice_id: string;
  meeting_date: string;
  total_shareholders: number;
  attended_shareholders: number;
  attendance_sheet_id?: string;
  minutes_of_meeting_id?: string;
  comments?: string;
  elected_bod_members?: ElectedBodMember[];
  deleted_members?: DeletedAmendmentMember[];
  created_by?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  
  // Association properties
  society?: any;
  media?: any;
  createdBy?: any;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface SpecialAnnualGeneralMeetingForm {
  society_id: string;
  society_name: string;
  notice_id: string;
  meeting_date: string;
  total_shareholders: number;
  attended_shareholders: number;
  attendance_sheet_id?: string;
  minutes_of_meeting_id?: string;
  comments?: string;
  elected_bod_members?: ElectedBodMember[];
  deleted_members?: DeletedAmendmentMember[];
}

export interface ConversionSociety {
  id: string;
  status: string;
  created_at: string;

  society: {
    registration_number: string;
    cooperative_society_name: string;
  };

  conversionFrom: {
    name: string;
  };

  conversionTo: {
    name: string;
  };

  statusDetails: {
    key: string;
    title: string;
  };
}