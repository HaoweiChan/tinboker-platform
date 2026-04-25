/**
 * API Service Functions
 * 
 * Functions for calling backend API endpoints defined in OpenAPI spec.
 * Each function handles the HTTP request and returns typed data.
 */

import { apiClient } from './client';
import type {
  CompanyDetail,
  ConceptMetadata,
  ContentAsset,
  ContentIndexResponse,
  GraphData,
  StockEvent,
  TimeframeOption,
  TickerRecommendation,
  TickerBuzz,
} from '../types';
import {
  GraphResponseSchema,
  CompanyDetailSchema,
  EventsResponseSchema,
  StockEventSchema,
  InteractiveModelsResponseSchema,
  parseResponse,
} from '../../validation/schemas';

// ============================================
// Graph Endpoints
// ============================================

/**
 * Get sorted graphs list
 * @param sortBy Sort field (concept_id, created_at, updated_at), default: concept_id
 */
export async function getSortedGraphs(sortBy: string = 'concept_id'): Promise<any[]> {
  const response = await apiClient.get('/api/graphs', {
    params: { sort_by: sortBy },
  });
  // OpenAPI spec shows this returns an array directly, not wrapped
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Create new graph
 * @param data Graph creation data
 */
export async function createGraph(data: {
  conceptId: string;
  nodes: Array<{
    id: string;
    type?: string;
    label: string;
    ticker: string;
    marketCapTier: string;
    positionX: number;
    positionY: number;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label: string;
    category: string;
  }>;
}): Promise<void> {
  await apiClient.post('/api/graphs', data);
}

/**
 * Get graph by ID
 * @param graphId Graph ID
 */
export async function getGraphById(graphId: string): Promise<GraphData> {
  const response = await apiClient.get(`/api/graphs/${graphId}`);
  const validated = parseResponse(GraphResponseSchema, response.data);
  return validated.data;
}

/**
 * Delete graph
 * @param graphId Graph ID
 */
export async function deleteGraph(graphId: string): Promise<void> {
  await apiClient.delete(`/api/graphs/${graphId}`);
}

/**
 * Modify node in graph
 * @param graphId Graph ID
 * @param nodeId Node ID
 * @param data Node update data (all fields optional)
 */
export async function modifyNode(
  graphId: string,
  nodeId: string,
  data: {
    label?: string | null;
    ticker?: string | null;
    marketCapTier?: string | null;
    positionX?: number | null;
    positionY?: number | null;
  }
): Promise<void> {
  await apiClient.put(`/api/graphs/${graphId}/nodes/${nodeId}`, data);
}

/**
 * Delete node from graph
 * @param graphId Graph ID
 * @param nodeId Node ID
 */
export async function deleteNode(graphId: string, nodeId: string): Promise<void> {
  await apiClient.delete(`/api/graphs/${graphId}/nodes/${nodeId}`);
}

/**
 * Modify edge in graph
 * @param graphId Graph ID
 * @param edgeId Edge ID
 * @param data Edge update data (all fields optional)
 */
export async function modifyEdge(
  graphId: string,
  edgeId: string,
  data: {
    source?: string | null;
    target?: string | null;
    label?: string | null;
    category?: string | null;
  }
): Promise<void> {
  await apiClient.put(`/api/graphs/${graphId}/edges/${edgeId}`, data);
}

/**
 * Delete edge from graph
 * @param graphId Graph ID
 * @param edgeId Edge ID
 */
export async function deleteEdge(graphId: string, edgeId: string): Promise<void> {
  await apiClient.delete(`/api/graphs/${graphId}/edges/${edgeId}`);
}

// ============================================
// Stock Endpoints
// ============================================

/**
 * Get sorted stocks list
 * @param options Query options
 * @param options.sortBy Sort field (ticker, name, price, change_percent, market_cap), default: ticker
 * @param options.q Search query to filter by ticker or name (case-insensitive)
 * @param options.limit Maximum number of stocks to return (1-200), default: 50
 */
export async function getSortedStocks(options?: {
  sortBy?: string;
  q?: string;
  limit?: number;
}): Promise<any[]> {
  const params: Record<string, any> = {};
  if (options?.sortBy) params.sort_by = options.sortBy;
  if (options?.q) params.q = options.q;
  if (options?.limit) params.limit = options.limit;

  const response = await apiClient.get('/api/stocks', { params });
  // OpenAPI spec shows this returns an array directly, not wrapped
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Get stock by ticker
 * @param ticker Stock ticker symbol
 * @param timeframe Optional timeframe filter:
 *   - 1H: Last 1 hour (minute-level granularity, ~60-120 data points)
 *   - 1D: Last 24 hours (minute-level granularity, ~390-1440 data points)
 *   - 1W: Last 7 days (daily granularity)
 *   - 1M: Last 30 days (daily granularity)
 *   - 3M: Last 90 days (daily granularity)
 *   - 6M: Last 180 days (daily granularity)
 *   - 1Y: Last 365 days (daily granularity)
 *   - YTD: Year to date (from January 1st, daily granularity)
 *   - ALL: All available data (default, daily granularity)
 * 
 * Note: 1H and 1D timeframes provide minute-level aggregates for intraday charting.
 * Due to API limitations, these may use yesterday's data (last trading day).
 * @param options.silent If true, suppress error toasts
 * @param options.before Optional Unix timestamp (ms). Fetch data ending before this time for infinite scroll.
 */
export async function getStockByTicker(ticker: string, timeframe?: TimeframeOption, options?: { silent?: boolean; before?: number }): Promise<CompanyDetail> {
  const params: Record<string, any> = {};
  if (timeframe) params.timeframe = timeframe;
  if (options?.before) params.before = options.before;

  const config: any = { params };

  if (options?.silent) {
    config.headers = { 'X-Silent-Error': 'true' };
  }

  const response = await apiClient.get(`/api/stocks/${ticker}`, config);

  // Debug: Log raw response before validation
  if (import.meta.env.DEV) {
    console.log('[API] getStockByTicker raw response:', {
      ticker,
      rawData: response.data,
      price: response.data?.price,
      priceType: typeof response.data?.price,
      hasPrice: 'price' in (response.data || {}),
      dataKeys: response.data ? Object.keys(response.data) : [],
      // Check for alternative price fields
      currentPrice: response.data?.current_price,
      lastPrice: response.data?.last_price,
      closePrice: response.data?.close_price,
      latestPrice: response.data?.latest_price,
      // Check chartData for latest price
      chartDataLastPrice: response.data?.chartData && Array.isArray(response.data.chartData) && response.data.chartData.length > 0
        ? response.data.chartData[response.data.chartData.length - 1]?.price
        : undefined,
      // Full response structure
      fullResponse: JSON.stringify(response.data, null, 2)
    });
  }

  // API returns CompanyDetail directly, not wrapped in { data: {...}, timestamp: "..." }
  let validated = parseResponse(CompanyDetailSchema, response.data);

  // Root cause fix: Backend returns price: 0, but actual price is in chartData
  // Use the last chartData entry's price if root price is 0
  if (validated.price === 0 && validated.chartData && validated.chartData.length > 0) {
    const lastDataPoint = validated.chartData[validated.chartData.length - 1];
    if (lastDataPoint?.price && lastDataPoint.price > 0) {
      if (import.meta.env.DEV) {
        console.warn('[API] getStockByTicker: Root price is 0, using price from chartData:', {
          ticker,
          rootPrice: validated.price,
          chartDataPrice: lastDataPoint.price
        });
      }
      // Update the validated object with the correct price
      validated = {
        ...validated,
        price: lastDataPoint.price
      };
    }
  }

  if (import.meta.env.DEV) {
    console.log('[API] getStockByTicker validated:', {
      ticker,
      price: validated.price,
      priceType: typeof validated.price
    });
  }

  return validated;
}

/**
 * Get basic stock information only (no chart data)
 * @param ticker Stock ticker symbol
 */
export async function getStockBasicInfo(ticker: string): Promise<any> {
  const response = await apiClient.get(`/api/stocks/${ticker}/basic`);
  // OpenAPI spec shows empty schema, return raw data
  return response.data;
}

// ============================================
// News Endpoints
// ============================================

/**
 * Get sorted news list
 * @param sortBy Sort field (date, created_at, updated_at, title), default: date
 */
export async function getSortedNews(sortBy: string = 'date'): Promise<StockEvent[]> {
  const response = await apiClient.get('/api/news', {
    params: { sort_by: sortBy },
  });
  // API returns array directly, not wrapped in { data: [...], timestamp: "..." }
  if (Array.isArray(response.data)) {
    // Validate each item in the array
    return response.data.map((item: any) => parseResponse(StockEventSchema, item));
  }
  // Fallback: try wrapped format if API changes
  const validated = parseResponse(EventsResponseSchema, response.data);
  return validated.data;
}

/**
 * Get news by ID
 * @param newsId News ID
 */
export async function getNewsById(newsId: string): Promise<StockEvent> {
  const response = await apiClient.get(`/api/news/${newsId}`);
  // OpenAPI spec shows StockEvent directly, but may be wrapped
  if (response.data.data) {
    return response.data.data;
  }
  return response.data;
}

/**
 * Fetch news from Massive API for a ticker
 * @param ticker Stock ticker symbol
 * @param limit Maximum number of articles to fetch, default: 10
 */
export async function fetchNewsFromMassive(
  ticker: string,
  limit: number = 10
): Promise<any> {
  const response = await apiClient.post(`/api/news/fetch/${ticker}`, null, {
    params: { limit },
  });
  return response.data;
}

// ============================================
// Content Endpoints
// ============================================

export async function getContentIndex(): Promise<ContentIndexResponse> {
  const response = await apiClient.get('/api/content/index');
  if (response.data && Array.isArray((response.data as ContentIndexResponse).tickers)) {
    return response.data as ContentIndexResponse;
  }
  if (Array.isArray(response.data)) {
    return { tickers: response.data as string[] };
  }
  return { tickers: [] };
}

export async function getContentByTicker(ticker: string): Promise<ContentAsset> {
  const response = await apiClient.get(`/api/content/${ticker}`);
  const data = response.data as Partial<ContentAsset> | undefined;
  if (!data || !data.svg_url || !data.article_url) {
    throw new Error('Content asset missing required URLs');
  }
  return {
    ticker: data.ticker || ticker,
    svg_url: data.svg_url,
    article_url: data.article_url,
    ttl_seconds: typeof data.ttl_seconds === 'number' ? data.ttl_seconds : 0,
  };
}

// ============================================
// Visual Endpoints
// ============================================

/**
 * Get supply chain visualization graph
 */
export async function getSupplyChainVisual(): Promise<GraphData> {
  try {
    // Visual endpoints may take longer, use extended timeout
    // But not too long - if it takes more than 30 seconds, it's likely not working
    const response = await apiClient.get('/api/visuals/supply-chain', {
      timeout: 30000, // 30 seconds - reasonable timeout for visual endpoints
    });

    if (import.meta.env.DEV) {
      console.log('[API] getSupplyChainVisual - Full response object:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        dataKeys: response.data ? Object.keys(response.data) : 'null/undefined',
      });
    }

    return processGraphDataResponse(response.data);
  } catch (error: any) {
    // Handle network errors - sometimes data is in error.response.data
    if (error.response && error.response.data) {
      if (import.meta.env.DEV) {
        console.warn('[API] getSupplyChainVisual - Error but found data in error.response.data:', error.response.data);
      }
      return processGraphDataResponse(error.response.data);
    }

    // Check if data is in error.request.response (CORS issues sometimes put data here)
    if (error.request && error.request.response) {
      try {
        const responseData = JSON.parse(error.request.response);
        if (import.meta.env.DEV) {
          console.warn('[API] getSupplyChainVisual - Found data in error.request.response:', responseData);
        }
        return processGraphDataResponse(responseData);
      } catch (parseError) {
        // Not JSON, rethrow original error
      }
    }

    throw error;
  }
}

function processGraphDataResponse(data: any): GraphData {
  // Check if response.data exists
  if (!data) {
    console.error('[API] processGraphDataResponse - data is null/undefined');
    throw new Error('API returned empty response');
  }

  if (import.meta.env.DEV) {
    console.log('[API] processGraphDataResponse - Raw data structure:', {
      hasData: !!data,
      hasDataData: !!(data && data.data),
      hasNodes: !!(data && data.nodes),
      hasEdges: !!(data && data.edges),
      dataKeys: data ? Object.keys(data) : [],
      dataDataKeys: data?.data ? Object.keys(data.data) : [],
      dataDataNodes: Array.isArray(data?.data?.nodes) ? data.data.nodes.length : 'not array',
      dataDataEdges: Array.isArray(data?.data?.edges) ? data.data.edges.length : 'not array',
    });
  }

  // OpenAPI spec shows empty schema, but should return GraphData
  // Handle different response formats:
  // 1. Wrapped: { data: { nodes: [...], edges: [...] }, timestamp: "..." }
  // 2. Direct: { nodes: [...], edges: [...] }

  // Check wrapped format first (most common)
  if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    // Check if data.data has nodes and edges arrays
    if (Array.isArray(data.data.nodes) && Array.isArray(data.data.edges)) {
      try {
        // Try to validate with schema first
        const validated = parseResponse(GraphResponseSchema, data);
        if (import.meta.env.DEV) {
          console.log('[API] processGraphDataResponse - Using wrapped format (validated), nodes:', validated.data.nodes.length, 'edges:', validated.data.edges.length);
        }
        return validated.data;
      } catch (error) {
        // If validation fails but data structure is correct, use it directly
        console.warn('[API] Schema validation failed, but data structure looks correct, using direct access:', error);
        if (import.meta.env.DEV) {
          console.log('[API] processGraphDataResponse - Using wrapped format (direct access), nodes:', data.data.nodes.length, 'edges:', data.data.edges.length);
        }
        return {
          nodes: data.data.nodes,
          edges: data.data.edges,
        } as GraphData;
      }
    }
  }

  // Direct format: { nodes: [...], edges: [...] }
  if (Array.isArray(data.nodes) && Array.isArray(data.edges)) {
    if (import.meta.env.DEV) {
      console.log('[API] processGraphDataResponse - Using direct format, nodes:', data.nodes.length, 'edges:', data.edges.length);
    }
    return {
      nodes: data.nodes,
      edges: data.edges,
    } as GraphData;
  }

  // If neither format matches, log and return empty
  console.error('[API] Unexpected response format:', {
    data: data,
    hasData: !!data,
    hasDataData: !!(data && data.data),
    hasNodes: !!(data && data.nodes),
    hasEdges: !!(data && data.edges),
    dataDataHasNodes: !!(data?.data?.nodes),
    dataDataHasEdges: !!(data?.data?.edges),
    dataDataNodesIsArray: Array.isArray(data?.data?.nodes),
    dataDataEdgesIsArray: Array.isArray(data?.data?.edges),
    nodesIsArray: Array.isArray(data?.nodes),
    edgesIsArray: Array.isArray(data?.edges),
  });
  throw new Error('Invalid response format: expected GraphData with nodes and edges');
}

