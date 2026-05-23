import { useEffect, useState } from 'react';
import { getSortedStocks } from '@/services/api/stocks';

// Module-level cache — shared across all hook instances, avoids re-fetching on navigation.
let _cached: Map<string, number> | null = null;
let _cacheTime = 0;
const TTL = 60_000; // 1 minute

/**
 * Returns a map of ticker → changePercent (e.g. -3.4 for -3.40%) for all
 * stocks in the platform's stock list. Used to hydrate TickerRow price cells
 * in episode cards across every page.
 *
 * The first caller fetches; subsequent mounts within the TTL window get the
 * cached result immediately.
 */
export function useStockPriceMap(): Map<string, number> {
  const [map, setMap] = useState<Map<string, number>>(() => _cached ?? new Map());

  useEffect(() => {
    if (_cached && Date.now() - _cacheTime < TTL) return;

    getSortedStocks({ limit: 2000 })
      .then((stocks) => {
        const m = new Map<string, number>();
        for (const s of Array.isArray(stocks) ? stocks : []) {
          const o = s as Record<string, unknown>;
          const ticker = (o.ticker ?? o.symbol) as string | undefined;
          const cp = o.change_percent as number | undefined;
          if (ticker && cp != null && Number.isFinite(cp)) {
            m.set(ticker, cp);
            m.set(ticker.toUpperCase(), cp);
          }
        }
        _cached = m;
        _cacheTime = Date.now();
        setMap(m);
      })
      .catch(() => {});
  }, []);

  return map;
}
