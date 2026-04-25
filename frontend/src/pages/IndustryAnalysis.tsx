import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAppStore } from '@/store/useAppStore';
import SectorPerformance from '@/components/industry/SectorPerformance';
import TreeMap from '@/components/industry/TreeMap';
import PerformanceBarChart from '@/components/industry/PerformanceBarChart';
import { PieChart, Map, BarChart2 } from 'lucide-react';

type IndustryView = 'map' | 'bubbles' | 'rotation';

export const IndustryAnalysis: React.FC = () => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const [activeView, setActiveView] = useState<IndustryView>('map');
  const viewConfig: Record<IndustryView, { label: string; title: string; description: string; render: () => React.ReactNode }> = {
    map: {
      label: '市場地圖',
      title: '標普 500 地圖',
      description: '熱力圖揭示板塊廣度與指數中的異常波動標的。',
      render: () => <TreeMap variant="embedded" />,
    },
    bubbles: {
      label: '板塊泡泡',
      title: '板塊表現散佈圖',
      description: '泡泡圖比較相對市值、成交量與近期報酬率。',
      render: () => <SectorPerformance variant="embedded" />,
    },
    rotation: {
      label: '板塊輪動',
      title: '表現輪動看板',
      description: '並排柱狀圖辨識短期與週線領漲板塊的變化。',
      render: () => <PerformanceBarChart variant="embedded" />,
    },
  };

  const activeConfig = viewConfig[activeView];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <Header />
      
      {/* Page Header & Tabs */}
      <div className="border-b" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
        <div className="max-w-7xl mx-auto px-6 pt-6">
            <h1 className={`text-2xl font-bold mb-6 ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>產業</h1>
            
            <div className="flex space-x-6">
                <button 
                    onClick={() => setActiveView('map')}
                    className={`flex items-center gap-2 pb-3 border-b-2 transition-all ${
                        activeView === 'map' 
                        ? 'border-[#EC7A3C] text-[#EC7A3C]' 
                        : 'border-transparent text-slate-500 hover:text-slate-400'
                    }`}
                >
                    <Map size={18} />
                    <span className="font-medium">市場地圖</span>
                </button>
                <button 
                    onClick={() => setActiveView('bubbles')}
                    className={`flex items-center gap-2 pb-3 border-b-2 transition-all ${
                        activeView === 'bubbles' 
                        ? 'border-[#EC7A3C] text-[#EC7A3C]' 
                        : 'border-transparent text-slate-500 hover:text-slate-400'
                    }`}
                >
                    <PieChart size={18} />
                    <span className="font-medium">板塊泡泡</span>
                </button>
                <button 
                    onClick={() => setActiveView('rotation')}
                    className={`flex items-center gap-2 pb-3 border-b-2 transition-all ${
                        activeView === 'rotation' 
                        ? 'border-[#EC7A3C] text-[#EC7A3C]' 
                        : 'border-transparent text-slate-500 hover:text-slate-400'
                    }`}
                >
                    <BarChart2 size={18} />
                    <span className="font-medium">板塊輪動</span>
                </button>
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div
            className="rounded-3xl border shadow-sm flex flex-col"
            style={{ 
              backgroundColor: 'var(--bg-surface)', 
              borderColor: 'var(--border-default)',
              height: 'calc(100vh - 180px)',
              minHeight: '800px' 
            }}
          >
            <div className="px-6 py-6 border-b" style={{ borderColor: 'var(--border-default)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                產業 • {activeConfig.label}
              </p>
              <h2 className="text-3xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
                {activeConfig.title}
              </h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {activeConfig.description}
              </p>
            </div>
            <div className="flex-1 min-h-[500px] p-4">
              {activeConfig.render()}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default IndustryAnalysis;
