/**
 * Mock available concepts - simulates GET /api/concepts
 * 
 * SOURCE: Extracted from src/services/mockData.ts
 */

import type { ConceptMetadata } from './types';

export const mockConcepts: ConceptMetadata[] = [
  {
    id: 'robotics',
    title: 'Robotics & Automation',
    description: 'Explore the interconnected world of robotics and automation companies.',
    icon: 'robotics',
    gradient: 'bg-gradient-to-br from-[#E04F3F] to-[#EC7A3C]',
  },
  {
    id: 'ai',
    title: 'Artificial Intelligence',
    description: 'Discover how AI companies are shaping the future of technology.',
    icon: 'ai',
    gradient: 'bg-gradient-to-br from-[#EC7A3C] to-[#F5C563]',
  },
  {
    id: 'energy',
    title: 'Clean Energy',
    description: 'See the network of companies driving the clean energy revolution.',
    icon: 'energy',
    gradient: 'bg-gradient-to-br from-[#F5C563] to-[#4D6B94]',
  },
];

