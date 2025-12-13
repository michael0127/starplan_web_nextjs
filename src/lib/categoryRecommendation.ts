import Fuse from 'fuse.js';
import { JOB_CATEGORIES } from './jobCategories';

export interface CategoryRecommendation {
  category: string;
  score: number;
}

// Interface for Fuse.js search
interface CategorySearchItem {
  category: string;
}

// Configure Fuse.js for fuzzy matching
const fuseOptions = {
  keys: ['category'],
  threshold: 0.4, // 0 = perfect match, 1 = match anything
  includeScore: true,
  minMatchCharLength: 2,
  ignoreLocation: true, // Search in entire string, not just beginning
};

/**
 * Get top 4 recommended categories based on job title
 * @param jobTitle - The job title to match against
 * @returns Array of up to 4 category recommendations, sorted by relevance
 */
export const getRecommendedCategories = (
  jobTitle: string
): CategoryRecommendation[] => {
  if (!jobTitle || jobTitle.trim().length === 0) {
    return [];
  }

  // Prepare search data
  const searchData: CategorySearchItem[] = JOB_CATEGORIES.map(cat => ({
    category: cat,
  }));
  
  const fuse = new Fuse<CategorySearchItem>(searchData, fuseOptions);
  
  // Perform fuzzy search
  const results = fuse.search(jobTitle);
  
  // Convert results to recommendations and return top 4
  const recommendations = results
    .map(result => ({
      category: result.item.category,
      score: result.score || 0,
    }))
    .slice(0, 4); // Top 4 recommendations
  
  return recommendations;
};

/**
 * Get the top recommended category
 * @param jobTitle - The job title to match against
 * @returns The most relevant category or null if no match
 */
export const getTopRecommendedCategory = (
  jobTitle: string
): string | null => {
  const recommendations = getRecommendedCategories(jobTitle);
  return recommendations.length > 0 ? recommendations[0].category : null;
};
