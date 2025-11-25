'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { postLoginRequest } from '@/app/admin/global/client/api';
import { useUser } from '@/app/admin/lib/contexts/UserContext';
import Button from '@/app/admin/components/ui/Button';
import Input from '@/app/admin/components/ui/Input';
import { DEFAULT_LANGUAGE } from '@/app/admin/global/config/config';

interface FormData {
  username: string;
  password: string;
}

interface FormErrors {
  username?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { dispatch } = useUser();
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await postLoginRequest(DEFAULT_LANGUAGE, {
        username: formData.username.trim(),
        password: formData.password
      });

      if (response.statusCode) {
        dispatch({ 
          type: 'SET_USER', 
          payload: response.data.user 
        });
        
        const tokenData = {
          token: response.data.token,
          expires_at: response.data.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          token_type: response.data.token_type || 'Bearer'
        };
        
        const { setAuthToken } = await import('@/app/admin/global/core/auth');
        setAuthToken(tokenData);
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        
        router.push('/admin/captions');
      } else {
        const errorMessage = response.errors?.[0]?.message || 'Invalid username or password. Please try again.';
        
        if (errorMessage.toLowerCase().includes('username')) {
          setErrors({ username: errorMessage });
        } else {
          setErrors({ general: errorMessage });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred. Please try again.';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setErrors({ general: 'Unable to connect to the server. Please check your internet connection and try again.' });
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SmartSoft Admin
          </h1>
          <p className="text-gray-600">
            Sign in to access your dashboard
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange('username')}
                placeholder="Enter your username"
                error={errors.username}
                disabled={isLoading}
              />
            </div>

            <div>
              <Input
                id="password"
                type="password"
                label="Password"
                value={formData.password}
                onChange={handleInputChange('password')}
                placeholder="Enter your password"
                error={errors.password}
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </div>


        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link 
              href="/admin/register" 
              className="font-medium text-primary hover:text-primary-dark transition-colors"
            >
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}