import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { RootState } from "../../store";
import { getRenewalsBySocietyId } from "../../lib/data/renewals/api";
import { updateWorkflow } from "../../lib/data/workflows/api";
import { ConfirmOrRejectModal } from "../../components/confirm&rejectModal/ConfirmModal";
import { WorkflowReassignBlock } from "../../components/workflow/WorkflowReassignBlock";
import { ProcessingHistoryPanel } from "../../components/workflow/ProcessingHistoryPanel";
import { RenewalDetails } from "../../components/details/RenewalDetails";
import {
  canShowWorkflowActions,
  loadForwardAssignmentUsers,
  loadRejectAssignmentUsers,
} from "../../lib/workflow/assigneeUsers";
import { PreviousCommentCard } from "../../components/workflow/PreviousCommentCard";
import { openDocument } from "../../utils/download";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Download, Eye, FileText } from "lucide-react";

/* =========================================================
   DOCUMENT PARSER (SAME AS REGISTRATION)
=========================================================*/
const parseWorkflowDocuments = (docs?: string | string[] | null): string[] => {
  if (!docs) return [];
  if (Array.isArray(docs)) return docs;

  if (typeof docs === "string") {
    try {
      return JSON.parse(docs);
    } catch {
      return [];
    }
  }
  return [];
};

