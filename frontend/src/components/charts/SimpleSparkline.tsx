import React, { useMemo } from 'react';

interface SimpleSparklineProps {
  isPositive: boolean;
  className?: string;
  width?: number;
  height?: number;
  color?: string; // Custom color for the line/area (overrides isPositive logic)
  data?: number[]; // Real data points (overrides generated mock data)
}

// Generate smooth 30-day trend data for fundamental analysis view
const generate30DayTrend = (isPositive: boolean, width: number, height: number): string => {
  const points: string[] = [];
  const numPoints = 30;
  const stepX = width / (numPoints - 1);

  // Starting and ending y positions based on trend
  const startY = isPositive ? height * 0.7 : height * 0.3;
  const endY = isPositive ? height * 0.1 : height * 0.9;

  // Generate smooth curve with some natural variation
  for (let i = 0; i < numPoints; i++) {
    const x = i * stepX;
    // Base trend line
    const baseY = startY + ((endY - startY) * (i / (numPoints - 1)));
    // Add subtle wave variation (±10% of height)
    const variation = Math.sin(i * 0.5) * height * 0.1;
    const y = Math.max(0, Math.min(height, baseY + variation));
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  return points.join(' ');
};

const normalizeDataToPoints = (data: number[], width: number, height: number): string => {
  if (data.length < 2) return "";
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  return data.map((val, i) => {
    const x = i * stepX;
    const normalizedY = (val - min) / range;
    // Invert Y because SVG 0 is at top
    // Add padding (10%) to avoid clipping
    const paddedHeight = height * 0.8;
    const padding = height * 0.1;
    const y = height - (padding + (normalizedY * paddedHeight));
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
};

export const SimpleSparkline: React.FC<SimpleSparklineProps> = ({
  isPositive,
  className = "",
  width = 60,
  height = 20,
  color: customColor,
  data
}) => {
  // Generate points from real data OR mock trend
  const dataPoints = useMemo(() => {
    if (data && data.length > 0) {
      return normalizeDataToPoints(data, width, height);
    }
    return generate30DayTrend(isPositive, width, height);
  }, [data, isPositive, width, height]);

  // Use custom color if provided, otherwise fall back to isPositive logic
  const color = customColor || (isPositive ? "#22c55e" : "#ef4444"); // green-500 : red-500

  // Gradient fill for area chart (fade to transparent)
  const gradientId = `gradient-${isPositive ? 'pos' : 'neg'}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area fill with gradient */}
      <path
        d={`M0,${height} L${dataPoints} L${width},${height} Z`}
        fill={`url(#${gradientId})`}
        stroke="none"
      />

      {/* Line */}
      <polyline
        points={dataPoints}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

