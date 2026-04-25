/**
 * Mock graph data for different concepts - simulates GET /api/graph/{id}
 * 
 * SOURCE: Extracted from src/services/mockData.ts
 */

import type { GraphData, ConceptType } from './types';

// Robotics Graph Data
const roboticsGraphData: GraphData = {
  nodes: [
    {
      id: 'TSLA',
      type: 'stock',
      data: { label: 'Tesla', ticker: 'TSLA', marketCapTier: 'large' },
      position: { x: 0, y: 0 },
    },
    {
      id: 'NVDA',
      type: 'stock',
      data: { label: 'NVIDIA', ticker: 'NVDA', marketCapTier: 'large' },
      position: { x: -100, y: 200 },
    },
    {
      id: 'ABB',
      type: 'stock',
      data: { label: 'ABB Ltd', ticker: 'ABB', marketCapTier: 'medium' },
      position: { x: 0, y: 320 },
    },
    {
      id: 'ROK',
      type: 'stock',
      data: { label: 'Rockwell', ticker: 'ROK', marketCapTier: 'medium' },
      position: { x: 0, y: 120 },
    },
    {
      id: 'IRBT',
      type: 'stock',
      data: { label: 'iRobot', ticker: 'IRBT', marketCapTier: 'small' },
      position: { x: 260, y: 40 },
    },
    {
      id: 'INTC',
      type: 'stock',
      data: { label: 'Intel', ticker: 'INTC', marketCapTier: 'large' },
      position: { x: 260, y: 380 },
    },
  ],
  edges: [
    { id: 'e1', source: 'TSLA', target: 'ROK', label: 'AI Chips', data: { category: 'aiChips' } },
    { id: 'e2', source: 'TSLA', target: 'NVDA', label: 'Automation', data: { category: 'automation' } },
    { id: 'e3', source: 'NVDA', target: 'INTC', label: 'Semiconductors', data: { category: 'components' } },
    { id: 'e4', source: 'ROK', target: 'ABB', label: 'Components', data: { category: 'components' } },
    { id: 'e5', source: 'IRBT', target: 'ABB', label: 'Components', data: { category: 'components' } },
    { id: 'e6', source: 'ROK', target: 'ABB', label: 'AI/ML', data: { category: 'automation' } },
    { id: 'e7', source: 'ABB', target: 'INTC', label: 'Components', data: { category: 'components' } },
  ],
};

// AI Graph Data
const aiGraphData: GraphData = {
  nodes: [
    {
      id: 'NVDA',
      type: 'stock',
      data: { label: 'NVIDIA', ticker: 'NVDA', marketCapTier: 'large' },
      position: { x: 300, y: 50 },
    },
    {
      id: 'MSFT',
      type: 'stock',
      data: { label: 'Microsoft', ticker: 'MSFT', marketCapTier: 'large' },
      position: { x: 100, y: 200 },
    },
    {
      id: 'GOOGL',
      type: 'stock',
      data: { label: 'Google', ticker: 'GOOGL', marketCapTier: 'large' },
      position: { x: 500, y: 200 },
    },
    {
      id: 'AMD',
      type: 'stock',
      data: { label: 'AMD', ticker: 'AMD', marketCapTier: 'large' },
      position: { x: 300, y: 350 },
    },
    {
      id: 'PLTR',
      type: 'stock',
      data: { label: 'Palantir', ticker: 'PLTR', marketCapTier: 'medium' },
      position: { x: 150, y: 450 },
    },
    {
      id: 'SNOW',
      type: 'stock',
      data: { label: 'Snowflake', ticker: 'SNOW', marketCapTier: 'medium' },
      position: { x: 450, y: 450 },
    },
  ],
  edges: [
    { id: 'e1', source: 'NVDA', target: 'MSFT', label: 'GPUs', data: { category: 'aiChips' } },
    { id: 'e2', source: 'NVDA', target: 'GOOGL', label: 'AI Hardware', data: { category: 'aiChips' } },
    { id: 'e3', source: 'NVDA', target: 'AMD', label: 'Competition', data: { category: 'components' } },
    { id: 'e4', source: 'MSFT', target: 'PLTR', label: 'Cloud Services', data: { category: 'automation' } },
    { id: 'e5', source: 'GOOGL', target: 'SNOW', label: 'Data Analytics', data: { category: 'automation' } },
    { id: 'e6', source: 'AMD', target: 'PLTR', label: 'Processing', data: { category: 'components' } },
  ],
};

// Clean Energy Graph Data
const energyGraphData: GraphData = {
  nodes: [
    {
      id: 'TSLA',
      type: 'stock',
      data: { label: 'Tesla', ticker: 'TSLA', marketCapTier: 'large' },
      position: { x: 300, y: 100 },
    },
    {
      id: 'ENPH',
      type: 'stock',
      data: { label: 'Enphase', ticker: 'ENPH', marketCapTier: 'medium' },
      position: { x: 150, y: 250 },
    },
    {
      id: 'FSLR',
      type: 'stock',
      data: { label: 'First Solar', ticker: 'FSLR', marketCapTier: 'medium' },
      position: { x: 450, y: 250 },
    },
    {
      id: 'NEE',
      type: 'stock',
      data: { label: 'NextEra Energy', ticker: 'NEE', marketCapTier: 'large' },
      position: { x: 300, y: 400 },
    },
    {
      id: 'PLUG',
      type: 'stock',
      data: { label: 'Plug Power', ticker: 'PLUG', marketCapTier: 'small' },
      position: { x: 100, y: 450 },
    },
    {
      id: 'SEDG',
      type: 'stock',
      data: { label: 'SolarEdge', ticker: 'SEDG', marketCapTier: 'small' },
      position: { x: 500, y: 450 },
    },
  ],
  edges: [
    { id: 'e1', source: 'TSLA', target: 'ENPH', label: 'Solar', data: { category: 'components' } },
    { id: 'e2', source: 'TSLA', target: 'FSLR', label: 'Solar Panels', data: { category: 'components' } },
    { id: 'e3', source: 'ENPH', target: 'NEE', label: 'Grid Integration', data: { category: 'automation' } },
    { id: 'e4', source: 'FSLR', target: 'NEE', label: 'Utility Scale', data: { category: 'automation' } },
    { id: 'e5', source: 'NEE', target: 'PLUG', label: 'Hydrogen', data: { category: 'automation' } },
    { id: 'e6', source: 'ENPH', target: 'SEDG', label: 'Inverters', data: { category: 'components' } },
  ],
};

// Export all mock graph data indexed by concept type
export const mockGraphData: Record<ConceptType, GraphData> = {
  robotics: roboticsGraphData,
  ai: aiGraphData,
  energy: energyGraphData,
};

