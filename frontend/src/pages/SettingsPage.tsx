import React, { useState, useEffect } from 'react';
import { User, Bell, Palette, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { useStockColorMode, useSetStockColorMode } from '@/hooks/useStockTrendColor';
import { useAppStore } from '@/store/useAppStore';
import { userSettingsApi, type NotificationPreferences } from '@/services/api/userSettings';

export const SettingsPage: React.FC = () => {
  const { user, token } = useAppStore();
  const [displayName, setDisplayName] = useState(user?.name || '');
  const stockColorMode = useStockColorMode();
  const setStockColorMode = useSetStockColorMode();
  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    new_episodes: true,
    stock_mentions: true,
    price_alerts: true,
    daily_digest: false,
  });
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState<string | null>(null);

  // Load notification preferences on mount
  useEffect(() => {
    if (token) {
      setIsLoadingPrefs(true);
      userSettingsApi.getNotificationPreferences()
        .then((prefs) => {
          setNotificationPrefs(prefs);
        })
        .catch((error) => {
          console.error('Failed to load notification preferences:', error);
        })
        .finally(() => {
          setIsLoadingPrefs(false);
        });
    }
  }, [token]);

  const handleNotificationToggle = async (
    key: keyof NotificationPreferences,
    newValue: boolean
  ) => {
    if (!token) {
      toast.error('請先登入');
      return;
    }
    // Optimistic update
    const oldValue = notificationPrefs[key];
    setNotificationPrefs((prev) => ({ ...prev, [key]: newValue }));
    setIsSavingPrefs(key);
    try {
      await userSettingsApi.updateNotificationPreferences({ [key]: newValue });
      toast.success('通知設定已更新');
    } catch (error) {
      // Rollback on error
      setNotificationPrefs((prev) => ({ ...prev, [key]: oldValue }));
      toast.error('更新通知設定失敗');
      console.error('Failed to update notification preferences:', error);
    } finally {
      setIsSavingPrefs(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Header />
      <div className="flex-1 overflow-y-auto pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">帳號設定</h1>
            <p className="text-slate-500 dark:text-slate-400">管理您的個人資料、通知偏好與訂閱方案。</p>
          </div>
          {/* Basic Info Section */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mb-6">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-50 mb-6">
                <User size={20} className="text-slate-400" />
                基本資料
              </h2>
              <div className="flex items-start gap-8">
                {/* Avatar */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-2">
                    {user?.initials || user?.name?.substring(0, 2).toUpperCase() || 'G'}
                  </div>
                  <button className="text-red-500 hover:text-red-400 text-sm font-medium transition-colors">
                    變更頭像
                  </button>
                </div>
                {/* Form Fields */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                        顯示名稱
                      </label>
                      <Input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full bg-slate-200 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Display Preferences Section */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mb-6">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-50 mb-6">
                <Palette size={20} className="text-slate-400" />
                顯示設定
              </h2>
              <div className="space-y-6">
                {/* Stock Color Mode */}
                <div className="flex items-center justify-between py-4">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-50">美股/國際模式 (綠漲紅跌)</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      啟用後，上漲將顯示為綠色，下跌為紅色。
                    </div>
                  </div>
                  <button
                    onClick={() => setStockColorMode(stockColorMode === 'US' ? 'TW' : 'US')}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${stockColorMode === 'US' ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${stockColorMode === 'US' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Notification Settings Section */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-50 mb-6">
                <Bell size={20} className="text-slate-400" />
                通知設定
              </h2>
              {isLoadingPrefs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : !token ? (
                <div className="text-center py-8 text-slate-500">
                  請先登入以管理通知設定
                </div>
              ) : (
                <div className="space-y-6">
                  {/* New Episodes Toggle */}
                  <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-50">訂閱的 Podcast 新集數</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        當您訂閱的 Podcast 發布新集數時發送通知。
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={notificationPrefs.new_episodes}
                      onChange={(val) => handleNotificationToggle('new_episodes', val)}
                      loading={isSavingPrefs === 'new_episodes'}
                    />
                  </div>
                  {/* Stock Mentions Toggle */}
                  <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-50">追蹤標的被提及</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        當您的自選股被 Podcast 提及時發送通知。
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={notificationPrefs.stock_mentions}
                      onChange={(val) => handleNotificationToggle('stock_mentions', val)}
                      loading={isSavingPrefs === 'stock_mentions'}
                    />
                  </div>
                  {/* Price Alerts Toggle */}
                  <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-50">價格警示</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        當追蹤標的達到設定的價格條件時發送通知。
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={notificationPrefs.price_alerts}
                      onChange={(val) => handleNotificationToggle('price_alerts', val)}
                      loading={isSavingPrefs === 'price_alerts'}
                    />
                  </div>
                  {/* Daily Digest Toggle */}
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-50">每日市場摘要</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        每天早上 8:00 發送昨日市場重點整理。
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={notificationPrefs.daily_digest}
                      onChange={(val) => handleNotificationToggle('daily_digest', val)}
                      loading={isSavingPrefs === 'daily_digest'}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

// Toggle Switch Component
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  loading?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, loading }) => {
  return (
    <button
      onClick={() => !loading && onChange(!checked)}
      disabled={loading}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      } ${checked ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`}
    >
      {loading ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        </span>
      ) : (
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      )}
    </button>
  );
};

export default SettingsPage;
