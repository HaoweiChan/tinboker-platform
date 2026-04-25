/**
 * Migration Wrapper
 * 
 * Provides fallback strategy for API calls - tries backend API first,
 * falls back to mock data on failure/timeout.
 */

/**
 * Check if mock mode is forced via environment variable
 */
const isMockModeForced = (): boolean => {
  return import.meta.env.VITE_USE_MOCKS === 'true';
};

/**
 * Simple in-memory cache for API responses
 * Prevents duplicate fetches across components
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const apiCache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 30000; // 30 seconds cache TTL

// Map to track in-flight requests to prevent duplicate parallel calls
const inFlightRequests = new Map<string, Promise<unknown>>();

/**
 * Fetch with fallback to mock data, with caching
 * 
 * @param apiCall Function that calls the backend API
 * @param mockData Mock data to use as fallback
 * @param endpointName Name of the endpoint for logging (also used as cache key)
 * @returns API response or mock data on failure
 */
export async function fetchWithFallback<T>(
  apiCall: () => Promise<T>,
  mockData: T,
  endpointName: string
): Promise<T> {
  console.log(`[Migration] fetchWithFallback called for ${endpointName}`);
  // If mock mode is forced, skip API call
  if (isMockModeForced()) {
    console.log(`[Migration] Using mock data for ${endpointName} (VITE_USE_MOCKS=true)`);
    return mockData;
  }

  // Check cache first
  const cached = apiCache.get(endpointName);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[Migration] Cache hit for ${endpointName}`, {
      age: Date.now() - cached.timestamp,
      isArray: Array.isArray(cached.data),
      length: Array.isArray(cached.data) ? cached.data.length : 'not array'
    });
    return cached.data as T;
  }

  // Check if there's already an in-flight request for this endpoint
  const inFlight = inFlightRequests.get(endpointName);
  if (inFlight) {
    console.log(`[Migration] Reusing in-flight request for ${endpointName}`);
    return inFlight as Promise<T>;
  }

  // Create the request promise
  const requestPromise = (async () => {
    try {
      console.log(`[Migration] Starting API call for ${endpointName}`);
      const result = await apiCall();
      console.log(`[Migration] API call success for ${endpointName}:`, {
        isArray: Array.isArray(result),
        length: Array.isArray(result) ? result.length : 'not array',
        type: typeof result
      });
      // Cache the successful result
      apiCache.set(endpointName, { data: result, timestamp: Date.now() });
      return result;
    } catch (error) {
      // Log the error but don't throw - return mock data instead
      console.warn(
        `[Migration] API call failed for ${endpointName}, using mock data:`,
        error instanceof Error ? error.message : error
      );
      return mockData;
    } finally {
      // Clean up in-flight tracker
      inFlightRequests.delete(endpointName);
    }
  })();

  // Register as in-flight
  inFlightRequests.set(endpointName, requestPromise);

  return requestPromise;
}

/**
 * Fetch with fallback that allows custom error handling
 * 
 * @param apiCall Function that calls the backend API
 * @param mockData Mock data to use as fallback
 * @param endpointName Name of the endpoint for logging
 * @param onError Optional error handler
 * @returns API response or mock data on failure
 */
export async function fetchWithFallbackAndErrorHandler<T>(
  apiCall: () => Promise<T>,
  mockData: T,
  endpointName: string,
  onError?: (error: unknown) => void
): Promise<T> {
  if (isMockModeForced()) {
    if (import.meta.env.DEV) {
      console.log(`[Migration] Using mock data for ${endpointName} (VITE_USE_MOCKS=true)`);
    }
    return mockData;
  }

  try {
    const result = await apiCall();
    return result;
  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      console.warn(
        `[Migration] API call failed for ${endpointName}, using mock data:`,
        error instanceof Error ? error.message : error
      );
    }
    return mockData;
  }
}

/**
 * Check if backend API is available
 * Uses health check endpoint
 */
export async function checkBackendAvailability(): Promise<boolean> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/health`,
      {
        method: 'GET',
        signal: AbortSignal.timeout(1000), // 1 second timeout
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}