/**
 * Get ownership tree visualization graph
 */
export async function getOwnershipVisual(): Promise<GraphData> {
  try {
    // Visual endpoints may take longer, use extended timeout
    const response = await apiClient.get('/api/visuals/ownership', {
      timeout: 30000, // 30 seconds - reasonable timeout for visual endpoints
    });

    if (import.meta.env.DEV) {
      console.log('[API] getOwnershipVisual response:', response.data);
    }

    return processGraphDataResponse(response.data);
  } catch (error: any) {
    // Handle network errors - sometimes data is in error.response.data
    if (error.response && error.response.data) {
      if (import.meta.env.DEV) {
        console.warn('[API] getOwnershipVisual - Error but found data in error.response.data:', error.response.data);
      }
      return processGraphDataResponse(error.response.data);
    }

    // Check if data is in error.request.response (CORS issues sometimes put data here)
    if (error.request && error.request.response) {
      try {
        const responseData = JSON.parse(error.request.response);
        if (import.meta.env.DEV) {
          console.warn('[API] getOwnershipVisual - Found data in error.request.response:', responseData);
        }
        return processGraphDataResponse(responseData);
      } catch (parseError) {
        // Not JSON, rethrow original error
      }
    }

    throw error;
  }
}

/**
 * Get cluster visualization graph
 */
