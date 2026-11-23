import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { AlertCircle, Edit } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { getAnnualGeneralMeetingById } from "../../lib/data/annualGeneralMeetings/api";
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
import moment from "moment";
import { AnnualGeneralMeetingDetails } from "../../components/details/AnnualGeneralMeetingDetails";
import { PreviousCommentCard } from "../../components/workflow/PreviousCommentCard";
import { openDocument } from "../../utils/download";

const isWorkflowCleared = (workflowStatus?: any) =>
  workflowStatus == null ||
  (!workflowStatus?.current && !workflowStatus?.next);

const canShowCorrectAndResubmitBanner = (
  statusKey?: string | null,
  workflowStatus?: any,
) =>
  statusKey === "rejected" &&
  (isWorkflowCleared(workflowStatus)
  );

export const AnnualGeneralMeetingDetail: React.FC = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { id } = useParams();
  const navigate = useNavigate();

  const MODULE_NAME = "AGM";

  const [meeting, setMeeting] = useState<any>(null);
  const [workflowStatus, setWorkflowStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  /* =========================
     ASSIGNMENT STATE
  ==========================*/
  const [assignmentUsers, setAssignmentUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isAssignmentRequired, setIsAssignmentRequired] = useState(false);

  /* =========================
     MODAL STATE
  ==========================*/
  const [modalOpen, setModalOpen] = useState(false);
  const [isRejectModal, setIsRejectModal] = useState(false);

  /* =========================
     FETCH AGM
  ==========================*/
  const loadMeeting = async () => {
    if (!id) {
      toast.error("Meeting ID not found");
      navigate("/annual-general-meeting");
      return;
    }

    try {
      setLoading(true);
      const res = await getAnnualGeneralMeetingById(id);

      if (res?.data) {
        const meetingData: any = res.data;
        setMeeting(meetingData);
        setWorkflowStatus(meetingData?.workflowStatus || null);
      } else {
        toast.error("Meeting not found");
        navigate("/annual-general-meeting");
      }
    } catch {
      toast.error("Failed to load meeting details");
      navigate("/annual-general-meeting");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeeting();
  }, [id]);

  /* =========================
     DOCUMENT PARSER
  ==========================*/
  const parseWorkflowDocuments = (
    docs?: string | string[] | null,
  ): string[] => {
    if (!docs) return [];
    if (Array.isArray(docs)) return docs;

    try {
      return JSON.parse(docs);
    } catch {
      return [];
    }
  };

  /* =========================
     WORKFLOW ACTION
  ==========================*/
  const callWorkflowAction = async (
    action: "approve" | "back",
    comments?: string,
    documentData?: Record<string, string | string[]>,
  bypass?: boolean,
  ) => {
    try {
      setLoadingAction(true);

      if (!meeting?.id) {
        toast.error("Invalid AGM ID");
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

      if (selectedUserId) {
        payload.assigned_to = selectedUserId;
      }

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

  /* =========================
     MODAL HANDLERS
  ==========================*/
  const openApproveModal = async () => {
    setIsRejectModal(false);
    const { users, isRequired } = await loadForwardAssignmentUsers({
      workflowStatus,
      currentUserId: user?.id,
      userIsHq: (user as any)?.is_hq,
    });
    setIsAssignmentRequired(isRequired);
    setAssignmentUsers(users);
    setModalOpen(true);
  };

  const openRejectModal = () => {
    setIsRejectModal(true);
    setIsAssignmentRequired(false);
    setAssignmentUsers([]);
    setModalOpen(true);
  };

  /* =========================
     VISIBILITY LOGIC
  ==========================*/
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

  const approvalDocuments = parseWorkflowDocuments(
    workflowStatus?.next?.approval_documents,
  );
  const rejectDocuments = parseWorkflowDocuments(
    workflowStatus?.next?.reject_documents,
  );

  const agmStatusKey =
    meeting?.statusDetails?.key || meeting?.status?.key || null;
  const isApplicantUser = userRoleName === "applicant";
  const canCorrectAndResubmit =
    Boolean(meeting) &&
    isApplicantUser &&
    canShowCorrectAndResubmitBanner(agmStatusKey, workflowStatus);

  /* =========================
     LOADING / EMPTY
  ==========================*/
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
        <Button onClick={() => navigate("/annual-general-meeting")}>
          Back to Meetings
        </Button>
      </div>
    );
  }

  /* =========================
     UI
  ==========================*/
  return (
    <div className="relative pb-28 space-y-6">
      {canCorrectAndResubmit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                AGM returned for rectification
              </p>
              <p className="text-sm text-red-700 mt-1">
                District Officers or RCS Headquarters have returned this AGM for
                correction. Review the remarks below, update the Minutes of
                Meeting and other details, then re-submit.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 bg-white"
            onClick={() => navigate(`/annual-general-meeting/${id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Correct & Re-submit
          </Button>
        </div>
      )}

      <div className="pt-2">
        <PreviousCommentCard
          visible={canShowActions || canCorrectAndResubmit}
          commentText={previousCommentText}
          commentByName={previousCommentUserName}
          commentByRole={previousCommentUserRole}
          commentAtText={
            previousCommentEntry?.created_at
              ? moment(previousCommentEntry.created_at).format(
                "DD MMM, YYYY hh:mm a",
              )
              : ""
          }
          documents={previousCommentDocuments}
          onViewDocument={openInBlankTab}
          onDownloadDocument={openInBlankTab}
        />
      </div>

      {/* PURE UI COMPONENT */}
      <AnnualGeneralMeetingDetails meeting={meeting} />

      <ProcessingHistoryPanel
        resourcePath="annual-general-meeting"
        resourceId={meeting?.id ?? id}
        embeddedHistory={meeting?.history}
      />

      {/* WORKFLOW ACTIONS */}
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
            ? 'Return AGM'
            : meeting?.workflowStatus?.next?.approvalStatus?.key === "approved"
              ? 'Approve AGM'
              : 'Forward AGM'
        }
        description={
          isRejectModal
            ? 'Please provide a reason for returning this AGM.'
            : meeting?.workflowStatus?.next?.approvalStatus?.key === "approved"
              ? 'Are you sure you want to approve this AGM?'
              : 'Are you sure you want to forward this AGM?'
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
