import { useQuery } from '@tanstack/react-query';
import { Place } from '../types';

const fetchPlaces = async (location: string): Promise<Place[]> => {
  const response = await fetch(`/api/places?location=${encodeURIComponent(location)}`);
  if (!response.ok) throw new Error('Failed to fetch places');
  return response.json();
};

export const usePlaces = (location: string) => {
  return useQuery({
    queryKey: ['places', location],
    queryFn: () => fetchPlaces(location),
    enabled: !!location,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};