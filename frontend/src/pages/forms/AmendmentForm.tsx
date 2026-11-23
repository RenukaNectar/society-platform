import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import {
  Save, ArrowLeft, User, FileText,
  Users, Vote, FileCheck, AlertCircle, CheckCircle, Plus, Edit, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AmendmentFormData, Member, DeletedAmendmentMember } from '../../types';
import { createAmendment, updateAmendment, createOrUpdateAmendment } from '../../lib/data/amendments/api';
import { usePermissions } from '../../hooks/usePermissions';
import { DocumentUpload } from '../../components/ui/DocumentUpload';
import { CoorporativeMapping } from '../../pages/coorporativeForms/coorporativeMapping';
import { useMasterData } from '../../hooks/useMasterData';
import { getMySociety } from '../../lib/data/users/api';
import moment from 'moment';

interface AmendmentFormProps {
  data?: any;
  societyData?: any; // Add society data prop
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AmendmentForm: React.FC<AmendmentFormProps> = ({ data, societyData, onSuccess, onCancel }) => {

  const { user } = useSelector((state: RootState) => state.auth);
  const isApplicant = user?.role === 'applicant';
  const { canPerformAction } = usePermissions();
  const canUpdateAmendment = canPerformAction('amendment', 'update');

  // Optional for applicants only — Circular Notice and all other form sections stay required
  const APPLICANT_OPTIONAL_AMENDMENT_FIELDS = new Set([
    'existing_byelaw_media_id',
    'new_proposed_byelaw_media_id',
    'meeting_notice_agenda_media_id',
    // 'copy_of_notice_form_g_media_id',
    'district_drcs_arcs_recommendation_media_id',
    'attendance_sheet_media_id',
    'minutes_of_meeting_media_id',
    'byelaw_number',
    'reason_for_amendment',
    'proposed_bylaw_text',
  ]);

  const isAmendmentDetailFieldRequired = (field: string) =>
    !isApplicant || !APPLICANT_OPTIONAL_AMENDMENT_FIELDS.has(field);

  const { mode } = useSelector((state: RootState) => state.theme);
  const { statuses } = useSelector((state: RootState) => state.statuses);
  const [loading, setLoading] = useState(false);

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [deletionReason, setDeletionReason] = useState('');
  const [deletionDocumentId, setDeletionDocumentId] = useState('');
  const [deletionDocumentUrl, setDeletionDocumentUrl] = useState('');
  const [deletionErrors, setDeletionErrors] = useState<Record<string, string>>({});
  const [deletedMembers, setDeletedMembers] = useState<DeletedAmendmentMember[]>([]);
  const [existingSectorOfOperation, setExistingSectorOfOperation] = useState<string>('');
  const [newMember, setNewMember] = useState({
    name: '',
    mobile: '',
    gender: '',
    category: '',
    designation: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [memberErrors, setMemberErrors] = useState<Record<string, string>>({});
  const [existingDesignation, setExistingDesignation] = useState<{
    chairpersonExist: boolean;
    secretaryExist: boolean;
    treasurerExist: boolean;
  }>({
    chairpersonExist: false,
    secretaryExist: false,
    treasurerExist: false,
  });

  const [documentIds, setDocumentIds] = useState<{
    existing_byelaw_media_id?: string;
    new_proposed_byelaw_media_id?: string;
    attendance_sheet_media_id?: string;
    minutes_of_meeting_media_id?: string;
    circular_notice_media_id?: string;
    meeting_notice_agenda_media_id?: string;
    copy_of_notice_form_g_media_id?: string;
    district_drcs_arcs_recommendation_media_id?: string;
  }>({});

  const [existingDocuments, setExistingDocuments] = useState<{
    existing_byelaw_media_id?: any;
    new_proposed_byelaw_media_id?: any;
    attendance_sheet_media_id?: any;
    minutes_of_meeting_media_id?: any;
    circular_notice_media_id?: any;
    meeting_notice_agenda_media_id?: any;
    copy_of_notice_form_g_media_id?: any;
    district_drcs_arcs_recommendation_media_id?: any;
  }>({});

  const [defaultMembersLoaded, setDefaultMembersLoaded] = useState(false);
  const [coorporativeSocietyType, setCoorporativeSocietyType] = useState<string>('');
  const [showCoorporativeSocietyType, setShowCoorporativeSocietyType] = useState(false);
  const [currentSocietyData, setCurrentSocietyData] = useState<any>(null);
  const [societyLoading, setSocietyLoading] = useState(false);
  const { masterData } = useMasterData();
  const [additionalData, setAdditionalData] = useState<any>(null);
  const [originalSectorData, setOriginalSectorData] = useState<{
    sectorId: string;
    additionalData: any;
  } | null>(null);

  const defaultFormValues = {
    chairperson_name: '',
    chairperson_address: '',
    chairperson_contact: '',
    signatory_name: '',
    signatory_address: '',
    signatory_contact: '',
    society_type: '',
    registration_number_of_previous_application: '',
    members: [],
    resolution_extract: '',
    general_body_meeting_date: '',
    notice_days: 21,
    notice_date: '',
    total_members: 0,
    quorum_required: 0,
    members_present: 0,
    members_voted: 0,
    votes_in_favour: 0,
    votes_against: 0,
    byelaw_number: '',
    existing_byelaw_media_id: '',
    new_proposed_byelaw_media_id: '',
    reason_for_amendment: '',
    proposed_bylaw_text: '',
    attendance_sheet_media_id: '',
    minutes_of_meeting_media_id: '',
    circular_notice_media_id: '',
    meeting_notice_agenda_media_id: '',
    copy_of_notice_form_g_media_id: '',
    district_drcs_arcs_recommendation_media_id: '',
    documents: [],
    additional_data: null,
  };

  const { register, handleSubmit, formState: { errors: formErrors }, reset, setValue, watch } = useForm<AmendmentFormData>({
    defaultValues: defaultFormValues,
    mode: 'onChange'
  });

  const watchedValues = watch();

  // Set form data when data prop changes
  useEffect(() => {
    if (data) {
      // Reset default members loaded state when editing existing amendment
      setDefaultMembersLoaded(false);

      // Parse signatory details
      const signatoryDetails = data.signatory_details || '';
      const signatoryParts = signatoryDetails.split(', ');

      let signatoryName = data?.signatory_name || '';
      let signatoryAddress = data?.signatory_address || '';
      let signatoryContact = data?.signatory_contact || '';

      signatoryParts.forEach((part: string) => {
        if (part.startsWith('Name:')) {
          signatoryName = data?.signatory_name || part.replace('Name:', '').trim();
        } else if (part.startsWith('Address:')) {
          signatoryAddress = data?.signatory_address || part.replace('Address:', '').trim();
        } else if (part.startsWith('Contact:')) {
          signatoryContact = data?.signatory_contact || part.replace('Contact:', '').trim();
        }
      });

      // Set form values
      setValue('chairperson_name', data.chairperson_name || '');
      setValue('chairperson_address', data.chairperson_address || '');
      setValue('chairperson_contact', data.chairperson_contact || '');
      setValue('signatory_name', signatoryName);
      setValue('signatory_address', signatoryAddress);
      setValue('signatory_contact', signatoryContact);
      setValue('society_type', data.society_type || '');
      setValue('registration_number_of_previous_application', data.registration_number_of_previous_application || '');
      setValue('resolution_extract', data.resolution_extract || '');
      setValue('general_body_meeting_date', data.general_body_meeting_date ? data.general_body_meeting_date.split('T')[0] + 'T' + data.general_body_meeting_date.split('T')[1].substring(0, 5) : '');
      setValue('notice_days', data.notice_days || 21);
      setValue('notice_date', data.notice_date ? data.notice_date.split('T')[0] : '');
      setValue('total_members', data.total_members || 0);
      setValue('quorum_required', data.quorum_required || 0);
      setValue('members_present', data.members_present || 0);
      setValue('members_voted', data.members_voted || 0);
      setValue('votes_in_favour', data.votes_in_favour || 0);
      setValue('votes_against', data.votes_against || 0);
      setValue('byelaw_number', data.byelaw_number || '');
      setValue('reason_for_amendment', data.amendment_reason || '');
      setValue('proposed_bylaw_text', data.proposed_byelaw_text || '');
      setValue('additional_data', data.additional_data || null);

      if (Array.isArray(data.deleted_members)) {
        setDeletedMembers(data.deleted_members);
      }

      if (data.additional_data) {
        setAdditionalData(data.additional_data);
      }

      // If editing an existing amendment and society_type is set, also set the cooperative society type
      if (data.society_type && data.additional_data) {
        const sector = masterData.sectorOfOperations.find((sector: any) => sector.id === data.society_type);
        if (sector && (sector as any).respective_table) {
          setCoorporativeSocietyType((sector as any).respective_table);
        }

        // Store original sector data for restoration when editing
        setOriginalSectorData({
          sectorId: data.society_type,
          additionalData: data.additional_data
        });
      }

      // Set document IDs
      if (data.existing_byelaw_media_id) {
        setDocumentIds(prev => ({
          ...prev,
          existing_byelaw_media_id: data.existing_byelaw_media_id
        }));
      }

      if (data.new_proposed_byelaw_media_id) {
        setDocumentIds(prev => ({
          ...prev,
          new_proposed_byelaw_media_id: data.new_proposed_byelaw_media_id
        }));
      }

      if (data.attendance_sheet_media_id) {
        setDocumentIds(prev => ({
          ...prev,
          attendance_sheet_media_id: data.attendance_sheet_media_id
        }));
      }

      if (data.minutes_of_meeting_media_id) {
        setDocumentIds(prev => ({
          ...prev,
          minutes_of_meeting_media_id: data.minutes_of_meeting_media_id
        }));
      }

      if (data.circular_notice_media_id) {
        setDocumentIds(prev => ({
          ...prev,
          circular_notice_media_id: data.circular_notice_media_id
        }));
      }

      if (data.meeting_notice_agenda_media_id) {
        setDocumentIds(prev => ({
          ...prev,
          meeting_notice_agenda_media_id: data.meeting_notice_agenda_media_id
        }));
      }

      if (data.copy_of_notice_form_g_media_id) {
        setDocumentIds(prev => ({
          ...prev,
          copy_of_notice_form_g_media_id: data.copy_of_notice_form_g_media_id
        }));
      }

      if (data.district_drcs_arcs_recommendation_media_id) {
        setDocumentIds(prev => ({
          ...prev,
          district_drcs_arcs_recommendation_media_id: data.district_drcs_arcs_recommendation_media_id
        }));
      }

      // Set existing documents for display
      if (data.existingByelawMedia) {
        setExistingDocuments(prev => ({
          ...prev,
          existing_byelaw_media_id: data.existingByelawMedia
        }));
      }

      if (data.newProposedByelawMedia) {
        setExistingDocuments(prev => ({
          ...prev,
          new_proposed_byelaw_media_id: data.newProposedByelawMedia
        }));
      }

      if (data.attendanceSheetMedia) {
        setExistingDocuments(prev => ({
          ...prev,
          attendance_sheet_media_id: data.attendanceSheetMedia
        }));
      }

      if (data.minutesOfMeetingMedia) {
        setExistingDocuments(prev => ({
          ...prev,
          minutes_of_meeting_media_id: data.minutesOfMeetingMedia
        }));
      }

      if (data.circularNoticeMedia) {
        setExistingDocuments(prev => ({
          ...prev,
          circular_notice_media_id: data.circularNoticeMedia
        }));
      }

      if (data.meetingNoticeAgendaMedia) {
        setExistingDocuments(prev => ({
          ...prev,
          meeting_notice_agenda_media_id: data.meetingNoticeAgendaMedia
        }));
      }

      if (data.copyOfNoticeFormGMedia) {
        setExistingDocuments(prev => ({
          ...prev,
          copy_of_notice_form_g_media_id: data.copyOfNoticeFormGMedia
        }));
      }

      if (data.districtDrcsArcsRecommendationMedia) {
        setExistingDocuments(prev => ({
          ...prev,
          district_drcs_arcs_recommendation_media_id: data.districtDrcsArcsRecommendationMedia
        }));
      }

      // Set members if available
      if (data.members && Array.isArray(data.members)) {
        const members = data.members.map((item: any) => ({
          id: item.id,
          name: item.name || 'Unknown',
          mobile: item.mobile || 'Unknown',
          gender: item.gender || 'Unknown',
          category: item.category || 'Unknown',
          designation: item.designation || 'Member'
        }));
        setValue('members', members);
        updateExistingDesignations(members);
      }
    }
  }, [data, setValue]);

  // Load default society members when currentSocietyData changes
  useEffect(() => {
    if (currentSocietyData && currentSocietyData.members && Array.isArray(currentSocietyData.members) && !defaultMembersLoaded) {
      const defaultMembers = currentSocietyData.members.map((item: any) => ({
        id: item.id,
        name: item.name || 'Unknown',
        mobile: item.mobile || 'Unknown',
        gender: item.gender || 'Unknown',
        category: item.category || 'Unknown',
        designation: item.designation || 'Member'
      }));

      const currentMembers = watchedValues.members || [];
      if (currentMembers.length === 0 && !data?.id) {
        setValue('members', defaultMembers);
        updateExistingDesignations(defaultMembers);

        // Set total members count from society data
        if (currentSocietyData.society?.total_members) {
          setValue('total_members', currentSocietyData.society.total_members);
        }
        setDefaultMembersLoaded(true);
      }
    }
  }, [currentSocietyData, setValue, defaultMembersLoaded]);

  useEffect(() => {
    if (watchedValues.total_members) {
      const quorum = Math.ceil((watchedValues.total_members * 2) / 3);
      setValue('quorum_required', quorum);
    }
  }, [watchedValues.total_members, setValue]);

  useEffect(() => {
    if (watchedValues.general_body_meeting_date && watchedValues.notice_days) {
      const meetingDate = new Date(watchedValues.general_body_meeting_date);
      const noticeDate = new Date(meetingDate);
      noticeDate.setDate(meetingDate.getDate() - watchedValues.notice_days);
      setValue('notice_date', noticeDate.toISOString().split('T')[0]);
    }
  }, [watchedValues.general_body_meeting_date, watchedValues.notice_days, setValue]);

  // Watch for sector changes to restore original data when returning to original sector
  useEffect(() => {
    if (watchedValues.society_type && originalSectorData && watchedValues.society_type === originalSectorData.sectorId) {
      // If returning to the original sector, restore the original additional data
      setAdditionalData(originalSectorData.additionalData);
      setValue('additional_data', originalSectorData.additionalData);
    }
  }, [watchedValues.society_type, originalSectorData, setValue]);

  // Watch for additional_data changes to validate form completion
  useEffect(() => {
    if (watchedValues.society_type && !isAdditionalDataValid(additionalData)) {
      // Clear any previous validation errors
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.additional_data;
        return newErrors;
      });
    }
  }, [watchedValues.society_type, additionalData, setErrors]);

  // Fetch current user's society data
  useEffect(() => {
    const fetchSocietyData = async () => {
      try {
        setSocietyLoading(true);
        const response = await getMySociety();
        if (response?.data) {
          const sectorId = response.data?.society?.sector_of_operation?.id || '';
          const societyAdditionalData = response.data?.society?.additional_data || null;

          setValue('society_type', sectorId);
          setValue('additional_data', societyAdditionalData);
          setAdditionalData(societyAdditionalData);
          setExistingSectorOfOperation(sectorId);
          setCoorporativeSocietyType(response.data?.society?.sector_of_operation?.respective_table);
          setCurrentSocietyData(response.data);

          // Store original sector data for restoration
          if (sectorId && societyAdditionalData) {
            setOriginalSectorData({
              sectorId,
              additionalData: societyAdditionalData
            });
          }
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error fetching society data:', error);
        setCurrentSocietyData(null);
      } finally {
        setSocietyLoading(false);
      }
    };

    fetchSocietyData();
  }, []);

  const handleSocietyTypeChange = (sectorId: string) => {
    let sector: any = masterData.sectorOfOperations.find((sector: any) => sector.id === sectorId);
    if (sector) {
      setCoorporativeSocietyType(sector?.respective_table);
      setShowCoorporativeSocietyType(true);

      // If sector is changing and it's not the existing sector, clear additional data
      if (existingSectorOfOperation && existingSectorOfOperation !== sectorId) {
        setAdditionalData(null);
        setValue('additional_data', null);
      } else if (existingSectorOfOperation === sectorId && originalSectorData) {
        // If returning to the original sector, restore the original additional data
        setAdditionalData(originalSectorData.additionalData);
        setValue('additional_data', originalSectorData.additionalData);
      }

      // If returning to the original sector from a different sector, restore original data
      if (originalSectorData && sectorId === originalSectorData.sectorId) {
        setAdditionalData(originalSectorData.additionalData);
        setValue('additional_data', originalSectorData.additionalData);
      }
    }
    setValue('society_type', sectorId);
  };

  const updateExistingDesignations = (members: Member[]) => {
    setExistingDesignation({
      chairpersonExist: members.some(member => member.designation === 'Chief Promoter'),
      secretaryExist: members.some(member => member.designation === 'Secretary'),
      treasurerExist: members.some(member => member.designation === 'Treasurer'),
    });
  };

  // Helper function to validate additional data
  const isAdditionalDataValid = (data: any): boolean => {
    if (!data) return false;
    if (typeof data === 'object' && Object.keys(data).length === 0) return false;
    return true;
  };

  // Member management functions
  const handleAddMemberClick = () => {
    setMemberErrors({});
    setEditingMember(null);
    setDeletingMember(null);
    setNewMember({
      name: '',
      mobile: '',
      gender: '',
      category: '',
      designation: '',
    });
    setShowAddMemberModal(true);
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setDeletingMember(null);
    setNewMember({
      name: member.name,
      mobile: member.mobile,
      gender: member.gender,
      category: member.category,
      designation: member.designation,
    });
    setShowAddMemberModal(true);
  };

  const handleCloseMemberModal = () => {
    setShowAddMemberModal(false);
    setEditingMember(null);
    setDeletingMember(null);
    setNewMember({
      name: '',
      mobile: '',
      gender: '',
      category: '',
      designation: '',
    });
    setMemberErrors({});
  };

  const validateMemberDetails = () => {
    const errors: Record<string, string> = {};

    if (!newMember.name.trim()) {
      errors.name = 'Member name is required';
    } else if (newMember.name.trim().length < 2) {
      errors.name = 'Member name must be at least 2 characters';
    }

    if (!newMember.gender) {
      errors.gender = 'Gender is required';
    }

    if (!newMember.category) {
      errors.category = 'Category is required';
    }
    if (!newMember.mobile.trim()) {
      errors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(newMember.mobile)) {
      errors.mobile = 'Mobile number must consist of digits only';
    }
    if (!newMember.designation) {
      errors.designation = 'Designation is required';
    }

    setMemberErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const addMember = () => {
    if (validateMemberDetails()) {
      const member: Member = {
        id: Math.random().toString(36).substring(2, 15),
        name: newMember.name,
        mobile: newMember.mobile,
        gender: newMember.gender,
        category: newMember.category,
        designation: newMember.designation,
      };

      const currentMembers = watchedValues.members || [];
      const updatedMembers = [...currentMembers, member];
      setValue('members', updatedMembers);
      updateExistingDesignations(updatedMembers);

      setNewMember({ name: '', mobile: '', gender: '', category: '', designation: '' });
      setShowAddMemberModal(false);
      toast.success('Member added successfully');
    }
  };

  const saveEditedMember = () => {
    if (editingMember && validateMemberDetails()) {
      const currentMembers = watchedValues.members || [];
      const updatedMembers = currentMembers.map(member =>
        member.id === editingMember.id ? { ...member, ...newMember } : member
      );

      setValue('members', updatedMembers);
      updateExistingDesignations(updatedMembers);

      setNewMember({ name: '', mobile: '', gender: '', category: '', designation: '' });
      setEditingMember(null);
      setShowAddMemberModal(false);
      toast.success('Member updated successfully');
    }
  };

  const removeMember = (id: string) => {
    const currentMembers = watchedValues.members || [];
    const memberToRemove = currentMembers.find(member => member.id === id);

    if (memberToRemove) {
      setDeletingMember(memberToRemove);
      setDeletionReason('');
      setDeletionDocumentId('');
      setDeletionDocumentUrl('');
      setDeletionErrors({});
    }
  };

  const confirmDeleteMember = () => {
    if (!deletingMember) return;

    const nextErrors: Record<string, string> = {};
    if (!deletionReason.trim()) {
      nextErrors.deletion_reason = 'Reason for deletion is required';
    }

    if (Object.keys(nextErrors).length > 0) {
      setDeletionErrors(nextErrors);
      return;
    }

    const currentMembers = watchedValues.members || [];
    const updatedMembers = currentMembers.filter(member => member.id !== deletingMember.id);
    setValue('members', updatedMembers);
    updateExistingDesignations(updatedMembers);

    setDeletedMembers((prev) => [
      ...prev.filter((item) => item.member_id !== deletingMember.id),
      {
        member_id: deletingMember.id || null,
        name: deletingMember.name,
        mobile: deletingMember.mobile,
        gender: deletingMember.gender,
        category: deletingMember.category,
        designation: deletingMember.designation,
        deletion_reason: deletionReason.trim(),
        ...(deletionDocumentId
          ? {
              supporting_document_media_id: deletionDocumentId,
              supportingDocumentMedia: deletionDocumentUrl
                ? { id: deletionDocumentId, url: deletionDocumentUrl }
                : null,
            }
          : {}),
        deleted_at: new Date().toISOString(),
      },
    ]);

    toast.success('Member removed successfully');
    setDeletingMember(null);
    setDeletionReason('');
    setDeletionDocumentId('');
    setDeletionDocumentUrl('');
    setDeletionErrors({});
  };

  const cancelDeleteMember = () => {
    setDeletingMember(null);
    setDeletionReason('');
    setDeletionDocumentId('');
    setDeletionDocumentUrl('');
    setDeletionErrors({});
  };

  const handleDocumentUploadComplete = (field: keyof typeof documentIds, documentId: string) => {
    setDocumentIds(prev => ({
      ...prev,
      [field]: documentId,
    }));

    // Clear any previous errors for this field
    const newErrors = { ...errors };
    delete newErrors[field];
    setErrors(newErrors);
  };

  const handleDocumentUploadCancel = (field: keyof typeof documentIds) => {
    setDocumentIds(prev => {
      const newIds = { ...prev };
      delete newIds[field];
      return newIds;
    });
  };

  const handleDocumentReplace = (field: keyof typeof documentIds, newDocumentId: string) => {
    setDocumentIds(prev => ({
      ...prev,
      [field]: newDocumentId,
    }));
  };

  const save = async (submitData: any, statusId?: string) => {
    const meetingDate = String(submitData.general_body_meeting_date || '').slice(0, 16);
    if (meetingDate && meetingDate > moment().format('YYYY-MM-DDTHH:mm')) {
      toast.error('Meeting date cannot be in the future');
      return;
    }

    setLoading(true);
    try {
      // Validate that at least 10 members are added
      // if (!submitData.members || submitData.members.length < 10) {
      //   toast.error('Please add at least 10 members to proceed with the amendment');
      //   setLoading(false);
      //   return;
      // }

      if (isAmendmentDetailFieldRequired('existing_byelaw_media_id') && !documentIds.existing_byelaw_media_id) {
        toast.error('Please upload the existing byelaw document');
        setLoading(false);
        return;
      }

      if (isAmendmentDetailFieldRequired('new_proposed_byelaw_media_id') && !documentIds.new_proposed_byelaw_media_id) {
        toast.error('Please upload the new proposed byelaw document');
        setLoading(false);
        return;
      }

      // Validate that additional_data (cooperative society form) is filled
      if (!isAdditionalDataValid(submitData.additional_data)) {
        toast.error('Please fill the cooperative society form by selecting a sector and clicking "Edit Form"');
        setLoading(false);
        return;
      }

      let finalAdditionalData = submitData.additional_data;

      // If sector hasn't changed, send the original additional data
      if (originalSectorData && watchedValues.society_type === originalSectorData.sectorId) {
        finalAdditionalData = typeof originalSectorData.additionalData === 'object' ? originalSectorData.additionalData : JSON.parse(originalSectorData.additionalData);
      }

      let submissionData: any = {
        ...submitData,
        society_id: currentSocietyData?.society?.id || societyData?.id,
        amendment_reason: submitData.reason_for_amendment,
        proposed_byelaw_text: submitData.proposed_bylaw_text,
        additional_data: finalAdditionalData,
        deleted_members: deletedMembers.map(({ supportingDocumentMedia, supporting_document_media_id, ...rest }) => ({
          ...rest,
          ...(supporting_document_media_id ? { supporting_document_media_id } : {}),
        })),
      };

      if (statusId) {
        submissionData.status_id = statusId;
      }

      if (documentIds.existing_byelaw_media_id) {
        submissionData.existing_byelaw_media_id = documentIds.existing_byelaw_media_id;
      } else {
        delete submissionData.existing_byelaw_media_id;
      }

      if (documentIds.new_proposed_byelaw_media_id) {
        submissionData.new_proposed_byelaw_media_id = documentIds.new_proposed_byelaw_media_id;
      } else {
        delete submissionData.new_proposed_byelaw_media_id;
      }

      if (documentIds.attendance_sheet_media_id) {
        submissionData.attendance_sheet_media_id = documentIds.attendance_sheet_media_id
      } else {
        delete submissionData.attendance_sheet_media_id
      }

      if (documentIds.minutes_of_meeting_media_id) {
        submissionData.minutes_of_meeting_media_id = documentIds.minutes_of_meeting_media_id
      } else {
        delete submissionData.minutes_of_meeting_media_id
      }

      if (documentIds.circular_notice_media_id) {
        submissionData.circular_notice_media_id = documentIds.circular_notice_media_id
      } else {
        delete submissionData.circular_notice_media_id
      }

      if (documentIds.meeting_notice_agenda_media_id) {
        submissionData.meeting_notice_agenda_media_id = documentIds.meeting_notice_agenda_media_id
      } else {
        delete submissionData.meeting_notice_agenda_media_id
      }

      if (documentIds.copy_of_notice_form_g_media_id) {
        submissionData.copy_of_notice_form_g_media_id = documentIds.copy_of_notice_form_g_media_id
      } else {
        delete submissionData.copy_of_notice_form_g_media_id
      }

      if (documentIds.district_drcs_arcs_recommendation_media_id) {
        submissionData.district_drcs_arcs_recommendation_media_id = documentIds.district_drcs_arcs_recommendation_media_id
      } else {
        delete submissionData.district_drcs_arcs_recommendation_media_id
      }

      const isExistingAmendment = Boolean(data?.id);

      // Applicants only have create on amendment — PUT/update returns "edit" permission error.
      // Staff with update use PUT; others upsert via POST with id in body.
      const persistAmendment = !isExistingAmendment
        ? () => createAmendment(submissionData)
        : isApplicant || !canUpdateAmendment
          ? () => createOrUpdateAmendment(submissionData, data.id, user?.id)
          : () => updateAmendment(data.id, submissionData);

      const res = await persistAmendment();
      const successMessage = isExistingAmendment
        ? (res?.message || 'Amendment submitted successfully!')
        : (res?.message || 'Amendment created successfully!');

      toast.success(successMessage);
      reset();
      setValue('members', []);
      setDocumentIds({});
      setCoorporativeSocietyType('');
      setOriginalSectorData(null);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save amendment');
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (submitData: any) => {
    save(submitData);
  };

  const validateFormFields = (submitData: any) => {
    const validationErrors: Record<string, string> = {};

    // Validate required fields
    if (!submitData.chairperson_name?.trim()) {
      validationErrors.chairperson_name = 'Chief Promoter name is required';
    }
    if (!submitData.chairperson_address?.trim()) {
      validationErrors.chairperson_address = 'Chief Promoter address is required';
    }
    if (!submitData.chairperson_contact?.trim()) {
      validationErrors.chairperson_contact = 'Chief Promoter contact is required';
    }
    if (!submitData.signatory_name?.trim()) {
      validationErrors.signatory_name = 'Signatory name is required';
    }
    if (!submitData.signatory_address?.trim()) {
      validationErrors.signatory_address = 'Signatory address is required';
    }
    if (!submitData.signatory_contact?.trim()) {
      validationErrors.signatory_contact = 'Signatory contact is required';
    }
    if (!submitData.resolution_extract?.trim()) {
      validationErrors.resolution_extract = 'Resolution extract is required';
    }
    if (!submitData.general_body_meeting_date) {
      validationErrors.general_body_meeting_date = 'General body meeting date is required';
    } else if (String(submitData.general_body_meeting_date).slice(0, 16) > moment().format('YYYY-MM-DDTHH:mm')) {
      validationErrors.general_body_meeting_date = 'Meeting date cannot be in the future';
    }
    if (!submitData.notice_days || submitData.notice_days <= 0) {
      validationErrors.notice_days = 'Notice days must be greater than 0';
    }
    if (!submitData.notice_date) {
      validationErrors.notice_date = 'Notice date is required';
    }
    if (!submitData.total_members || submitData.total_members <= 0) {
      validationErrors.total_members = 'Total promoters must be greater than 0';
    }
    if (!submitData.quorum_required || submitData.quorum_required <= 0) {
      validationErrors.quorum_required = 'Quorum required must be greater than 0';
    }
    if (!submitData.members_present || submitData.members_present <= 0) {
      validationErrors.members_present = 'Promoters present must be greater than 0';
    }
    if (!submitData.members_voted || submitData.members_voted <= 0) {
      validationErrors.members_voted = 'Promoters voted must be greater than 0';
    }
    if (!submitData.votes_in_favour || submitData.votes_in_favour <= 0) {
      validationErrors.votes_in_favour = 'Votes in favour must be greater than 0';
    }
    if (!submitData.votes_against || submitData.votes_against < 0) {
      validationErrors.votes_against = 'Votes against must be 0 or greater';
    }
    if (isAmendmentDetailFieldRequired('byelaw_number') && !submitData.byelaw_number?.trim()) {
      validationErrors.byelaw_number = 'Byelaw number is required';
    }
    if (isAmendmentDetailFieldRequired('reason_for_amendment') && !submitData.reason_for_amendment?.trim()) {
      validationErrors.reason_for_amendment = 'Reason for amendment is required';
    }
    if (isAmendmentDetailFieldRequired('proposed_bylaw_text') && !submitData.proposed_bylaw_text?.trim()) {
      validationErrors.proposed_bylaw_text = 'Proposed byelaw text is required';
    }
    if (isAmendmentDetailFieldRequired('existing_byelaw_media_id') && !documentIds.existing_byelaw_media_id) {
      validationErrors.existing_byelaw_media_id = 'Please upload the existing byelaw document';
    }
    if (isAmendmentDetailFieldRequired('new_proposed_byelaw_media_id') && !documentIds.new_proposed_byelaw_media_id) {
      validationErrors.new_proposed_byelaw_media_id = 'Please upload the new proposed byelaw document';
    }

    // Validate members
    // if (!submitData.members || submitData.members.length < 10) {
    //   validationErrors.members = 'Please add at least 10 promoters to proceed with the amendment';
    // }

    // Validate additional data
    if (!isAdditionalDataValid(submitData.additional_data)) {
      validationErrors.additional_data = 'Please fill the cooperative society form by selecting a sector and clicking "Edit Form"';
    }

    return validationErrors;
  };

  const saveAsDraft = () => {
    // Validate form fields before saving as draft
    const validationErrors = validateFormFields(watchedValues);

    if (Object.keys(validationErrors).length > 0) {
      // Set validation errors
      setErrors(validationErrors);

      // Show first error as toast
      const firstError = Object.values(validationErrors)[0];
      toast.error(firstError);

      console.log('Validation errors:', validationErrors);
      return;
    }

    // Clear any previous validation errors
    setErrors({});

    // Save as draft if validation passes
    save(watchedValues, statuses.find((status: any) => status.key === 'draft')?.id);
  };

  return (
    <div className="w-full mx-auto space-y-2 mt-4">
      {user?.role !== 'applicant' && <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className={`text-2xl font-bold text-gray-900 ${mode}:text-gray-100`}>
            {data ? 'Edit Amendment' : 'Create Amendment'}
          </h1>
        </div>
      </div>}

      {!societyLoading && !currentSocietyData?.society ? (
        <div className="text-center py-8">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Society Found</h2>
          <p className="text-gray-600 mb-4">You need to be associated with a society to create amendments.</p>
          <Button variant="outline" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Combined Chairperson and Signatory Details */}
          <Card padding='xs'>
            <div className="p-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chairperson Section */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <User className="h-4 w-4 text-blue-600" />
                    <h2 className={`text-base font-semibold text-gray-900 ${mode}:text-gray-100`}>
                      Chief Promoter Details
                    </h2>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-medium text-gray-700 ${mode}:text-gray-300 mb-1`}>
                        Name *
                      </label>
                      <Input
                        {...register('chairperson_name', { required: 'Chief Promoter name is required' })}
                        placeholder="Enter Chief Promoter name"
                        error={formErrors.chairperson_name?.message}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium text-gray-700 ${mode}:text-gray-300 mb-1`}>
                        Contact *
                      </label>
                      <Input
                        {...register('chairperson_contact', {
                          required: 'Contact is required',
                          pattern: {
                            value: /^\d{10}$/,
                            message: 'Contact number must be exactly 10 digits'
                          }
                        })}
                        placeholder="Enter 10-digit contact number"
                        maxLength={10}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 10) {
                            e.target.value = value;
                          }
                        }}
                        error={formErrors.chairperson_contact?.message}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium text-gray-700 ${mode}:text-gray-300 mb-1`}>
                        Address *
                      </label>
                      <Textarea
                        {...register('chairperson_address', { required: 'Address is required', minLength: { value: 3, message: 'Address must be at least 3 characters long' } })}
                        placeholder="Enter complete address"
                        error={formErrors.chairperson_address?.message}
                        rows={2}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Signatory Section */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <FileCheck className="h-4 w-4 text-green-600" />
                    <h2 className={`text-base font-semibold text-gray-900 ${mode}:text-gray-100`}>
                      Signatory Details
                    </h2>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-medium text-gray-700 ${mode}:text-gray-300 mb-1`}>
                        Name *
                      </label>
                      <Input
                        {...register('signatory_name', { required: 'Signatory name is required' })}
                        placeholder="Enter signatory name"
                        error={formErrors.signatory_name?.message}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium text-gray-700 ${mode}:text-gray-300 mb-1`}>
                        Contact *
                      </label>
                      <Input
                        {...register('signatory_contact', {
                          required: 'Contact is required',
                          pattern: {
                            value: /^\d{10}$/,
                            message: 'Contact number must be exactly 10 digits'
                          }
                        })}
                        placeholder="Enter 10-digit contact number"
                        maxLength={10}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 10) {
                            e.target.value = value;
                          }
                        }}
                        error={formErrors.signatory_contact?.message}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium text-gray-700 ${mode}:text-gray-300 mb-1`}>
                        Address *
                      </label>
                      <Textarea
                        {...register('signatory_address', { required: 'Address is required', minLength: { value: 3, message: 'Address must be at least 3 characters long' } })}
                        placeholder="Enter complete address"
                        error={formErrors.signatory_address?.message}
                        rows={2}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Members Management */}
          <Card padding='xs'>
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <h2 className={`text-base font-semibold text-gray-900 ${mode}:text-gray-100`}>
                    Promoters Management ({watchedValues.members?.length || 0})
                  </h2>
                </div>
                {/* <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddMemberClick}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Promoter
                  </Button>
                </div> */}
              </div>

