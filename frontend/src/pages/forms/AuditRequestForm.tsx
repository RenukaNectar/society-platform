import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Checkbox } from '../../components/ui/Checkbox';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { useForm } from 'react-hook-form';
import {
  Send,
  Eye,
  Download,
  Building,
  Calendar,
  DollarSign,
  FileText,
  Upload
} from 'lucide-react';
import { PermissionGuard } from '../../components/guard/PermissionGuard';
import { AuditRequestData } from '../../types';
import { DocumentUpload } from '../../components/ui/DocumentUpload';
import toast from 'react-hot-toast';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { createAuditRequest, getAuditRequestById, isAuditReturnedToApplicant, updateAuditRequest } from '../../lib/data/audits/api';
import { getAuditors } from '../../lib/data/others/api';
import { getMySociety } from '../../lib/data/users/api';
import { handleViewPdf } from '../../utils/viewpdf';
import { download } from '../../utils/download';
import ActionPermissionGuard from '../../components/guard/ActionPermissionGuard';

export const AuditRequestForm: React.FC = () => {
  const { token, user } = useSelector((state: RootState) => state.auth);
  const { mode } = useSelector((state: RootState) => state.theme);
  const { id: routeId } = useParams<{ id: string }>();
  const { state } = useLocation();
  const editId = routeId || state?.id || '';
  const [isLoading, setIsLoading] = useState(false);
  const [isResubmitMode, setIsResubmitMode] = useState(false);
  const [auditors, setAuditors] = useState<any[]>([]);
  const [currentSocietyId, setCurrentSocietyId] = useState<string>('');
  const [isLoadingSociety, setIsLoadingSociety] = useState(true);
  const navigate = useNavigate();
  // Document IDs state for uploaded documents
  const [documentIds, setDocumentIds] = useState<{
    agm_bod_minutes?: { id: string; url: string };
    auditor_appointment_letter?: { id: string; url: string };
    registration_certificate?: { id: string; url: string };
    abstract_closing_stock?: { id: string; url: string };
    asset_list_depreciation?: { id: string; url: string };
    shareholder_list?: { id: string; url: string };
    vital_stats_form?: { id: string; url: string };
    audit_note?: { id: string; url: string };
    audit_accounts?: { id: string; url: string };
  }>({});

  // State to track existing documents from API
  const [existingDocuments, setExistingDocuments] = useState<{
    agm_bod_minutes?: { id: string; url: string };
    auditor_appointment_letter?: { id: string; url: string };
    registration_certificate?: { id: string; url: string };
    abstract_closing_stock?: { id: string; url: string };
    asset_list_depreciation?: { id: string; url: string };
    shareholder_list?: { id: string; url: string };
    vital_stats_form?: { id: string; url: string };
    audit_note?: { id: string; url: string };
    audit_accounts?: { id: string; url: string };
  }>({});

  // Generate financial year options from 1970 to current year
  const generateFinancialYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1970; year--) {
      const nextYear = year + 1;
      const shortNextYear = nextYear.toString().slice(-2);
      years.push({
        value: `${year}-${shortNextYear}`,
        label: `${year}-${shortNextYear}`
      });
    }
    return years;
  };

  const financialYearOptions = generateFinancialYears();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<AuditRequestData>({
    defaultValues: {
      society_registration_id: '',
      financial_year: financialYearOptions[0]?.value || '',
      auditor_name: '',
      auditor_registration_number: '',
      audit_completion_date: '',
      audit_classification: 'A',
      agm_date: '',
      bod_meeting_date: '',
      agm_total_members_on_roll: 0,
      agm_members_attended: 0,
      bod_total_members_on_roll: 0,
      bod_members_attended: 0,
      turnover: 0,
      profit_loss: 0,
      profit_loss_type: null,
      gross_profit: 0,
      working_capital: 0,
      accumulated_profit: 0,
      accumulated_loss: 0,
      audit_fee_paid: 0,
      declaration_accepted: false,
      additional_notes: '',
    },
    mode: 'onChange'
  });

  // Load existing audit request data if editing
  useEffect(() => {
    if (editId) {
      loadExistingAuditRequest();
    }
  }, [editId]);

  // Fetch current user's society information from /me API
  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchCurrentUserSociety = async () => {
      try {
        setIsLoadingSociety(true);
        const response = await getMySociety();
        if (response.success && response.data?.society?.id) {
          const societyId = response.data.society.id;
          setCurrentSocietyId(societyId);
          setValue('society_registration_id', societyId);
        } else {
          console.error('No society ID found in response:', response);
          if (!editId && user.role === 'applicant') {
            toast.error('You need a registered society before creating an audit request');
            navigate('/audit-requests', { replace: true });
            return;
          }
          toast.error('Failed to get society information');
        }
      } catch (error) {
        console.error('Error fetching society information:', error);
        if (!editId && user.role === 'applicant') {
          toast.error('You need a registered society before creating an audit request');
          navigate('/audit-requests', { replace: true });
        }
      } finally {
        setIsLoadingSociety(false);
      }
    };

    fetchCurrentUserSociety();
  }, [setValue, editId, user, navigate]);

  useEffect(() => {
    const fetchAuditors = async () => {
      const res = await getAuditors();
      if (res) {
        setAuditors(res);
      }
    }
    fetchAuditors();
  }, []);

  const loadExistingAuditRequest = async () => {
    if (!editId) return;

    setIsLoading(true);
    try {
      const response = await getAuditRequestById(editId);
      if (response) {
        const auditData = Array.isArray(response) ? response[0] : response;
        if (!auditData || !isAuditReturnedToApplicant(auditData)) {
          toast.error('This audit request can only be corrected after it is returned to you.');
          navigate(`/audit-requests/${editId}`, { replace: true });
          return;
        }
        setIsResubmitMode(true);
        // Set form values - convert string numbers to numbers where needed
        setValue('society_registration_id', auditData.society_registration_id || currentSocietyId);
        setValue('financial_year', auditData.financial_year || '');
        setValue('auditor_name', auditData.auditor_name || '');
        setValue('auditor_registration_number', auditData.auditor_registration_number || '');
        setValue('audit_completion_date', auditData.audit_completion_date || '');
        setValue('audit_classification', auditData.audit_classification || 'A');
        setValue('agm_date', auditData.agm_date || '');
        setValue('bod_meeting_date', auditData.bod_meeting_date || '');
        setValue('agm_total_members_on_roll', auditData.agm_total_members_on_roll || 0);
        setValue('agm_members_attended', auditData.agm_members_attended || 0);
        setValue('bod_total_members_on_roll', auditData.bod_total_members_on_roll || 0);
        setValue('bod_members_attended', auditData.bod_members_attended || 0);
        setValue('turnover', parseFloat(auditData.turnover) || 0);
        setValue('profit_loss', parseFloat(auditData.profit_loss) || 0);
        setValue('profit_loss_type', auditData.type === 'loss' ? 'loss' : auditData.type === 'profit' ? 'profit' : auditData.profit_loss_type || null);
        setValue('gross_profit', parseFloat(auditData.gross_profit) || 0);
        setValue('working_capital', parseFloat(auditData.working_capital) || 0);
        setValue('accumulated_profit', parseFloat(auditData.accumulated_profit) || 0);
        setValue('accumulated_loss', parseFloat(auditData.accumulated_loss) || 0);
        setValue('audit_fee_paid', parseFloat(auditData.audit_fee_paid) || 0);
        setValue('declaration_accepted', auditData.declaration_accepted || false);
        setValue('additional_notes', auditData.additional_notes || '');

        // Load existing media files
        loadExistingMedia(auditData);

      } else {
        toast.error('Failed to load audit request data');
      }
    } catch (error) {
      console.error('Error loading audit request:', error);
      toast.error('Failed to load existing audit request data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadExistingMedia = (data: any) => {
    const record = Array.isArray(data) ? data[0] : data;
    const existingMedia = {
      agm_bod_minutes: record?.agmBodMinutesMedia ? { id: record.agmBodMinutesMedia.id, url: record.agmBodMinutesMedia.url } : undefined,
      auditor_appointment_letter: record?.auditorAppointmentLetterMedia ? { id: record.auditorAppointmentLetterMedia.id, url: record.auditorAppointmentLetterMedia.url } : undefined,
      registration_certificate: record?.registrationCertificateMedia ? { id: record.registrationCertificateMedia.id, url: record.registrationCertificateMedia.url } : undefined,
      abstract_closing_stock: record?.abstractClosingStockMedia ? { id: record.abstractClosingStockMedia.id, url: record.abstractClosingStockMedia.url } : undefined,
      asset_list_depreciation: record?.assetListDepreciationMedia ? { id: record.assetListDepreciationMedia.id, url: record.assetListDepreciationMedia.url } : undefined,
      shareholder_list: record?.shareholderListMedia ? { id: record.shareholderListMedia.id, url: record.shareholderListMedia.url } : undefined,
      vital_stats_form: record?.vitalStatsFormMedia ? { id: record.vitalStatsFormMedia.id, url: record.vitalStatsFormMedia.url } : undefined,
      audit_note: record?.auditNoteMedia ? { id: record.auditNoteMedia.id, url: record.auditNoteMedia.url } : undefined,
      audit_accounts: record?.auditAccountsMedia ? { id: record.auditAccountsMedia.id, url: record.auditAccountsMedia.url } : undefined,
    };
    setExistingDocuments(existingMedia);
  };

  const handleDocumentUploadComplete = (field: keyof typeof documentIds, documentId: string, documentUrl?: string) => {
    setDocumentIds(prev => ({
      ...prev,
      [field]: { id: documentId, url: documentUrl || '' },
    }));
  };

  const handleDocumentReplace = (field: keyof typeof documentIds, newDocumentId: string, newDocumentUrl?: string) => {
    setDocumentIds(prev => ({ ...prev, [field]: { id: newDocumentId, url: newDocumentUrl || '' } }));
    setExistingDocuments(prev => ({ ...prev, [field]: undefined }));
  };

  const handleDocumentUploadCancel = (field: keyof typeof documentIds) => {
    setDocumentIds(prev => {
      const newIds = { ...prev };
      delete newIds[field];
      return newIds;
    });
  };

  const submitForm = async (data: any, status?: any) => {
    if (!data.financial_year) {
      toast.error('Please select a financial year');
      return;
    }

    if (!data.auditor_name) {
      return;
    }

    // Ensure we have the current society ID
    if (!currentSocietyId) {
      return;
    }

    // Validate required documents
    const validationErrors = validateRequiredDocuments();
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }

    // Extract just the IDs from documentIds for form submission
    const documentIdsForSubmission = {
      agm_bod_minutes_media_id: documentIds.agm_bod_minutes?.id,
      auditor_appointment_letter_media_id: documentIds.auditor_appointment_letter?.id,
      registration_certificate_media_id: documentIds.registration_certificate?.id,
      abstract_closing_stock_media_id: documentIds.abstract_closing_stock?.id,
      asset_list_depreciation_media_id: documentIds.asset_list_depreciation?.id,
      shareholder_list_media_id: documentIds.shareholder_list?.id,
      vital_stats_form_media_id: documentIds.vital_stats_form?.id,
      audit_note_media_id: documentIds.audit_note?.id,
      audit_accounts_media_id: documentIds.audit_accounts?.id,
    };

    const { profit_loss_type, ...restData } = data;
    const formData: any = {
      ...restData,
      society_registration_id: currentSocietyId,
      ...documentIdsForSubmission,
      profit_loss_type: profit_loss_type || null,
    };

    if (status) {
      formData.status = status.id;
    }
   
    try {
      let res;
      if (editId) {
        // Update existing audit request
        res = await updateAuditRequest(editId, formData);
        if (res) {
          toast.success("Audit request resubmitted successfully!");
          navigate(-1);
        } else {
          toast.error("Failed to update audit request");
        }
      } else {
        // Create new audit request
        res = await createAuditRequest(formData);
        if (res.success) {
          toast.success("Audit request submitted successfully!");
          navigate(-1);
        } else {
          toast.error(res.message);
        }
      }
    } catch (error) {
      console.error('Error submitting audit request:', error);
      toast.error('Failed to submit audit request');
    }

  }

  const onSubmit = async (data: AuditRequestData) => {
    submitForm(data);
  };

  const validateRequiredDocuments = (): string[] => {
    const errors: string[] = [];

    if (!documentIds.agm_bod_minutes && !existingDocuments.agm_bod_minutes) {
      errors.push("AGM/BOD Minutes document is required.");
    } else if (!documentIds.auditor_appointment_letter && !existingDocuments.auditor_appointment_letter) {
      errors.push("Auditor Appointment Letter is required.");
    } else if (!documentIds.registration_certificate && !existingDocuments.registration_certificate) {
      errors.push("Registration Certificate/Renewal Certificate is required.");
    } else if (!documentIds.abstract_closing_stock && !existingDocuments.abstract_closing_stock) {
      errors.push("Abstract Closing Stock document is required.");
    } else if (!documentIds.shareholder_list && !existingDocuments.shareholder_list) {
      errors.push("Shareholder List is required.");
    } else if (!documentIds.vital_stats_form && !existingDocuments.vital_stats_form) {
      errors.push("Vital Stats Form is required.");
    } else if (!documentIds.audit_note && !existingDocuments.audit_note) {
      errors.push("Audit Note is required.");
    } else if (!documentIds.audit_accounts && !existingDocuments.audit_accounts) {
      errors.push("Audit Accounts document is required.");
    }

    return errors;
  };

  // const saveDraft = () => {
  //   const draftstatus = statuses.find((status: any) => status.key === 'draft');
  //   submitForm(watch(), draftstatus);
  // };

  // Helper function to show validation errors
  const showValidationErrors = () => {
    const formData = watch();
    const errors = [];

    if (!formData.financial_year) {
      errors.push('Financial year is required');
    }

    if (!formData.auditor_name) {
      errors.push('Auditor name is required');
    }

    if (errors.length > 0) {
      return false;
    }

    return true;
  };

  const auditClassificationOptions = [
    { value: 'A', label: 'A - Excellent' },
    { value: 'B', label: 'B - Good' },
    { value: 'C', label: 'C - Satisfactory' },
    { value: 'D', label: 'D - Poor' },
  ];

  // PDF viewing and downloading handlers
  const viewPdf = (url: string) => {
    handleViewPdf(url, token || '');
  };

  const handleDownloadPdf = (url: string) => {
    download(url, token || '')
  };

  return (
    <div className="space-y-6 mt-3 h-full mb-5">
      {isLoadingSociety && (
        <Card padding="sm">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className={`ml-3 text-gray-600 ${mode === 'dark' ? 'text-gray-400' : ''}`}>
              Loading society information...
            </span>
          </div>
        </Card>
      )}

      {isLoading && (
        <Card padding="sm">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className={`ml-3 text-gray-600 ${mode === 'dark' ? 'text-gray-400' : ''}`}>
              Loading audit request data...
            </span>
          </div>
        </Card>
      )}

      {/* Rejection Status Display */}
      {/* Removed as per edit hint */}

      {/* Approval Status Display */}
      {/* Removed as per edit hint */}

      {!isLoadingSociety && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 h-full">
          {isResubmitMode && (
            <Card padding="sm" className="border border-amber-200 bg-amber-50">
              <p className="text-sm font-semibold text-amber-900">Correct and re-submit</p>
              <p className="text-sm text-amber-800 mt-1">
                This audit request was returned to you. Update the details and submit it again.
              </p>
            </Card>
          )}
          {/* Form Header */}
          {/* <div className="text-center py-5">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {editId ? 'Edit Audit Request' : 'Create Audit Request'}
            </h2>
            <p className="text-gray-600">
              {editId ? 'Update your audit request details' : 'Submit a new audit request for your society'}
            </p>
          </div> */}

          {/* Basic Information */}
          <Card padding="sm">
            <div className="flex items-center space-x-3 mb-6">
              <Building className={`h-6 w-6 text-indigo-600 ${mode === 'dark' ? 'text-indigo-400' : ''}`} />
              <h3 className={`text-lg font-semibold text-gray-900 ${mode === 'dark' ? 'text-gray-100' : ''}`}>
                Basic Information
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Financial Year"
                value={watch('financial_year')}
                onChange={(e) => {
                  const value = e.target.value;
                  setValue('financial_year', value);
                  // Trigger validation after setting value
                  if (value === '') {
                    setValue('financial_year', '', { shouldValidate: true });
                  } else {
                    setValue('financial_year', value, { shouldValidate: true });
                  }
                }}
                required
                error={errors.financial_year?.message || (watch('financial_year') === '' ? 'Financial year is required' : '')}
              >
                {financialYearOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Select
                label="Auditor Name"
                value={watch('auditor_name')}
                onChange={(e) => {
                  const value = e.target.value;
                  setValue('auditor_name', value);
                  // Trigger validation after setting value
                  if (value === '') {
                    setValue('auditor_name', '', { shouldValidate: true });
                  } else {
                    setValue('auditor_name', value, { shouldValidate: true });
                  }
                }}
                required
                error={errors.auditor_name?.message}
              >
                <option value="">-- Select --</option>
                {auditors.length > 0 && auditors.map((auditor: any) => (
                  <option key={auditor.sl_no} value={auditor.name}>
                    {auditor.name}
                  </option>
                ))}
              </Select>
              <Input
                label="Auditor Registration Number"
                {...register('auditor_registration_number')}
                error={errors.auditor_registration_number?.message}
                placeholder="Enter auditor registration number"
              />
              <Input
                label="Audit Completion Date"
                type="date"
                max={new Date().toISOString().split('T')[0]}
                {...register('audit_completion_date', { required: 'Audit completion date is required' })}
                error={errors.audit_completion_date?.message}
              />
              <Select
                label="Audit Classification"
                value={watch('audit_classification')}
                onChange={(e) => {
                  setValue('audit_classification', e.target.value as 'A' | 'B' | 'C' | 'D');
                  // Trigger validation after setting value
                  trigger('audit_classification');
                }}
              >
                {auditClassificationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          {/* Meeting Dates */}
          <Card padding="sm">
            <div className="flex items-center space-x-3 mb-6">
              <Calendar className={`h-6 w-6 text-green-600 ${mode === 'dark' ? 'text-green-400' : ''}`} />
              <h3 className={`text-lg font-semibold text-gray-900 ${mode === 'dark' ? 'text-gray-100' : ''}`}>
                Meeting Dates & Promoter Information
              </h3>
            </div>
            <h4 className={`text-sm font-semibold text-gray-700 ${mode === 'dark' ? 'text-gray-300' : ''} mb-2`}>AGM</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Input
                label="AGM Date"
                type="date"
                max={new Date().toISOString().split('T')[0]}
                {...register('agm_date')}
                error={errors.agm_date?.message}
              />
              <Input
                label="Total Promoters on Roll"
                type="number"
                {...register('agm_total_members_on_roll', {
                  min: { value: 0, message: 'Cannot be negative' },
                  max: { value: 999999, message: 'Cannot exceed 999,999' }
                })}
                error={errors.agm_total_members_on_roll?.message}
                placeholder="Enter total promoters"
              />
              <Input
                label="Promoters Attended"
                type="number"
                {...register('agm_members_attended', {
                  min: { value: 0, message: 'Cannot be negative' },
                  max: { value: 999999, message: 'Cannot exceed 999,999' }
                })}
                error={errors.agm_members_attended?.message}
                placeholder="Enter promoters attended"
              />
            </div>
            <h4 className={`text-sm font-semibold text-gray-700 ${mode === 'dark' ? 'text-gray-300' : ''} mb-2`}>BOD</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Input
                label="BOD Meeting Date"
                type="date"
                max={new Date().toISOString().split('T')[0]}
                {...register('bod_meeting_date')}
                error={errors.bod_meeting_date?.message}
              />
              <Input
                label="Total Promoters on Roll"
                type="number"
                {...register('bod_total_members_on_roll', {
                  min: { value: 0, message: 'Cannot be negative' },
                  max: { value: 999999, message: 'Cannot exceed 999,999' }
                })}
                error={errors.bod_total_members_on_roll?.message}
                placeholder="Enter total promoters"
              />
              <Input
                label="Promoters Attended"
                type="number"
                {...register('bod_members_attended', {
                  min: { value: 0, message: 'Cannot be negative' },
                  max: { value: 999999, message: 'Cannot exceed 999,999' }
                })}
                error={errors.bod_members_attended?.message}
                placeholder="Enter promoters attended"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea
                label="Additional Notes"
                {...register('additional_notes')}
                error={errors.additional_notes?.message}
                placeholder="Enter any additional notes or comments"
                rows={3}
              />
            </div>
          </Card>

          {/* Financial Information */}
          <Card padding="sm">
            <div className="flex items-center space-x-3 mb-6">
              <DollarSign className={`h-6 w-6 text-green-600 ${mode === 'dark' ? 'text-green-400' : ''}`} />
              <h3 className={`text-lg font-semibold text-gray-900 ${mode === 'dark' ? 'text-gray-100' : ''}`}>
                Financial Information
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Turnover (₹)"
                type="number"
                step="0.01"
                {...register('turnover', {
                  min: { value: 0, message: 'Cannot be negative' },
                  max: { value: 999999999999.99, message: 'Cannot exceed 999,999,999,999.99' }
                })}
                error={errors.turnover?.message}
                placeholder="Enter turnover amount"
              />
              <Input
                label="Profit (₹)"
                type="number"
                step="0.01"
                value={watch('profit_loss_type') === 'profit' ? (watch('profit_loss') || '') : ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setValue('profit_loss', val);
                  setValue('profit_loss_type', 'profit');
                }}
                disabled={watch('profit_loss_type') === 'loss' && (watch('profit_loss') || 0) > 0}
                error={errors.profit_loss?.message}
                placeholder="Enter profit amount"
              />
              <Input
                label="Loss (₹)"
                type="number"
                step="0.01"
                value={watch('profit_loss_type') === 'loss' ? (watch('profit_loss') || '') : ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setValue('profit_loss', val);
                  setValue('profit_loss_type', 'loss');
                }}
                disabled={watch('profit_loss_type') === 'profit' && (watch('profit_loss') || 0) > 0}
                error={errors.profit_loss?.message}
                placeholder="Enter loss amount"
              />
              <Input
                label="Gross Profit (₹)"
                type="number"
                step="0.01"
                {...register('gross_profit', {
                  min: { value: 0, message: 'Cannot be negative' }
                })}
                error={errors.gross_profit?.message}
                placeholder="Enter gross profit amount"
              />
              <Input
                label="Working Capital (₹)"
                type="number"
                step="0.01"
                {...register('working_capital', {
                  min: { value: 0, message: 'Cannot be negative' }
                })}
                error={errors.working_capital?.message}
                placeholder="Enter working capital"
              />
              <Input
                label="Accumulated Profit (₹)"
                type="number"
                step="0.01"
                {...register('accumulated_profit', {
                  min: { value: 0, message: 'Cannot be negative' }
                })}
                error={errors.accumulated_profit?.message}
                placeholder="Enter accumulated profit"
              />
              <Input
                label="Accumulated Loss (₹)"
                type="number"
                step="0.01"
                {...register('accumulated_loss', {
                  min: { value: 0, message: 'Cannot be negative' }
                })}
                error={errors.accumulated_loss?.message}
                placeholder="Enter accumulated loss"
              />
              <Input
                label="Audit Fee Paid (₹)"
                type="number"
                step="0.01"
                {...register('audit_fee_paid', {
                  min: { value: 0, message: 'Cannot be negative' }
                })}
                error={errors.audit_fee_paid?.message}
                placeholder="Enter audit fee paid"
              />
            </div>
          </Card>

          {/* Required Documents */}
          <Card padding="sm" className={`${(Object.keys(documentIds).length > 0 || Object.keys(existingDocuments).length > 0) ? '' : 'mb-5 pb-5'}`}>
            <div className="flex items-center space-x-3 mb-6">
              <Upload className={`h-6 w-6 text-orange-600 ${mode === 'dark' ? 'text-orange-400' : ''}`} />
              <h3 className={`text-lg font-semibold text-gray-900 ${mode === 'dark' ? 'text-gray-100' : ''}`}>
                Required Documents
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DocumentUpload
                label="AGM/BOD Minutes"
                onUploadComplete={(documentId, documentUrl) => handleDocumentUploadComplete('agm_bod_minutes', documentId, documentUrl)}
                onUploadCancel={() => handleDocumentUploadCancel('agm_bod_minutes')}
                required={true}
                existingDocument={existingDocuments.agm_bod_minutes}
                onReplace={(newDocumentId, newDocumentUrl) => handleDocumentReplace('agm_bod_minutes', newDocumentId, newDocumentUrl)}
              />
              <DocumentUpload
                label="Auditor Appointment Letter"
                onUploadComplete={(documentId, documentUrl) => handleDocumentUploadComplete('auditor_appointment_letter', documentId, documentUrl)}
                onUploadCancel={() => handleDocumentUploadCancel('auditor_appointment_letter')}
                required={true}
                existingDocument={existingDocuments.auditor_appointment_letter}
                onReplace={(newDocumentId, newDocumentUrl) => handleDocumentReplace('auditor_appointment_letter', newDocumentId, newDocumentUrl)}
              />
              <DocumentUpload
                label="Registration Certificate/Renewal Certificate"
                onUploadComplete={(documentId, documentUrl) => handleDocumentUploadComplete('registration_certificate', documentId, documentUrl)}
                onUploadCancel={() => handleDocumentUploadCancel('registration_certificate')}
                required={true}
                existingDocument={existingDocuments.registration_certificate}
                onReplace={(newDocumentId, newDocumentUrl) => handleDocumentReplace('registration_certificate', newDocumentId, newDocumentUrl)}
              />
              <DocumentUpload
                label="Abstract Closing Stock"
                onUploadComplete={(documentId, documentUrl) => handleDocumentUploadComplete('abstract_closing_stock', documentId, documentUrl)}
                onUploadCancel={() => handleDocumentUploadCancel('abstract_closing_stock')}
                required={true}
                existingDocument={existingDocuments.abstract_closing_stock}
                onReplace={(newDocumentId, newDocumentUrl) => handleDocumentReplace('abstract_closing_stock', newDocumentId, newDocumentUrl)}
              />
              <DocumentUpload
                label="Asset List & Depreciation"
                onUploadComplete={(documentId, documentUrl) => handleDocumentUploadComplete('asset_list_depreciation', documentId, documentUrl)}
                onUploadCancel={() => handleDocumentUploadCancel('asset_list_depreciation')}
                required={false}
                existingDocument={existingDocuments.asset_list_depreciation}
                onReplace={(newDocumentId, newDocumentUrl) => handleDocumentReplace('asset_list_depreciation', newDocumentId, newDocumentUrl)}
              />
              <DocumentUpload
                label="Shareholder List"
                onUploadComplete={(documentId, documentUrl) => handleDocumentUploadComplete('shareholder_list', documentId, documentUrl)}
                onUploadCancel={() => handleDocumentUploadCancel('shareholder_list')}
                required={true}
                existingDocument={existingDocuments.shareholder_list}
                onReplace={(newDocumentId, newDocumentUrl) => handleDocumentReplace('shareholder_list', newDocumentId, newDocumentUrl)}
              />
              <DocumentUpload
                label="Vital Stats Form"
                onUploadComplete={(documentId, documentUrl) => handleDocumentUploadComplete('vital_stats_form', documentId, documentUrl)}
                onUploadCancel={() => handleDocumentUploadCancel('vital_stats_form')}
                required={true}
                existingDocument={existingDocuments.vital_stats_form}
                onReplace={(newDocumentId, newDocumentUrl) => handleDocumentReplace('vital_stats_form', newDocumentId, newDocumentUrl)}
              />
              <DocumentUpload
                label="Audit Note"
                onUploadComplete={(documentId, documentUrl) => handleDocumentUploadComplete('audit_note', documentId, documentUrl)}
                onUploadCancel={() => handleDocumentUploadCancel('audit_note')}
                required={true}
                existingDocument={existingDocuments.audit_note}
                onReplace={(newDocumentId, newDocumentUrl) => handleDocumentReplace('audit_note', newDocumentId, newDocumentUrl)}
              />
              <DocumentUpload
                label="Audit Accounts"
                onUploadComplete={(documentId, documentUrl) => handleDocumentUploadComplete('audit_accounts', documentId, documentUrl)}
                onUploadCancel={() => handleDocumentUploadCancel('audit_accounts')}
                required={true}
                existingDocument={existingDocuments.audit_accounts}
                onReplace={(newDocumentId, newDocumentUrl) => handleDocumentReplace('audit_accounts', newDocumentId, newDocumentUrl)}
              />
            </div>
          </Card>

          {/* Uploaded Documents Display */}
          {(Object.keys(documentIds).length > 0 || Object.keys(existingDocuments).length > 0) && (
            <Card padding="sm" className="mb-10">
              <div className="flex items-center space-x-3 mb-6">
                <FileText className={`h-6 w-6 text-indigo-600 ${mode === 'dark' ? 'text-indigo-400' : ''}`} />
                <h3 className={`text-lg font-semibold text-gray-900 ${mode === 'dark' ? 'text-gray-100' : ''}`}>
                  Uploaded Documents
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Newly Uploaded Documents */}
                {documentIds.agm_bod_minutes && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-green-50">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">AGM/BOD Minutes</span>
                    </div>
                    <div className="flex space-x-2">
                      {documentIds.agm_bod_minutes.url?.toLowerCase().includes('.pdf') ? (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(documentIds.agm_bod_minutes!.url)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(documentIds.agm_bod_minutes!.url)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {documentIds.auditor_appointment_letter && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-green-50">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">Auditor Appointment Letter</span>
                    </div>
                    <div className="flex space-x-2">
                      {documentIds.auditor_appointment_letter.url?.toLowerCase().includes('.pdf') ? (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(documentIds.auditor_appointment_letter!.url)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(documentIds.auditor_appointment_letter!.url)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {documentIds.registration_certificate && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-green-50">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">Registration Certificate/Renewal Certificate</span>
                    </div>
                    <div className="flex space-x-2">
                      {documentIds.registration_certificate.url?.toLowerCase().includes('.pdf') ? (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(documentIds.registration_certificate!.url)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(documentIds.registration_certificate!.url)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {documentIds.abstract_closing_stock && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-green-50">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">Abstract Closing Stock</span>
                    </div>
                    <div className="flex space-x-2">
                      {documentIds.abstract_closing_stock.url?.toLowerCase().includes('.pdf') ? (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(documentIds.abstract_closing_stock!.url)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(documentIds.abstract_closing_stock!.url)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {documentIds.asset_list_depreciation && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-green-50">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">Asset List & Depreciation</span>
                    </div>
                    <div className="flex space-x-2">
                      {documentIds.asset_list_depreciation.url?.toLowerCase().includes('.pdf') ? (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(documentIds.asset_list_depreciation!.url)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(documentIds.asset_list_depreciation!.url)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {documentIds.shareholder_list && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-green-50">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">Shareholder List</span>
                    </div>
                    <div className="flex space-x-2">
                      {documentIds.shareholder_list.url?.toLowerCase().includes('.pdf') ? (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(documentIds.shareholder_list!.url)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(documentIds.shareholder_list!.url)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {documentIds.vital_stats_form && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-green-50">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">Vital Stats Form</span>
                    </div>
                    <div className="flex space-x-2">
                      {documentIds.vital_stats_form.url?.toLowerCase().includes('.pdf') ? (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(documentIds.vital_stats_form!.url)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(documentIds.vital_stats_form!.url)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {documentIds.audit_note && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-green-50">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">Audit Note</span>
                    </div>
                    <div className="flex space-x-2">
                      {documentIds.audit_note.url?.toLowerCase().includes('.pdf') ? (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(documentIds.audit_note!.url)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(documentIds.audit_note!.url)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {documentIds.audit_accounts && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-green-50">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">Audit Accounts</span>
                    </div>
                    <div className="flex space-x-2">
                      {documentIds.audit_accounts.url?.toLowerCase().includes('.pdf') ? (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(documentIds.audit_accounts!.url)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(documentIds.audit_accounts!.url)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Existing Documents */}
                {existingDocuments.agm_bod_minutes && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-blue-50">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">AGM/BOD Minutes</span>
                    </div>
                    <div className="flex space-x-2">
                      {existingDocuments.agm_bod_minutes.url?.toLowerCase().includes('.pdf') ? (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(existingDocuments.agm_bod_minutes!.url)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(existingDocuments.agm_bod_minutes!.url)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {existingDocuments.auditor_appointment_letter && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-blue-50">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">Auditor Appointment Letter</span>
                    </div>
                    <div className="flex space-x-2">
                      {existingDocuments.auditor_appointment_letter.url?.toLowerCase().includes('.pdf') ? (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(existingDocuments.auditor_appointment_letter!.url)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(existingDocuments.auditor_appointment_letter!.url)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {existingDocuments.registration_certificate && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-blue-50">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">Registration Certificate/Renewal Certificate</span>
                    </div>
                    <div className="flex space-x-2">
                      {existingDocuments.registration_certificate.url?.toLowerCase().includes('.pdf') ? (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(existingDocuments.registration_certificate!.url)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(existingDocuments.registration_certificate!.url)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {existingDocuments.abstract_closing_stock && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-blue-50">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">Abstract Closing Stock</span>
                    </div>
                    <div className="flex space-x-2">
                      {existingDocuments.abstract_closing_stock.url?.toLowerCase().includes('.pdf') ? (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(existingDocuments.abstract_closing_stock!.url)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(existingDocuments.abstract_closing_stock!.url)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {existingDocuments.asset_list_depreciation && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-blue-50">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">Asset List & Depreciation</span>
                    </div>
                    <div className="flex space-x-2">
                      {existingDocuments.asset_list_depreciation.url?.toLowerCase().includes('.pdf') ? (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(existingDocuments.asset_list_depreciation!.url)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(existingDocuments.asset_list_depreciation!.url)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {existingDocuments.shareholder_list && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-blue-50">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">Shareholder List</span>
                    </div>
                    <div className="flex space-x-2">
                      {existingDocuments.shareholder_list.url?.toLowerCase().includes('.pdf') ? (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(existingDocuments.shareholder_list!.url)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(existingDocuments.shareholder_list!.url)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {existingDocuments.vital_stats_form && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-blue-50">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">Vital Stats Form</span>
                    </div>
                    <div className="flex space-x-2">
                      {existingDocuments.vital_stats_form.url?.toLowerCase().includes('.pdf') ? (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(existingDocuments.vital_stats_form!.url)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(existingDocuments.vital_stats_form!.url)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {existingDocuments.audit_note && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-blue-50">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">Audit Note</span>
                    </div>
                    <div className="flex space-x-2">
                      {existingDocuments.audit_note.url?.toLowerCase().includes('.pdf') ? (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(existingDocuments.audit_note!.url)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(existingDocuments.audit_note!.url)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {existingDocuments.audit_accounts && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-blue-50">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">Audit Accounts</span>
                    </div>
                    <div className="flex space-x-2">
                      {existingDocuments.audit_accounts.url?.toLowerCase().includes('.pdf') ? (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(existingDocuments.audit_accounts!.url)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(existingDocuments.audit_accounts!.url)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          <ActionPermissionGuard resource="audit" action="create">
            <Card className="flex flex-col md:flex-row items-center justify-between w-full md:w-auto gap-2 md:gap-0 md:space-x-3 mb-4">
              <div className="mb-4 sm:mb-0 w-full md:w-auto">
                <Checkbox
                  label="I confirm that all the information provided is accurate and complete."
                  {...register('declaration_accepted', { required: 'Declaration acceptance is required' })}
                  error={errors.declaration_accepted?.message}
                />
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => window.history.back()} className='border border-red-500 text-red-500'>
                  Cancel
                </Button>
                {/* <Button type="button" variant="outline" onClick={saveDraft} className="">
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button> */}
                <Button
                  type="submit"
                  className=""
                  onClick={() => {
                    if (!showValidationErrors()) {
                      return;
                    }
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isResubmitMode ? 'Re-submit' : 'Submit'}
                </Button>
              </div>
            </Card>
          </ActionPermissionGuard>
        </form>
      )}

      {/* Approve/Reject Component for Admin/Registrar */}
      {/* Removed as per edit hint */}

      {/* Rejection/Approval Modal */}
      {/* Removed as per edit hint */}
    </div>
  );
};
