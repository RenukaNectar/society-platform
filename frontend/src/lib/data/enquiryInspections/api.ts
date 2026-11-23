import { api, ApiResponse, PaginationParams } from '../../../lib/api';
import { EnquiryInspection } from '../../../types';

export interface EnquiryInspectionListResponse {
    status: number;
    pagination: {
        limit: number;
        from: number;
        to: number;
        total: number;
        currentPage: number;
        totalPages: number;
    };
    data: EnquiryInspection[];
}

export interface EnquiryInspectionResponse {
    status: number;
    data: EnquiryInspection;
}

// Get all enquiry/inspections with pagination
export const getEnquiryInspections = (params: PaginationParams = {}): Promise<any> => {
    return api.get<any>('/enquiry-requests', params).then((response: any) => {
        if (!response.success) {
            throw new Error('Invalid response format');
        }
        return response;
    });
};

// Get single enquiry/inspection by ID (returns entity with workflowStatus.current | next | previous)
export const getEnquiryInspectionById = (id: string): Promise<any> => {
    return api.get<any>(`/enquiry-requests/${id}`).then((response: any) => {
        if (!response.success || !response.data) {
            throw new Error('Enquiry/Inspection not found');
        }
        return response.data;
    });
};

// Create new enquiry/inspection
export const createEnquiryInspection = (data: Partial<any>): Promise<any> => {
  return api.post<any>('/enquiry-requests', data).then((response: any) => {
    if (!response?.success) {
      const message =
        response?.message ||
        (Array.isArray(response?.errors) ? response.errors.join(', ') : null) ||
        'Failed to create enquiry/inspection';
      throw new Error(message);
    }
    return response;
  });
};

// Update enquiry/inspection
export const updateEnquiryInspection = (id: string, data: Partial<any>): Promise<any> => {
    return api.put<any>(`/enquiry-requests/${id}`, data).then((response: any) => {
        if (!response.success) {
            throw new Error('Enquiry/Inspection not found');
        }
        return response;
    });
};

// Delete enquiry/inspection
export const deleteEnquiryInspection = (id: string): Promise<{ status: number; message: string }> => {
    return api.delete<{ status: number; message: string }>(`/enquiry-inspections/${id}`).then(response => {
        if (!response.data) {
            throw new Error('Failed to delete enquiry/inspection');
        }
        return response.data;
    });
};

// Update enquiry/inspection status
export const updateEnquiryInspectionStatus = (id: string, status: EnquiryInspection['status']): Promise<EnquiryInspectionResponse> => {
    return api.patch<EnquiryInspectionResponse>(`/enquiry-inspections/${id}/status`, { status }).then(response => {
        if (!response.data) {
            throw new Error('Enquiry/Inspection not found');
        }
        return response.data;
    });
};

// Assign officer to enquiry/inspection
export const assignOfficer = (id: string, officerId: string): Promise<EnquiryInspectionResponse> => {
    return api.patch<EnquiryInspectionResponse>(`/enquiry-inspections/${id}/assign`, { officer_id: officerId }).then(response => {
        if (!response.data) {
            throw new Error('Enquiry/Inspection not found');
        }
        return response.data;
    });
};

// Add officer remarks
export const addOfficerRemarks = (id: string, remarks: string): Promise<EnquiryInspectionResponse> => {
    return api.patch<EnquiryInspectionResponse>(`/enquiry-inspections/${id}/remarks`, { officer_remarks: remarks }).then(response => {
        if (!response.data) {
            throw new Error('Enquiry/Inspection not found');
        }
        return response.data;
    });
};

// Complete enquiry/inspection
export const completeEnquiryInspection = (id: string, completionData: {
    completion_date: string;
    completion_remarks: string;
}): Promise<EnquiryInspectionResponse> => {
    return api.patch<EnquiryInspectionResponse>(`/enquiry-inspections/${id}/complete`, completionData).then(response => {
        if (!response.data) {
            throw new Error('Enquiry/Inspection not found');
        }
        return response.data;
    });
};

// Legacy function for backward compatibility - now uses real API
export const allEnquiryInspections = () => {
    return getEnquiryInspections();
};
