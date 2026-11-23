import { toast } from 'react-hot-toast';
import { api, PaginationParams } from '../../../lib/api';
import { Society, SocietyFormData } from '../../../types';
import { convertJsonToForm } from '../../../utils/convertJsonToForm';

export interface SocietyRegistrationData {
    // Basic Details
    societyNameEnglish: string;
    societyNameLocal: string;
    state: string;
    district: string;
    yearOfReference: string;
    areaOfOperation: string;
    inputArea: string;
    societyType: string;

    // Members
    members: Array<{
        id: string;
        name: string;
        type: string;
        role: string;
        shareContribution: number;
    }>;

    // Documents
    byeLaws: File | null;
    bankCertificate: File | null;
    economicScheme: File | null;
    contributorList: File | null;
    customDocuments: File | null;

    // Agreements
    emailAgreement: boolean;
    termsAgreement: boolean;
}

export interface SocietyListResponse {
    status: number;
    pagination: {
        limit: number;
        from: number;
        to: number;
        total: number;
        currentPage: number;
        totalPages: number;
    };
    data: Society[];
}

export interface SocietyResponse {
    status: number;
    data: Society;
}

// Get all societies with pagination
export const getSocieties = (params: PaginationParams = {}): Promise<any> => {
    return api.get<any>('/societies', params).then((response: any) => {
        if (!response.success) {
            throw new Error('Invalid response format');
        }
        return response.data;
    });
};

// Get single society by ID
export const getSocietyById = (id: string): Promise<any> => {
    return api.get<any>(`/societies/${id}`).then((response: any) => {
        if (!response.success) {
            throw new Error('Society not found');
        }
        return response?.data;
    });
};

// Get society by user ID
export const getSocietyByUserId = (userId: string): Promise<SocietyResponse> => {
    return api.get<SocietyResponse>(`/societies/user/${userId}`).then(response => {
        if (!response.data) {
            throw new Error('Society not found for user');
        }
        return response.data;
    });
};

export interface UploadResponse {
    success: boolean;
    data: {
        id: string;
        url: string;
        created_by: string;
        active: boolean;
        created_at: string;
        updated_at: string;
    };
    message: string;
}

export type UploadDocumentOptions = {
    /** Backend stamps QR on bye-law PDF when set to `bye_laws` */
    documentType?: 'bye_laws' | string;
};

// Document upload with cancellation support
export const uploadDocument = async (
    file: File,
    onProgress?: (progress: number) => void,
    abortController?: AbortController,
    options?: UploadDocumentOptions
): Promise<any> => {
    const formData = new FormData();
    formData.append('document', file);
    if (options?.documentType) {
        formData.append('document_type', options.documentType);
    }

    const response: any = await api.post('/societies/media', formData, onProgress, abortController?.signal);
    return response;
};

/** API often returns media as `{ id, url }`; DB columns expect the media UUID only. */
const toMediaId = (value: unknown): unknown => {
    if (value == null || value === '') return value;
    if (typeof value === 'object' && value !== null && 'id' in (value as Record<string, unknown>)) {
        return (value as { id?: string }).id ?? value;
    }
    return value;
};

export const registerSociety = async (formData: any): Promise<any> => {
    const newBody = { ...formData };
    delete newBody.terms_agreement;
    delete newBody.email_agreement;
    delete newBody.chairmenExist;
    delete newBody.secretariesExist;
    delete newBody.treasurersExist;
    if (!newBody.society_type && newBody.sector_of_operation) {
        newBody.society_type = newBody.sector_of_operation;
    }
    if (newBody.id === '') {
        delete newBody.id;
    }
    newBody.bye_laws = toMediaId(formData?.bye_laws);
    newBody.bank_certificate = toMediaId(formData?.bank_certificate);
    newBody.economic_scheme = toMediaId(formData?.economic_scheme);
    newBody.contributor_list = toMediaId(formData?.contributor_list);
    newBody.custom_documents = toMediaId(formData?.custom_documents);
    newBody.non_family_coop_certificate = toMediaId(formData?.non_family_coop_certificate);
    newBody.site_inspection_report = toMediaId(formData?.site_inspection_report);
    newBody.circular_minutes_of_meeting = toMediaId(formData?.circular_minutes_of_meeting);
    newBody.land_document = toMediaId(formData?.land_document);
    newBody.full_particulars_of_the_promoter = toMediaId(formData?.full_particulars_of_the_promoter);
    newBody.circular_for_promoters_meeting = toMediaId(formData?.circular_for_promoters_meeting);
    newBody.minutes_of_meeting_of_promoters_meeting = toMediaId(formData?.minutes_of_meeting_of_promoters_meeting);
    /** Challan: loaded from GET as nested object; column is UUID FK to media */
    newBody.challan_receipt = toMediaId(formData?.challan_receipt);
    newBody.certificate_media_id = toMediaId(formData?.certificate_media_id);
    newBody.notification_media_id = toMediaId(formData?.notification_media_id);

    const response = formData?.id ? await api.put(`/society-registrations/${formData?.id}`, newBody) : await api.post('/society-registrations', newBody);

    return response;
};

// Update society
export const updateSociety = (societyId: string, data: Partial<SocietyRegistrationData>): Promise<{ success: boolean; message: string }> => {
    return api.put<{ success: boolean; message: string }>(`/societies/${societyId}`, data).then(response => {
        if (!response.data) {
            throw new Error('Failed to update society');
        }
        return response.data;
    });
};

// Delete society
export const deleteSociety = (id: string): Promise<{ status: number; message: string }> => {
    return api.delete<{ status: number; message: string }>(`/societies/${id}`).then(response => {
        if (!response.data) {
            throw new Error('Failed to delete society');
        }
        return response.data;
    });
};

// Update society status
export const updateSocietyStatus = (id: string, data: any): Promise<any> => {
    return api.post<any>(`/societies/${id}/status`, data).then((response: any) => {
        return response;
    });
}; 

export const submitDraft = (id: string): Promise<any> => {
    return api.put<any>(`/societies/${id}/submit-draft`, {
        action: 'submit_draft'
    }).then((response: any) => {
        return response;
    });
};

export { getSocietyHistory } from "../history/api";

// Get current user's society information
export const getCurrentUserSociety = (): Promise<any> => {
    return api.get<any>('/me').then(response => {
        if (!response.data) {
            throw new Error('Society information not found');
        }
        return response.data;
    });
};