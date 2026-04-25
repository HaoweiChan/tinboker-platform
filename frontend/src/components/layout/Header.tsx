import React from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AppLogo } from '@/components/logo/AppLogo';
import { UserMenu } from '@/components/ui/UserMenu';
import { NotificationDropdown } from '@/components/ui/NotificationDropdown';
import { SearchDropdown } from '@/components/ui/SearchDropdown';
import { useUser } from '@/store/useAppStore';
import { LoginButton } from '@/components/auth/LoginButton';

export const Header: React.FC = () => {
  const user = useUser();

  return (
    <header className="sticky top-0 z-50 w-full shadow-sm dark:shadow-none backdrop-blur-xl bg-white/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-white/5 transition-all duration-200 flex flex-col">
      <div className="w-full py-2 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center group flex-shrink-0">
            <AppLogo size={28} textClassName="text-slate-900 dark:text-slate-50" mobileCompact={true} />
          </Link>

          {/* Center: Search Bar (Visible on all sizes) */}
          <div className="flex-1 max-w-2xl lg:mx-auto px-0 md:px-0">
            <SearchDropdown mode="desktop" />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0 ml-auto">
            <ThemeToggle />

            <NotificationDropdown />

            {/* User Menu */}
            <div className="hidden sm:block">
              <UserMenu />
            </div>

            {/* Mobile Auth Button */}
            <div className="sm:hidden flex items-center">
              {user ? (
                <UserMenu />
              ) : (
                <LoginButton
                  className="p-2 text-sm font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50 flex items-center"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
