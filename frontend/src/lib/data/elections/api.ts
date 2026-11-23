import { api, ApiResponse, PaginationParams } from '../../../lib/api';
import { ElectionRequest } from '../../../types';

export interface ElectionListResponse {
    status: number;
    pagination: {
        limit: number;
        from: number;
        to: number;
        total: number;
        currentPage: number;
        totalPages: number;
    };
    data: ElectionRequest[];
}

export interface ElectionResponse {
    status: number;
    data: ElectionRequest;
}

// Get all election requests with pagination
export const getElectionRequests = (params: PaginationParams = {}): Promise<any> => {
    return api.get<any>('/election-requests', params).then((response: any) => {
        if (!response.success) {
            throw new Error('Invalid response format');
        }
        return response;
    });
};

// Get single election request by ID
export const getElectionRequestById = (id: string): Promise<ElectionResponse> => {
    return api.get<ElectionResponse>(`/election-requests/${id}`).then(response => {
        if (!response.data) {
            throw new Error('Election request not found');
        }
        return response.data;
    });
};

// Create new election request
export const createElectionRequest = (data: Partial<ElectionRequest>): Promise<ElectionResponse> => {
    return api.post<ElectionResponse>('/election-requests', data).then(response => {
        if (!response.data) {
            throw new Error('Failed to create election request');
        }
        return response.data;
    });
};

// Update election request
export const updateElectionRequest = (id: string, data: Partial<ElectionRequest>): Promise<ElectionResponse> => {
    return api.put<ElectionResponse>(`/election-requests/${id}`, data).then(response => {
        if (!response.data) {
            throw new Error('Failed to update election request');
        }
        return response.data;
    });
};

// Delete election request
export const deleteElectionRequest = (id: string): Promise<{ status: number; message: string }> => {
    return api.delete<{ status: number; message: string }>(`/election-requests/${id}`).then(response => {
        if (!response.data) {
            throw new Error('Failed to delete election request');
        }
        return response.data;
    });
};

// Update election request status
export const updateElectionRequestStatus = (id: string, statusId: string, comments?: string): Promise<ElectionResponse> => {
    return api.patch<ElectionResponse>(`/election-requests/${id}/status`, { status_id: statusId, comments }).then(response => {
        if (!response.data) {
            throw new Error('Failed to update election request status');
        }
        return response.data;
    });
};

// Legacy function for backward compatibility - now uses real API
export const allelections = () => {
    return getElectionRequests();
};