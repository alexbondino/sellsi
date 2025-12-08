import React from 'react';
import HeroSection from './HeroSection';
import ServicesSection from './ServicesSection';
import AboutUsSection from './AboutUsSection';
import ContactSection from './ContactSection';

const LandingPage = () => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white">
      <HeroSection />
      <ServicesSection />
      <AboutUsSection />
      <ContactSection />
    </div>
  );
};

export default LandingPage;
