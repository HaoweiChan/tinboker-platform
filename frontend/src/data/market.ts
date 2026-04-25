export const MARKET_INDICES = [
  { id: 'spx', label: '標普 500', value: '6,617.33', change: '-0.83%', isPositive: false, ticker: 'INDEXCBOE: SPX', baseValue: 6617 },
  { id: 'nasdaq', label: '那斯達克 100', value: '20,394.21', change: '-1.20%', isPositive: false, ticker: 'INDEXNASDAQ: NDX', baseValue: 20394 },
  { id: 'dow', label: '道瓊工業', value: '44,782.00', change: '+0.32%', isPositive: true, ticker: 'INDEXDJX: DJI', baseValue: 44782 },
  { id: 'nikkei', label: '日經 225', value: '38,537.65', change: '-0.34%', isPositive: false, ticker: 'INDEXNIKKEI: NI225', baseValue: 38537 },
  { id: 'sse', label: '上證綜合', value: '3,946.74', change: '+0.18%', isPositive: true, ticker: 'SHA: 000001', baseValue: 3946 },
  { id: 'btc', label: '比特幣', value: '93,120.50', change: '-2.45%', isPositive: false, ticker: 'CRYPTO: BTCUSD', baseValue: 93120 },
  { id: 'gold', label: '黃金期貨', value: '2,650.10', change: '+0.80%', isPositive: true, ticker: 'COMEX: GC', baseValue: 2650 },
];

export const TICKER_DATA = [
  { name: '加權', ticker: 'TAIEX', value: '21,850', change: '▲', isPositive: true },
  { name: '櫃買', ticker: 'OTC', value: '250.3', change: '▼', isPositive: false },
  { name: 'NVDA', ticker: 'NVDA', value: '118.5', change: '▲', isPositive: true },
  { name: 'TSM', ticker: 'TSM', value: '172.0', change: '▲', isPositive: true },
  { name: 'AAPL', ticker: 'AAPL', value: '216.4', change: '▼', isPositive: false },
];

export const TOP_MOVERS = [
  { rank: 1, symbol: 'PLTR', name: 'Palantir', price: '$24.35', change: '+3.71%', isPositive: true },
  { rank: 2, symbol: 'AMD', name: 'AMD', price: '$122.50', change: '+3.50%', isPositive: true },
  { rank: 3, symbol: 'PLUG', name: 'Plug Power', price: '$3.82', change: '+3.24%', isPositive: true },
  { rank: 4, symbol: 'ENPH', name: 'Enphase', price: '$118.75', change: '+2.81%', isPositive: true },
  { rank: 5, symbol: 'NVDA', name: 'NVIDIA', price: '$495.22', change: '+2.58%', isPositive: true },
];

export const TOP_INDUSTRIES = [
  { rank: 1, label: '半導體', leaders: 'NVDA, AMD', change: '+3.2%', capital: '$11.4T', isPositive: true },
  { rank: 2, label: '航太', leaders: 'BA, AIR', change: '+2.6%', capital: '$2.1T', isPositive: true },
  { rank: 3, label: '電動車與汽車', leaders: 'TSLA, BYD', change: '+1.8%', capital: '$4.0T', isPositive: true },
  { rank: 4, label: '網路通訊', leaders: 'CSCO, ANET', change: '+0.9%', capital: '$1.3T', isPositive: true },
  { rank: 5, label: '金融', leaders: 'JPM, HSBC', change: '-0.6%', capital: '$5.5T', isPositive: false },
];

