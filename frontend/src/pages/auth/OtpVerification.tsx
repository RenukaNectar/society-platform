import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { appLogo, appName } from '../../utils/constants';
import { RightSidePanel } from '../../components/layout/AuthRightSidePanel';
import toast from 'react-hot-toast';
import { sendOtp, verifyOtp } from '../../lib/data/authUser/otpApi';
import type { AppDispatch } from '../../store';
import { loginSuccess } from '../../store/slices/authSlice';
import { setSocietyStatus } from '../../store/slices/societySlice';
import { fetchPermissionsByRole } from '../../store/slices/thunks/permissionThunks';
import type { User } from '../../types';

export const OtpVerification: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false)
  const inputRefs = [useRef<HTMLInputElement>(null), useRef(null), useRef(null), useRef(null)];
  const { email, isForgotPassword, verificationFlow, otpAlreadySent } =
    (useLocation().state || {}) as {
      email?: string;
      isForgotPassword?: boolean;
      verificationFlow?: string;
      otpAlreadySent?: boolean;
    };

  useEffect(() => {
    if (!email) {
      navigate(-1);
    }
  }, [email]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length === 1 && index < inputRefs.length - 1) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const isBackspace = e.key === 'Backspace';
    const currentInput = inputRefs[index].current;

    if (isBackspace && currentInput?.value === '' && index > 0) {
      const prevInput = inputRefs[index - 1].current;
      prevInput?.focus();
      prevInput!.value = '';
      e.preventDefault(); // prevent default cursor behavior
    }
  };

  const handleSendOtp = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res: any = await sendOtp({ email });
      if (res.success) {
        toast.success('OTP sent successfully');
      } else {
        toast.error(res?.message as string);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (email && !isForgotPassword && !otpAlreadySent) {
      handleSendOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount for initial send
  }, []);

  const handleVerifyOtp = async () => {
    const otp = inputRefs.map(ref => ref.current?.value).join('');

    if (otp.length !== 4) {
      toast.error('Please enter a 4-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const verifyFlow =
        isForgotPassword
          ? 'password_reset'
          : verificationFlow === 'email_verification'
            ? 'email_verification'
            : 'login';

      const res: any = await verifyOtp({ email, otp, flow: verifyFlow });
      if (res.success) {
        if (verifyFlow === 'login' && res.data?.token && res.data?.user) {
          const userObj = res.data.user as User;
          dispatch(
            loginSuccess({
              user: userObj,
              token: res.data.token,
              refreshToken: res.data.refreshToken,
            })
          );
          const statusKey = res.data?.society?.status?.key ?? null;
          dispatch(setSocietyStatus(statusKey));
          try {
            const roleId =
              userObj?.role_id ||
              (userObj?.role && ((userObj.role as { id?: string }).id || userObj.role));
            if (roleId) {
              await fetchPermissionsByRole(String(roleId));
            }
          } catch (err) {
            console.error('Failed to fetch permissions after OTP login', err);
          }
          toast.success('Login successful!');
          navigate('/');
          return;
        }
        toast.success('OTP verified successfully');
        if (isForgotPassword) {
          const resetToken =
            res.data?.reset_token ?? res.data?.resetToken;
          if (!resetToken) {
            toast.error('Missing reset token. Please try again.');
            navigate('/forgot-password');
            return;
          }
          navigate('/reset-password', {
            state: { email, reset_token: resetToken },
          });
        } else if (verifyFlow === 'email_verification') {
          navigate('/login');
        } else {
          navigate('/login');
        }
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error('Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-20 xl:px-24 relative">
        <div className="mx-auto w-full max-w-sm lg:w-96 z-10">
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-40 h-40 rounded-full overflow-hidden shrink-0">
                <img src={appLogo} alt={appName} className="w-full h-full object-cover" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900">Account Verification</h2>
            <p className="mt-2 text-sm text-gray-600">
              {verificationFlow === 'email_verification'
                ? 'Enter the verification code sent to your registered email address.'
                : 'We have sent you a code on your registered email address.'}
            </p>
            {isForgotPassword && <p className="mt-2 text-sm text-gray-600 flex items-center justify-center gap-2">
              Click to change mobile number?{' '}
              <div
                className="font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer"
                onClick={() => navigate('/forgot-password')}
              >
                Change Number
              </div>
            </p>}
          </div>

          <div className="space-y-6">
            <div className="flex justify-between gap-3 pb-5 mb-5">
              {inputRefs.map((ref, index) => (
                <input
                  key={index}
                  ref={ref}
                  type="text"
                  maxLength={1}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoFocus={index == 0}
                  className="w-12 h-12 text-center text-lg border-b-2 border-gray-300 focus:outline-none focus:border-indigo-500"
                  onChange={(e) => handleChange(index, e)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                />
              ))}
            </div>

            <div>
              <Button
                type="button"
                className="w-full"
                loading={loading}
                onClick={handleVerifyOtp}
              >
                Verify Code
              </Button>
            </div>

            <div className="text-center">
              <span className="text-sm text-gray-600 flex items-center justify-center gap-2">
                Didn’t receive code?{' '}
                <div className="font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer" onClick={handleSendOtp}>
                  Resend
                </div>
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="flex justify-between items-center px-8 py-4 text-sm text-gray-500">
            <span>Copyright © 2025 {appName}</span>
            <Link to="/privacy-policy" className="hover:text-gray-700">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <RightSidePanel />
    </div>
  );
};
