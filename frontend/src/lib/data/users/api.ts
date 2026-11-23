import { api, PaginationParams } from '../../../lib/api';
import type { Member, User } from '../../../types';

export interface UserListResponse {
    status: number;
    pagination: {
        limit: number;
        from: number;
        to: number;
        total: number;
        currentPage: number;
        totalPages: number;
    };
    data: User[];
}

export interface UserResponse {
    status: number;
    data: User;
}

// Get all users with pagination
export const getUsers = (params: PaginationParams = {}): Promise<any> => {
    return api.get<any>('/users', params).then((response: any) => {
        if (!response.success) {
            throw new Error('Invalid response format');
        }
        return response;
    });
};

// Get single user by ID
export const getUserById = (id: string): Promise<UserResponse> => {
    return api.get<UserResponse>(`/users/${id}`).then(response => {
        if (!response.data) {
            throw new Error('User not found');
        }
        return response.data;
    });
};

export interface SocietyResponse {
    success: boolean;
    message: string;
    data: {
        user: any;
        society: any;
        members?: Member[];
    };
    version: string;
    timestamp: string;
}

export const getMySociety = (): Promise<SocietyResponse> => {
    return api.get<SocietyResponse>('/me').then((response: any) => {
        if (!response?.success) {
            throw new Error(response.data?.message || 'Society not found');
        }
        return response;
    });
};

// Create new user
export const createUser = (data: Partial<User>): Promise<any> => {
    return api.post<any>('/users', data).then((response: any) => {
        if (!response.success) {
            throw new Error('Failed to create user');
        }
        return response;
    });
};

// Bulk upload applicants from Excel/CSV sheet
export const bulkUploadApplicants = async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/users/bulk-upload-applicants', formData);
    return response;
};

// Update user
export const updateUser = (id: string, data: any): Promise<any> => {
    return api.put<UserResponse>(`/users/${id}`, data).then((response: any) => {
        console.log(response);
        if (!response.success) {
            throw new Error('User not found');
        }
        return response;
    });
};

// Delete user
export const deleteUser = (id: string): Promise<any> => {
    return api.delete<any>(`/users/${id}`).then((response: any) => {
        console.log(response);
        if (!response.success) {
            throw new Error('Failed to delete user');
        }
        return response;
    });
};

// Legacy function for backward compatibility - now uses real API
export const allUsers = (page: number = 1) => {
    return getUsers({ page });
};

export const excludeUserFromAssignmentList = (
  users: any[],
  excludeUserId?: string | null,
): any[] => {
  if (!excludeUserId) return users;
  return users.filter((u) => u?.id && String(u.id) !== String(excludeUserId));
};

/** Query param for GET /users/roles/roleName — true/1 → 1, false/0 → 0 */
export const toIsHqQueryParam = (isHq: unknown): 0 | 1 => {
  if (isHq === true || isHq === 1 || isHq === '1') return 1;
  return 0;
};

/** Workflow forward picker — GET /users/roles/roleName?roleNames=a,b,c */
export const fetchUsersByRoleForAssignment = async (
  roleNameOrNames: string | string[],
  isHq?: unknown,
  excludeUserId?: string | null,
): Promise<any[]> => {
  const roleNames = (Array.isArray(roleNameOrNames) ? roleNameOrNames : [roleNameOrNames])
    .map((name) => String(name || '').trim())
    .filter(Boolean);
  if (!roleNames.length) return [];

  const params: Record<string, string | number> = {
    roleNames: roleNames.join(','),
  };
  if (isHq !== undefined && isHq !== null) {
    params.is_hq = toIsHqQueryParam(isHq);
  }

  const res: any = await api.get('/users/roles/roleName', params);
  const users = Array.isArray(res?.data) ? res.data : [];
  return excludeUserFromAssignmentList(users, excludeUserId);
};
