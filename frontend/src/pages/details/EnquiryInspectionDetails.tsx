import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  FileText,
  Eye,
  Download,
  Search,
  User,
  Building,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { getEnquiryInspectionById } from '../../lib/data/enquiryInspections/api';
import moment from 'moment';
import toast from 'react-hot-toast';
import { download } from '../../utils/download';
import { handleViewPdf } from '../../utils/viewpdf';
import { enquiryHeadOfficeStatusLabel } from '../../utils/userFacingWorkflowCopy';
import { getWorkflowMovementStatusLabel } from '../../utils/workflowMovementStatusLabel';
import { ProcessingHistoryPanel } from '../../components/workflow/ProcessingHistoryPanel';
import { WorkflowReassignBlock } from '../../components/workflow/WorkflowReassignBlock';
import { ConfirmOrRejectModal } from '../../components/confirm&rejectModal/ConfirmModal';
import { PreviousCommentCard } from '../../components/workflow/PreviousCommentCard';
import { updateWorkflow } from '../../lib/data/workflows/api';
import {
  canShowInspectionWorkflowActions,
  loadInspectionForwardAssignmentUsers,
  loadInspectionRejectAssignmentUsers,
} from '../../lib/workflow/assigneeUsers';
import { resolveEffectiveAssignedToUserId } from '../../utils/workflowReassign';

const MODULE_NAME = 'INSPECTION_INQUIRY';

const parseWorkflowDocuments = (docs?: string | string[] | null): string[] => {
  if (!docs) return [];
  if (Array.isArray(docs)) return docs;
  if (typeof docs === 'string') {
    try {
      return JSON.parse(docs);
    } catch {
      return [];
    }
  }
  return [];
};

const getAllowedRoleNames = (step: any): string[] => {
  if (!step) return [];
  const fromList = (step.allowedRoles || [])
    .map((role: { name?: string }) => role.name)
    .filter(Boolean);
  if (fromList.length) return fromList;
  return step.allowedRole?.name ? [step.allowedRole.name] : [];
};

const formatWorkflowRoleLabel = (step: any) => {
  const names = getAllowedRoleNames(step);
  return names.length ? names.join(' / ') : '-';
};

