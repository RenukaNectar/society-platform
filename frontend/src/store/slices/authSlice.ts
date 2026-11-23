import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  unauthorizedAttempts: number;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: false,
  loading: false,
  error: null,
  unauthorizedAttempts: 0
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginStop: (state) => {
      state.loading = false;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string; refreshToken: string; }>) => {
      let user = { ...action.payload.user }
      const role = user?.role
      user.role = typeof role === 'object' ? role?.name : role
      user.roleDescription = typeof role === 'object' ? role?.description : undefined
      user.district = user?.district
      user.state = user?.state
      state.loading = false;
      state.user = user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.unauthorizedAttempts = 0;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.unauthorizedAttempts = 0;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    updateToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      localStorage.setItem('token', action.payload);
    },
    incrementUnauthorizedAttempts: (state) => {
      state.unauthorizedAttempts += 1;
    },
    resetUnauthorizedAttempts: (state) => {
      state.unauthorizedAttempts = 0;
    },
  },
});

export const { 
  loginStart, 
  loginStop, 
  loginSuccess, 
  loginFailure, 
  logout, 
  clearError, 
  updateUser, 
  updateToken, 
  incrementUnauthorizedAttempts, 
  resetUnauthorizedAttempts 
} = authSlice.actions;
export default authSlice.reducer;