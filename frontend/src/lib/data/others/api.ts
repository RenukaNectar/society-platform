import { api } from '../../../lib/api';

export const getAllStatuses = (): Promise<any> => {
    return api.get<any>(`/others/statuses`).then(response => {
        if (!response.data) {
            throw new Error('Society not found');
        }
        return response.data?.statuses;
    });
}; 

export const getStats = (): Promise<any> => {
    return api.get<any>(`/others/status-count`).then(response => {
        return response;
    });
};

export const getDashboardGraph = (): Promise<any> => {
    return api.get<any>(`/others/graph`).then(response => {
        return response;
    });
};

export const getAuditors = (): Promise<any> => {
    return api.get<any>(`/others/auditors`).then((response: any) => {
        if(response.success){
            return response?.data;
        }
        return false;
    });
};

export const getAuditorById = (id: string): Promise<any> => {
    return api.get<any>(`/others/auditors/${id}`).then((response: any) => {
        if(response.success){
            return response?.data;
        }
        return false;
    });
};

export const createAuditor = (data: any): Promise<any> => {
    return api.post<any>(`/others/auditors`, data).then((response: any) => {
        if(response.success){
            return response;
        }
        return false;
    });
};

export const updateAuditor = (id: string, data: any): Promise<any> => {
    return api.put<any>(`/others/auditors/${id}`, data).then((response: any) => {
        if(response.success){
            return response;
        }
        return false;
    });
};

export const deleteAuditor = (id: string): Promise<any> => {
    return api.delete<any>(`/others/auditors/${id}`).then((response: any) => {
        if(response.success){
            return response;
        }
        return false;
    });
};
export const submitDraft = (id: string, data: any): Promise<any> => {
    return api.put<any>(`/societies/${id}/submit-draft`, data).then((response: any) => {
        return response;
    });
};


