/**
 * Utility functions for calculating node sizes and formatting values
 */

/**
 * Calculate circle radius based on value (market cap or revenue)
 * Uses logarithmic scale for better visualization
 */
export function calculateCircleRadius(
  value: number,
  minValue: number,
  maxValue: number,
  minRadius: number = 30,
  maxRadius: number = 80
): number {
  if (value <= 0 || minValue <= 0 || maxValue <= 0) {
    return minRadius;
  }

  // Use logarithmic scale for better distribution
  const logMin = Math.log10(minValue);
  const logMax = Math.log10(maxValue);
  const logValue = Math.log10(value);

  // Normalize to 0-1 range
  const normalized = (logValue - logMin) / (logMax - logMin);

  // Calculate radius with smooth curve
  const radius = minRadius + (maxRadius - minRadius) * normalized;

  return Math.max(minRadius, Math.min(maxRadius, radius));
}

/**
 * Format large numbers (market cap, revenue) for display
 * Shows only 3 significant digits
 */
export function formatLargeNumber(value: number): string {
  if (value >= 1e12) {
    const trillions = value / 1e12;
    return `$${trillions.toPrecision(3)}T`;
  }
  if (value >= 1e9) {
    const billions = value / 1e9;
    return `$${billions.toPrecision(3)}B`;
  }
  if (value >= 1e6) {
    const millions = value / 1e6;
    return `$${millions.toPrecision(3)}M`;
  }
  return `$${value.toPrecision(3)}`;
}

/**
 * Get all node values for a specific metric (marketCap or revenue)
 */
export function getNodeValues(
  nodes: Array<{ data: { marketCap?: number; revenue?: number } }>,
  metric: 'marketCap' | 'revenue'
): number[] {
  return nodes
    .map((node) => {
      if (metric === 'marketCap') {
        return node.data.marketCap || 0;
      }
      return node.data.revenue || 0;
    })
    .filter((value) => value > 0);
}

