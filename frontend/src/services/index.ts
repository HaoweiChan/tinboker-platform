/**
 * Unified Service Exports
 * 
 * Central export point for API services with fallback to mocks.
 * Components should import from here instead of directly from api or mocks.
 */

// Export API functions (this includes types defined in api/index.ts)
// Note: api/index.ts defines: Tag, TagsResponse, EpisodesByTagResponse, MarketIndex, TopMover, Podcast, Episode
export * from './api/index';

// Export transformers for use in components if needed
export * from './api/transformers';

// Export migration utilities
export { fetchWithFallback, fetchWithFallbackAndErrorHandler, checkBackendAvailability } from './api/migration';

// Export types (only types not already exported from api/index)
// Note: Some types (Tag, TagsResponse, EpisodesByTagResponse, MarketIndex, TopMover) are defined in both files
// We export from api/index first, so those take precedence. Only export unique types from types.ts
export type {
  CompanyDetail,
  ConceptMetadata,
  ContentAsset,
  ContentIndexResponse,
  GraphData,
  StockEvent,
  TimeframeOption,
  // Note: Tag, TagsResponse, EpisodesByTagResponse, MarketIndex, TopMover are exported from api/index.ts
} from './types';

// Re-export mocks for fallback/development use
// Components should use API functions with fallback, but mocks are available if needed
export * from './mocks';

