import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { appLogo, appName } from '../../utils/constants';
import { RightSidePanel } from '../../components/layout/AuthRightSidePanel';
import { sendOtp } from '../../lib/data/authUser/otpApi';
import toast from 'react-hot-toast';

export const ForgotPassword: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const handleSendOtp = async () => {
        if (!email) {
            setError('Please enter an email address');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            await sendOtp({ email });
            toast.success('OTP sent successfully');
            navigate('/otp-verification', { state: { email, isForgotPassword: true } });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to send OTP');
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

                        <h2 className="text-3xl font-bold text-gray-900">Account Recovery</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Please enter the email address you’d like your password reset information sent to.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <Input
                                label="Email"
                                type="email"
                                icon={<Mail className="h-4 w-4 text-gray-400" />}
                                placeholder="example@gmail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            {error && <p className="text-sm text-red-500">
                                {error}
                            </p>}
                        </div>

                        <div>
                            <Button
                                type="button"
                                className="w-full"
                                loading={loading}
                                onClick={handleSendOtp}
                            >
                                Send Code
                            </Button>
                        </div>

                        <div className="text-center">
                            <span className="text-sm text-gray-600">
                                Know your password?{' '}
                                <Link
                                    to="/login"
                                    className="font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                    Login
                                </Link>
                            </span>
                        </div>
                    </div>
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