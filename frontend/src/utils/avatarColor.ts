/**
 * Curated color palette for stock logo fallback avatars
 * These colors are optimized for dark mode with good contrast against white text
 */
const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-indigo-600',
  'bg-violet-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-cyan-600',
  'bg-fuchsia-600',
];


/**
 * Generate a deterministic background color for a stock ticker
 * The same ticker will always return the same color
 * 
 * @param ticker - Stock ticker symbol (e.g., "NVDA", "2330.TW")
 * @returns Tailwind background color class
 */
export function getAvatarColor(ticker: string): string {
  // Compute a simple hash of the ticker string
  let hash = 0;
  for (let i = 0; i < ticker.length; i++) {
    hash += ticker.charCodeAt(i);
  }
  
  // Use modulo to select a color from the palette
  const colorIndex = hash % AVATAR_COLORS.length;
  return AVATAR_COLORS[colorIndex];
}

