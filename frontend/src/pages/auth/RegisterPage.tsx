import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { RegisterData } from '../../types';
import { registerSchemaWithoutAuth } from '../../utils/validation';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { appLogo, appName } from '../../utils/constants';
import { RightSidePanel } from '../../components/layout/AuthRightSidePanel';

export const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { registerUser, loading, isAuthenticated } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterData & { first_name: string; last_name: string; phone: string }>({
    resolver: zodResolver(registerSchemaWithoutAuth),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
      password: '',
      confirm_password: '',
      email: '',
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (data: RegisterData) => {
    await registerUser({...data, confirm_password: data.password, phone: data.phone});
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

            <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
            <p className="mt-2 text-sm text-gray-600">
              Or{' '}
              <Link
                to="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                sign in to your account
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <Input
                label="First Name"
                type="text"
                icon={<User className="h-4 w-4 text-gray-400" />}
                placeholder="First Name"
                error={errors.first_name?.message}
                {...register('first_name')}
              />

              <Input
                label="Last Name"
                type="text"
                icon={<User className="h-4 w-4 text-gray-400" />}
                placeholder="Last Name"
                error={errors.last_name?.message}
                {...register('last_name')}
              />

              <Input
                label="Email Address"
                type="email"
                icon={<Mail className="h-4 w-4 text-gray-400" />}
                placeholder="john@example.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Mobile Number"
                type="text"
                icon={<Phone className="h-4 w-4 text-gray-400" />}
                placeholder="Mobile number"
                error={errors.phone?.message}
                {...register('phone')}
                maxLength={10}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 10) {
                    e.target.value = value;
                  }
                }}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  icon={<Lock className="h-4 w-4 text-gray-400" />}
                  placeholder="Password"
                  error={errors.password?.message}
                  {...register('password')}
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
                  error={errors.confirm_password?.message}
                  {...register('confirm_password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ top: errors.confirm_password ? '0px' : '25px' }}
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
                Create Account
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