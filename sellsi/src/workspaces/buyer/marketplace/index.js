// ✅ DEPRECADO: MarketplaceBuyer ahora usa el componente unificado Marketplace
// Re-exportar Marketplace con prop hasSideBar para mantener compatibilidad
import React from 'react';
import { Marketplace } from '../../marketplace';

// Wrapper que pasa hasSideBar={true} por defecto
export const MarketplaceBuyer = props => (
  <Marketplace {...props} hasSideBar={true} />
);
