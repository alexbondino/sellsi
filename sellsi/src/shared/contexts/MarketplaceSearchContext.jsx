import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

/**
 * MarketplaceSearchContext
 * Reemplaza el uso de window.dispatchEvent('marketplaceSearch') por un bus tipado en React.
 * Propaga términos de búsqueda iniciados en la TopBar (mobile search) hacia el MarketplaceBuyer.
 */
const MarketplaceSearchContext = createContext(null);

export const MarketplaceSearchProvider = ({ children }) => {
  const [externalSearchTerm, setExternalSearchTerm] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(0); // Para posibles efectos diferidos

  const updateExternalSearchTerm = useCallback((term) => {
    const cleaned = (term || '').trim();
    setExternalSearchTerm(cleaned);
    setLastUpdatedAt(Date.now());
  }, []);

  const value = useMemo(() => ({
    externalSearchTerm,
    lastUpdatedAt,
    updateExternalSearchTerm,
  }), [externalSearchTerm, lastUpdatedAt, updateExternalSearchTerm]);

  return (
    <MarketplaceSearchContext.Provider value={value}>
      {children}
    </MarketplaceSearchContext.Provider>
  );
};

export const useMarketplaceSearchBus = () => {
  const ctx = useContext(MarketplaceSearchContext);
  return ctx; // Puede ser null si el provider no envuelve el árbol (fallback mantendrá evento global si se usa)
};

export default MarketplaceSearchProvider;
