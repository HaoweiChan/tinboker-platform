export interface Stock {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  mentions?: number;
  strength?: number; // 0-100 for bar width
}

export interface Channel {
  id: string;
  name: string;
  avatar: string; // 'IMG' or char
  latestTitle: string;
  colorClass: string;
}

export interface Highlight {
  text: string;
  symbol?: string;
  type?: 'stock';
}

export interface SummaryPoint {
  text: string;
  highlights?: Highlight[];
}

export interface Episode {
  id: string;
  showName: string;
  showAvatar: string;
  showColorClass: string;
  title: string;
  timeAgo: string;
  isHot?: boolean;
  tags: string[];
  summary: SummaryPoint[];
  imageUrl?: string; // Optional episode image URL (from Spotify)
  spotifyUri?: string; // Optional Spotify URI for playback
  keyInsights?: string[];
}

export const MOCK_STOCKS: Stock[] = [
  {
    name: '廣達',
    symbol: '2382.TW',
    price: 285.5,
    change: 12.0,
    changePercent: 4.38,
    mentions: 3,
    strength: 85,
  },
  {
    name: '奇鋐',
    symbol: '3017.TW',
    price: 620.0,
    change: 35.0,
    changePercent: 5.98,
    mentions: 1,
    strength: 95,
  },
  {
    name: '大立光',
    symbol: '3008.TW',
    price: 2450.0,
    change: -20.0,
    changePercent: -0.81,
    mentions: 1,
    strength: 30,
  },
];

export const ACTIVE_CHANNELS: Channel[] = [
  {
    id: '1',
    name: '股癌 Gooaye',
    avatar: 'IMG',
    latestTitle: 'EP452 輝達供應鏈大風吹？散熱族...',
    colorClass: 'bg-slate-200 text-slate-600',
  },
  {
    id: '2',
    name: '財報狗',
    avatar: '狗',
    latestTitle: '航運股還有戲嗎？紅海危機解析',
    colorClass: 'bg-indigo-100 text-indigo-600',
  },
];

export const MOCK_EPISODES: Episode[] = [
  {
    id: '1',
    showName: '股癌 Gooaye',
    showAvatar: 'IMG',
    showColorClass: 'bg-slate-200 text-slate-600',
    title: 'EP452 輝達供應鏈大風吹？散熱族群怎麼看',
    timeAgo: '2小時前',
    isHot: true,
    tags: ['#AI伺服器', '#散熱'],
    summary: [
      {
        text: '# 奇鋐營收超預期 (#time:120)\n提到 奇鋐 (3017) 近期營收表現優於預期，主要受惠於 3D VC 需求強勁。這是一個非常長的一段文字，目的是為了測試 Episode Card 的截斷效果。如果這段文字如果不夠長，我們就繼續加長，直到它超過三行為止。奇鋐的股價近期表現強勢，法人看好其在 AI 伺服器散熱解決方案的領導地位，預期將持續受惠於市場需求的增長。',
        highlights: [
          { text: '奇鋐 (3017)', type: 'stock', symbol: '3017' }
        ]
      },
      {
        text: '# 廣達 AI 展望 (#time:340)\n針對 廣達 (2382) 看法正向，認為 AI 伺服器訂單能見度高。',
        highlights: [
          { text: '廣達 (2382)', type: 'stock', symbol: '2382' }
        ]
      }
    ],
    keyInsights: [
      '奇鋐 (3017) 受惠於 3D VC 需求強勁，營收表現優於預期。',
      '廣達 (2382) AI 伺服器訂單能見度高，維持正向看法。',
      '散熱族群整體評價提升，建議關注相關供應鏈。'
    ]
  },
  {
    id: '2',
    showName: '財報狗',
    showAvatar: '狗',
    showColorClass: 'bg-indigo-100 text-indigo-600',
    title: '航運股還有戲嗎？紅海危機解析',
    timeAgo: '昨天',
    isHot: false,
    tags: ['#航運', '#宏觀'],
    summary: [
      {
        text: '針對近期紅海危機造成的運價上漲進行分析，是否為短期現象？長榮、陽明操作策略分享...',
        highlights: []
      }
    ]
  },
  {
    id: '3',
    showName: '股癌 Gooaye',
    showAvatar: 'IMG',
    showColorClass: 'bg-slate-200 text-slate-600',
    title: 'EP451 台積電法說會解讀：2024 展望',
    timeAgo: '3天前',
    isHot: false,
    tags: ['#半導體', '#法說會'],
    summary: [
      {
        text: '針對 台積電 (2330) 最新法說會進行深度解讀，AI 需求持續帶動先進製程訂單。',
        highlights: [
          { text: '台積電 (2330)', type: 'stock', symbol: '2330' }
        ]
      }
    ]
  },
  {
    id: '4',
    showName: '財報狗',
    showAvatar: '狗',
    showColorClass: 'bg-indigo-100 text-indigo-600',
    title: '金融股能不能買？升息循環的影響',
    timeAgo: '4天前',
    isHot: false,
    tags: ['#金融', '#升息'],
    summary: [
      {
        text: '分析升息環境下銀行股的獲利展望，中信金、富邦金的投資策略建議...',
        highlights: []
      }
    ]
  },
  {
    id: '5',
    showName: '股癌 Gooaye',
    showAvatar: 'IMG',
    showColorClass: 'bg-slate-200 text-slate-600',
    title: 'EP450 電動車產業鏈分析：特斯拉降價後的連鎖效應',
    timeAgo: '5天前',
    isHot: false,
    tags: ['#電動車', '#特斯拉'],
    summary: [
      {
        text: '特斯拉降價策略對 鴻海 (2317) 電動車代工業務的影響分析。',
        highlights: [
          { text: '鴻海 (2317)', type: 'stock', symbol: '2317' }
        ]
      }
    ]
  },
  {
    id: '6',
    showName: '財報狗',
    showAvatar: '狗',
    showColorClass: 'bg-indigo-100 text-indigo-600',
    title: '生技股投資指南：新藥開發風險與機會',
    timeAgo: '1週前',
    isHot: false,
    tags: ['#生技', '#新藥'],
    summary: [
      {
        text: '解析生技產業的投資邏輯，藥華藥、合一的研發進度追蹤...',
        highlights: []
      }
    ]
  },
  {
    id: '7',
    showName: '股癌 Gooaye',
    showAvatar: 'IMG',
    showColorClass: 'bg-slate-200 text-slate-600',
    title: 'EP449 記憶體產業復甦訊號？美光財報解讀',
    timeAgo: '1週前',
    isHot: false,
    tags: ['#記憶體', '#美光'],
    summary: [
      {
        text: '分析美光財報對 南亞科 (2408) 和 華邦電 (2344) 的啟示。',
        highlights: [
          { text: '南亞科 (2408)', type: 'stock', symbol: '2408' },
          { text: '華邦電 (2344)', type: 'stock', symbol: '2344' }
        ]
      }
    ]
  },
  {
    id: '8',
    showName: '財報狗',
    showAvatar: '狗',
    showColorClass: 'bg-indigo-100 text-indigo-600',
    title: '房地產市場觀察：營建股還能投資嗎？',
    timeAgo: '2週前',
    isHot: false,
    tags: ['#營建', '#房地產'],
    summary: [
      {
        text: '政府打房政策對營建股的影響，長虹、興富發的投資價值評估...',
        highlights: []
      }
    ]
  }
];

