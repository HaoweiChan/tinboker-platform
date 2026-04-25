import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Landing } from '@/pages/Landing';
import { About } from '@/pages/About';
import { ContactPage } from '@/pages/ContactPage';
import { GraphGallery } from '@/pages/GraphGallery';
import { StockDashboard } from '@/pages/StockDashboard';
import { IndustryAnalysis } from '@/pages/IndustryAnalysis';
import { NewsPage } from '@/pages/NewsPage';
import { PodcasterPage } from '@/pages/PodcasterPage';
import { TagPage } from '@/pages/TagPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { DisclaimerPage } from '@/pages/DisclaimerPage';
import { AdminPage } from '@/pages/AdminPage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { TranslationsSection } from '@/pages/TranslationsSection';
import { AdminAnalyticsPage } from '@/pages/AdminAnalyticsPage';
import { GlobalPlayer } from '@/components/player/GlobalPlayer';
import { PlayerConfirmationModal } from '@/components/player/PlayerConfirmationModal';
import { useAuthInit } from '@/hooks/useAuthInit';
import { useAppStore } from '@/store/useAppStore';

function App() {
  // Validate stored auth token on app initialization
  useAuthInit();
  const theme = useAppStore((state) => state.theme);

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        theme={theme}
        richColors
        closeButton
        duration={4000}
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/story" element={<GraphGallery />} />
        <Route path="/gallery" element={<Navigate to="/story" replace />} />
        <Route path="/graph/*" element={<Navigate to="/story" replace />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/disclaimer" element={<DisclaimerPage />} />

        {/* Stock & Content Routes */}
        <Route path="/stock/:ticker" element={<StockDashboard />} />
        <Route path="/podcaster/:id" element={<PodcasterPage />} />
        <Route path="/tag/:tag" element={<TagPage />} />
        <Route path="/industry" element={<IndustryAnalysis />} />
        <Route path="/news/:id" element={<NewsPage />} />

        {/* User Routes */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Admin Routes - nested under AdminPage layout */}
        <Route path="/admin" element={<AdminPage />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="translations" element={<TranslationsSection />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
        </Route>

        {/* Catch-all Route - Redirect to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <GlobalPlayer />
      <PlayerConfirmationModal />
    </BrowserRouter>
  );
}

export default App;