export const RenewalDetail: React.FC = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { societyId } = useParams<{ societyId: string }>();

  const MODULE_NAME = "SOCIETY_RENEWAL";

  const [loading, setLoading] = useState(false);
  const [renewal, setRenewal] = useState<any>(null);
  const [workflowStatus, setWorkflowStatus] = useState<any>(null);

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
     FETCH RENEWAL
  ==========================*/
  const fetchData = useCallback(async () => {
    if (!societyId) return;

    try {
      const res = await getRenewalsBySocietyId(societyId);
      const renewals = Array.isArray(res) ? res : (res as any)?.data || [];

      if (!renewals.length) {
        toast.error("No renewal found for this society");
        return;
      }

      const latestRenewal = renewals[0];

      setRenewal(latestRenewal);
      setWorkflowStatus(latestRenewal?.workflowStatus || null);
    } catch {
      toast.error("Failed to load renewal");
    }
  }, [societyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* =========================
     WORKFLOW ACTION (DOCUMENTS ADDED)
  ==========================*/
  const callWorkflowAction = async (
    action: "approve" | "back",
    comments?: string,
    documentData?: Record<string, string | string[]>,
  bypass?: boolean,
  ) => {
    try {
      setLoading(true);

      const resourceId = renewal?.id;
      if (!resourceId) {
        toast.error("Invalid renewal ID");
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
        toast.success("Renewal updated successfully");
        if (action === "approve") {
          setModalOpen(false);
          setSelectedUserId(null);
          setAssignmentUsers([]);
          setIsAssignmentRequired(false);
        }
      } else {
        toast.error(res?.message || "Workflow update failed");
      }

      await fetchData();
      if (action !== "approve") {
        setModalOpen(false);
        setSelectedUserId(null);
      }
    } catch {
      toast.error("Workflow update failed");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     APPROVE MODAL
  ==========================*/
  const assigneeOpts = {
    workflowStatus,
    currentUserId: user?.id,
    userIsHq: (user as any)?.is_hq,
  };

  const openApproveModal = async () => {
    setIsRejectModal(false);
    const { users, isRequired } = await loadForwardAssignmentUsers(assigneeOpts);
    setIsAssignmentRequired(isRequired);
    setAssignmentUsers(users);
    setModalOpen(true);
  };

  /** =========================
   * REJECT MODAL
   ==========================*/
  const openRejectModal = async () => {
    setIsRejectModal(true);
    const { users, isRequired } = await loadRejectAssignmentUsers(assigneeOpts);
    setIsAssignmentRequired(isRequired);
    setAssignmentUsers(users);
    setModalOpen(true);
  };

  /* =========================
     BUTTON VISIBILITY
  ==========================*/
  const userRoleId = (user as any)?.role_id || user?.role?.id;
  const userRoleName =
    typeof (user as any)?.role === "string"
      ? (user as any).role
      : (user as any)?.role?.name;

  const canShowActions = canShowWorkflowActions(
    renewal,
    workflowStatus,
    user?.id,
    userRoleId,
    userRoleName,
  );

  const RENEWAL_FINAL_SEQUENCE = 4;

  /** DRCS final step: current is seq 4 and there is no next workflow row. */
  const isRenewalFinalDrcsStep = Boolean(
    workflowStatus?.current?.sequence === RENEWAL_FINAL_SEQUENCE &&
    !workflowStatus?.next,
  );

  const isLastStep =
    isRenewalFinalDrcsStep ||
    workflowStatus?.next?.approvalStatus?.key === "renewal_certificate_issued";

  const canApprove = Boolean(
    workflowStatus?.next?.approval_status_id ||
    (isRenewalFinalDrcsStep && workflowStatus?.current?.approval_status_id),
  );

  const canReject = Boolean(
    workflowStatus?.next?.reject_status_id ||
    (isRenewalFinalDrcsStep && workflowStatus?.current?.reject_status_id),
  );
  const previousCommentText = workflowStatus?.previousComment || "";
  const previousCommentDocuments = Array.isArray(renewal?.previousCommentDocuments)
    ? renewal.previousCommentDocuments
    : [];
  const openInBlankTab = async (url: string) => {
    await openDocument(url, token || "");
  };

  const notificationMedia =
    renewal?.notificationMedia ||
    renewal?.notification_media ||
    renewal?.society?.notificationMedia ||
    renewal?.society?.notification_media ||
    null;

  /* =========================
      WORKFLOW DOCUMENTS (KEY FIX)
  ==========================*/
  const approvalDocuments = parseWorkflowDocuments(
    workflowStatus?.next?.approval_documents ??
    (isRenewalFinalDrcsStep
      ? workflowStatus?.current?.approval_documents
      : null),
  );

  /* =========================
     UI 
  ==========================*/
  return (
    <div className="relative pb-28 space-y-4 pt-[5px]">
      <PreviousCommentCard
        visible={canShowActions}
        commentText={previousCommentText}
        documents={previousCommentDocuments}
        onViewDocument={openInBlankTab}
        onDownloadDocument={openInBlankTab}
      />

      <RenewalDetails renewal={renewal} onViewDocument={openInBlankTab} />

      <Card className="p-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-green-600" />
            Notification
          </h3>
          {notificationMedia?.updated_at ? (
            <p className="text-sm text-gray-500">
              Issued on: {new Date(notificationMedia.updated_at).toLocaleString()}
            </p>
          ) : null}
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!notificationMedia?.url}
            onClick={() => notificationMedia?.url && openInBlankTab(notificationMedia.url)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!notificationMedia?.url}
            onClick={() => notificationMedia?.url && openInBlankTab(notificationMedia.url)}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      <ProcessingHistoryPanel
        resourcePath="society-renewals"
        resourceId={renewal?.id}
        embeddedHistory={renewal?.history}
      />

      <WorkflowReassignBlock
        moduleName={MODULE_NAME}
        resourceId={renewal?.id ?? ""}
        entity={renewal}
        workflowStatus={workflowStatus}
        currentUserId={user?.id}
        onRefresh={fetchData}
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
        key={`${modalOpen}-${approvalDocuments.join(",")}`}
        loading={loading}
        isOpen={modalOpen}
        workflowStatus={workflowStatus}
        isRejectModal={isRejectModal}
        title={
          isRejectModal
            ? 'Reject Renewal'
            : renewal?.workflowStatus?.next?.approvalStatus?.key === "renewal_certificate_issued"
              ? 'Approve Renewal'
              : 'Forward Renewal'
        }
        description={
          isRejectModal
            ? 'Please provide a reason for returning this renewal.'
            : renewal?.workflowStatus?.next?.approvalStatus?.key === "renewal_certificate_issued"
              ? 'Are you sure you want to approve this renewal?'
              : 'Are you sure you want to forward this renewal?'
        }
        assignmentUsers={assignmentUsers}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        isAssignmentRequired={isAssignmentRequired}
        approvalDocuments={approvalDocuments}
        onSubmit={(msg, doc, meta) =>
          callWorkflowAction(isRejectModal ? "back" : "approve", msg, doc, meta?.bypass)
        }
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
};
