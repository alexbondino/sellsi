import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import HeroSection from './HeroSection';
import ServicesSection from './ServicesSection';
import AboutUsSection from './AboutUsSection';
import ContactSection from './ContactSection';

const LandingPage = ({ scrollTargets }) => {
  const location = useLocation();
  const topRef = useRef(null);
  const quienesSomosRef = useRef(null);
  const serviciosRef = useRef(null);
  const contactRef = useRef(null);

  // Scroll automático al anchor si hay scrollTo en la URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const scrollTo = params.get('scrollTo');
    if (scrollTo) {
      const refMap = {
        top: { ref: topRef, offset: 0 },
        quienesSomosRef: { ref: quienesSomosRef, offset: 0 },
        serviciosRef: { ref: serviciosRef, offset: 60 },
        contactModal: { ref: contactRef, offset: 0 },
        trabajaConNosotrosRef: { ref: serviciosRef, offset: 0 },
      };

      const entry = refMap[scrollTo];
      const targetRef = entry?.ref || entry;
      const offset = entry?.offset || 0;

      if (targetRef && targetRef.current) {
        setTimeout(() => {
          const topPos =
            targetRef.current.getBoundingClientRect().top +
            window.scrollY -
            offset;
          window.scrollTo({ top: Math.max(0, topPos), behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location.search]);

  return (
    <div ref={topRef} className="min-h-screen w-full overflow-x-hidden bg-white">
      <HeroSection />
      <ServicesSection serviciosRef={serviciosRef} />
      <AboutUsSection quienesSomosRef={quienesSomosRef} />
      <ContactSection contactRef={contactRef} />
    </div>
  );
};

export default LandingPage;
