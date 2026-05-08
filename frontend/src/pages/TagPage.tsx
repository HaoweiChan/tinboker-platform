import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tag, Wifi } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, Button } from '@/components/ui';
import EpisodeCard from '@/components/home/EpisodeCard';
import type { Episode as MockEpisode } from '@/data/mockData';
import { getEpisodesByTag, type Episode as ApiEpisode } from '@/services/api';
import { fetchWithFallback } from '@/services/api/migration';
import { useAppStore, useTagSubscriptions } from '@/store/useAppStore';
import { transformApiEpisodeToMock } from '@/services/api/transformers';




export const TagPage: React.FC = () => {
  const { tag } = useParams();
  const navigate = useNavigate();
  const { toggleTagSubscription } = useAppStore();
  const tagSubscriptions = useTagSubscriptions();
  const [relatedEpisodes, setRelatedEpisodes] = useState<MockEpisode[]>([]);
  const [loading, setLoading] = useState(true);

  // Decode the tag from URL and normalize it (remove # if present)
  const rawTag = decodeURIComponent(tag || '');
  const tagName = rawTag.startsWith('#') ? rawTag : `#${rawTag}`;
  const cleanTag = tagName.replace('#', '');

  // Check subscription status from store
  const isSubscribed = tagSubscriptions.includes(cleanTag) || tagSubscriptions.includes(tagName);

  // Fetch episodes by tag from API
  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!cleanTag) return;

      setLoading(true);
      try {
        // Call getEpisodesByTag with correct arguments (tag, limit, offset, includeContent)
        const response = await fetchWithFallback(
          () => getEpisodesByTag(cleanTag, 50, 0, false), // limit=50, offset=0, includeContent=false for faster load
          { tag: cleanTag, episodes: [], total: 0 },
          `getEpisodesByTag(${cleanTag})`
        );

        // Transform API episodes to mock format, filtering out those without summary
        const transformedEpisodes = response.episodes
          .map(transformApiEpisodeToMock)
          .filter((ep: MockEpisode | null): ep is MockEpisode => ep !== null);

        // Sort by spotify_release_date (descending - newest first)
        // Since API might not sort correctly, we sort client-side as well
        transformedEpisodes.sort((a: MockEpisode, b: MockEpisode) => {
          // Find original API episodes to get release dates
          const apiA = response.episodes.find((ep: ApiEpisode) => ep.id === a.id);
          const apiB = response.episodes.find((ep: ApiEpisode) => ep.id === b.id);

          if (!apiA || !apiB) return 0;

          // Get release dates (prefer spotify_release_date, fallback to created_time)
          const dateA = apiA.spotify_release_date || apiA.created_time;
          const dateB = apiB.spotify_release_date || apiB.created_time;

          // Convert to timestamps for comparison
          const timeA = typeof dateA === 'string' ? new Date(dateA).getTime() : dateA;
          const timeB = typeof dateB === 'string' ? new Date(dateB).getTime() : dateB;

          // Descending order (newest first)
          return timeB - timeA;
        });

        setRelatedEpisodes(transformedEpisodes);
      } catch (error) {
        console.error('[TagPage] Failed to fetch episodes:', error);
        setRelatedEpisodes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEpisodes();
  }, [cleanTag]);

  const handlePodcasterClick = (name: string) => {
    navigate(`/podcaster/${encodeURIComponent(name)}`);
  };

  const handleTickerClick = (symbol: string) => {
    navigate(`/stock/${symbol}`);
  };

  const handleSubscribeClick = () => {
    toggleTagSubscription(cleanTag);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Header />

      <div className="flex-1 overflow-y-auto pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tag Header Card */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 mb-8 shadow-sm dark:shadow-none">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                {/* Icon removed */}

                <div className="flex-1 space-y-3">
                  <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">{tagName}</h1>
                      <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center md:justify-start gap-2">
                        <Tag size={16} /> 相關主題探索
                      </p>
                    </div>
                    <Button
                      onClick={handleSubscribeClick}
                      className={`px-6 py-2 rounded-full font-bold gap-2 border-0 transition-colors ${isSubscribed
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
                        : 'bg-amber-500 text-slate-900 hover:bg-amber-600'
                        }`}
                    >
                      <Wifi size={18} fill={isSubscribed ? "currentColor" : "none"} />
                      {isSubscribed ? '已追蹤' : '追蹤話題'}
                    </Button>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                    瀏覽所有關於「{tagName}」的 Podcast 摘要與市場討論。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Episodes Section */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">相關集數</h2>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800 mx-4"></div>
            <span className="text-sm font-financial text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              {relatedEpisodes.length} 集
            </span>
          </div>

          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-500 dark:text-slate-400">載入中...</p>
              </div>
            ) : relatedEpisodes.length > 0 ? (
              relatedEpisodes.map(episode => (
                <EpisodeCard
                  key={episode.id}
                  episode={episode}
                  onPodcasterClick={handlePodcasterClick}
                  onTickerClick={handleTickerClick}
                  variant="full"
                />
              ))
            ) : (
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center py-12">
                <CardContent>
                  <p className="text-slate-500">目前沒有相關 Podcast 集數。</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TagPage;