export async function getClusterVisual(): Promise<GraphData> {
  try {
    // Visual endpoints may take longer, use extended timeout
    const response = await apiClient.get('/api/visuals/cluster', {
      timeout: 30000, // 30 seconds - reasonable timeout for visual endpoints
    });

    if (import.meta.env.DEV) {
      console.log('[API] getClusterVisual response:', response.data);
    }

    return processGraphDataResponse(response.data);
  } catch (error: any) {
    // Handle network errors - sometimes data is in error.response.data
    if (error.response && error.response.data) {
      if (import.meta.env.DEV) {
        console.warn('[API] getClusterVisual - Error but found data in error.response.data:', error.response.data);
      }
      return processGraphDataResponse(error.response.data);
    }

    // Check if data is in error.request.response (CORS issues sometimes put data here)
    if (error.request && error.request.response) {
      try {
        const responseData = JSON.parse(error.request.response);
        if (import.meta.env.DEV) {
          console.warn('[API] getClusterVisual - Found data in error.request.response:', responseData);
        }
        return processGraphDataResponse(responseData);
      } catch (parseError) {
        // Not JSON, rethrow original error
      }
    }

    throw error;
  }
}

/**
 * Get interactive models
 */
export async function getInteractiveModels(): Promise<any[]> {
  const response = await apiClient.get('/api/visuals/interactive-models');
  // OpenAPI spec shows empty schema, but should return InteractiveModelData[]
  if (response.data.data) {
    const validated = parseResponse(InteractiveModelsResponseSchema, response.data);
    return validated.data;
  }
  // If it's already an array, return it
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return [];
}

