import { api, ApiResponse } from '../../api';
import { BodMeeting, BodMeetingForm } from '../../../types';

export const createBodMeeting = async (
  data: BodMeetingForm
): Promise<ApiResponse<BodMeeting>> => {
  return api.post<BodMeeting>('/board-of-directors-meeting', data);
};

export const getBodMeetings = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  society_id?: string;
}): Promise<ApiResponse<{ meetings: BodMeeting[]; pagination: any }>> => {
  return api.get<{ meetings: BodMeeting[]; pagination: any }>(
    '/board-of-directors-meeting',
    params
  );
};

export const getBodMeetingById = async (
  id: string
): Promise<ApiResponse<BodMeeting>> => {
  return api.get<BodMeeting>(`/board-of-directors-meeting/${id}`);
};
