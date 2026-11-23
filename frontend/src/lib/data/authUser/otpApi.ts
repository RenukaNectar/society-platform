import { api, ApiResponse } from '../../../lib/api';

export interface SendOtpRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
  flow?: 'login' | 'password_reset' | 'email_verification';
}

/** Matches POST /auth/reset-password (reset_token from verify-otp with flow password_reset) */
export interface ResetPasswordRequest {
  reset_token: string;
  new_password: string;
  confirm_password: string;
}

export interface OtpResponse {
  success: boolean;
  message: string;
  data?: any;
  version: string;
  timestamp: string;
}

// Send OTP for password reset
export const sendOtp = async (data: SendOtpRequest): Promise<OtpResponse> => {
  try {
    const response: any = await api.post<OtpResponse>('/auth/send-otp', data);
    return response;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to send OTP');
  }
};

// Verify OTP (uses postReturnBody so 400 responses with message are still readable)
export const verifyOtp = async (data: VerifyOtpRequest): Promise<OtpResponse> => {
  try {
    const response: any = await api.postReturnBody<OtpResponse>('/auth/verify-otp', data);
    return response;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to verify OTP');
  }
};

// Reset password with OTP
export const resetPasswordWithOtp = async (data: ResetPasswordRequest): Promise<OtpResponse> => {
  try {
    const response: any = await api.post<OtpResponse>('/auth/reset-password', data);
    return response;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to reset password');
  }
}; 