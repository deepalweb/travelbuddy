// Deprecated: Unsplash has been removed. These stubs return a local placeholder image
import { Place } from '../types.ts';

export const fetchPlaceImages = async (_placeName: string, _placeType?: string, count: number = 3): Promise<string[]> => {
  return Array.from({ length: count }, () => '/images/placeholder.svg');
};

export const fetchHeroImage = async (_placeName: string, _placeType?: string): Promise<string> => {
  return '/images/placeholder.svg';
};

export const fetchCuratedImages = async (_category: string, count: number = 10): Promise<string[]> => {
  return Array.from({ length: count }, () => '/images/placeholder.svg');
};

export const fetchRelatedImages = async (_place: Partial<Place>, count: number = 5): Promise<string[]> => {
  return Array.from({ length: count }, () => '/images/placeholder.svg');
};
