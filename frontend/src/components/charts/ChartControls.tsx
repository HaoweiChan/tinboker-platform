import React from 'react';
import { cn } from '@/lib/utils';
import type { TimeframeOption } from '@/services/types';

interface ChartControlsProps {
    timeframe: TimeframeOption;
    onTimeframeChange: (timeframe: TimeframeOption) => void;
    subChart: string;
    onSubChartChange: (subChart: string) => void;
    activeIndicators: string[];
    onToggleIndicator: (indicator: string, active: boolean) => void;
}

export const ChartControls: React.FC<ChartControlsProps> = ({
    timeframe,
    onTimeframeChange,
    subChart,
    onSubChartChange,
    activeIndicators,
    onToggleIndicator,
}) => {
    // Configuration Maps
    const timeframeMap: Record<string, string> = {
        '1D': '日',
        '1W': '週',
        '1M': '月',
    };
    const visibleTimeframes: TimeframeOption[] = ['1D', '1W', '1M'];

    const subChartMap: Record<string, string> = {
        'Volume': '成交量',
        'KD': 'KD',
        'MACD': 'MACD',
        'RSI': 'RSI',
        'Bias': '乖離率',
    };
    const subCharts = Object.keys(subChartMap);

    const indicatorMap: Record<string, string> = {
        'MA5': '5MA',
        'MA20': '20MA',
        'MA60': '60MA',
    };
    const indicators = Object.keys(indicatorMap);

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 p-2 bg-transparent">
            {/* Left Side: Timeframes & Indicators */}
            <div className="flex items-center gap-4 flex-wrap">
                {/* Timeframe Selectors */}
                <div className="flex bg-white dark:bg-slate-800 p-1 rounded-md border border-slate-200 dark:border-slate-700">
                    {visibleTimeframes.map((tf) => (
                        <button
                            key={tf}
                            onClick={() => onTimeframeChange(tf)}
                            className={cn(
                                "px-3 py-1 text-sm font-medium rounded transition-all whitespace-nowrap min-w-[2rem]",
                                timeframe === tf
                                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm font-bold"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            )}
                        >
                            {timeframeMap[tf]}
                        </button>
                    ))}
                    {/* Placeholder for '5分' or generic dropdown if needed in future */}
                </div>

                {/* Indicators (Checkboxes) */}
                <div className="flex items-center gap-3">
                    {indicators.map((ind) => {
                        const isActive = activeIndicators.includes(ind);
                        let colorClass = "bg-slate-500";
                        if (isActive) {
                            if (ind === 'MA5') colorClass = "bg-[#ff9800] border-[#ff9800]";
                            else if (ind === 'MA20') colorClass = "bg-[#2962ff] border-[#2962ff]";
                            else if (ind === 'MA60') colorClass = "bg-[#00bcd4] border-[#00bcd4]";
                        }

                        return (
                            <button
                                key={ind}
                                onClick={() => onToggleIndicator(ind, !isActive)}
                                className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200"
                            >
                                <div className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                    isActive ? colorClass + " text-white" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                )}>
                                    {isActive && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                </div>
                                {indicatorMap[ind]}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Right Side: SubChart Dropdown */}
            <div className="flex items-center gap-2">
                <div className="relative group">
                    <button className="flex items-center justify-between gap-2 min-w-[100px] px-3 py-1.5 bg-white dark:bg-slate-800 border-2 border-[#2962ff] text-slate-700 dark:text-slate-200 text-sm font-medium rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <span>{subChartMap[subChart] || subChart}</span>
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-1 w-32 py-1 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 hidden group-hover:block z-50">
                        {subCharts.map((sc) => (
                            <button
                                key={sc}
                                onClick={() => onSubChartChange(sc)}
                                className={cn(
                                    "w-full text-left px-4 py-2 text-sm transition-colors",
                                    subChart === sc
                                        ? "bg-slate-100 dark:bg-slate-700 text-[#2962ff] font-medium"
                                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                                )}
                            >
                                {subChartMap[sc]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
