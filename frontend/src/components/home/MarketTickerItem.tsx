import React, { useMemo } from 'react';
import TradingViewChart from '@/components/charts/TradingViewChart';
import { generateMockPriceSeries } from '@/services/mocks';

interface MarketTickerItemProps {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  isDark: boolean;
  isActive?: boolean;
  onSelect?: () => void;
}

const MarketTickerItem: React.FC<MarketTickerItemProps> = ({ label, value, change, isPositive, isDark, isActive = false, onSelect }) => {
  const numericValue = Number(value.replace(/,/g, '')) || 100;
  const series = useMemo(() => generateMockPriceSeries(24, numericValue), [numericValue]);
  const baseClasses = `flex flex-col min-w-[140px] p-3 rounded-lg border transition-colors ${
    isDark ? 'hover:bg-white/5 border-transparent hover:border-white/10' : 'hover:bg-slate-50 border-transparent hover:border-slate-200'
  }`;
  const activeClasses = isActive ? (isDark ? 'border-white/30 bg-white/10' : 'border-slate-300 bg-white') : '';

  const content = (
    <>
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className="text-slate-400 text-xs font-bold">{label}</span>
        <div className="w-16 h-8">
          <TradingViewChart
            data={series}
            theme={isDark ? 'dark' : 'light'}
            height={32}
            lineColor={isPositive ? '#22c55e' : '#ef4444'}
            topColor={isPositive ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}
            bottomColor="transparent"
            minimal
            className="h-full w-full"
          />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`font-financial text-sm font-medium ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>{value}</span>
        <span className={`text-xs font-financial ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>{change}</span>
      </div>
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`${baseClasses} ${activeClasses} text-left w-full cursor-pointer`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`${baseClasses} ${activeClasses}`}>
      {content}
    </div>
  );
};

export default MarketTickerItem;
