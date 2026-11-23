import { api, ApiResponse } from '../../api';

export interface BusinessActivityPayload {
  sector_of_operation: string;
  additional_data?: Record<string, unknown> | null;
}

export const getBusinessActivities = (
  params: Record<string, unknown> = {}
): Promise<ApiResponse<any>> => {
  return api.get('/business-activities', params);
};

export const getBusinessActivitiesBySociety = (
  societyId: string,
  params: Record<string, unknown> = {}
): Promise<ApiResponse<any>> => {
  return api.get(`/business-activities/society/${societyId}`, params);
};

export const createBusinessActivity = (
  societyId: string,
  data: BusinessActivityPayload
): Promise<ApiResponse<any>> => {
  return api.post(`/business-activities/society/${societyId}`, data);
};

export const getBusinessActivityById = (id: string): Promise<ApiResponse<any>> => {
  return api.get(`/business-activities/${id}`);
};

export const updateBusinessActivity = (
  id: string,
  data: BusinessActivityPayload
): Promise<ApiResponse<any>> => {
  return api.put(`/business-activities/${id}`, data);
};

export const extractBusinessActivityList = (response: any) => {
  const data = response?.data;
  const rows = Array.isArray(data)
    ? data
    : data?.businessActivities || data?.activities || data?.rows || [];
  const pagination = data?.pagination || null;
  return { rows: Array.isArray(rows) ? rows : [], pagination };
};
