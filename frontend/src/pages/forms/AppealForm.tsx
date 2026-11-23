import React, { useState, useEffect } from 'react';
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
  FileText,
  Gavel,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { createAppeal, updateAppeal, getAppealById } from '../../lib/data/appeals/api';
import { getMySociety } from '../../lib/data/users/api';
import moment from 'moment';

interface AppealFormData {
  appellant_type: 'society' | 'member';
  society_registration_no?: string;
  name_of_appellant: string;
  contact_phone: string;
  contact_email: string;
  order_type:
  | 'registration'
  | 'election'
  | 'liquidation'
  | 'penalty'
  | 'audit'
  | 'other';

specify_order_type?: string;
  order_number: string;
  order_date: string;
  grounds_of_appeal: string;
  relief_sought: string;
  supporting_documents?: string;
  filing_date: string;
  officer_remarks?: string;
  hearing_date?: string;
  final_decision_remarks?: string;
  decision_date?: string;
  e_signed: boolean;
}

export const AppealForm: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { id } = useParams(); // For editing existing appeal
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Document IDs state for uploaded documents
  const [documentIds, setDocumentIds] = useState<{
    supporting_documents?: string;
  }>({});

  // State to track existing documents from API
  const [existingDocuments, setExistingDocuments] = useState<{
    supporting_documents?: { id: string; url: string };
  }>({});

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset, trigger } = useForm<AppealFormData>({
    defaultValues: {
      appellant_type: 'society',
      society_registration_no: '',
      name_of_appellant: '',
      contact_phone: '',
      contact_email: '',
   order_type: 'registration',
specify_order_type: '',
      order_number: '',
      order_date: '',
      grounds_of_appeal: '',
      relief_sought: '',
      filing_date: moment().format('YYYY-MM-DD'),
      officer_remarks: '',
      hearing_date: '',
      final_decision_remarks: '',
      decision_date: '',
      e_signed: true
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
      if (response?.data?.society) {
        const society = response.data.society;
        if (!id) {
          setValue('society_registration_no', society.registration_number || '');
        }
      }
    } catch (error) {
      console.error('Error loading user society:', error);
    }
  };

  // Load existing appeal data for editing
  const loadExistingData = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const response = await getAppealById(id);
      if (response?.data) {
        const appeal = response.data;

        // Set form values
        setValue('appellant_type', appeal.appellant_type);
        setValue('e_signed', appeal.e_signed);
        setValue('society_registration_no', appeal.society_registration_no || '');
        setValue('name_of_appellant', appeal.name_of_appellant || '');
        setValue('contact_phone', appeal.contact_phone || '');
        setValue('contact_email', appeal.contact_email || '');
        setValue('specify_order_type', appeal.specify_order_type || '');
        setValue('order_number', appeal.order_number || '');
        setValue('order_date', appeal.order_date ? moment(appeal.order_date).format('YYYY-MM-DD') : '');
        setValue('grounds_of_appeal', appeal.grounds_of_appeal || '');
        setValue('relief_sought', appeal.relief_sought || '');
        setValue('filing_date', appeal.filing_date ? moment(appeal.filing_date).format('YYYY-MM-DD') : '');
        setValue('officer_remarks', appeal.officer_remarks || '');
        setValue('hearing_date', appeal.hearing_date ? moment(appeal.hearing_date).format('YYYY-MM-DD') : '');
        setValue('final_decision_remarks', appeal.final_decision_remarks || '');
        setValue('decision_date', appeal.decision_date ? moment(appeal.decision_date).format('YYYY-MM-DD') : '');

        // Set existing documents
        if (appeal.supportingDocumentsMedia) {
          setExistingDocuments(prev => ({
            ...prev,
            supporting_documents: {
              id: appeal.supporting_documents!,
              url: appeal.supportingDocumentsMedia.url
            }
          }));
          setDocumentIds(prev => ({
            ...prev,
            supporting_documents: appeal.supporting_documents!
          }));
        }

        if (appeal.decisionOrderMedia) {
          setExistingDocuments(prev => ({
            ...prev,
            supporting_documents: appeal.supporting_documents!
          }));
          setDocumentIds(prev => ({
            ...prev,
            supporting_documents: appeal.supporting_documents!
          }));
        }
      }
    } catch (error) {
      console.error('Error loading appeal:', error);
      toast.error('Failed to load appeal data');
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

  const onSubmit = async (data: any) => {
    // Validate that required documents are uploaded
    if (!documentIds.supporting_documents) {
      toast.error('Supporting documents are required');
      return;
    }

    try {
      setIsLoading(true);

      const submitData = {
        ...data,
        ...documentIds,
        filing_date: moment().format('YYYY-MM-DD')
      };

      if (id) {
        // Update existing appeal
        let response = await updateAppeal(id, submitData);
        if(response.success) {
          toast.success(response.message || 'Appeal updated successfully');
        } else {
          toast.error(response.message || 'Failed to update appeal');
        }
      } else {
        // Create new appeal
        let response = await createAppeal(submitData);
        if(response.success) {
          toast.success(response.message || 'Appeal submitted successfully');
        } else {
          toast.error(response.message || 'Failed to submit appeal');
        }
      }

      navigate('/appeals');
    } catch (error: any) {
      console.error('Error saving appeal:', error);
      toast.error(error.message || 'Failed to save appeal');
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
    <div className="space-y-3 mt-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {/* Appellant Information */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            Appellant Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              label="Society Registration Number"
              {...register('society_registration_no', { required: 'Society registration number is required' })}
              error={errors.society_registration_no?.message}
              placeholder="Enter society registration number"
              required
              readOnly={true}
              maxLength={50}
            />

            <Select
              label="Appellant Type"
              value={watch('appellant_type') || ''}
              onChange={(e) => {
                setValue('appellant_type', e.target.value as 'society' | 'member');
                trigger('appellant_type');
              }}
              error={errors.appellant_type?.message}
              placeholder="Select appellant type"
              required
            >
              <option value="society">Society</option>
              <option value="member">Shareholder</option>
            </Select>

            <Input
              label="Appellant Name"
              {...register('name_of_appellant', { required: 'Appellant name is required' })}
              error={errors.name_of_appellant?.message}
              placeholder="Enter appellant name"
              required
              maxLength={50}
            />

            <Input
              label="Contact Number"
              {...register('contact_phone', { required: 'Contact number is required' })}
              error={errors.contact_phone?.message}
              placeholder="Enter contact number"
              required
              maxLength={10}
            />

            <Input
              label="Email Address"
              type="email"
              {...register('contact_email', {
                required: 'Email address is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              error={errors.contact_email?.message}
              placeholder="Enter email address"
              required
              maxLength={50}
            />
          </div>
        </Card>

        {/* Order Details */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Gavel className="w-5 h-5 mr-2 text-red-600" />
            Order Against Which Appeal is Filed
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Select
              label="Order Type"
              value={watch('order_type') || ''}
              onChange={(e) => {
                setValue('order_type', e.target.value as 'registration' | 'election' | 'liquidation' | 'penalty' | 'audit' | 'other');
                trigger('order_type');
              }}
              error={errors.order_type?.message}
              placeholder="Select order type"
              required
            >
              <option value="registration">Registration</option>
              <option value="election">Election</option>
              <option value="liquidation">Liquidation</option>
              <option value="penalty">Penalty</option>
              <option value="audit">Audit</option>
              <option value="other">Other</option>
            </Select>
            {watch("order_type") === "other" && (
              <Input
                label="Specify Order Type"
                {...register("specify_order_type", {
                  required:
                    watch("order_type") === "other"
                      ? "Please specify the order type"
                      : false,
                })}
                error={errors.specify_order_type?.message}
                placeholder="Enter order type"
                required
                maxLength={100}
              />
            )}
            <Input
              label="Order Number"
              {...register('order_number')}
              error={errors.order_number?.message}
              placeholder="Enter order number"
              maxLength={50}
            />

            <Input
              label="Date of Order"
              type="date"
              max={moment().format('YYYY-MM-DD')}
              {...register('order_date')}
              error={errors.order_date?.message}
              maxLength={50}
            />
          </div>
        </Card>

        {/* Appeal Details */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-green-600" />
            Appeal Details
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Textarea
              label="Grounds of Appeal"
              {...register('grounds_of_appeal', { required: 'Grounds of appeal are required' })}
              error={errors.grounds_of_appeal?.message}
              placeholder="Explain the legal and factual grounds for your appeal"
              rows={4}
              required
              maxLength={250}
            />

            <Textarea
              label="Relief Sought"
              {...register('relief_sought', { required: 'Relief sought is required' })}
              error={errors.relief_sought?.message}
              placeholder="Describe what relief or remedy you are seeking"
              rows={4}
              required
              maxLength={250}
            />
            </div>

            <div>
              <DocumentUpload
                label="Supporting Documents"
                onUploadComplete={(mediaId) => handleDocumentUpload('supporting_documents', mediaId)}
                onUploadCancel={() => handleDocumentRemove('supporting_documents')}
                existingDocument={existingDocuments.supporting_documents}
                onReplace={(mediaId) => handleDocumentUpload('supporting_documents', mediaId)}
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
            onClick={() => navigate('/appeals')}
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
            {id ? 'Update Appeal' : 'Submit Appeal'}
          </Button>
        </div>
      </form>
    </div>
  );
};
