import React from 'react';
import PlaceCard from './PlaceCard';

interface PlaceGridProps {
  searchQuery: string;
  selectedCategory: string;
}

const PlaceGrid: React.FC<PlaceGridProps> = ({ searchQuery, selectedCategory }) => {
  // Mock data for demonstration
  const places = [
    {
      id: '1',
      name: 'Central Park',
      type: 'park',
      formatted_address: '123 Park Ave, New York, NY',
      rating: 4.5,
      geometry: { location: { lat: 40.7829, lng: -73.9654 } },
      photos: ['https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400'],
    },
    {
      id: '2',
      name: 'Museum of Art',
      type: 'tourist_attraction',
      formatted_address: '456 Museum St, New York, NY',
      rating: 4.8,
      geometry: { location: { lat: 40.7794, lng: -73.9632 } },
      photos: ['https://images.unsplash.com/photo-1566127992631-137a642a90f4?w=400'],
    },
    {
      id: '3',
      name: 'Riverside Cafe',
      type: 'restaurant',
      formatted_address: '789 River Rd, New York, NY',
      rating: 4.3,
      geometry: { location: { lat: 40.7505, lng: -73.9934 } },
      photos: ['https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400'],
    },
  ];

  const filteredPlaces = places.filter(place => {
    const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || place.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredPlaces.map((place) => (
        <PlaceCard key={place.id} place={place} />
      ))}
    </div>
  );
};

export default PlaceGrid;