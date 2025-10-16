import React from 'react';
import HeroSection from './HeroSection';
import HowItWorks from './HowItWorks';
import TrustSection from './TrustSection';
import WelcomeSection from './WelcomeSection';
import Footer from '../../layout/Footer';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <WelcomeSection />
      <HowItWorks />
      <TrustSection />
      <Footer />
    </div>
  );
};

export default HomePage;