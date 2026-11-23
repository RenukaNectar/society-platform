import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import moment from 'moment';
import toast from 'react-hot-toast';
import { RootState } from '../../store';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { AdditionalDetails } from '../../components/details/AdditionalDetails';
import { ConfirmOrRejectModal } from '../../components/confirm&rejectModal/ConfirmModal';
import { WorkflowReassignBlock } from '../../components/workflow/WorkflowReassignBlock';
import { ProcessingHistoryPanel } from '../../components/workflow/ProcessingHistoryPanel';
import { PreviousCommentCard } from '../../components/workflow/PreviousCommentCard';
import { getBusinessActivityById } from '../../lib/data/businessActivities/api';
import { updateWorkflow } from '../../lib/data/workflows/api';
import {
  canShowWorkflowActions,
  getActingWorkflowStep,
  isWorkflowFinalApprovalStep,
  loadForwardAssignmentUsers,
  loadRejectAssignmentUsers,
} from '../../lib/workflow/assigneeUsers';
import { getWorkflowMovementStatusLabel } from '../../utils/workflowMovementStatusLabel';
import { getStatusColor } from '../../utils/getStatusByKey';
import {
  isAutoWorkflowHistoryComment,
  pickMeaningfulHistoryComment,
} from '../../utils/workflowComment';

const MODULE_NAME = 'BUSINESS_ACTIVITY';

