import { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { DocumentUpload } from "../ui/DocumentUpload";
import Spinner from "../spinner/Spinner";
import {
  canCurrentUserBypassWorkflow,
  isActingOnNextWorkflowStep,
  loadUsersForWorkflowStep,
  workflowStepRoleLabel,
} from "../../lib/workflow/assigneeUsers";

/* =========================
   PROPS
=========================*/
interface ConfirmOrRejectModalProps {
  loading?: boolean;
  isOpen: boolean;
  isRejectModal?: boolean;
  title: string;
  description: string;

  assignmentUsers?: any[];
  selectedUserId?: string | null;
  setSelectedUserId?: (id: string) => void;
  isAssignmentRequired?: boolean;
  allowAssignmentOnReject?: boolean;

  approvalDocuments?: string[];
  rejectDocuments?: string[];
  /** Current workflow payload. When nextBypass or previousBypass is set, the skip option is shown. */
  workflowStatus?: any;

  onSubmit?: (
    message?: string,
    documentData?: Record<string, string | string[]>,
    meta?: { bypass?: boolean },
  ) => void;

  onCancel: () => void;
}

/* =========================
   COMPONENT
=========================*/
export const ConfirmOrRejectModal = ({
  loading = false,
  isOpen = false,
  isRejectModal = false,
  title,
  description,
  onSubmit,
  onCancel,

  assignmentUsers = [],
  selectedUserId,
  setSelectedUserId,
  isAssignmentRequired = false,
  allowAssignmentOnReject = false,

  approvalDocuments = [],
  workflowStatus,
}: ConfirmOrRejectModalProps) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const roleName =
    typeof user?.role === "string" ? user.role : user?.role?.name;
  const roleDescription =
    user?.roleDescription ||
    (typeof user?.role === "object" ? user?.role?.description : "");
  const normalizedRoleName = String(roleName || "").toLowerCase();
  const normalizedRoleDescription = String(roleDescription || "").toLowerCase();
  const isDrcsArcsDistrictUser =
    normalizedRoleName === "drcs_arcs_district" ||
    normalizedRoleDescription === "drcs/arcs district" 

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [documentError, setDocumentError] = useState("");
  const [assignmentError, setAssignmentError] = useState("");

  const [uploadedDocuments, setUploadedDocuments] = useState<
    Record<string, string | string[]>
  >({});
  const [bypassChecked, setBypassChecked] = useState(false);
  const [bypassUsers, setBypassUsers] = useState<any[]>([]);
  const [bypassUsersLoading, setBypassUsersLoading] = useState(false);

  const bypassDirection = isRejectModal ? "reverse" : "forward";
  const actingOnNext =
    !isRejectModal &&
    isActingOnNextWorkflowStep(workflowStatus, undefined, roleName);
  const forwardBypass = actingOnNext
    ? workflowStatus?.nextStepBypass
    : workflowStatus?.nextBypass;
  const bypassStep = canCurrentUserBypassWorkflow(roleName, bypassDirection)
    ? isRejectModal
      ? workflowStatus?.previousBypass
      : forwardBypass
    : null;
  const skippedStep = isRejectModal
    ? workflowStatus?.previous
    : workflowStatus?.next;
  const usingBypassForward = bypassChecked && !isRejectModal;
  // Skipping always assigns one officer on the landing step, even when that
  // step's own approval notifies everyone (for example RCS after JT RCS).
  const shouldShowAssignment = usingBypassForward
    ? true
    : isAssignmentRequired && (!isRejectModal || allowAssignmentOnReject);
  const displayUsers = usingBypassForward ? bypassUsers : assignmentUsers;
  const currentUserId = user?.id ?? user?.userId;

  /* =========================
     RESET ON CLOSE
  ==========================*/
  useEffect(() => {
    if (!isOpen) {
      setMessage("");
      setError("");
      setDocumentError("");
      setAssignmentError("");
      setUploadedDocuments({});
      setBypassChecked(false);
      setBypassUsers([]);
      setBypassUsersLoading(false);
    }
  }, [isOpen]);

  const handleBypassToggle = async (checked: boolean) => {
    setBypassChecked(checked);
    setSelectedUserId?.("");
    setAssignmentError("");
    setError("");
    if (!checked || isRejectModal || !bypassStep) {
      setBypassUsers([]);
      return;
    }
    setBypassUsersLoading(true);
    try {
      const users = await loadUsersForWorkflowStep(bypassStep, currentUserId);
      setBypassUsers(users);
    } catch {
      setBypassUsers([]);
      setAssignmentError("Failed to load officers for the next step.");
    } finally {
      setBypassUsersLoading(false);
    }
  };

  const isOtherDocument = (docKey: string) => docKey === "other_documents";
  const isDocumentVerification = (docKey: string) =>
    docKey.toLowerCase() === "document_verification";
  const isAuditReportDocument = (docKey: string) =>
    docKey.toLowerCase() === "audit_report";
  const isDocumentRequired = (docKey: string) =>
    !isOtherDocument(docKey) &&
    !isDocumentVerification(docKey) &&
    (!isAuditReportDocument(docKey) || isDrcsArcsDistrictUser);

  const activeDocuments =
    isRejectModal || bypassChecked ? [] : approvalDocuments;
  const getLabelFromKey = (key: string) => {
    if (key === "liquidator_appointment_observations") {
      return "RCS Observations for Liquidator Appointment";
    }
    return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  /* =========================
     UPLOAD HANDLERS
  ==========================*/
  const handleUploadComplete = (docKey: string, documentId: string) => {
    setUploadedDocuments((prev) => {
      if (isOtherDocument(docKey)) {
        const existing = Array.isArray(prev[docKey])
        
          ? (prev[docKey] as string[])
          : [];


        if (existing.length >= 3) {
          setDocumentError("You can upload a maximum of 3 documents.");
          return prev;
        }

        return { ...prev, [docKey]: [...existing, documentId] };
      }

      return { ...prev, [docKey]: documentId };
    });

    setDocumentError("");
  };

  const handleUploadCancel = (docKey: string, documentId?: string) => {
    setUploadedDocuments((prev) => {
      const value = prev[docKey];

      if (Array.isArray(value) && documentId) {
        return {
          ...prev,
          [docKey]: value.filter((id) => id !== documentId),
        };
      }

      const copy = { ...prev };
      delete copy[docKey];
      return copy;
    });
  };

  /* =========================
     CONFIRM
  ==========================*/
  const handleConfirm = () => {
    if ((isRejectModal || bypassChecked) && !message.trim()) {
      setError(
        isRejectModal
          ? "Please provide a reason for returning this application."
          : "A comment is required when skipping a step.",
      );
      return;
    }

    if (bypassUsersLoading) {
      setAssignmentError("Please wait while officers are loaded.");
      return;
    }

    if (shouldShowAssignment) {
      if (displayUsers.length === 0) {
        setAssignmentError(
          "No users available to assign for this role. You cannot approve without an assignee.",
        );
        return;
      }
      if (!selectedUserId) {
        setAssignmentError("Please select a user.");
        return;
      }
    }

    // required docs (except other_documents)
    if (activeDocuments.length > 0) {
      for (const docKey of activeDocuments) {
        if (!isDocumentRequired(docKey)) continue;

        const value = uploadedDocuments[docKey];
        if (!value || (Array.isArray(value) && value.length === 0)) {
          setDocumentError(`Please upload ${getLabelFromKey(docKey)}.`);
          return;
        }
      }
    }

  
    setError("");
    setDocumentError("");
    setAssignmentError("");

    onSubmit?.(message, bypassChecked ? {} : uploadedDocuments, {
      bypass: bypassChecked,
    });
  };

  /* =========================
     UI
     

  ==========================*/
  const roleDescriptions = [
    ...new Set(
      displayUsers
        .map((assignee) => assignee.role?.description)
        .filter(Boolean)
    ),
  ];
  const skippedRoleLabel =
    bypassStep?.skippedRoleLabel || workflowStepRoleLabel(skippedStep);
  const landingRoleLabel = workflowStepRoleLabel(bypassStep);

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="md">
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-md bg-white/75">
            <Spinner size="lg" />
            <p className="mt-3 text-sm font-medium text-gray-700">
              Please wait...
            </p>
          </div>
        )}

        <div
          className={`space-y-5 ${loading ? "pointer-events-none opacity-60" : ""}`}
        >
          {description && <p className="text-gray-700">{description}</p>}

          {bypassStep && (
            <label className="flex items-start gap-2 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
              <input
                type="checkbox"
                className="mt-1"
                checked={bypassChecked}
                disabled={loading}
                onChange={(e) => handleBypassToggle(e.target.checked)}
              />
              <span>
                Skip {skippedRoleLabel || "the next step"} and{" "}
                {isRejectModal ? "return the file to" : "assign to"}{" "}
                {landingRoleLabel || "the following step"}. Use this when that
                officer is not available.
              </span>
            </label>
          )}

          {/* ASSIGNMENT */}
          {shouldShowAssignment && (
            <div>
              <label className="block text-sm font-medium mb-1">
    Assign To
    {roleDescriptions.length > 0 && (
      <span className="ml-2 text-xs text-gray-500 font-normal">
        (
        {roleDescriptions.join(", ")}
        )
      </span>
    )}
  </label>
 {bypassUsersLoading ? (
                <p className="text-sm text-gray-600">Loading officers...</p>
              ) : displayUsers.length > 0 ? (
                <select
                  className="w-full border border-gray-300 rounded p-2"
                  value={selectedUserId || ""}
                  onChange={(e) => setSelectedUserId?.(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select user...</option>
                  {displayUsers.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  No users available for this role.
                </p>
              )}
              {assignmentError && (
                <p className="text-red-600 text-sm mt-1">{assignmentError}</p>
              )}
            </div>
          )}

          {/* COMMENT */}
          <textarea
            className="w-full border border-gray-300 rounded p-2 min-h-[80px]"
            placeholder={
              isRejectModal || bypassChecked
                ? isRejectModal
                  ? "Enter reason for return..."
                  : "Why is this step being skipped?"
                : "Enter comments (optional)..."
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading}
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* DOCUMENTS */}
          {activeDocuments.length > 0 && (
            <div className="space-y-4">
              {activeDocuments.map((docKey) => (
                <DocumentUpload
                  key={docKey}
                  label={getLabelFromKey(docKey)}
                  required={isDocumentRequired(docKey)}
                  multiple={isOtherDocument(docKey)}
                  maxFiles={isOtherDocument(docKey) ? 3 : undefined}
                  onUploadComplete={(id) => handleUploadComplete(docKey, id)}
                  onUploadCancel={(id) => handleUploadCancel(docKey, id)}
                />
              ))}
              {documentError && (
                <p className="text-red-600 text-sm">{documentError}</p>
              )}
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant={isRejectModal ? "danger" : "success"}
              onClick={handleConfirm}
              disabled={loading}
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
