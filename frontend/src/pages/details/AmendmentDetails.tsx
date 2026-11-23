import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useParams } from 'react-router-dom';
import moment from 'moment';
import toast from 'react-hot-toast';
import { getAmendmentById } from '../../lib/data/amendments/api';
import { updateWorkflow } from '../../lib/data/workflows/api';
import {
  canShowWorkflowActions,
  getActingWorkflowStep,
  isWorkflowFinalApprovalStep,
  loadForwardAssignmentUsers,
  loadRejectAssignmentUsers,
} from '../../lib/workflow/assigneeUsers';
import { AmendmentDetailComponent } from '../../components/details/AmendmentDetail';
import { ConfirmOrRejectModal } from '../../components/confirm&rejectModal/ConfirmModal';
import { WorkflowReassignBlock } from '../../components/workflow/WorkflowReassignBlock';
import { ProcessingHistoryPanel } from '../../components/workflow/ProcessingHistoryPanel';
import { PreviousCommentCard } from '../../components/workflow/PreviousCommentCard';
import { download, openDocument } from '../../utils/download';
import {
  isAutoWorkflowHistoryComment,
  pickMeaningfulHistoryComment,
} from '../../utils/workflowComment';

const MODULE_NAME = 'AMENDMENT';

export const AmendmentDetails: React.FC = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { id } = useParams();

  const [amendment, setAmendment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [isRejectModal, setIsRejectModal] = useState(false);

  const [assignmentUsers, setAssignmentUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isAssignmentRequired, setIsAssignmentRequired] = useState(false);

  const handleDownloadPdf = (url: string, _filename: string) => {
    download(url, token || '');
  };

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

  const loadAmendment = async () => {
    try {
      setLoading(true);
      const response: any = await getAmendmentById(id || '');
      setAmendment(response || null);
    } catch (error) {
      console.error('Error loading amendment:', error);
      toast.error('Failed to load amendment details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadAmendment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const callWorkflowAction = async (
    action: 'approve' | 'back',
    comments?: string,
    documentData?: Record<string, string | string[]>,
  bypass?: boolean,
  ) => {
    try {
      setSubmitting(true);

      const resourceId = amendment?.id;
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

      if (
        !bypass &&
        action === 'approve' &&
        amendment?.workflowStatus?.next?.approval_send_to === 'single' &&
        !selectedUserId
      ) {
        toast.error('Please select the user to assign before approving.');
        return;
      }

      if (selectedUserId) {
        payload.assigned_to = selectedUserId;
      }

      const res: any = await updateWorkflow(payload);

      if (res?.success !== false) {
        toast.success(
          res?.message ||
            (action === 'approve'
              ? 'Amendment forwarded successfully'
              : 'Amendment sent back successfully'),
        );
        setModalOpen(false);
        setIsRejectModal(false);
        setSelectedUserId(null);
        setAssignmentUsers([]);
        setIsAssignmentRequired(false);
        loadAmendment();
      } else {
        toast.error(res?.message || 'Workflow update failed');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Workflow update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const amendmentAssigneeOpts = {
    workflowStatus: amendment?.workflowStatus,
    currentUserId: (user as any)?.id,
    userIsHq: (user as any)?.is_hq,
  };

  const openApproveModal = async () => {
    setIsRejectModal(false);
    const { users, isRequired } = await loadForwardAssignmentUsers(amendmentAssigneeOpts);
    setIsAssignmentRequired(isRequired);
    setAssignmentUsers(users);
    setModalOpen(true);
  };

  const openRejectModal = async () => {
    setIsRejectModal(true);
    const { users, isRequired } = await loadRejectAssignmentUsers(amendmentAssigneeOpts);
    setIsAssignmentRequired(isRequired);
    setAssignmentUsers(users);
    setModalOpen(true);
  };

  const openInBlankTab = async (url: string) => {
    await openDocument(url, token || '');
  };

  const currentUser: any = user;
  const workflowStatus = amendment?.workflowStatus;
  const userRoleId = currentUser?.role_id || currentUser?.role?.id;
  const userRoleName =
    typeof currentUser?.role === 'string'
      ? currentUser.role
      : currentUser?.role?.name;
  const showWorkflowActions = canShowWorkflowActions(
    amendment,
    workflowStatus,
    currentUser?.id,
    userRoleId,
    userRoleName,
  );

  const actingStep = getActingWorkflowStep(
    workflowStatus,
    userRoleId,
    userRoleName,
  );
  const canApprove = !!actingStep?.approval_status_id;
  const canReject = !!actingStep?.reject_status_id;
  const isLastStep = isWorkflowFinalApprovalStep(
    workflowStatus,
    userRoleId,
    userRoleName,
  );

  const amendmentModule = MODULE_NAME;
  const amendmentId = amendment?.id ?? id ?? '';
  const previousCommentEntry = Array.isArray(amendment?.history)
    ? amendment.history.find((entry: any) => {
        const c = entry?.comments?.trim();
        return c && !isAutoWorkflowHistoryComment(c, amendmentModule, amendmentId);
      })
    : null;
  const previousCommentText =
    (workflowStatus?.previousComment &&
    !isAutoWorkflowHistoryComment(
      workflowStatus.previousComment,
      amendmentModule,
      amendmentId
    )
      ? workflowStatus.previousComment
      : null) ||
    pickMeaningfulHistoryComment(amendment?.history, amendmentModule, amendmentId) ||
    '';
  const previousCommentUser = previousCommentEntry?.createdByUser;
  const previousCommentUserName = previousCommentUser
    ? `${previousCommentUser.first_name || ''} ${previousCommentUser.last_name || ''}`.trim() ||
      previousCommentUser.email ||
      ''
    : '';
  const previousCommentUserRole =
    previousCommentUser?.role?.description || previousCommentUser?.role?.name || '';
  const previousCommentDocuments = Array.isArray(amendment?.previousCommentDocuments)
    ? amendment.previousCommentDocuments
    : [];

  return (
    <div className="relative pb-28">
      <PreviousCommentCard
        visible={showWorkflowActions}
        commentText={previousCommentText}
        commentByName={previousCommentUserName}
        commentByRole={previousCommentUserRole}
        commentAtText={
          previousCommentEntry?.created_at
            ? moment(previousCommentEntry.created_at).format('DD MMM, YYYY hh:mm a')
            : ''
        }
        documents={previousCommentDocuments}
        onViewDocument={openInBlankTab}
        onDownloadDocument={openInBlankTab}
      />

      <AmendmentDetailComponent
        amendment={amendment}
        handleDownloadPdf={handleDownloadPdf}
        onReSubmit={loadAmendment}
      />

      <ProcessingHistoryPanel
        resourcePath="amendments"
        resourceId={amendment?.id ?? id}
        embeddedHistory={amendment?.history}
      />

      <WorkflowReassignBlock
        moduleName={MODULE_NAME}
        resourceId={amendment?.id ?? id ?? ''}
        entity={amendment}
        workflowStatus={amendment?.workflowStatus}
        currentUserId={currentUser?.id}
        onRefresh={loadAmendment}
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
          isRejectModal
            ? 'Return Amendment'
            : isLastStep
              ? 'Approve Amendment'
              : 'Forward Amendment'
        }
        description={
          isRejectModal
            ? 'Please provide a reason for returning this amendment.'
            : isLastStep
              ? 'Are you sure you want to approve this amendment?'
              : 'Are you sure you want to forward this amendment?'
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
