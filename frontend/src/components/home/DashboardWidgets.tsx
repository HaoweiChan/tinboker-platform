import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui';
import { Skeleton } from '@/components/ui/Skeleton';
import { Zap, Mic, MessageCircle } from 'lucide-react';
import { getPopularSearches } from '@/services/api/search';
import { type TopMover, type Podcast, getStockByTicker } from '@/services/api';
import { recommendationService } from '@/services/recommendationService';
import { SimpleSparkline } from '@/components/charts/SimpleSparkline';
import { StockLogo } from '@/components/common/StockLogo';
import { TrendingAssetCard } from '@/components/home/TrendingAssetCard';
import { cn } from '@/lib/utils';
import { handleNavigation } from '@/utils/navigation';
import { trackClick } from '@/services/api/analytics';
import { useStockTrendColor } from '@/hooks/useStockTrendColor';

interface PopularTickersWidgetProps {
  isMobile?: boolean;
}

interface StockCardItemProps {
  stock: {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    mentions?: number;
    sparkline?: number[];
  };
  isMobile?: boolean;
  onSelect: (symbol: string, e?: React.MouseEvent) => void;
  showMentions?: boolean;
  showSparkline?: boolean;
  variant?: 'compact' | 'horizontal';
  className?: string;
}

export const StockCardItem: React.FC<StockCardItemProps> = ({ stock, isMobile, onSelect, showMentions = true, showSparkline = false, className }) => {
  const trendColor = useStockTrendColor(stock.change);
  return (
    <button
      onClick={(e) => onSelect(stock.symbol, e)}
      className={cn(
        'rounded-xl transition-all duration-300 p-3 glass-card',
        'hover:shadow-md hover:scale-[1.02] hover:bg-slate-50 dark:hover:bg-slate-800/80 dark:hover:border-amber-500/30',
        'active:scale-95',
        isMobile
          ? 'flex-none w-36 snap-center flex flex-col justify-between mx-1 first:ml-4'
          : 'w-full flex items-center justify-between group',
        className
      )}
    >
      {isMobile ? (
        // Mobile "Fundamental Card" Layout - 30-Day Trend View
        <div className="w-full flex flex-col gap-2">
          {/* Top Row: Ticker Symbol + Name */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <StockLogo symbol={stock.symbol} size="sm" className="w-4 h-4" />
              <div className="text-slate-900 dark:text-slate-50 text-[10px] font-bold tracking-wider">
                {stock.symbol}
              </div>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate line-clamp-1">
              {stock.name}
            </div>
          </div>

          {/* Middle: Area Chart (30-Day View) */}
          <div className="w-full h-8 -mx-1 opacity-80 grayscale-[0.3]">
            <SimpleSparkline
              isPositive={stock.change >= 0}
              className="w-full h-full"
              width={144}
              height={32}
              data={stock.sparkline}
            />
          </div>

          {/* Bottom Row: Price + 30D Badge */}
          <div className="flex items-end justify-between">
            <div className="font-bold font-financial text-sm text-slate-900 dark:text-slate-50 leading-none">
              {typeof stock.price === 'number' ? stock.price.toFixed(2) : stock.price}
            </div>
            <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${trendColor.badge}`}>
              {stock.change >= 0 ? '+' : ''}{typeof stock.changePercent === 'number' ? stock.changePercent.toFixed(2) : stock.changePercent}%
            </div>
          </div>
        </div>
      ) : (
        // Desktop Layout (Compact & Clean)
        <>
          <div className="flex items-center gap-3">
            {/* Stock Logo */}
            <StockLogo symbol={stock.symbol} size="md" className="w-12 h-10" />

            {/* Name & Mentions */}
            <div className="text-left">
              <div className="font-bold text-slate-900 dark:text-slate-200 text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors text-left">
                {stock.name}
              </div>
              {showMentions && (
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 text-left">
                  <Zap size={10} className="fill-amber-500 text-amber-500 dark:text-amber-400" />
                  本周提及次數 {stock.mentions}
                </div>
              )}
            </div>
          </div>

          {/* Sparkline (Middle) */}
          {showSparkline && (
            <div className="h-8 flex-1 max-w-[60px] flex items-center opacity-80 mx-2">
              <SimpleSparkline
                isPositive={stock.change >= 0}
                className="w-full h-full"
                width={64}
                height={32}
                data={stock.sparkline}
              />
            </div>
          )}

          {/* Price & Change */}
          <div className="text-right">
            <div className="font-bold font-financial text-sm text-slate-900 dark:text-slate-50">
              {typeof stock.price === 'number' ? stock.price.toFixed(2) : stock.price}
            </div>
            <div className={`text-[10px] font-bold ${trendColor.text} mt-0.5`}>
              {stock.change >= 0 ? '+' : ''}{typeof stock.changePercent === 'number' ? stock.changePercent.toFixed(2) : stock.changePercent}%
            </div>
          </div>
        </>
      )}
    </button>
  );
};

interface PopularTickersWidgetProps {
  isMobile?: boolean;
  onTickerSelect?: (symbol: string) => void;
}

// Extended TopMover with mentions count
interface BuzzStock extends TopMover {
  mentions?: number;
}

export const PopularTickersWidget: React.FC<PopularTickersWidgetProps> = ({ isMobile, onTickerSelect }) => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<BuzzStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDays, setActiveDays] = useState(7);

  useEffect(() => {
    const fetchBuzzStocks = async () => {
      setLoading(true);
      try {
        // Progressive fallback: 7d -> 14d -> 30d
        const fallbackWindows = [7, 14, 30];
        let buzzData: Awaited<ReturnType<typeof recommendationService.getMostDiscussedTickers>> = [];
        let usedDays = 7;
        for (const days of fallbackWindows) {
          buzzData = await recommendationService.getMostDiscussedTickers(days, 10);
          usedDays = days;
          if (buzzData && buzzData.length > 0) break;
        }
        setActiveDays(usedDays);

        if (!buzzData || buzzData.length === 0) {
          setStocks([]);
          setLoading(false);
          return;
        }

        // 2. Enrich each ticker with stock data (price, sparkline)
        const enrichedStocks = await Promise.all(
          buzzData.map(async (buzz) => {
            try {
              // Strip .TW suffix for API call (API expects '2330' not '2330.TW')
              const apiTicker = buzz.ticker.replace(/\.TW$/i, '');
              // Fetch stock data with 1M timeframe for sparkline
              const stockData = await getStockByTicker(apiTicker, '1M', { silent: true });
              // Filter out undefined values from sparkline data
              const sparklineData = stockData?.chartData
                ?.map(d => d.close)
                .filter((v): v is number => v !== undefined) || [];
              return {
                ticker: buzz.ticker, // Keep original ticker for display
                name: stockData?.name || buzz.ticker,
                price: stockData?.price || 0,
                change: stockData?.change || 0,
                changePercent: stockData?.changePercent || 0,
                sparkline: sparklineData,
                mentions: buzz.count, // Include mention count from buzz
              };
            } catch {
              // If stock fetch fails, return basic info
              return {
                ticker: buzz.ticker,
                name: buzz.ticker,
                price: 0,
                change: 0,
                changePercent: 0,
                sparkline: [],
                mentions: buzz.count,
              };
            }
          })
        );

        setStocks(enrichedStocks);
      } catch (error) {
        console.error('[PopularTickersWidget] Failed to fetch buzz stocks:', error);
        setStocks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBuzzStocks();
  }, []);

  const handleTickerClick = (symbol: string, e?: React.MouseEvent) => {
    trackClick({ type: 'stock', id: symbol.split('.')[0] });
    const ticker = symbol.split('.')[0];

    if (onTickerSelect) {
      onTickerSelect(ticker);
      return;
    }

    if (e) {
      handleNavigation(e, `/stock/${ticker}`, navigate);
    } else {
      navigate(`/stock/${ticker}`);
    }
  };

  // Transform BuzzStock to stock format for card display
  const transformedStocks = stocks.map(stock => ({
    symbol: stock.ticker,
    name: stock.name,
    price: stock.price,
    change: stock.change,
    changePercent: stock.changePercent,
    mentions: stock.mentions, // Include mentions from buzz data
    sparkline: stock.sparkline,
  }));

  const Content = (
    <>
      <div className={`mb-2 ${isMobile ? 'mb-2' : ''}`}>
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 pb-1">
          <MessageCircle size={14} className="text-amber-500" />
          市場焦點 <span className="font-normal text-slate-400 dark:text-slate-500">({activeDays}天)</span>
        </h3>
      </div>
      <div className={`${isMobile ? 'flex gap-4 overflow-x-auto snap-x no-scrollbar p-0' : 'flex flex-col gap-3'}`}>
        {loading ? (
          // Skeleton loader matching ActiveChannels style
          <>
            {[...Array(isMobile ? 5 : 10)].map((_, i) => (
              <div key={i} className={cn(
                'rounded-xl flex flex-col p-3 border shadow-sm',
                // Light Mode
                'bg-white border-slate-200',
                // Dark Mode
                'dark:bg-slate-900/60 dark:border-white/10 dark:backdrop-blur-md',
                isMobile
                  ? 'flex-shrink-0 w-36 min-w-[140px] snap-center'
                  : 'w-full'
              )}>
                {/* Header: Logo + Ticker/Name (Left) | Price + Badge (Right) */}
                <div className="flex justify-between items-start w-full mb-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <Skeleton className="w-5 h-5 rounded shrink-0" />
                    <div className="space-y-1 flex-1 min-w-0">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1 ml-2 shrink-0">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                </div>

                {/* Chart */}
                <Skeleton className="h-10 w-full rounded mb-1" />
              </div>
            ))}
          </>
        ) : transformedStocks.length > 0 ? (
          transformedStocks.map((stock) => (
            <TrendingAssetCard
              key={stock.symbol}
              stock={stock}
              onSelect={handleTickerClick}
              variant={isMobile ? 'mobile' : 'desktop'}
            />
          ))
        ) : (
          <div className="text-center py-4 text-slate-500 text-sm">目前沒有資料</div>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div className="mb-6 block lg:hidden">
        {Content}
      </div>
    );
  }

  return (
    <div className="h-full hidden lg:block">
      {Content}
    </div>
  );
};

interface ActiveChannelsWidgetProps {
  isMobile?: boolean;
}

export const ActiveChannelsWidget: React.FC<ActiveChannelsWidgetProps> = ({ isMobile }) => {
  const navigate = useNavigate();
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPodcasts = async () => {
      setLoading(true);
      try {
        const data = await getPopularSearches();

        // Transform SearchResultItem to Podcast format
        // Note: We might be missing some fields like episode_count if not in metadata,
        // but SearchResultItem.subtitle usually contains "X Episodes"
        const trendingPodcasts = data.podcasts.map(item => {
          // Parse episode count from subtitle "X Episodes" if possible
          const epCountMatch = (item.subtitle || "").match(/(\d+)/);
          const episode_count = epCountMatch ? parseInt(epCountMatch[1], 10) : 0;

          return {
            id: item.id.replace('podcast-', ''), // clean ID
            name: item.title,
            episode_count: episode_count,
            image_url: item.icon_url,
            // mocked/missing fields
            created_at: undefined,
            updated_at: undefined
          } as Podcast;
        });

        setPodcasts(trendingPodcasts);
      } catch (error) {
        console.error('[ActiveChannelsWidget] Failed to fetch podcasts:', error);
        setPodcasts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPodcasts();
  }, []);

  const handleChannelClick = (channelName: string, e?: React.MouseEvent) => {
    // We don't have ID here easily, but name acts as ID for now or we find the podcast obj
    const podcast = podcasts.find(p => p.name === channelName);
    if (podcast) {
      trackClick({ type: 'podcast', id: podcast.id });
    }

    const url = `/podcaster/${encodeURIComponent(channelName)}`;
    if (e) {
      handleNavigation(e, url, navigate);
    } else {
      navigate(url);
    }
  };

  // Helper to get avatar and color for podcast
  const getPodcastStyle = (name: string) => {
    if (name.includes('股癌')) {
      return { avatar: 'IMG', colorClass: 'bg-slate-200 text-slate-600' };
    } else if (name.includes('財報狗')) {
      return { avatar: '狗', colorClass: 'bg-indigo-100 text-indigo-600' };
    }
    // Default
    const initials = name.substring(0, 2).toUpperCase();
    return { avatar: initials, colorClass: 'bg-amber-100 text-amber-600' };
  };

  const Content = (
    <>
      <div className={`mb-1 ${isMobile ? 'mb-1' : ''}`}>
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Mic size={14} />
          熱門頻道
        </h3>
      </div>
      <div className={`${isMobile ? 'flex gap-4 overflow-x-auto pb-0 snap-x no-scrollbar p-0' : 'flex flex-col gap-3'}`}>
        {loading ? (
          isMobile ? (
            // Mobile skeleton - Vertical Layout
            <>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex-shrink-0 min-w-[140px] w-36 snap-center p-3 rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col gap-3">
                  <Skeleton className="w-full aspect-square rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </>
          ) : (
            // Desktop skeleton
            <>
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 shadow-sm">
                  <div className="flex items-center gap-4 flex-1">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="w-5 h-5" />
                </div>
              ))}
            </>
          )
        ) : podcasts.length > 0 ? (
          podcasts.map((podcast) => {
            const style = getPodcastStyle(podcast.name);
            const coverImage = podcast.image_url;
            return (
              <button
                key={podcast.id}
                onClick={(e) => handleChannelClick(podcast.name, e)}
                className={cn(
                  'rounded-xl transition-all duration-300 p-3 text-left',
                  // Light Mode: Distinct Card Widget
                  'bg-white border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)]',
                  'hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:bg-slate-50',
                  // Dark Mode: Glass Card
                  'dark:bg-slate-900/70 dark:border-white/10 dark:backdrop-blur-md dark:shadow-none',
                  'dark:hover:bg-slate-800/80 dark:hover:shadow-lg dark:hover:shadow-amber-900/10',
                  isMobile
                    ? 'flex-shrink-0 min-w-[140px] w-36 snap-center flex flex-col items-start'
                    : 'w-full flex items-center justify-between group'
                )}
              >
                {isMobile ? (
                  // Mobile Layout - Vertical Stack (Netflix/Spotify Style)
                  <div className="w-full flex flex-col gap-2">
                    {/* Top: Square Cover Image */}
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={podcast.name}
                        className="w-full aspect-square rounded-lg object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                      />
                    ) : (
                      <div className={`w-full aspect-square rounded-lg flex items-center justify-center font-bold text-xl ${style.colorClass}`}>
                        {style.avatar}
                      </div>
                    )}

                    {/* Bottom: Text Info */}
                    <div className="w-full">
                      <div className="font-bold text-slate-900 dark:text-slate-50 text-xs line-clamp-1 mb-0.5">
                        {podcast.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {podcast.episode_count} 集
                      </div>
                    </div>
                  </div>
                ) : (
                  // Desktop Layout
                  <>
                    <div className="flex items-center gap-4 overflow-hidden flex-1 min-w-0">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={podcast.name}
                          className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${style.colorClass}`}>
                          {style.avatar}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 dark:text-slate-50 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors truncate">{podcast.name}</div>
                        <div className="text-xs text-slate-500 truncate mt-0.5">
                          {podcast.episode_count} 集
                        </div>
                      </div>
                    </div>
                    <div className="text-slate-400 dark:text-slate-600 shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </>
                )}
              </button>
            );
          })
        ) : (
          <div className="text-center py-4 text-slate-500 text-sm">目前沒有資料</div>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div className="mb-6 block lg:hidden">
        {Content}
      </div>
    );
  }

  return (
    <div className="h-full hidden lg:block">
      {Content}
    </div>
  );
};

