import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { RootState } from '../../store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import {
  Save,
  RefreshCw,
} from 'lucide-react';
import { DocumentUpload } from '../../components/ui/DocumentUpload';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { createAnnualFiling, updateAnnualFiling, getAnnualFilingById } from '../../lib/data/annualFilings/api';
import { getMySociety } from '../../lib/data/users/api';
import moment from 'moment';
import { getAuditors } from '../../lib/data/others/api';
import { getSectorOfOperations } from '../../lib/data/master-data/api';
import { useMasterData } from '../../hooks/useMasterData';
import {
  isValidTenDigitMobile,
  sanitizeTenDigitMobileInput,
  TEN_DIGIT_MOBILE_MESSAGE,
  TEN_DIGIT_MOBILE_REGEX,
} from '../../utils/validation';

interface AnnualFilingFormData {
  society_id: string;
  financial_year: string;
  society_name: string;
  society_address: string;
  president_name: string;
  president_contact: string;
  secretary_name: string;
  secretary_contact: string;
  registration_number: string;
  registration_date: string;
  society_type: string;
  principal_activities: string;
  major_activities: string;
  operation_areas: string;
  total_members: number;
  nominal_members: number;
  institutional_members: number;
  defaulter_members: number;
  authorised_share_capital: number;
  paid_up_share_capital: number;
  total_reserve: number;
  deposits: number;
  total_borrowings: number;
  working_capital: number;
  total_liabilities: number;
  total_funds_position: number;
  cash_in_hand: number;
  balance_with_banks: number;
  investments: number;
  fixed_assets: number;
  bad_debts: number;
  total_assets: number;
  loan_advances: number;
  loan_recovered: number;
  loan_outstanding: number;
  total_income: number;
  total_expenditure: number;
  profit: number;
  net_profit: number;
  total_purchase: number;
  total_sale: number;
  audit_upto_year: string;
  audit_classification: string;
  compliance_audit: string;
  last_election_date: string;
  next_election_due_date: string;
  committee_members_count: number;
  committee_meetings_count: number;
  general_body_constitution?: string;
  last_agm_date: string;
  sanctioned_posts: number;
  employees_category_wise: string;
  trained_employees: number;
  cost_management_salary: number;
  cost_management_other: number;
  cost_management_admin: number;
  grants_received: number;
  misappropriation_nature: string;
  misappropriation_level: string;
  misappropriation_amount: number;
  misappropriation_amount_received: number;
  misappropriation_status: string;
  cases_pending_start: number;
  cases_settled: number;
  cases_pending_end: number;
  audit_date: string;
  general_body_meeting_date: string;
  auditor_name: string;
  auditor_registration_no: string;
  audit_completion_date: string;
  cost_of_management_type?: string;
  arbitration_authority: string;
}

