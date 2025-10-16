import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

const TripsPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t('nav.trips')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Plan and manage your travel adventures
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No trips yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start planning your next adventure
          </p>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Create New Trip
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripsPage;