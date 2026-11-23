import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import {
  setNotifications,
  setUnreadCount,
  setLoading,
  setError,
  markAsRead as markAsReadAction,
  markAllAsRead as markAllAsReadAction,
} from "../store/slices/notificationSlice";

import {
  getAllNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} from "../lib/data/notifications/api";

/** Load notifications once when user is known (mount from shell only, e.g. Header). */
export const useNotificationsFeed = () => {
  const dispatch = useDispatch();
  const userId = useSelector((state: RootState) => state.auth.user?.id);

  useEffect(() => {
    if (!userId) return;

    const run = async () => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));
        const response = await getAllNotifications(1, 20);
        dispatch(setNotifications(response.data.notifications));
      } catch {
        dispatch(setError("Failed to load notifications"));
      } finally {
        dispatch(setLoading(false));
      }
    };

    const runCount = async () => {
      try {
        const response = await getUnreadNotificationCount();
        dispatch(setUnreadCount(response.data));
      } catch (err) {
        console.error(err);
      }
    };

    void run();
    void runCount();
  }, [userId, dispatch]);
};

/** Redux + mark actions (safe to use from many components — no fetch on mount). */
export const useNotificationCommands = () => {
  const dispatch = useDispatch();

  const { notifications, unreadCount, loading, error } = useSelector(
    (state: RootState) => state.notifications
  );

  const fetchNotifications = async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await getAllNotifications(1, 20);
      dispatch(setNotifications(response.data.notifications));
    } catch {
      dispatch(setError("Failed to load notifications"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadNotificationCount();
      dispatch(setUnreadCount(response.data));
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      dispatch(markAsReadAction(notificationId));
      await fetchUnreadCount();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      dispatch(markAllAsReadAction());
      await fetchUnreadCount();
    } catch (err) {
      console.error(err);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchUnreadNotifications: fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  };
};

/** Header: feed + commands. Prefer passing commands into NotificationsPopup to avoid double feed. */
export const useNotifications = () => {
  useNotificationsFeed();
  return useNotificationCommands();
};
