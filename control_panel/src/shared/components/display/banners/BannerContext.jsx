// Stub de BannerContext para admin panel
// El admin no usa banners, pero algunos componentes importan este hook
import { createContext, useContext } from 'react';

const BannerContext = createContext(null);

// Hook stub que no hace nada
export const useBanner = () => {
  return {
    showBanner: () => {}, // No-op
    hideBanner: () => {},  // No-op
  };
};

// Provider stub
export const BannerProvider = ({ children }) => {
  return children;
};

export default BannerContext;
