import { api, ApiResponse, PaginationParams } from '../../../lib/api';
import { AnnualFiling } from '../../../types';

export interface AnnualFilingListResponse {
    success: boolean;
    message: string;
    data: {
        annualForms: AnnualFiling[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    };
    version: string;
    timestamp: string;
}

export interface AnnualFilingResponse {
    status: number;
    data: AnnualFiling;
}

// Get all annual forms with pagination
export const getAnnualFilings = (params: any): Promise<any> => {
    return api.get<any>('/annual-forms', params).then((response: any) => {
        if (!response.success) {
            throw new Error('Invalid response format');
        }
        // Backend returns annualForms, map it to data for consistency
        return response.data;
    });
};

// Get single annual form by ID
export const getAnnualFilingById = (id: string): Promise<any> => {
    return api.get<any>(`/annual-forms/${id}`).then((response: any) => {
        if (!response.success) {
            throw new Error('Annual form not found');
        }
        return response.data;
    });
};

// Create new annual form
export const createAnnualFiling = (data: Partial<AnnualFiling>): Promise<any> => {
    return api.post<any>('/annual-forms', data).then((response: any) => {
        return response;
    });
};

// Update annual form
export const updateAnnualFiling = (id: string, data: Partial<AnnualFiling>): Promise<AnnualFilingResponse> => {
    return api.put<AnnualFilingResponse>(`/annual-forms/${id}`, data).then(response => {
        if (!response.data) {
            throw new Error('Annual form not found');
        }
        return response.data;
    });
};

// Delete annual form
export const deleteAnnualFiling = (id: string): Promise<{ status: number; message: string }> => {
    return api.delete<{ status: number; message: string }>(`/annual-forms/${id}`).then(response => {
        if (!response.data) {
            throw new Error('Failed to delete annual form');
        }
        return response.data;
    });
};

// Update annual form status
export const updateAnnualFilingStatus = (id: string, status: AnnualFiling['status']): Promise<AnnualFilingResponse> => {
    return api.patch<AnnualFilingResponse>(`/annual-forms/${id}/status`, { status }).then(response => {
        if (!response.data) {
            throw new Error('Annual form not found');
        }
        return response.data;
    });
};

// Get annual forms by society ID
export const getAnnualFormsBySocietyId = (societyId: string, params: PaginationParams = {}): Promise<AnnualFilingListResponse> => {
    return api.get<AnnualFilingListResponse>(`/annual-forms/society/${societyId}`, params).then(response => {
        if (!response.data || !response.pagination) {
            throw new Error('Invalid response format');
        }
        return response.data;
    });
};

// Legacy function for backward compatibility - now uses real API
export const allAnnualFilings = () => {
    return getAnnualFilings({});
};