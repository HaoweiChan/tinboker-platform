/**
 * Industry color utilities
 * Provides consistent color mapping for industries using hashing
 */

// Industry color palette - distinct colors for different industries
const INDUSTRY_COLORS = [
  '#3B82F6', // Blue - IC Design
  '#10B981', // Green - CSP
  '#8B5CF6', // Purple - Foundry
  '#F59E0B', // Amber - Equipment
  '#EF4444', // Red - Memory
  '#EC4899', // Pink - Packaging
  '#06B6D4', // Cyan - Testing
  '#84CC16', // Lime - Materials
  '#F97316', // Orange - Software
  '#6366F1', // Indigo - Services
  '#14B8A6', // Teal - Other
];

/**
 * Hash a string to a consistent number
 * Uses a simple djb2 hash algorithm for consistency
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get industry color for a given industry name
 * Uses consistent hashing to ensure same industry always gets same color
 */
export function getIndustryColor(industry: string): string {
  if (!industry) {
    return INDUSTRY_COLORS[0]; // Default color
  }
  
  const hash = hashString(industry.toLowerCase().trim());
  const index = hash % INDUSTRY_COLORS.length;
  return INDUSTRY_COLORS[index];
}

/**
 * Map ticker to industry
 * This is a placeholder - in production, this would come from companyDetails API
 */
export function getIndustryFromTicker(ticker: string, category?: string): string {
  // Industry mapping based on ticker and category
  // This can be enhanced with actual companyDetails data
  const industryMap: Record<string, string> = {
    'NVDA': 'IC Design',
    'AMD': 'IC Design',
    'INTC': 'IC Design',
    'MSFT': 'CSP',
    'GOOGL': 'CSP',
    'AMZN': 'CSP',
    'TSM': 'Foundry',
    'PLTR': 'Software',
    'SNOW': 'Software',
    'ENPH': 'Equipment',
    'FSLR': 'Equipment',
  };
  
  // If we have a direct mapping, use it
  if (industryMap[ticker]) {
    return industryMap[ticker];
  }
  
  // Fallback to category-based mapping
  if (category === 'aiChips') {
    return 'IC Design';
  }
  if (category === 'automation') {
    return 'Equipment';
  }
  if (category === 'components') {
    return 'Components';
  }
  
  // Default fallback
  return 'Other';
}

