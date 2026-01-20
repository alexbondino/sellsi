import React from 'react'
import { useNavigate } from 'react-router-dom'
import TrustBar from './TrustBar'

const HeroSection = ({ onExploreClick, onDemoClick }) => {
  const navigate = useNavigate()
  
  const handleExplore = () => {
    if (onExploreClick) return onExploreClick()
    window.location.assign('/marketplace')
  }

  const handleDemo = () => {
    if (onDemoClick) return onDemoClick()
    // Navigate with contactModal query param to trigger modal opening
    const search = `?scrollTo=${encodeURIComponent('contactModal')}&t=${Date.now()}`;
    navigate(`/${search}`);
  }

  return (
    <>
      <section
        className="relative w-full min-h-[85vh] md:min-h-[80vh] lg:min-h-[75vh] pt-24 pb-12 md:pt-20 md:pb-8 lg:pt-36 lg:pb-12 xl:pt-48 xl:pb-16 overflow-visible flex items-center"
        style={{ backgroundImage: 'linear-gradient(to bottom, #000000 0%, #000000 65%, #2E52B2 100%)', fontFamily: "'Poppins', Arial, sans-serif" }}
      >
        {/* Grid background with depth */}
        <div className="absolute inset-0 opacity-[0.15]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
              linear-gradient(to right, rgba(59, 130, 246, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(59, 130, 246, 0.08) 1px, transparent 1px)
            `,
              backgroundSize: '50px 50px',
            }}
          ></div>
        </div>

        {/* Animated background gradients */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute top-1/3 -right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '1s' }}
          ></div>
          <div
            className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '2s' }}
          ></div>
        </div>

        <div className="relative max-w-[1800px] mx-auto px-6 sm:px-8 md:px-12 lg:px-8 xl:px-10 grid grid-cols-1 gap-12 lg:gap-20 items-center">
          {/* Left Column - Text */}
          <div className="text-center space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12 animate-fade-in-up">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-white leading-[1.15] sm:leading-[1.1] tracking-tight">
              Centraliza y optimiza tus procesos de <span className="font-bold">compras</span> y <span className="font-bold">ventas</span> en una sola plataforma.
            </h1>

            <p className="text-base sm:text-lg md:text-[2rem] lg:text-[2rem] xl:text-[2rem] text-gray-400 leading-relaxed md:leading-8 max-w-6xl mx-auto text-center">
              <span className="text-white">Cotiza, negocia por volumen y accede a plazos de pago en un solo lugar.</span>
            </p>

            <div className="flex flex-col md:flex-row gap-4 pt-8 items-center justify-center">
              <button
                onClick={handleExplore}
                className="w-full md:w-auto md:min-w-[280px] group relative px-8 py-4 md:px-10 md:py-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl text-base transition-all duration-300 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:scale-105 overflow-hidden"
              > 
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Explorar Marketplace
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
              <button
                onClick={handleDemo}
                className="w-full md:w-auto md:min-w-[280px] group px-8 py-4 md:px-10 md:py-5 bg-transparent border border-white text-white hover:bg-[rgba(255,255,255,0.15)] hover:border-white hover:text-white font-semibold rounded-xl text-base transition-all duration-300"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                  Agendar Demo
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* TrustBar overlap: half inside Hero, half overlapping Services (hidden on mobile) */}
        <div className="hidden md:flex absolute left-0 right-0 bottom-0 justify-center pointer-events-none z-30">
          <div className="pointer-events-auto transform translate-y-1/2 md:translate-y-1/2 w-full px-4">
            <TrustBar className="mx-auto max-w-6xl rounded-2xl shadow-lg" />
          </div>
        </div>

        <style>{`
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes float {
            0%,
            100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-20px);
            }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.8s ease-out forwards;
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
        `}</style>
      </section>
      {/* TrustBar visible solo en mobile, justo debajo de HeroSection */}
      <div className="block md:hidden w-full px-4 mt-8 mb-4">
        <TrustBar className="mx-auto max-w-6xl rounded-2xl shadow-lg" />
      </div>
    </>
  )
}

export default HeroSection
