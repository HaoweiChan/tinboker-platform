/**
 * Mock sector/industry data for visualizations
 * 
 * SOURCE: Extracted from src/utils/graphUtils.ts
 */

import type { SectorBubbleData, SectorStat, TreeMapItem } from './types';

/**
 * Get sector bubble data for sector bubble chart
 * Used in industry analysis visualizations
 */
export const getSectorBubbleData = (): SectorBubbleData[] => [
  { id: 'semi', name: 'Semiconductors', label: 'Semiconductors', value: 10.5, marketCap: 10.5, return: 18, returnRate: 18, volume: 100 },
  { id: 'fin', name: 'Finance', label: 'Finance', value: 5.2, marketCap: 5.2, return: -2, returnRate: -2, volume: 60 },
  { id: 'ev', name: 'EV & Auto', label: 'EV & Auto', value: 4.8, marketCap: 4.8, return: 15, returnRate: 15, volume: 55 },
  { id: 'pcb', name: 'PCB Components', label: 'PCB Components', value: 5.5, marketCap: 5.5, return: 32, returnRate: 32, volume: 40 },
  { id: 'network', name: 'Networking', label: 'Networking', value: 5.1, marketCap: 5.1, return: 8, returnRate: 8, volume: 45 },
  { id: 'passive', name: 'Passive Comp.', label: 'Passive Comp.', value: 0.8, marketCap: 0.8, return: 12, returnRate: 12, volume: 30 },
  { id: 'space', name: 'Aerospace', label: 'Aerospace', value: 1.2, marketCap: 1.2, return: 26, returnRate: 26, volume: 25 },
  { id: 'plastic', name: 'Petrochemical', label: 'Petrochemical', value: 0.6, marketCap: 0.6, return: 5, returnRate: 5, volume: 20 },
  { id: 'textile', name: 'Textile', label: 'Textile', value: 0.4, marketCap: 0.4, return: 2, returnRate: 2, volume: 15 },
  { id: 'paper', name: 'Paper', label: 'Paper', value: 0.3, marketCap: 0.3, return: -1, returnRate: -1, volume: 10 },
  { id: 'shipping', name: 'Shipping', label: 'Shipping', value: 2.1, marketCap: 2.1, return: -4, returnRate: -4, volume: 35 },
  { id: 'steel', name: 'Steel', label: 'Steel', value: 1.5, marketCap: 1.5, return: 1, returnRate: 1, volume: 28 },
  { id: 'bio', name: 'Biotech', label: 'Biotech', value: 1.8, marketCap: 1.8, return: -8, returnRate: -8, volume: 22 },
  { id: 'retail', name: 'Retail', label: 'Retail', value: 2.5, marketCap: 2.5, return: 6, returnRate: 6, volume: 32 },
];

/**
 * Get sector performance stats for performance bars
 * Includes daily and weekly performance data
 */
export const getSectorPerformanceStats = (): { day: SectorStat[]; week: SectorStat[] } => {
  return {
    day: [
      { label: 'Energy', value: 0.58 },
      { label: 'Real Estate', value: 0.39 },
      { label: 'Healthcare', value: 0.28 },
      { label: 'Basic Materials', value: 0.08 },
      { label: 'Communication Services', value: 0.02 },
      { label: 'Consumer Defensive', value: -0.02 },
      { label: 'Financial', value: -0.2 },
      { label: 'Industrials', value: -0.35 },
      { label: 'Utilities', value: -0.36 },
      { label: 'Technology', value: -1.5 },
      { label: 'Consumer Cyclical', value: -1.89 },
    ],
    week: [
      { label: 'Healthcare', value: 0.59 },
      { label: 'Energy', value: -0.71 },
      { label: 'Utilities', value: -0.84 },
      { label: 'Consumer Defensive', value: -1.18 },
      { label: 'Real Estate', value: -2.23 },
      { label: 'Basic Materials', value: -2.48 },
      { label: 'Communication Services', value: -2.78 },
      { label: 'Financial', value: -3.34 },
      { label: 'Industrials', value: -3.55 },
      { label: 'Technology', value: -4.81 },
      { label: 'Consumer Cyclical', value: -6.59 },
    ],
  };
};

/**
 * Get tree map data for market cap visualization
 * Placeholder - to be populated with actual data
 */
export const getTreeMapData = (): TreeMapItem[] => {
  // Placeholder - can be expanded with actual tree map data
  return [];
};

