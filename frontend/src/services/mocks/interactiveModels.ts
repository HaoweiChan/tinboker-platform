/**
 * Mock interactive models data for news page visualizations
 * 
 * SOURCE: Extracted from src/data/interactiveModels.tsx
 * NOTE: React components (GraphComponent, content) are NOT included here.
 *       Only the data portion is extracted. Component references need to be
 *       added when integrating back into the codebase.
 */

export interface InteractiveEntity {
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
}

export interface InteractiveModelData {
  id: string;
  title: string;
  source: string;
  date: string;
  category: string;
  summary: string;
  graphTypeLabel: string;
  graphType: 'layered' | 'force' | 'sankey' | 'tree';
  tickers: InteractiveEntity[];
  indices: InteractiveEntity[];
}

export const INTERACTIVE_MODELS_DATA: Record<string, InteractiveModelData> = {
  'supply-chain': {
    id: 'supply-chain',
    title: 'EV Supply Chain Shakeup: New Alliances Formed in Asia',
    source: 'Bloomberg',
    date: 'September 24, 2025 • 2 hours ago',
    category: 'Supply Chain',
    summary:
      'Layered analysis revealing upstream battery suppliers, OEM dependencies, and potential choke points across Asia.',
    graphTypeLabel: 'Supply Chain Graph',
    graphType: 'layered',
    tickers: [
      { symbol: 'CATL', price: '185.20', change: '+1.2%', isPositive: true },
      { symbol: 'TSLA', price: '173.80', change: '-0.5%', isPositive: false },
      { symbol: 'BYD', price: '32.40', change: '+2.1%', isPositive: true },
    ],
    indices: [
      { symbol: 'Global Lithium Index', price: '452.10', change: '-1.2%', isPositive: false },
      { symbol: 'Hang Seng Tech', price: '3,890.00', change: '+0.8%', isPositive: true },
    ],
  },
  governance: {
    id: 'governance',
    title: 'Tech Giants: Boardroom Interlocks Reveal Strategy Alignment',
    source: 'Reuters',
    date: 'September 23, 2025 • 5 hours ago',
    category: 'Governance',
    summary: 'Force-directed ecosystem showing shared boards, major investors, and governance friction points.',
    graphTypeLabel: 'Ecosystem Cluster',
    graphType: 'force',
    tickers: [
      { symbol: 'TSLA', price: '173.80', change: '+3.2%', isPositive: true },
      { symbol: 'TWTR', price: '54.20', change: '0.0%', isPositive: true },
    ],
    indices: [
      { symbol: 'Nasdaq 100', price: '20,394.21', change: '-1.2%', isPositive: false },
      { symbol: 'Corp Gov ETF', price: '88.45', change: '+0.4%', isPositive: true },
    ],
  },
  'capital-flow': {
    id: 'capital-flow',
    title: 'Capital Flows: Where is the Smart Money Moving in Q4?',
    source: 'Financial Times',
    date: 'September 23, 2025 • 12 hours ago',
    category: 'Capital Flow',
    summary: 'Sankey flow illustrating institutional inflows and outflows across venture and private equity bets.',
    graphTypeLabel: 'Sankey Flow',
    graphType: 'sankey',
    tickers: [
      { symbol: 'SFTBY', price: '28.50', change: '-1.5%', isPositive: false },
      { symbol: 'UBER', price: '76.40', change: '+1.2%', isPositive: true },
      { symbol: 'WE', price: '0.12', change: '-5.0%', isPositive: false },
    ],
    indices: [
      { symbol: 'Venture Index', price: '1,200.45', change: '+0.2%', isPositive: true },
      { symbol: 'Private Equity', price: '450.20', change: '-0.8%', isPositive: false },
    ],
  },
  structuring: {
    id: 'structuring',
    title: 'Corporate Structuring: Siemens Spin-off Analysis',
    source: 'Wall Street Journal',
    date: 'September 22, 2025 • 1 day ago',
    category: 'Structuring',
    summary: 'Ownership tree surfacing parent-subsidiary dynamics and upcoming spin-offs at Siemens.',
    graphTypeLabel: 'Ownership Tree',
    graphType: 'tree',
    tickers: [
      { symbol: 'SIEGY', price: '88.20', change: '+0.5%', isPositive: true },
      { symbol: 'ENR', price: '22.10', change: '+4.2%', isPositive: true },
    ],
    indices: [{ symbol: 'DAX', price: '16,400.10', change: '+0.1%', isPositive: true }],
  },
};

export const INTERACTIVE_MODEL_LIST = Object.values(INTERACTIVE_MODELS_DATA);

