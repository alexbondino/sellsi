/**
 * ============================================================================
 * SHARED MARKETPLACE SECTIONS - BARREL EXPORT
 * ============================================================================
 * 
 * Re-exports de secciones de marketplace para uso compartido.
 * Nota: Importa desde sellsi principal (proyecto hermano)
 */

// Re-export sections from sellsi/src/workspaces/marketplace
// Ruta relativa: desde control_panel/src/shared/components/marketplace/sections
// hacia sellsi/src/workspaces/marketplace
export { 
  SearchSection, 
  ProductsSection, 
  FilterSection 
} from '../../../../../../sellsi/src/workspaces/marketplace';
