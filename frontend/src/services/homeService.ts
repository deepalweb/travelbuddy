// Mock API functions for home screen data

export const fetchWeatherData = async (lat: number, lng: number) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    temperature: 28 + Math.random() * 10,
    condition: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)],
    humidity: 65,
    windSpeed: 12
  };
};

export const fetchDeals = async () => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return [
    {
      id: '1',
      title: 'Beach Resort Weekend',
      discount: '50% OFF',
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400',
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      businessName: 'Paradise Resort'
    },
    {
      id: '2',
      title: 'City Tour Package',
      discount: '30% OFF',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
      validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      businessName: 'Urban Adventures'
    },
    {
      id: '3',
      title: 'Mountain Hiking Experience',
      discount: '25% OFF',
      image: 'https://images.unsplash.com/photo-1464822759844-d150baec0494?w=400',
      validUntil: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      businessName: 'Peak Explorers'
    }
  ];
};

export const fetchNearbyPlaces = async (lat: number, lng: number) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  return [
    {
      id: '1',
      name: 'Sunset Beach',
      type: 'beach',
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300',
      travelStyle: 'beach'
    },
    {
      id: '2',
      name: 'Mountain View Cafe',
      type: 'restaurant',
      rating: 4.2,
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300',
      travelStyle: 'food'
    },
    {
      id: '3',
      name: 'Historic Downtown',
      type: 'attraction',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=300',
      travelStyle: 'cultural'
    },
    {
      id: '4',
      name: 'Adventure Park',
      type: 'recreation',
      rating: 4.3,
      image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=300',
      travelStyle: 'adventure'
    },
    {
      id: '5',
      name: 'Nature Trail',
      type: 'park',
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300',
      travelStyle: 'nature'
    },
    {
      id: '6',
      name: 'City Mall',
      type: 'shopping',
      rating: 4.1,
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300',
      travelStyle: 'urban'
    }
  ];
};