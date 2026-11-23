import { api, ApiResponse } from '../../api';

const normalizeNotification = (n: any) => ({
  ...n,
  isRead: n.is_read,
});

export interface Notification {
  id: string;
  title: string;
  description?: string;
  redirect_path?: string;
  data?: any;
  is_read: boolean;
  isRead?: boolean;
  created_by: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type UnreadCountResponse = number;

export const getUnreadNotifications = async (
  page = 1,
  limit = 10
): Promise<ApiResponse<NotificationsResponse>> => {
  return api
    .get<NotificationsResponse>('/notifications/unread', {
      params: { page, limit },
    })
    .then((response: any) => {
      if (!response.success) {
        throw new Error('Failed to fetch unread notifications');
      }

      response.data.notifications =
        response.data.notifications.map(normalizeNotification);

      return response;
    });
};

export const getAllNotifications = async (
  page = 1,
  limit = 20,
  isRead?: boolean
): Promise<ApiResponse<NotificationsResponse>> => {
  const params: any = { page, limit };
  if (isRead !== undefined) params.isRead = isRead;

  return api
    .get<NotificationsResponse>('/notifications', {
      params,
    })
    .then((response: any) => {
      if (!response.success) {
        throw new Error('Failed to fetch notifications');
      }
      if (response.data?.notifications) {
        response.data.notifications =
          response.data.notifications.map(normalizeNotification);
      }
      return response;
    });
};

export const markNotificationAsRead = async (
  id: string
): Promise<ApiResponse<Notification>> => {
  return api.patch<Notification>(`/notifications/${id}/read`);
};

export const markAllNotificationsAsRead =
  async (): Promise<ApiResponse<void>> => {
    return api.patch<void>('/notifications/mark-all-read');
  };

export const getUnreadNotificationCount =
  async (): Promise<ApiResponse<UnreadCountResponse>> => {
    return api.get<UnreadCountResponse>('/notifications/count/unread');
  };