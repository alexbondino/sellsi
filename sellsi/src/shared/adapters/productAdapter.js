// Adapter de producto: normaliza campos heterogéneos.
// Refactor seguro: no altera lógica de negocio, solo prepara datos.
import { isProductActive } from '../../utils/productActiveStatus';

export function productAdapter(raw) {
  if (!raw) return null;
  return {
    id: raw.id ?? raw.productid ?? raw.productId ?? raw.ID ?? null,
    supplierId: raw.supplier_id ?? raw.supplierId ?? null,
    supplierName:
      raw.proveedor ??
      raw.supplier_name ??
      raw.user_nm ??
      'Proveedor desconocido',
    supplierLogo:
      raw.supplier_logo_url || raw.logo_url || '/LOGO-removebg-preview.webp', // fallback consistente
    supplierDescription:
      raw.descripcion_proveedor || raw.supplier_description || null,
    active: isProductActive(raw),
    // Referencia original para campos adicionales sin normalizar todavía.
    __raw: raw,
  };
}

export function adaptProducts(list) {
  if (!Array.isArray(list)) return [];
  return list.map(productAdapter);
}
