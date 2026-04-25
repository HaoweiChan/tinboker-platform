/**
 * Admin login form component.
 * Simple password-based authentication for admin UI.
 */

import React, { useState } from 'react';
import { adminLogin, isAdminAuthenticated } from '@/services/api/translations';

interface AdminLoginProps {
  onSuccess?: () => void;
  className?: string;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onSuccess,
  className = '',
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await adminLogin(password);
      onSuccess?.();
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Incorrect password');
      } else {
        setError('Login failed, please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  // If already authenticated, show nothing (caller should handle redirect)
  if (isAdminAuthenticated()) {
    return null;
  }

  return (
    <div className={`flex min-h-[400px] items-center justify-center ${className}`}>
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-6 text-center text-2xl font-semibold text-gray-900 dark:text-white">
          Admin Login
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-password"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              required
              autoFocus
            />
          </div>
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-800"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};