// ============================================
// Podcast Endpoints
// ============================================

/**
 * Podcast metadata from backend API
 */
export interface Podcast {
  id: string;
  name: string;
  episode_count: number;
  created_at?: number | null;
  updated_at?: number | null;
  image_url?: string | null;
}

/**
 * Episode data from backend API
 */
export interface Episode {
  id: string;
  podcast_name: string;
  episode_title?: string | null;
  episode_number?: number | null;
  transcript: string;
  summary_content: string;
  summary_image: string;
  related_tickers: string[];
  tags?: string[]; // Tags field from backend
  created_time: number;
  number_click?: number;
  num_likes?: number;
  raw_mp3?: string | null;
  spotify_url?: string | null; // Spotify episode URL
  spotify_id?: string | null; // Spotify episode ID
  spotify_embed_url?: string | null; // Spotify embed URL
  spotify_release_date?: string | number | null; // Spotify release date (ISO string or timestamp)
  spotify_images?: string[] | null; // Spotify episode images (array of image URLs, typically smallest to largest)
  spotify_description?: string | null; // Spotify episode description
  // Additional markdown content fields
  events_markdown_content?: string | null;
  sentences_markdown_content?: string | null;
  events_markdown_url?: string | null;
  sentences_markdown_url?: string | null;
  events_markdown_public_url?: string | null;
  sentences_markdown_public_url?: string | null;
  marp_markdown_content?: string | null;
  ticker_marp_markdown_content?: string | null; // Ticker-specific Marp markdown content
  // Ticker recommendations fields
  ticker_recommendations_content?: string | null; // JSON string containing ticker recommendations
  ticker_recommendations_public_url?: string | null; // Public URL for ticker recommendations
  key_insights?: string[] | null;
  // Modified summary fields
  modified_summary_url?: string | null;
  modified_summary_content?: string | null;
  modified_by?: string | null;
  modified_at?: number | null;
}

