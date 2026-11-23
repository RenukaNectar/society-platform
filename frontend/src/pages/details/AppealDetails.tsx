import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  FileText,
  Eye,
  Download,
  Gavel,
  User,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { getAppealById, getAppealHearingsById } from '../../lib/data/appeals/api';
import { updateWorkflow } from '../../lib/data/workflows/api';
import {
  canShowWorkflowActions,
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

const MODULE_NAME = 'APPEAL';

export const AppealDetails: React.FC = () => {
  const { id } = useParams();
  const { user } = useSelector((state: RootState) => state.auth);
  const [appeal, setAppeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useSelector((state: RootState) => state.auth);

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

      const resourceId = appeal?.id;
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
              ? 'Appeal forwarded successfully'
              : 'Appeal sent back successfully'),
        );
        setModalOpen(false);
        setIsRejectModal(false);
        setSelectedUserId(null);
        setAssignmentUsers([]);
        setIsAssignmentRequired(false);
        loadAppeal();
      } else {
        toast.error(res?.message || 'Workflow update failed');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Workflow update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const loadAppeal = async () => {
    try {
      setLoading(true);
      let response = await getAppealById(id!);
      if (response) {
        if (response?.appealStatus?.key == 'hearing_required') {
          let appealHearings = await getAppealHearingsById(response?.id)
          if (Array.isArray(appealHearings) && appealHearings?.length > 0) {
            response.officer_remarks = appealHearings[0]?.officer_remarks
            response.hearing_date = appealHearings[0]?.hearing_date
            response.final_decision_remarks = appealHearings[0]?.final_decision_remarks
            response.date_of_decision = appealHearings[0]?.date_of_decision
          }
          console.log(appealHearings)
        }
        setAppeal(response);
      }
    } catch (error) {
      console.error('Error loading appeal:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadAppeal();
    }
  }, [id]);

  // Handler to open PDF in new tab
  const viewPdf = (url: string) => {
    handleViewPdf(url, token || '')
  };

  // Handler to download PDF
  const handleDownloadPdf = (url: string, filename: string) => {
    download(url, token || '')
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'modified':
        return 'bg-blue-100 text-blue-800';
      case 'sent_back_for_review':
        return 'bg-orange-100 text-orange-800';
      default:
        if (s.includes('reject')) return 'bg-red-100 text-red-800';
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get appellant type badge color
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'society':
        return 'bg-purple-100 text-purple-800';
      case 'member':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get order type badge color
  const getOrderTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'registration':
        return 'bg-blue-100 text-blue-800';
      case 'election':
        return 'bg-green-100 text-green-800';
      case 'liquidation':
        return 'bg-red-100 text-red-800';
      case 'penalty':
        return 'bg-orange-100 text-orange-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const appealAssigneeOpts = {
    workflowStatus: appeal?.workflowStatus,
    currentUserId: (user as any)?.id,
    userIsHq: (user as any)?.is_hq,
  };

  const openRejectModal = async () => {
    setIsRejectModal(true);
    const { users, isRequired } = await loadRejectAssignmentUsers(appealAssigneeOpts);
    setIsAssignmentRequired(isRequired);
    setAssignmentUsers(users);
    setModalOpen(true);
  };

  const openApproveModal = async () => {
    setIsRejectModal(false);
    const { users, isRequired } = await loadForwardAssignmentUsers(appealAssigneeOpts);
    setIsAssignmentRequired(isRequired);
    setAssignmentUsers(users);
    setModalOpen(true);
  };

  const currentUser: any = user;
  const userRoleId = currentUser?.role_id || currentUser?.role?.id;
  const userRoleName =
    typeof currentUser?.role === "string"
      ? currentUser.role
      : currentUser?.role?.name;
  const showWorkflowActions = canShowWorkflowActions(
    appeal,
    appeal?.workflowStatus,
    currentUser?.id,
    userRoleId,
    userRoleName,
  );
  const previousCommentEntry = Array.isArray(appeal?.history)
    ? appeal.history.find((entry: any) => Boolean(entry?.comments?.trim()))
    : null;
  const previousCommentText =
    appeal?.workflowStatus?.previousComment
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
  const previousCommentDocuments = Array.isArray(appeal?.previousCommentDocuments)
    ? appeal.previousCommentDocuments
    : [];
  const openInBlankTab = async (url: string) => {
    await openDocument(url, token || '');
  };
  const isFinalAppealApproval =
    appeal?.workflowStatus?.next?.approvalStatus?.key === 'approved';
  const appealApprovalTitle = isFinalAppealApproval
    ? 'Approve Appeal'
    : 'Forward Appeal';
  const appealApprovalDescription = isFinalAppealApproval
    ? 'Are you sure you want to approve this appeal?'
    : 'Are you sure you want to forward this appeal?';

  if (loading) {
    return (
      <div className="mt-4">
        <Card className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading appeal data...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!appeal) {
    return (
      <div className="mt-4">
        <Card className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">Appeal not found</p>
            <p className="text-sm text-gray-600">The appeal you're looking for doesn't exist</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="my-4 mb-5 pb-5">
      <div className="space-y-4 mb-5 pb-5">
        {/* Header Card */}
        <Card className="p-4 pb-0">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {appeal?.name_of_appellant}
                </h1>
              </div>
              <span className="text-gray-600 mb-2">
                {(appeal?.society_name ||
                  appeal?.society?.cooperative_society_name ||
                  appeal?.society?.local_langauge_society_name) && (
                  <>
                    Society:{" "}
                    {appeal?.society_name ||
                      appeal?.society?.cooperative_society_name ||
                      appeal?.society?.local_langauge_society_name}
                    {appeal?.society_registration_no ? " | " : ""}
                  </>
                )}
                {appeal?.society_registration_no &&
                  `Society Registration No.: ${appeal?.society_registration_no}`}
              </span>
            </div>
          </div>
          <div className="flex gap-2 justify-between mb-4 items-center">
            <div className="flex flex-wrap gap-2 items-center">
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full whitespace-normal ${getStatusBadgeColor(appeal?.appealStatus?.key || appeal?.appealStatus?.title || '')}`}>
                {getWorkflowMovementStatusLabel(appeal)}
              </span>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getTypeBadgeColor(appeal?.appellant_type)}`}>
                {appeal?.appellant_type}
              </span>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getOrderTypeBadgeColor(appeal?.order_type)}`}>
                {appeal?.order_type}
              </span>
              {appeal?.filing_date && (
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  Filed: {moment(appeal?.filing_date).format('DD MMM, YYYY')}
                </span>
              )}
            </div>
          </div>
        </Card>

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
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {appeal?.appealStatus?.key == 'hearing_required' && <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Hearing Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Officer Remarks</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {appeal?.officer_remarks || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hearing Date</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {appeal?.hearing_date ? moment(appeal?.hearing_date).format('DD MMM, YYYY') : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Final Decision Remarks</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {appeal?.final_decision_remarks || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date of Decision</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {appeal?.date_of_decision ? moment(appeal?.date_of_decision).format('DD MMM, YYYY') : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hearing Submitted On</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {moment(appeal?.createdAt).format('DD MMM, YYYY hh:mm a') || '-'}
                  </p>
                </div>
                {appeal?.createdByUser?.name && <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hearing Submitted By</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {appeal?.createdByUser?.name || '-'} (Registrar)
                  </p>
                </div>}
              </div>
            </Card>}

            {/* Appellant Information */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Appellant Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Appellant Type</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {appeal?.appellant_type || '-'}
                  </p>
                </div>
                {appeal?.society_registration_no && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Society Registration No.</span>
                    <p className="text-sm font-semibold text-gray-900">
                      {appeal?.society_registration_no || '-'}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Appellant Name</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {appeal?.name_of_appellant || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contact Number</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {appeal?.contact_phone || '-'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email Address</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {appeal?.contact_email || '-'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Order Details */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Gavel className="w-5 h-5 mr-2 text-red-600" />
                Order Against Which Appeal is Filed
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Order Type</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {appeal?.order_type || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Order Number</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {appeal?.order_number || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Order Date</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {appeal?.order_date ? moment(appeal?.order_date).format('DD MMM, YYYY') : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Filing Date</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {appeal?.created_at ? moment(appeal?.created_at).format('DD MMM, YYYY hh:mm a') : '-'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Appeal Details */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-green-600" />
                Appeal Details
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Grounds of Appeal</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {appeal?.grounds_of_appeal || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Relief Sought</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {appeal?.relief_sought || '-'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          {/* <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
                Review & Decision
              </h3>
              <div className="space-y-4">
                {appeal?.officer_remarks && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Officer Remarks / Observations</span>
                    <p className="text-sm text-gray-900 mt-1">
                      {appeal?.officer_remarks}
                    </p>
                  </div>
                )}

                {appeal?.hearing_date && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hearing Date</span>
                    <p className="text-sm font-semibold text-gray-900">
                      {moment(appeal?.hearing_date).format('DD MMM, YYYY')}
                    </p>
                  </div>
                )}

                {appeal?.status !== 'pending' && (
                  <>
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Decision Status</span>
                      <p className="text-sm font-semibold text-gray-900">
                        {appeal?.status?.replace(/_/g, ' ')}
                      </p>
                    </div>

                    {appeal?.final_decision_remarks && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Final Decision Remarks</span>
                        <p className="text-sm text-gray-900 mt-1">
                          {appeal?.final_decision_remarks}
                        </p>
                      </div>
                    )}

                    {appeal?.decision_date && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Decision Date</span>
                        <p className="text-sm font-semibold text-gray-900">
                          {moment(appeal?.decision_date).format('DD MMM, YYYY')}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                Timeline
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Order Date</span>
                  <span className="text-sm font-medium">
                    {appeal?.order_date ? moment(appeal?.order_date).format('DD MMM, YYYY') : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Appeal Filed</span>
                  <span className="text-sm font-medium">
                    {appeal?.filing_date ? moment(appeal?.filing_date).format('DD MMM, YYYY') : '-'}
                  </span>
                </div>
                {appeal?.hearing_date && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Hearing Date</span>
                    <span className="text-sm font-medium">
                      {moment(appeal?.hearing_date).format('DD MMM, YYYY')}
                    </span>
                  </div>
                )}
                {appeal?.decision_date && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Decision Date</span>
                    <span className="text-sm font-medium">
                      {moment(appeal?.decision_date).format('DD MMM, YYYY')}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div> */}
        </div>

        {/* Documents Section - Full Width */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileSpreadsheet className="w-5 h-5 mr-2 text-indigo-600" />
            Documents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
            {/* Supporting Documents */}
            {appeal?.supportingDocumentFile && (
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Supporting Documents</p>
                </div>
                <div className="flex space-x-2">
                  {appeal?.supportingDocumentFile?.url?.split('.').pop() === 'pdf' && (
                    <Button size="sm" variant="outline" onClick={() => viewPdf(appeal?.supportingDocumentFile?.url)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(appeal?.supportingDocumentFile?.url, 'supporting-documents.pdf')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {!appeal?.supportingDocumentFile && (
              <div className="col-span-3 text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium">No documents uploaded</p>
                <p className="text-sm">No documents have been uploaded for this appeal</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileSpreadsheet className="w-5 h-5 mr-2 text-indigo-600" />
            RCS Observations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-4">
            {/* Supporting Documents */}
            {(appeal?.byeLawsMedia && appeal?.byeLawsMedia?.url) ? (
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">RCS Observations</p> 
                </div>
                <div className="flex space-x-2">
                  {appeal?.byeLawsMedia?.url?.split('.').pop() === 'pdf' && (
                    <Button size="sm" variant="outline" onClick={() => viewPdf(appeal?.byeLawsMedia?.url)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(appeal?.byeLawsMedia?.url, 'rcs-observations.pdf')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ):
            <div className="col-span-3 text-center py-8 text-gray-500">
              No RCS Observations uploaded  
            </div>
            }

          </div>
        </Card>
    </div>


      </div>

      <ProcessingHistoryPanel
        resourcePath="appeals"
        resourceId={appeal?.id ?? id}
        embeddedHistory={appeal?.history}
      />

      <WorkflowReassignBlock
        moduleName={MODULE_NAME}
        resourceId={appeal?.id ?? id ?? ''}
        entity={appeal}
        workflowStatus={appeal?.workflowStatus}
        currentUserId={currentUser?.id}
        onRefresh={loadAppeal}
        showWorkflowActions={showWorkflowActions}
        onReject={
          appeal?.workflowStatus?.next?.reject_status_id ? openRejectModal : undefined
        }
        onApprove={
          appeal?.workflowStatus?.next?.approval_status_id ? openApproveModal : undefined
        }
        showApproveButton={
          !!appeal?.workflowStatus?.next?.approval_status_id &&
          !appeal?.workflowStatus?.pendingReassign
        }
        showRejectButton={!!appeal?.workflowStatus?.next?.reject_status_id}
        userRole={currentUser?.role}
        isLastStep={isFinalAppealApproval}
        showHistory
      />
      <ConfirmOrRejectModal
        key={`${modalOpen}-${isRejectModal}`}
        loading={submitting || loading}
        isOpen={modalOpen}
        workflowStatus={appeal?.workflowStatus}
        isRejectModal={isRejectModal}
        title={isRejectModal ? 'Return Appeal' : appealApprovalTitle}
        description={
          isRejectModal
            ? 'Please provide a reason for returning this appeal.'
            : appealApprovalDescription
        }
        assignmentUsers={assignmentUsers}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        isAssignmentRequired={isAssignmentRequired}
        allowAssignmentOnReject
        approvalDocuments={parseWorkflowDocuments(
          appeal?.workflowStatus?.next?.approval_documents,
        )}
        rejectDocuments={parseWorkflowDocuments(
          appeal?.workflowStatus?.next?.reject_documents,
        )}
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
