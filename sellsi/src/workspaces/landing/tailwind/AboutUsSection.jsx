import React from 'react';
import { useScrollReveal } from './hooks/useScrollReveal';

const AboutUsSection = ({ quienesSomosRef }) => {
  const [headerRef, headerVisible] = useScrollReveal({ threshold: 0.2 });
  const [card1Ref, card1Visible] = useScrollReveal({ threshold: 0.2 });
  const [card2Ref, card2Visible] = useScrollReveal({ threshold: 0.2 });
  const [card3Ref, card3Visible] = useScrollReveal({ threshold: 0.2 });

  return (
    <section
      ref={quienesSomosRef}
      className="relative w-full bg-white py-20 md:py-28 lg:py-36 overflow-hidden border-b border-gray-200/60"
      style={{ scrollMarginTop: '40px' }}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-300/20 to-blue-200/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-orange-300/15 to-orange-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-br from-purple-200/15 to-transparent rounded-full blur-2xl"></div>
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle, #2E52B2 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16">
        {/* Header section */}
        <div 
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-1000 ${
            headerVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full mb-6">
            <div className="w-2 h-2 bg-gradient-to-r from-[#2E52B2] to-purple-600 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold bg-gradient-to-r from-[#2E52B2] to-purple-600 bg-clip-text text-transparent tracking-wide uppercase">Quiénes Somos</span>
          </div>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-6 leading-tight">
            Somos{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-[#2E52B2] to-[#1e3a8a] bg-clip-text text-transparent">Sellsi</span>
              <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 200 12" preserveAspectRatio="none">
                <path d="M0,7 Q50,0 100,7 T200,7" stroke="#F59E0B" strokeWidth="3" fill="none" opacity="0.6"/>
              </svg>
            </span>
          </h2>

          <p className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
            Simplificamos el comercio entre empresas
          </p>

          <p className="text-xl md:text-2xl text-gray-700 leading-relaxed max-w-4xl mx-auto">
            En un mercado altamente complejo,{' '}
            <span className="font-extrabold text-[#2E52B2]">Sellsi</span>
            {' '}aporta claridad. Desarrollamos tecnología para transformar la manera en que las empresas interactúan.
          </p>
        </div>

        {/* Values cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Simple */}
          <div 
            ref={card1Ref}
            className={`group relative h-full transition-all duration-700 ${
              card1Visible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-12'
            }`}
            style={{ transitionDelay: card1Visible ? '100ms' : '0ms' }}
          >
            {/* Animated glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg transition duration-500 group-hover:duration-200 animate-pulse" style={{ animationDuration: '4s', opacity: 0.3 }}></div>
            
            <div className="relative h-full flex flex-col bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-[#2E52B2]/20 hover:border-[#2E52B2] backdrop-blur-sm">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 via-blue-600 to-[#2E52B2] rounded-xl mb-4 shadow-lg group-hover:shadow-blue-500/50 group-hover:scale-110 transition-all duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-3xl font-black bg-gradient-to-r from-[#2E52B2] to-blue-600 bg-clip-text text-transparent mb-3">Simple</h3>
              <p className="text-gray-700 leading-relaxed">
                Interfaz intuitiva y procesos optimizados para que puedas enfocarte en lo importante.
              </p>
            </div>
          </div>

          {/* Seguro */}
          <div 
            ref={card2Ref}
            className={`group relative h-full transition-all duration-700 ${
              card2Visible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-12'
            }`}
            style={{ transitionDelay: card2Visible ? '200ms' : '0ms' }}
          >
            {/* Animated glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg transition duration-500 group-hover:duration-200 animate-pulse" style={{ animationDuration: '4s', opacity: 0.3 }}></div>
            
            <div className="relative h-full flex flex-col bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-emerald-500/20 hover:border-emerald-600 backdrop-blur-sm">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-700 rounded-xl mb-4 shadow-lg group-hover:shadow-emerald-500/50 group-hover:scale-110 transition-all duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-3">Seguro</h3>
              <p className="text-gray-700 leading-relaxed">
                Protección de datos y transacciones verificadas para operar con total confianza.
              </p>
            </div>
          </div>

          {/* Transparente */}
          <div 
            ref={card3Ref}
            className={`group relative h-full transition-all duration-700 ${
              card3Visible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-12'
            }`}
            style={{ transitionDelay: card3Visible ? '300ms' : '0ms' }}
          >
            {/* Animated glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-orange-400 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg transition duration-500 group-hover:duration-200 animate-pulse" style={{ animationDuration: '4s', opacity: 0.3 }}></div>
            
            <div className="relative h-full flex flex-col bg-gradient-to-br from-white to-orange-50/30 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-[#F59E0B]/20 hover:border-[#F59E0B] backdrop-blur-sm">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 via-orange-500 to-[#F59E0B] rounded-xl mb-4 shadow-lg group-hover:shadow-orange-500/50 group-hover:scale-110 transition-all duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-3xl font-black bg-gradient-to-r from-[#F59E0B] to-orange-600 bg-clip-text text-transparent mb-3">Transparente</h3>
              <p className="text-gray-700 leading-relaxed">
                Información clara y precios visibles para tomar las mejores decisiones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUsSection;
