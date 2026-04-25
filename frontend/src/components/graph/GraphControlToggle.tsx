import React from 'react';
import { useAppStore } from '@/store/useAppStore';

interface GraphControlToggleProps {
  label: string;
  icon?: React.ElementType;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

export const GraphControlToggle: React.FC<GraphControlToggleProps> = ({
  label,
  icon: Icon,
  isActive,
  onClick,
  className = '',
}) => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  const activeClasses =
    'bg-[var(--color-brand-steel)] text-white shadow-lg shadow-[rgba(77,107,148,0.35)] border-transparent ring-1 ring-[rgba(77,107,148,0.4)]';

  const inactiveClasses = isDark
    ? 'bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800'
    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 shadow-sm';

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
        isActive ? activeClasses : inactiveClasses
      } ${className}`}
    >
      {Icon && <Icon size={14} />}
      {label}
    </button>
  );
};
