import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { AlertCircle } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { getBodMeetingById } from "../../lib/data/bodMeetings/api";
import { updateWorkflow } from "../../lib/data/workflows/api";
import { ConfirmOrRejectModal } from "../../components/confirm&rejectModal/ConfirmModal";
import { WorkflowReassignBlock } from "../../components/workflow/WorkflowReassignBlock";
import { ProcessingHistoryPanel } from "../../components/workflow/ProcessingHistoryPanel";
import { Button } from "../../components/ui/Button";
import {
  canShowWorkflowActions,
  loadForwardAssignmentUsers,
} from "../../lib/workflow/assigneeUsers";
import toast from "react-hot-toast";
import { AnnualGeneralMeetingDetails } from "../../components/details/AnnualGeneralMeetingDetails";
import { PreviousCommentCard } from "../../components/workflow/PreviousCommentCard";
import moment from "moment";
import { openDocument } from "../../utils/download";

export const BodMeetingDetail: React.FC = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { id } = useParams();
  const navigate = useNavigate();
  const MODULE_NAME = "BOD";

  const [meeting, setMeeting] = useState<any>(null);
  const [workflowStatus, setWorkflowStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [assignmentUsers, setAssignmentUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isAssignmentRequired, setIsAssignmentRequired] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isRejectModal, setIsRejectModal] = useState(false);

  const loadMeeting = async () => {
    if (!id) {
      toast.error("Meeting ID not found");
      navigate("/board-of-directors/meetings");
      return;
    }

    try {
      setLoading(true);
      const res = await getBodMeetingById(id);
      if (res?.data) {
        setMeeting(res.data);
        setWorkflowStatus(res.data.workflowStatus || null);
      } else {
        toast.error("Meeting not found");
        navigate("/board-of-directors/meetings");
      }
    } catch {
      toast.error("Failed to load meeting details");
      navigate("/board-of-directors/meetings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeeting();
  }, [id]);

  const parseWorkflowDocuments = (docs?: string | string[] | null): string[] => {
    if (!docs) return [];
    if (Array.isArray(docs)) return docs;
    try {
      return JSON.parse(docs);
    } catch {
      return [];
    }
  };

  const callWorkflowAction = async (
    action: "approve" | "back",
    comments?: string,
    documentData?: Record<string, string | string[]>,
  bypass?: boolean,
  ) => {
    try {
      setLoadingAction(true);
      if (!meeting?.id) {
        toast.error("Invalid BOD meeting ID");
        return;
      }

      const payload: any = {
        resourceId: meeting.id,
        moduleName: MODULE_NAME,
        action,
        comments,
        documents: documentData || {},
        bypass: Boolean(bypass),
      };
      if (selectedUserId) payload.assigned_to = selectedUserId;

      await updateWorkflow(payload);
      toast.success("Workflow updated successfully");
      setModalOpen(false);
      setSelectedUserId(null);
      setAssignmentUsers([]);
      setIsAssignmentRequired(false);
      await loadMeeting();
    } catch {
      toast.error("Workflow update failed");
    } finally {
      setLoadingAction(false);
    }
  };

  const openApproveModal = async () => {
    setIsRejectModal(false);
    const next = workflowStatus?.next;
    if (!next) return;

    const isFinalStep = Boolean(
      next?.sequence === workflowStatus?.current?.total_workflowLevel ||
      next?.sequence === next?.total_workflowLevel ||
      next?.sequence === workflowStatus?.previous?.total_workflowLevel ||
      next?.approvalStatus?.key === "approved" ||
      next?.approvalStatus?.key === "certificate_issued",
    );

    // Final step should not require "assign to next user" even if workflow config says single.
    if (isFinalStep) {
      setIsAssignmentRequired(false);
      setAssignmentUsers([]);
      setSelectedUserId(null);
    } else if (next.approval_send_to === "single") {
      setIsAssignmentRequired(true);
      const { users } = await loadForwardAssignmentUsers({
        workflowStatus,
        currentUserId: user?.id,
        userIsHq: (user as any)?.is_hq,
      });
      setAssignmentUsers(users);
    } else {
      setIsAssignmentRequired(false);
    }
    setModalOpen(true);
  };

  const openRejectModal = () => {
    setIsRejectModal(true);
    setIsAssignmentRequired(false);
    setAssignmentUsers([]);
    setModalOpen(true);
  };

  const userRoleId = (user as any)?.role_id || (user as any)?.role?.id;
  const userRoleName =
    typeof (user as any)?.role === "string"
      ? (user as any).role
      : (user as any)?.role?.name;
  const canShowActions = canShowWorkflowActions(
    meeting,
    workflowStatus,
    user?.id,
    userRoleId,
    userRoleName,
  );

  const isLastStep = Boolean(
    workflowStatus?.next?.sequence === workflowStatus?.current?.total_workflowLevel ||
    workflowStatus?.next?.sequence === workflowStatus?.next?.total_workflowLevel ||
    workflowStatus?.next?.sequence === workflowStatus?.previous?.total_workflowLevel ||
    workflowStatus?.next?.approvalStatus?.key === "approved" ||
    workflowStatus?.next?.approvalStatus?.key === "certificate_issued",
  );
  const canApprove = !!workflowStatus?.next?.approval_status_id;
  const canReject = !!workflowStatus?.next?.reject_status_id;
  const previousCommentEntry = Array.isArray(meeting?.history)
    ? meeting.history.find((entry: any) => Boolean(entry?.comments?.trim()))
    : null;
  const previousCommentText =
    workflowStatus?.previousComment ||
    previousCommentEntry?.comments?.trim() ||
    "";
  const previousCommentUser = previousCommentEntry?.createdByUser;
  const previousCommentUserName = previousCommentUser
    ? `${previousCommentUser.first_name || ""} ${previousCommentUser.last_name || ""}`.trim() ||
    previousCommentUser.email ||
    ""
    : "";
  const previousCommentUserRole =
    previousCommentUser?.role?.description ||
    previousCommentUser?.role?.name ||
    "";
  const previousCommentDocuments = Array.isArray(meeting?.previousCommentDocuments)
    ? meeting.previousCommentDocuments
    : [];
  const openInBlankTab = async (url: string) => {
    await openDocument(url, token || "");
  };
  const approvalDocuments = parseWorkflowDocuments(workflowStatus?.next?.approval_documents);
  const rejectDocuments = parseWorkflowDocuments(workflowStatus?.next?.reject_documents);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Meeting Not Found</h2>
        <Button onClick={() => navigate("/board-of-directors/meetings")}>
          Back to Meetings
        </Button>
      </div>
    );
  }

  return (
    <div className="relative pb-28 space-y-6">
      <div className="pt-2">
        <PreviousCommentCard
          visible
          commentText={previousCommentText}
          commentByName={previousCommentUserName}
          commentByRole={previousCommentUserRole}
          commentAtText={
            previousCommentEntry?.created_at
              ? moment(previousCommentEntry.created_at).format("DD MMM, YYYY hh:mm a")
              : ""
          }
          documents={previousCommentDocuments}
          onViewDocument={openInBlankTab}
          onDownloadDocument={openInBlankTab}
        />
      </div>

      <AnnualGeneralMeetingDetails
        meeting={meeting}
        electedMembersTitle="Elected BOD Members"
      />

      <ProcessingHistoryPanel
        resourcePath="board-of-directors-meeting"
        resourceId={meeting?.id ?? id}
        embeddedHistory={meeting?.history}
      />

      <WorkflowReassignBlock
        moduleName={MODULE_NAME}
        resourceId={meeting?.id ?? id ?? ""}
        entity={meeting}
        workflowStatus={workflowStatus}
        currentUserId={user?.id}
        onRefresh={loadMeeting}
        showWorkflowActions={canShowActions}
        onApprove={canApprove ? openApproveModal : undefined}
        onReject={canReject ? openRejectModal : undefined}
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
        title={
          isRejectModal
            ? 'Return BOD Meeting'
            : meeting?.workflowStatus?.next?.approvalStatus?.key === "approved"
              ? 'Approve BOD Meeting'
              : 'Forward BOD Meeting'
        }
        description={
          isRejectModal
            ? 'Please provide a reason for returning this BOD meeting.'
            : meeting?.workflowStatus?.next?.approvalStatus?.key === "approved"
              ? 'Are you sure you want to approve this BOD meeting?'
              : 'Are you sure you want to forward this BOD meeting?'
        }
        assignmentUsers={assignmentUsers}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        isAssignmentRequired={isAssignmentRequired}
        allowAssignmentOnReject
        approvalDocuments={approvalDocuments}
        rejectDocuments={rejectDocuments}
        onSubmit={(msg, docs, meta) =>
          callWorkflowAction(isRejectModal ? "back" : "approve", msg, docs, meta?.bypass)
        }
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
};
