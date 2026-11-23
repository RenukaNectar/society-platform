import React, { useState } from 'react';
import { Bell, User } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Button } from '../ui/Button';
import { GlobalSearch } from '../search/GlobalSearch';
import { NotificationsPopup } from './NotificationsPopup';
import { useNotifications } from '../../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const {
    unreadCount,
    notifications,
    loading,
    error,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { mode } = useSelector((state: RootState) => state.theme);
  const navigate = useNavigate();

  return (
    <>
      <header className={`bg-white ${mode}:bg-gray-800 border-b border-gray-200 ${mode}:border-gray-700 px-6 py-4`}>
        <div className="flex items-center justify-between">
          <h1 className={`text-xl font-semibold text-gray-900 ${mode}:text-gray-100`}>
            {title}
          </h1>
          
          <div className="flex items-center space-x-4">
            {/* <div className="w-80 max-w-sm">
              <div
                onClick={() => setShowSearch(true)}
                className={`flex items-center px-3 py-2 border border-gray-300 ${mode}:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 ${mode}:hover:bg-gray-800 transition-colors duration-200`}
              >
                <Search className="h-4 w-4 text-gray-400 mr-2" />
                <span className={`text-sm text-gray-500 ${mode}:text-gray-400`}>
                  Search portal...
                </span>
              </div>
            </div> */}
            
            <div className="relative">
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </div>
            
            <Button variant="ghost" size="sm" onClick={() => {
              navigate('/profile')
            }}>
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <GlobalSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />
      <NotificationsPopup
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        loading={loading}
        error={error}
        markAsRead={markAsRead}
        markAllAsRead={markAllAsRead}
      />
    </>
  );
};