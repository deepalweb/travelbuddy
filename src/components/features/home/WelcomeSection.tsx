import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { User } from '../../../types';

interface WelcomeSectionProps {
  user: User | null;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ user }) => {
  const { t } = useLanguage();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black/10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-y-6"></div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {user ? `${getGreeting()}, ${user.username}!` : 'Welcome to Travel Buddy'}
            </h1>
            <p className="text-lg text-indigo-100 mb-6">
              {user 
                ? 'Ready for your next adventure? Discover amazing places around you.'
                : 'Discover amazing places, plan perfect trips, and connect with fellow travelers.'
              }
            </p>
            
            {!user && (
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                  Get Started
                </button>
                <button className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
                  Learn More
                </button>
              </div>
            )}
          </div>

          {/* Illustration */}
          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;