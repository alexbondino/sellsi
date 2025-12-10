import React from 'react'
import { useNavigate } from 'react-router-dom'

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
    <section className="relative w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 py-24 md:py-32 lg:py-28 xl:py-36 overflow-hidden">
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

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left Column - Text */}
        <div className="text-left space-y-8 animate-fade-in-up">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight">
            Conectamos{' '}
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
              Compradores
            </span>{' '}
            con{' '}
            <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
              Proveedores
            </span>
          </h1>

          <p className="text-xl text-gray-400 leading-relaxed max-w-2xl">
            <span className="font-bold text-white">Sellsi</span> es la
            plataforma que revoluciona el comercio B2B en Chile. Conecta
            directamente, negocia sin fricciones y cierra negocios a cualquier
            escala.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-8">
            <button
              onClick={handleExplore}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl text-base transition-all duration-300 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:scale-105 overflow-hidden"
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
              className="group px-8 py-4 bg-white/5 backdrop-blur-sm border-2 border-orange-500/50 text-orange-400 hover:bg-orange-500 hover:text-white hover:border-orange-500 font-bold rounded-xl text-base transition-all duration-300 hover:scale-105"
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

        {/* Right Column - Image with floating elements */}
        <div
          className="relative flex items-center justify-center lg:justify-end animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="relative max-w-md lg:max-w-lg w-full group">
            <div className="relative">
              <img
                src="/assets/hero-illustration.webp"
                alt="Presentación de Sellsi"
                className="w-full h-auto object-contain drop-shadow-2xl transform group-hover:scale-[1.02] transition-transform duration-700 ease-out"
              />
            </div>
          </div>
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
  )
}

export default HeroSection
