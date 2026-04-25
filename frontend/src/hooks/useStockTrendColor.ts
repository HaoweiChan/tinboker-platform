import { useAppStore } from '@/store/useAppStore';


/**
 * Custom hook to get the correct color class for stock price changes
 * based on user's color mode preference (TW or US standard)
 * 
 * @param change - The price change value (positive or negative)
 * @returns Object with color classes for different use cases
 */
export function useStockTrendColor(change: number) {
  const stockColorMode = useAppStore((state) => state.stockColorMode);
  const isPositive = change >= 0;
  
  // Taiwan Standard: Red = Up, Green = Down
  // US/International Standard: Green = Up, Red = Down
  const shouldUseRed = stockColorMode === 'TW' ? isPositive : !isPositive;
  
  return {
    // Text colors
    text: shouldUseRed 
      ? 'text-red-500 dark:text-red-400' 
      : 'text-green-600 dark:text-green-400',
    textLight: shouldUseRed
      ? 'text-red-600 dark:text-red-400'
      : 'text-green-600 dark:text-green-400',
    
    // Background colors (for badges)
    bg: shouldUseRed
      ? 'bg-red-100 dark:bg-red-500/20'
      : 'bg-green-100 dark:bg-green-500/20',
    
    // Combined text + bg (for badges)
    badge: shouldUseRed
      ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
      : 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400',
    
    // For charts
    lineColor: shouldUseRed ? '#ef4444' : '#22c55e',
    topColor: shouldUseRed ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)',
    
    // Emerald variants (used in some components)
    emerald: shouldUseRed
      ? 'text-red-500 dark:text-red-400'
      : 'text-emerald-400',
  };
}


/**
 * Selector hook for stock color mode
 */
export const useStockColorMode = () => useAppStore((state) => state.stockColorMode);


/**
 * Setter hook for stock color mode
 */
export const useSetStockColorMode = () => useAppStore((state) => state.setStockColorMode);

