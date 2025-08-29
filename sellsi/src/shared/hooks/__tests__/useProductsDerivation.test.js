import { describe, it, expect } from 'vitest';
import { deriveProducts } from '../useProductsDerivation';

const base = (over = {}) => ({
  id: over.id || Math.random().toString(36).slice(2),
  supplier_id: over.supplier_id ?? 'sup1',
  proveedor: over.proveedor ?? 'Proveedor 1',
  stock: over.stock ?? 10,
  minimum_purchase: over.minimum_purchase ?? 1,
  is_active: over.is_active !== undefined ? over.is_active : true,
  ...over
});

describe('deriveProducts (pure)', () => {
  it('returns empty for non-array input', () => {
    expect(deriveProducts(null, { providerView: true })).toEqual({ items: [], providersCount: 0 });
  });
  it('returns raw list when providerView=false', () => {
    const products = [base({ id: 'a' }), base({ id: 'b' })];
    const res = deriveProducts(products, { providerView: false });
    expect(res.items).toBe(products);
    expect(res.providersCount).toBe(0);
  });
  it('groups active products by supplier when providerView=true', () => {
    const products = [
      base({ id: 'a', supplier_id: 'sup1' }),
      base({ id: 'b', supplier_id: 'sup1' }),
      base({ id: 'c', supplier_id: 'sup2' }),
      base({ id: 'd', supplier_id: 'sup3', is_active: false }), // inactive -> ignore
    ];
    const { items, providersCount } = deriveProducts(products, { providerView: true });
    expect(providersCount).toBe(2);
    const ids = items.map(p => p.provider_id).sort();
    expect(ids).toEqual(['sup1', 'sup2']);
    const sup1 = items.find(p => p.provider_id === 'sup1');
    expect(sup1.product_count).toBe(2);
  });
  it('ignores products without supplier_id in provider view', () => {
    const products = [base({ id: 'a', supplier_id: null }), base({ id: 'b', supplier_id: 'sup1' })];
    const { items, providersCount } = deriveProducts(products, { providerView: true });
    expect(providersCount).toBe(1);
    expect(items[0].provider_id).toBe('sup1');
  });
});
