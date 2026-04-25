/**
 * Mock price series generator for sparklines and charts
 * 
 * SOURCE: Extracted from src/utils/priceSeries.ts
 */

export interface PricePoint {
  time: string;
  value: number;
}

/**
 * Generate mock price series data for sparklines and mini charts
 * 
 * @param length - Number of data points to generate
 * @param startValue - Starting price value (default: 100)
 * @returns Array of PricePoint with time and value
 */
export const generateMockPriceSeries = (length: number, startValue = 100): PricePoint[] => {
  const series: PricePoint[] = [];
  let value = startValue;
  const now = Date.now();

  for (let i = length - 1; i >= 0; i -= 1) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    const change = (Math.random() - 0.5) * (startValue * 0.01);
    value = Math.max(1, value + change);
    series.push({
      time: date.toISOString().slice(0, 10),
      value: parseFloat(value.toFixed(2)),
    });
  }

  return series;
};