const SidebarStockRow: React.FC<{ stock: TopMover; onClick: (symbol: string, e?: React.MouseEvent) => void }> = ({ stock, onClick }) => {
  const trendColor = useStockTrendColor(stock.changePercent);
  return (
    <button
      onClick={(e) => onClick(stock.ticker, e)}
      className="w-full text-left cursor-pointer hover:opacity-80 transition-opacity"
    >
      <div className="flex justify-between items-center mb-2">
        <div>
          <div className="font-bold text-lg text-slate-900 dark:text-slate-50">{stock.name}</div>
          <div className="text-xs text-slate-500">{stock.ticker}</div>
        </div>
        <div className="text-right">
          <div className="font-bold font-financial text-lg text-slate-900 dark:text-slate-50">{stock.price.toFixed(2)}</div>
          <div className={`text-xs font-bold ${trendColor.text}`}>
            {stock.changePercent >= 0 ? '\u25B2' : '\u25BC'} {Math.abs(stock.changePercent).toFixed(2)}%
          </div>
        </div>
      </div>
    </button>
  );
};

export const SidebarStockWidget: React.FC = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<TopMover[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStocks = async () => {
      setLoading(true);
      try {
        // Use getPopularSearches for sidebar too for consistency
        const data = await getPopularSearches();

        // Transform SearchResultItem to TopMover/Stock format
        const trendingStocks = data.stocks.map(item => ({
          ticker: item.title,
          name: item.subtitle || item.title,
          price: item.metadata?.price || 0,
          change: item.metadata?.change || 0,
          changePercent: item.metadata?.change_percent || 0,
          icon_url: item.icon_url
        }));

        setStocks(trendingStocks.slice(0, 5));
      } catch (error) {
        console.error('[SidebarStockWidget] Failed to fetch stocks:', error);
        setStocks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, []);

  const handleTickerClick = (symbol: string, e?: React.MouseEvent) => {
    const ticker = symbol.split('.')[0];
    if (e) {
      handleNavigation(e, `/stock/${ticker}`, navigate);
    } else {
      navigate(`/stock/${ticker}`);
    }
  };

  return (
    <Card className={cn(
      "h-full text-slate-900 dark:text-slate-100",
      // Dark Mode: High-End FinTech Glass
      "dark:border-t dark:border-white/15 dark:border-b dark:border-black/20 dark:border-x dark:border-white/5",
      "dark:bg-gradient-to-br dark:from-slate-800/60 dark:to-slate-900/60 dark:backdrop-blur-md",
      // Light Mode
      "bg-white border-slate-200"
    )}>
      <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800/50 flex flex-row items-center justify-between">
        <h3 className="text-base font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <Zap size={16} fill="currentColor" />
          本集相關個股
        </h3>
        <span className="text-xs text-slate-500">延遲 15 分鐘</span>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {loading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <Skeleton className="h-5 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-5 w-16 mb-1 ml-auto" />
                    <Skeleton className="h-3 w-12 ml-auto" />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : stocks.length > 0 ? (
          stocks.map((stock) => (
            <SidebarStockRow key={stock.ticker} stock={stock} onClick={handleTickerClick} />
          ))
        ) : (
          <div className="text-center py-4 text-slate-500 text-sm">目前沒有資料</div>
        )}
      </CardContent>
    </Card>
  );
};
