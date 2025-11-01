// Hook: useProductsDerivation
// Responsabilidad: derivar items para vista productos o vista proveedores.
// Fase 2 del refactor. NO modifica comportamiento observable.
// - Normaliza productos con adapter
// - Cuando providerView=true agrupa productos activos por proveedor
// - Devuelve shape compatible con ProductCard existente
// - Mantiene shape original (raw) en vista productos para minimizar riesgo

import React from 'react';
import { adaptProducts } from '../adapters/productAdapter';
import { isProductActive } from '../../utils/productActiveStatus';

/**
 * @param {Array} productosOrdenados lista original (raw) de productos
 * @param {{ providerView?: boolean }} options
 * @returns {{ items: Array, providersCount: number }}
 */
export function useProductsDerivation(
  productosOrdenados,
  { providerView = false } = {}
) {
  return React.useMemo(() => {
    if (!Array.isArray(productosOrdenados) || productosOrdenados.length === 0) {
      return { items: [], providersCount: 0 };
    }
    // Adaptamos para contar/filtrar; mantenemos raw para buyer view
    const adapted = adaptProducts(productosOrdenados);
    if (!providerView) {
      return { items: productosOrdenados, providersCount: 0 };
    }
    const active = adapted.filter(p => p.active && p.supplierId);
    if (active.length === 0) return { items: [], providersCount: 0 };
    const providers = new Map();
    active.forEach(p => {
      if (!providers.has(p.supplierId)) {
        providers.set(p.supplierId, {
          // Mantener compatibilidad con ProductCard provider
          id: `provider:${p.supplierId}`,
          provider_id: p.supplierId,
          supplier_id: p.supplierId,
          proveedor: p.supplierName,
          user_nm: p.supplierName,
          supplier_logo_url: p.supplierLogo,
          descripcion_proveedor: p.supplierDescription,
          product_count: 1,
          main_supplier: true,
        });
      } else {
        providers.get(p.supplierId).product_count += 1;
      }
    });
    return {
      items: Array.from(providers.values()),
      providersCount: providers.size,
    };
  }, [productosOrdenados, providerView]);
}

/**
 * Función pura (sin React) para pruebas unitarias directa si se requiere.
 */
export function deriveProducts(
  productosOrdenados,
  { providerView = false } = {}
) {
  if (!Array.isArray(productosOrdenados) || productosOrdenados.length === 0) {
    return { items: [], providersCount: 0 };
  }
  if (!providerView) return { items: productosOrdenados, providersCount: 0 };
  const adapted = adaptProducts(productosOrdenados);
  const active = adapted.filter(p => p.active && p.supplierId);
  const providers = new Map();
  active.forEach(p => {
    if (!providers.has(p.supplierId)) {
      providers.set(p.supplierId, {
        id: `provider:${p.supplierId}`,
        provider_id: p.supplierId,
        supplier_id: p.supplierId,
        proveedor: p.supplierName,
        user_nm: p.supplierName,
        supplier_logo_url: p.supplierLogo,
        descripcion_proveedor: p.supplierDescription,
        product_count: 1,
        main_supplier: true,
      });
    } else {
      providers.get(p.supplierId).product_count += 1;
    }
  });
  return {
    items: Array.from(providers.values()),
    providersCount: providers.size,
  };
}
