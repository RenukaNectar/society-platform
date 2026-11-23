import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { loginStart, loginStop, loginSuccess, loginFailure, logout, updateToken, incrementUnauthorizedAttempts, resetUnauthorizedAttempts } from '../store/slices/authSlice';
import { fetchPermissionsByRole } from '../store/slices/thunks/permissionThunks';
import { LoginCredentials, RegisterData, User } from '../types';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { setSocietyStatus, clearSocietyStatus } from '../store/slices/societySlice'; 

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const auth = useSelector((state: RootState) => state.auth);

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch(loginStart());
      const res: any = await api.postReturnBody('/auth/login', credentials);

      const payload = res?.data;
      const needsOtp = !!payload?.isOtpRequired;

      if (needsOtp) {
        dispatch(loginStop());
        const verificationFlow = payload?.verificationFlow as string | undefined;
        navigate('/otp-verification', {
          state: {
            email: credentials.email,
            isForgotPassword: false,
            verificationFlow: verificationFlow || 'login',
            otpAlreadySent: true,
          },
        });
        toast.success(res?.message || 'Please verify your OTP.');
        return;
      }

      if (res.success) {
        const userObj = res?.data?.user as User;
        const token = res?.data?.token as string;
        const refreshToken = res?.data?.refreshToken as string;
        dispatch(loginSuccess({ user: userObj, token, refreshToken }));

        const statusKey = res?.data?.society?.status?.key || null;
        dispatch(setSocietyStatus(statusKey));

        try {
          const roleId = userObj?.role_id || (userObj?.role && (userObj.role.id || userObj.role));
          if (roleId) {
            await fetchPermissionsByRole(String(roleId));
          }
        } catch (err) {
          console.error('Failed to fetch permissions on login', err);
        }
        toast.success('Login successful!');
      } else {
        dispatch(loginStop());
        toast.error((res?.message as string) || 'Login failed');
      }
    } catch (error) {
      dispatch(loginFailure(error instanceof Error ? error.message : 'Login failed. Please check your credentials.'));
      toast.error(error instanceof Error ? error.message : 'Login failed. Please check your credentials.');
    }
  };

  const refreshToken = async (): Promise<string | null> => {
    try {
      if (!auth.refreshToken) {
        throw new Error('No refresh token available');
      }

      const res: any = await api.post('/auth/refresh-token', {
        refreshToken: auth.refreshToken
      });

      if (res.success && res.data?.accessToken) {
        const newToken = res.data.accessToken;
        dispatch(updateToken(newToken));
        dispatch(resetUnauthorizedAttempts());
        return newToken;
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      // Check if refresh token is expired
      if (error instanceof Error && error.message.includes('Refresh token expired')) {
        console.warn('Refresh token expired during manual refresh. Logging out user.');
        signOut();
        return null;
      }
      
      // If refresh fails for other reasons, logout the user
      signOut();
      return null;
    }
  };

  const registerUser = async (data: RegisterData) => {
    try {
      dispatch(loginStart());
      const res: any = await api.post('/auth/register', data);
      if(res.success){
        dispatch(loginStop());
        const regPayload = (res as any)?.data;
        navigate('/otp-verification', {
          state: {
            email: data.email,
            isForgotPassword: false,
            verificationFlow: regPayload?.verificationFlow || 'email_verification',
            otpAlreadySent: !!regPayload?.isOtpRequired,
          },
        });
      } else {
        dispatch(loginStop());
        toast.error(res?.message as string);
      }
    } catch (error) {
      dispatch(loginStop());
      toast.error(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    }
  };

  const signOut = () => {
    dispatch(logout());
    dispatch(clearSocietyStatus());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return {
    ...auth,
    login,
    registerUser,
    signOut,
    refreshToken,
  };
};