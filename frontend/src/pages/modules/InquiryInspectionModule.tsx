import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { FileUpload } from '../../components/ui/FileUpload';
import { Checkbox } from '../../components/ui/Checkbox';
import { RadioGroup } from '../../components/ui/RadioGroup';
import { InspectionForm, FileUpload as FileUploadType } from '../../types';
import { Save, Send, Plus, Search, Eye, Edit, Trash2, FileText, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import InquiryTableColums from '../../hooks/inquiry/useInquiryTableColums';
import { PermissionGuard } from '../../components/guard/PermissionGuard';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

export const InquiryInspectionModule: React.FC = () => {
  const [files, setFiles] = useState<FileUploadType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [inspectionType, setInspectionType] = useState<'inspection' | 'liquidation'>('inspection');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [existingInspection, setExistingInspection] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { mode } = useSelector((state: RootState) => state.theme);
  const { user } = useSelector((state: RootState) => state.auth);
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<InspectionForm>();

  const inspectionTypeOptions = [
    { value: 'inspection', label: 'Inspection' },
    { value: 'liquidation', label: 'Liquidation' },
  ];

  // Check if user already has an inspection application
  useEffect(() => {
    if (user?.society?.id) {
      checkExistingInspection();
    }
  }, [user]);

  const checkExistingInspection = async () => {
    setLoading(true);
    try {
      // This would be an API call to check existing inspection
      // For now, we'll simulate it
      const response: any = await api.get(`/inspections/check-existing/${user?.society?.id}`);
      if (response.data?.exists) {
        setExistingInspection(response.data.inspection);
        toast.error('You already have an inspection application in progress');
      }
    } catch (error) {
      console.log('No existing inspection found');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data: InspectionForm) => {
    const formData = { 
      ...data, 
      inspectionType, 
      followUpRequired,
      reportFile: files[0] || null 
    };
    console.log('Inspection Data:', formData);
    toast.success('Inspection request submitted successfully!');
    setShowForm(false);
    reset();
    setFiles([]);
  };

  const saveDraft = () => {
    toast.success('Draft saved successfully!');
  };

  // If user already has an inspection application, show it
  if (existingInspection) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h1 className={`text-2xl font-bold text-gray-900 ${mode}:text-gray-100 mb-2`}>
            Inspection Application Already Submitted
          </h1>
          <p className={`text-gray-600 ${mode}:text-gray-400 mb-6`}>
            You already have an inspection application in progress. You cannot submit multiple applications.
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Eye className="h-4 w-4 mr-2" />
            View Application
          </Button>
        </div>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search inspection ID, society name, inspector"
              icon={<Search className="h-4 w-4 text-gray-400" />}
              value={""}
              onChange={(e) => {
                // e.target.value
              }}
            />
          </div>
          <PermissionGuard permission="canAddInspection" showAskPermission={false}>
            <div className="flex space-x-3">
              <Button onClick={() => setShowForm(true)} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Checking...' : 'New Inspection'}
              </Button>
              <Link to="/inquiries/new">
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Detailed Form
                </Button>
              </Link>
            </div>
          </PermissionGuard>
        </div>

        {/* Inspections Table */}
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`bg-gray-50 ${mode}:bg-gray-900`}>
                <InquiryTableColums theme />
              </thead>
              <tbody className={`divide-y divide-gray-200 ${mode}:divide-gray-700`}>
                {/* Empty state */}
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No inspection applications found</p>
                      <p className="text-sm">Start by creating a new inspection request</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold text-gray-900 ${mode}:text-gray-100`}>
            Inspection Form
          </h1>
          <p className={`text-gray-600 ${mode}:text-gray-400 mt-1`}>
            Submit a new inspection or liquidation request
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowForm(false)}>
          Back to List
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <h3 className={`text-lg font-semibold text-gray-900 ${mode}:text-gray-100 mb-6`}>
            Basic Information
          </h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Society Name"
                {...register('societyName', { required: 'Society name is required' })}
                error={errors.societyName?.message}
                placeholder="Enter society name"
              />
              <div>
                <label className={`block text-sm font-medium text-gray-700 ${mode}:text-gray-300 mb-2`}>
                  Type
                </label>
                <RadioGroup
                  options={inspectionTypeOptions}
                  value={inspectionType}
                  onChange={(value) => setInspectionType(value as 'inspection' | 'liquidation')}
                  name="inspectionType"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Inspection Date"
                type="date"
                {...register('inspectionDate', { required: 'Inspection date is required' })}
                error={errors.inspectionDate?.message}
              />
              <Input
                label="Inspector Name"
                {...register('inspectorName', { required: 'Inspector name is required' })}
                error={errors.inspectorName?.message}
                placeholder="Enter inspector name"
              />
            </div>
          </div>
        </Card>

        {/* Inspection Details */}
        <Card>
          <h3 className={`text-lg font-semibold text-gray-900 ${mode}:text-gray-100 mb-6`}>
            Inspection Details
          </h3>
          <div className="space-y-6">
            <Textarea
              label="Reason for Inspection"
              {...register('reasonForInspection', { required: 'Reason for inspection is required' })}
              error={errors.reasonForInspection?.message}
              placeholder="Describe the reason for this inspection"
              rows={4}
            />
            <Textarea
              label="Remarks (Optional)"
              {...register('remarks')}
              placeholder="Additional remarks or notes"
              rows={3}
            />
          </div>
        </Card>

        {/* Report Upload */}
        <Card>
          <h3 className={`text-lg font-semibold text-gray-900 ${mode}:text-gray-100 mb-6`}>
            Report Upload
          </h3>
          <div className="space-y-4">
            <FileUpload
              label="Upload Report (Mandatory)"
              files={files}
              onFilesChange={setFiles}
              maxFiles={1}
            />
            <div className={`text-sm text-gray-600 ${mode}:text-gray-400`}>
              <p className="font-medium mb-2">Required format:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>PDF, DOC, or DOCX files only</li>
                <li>Maximum file size: 10MB</li>
                <li>Must include detailed inspection findings</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Follow-up Information */}
        <Card>
          <h3 className={`text-lg font-semibold text-gray-900 ${mode}:text-gray-100 mb-6`}>
            Follow-up Information
          </h3>
          <div className="space-y-4">
            <Checkbox
              label="Follow-up Required?"
              checked={followUpRequired}
              onChange={(e) => setFollowUpRequired(e.target.checked)}
            />
            {followUpRequired && (
              <Input
                label="Follow-up Due Date"
                type="date"
                {...register('followUpDueDate', { 
                  required: followUpRequired ? 'Follow-up due date is required' : false 
                })}
                error={errors.followUpDueDate?.message}
              />
            )}
          </div>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={saveDraft}>
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
          <Button type="submit">
            <Send className="h-4 w-4 mr-2" />
            Submit Inspection
          </Button>
        </div>
      </form>
    </div>
  );
};