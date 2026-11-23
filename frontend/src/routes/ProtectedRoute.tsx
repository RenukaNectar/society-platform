import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { loginSuccess } from '../store/slices/authSlice';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  adminOnly = false,
}) => {
  const dispatch = useDispatch();
  const location = useLocation();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      if (userData && token) {
        const parsedUser = JSON.parse(userData);
        dispatch(loginSuccess({ user: parsedUser, token, refreshToken: refreshToken || '' }));
        setUser(parsedUser);
      }
      setLoading(false);
    };
    getData();
  }, []);

  if (loading) return null;

  if (!user || (adminOnly && user?.role !== 'admin')) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
