import { useState } from "react";
import { ApproveReject } from "../approveReject/ApproveReject";
import { Button } from "../ui/Button";
import { ReassignApplicationModal } from "./ReassignApplicationModal";
import { AssignmentHistoryPanel } from "./AssignmentHistoryPanel";
import { AssigneeUnavailableNotice } from "./AssigneeUnavailableNotice";
import { useAssigneeAvailability } from "../../hooks/useAssigneeAvailability";
import { isTerminalReassignStatus } from "../../utils/workflowReassign";

export interface WorkflowReassignBlockProps {
  moduleName: string;
  resourceId: string;
  entity: {
    id?: string;
    assigned_to_user_id?: string | null;
    status_changed_by?: string | null;
    district_id?: string | null;
    appealStatus?: { key?: string | null } | null;
    statusObj?: { key?: string | null } | null;
    statusDetails?: { key?: string | null } | null;
    status?: { key?: string | null } | string | null;
  } | null;
  workflowStatus: any;
  currentUserId?: string;
  onRefresh: () => void | Promise<void>;
  showWorkflowActions?: boolean;
  onReject?: () => void;
  onApprove?: () => void;
  showApproveButton?: boolean;
  showRejectButton?: boolean;
  userRole?: string | { name?: string };
  isLastStep?: boolean;
  showHistory?: boolean;
  hideNotice?: boolean;
  reassignOpen?: boolean;
  onReassignOpenChange?: (open: boolean) => void;
}

export const WorkflowReassignBlock: React.FC<WorkflowReassignBlockProps> = ({
  moduleName,
  resourceId,
  entity,
  workflowStatus,
  currentUserId,
  onRefresh,
  showWorkflowActions = false,
  onReject,
  onApprove,
  showApproveButton,
  showRejectButton,
  userRole,
  isLastStep,
  showHistory = true,
  hideNotice = false,
  reassignOpen: reassignOpenProp,
  onReassignOpenChange,
}) => {
  const [reassignOpenInternal, setReassignOpenInternal] = useState(false);
  const reassignOpen = reassignOpenProp ?? reassignOpenInternal;
  const setReassignOpen = onReassignOpenChange ?? setReassignOpenInternal;

  const {
    assignedUser,
    assignedToUserId,
    showReassign,
    showUnavailableNotice,
    assigneeDisplayName,
    reassignExcludeUserId,
    reassignRoleName,
  } = useAssigneeAvailability({
    workflowStatus,
    entity,
    currentUserId,
  });

  const returnedByCurrentUser =
    !!currentUserId &&
    !!entity?.status_changed_by &&
    String(entity.status_changed_by) === String(currentUserId) &&
    isTerminalReassignStatus(workflowStatus, entity);
  const canShowReturn = !!showRejectButton && !returnedByCurrentUser;

  const openReassign = () => setReassignOpen(true);

  return (
    <>
      {!hideNotice && (
        <AssigneeUnavailableNotice
          visible={showUnavailableNotice}
          assigneeName={assigneeDisplayName}
          unavailableUntil={assignedUser?.unavailable_until}
          onReassign={openReassign}
        />
      )}

      {showHistory && resourceId && (
        <AssignmentHistoryPanel moduleName={moduleName} resourceId={resourceId} />
      )}

      {showWorkflowActions && (
        <ApproveReject
          onReject={canShowReturn ? onReject : undefined}
          onApprove={onApprove}
          showApproveButton={showApproveButton}
          showRejectButton={canShowReturn}
          userRole={userRole}
          isLastStep={isLastStep}
          onReassign={showReassign ? openReassign : undefined}
          showReassignButton={showReassign}
        />
      )}

      {showReassign && !showWorkflowActions && !showUnavailableNotice && (
        <div className="fixed bottom-4 right-4 z-40">
          <Button variant="primary" size="sm" onClick={openReassign}>
            REASSIGN
          </Button>
        </div>
      )}

      <ReassignApplicationModal
        isOpen={reassignOpen}
        onClose={() => setReassignOpen(false)}
        moduleName={moduleName}
        resourceId={resourceId}
        roleName={reassignRoleName}
        stepIsHq={workflowStatus?.current?.is_hq === true}
        excludeUserId={reassignExcludeUserId ?? assignedToUserId}
        currentAssignee={assignedUser}
        onSuccess={() => onRefresh()}
      />
    </>
  );
};
