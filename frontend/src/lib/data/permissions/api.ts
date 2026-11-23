import { api, ApiResponse, PaginationParams } from '../../../lib/api';
import { Permission } from '../../../types';

export interface PermissionListResponse {
    status: number;
    pagination: {
        limit: number;
        from: number;
        to: number;
        total: number;
        currentPage: number;
        totalPages: number;
    };
    data: Permission[];
}

export interface PermissionResponse {
    status: number;
    data: Permission;
}

// Get all permissions with pagination
export const getPermissions = (params: PaginationParams = {}): Promise<PermissionListResponse> => {
    return api.get<PermissionListResponse>('/permissions', params).then(response => {
        console.log(response);
        
        if (!response.data ) {
            throw new Error('Invalid response format');
        }
        return response.data;
    });
};

// Get single permission by ID
export const getPermissionById = (id: string): Promise<PermissionResponse> => {
    return api.get<PermissionResponse>(`/permissions/${id}`).then(response => {
        if (!response.data) {
            throw new Error('Permission not found');
        }
        return response.data;
    });
};

// Create new permission
export const createPermission = (data: Partial<Permission>): Promise<PermissionResponse> => {
    return api.post<PermissionResponse>('/permissions', data).then(response => {
        if (!response.data) {
            throw new Error('Failed to create permission');
        }
        return response.data;
    });
};

// Update permission
export const updatePermission = (id: string, data: Partial<Permission>): Promise<PermissionResponse> => {
    return api.put<PermissionResponse>(`/permissions/${id}`, data).then(response => {
        if (!response.data) {
            throw new Error('Permission not found');
        }
        return response.data;
    });
};

// Delete permission
export const deletePermission = (id: string): Promise<{ status: number; message: string }> => {
    return api.delete<{ status: number; message: string }>(`/permissions/${id}`).then(response => {
        if (!response.data) {
            throw new Error('Failed to delete permission');
        }
        return response.data;
    });
};

// Legacy function for backward compatibility - now uses real API
export const allPermissions = () => {
    return getPermissions();
};