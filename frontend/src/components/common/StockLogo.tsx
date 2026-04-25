import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { getAvatarColor } from '@/utils/avatarColor';


interface StockLogoProps {
  symbol: string;
  logoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}


export const StockLogo: React.FC<StockLogoProps> = ({ symbol, logoUrl, size = 'md', className }) => {
  const [imageError, setImageError] = useState(false);
  
  // Extract ticker without .TW suffix
  const displaySymbol = symbol.split('.')[0];
  
  // Get deterministic color based on ticker
  const avatarColor = getAvatarColor(symbol);
  
  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm',
  };
  
  // If no logo URL or image failed to load, show fallback avatar
  if (!logoUrl || imageError) {
    return (
      <div 
        className={cn(
          'rounded-md flex items-center justify-center flex-shrink-0',
          avatarColor,
          sizeClasses[size],
          className
        )}
      >
        <span className="font-financial font-bold text-white">
          {displaySymbol.slice(0, 4)}
        </span>
      </div>
    );
  }
  
  // Try to load the image
  return (
    <img 
      src={logoUrl} 
      alt={`${symbol} logo`}
      className={cn(
        'rounded-md object-cover flex-shrink-0 bg-white',
        sizeClasses[size],
        className
      )}
      onError={() => setImageError(true)}
    />
  );
};

