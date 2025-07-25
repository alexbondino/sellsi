/**
 * SISTEMA DE THUMBNAILS - PUNTO DE ENTRADA PRINCIPAL
 * 
 * Exporta todos los componentes, hooks y servicios del sistema de thumbnails.
 * Este es el único archivo que necesitas importar para usar el sistema completo.
 */

// ============================================================================
// SERVICIOS PRINCIPALES
// ============================================================================
export { default as thumbnailSystem } from './services/thumbnailSystem';
export { default as thumbnailCacheService } from './services/thumbnailCacheService';
export { default as thumbnailInvalidationService } from './services/thumbnailInvalidationService';

// ============================================================================
// HOOKS ROBUSTOS
// ============================================================================
export {
  useRobustThumbnail,
  useRobustMinithumb,
  useAllThumbnails,
  // Hooks de compatibilidad
  useResponsiveThumbnail,
  useMinithumb
} from './hooks/useRobustThumbnail';

export { useThumbnailInvalidation } from './services/thumbnailInvalidationService';

// ============================================================================
// COMPONENTES UNIVERSALES
// ============================================================================
export {
  default as UniversalProductImage,
  MinithumbImage,
  ProductCardImage,
  CartItemImage,
  CheckoutSummaryImage,
  AdminTableImage
} from './components/UniversalProductImage';

// ============================================================================
// INSTRUCCIONES DE USO
// ============================================================================

/**
 * CÓMO USAR EL SISTEMA DE THUMBNAILS:
 * 
 * 1. INICIALIZACIÓN (en main.jsx o App.jsx):
 * ```jsx
 * import { thumbnailSystem } from './thumbnailSystem';
 * 
 * // Al inicio de la aplicación
 * thumbnailSystem.init();
 * ```
 * 
 * 2. COMPONENTES (reemplazar imágenes existentes):
 * ```jsx
 * import { ProductCardImage, CartItemImage, MinithumbImage } from './thumbnailSystem';
 * 
 * // En lugar de <LazyImage> o <Avatar>:
 * <ProductCardImage product={product} type="buyer" />
 * <CartItemImage product={item} />
 * <MinithumbImage product={product} width={40} height={40} />
 * ```
 * 
 * 3. HOOKS (para casos personalizados):
 * ```jsx
 * import { useRobustThumbnail, useRobustMinithumb } from './thumbnailSystem';
 * 
 * const MyComponent = ({ product }) => {
 *   const { url, isLoading, error, refetch } = useRobustThumbnail(product);
 *   const minithumbUrl = useRobustMinithumb(product);
 *   
 *   // Usar url, manejar loading/error
 * };
 * ```
 * 
 * 4. INVALIDACIÓN MANUAL (en operaciones CRUD):
 * ```jsx
 * import { thumbnailInvalidationService } from './thumbnailSystem';
 * 
 * // Después de eliminar una imagen
 * thumbnailInvalidationService.manualInvalidation.onImageDeleted(productId);
 * 
 * // Después de subir una imagen
 * thumbnailInvalidationService.manualInvalidation.onImageUploaded(productId);
 * ```
 * 
 * 5. COMANDOS DE DESARROLLO (en consola):
 * ```javascript
 * // Limpiar todo el cache
 * window.thumbnailSystem.clearCache();
 * 
 * // Ver estadísticas
 * window.thumbnailSystem.getStats();
 * 
 * // Invalidar producto específico
 * window.thumbnailSystem.invalidateProduct('product-id');
 * ```
 */

// ============================================================================
// CONFIGURACIÓN RECOMENDADA
// ============================================================================

/**
 * ARCHIVOS A ACTUALIZAR:
 * 
 * 1. main.jsx o App.jsx:
 * - Importar y llamar thumbnailSystem.init()
 * 
 * 2. Componentes existentes:
 * - ProductCard.jsx → usar ProductCardImage
 * - CartItem.jsx → usar CartItemImage
 * - CheckoutSummary.jsx → usar CheckoutSummaryImage
 * - BuyerOrders.jsx → usar MinithumbImage
 * - ProductMarketplaceTable.jsx → usar AdminTableImage
 * 
 * 3. Hooks existentes:
 * - Reemplazar useResponsiveThumbnail → useRobustThumbnail
 * - Reemplazar useMinithumb → useRobustMinithumb
 * 
 * 4. Operaciones CRUD:
 * - Agregar invalidaciones manuales donde sea necesario
 * 
 * 5. Limpieza:
 * - Remover hooks y servicios antiguos una vez migrado todo
 */
