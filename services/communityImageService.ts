// Unsplash removed; use placeholders and Google Place Photos if available
import { Post } from '../types.ts';

/**
 * Generate images for community posts based on content and tags
 */
export const generatePostImages = async (
  _content: string,
  _tags: string[],
  _category: string,
  count: number = 2
): Promise<string[]> => {
  // Images disabled: return placeholders only
  return Array.from({ length: count }, () => '/images/placeholder.svg');
};

/**
 * Extract potential location keywords from text content
 */
const extractLocationKeywords = (_content: string): string[] => {
  const locationPatterns = [
    // Common location indicators
    /\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /\bat\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /\bvisited\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /\bfrom\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    // Specific place types
    /([A-Z][a-z]+\s+(?:Beach|Mountain|Park|Museum|Temple|Castle|Bridge|Lake|River))/g,
    /([A-Z][a-z]+\s+(?:City|Town|Village|Island))/g,
  ];
  
  const locations: string[] = [];
  
  locationPatterns.forEach((pattern) => {
    const matches = _content.match(pattern);
    if (matches) {
      matches.forEach((match: string) => {
        const location = match.replace(/^(in|at|visited|from)\s+/i, '').trim();
        if (location.length > 2 && location.length < 30) {
          locations.push(location);
        }
      });
    }
  });
  
  return [...new Set(locations)]; // Remove duplicates
};

/**
 * Enhance existing posts with better images
 */
export const enhancePostWithImages = async (post: Post): Promise<Post> => {
  if (post.content.images.length > 0) {
    return post; // Already has images
  }
  
  try {
    const images = await generatePostImages(
      post.content.text,
      post.tags,
      post.category,
      Math.random() > 0.5 ? 2 : 1 // Randomly 1 or 2 images
    );
    
    return {
      ...post,
      content: {
        ...post.content,
        images
      }
    };
  } catch (error) {
    console.warn('Failed to enhance post with images:', error);
    return post;
  }
};

/**
 * Generate avatar images for community users
 */
export const generateUserAvatar = async (_username: string): Promise<string> => {
  try {
    return '/images/placeholder.svg';
  } catch {
  return '/images/placeholder.svg';
  }
};

/**
 * Get category-specific background images
 */
export const getCategoryBackgroundImage = async (_category: string): Promise<string> => {
  return '/images/placeholder.svg';
};