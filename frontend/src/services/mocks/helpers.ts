/**
 * Mock data helper functions
 * 
 * SOURCE: Extracted from src/services/mockData.ts
 */

import type { ChartDataPoint, StockEvent, EventMovementIndicator } from './types';

const dayMs = 24 * 60 * 60 * 1000;

/**
 * Helper function to generate OHLCV chart data with extended history
 * 
 * @param basePrice - The target/current price for the stock
 * @param days - Number of days of history to generate (default: 365)
 * @param trend - Price trend direction: 'up', 'down', or 'neutral'
 * @returns Array of ChartDataPoint with OHLCV data
 */
export const generateChartData = (
  basePrice: number,
  days: number = 365,
  trend: 'up' | 'down' | 'neutral' = 'up'
): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const now = Date.now();

  // Determine starting price based on trend
  let currentPrice: number;
  let trendMultiplier: number;

  if (trend === 'down') {
    currentPrice = basePrice * 1.20; // Start 20% higher for downtrend
    trendMultiplier = -0.20; // Negative trend
  } else if (trend === 'neutral') {
    currentPrice = basePrice * 0.95; // Start slightly lower
    trendMultiplier = 0.05; // Small positive trend
  } else {
    currentPrice = basePrice * 0.85; // Start 15% lower for uptrend
    trendMultiplier = 0.15; // Positive trend
  }

  for (let i = days; i >= 0; i--) {
    const progress = (days - i) / days;
    const trendValue = progress * trendMultiplier;
    const variance = (Math.random() - 0.5) * basePrice * 0.03;
    const baseValue = currentPrice + (basePrice * trendValue) + variance;

    // Generate OHLCV for each day
    const dailyVolatility = basePrice * 0.02; // 2% daily volatility
    const open = baseValue;
    const high = open + Math.random() * dailyVolatility;
    const low = open - Math.random() * dailyVolatility;
    const close = low + Math.random() * (high - low);
    const volume = Math.floor(1000000 + Math.random() * 5000000); // Random volume between 1M-6M
    const dayTimestamp = now - (i * dayMs);
    const isoDate = new Date(dayTimestamp).toISOString().split('T')[0];

    data.push({
      timestamp: dayTimestamp,
      price: Number(close.toFixed(2)), // For backward compatibility
      date: isoDate,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: volume,
    });

    currentPrice = close;
  }

  return data;
};

/**
 * Helper function to calculate event movement indicators
 * Shows price changes after events (1 day, 1 week, 1 month)
 * 
 * @param ticker - Stock ticker symbol
 * @param event - The stock event
 * @param priceData - Historical price data array
 * @returns EventMovementIndicator or null if event not found in price data
 */
export const calculateEventMovement = (
  ticker: string,
  event: StockEvent,
  priceData: { timestamp: number; price: number }[]
): EventMovementIndicator | null => {
  const eventDate = event.date;
  const eventDataPoint = priceData.find(d => Math.abs(d.timestamp - eventDate) < dayMs / 2);

  if (!eventDataPoint) return null;

  const priceAtEvent = eventDataPoint.price;
  const eventIndex = priceData.indexOf(eventDataPoint);

  const after1d = priceData[eventIndex + 1];
  const after1w = priceData[eventIndex + 7];
  const after1m = priceData[eventIndex + 30];

  return {
    eventId: event.id,
    ticker,
    priceAtEvent,
    priceAfter1d: after1d?.price,
    priceAfter1w: after1w?.price,
    priceAfter1m: after1m?.price,
    changePercent1d: after1d ? ((after1d.price - priceAtEvent) / priceAtEvent) * 100 : undefined,
    changePercent1w: after1w ? ((after1w.price - priceAtEvent) / priceAtEvent) * 100 : undefined,
    changePercent1m: after1m ? ((after1m.price - priceAtEvent) / priceAtEvent) * 100 : undefined,
  };
};

