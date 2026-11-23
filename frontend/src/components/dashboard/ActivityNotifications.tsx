import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { Card } from "../ui/Card";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";

export const ActivityNotifications: React.FC = () => {
  const { notifications } = useSelector(
    (state: RootState) => state.notifications
  );

  const { mode } = useSelector((state: RootState) => state.theme);

  const navigate = useNavigate();

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h3
          className={`text-lg font-semibold ${
            mode === "dark" ? "text-gray-100" : "text-gray-900"
          }`}
        >
          Activity Notification
        </h3>
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.slice(0, 10).map((notification: any) => (
            <div
              key={notification.id}
              className="flex items-start space-x-3 cursor-pointer border-b border-gray-200 pb-2"
              onClick={() => {
                if (notification.redirect_path) {
                  navigate(notification.redirect_path);
                }
              }}
            >
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${
                    mode === "dark" ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  {notification.title}
                </p>

                <p
                  className={`text-xs ${
                    mode === "dark" ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  {notification.description}
                </p>

                <p
                  className={`text-xs ${
                    mode === "dark" ? "text-gray-400" : "text-gray-500"
                  } mt-1 text-right`}
                >
                  {moment(notification.created_at).format(
                    "DD MMM, YYYY hh:mm a"
                  )}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No notifications</p>
            <p className="text-sm mt-1">You're all caught up!</p>
          </div>
        )}
      </div>
    </Card>
  );
};