import type { GraphData, CompanyDetail, TopMover, ConceptType, ConceptMetadata, StockEvent, EventMovementIndicator } from './types';

/**
 * Mock available concepts - simulates GET /api/concepts
 */
export const mockConcepts: ConceptMetadata[] = [
  {
    id: 'robotics',
    title: 'Robotics & Automation',
    description: 'Explore the interconnected world of robotics and automation companies.',
    icon: 'robotics',
    gradient: 'bg-gradient-to-br from-[#E04F3F] to-[#EC7A3C]',
  },
  {
    id: 'ai',
    title: 'Artificial Intelligence',
    description: 'Discover how AI companies are shaping the future of technology.',
    icon: 'ai',
    gradient: 'bg-gradient-to-br from-[#EC7A3C] to-[#F5C563]',
  },
  {
    id: 'energy',
    title: 'Clean Energy',
    description: 'See the network of companies driving the clean energy revolution.',
    icon: 'energy',
    gradient: 'bg-gradient-to-br from-[#F5C563] to-[#4D6B94]',
  },
];

// Helper function to generate OHLCV chart data with extended history
const generateChartData = (
  basePrice: number, 
  days: number = 365,
  trend: 'up' | 'down' | 'neutral' = 'up'
) => {
  const data = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
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

// Company details database
const companyDetails: Record<string, CompanyDetail> = {
  TSLA: {
    ticker: 'TSLA',
    name: 'Tesla Inc.',
    price: 242.84,
    change: 5.32,
    changePercent: 2.24,
    marketCap: 771000000000,
    revenue: 96730000000,
    pe: 78.5,
    dividendYield: 0,
    about: 'Tesla designs, develops, manufactures, and sells electric vehicles, energy generation and storage systems.',
    stats: {
      volume: 125000000,
      beta: 2.05,
      volatility: 0.65,
    },
    chartData: generateChartData(242.84, 365, 'up'),
  },
  NVDA: {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 495.22,
    change: 12.45,
    changePercent: 2.58,
    marketCap: 1220000000000,
    revenue: 60922000000,
    pe: 95.3,
    dividendYield: 0.03,
    about: 'NVIDIA is a leading designer of graphics processing units (GPUs) for gaming, AI, and data centers.',
    stats: {
      volume: 52000000,
      beta: 1.68,
      volatility: 0.52,
    },
    chartData: generateChartData(495.22),
  },
  MSFT: {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    price: 378.91,
    change: 3.21,
    changePercent: 0.85,
    marketCap: 2820000000000,
    revenue: 211915000000,
    pe: 35.7,
    dividendYield: 0.79,
    about: 'Microsoft develops, licenses, and supports software, services, devices, and solutions worldwide.',
    stats: {
      volume: 24000000,
      beta: 0.92,
      volatility: 0.28,
    },
    chartData: generateChartData(378.91),
  },
  GOOGL: {
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 141.80,
    change: -1.23,
    changePercent: -0.86,
    marketCap: 1780000000000,
    revenue: 307394000000,
    pe: 26.8,
    dividendYield: 0,
    about: 'Alphabet is a holding company that provides products and services through Google and other subsidiaries.',
    stats: {
      volume: 28000000,
      beta: 1.05,
      volatility: 0.32,
    },
    chartData: generateChartData(141.80, 365, 'down'), // Downtrend for debugging
  },
  AMD: {
    ticker: 'AMD',
    name: 'Advanced Micro Devices',
    price: 122.50,
    change: 4.15,
    changePercent: 3.50,
    marketCap: 198000000000,
    revenue: 23700000000,
    pe: 52.4,
    dividendYield: 0,
    about: 'AMD designs and produces microprocessors, graphics processors, and other semiconductor products.',
    stats: {
      volume: 95000000,
      beta: 1.85,
      volatility: 0.58,
    },
    chartData: generateChartData(122.50),
  },
  PLTR: {
    ticker: 'PLTR',
    name: 'Palantir Technologies',
    price: 24.35,
    change: 0.87,
    changePercent: 3.71,
    marketCap: 52000000000,
    revenue: 2228000000,
    pe: 78.9,
    dividendYield: 0,
    about: 'Palantir builds and deploys software platforms for data integration and analysis.',
    stats: {
      volume: 48000000,
      beta: 2.15,
      volatility: 0.72,
    },
    chartData: generateChartData(24.35),
  },
  SNOW: {
    ticker: 'SNOW',
    name: 'Snowflake Inc.',
    price: 152.80,
    change: -2.45,
    changePercent: -1.58,
    marketCap: 49000000000,
    revenue: 2806000000,
    pe: -42.1,
    dividendYield: 0,
    about: 'Snowflake provides a cloud-based data platform for data warehousing and analytics.',
    stats: {
      volume: 7200000,
      beta: 1.42,
      volatility: 0.48,
    },
    chartData: generateChartData(152.80, 365, 'down'), // Downtrend for debugging
  },
  ABB: {
    ticker: 'ABB',
    name: 'ABB Ltd',
    price: 48.90,
    change: 0.65,
    changePercent: 1.35,
    marketCap: 95000000000,
    revenue: 29450000000,
    pe: 28.5,
    dividendYield: 2.45,
    about: 'ABB specializes in robotics, power, heavy electrical equipment, and automation technology.',
    stats: {
      volume: 1800000,
      beta: 1.12,
      volatility: 0.35,
    },
    chartData: generateChartData(48.90),
  },
  ROK: {
    ticker: 'ROK',
    name: 'Rockwell Automation',
    price: 268.45,
    change: 1.82,
    changePercent: 0.68,
    marketCap: 31000000000,
    revenue: 9050000000,
    pe: 31.2,
    dividendYield: 1.95,
    about: 'Rockwell Automation provides industrial automation and digital transformation solutions.',
    stats: {
      volume: 850000,
      beta: 1.05,
      volatility: 0.29,
    },
    chartData: generateChartData(268.45),
  },
  IRBT: {
    ticker: 'IRBT',
    name: 'iRobot Corporation',
    price: 51.23,
    change: -0.45,
    changePercent: -0.87,
    marketCap: 1400000000,
    revenue: 1183000000,
    pe: 18.7,
    dividendYield: 0,
    about: 'iRobot designs and builds consumer robots, including the Roomba vacuum cleaning robot.',
    stats: {
      volume: 425000,
      beta: 1.25,
      volatility: 0.45,
    },
    chartData: generateChartData(51.23),
  },
  INTC: {
    ticker: 'INTC',
    name: 'Intel Corporation',
    price: 42.18,
    change: -0.32,
    changePercent: -0.75,
    marketCap: 177000000000,
    revenue: 79024000000,
    pe: 48.2,
    dividendYield: 1.52,
    about: 'Intel designs and manufactures computer processors and related technologies.',
    stats: {
      volume: 52000000,
      beta: 0.68,
      volatility: 0.38,
    },
    chartData: generateChartData(42.18),
  },
  ENPH: {
    ticker: 'ENPH',
    name: 'Enphase Energy',
    price: 118.75,
    change: 3.25,
    changePercent: 2.81,
    marketCap: 16000000000,
    revenue: 2290000000,
    pe: 52.8,
    dividendYield: 0,
    about: 'Enphase Energy delivers microinverter technology for the solar industry.',
    stats: {
      volume: 4200000,
      beta: 1.95,
      volatility: 0.68,
    },
    chartData: generateChartData(118.75),
  },
  FSLR: {
    ticker: 'FSLR',
    name: 'First Solar Inc.',
    price: 202.35,
    change: 1.85,
    changePercent: 0.92,
    marketCap: 21500000000,
    revenue: 3318000000,
    pe: 19.8,
    dividendYield: 0,
    about: 'First Solar manufactures and sells solar panels using thin film photovoltaic modules.',
    stats: {
      volume: 1850000,
      beta: 1.22,
      volatility: 0.42,
    },
    chartData: generateChartData(202.35),
  },
  NEE: {
    ticker: 'NEE',
    name: 'NextEra Energy',
    price: 75.40,
    change: 0.45,
    changePercent: 0.60,
    marketCap: 152000000000,
    revenue: 28100000000,
    pe: 25.3,
    dividendYield: 2.38,
    about: 'NextEra Energy is a leading clean energy company and the world\'s largest producer of wind and solar energy.',
    stats: {
      volume: 8500000,
      beta: 0.48,
      volatility: 0.22,
    },
    chartData: generateChartData(75.40),
  },
  PLUG: {
    ticker: 'PLUG',
    name: 'Plug Power Inc.',
    price: 3.82,
    change: 0.12,
    changePercent: 3.24,
    marketCap: 2200000000,
    revenue: 891000000,
    pe: -2.5,
    dividendYield: 0,
    about: 'Plug Power provides hydrogen fuel cell systems for electric mobility and stationary power markets.',
    stats: {
      volume: 18000000,
      beta: 2.35,
      volatility: 0.85,
    },
    chartData: generateChartData(3.82),
  },
  SEDG: {
    ticker: 'SEDG',
    name: 'SolarEdge Technologies',
    price: 28.95,
    change: -0.75,
    changePercent: -2.53,
    marketCap: 1600000000,
    revenue: 2976000000,
    pe: 12.4,
    dividendYield: 0,
    about: 'SolarEdge provides smart energy solutions for photovoltaic arrays and energy storage.',
    stats: {
      volume: 3200000,
      beta: 1.88,
      volatility: 0.72,
    },
    chartData: generateChartData(28.95, 365, 'down'), // Downtrend for debugging
  },
};

// Top movers data
const topMoversData: TopMover[] = [
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

// Export all mock data
export const mockGraphData: Record<ConceptType, GraphData> = {
  robotics: roboticsGraphData,
  ai: aiGraphData,
  energy: energyGraphData,
};

export const mockCompanyDetails = companyDetails;
export const mockTopMovers = topMoversData;


// Mock Stock Events
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

// Helper function to calculate event movement indicators
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

// Export function to get events for specific tickers
export const getEventsForTickers = (tickers: string[]): StockEvent[] => {
  return mockStockEvents.filter(event =>
    event.relatedTickers.some(ticker => tickers.includes(ticker))
  );
};

