import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { mockCompanyDetails, mockStockEvents } from '@/services/mocks';
import { useAppStore } from '@/store/useAppStore';
import { filterDataByTimeframe } from '@/utils/chartDataUtils';
import type { TimeframeOption, ChartDataPoint } from '@/services/types';
import { StockChartPanel } from './StockChartPanel/StockChartPanel';
import { useSynchronizedCharts } from '../hooks/useSynchronizedCharts';
import { useGlobalEventLine } from '../hooks/useGlobalEventLine';
import { useSynchronizedCrosshair } from '../hooks/useSynchronizedCrosshair';


interface MultiStockChartProps {
  tickers: string[];
  timeframe: TimeframeOption;
  sidebarWidth?: number;
  onRemoveStock?: (ticker: string) => void;
  onReorderStocks?: (tickers: string[]) => void;
}

const STOCK_COLORS = [
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#A855F7',
  '#EC4899',
  '#EAB308',
];

export const MultiStockChart: React.FC<MultiStockChartProps> = ({
  tickers,
  timeframe,
  sidebarWidth = 400,
  onRemoveStock,
}) => {
  const { selectedEvent, hoveredEvent } = useAppStore();
  const chartRefs = useRef<(IChartApi | null)[]>([]);
  const seriesRefs = useRef<(ISeriesApi<'Area'> | null)[]>([]);
  const [charts, setCharts] = useState<(IChartApi | null)[]>([]);
  const [series, setSeries] = useState<(ISeriesApi<'Area'> | null)[]>([]);

  const chartsData = useMemo(() => {
    return tickers.map((ticker, index) => {
      const companyDetail = mockCompanyDetails[ticker];
      if (!companyDetail) return null;

      const filteredData = filterDataByTimeframe(companyDetail.chartData, timeframe);

      return {
        ticker,
        name: companyDetail.name,
        data: filteredData,
        color: STOCK_COLORS[index % STOCK_COLORS.length],
      };
    }).filter(Boolean) as Array<{
      ticker: string;
      name: string;
      data: ChartDataPoint[];
      color: string;
    }>;
  }, [tickers, timeframe]);

  const selectedEventData = useMemo(() => {
    if (!selectedEvent) return null;
    return mockStockEvents.find((e) => e.id === selectedEvent);
  }, [selectedEvent]);

  const hoveredEventData = useMemo(() => {
    if (!hoveredEvent) return null;
    return mockStockEvents.find((e) => e.id === hoveredEvent.id);
  }, [hoveredEvent]);

  const handleChartReady = useCallback((index: number) => {
    return (chart: IChartApi) => {
      if (chartRefs.current[index] !== chart) {
        chartRefs.current[index] = chart;
        setCharts([...chartRefs.current]);
      }
    };
  }, []);

  const handleSeriesReady = useCallback((index: number) => {
    return (seriesInstance: ISeriesApi<'Area'>) => {
      if (seriesRefs.current[index] !== seriesInstance) {
        seriesRefs.current[index] = seriesInstance;
        setSeries([...seriesRefs.current]);
      }
    };
  }, []);

  const chartReadyCallbacks = useMemo(() => {
    return tickers.map((_, index) => handleChartReady(index));
  }, [tickers.length, handleChartReady]);

  const seriesReadyCallbacks = useMemo(() => {
    return tickers.map((_, index) => handleSeriesReady(index));
  }, [tickers.length, handleSeriesReady]);

  useEffect(() => {
    chartRefs.current = chartRefs.current.slice(0, tickers.length);
    seriesRefs.current = seriesRefs.current.slice(0, tickers.length);
    setCharts(chartRefs.current);
    setSeries(seriesRefs.current);
  }, [tickers.length]);

  useSynchronizedCharts({
    charts,
    enabled: charts.length > 1,
  });

  // Sync crosshair position across all charts when mouse moves
  useSynchronizedCrosshair({
    charts,
    series,
    enabled: charts.length > 1 && series.length > 1,
  });

  // Use hovered event for crosshair display, selected event for details
  const activeEventData = hoveredEventData || selectedEventData;
  
  // Use crosshair-based approach for global event line (when event is selected)
  useGlobalEventLine({
    charts,
    series,
    eventDate: activeEventData?.date ?? null,
    enabled: !!activeEventData,
  });

  if (tickers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full overlay-text-secondary">
        <p>Select stocks to view charts</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto overlay-chart-bg relative" style={{ width: '100%', margin: 0, padding: 0 }}>
      <div className="flex flex-col relative" style={{ width: '100%', margin: 0, padding: 0 }}>
        {chartsData.map((chartData, index) => {
          const isLast = index === chartsData.length - 1;
          const chart = charts[index] || null;

          return (
            <div key={chartData.ticker} className="relative" style={{ width: '100%', margin: 0, padding: 0 }}>
              <StockChartPanel
                ticker={chartData.ticker}
                name={chartData.name}
                data={chartData.data}
                color={chartData.color}
                isLast={isLast}
                sidebarWidth={sidebarWidth}
                chart={chart}
                onRemoveStock={onRemoveStock}
                onChartReady={chartReadyCallbacks[index]}
                onSeriesReady={seriesReadyCallbacks[index]}
              />
            </div>
          );
        })}
      </div>

    </div>
  );
};

