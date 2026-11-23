import { api, ApiResponse } from '../../api';
import type { AnnualGeneralMeeting, AnnualGeneralMeetingForm } from '../../../types';

// Create Annual General Meeting
export const createAnnualGeneralMeeting = async (
  data: AnnualGeneralMeetingForm
): Promise<ApiResponse<AnnualGeneralMeeting>> => {
  return api.post<AnnualGeneralMeeting>('/annual-general-meeting', data);
};

// Get Annual General Meetings
export const getAnnualGeneralMeetings = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  society_id?: string;
}): Promise<ApiResponse<{ meetings: AnnualGeneralMeeting[]; pagination: any }>> => {
  return api.get<{ meetings: AnnualGeneralMeeting[]; pagination: any }>('/annual-general-meeting', params);
};

export const getAgmCalendarYearEligibility = async (
  societyId: string,
  year?: number,
): Promise<
  ApiResponse<{
    calendarYear: number;
    canCreate: boolean;
    existingAgm: { id: string; meeting_date: string } | null;
  }>
> => {
  return api.get('/annual-general-meeting/calendar-year-eligibility', {
    society_id: societyId,
    ...(year != null ? { year } : {}),
  });
};

// Get Annual General Meeting by ID
export const getAnnualGeneralMeetingById = async (
  id: string
): Promise<ApiResponse<AnnualGeneralMeeting>> => {
  return api.get<AnnualGeneralMeeting>(`/annual-general-meeting/${id}`);
};

// Resubmit (correct & re-submit) Annual General Meeting after return for rectification
export const resubmitAnnualGeneralMeeting = async (
  id: string,
  data: Partial<AnnualGeneralMeetingForm>
): Promise<ApiResponse<AnnualGeneralMeeting>> => {
  return api.post<AnnualGeneralMeeting>(`/annual-general-meeting/${id}/resubmit`, data);
};

// Update Annual General Meeting
// export const updateAnnualGeneralMeeting = async (
//   id: string,
//   data: Partial<AnnualGeneralMeetingForm>
// ): Promise<ApiResponse<AnnualGeneralMeeting>> => {
//   return api.put<AnnualGeneralMeeting>(`/others/annual-general-meeting/${id}`, data);
// };

// Delete Annual General Meeting
// export const deleteAnnualGeneralMeeting = async (
//   id: string
// ): Promise<ApiResponse<void>> => {
//   return api.delete<void>(`/others/annual-general-meeting/${id}`);
// };
