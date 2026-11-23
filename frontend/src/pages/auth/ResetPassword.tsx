import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { appLogo, appName } from '../../utils/constants';
import { RightSidePanel } from '../../components/layout/AuthRightSidePanel';
import { resetPasswordWithOtp } from '../../lib/data/authUser/otpApi';
import toast from 'react-hot-toast';

export const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
    
    const locationState = useLocation().state as
      | { email?: string; reset_token?: string }
      | undefined;
    const resetToken = locationState?.reset_token;

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (!resetToken) {
        return <Navigate to="/forgot-password" replace />;
    }

    const validatePassword = (password: string): string | undefined => {
        if (password.length < 6) {
            return 'Password must be at least 6 characters long';
        }
        if (!password.includes('@')) {
            return 'Password must contain at least one @ symbol';
        }
        if (!/\d/.test(password)) {
            return 'Password must contain at least one digit';
        }
        return undefined;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        setErrors({});

        const passwordError = validatePassword(password);
        if (passwordError) {
            setErrors(prev => ({ ...prev, password: passwordError }));
            return;
        }

        if (password !== confirmPassword) {
            setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
            return;
        }

        if (!resetToken) {
            toast.error('Session expired. Please start forgot password again.');
            navigate('/forgot-password');
            return;
        }

        setLoading(true);
        try {
            let res = await resetPasswordWithOtp({
                reset_token: resetToken,
                new_password: password,
                confirm_password: confirmPassword
            });
            if (res.success) {
                toast.success('Password reset successfully');
                navigate('/login');
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to reset password');
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

                        <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
                        <p className="mt-2 text-sm text-gray-600">
                        We strongly suggest you to create a strong and 
                        rememberable password
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div className="relative">
                                <Input
                                    label="Password"
                                    type={showPassword ? 'text' : 'password'}
                                    icon={<Lock className="h-4 w-4 text-gray-400" />}
                                    placeholder="Password (min 6 chars, 1 @, 1 digit)"
                                    error={errors.password}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ top: errors.password ? '0px' : '25px' }}
                                >
                                    {showPassword ? (
                                        <Eye className="h-4 w-4 text-gray-400" />
                                    ) : (
                                        <EyeOff className="h-4 w-4 text-gray-400" />
                                    )}
                                </button>
                            </div>

                            <div className="relative">
                                <Input
                                    label="Confirm Password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    icon={<Lock className="h-4 w-4 text-gray-400" />}
                                    placeholder="Confirm Password"
                                    error={errors.confirmPassword}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{ top: errors.confirmPassword ? '0px' : '25px' }}
                                >
                                    {showConfirmPassword ? (
                                        <Eye className="h-4 w-4 text-gray-400" />
                                    ) : (
                                        <EyeOff className="h-4 w-4 text-gray-400" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <Button
                                type="submit"
                                className="w-full"
                                loading={loading}
                            >
                                Reset Password
                            </Button>
                        </div>
                    </form>

                </div>
                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0">
                    <div className="flex justify-between items-center px-8 py-4 text-sm text-gray-500">
                        <span>Copyright © 2025 {appName}</span>
                        <Link to="/privacy-policy" className="hover:text-gray-700">Privacy Policy</Link>
                    </div>
                </div>
            </div>

            {/* Right Panel */}
            <RightSidePanel />

        </div>
    );
};