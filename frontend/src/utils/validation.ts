import { z } from 'zod';
import { SocietyFormData } from '../types';

export const TEN_DIGIT_MOBILE_REGEX = /^\d{10}$/;
export const TEN_DIGIT_MOBILE_MESSAGE = 'Mobile number must be exactly 10 digits';

export const sanitizeTenDigitMobileInput = (value: string) =>
  value.replace(/\D/g, '').slice(0, 10);

export const isValidTenDigitMobile = (value: string | null | undefined) =>
  TEN_DIGIT_MOBILE_REGEX.test(sanitizeTenDigitMobileInput(String(value ?? '')));

export const loginSchema = z.object({
  email: z.string().nonempty('Email or mobile number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
}).refine((data) => data.email.includes('@') || data.email.length === 10, {
  message: "Invalid email or mobile number",
  path: ["email"],
});

export const registerSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\d{10}$/, 'Mobile number must be 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),

  confirm_password: z.string(),
  state_id: z.string().min(1, 'State is required'),
  district_id: z.string().min(1, 'District is required'),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

export const registerSchemaWithoutAuth = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\d{10}$/, 'Mobile number must be 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string()
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

export const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  mobile: z.string().regex(/^\d{10}$/, 'Mobile number must be 10 digits'),
  role: z.enum(['admin', 'user', 'approver', 'uploader', 'registrar']),
});

// Base schema for all users
const BaseUserSchema = z.object({
  first_name: z
    .string()
    .min(1, 'First name is required')
    .refine((val) => val.trim().length >= 3, {
      message: 'First name must be at least 3 characters',
    }),

  last_name: z
    .string()
    .min(1, 'Last name is required')
    .refine((val) => val.trim().length >= 3, {
      message: 'Last name must be at least 3 characters',
    }),

  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),

  phone: z
    .string()
    .min(1, 'Mobile number is required')
    .refine((val) => /^\d+$/.test(val), {
      message: 'Mobile number must contain only digits',
    })
    .refine((val) => val.length === 10, {
      message: 'Mobile number must be exactly 10 digits',
    }),

  role_id: z
    .string()
    .min(1, 'Role is required'),

  // Optional fields that will be conditionally validated
  is_hq: z.boolean().optional().default(false),
  state_id: z.string().optional(),
  district_id: z.string().optional(),
  password: z.string().optional(),
  confirm_password: z.string().optional(),
});

// Conditional validation function
export const AddUserSchema = BaseUserSchema
  .refine(() => {
    // This will be handled in the component based on role names
    // For now, just ensure basic validation
    return true;
  }, {
    message: "Required fields are missing based on role",
    path: ["role_id"],
  })
  .refine((data) => {
    // Password validation will be handled conditionally in the component
    // For now, if password is provided, validate it
    if (data.password) {
      if (data.password.length < 6) {
        return false;
      }
      return data.password === data.confirm_password;
    }
    return true;
  }, {
    message: "Password validation failed",
    path: ["password"],
  });

export type AddUserForm = z.infer<typeof AddUserSchema>;

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .refine((val) => /\d/.test(val), {
      message: 'Password must contain at least one digit',
    }),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

export type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

/** Minimum promoters for society registration (increase for production rules if required). */
export const MIN_SOCIETY_REGISTRATION_PROMOTERS = 10;

/** Promoter category must be one of these (80% APST; non-APST share: General / SC only). */
export const PROMOTER_CATEGORY_VALUES = ['APST', 'General', 'SC'] as const;

/** Minimum APST promoters required so that APST share is at least 80% (rounded up). */
export const minApstPromotersRequired = (totalPromoters: number): number =>
  totalPromoters > 0 ? Math.ceil(0.8 * totalPromoters) : 0;

