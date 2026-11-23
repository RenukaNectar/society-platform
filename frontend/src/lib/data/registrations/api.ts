import { api, ApiResponse, PaginationParams } from '../../../lib/api';
import { Registration } from '../../../types';

export interface RegistrationListResponse {
    status: number;
    pagination: {
        limit: number;
        from: number;
        to: number;
        total: number;
        currentPage: number;
        totalPages: number;
    };
    data: Registration[];
}

export interface RegistrationResponse {
    status: number;
    data: Registration;
}

// Society Registration specific interfaces
export interface SocietyRegistrationMember {
    name: string;
    gender: string;
    category: string;
}

export interface SocietyRegistrationData {
    // Basic Details
    society_id: string;
    cooperative_society_name?: string;
    local_langauge_society_name?: string;
    registration_authoritie_id?: number;
    reference_year?: number;
    date_registration?: string;
    registration_number?: string;
    cooperative_society_type_id?: number;
    area_of_operation_id?: number;
    water_body_type_id?: number;
    sector_of_operation_type?: number;
    sector_of_operation?: number;
    functional_status?: number;
    location_of_head_quarter?: number;
    state_id?: number;
    district_id?: number;
    block_id?: number;
    gram_panchayat_id?: number;
    village_code?: number;
    urban_local_body_type?: number;
    urban_local_body_code?: number;
    locality_ward_code?: number;
    pincode?: number;
    full_address?: string;
    contact_person?: string;
    designation?: number;
    mobile?: number;
    landline?: string;
    email?: string;
    financial_audit: boolean;
    audit_complete_year?: number;
    category_audit?: number;
    is_profit_making: boolean;
    annual_turnover?: number;
    annual_loss?: number;
    is_dividend_paid: boolean;
    dividend_rate?: number;
    operation_area_location?: number;
    bank_type?: string;
    cooperative_society_bank_id?: string;
    other_bank?: string;
    pan_no?: string;
    gst_no?: string;
    how_many_branches?: number;
    full_time_secretary?: string;
    mobile_number_of_secretary?: number;
    members?: SocietyRegistrationMember[];
}

export interface SocietyRegistrationResponse {
    success: boolean;
    message: string;
    data: {
        societyRegistration: any;
        members: any[];
        totalMembers: number;
    };
    version: string;
    timestamp: string;
}

export interface SocietyRegistrationListResponse {
    success: boolean;
    message: string;
    data: {
        societyRegistrations: any[];
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

// Get all registrations with pagination
export const getRegistrations = (params: PaginationParams): Promise<any> => {
    return api.get<any>('/societies', params).then((response: any) => {
        if (!response.success) {
            throw new Error('Invalid response format');
        }
        return response;
    });
};

// Get single registration by ID
export const getRegistrationById = (id: string): Promise<RegistrationResponse> => {
    return api.get<RegistrationResponse>(`/registrations/${id}`).then(response => {
        if (!response.data) {
            throw new Error('Registration not found');
        }
        return response.data;
    });
};

// Create new registration
export const createRegistration = (data: Partial<Registration>): Promise<RegistrationResponse> => {
    return api.post<RegistrationResponse>('/registrations', data).then(response => {
        if (!response.data) {
            throw new Error('Failed to create registration');
        }
        return response.data;
    });
};

// Update registration
export const updateRegistration = (id: string, data: Partial<Registration>): Promise<RegistrationResponse> => {
    return api.put<RegistrationResponse>(`/registrations/${id}`, data).then(response => {
        if (!response.data) {
            throw new Error('Registration not found');
        }
        return response.data;
    });
};

// Delete registration
export const deleteRegistration = (id: string): Promise<{ status: number; message: string }> => {
    return api.delete<{ status: number; message: string }>(`/registrations/${id}`).then(response => {
        if (!response.data) {
            throw new Error('Failed to delete registration');
        }
        return response.data;
    });
};

// Society Registration specific API functions
export const getSocietyRegistrations = (params: PaginationParams = {}): Promise<SocietyRegistrationListResponse> => {
    return api.get<SocietyRegistrationListResponse>('/society-registrations', params).then(response => {
        if (!response.data) {
            throw new Error('Invalid response format');
        }
        return response.data;
    });
};

export const getSocietyRegistrationById = (id: string): Promise<SocietyRegistrationResponse> => {
    return api.get<SocietyRegistrationResponse>(`/society-registrations/${id}`).then(response => {
        if (!response.data) {
            throw new Error('Society registration not found');
        }
        return response.data;
    });
};

export const getSocietyRegistrationBySocietyId = (societyId: string): Promise<SocietyRegistrationResponse> => {
    return api.get<SocietyRegistrationResponse>(`/society-registrations/society/${societyId}`).then(response => {
        if (!response.data) {
            throw new Error('Society registration not found');
        }
        return response.data;
    });
};

export const createSocietyRegistration = (data: SocietyRegistrationData): Promise<SocietyRegistrationResponse> => {
    return api.post<SocietyRegistrationResponse>('/society-registrations', data).then(response => {
        if (!response.data) {
            throw new Error('Failed to create society registration');
        }
        return response.data;
    });
};

export const updateSocietyRegistration = (id: string, data: Partial<SocietyRegistrationData>): Promise<SocietyRegistrationResponse> => {
    return api.put<SocietyRegistrationResponse>(`/society-registrations/${id}`, data).then(response => {
        if (!response.data) {
            throw new Error('Society registration not found');
        }
        return response.data;
    });
};

export const deleteSocietyRegistration = (id: string): Promise<{ success: boolean; message: string }> => {
    return api.delete<{ success: boolean; message: string }>(`/society-registrations/${id}`).then(response => {
        if (!response.data) {
            throw new Error('Failed to delete society registration');
        }
        return response.data;
    });
};

// Challan upload API function
export const uploadChallan = async (societyId: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('challan', file);

    const response = await api.post(`/society-registrations/${societyId}/challan`, formData);
    return response;
};

export const issueCertificate = async (
    societyId: string,
    isConversion: boolean = false
): Promise<any> => {
    try {
        const endpoint = isConversion
            ? `/society-registrations/${societyId}/issue-certificate?is_conversion=true`
            : `/society-registrations/${societyId}/issue-certificate`;
        console.log('[issueCertificate] Request payload:', {
            societyId,
            isConversion,
            endpoint,
        });
        return await api.post(endpoint);
    } catch (error) {
        console.error('Error issuing certificate:', error);
        throw error;
    }
};

// Legacy function for backward compatibility - now uses real API
export const allRegistrations = async (page: number = 1, search: string = '', filters: any = {}) => {
    return await getRegistrations({ page, search, filters });
};