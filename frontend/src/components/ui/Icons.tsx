import React from 'react';
import graphIconUrl from '@/assets/icons/graph-icon.svg';
import roboticsIconUrl from '@/assets/icons/robotics-icon.svg';
import aiIconUrl from '@/assets/icons/ai-icon.svg';
import energyIconUrl from '@/assets/icons/energy-icon.svg';
import chartBarIconUrl from '@/assets/icons/chart-bar-icon.svg';
import dollarIconUrl from '@/assets/icons/dollar-icon.svg';
import trendingUpIconUrl from '@/assets/icons/trending-up-icon.svg';
import tableIconUrl from '@/assets/icons/table-icon.svg';
import priceChartIconUrl from '@/assets/icons/price-chart-icon.svg';
import marketCapIconUrl from '@/assets/icons/marketcap-icon.svg';
import revenueIconUrl from '@/assets/icons/revenue-icon.svg';
import ghostIconUrl from '@/assets/icons/ghost-icon.svg';
import solidIconUrl from '@/assets/icons/solid-icon.svg';
import companyIconUrl from '@/assets/icons/company-icon.svg';
import industryIconUrl from '@/assets/icons/industry-icon.svg';
import brainIconUrl from '@/assets/icons/brain-icon.svg';
import lightningIconUrl from '@/assets/icons/lightning-icon.svg';


interface IconProps {
  className?: string;
  size?: number;
}


export const ChartBarIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => {
  return (
    <img
      src={chartBarIconUrl}
      alt="Chart Bar Icon"
      className={className}
      width={size}
      height={size}
      style={{ display: 'inline-block' }}
      loading="lazy"
    />
  );
};


export const DollarIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => {
  return (
    <img
      src={dollarIconUrl}
      alt="Dollar Icon"
      className={className}
      width={size}
      height={size}
      style={{ display: 'inline-block' }}
      loading="lazy"
    />
  );
};


export const TrendingUpIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => {
  return (
    <img
      src={trendingUpIconUrl}
      alt="Trending Up Icon"
      className={className}
      width={size}
      height={size}
      style={{ display: 'inline-block' }}
      loading="lazy"
    />
  );
};


export const GraphIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => {
  return (
    <img
      src={graphIconUrl}
      alt="Graph Icon"
      className={className}
      width={size}
      height={size}
      style={{ display: 'inline-block' }}
      loading="lazy"
    />
  );
};


export const TableIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => {
  return (
    <img
      src={tableIconUrl}
      alt="Table Icon"
      className={className}
      width={size}
      height={size}
      style={{ display: 'inline-block' }}
      loading="lazy"
    />
  );
};


export const PriceChartIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => {
  return (
    <img
      src={priceChartIconUrl}
      alt="Price Chart Icon"
      className={className}
      width={size}
      height={size}
      style={{ display: 'inline-block' }}
      loading="lazy"
    />
  );
};


export const MarketCapIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => {
  return (
    <img
      src={marketCapIconUrl}
      alt="Market Cap Icon"
      className={className}
      width={size}
      height={size}
      style={{ display: 'inline-block' }}
      loading="lazy"
    />
  );
};


export const RevenueIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => {
  return (
    <img
      src={revenueIconUrl}
      alt="Revenue Icon"
      className={className}
      width={size}
      height={size}
      style={{ display: 'inline-block' }}
      loading="lazy"
    />
  );
};


export const GhostIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => {
  return (
    <img
      src={ghostIconUrl}
      alt="Ghost Icon"
      className={className}
      width={size}
      height={size}
      style={{ display: 'inline-block' }}
      loading="lazy"
    />
  );
};


export const SolidIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => {
  return (
    <img
      src={solidIconUrl}
      alt="Solid Icon"
      className={className}
      width={size}
      height={size}
      style={{ display: 'inline-block' }}
      loading="lazy"
    />
  );
};


export const CompanyIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => {
  return (
    <img
      src={companyIconUrl}
      alt="Company Icon"
      className={className}
      width={size}
      height={size}
      style={{ display: 'inline-block' }}
      loading="lazy"
    />
  );
};


export const IndustryIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => {
  return (
    <img
      src={industryIconUrl}
      alt="Industry Icon"
      className={className}
      width={size}
      height={size}
      style={{ display: 'inline-block' }}
      loading="lazy"
    />
  );
};


// Concept topic icons
export const RoboticsIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => {
  return (
    <img
      src={roboticsIconUrl}
      alt="Robotics Icon"
      className={className}
      width={size}
      height={size}
      style={{ display: 'inline-block' }}
      loading="lazy"
    />
  );
};


export const BrainIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => {
  return (
    <img
      src={brainIconUrl}
      alt="Brain Icon"
      className={className}
      width={size}
      height={size}
      style={{ display: 'inline-block' }}
      loading="lazy"
    />
  );
};


export const LightningIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => {
  return (
    <img
      src={lightningIconUrl}
      alt="Lightning Icon"
      className={className}
      width={size}
      height={size}
      style={{ display: 'inline-block' }}
      loading="lazy"
    />
  );
};


// Icon Renderer - Dynamic icon rendering from string identifiers
interface IconRendererProps {
  icon?: string;
  className?: string;
  size?: number;
}

const iconMap: Record<string, string> = {
  'graph': graphIconUrl,
  'robotics': roboticsIconUrl,
  'ai': aiIconUrl,
  'energy': energyIconUrl,
};


export const IconRenderer: React.FC<IconRendererProps> = ({ 
  icon, 
  className = '', 
  size = 48 
}) => {
  if (!icon) {
    return <GraphIcon className={className} size={size} />;
  }

  // Use React components for concept icons for better styling
  if (icon === 'robotics') {
    return <RoboticsIcon className={className} size={size} />;
  }
  if (icon === 'ai') {
    return <BrainIcon className={className} size={size} />;
  }
  if (icon === 'energy') {
    return <LightningIcon className={className} size={size} />;
  }
  if (icon === 'graph') {
    return <GraphIcon className={className} size={size} />;
  }

  const iconPath = iconMap[icon.toLowerCase()] || iconMap[icon] || graphIconUrl;

  // If it's already a URL/path, use it directly
  if (icon.startsWith('/') || icon.startsWith('http') || icon.includes('.svg')) {
    return <img src={icon} alt={`${icon} Icon`} className={className} width={size} height={size} style={{ display: 'inline-block' }} loading="lazy" />;
  }

  // For graph icon, use React component for theme support
  if (iconPath === graphIconUrl) {
    return <GraphIcon className={className} size={size} />;
  }

  return <img src={iconPath} alt={`${icon} Icon`} className={className} width={size} height={size} style={{ display: 'inline-block' }} loading="lazy" />;
};
