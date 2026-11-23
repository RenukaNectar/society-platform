import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FileText, Eye, Download, Award, Calendar, Edit, CheckCircle, AlertCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { PermissionGuard } from '../../components/guard/PermissionGuard';
import { getElectionRequestById } from '../../lib/data/elections/api';
import { updateWorkflow } from '../../lib/data/workflows/api';
import {
  canShowWorkflowActions,
  getActingWorkflowStep,
  isWorkflowFinalApprovalStep,
  loadForwardAssignmentUsers,
  loadRejectAssignmentUsers,
} from '../../lib/workflow/assigneeUsers';
import moment from 'moment';
import toast from 'react-hot-toast';
import { download, openDocument } from '../../utils/download';
import { handleViewPdf } from '../../utils/viewpdf';
import { ConfirmOrRejectModal } from '../../components/confirm&rejectModal/ConfirmModal';
import { WorkflowReassignBlock } from '../../components/workflow/WorkflowReassignBlock';
import { ProcessingHistoryPanel } from '../../components/workflow/ProcessingHistoryPanel';
import { PreviousCommentCard } from '../../components/workflow/PreviousCommentCard';
import { getWorkflowMovementStatusLabel } from '../../utils/workflowMovementStatusLabel';
import { useAssigneeAvailability } from '../../hooks/useAssigneeAvailability';

const MODULE_NAME = 'ELECTION';

