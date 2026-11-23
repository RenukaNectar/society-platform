import React, { useEffect, useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { allRoles } from "../lib/data/roles/api";
import { getPermissions } from "../lib/data/permissions/api";
import {
  getRolePermissions,
  assignPermissionToRole,
  deletePermissionFromRole,
} from "../lib/data/rbac/api";
import { Shield, Loader2, RefreshCw, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Select } from "../components/ui/Select";

export interface RoleRow {
  id: string;
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface PermissionOption {
  id: string;
  name: string;
  resource?: string;
  action?: string;
}

export const Roles: React.FC = () => {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignModalRole, setAssignModalRole] = useState<RoleRow | null>(null);
  const [rolePermissions, setRolePermissions] = useState<PermissionOption[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [removingPermissionId, setRemovingPermissionId] = useState<string | null>(null);
  const [selectedPermissionId, setSelectedPermissionId] = useState("");

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await allRoles({ page: 1, limit: 100 });
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load roles");
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPermissions = async () => {
    try {
      const result = await getPermissions({ page: 1, limit: 100 });
      setAllPermissions((result.permissions ?? []) as PermissionOption[]);
    } catch {
      setAllPermissions([]);
    }
  };

  const openAssignModal = (role: RoleRow) => {
    setAssignModalRole(role);
    setSelectedPermissionId("");
    setRolePermissions([]);
    setLoadingPermissions(true);
    getRolePermissions(role.id)
      .then((list) => setRolePermissions(list ?? []))
      .catch(() => {
        toast.error("Failed to load role permissions");
        setRolePermissions([]);
      })
      .finally(() => setLoadingPermissions(false));
  };

  const closeAssignModal = () => {
    setAssignModalRole(null);
    setRemovingPermissionId(null);
    setAssigning(false);
  };

  const handleAssign = async () => {
    if (!assignModalRole || !selectedPermissionId) {
      toast.error("Select a permission to assign");
      return;
    }
    setAssigning(true);
    try {
      await assignPermissionToRole(assignModalRole.id, selectedPermissionId);
      toast.success("Permission assigned");
      setSelectedPermissionId("");
      const list = await getRolePermissions(assignModalRole.id);
      setRolePermissions(list ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign permission");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (permissionId: string, permissionName: string) => {
    if (!assignModalRole) return;
    const confirmed = window.confirm(`Remove "${permissionName}" from this role?`);
    if (!confirmed) return;
    setRemovingPermissionId(permissionId);
    try {
      await deletePermissionFromRole(assignModalRole.id, permissionId);
      toast.success("Permission removed from role");
      setRolePermissions((prev) => prev.filter((p) => p.id !== permissionId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove permission");
    } finally {
      setRemovingPermissionId(null);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchAllPermissions();
  }, []);

  const assignedIds = new Set(rolePermissions.map((p) => p.id));
  const availableToAssign = allPermissions.filter((p) => !assignedIds.has(p.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Roles
        </h1>
        <button
          onClick={() => {
            fetchRoles();
            fetchAllPermissions();
          }}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Description</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Status</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No roles found.
                    </td>
                  </tr>
                ) : (
                  roles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900 capitalize whitespace-nowrap">
                        {role.name?.replace(/_/g, " ") ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-600 max-w-[200px] truncate hidden sm:table-cell">{role.description ?? "—"}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span
                          className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${
                            role.is_active !== false ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {role.is_active !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right whitespace-nowrap">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openAssignModal(role)}
                          className="inline-flex items-center gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Assign permission
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={!!assignModalRole}
        onClose={closeAssignModal}
        title={assignModalRole ? `Assign permissions – ${assignModalRole.name?.replace(/_/g, " ")}` : ""}
        size="lg"
      >
        {assignModalRole && (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Assigned permissions</div>
              {loadingPermissions ? (
                <div className="flex items-center gap-2 text-gray-500 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading…
                </div>
              ) : rolePermissions.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">None assigned. Use the form below to assign.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {rolePermissions.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 text-indigo-800 text-sm"
                    >
                      {p.name}
                      <button
                        type="button"
                        onClick={() => handleRemove(p.id, p.name)}
                        disabled={removingPermissionId === p.id}
                        className="p-0.5 rounded hover:bg-indigo-200 text-indigo-600 disabled:opacity-50"
                        title="Remove from role"
                      >
                        {removingPermissionId === p.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 pt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Assign new permission</div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={selectedPermissionId}
                  onChange={(e) => setSelectedPermissionId(e.target.value)}
                  placeholder="Select permission"
                  className="flex-1 min-w-[200px]"
                >
                  {availableToAssign.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.resource && p.action ? ` (${p.resource} · ${p.action})` : ""}
                    </option>
                  ))}
                </Select>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAssign}
                  disabled={assigning || !selectedPermissionId}
                >
                  {assigning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      Assigning…
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Assign
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="button" variant="outline" onClick={closeAssignModal}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
