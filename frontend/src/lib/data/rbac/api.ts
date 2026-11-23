import { api } from "../../api";

export interface RolePermissionItem {
  id: string;
  role_id: string;
  permission_id: string;
  permission?: { id: string; name: string };
}

export interface CreatePermissionBody {
  name: string;
  description?: string;
  resource: string;
  action: string;
}

/** Backend returns array of permission objects (not RolePermission wrappers) */
export const getRolePermissions = (roleId: string): Promise<{ id: string; name: string; resource?: string; action?: string }[]> => {
  return api.get<any>("/rbac/" + roleId + "/permissions").then((response: any) => {
    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to fetch role permissions");
    }
    return Array.isArray(response.data) ? response.data : [];
  });
};

export const assignPermissionToRole = (roleId: string, permissionId: string): Promise<void> => {
  return api.put<any>(`/rbac/${roleId}/permissions/${permissionId}`).then((response: any) => {
    if (!response.success) {
      throw new Error(response.message || "Failed to assign permission to role");
    }
  });
};

export const deletePermissionFromRole = (roleId: string, permissionId: string): Promise<void> => {
  return api.delete<any>(`/rbac/${roleId}/permissions/${permissionId}`).then((response: any) => {
    if (!response.success) {
      throw new Error(response.message || "Failed to remove permission from role");
    }
  });
};

export const createPermission = (body: CreatePermissionBody): Promise<any> => {
  return api.post<any>("/rbac/permissions", body).then((response: any) => {
    if (!response.success) {
      throw new Error(response.message || "Failed to create permission");
    }
    return response.data;
  });
};
