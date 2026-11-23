import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { appLogo, appName } from '../../utils/constants';
import { RightSidePanel } from '../../components/layout/AuthRightSidePanel';

export const CheckMail: React.FC = () => {
    const { loading, isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

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

                        <h2 className="text-3xl font-bold text-gray-900">Check Email for Reset Link</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            {`An email has been sent from ${appName}. Check the inbox of your email account and click the reset link to recover you password`}
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={(e) => {
                        e.preventDefault();
                        window.open("https://mail.google.com", "_blank");
                    }}>
                        <div>
                            <Button
                                type="submit"
                                className="w-full"
                                loading={loading}
                            >
                                Open Your Email Account
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