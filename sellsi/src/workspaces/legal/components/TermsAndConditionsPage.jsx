// 📁 workspaces/legal/components/TermsAndConditionsPage.jsx
import React from 'react';
import { termsContent } from '../../../shared/constants/content/termsContent';
import { TextFormatter } from '../../../shared/components/formatters';

const TermsAndConditionsPage = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-white">
      {/* Header Section */}
      <section className="relative w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 py-16 md:py-20 overflow-hidden">
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
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute top-1/3 -right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '1s' }}
          ></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <svg className="h-10 w-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <span className="text-sm font-bold bg-gradient-to-r from-blue-400 to-orange-500 bg-clip-text text-transparent tracking-wide uppercase">
              Legal
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
            Términos y{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-[#2E52B2] to-[#1e3a8a] bg-clip-text text-transparent">
                Condiciones
              </span>
              <svg
                className="absolute -bottom-1 sm:-bottom-2 left-0 w-full"
                height="12"
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,7 Q50,0 100,7 T200,7"
                  stroke="#F59E0B"
                  strokeWidth="3"
                  fill="none"
                  opacity="0.6"
                />
              </svg>
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto">
            Lee detenidamente los términos que rigen el uso de nuestra plataforma
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 sm:px-8 py-12 md:py-16">
        <TextFormatter text={termsContent} />
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;
