import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { RootState } from "../../store";
import { ConversionDetails } from "../../components/details/ConversionDetails";
import { ConfirmOrRejectModal } from "../../components/confirm&rejectModal/ConfirmModal";
import { WorkflowReassignBlock } from "../../components/workflow/WorkflowReassignBlock";
import { ProcessingHistoryPanel } from "../../components/workflow/ProcessingHistoryPanel";
import { PreviousCommentCard } from "../../components/workflow/PreviousCommentCard";
import { openDocument } from "../../utils/download";

import { getConversionById } from "../../lib/data/conversionSociety/api";
import { issueCertificate } from "../../lib/data/registrations/api";
import { updateWorkflow } from "../../lib/data/workflows/api";
import {
  canShowWorkflowActions,
  loadForwardAssignmentUsers,
} from "../../lib/workflow/assigneeUsers";

/* =========================================================
   UTILS
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

export const ConversionApprovalDetails: React.FC = () => {
  const { id, societyId } = useParams<{ id?: string; societyId?: string }>();
  const conversionId = id || societyId;
  const { user, token } = useSelector((state: RootState) => state.auth);

  const MODULE_NAME = "SOCIETY_CONVERSION";

  const [conversion, setConversion] = useState<any>(null);
  const [workflowStatus, setWorkflowStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
     FETCH CONVERSION
  ==========================*/
  const fetchConversion = useCallback(async () => {
    if (!conversionId) return;

    try {
      const res: any = await getConversionById(conversionId);
      setConversion(res?.data);
      setWorkflowStatus(res?.data?.workflowStatus);
    } catch {
      toast.error("Failed to load conversion details");
    }
  }, [conversionId]);

  useEffect(() => {
    fetchConversion();
  }, [fetchConversion]);

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
      setLoading(true);

      if (!conversion?.id) {
        toast.error("Invalid conversion ID");
        return;
      }

      const payload: any = {
        resourceId: conversion.id,
        moduleName: MODULE_NAME,
        action,
        comments,
        documents: documentData,
        bypass: Boolean(bypass),
      };

      if (selectedUserId) {
        payload.assigned_to = selectedUserId;
      }
      const res: any = await updateWorkflow(payload);

      if (res?.success !== false) {
        toast.success("Conversion updated successfully");

        const nextStatusFromResponse =
          res?.data?.nextStatus ||
          res?.data?.next_status ||
          res?.data?.next?.approvalStatus?.key ||
          res?.data?.workflowStatus?.next?.approvalStatus?.key;
        const nextStatusFromCurrentWorkflow =
          workflowStatus?.next?.approvalStatus?.key;
        const shouldIssueCertificate =
          action === "approve" &&
          (nextStatusFromResponse === "certificate_issued" ||
            nextStatusFromCurrentWorkflow === "certificate_issued");

        if (shouldIssueCertificate) {
          try {
            const certificateSocietyId = conversion?.society?.id || societyId;

            if (!certificateSocietyId) {
              throw new Error("Invalid society ID");
            }

            await issueCertificate(certificateSocietyId, true);
            toast.success("Certificate uploaded successfully");
          } catch (e: any) {
            toast.error(e?.message || "Certificate upload failed");
          }
        }

        if (action === "approve") {
          setModalOpen(false);
          setSelectedUserId(null);
          setAssignmentUsers([]);
          setIsAssignmentRequired(false);
        }
      } else {
        toast.error(res?.message || "Workflow update failed");
      }

      await fetchConversion();

      if (action !== "approve") {
        setModalOpen(false);
        setSelectedUserId(null);
      }
    } catch (error) {
      toast.error("Workflow update failed");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     APPROVE MODAL
  ==========================*/
  const openApproveModal = async () => {
    setIsRejectModal(false);
    const { users, isRequired } = await loadForwardAssignmentUsers({
      workflowStatus,
      currentUserId: user?.id,
      userIsHq: user?.is_hq,
    });
    setIsAssignmentRequired(isRequired);
    setAssignmentUsers(users);
    setModalOpen(true);
  };

  /* =========================
     REJECT MODAL
  ==========================*/
  const openRejectModal = () => {
    setIsRejectModal(true);
    setIsAssignmentRequired(false);
    setModalOpen(true);
  };

  /* =========================
     BUTTON VISIBILITY
  ==========================*/
  const userRoleId = user?.role_id || user?.role?.id;
  const userRoleName =
    typeof user?.role === "string" ? user.role : user?.role?.name;

  const canShowActions = canShowWorkflowActions(
    conversion,
    workflowStatus,
    user?.id,
    userRoleId,
    userRoleName,
  );

  const canApprove = !!workflowStatus?.next?.approval_status_id;
  const canReject = !!workflowStatus?.next?.reject_status_id;
  const isLastStep =
    workflowStatus?.next?.approvalStatus?.key === "certificate_issued";
  const previousCommentText = workflowStatus?.previousComment || "";
  const previousCommentDocuments = Array.isArray(conversion?.previousCommentDocuments)
    ? conversion.previousCommentDocuments
    : [];
  const openInBlankTab = async (url: string) => {
    await openDocument(url, token || "");
  };

  /* =========================
     WORKFLOW DOCUMENTS
  ==========================*/
  const approvalDocuments = parseWorkflowDocuments(
    workflowStatus?.next?.approval_documents,
  );

  const rejectDocuments = parseWorkflowDocuments(
    workflowStatus?.next?.reject_documents,
  );

  /* =========================
     UI
  ==========================*/
  return (
    <div className="relative pb-28 space-y-4 pt-[5px]">
      <PreviousCommentCard
        visible={canShowActions && user?.role !== "applicant"}
        commentText={previousCommentText}
        documents={previousCommentDocuments}
        onViewDocument={openInBlankTab}
        onDownloadDocument={openInBlankTab}
      />

      {/* DETAILS */}
      <ConversionDetails conversion={conversion} />

      <ProcessingHistoryPanel
        resourcePath="society-conversions"
        resourceId={conversion?.id}
        embeddedHistory={conversion?.history}
      />

      {/* ACTION BUTTONS */}
      <WorkflowReassignBlock
        moduleName={MODULE_NAME}
        resourceId={conversion?.id ?? id ?? ""}
        entity={conversion}
        workflowStatus={workflowStatus}
        currentUserId={user?.id}
        onRefresh={fetchConversion}
        showWorkflowActions={canShowActions}
        onApprove={canApprove ? openApproveModal : undefined}
        onReject={canReject ? openRejectModal : undefined}
        showApproveButton={canApprove && !workflowStatus?.pendingReassign}
        showRejectButton={canReject}
        userRole={user?.role}
        isLastStep={isLastStep}
        showHistory
      />

      {/* MODAL */}
      <ConfirmOrRejectModal
        loading={loading}
        isOpen={modalOpen}
        workflowStatus={workflowStatus}
        isRejectModal={isRejectModal}
        title={
          isRejectModal
            ? 'Return Conversion'
            : conversion?.workflowStatus?.next?.approvalStatus?.key === "approved"
              ? 'Approve Conversion'
              : 'Forward Conversion'
        }
        description={
          isRejectModal
            ? 'Please provide a reason for returning this conversion.'
            : conversion?.workflowStatus?.next?.approvalStatus?.key === "approved"
              ? 'Are you sure you want to approve this conversion?'
              : 'Are you sure you want to forward this conversion?'
        }
        assignmentUsers={assignmentUsers}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        isAssignmentRequired={isAssignmentRequired}
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
