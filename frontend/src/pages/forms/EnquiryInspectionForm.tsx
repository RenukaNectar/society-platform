import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { RootState } from '../../store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { DocumentUpload } from '../../components/ui/DocumentUpload';
import {
  Send,
  RefreshCw,
  Search,
  User,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { createEnquiryInspection, updateEnquiryInspection, getEnquiryInspectionById } from '../../lib/data/enquiryInspections/api';
import { getSocieties, getSocietyById } from '../../lib/data/societies/api';
import { getMySociety } from '../../lib/data/users/api';
import moment from 'moment';

const ENQUIRY_OFFICER_CREATE_ROLES = ['jics_sics_district', 'jics_sics_hq'];

const INSPECTION_SUBJECTS = [
  'Inquiry',
  'Inspection',
  'Complaint',
  'Irregularity',
  'Routine Check',
  'Other',
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateOptionalApplicantContact = (data: EnquiryInspectionFormData): string | null => {
  const applicantName = data.applicant_name?.trim() || '';
  if (applicantName && applicantName.length < 2) {
    return 'Applicant name must be at least 2 characters';
  }
  if (data.contact_number?.trim()) {
    const contactNumber = normalizePhone(data.contact_number);
    if (contactNumber.length !== 10) {
      return 'Enter a valid 10-digit contact number';
    }
  }
  if (data.email_id?.trim() && !EMAIL_PATTERN.test(data.email_id.trim())) {
    return 'Enter a valid email address';
  }
  return null;
};

const validateInspectionSubmit = (
  data: EnquiryInspectionFormData,
  applicantContactOptional = false,
): string | null => {
  if (!data.society_id) {
    return 'Please select a society';
  }
  if (applicantContactOptional) {
    const contactError = validateOptionalApplicantContact(data);
    if (contactError) return contactError;
  } else {
    if (!data.applicant_name?.trim() || data.applicant_name.trim().length < 2) {
      return 'Applicant name is missing. Re-select the society.';
    }
    const contactNumber = normalizePhone(data.contact_number);
    if (!contactNumber || contactNumber.length < 10) {
      return 'A valid 10-digit contact number is required';
    }
    if (!data.email_id?.trim() || !EMAIL_PATTERN.test(data.email_id.trim())) {
      return 'A valid email address is required';
    }
  }
  if (!applicantContactOptional && (!data.address?.trim() || data.address.trim().length < 3)) {
    return 'Applicant address must be at least 3 characters';
  }
  if (applicantContactOptional && data.address?.trim() && data.address.trim().length < 3) {
    return 'Applicant address must be at least 3 characters';
  }
  if (!data.society_address?.trim() || data.society_address.trim().length < 3) {
    return 'Society address is missing. Re-select the society.';
  }
  if (!INSPECTION_SUBJECTS.includes(data.subject)) {
    return 'Please select a valid subject';
  }
  if (!data.description?.trim() || data.description.trim().length < 10) {
    return 'Description must be at least 10 characters';
  }
  return null;
};

interface SocietyOption {
  id: string;
  district_id?: string | null;
  cooperative_society_name?: string | null;
  registration_number?: string | null;
  full_address?: string | null;
  address?: string | null;
  location_of_head_quarter?: string | null;
}

interface ApplicantUserProfile {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  email?: string | null;
}

const normalizePhone = (value?: string | number | null) =>
  String(value ?? '').replace(/\D/g, '').slice(0, 10);

const getSocietyAddress = (society: SocietyOption) =>
  society.full_address || society.address || society.location_of_head_quarter || '';

const societyOptionLabel = (society: SocietyOption) =>
  society.cooperative_society_name || society.registration_number || 'Unnamed Society';

const getApplicantDetailsFromUser = (applicantUser?: ApplicantUserProfile | null) => ({
  applicant_name: [applicantUser?.first_name, applicantUser?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim(),
  contact_number: normalizePhone(applicantUser?.phone),
  email_id: applicantUser?.email?.trim() || '',
});

interface EnquiryInspectionFormData {
  society_id: string;
  applicant_name: string;
  applicant_type: '' | 'Member' | 'Office Bearer' | 'General Public' | 'Other';
  contact_number: string;
  email_id: string;
  address: string;

  // Society Details
  society_registration_number: string;
  society_name: string;
  society_address: string;

  // Enquiry/Inspection Details
  subject: 'Inquiry' | 'Inspection' | 'Complaint' | 'Irregularity' | 'Routine Check' | 'Other';
  description: string;
  preferred_office_level: 'State' | 'District' | 'Subdivision';
  date_of_incident?: string;

  // Supporting Information
  documents?: string;
  previous_reference_number?: string;

  officer_remarks?: string;
  assigned_officer_id?: string;
  review_date?: string;
  completion_date?: string;
  completion_remarks?: string;
}

export const EnquiryInspectionForm: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { id } = useParams(); // For editing existing enquiry
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Document IDs state for uploaded documents
  const [documentIds, setDocumentIds] = useState<{
    documents?: string;
  }>({});

  // State to track existing documents from API
  const [existingDocuments, setExistingDocuments] = useState<{
    documents?: { id: string; url: string };
  }>({});
  const [societies, setSocieties] = useState<SocietyOption[]>([]);
  const [loadingSocieties, setLoadingSocieties] = useState(false);
  const [societyQuery, setSocietyQuery] = useState('');
  const [societyQueryDirty, setSocietyQueryDirty] = useState(false);
  const [societyListOpen, setSocietyListOpen] = useState(false);
  const societyPickerRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset, trigger } = useForm<EnquiryInspectionFormData>({
    defaultValues: {
      society_id: '',
      applicant_name: '',
      applicant_type: 'Member',
      contact_number: '',
      email_id: '',
      address: '',
      society_registration_number: '',
      society_name: '',
      society_address: '',
      subject: 'Complaint',
      description: '',
      preferred_office_level: 'State',
      date_of_incident: '',
      documents: '',
      previous_reference_number: '',
      officer_remarks: '',
      assigned_officer_id: '',
      review_date: '',
      completion_date: '',
      completion_remarks: ''
    },
    mode: 'onSubmit'
  });

  // Load user's society information
  const loadUserSociety = async () => {
    if (user?.role !== 'applicant') {
      return;
    }

    try {
      const response = await getMySociety();
      const society = response?.data?.society;
      const profileUser = response?.data?.user;
      if (!id && society) {
        setValue('society_id', society.id || '');
        applySocietySelection(society, profileUser);
      }
    } catch (error) {
      console.error('Error loading user society:', error);
    }
  };

  // Load existing enquiry data for editing
  const loadExistingData = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const response = await getEnquiryInspectionById(id);
      if (response?.data) {
        const enquiry = response.data;

        // Set form values
        setValue('applicant_name', enquiry.applicant_name || '');
        setValue('applicant_type', enquiry.applicant_type);
        setValue('contact_number', enquiry.contact_number || '');
        setValue('email_id', enquiry.email_id || '');
        setValue('address', enquiry.address || '');
        setValue('society_id', enquiry.society_id || '');
        setValue('society_registration_number', enquiry.society_registration_number || '');
        setValue('society_name', enquiry.society_name || '');
        setValue('society_address', enquiry.society_address || '');
        setValue('subject', enquiry.subject || '');
        setValue('description', enquiry.description || '');
        setValue('preferred_office_level', enquiry.preferred_office_level);
        setValue('date_of_incident', enquiry.date_of_incident ? moment(enquiry.date_of_incident).format('YYYY-MM-DD') : '');
        setValue('previous_reference_number', enquiry.previous_reference_number || '');
        setValue('officer_remarks', enquiry.officer_remarks || '');
        setValue('review_date', enquiry.review_date ? moment(enquiry.review_date).format('YYYY-MM-DD') : '');
        setValue('completion_date', enquiry.completion_date ? moment(enquiry.completion_date).format('YYYY-MM-DD') : '');
        setValue('completion_remarks', enquiry.completion_remarks || '');

        // Set existing documents
        if (enquiry.supportingDocumentsMedia) {
          setExistingDocuments(prev => ({
            ...prev,
            documents: {
              id: enquiry.documents!,
              url: enquiry.supportingDocumentsMedia.url
            }
          }));
          setDocumentIds(prev => ({
            ...prev,
            documents: enquiry.documents!
          }));
        }
      }
    } catch (error) {
      console.error('Error loading enquiry:', error);
      toast.error('Failed to load enquiry data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSocieties = async () => {
    try {
      setLoadingSocieties(true);
      const response = await getSocieties({ page: 1, limit: 1000 });
      const list =
        (response as { societyRegistrations?: SocietyOption[] })?.societyRegistrations ||
        (response as { societies?: SocietyOption[] })?.societies ||
        (response as { data?: { societyRegistrations?: SocietyOption[] } })?.data?.societyRegistrations ||
        [];
      setSocieties(list);
    } catch (error) {
      console.error('Error loading societies:', error);
      toast.error('Failed to load societies');
    } finally {
      setLoadingSocieties(false);
    }
  };

  const isManualApplicantContact = ENQUIRY_OFFICER_CREATE_ROLES.includes(user?.role || '');

  const applySocietySelection = (
    society: SocietyOption,
    applicantUser?: ApplicantUserProfile | null,
  ) => {
    const societyAddress = getSocietyAddress(society);

    setValue('society_registration_number', society.registration_number || '');
    setValue('society_name', society.cooperative_society_name || '');
    setValue('society_address', societyAddress);
    if (!isManualApplicantContact) {
      const applicantDetails = getApplicantDetailsFromUser(applicantUser);
      setValue('applicant_name', applicantDetails.applicant_name);
      setValue('contact_number', applicantDetails.contact_number);
      setValue('email_id', applicantDetails.email_id);
    }
  };

  const clearSocietyDetails = () => {
    setValue('society_registration_number', '');
    setValue('society_name', '');
    setValue('society_address', '');
    if (!isManualApplicantContact) {
      setValue('applicant_name', '');
      setValue('contact_number', '');
      setValue('email_id', '');
    }
  };

  const handleSocietyChange = async (societyId: string) => {
    setValue('society_id', societyId, { shouldValidate: true });

    if (!societyId) {
      clearSocietyDetails();
      trigger('society_id');
      return;
    }

    clearSocietyDetails();

    try {
      const response = await getSocietyById(societyId);
      if (response?.society?.id === societyId) {
        applySocietySelection(response.society, response.user);
        trigger('society_id');
        return;
      }
    } catch (error) {
      console.error('Error loading society details:', error);
      toast.error('Failed to load society details');
      trigger('society_id');
      return;
    }

    const society = societies.find((item) => item.id === societyId);
    if (society) {
      applySocietySelection(society);
    }

    trigger('society_id');
  };

  const selectedSocietyId = watch('society_id');
  const societyPickerDisabled = loadingSocieties || user?.role === 'applicant';
  const societySearch = societyQueryDirty ? societyQuery.trim().toLowerCase() : '';
  const filteredSocieties = societies.filter((society) => {
    if (!societySearch) return true;
    const name = (society.cooperative_society_name || '').toLowerCase();
    const registrationNumber = (society.registration_number || '').toLowerCase();
    return name.includes(societySearch) || registrationNumber.includes(societySearch);
  });
  const visibleSocieties = filteredSocieties.slice(0, 50);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!societyPickerRef.current?.contains(event.target as Node)) {
        setSocietyListOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  useEffect(() => {
    if (societyListOpen) return;
    const selected = societies.find((society) => society.id === selectedSocietyId);
    setSocietyQuery(selected ? societyOptionLabel(selected) : '');
    setSocietyQueryDirty(false);
  }, [selectedSocietyId, societies, societyListOpen]);
  const isSocietyFieldsLocked = Boolean(selectedSocietyId);
  const lockApplicantContactFields = isSocietyFieldsLocked && !isManualApplicantContact;
  const lockedFieldClass = isSocietyFieldsLocked ? 'bg-gray-100 cursor-not-allowed' : undefined;
  const applicantContactLockedClass = lockApplicantContactFields
    ? 'bg-gray-100 cursor-not-allowed'
    : undefined;
  const autoFilledPlaceholder = 'Auto-filled from selected society';

  useEffect(() => {
    const role = user?.role;
    if (!id && role && role !== 'applicant' && !ENQUIRY_OFFICER_CREATE_ROLES.includes(role)) {
      toast.error('You are not authorized to create inspection/inquiry requests');
      navigate('/inquiries');
      return;
    }

    loadSocieties();
    loadUserSociety();
    if (!id && role && ENQUIRY_OFFICER_CREATE_ROLES.includes(role)) {
      setValue('subject', 'Inspection');
      setValue('applicant_type', '');
    }
    if (id) {
      loadExistingData();
    }
  }, [id, user?.role, navigate]);

  const getUserDistrictId = () => {
    const currentUser = user as {
      district_id?: string;
      district?: { id?: string; district_id?: string };
    } | null;

    return (
      currentUser?.district?.id ||
      currentUser?.district_id ||
      currentUser?.district?.district_id ||
      ''
    );
  };

  const onSubmit = async (data: EnquiryInspectionFormData) => {
    const validationError = validateInspectionSubmit(data, isManualApplicantContact);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (!documentIds.documents) {
      toast.error('Supporting documents are required');
      return;
    }

    try {
      setIsLoading(true);

      const selectedSociety = societies.find((society) => society.id === data.society_id);
      const districtId = getUserDistrictId() || selectedSociety?.district_id || undefined;
      const contactNumber = normalizePhone(data.contact_number);

      const submitData = {
        society_id: data.society_id,
        applicant_name: data.applicant_name.trim() || undefined,
        applicant_type: data.applicant_type || undefined,
        contact_number: contactNumber || undefined,
        email_id: data.email_id.trim() || undefined,
        address: data.address.trim() || undefined,
        society_registration_number: data.society_registration_number?.trim() || undefined,
        society_name: data.society_name?.trim() || undefined,
        society_address: data.society_address.trim(),
        subject: data.subject,
        description: data.description.trim(),
        preferred_office_level: data.preferred_office_level,
        ...(data.date_of_incident ? { date_of_incident: data.date_of_incident } : {}),
        ...(data.previous_reference_number?.trim()
          ? { previous_reference_number: data.previous_reference_number.trim() }
          : {}),
        ...(districtId ? { district_id: districtId } : {}),
        documents: documentIds.documents,
      };

      if (id) {
        // Update existing enquiry
        let response = await updateEnquiryInspection(id, submitData);
        if (response.success) {
          toast.success(response.message || 'Enquiry/Inspection request updated successfully');
        } else {
          toast.error(response.message || 'Failed to update enquiry/inspection request');
        }
      } else {
        // Create new enquiry
        let response = await createEnquiryInspection(submitData);
        if (response.success) {
          toast.success(response.message || 'Enquiry/Inspection request submitted successfully');
        } else {
          toast.error(response.message || 'Failed to submit enquiry/inspection request');
        }
      }

      navigate('/inquiries');
    } catch (error: unknown) {
      console.error('Error saving enquiry:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to save enquiry/inspection request';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentUpload = (field: string, mediaId: string) => {
    setDocumentIds(prev => ({
      ...prev,
      [field]: mediaId
    }));
  };

  const handleDocumentRemove = (field: string) => {
    setDocumentIds(prev => {
      const newIds = { ...prev };
      delete newIds[field as keyof typeof newIds];
      return newIds;
    });
  };

  return (
    <div className="space-y-6 mt-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {/* Applicant Details */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            Applicant Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">

            <input
              type="hidden"
              {...register('society_id', { required: 'Please select a society' })}
            />
            <div ref={societyPickerRef}>
              <div className="relative">
              <Input
                label="Select Society"
                value={societyQuery}
                required
                disabled={societyPickerDisabled}
                placeholder={loadingSocieties ? 'Loading societies...' : 'Search by name or registration number'}
                error={errors.society_id?.message}
                autoComplete="off"
                onFocus={() => {
                  if (!societyPickerDisabled) setSocietyListOpen(true);
                }}
                onChange={(event) => {
                  const nextQuery = event.target.value;
                  setSocietyQuery(nextQuery);
                  setSocietyQueryDirty(true);
                  setSocietyListOpen(true);
                  if (!nextQuery.trim() && selectedSocietyId) {
                    void handleSocietyChange('');
                  }
                }}
              />
              {societyListOpen && !societyPickerDisabled && (
                <div className="absolute left-0 top-full z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {visibleSocieties.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-gray-500">No matching societies</p>
                  ) : (
                    visibleSocieties.map((society) => (
                      <button
                        key={society.id}
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-indigo-50"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setSocietyQuery(societyOptionLabel(society));
                          setSocietyQueryDirty(false);
                          setSocietyListOpen(false);
                          void handleSocietyChange(society.id);
                        }}
                      >
                        <span className="block font-medium text-gray-900">
                          {societyOptionLabel(society)}
                        </span>
                        {society.registration_number && (
                          <span className="block text-xs text-gray-500">
                            {society.registration_number}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                  {filteredSocieties.length > visibleSocieties.length && (
                    <p className="px-3 py-2 text-xs text-gray-500">
                      Showing the first {visibleSocieties.length} matches. Keep typing to narrow the list.
                    </p>
                  )}
                </div>
              )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Type to search, then choose a society from the list.
              </p>
            </div>
            <Select
              label="Applicant Type"
              value={watch('applicant_type') || ''}
              onChange={(e) => {
                setValue('applicant_type', e.target.value as EnquiryInspectionFormData['applicant_type']);
                trigger('applicant_type');
              }}
              error={errors.applicant_type?.message}
              placeholder="Select applicant type"
              required={!isManualApplicantContact}
            >
              {isManualApplicantContact && <option value="">Not required</option>}
              <option value="Member">Shareholder</option>
              <option value="Office Bearer">Office Bearer</option>
              <option value="General Public">General Public</option>
              <option value="Other">Other</option>
            </Select>

            <Input
              label="Applicant Name"
              {...register('applicant_name', isManualApplicantContact ? {
                validate: (value) => {
                  const trimmed = value?.trim() || '';
                  if (!trimmed) return true;
                  return trimmed.length >= 2 || 'Applicant name must be at least 2 characters';
                },
              } : { required: 'Applicant name is required' })}
              error={errors.applicant_name?.message}
              placeholder={
                isManualApplicantContact
                  ? 'Enter applicant name'
                  : isSocietyFieldsLocked
                    ? autoFilledPlaceholder
                    : 'Select a society to auto-fill'
              }
              required={!isManualApplicantContact}
              readOnly={lockApplicantContactFields}
              className={applicantContactLockedClass}
            />

            <Input
              label="Contact Number"
              {...register('contact_number', isManualApplicantContact ? {
                validate: (value) => {
                  if (!value?.trim()) return true;
                  return normalizePhone(value).length === 10 || 'Enter a valid 10-digit contact number';
                },
              } : { required: 'Contact number is required' })}
              error={errors.contact_number?.message}
              placeholder={
                isManualApplicantContact
                  ? 'Enter contact number'
                  : isSocietyFieldsLocked
                    ? autoFilledPlaceholder
                    : 'Select a society to auto-fill'
              }
              required={!isManualApplicantContact}
              maxLength={10}
              readOnly={lockApplicantContactFields}
              className={applicantContactLockedClass}
            />

            <Input
              label="Email Address"
              type="email"
              {...register('email_id', isManualApplicantContact ? {
                validate: (value) => {
                  if (!value?.trim()) return true;
                  return EMAIL_PATTERN.test(value.trim()) || 'Invalid email address';
                },
              } : {
                required: 'Email address is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              error={errors.email_id?.message}
              placeholder={
                isManualApplicantContact
                  ? 'Enter email address'
                  : isSocietyFieldsLocked
                    ? autoFilledPlaceholder
                    : 'Select a society to auto-fill'
              }
              required={!isManualApplicantContact}
              maxLength={50}
              readOnly={lockApplicantContactFields}
              className={applicantContactLockedClass}
            />

            <div className="md:col-span-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Textarea
                label="Applicant Address"
                hint="Applicant’s own address. This is not the society address."
                {...register('address', isManualApplicantContact ? {
                  validate: (value) => {
                    if (!value?.trim()) return true;
                    return value.trim().length >= 3 || 'Applicant address must be at least 3 characters long';
                  },
                } : {
                  required: 'Applicant address is required',
                  minLength: { 
                    value: 3, 
                    message: 'Applicant address must be at least 3 characters long' 
                  }
                })}
                error={errors.address?.message}
                placeholder={
                  isManualApplicantContact
                    ? 'Optional. Applicant’s own address, not the society address.'
                    : 'Enter the applicant’s own address'
                }
                rows={3}
                required={!isManualApplicantContact}
              />
              <Textarea
                label="Society Address"
                hint="Filled automatically from the selected society."
                {...register('society_address', { 
                  required: 'Society address is required',
                  minLength: { 
                    value: 3, 
                    message: 'Society address must be at least 3 characters long' 
                  }
                })}
                error={errors.society_address?.message}
                placeholder={isSocietyFieldsLocked ? autoFilledPlaceholder : 'Select a society to auto-fill'}
                rows={3}
                required
                readOnly={isSocietyFieldsLocked}
                className={lockedFieldClass}
              />
            </div>
          </div>
        </Card>

        {/* Enquiry/Inspection Request Details */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Search className="w-5 h-5 mr-2 text-purple-600" />
            Enquiry/Inspection Request Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Subject/Reason for Enquiry/Inspection"
              value={watch('subject') || ''}
              onChange={(e) => {
                setValue(
                  'subject',
                  e.target.value as EnquiryInspectionFormData['subject'],
                );
                trigger('subject');
              }}
              error={errors.subject?.message}
              placeholder="Select subject/reason"
              required
            >
              <option value="Inquiry">Inquiry</option>
              <option value="Inspection">Inspection</option>
              <option value="Complaint">Complaint</option>
              <option value="Irregularity">Irregularity</option>
              <option value="Routine Check">Routine Check</option>
              <option value="Other">Other</option>
            </Select>

            <Select
              label="Preferred Office Level"
              value={watch('preferred_office_level') || ''}
              onChange={(e) => {
                setValue('preferred_office_level', e.target.value as 'State' | 'District' | 'Subdivision');
                trigger('preferred_office_level');
              }}
              error={errors.preferred_office_level?.message}
              placeholder="Select office level"
              required
            >
              <option value="State">State</option>
              <option value="District">District</option>
              <option value="Subdivision">Subdivision</option>
            </Select>

            <Input
              label="Date of Incident/Concern (if applicable)"
              type="date"
              max={moment().format('YYYY-MM-DD')}
              {...register('date_of_incident')}
              error={errors.date_of_incident?.message}
            />

            <Input
              label="Previous Reference Number (if enquiry was filed earlier)"
              {...register('previous_reference_number')}
              error={errors.previous_reference_number?.message}
              placeholder="Enter previous reference number"
            />

            <div className="md:col-span-2">
              <Textarea
                label="Detailed Description of Issue/Request"
                {...register('description', { 
                  required: 'Detailed description is required',
                  minLength: { 
                    value: 10, 
                    message: 'Description must be at least 10 characters long' 
                  }
                })}
                error={errors.description?.message}
                placeholder="Provide detailed description of the issue or request (minimum 10 characters)"
                rows={4}
                required
              />
            </div>
          </div>
        </Card>

        {/* Supporting Information */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2 text-orange-600" />
            Supporting Information
          </h3>
          <div className="space-y-6">
            <div>
              <DocumentUpload
                label="Upload Documents/Evidence"
                onUploadComplete={(mediaId) => handleDocumentUpload('documents', mediaId)}
                onUploadCancel={() => handleDocumentRemove('documents')}
                existingDocument={existingDocuments.documents}
                onReplace={(mediaId) => handleDocumentUpload('documents', mediaId)}
                required={true}
              />
            </div>
          </div>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/inquiries')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {id ? 'Update Request' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </div>
  );
};