export const AnnualFilingForm: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { id } = useParams(); // For editing existing annual filing
  const [isLoading, setIsLoading] = useState(false);
  const [userSociety, setUserSociety] = useState<any>(null);
  const [auditors, setAuditors] = useState<any>([]);
  const navigate = useNavigate();

  // Document IDs state for uploaded documents
  const [documentIds, setDocumentIds] = useState<{
    balance_sheet?: string;
    surplus_plan?: string;
    general_body_constitution?: string;
    byelaw_amendments?: string;
  }>({});

  // State to track existing documents from API
  const [existingDocuments, setExistingDocuments] = useState<{
    byelaw_amendments?: { id: string; url: string };
    balance_sheet?: { id: string; url: string };
    surplus_plan?: { id: string; url: string };
    general_body_constitution?: { id: string; url: string };
  }>({});

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset, trigger } = useForm<AnnualFilingFormData>({
    defaultValues: {
      society_id: '',
      financial_year: '',
      society_name: '',
      society_address: '',
      president_name: '',
      president_contact: '',
      secretary_name: '',
      secretary_contact: '',
      registration_number: '',
      registration_date: '',
      society_type: '',
      principal_activities: '',
      major_activities: '',
      operation_areas: '',
      total_members: 0,
      nominal_members: 0,
      institutional_members: 0,
      defaulter_members: 0,
      authorised_share_capital: 0,
      paid_up_share_capital: 0,
      total_reserve: 0,
      deposits: 0,
      total_borrowings: 0,
      working_capital: 0,
      total_liabilities: 0,
      total_funds_position: 0,
      cash_in_hand: 0,
      balance_with_banks: 0,
      investments: 0,
      fixed_assets: 0,
      bad_debts: 0,
      total_assets: 0,
      loan_advances: 0,
      loan_recovered: 0,
      loan_outstanding: 0,
      total_income: 0,
      total_expenditure: 0,
      profit: 0,
      net_profit: 0,
      total_purchase: 0,
      total_sale: 0,
      audit_upto_year: '',
      audit_classification: '',
      compliance_audit: '',
      last_election_date: '',
      next_election_due_date: '',
      committee_members_count: 0,
      committee_meetings_count: 0,
      general_body_constitution: '',
      last_agm_date: '',
      sanctioned_posts: 0,
      employees_category_wise: '',
      trained_employees: 0,
      cost_management_salary: 0,
      cost_management_other: 0,
      cost_management_admin: 0,
      grants_received: 0,
      misappropriation_nature: '',
      misappropriation_level: '',
      misappropriation_amount: 0,
      misappropriation_amount_received: 0,
      misappropriation_status: '',
      cases_pending_start: 0,
      cases_settled: 0,
      cases_pending_end: 0,
      audit_date: '',
      general_body_meeting_date: '',
      auditor_name: '',
      auditor_registration_no: '',
      audit_completion_date: '',
      cost_of_management_type: '',
      arbitration_authority: ''
    },
    mode: 'onSubmit'
  });

  const bindTenDigitMobileField = (
    name: 'president_contact' | 'secretary_contact',
    requiredMessage: string,
  ) => {
    const { onChange, ...rest } = register(name, {
      required: requiredMessage,
      pattern: {
        value: TEN_DIGIT_MOBILE_REGEX,
        message: TEN_DIGIT_MOBILE_MESSAGE,
      },
      validate: (value) =>
        isValidTenDigitMobile(value) || TEN_DIGIT_MOBILE_MESSAGE,
    });

    return {
      ...rest,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        event.target.value = sanitizeTenDigitMobileInput(event.target.value);
        onChange(event);
      },
    };
  };

  const presidentContactField = bindTenDigitMobileField(
    'president_contact',
    'President contact is required',
  );
  const secretaryContactField = bindTenDigitMobileField(
    'secretary_contact',
    'Secretary contact is required',
  );

  const { masterData } = useMasterData()

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

  // Load user's society information
  const loadUserSociety = async () => {
    if (user?.role !== 'applicant') {
      return;
    }

    try {
      const response = await getMySociety();
     
      if (response?.data?.society) {
        setUserSociety(response.data);
        const society = response.data.society;
        // Auto-fill society details if creating new
        if (!id) {
          setValue('society_id', society.society_id || '');
          setValue('society_name', society.cooperative_society_name || '');
          setValue('society_address', society.full_address || '');
          setValue('registration_number', society.registration_number || '');
          setValue('registration_date', society.created_at ? moment(society.created_at).format('YYYY-MM-DD') : '');
          setValue('society_type', society.sector_of_operation?.id || '');
          setValue('principal_activities', society.principal_activities || '');
          setValue('major_activities', society.major_activities || '');
          setValue('operation_areas', society.operation_areas || '');
        }
      }
    } catch (error) {
      console.error('Error loading user society:', error);
    }
  };

  // Load existing annual filing data for editing
  const loadExistingData = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const response = await getAnnualFilingById(id);
      if (response?.data) {
        const filing = response.data;

        // Set form values
        setValue('society_id', filing.society_id);
        setValue('financial_year', filing.financial_year || '');
        setValue('society_name', filing.cooperative_society_name || '');
        setValue('society_address', filing.society_address || '');
        setValue('president_name', filing.president_name || '');
        setValue('president_contact', sanitizeTenDigitMobileInput(filing.president_contact || ''));
        setValue('secretary_name', filing.secretary_name || '');
        setValue('secretary_contact', sanitizeTenDigitMobileInput(filing.secretary_contact || ''));
        setValue('registration_number', filing.registration_number || '');
        const regDate = filing.registration_date ? moment(filing.registration_date).format('YYYY-MM-DD') : (filing.created_at ? moment(filing.created_at).format('YYYY-MM-DD') : '');
        setValue('registration_date', regDate);
        setValue('society_type', filing.sector_of_operation?.id || '');
        setValue('principal_activities', filing.principal_activities || '');
        setValue('major_activities', filing.major_activities || '');
        setValue('operation_areas', filing.operation_areas || '');
        setValue('total_members', filing.total_members || 0);
        setValue('nominal_members', filing.nominal_members || 0);
        setValue('institutional_members', filing.institutional_members || 0);
        setValue('defaulter_members', filing.defaulter_members || 0);
        setValue('authorised_share_capital', filing.authorised_share_capital || 0);
        setValue('paid_up_share_capital', filing.paid_up_share_capital || 0);
        setValue('total_reserve', filing.total_reserve || 0);
        setValue('deposits', filing.deposits || 0);
        setValue('total_borrowings', filing.total_borrowings || 0);
        setValue('working_capital', filing.working_capital || 0);
        setValue('total_liabilities', filing.total_liabilities || 0);
        setValue('total_funds_position', filing.total_funds_position || 0);
        setValue('cash_in_hand', filing.cash_in_hand || 0);
        setValue('balance_with_banks', filing.balance_with_banks || 0);
        setValue('investments', filing.investments || 0);
        setValue('fixed_assets', filing.fixed_assets || 0);
        setValue('bad_debts', filing.bad_debts || 0);
        setValue('total_assets', filing.total_assets || 0);
        setValue('loan_advances', filing.loan_advances || 0);
        setValue('loan_recovered', filing.loan_recovered || 0);
        setValue('loan_outstanding', filing.loan_outstanding || 0);
        setValue('total_income', filing.total_income || 0);
        setValue('total_expenditure', filing.total_expenditure || 0);
        setValue('profit', filing.profit || 0);
        setValue('net_profit', filing.net_profit || 0);
        setValue('total_purchase', filing.total_purchase || 0);
        setValue('total_sale', filing.total_sale || 0);
        setValue('audit_upto_year', filing.audit_upto_year || '');
        setValue('audit_classification', filing.audit_classification || '');
        setValue('compliance_audit', filing.compliance_audit || '');
        setValue('last_election_date', filing.last_election_date ? moment(filing.last_election_date).format('YYYY-MM-DD') : '');
        setValue('next_election_due_date', filing.next_election_due_date ? moment(filing.next_election_due_date).format('YYYY-MM-DD') : '');
        setValue('committee_members_count', filing.committee_members_count || 0);
        setValue('committee_meetings_count', filing.committee_meetings_count || 0);
        setValue('last_agm_date', filing.last_agm_date ? moment(filing.last_agm_date).format('YYYY-MM-DD') : '');
        setValue('sanctioned_posts', filing.sanctioned_posts || 0);
        setValue('employees_category_wise', filing.employees_category_wise || '');
        setValue('trained_employees', filing.trained_employees || 0);
        setValue('cost_management_salary', filing.cost_management_salary || 0);
        setValue('cost_management_other', filing.cost_management_other || 0);
        setValue('cost_management_admin', filing.cost_management_admin || 0);
        setValue('grants_received', filing.grants_received || 0);
        setValue('misappropriation_nature', filing.misappropriation_nature || '');
        setValue('misappropriation_level', filing.misappropriation_level || '');
        setValue('misappropriation_amount', filing.misappropriation_amount || 0);
        setValue('misappropriation_amount_received', filing.misappropriation_amount_received || 0);
        setValue('misappropriation_status', filing.misappropriation_status || '');
        setValue('cases_pending_start', filing.cases_pending_start || 0);
        setValue('cases_settled', filing.cases_settled || 0);
        setValue('cases_pending_end', filing.cases_pending_end || 0);
        setValue('audit_date', filing.audit_date ? moment(filing.audit_date).format('YYYY-MM-DD') : '');
        setValue('general_body_meeting_date', filing.general_body_meeting_date ? moment(filing.general_body_meeting_date).format('YYYY-MM-DD') : '');
        setValue('auditor_name', filing.auditor_name || '');
        setValue('auditor_registration_no', filing.auditor_registration_no || '');
        setValue('audit_completion_date', filing.audit_completion_date ? moment(filing.audit_completion_date).format('YYYY-MM-DD') : '');
        setValue('arbitration_authority', filing.arbitration_authority || '');
        // Handle new media fields
        if (filing.byelawAmendmentsMedia) {
          setExistingDocuments(prev => ({
            ...prev,
            byelaw_amendments: {
              id: filing.byelaw_amendments!,
              url: filing.byelawAmendmentsMedia.url
            }
          }));
          setDocumentIds(prev => ({
            ...prev,
            byelaw_amendments: filing.byelaw_amendments!
          }));
        }

        if (filing.balanceSheetMedia) {
          setExistingDocuments(prev => ({
            ...prev,
            balance_sheet: {
              id: filing.balance_sheet!,
              url: filing.balanceSheetMedia.url
            }
          }));
          setDocumentIds(prev => ({
            ...prev,
            balance_sheet: filing.balance_sheet!
          }));
        }

        if (filing.surplusDisposalPlanMedia) {
          setExistingDocuments(prev => ({
            ...prev,
            surplus_plan: {
              id: filing.surplus_plan!,
              url: filing.surplusDisposalPlanMedia.url
            }
          }));
          setDocumentIds(prev => ({
            ...prev,
            surplus_plan: filing.surplus_plan!
          }));
        }

        if (filing.generalBodyConstitutionMedia) {
          setExistingDocuments(prev => ({
            ...prev,
            general_body_constitution: {
              id: filing.general_body_constitution!,
              url: filing.generalBodyConstitutionMedia.url
            }
          }));
          setDocumentIds(prev => ({
            ...prev,
            general_body_constitution: filing.general_body_constitution!
          }));
        }
      }
    } catch (error) {
      console.error('Error loading annual filing:', error);
      toast.error('Failed to load annual filing data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserSociety();
    if (id) {
      loadExistingData();
    }
  }, [id, user?.role]);

  useEffect(() => {
    const fetchAuditors = async () => {
      const res = await getAuditors();
      if (res) {
        setAuditors(res);
      }
    }
    fetchAuditors();
  }, []);

  const onSubmit = async (data: AnnualFilingFormData) => {
    const today = moment().format('YYYY-MM-DD');
    if (String(data.last_agm_date || '').slice(0, 10) > today) {
      toast.error('Last AGM date cannot be in the future');
      return;
    }
    if (String(data.general_body_meeting_date || '').slice(0, 10) > today) {
      toast.error('General body meeting date cannot be in the future');
      return;
    }

    if (!documentIds.balance_sheet) {
      toast.error('Balance Sheet, Income and Expenditure document is required');
      return;
    }

    const presidentContact = sanitizeTenDigitMobileInput(data.president_contact || '');
    const secretaryContact = sanitizeTenDigitMobileInput(data.secretary_contact || '');

    if (!isValidTenDigitMobile(presidentContact)) {
      toast.error(`President contact: ${TEN_DIGIT_MOBILE_MESSAGE}`);
      setValue('president_contact', presidentContact);
      await trigger('president_contact');
      return;
    }

    if (!isValidTenDigitMobile(secretaryContact)) {
      toast.error(`Secretary contact: ${TEN_DIGIT_MOBILE_MESSAGE}`);
      setValue('secretary_contact', secretaryContact);
      await trigger('secretary_contact');
      return;
    }

    try {
      setIsLoading(true);

      const submitData = {
        ...data,
        president_contact: presidentContact,
        secretary_contact: secretaryContact,
        ...documentIds,
        society_id: userSociety.society.id
      };

      if (id) {
        // Update existing annual filing
        await updateAnnualFiling(id, submitData);
        toast.success('Annual filing updated successfully');
      } else {
        // Create new annual filing
        await createAnnualFiling(submitData);
        toast.success('Annual filing created successfully');
      }

      navigate('/annual-filings');
    } catch (error: any) {
      console.error('Error saving annual filing:', error);
      toast.error(error.message || 'Failed to save annual filing');
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

  const auditClassificationOptions = [
    { value: 'A', label: 'A - Excellent' },
    { value: 'B', label: 'B - Good' },
    { value: 'C', label: 'C - Satisfactory' },
    { value: 'D', label: 'D - Poor' },
  ];

  return (
    <div className="space-y-3 mt-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {/* Basic Information & Society Details */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Basic Information & Society Details</h3>

          {/* Society Details - Compact Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
            <Input
              label="Society ID"
              {...register('society_id', { required: 'Society ID is required' })}
              error={errors.society_id?.message}
              placeholder="Enter society ID"
              disabled={!!id || user?.role === 'applicant'}
              required
            />
            <Input
              label="Society Name"
              {...register('society_name', { required: 'Society name is required' })}
              error={errors.society_name?.message}
              placeholder="Enter society name"
              disabled={true}
              required
            />
            <Input
              label="Registration Number"
              {...register('registration_number', { required: 'Registration number is required' })}
              error={errors.registration_number?.message}
              placeholder="Enter registration number"
              disabled={true}
              required
            />
            <Input
              label="Registration Date"
              type="date"
              max={moment().format('YYYY-MM-DD')}
              {...register('registration_date', { required: 'Registration date is required' })}
              error={errors.registration_date?.message}
              disabled={true}
              required
            />

            <div className="mb-4">
              <input
                {...register('financial_year', {
                  required: 'Financial year is required',
                  pattern: {
                    value: /^\d{4}-\d{2}$/,
                    message: 'Financial year must be in format YYYY-YY (e.g., 2024-25)'
                  }
                })}
                type="hidden"
              />
              <Select
                label="Financial Year"
                value={watch('financial_year') || ''}
                onChange={(e) => {
                  setValue('financial_year', e.target.value);
                  trigger('financial_year');
                }}
                error={errors.financial_year?.message}
                placeholder="Select financial year"
                required
              >
                {financialYearOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Address - Full Width */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-1 gap-4">
            <Textarea
              label="Society Address"
              {...register('society_address', { required: 'Society address is required', minLength: { value: 3, message: 'Society address must be at least 3 characters long' } })}
              error={errors.society_address?.message}
              placeholder="Enter complete society address (minimum 3 characters)"
              rows={2}
              required
              disabled={true}
            />
            {/* <Textarea
              label="Major Areas/States of Operation"
              {...register('operation_areas', { required: 'Operation areas are required', minLength: { value: 3, message: 'Operation areas must be at least 3 characters long' } })}
              error={errors.operation_areas?.message}
              placeholder="Enter major areas and states of operation"
              rows={2}
              required
            /> */}
          </div>

          {/* Activities - Side by Side */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea
              label="Principal Activities/Sectors"
              {...register('principal_activities', { required: 'Principal activities are required', minLength: { value: 3, message: 'Principal activities must be at least 3 characters long' } })}
              error={errors.principal_activities?.message}
              placeholder="Enter principal activities and sectors"
              rows={2}
              required
            />
            <Textarea
              label="Major Activities Undertaken"
              {...register('major_activities', { required: 'Major activities are required', minLength: { value: 3, message: 'Major activities must be at least 3 characters long' } })}
              error={errors.major_activities?.message}
              placeholder="Enter major activities undertaken"
              rows={2}
              required
            />
          </div>
        </Card>

        {/* Leadership Contact Information */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Leadership Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Name of Society President/CEO/MD/Chairperson"
              {...register('president_name', { required: 'President name is required' })}
              error={errors.president_name?.message}
              placeholder="Enter president/CEO/MD/Chairperson name"
              required
              maxLength={40}
            />
            <Input
              label="President Contact Details"
              type="tel"
              {...presidentContactField}
              error={errors.president_contact?.message}
              placeholder="Enter 10-digit mobile number"
              required
              maxLength={10}
              inputMode="numeric"
            />
            <Input
              label="Name of Society Secretary"
              {...register('secretary_name', { required: 'Secretary name is required' })}
              error={errors.secretary_name?.message}
              placeholder="Enter secretary name"
              required
              maxLength={40}
            />
            <Input
              label="Secretary Contact Details"
              type="tel"
              {...secretaryContactField}
              error={errors.secretary_contact?.message}
              placeholder="Enter 10-digit mobile number"
              required
              maxLength={10}
              inputMode="numeric"
            />
          </div>
        </Card>

        {/* Membership Information */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Membership Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Input
              label="Total Promoters"
              type="number"
              min="0"
              {...register('total_members', {
                required: 'Total promoters is required',
                min: { value: 0, message: 'Total promoters cannot be negative' }
              })}
              error={errors.total_members?.message}
              placeholder="0"
              maxLength={8}
              required
            />
            <Input
              label="Total Nominal Promoters"
              type="number"
              min="0"
              {...register('nominal_members', {
                required: 'Total nominal promoters is required',
                min: { value: 0, message: 'Total nominal promoters cannot be negative' }
              })}
              error={errors.nominal_members?.message}
              placeholder="0"
              maxLength={8}
              required
            />
            <Input
              label="Institutional Promoters"
              type="number"
              min="0"
              {...register('institutional_members', {
                required: 'Institutional promoters is required',
                min: { value: 0, message: 'Institutional promoters cannot be negative' }
              })}
              error={errors.institutional_members?.message}
              placeholder="0"
              maxLength={8}
              required
            />
            <Input
              label="Defaulter Promoters"
              type="number"
              min="0"
              {...register('defaulter_members', {
                required: 'Defaulter promoters is required',
                min: { value: 0, message: 'Defaulter promoters cannot be negative' }
              })}
              error={errors.defaulter_members?.message}
              placeholder="0"
              required
              maxLength={8}
            />
          </div>
        </Card>

        {/* Financial Information - Capital & Reserves */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Financial Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Input
              label="Authorised Share Capital"
              type="number"
              min="0"
              step="0.01"
              {...register('authorised_share_capital', {
                required: 'Authorised share capital is required',
                min: { value: 0, message: 'Amount cannot be negative' }
              })}
              error={errors.authorised_share_capital?.message}
              placeholder="0.00"
              required
              maxLength={8}
            />
            <Input
              label="Paid Up Share Capital"
              type="number"
              min="0"
              step="0.01"
              {...register('paid_up_share_capital', {
                required: 'Paid up share capital is required',
                min: { value: 0, message: 'Amount cannot be negative' }
              })}
              error={errors.paid_up_share_capital?.message}
              placeholder="0.00"
              required
              maxLength={8}
            />
            <Input
              label="Total Reserve"
              type="number"
              min="0"
              step="0.01"
              {...register('total_reserve', {
                required: 'Total reserve is required',
                min: { value: 0, message: 'Amount cannot be negative' }
              })}
              error={errors.total_reserve?.message}
              placeholder="0.00"
              required
              maxLength={8}
            />
            <Input
              label="Deposits Made by Society"
              type="number"
              min="0"
              step="0.01"
              {...register('deposits', {
                required: 'Deposits are required',
                min: { value: 0, message: 'Amount cannot be negative' }
              })}
              error={errors.deposits?.message}
              placeholder="0.00"
              required
              maxLength={8}
            />
            <Input
              label="Total Borrowings"
              type="number"
              min="0"
              step="0.01"
              {...register('total_borrowings', {
                required: 'Total borrowings is required',
                min: { value: 0, message: 'Amount cannot be negative' }
              })}
              error={errors.total_borrowings?.message}
              placeholder="0.00"
              required
              maxLength={8}
            />
            <Input
              label="Working Capital"
              type="number"
              min="0"
              step="0.01"
              {...register('working_capital', {
                required: 'Working capital is required',
                min: { value: 0, message: 'Amount cannot be negative' }
              })}
              error={errors.working_capital?.message}
              placeholder="0.00"
              required
            />
            <Input
              label="Total Liabilities"
              type="number"
              min="0"
              step="0.01"
              {...register('total_liabilities', {
                required: 'Total liabilities is required',
                min: { value: 0, message: 'Amount cannot be negative' }
              })}
              error={errors.total_liabilities?.message}
              placeholder="0.00"
              required
              maxLength={8}
            />
            <Input
              label="Total Funds Position"
              type="number"
              min="0"
              step="0.01"
              {...register('total_funds_position', {
                required: 'Total funds position is required',
                min: { value: 0, message: 'Amount cannot be negative' }
              })}
              error={errors.total_funds_position?.message}
              placeholder="0.00"
              required
              maxLength={8}
            />
            <Input
              label="Cash in Hand"
              type="number"
              min="0"
              step="0.01"
              {...register('cash_in_hand', {
                required: 'Cash in hand is required',
                min: { value: 0, message: 'Amount cannot be negative' }
              })}
              error={errors.cash_in_hand?.message}
              placeholder="0.00"
              required
              maxLength={8}
            />
            <Input
              label="Balance with Banks"
              type="number"
              min="0"
              step="0.01"
              {...register('balance_with_banks', {
                required: 'Bank balance is required',
                min: { value: 0, message: 'Amount cannot be negative' }
              })}
              error={errors.balance_with_banks?.message}
              placeholder="0.00"
              required
              maxLength={8}
            />
            <Input
              label="Investments"
              type="number"
              min="0"
              step="0.01"
              {...register('investments', {
                required: 'Investments are required',
                min: { value: 0, message: 'Amount cannot be negative' }
              })}
              error={errors.investments?.message}
              placeholder="0.00"
              required  
              maxLength={8}
            />
            <Input
              label="Fixed Assets"
              type="number"
              min="0"
              step="0.01"
              {...register('fixed_assets', {
                required: 'Fixed assets are required',
                min: { value: 0, message: 'Amount cannot be negative' }
              })}
              error={errors.fixed_assets?.message}
              placeholder="0.00"
              required
              maxLength={8}
            />
            <Input
              label="Bad Debts"
              type="number"
              min="0"
              step="0.01"
              {...register('bad_debts', {
                required: 'Bad debts are required',
                min: { value: 0, message: 'Amount cannot be negative' }
              })}
              error={errors.bad_debts?.message}
              placeholder="0.00"
              required
              maxLength={8}
            />
            <Input
              label="Total Assets"
              type="number"
              min="0"
              step="0.01"
              {...register('total_assets', {
                required: 'Total assets are required',
                min: { value: 0, message: 'Amount cannot be negative' }
              })}
              error={errors.total_assets?.message}
              placeholder="0.00"
              required
            />
            <Input
              label="Loan Advances"
              type="number"
              min="0"
              step="0.01"
              {...register('loan_advances', {
                required: 'Loan advances are required',
                min: { value: 0, message: 'Amount cannot be negative' }
              })}
              error={errors.loan_advances?.message}
              placeholder="0.00"
              required
            />
            <Input
              label="Loan Recovered"
              type="number"
              min="0"
              step="0.01"
              {...register('loan_recovered', {
                required: 'Loan recovered is required',
                min: { value: 0, message: 'Amount cannot be negative' }
              })}
              error={errors.loan_recovered?.message}
              placeholder="0.00"
              required
              maxLength={8}
            />
            <Input
              label="Loan Outstanding"
              type="number"
              min="0"
              step="1"
              {...register('loan_outstanding', {
                required: 'Loan outstanding is required',
                min: { value: 0, message: 'Amount cannot be negative' }
              })}
              error={errors.loan_outstanding?.message}
              placeholder="0.00"
              required
              maxLength={8}
            />
            <Input
              label="Total Income/Sales"
              type="number"
              min="0"
              step="1"
              {...register('total_income', {
                required: 'Total income/sales is required',
                min: { value: 0, message: 'Amount cannot be negative' }
              })}
              error={errors.total_income?.message}
              placeholder="0.00"
              required
              maxLength={8}
            />
            <Input
              label="Total Expenditure"
              type="number"
              min="0"
              step="1"
              {...register('total_expenditure', {
                required: 'Total expenditure is required',
                min: { value: 0, message: 'Amount cannot be negative' }
              })}
              error={errors.total_expenditure?.message}
              placeholder="0.00"
              required
              maxLength={8}
            />
            <Input
              label="Profit"
              type="number"
              step="1"
              {...register('profit', {
                required: 'Profit is required'
              })}
              error={errors.profit?.message}
              placeholder="0.00"
              required
            />
            <Input
              label="Net Profit"
              type="number"
              step="1"
              {...register('net_profit', {
                required: 'Net profit is required'
              })}
              error={errors.net_profit?.message}
              placeholder="0.00"
              required
              maxLength={8}
            />
            <Input
              label="Total Purchase During the Year"
              type="number"
              min="0"
              step="1"
              {...register('total_purchase', {
                required: 'Total purchase is required',
                min: { value: 0, message: 'Amount cannot be negative' }
              })}
              error={errors.total_purchase?.message}
              placeholder="0.00"
              required
              maxLength={8}
            />
            <Input
              label="Total Sale During the Year"
              type="number"
              min="0"
              step="1"
              {...register('total_sale', {
                required: 'Total sale is required',
                min: { value: 0, message: 'Amount cannot be negative' }
              })}
              error={errors.total_sale?.message}
              placeholder="0.00"
              required
              maxLength={8}
            />
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Arbitration and Execution Cases</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">

            <div>
              <input
                {...register('arbitration_authority', { 
                  required: 'Arbitration and execution cases for recovery is required' 
                })}
                type="hidden"
              />
              <Select
                label="Arbitration and execution cases for recovery in"
                value={watch('arbitration_authority') || ''}
                onChange={(e) => {
                  setValue('arbitration_authority', e.target.value);
                  trigger('arbitration_authority');
                }}
                error={errors.arbitration_authority?.message}
                placeholder="Select arbitration authority"
                required
              >
                <option value="">-- Select --</option>
                {masterData?.arbitrationAuthorities.map((arbitration: any) => (
                  <option key={arbitration.id} value={arbitration.id}>
                    {arbitration.name}
                  </option>
                ))}
              </Select>
            </div>

            <Input
              label="Pending at Beginning of Year"
              type="number"
              min="0"
              {...register('cases_pending_start', {
                required: 'Pending at beginning is required',
                min: { value: 0, message: 'Number cannot be negative' }
              })}
              error={errors.cases_pending_start?.message}
              placeholder="0"
              required
              maxLength={8}
            />
            <Input
              label="Settled During the Year"
              type="number"
              min="0"
              {...register('cases_settled', {
                required: 'Settled during year is required',
                min: { value: 0, message: 'Number cannot be negative' }
              })}
              error={errors.cases_settled?.message}
              placeholder="0"
              required
              maxLength={8}
            />
            <Input
              label="Pending at End of Year"
              type="number"
              min="0"
              {...register('cases_pending_end', {
                required: 'Pending at end is required',
                min: { value: 0, message: 'Number cannot be negative' }
              })}
              error={errors.cases_pending_end?.message}
              placeholder="0"
              required
              maxLength={8}
            />
          </div>
        </Card>

        {/* Audit Information */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Audit Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <input
                {...register('audit_upto_year', {
                  required: 'Audit complete year is required',
                  pattern: {
                    value: /^\d{4}-\d{2}$/,
                    message: 'Audit complete year must be in format YYYY-YY (e.g., 2024-25)'
                  }
                })}
                type="hidden"
              />
              <Select
                label="Year up to which Audit is Complete"
                value={watch('audit_upto_year') || ''}
                onChange={(e) => {
                  setValue('audit_upto_year', e.target.value);
                  trigger('audit_upto_year');
                }}
                error={errors.audit_upto_year?.message}
                placeholder="Select audit complete year"
                required
              >
                {financialYearOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <Select
              label="Audit Classification"
              value={watch('audit_classification')}
              onChange={(e) => {
                setValue('audit_classification', e.target.value as 'A' | 'B' | 'C' | 'D');
                trigger('audit_classification');
              }}
            >
              <option value="">-- Select --</option>
              {auditClassificationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Input
              label="Compliance Audit"
              {...register('compliance_audit', { required: 'Compliance audit is required' })}
              error={errors.compliance_audit?.message}
              placeholder="Enter compliance audit details"
              required
            />
            <Input
              label="Date of Audit of Accounts"
              type="date"
              max={moment().format('YYYY-MM-DD')}
              {...register('audit_date', { required: 'Audit date is required' })}
              error={errors.audit_date?.message}
              required
            />
          </div>
        </Card>

        {/* Election Information */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Election Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Date on which Last Election was Held"
              type="date"
              max={moment().format('YYYY-MM-DD')}
              {...register('last_election_date', { required: 'Last election date is required' })}
              error={errors.last_election_date?.message}
              required
            />
            <Input
              label="Due Date for Next Election"
              type="date"
              {...register('next_election_due_date', { required: 'Next election due date is required' })}
              error={errors.next_election_due_date?.message}
              required
            />
            <Input
              label="Number of Management Committee Shareholders"
              type="number"
              min="0"
              {...register('committee_members_count', {
                required: 'Management committee Shareholders is required',
                min: { value: 0, message: 'Number cannot be negative' }
              })}
              error={errors.committee_members_count?.message}
              placeholder="0"
              required
              maxLength={8}
            />
            <Input
              label="Number of Management Committee Meetings Held"
              type="number"
              min="0"
              {...register('committee_meetings_count', {
                required: 'Committee meetings held is required',
                min: { value: 0, message: 'Number cannot be negative' }
              })}
              error={errors.committee_meetings_count?.message}
              placeholder="0"
              required
              maxLength={8}
            />
          </div>
        </Card>

        {/* General Body & AGM Information */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">General Body & AGM Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Date of Last AGM"
              type="date"
              max={moment().format('YYYY-MM-DD')}
              {...register('last_agm_date', {
                required: 'Last AGM date is required',
                validate: (value) =>
                  !value ||
                  String(value).slice(0, 10) <= moment().format('YYYY-MM-DD') ||
                  'Last AGM date cannot be in the future',
              })}
              error={errors.last_agm_date?.message}
              required
            />
            <Input
              label="Date of General Body Meeting"
              type="date"
              max={moment().format('YYYY-MM-DD')}
              {...register('general_body_meeting_date', {
                required: 'General body meeting date is required',
                validate: (value) =>
                  !value ||
                  String(value).slice(0, 10) <= moment().format('YYYY-MM-DD') ||
                  'General body meeting date cannot be in the future',
              })}
              error={errors.general_body_meeting_date?.message}
              required
            />
          </div>
        </Card>

        {/* Employee Information */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Employee Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Number of Sanctioned Posts"
              type="number"
              min="0"
              {...register('sanctioned_posts', {
                required: 'Sanctioned posts is required',
                min: { value: 0, message: 'Number cannot be negative' }
              })}
              error={errors.sanctioned_posts?.message}
              placeholder="0"
              required
              maxLength={8}
            />
            <Input
              label="Trained During the Reporting Period"
              type="number"
              min="0"
              {...register('trained_employees', {
                required: 'Trained during year is required',
                min: { value: 0, message: 'Number cannot be negative' }
              })}
              error={errors.trained_employees?.message}
              placeholder="0"
              required
              maxLength={8}
            />
            <Textarea
              label="Number of Employees Category Wise"
              {...register('employees_category_wise', { required: 'Employees category wise is required' })}
              error={errors.employees_category_wise?.message}
              placeholder="Enter employee categories and numbers"
              rows={3}
              required
            />
          </div>
        </Card>

        {/* Loans & Grants */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Loans & Grants</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Loans/Grants Received During the Year"
              type="number"
              min="0"
              step="1"
              {...register('grants_received', {
                required: 'Loans/grants received is required',
                min: { value: 0, message: 'Amount cannot be negative' }
              })}
              error={errors.grants_received?.message}
              placeholder="0.00"
              required
              maxLength={8}
            />
          </div>
        </Card>

        {/* Misappropriation Information */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Misappropriation Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Textarea
              label="Nature of Misappropriation"
              {...register('misappropriation_nature')}
              error={errors.misappropriation_nature?.message}
              placeholder="Enter nature of misappropriation"
              rows={3}
            />
            <div>
              <input
                {...register('misappropriation_level')}
                type="hidden"
              />
              <Select
                label="Level at which Misappropriation Occurred"
                value={watch('misappropriation_level') || ''}
                onChange={(e) => {
                  setValue('misappropriation_level', e.target.value);
                  trigger('misappropriation_level');
                }}
                error={errors.misappropriation_level?.message}
                placeholder="Select misappropriation level"
              >
                <option value="">-- Select --</option>
                {masterData.misappropriationLevels.map((level: any) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <input
                {...register('cost_of_management_type')}
                type="hidden"
              />
              <Select
                label="Cost of Management"
                value={watch('cost_of_management_type') || ''}
                onChange={(e) => {
                  setValue('cost_of_management_type', e.target.value);
                  trigger('cost_of_management_type');
                }}
                error={errors.cost_of_management_type?.message}
                placeholder="Select cost of management type"
              >
                <option value="">-- Select --</option>
                {masterData.costOfManagementTypes.map((level: any) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Amount Involved"
              type="number"
              min="0"
              step="1"
              {...register('misappropriation_amount', {
                min: { value: 0, message: 'Amount cannot be negative' }
              })}
              error={errors.misappropriation_amount?.message}
              placeholder="0.00"
              maxLength={8}
            />
            <Input
              label="Amount received"
              type="number"
              min="0"
              step="1"
              {...register('misappropriation_amount_received', {
                min: { value: 0, message: 'Amount cannot be negative' }
              })}
              error={errors.misappropriation_amount_received?.message}
              placeholder="0.00"
              maxLength={8}
            />
            <Textarea
              label="Action Taken and Status"
              {...register('misappropriation_status')}
              error={errors.misappropriation_status?.message}
              placeholder="Enter action taken and status"
              rows={2}
            />
          </div>
        </Card>

        {/* Auditor Information */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Auditor Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Select
              label="Auditor Name"
              value={watch('auditor_name') || ''}
              onChange={(e) => {
                const value = e.target.value;
                setValue('auditor_name', value);
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
              {...register('auditor_registration_no', {
              
                maxLength: {
                  value: 100,
                  message: 'Auditor registration number cannot exceed 100 characters'
                }
              })}
              error={errors.auditor_registration_no?.message}
              placeholder="Enter auditor registration number"
              
            />
            <Input
              label="Audit Completion Date"
              type="date"
              max={moment().format('YYYY-MM-DD')}
              {...register('audit_completion_date', {
                required: 'Audit completion date is required',
                validate: (value: string | undefined) => {
                  if (!value) {
                    return 'Audit completion date is required';
                  }
                  const date = new Date(value);
                  const today = new Date();
                  if (date > today) {
                    return 'Audit completion date cannot be in the future';
                  }
                  return true;
                }
              })}
              error={errors.audit_completion_date?.message}
              required
            />
          </div>
        </Card>

        {/* Document Upload */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Document Upload</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DocumentUpload
              label="Byelaw Amendments"
              onUploadComplete={(mediaId) => handleDocumentUpload('byelaw_amendments', mediaId)}
              onUploadCancel={() => handleDocumentRemove('byelaw_amendments')}
              existingDocument={existingDocuments.byelaw_amendments}
              onReplace={(mediaId) => handleDocumentUpload('byelaw_amendments', mediaId)}
              required={false}
            />
            <DocumentUpload
              label="Balance Sheet, Income and Expenditure"
              onUploadComplete={(mediaId) => handleDocumentUpload('balance_sheet', mediaId)}
              onUploadCancel={() => handleDocumentRemove('balance_sheet')}
              existingDocument={existingDocuments.balance_sheet}
              onReplace={(mediaId) => handleDocumentUpload('balance_sheet', mediaId)}
              required={true}
            />
            <DocumentUpload
              label="Surplus Disposal Plan"
              onUploadComplete={(mediaId) => handleDocumentUpload('surplus_plan', mediaId)}
              onUploadCancel={() => handleDocumentRemove('surplus_plan')}
              existingDocument={existingDocuments.surplus_plan}
              onReplace={(mediaId) => handleDocumentUpload('surplus_plan', mediaId)}
              required={false}
            />
            <DocumentUpload
              label="General Body Constitution"
              onUploadComplete={(mediaId) => handleDocumentUpload('general_body_constitution', mediaId)}
              onUploadCancel={() => handleDocumentRemove('general_body_constitution')}
              existingDocument={existingDocuments.general_body_constitution}
              onReplace={(mediaId) => handleDocumentUpload('general_body_constitution', mediaId)}
              required={false}
            />
          </div>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/annual-filings')}
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
              <Save className="h-4 w-4 mr-2" />
            )}
            {id ? 'Resubmit Annual Filing' : 'Submit Annual Filing'}
          </Button>
        </div>
      </form>
    </div>
  );
};