              {societyLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading society data...</p>
                </div>
              ) : !currentSocietyData?.society ? (
                <div className="text-center py-4">
                  <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                  <p className="text-sm text-red-600">No society data found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-3">
                    Manage your society promoters. You can have only one Chief Promoter, Secretary, and Treasurer.
                    {/* <span className="text-blue-600 font-medium"> Minimum 10 promoters required.</span> */}
                  </p>

                  {watchedValues.members && watchedValues.members.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {watchedValues.members.map((member: Member) => (
                        <div
                          key={member.id}
                          className={`flex items-center justify-between p-2 border rounded-lg transition-colors border-gray-200 bg-gray-50 hover:bg-gray-100`}
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {member.name} <span className="font-bold">({member.designation})</span>
                            </p>
                            <p className="text-xs text-gray-500">
                              {member.gender} • {member.category} • {member.mobile}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditMember(member)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeMember(member.id!)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No promoters added yet</p>
                    </div>
                  )}

                  {deletedMembers.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-semibold text-red-700">
                        Deleted Shareholders ({deletedMembers.length})
                      </h4>
                      {deletedMembers.map((member, index) => (
                        <div
                          key={member.member_id || index}
                          className="p-3 border border-red-100 rounded-lg bg-red-50"
                        >
                          <p className="text-sm font-medium text-gray-900">
                            {member.name}
                            {member.designation ? ` (${member.designation})` : ''}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Reason: {member.deletion_reason}
                          </p>
                          {member.supporting_document_media_id && (
                            <p className="text-xs text-green-700 mt-1">
                              Supporting document uploaded
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* {watchedValues.members && watchedValues.members.length < 10 && (
                    <p className="text-sm text-red-600 mt-2">
                      Please add at least 10 members to proceed with the amendment
                    </p>
                  )} */}
                </div>
              )}
            </div>
          </Card>

          {/* Society Size */}
          <Card padding='xs'>
            <div className="p-3">
              <div className="flex items-center space-x-2 mb-3">
                <AlertCircle className="h-4 w-4 text-purple-600" />
                <h2 className={`text-base font-semibold text-gray-900 ${mode}:text-gray-100`}>
                  Society Type *
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className={`${!coorporativeSocietyType ? 'w-[100%]' : 'w-[80%]'}`}>
                    <Select
                      label="Sector Of Operation"
                      value={watchedValues.society_type}
                      onChange={(e) => {
                        handleSocietyTypeChange(e.target.value);
                      }}
                      error={formErrors.society_type?.message}
                      disabled={true}
                      required
                    >
                      <option value="">-- Select --</option>
                      {masterData.loading ? (
                        <option value="" disabled>Loading...</option>
                      ) : (
                        masterData.sectorOfOperations
                          .map((sector) => (
                            <option key={sector.id} value={sector.id}>
                              {sector.name}
                            </option>
                          ))
                      )}
                    </Select>
                  </div>
                  {coorporativeSocietyType && (
                    <Button
                      type="button"
                      onClick={() => setShowCoorporativeSocietyType(true)}
                      size="sm"
                      variant="primary"
                      className="mt-4 w-[20%] py-2"
                    >
                      Edit Form
                    </Button>
                  )}
                </div>

                {/* Additional Data Validation */}
                {watchedValues.society_type && !isAdditionalDataValid(additionalData) && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span>
                        <strong>Required:</strong> Please click "Edit Form" to fill the cooperative society form.
                        This information is required to submit the amendment.
                      </span>
                    </div>
                  </div>
                )}

                {/* Additional Data Status */}
                {watchedValues.society_type && isAdditionalDataValid(additionalData) && (
                  <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>
                        <strong>Form Completed:</strong> Cooperative society form has been filled.
                        You can now submit the amendment.
                      </span>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </Card>

          {/* Resolution Details */}
          <Card padding='xs'>
            <div className="p-3">
              <div className="flex items-center space-x-2 mb-3">
                <FileText className="h-4 w-4 text-orange-600" />
                <h2 className={`text-base font-semibold text-gray-900 ${mode}:text-gray-100`}>
                  Resolution Details
                </h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className={`block text-xs font-medium text-gray-700 ${mode}:text-gray-300 mb-1`}>
                    Resolution Extract *
                  </label>
                  <Textarea
                    {...register('resolution_extract', { required: 'Resolution extract is required' })}
                    placeholder="Resolution passed in the General Body Meeting held on..."
                    error={formErrors.resolution_extract?.message}
                    rows={3}
                  // required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className={`block text-xs font-medium text-gray-700 ${mode}:text-gray-300 mb-1`}>
                      Meeting Date *
                    </label>
                    <Input
                      type="datetime-local"
                      max={moment().format('YYYY-MM-DDTHH:mm')}
                      {...register('general_body_meeting_date', {
                        required: 'Meeting date is required',
                        validate: (value) =>
                          !value ||
                          String(value).slice(0, 16) <= moment().format('YYYY-MM-DDTHH:mm') ||
                          'Meeting date cannot be in the future',
                      })}
                      error={formErrors.general_body_meeting_date?.message}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium text-gray-700 ${mode}:text-gray-300 mb-1`}>
                      Notice Days *
                    </label>
                    <Input
                      type="number"
                      {...register('notice_days', { required: 'Notice days is required', min: 1 })}
                      placeholder="0"
                      error={formErrors.notice_days?.message}
                      required
                      maxLength={2}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium text-gray-700 ${mode}:text-gray-300 mb-1`}>
                      Notice Date
                    </label>
                    <Input
                      type="date"
                      {...register('notice_date')}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Meeting Details */}
          <Card padding='xs'>
            <div className="p-3">
              <div className="flex items-center space-x-2 mb-3">
                <Vote className="h-4 w-4 text-red-600" />
                <h2 className={`text-base font-semibold text-gray-900 ${mode}:text-gray-100`}>
                  Meeting Details
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div>
                  <label className={`block text-xs font-medium text-gray-700 ${mode}:text-gray-300 mb-1`}>
                    Total Promoters *
                  </label>
                  <Input
                    type="number"
                    {...register('total_members', { required: 'Total promoters is required', min: 1 })}
                    placeholder="150"
                    error={formErrors.total_members?.message}
                    required
                    maxLength={3}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium text-gray-700 ${mode}:text-gray-300 mb-1`}>
                    Quorum
                  </label>
                  <Input
                    type="number"
                    {...register('quorum_required')}
                    className="bg-gray-50"
                    required
                    maxLength={3}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium text-gray-700 ${mode}:text-gray-300 mb-1`}>
                    Present *
                  </label>
                  <Input
                    type="number"
                    {...register('members_present', { required: 'Promoters present is required', min: 1 })}
                    placeholder="120"
                    error={formErrors.members_present?.message}
                    required
                    maxLength={3}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium text-gray-700 ${mode}:text-gray-300 mb-1`}>
                    Voted *
                  </label>
                  <Input
                    type="number"
                    {...register('members_voted', { required: 'Promoters voted is required', min: 1 })}
                    placeholder="115"
                    error={formErrors.members_voted?.message}
                    required
                    maxLength={3}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium text-gray-700 ${mode}:text-gray-300 mb-1`}>
                    In Favor *
                  </label>
                  <Input
                    type="number"
                    {...register('votes_in_favour', { required: 'Votes in favor is required', min: 0 })}
                    placeholder="110"
                    error={formErrors.votes_in_favour?.message}
                    required
                    maxLength={3}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium text-gray-700 ${mode}:text-gray-300 mb-1`}>
                    Against *
                  </label>
                  <Input
                    type="number"
                    {...register('votes_against', { required: 'Votes against is required', min: 0 })}
                    placeholder="5"
                    error={formErrors.votes_against?.message}
                    required
                    maxLength={3}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Amendment Details */}
          <Card>
            <div className="p-2">
              <div className="flex items-center space-x-2 mb-4">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <h2 className={`text-lg font-semibold text-gray-900 ${mode}:text-gray-100`}>
                  Amendment Details
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Document Upload Fields - 2 Columns */}
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Column - Required Documents */}
                    <div className="space-y-3">
                      <DocumentUpload
                        label="Existing Bye-law"
                        onUploadComplete={(documentId) => handleDocumentUploadComplete('existing_byelaw_media_id', documentId)}
                        onUploadCancel={() => handleDocumentUploadCancel('existing_byelaw_media_id')}
                        error={errors.existing_byelaw_media_id}
                        required={isAmendmentDetailFieldRequired('existing_byelaw_media_id')}
                        existingDocument={existingDocuments.existing_byelaw_media_id}
                        onReplace={(newDocumentId) => handleDocumentReplace('existing_byelaw_media_id', newDocumentId)}
                      />

                      <DocumentUpload
                        label="New Proposed Bye-law"
                        onUploadComplete={(documentId) => handleDocumentUploadComplete('new_proposed_byelaw_media_id', documentId)}
                        onUploadCancel={() => handleDocumentUploadCancel('new_proposed_byelaw_media_id')}
                        error={errors.new_proposed_byelaw_media_id}
                        required={isAmendmentDetailFieldRequired('new_proposed_byelaw_media_id')}
                        existingDocument={existingDocuments.new_proposed_byelaw_media_id}
                        onReplace={(newDocumentId) => handleDocumentReplace('new_proposed_byelaw_media_id', newDocumentId)}
                      />

                      <DocumentUpload
                        label="Meeting Notice Agenda"
                        onUploadComplete={(documentId) => handleDocumentUploadComplete('meeting_notice_agenda_media_id', documentId)}
                        onUploadCancel={() => handleDocumentUploadCancel('meeting_notice_agenda_media_id')}
                        error={errors.meeting_notice_agenda_media_id}
                        required={isAmendmentDetailFieldRequired('meeting_notice_agenda_media_id')}
                        existingDocument={existingDocuments.meeting_notice_agenda_media_id}
                        onReplace={(newDocumentId) => handleDocumentReplace('meeting_notice_agenda_media_id', newDocumentId)}
                      />

                      {/* Copy of Notice Form G — hidden per requirement
                      <DocumentUpload
                        label="Copy of Notice Form G"
                        onUploadComplete={(documentId) => handleDocumentUploadComplete('copy_of_notice_form_g_media_id', documentId)}
                        onUploadCancel={() => handleDocumentUploadCancel('copy_of_notice_form_g_media_id')}
                        error={errors.copy_of_notice_form_g_media_id}
                        required={isAmendmentDetailFieldRequired('copy_of_notice_form_g_media_id')}
                        existingDocument={existingDocuments.copy_of_notice_form_g_media_id}
                        onReplace={(newDocumentId) => handleDocumentReplace('copy_of_notice_form_g_media_id', newDocumentId)}
                      />
                      */}

                      {watchedValues.society_type != existingSectorOfOperation && (
                        <DocumentUpload
                          label="Circular Notice"
                          onUploadComplete={(documentId) => handleDocumentUploadComplete('circular_notice_media_id', documentId)}
                          onUploadCancel={() => handleDocumentUploadCancel('circular_notice_media_id')}
                          error={errors.circular_notice_media_id}
                          required={isAmendmentDetailFieldRequired('circular_notice_media_id')}
                          existingDocument={existingDocuments.circular_notice_media_id}
                          onReplace={(newDocumentId) => handleDocumentReplace('circular_notice_media_id', newDocumentId)}
                        />
                      )}
                    </div>

                    {/* Right Column - Additional Documents */}
                    <div className="space-y-3">
                      <DocumentUpload
                        label="District DRCS/ARCS Recommendation"
                        onUploadComplete={(documentId) => handleDocumentUploadComplete('district_drcs_arcs_recommendation_media_id', documentId)}
                        onUploadCancel={() => handleDocumentUploadCancel('district_drcs_arcs_recommendation_media_id')}
                        error={errors.district_drcs_arcs_recommendation_media_id}
                        required={isAmendmentDetailFieldRequired('district_drcs_arcs_recommendation_media_id')}
                        existingDocument={existingDocuments.district_drcs_arcs_recommendation_media_id}
                        onReplace={(newDocumentId) => handleDocumentReplace('district_drcs_arcs_recommendation_media_id', newDocumentId)}
                      />

                      <DocumentUpload
                        label="Attendance Sheet"
                        onUploadComplete={(documentId) => handleDocumentUploadComplete('attendance_sheet_media_id', documentId)}
                        onUploadCancel={() => handleDocumentUploadCancel('attendance_sheet_media_id')}
                        error={errors.attendance_sheet_media_id}
                        required={isAmendmentDetailFieldRequired('attendance_sheet_media_id')}
                        existingDocument={existingDocuments.attendance_sheet_media_id}
                        onReplace={(newDocumentId) => handleDocumentReplace('attendance_sheet_media_id', newDocumentId)}
                      />

                      <DocumentUpload
                        label="Minutes of the Meeting"
                        onUploadComplete={(documentId) => handleDocumentUploadComplete('minutes_of_meeting_media_id', documentId)}
                        onUploadCancel={() => handleDocumentUploadCancel('minutes_of_meeting_media_id')}
                        error={errors.minutes_of_meeting_media_id}
                        required={isAmendmentDetailFieldRequired('minutes_of_meeting_media_id')}
                        existingDocument={existingDocuments.minutes_of_meeting_media_id}
                        onReplace={(newDocumentId) => handleDocumentReplace('minutes_of_meeting_media_id', newDocumentId)}
                      />

                    </div>
                  </div>
                </div>

                {/* Text Fields Column */}
                <div className="space-y-3">
                  <div>
                    <label className={`block text-xs font-medium text-gray-700 ${mode}:text-gray-300 mb-1`}>
                      Bye-Law Number{isAmendmentDetailFieldRequired('byelaw_number') && ' *'}
                    </label>
                    <Input
                      {...register('byelaw_number', isAmendmentDetailFieldRequired('byelaw_number') ? { required: 'Bye-Law number is required' } : {})}
                      placeholder="BY-005"
                      error={formErrors.byelaw_number?.message}
                      required={isAmendmentDetailFieldRequired('byelaw_number')}
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium text-gray-700 ${mode}:text-gray-300 mb-1`}>
                      Reason for Amendment{isAmendmentDetailFieldRequired('reason_for_amendment') && ' *'}
                    </label>
                    <Textarea
                      {...register('reason_for_amendment', isAmendmentDetailFieldRequired('reason_for_amendment') ? { required: 'Reason for amendment is required' } : {})}
                      placeholder="Explain the reason for this amendment..."
                      error={formErrors.reason_for_amendment?.message}
                      rows={2}
                      required={isAmendmentDetailFieldRequired('reason_for_amendment')}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium text-gray-700 ${mode}:text-gray-300 mb-1`}>
                      Proposed Bye-law Text{isAmendmentDetailFieldRequired('proposed_bylaw_text') && ' *'}
                    </label>
                    <Textarea
                      {...register('proposed_bylaw_text', isAmendmentDetailFieldRequired('proposed_bylaw_text') ? { required: 'Proposed byelaw text is required' } : {})}
                      placeholder="Complete proposed byelaw text with all articles..."
                      error={formErrors.proposed_bylaw_text?.message}
                      rows={4}
                      required={isAmendmentDetailFieldRequired('proposed_bylaw_text')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Submit Buttons */}
          <div className="space-y-4">
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>

              {data?.status?.key !== 'draft' && <Button
                type="button"
                variant="outline"
                onClick={saveAsDraft}
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>}

              <Button
                type="submit"
                disabled={loading || Boolean(watchedValues.society_type && !isAdditionalDataValid(additionalData))}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {(data && data?.status?.key !== 'draft') ? 'Resubmitting...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {(data && data?.status?.key !== 'draft') ? 'Resubmit Amendment' : 'Submit Amendment'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Add/Edit Member Modal */}
      {showAddMemberModal && (
        <Modal
          isOpen={showAddMemberModal}
          onClose={handleCloseMemberModal}
          title={editingMember ? "Edit Promoter" : "Add New Promoter"}
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              {editingMember ? "Edit promoter details" : "Add a new promoter to your society"}
            </p>

            <Input
              label="Name"
              value={newMember.name}
              placeholder='Enter promoter name'
              onChange={(e) => {
                setNewMember({ ...newMember, name: e.target.value });
                if (memberErrors.name) {
                  setMemberErrors(prev => ({ ...prev, name: '' }));
                }
              }}
              required
              error={memberErrors.name}
              maxLength={50}
            />
            <Input
              label="Mobile"
              value={newMember.mobile}
              placeholder='Enter mobile number'
              onChange={(e) => {
                setNewMember({ ...newMember, mobile: e.target.value });
                if (memberErrors.mobile) {
                  setMemberErrors(prev => ({ ...prev, mobile: '' }));
                }
              }}
              required
              error={memberErrors.mobile}
              maxLength={10}
            />

            <Select
              label="Gender"
              value={newMember.gender}
              onChange={(e) => {
                setNewMember({ ...newMember, gender: e.target.value });
                if (memberErrors.gender) {
                  setMemberErrors(prev => ({ ...prev, gender: '' }));
                }
              }}
              required
              error={memberErrors.gender}
            >
              <option value="">-- Select --</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="transgender">Transgender</option>
            </Select>

            <Select
              label="Category"
              value={newMember.category}
              onChange={(e) => {
                setNewMember({ ...newMember, category: e.target.value });
                if (memberErrors.category) {
                  setMemberErrors(prev => ({ ...prev, category: '' }));
                }
              }}
              required
              error={memberErrors.category}
            >
              <option value="">-- Select --</option>
              <option value="General">General</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
            </Select>

            <Select
              label="Designation"
              value={newMember.designation}
              onChange={(e) => {
                setNewMember({ ...newMember, designation: e.target.value });
                if (memberErrors.designation) {
                  setMemberErrors(prev => ({ ...prev, designation: '' }));
                }
              }}
              required
              error={memberErrors.designation}
            >
              <option value="">-- Select --</option>
              <option value="Promoter">Promoter</option>
              {!existingDesignation.chairpersonExist && <option value="Chief Promoter">Chief Promoter</option>}
              {!existingDesignation.secretaryExist && <option value="Secretary">Secretary</option>}
              {!existingDesignation.treasurerExist && <option value="Treasurer">Treasurer</option>}
            </Select>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={handleCloseMemberModal}>
                Cancel
              </Button>
              <Button onClick={() => {
                if (validateMemberDetails()) {
                  if (editingMember) {
                    saveEditedMember();
                  } else {
                    addMember();
                  }
                }
              }}>
                {editingMember ? "Save Changes" : "Add Promoter"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Member Confirmation Modal */}
      {deletingMember && (
        <Modal
          isOpen={!!deletingMember}
          onClose={cancelDeleteMember}
          title="Confirm Shareholder Deletion"
          size="md"
        >
          <div className="space-y-4">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <p className="text-gray-700 font-medium">
                Are you sure you want to remove this shareholder?
              </p>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-left">
                <p className="text-sm font-semibold text-gray-900">
                  {deletingMember.name}
                </p>
                <p className="text-xs text-gray-600">
                  {deletingMember.designation} • {deletingMember.gender} • {deletingMember.category}
                </p>
              </div>
            </div>

            <Textarea
              label="Reason for Deletion *"
              value={deletionReason}
              onChange={(e) => {
                setDeletionReason(e.target.value);
                if (deletionErrors.deletion_reason) {
                  setDeletionErrors((prev) => {
                    const next = { ...prev };
                    delete next.deletion_reason;
                    return next;
                  });
                }
              }}
              placeholder="Enter the reason for deleting this shareholder..."
              rows={3}
              error={deletionErrors.deletion_reason}
              required
            />

            <DocumentUpload
              label="Supporting Document"
              onUploadComplete={(documentId, documentUrl) => {
                setDeletionDocumentId(documentId);
                setDeletionDocumentUrl(documentUrl || '');
                if (deletionErrors.supporting_document) {
                  setDeletionErrors((prev) => {
                    const next = { ...prev };
                    delete next.supporting_document;
                    return next;
                  });
                }
              }}
              onUploadCancel={() => {
                setDeletionDocumentId('');
                setDeletionDocumentUrl('');
              }}
              existingDocument={
                deletionDocumentId
                  ? { id: deletionDocumentId, url: deletionDocumentUrl }
                  : undefined
              }
              error={deletionErrors.supporting_document}
            />

            <p className="text-sm text-gray-600">
              Reason is required. Supporting document is optional.
            </p>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={cancelDeleteMember}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmDeleteMember}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Shareholder
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cooperative Society Type Modal */}
      {showCoorporativeSocietyType && (
        <Modal
          isOpen={showCoorporativeSocietyType}
          onClose={() => setShowCoorporativeSocietyType(false)}
          title={"Coorporative Society Form"}
          size="xl"
        >
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Fill the form to register your society as a cooperative society
            </p>
            {(() => {
              return (
                <CoorporativeMapping
                  societyType={coorporativeSocietyType}
                  data={additionalData}
                  onCancel={() => {
                    setShowCoorporativeSocietyType(false);
                  }}
                  onClose={() => {
                    setShowCoorporativeSocietyType(false);
                  }}
                  onSubmit={(formData) => {
                    setValue('additional_data', formData);
                    setAdditionalData(formData);
                    setShowCoorporativeSocietyType(false);
                  }}
                />
              );
            })()}
          </div>
        </Modal>
      )}
    </div>
  );
};