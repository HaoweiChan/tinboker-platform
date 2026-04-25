import {
  getRecommendationsByTicker as apiByTicker,
  getRecommendationsByPodcaster as apiByPodcaster,
  getMostDiscussedTickers as apiBuzz,
} from '@/services/api';
import type { TickerRecommendation, TickerBuzz } from './types';

export const recommendationService = {
  /** Get recommendations for a ticker (default: last 7 days). */
  async getRecommendationsByTicker(
    ticker: string,
    params?: { start_date?: string; end_date?: string }
  ): Promise<TickerRecommendation[]> {
    return apiByTicker(ticker, params);
  },

  /** Get recommendations from a podcaster (default: last 7 days). Pass podcast_slug when available. */
  async getRecommendationsByPodcaster(
    podcasterName: string,
    params?: { start_date?: string; end_date?: string; podcast_slug?: string }
  ): Promise<TickerRecommendation[]> {
    return apiByPodcaster(podcasterName, params);
  },

  /** Get most-discussed tickers in the last N days (default: 30 days, limit 10). */
  async getMostDiscussedTickers(
    days: number = 30,
    limit: number = 10
  ): Promise<TickerBuzz[]> {
    return apiBuzz({ days, limit });
  },
};
