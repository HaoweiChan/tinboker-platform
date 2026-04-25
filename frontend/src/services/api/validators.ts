/**
 * API Response Validators
 * 
 * Validate API responses match expected schemas using Zod.
 * Provides type-safe validation with descriptive error messages.
 */

import { safeParseResponse } from '../../validation/schemas';
import type { z } from 'zod';

/**
 * Validate API response with Zod schema
 * Returns validated data or throws error with details
 */
export function validateResponse<T>(
  schema: z.ZodType<T>,
  data: unknown,
  endpointName: string
): T {
  const result = safeParseResponse(schema, data);
  
  if (!result.success) {
    throw new Error(
      `API response validation failed for ${endpointName}: ${result.error}`
    );
  }
  
  return result.data;
}

/**
 * Validate array response
 * Useful for endpoints that return arrays directly
 */
export function validateArrayResponse<T>(
  itemSchema: z.ZodType<T>,
  data: unknown,
  endpointName: string
): T[] {
  if (!Array.isArray(data)) {
    throw new Error(
      `API response validation failed for ${endpointName}: Expected array, got ${typeof data}`
    );
  }
  
  const results: T[] = [];
  const errors: string[] = [];
  
  data.forEach((item, index) => {
    const result = safeParseResponse(itemSchema, item);
    if (result.success) {
      results.push(result.data);
    } else {
      errors.push(`Item ${index}: ${result.error}`);
    }
  });
  
  if (errors.length > 0) {
    throw new Error(
      `API response validation failed for ${endpointName}: ${errors.join('; ')}`
    );
  }
  
  return results;
}

