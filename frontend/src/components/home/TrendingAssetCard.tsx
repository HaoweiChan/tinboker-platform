import React from 'react';
import { StockLogo } from '@/components/common/StockLogo';
import { SimpleSparkline } from '@/components/charts/SimpleSparkline';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { MessageCircle } from 'lucide-react';

// Standard Hex Colors for charts
const COLOR_RED = '#ef4444';  // Tailwind red-500
const COLOR_GREEN = '#22c55e'; // Tailwind green-500

interface TrendingAssetCardProps {
  stock: {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    icon_url?: string;
    sparkline?: number[];
    mentions?: number; // Number of podcast mentions
  };
  onSelect: (symbol: string, e?: React.MouseEvent) => void;
  variant?: 'mobile' | 'desktop';
  className?: string;
}

export const TrendingAssetCard: React.FC<TrendingAssetCardProps> = ({
  stock,
  onSelect,
  variant = 'mobile',
  className
}) => {
  const isMobile = variant === 'mobile';
  const stockColorMode = useAppStore((state) => state.stockColorMode);

  // Unified Color Logic: Single Source of Truth
  const isPositive = stock.changePercent > 0;
  const isNegative = stock.changePercent < 0;

  // Determine color based on mode and direction
  let trendColor: string;
  let trendColorClass: string;

  if (isPositive) {
    // Positive change
    if (stockColorMode === 'TW') {
      trendColor = COLOR_RED;
      trendColorClass = 'text-red-600 dark:text-red-400';
    } else {
      trendColor = COLOR_GREEN;
      trendColorClass = 'text-green-600 dark:text-green-400';
    }
  } else if (isNegative) {
    // Negative change
    if (stockColorMode === 'TW') {
      trendColor = COLOR_GREEN;
      trendColorClass = 'text-green-600 dark:text-green-400';
    } else {
      trendColor = COLOR_RED;
      trendColorClass = 'text-red-600 dark:text-red-400';
    }
  } else {
    // Zero change (neutral)
    trendColor = '#64748b'; // slate-500
    trendColorClass = 'text-slate-600 dark:text-slate-400';
  }

  return (
    <button
      onClick={(e) => onSelect(stock.symbol, e)}
      className={cn(
        'flex flex-col rounded-xl transition-all duration-300 p-3',
        // Light Mode: Distinct Card Widget
        'bg-white border border-slate-200 shadow-sm',
        'hover:shadow-md hover:bg-slate-50',
        // Dark Mode: Glass Card
        'dark:bg-slate-900/60 dark:border-white/10 dark:backdrop-blur-md dark:shadow-none',
        'dark:hover:bg-slate-800/80 dark:hover:shadow-lg dark:hover:shadow-amber-900/10',
        isMobile
          ? 'flex-none w-36 min-w-[140px] snap-center'
          : 'w-full',
        className
      )}
    >
      {/* Header: Logo + Ticker/Name (Left) | Price + Badge (Right) */}
      <div className="flex justify-between items-start w-full mb-2">
        {/* Left Side: Logo + Ticker/Name Stack (Left Aligned) */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Hide icon in mobile view to save space, show only on desktop */}
          {!isMobile && <StockLogo symbol={stock.symbol} size="sm" />}
          <div className="min-w-0 flex-1 text-left">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-50 uppercase tracking-tight">
              {stock.symbol}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {stock.name}
            </div>
            {/* Mentions count from buzz data */}
            {stock.mentions !== undefined && stock.mentions > 0 && (
              <div className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                <MessageCircle size={10} />
                本周提及次數 {stock.mentions}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Price + Badge (Stacked, Right-Aligned) */}
        <div className="flex flex-col items-end shrink-0 ml-2">
          <div className="text-sm font-financial font-medium text-slate-900 dark:text-slate-50">
            {typeof stock.price === 'number' ? stock.price.toFixed(2) : stock.price}
          </div>
          <div className={`text-sm font-bold ${trendColorClass}`}>
            {stock.change >= 0 ? '+' : ''}{typeof stock.changePercent === 'number' ? stock.changePercent.toFixed(2) : stock.changePercent}%
          </div>
        </div>
      </div>

      {/* Chart Area (Full Width) - Uses Unified Color */}
      <div className="w-full h-10 mb-1">
        <SimpleSparkline
          isPositive={isPositive}
          className="w-full h-full"
          width={isMobile ? 140 : 280}
          height={40}
          color={trendColor}
          data={stock.sparkline}
        />
      </div>
    </button>
  );
};

