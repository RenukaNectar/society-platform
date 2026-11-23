import React, { useEffect, useState, useCallback, useMemo } from "react";
import { AssigneeUnavailableNotice } from "../../components/workflow/AssigneeUnavailableNotice";
import { useAssigneeAvailability } from "../../hooks/useAssigneeAvailability";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { RootState } from "../../store";
import { SocietyDetails } from "../../components/details/SocietyDetails";
import { getSocietyById } from "../../lib/data/societies/api";
import { updateWorkflow } from "../../lib/data/workflows/api";
import { issueCertificate } from "../../lib/data/registrations/api";
import { ConfirmOrRejectModal } from "../../components/confirm&rejectModal/ConfirmModal";
import { WorkflowReassignBlock } from "../../components/workflow/WorkflowReassignBlock";
import {
  canShowWorkflowActions,
  loadForwardAssignmentUsers,
  loadRejectAssignmentUsers,
} from "../../lib/workflow/assigneeUsers";
import {
  resolveEffectiveAssignedToUserId,
} from "../../utils/workflowReassign";
import toast from "react-hot-toast";
import { openDocument } from "../../utils/download";
import { needsApplicantChallanAction } from "../../utils/societyRegistrationChallan";

export const RegistrationDetails: React.FC = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { id } = useParams();

  const MODULE_NAME = "SOCIETY_REGISTRATION";

  const [loading, setLoading] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState<any>(null);
  const [society, setSociety] = useState<any>(null);

  const [registrationDetails, setRegistrationDetails] = useState<any>({
    society: {},
    members: [],
    user,
    loading: false,
  });

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
  const [reassignOpen, setReassignOpen] = useState(false);

  const currentUserId = (user as any)?.id ?? (user as any)?.userId;
  const userRoleId = (user as any)?.role_id || (user as any)?.role?.id;
  const userRoleName =
    typeof (user as any)?.role === "string"
      ? (user as any).role
      : (user as any)?.role?.name;
  const registrationAssigneeOpts = {
    workflowStatus,
    currentUserId,
    userRoleId,
    userRoleName,
    userIsHq: (user as any)?.is_hq,
  };
  
  /* =========================
     FETCH SOCIETY
  ==========================*/
  const fetchData = useCallback(async () => {
    if (!id) return;

    try {
      const response: any = await getSocietyById(id);
      setRegistrationDetails(response);
      setWorkflowStatus(response?.society?.workflowStatus || null);
      setSociety(response?.society || null);
    } catch {
      toast.error("Failed to load registration details");
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* =========================
     DOCUMENT PARSER (LOGIC ONLY)
  ==========================*/
  const parseWorkflowDocuments = (
    docs?: string | string[] | null,
  ): string[] => {
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

  /* =========================
     WORKFLOW ACTION
  ==========================*/
  const callWorkflowAction = async (
    action: "approve" | "back",
    comments?: string,
    documentData?: Record<string, string>,
    bypass?: boolean,
  ) => {
    try {
      setLoading(true);

      const resourceId = registrationDetails?.society?.id;
      if (!resourceId) {
        toast.error("Invalid resource ID");
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
        action === "approve" &&
        (registrationActionStep?.approval_send_to === "single" ||
          workflowStatus?.next?.approval_send_to === "single") &&
        !selectedUserId
      ) {
        toast.error("Please select the user to assign before approving.");
        return;
      }

      if (selectedUserId) {
        payload.assigned_to = selectedUserId;
      }

      const res: any = await updateWorkflow(payload);

      if (res?.success !== false) {
        toast.success("Status updated successfully");

        // If workflow approve transitions SOCIETY_REGISTRATION into `certificate_issued`,
        // call certificate upload endpoint immediately from frontend.
        if (action === "approve" && res?.data?.nextStatus === "certificate_issued") {
          try {
            await issueCertificate(resourceId);
            toast.success("Certificate uploaded successfully");
          } catch (e: any) {
            // Some failures (e.g. notification user list empty) may still upload the PDF.
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

      await fetchData();
      if (action !== "approve") {
        setModalOpen(false);
        setReassignOpen(false);
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
  const openApproveModal = async () => {
    setIsRejectModal(false);
  
    const { users, isRequired } = await loadForwardAssignmentUsers(registrationAssigneeOpts);
   
    setIsAssignmentRequired(isRequired);
    setAssignmentUsers(users);
    setModalOpen(true);
  };

  /* =========================
   * REJECT MODAL
   ==========================*/
  const openRejectModal = async () => {
    setIsRejectModal(true);
    const { users, isRequired } = await loadRejectAssignmentUsers(registrationAssigneeOpts);
    setIsAssignmentRequired(isRequired);
    setAssignmentUsers(users);
    setModalOpen(true);
  };

  /* =========================
     BUTTON VISIBILITY
  ==========================*/
  const effectiveAssignedToUserId = resolveEffectiveAssignedToUserId(
    workflowStatus,
    society,
  );

  const workflowActionEntity = useMemo(
    () =>
      society
        ? {
            ...society,
            assigned_to_user_id: effectiveAssignedToUserId,
          }
        : null,
    [society, effectiveAssignedToUserId],
  );

  const canShowActions = canShowWorkflowActions(
    workflowActionEntity,
    workflowStatus,
    currentUserId,
    userRoleId,
    userRoleName,
  );

  /** Step 10 (RCS certificate): there is no `next` workflow — actions live on `current`. */
  const isRegistrationFinalRcsStep =
    Number(workflowStatus?.current?.sequence) === 10 && !workflowStatus?.next;

  const registrationActionStep = isRegistrationFinalRcsStep
    ? workflowStatus?.current
    : workflowStatus?.next;

  const canApprove = !!registrationActionStep?.approval_status_id;
  const canReject = !!registrationActionStep?.reject_status_id;
  const isLastStep =
    registrationActionStep?.approvalStatus?.key === "certificate_issued";

  const applicationStatusKey =
    society?.status?.key ??
    society?.statusDetails?.key ??
    workflowStatus?.currentStatus?.key;
  const isWaitingOnApplicantChallan =
    applicationStatusKey === "challan_pending" ||
    (applicationStatusKey === "rejected" &&
      workflowStatus?.next?.sequence === 9 &&
      String(workflowStatus?.next?.approval_documents || "").includes("challan_receipt"));

  const societyDetailsPayload = useMemo(() => {
    if (!registrationDetails?.society) return registrationDetails;
    return {
      ...registrationDetails,
      society: {
        ...registrationDetails.society,
        workflowStatus:
          registrationDetails.society.workflowStatus || workflowStatus,
      },
    };
  }, [registrationDetails, workflowStatus]);

  const applicantMustReuploadChallan = needsApplicantChallanAction(
    societyDetailsPayload?.society,
    applicationStatusKey,
  );

  const isRcsChallanReviewStep =
    applicationStatusKey === "challan_uploaded" &&
    Number(workflowStatus?.current?.sequence) === 10;

  const showRegistrationRcsDeskActions =
    isRcsChallanReviewStep &&
    userRoleName === "rcs_district" &&
    (canApprove || canReject);

  const showWorkflowActions = canShowActions || showRegistrationRcsDeskActions;

  const reassignEntity = useMemo(
    () =>
      workflowActionEntity
        ? {
            assigned_to_user_id: workflowActionEntity.assigned_to_user_id,
            status_changed_by: workflowActionEntity.status_changed_by,
          }
        : null,
    [workflowActionEntity],
  );

  const assigneeAvailability = useAssigneeAvailability({
    workflowStatus,
    entity: reassignEntity,
    currentUserId: (user as any)?.id ?? (user as any)?.userId,
  });

  /* =========================
      DOCUMENT LOGIC 
  ==========================*/
  const approvalDocuments = parseWorkflowDocuments(
    registrationActionStep?.approval_documents,
  );

  const rejectDocuments = parseWorkflowDocuments(
    registrationActionStep?.reject_documents,
  );

  /* =========================
     UI (UNCHANGED)
  ==========================*/
  return (
    <div className="relative pb-28">
      <AssigneeUnavailableNotice
        visible={assigneeAvailability.showUnavailableNotice}
        assigneeName={assigneeAvailability.assigneeDisplayName}
        unavailableUntil={assigneeAvailability.assignedUser?.unavailable_until}
        onReassign={() => setReassignOpen(true)}
      />

      {userRoleName !== "applicant" && applicantMustReuploadChallan &&  !(applicationStatusKey === "challan_pending" ) && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          This file was <strong>returned for challan correction</strong>. It is
          assigned to the <strong>applicant</strong> — approve/forward buttons
          appear here only after they re-upload the challan from{" "}
          <strong>My Society</strong>.
        </div>
      )}

      <SocietyDetails
        societyData={societyDetailsPayload}
        loading={false}
        user={user}
        reload={fetchData}
      />

      <WorkflowReassignBlock
        moduleName={MODULE_NAME}
        resourceId={registrationDetails?.society?.id ?? id ?? ""}
        entity={workflowActionEntity}
        workflowStatus={workflowStatus}
        currentUserId={(user as any)?.id ?? (user as any)?.userId}
        onRefresh={fetchData}
        showWorkflowActions={showWorkflowActions}
        onReject={canReject ? openRejectModal : undefined}
        onApprove={canApprove ? openApproveModal : undefined}
        showApproveButton={
          canApprove &&
          !assigneeAvailability.pendingReassign &&
          !isWaitingOnApplicantChallan
        }
        showRejectButton={canReject}
        userRole={user?.role}
        isLastStep={isLastStep}
        showHistory
        hideNotice
        reassignOpen={reassignOpen}
        onReassignOpenChange={setReassignOpen}
      />

      <ConfirmOrRejectModal
        key={`${modalOpen}-${approvalDocuments.join(",")}`}
        loading={loading}
        isOpen={modalOpen}
        workflowStatus={workflowStatus}
        isRejectModal={isRejectModal}
        title={
          isRejectModal
            ? 'Return Registration'
            : isLastStep
              ? 'Approve Registration'
              : 'Forward Registration'
        }
        description={
          isRejectModal
            ? 'Please provide a reason for returning this registration.'
            : isLastStep
              ? 'Are you sure you want to approve this registration?'
              : 'Are you sure you want to forward this registration?'
        }
        assignmentUsers={assignmentUsers}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        isAssignmentRequired={isAssignmentRequired}
        allowAssignmentOnReject
        approvalDocuments={approvalDocuments}
        rejectDocuments={rejectDocuments}
        onSubmit={(msg, doc, meta) =>
          callWorkflowAction(isRejectModal ? "back" : "approve", msg, doc, meta?.bypass)
        }
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
};
