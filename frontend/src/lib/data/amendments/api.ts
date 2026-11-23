import { api, ApiResponse, PaginationParams } from '../../../lib/api';
import { Amendment, AmendmentFormData } from '../../../types';

export interface AmendmentListResponse {
    status: number;
    pagination: {
        limit: number;
        from: number;
        to: number;
        total: number;
        currentPage: number;
        totalPages: number;
    };
    data: Amendment[];
}

export interface AmendmentResponse {
    status: number;
    data: Amendment;
}

// Get all amendments with pagination
export const getAmendments = (params: PaginationParams = {}): Promise<any> => {
    return api.get<any>('/amendments', params).then((response: any) => {
        if (!response.success) {
            throw new Error('Invalid response format');
        }
        return response;
    });
};

// Get single amendment by ID
export const getAmendmentById = (id: string): Promise<AmendmentResponse> => {
    return api.get<AmendmentResponse>(`/amendments/${id}`).then(response => {
        if (!response.data) {
            throw new Error('Amendment not found');
        }
        return response.data;
    });
};

// Create new amendment
export const createAmendment = (data: any): Promise<any> => {
    return api.post<any>('/amendments', data).then(response => {
        if (!response?.success) {
            throw new Error(response?.message || 'Failed to create amendment');
        }
        return response;
    });
};

// Update amendment (staff / roles with edit permission)
export const updateAmendment = (id: string, data: any): Promise<any> => {
    return api.put<any>(`/amendments/${id}`, data).then(response => {
        if (!response?.success) {
            throw new Error(response?.message || 'Failed to update amendment');
        }
        return response;
    });
};

const isEditPermissionError = (error: unknown): boolean => {
    const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
    return message.includes('insufficient permissions') && message.includes('edit');
};

// Update applicant's own amendment (pairs with GET /users/:userId/amendment)
export const updateAmendmentByUserId = (userId: string, data: any): Promise<any> => {
    return api.put<any>(`/users/${userId}/amendment`, data).then(response => {
        if (!response?.success) {
            throw new Error(response?.message || 'Failed to update amendment');
        }
        return response;
    });
};

// Upsert via POST for roles with create but not update (e.g. applicant).
export const createOrUpdateAmendment = async (
    data: any,
    existingId?: string,
    userId?: string
): Promise<any> => {
    if (!existingId) {
        return createAmendment(data);
    }

    const payloadWithId = { ...data, id: existingId, amendment_id: existingId };

    try {
        return await createAmendment(payloadWithId);
    } catch (error) {
        if (!isEditPermissionError(error)) {
            throw error;
        }

        if (userId) {
            try {
                return await updateAmendmentByUserId(userId, payloadWithId);
            } catch (userRouteError) {
                if (!isEditPermissionError(userRouteError)) {
                    throw userRouteError;
                }
            }
        }

        return createAmendment(data);
    }
};

// Delete amendment
export const deleteAmendment = (id: string): Promise<{ status: number; message: string }> => {
    return api.delete<{ status: number; message: string }>(`/amendments/${id}`).then(response => {
        if (!response.data) {
            throw new Error('Failed to delete amendment');
        }
        return response.data;
    });
};

// Update amendment status
export const updateAmendmentStatus = (id: string, data: any): Promise<any> => {
    return api.put<any>(`/amendments/${id}/status`, data).then(response => {
        return response;
    });
};

// Get amendments by user ID
export const getAmendmentsByUser = (userId: string): Promise<AmendmentListResponse> => {
    return api.get<AmendmentListResponse>(`/users/${userId}/amendments`).then(response => {
        if (!response.data) {
            throw new Error('Failed to get amendments for user');
        }
        return response.data;
    });
};

// Get amendment details by user ID
export const getAmendmentDetailsByUserId = (userId: string): Promise<AmendmentListResponse> => {
    return api.get<AmendmentListResponse>(`/users/${userId}/amendment`).then(response => {
        if (!response.data) {
            throw new Error('Failed to get amendment details for user');
        }
        return response.data;
    });
};

// Legacy function for backward compatibility - now uses real API
export const allAmendments = () => {
    return getAmendments();
};