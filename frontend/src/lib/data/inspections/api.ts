import { api, ApiResponse, PaginationParams } from '../../../lib/api';
import { Inspection } from '../../../types';

export interface InspectionListResponse {
    status: number;
    pagination: {
        limit: number;
        from: number;
        to: number;
        total: number;
        currentPage: number;
        totalPages: number;
    };
    data: Inspection[];
}

export interface InspectionResponse {
    status: number;
    data: Inspection;
}

// Get all inspections with pagination
export const getInspections = (params: PaginationParams = {}): Promise<InspectionListResponse> => {
    return api.get<InspectionListResponse>('/inspections', params).then(response => {
        if (!response.data || !response.pagination) {
            throw new Error('Invalid response format');
        }
        return response.data;
    });
};

// Get single inspection by ID
export const getInspectionById = (id: string): Promise<InspectionResponse> => {
    return api.get<InspectionResponse>(`/inspections/${id}`).then(response => {
        if (!response.data) {
            throw new Error('Inspection not found');
        }
        return response.data;
    });
};

// Create new inspection
export const createInspection = (data: Partial<Inspection>): Promise<InspectionResponse> => {
    return api.post<InspectionResponse>('/inspections', data).then(response => {
        if (!response.data) {
            throw new Error('Failed to create inspection');
        }
        return response.data;
    });
};

// Update inspection
export const updateInspection = (id: string, data: Partial<Inspection>): Promise<InspectionResponse> => {
    return api.put<InspectionResponse>(`/inspections/${id}`, data).then(response => {
        if (!response.data) {
            throw new Error('Inspection not found');
        }
        return response.data;
    });
};

// Delete inspection
export const deleteInspection = (id: string): Promise<{ status: number; message: string }> => {
    return api.delete<{ status: number; message: string }>(`/inspections/${id}`).then(response => {
        if (!response.data) {
            throw new Error('Failed to delete inspection');
        }
        return response.data;
    });
};

// Update inspection status
export const updateInspectionStatus = (id: string, status: Inspection['status']): Promise<InspectionResponse> => {
    return api.patch<InspectionResponse>(`/inspections/${id}/status`, { status }).then(response => {
        if (!response.data) {
            throw new Error('Inspection not found');
        }
        return response.data;
    });
};

// Legacy function for backward compatibility - now uses real API
export const allInspections = () => {
    return getInspections();
};