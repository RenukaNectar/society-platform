import { api, ApiResponse } from '../../api';
import { SpecialAnnualGeneralMeeting, SpecialAnnualGeneralMeetingForm } from '../../../types';

// Create Special Annual General Meeting
export const createSpecialAnnualGeneralMeeting = async (
  data: SpecialAnnualGeneralMeetingForm
): Promise<ApiResponse<SpecialAnnualGeneralMeeting>> => {
  return api.post<SpecialAnnualGeneralMeeting>('/special-general-meeting', data);
};

// Get Special Annual General Meetings
export const getSpecialAnnualGeneralMeetings = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  society_id?: string;
}): Promise<ApiResponse<{ meetings: SpecialAnnualGeneralMeeting[]; pagination: any }>> => {
  return api.get<{ meetings: SpecialAnnualGeneralMeeting[]; pagination: any }>('/special-general-meeting', params);
};

// Get Special Annual General Meeting by ID
export const getSpecialAnnualGeneralMeetingById = async (
  id: string
): Promise<ApiResponse<SpecialAnnualGeneralMeeting>> => {
  return api.get<SpecialAnnualGeneralMeeting>(`/special-general-meeting/${id}`);
};

// Update Special Annual General Meeting
export const updateSpecialAnnualGeneralMeeting = async (
  id: string,
  data: Partial<SpecialAnnualGeneralMeetingForm>
): Promise<ApiResponse<SpecialAnnualGeneralMeeting>> => {
  return api.put<SpecialAnnualGeneralMeeting>(`/special-general-meeting/${id}`, data);
};