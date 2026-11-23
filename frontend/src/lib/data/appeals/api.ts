import { api, ApiResponse, PaginationParams } from '../../../lib/api';
import { Appeal } from '../../../types';

export interface AppealListResponse {
    status: number;
    pagination: {
        limit: number;
        from: number;
        to: number;
        total: number;
        currentPage: number;
        totalPages: number;
    };
    data: Appeal[];
}

export interface AppealResponse {
    status: number;
    data: Appeal;
}

// Get all appeals with pagination
export const getAppeals = (params: PaginationParams = {}): Promise<any> => {
    return api.get<any>('/appeals', params).then((response: any) => {
        if (!response.success) {
            throw new Error('Invalid response format');
        }
        return response?.data;
    });
};

// Get single appeal by ID
export const getAppealById = (id: string): Promise<any> => {
    return api.get<any>(`/appeals/${id}`).then((response: any) => {
        if (!response.success) {
            throw new Error('Appeal not found');
        }
        return response.data;
    });
};

// Create new appeal
export const createAppeal = (data: Partial<Appeal>): Promise<any> => {
    return api.post<any>('/appeals', data).then((response: any) => {
        if (!response.success) {
            throw new Error('Failed to create appeal');
        }
        return response;
    });
};

// Update appeal
export const updateAppeal = (id: string, data: Partial<Appeal>): Promise<any> => {
    return api.put<any>(`/appeals/${id}`, data).then((response: any) => {
        if (!response.success) {
            throw new Error('Appeal not found');
        }
        return response;
    });
};

// Delete appeal
export const deleteAppeal = (id: string): Promise<{ status: number; message: string }> => {
    return api.delete<{ status: number; message: string }>(`/appeals/${id}`).then(response => {
        if (!response.data) {
            throw new Error('Failed to delete appeal');
        }
        return response.data;
    });
};

// Update appeal status
export const updateAppealStatus = (id: string, data: any): Promise<any> => {
    return api.post<any>(`/appeals/${id}/review`, data).then((response: any) => {
        console.log(response)
        if (!response.success) {
            throw new Error('Appeal not found');
        }
        return response;
    });
};

export const getAppealHearingsById = async (id: string): Promise<any> => {
    try {
        return await api.get<any>(`/appeals/${id}/review-list`).then((response: any) => {
            if (!response.success) {
                throw new Error('Appeal not found');
            }
            return response?.data;
        });
    } catch (error) {
        console.log('failed to get appeal hearings', error)
        return false;
    }
};

// Legacy function for backward compatibility - now uses real API
export const allAppeals = () => {
    return getAppeals();
};