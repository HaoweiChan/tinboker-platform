import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import { SEO } from '@/components/common/SEO';
import { PageContent } from '@/components/layout/PageContent';
import { Segmented, SentimentChip } from '@/components/redesign';
import { getMostDiscussedTickers } from '@/services/api/podcasts';
import { getSortedStocks } from '@/services/api/stocks';
import type { TickerBuzz } from '@/services/types';
import { fetchWithFallback } from '@/services/api/migration';
import type { Sentiment } from '@/lib/sentiment';

type Market = 'all' | 'TW' | 'US';
type Sort = 'mentions' | 'sentiment';

function isTW(ticker: string): boolean {
  return /\.TW[OW]?$/i.test(ticker);
}
function scoreToSentiment(score: number | null | undefined): Sentiment {
  if (score == null || !Number.isFinite(score)) return null;
  if (score >= 0.6) return 'BULLISH';
  if (score <= 0.4) return 'BEARISH';
  return 'NEUTRAL';
}

interface Row {
  ticker: string;
  name: string;
  count: number;
  sentiment_score: number;
  lastMentioned: string;
}

export const StockIndex: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [market, setMarket] = useState<Market>('all');
  const [sort, setSort] = useState<Sort>('mentions');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [buzz, stocks] = await Promise.all([
        fetchWithFallback<TickerBuzz[]>(() => getMostDiscussedTickers({ days: 30, limit: 80 }), [], 'getMostDiscussedTickers:index').catch(() => [] as TickerBuzz[]),
        fetchWithFallback<unknown[]>(() => getSortedStocks({ sortBy: 'ticker', limit: 500 }), [], 'getSortedStocks:index').catch(() => [] as unknown[]),
      ]);
      if (!alive) return;
      const nameOf = new Map<string, string>();
      for (const s of Array.isArray(stocks) ? stocks : []) {
        const o = s as { ticker?: string; symbol?: string; name?: string; company_name?: string };
        const t = o.ticker || o.symbol;
        if (t) nameOf.set(t, o.name || o.company_name || t);
      }
      setRows(
        (Array.isArray(buzz) ? buzz : []).map((b) => ({
          ticker: b.ticker,
          name: nameOf.get(b.ticker) || b.ticker,
          count: b.count,
          sentiment_score: b.sentiment_score,
          lastMentioned: b.last_mentioned,
        })),
      );
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const list = useMemo(() => {
    let arr = rows.filter((r) => {
      if (market === 'TW' && !isTW(r.ticker)) return false;
      if (market === 'US' && isTW(r.ticker)) return false;
      if (q) {
        const s = q.toLowerCase();
        return r.ticker.toLowerCase().includes(s) || r.name.toLowerCase().includes(s);
      }
      return true;
    });
    arr = [...arr].sort((a, b) => (sort === 'mentions' ? b.count - a.count : (b.sentiment_score ?? 0) - (a.sentiment_score ?? 0)));
    return arr;
  }, [rows, q, market, sort]);

  return (
    <>
      <SEO title="所有個股" description="最近被 TinBoker 追蹤的 Podcast 提及的所有個股，依提及次數排序。" />
      <PageContent>
        <div className="flex items-baseline justify-between mb-1">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em]">所有個股</h1>
          {!loading && <div className="text-[12px] text-muted-foreground font-mono tabular-nums">{rows.length} 檔（近 30 天提及）</div>}
        </div>
        <p className="text-[13px] text-muted-foreground max-w-[60ch] mb-4">最近 30 天被 TinBoker 追蹤的 Podcast 提及的所有個股，依提及次數排序。點任一檔進入情緒時間軸與相關集數。</p>

        <div className="flex gap-2.5 items-center mb-4 flex-wrap">
          <label className="flex items-center gap-2 flex-1 min-w-[180px] bg-card border border-border rounded-md px-3 py-2">
            <Search size={14} className="text-muted-foreground shrink-0" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜尋代號或名稱…" className="flex-1 bg-transparent outline-none text-[13px]" />
          </label>
          <Segmented options={[{ value: 'all', label: '全部' }, { value: 'TW', label: '台股' }, { value: 'US', label: '美股' }] as const} value={market} onChange={setMarket} />
          <Segmented options={[{ value: 'mentions', label: '提及' }, { value: 'sentiment', label: '情緒' }] as const} value={sort} onChange={setSort} />
        </div>

        <div className="bg-card border border-border rounded-md overflow-hidden">
          <div className="grid grid-cols-[120px_1fr_80px_72px_28px] gap-3.5 items-center px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.04em] border-b border-border font-mono">
            <span>代號</span>
            <span>名稱</span>
            <span className="text-right">提及</span>
            <span className="text-right">情緒</span>
            <span />
          </div>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-[45px] border-b border-border last:border-b-0 animate-pulse bg-muted/30" />)
          ) : list.length === 0 ? (
            <div className="px-4 py-12 text-center text-[13px] text-muted-foreground">{q ? `找不到符合「${q}」的個股` : '目前沒有個股資料。'}</div>
          ) : (
            list.map((r) => (
              <Link
                key={r.ticker}
                to={`/stock/${encodeURIComponent(r.ticker)}`}
                className="grid grid-cols-[120px_1fr_80px_72px_28px] gap-3.5 items-center px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <span className="font-mono text-[13px] font-semibold">{r.ticker}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${isTW(r.ticker) ? 'bg-sentiment-bull-soft text-sentiment-bull' : 'bg-accent-info-soft text-accent-info'}`}>{isTW(r.ticker) ? 'TW' : 'US'}</span>
                </span>
                <span className="text-[13.5px] font-medium truncate">{r.name}</span>
                <span className="font-mono text-[13px] tabular-nums text-right">{r.count}</span>
                <span className="text-right">
                  <SentimentChip sentiment={scoreToSentiment(r.sentiment_score)} bare />
                </span>
                <ChevronRight size={14} className="text-muted-foreground" />
              </Link>
            ))
          )}
        </div>
      </PageContent>
    </>
  );
};
