import { api } from '../../api';

export const createBodMember = (payload: {
  society_id: string;
  name: string;
  mobile?: string;
  gender?: string;
  category?: string;
  shareholder_category?: string;
  designation: string;
  is_co_opted?: boolean;
}) => api.post<any>('/bod-members', payload);

export const getBodMembersBySociety = (
  societyId: string,
  params?: { page?: number; limit?: number },
) =>
  api.get<any>(`/bod-members/society/${societyId}`, {
    page: params?.page ?? 1,
    limit: params?.limit ?? 100,
  });
