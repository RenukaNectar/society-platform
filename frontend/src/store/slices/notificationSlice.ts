import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Notification } from "../../types";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
    },

    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);

      if (!action.payload.isRead) {
        state.unreadCount++;
      }
    },

    markAsRead: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.notifications = state.notifications.map((n: any) => {
        if (n.id !== id) return n;
        const wasUnread = !(n.isRead ?? n.is_read);
        if (wasUnread) state.unreadCount = Math.max(0, state.unreadCount - 1);
        return { ...n, is_read: true, isRead: true };
      });
    },

    markAllAsRead: (state) => {
      state.notifications = state.notifications.map((n: any) => ({
        ...n,
        is_read: true,
        isRead: true,
      }));
      state.unreadCount = 0;
    },

    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  setUnreadCount,
  setLoading,
  setError,
} = notificationSlice.actions;

export default notificationSlice.reducer;