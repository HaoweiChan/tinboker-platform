/**
 * Mock stock events - simulates GET /api/events
 * 
 * SOURCE: Extracted from src/services/mockData.ts
 */

import type { StockEvent } from './types';

const now = Date.now();
const dayMs = 24 * 60 * 60 * 1000;

export const mockStockEvents: StockEvent[] = [
  // TSLA Events
  {
    id: 'tsla-earnings-q4',
    type: 'earnings',
    date: now - (45 * dayMs),
    title: 'Q4 Earnings Report',
    description: 'Tesla reports Q4 earnings beating expectations with record deliveries',
    relatedTickers: ['TSLA'],
  },
  {
    id: 'tsla-investor-day',
    type: 'conference',
    date: now - (90 * dayMs),
    title: 'Investor Day 2024',
    description: 'Tesla holds investor day showcasing new vehicle platforms and manufacturing innovations',
    relatedTickers: ['TSLA'],
  },
  {
    id: 'tsla-news-cybertruck',
    type: 'news',
    date: now - (120 * dayMs),
    title: 'Cybertruck Production Ramp',
    description: 'Tesla announces Cybertruck production ramp-up ahead of schedule',
    relatedTickers: ['TSLA'],
  },
  // NVDA Events
  {
    id: 'nvda-earnings-q1',
    type: 'earnings',
    date: now - (30 * dayMs),
    title: 'Q1 Earnings Report',
    description: 'NVIDIA beats estimates driven by AI chip demand',
    relatedTickers: ['NVDA'],
  },
  {
    id: 'nvda-dividend',
    type: 'dividend',
    date: now - (60 * dayMs),
    title: 'Dividend Declaration',
    description: 'NVIDIA announces quarterly dividend of $0.04 per share',
    relatedTickers: ['NVDA'],
  },
  {
    id: 'nvda-gtc',
    type: 'conference',
    date: now - (100 * dayMs),
    title: 'GTC Conference',
    description: 'NVIDIA unveils new AI chip architecture at GTC conference',
    relatedTickers: ['NVDA'],
  },
  {
    id: 'ai-boom-news',
    type: 'news',
    date: now - (75 * dayMs),
    title: 'AI Investment Surge',
    description: 'Major tech companies announce massive AI infrastructure investments',
    relatedTickers: ['NVDA', 'MSFT', 'GOOGL', 'AMD'],
  },
  // MSFT Events
  {
    id: 'msft-earnings-q3',
    type: 'earnings',
    date: now - (50 * dayMs),
    title: 'Q3 Earnings Report',
    description: 'Microsoft reports strong cloud growth driven by AI services',
    relatedTickers: ['MSFT'],
  },
  {
    id: 'msft-dividend',
    type: 'dividend',
    date: now - (70 * dayMs),
    title: 'Dividend Increase',
    description: 'Microsoft increases quarterly dividend by 10%',
    relatedTickers: ['MSFT'],
  },
  {
    id: 'msft-openai-partnership',
    type: 'news',
    date: now - (110 * dayMs),
    title: 'OpenAI Partnership Expansion',
    description: 'Microsoft expands strategic partnership with OpenAI',
    relatedTickers: ['MSFT'],
  },
  // GOOGL Events
  {
    id: 'googl-earnings-q1',
    type: 'earnings',
    date: now - (35 * dayMs),
    title: 'Q1 Earnings Report',
    description: 'Alphabet reports earnings with strong ad revenue and cloud growth',
    relatedTickers: ['GOOGL'],
  },
  {
    id: 'googl-io-conference',
    type: 'conference',
    date: now - (80 * dayMs),
    title: 'Google I/O 2024',
    description: 'Google announces new AI products and services at I/O conference',
    relatedTickers: ['GOOGL'],
  },
  {
    id: 'googl-antitrust-news',
    type: 'news',
    date: now - (130 * dayMs),
    title: 'Antitrust Resolution',
    description: 'Google reaches settlement in major antitrust case',
    relatedTickers: ['GOOGL'],
  },
  // AMD Events
  {
    id: 'amd-earnings-q4',
    type: 'earnings',
    date: now - (40 * dayMs),
    title: 'Q4 Earnings Report',
    description: 'AMD reports strong data center and gaming revenue',
    relatedTickers: ['AMD'],
  },
  {
    id: 'amd-mi300-launch',
    type: 'news',
    date: now - (95 * dayMs),
    title: 'MI300 AI Chip Launch',
    description: 'AMD launches MI300 series AI accelerators for data centers',
    relatedTickers: ['AMD'],
  },
  // Energy Sector Events
  {
    id: 'enph-earnings',
    type: 'earnings',
    date: now - (55 * dayMs),
    title: 'Earnings Report',
    description: 'Enphase Energy reports quarterly earnings',
    relatedTickers: ['ENPH'],
  },
  {
    id: 'clean-energy-policy',
    type: 'news',
    date: now - (105 * dayMs),
    title: 'Clean Energy Policy Announcement',
    description: 'Government announces new clean energy incentives',
    relatedTickers: ['TSLA', 'ENPH', 'FSLR', 'NEE'],
  },
  {
    id: 'nee-dividend',
    type: 'dividend',
    date: now - (65 * dayMs),
    title: 'Quarterly Dividend',
    description: 'NextEra Energy declares quarterly dividend',
    relatedTickers: ['NEE'],
  },
];

/**
 * Get events for specific tickers
 * 
 * @param tickers - Array of stock ticker symbols
 * @returns Array of StockEvent related to any of the given tickers
 */
export const getEventsForTickers = (tickers: string[]): StockEvent[] => {
  return mockStockEvents.filter(event =>
    event.relatedTickers.some(ticker => tickers.includes(ticker))
  );
};

