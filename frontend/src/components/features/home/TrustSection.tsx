import React from 'react';

const TrustSection: React.FC = () => {
  const partners = [
    { name: 'Booking.com', logo: '🏨' },
    { name: 'Expedia', logo: '✈️' },
    { name: 'Google Maps', logo: '🗺️' },
    { name: 'Weather API', logo: '🌤️' },
    { name: 'Ticketmaster', logo: '🎫' },
    { name: 'TripAdvisor', logo: '⭐' }
  ];

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
        Powered by the Best in Travel
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
        {partners.map((partner) => (
          <div key={partner.name} className="flex flex-col items-center space-y-2 opacity-70 hover:opacity-100 transition-opacity">
            <div className="text-4xl">{partner.logo}</div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {partner.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrustSection;