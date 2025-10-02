import React, { useState, useEffect } from 'react';
import { TripPlan } from '../../../types';
import TripCard from './TripCard';

const TripsList: React.FC = () => {
  const [trips, setTrips] = useState<TripPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading trips
    const timer = setTimeout(() => {
      const mockTrips: TripPlan[] = [
        {
          id: '1',
          title: 'Paris Adventure',
          destination: 'Paris, France',
          duration: '5 days',
          introduction: 'Explore the City of Light with this comprehensive itinerary.',
          conclusion: 'A perfect blend of culture, cuisine, and romance awaits!',
          dailyPlans: [
            {
              day: 1,
              title: 'Arrival & Eiffel Tower',
              activities: [
                {
                  time: '10:00 AM',
                  title: 'Arrive in Paris',
                  description: 'Check into hotel and freshen up',
                  location: 'Hotel',
                },
                {
                  time: '2:00 PM',
                  title: 'Eiffel Tower Visit',
                  description: 'Visit the iconic Eiffel Tower and surrounding area',
                  location: 'Eiffel Tower',
                  duration: '3 hours',
                },
              ],
            },
            {
              day: 2,
              title: 'Louvre & Seine River',
              activities: [
                {
                  time: '9:00 AM',
                  title: 'Louvre Museum',
                  description: 'Explore world-famous art collections',
                  location: 'Louvre Museum',
                  duration: '4 hours',
                },
                {
                  time: '6:00 PM',
                  title: 'Seine River Cruise',
                  description: 'Romantic evening cruise along the Seine',
                  location: 'Seine River',
                  duration: '2 hours',
                },
              ],
            },
          ],
        },
        {
          id: '2',
          title: 'Tokyo Explorer',
          destination: 'Tokyo, Japan',
          duration: '7 days',
          introduction: 'Discover the perfect blend of traditional and modern Japan.',
          conclusion: 'An unforgettable journey through Japan\'s vibrant capital!',
          dailyPlans: [
            {
              day: 1,
              title: 'Shibuya & Harajuku',
              activities: [
                {
                  time: '11:00 AM',
                  title: 'Shibuya Crossing',
                  description: 'Experience the world\'s busiest pedestrian crossing',
                  location: 'Shibuya',
                },
                {
                  time: '2:00 PM',
                  title: 'Harajuku Fashion District',
                  description: 'Explore unique fashion and street culture',
                  location: 'Harajuku',
                  duration: '3 hours',
                },
              ],
            },
          ],
        },
        {
          id: '3',
          title: 'New York City Weekend',
          destination: 'New York, USA',
          duration: '3 days',
          introduction: 'A whirlwind tour of the Big Apple\'s highlights.',
          conclusion: 'The city that never sleeps will leave you wanting more!',
          dailyPlans: [
            {
              day: 1,
              title: 'Manhattan Highlights',
              activities: [
                {
                  time: '9:00 AM',
                  title: 'Central Park',
                  description: 'Morning walk through the iconic park',
                  location: 'Central Park',
                  duration: '2 hours',
                },
                {
                  time: '1:00 PM',
                  title: 'Times Square',
                  description: 'Experience the energy of Times Square',
                  location: 'Times Square',
                },
              ],
            },
          ],
        },
      ];

      setTrips(mockTrips);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
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

  if (trips.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No trips yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Start planning your next adventure by creating your first trip.
        </p>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          Create Your First Trip
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
};

export default TripsList;