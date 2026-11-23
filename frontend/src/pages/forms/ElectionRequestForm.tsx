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
  Building,
  Calendar,
  FileText,
} from 'lucide-react';
import { DocumentUpload } from '../../components/ui/DocumentUpload';
import toast from 'react-hot-toast';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { createElectionRequest, updateElectionRequest, getElectionRequestById } from '../../lib/data/elections/api';
import { getMySociety } from '../../lib/data/users/api';
import moment from 'moment';

interface ElectionRequestFormData {
  society_registration_id: string;
  last_election_held_date: string;
  last_elected_committee_expiry_date: string;
  reason_for_election_request: 'Regular Term' | 'Early Dissolution' | 'Court Order' | 'Other';
  proposed_election_date: string;
  proposed_venue: string;
  number_of_members_eligible_to_vote: number;
  additional_notes?: string;
}

export const ElectionRequestForm: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { mode } = useSelector((state: RootState) => state.theme);
  const { id: routeId } = useParams<{ id: string }>();
  const locationState = useLocation().state as { id?: string } | undefined;
  const editId = routeId || locationState?.id;
  const [isLoading, setIsLoading] = useState(false);
  const [userSociety, setUserSociety] = useState<any>(null);
  const navigate = useNavigate();
  // Document IDs state for uploaded documents
  const [documentIds, setDocumentIds] = useState<{
    member_list_media_id?: string;
    meeting_resolution_copy_media_id?: string;
    previous_election_report_media_id?: string;
  }>({});

  // State to track existing documents from API
  const [existingDocuments, setExistingDocuments] = useState<{
    member_list_media_id?: { id: string; url: string };
    meeting_resolution_copy_media_id?: { id: string; url: string };
    previous_election_report_media_id?: { id: string; url: string };
  }>({});

  // Custom validation function for date logic
  const validateDateLogic = (lastElectionDate: string, committeeExpiryDate: string) => {
    if (lastElectionDate && committeeExpiryDate) {
      const lastElection = moment(lastElectionDate);
      const committeeExpiry = moment(committeeExpiryDate);
      return lastElection.isSameOrBefore(committeeExpiry);
    }
    return true;
  };

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ElectionRequestFormData>({
    defaultValues: {
      society_registration_id: '',
      last_election_held_date: '',
      last_elected_committee_expiry_date: '',
      reason_for_election_request: 'Regular Term',
      proposed_election_date: '',
      proposed_venue: '',
      number_of_members_eligible_to_vote: 0,
      additional_notes: ''
    },
    mode: 'onSubmit'
  });

  // Watch the date fields for real-time validation
  const watchedLastElectionDate = watch('last_election_held_date');
  const watchedCommitteeExpiryDate = watch('last_elected_committee_expiry_date');

  const reasonOptions = [
    { value: 'Regular Term', label: 'Regular Term' },
    { value: 'Early Dissolution', label: 'Early Dissolution' },
    { value: 'Court Order', label: 'Court Order' },
    { value: 'Other', label: 'Other' }
  ];

  // Load user's society information
  const loadUserSociety = async () => {
    if (!user) {
      return;
    }
    try {
      const society = await getMySociety();
      if (society?.data?.society?.id) {
        setUserSociety(society);
        setValue('society_registration_id', society.data.society.id);
      } else {
        if (!editId && user.role === 'applicant') {
          toast.error('You need a registered society before creating an election request');
          navigate('/election-requests', { replace: true });
        }
      }
    } catch (error) {
      console.error('Error loading user society:', error);
      if (!editId && user.role === 'applicant') {
        toast.error('You need a registered society before creating an election request');
        navigate('/election-requests', { replace: true });
      } else if (!editId) {
        toast.error('Failed to load society information');
      }
    }
  };

  // Load existing election request data if editing
  const loadExistingData = async () => {
    if (!editId) return;

    try {
      setIsLoading(true);
      const response = await getElectionRequestById(editId);
      // API response is a single object, not nested under data
      const electionRequest: any = response;

      if (electionRequest) {
        // Set form values - using correct field names from API response
        setValue('society_registration_id', electionRequest.society_registration_id);
        setValue('last_election_held_date', electionRequest.Last_election_held_date || electionRequest.last_election_held_date);
        setValue('last_elected_committee_expiry_date', electionRequest.last_elected_committee_expiry_date);
        setValue('reason_for_election_request', electionRequest.reason_for_election_request);
        setValue('proposed_election_date', electionRequest.proposed_election_date);
        setValue('proposed_venue', electionRequest.proposed_venue);
        setValue('number_of_members_eligible_to_vote', electionRequest.number_of_members_eligible_to_vote);
        setValue('additional_notes', electionRequest.additional_notes || '');

        // Set document IDs and existing documents
        if (electionRequest.member_list_media_id && electionRequest.memberListMedia) {
          const mediaId = electionRequest.member_list_media_id;
          setExistingDocuments(prev => ({
            ...prev,
            member_list_media_id: {
              id: mediaId,
              url: electionRequest.memberListMedia.url
            }
          }));
          setDocumentIds(prev => ({
            ...prev,
            member_list_media_id: mediaId
          }));
        }

        if (electionRequest.meeting_resolution_copy_media_id && electionRequest.meetingResolutionCopyMedia) {
          const mediaId = electionRequest.meeting_resolution_copy_media_id;
          setExistingDocuments(prev => ({
            ...prev,
            meeting_resolution_copy_media_id: {
              id: mediaId,
              url: electionRequest.meetingResolutionCopyMedia.url
            }
          }));
          setDocumentIds(prev => ({
            ...prev,
            meeting_resolution_copy_media_id: mediaId
          }));
        }

        if (electionRequest.previous_election_report_media_id && electionRequest.previousElectionReportMedia) {
          const mediaId = electionRequest.previous_election_report_media_id;
          setExistingDocuments(prev => ({
            ...prev,
            previous_election_report_media_id: {
              id: mediaId,
              url: electionRequest.previousElectionReportMedia.url
            }
          }));
          setDocumentIds(prev => ({
            ...prev,
            previous_election_report_media_id: mediaId
          }));
        }
      }
    } catch (error) {
      console.error('Error loading election request:', error);
      toast.error('Failed to load election request data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      return;
    }
    loadUserSociety();
    if (editId) {
      loadExistingData();
    }
  }, [editId, user]);

  const onSubmit = async (data: ElectionRequestFormData) => {
    // Validate that required documents are uploaded
    if (!documentIds.member_list_media_id) {
      toast.error('Member List is required');
      return;
    }

    if (!documentIds.meeting_resolution_copy_media_id) {
      toast.error('Meeting Resolution Copy is required');
      return;
    }

    // Validate date logic: Last election held date must be before or equal to committee expiry date
    if (data.last_election_held_date && data.last_elected_committee_expiry_date) {
      const lastElectionDate = moment(data.last_election_held_date);
      const committeeExpiryDate = moment(data.last_elected_committee_expiry_date);
      
      if (lastElectionDate.isAfter(committeeExpiryDate)) {
        toast.error('Last election held date must be before or equal to committee expiry date');
        return;
      }
    }

    try {
      setIsLoading(true);

      const societyId = userSociety?.data?.society?.id;
      if (!societyId) {
        toast.error('Society information is required');
        return;
      }

      const submitData = {
        ...data,
        ...documentIds,
        society_registration_id: societyId
      };

      if (editId) {
        await updateElectionRequest(editId, submitData);
        toast.success('Election request updated successfully');
      } else {
        await createElectionRequest(submitData);
        toast.success('Election request created successfully');
      }

      navigate('/election-requests');
    } catch (error: any) {
      console.error('Error saving election request:', error);
      toast.error(error.message || 'Failed to save election request');
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

  if (isLoading) {
    return (
      <div className="mt-4">
        <Card className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading election request data...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-3 h-full">
        {/* Society Information */}
        <Card>
          <h3 className={`text-lg font-semibold text-gray-900 ${mode}:text-gray-100 mb-6 flex items-center`}>
            <Building className="h-5 w-5 mr-2" />
            Society Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Society Registration Number"
              value={userSociety?.data?.society?.registration_number || ''}
              disabled
              className="bg-gray-50"
            />
            <Input
              label="Society Name"
              value={userSociety?.data?.society?.cooperative_society_name || ''}
              disabled
              className="bg-gray-50"
            />
          </div>
        </Card>

        {/* Election Details */}
        <Card>
          <h3 className={`text-lg font-semibold text-gray-900 ${mode}:text-gray-100 mb-4 flex items-center`}>
            <Calendar className="h-5 w-5 mr-2" />
            Election Details
          </h3>
          {/* Date validation warning */}
          {watchedLastElectionDate && watchedCommitteeExpiryDate && !validateDateLogic(watchedLastElectionDate, watchedCommitteeExpiryDate) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">
                    <strong>Date Validation Error:</strong> The last election held date must be before or equal to the committee expiry date.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Input
                label="Last Election Held Date"
                type="date"
                max={moment().format('YYYY-MM-DD')}
                {...register('last_election_held_date', { required: 'Last election held date is required' })}
                error={errors.last_election_held_date?.message}
                required
              />
              {/* Real-time date validation feedback */}
              {watchedLastElectionDate && watchedCommitteeExpiryDate && !validateDateLogic(watchedLastElectionDate, watchedCommitteeExpiryDate) && (
                <p className="mt-1 text-sm text-red-600">
                  Last election date must be before or equal to committee expiry date
                </p>
              )}
              {/* Helper text */}
              <p className="mt-1 text-xs text-gray-500">
                Date when the last election was conducted
              </p>
            </div>
            <div>
              <Input
                label="Last Elected Committee Expiry Date"
                type="date"
                {...register('last_elected_committee_expiry_date', { required: 'Committee expiry date is required' })}
                error={errors.last_elected_committee_expiry_date?.message}
                required
              />
              {/* Real-time date validation feedback */}
              {watchedLastElectionDate && watchedCommitteeExpiryDate && !validateDateLogic(watchedLastElectionDate, watchedCommitteeExpiryDate) && (
                <p className="mt-1 text-sm text-red-600">
                  Committee expiry date must be after or equal to last election date
                </p>
              )}
              {/* Helper text */}
              <p className="mt-1 text-xs text-gray-500">
                Date when the current committee's term expires
              </p>
            </div>
            <Select
              label="Reason for Election Request"
              value={watch('reason_for_election_request')}
              onChange={(e) => {
                const value = e.target.value;
                setValue('reason_for_election_request', value as 'Regular Term' | 'Early Dissolution' | 'Court Order' | 'Other');
                // Trigger validation after setting value
                if (value === '') {
                  setValue('reason_for_election_request', '' as 'Regular Term' | 'Early Dissolution' | 'Court Order' | 'Other', { shouldValidate: true });
                } else {
                  setValue('reason_for_election_request', value as 'Regular Term' | 'Early Dissolution' | 'Court Order' | 'Other', { shouldValidate: true });
                }
              }}
              required
              error={errors.reason_for_election_request?.message}
            >
              {reasonOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            {errors.reason_for_election_request && (
              <p className="mt-1 text-sm text-red-600">{errors.reason_for_election_request.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-3">
            <Input
              label="Proposed Election Date"
              type="date"
              min={moment().format('YYYY-MM-DD')}
              {...register('proposed_election_date', { required: 'Proposed election date is required' })}
              error={errors.proposed_election_date?.message}
              required
            />
            <Input
              label="Proposed Venue"
              {...register('proposed_venue', { required: 'Proposed venue is required' })}
              error={errors.proposed_venue?.message}
              placeholder="Enter proposed venue"
              maxLength={40}
              required
            />
            <Input
              label="Number of Promoters Eligible to Vote"
              type="number"
              {...register('number_of_members_eligible_to_vote', {
                required: 'Number of promoters is required',
                min: { value: 1, message: 'Must be at least 1' }
              })}
              error={errors.number_of_members_eligible_to_vote?.message}
              placeholder="Enter number of promoters"
              maxLength={5}
              required
            />
          </div>

          <Textarea
            label="Additional Notes"
            {...register('additional_notes')}
            error={errors.additional_notes?.message}
            placeholder="Any additional notes or remarks"
            rows={3}
          />
        </Card>

        {/* Document Uploads */}
        <Card>
          <h3 className={`text-lg font-semibold text-gray-900 ${mode}:text-gray-100 mb-6 flex items-center`}>
            <FileText className="h-5 w-5 mr-2" />
            Required Documents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DocumentUpload
              label="Promoter List"
              onUploadComplete={(mediaId: string) => handleDocumentUpload('member_list_media_id', mediaId)}
              onUploadCancel={() => handleDocumentRemove('member_list_media_id')}
              existingDocument={existingDocuments.member_list_media_id}
              required
            />

            <DocumentUpload
              label="Meeting Resolution Copy"
              onUploadComplete={(mediaId: string) => handleDocumentUpload('meeting_resolution_copy_media_id', mediaId)}
              onUploadCancel={() => handleDocumentRemove('meeting_resolution_copy_media_id')}
              existingDocument={existingDocuments.meeting_resolution_copy_media_id}
              required
            />

            <DocumentUpload
              label="Previous Election Report (Optional)"
              onUploadComplete={(mediaId: string) => handleDocumentUpload('previous_election_report_media_id', mediaId)}
              onUploadCancel={() => handleDocumentRemove('previous_election_report_media_id')}
              existingDocument={existingDocuments.previous_election_report_media_id}
            />
          </div>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/election-requests')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{editId ? 'Update' : 'Submit'} Election Request</span>
          </Button>
        </div>
      </form>
    </div >
  );
};