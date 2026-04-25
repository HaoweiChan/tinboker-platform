import { apiClient } from './client';

export interface ClickEvent {
    type: 'podcast' | 'stock' | 'episode';
    id: string; // "gooaye", "2330", etc.
}

/**
 * Track user interaction (click) for trending algorithms.
 * Fire-and-forget.
 */
export const trackClick = async (event: ClickEvent): Promise<void> => {
    try {
        await apiClient.post('/api/analytics/click', event);
    } catch (error) {
        // Silently fail for analytics
        if (import.meta.env.DEV) {
            console.warn('[Analytics] Failed to track click:', error);
        }
    }
};
