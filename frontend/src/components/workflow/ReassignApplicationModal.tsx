import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import Spinner from "../spinner/Spinner";
import toast from "react-hot-toast";
import { fetchUsersByRoleForAssignment } from "../../lib/data/users/api";
import { reassignWorkflow } from "../../lib/data/workflows/api";
import { formatAssigneeName } from "../../utils/workflowReassign";
import { RootState } from "../../store";

export interface ReassignApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleName: string;
  resourceId: string;
  /** Role name — same as Forward in approve modal */
  roleName?: string | null;
  /** HQ flag from workflow step — same as approve modal */
  stepIsHq?: boolean;
  excludeUserId?: string | null;
  currentAssignee?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    full_name?: string;
    unavailable_until?: string | null;
  } | null;
  onSuccess?: () => void;
}

export const ReassignApplicationModal: React.FC<ReassignApplicationModalProps> = ({
  isOpen,
  onClose,
  moduleName,
  resourceId,
  roleName,
  stepIsHq,
  excludeUserId,
  currentAssignee,
  onSuccess,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setSelectedUserId("");
      setReason("");
      setUsers([]);
      return;
    }

    const loadUsers = async () => {
      if (!roleName) {
        toast.error("Cannot load users: workflow role not found");
        return;
      }
      try {
        setUsersLoading(true);
        const list = await fetchUsersByRoleForAssignment(
          roleName,
          stepIsHq === true ? true : undefined,
          excludeUserId || (user as any)?.id,
        );
        const available = list.filter((officer) => officer?.is_available !== false);
        setUsers(available);
        if (!available.length) {
          toast.error(
            list.length
              ? "No available officer for this role. The other officers are on leave."
              : "No users found for this role",
          );
        }
      } catch (e: any) {
        toast.error(e?.message || "Failed to load users");
      } finally {
        setUsersLoading(false);
      }
    };

    loadUsers();
  }, [isOpen, roleName, stepIsHq, excludeUserId, user]);

  const handleSubmit = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user to assign");
      return;
    }
    if (!reason.trim() || reason.trim().length < 10) {
      toast.error("Please provide a reason (at least 10 characters)");
      return;
    }

    try {
      setLoading(true);
      const res: any = await reassignWorkflow({
        resourceId,
        moduleName,
        newAssigneeUserId: selectedUserId,
        reason: reason.trim(),
      });

      if (res?.success === false) {
        toast.error(res?.message || "Forward failed");
        return;
      }

      toast.success("Application forwarded successfully");
      onClose();
      onSuccess?.();
    } catch (e: any) {
      toast.error(e?.message || "Forward failed");
    } finally {
      setLoading(false);
    }
  };

  const assigneeLabel = formatAssigneeName(currentAssignee);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Forward Application" size="md">
      <div className="space-y-4">
        <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
          <p>
            <span className="font-medium">Current assignee:</span> {assigneeLabel}{" "}
            <span className="text-amber-700">(unavailable)</span>
          </p>
          {currentAssignee?.unavailable_until && (
            <p className="mt-1 text-amber-800 text-xs">
              Until: {new Date(currentAssignee.unavailable_until).toLocaleString()}
            </p>
          )}
          {roleName && (
            <p className="mt-1 text-xs text-amber-800">
              Role:{" "}
              <span className="font-medium capitalize">
                {roleName.replace(/_/g, " ")}
              </span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Forward to <span className="text-red-500">*</span>
          </label>
          {usersLoading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : (
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Select user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {`${u.first_name} ${u.last_name}`.trim()} ({u.email})
                </option>
              ))}
            </select>
          )}
          {!usersLoading && users.length === 0 && (
            <p className="mt-1 text-xs text-red-600">
              No available officer for this role. Officers on leave are not listed.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm min-h-[100px]"
            placeholder="e.g. Original assignee is on leave until next week"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={2000}
          />
          <p className="text-xs text-gray-500 mt-1">Minimum 10 characters</p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={loading || usersLoading}
          >
            {loading ? "Forwarding…" : "Forward"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
