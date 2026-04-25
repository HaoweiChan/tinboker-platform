/**
 * Re-export PricePoint interface and generateMockPriceSeries from organized mocks
 * 
 * This file maintains backward compatibility for existing imports.
 * New code should import directly from @/services/mocks
 */

// Re-export interface (for backward compatibility)
// time can be string (YYYY-MM-DD for daily) or number (Unix timestamp in seconds for minute-level)
export interface PricePoint {
  time: string | number;
  value: number;
}

// Re-export function from organized mocks
export { generateMockPriceSeries } from '@/services/mocks';


