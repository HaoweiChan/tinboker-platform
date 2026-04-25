import type { ChartDataPoint } from '@/services/types';


/**
 * Generates normalized sparkline data from chart data
 * @param chartData - Array of price data points
 * @param numPoints - Number of points to include in sparkline (default: 7)
 * @returns Array of normalized values between 0 and 1
 */
export const generateSparklineData = (
  chartData: ChartDataPoint[],
  numPoints: number = 7
): number[] => {
  if (!chartData || chartData.length === 0) {
    return [];
  }

  // Take the last N points
  const recentData = chartData.slice(-numPoints);
  const prices = recentData.map((d) => d.price);

  // Find min and max for normalization
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1; // Avoid division by zero

  // Normalize to 0-1 range
  return prices.map((price) => (price - min) / span);
};


/**
 * Calculates price change percentage from chart data
 * @param chartData - Array of price data points
 * @returns Change percentage (e.g., 0.0344 for +3.44%)
 */
export const calculatePriceChange = (chartData: ChartDataPoint[]): number => {
  if (!chartData || chartData.length < 2) {
    return 0;
  }

  const latestPrice = chartData[chartData.length - 1].price;
  const previousPrice = chartData[chartData.length - 2].price;

  if (previousPrice === 0) return 0;

  return (latestPrice - previousPrice) / previousPrice;
};


/**
 * Gets the latest price from chart data
 * @param chartData - Array of price data points
 * @returns Latest price or 0 if no data
 */
export const getLatestPrice = (chartData: ChartDataPoint[]): number => {
  if (!chartData || chartData.length === 0) {
    return 0;
  }
  return chartData[chartData.length - 1].price;
};


/**
 * Format percentage for display
 * @param pct - Percentage as decimal (e.g., 0.0344)
 * @returns Formatted string (e.g., "+3.44%")
 */
export const formatPercentage = (pct: number): string => {
  const sign = pct > 0 ? '+' : '';
  return `${sign}${(pct * 100).toFixed(2)}%`;
};


/**
 * Format price for display
 * @param price - Price value
 * @returns Formatted string (e.g., "$242.84")
 */
export const formatPrice = (price: number): string => {
  return `$${price.toFixed(2)}`;
};

