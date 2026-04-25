/**
 * Status card component for admin dashboard.
 */

import React from 'react';

interface StatusCardProps {
    title: string;
    icon: React.ReactNode;
    status: string;
    value: string;
    subtitle: string;
    color: 'green' | 'yellow' | 'red';
    loading?: boolean;
}

export const StatusCard: React.FC<StatusCardProps> = ({
    title,
    icon,
    status,
    value,
    subtitle,
    color,
    loading,
}) => {
    const colorClasses = {
        green: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400',
        yellow: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-900/20 dark:text-yellow-400',
        red: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-400',
    };

    const dotClasses = {
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        red: 'bg-red-500',
    };

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    {icon}
                    <span className="text-sm font-medium">{title}</span>
                </div>
                <div className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${colorClasses[color]}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[color]}`} />
                    {status}
                </div>
            </div>

            {/* Value */}
            <div className="mb-1">
                {loading ? (
                    <div className="h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                ) : (
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {value}
                    </span>
                )}
            </div>

            {/* Subtitle */}
            {loading ? (
                <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {subtitle}
                </span>
            )}
        </div>
    );
};
