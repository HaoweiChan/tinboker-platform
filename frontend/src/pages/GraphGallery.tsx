import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopStoryCard from '@/components/home/TopStoryCard';
import { useAppStore } from '@/store/useAppStore';
import { INTERACTIVE_MODEL_LIST } from '@/data/interactiveModels';


export const GraphGallery: React.FC = () => {
  return (
    <div className="page-bg min-h-screen flex flex-col">

      <main className="flex-1 container mx-auto px-4 py-8">
        <GalleryHero />
        <InteractiveModelGrid />
      </main>

    </div>
  );
};

const GalleryHero: React.FC = () => (
  <div className="mb-10">
    <div className="flex flex-col gap-4 text-center">
      <div>
        <p className="uppercase tracking-[0.3em] text-xs text-brand-yellow mb-2">Interactive Models</p>
        <h1 className="text-4xl md:text-5xl font-bold heading">
          Explore interactive theses powering our newsroom
        </h1>
      </div>
    </div>
  </div>
);

const InteractiveModelGrid: React.FC = () => {
  const navigate = useNavigate();
  const isDark = useAppStore((state) => state.theme === 'dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | string>('all');

  const categories = useMemo(() => {
    const unique = Array.from(new Set(INTERACTIVE_MODEL_LIST.map((model) => model.category)));
    return ['all', ...unique];
  }, []);

  const filteredModels = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return INTERACTIVE_MODEL_LIST.filter((model) => {
      const matchesCategory = activeCategory === 'all' || model.category === activeCategory;
      const matchesQuery =
        !query ||
        model.title.toLowerCase().includes(query) ||
        model.summary.toLowerCase().includes(query) ||
        model.graphTypeLabel.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="search-shell w-full max-w-2xl">
          <div className="search-inner flex w-full items-center p-1 shadow-2xl">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                <svg className="h-4 w-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search interactive models..."
                className="w-full bg-transparent py-3 pl-12 pr-28 text-sm text-slate-50 placeholder:text-slate-50/70 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => null}
              className="m-1 h-9 rounded-full bg-white px-5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-white/90"
            >
              Search
            </button>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`rounded-full px-5 py-2 text-sm font-semibold tracking-tight shadow-sm transition-all border ${
                activeCategory === category
                  ? 'bg-[#1f2024] text-slate-50 border-transparent ring-1 ring-white/30 shadow-lg'
                  : isDark
                    ? 'bg-white/5 text-slate-50 border-white/10 hover:bg-white/15'
                    : 'bg-background text-foreground border-border/70 hover:bg-muted/40'
              }`}
            >
              {category === 'all' ? 'All' : category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredModels.map((model) => {
          const Graph = model.GraphComponent;
          return (
            <TopStoryCard
              key={model.id}
              source={model.source}
              time={model.date}
              title={model.title}
              graphTypeLabel={model.graphTypeLabel}
              isDark={isDark}
              onClick={() => navigate(`/news/${model.id}`)}
            >
              <Graph isWidget />
            </TopStoryCard>
          );
        })}
      </div>
    </div>
  );
};

