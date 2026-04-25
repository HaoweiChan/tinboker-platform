import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { AppLogo } from '@/components/logo/AppLogo';

export const About: React.FC = () => {
  return (
    <div className="page-bg min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-20">
        <div className="container mx-auto max-w-4xl space-y-8 px-4">
          {/* Hero Section */}
          <div className="space-y-4 text-center">
            <h1
              className="flex items-center justify-center gap-2 text-2xl font-bold text-foreground md:text-3xl"
              style={{ fontFamily: "'Noto Sans TC', 'DM Sans', sans-serif" }}
            >
              <span>關於</span>
              <AppLogo size={36} className="inline-flex translate-y-1" />
            </h1>
            <div className="space-y-4 text-content leading-relaxed max-w-2xl mx-auto">
            </div>
          </div>

          {/* How It Works */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold heading-text">核心功能</h2>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-start gap-4">
                <span className="text-sm font-semibold text-muted-foreground pt-1">1</span>
                <div>
                  <h3 className="text-lg font-semibold heading-text mb-2">智慧摘要</h3>
                  <p className="text-content">
                    運用 AI 技術，快速梳理財經 Podcast 與新聞重點，讓您在幾分鐘內掌握小時級內容的精華。
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="text-sm font-semibold text-muted-foreground pt-1">2</span>
                <div>
                  <h3 className="text-lg font-semibold heading-text mb-2">市場數據</h3>
                  <p className="text-content">
                    即時串接股市數據，將觀點與價格走勢直接連結，驗證市場反應並追蹤標的表現。
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="text-sm font-semibold text-muted-foreground pt-1">3</span>
                <div>
                  <h3 className="text-lg font-semibold heading-text mb-2">趨勢洞察</h3>
                  <p className="text-content">
                    透過視覺化工具探索產業關聯與趨勢發展，發現潛在的投資機會與風險。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Sources */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold heading-text">資料來源</h2>
            </CardHeader>
            <CardContent className="space-y-4 text-content">
              <p>
                TinBoker 匯集多個可信來源的數據，確保資訊的廣度與深度：
              </p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start">
                  <span className="text-cyan mr-2">•</span>
                  <span>
                    <strong className="heading-text">財經媒體：</strong>精選高品質的產業分析、Podcast 與新聞報導。
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-cyan mr-2">•</span>
                  <span>
                    <strong className="heading-text">金融市場：</strong>來自全球主要交易所的即時報價與財務指標。
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-cyan mr-2">•</span>
                  <span>
                    <strong className="heading-text">產業研究：</strong>整合公開報告與數據，構建產業知識圖譜。
                  </span>
                </li>
              </ul>
              <p className="text-sm text-gray-400 mt-4 pt-4 border-t border-slate-700">
                <strong>免責聲明：</strong>TinBoker 提供的資訊僅供參考和教育目的，
                不應視為投資建議。在做出投資決策前，請務必自行研究並諮詢
                合格的財務顧問。
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};
