import React from 'react';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { useScrollReveal } from './hooks/useScrollReveal';
import TrustBar from './TrustBar';

const Bullet = ({ children, color, icon }) => (
  <div className="group flex items-start gap-4 p-4 rounded-xl bg-white/50 backdrop-blur-sm hover:bg-white transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.02] border border-transparent hover:border-gray-200/50">
    <div className="relative flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300" style={{ backgroundImage: `linear-gradient(135deg, ${color}, ${color}dd)` }}>
      {/* Icon glow effect */}
      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-50 blur-md transition-opacity duration-300" style={{ background: color }}></div>
      <div className="relative z-10">
        {icon || <ChevronRightRoundedIcon className="text-white text-xl" />}
      </div>
    </div>
    <p className="text-base lg:text-lg leading-relaxed text-gray-700 font-medium pt-1.5 group-hover:text-gray-900 transition-colors">{children}</p>
  </div>
);

const ServicesSection = ({ serviciosRef, onExploreClick, onBecomeSupplierClick }) => {
  const [headerRef, headerVisible] = useScrollReveal({ threshold: 0.2 });
  const [buyer1Ref, buyer1Visible] = useScrollReveal({ threshold: 0.2 });
  const [buyer2Ref, buyer2Visible] = useScrollReveal({ threshold: 0.2 });
  const [supplier1Ref, supplier1Visible] = useScrollReveal({ threshold: 0.2 });
  const [supplier2Ref, supplier2Visible] = useScrollReveal({ threshold: 0.2 });

  const goExplore = () => {
    if (onExploreClick) return onExploreClick();
    window.location.assign('/marketplace');
  };

  const goBecomeSupplier = () => {
    if (onBecomeSupplierClick) return onBecomeSupplierClick();
    window.location.assign('/?scrollTo=contactModal&t=' + Date.now());
  };

  return (
    <section ref={serviciosRef} className="relative pt-8 pb-20 md:pt-12 md:pb-28 lg:pt-16 lg:pb-36 bg-gradient-to-b from-slate-100 via-gray-100 to-slate-100 overflow-hidden border-b border-gray-300/50">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/15 via-blue-400/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }}></div>
        <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-gradient-to-tl from-orange-500/15 via-orange-400/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-300/6 via-pink-300/6 to-transparent rounded-full blur-3xl"></div>
        {/* Subtle mesh gradient */}
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(to right, #2E52B2 1px, transparent 1px), linear-gradient(to bottom, #F59E0B 1px, transparent 1px)', backgroundSize: '80px 80px' }}></div>
        {/* Premium grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(59 130 246) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16">
        {/* TrustBar moved to HeroSection - spacing kept to avoid overlap issues */}
        <div className="mb-20" aria-hidden>
          {/* placeholder for TrustBar overlap */}
        </div>

        {/* Header */}
        <div 
          ref={headerRef}
          className={`text-center mb-20 transition-all duration-1000 ${
            headerVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full mb-6">
            <div className="w-2 h-2 bg-gradient-to-r from-[#2E52B2] to-purple-600 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold bg-gradient-to-r from-[#2E52B2] to-purple-600 bg-clip-text text-transparent tracking-wide uppercase">Nuestros Servicios</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6">
            Un ecosistema, dos {' '}
            <span className="bg-gradient-to-r from-[#2E52B2] to-purple-600 bg-clip-text text-transparent">
              protagonistas
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            El punto de encuentro digital donde empresas y proveedores verificados concretan negocios
          </p>
        </div>

        <div className="space-y-32 lg:space-y-40">
          {/* Buyers Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Image - Buyers */}
            <div 
              ref={buyer1Ref}
              className={`order-2 lg:order-1 group transition-all duration-1000 ${
                buyer1Visible 
                  ? 'opacity-100 translate-x-0' 
                  : 'opacity-0 -translate-x-12'
              }`}
            >
              <div className="relative">
                {/* Animated glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-3xl opacity-30 group-hover:opacity-60 blur-2xl transition duration-500"></div>
                
                <div className="relative rounded-3xl overflow-hidden shadow-2xl group-hover:shadow-blue-500/30 transition-all duration-500 border border-blue-200/30">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  {/* Subtle shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <img
                    src="/Landing Page/landingbuyer.webp"
                    alt="Para Compradores"
                    className="w-full h-80 lg:h-[450px] object-cover transform group-hover:scale-[1.08] transition-transform duration-700"
                  />
                </div>
              </div>
            </div>

            {/* Text - Buyers */}
            <div 
              ref={buyer2Ref}
              className={`order-1 lg:order-2 transition-all duration-1000 ${
                buyer2Visible 
                  ? 'opacity-100 translate-x-0' 
                  : 'opacity-0 translate-x-12'
              }`}
            >
              <div className="group/badge inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-50 to-blue-100/50 border-2 border-blue-200/50 mb-8 shadow-sm hover:shadow-md hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105">
                <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-[#2E52B2] shadow-lg group-hover/badge:shadow-xl group-hover/badge:scale-110 transition-all duration-300">
                  <div className="absolute inset-0 rounded-lg bg-blue-400 opacity-0 group-hover/badge:opacity-30 blur-md transition-opacity duration-300"></div>
                  <svg className="relative z-10 w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-[#2E52B2] tracking-wider uppercase">Para Compradores</span>
              </div>

              <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-8 leading-tight">
                Centraliza y{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-[#2E52B2] to-blue-600 bg-clip-text text-transparent">agiliza</span>
                  <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8" preserveAspectRatio="none">
                    <path d="M0,5 Q50,0 100,5 T200,5" stroke="#2E52B2" strokeWidth="2" fill="none" opacity="0.5"/>
                  </svg>
                </span>
                {' '}tus compras B2B
              </h2>

              <div className="space-y-4 mb-10">
                <Bullet 
                  color="#2E52B2"
                  icon={
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  }
                >
                  Accede a proveedores verificados, encuentra socios comerciales confiables en minutos.
                </Bullet>
                <Bullet 
                  color="#2E52B2"
                  icon={
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  }
                >
                  Optimiza tus tiempos de compra cotizando en línea, negocia volumen y cierra tratos en tiempo récord, sin cadenas de correos.
                </Bullet>
                <Bullet 
                  color="#2E52B2"
                  icon={
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  }
                >
                  Simplifica tu gestión realizando compras seguras y obtén tus facturas al instante en nuestra plataforma.
                </Bullet>
              </div>

              <button
                onClick={goExplore}
                className="group relative px-10 py-5 bg-gradient-to-r from-[#2E52B2] to-blue-600 hover:from-[#254195] hover:to-[#2E52B2] text-white font-bold rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Explorar Marketplace
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              </button>
            </div>
          </div>

          {/* Suppliers Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Text - Suppliers */}
            <div 
              ref={supplier1Ref}
              className={`transition-all duration-1000 ${
                supplier1Visible 
                  ? 'opacity-100 translate-x-0' 
                  : 'opacity-0 -translate-x-12'
              }`}
            >
              <div className="group/badge inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-50 to-orange-100/50 border-2 border-orange-200/50 mb-8 shadow-sm hover:shadow-md hover:shadow-orange-500/20 transition-all duration-300 hover:scale-105">
                <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-[#F59E0B] shadow-lg group-hover/badge:shadow-xl group-hover/badge:scale-110 transition-all duration-300">
                  <div className="absolute inset-0 rounded-lg bg-orange-400 opacity-0 group-hover/badge:opacity-30 blur-md transition-opacity duration-300"></div>
                  <svg className="relative z-10 w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-[#F59E0B] tracking-wider uppercase">Para Proveedores</span>
              </div>

              <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-8 leading-tight">
                Expande tu mercado y{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-[#F59E0B] to-orange-600 bg-clip-text text-transparent">potencia</span>
                  <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8" preserveAspectRatio="none">
                    <path d="M0,5 Q50,0 100,5 T200,5" stroke="#F59E0B" strokeWidth="2" fill="none" opacity="0.5"/>
                  </svg>
                </span>
                {' '}tus ventas B2B
              </h2>

              <div className="space-y-4 mb-10">
                <Bullet 
                  color="#F59E0B"
                  icon={
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  }
                >
                  Accede a demanda calificada conectando con una red de empresas en Chile listas para comprar, sin salir a prospectar.
                </Bullet>
                <Bullet 
                  color="#F59E0B"
                  icon={
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  }
                >
                  Recibe cotizaciones directas, digitaliza tu catálogo y cierra ventas por volumen con clientes que buscan lo que ofreces.
                </Bullet>
                <Bullet 
                  color="#F59E0B"
                  icon={
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                >
                  Centraliza tu operación gestionando pedidos, negociando precios y emitiendo tus facturas automáticamente en nuestra plataforma.
                </Bullet>
              </div>

              <button
                onClick={goBecomeSupplier}
                className="group relative px-10 py-5 bg-gradient-to-r from-[#F59E0B] to-orange-600 hover:from-[#e08e0a] hover:to-[#F59E0B] text-white font-bold rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-orange-500/50 hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Quiero Ser Proveedor
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              </button>
            </div>

            {/* Image - Suppliers */}
            <div 
              ref={supplier2Ref}
              className={`group transition-all duration-1000 ${
                supplier2Visible 
                  ? 'opacity-100 translate-x-0' 
                  : 'opacity-0 translate-x-12'
              }`}
            >
              <div className="relative">
                {/* Animated glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-orange-400 rounded-3xl opacity-30 group-hover:opacity-60 blur-2xl transition duration-500"></div>
                
                <div className="relative rounded-3xl overflow-hidden shadow-2xl group-hover:shadow-orange-500/30 transition-all duration-500 border border-orange-200/30">
                  <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  {/* Subtle shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <img
                    src="/Landing Page/supplierImage.png"
                    alt="Para Proveedores"
                    className="w-full h-80 lg:h-[450px] object-cover transform group-hover:scale-[1.08] transition-transform duration-700"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
