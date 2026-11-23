import { Button } from "../ui/Button";

interface ApproveRejectProps {
  onReject?: () => void;
  onApprove?: () => void;
  showApproveButton?: boolean;
  showRejectButton?: boolean;
  userRole?: string | { name?: string };
  /** When true, approve button should say "APPROVE" (final step). */
  isLastStep?: boolean;
  /** Reassign when current assignee is unavailable (only original assigner). */
  onReassign?: () => void;
  showReassignButton?: boolean;
  /** Extra props used by some screens; not required for core approve/reject rendering. */
  currentStatus?: string;
}

export const ApproveReject = ({
  onReject,
  onApprove,
  showApproveButton = true,
  showRejectButton = true,
  userRole,
  isLastStep,
  onReassign,
  showReassignButton = false,
}: ApproveRejectProps) => {
  const roleName =
    typeof userRole === "string" ? userRole : userRole?.name ?? "";
  const normalizedRole = roleName.toLowerCase().trim();
  // `jt_rcs_*` contains "rcs" — only true RCS roles are the final approver.
  const isRCS =
    normalizedRole === "rcs" ||
    normalizedRole === "rcs_district" ||
    normalizedRole === "rcs_hq";

  // Primary: use workflow final-step flag.
  // Fallback: if caller didn't provide it, keep old-ish behavior based on role.
  const approveText =
    typeof isLastStep === "boolean" ? (isLastStep ? "APPROVE" : "FORWARD") : isRCS ? "APPROVE" : "FORWARD";

  const hasReassign = showReassignButton && !!onReassign;
  const hasReject = showRejectButton && !!onReject;
  const hasApprove = showApproveButton && !!onApprove;

  if (!hasReassign && !hasReject && !hasApprove) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 bg-white p-4 rounded-lg shadow flex items-center justify-end space-x-3 w-[85%] border">
      {hasReassign && (
        <Button variant="primary" size="sm" onClick={onReassign}>
          REASSIGN
        </Button>
      )}

      {hasReject && (
        <Button
          variant="danger"
          size="sm"
          className="border-red-500 text-red-600 hover:bg-red-50"
          onClick={onReject}
        >
          RETURN
        </Button>
      )}

      {hasApprove && (
        <Button
          variant="success"
          size="sm"
          className="hover:bg-green-700 text-white"
          onClick={onApprove}
        >
          {approveText}
        </Button>
      )}
    </div>
  );
};
