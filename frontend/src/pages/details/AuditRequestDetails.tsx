import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Edit,
  Calendar,
  FileText,
  Award,
  DollarSign,
  Eye,
  Download,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuditRequestById, isAuditReturnedToApplicant } from '../../lib/data/audits/api';
import moment from 'moment';
import toast from 'react-hot-toast';
import { handleViewPdf } from '../../utils/viewpdf';
import { download, openDocument } from '../../utils/download';
import { ConfirmOrRejectModal } from '../../components/confirm&rejectModal/ConfirmModal';
import { WorkflowReassignBlock } from '../../components/workflow/WorkflowReassignBlock';
import { ProcessingHistoryPanel } from '../../components/workflow/ProcessingHistoryPanel';
import { updateWorkflow } from '../../lib/data/workflows/api';
import {
  canShowWorkflowActions,
  loadForwardAssignmentUsers,
  loadRejectAssignmentUsers,
} from '../../lib/workflow/assigneeUsers';
import { PreviousCommentCard } from '../../components/workflow/PreviousCommentCard';
import { getWorkflowMovementStatusLabel } from '../../utils/workflowMovementStatusLabel';

export const AuditRequestDetails: React.FC = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { id } = useParams();
  const navigate = useNavigate();

  const MODULE_NAME = 'AUDIT_REQUEST';

  const [auditRequest, setAuditRequest] = useState<any>(null);
  const [workflowStatus, setWorkflowStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isRejectModal, setIsRejectModal] = useState(false);
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

  const loadAuditRequest = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await getAuditRequestById(id);
      const requestData = Array.isArray(response) ? response[0] : response;

      if (!requestData) {
        toast.error('Audit request not found');
        setAuditRequest(null);
        setWorkflowStatus(null);
        return;
      }

      setAuditRequest(requestData);
      setWorkflowStatus(requestData.workflowStatus || null);
    } catch (error) {
      console.error('Error loading audit request:', error);
      toast.error('Failed to load audit request details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditRequest();
  }, [id]);

  const currentUser: any = user;
  const currentUserId = currentUser?.id ?? currentUser?.userId;
  const userRoleId = currentUser?.role_id || currentUser?.role?.id;
  const userRoleName =
    typeof currentUser?.role === 'string'
      ? currentUser.role
      : currentUser?.role?.name;

  const auditAssigneeOpts = {
    workflowStatus,
    currentUserId,
    userRoleId,
    userRoleName,
    userIsHq: currentUser?.is_hq,
  };

  const callWorkflowAction = async (
    action: 'approve' | 'back',
    comments?: string,
    documentData?: Record<string, string>,
  bypass?: boolean,
  ) => {
    try {
      setLoadingAction(true);

      if (!auditRequest?.id) {
        toast.error('Invalid audit request ID');
        return;
      }

      const payload: any = {
        resourceId: auditRequest.id,
        moduleName: MODULE_NAME,
        action,
        comments,
        documents: documentData || {},
        bypass: Boolean(bypass),
      };

      if (
        !bypass &&
        action === 'approve' &&
        workflowStatus?.next?.approval_send_to === 'single' &&
        !selectedUserId
      ) {
        toast.error('Please select the user to assign before approving.');
        setLoadingAction(false);
        return;
      }

      if (selectedUserId) {
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
      await loadAuditRequest();
    } catch (error) {
      console.error('Error updating audit workflow:', error);
      toast.error('Workflow update failed');
    } finally {
      setLoadingAction(false);
    }
  };

  const openApproveModal = async () => {
    setIsRejectModal(false);
    const { users, isRequired } = await loadForwardAssignmentUsers(auditAssigneeOpts);
    setIsAssignmentRequired(isRequired);
    setAssignmentUsers(users);
    setModalOpen(true);
  };

  const openRejectModal = async () => {
    setIsRejectModal(true);
    const { users, isRequired } = await loadRejectAssignmentUsers(auditAssigneeOpts);
    setIsAssignmentRequired(isRequired);
    setAssignmentUsers(users);
    setModalOpen(true);
  };

  const viewPdf = (url: string) => {
    handleViewPdf(url, token || '');
  };

  const handleDownloadPdf = (url: string) => {
    download(url, token || '');
  };

  const getAuditClassificationColor = (classification: string) => {
    switch (classification) {
      case 'A':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'B':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'C':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'D':
        return 'bg-red-100 text-red-800 border border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const canShowActions = canShowWorkflowActions(
    auditRequest,
    workflowStatus,
    currentUserId,
    userRoleId,
    userRoleName,
  );
  const canApprove = !!workflowStatus?.next?.approval_status_id;
  const canReject = !!workflowStatus?.next?.reject_status_id;
  const isLastStep =
    workflowStatus?.next?.approvalStatus?.key === 'approved';
  const canResubmit =
    userRoleName === 'applicant' &&
    isAuditReturnedToApplicant({ ...auditRequest, workflowStatus });
  const previousCommentEntry = Array.isArray(auditRequest?.history)
    ? auditRequest.history.find((entry: any) => Boolean(entry?.comments?.trim()))
    : null;
  const previousCommentText =
    workflowStatus?.previousComment
    || previousCommentEntry?.comments?.trim()
    || 'No previous comment available yet.';
  const previousCommentUser = previousCommentEntry?.createdByUser;
  const previousCommentUserName = previousCommentUser
    ? `${previousCommentUser.first_name || ''} ${previousCommentUser.last_name || ''}`.trim() ||
      previousCommentUser.email ||
      ''
    : '';
  const previousCommentUserRole =
    previousCommentUser?.role?.description || previousCommentUser?.role?.name || '';
  const previousCommentDocuments = Array.isArray(auditRequest?.previousCommentDocuments)
    ? auditRequest.previousCommentDocuments
    : [];
  const openInBlankTab = async (url: string) => {
    await openDocument(url, token || '');
  };

  const approvalDocuments = parseWorkflowDocuments(
    workflowStatus?.next?.approval_documents,
  );
  const rejectDocuments = parseWorkflowDocuments(
    workflowStatus?.next?.reject_documents,
  );

  if (loading) {
    return (
      <div className="mt-4">
        <Card className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading audit request data...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!auditRequest) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Audit request not found</p>
      </div>
    );
  }

  return (
    <div className="my-4 mb-5 pb-5">
      <div className="space-y-4 mb-5 pb-5">
        {canResubmit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  Audit request returned for correction
                </p>
                <p className="text-sm text-red-700 mt-1">
                  This request was returned to you. Review the remarks, update the details, and re-submit.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 bg-white"
              onClick={() => navigate(`/audit-requests/${id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Correct & Re-submit
            </Button>
          </div>
        )}
        <Card className="p-4 pb-0">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {auditRequest.societyRegistration?.cooperative_society_name || '-'}
                </h1>
              </div>
              <p className="text-gray-600 mb-4">
                Registration No: {auditRequest.societyRegistration?.registration_number || '-'}
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-between mb-4 items-center">
            <div className="flex flex-wrap gap-2 items-center">
              <span
                className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getAuditClassificationColor(
                  auditRequest.audit_classification,
                )}`}
              >
                Class {auditRequest.audit_classification || '-'}
              </span>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {auditRequest.financial_year || '-'}
              </span>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {getWorkflowMovementStatusLabel(auditRequest, {
                  workflowStatus,
                }) || '-'}
              </span>
            </div>
          </div>
        </Card>

        <PreviousCommentCard
          visible={canShowActions || canResubmit}
          commentText={previousCommentText}
          commentByName={previousCommentUserName}
          commentByRole={previousCommentUserRole}
          commentAtText={previousCommentEntry?.created_at ? moment(previousCommentEntry.created_at).format('DD MMM, YYYY hh:mm a') : ''}
          documents={previousCommentDocuments}
          onViewDocument={openInBlankTab}
          onDownloadDocument={openInBlankTab}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-green-600" />
                Audit Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Financial Year</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {auditRequest.financial_year || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Auditor Name</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {auditRequest.auditor_name || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Auditor Registration Number</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {auditRequest.auditor_registration_number || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Audit Completion Date</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {auditRequest.audit_completion_date
                      ? moment(auditRequest.audit_completion_date).format('DD MMM, YYYY')
                      : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">AGM Date</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {auditRequest.agm_date
                      ? moment(auditRequest.agm_date).format('DD MMM, YYYY')
                      : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">BOD Meeting Date</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {auditRequest.bod_meeting_date
                      ? moment(auditRequest.bod_meeting_date).format('DD MMM, YYYY')
                      : '-'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-red-600" />
                Administrative
              </h3>
              <div className="space-y-3">
                {auditRequest.additional_notes && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Additional Notes</span>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {auditRequest.additional_notes}
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-5">
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created Date</span>
                    <p className="text-sm text-gray-900">
                      {auditRequest.created_at
                        ? moment(auditRequest.created_at).format('DD MMM, YYYY hh:mm a')
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Updated</span>
                    <p className="text-sm text-gray-900">
                      {auditRequest.updated_at
                        ? moment(auditRequest.updated_at).format('DD MMM, YYYY hh:mm a')
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {auditRequest.auditAccountsMedia && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Audit Accounts</p>
                    </div>
                    <div className="flex space-x-2">
                      {auditRequest.auditAccountsMedia.url?.split('.').pop() === 'pdf' && (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(auditRequest.auditAccountsMedia.url)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(auditRequest.auditAccountsMedia.url)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {auditRequest.auditNoteMedia && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Audit Note</p>
                    </div>
                    <div className="flex space-x-2">
                      {auditRequest.auditNoteMedia.url?.split('.').pop() === 'pdf' && (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(auditRequest.auditNoteMedia.url)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(auditRequest.auditNoteMedia.url)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {auditRequest.vitalStatsFormMedia && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Vital Stats Form</p>
                    </div>
                    <div className="flex space-x-2">
                      {auditRequest.vitalStatsFormMedia.url?.split('.').pop() === 'pdf' && (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(auditRequest.vitalStatsFormMedia.url)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(auditRequest.vitalStatsFormMedia.url)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {auditRequest.shareholderListMedia && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Shareholder List</p>
                    </div>
                    <div className="flex space-x-2">
                      {auditRequest.shareholderListMedia.url?.split('.').pop() === 'pdf' && (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(auditRequest.shareholderListMedia.url)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(auditRequest.shareholderListMedia.url)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {auditRequest.agmBodMinutesMedia && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">AGM/BOD Minutes</p>
                    </div>
                    <div className="flex space-x-2">
                      {auditRequest.agmBodMinutesMedia.url?.split('.').pop() === 'pdf' && (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(auditRequest.agmBodMinutesMedia.url)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(auditRequest.agmBodMinutesMedia.url)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {auditRequest.auditorAppointmentLetterMedia && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Auditor Appointment Letter</p>
                    </div>
                    <div className="flex space-x-2">
                      {auditRequest.auditorAppointmentLetterMedia.url?.split('.').pop() === 'pdf' && (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(auditRequest.auditorAppointmentLetterMedia.url)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(auditRequest.auditorAppointmentLetterMedia.url)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {auditRequest.registrationCertificateMedia && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Registration Certificate</p>
                    </div>
                    <div className="flex space-x-2">
                      {auditRequest.registrationCertificateMedia.url?.split('.').pop() === 'pdf' && (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(auditRequest.registrationCertificateMedia.url)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(auditRequest.registrationCertificateMedia.url)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {auditRequest.abstractClosingStockMedia && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Abstract Closing Stock</p>
                    </div>
                    <div className="flex space-x-2">
                      {auditRequest.abstractClosingStockMedia.url?.split('.').pop() === 'pdf' && (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(auditRequest.abstractClosingStockMedia.url)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(auditRequest.abstractClosingStockMedia.url)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {auditRequest.assetListDepreciationMedia && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Asset List & Depreciation</p>
                    </div>
                    <div className="flex space-x-2">
                      {auditRequest.assetListDepreciationMedia.url?.split('.').pop() === 'pdf' && (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(auditRequest.assetListDepreciationMedia.url)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(auditRequest.assetListDepreciationMedia.url)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                Financial Information
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Promoters on Roll</span>
                  <p className="text-lg font-bold text-blue-600">
                    {auditRequest.total_members_on_roll?.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Promoters Attended</span>
                  <p className="text-lg font-bold text-green-600">
                    {auditRequest.members_attended?.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Turnover</span>
                  <p className="text-lg font-bold text-green-600">
                    ₹{Number(auditRequest.turnover).toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Profit/Loss</span>
                  <p className={`text-lg font-bold ${Number(auditRequest.profit_loss) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{Number(auditRequest.profit_loss).toLocaleString() || '0'}
                  </p>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Working Capital</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{Number(auditRequest.working_capital).toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">Audit Fee Paid</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{Number(auditRequest.audit_fee_paid).toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
                Accumulated Information
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Accumulated Profit</span>
                  <p className="text-lg font-bold text-green-600">
                    ₹{Number(auditRequest.accumulated_profit).toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Accumulated Loss</span>
                  <p className="text-lg font-bold text-red-600">
                    ₹{Number(auditRequest.accumulated_loss).toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                RCS Observations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                {(auditRequest?.byeLawsMedia && auditRequest?.byeLawsMedia?.url) ? (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">RCS Observations</p>
                    </div>
                    <div className="flex space-x-2">
                      {auditRequest?.byeLawsMedia?.url?.split('.').pop() === 'pdf' && (
                        <Button size="sm" variant="outline" onClick={() => viewPdf(auditRequest?.byeLawsMedia?.url)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(auditRequest?.byeLawsMedia?.url)}>
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

            <ProcessingHistoryPanel
              resourcePath="audit-requests"
              resourceId={auditRequest?.id ?? id}
              embeddedHistory={auditRequest?.history}
            />

            <WorkflowReassignBlock
              moduleName={MODULE_NAME}
              resourceId={auditRequest?.id ?? id ?? ''}
              entity={auditRequest}
              workflowStatus={workflowStatus}
              currentUserId={currentUserId}
              onRefresh={loadAuditRequest}
              showWorkflowActions={canShowActions}
              onReject={canReject ? openRejectModal : undefined}
              onApprove={canApprove ? openApproveModal : undefined}
              showApproveButton={canApprove && !workflowStatus?.pendingReassign}
              showRejectButton={canReject}
              userRole={user?.role}
              isLastStep={isLastStep}
              showHistory
            />

            <ConfirmOrRejectModal
              loading={loadingAction}
              isOpen={modalOpen}
              workflowStatus={workflowStatus}
              isRejectModal={isRejectModal}
              // title={
              //   isRejectModal
              //     ? 'Reject Audit'
              //     : isLastStep
              //       ? 'Approve Audit'
              //       : 'Forward Audit'
              // }
              // description={
              //   isRejectModal
              //     ? 'Please provide a reason for rejection.'
              //     : isLastStep
              //       ? 'Are you sure you want to approve this audit?'
              //       : 'Add comments, upload required documents and confirm.'
              // }
              title={
                isRejectModal
                  ? 'Return Audit Request'
                  : auditRequest?.workflowStatus?.next?.approvalStatus?.key === "approved"
                    ? 'Approve Audit Request'
                    : 'Forward Audit Request'
              }
              description={
                isRejectModal
                  ? 'Please provide a reason for returning this audit.'
                  : auditRequest?.workflowStatus?.next?.approvalStatus?.key === "approved"
                    ? 'Are you sure you want to approve this audit?'
                    : 'Are you sure you want to forward this audit?'
              }
              assignmentUsers={assignmentUsers}
              selectedUserId={selectedUserId}
              setSelectedUserId={setSelectedUserId}
              isAssignmentRequired={isAssignmentRequired}
              approvalDocuments={approvalDocuments}
              rejectDocuments={rejectDocuments}
              onSubmit={(message, documents, meta) =>
                callWorkflowAction(
                  isRejectModal ? 'back' : 'approve',
                  message,
                  documents,
                  meta?.bypass,
                )
              }
              onCancel={() => setModalOpen(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
