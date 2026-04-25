import React from 'react';
import { Button } from '@/components/ui';
import { Zap, Check, Bell, ArrowRight } from 'lucide-react';

export const NewsletterCard: React.FC = () => {
  const features = [
    "每日即時更新",
    "AI 萃取重點",
    "個股話題連動",
    "關鍵洞察速讀"
  ];

  return (
    <div className="w-full rounded-[2rem] bg-gradient-to-br from-emerald-50 via-orange-50/50 to-amber-50 p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden border border-emerald-100/50 dark:border-white/5 dark:from-emerald-950/30 dark:via-slate-900/50 dark:to-amber-950/30">
      
      <div className="relative z-10 flex flex-col items-center max-w-3xl mx-auto space-y-8">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-600/30 text-emerald-700 dark:text-emerald-400 bg-emerald-100/10 backdrop-blur-sm">
          <Zap size={14} className="fill-current" />
          <span className="text-xs font-bold tracking-wide">搶先體驗</span>
        </div>

        {/* Headlines */}
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            想要更聰明地
          </h2>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-amber-600 dark:from-emerald-400 dark:to-amber-400 bg-clip-text text-transparent">
            掌握財經資訊？
          </h2>
        </div>

        {/* Description */}
        <p className="text-slate-600 dark:text-slate-300 text-lg max-w-2xl leading-relaxed">
          TinBoker 正在持續優化中，訂閱我們的更新通知，搶先體驗最新功能與精選 Podcast 摘要。
        </p>

        {/* Feature Chips */}
        <div className="flex flex-wrap justify-center gap-3">
          {features.map((feature, idx) => (
            <div 
              key={idx}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/10 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm"
            >
              <Check size={14} className="text-emerald-500" />
              {feature}
            </div>
          ))}
        </div>

        {/* Action Area */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-4">
          <Button 
            size="lg"
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 px-8 shadow-lg shadow-emerald-600/20"
          >
            <Bell size={18} />
            訂閱更新通知
            <ArrowRight size={16} className="ml-1" />
          </Button>
          
          <Button 
            variant="outline"
            size="lg"
            className="w-full sm:w-auto rounded-xl border-slate-300 dark:border-slate-600 hover:bg-white/50 dark:hover:bg-white/5"
          >
            聯絡我們
          </Button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-slate-500 dark:text-slate-500">
          我們重視您的隱私，不會發送垃圾郵件
        </p>
      </div>
    </div>
  );
};
