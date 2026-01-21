import React from 'react'

export default function TrustBar({ className = '' }) {
  const items = [
    {
      key: 'marketplace',
      text: 'Marketplace B2B',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      key: 'orders',
      text: 'Órdenes de compra digitales',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      key: 'docs',
      text: 'Documentos y pagos trazables',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ]

  return (
    <div className={`w-full bg-white py-3 md:py-4 border border-gray-100 shadow-sm ${className}`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative flex flex-col md:flex-row items-stretch md:items-center justify-center gap-4 md:gap-12">
          {/* Divider lines exactly at 1/3 and 2/3 of the container on desktop */}
          <div className="hidden md:block absolute top-1/2 transform -translate-y-1/2 w-px bg-gray-200" style={{ left: '33.333%', height: '100%' }} />
          <div className="hidden md:block absolute top-1/2 transform -translate-y-1/2 w-px bg-gray-200" style={{ left: '66.666%', height: '100%' }} />
          {items.map((item, idx) => (
            <div
              key={item.key}
              className="flex items-center gap-3 group cursor-default w-full md:w-1/3 md:justify-center"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-600 group-hover:from-blue-600 group-hover:to-blue-700 group-hover:text-white transition-all duration-300 group-hover:scale-110 shadow-sm group-hover:shadow-md">
                {item.icon}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm md:text-base font-semibold text-gray-800">
                  {item.text}
                </span>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

