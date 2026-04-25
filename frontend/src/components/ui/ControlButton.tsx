import React from 'react';


interface ControlButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'icon' | 'full';
}


/**
 * Base Control Button Component
 * 
 * This is the single source of truth for all control button styling.
 * All graph control buttons (zoom, table toggle, node display) inherit from this.
 * 
 * To change the color palette system-wide, update only the classes here.
 */
export const ControlButton: React.FC<ControlButtonProps> = ({
  children,
  variant = 'icon',
  className = '',
  ...props
}) => {
  const baseClasses = [
    // Base button structure
    'flex items-center justify-center gap-2',
    'rounded-lg backdrop-blur-sm transition-all duration-200',
    // Shadow
    'shadow-lg hover:shadow-xl',
  ].join(' ');

  const variantClasses = variant === 'icon'
    ? 'p-2'
    : 'px-4 py-2.5';

  const buttonStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-elevated)',
    border: '2px solid var(--border-default)',
    color: 'var(--text-primary)',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${className}`}
      style={buttonStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-brand)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-default)';
      }}
      {...props}
    >
      {children}
    </button>
  );
};

