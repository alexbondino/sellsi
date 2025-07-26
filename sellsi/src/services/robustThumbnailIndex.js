/**
 * ÍNDICE DEL SISTEMA ROBUSTO DE THUMBNAILS
 * 
 * Exporta todos los componentes, hooks y servicios del sistema centralizado
 */

// Servicios principales
export { default as thumbnailCacheService } from './thumbnailCacheService';

// Hooks robustos
export {
  useRobustThumbnail,
  useRobustMinithumb,
  useAllThumbnails,
  // Hooks para compatibilidad con código existente
  useResponsiveThumbnail,
  useMinithumb
} from '../hooks/useRobustThumbnail';

// Componentes universales
export {
  default as UniversalProductImage,
  MinithumbImage,
  ProductCardImage,
  CartItemImage,
  CheckoutSummaryImage,
  AdminTableImage
} from '../components/UniversalProductImage';
