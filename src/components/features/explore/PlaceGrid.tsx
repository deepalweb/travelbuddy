import React, { useState, useEffect } from 'react';
import { Place } from '../../../types';
import PlaceCard from './PlaceCard';

interface PlaceGridProps {
  searchQuery: string;
  selectedCategory: string;
}

const PlaceGrid: React.FC<PlaceGridProps> = ({ searchQuery, selectedCategory }) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      const mockPlaces: Place[] = [
        {
          id: '1',
          name: 'Central Park',
          type: 'Park',
          formatted_address: '123 Park Ave, New York, NY',
          rating: 4.5,
          price_level: 0,
          geometry: { location: { lat: 40.7829, lng: -73.9654 } },
          photos: ['https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400'],
          opening_hours: { open_now: true },
        },
        {
          id: '2',
          name: 'Museum of Art',
          type: 'Museum',
          formatted_address: '456 Museum St, New York, NY',
          rating: 4.8,
          price_level: 2,
          geometry: { location: { lat: 40.7794, lng: -73.9632 } },
          photos: ['https://images.unsplash.com/photo-1566127992631-137a642a90f4?w=400'],
          opening_hours: { open_now: true },
        },
        {
          id: '3',
          name: 'Riverside Cafe',
          type: 'Restaurant',
          formatted_address: '789 River Rd, New York, NY',
          rating: 4.3,
          price_level: 2,
          geometry: { location: { lat: 40.7505, lng: -73.9934 } },
          photos: ['https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400'],
          opening_hours: { open_now: false },
        },
        {
          id: '4',
          name: 'Grand Hotel',
          type: 'Hotel',
          formatted_address: '321 Grand St, New York, NY',
          rating: 4.6,
          price_level: 3,
          geometry: { location: { lat: 40.7614, lng: -73.9776 } },
          photos: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'],
          opening_hours: { open_now: true },
        },
        {
          id: '5',
          name: 'Shopping Plaza',
          type: 'Shopping',
          formatted_address: '654 Shop Ave, New York, NY',
          rating: 4.2,
          price_level: 2,
          geometry: { location: { lat: 40.7589, lng: -73.9851 } },
          photos: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400'],
          opening_hours: { open_now: true },
        },
        {
          id: '6',
          name: 'Theater District',
          type: 'Entertainment',
          formatted_address: '987 Theater St, New York, NY',
          rating: 4.7,
          price_level: 3,
          geometry: { location: { lat: 40.7590, lng: -73.9845 } },
          photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'],
          opening_hours: { open_now: true },
        },
      ];

      // Filter places based on search and category
      let filteredPlaces = mockPlaces;

      if (searchQuery) {
        filteredPlaces = filteredPlaces.filter(place =>
          place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          place.type.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (selectedCategory !== 'all') {
        filteredPlaces = filteredPlaces.filter(place =>
          place.type.toLowerCase().includes(selectedCategory.toLowerCase())
        );
      }

      setPlaces(filteredPlaces);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-300 dark:bg-gray-600 rounded-xl h-48 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No places found
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {places.map((place) => (
        <PlaceCard key={place.id} place={place} />
      ))}
    </div>
  );
};

export default PlaceGrid;