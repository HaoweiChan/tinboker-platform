import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { MultiStockChart } from '@/components/charts/MultiStockChart/MultiStockChart';
import { EventDetailsGrid } from '@/components/charts/MultiStockChart/EventDetailsGrid';
import { getSortedNews, fetchWithFallback } from '@/services';
import { mockStockEvents } from '@/services/mocks';
import { useMemo } from 'react';
import type { TimeframeOption, StockEvent } from '@/services/types';


interface StockOverlayPageProps {
  tickers: string[];
  sidebarWidth?: number;
  onRemoveTicker?: (ticker: string) => void;
}

export const StockOverlayPage: React.FC<StockOverlayPageProps> = ({
  tickers,
  sidebarWidth = 400,
  onRemoveTicker,
}) => {
  const overlayTimeframe = useAppStore((state) => state.overlayTimeframe);
  const selectedEvent = useAppStore((state) => state.selectedEvent);
  const setSelectedEvent = useAppStore((state) => state.setSelectedEvent);
  
  const [stockEvents, setStockEvents] = useState<StockEvent[]>(mockStockEvents);

  // Fetch stock events from API with fallback to mocks
  useEffect(() => {
    fetchWithFallback(
      () => getSortedNews('date'),
      mockStockEvents,
      'getSortedNews'
    ).then(setStockEvents);
  }, []);

  const selectedEventData = useMemo(() => {
    if (!selectedEvent) return null;
    return stockEvents.find((e) => e.id === selectedEvent);
  }, [selectedEvent, stockEvents]);

  return (
    <div className="w-full h-full relative" style={{ marginLeft: '20px', marginRight: '20px', marginTop: '-20px', marginBottom: '-20px' }}>
      <MultiStockChart
        tickers={tickers}
        timeframe={overlayTimeframe as TimeframeOption}
        sidebarWidth={sidebarWidth}
        onRemoveStock={onRemoveTicker}
      />
      
      {/* Event details grid that covers the entire sidebar */}
      {selectedEventData && (
        <EventDetailsGrid
          event={selectedEventData}
          tickers={tickers}
          onClose={() => setSelectedEvent(null)}
          sidebarWidth={sidebarWidth}
        />
      )}
    </div>
  );
};