export const ElectionRequestDetails: React.FC = () => {
  const { id }: any = useParams();
  const navigate = useNavigate();
  const [electionRequest, setElectionRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { token, user } = useSelector((state: RootState) => state.auth);

  const [modalOpen, setModalOpen] = useState(false);
  const [isRejectModal, setIsRejectModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [assignmentUsers, setAssignmentUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isAssignmentRequired, setIsAssignmentRequired] = useState(false);

  const parseWorkflowDocuments = (
    docs?: string | string[] | null,
  ): string[] => {
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

  const callWorkflowAction = async (
    action: 'approve' | 'back',
    comments?: string,
    documentData?: Record<string, string | string[]>,
  bypass?: boolean,
  ) => {
    try {
      setSubmitting(true);

      const resourceId = electionRequest?.id;
      if (!resourceId) {
        toast.error('Invalid resource ID');
        return;
      }

      const payload: any = {
        resourceId,
        moduleName: MODULE_NAME,
        action,
        comments,
        documents: documentData || {},
        bypass: Boolean(bypass),
      };

      if (selectedUserId) {
        payload.assigned_to = selectedUserId;
      }

      const res: any = await updateWorkflow(payload);

      if (res?.success !== false) {
        toast.success(
          res?.message ||
          (action === 'approve'
            ? 'Election request forwarded successfully'
            : 'Election request sent back successfully'),
        );
        setModalOpen(false);
        setIsRejectModal(false);
        setSelectedUserId(null);
        setAssignmentUsers([]);
        setIsAssignmentRequired(false);
        loadElectionRequest();
      } else {
        toast.error(res?.message || 'Workflow update failed');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Workflow update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const loadElectionRequest = async () => {
    try {
      setLoading(true);
      const response = await getElectionRequestById(id!);

      if (response) {
        setElectionRequest(response);
      }
    } catch (error) {
      console.error('Error loading election request:', error);
      toast.error('Failed to load election request details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadElectionRequest();
    }
  }, [id]);

  const viewPdf = (url: string) => {
    handleViewPdf(url, token || '');
  };

  const handleDownloadPdf = (url: string) => {
    download(url, token || '');
  };

  const openInBlankTab = async (url: string) => {
    await openDocument(url, token || '');
  };

  const getElectionReasonColor = (reason: string) => {
    switch (reason) {
      case 'Regular Term':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'Early Dissolution':
        return 'bg-red-100 text-red-800 border border-red-300';
      case 'Court Order':
        return 'bg-orange-100 text-orange-800 border border-orange-300';
      case 'Other':
        return 'bg-gray-100 text-gray-800 border border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  // Status badge classes by status key (shared convention across details pages).
  const STATUS_BADGE_CLASS: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-800 border border-blue-300',
    resubmitted: 'bg-blue-100 text-blue-800 border border-blue-300',
    pending: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    forwarded: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    rejected: 'bg-red-100 text-red-800 border border-red-300',
    reverted: 'bg-red-100 text-red-800 border border-red-300',
    approved: 'bg-green-100 text-green-800 border border-green-300',
  };

  const workflowStatusData: any = electionRequest?.workflowStatus || {};
  const electionStatusKey: string | undefined = electionRequest?.status?.key;
  const electionStatusLabel = getWorkflowMovementStatusLabel(electionRequest, {
    statusKey: electionStatusKey,
    statusTitle: electionRequest?.status?.title,
    workflowStatus: workflowStatusData,
  });

  const previousCommentEntry = Array.isArray(electionRequest?.history)
    ? electionRequest.history.find((entry: any) => Boolean(entry?.comments?.trim()))
    : null;

  const previousCommentText =
    electionRequest?.previousComment?.trim()
    || electionRequest?.workflowStatus?.previousComment?.trim()
    || previousCommentEntry?.comments?.trim()
    || '';

  const previousCommentUser = previousCommentEntry?.createdByUser;
  const previousCommentUserName = previousCommentUser
    ? `${previousCommentUser.first_name || ''} ${previousCommentUser.last_name || ''}`.trim() ||
    previousCommentUser.email ||
    ''
    : '';
  const previousCommentUserRole =
    previousCommentUser?.role?.description || previousCommentUser?.role?.name || '';
  const previousCommentDocuments: Array<{
    key: string;
    label: string;
    mediaId: string;
    url: string;
  }> = Array.isArray(electionRequest?.previousCommentDocuments)
      ? electionRequest.previousCommentDocuments.filter((doc: any) => Boolean(doc?.url))
      : [];
  const currentUser: any = user;
  const currentUserId = currentUser?.id ?? currentUser?.userId;
  const userRoleId = currentUser?.role_id || currentUser?.role?.id;
  const userRoleName =
    typeof currentUser?.role === 'string'
      ? currentUser.role
      : currentUser?.role?.name;
  const electionAssigneeOpts = {
    workflowStatus: workflowStatusData,
    currentUserId,
    userIsHq: currentUser?.is_hq,
  };
  const electionEntity = electionRequest
    ? {
        ...electionRequest,
        assigned_to_user_id:
          electionRequest.assigned_to_user_id ??
          workflowStatusData?.assignedToUserId ??
          null,
        status_changed_by: electionRequest.status_changed_by ?? null,
      }
    : null;
  const assigneeAvailability = useAssigneeAvailability({
    workflowStatus: workflowStatusData,
    entity: electionEntity,
    currentUserId,
  });
  const showWorkflowActions = canShowWorkflowActions(
    electionEntity,
    workflowStatusData,
    currentUserId,
    userRoleId,
    userRoleName,
  );
  const actingStep = getActingWorkflowStep(
    workflowStatusData,
    userRoleId,
    userRoleName,
  );
  const isLastStep = isWorkflowFinalApprovalStep(
    workflowStatusData,
    userRoleId,
    userRoleName,
  );

  const openRejectModal = async () => {
    setIsRejectModal(true);
    const { users, isRequired } = await loadRejectAssignmentUsers(electionAssigneeOpts);
    setIsAssignmentRequired(isRequired);
    setAssignmentUsers(users);
    setModalOpen(true);
  };

  const openApproveModal = async () => {
    setIsRejectModal(false);
    const { users, isRequired } = await loadForwardAssignmentUsers(electionAssigneeOpts);
    setIsAssignmentRequired(isRequired);
    setAssignmentUsers(users);
    setModalOpen(true);
  };

  if (loading) {
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

  if (!electionRequest) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Election request not found</p>
      </div>
    );
  }

  return (
    <div className="my-4 mb-5 pb-5">
      <div className="space-y-4 mb-5 pb-5">
        {/* Header Card */}
        <Card className="p-4 pb-0">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {electionRequest.societyRegistration?.cooperative_society_name || '-'}
                </h1>
              </div>
              <p className="text-gray-600 mb-4">
                Registration No: {electionRequest.societyRegistration?.registration_number || '-'}
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-between mb-4 items-center">
            <div className="flex flex-wrap gap-2 items-center">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getElectionReasonColor(electionRequest.reason_for_election_request)}`}>
                {electionRequest.reason_for_election_request || '-'}
              </span>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {electionRequest.proposed_election_date ? moment(electionRequest.proposed_election_date).format('DD MMM, YYYY') : '-'}
              </span>
              <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                {electionRequest.number_of_members_eligible_to_vote || 0} Promoters
              </span>
              {electionRequest?.status && (
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${STATUS_BADGE_CLASS[electionStatusKey || ''] ||
                    'bg-gray-100 text-gray-800 border border-gray-300'
                    }`}
                >
                  {electionStatusLabel}
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <PermissionGuard permission="canEditElections" showAskPermission={false}>
                <Button onClick={() => navigate(`/election-requests/${id}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Election Request
                </Button>
              </PermissionGuard>
            </div>
          </div>
        </Card>

        {/* Previous comment section under society details/header card */}
        <PreviousCommentCard
          visible={showWorkflowActions}
          commentText={previousCommentText}
          commentByName={previousCommentUserName}
          commentByRole={previousCommentUserRole}
          commentAtText={previousCommentEntry?.created_at ? moment(previousCommentEntry.created_at).format('DD MMM, YYYY hh:mm a') : ''}
          documents={previousCommentDocuments}
          onViewDocument={openInBlankTab}
          onDownloadDocument={openInBlankTab}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">

            {/* Election Information */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-green-600" />
                Election Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Election Held Date</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {electionRequest.last_election_held_date ? moment(electionRequest.last_election_held_date).format('DD MMM, YYYY hh:mm a') : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Committee Expiry Date</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {electionRequest.last_elected_committee_expiry_date ? moment(electionRequest.last_elected_committee_expiry_date).format('DD MMM, YYYY hh:mm a') : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reason for Election Request</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {electionRequest.reason_for_election_request || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Proposed Election Date</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {electionRequest.proposed_election_date ? moment(electionRequest.proposed_election_date).format('DD MMM, YYYY hh:mm a') : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Proposed Venue</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {electionRequest.proposed_venue || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Promoters Eligible to Vote</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {electionRequest.number_of_members_eligible_to_vote?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Documents */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                  Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {electionRequest.memberListMedia && (
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Promoter List</p>
                      </div>
                      <div className="flex space-x-2">
                        {electionRequest.memberListMedia.url?.split('.').pop() === 'pdf' && (
                          <Button size="sm" variant="outline" onClick={() => viewPdf(electionRequest.memberListMedia.url)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(electionRequest.memberListMedia.url)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {electionRequest.meetingResolutionCopyMedia && (
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Meeting Resolution Copy</p>
                      </div>
                      <div className="flex space-x-2">
                        {electionRequest.meetingResolutionCopyMedia.url?.split('.').pop() === 'pdf' && (
                          <Button size="sm" variant="outline" onClick={() => viewPdf(electionRequest.meetingResolutionCopyMedia.url)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(electionRequest.meetingResolutionCopyMedia.url)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {electionRequest.previousElectionReportMedia && (
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Previous Election Report</p>
                      </div>
                      <div className="flex space-x-2">
                        {electionRequest.previousElectionReportMedia.url?.split('.').pop() === 'pdf' && (
                          <Button size="sm" variant="outline" onClick={() => viewPdf(electionRequest.previousElectionReportMedia.url)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(electionRequest.previousElectionReportMedia.url)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                  RCS Observations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  {(electionRequest?.byeLawsMedia && electionRequest?.byeLawsMedia.url) ? (
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">RCS Observations</p>
                      </div>
                      <div className="flex space-x-2">
                        {electionRequest?.byeLawsMedia?.url?.split('.').pop() === 'pdf' && (
                          <Button size="sm" variant="outline" onClick={() => viewPdf(electionRequest?.byeLawsMedia?.url)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(electionRequest?.byeLawsMedia?.url)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) :
                    <div className="col-span-3 text-center py-8 text-gray-500">
                      No RCS Observations uploaded
                    </div>
                  }
                </div>
              </Card>

            </div>
          </div>

          {/* Right Column - Status & Timeline */}
          <div className="space-y-4">

            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Election Status
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Status</span>
                  <div className="mt-1">
                    {electionRequest?.status && (
                      <span
                        className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${STATUS_BADGE_CLASS[electionStatusKey || ''] ||
                          'bg-gray-100 text-gray-800 border border-gray-300'
                          }`}
                      >
                        {electionStatusLabel}
                      </span>
                    )}
                  </div>
                </div>
                {(workflowStatusData?.next?.allowedRole?.name
                  || workflowStatusData?.next?.assignedToRole?.name) && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending With</span>
                      <p className="text-sm font-semibold text-gray-900">
                        {(workflowStatusData.next.allowedRole?.name
                          || workflowStatusData.next.assignedToRole?.name)
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </p>
                    </div>
                  )}
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Promoters Eligible</span>
                  <p className="text-lg font-bold text-green-600">
                    {electionRequest.number_of_members_eligible_to_vote?.toLocaleString() || '0'}
                  </p>
                </div>
                {electionRequest.submission_date && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Submitted On</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {moment(electionRequest.submission_date).format('DD MMM, YYYY hh:mm a')}
                      </span>
                    </div>
                  </div>
                )}
                {electionRequest.assignedToUser && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Currently Assigned To</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {electionRequest.assignedToUser.first_name} {electionRequest.assignedToUser.last_name}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-red-600" />
                Administrative
              </h3>
              <div className="space-y-3">
                {electionRequest.additional_notes && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Additional Notes</span>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {electionRequest.additional_notes}
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-5">
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created Date</span>
                    <p className="text-sm text-gray-900">
                      {electionRequest.created_at ? moment(electionRequest.created_at).format('DD MMM, YYYY hh:mm a') : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Updated</span>
                    <p className="text-sm text-gray-900">
                      {electionRequest.updated_at ? moment(electionRequest.updated_at).format('DD MMM, YYYY hh:mm a') : '-'}
                    </p>
                  </div>
                </div>

                {electionRequest.createdBy && (user?.role === 'registrar' || user?.role === 'joint_registrar' || user?.role === 'deputy_registrar' || user?.role === 'admin' || user?.role === 'super_admin') && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Created By</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {electionRequest.createdBy.first_name} {electionRequest.createdBy.last_name}
                        <span className="text-xs text-gray-500 ml-2">({electionRequest.createdBy.email})</span>
                      </span>
                    </div>
                  </div>
                )}

                {electionRequest.updatedBy && (user?.role === 'registrar' || user?.role === 'joint_registrar' || user?.role === 'deputy_registrar' || user?.role === 'admin' || user?.role === 'super_admin') && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Last Updated By</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {electionRequest.updatedBy.first_name} {electionRequest.updatedBy.last_name}
                        <span className="text-xs text-gray-500 ml-2">({electionRequest.updatedBy.email})</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {electionRequest.approval_order_issued && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Approval Details
                </h3>
                <div className="space-y-3">
                  {electionRequest.approval_order_number && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Order Number</span>
                      <p className="text-sm font-semibold text-gray-900">
                        {electionRequest.approval_order_number}
                      </p>
                    </div>
                  )}
                  {electionRequest.approval_order_date && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Order Date</span>
                      <p className="text-sm font-semibold text-gray-900">
                        {moment(electionRequest.approval_order_date).format('DD MMM, YYYY')}
                      </p>
                    </div>
                  )}
                  {electionRequest.approval_order_document_path && (
                    <div className="pt-2 border-t border-gray-200">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPdf(electionRequest.approval_order_document_path)}
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Approval Order
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {electionRequest.rejection_reason && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
                  Rejection Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rejection Reason</span>
                    <p className="text-sm text-gray-900 bg-red-50 p-3 rounded-lg border border-red-200">
                      {electionRequest.rejection_reason}
                    </p>
                  </div>
                  {electionRequest.rejection_date && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rejection Date</span>
                      <p className="text-sm font-semibold text-gray-900">
                        {moment(electionRequest.rejection_date).format('DD MMM, YYYY')}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      <ProcessingHistoryPanel
        resourcePath="election-requests"
        resourceId={electionRequest?.id ?? id}
        embeddedHistory={electionRequest?.history}
      />

      <WorkflowReassignBlock
        moduleName={MODULE_NAME}
        resourceId={electionRequest?.id ?? id ?? ''}
        entity={electionEntity}
        workflowStatus={workflowStatusData}
        currentUserId={currentUserId}
        onRefresh={loadElectionRequest}
        showWorkflowActions={showWorkflowActions}
        onReject={actingStep?.reject_status_id ? openRejectModal : undefined}
        onApprove={actingStep?.approval_status_id ? openApproveModal : undefined}
        showApproveButton={
          !!actingStep?.approval_status_id &&
          !assigneeAvailability.pendingReassign &&
          !assigneeAvailability.showReassign
        }
        showRejectButton={!!actingStep?.reject_status_id}
        userRole={userRoleName}
        isLastStep={isLastStep}
        showHistory
      />

      <ConfirmOrRejectModal
        key={`${modalOpen}-${isRejectModal}`}
        loading={submitting || loading}
        isOpen={modalOpen}
        workflowStatus={workflowStatusData}
        isRejectModal={isRejectModal}
        title={
          isRejectModal
            ? 'Reject Election Request'
            : isLastStep
              ? 'Approve Election Request'
              : 'Forward Election Request'
        }
        description={
          isRejectModal
            ? 'Please provide a reason for returning this election request.'
            : isLastStep
              ? 'Are you sure you want to approve this election request?'
              : 'Are you sure you want to forward this election request?'
        }
        assignmentUsers={assignmentUsers}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        isAssignmentRequired={isAssignmentRequired}
        allowAssignmentOnReject
        approvalDocuments={parseWorkflowDocuments(actingStep?.approval_documents)}
        rejectDocuments={parseWorkflowDocuments(actingStep?.reject_documents)}
        onSubmit={(message, documents, meta) => {
          callWorkflowAction(
            isRejectModal ? 'back' : 'approve',
            message,
            documents,
            meta?.bypass,
          );
        }}
        onCancel={() => {
          setModalOpen(false);
          setIsRejectModal(false);
          setSelectedUserId(null);
          setAssignmentUsers([]);
          setIsAssignmentRequired(false);
        }}
      />
    </div>
  );
};
