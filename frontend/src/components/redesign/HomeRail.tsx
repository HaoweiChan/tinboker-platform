import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMostDiscussedTickers, getSortedPodcasts, type Podcast } from '@/services/api/podcasts';
import type { TickerBuzz } from '@/services/types';
import { fetchWithFallback } from '@/services/api/migration';
import { RailCard } from './RailCard';
import { SentBar } from './SentBar';
import { SentimentChip } from './SentimentChip';
import { PodMark } from './PodMark';
import type { Sentiment } from '@/lib/sentiment';

function scoreToSentiment(score: number | null | undefined): Sentiment {
  if (score == null || !Number.isFinite(score)) return null;
  if (score >= 0.6) return 'BULLISH';
  if (score <= 0.4) return 'BEARISH';
  return 'NEUTRAL';
}

function TodayPulse({ episodeCount, buzz }: { episodeCount: number; buzz: TickerBuzz[] }) {
  let bull = 0;
  let bear = 0;
  let neutral = 0;
  for (const b of buzz) {
    const s = scoreToSentiment(b.sentiment_score);
    if (s === 'BULLISH') bull++;
    else if (s === 'BEARISH') bear++;
    else neutral++;
  }
  const total = bull + bear + neutral;
  const dominant: Sentiment = total === 0 ? null : bull >= bear && bull >= neutral ? 'BULLISH' : bear >= neutral ? 'BEARISH' : 'NEUTRAL';
  return (
    <RailCard title="今天的市場" sub="近 7 天">
      <div className="flex flex-col gap-3 text-[13px]">
        <div className="flex justify-between">
          <span className="text-muted-foreground">最近 {episodeCount} 集摘要</span>
          <span className="font-mono font-semibold tabular-nums">{episodeCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">提到 {buzz.length} 檔個股</span>
          <span className="font-mono font-semibold tabular-nums">{buzz.length}</span>
        </div>
        {dominant && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">整體情緒偏</span>
            <SentimentChip sentiment={dominant} />
          </div>
        )}
        {total > 0 && <SentBar bull={bull} neutral={neutral} bear={bear} />}
      </div>
    </RailCard>
  );
}

function TopTickers({ buzz }: { buzz: TickerBuzz[] }) {
  if (buzz.length === 0) return null;
  return (
    <RailCard title="這幾天大家在聊" sub="近 7 天提及">
      <div className="flex flex-col">
        {buzz.slice(0, 6).map((b, i) => (
          <Link
            key={b.ticker}
            to={`/stock/${encodeURIComponent(b.ticker)}`}
            className="grid grid-cols-[18px_1fr_auto] gap-2.5 items-center py-2 border-t border-border first:border-t-0 hover:opacity-80 transition-opacity"
          >
            <span className="font-mono text-[11px] text-muted-foreground text-right">{String(i + 1).padStart(2, '0')}</span>
            <span className="font-mono text-[12px] font-medium truncate">{b.ticker}</span>
            <span className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground font-mono tabular-nums">{b.count} 集</span>
              <SentimentChip sentiment={scoreToSentiment(b.sentiment_score)} bare />
            </span>
          </Link>
        ))}
      </div>
    </RailCard>
  );
}

function TopPodcasters({ podcasts }: { podcasts: Podcast[] }) {
  if (podcasts.length === 0) return null;
  return (
    <RailCard title="本週更新最勤" sub="最近更新">
      <div className="flex flex-col">
        {podcasts.slice(0, 5).map((p) => (
          <Link
            key={p.id || p.name}
            to={`/podcaster/${encodeURIComponent(p.name)}`}
            className="grid grid-cols-[28px_1fr_auto] gap-2.5 items-center py-2 border-t border-border first:border-t-0 hover:opacity-80 transition-opacity"
          >
            <PodMark label={(p.name || '?').charAt(0)} kind="mute" size={28} />
            <span className="text-[13px] font-medium truncate">{p.name}</span>
            <span className="text-[11px] text-muted-foreground font-mono tabular-nums">{p.episode_count} 集</span>
          </Link>
        ))}
      </div>
    </RailCard>
  );
}

/** Home page right rail: 今天的市場 / 這幾天大家在聊 / 本週更新最勤. Falls back to mock data when the API is unavailable. */
export const HomeRail: React.FC<{ episodeCount: number }> = ({ episodeCount }) => {
  const [buzz, setBuzz] = useState<TickerBuzz[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [b, p] = await Promise.all([
        fetchWithFallback<TickerBuzz[]>(() => getMostDiscussedTickers({ days: 7, limit: 10 }), [], 'getMostDiscussedTickers').catch(() => [] as TickerBuzz[]),
        fetchWithFallback<Podcast[]>(() => getSortedPodcasts({ sortBy: 'updated_at', order: 'desc', limit: 8 }), [], 'getSortedPodcasts').catch(() => [] as Podcast[]),
      ]);
      if (!alive) return;
      setBuzz(Array.isArray(b) ? b : []);
      setPodcasts(Array.isArray(p) ? p : []);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <TodayPulse episodeCount={episodeCount} buzz={buzz} />
      <TopTickers buzz={buzz} />
      <TopPodcasters podcasts={podcasts} />
    </>
  );
};
