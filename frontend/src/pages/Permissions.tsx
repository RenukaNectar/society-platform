import React, { useEffect, useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { getPermissions, deletePermission as deletePermissionApi } from "../lib/data/permissions/api";
import { createPermission } from "../lib/data/rbac/api";
import { KeyRound, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const RESOURCES = [
  "dashboard",
  "users",
  "societies",
  "conversion",
  "annual-filing",
  "audit",
  "election",
  "appeal",
  "inspection",
  "amendment",
  "my-society",
  "liquidation",
  "renewals",
  "settings",
  "agm",
  "sgbm",
  "bod",
  "auditors",
];

const ACTIONS = ["view", "create", "update", "delete", "approve", "reject"];

export interface PermissionRow {
  id: string;
  name: string;
  description?: string;
  resource?: string;
  action?: string;
  is_active?: boolean;
}

const formatLabel = (s: string) =>
  s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const Permissions: React.FC = () => {
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    resource: "",
    action: "",
  });
  const [formError, setFormError] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const result = await getPermissions({ page: 1, limit: 100 });
      setPermissions(result.permissions ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load permissions");
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const suggestName = () => {
    if (form.resource && form.action) {
      const r = formatLabel(form.resource);
      const a = formatLabel(form.action);
      setForm((prev) => ({ ...prev, name: `${r} ${a}`.trim() }));
    }
  };

  const handleOpenModal = () => {
    setForm({ name: "", description: "", resource: "", action: "" });
    setFormError({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setFormError({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!form.resource) err.resource = "Module is required";
    if (!form.action) err.action = "Action is required";
    if (!form.name?.trim()) err.name = "Name is required";
    setFormError(err);
    if (Object.keys(err).length) return;

    setSubmitting(true);
    try {
      const created = await createPermission({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        resource: form.resource,
        action: form.action,
      });
      toast.success("Permission created successfully");
      setPermissions((prev) => [created, ...prev]);
      handleCloseModal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create permission");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (p: PermissionRow) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the permission "${p.name}"? This cannot be undone.`
    );
    if (!confirmed) return;
    setDeletingId(p.id);
    try {
      await deletePermissionApi(p.id);
      toast.success("Permission deleted");
      setPermissions((prev) => prev.filter((x) => x.id !== p.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete permission");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <KeyRound className="h-6 w-6" />
          Permissions
        </h1>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
          <button
            onClick={fetchPermissions}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
        </div>
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
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Description</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Status</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {permissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                      No permissions yet. Click Add to create one.
                    </td>
                  </tr>
                ) : (
                  permissions.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">{p.name ?? "—"}</td>
                      <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{formatLabel(p.resource ?? "") || "—"}</td>
                      <td className="px-4 py-2 text-gray-600 whitespace-nowrap capitalize">{p.action ?? "—"}</td>
                      <td className="px-4 py-2 text-gray-600 max-w-[200px] truncate hidden sm:table-cell">{p.description ?? "—"}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span
                          className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${
                            p.is_active !== false ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {p.is_active !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          disabled={deletingId === p.id}
                          className="inline-flex items-center justify-center p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                          title="Delete permission"
                        >
                          {deletingId === p.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={modalOpen} onClose={handleCloseModal} title="Add Permission" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Module"
            value={form.resource}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, resource: e.target.value }));
              setFormError((prev) => ({ ...prev, resource: "" }));
            }}
            placeholder="Select module"
            required
            error={formError.resource}
          >
            {RESOURCES.map((r) => (
              <option key={r} value={r}>
                {formatLabel(r)}
              </option>
            ))}
          </Select>
          <Select
            label="Action"
            value={form.action}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, action: e.target.value }));
              setFormError((prev) => ({ ...prev, action: "" }));
            }}
            placeholder="Select action"
            required
            error={formError.action}
          >
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {formatLabel(a)}
              </option>
            ))}
          </Select>
          <div>
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, name: e.target.value }));
                setFormError((prev) => ({ ...prev, name: "" }));
              }}
              placeholder="e.g. Society Update"
              error={formError.name}
            />
            <button
              type="button"
              onClick={suggestName}
              className="mt-1 text-xs text-indigo-600 hover:text-indigo-700"
            >
              Suggest from module + action
            </button>
          </div>
          <Input
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="e.g. can update societies"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Creating…
                </>
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
