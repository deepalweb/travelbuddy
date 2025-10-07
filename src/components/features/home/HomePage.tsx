import React from 'react';
import HeroSection from './HeroSection';
import TripPlanningForm from './TripPlanningForm';
import TrustSection from './TrustSection';
import HowItWorks from './HowItWorks';

const HomePage: React.FC = () => {
  return (
    <div className="space-y-16">
      <HeroSection />
      <TripPlanningForm />
      <TrustSection />
      <HowItWorks />
    </div>
  );
};

export default HomePage;