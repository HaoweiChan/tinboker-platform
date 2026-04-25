import { apiClient } from './client';
import { useAppStore } from '@/store/useAppStore';

export interface NotificationPreferences {
  new_episodes: boolean;
  stock_mentions: boolean;
  price_alerts: boolean;
  daily_digest: boolean;
}

export interface UpdateNotificationPreferencesRequest {
  new_episodes?: boolean;
  stock_mentions?: boolean;
  price_alerts?: boolean;
  daily_digest?: boolean;
}

export const userSettingsApi = {
  /**
   * Get user's notification preferences
   */
  getNotificationPreferences: async (): Promise<NotificationPreferences> => {
    const token = useAppStore.getState().token;
    if (!token) throw new Error('Not authenticated');
    const response = await apiClient.get<NotificationPreferences>(
      '/api/user/notification-preferences',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  /**
   * Update user's notification preferences
   */
  updateNotificationPreferences: async (
    updates: UpdateNotificationPreferencesRequest
  ): Promise<NotificationPreferences> => {
    const token = useAppStore.getState().token;
    if (!token) throw new Error('Not authenticated');
    const response = await apiClient.put<NotificationPreferences>(
      '/api/user/notification-preferences',
      updates,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },
};
