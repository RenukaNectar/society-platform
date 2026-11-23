import { api } from "../../api";

export interface SetUserAvailabilityPayload {
  isAvailable: boolean;
  /** YYYY-MM-DD — optional end date for leave */
  unavailableUntil?: string;
}

export const setUserAvailability = async (
  userId: string,
  payload: SetUserAvailabilityPayload
) => {
  return api.patch(`/users/${userId}/availability`, payload);
};

export interface UserAvailabilitySummary {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_available: boolean;
  unavailable_until?: string | null;
}

export const getUserAvailability = async (
  userId: string
): Promise<UserAvailabilitySummary | null> => {
  try {
    const res: any = await api.get(`/users/${userId}/availability`);
    if (res?.success === false) return null;
    const row = res?.data;
    return row?.id ? row : null;
  } catch {
    return null;
  }
};

export interface AvailableUserOption {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  district_id?: string;
  state_id?: string;
  is_available?: boolean;
  is_active?: boolean;
  role?: { id: string; name: string; description?: string };
}

export const getAvailableUsers = async (params: {
  roleId?: string;
  roleName?: string;
  districtId?: string;
  stateId?: string;
  excludeUserId?: string | string[];
}): Promise<AvailableUserOption[]> => {
  const query: Record<string, string | string[]> = {};
  if (params.roleId) query.roleId = params.roleId;
  if (params.roleName) query.roleName = params.roleName;
  if (params.districtId) query.districtId = params.districtId;
  if (params.stateId) query.stateId = params.stateId;
  if (params.excludeUserId) {
    query.excludeUserId = params.excludeUserId;
  }

  const res = await api.get<AvailableUserOption[]>(`/users/available/list`, query);
  return Array.isArray(res?.data) ? res.data : [];
};