export const validateStep = (
  step: number,
  formData: SocietyFormData,
  setErrors: (errors: Record<string, string>) => void,
  documentIds?: {
    bye_laws?: { id: string; url: string };
    bank_certificate?: { id: string; url: string };
    economic_scheme?: { id: string; url: string };
    contributor_list?: { id: string; url: string };
    custom_documents?: { id: string; url: string };
    non_family_coop_certificate?: { id: string; url: string };
    site_inspection_report?: { id: string; url: string };
    circular_minutes_of_meeting?: { id: string; url: string };
    land_document?: { id: string; url: string };
  },
  existingDocuments?: {
    bye_laws?: { id: string; url: string };
    bank_certificate?: { id: string; url: string };
    economic_scheme?: { id: string; url: string };
    contributor_list?: { id: string; url: string };
    custom_documents?: { id: string; url: string };
    non_family_coop_certificate?: { id: string; url: string };
    site_inspection_report?: { id: string; url: string };
    circular_minutes_of_meeting?: { id: string; url: string };
    land_document?: { id: string; url: string };
  },
  masterData?: any,
  options?: { skipPromoterApstRule?: boolean }
): boolean => {
  const newErrors: Record<string, string> = {};

  if (step === 1) {
    if (!formData.cooperative_society_name) newErrors.cooperative_society_name = 'Society name is required';
    else if (!/\bcooperative\s+society\s+limited\b/i.test(String(formData.cooperative_society_name).replace(/\s+/g, ' ').trim())) {
      newErrors.cooperative_society_name = 'Society name must include "Cooperative Society Limited"';
    }
    if (!formData.cooperative_society_type_id) newErrors.cooperative_society_type_id = 'Cooperative society type is required';
    if (!formData.sector_of_operation_type) newErrors.sector_of_operation_type = 'Sector of operation type is required';
    if (!formData.sector_of_operation) newErrors.sector_of_operation = 'Sector of operation is required';
    if (!formData.functional_status) newErrors.functional_status = 'Functional status is required';
    if (!formData.location_of_head_quarter) newErrors.location_of_head_quarter = 'Location of head quarter is required';
    if (!formData.state_id) newErrors.state_id = 'State is required';
    if (!formData.district_id) newErrors.district_id = 'District is required';
    if (!formData?.registration_authoritie_id) newErrors.registration_authoritie_id = 'Registration authority is required';
    if (!formData?.area_of_operation_id) newErrors.area_of_operation_id = 'Area of operation is required';
    if (!formData.pincode) newErrors.pincode = 'Pincode is required';
    if (!formData.full_address) newErrors.full_address = "Address is required";
    else if (!/^\d{6}$/.test(formData.pincode)) newErrors.pincode = 'Pincode must be exactly 6 digits';

    // ================================
    // Contact Person Validation
    // ================================
    if (!formData.contact_person?.trim()) {
      newErrors.contact_person = 'Contact person name is required';
    }

    if (!formData.designation?.trim()) {
      newErrors.designation = 'Designation is required';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.mobile?.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
      newErrors.mobile = 'Mobile must start with 6, 7, 8, or 9 and be 10 digits';
    }

    // Rural-specific validations

    
  }

  if (step === 2) {
    if (!formData.is_affiliated_union_federation) {
      newErrors.is_affiliated_union_federation =
        "Please select affiliation status";
    }

    if (formData.is_affiliated_union_federation === "yes") {
      if (!formData.affiliated_union_level) {
        newErrors.affiliated_union_level =
          "Affiliated union level is required";
      }

      if (!formData.affiliated_union_name?.trim()) {
        newErrors.affiliated_union_name =
          "Affiliated union/federation name is required";
      }
    }

    // Member validation
    if (formData.members.length < MIN_SOCIETY_REGISTRATION_PROMOTERS) {
      newErrors.members = `Minimum ${MIN_SOCIETY_REGISTRATION_PROMOTERS} promoters are required`;
    }

    const totalPromoters = formData.members.length;
    if (totalPromoters >= MIN_SOCIETY_REGISTRATION_PROMOTERS && !options?.skipPromoterApstRule) {
      const allowed = new Set<string>(PROMOTER_CATEGORY_VALUES);
      const invalidCategory = formData.members.some((m) => !allowed.has(m.category));
      if (invalidCategory) {
        newErrors.promoter_categories =
          'Each promoter must be APST, General, or SC (OBC and ST are not allowed for registration).';
      }

      const apstCount = formData.members.filter((m) => m.category === 'APST').length;
      const minApst = minApstPromotersRequired(totalPromoters);
      if (apstCount < minApst) {
        newErrors.promoter_apst_composition =
          `Promoter composition: at least ${minApst} of ${totalPromoters} promoters must be APST (80% rule). Currently ${apstCount} APST.`;
      }
    }

    if (!formData.operation_area_location) {
      newErrors.operation_area_location = 'Operation area location is required';
    }

    if (!formData.is_adjacent_to_water_body) {
      newErrors.is_adjacent_to_water_body = 'Is adjacent to water body is required';
    } else if (formData.is_adjacent_to_water_body === 'yes' && !formData.water_body_type_id) {
      newErrors.water_body_type_id = 'Water body type is required';
    }
  }

  if (step === 3) {
    if (!formData.is_profit_making) newErrors.is_profit_making = 'Profit making status is required';
    if (!formData.is_dividend_paid) newErrors.is_dividend_paid = 'Dividend payment status is required';
    // if (!formData.gst_no) newErrors.gst_no = 'GST number is required';
    // if (!formData.pan_no) newErrors.pan_no = 'PAN number is required';
    // if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_no)) newErrors.pan_no = 'Invalid PAN number';

    // Conditional validations
    if (formData.financial_audit === 'yes') {
      if (!formData.audit_complete_year) newErrors.audit_complete_year = 'Year of latest audit is required';
      if (!formData.category_audit) newErrors.category_audit = 'Category of audit is required';
    }

    if (formData.is_profit_making === 'yes') {
      if (!formData.annual_turnover) {
        newErrors.annual_turnover = 'Annual turnover is required';
      } else if (Number(formData.annual_turnover) <= 0) {
        newErrors.annual_turnover = 'Annual turnover must be greater than 0';
      }

      if (!formData.annual_profit) {
        newErrors.annual_profit = 'Annual profit is required';
      } else if (Number(formData.annual_profit) <= 0) {
        newErrors.annual_profit = 'Annual profit must be greater than 0';
      }
    } else if (formData.is_profit_making === 'no') {
      if (!formData.annual_loss || formData.annual_loss === '') newErrors.annual_loss = 'Annual loss is required';
      else if (typeof formData.annual_loss === 'number' && formData.annual_loss <= 0) newErrors.annual_loss = 'Annual loss must be greater than 0';
    }

    if (formData.is_msme === null) {
      newErrors.is_msme = 'Please select MSME status';
    }
    if (formData.is_msme === 1 && !formData.udyam_no?.trim()) {
      newErrors.udyam_no = 'Udyam number is required';
    }
    
    if (formData.is_dividend_paid === 'yes' && !formData.dividend_rate) {
      newErrors.dividend_rate = 'Dividend rate is required';
    }

    if (formData.bank_type === 'other' && !formData.other_bank) {
      newErrors.other_bank = 'Other bank name is required';
    }

    // Secretary mobile number validation (if provided, must be 10 digits)
    if (formData.mobile_number_of_secretary && !/^\d{10}$/.test(formData.mobile_number_of_secretary)) {
      newErrors.mobile_number_of_secretary = 'Secretary mobile number must be exactly 10 digits';
    }
  }

  if (step === 4) {
    // Check document IDs or existing documents
    if (!documentIds?.bye_laws && !existingDocuments?.bye_laws) newErrors.bye_laws = 'Bye-law document is required';
    if (!documentIds?.bank_certificate && !existingDocuments?.bank_certificate) newErrors.bank_certificate = 'Bank certificate is required';
    if (!documentIds?.economic_scheme && !existingDocuments?.economic_scheme) newErrors.economic_scheme = 'Economic scheme is required';
    if (!documentIds?.contributor_list && !existingDocuments?.contributor_list) newErrors.contributor_list = 'Promoter list is required';
    if (!documentIds?.circular_minutes_of_meeting && !existingDocuments?.circular_minutes_of_meeting) newErrors.circular_minutes_of_meeting = 'Circular minutes of meeting is required';
    if (!documentIds?.land_document && !existingDocuments?.land_document) newErrors.land_document = 'Land document is required';
    if (!formData.terms_agreement) newErrors.terms_agreement = 'You must agree to terms and conditions';
  }
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