/**
 * Tag data from backend API
 */
export interface Tag {
  id: string;
  name: string;
  episode_count: number;
}

/**
 * Tags response from backend API
 */
export interface TagsResponse {
  tags: Tag[];
}

/**
 * Episodes by tag response from backend API
 */
export interface EpisodesByTagResponse {
  tag: string;
  episodes: Episode[];
  total: number;
}

/**
 * Market index data from backend API
 */
export interface MarketIndex {
  id: string;
  name: string;
  ticker: string;
  value: string;
  change: string;
  isPositive: boolean;
}

/**
 * Top mover data from backend API
 */
export interface TopMover {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  icon_url?: string;
  sparkline?: number[];
}

/**
 * Get sorted podcasts list
 * @param options Query options
 */
export async function getSortedPodcasts(options?: {
  sortBy?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}): Promise<Podcast[]> {
  const params: Record<string, any> = {};
  if (options?.sortBy) params.sort_by = options.sortBy;
  if (options?.order) params.order = options.order;
  if (options?.limit) params.limit = options.limit;
  if (options?.offset) params.offset = options.offset;

  const response = await apiClient.get('/api/podcast', { params });
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Get podcast by name
 * @param podcastName Podcast name
 */
export async function getPodcastByName(podcastName: string): Promise<Podcast> {
  const response = await apiClient.get(`/api/podcast/${encodeURIComponent(podcastName)}`);
  return response.data;
}

/**
 * Get episodes for a podcast
 * @param podcastName Podcast name
 * @param options Query options
 */
export async function getPodcastEpisodes(
  podcastName: string,
  options?: {
    sortBy?: string;
    order?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
    includeContent?: boolean;
  }
): Promise<Episode[]> {
  const params: Record<string, any> = {};
  if (options?.sortBy) params.sort_by = options.sortBy;
  if (options?.order) params.order = options.order;
  if (options?.limit) params.limit = options.limit;
  if (options?.offset) params.offset = options.offset;
  if (options?.includeContent !== undefined) params.include_content = options.includeContent;

  const response = await apiClient.get(
    `/api/podcast/${encodeURIComponent(podcastName)}/episodes`,
    { params }
  );
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Get specific episode by ID
 * @param podcastName Podcast name
 * @param episodeId Episode ID
 */
export async function getEpisodeById(podcastName: string, episodeId: string): Promise<Episode> {
  const response = await apiClient.get(
    `/api/podcast/${encodeURIComponent(podcastName)}/episodes/${episodeId}`
  );
  return response.data;
}

/**
 * Trigger episode summary regeneration
 * @param podcastName Podcast name
 * @param episodeId Episode ID
 * @returns Status message
 */
export async function regenerateEpisodeSummary(
  podcastName: string,
  episodeId: string
): Promise<{ status: string; message: string }> {
  const response = await apiClient.post(
    `/api/podcast/${encodeURIComponent(podcastName)}/episodes/${episodeId}/regenerate`
  );
  return response.data;
}

/**
 * Get episodes by ticker
 * @param ticker Stock ticker symbol
 * @param options Query options
 * @param options.limit Maximum number of episodes to return (1-200), default: 50
 * @param options.offset Pagination offset, default: 0
 */
export async function getEpisodesByTicker(
  ticker: string,
  options?: { limit?: number; offset?: number; sortBy?: string; order?: 'asc' | 'desc'; includeContent?: boolean }
): Promise<Episode[]> {
  const params: Record<string, any> = {};
  if (options?.limit) params.limit = options.limit;
  if (options?.offset) params.offset = options.offset;
  if (options?.sortBy) params.sort_by = options.sortBy;
  if (options?.order) params.order = options.order;
  if (options?.includeContent !== undefined) params.include_content = options.includeContent;

  // Convert ticker to lowercase to match backend storage format
  const normalizedTicker = ticker.toLowerCase();
  const response = await apiClient.get(`/api/episodes/by-ticker/${normalizedTicker}`, { params });

  // Handle different response formats:
  // 1. Direct array: [episode1, episode2, ...]
  // 2. Wrapped object: { ticker: "BLK", episodes: [...], total: 1 }
  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (response.data && typeof response.data === 'object' && Array.isArray(response.data.episodes)) {
    return response.data.episodes;
  }

  return [];
}

/**
 * Get recommendations by ticker (default: last 7 days).
 */
export async function getRecommendationsByTicker(
  ticker: string,
  params?: { start_date?: string; end_date?: string }
): Promise<TickerRecommendation[]> {
  const q: Record<string, string> = {};
  if (params?.start_date) q.start_date = params.start_date;
  if (params?.end_date) q.end_date = params.end_date;
  const response = await apiClient.get(`/api/recommendations/by-ticker/${encodeURIComponent(ticker)}`, {
    params: Object.keys(q).length ? q : undefined,
  });
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Get recommendations by podcaster (default: last 7 days).
 * Pass podcast_slug when available to also match by episode_id (e.g. slug in id).
 */
export async function getRecommendationsByPodcaster(
  podcasterName: string,
  params?: { start_date?: string; end_date?: string; podcast_slug?: string }
): Promise<TickerRecommendation[]> {
  const q: Record<string, string> = {};
  if (params?.start_date) q.start_date = params.start_date;
  if (params?.end_date) q.end_date = params.end_date;
  if (params?.podcast_slug) q.podcast_slug = params.podcast_slug;
  const response = await apiClient.get(
    `/api/recommendations/by-podcaster/${encodeURIComponent(podcasterName)}`,
    { params: Object.keys(q).length ? q : undefined }
  );
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Get most-discussed tickers in the last N days.
 */
export async function getMostDiscussedTickers(
  params?: { days?: number; limit?: number }
): Promise<TickerBuzz[]> {
  const q: Record<string, number> = {};
  if (params?.days != null) q.days = params.days;
  if (params?.limit != null) q.limit = params.limit;
  const response = await apiClient.get('/api/recommendations/buzz', {
    params: Object.keys(q).length ? q : undefined,
  });
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Get stock history for sparklines
 * @param ticker Stock ticker symbol
 * @param timeframe Optional timeframe filter (1H, 1D, 1W, 1M, 3M, 6M, 1Y, YTD, ALL)
 */
export async function getStockHistory(
  ticker: string,
  timeframe?: TimeframeOption
): Promise<{ data: number[] }> {
  const params: Record<string, any> = {};
  if (timeframe) params.timeframe = timeframe;

  const response = await apiClient.get(`/api/stocks/${ticker}/history`, { params });
  // OpenAPI spec shows empty schema, return data array
  // Backend should return { data: number[] } or just number[]
  if (Array.isArray(response.data)) {
    return { data: response.data };
  }
  if (response.data?.data && Array.isArray(response.data.data)) {
    return { data: response.data.data };
  }
  return { data: [] };
}

/**
 * Get tags list
 */
export async function getTags(): Promise<TagsResponse> {
  const response = await apiClient.get('/api/tags');
  // OpenAPI spec shows TagsResponse with tags array
  if (response.data?.tags && Array.isArray(response.data.tags)) {
    return response.data as TagsResponse;
  }
  // Fallback if response is just array
  if (Array.isArray(response.data)) {
    return { tags: response.data };
  }
  return { tags: [] };
}

/**
 * Get episodes by tag
 * @param tag Tag name or ID
 * @param limit Maximum number of episodes to return (1-200), default: 50
 * @param offset Pagination offset, default: 0
 * @param includeContent Optional: whether to include full content in the response
 */
export async function getEpisodesByTag(
  tag: string,
  limit: number = 50,
  offset: number = 0,
  includeContent?: boolean
): Promise<any> { // Using any for now based on actual response structure
  const params: Record<string, any> = { limit, offset };
  if (includeContent !== undefined) params.include_content = includeContent;

  const response = await apiClient.get(`/api/episodes/by-tag/${encodeURIComponent(tag)}`, {
    params
  });
  return response.data;
}

/**
 * Get market indices
 */
export async function getMarketIndices(): Promise<MarketIndex[]> {
  const response = await apiClient.get('/api/market/indices');
  // OpenAPI spec shows array of MarketIndex
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Get concepts list
 */
export async function getConcepts(): Promise<ConceptMetadata[]> {
  const response = await apiClient.get('/api/concepts');
  // OpenAPI spec shows array of ConceptMetadata
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Get top movers
 * @param limit Maximum number of top movers to return (1-50), default: 10
 */
export async function getTopMovers(limit?: number): Promise<TopMover[]> {
  const params: Record<string, any> = {};
  if (limit) params.limit = limit;

  const response = await apiClient.get('/api/top-movers', { params });
  // OpenAPI spec shows array of TopMover
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Get recent episodes across all podcasts
 * @param options Query options
 * @param options.limit Maximum number of episodes to return (1-200), default: 20
 * @param options.offset Pagination offset, default: 0
 * @param options.podcastName Optional filter by podcast name
 */
export async function getRecentEpisodes(options?: {
  limit?: number;
  offset?: number;
  podcastName?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  includeContent?: boolean;
}): Promise<Episode[]> {
  const params: Record<string, any> = {};
  if (options?.limit) params.limit = options.limit;
  if (options?.offset) params.offset = options.offset;
  if (options?.podcastName) params.podcast_name = options.podcastName;
  if (options?.sortBy) params.sort_by = options.sortBy;
  if (options?.order) params.order = options.order;
  if (options?.includeContent !== undefined) params.include_content = options.includeContent;

  const response = await apiClient.get('/api/episodes/recent', { params });

  // Debug: Log response structure (enabled in production for debugging)
  console.log('[API] getRecentEpisodes response:', {
    status: response.status,
    dataType: typeof response.data,
    isArray: Array.isArray(response.data),
    dataKeys: response.data ? Object.keys(response.data) : 'null/undefined',
    dataLength: Array.isArray(response.data) ? response.data.length : 'not array',
    hasData: !!(response.data && response.data.data),
    hasEpisodes: !!(response.data && response.data.episodes),
    dataDataIsArray: Array.isArray(response.data?.data),
    episodesIsArray: Array.isArray(response.data?.episodes),
    episodesLength: Array.isArray(response.data?.episodes) ? response.data.episodes.length : 'N/A'
  });

  // Handle different response formats:
  // 1. Direct array: [episode1, episode2, ...]
  // 2. Wrapped with data: { data: [episode1, episode2, ...] }
  // 3. Wrapped with episodes: { episodes: [...], total: 12, hasMore: false }
  // 4. Wrapped with other fields: { data: [...], total: 50, ... }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  // Check for { episodes: [...] } format (most common based on API)
  if (response.data && typeof response.data === 'object' && Array.isArray(response.data.episodes)) {
    return response.data.episodes;
  }

  // Check for { data: [...] } format
  if (response.data && typeof response.data === 'object' && Array.isArray(response.data.data)) {
    return response.data.data;
  }

  // If response.data is an object but not the expected format, log it
  if (response.data && typeof response.data === 'object') {
    console.warn('[API] getRecentEpisodes - Unexpected response format:', response.data);
  }

  return [];
}

/**
 * @deprecated Use getRecentEpisodes() instead. This function is inefficient.
 * Get all recent episodes across all podcasts
 * This fetches all podcasts and their recent episodes, then merges and sorts them.
 * @param limit Maximum number of episodes to return
 */
export async function getAllRecentEpisodes(limit: number = 20): Promise<Episode[]> {
  try {
    // First get all podcasts
    const podcasts = await getSortedPodcasts({ limit: 50 });

    // Fetch recent episodes from each podcast in parallel
    const episodePromises = podcasts.map(podcast =>
      getPodcastEpisodes(podcast.name, {
        sortBy: 'spotify_release_date',
        order: 'desc',
        limit: 10
      }).catch(() => [] as Episode[]) // Return empty array if fetch fails
    );

    const allEpisodeArrays = await Promise.all(episodePromises);

    // Flatten and sort by spotify_release_date descending (fallback to created_time if not available)
    const allEpisodes = allEpisodeArrays
      .flat()
      .sort((a, b) => {
        // Prefer spotify_release_date, fallback to created_time
        const dateA = a.spotify_release_date || a.created_time;
        const dateB = b.spotify_release_date || b.created_time;
        // Handle both number (timestamp) and string (ISO date) formats
        const timeA = typeof dateA === 'string' ? new Date(dateA).getTime() : dateA;
        const timeB = typeof dateB === 'string' ? new Date(dateB).getTime() : dateB;
        return timeB - timeA; // Descending order (newest first)
      })
      .slice(0, limit);

    return allEpisodes;
  } catch (error) {
    console.error('[API] Failed to fetch recent episodes:', error);
    return [];
  }
}

/**
 * Update episode summary with modified content
 * 
 * @param podcastName Podcast name
 * @param episodeId Episode ID
 * @param content Modified summary markdown content
 * @param modifiedBy Optional user identifier (email or ID)
 * @returns Updated Episode object
 */
export async function updateEpisodeSummary(
  podcastName: string,
  episodeId: string,
  content: string,
  modifiedBy?: string
): Promise<Episode> {
  const response = await apiClient.put(
    `/api/podcast/${podcastName}/episodes/${episodeId}/summary`,
    { content, modified_by: modifiedBy }
  );
  return response.data;
}

/**
 * Delete modified episode summary and revert to original
 * 
 * @param podcastName Podcast name
 * @param episodeId Episode ID
 */
export async function deleteEpisodeSummary(
  podcastName: string,
  episodeId: string
): Promise<void> {
  await apiClient.delete(
    `/api/podcast/${podcastName}/episodes/${episodeId}/summary`
  );
}
