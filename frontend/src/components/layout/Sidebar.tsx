import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Mic, LineChart, Hash, Star, Info, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLogo } from '@/components/logo/AppLogo';
import { useSubscriptions, useUser } from '@/store/useAppStore';
import { PodMark } from '@/components/redesign';
import { getSortedPodcasts } from '@/services/api/podcasts';
import { fetchWithFallback } from '@/services/api/migration';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  /** Match by prefix (detail routes) rather than exact. */
  prefix?: boolean;
}

const NAV: readonly NavItem[] = [
  { to: '/', label: '首頁', icon: Home },
  { to: '/podcaster', label: '節目', icon: Mic, prefix: true },
  { to: '/stock', label: '個股', icon: LineChart, prefix: true },
  { to: '/topics', label: '話題', icon: Hash, prefix: true },
  { to: '/watchlist', label: '自選', icon: Star },
];


function isActive(pathname: string, item: NavItem): boolean {
  if (item.to === '/') return pathname === '/';
  return item.prefix ? pathname === item.to || pathname.startsWith(item.to + '/') : pathname === item.to;
}

interface SidebarProps {
  /** Whether the sidebar is in narrow icon-only mode. */
  collapsed: boolean;
  /** Toggle handler for the collapse button. */
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { pathname } = useLocation();
  const subscriptions = useSubscriptions();
  const user = useUser();
  const [imageMap, setImageMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (subscriptions.length === 0) return;
    let alive = true;
    fetchWithFallback(() => getSortedPodcasts({ sortBy: 'updated_at', order: 'desc', limit: 200 }), [], 'getSortedPodcasts')
      .then((podcasts) => {
        if (!alive) return;
        const map = new Map<string, string>();
        for (const p of Array.isArray(podcasts) ? podcasts : []) {
          if (p.name && p.image_url) map.set(p.name, p.image_url);
        }
        setImageMap(map);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [subscriptions.length]);

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col sticky top-0 h-screen shrink-0 border-r border-border bg-card py-4.5 z-30 transition-[width,padding] duration-200 ease-in-out',
        collapsed ? 'w-[64px] px-2' : 'w-[220px] px-3.5',
      )}
    >
      <Link
        to="/"
        title="聽播客 TinBoker"
        className={cn(
          'flex items-center pt-1.5 pb-4 hover:opacity-80 transition-opacity',
          collapsed ? 'justify-center px-0' : 'px-1',
        )}
      >
        <AppLogo size={26} markOnly={collapsed} />
      </Link>

      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? '展開側邊欄' : '收合側邊欄'}
        aria-expanded={!collapsed}
        title={collapsed ? '展開側邊欄' : '收合側邊欄'}
        className={cn(
          'flex items-center gap-2 px-2.5 py-2 mb-1 rounded-lg text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
          collapsed && 'justify-center px-0',
        )}
      >
        {collapsed ? <PanelLeftOpen size={18} className="shrink-0 opacity-85" /> : <PanelLeftClose size={18} className="shrink-0 opacity-85" />}
        {!collapsed && '收合'}
      </button>

      <nav className="flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-2.5 py-2 rounded-lg text-[14px] font-medium transition-colors',
                collapsed && 'justify-center px-0',
                active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon size={18} className="shrink-0 opacity-85" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {subscriptions.length > 0 && (
        <>
          {!collapsed && (
            <div className="text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground px-2.5 pt-4.5 pb-2">追蹤中</div>
          )}
          <div className={cn('flex flex-col gap-0.5 overflow-y-auto', collapsed && 'pt-4.5')}>
            {subscriptions.slice(0, 8).map((name) => (
              <Link
                key={name}
                to={`/podcaster/${encodeURIComponent(name)}`}
                title={collapsed ? name : undefined}
                className={cn(
                  'flex items-center gap-3 px-2.5 py-1.5 rounded-lg text-[13px] text-foreground hover:bg-muted transition-colors',
                  collapsed && 'justify-center px-0',
                )}
              >
                {imageMap.get(name) ? (
                  <img src={imageMap.get(name)} alt="" className="w-[18px] h-[18px] rounded-[4px] object-cover shrink-0" />
                ) : (
                  <PodMark label={name.charAt(0)} kind="mute" size={18} />
                )}
                {!collapsed && <span className="truncate">{name}</span>}
              </Link>
            ))}
          </div>
        </>
      )}

      <Link
        to="/about"
        title={collapsed ? '關於' : undefined}
        className={cn(
          'flex items-center gap-1.5 px-2 pb-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors mt-auto',
          collapsed && 'justify-center px-0',
        )}
      >
        <Info size={12} className="opacity-70" />
        {!collapsed && '關於'}
      </Link>
      <div className={cn('pt-3.5 border-t border-border flex items-center gap-2.5', collapsed ? 'justify-center px-0' : 'px-1.5')}>
        {user ? (
          <>
            <div
              title={collapsed ? `${user.name || '使用者'} · ${user.email}` : undefined}
              className="w-7 h-7 rounded-full grid place-items-center text-[11px] font-semibold text-white shrink-0 bg-accent-info"
            >
              {(user.name || user.email || '?').charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-[13px] font-medium truncate">{user.name || '使用者'}</div>
                <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
              </div>
            )}
          </>
        ) : (
          !collapsed && <span className="text-[12px] text-muted-foreground px-1">尚未登入</span>
        )}
      </div>
    </aside>
  );
};