export const EnquiryInspectionDetails: React.FC = () => {
  const { id } = useParams();
  const { user, token } = useSelector((state: RootState) => state.auth);

  const [enquiry, setEnquiry] = useState<any>(null);
  const [workflowStatus, setWorkflowStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isRejectModal, setIsRejectModal] = useState(false);
  const [assignmentUsers, setAssignmentUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isAssignmentRequired, setIsAssignmentRequired] = useState(false);

  const loadEnquiry = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getEnquiryInspectionById(id);
      setEnquiry(data);
      setWorkflowStatus(data?.workflowStatus || null);
    } catch (error) {
      console.error('Error loading enquiry:', error);
      toast.error('Failed to load enquiry details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadEnquiry();
    }
  }, [id]);

  const callWorkflowAction = async (
    action: 'approve' | 'back',
    comments?: string,
    documentData?: Record<string, string | string[]>,
  bypass?: boolean,
  ) => {
    try {
      setLoadingAction(true);

      if (!enquiry?.id) {
        toast.error('Invalid enquiry ID');
        return;
      }

      const payload: any = {
        resourceId: enquiry.id,
        moduleName: MODULE_NAME,
        action,
        comments,
        documents: documentData || {},
        bypass: Boolean(bypass),
      };

      if (!bypass && action === 'approve' && isAssignmentRequired && !selectedUserId) {
        toast.error('Please select the user to assign before continuing.');
        return;
      }

      if (action === 'approve' && selectedUserId) {
        payload.assigned_to = selectedUserId;
      }

      const response = await updateWorkflow(payload);

      if (response?.success === false) {
        toast.error(response?.message || 'Workflow update failed');
        return;
      }

      toast.success('Workflow updated successfully');
      setModalOpen(false);
      setSelectedUserId(null);
      setAssignmentUsers([]);
      setIsAssignmentRequired(false);
      await loadEnquiry();
    } catch (error) {
      console.error('Error updating enquiry workflow:', error);
      toast.error('Workflow update failed');
    } finally {
      setLoadingAction(false);
    }
  };

  const currentUser: any = user;
  const userRoleId = currentUser?.role_id || currentUser?.role?.id;
  const userRoleName =
    typeof currentUser?.role === 'string'
      ? currentUser.role
      : currentUser?.role?.name;
  const activeWorkflowStatus = enquiry?.workflowStatus || workflowStatus;

  const effectiveAssignedToUserId = resolveEffectiveAssignedToUserId(
    activeWorkflowStatus,
    enquiry,
  );

  const workflowActionEntity = enquiry
    ? { ...enquiry, assigned_to_user_id: effectiveAssignedToUserId }
    : null;

  const showWorkflowActions = canShowInspectionWorkflowActions(
    workflowActionEntity,
    activeWorkflowStatus,
    currentUser?.id,
    userRoleId,
    userRoleName,
  );

  const currentStep = activeWorkflowStatus?.current;
  const nextStep = activeWorkflowStatus?.next;
  const currentApprovalKey = currentStep?.approvalStatus?.key;
  const canApprove = !!(
    nextStep?.approval_status_id ||
    (!nextStep && currentStep?.approval_status_id)
  );
  const canReject = !!(
    nextStep?.reject_status_id ||
    (!nextStep && currentStep?.reject_status_id)
  );
  const isLastStep =
    !nextStep ||
    currentApprovalKey === 'inspection_approved' ||
    currentApprovalKey === 'inquiry_approved' ||
    currentApprovalKey === 'inspection_inquiry_approved';

  const previousCommentEntry = Array.isArray(enquiry?.history)
    ? enquiry.history.find((entry: any) => Boolean(entry?.comments?.trim()))
    : null;
  const previousCommentText =
    activeWorkflowStatus?.previousComment ||
    previousCommentEntry?.comments?.trim() ||
    'No previous comment available yet.';

  const baseApprovalDocuments = parseWorkflowDocuments(
    currentStep?.approval_documents,
  );
  const approvalDocuments = isLastStep
    ? []
    : currentStep?.sequence === 2 &&
      !enquiry?.is_rcs_initiated &&
      !baseApprovalDocuments.includes('office_order')
      ? ['office_order', ...baseApprovalDocuments]
      : baseApprovalDocuments;
  const rejectDocuments = parseWorkflowDocuments(
    currentStep?.reject_documents ?? nextStep?.reject_documents,
  );

  const workflowFlowLabel = enquiry?.is_rcs_initiated
    ? 'RCS / HQ inspection workflow'
    : 'District inspection workflow (JICS/SICS District)';
  const applicantTypeLabel =
    enquiry?.applicant_type === 'Member'
      ? 'Shareholder'
      : enquiry?.applicant_type?.replace(/_/g, ' ') || '-';

  const inspectionAssigneeOpts = {
    workflowStatus: activeWorkflowStatus,
    currentUserId: user?.id,
    userRoleId,
    userRoleName,
    userIsHq: (user as any)?.is_hq,
  };

  const openApproveModal = async () => {
    setIsRejectModal(false);
    const { users, isRequired } = await loadInspectionForwardAssignmentUsers(
      inspectionAssigneeOpts,
    );
    setIsAssignmentRequired(isRequired);
    setAssignmentUsers(users);
    setModalOpen(true);
  };

  const openRejectModal = async () => {
    setIsRejectModal(true);
    const { users, isRequired } = await loadInspectionRejectAssignmentUsers(
      inspectionAssigneeOpts,
    );
    setIsAssignmentRequired(isRequired);
    setAssignmentUsers(users);
    setSelectedUserId(null);
    setModalOpen(true);
  };

  const viewPdf = (url: string) => {
    handleViewPdf(url, token || '');
  };

  const handleDownloadPdf = (url: string) => {
    download(url, token || '');
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
      case 'forwarded':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
      case 'approved':
      case 'inspection_approved':
      case 'inspection_inquiry_approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'member':
      case 'Member':
        return 'bg-purple-100 text-purple-800';
      case 'office_bearer':
      case 'Office Bearer':
        return 'bg-indigo-100 text-indigo-800';
      case 'general_public':
      case 'General Public':
        return 'bg-green-100 text-green-800';
      case 'other':
      case 'Other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubjectBadgeColor = (reason: string) => {
    switch (reason) {
      case 'inquiry':
      case 'Inquiry':
        return 'bg-sky-100 text-sky-800';
      case 'inspection':
      case 'Inspection':
        return 'bg-teal-100 text-teal-800';
      case 'complaint':
      case 'Complaint':
        return 'bg-red-100 text-red-800';
      case 'irregularity':
      case 'Irregularity':
        return 'bg-orange-100 text-orange-800';
      case 'routine_check':
      case 'Routine Check':
        return 'bg-blue-100 text-blue-800';
      case 'other':
      case 'Other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="mt-4">
        <Card className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading enquiry data...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!enquiry) {
    return (
      <div className="mt-4">
        <Card className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">Enquiry not found</p>
            <p className="text-sm text-gray-600">The enquiry you're looking for doesn't exist</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="my-4 mb-5 pb-5">
      <div className="space-y-4 mb-5 pb-5">
        <Card className="p-4 pb-0">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {enquiry?.applicant_name}
                </h1>
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-between mb-4 items-center">
            <div className="flex flex-wrap gap-2 items-center">
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeColor(enquiry?.statusInfo?.key)}`}>
                {getWorkflowMovementStatusLabel(enquiry, {
                  statusKey: enquiry?.statusInfo?.key,
                  statusTitle: enquiryHeadOfficeStatusLabel(
                    enquiry?.is_rcs_initiated,
                    enquiry?.statusInfo?.key,
                    enquiry?.statusInfo?.title,
                  ),
                  workflowStatus: activeWorkflowStatus || enquiry?.workflowStatus,
                })}
              </span>
              <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-slate-100 text-slate-800">
                {workflowFlowLabel}
              </span>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getTypeBadgeColor(enquiry?.applicant_type)}`}>
                {applicantTypeLabel}
              </span>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getSubjectBadgeColor(enquiry?.subject)}`}>
                {enquiry?.subject}
              </span>
              {enquiry?.created_at && (
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  Requested: {moment(enquiry?.created_at).format('DD MMM, YYYY hh:mm a')}
                </span>
              )}
            </div>
          </div>
        </Card>

        <PreviousCommentCard commentText={previousCommentText} />

        {/* {activeWorkflowStatus && (
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Workflow Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Step</span>
                <p className="font-semibold text-gray-900 mt-1">
                  {activeWorkflowStatus?.current?.sequence
                    ? `Step ${activeWorkflowStatus.current.sequence} of ${activeWorkflowStatus.total_workflowLevel || activeWorkflowStatus.current?.total_workflowLevel || '-'}`
                    : '-'}
                </p>
                <p className="text-gray-600 mt-1">{formatWorkflowRoleLabel(activeWorkflowStatus?.current)}</p>
                {activeWorkflowStatus?.currentStatus?.title && (
                  <p className="text-xs text-gray-500 mt-1">
                    Status: {activeWorkflowStatus.currentStatus.title}
                  </p>
                )}
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Next Step (Action)</span>
                <p className="font-semibold text-gray-900 mt-1">
                  {activeWorkflowStatus?.next?.sequence
                    ? `Step ${activeWorkflowStatus.next.sequence}`
                    : 'Workflow completed'}
                </p>
                <p className="text-gray-600 mt-1">{formatWorkflowRoleLabel(activeWorkflowStatus?.next)}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Previous Step</span>
                <p className="font-semibold text-gray-900 mt-1">
                  {activeWorkflowStatus?.previous?.sequence
                    ? `Step ${activeWorkflowStatus.previous.sequence}`
                    : '-'}
                </p>
                <p className="text-gray-600 mt-1">{formatWorkflowRoleLabel(activeWorkflowStatus?.previous)}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Assigned To</span>
                <p className="font-semibold text-gray-900 mt-1">
                  {activeWorkflowStatus?.assignedUser?.full_name ||
                    [activeWorkflowStatus?.assignedUser?.first_name, activeWorkflowStatus?.assignedUser?.last_name]
                      .filter(Boolean)
                      .join(' ') ||
                    collectAssigneeRoleNames(activeWorkflowStatus).join(' / ') ||
                    '-'}
                </p>
              </div>
            </div>
          </Card>
        )} */}

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Applicant Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Applicant Type</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {applicantTypeLabel}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Applicant Name</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {enquiry?.applicant_name || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contact Number</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {enquiry?.contact_number || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email Address</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {enquiry?.email_id || '-'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Applicant Address</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {enquiry?.address || '-'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2 text-green-600" />
                Society Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Society Registration Number</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {enquiry?.society_registration_number || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Society Name</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {enquiry?.society_name || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Society Address</span>
                  <p className="text-xs text-gray-500">Filled from the selected society.</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {enquiry?.society_address || '-'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Search className="w-5 h-5 mr-2 text-purple-600" />
                Enquiry/Inspection Details
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject/Reason</span>
                    <p className="text-sm font-semibold text-gray-900">
                      {enquiry?.subject || '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preferred Office Level</span>
                    <p className="text-sm font-semibold text-gray-900">
                      {enquiry?.preferred_office_level || '-'}
                    </p>
                  </div>

                  {enquiry?.date_of_incident && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date of Incident/Concern</span>
                      <p className="text-sm font-semibold text-gray-900">
                        {moment(enquiry?.date_of_incident).format('DD MMM, YYYY')}
                      </p>
                    </div>
                  )}
                  {enquiry?.previous_reference_number && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Previous Reference Number</span>
                      <p className="text-sm font-semibold text-gray-900">
                        {enquiry?.previous_reference_number}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Detailed Description</span>
                    <p className="text-sm text-gray-900 mt-1">
                      {enquiry?.description || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 lg:col-span-3 flex gap-4">
          <Card className="flex-1 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileSpreadsheet className="w-5 h-5 mr-2 text-indigo-600" />
              Documents
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {enquiry?.documentFiles && (
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Supporting Documents</p>
                  </div>
                  <div className="flex space-x-2">
                    {enquiry?.documentFiles?.url?.split('.').pop() === 'pdf' && (
                      <Button size="sm" variant="outline" onClick={() => viewPdf(enquiry?.documentFiles?.url)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(enquiry?.documentFiles?.url)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {!enquiry?.documentFiles && (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium">No documents uploaded</p>
                  <p className="text-sm">No supporting documents have been uploaded for this request</p>
                </div>
              )}
            </div>
          </Card>
          <Card className="flex-1 p-4">
            <h3 className=" text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileSpreadsheet className="w-5 h-5 mr-2 text-indigo-600" />
              RCS Observations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-4">
              {(enquiry?.byeLawsMedia && enquiry?.byeLawsMedia?.url) ? (
                <div className=" flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">RCS Observations</p>
                  </div>
                  <div className="flex space-x-2">
                    {enquiry?.byeLawsMedia?.url?.split('.').pop() === 'pdf' && (
                      <Button size="sm" variant="outline" onClick={() => viewPdf(enquiry?.byeLawsMedia?.url)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(enquiry?.byeLawsMedia?.url, 'bye-laws.pdf')}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  No RCS Observations uploaded
                </div>
              )}
            </div>
          </Card>
        </div>

        <ProcessingHistoryPanel
          resourcePath="enquiry-requests"
          resourceId={enquiry?.id ?? id}
          embeddedHistory={enquiry?.history}
        />

        <WorkflowReassignBlock
          moduleName={MODULE_NAME}
          resourceId={enquiry?.id ?? id ?? ''}
          entity={workflowActionEntity}
          workflowStatus={activeWorkflowStatus}
          currentUserId={user?.id}
          onRefresh={loadEnquiry}
          showWorkflowActions={showWorkflowActions}
          onReject={canReject ? openRejectModal : undefined}
          onApprove={canApprove ? openApproveModal : undefined}
          showApproveButton={canApprove && !activeWorkflowStatus?.pendingReassign}
          showRejectButton={canReject}
          userRole={user?.role}
          isLastStep={isLastStep}
          showHistory
        />

        <ConfirmOrRejectModal
          loading={loadingAction}
          isOpen={modalOpen}
          workflowStatus={activeWorkflowStatus}
          isRejectModal={isRejectModal}
          title={
            isRejectModal
              ? enquiry?.is_rcs_initiated
                ? 'Return Inquiry/Inspection'
                : 'Return Inspection / Inquiry'
              : isLastStep
                ? 'Approve Inspection / Inquiry'
                : 'Forward Inspection / Inquiry'
          }
          description={
            isRejectModal
              ? enquiry?.is_rcs_initiated
                ? 'Please provide a reason for returning this Inquiry/Inspection.'
                : 'Please provide a reason for returning this inspection / inquiry.'
              : isLastStep
                ? 'Are you sure you want to approve this inspection / inquiry?'
                : 'Are you sure you want to forward this inspection / inquiry?'
          }
          assignmentUsers={assignmentUsers}
          selectedUserId={selectedUserId}
          setSelectedUserId={setSelectedUserId}
          isAssignmentRequired={isAssignmentRequired}
          approvalDocuments={approvalDocuments}
          rejectDocuments={rejectDocuments}
          onSubmit={(message, documents, meta) =>
            callWorkflowAction(isRejectModal ? 'back' : 'approve', message, documents, meta?.bypass)
          }
          onCancel={() => setModalOpen(false)}
        />
      </div>
    </div>
  );
};
