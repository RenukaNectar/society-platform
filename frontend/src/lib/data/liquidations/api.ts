import { api, PaginationParams } from '../../../lib/api';
import { Liquidation } from '../../../types';

export interface LiquidationListResponse {
    success: boolean;
    message: string;
    data: {
        liquidations: Liquidation[];
        total: number;
        page: number;
        limit: string;
        totalPages: number;
    };
    version: string;
    timestamp: string;
}

export interface LiquidationResponse {
    success: boolean;
    message: string;
    data: Liquidation;
    version: string;
    timestamp: string;
}

// Get all liquidations with pagination
export const getLiquidations = (params: PaginationParams = {}): Promise<any> => {
    return api.get<any>('/liquidations', params).then((response: any) => {
        if (!response.success) {
            throw new Error('Invalid response format');
        }
        return response;
    });
};

// Get single liquidation by ID
export const getLiquidationById = (id: string): Promise<LiquidationResponse> => {
    return api.get<LiquidationResponse>(`/liquidations/${id}`).then(response => {
        if (!response.data) {
            throw new Error('Liquidation not found');
        }
        return response.data;
    });
};

// Create new liquidation
export const createLiquidation = (data: any): Promise<any> => {
    return api.post<any>('/liquidations', data).then((response: any) => {
        if (!response.success) {
            throw new Error('Failed to create liquidation');
        }
        return response;
    });
};

// Update liquidation
export const updateLiquidation = (id: string, data: any): Promise<any> => {
    return api.put<any>(`/liquidations/${id}`, data).then((response: any) => {
        if (!response.data) {
            throw new Error('Liquidation not found');
        }
        return response;
    });
};

// Delete liquidation
export const deleteLiquidation = (id: string): Promise<{ status: number; message: string }> => {
    return api.delete<{ status: number; message: string }>(`/liquidations/${id}`).then(response => {
        if (!response.data) {
            throw new Error('Failed to delete liquidation');
        }
        return response.data;
    });
};

// Update liquidation status
export const updateLiquidationStatus = (id: string, status: Liquidation['status']): Promise<LiquidationResponse> => {
    return api.patch<LiquidationResponse>(`/liquidations/${id}/status`, { status }).then(response => {
        if (!response.data) {
            throw new Error('Liquidation not found');
        }
        return response.data;
    });
};

// Legacy function for backward compatibility - now uses real API
export const allLiquidations = () => {
    return getLiquidations();
};

// Get liquidations by user ID (for applicants) - using /liquidations endpoint with query parameters
export const getLiquidationDetailsByUserId = (userId: string): Promise<any | null> => {
    return api.get<any>('/liquidations', {
        created_by: userId,
        limit: 1
    }).then(response => {
        if(response?.data?.liquidations?.length > 0){
            return response?.data?.liquidations[0]
        }
        return null
    }).catch((error) => {
        console.error('getLiquidationDetailsByUserId error:', error);
        return null;
    });
};