/**
 * API client for system status endpoints.
 */

import { apiClient } from './client';
import { getAdminToken } from './translations';
import type { SystemStatusResponse } from '@/types/system';

/**
 * Create axios config with admin auth header.
 */
function adminAuthConfig() {
    const token = getAdminToken();
    if (!token) {
        throw new Error('Not authenticated');
    }
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
}

/**
 * Get system status for admin dashboard.
 */
export async function getSystemStatus(): Promise<SystemStatusResponse> {
    const response = await apiClient.get<SystemStatusResponse>(
        '/api/admin/system/status',
        adminAuthConfig()
    );
    return response.data;
}
