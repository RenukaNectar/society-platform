import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Calendar, FileText } from 'lucide-react';
import { createSpecialAnnualGeneralMeeting } from '../../lib/data/specialAnnualGeneralMeetings/api';
import { getMySociety } from '../../lib/data/users/api';
import { toast } from 'react-hot-toast';
import { DocumentUpload } from '../ui/DocumentUpload';

interface SpecialAnnualGeneralMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SpecialAnnualGeneralMeetingModal: React.FC<SpecialAnnualGeneralMeetingModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [userSociety, setUserSociety] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    meeting_date: '',
    media_id: '',
    attendance_sheet_id: '',
    minutes_of_meeting_id: '',
    comments: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load user's society information
  useEffect(() => {
    const loadUserSociety = async () => {
      try {
        setLoading(true);
        const society = await getMySociety();
        if (society) {
          setUserSociety(society);
        }
      } catch (error) {
        console.error('Error loading user society:', error);
        toast.error('Failed to load society information');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadUserSociety();
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleUploadComplete = (documentId: string) => {
    setFormData(prev => ({
      ...prev,
      media_id: documentId
    }));
  };

  const handleUploadCancel = () => {
    setFormData(prev => ({
      ...prev,
      media_id: ''
    }));
  };

  const handleAttendanceSheetUpload = (documentId: string) => {
    setFormData(prev => ({
      ...prev,
      attendance_sheet_id: documentId
    }));
  };

  const handleAttendanceSheetCancel = () => {
    setFormData(prev => ({
      ...prev,
      attendance_sheet_id: ''
    }));
  };

  const handleMinutesUpload = (documentId: string) => {
    setFormData(prev => ({
      ...prev,
      minutes_of_meeting_id: documentId
    }));
  };

  const handleMinutesCancel = () => {
    setFormData(prev => ({
      ...prev,
      minutes_of_meeting_id: ''
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.meeting_date) {
      newErrors.meeting_date = 'Meeting date is required';
    }

    if (!formData.media_id) {
      newErrors.media_id = 'Notice document upload is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    if (!userSociety?.data?.society?.id) {
      toast.error('Society information not available');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submitData: Record<string, unknown> = {
        society_name: userSociety.data.society.cooperative_society_name || userSociety.data.society.name,
        meeting_date: formData.meeting_date,
        notice_id: formData.media_id, // Using media_id as notice_id
        comments: formData.comments,
      };
      if (formData.attendance_sheet_id) {
        submitData.attendance_sheet_id = formData.attendance_sheet_id;
      }
      if (formData.minutes_of_meeting_id) {
        submitData.minutes_of_meeting_id = formData.minutes_of_meeting_id;
      }

      const response = await createSpecialAnnualGeneralMeeting(submitData as any);
      
      if (response.success || response.status === 200 || response.status === 201) {
        toast.success('Special General Body Meeting created successfully!');
        onSuccess();
        handleClose();
      } else {
        throw new Error(response.message || 'Failed to create Special General Body Meeting');
      }
    } catch (error: any) {
      console.error('Error creating Special General Body Meeting:', error);
      toast.error(error.message || 'Failed to create Special General Body Meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      meeting_date: '',
      media_id: '',
      attendance_sheet_id: '',
      minutes_of_meeting_id: '',
      comments: '',
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Calendar className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Add Special General Body Meeting
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Society Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Society Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Society Registration Number"
                  value={userSociety?.data?.society?.registration_number || ''}
                  disabled
                  className="bg-gray-50"
                />
                <Input
                  label="Society Name"
                  value={userSociety?.data?.society?.cooperative_society_name || userSociety?.data?.society?.name || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>

            {/* Meeting Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Meeting Details
              </h3>
              <Input
                label="Meeting Date & Time"
                name="meeting_date"
                type="datetime-local"
                value={formData.meeting_date}
                onChange={handleInputChange}
                error={errors.meeting_date}
                required
              />
            </div>

            {/* Notice Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Notice Upload
              </h3>
              <DocumentUpload
                label="Upload Notice Document"
                onUploadComplete={handleUploadComplete}
                onUploadCancel={handleUploadCancel}
                required={true}
              />
              {errors.media_id && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.media_id}
                </p>
              )}
            </div>

            {/* Additional Documents */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Additional Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <DocumentUpload
                    label="Attendance Sheet"
                    onUploadComplete={handleAttendanceSheetUpload}
                    onUploadCancel={handleAttendanceSheetCancel}
                    required={false}
                  />
                </div>
                <div className="space-y-2">
                  <DocumentUpload
                    label="Minutes of Meeting"
                    onUploadComplete={handleMinutesUpload}
                    onUploadCancel={handleMinutesCancel}
                    required={false}
                  />
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Additional Information
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments
                </label>
                <textarea
                  name="comments"
                  value={formData.comments}
                  onChange={handleInputChange}
                  placeholder="Enter any additional comments or notes about the meeting..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={4}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-4 mt-6">
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-6"
                >
                  Cancel
                </Button>
                
                <Button
                  type="submit"
                  loading={isSubmitting}
                  disabled={isSubmitting || loading}
                  className="flex items-center gap-2 px-6 bg-indigo-600 hover:bg-indigo-700"
                >
                  <FileText className="h-4 w-4" />
                  {isSubmitting ? 'Creating...' : 'Create Special General Body Meeting'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
