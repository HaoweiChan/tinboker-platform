/**
 * Central export point for all mock data
 * 
 * Usage:
 *   import { mockConcepts, mockCompanyDetails } from './mocks';
 * 
 * This module re-exports all mock data and helper functions from their
 * respective domain files, providing a single import point.
 */

// Types - Note: Main types are exported from ../types, not here
// This file's types are for internal mock use only

// Helpers
export { generateChartData, calculateEventMovement } from './helpers';
export { generateMockPriceSeries } from './priceSeries';

// Core Mock Data (from mockData.ts)
export { mockConcepts } from './concepts';
export { mockCompanyDetails } from './companies';
export { mockGraphData } from './graphs';
export { mockStockEvents, getEventsForTickers } from './events';
export { mockTopMovers } from './topMovers';

// Sector/Industry Data (from graphUtils.ts)
export { getSectorBubbleData, getSectorPerformanceStats, getTreeMapData } from './sectorData';

// Visual Archetype Graphs (from graphUtils.ts)
export {
  getSupplyChainData,
  getOwnershipData,
  getClusterData,
  supplyChainEntities,
  supplyChainEdges,
  ownershipEntities,
  ownershipEdges,
  clusterEntities,
  clusterEdges,
} from './visualGraphs';

// Interactive Models (from interactiveModels.tsx)
export {
  INTERACTIVE_MODELS_DATA,
  INTERACTIVE_MODEL_LIST,
} from './interactiveModels';
export type { InteractiveEntity, InteractiveModelData } from './interactiveModels';

