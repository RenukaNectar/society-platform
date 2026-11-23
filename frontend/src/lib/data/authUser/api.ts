import { api, ApiResponse } from '../../../lib/api';
import { User } from '../../../types';

export interface AuthUserResponse {
    status: number;
    data: User;
}

// Get current authenticated user
export const getAuthUser = (): Promise<AuthUserResponse> => {
    return api.get<AuthUserResponse>('/auth/me').then(response => {
        if (!response.data) {
            throw new Error('User not authenticated');
        }
        return response.data;
    });
};

// Update current user profile
export const updateAuthUser = (data: Partial<User>): Promise<AuthUserResponse> => {
    return api.put<AuthUserResponse>('/auth/profile', data).then(response => {
        if (!response.data) {
            throw new Error('Failed to update profile');
        }
        return response.data;
    });
};

// Change password
export const changePassword = (data: any): Promise<any> => {
    return api.post<any>('/auth/change-password', data).then((response: any) => {
        if (!response.success) {
            throw new Error('Failed to change password');
        }
        const payload = response.data as { token?: string; refreshToken?: string } | null | undefined;
        if (payload?.token) {
            localStorage.setItem('token', payload.token);
        }
        if (payload?.refreshToken) {
            localStorage.setItem('refreshToken', payload.refreshToken);
        }
        return response;
    });
};

// Legacy function for backward compatibility - now uses real API
export const authUser = () => {
    return getAuthUser();
};