export const BusinessActivityDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { mode } = useSelector((state: RootState) => state.theme);

  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isRejectModal, setIsRejectModal] = useState(false);
  const [assignmentUsers, setAssignmentUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isAssignmentRequired, setIsAssignmentRequired] = useState(false);

  const loadActivity = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response: any = await getBusinessActivityById(id);
      setActivity(response?.data || null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load sector of operation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const callWorkflowAction = async (
    action: 'approve' | 'back',
    comments?: string,
    documentData?: Record<string, string | string[]>,
    bypass?: boolean
  ) => {
    try {
      setSubmitting(true);
      if (!activity?.id) {
        toast.error('Invalid request');
        return;
      }
      const payload: any = {
        resourceId: activity.id,
        moduleName: MODULE_NAME,
        action,
        comments,
        documents: documentData || {},
        bypass: Boolean(bypass),
      };
      if (
        !bypass &&
        action === 'approve' &&
        activity?.workflowStatus?.next?.approval_send_to === 'single' &&
        !selectedUserId
      ) {
        toast.error('Please select the user to assign before approving.');
        return;
      }
      if (selectedUserId) payload.assigned_to = selectedUserId;

      const res: any = await updateWorkflow(payload);
      if (res?.success === false) {
        toast.error(res?.message || 'Workflow update failed');
        return;
      }
      toast.success(
        res?.message ||
          (action === 'approve'
            ? 'Sector of operation forwarded successfully'
            : 'Sector of operation sent back successfully')
      );
      setModalOpen(false);
      setIsRejectModal(false);
      setSelectedUserId(null);
      setAssignmentUsers([]);
      setIsAssignmentRequired(false);
      loadActivity();
    } catch (error: any) {
      toast.error(error?.message || 'Workflow update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const assigneeOpts = {
    workflowStatus: activity?.workflowStatus,
    currentUserId: (user as any)?.id,
    userIsHq: (user as any)?.is_hq,
  };

  const openApproveModal = async () => {
    setIsRejectModal(false);
    const { users, isRequired } = await loadForwardAssignmentUsers(assigneeOpts);
    setIsAssignmentRequired(isRequired);
    setAssignmentUsers(users);
    setModalOpen(true);
  };

  const openRejectModal = async () => {
    setIsRejectModal(true);
    const { users, isRequired } = await loadRejectAssignmentUsers(assigneeOpts);
    setIsAssignmentRequired(isRequired);
    setAssignmentUsers(users);
    setModalOpen(true);
  };

  if (loading && !activity) {
    return <div className="p-8 text-center">Loading sector of operation...</div>;
  }

  if (!activity) {
    return (
      <div className="p-8 text-center space-y-3">
        <p>Sector of operation request not found.</p>
        <Button onClick={() => navigate('/sector-of-operation')}>Back to List</Button>
      </div>
    );
  }

  const currentUser: any = user;
  const workflowStatus = activity?.workflowStatus;
  const userRoleId = currentUser?.role_id || currentUser?.role?.id;
  const userRoleName = typeof currentUser?.role === 'string' ? currentUser.role : currentUser?.role?.name;
  const showWorkflowActions = canShowWorkflowActions(
    activity,
    workflowStatus,
    currentUser?.id,
    userRoleId,
    userRoleName
  );
  const actingStep = getActingWorkflowStep(workflowStatus, userRoleId, userRoleName);
  const canApprove = !!actingStep?.approval_status_id;
  const canReject = !!actingStep?.reject_status_id;
  const isLastStep = isWorkflowFinalApprovalStep(workflowStatus, userRoleId, userRoleName);
  const statusKey = activity?.statusDetails?.key || activity?.status?.key || 'submitted';
  const statusTitle = getWorkflowMovementStatusLabel(activity, {
    statusKey,
    statusTitle: activity?.statusDetails?.title || activity?.status?.title || statusKey,
    workflowStatus,
  }) || 'Submitted';

  const previousCommentEntry = Array.isArray(activity?.history)
    ? activity.history.find((entry: any) => {
        const comment = entry?.comments?.trim();
        return comment && !isAutoWorkflowHistoryComment(comment, MODULE_NAME, activity.id);
      })
    : null;
  const previousCommentText =
    (workflowStatus?.previousComment &&
    !isAutoWorkflowHistoryComment(workflowStatus.previousComment, MODULE_NAME, activity.id)
      ? workflowStatus.previousComment
      : null) ||
    pickMeaningfulHistoryComment(activity?.history, MODULE_NAME, activity.id) ||
    '';

  const parseWorkflowDocuments = (docs?: string | string[] | null): string[] => {
    if (!docs) return [];
    if (Array.isArray(docs)) return docs;
    try {
      return JSON.parse(docs);
    } catch {
      return [];
    }
  };

  return (
    <div className="relative pb-28 space-y-4">
      <PreviousCommentCard
        visible={showWorkflowActions}
        commentText={previousCommentText}
        commentByName={
          previousCommentEntry?.createdByUser
            ? `${previousCommentEntry.createdByUser.first_name || ''} ${previousCommentEntry.createdByUser.last_name || ''}`.trim()
            : ''
        }
        commentByRole={
          previousCommentEntry?.createdByUser?.role?.description ||
          previousCommentEntry?.createdByUser?.role?.name ||
          ''
        }
        commentAtText={
          previousCommentEntry?.created_at
            ? moment(previousCommentEntry.created_at).format('DD MMM, YYYY hh:mm a')
            : ''
        }
        documents={Array.isArray(activity?.previousCommentDocuments) ? activity.previousCommentDocuments : []}
        onViewDocument={() => undefined}
        onDownloadDocument={() => undefined}
      />

      <Card padding="md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Sector of Operation</h2>
            <p className="text-sm text-gray-500 mt-1">
              {activity?.societyRegistration?.cooperative_society_name || activity?.society?.cooperative_society_name || activity?.society_name || '-'}
            </p>
            <p className="text-xs text-gray-400">
              {activity?.societyRegistration?.registration_number || activity?.society?.registration_number || ''}
            </p>
          </div>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(statusKey, mode)}`}>
            {statusTitle}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div>
            <p className="text-xs uppercase text-gray-500">Sector of Operation</p>
            <p className="text-sm font-medium">{activity?.sectorOfOperation?.name || '-'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Submitted On</p>
            <p className="text-sm font-medium">
              {activity?.created_at ? moment(activity.created_at).format('DD MMM, YYYY hh:mm a') : '-'}
            </p>
          </div>
        </div>
      </Card>

      {activity?.additional_data && (
        <AdditionalDetails
          additionalData={activity.additional_data}
          title="Sector of Operation Details"
          useConversionLabels
        />
      )}

      <ProcessingHistoryPanel
        resourcePath="business-activities"
        resourceId={activity?.id ?? id}
        embeddedHistory={activity?.history}
      />

      <WorkflowReassignBlock
        moduleName={MODULE_NAME}
        resourceId={activity?.id ?? id ?? ''}
        entity={activity}
        workflowStatus={workflowStatus}
        currentUserId={currentUser?.id}
        onRefresh={loadActivity}
        showWorkflowActions={showWorkflowActions}
        onReject={canReject ? openRejectModal : undefined}
        onApprove={canApprove ? openApproveModal : undefined}
        showApproveButton={canApprove && !workflowStatus?.pendingReassign}
        showRejectButton={canReject}
        userRole={userRoleName}
        isLastStep={isLastStep}
        showHistory
      />

      <ConfirmOrRejectModal
        key={`${modalOpen}-${isRejectModal}`}
        loading={submitting || loading}
        isOpen={modalOpen}
        workflowStatus={workflowStatus}
        isRejectModal={isRejectModal}
        title={
          isRejectModal ? 'Return Sector of Operation' : isLastStep ? 'Approve Sector of Operation' : 'Forward Sector of Operation'
        }
        description={
          isRejectModal
            ? 'Please provide a reason for returning this sector of operation.'
            : isLastStep
              ? 'Are you sure you want to approve this sector of operation?'
              : 'Are you sure you want to forward this sector of operation?'
        }
        assignmentUsers={assignmentUsers}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        isAssignmentRequired={isAssignmentRequired}
        allowAssignmentOnReject
        approvalDocuments={parseWorkflowDocuments(actingStep?.approval_documents)}
        rejectDocuments={parseWorkflowDocuments(actingStep?.reject_documents)}
        onSubmit={(message, documents, meta) =>
          callWorkflowAction(isRejectModal ? 'back' : 'approve', message, documents, meta?.bypass)
        }
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
