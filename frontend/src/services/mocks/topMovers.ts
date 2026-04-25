/**
 * Mock top movers data - simulates GET /api/top-movers
 * 
 * SOURCE: Extracted from src/services/mockData.ts
 */

import type { TopMover } from './types';

export const mockTopMovers: TopMover[] = [
  {
    ticker: 'PLTR',
    name: 'Palantir',
    price: 24.35,
    change: 0.87,
    changePercent: 3.71,
  },
  {
    ticker: 'AMD',
    name: 'AMD',
    price: 122.50,
    change: 4.15,
    changePercent: 3.50,
  },
  {
    ticker: 'PLUG',
    name: 'Plug Power',
    price: 3.82,
    change: 0.12,
    changePercent: 3.24,
  },
  {
    ticker: 'ENPH',
    name: 'Enphase',
    price: 118.75,
    change: 3.25,
    changePercent: 2.81,
  },
  {
    ticker: 'NVDA',
    name: 'NVIDIA',
    price: 495.22,
    change: 12.45,
    changePercent: 2.58,
  },
];

