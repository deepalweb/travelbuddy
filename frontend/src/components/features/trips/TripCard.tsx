import React from 'react';
import { TripPlan } from '../../../types';

interface TripCardProps {
  trip: TripPlan;
}

const TripCard: React.FC<TripCardProps> = ({ trip }) => {
  const handleViewTrip = () => {
    console.log('View trip:', trip.id);
  };

  const handleEditTrip = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Edit trip:', trip.id);
  };

  const handleDeleteTrip = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Delete trip:', trip.id);
  };

  return (
    <div 
      onClick={handleViewTrip}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer border border-gray-200 dark:border-gray-700"
    >
      {/* Header Image */}
      <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-xl font-bold mb-1">{trip.title}</h3>
          <p className="text-indigo-100">{trip.destination}</p>
        </div>
        
        {/* Actions Menu */}
        <div className="absolute top-4 right-4">
          <div className="relative group">
            <button className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button
                onClick={handleEditTrip}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Trip</span>
              </button>
              <button
                onClick={handleDeleteTrip}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete Trip</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
            {trip.duration}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {trip.dailyPlans.length} days planned
          </span>
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
          {trip.introduction}
        </p>

        {/* Activities Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Upcoming Activities:
          </h4>
          <div className="space-y-1">
            {trip.dailyPlans.slice(0, 2).map((day) => (
              <div key={day.day} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <span className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                  {day.day}
                </span>
                <span className="truncate">{day.title}</span>
              </div>
            ))}
            {trip.dailyPlans.length > 2 && (
              <div className="text-xs text-gray-500 dark:text-gray-500 ml-8">
                +{trip.dailyPlans.length - 2} more days
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-500">
            Created 2 days ago
          </span>
          <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium">
            View Details →
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripCard;