/**
 * ============================================================================
 * PRODUCT PRICE TIERS - SHARED IMPLEMENTATION
 * ============================================================================
 *
 * Canonical implementation moved from domains/supplier/pricing.
 * Exposes a zustand store hook that manages validation, persistence
 * and queries for product quantity ranges (price tiers).
 */

import { create } from 'zustand';
import { supabase } from '../../../services/supabase';

const useProductPriceTiers = create((set, get) => ({
  // ============================================================================
  // STATE
  // ============================================================================
  loading: false,
  error: null,
  processingTiers: {}, // { productId: boolean }

  // ============================================================================
  // OPERATIONS
  // ============================================================================
  processPriceTiers: async (productId, priceTiers) => {
    set(state => ({
      processingTiers: { ...state.processingTiers, [productId]: true },
      error: null,
    }));

    try {
      const { error: deleteError } = await supabase
        .from('product_quantity_ranges')
        .delete()
        .eq('product_id', productId);

      if (deleteError) {
      }

      if (!priceTiers || priceTiers.length === 0) {
        set(state => ({
          processingTiers: { ...state.processingTiers, [productId]: false },
        }));
        return { success: true, data: [] };
      }

      const validationResult = get().validatePriceTiers(priceTiers);

      if (!validationResult.isValid) {
        throw new Error(
          `Tramos de precio inválidos: ${validationResult.errors.join(', ')}`
        );
      }

      const tiersToInsert = validationResult.data.map((t, index, array) => ({
        product_id: productId,
        min_quantity: Number(t.min),
        max_quantity:
          index === array.length - 1 ? null : t.max ? Number(t.max) : null,
        price: Number(t.precio),
      }));

      if (tiersToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('product_quantity_ranges')
          .insert(tiersToInsert);

        if (insertError) {
          throw insertError;
        }
      }

      set(state => ({
        processingTiers: { ...state.processingTiers, [productId]: false },
      }));

      return { success: true, data: validationResult.data };
    } catch (error) {
      set(state => ({
        processingTiers: { ...state.processingTiers, [productId]: false },
        error: `Error procesando tramos de precio: ${error.message}`,
      }));
      return { success: false, error: error.message };
    }
  },

  validatePriceTiers: priceTiers => {
    const errors = [];
    const validatedTiers = [];

    for (let i = 0; i < priceTiers.length; i++) {
      const tier = priceTiers[i];
      const minQuantity = tier.min_quantity || tier.cantidad || tier.min;
      const price = tier.price || tier.precio;
      const maxQuantity = tier.max_quantity || tier.maxCantidad || tier.max;

      if (
        !minQuantity ||
        isNaN(Number(minQuantity)) ||
        Number(minQuantity) <= 0
      ) {
        errors.push(
          `Tramo ${i + 1}: Cantidad mínima debe ser un número mayor a 0`
        );
        continue;
      }

      if (!price || isNaN(Number(price)) || Number(price) <= 0) {
        errors.push(`Tramo ${i + 1}: Precio debe ser un número mayor a 0`);
        continue;
      }

      if (
        maxQuantity &&
        (isNaN(Number(maxQuantity)) ||
          Number(maxQuantity) <= Number(minQuantity))
      ) {
        errors.push(
          `Tramo ${i + 1}: Cantidad máxima debe ser mayor a la cantidad mínima`
        );
        continue;
      }

      const cantidad = Number(minQuantity);
      const precio = Number(price);
      const maxCantidad = maxQuantity ? Number(maxQuantity) : null;

      if (cantidad > 10000000) {
        errors.push(
          `Tramo ${i + 1}: Cantidad mínima muy alta (máximo 10,000,000)`
        );
      }

      if (precio > 10000000) {
        errors.push(`Tramo ${i + 1}: Precio muy alto (máximo $10,000,000)`);
      }

      if (maxCantidad && maxCantidad > 10000000) {
        errors.push(
          `Tramo ${i + 1}: Cantidad máxima muy alta (máximo 10,000,000)`
        );
      }

      validatedTiers.push({
        min: cantidad,
        precio: precio,
        max: maxCantidad,
        cantidad: cantidad,
        maxCantidad: maxCantidad,
        descuento: tier.descuento || null,
        descripcion: tier.descripcion || null,
      });
    }

    const sortedTiers = [...validatedTiers].sort((a, b) => a.min - b.min);
    for (let i = 1; i < sortedTiers.length; i++) {
      const prevTier = sortedTiers[i - 1];
      const currentTier = sortedTiers[i];

      if (prevTier.max && currentTier.min <= prevTier.max) {
        errors.push(
          `Solapamiento de rangos: Tramo ${i} se solapa con el anterior`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: sortedTiers,
    };
  },

  calculatePriceForQuantity: async (productId, quantity) => {
    try {
      const fingerprint = obj => {
        try {
          const normalized =
            typeof obj === 'string'
              ? obj
              : JSON.stringify(obj, Object.keys(obj || {}).sort());
          let hash = 5381;
          for (let i = 0; i < normalized.length; i++) {
            hash = (hash << 5) + hash + normalized.charCodeAt(i);
            hash = hash & hash;
          }
          return `fp_${Math.abs(hash)}`;
        } catch (e) {
          return `fp_${String(obj)}`;
        }
      };

      const inFlightMap =
        typeof window !== 'undefined'
          ? (window.__inFlightSupabaseQueries =
              window.__inFlightSupabaseQueries || new Map())
          : new Map();
      const key = fingerprint({ type: 'product_quantity_ranges', productId });
      let tiersRes;
      if (inFlightMap.has(key)) {
        tiersRes = await inFlightMap.get(key);
      } else {
        const p = (async () => {
          return await supabase
            .from('product_quantity_ranges')
            .select('*')
            .eq('product_id', productId)
            .order('min_quantity', { ascending: true });
        })();
        inFlightMap.set(key, p);
        try {
          tiersRes = await p;
        } finally {
          inFlightMap.delete(key);
        }
      }
      const { data: tiers, error } = tiersRes || { data: [], error: null };

      if (error) throw error;

      if (!tiers || tiers.length === 0) {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('price')
          .eq('productid', productId)
          .single();

        if (productError) throw productError;

        return {
          price: product.price,
          tierUsed: null,
          isBasePriceApplied: true,
        };
      }

      let applicableTier = null;

      for (const tier of tiers) {
        if (quantity >= tier.min_quantity) {
          if (!tier.max_quantity || quantity <= tier.max_quantity) {
            applicableTier = tier;
            break;
          }
        }
      }

      if (!applicableTier) {
        applicableTier = tiers[tiers.length - 1];
      }

      return {
        price: applicableTier.price,
        tierUsed: applicableTier,
        totalAmount: applicableTier.price * quantity,
        savings: null,
      };
    } catch (error) {
      set({ error: `Error calculando precio: ${error.message}` });
      return { success: false, error: error.message };
    }
  },

  getProductTiers: async productId => {
    try {
      const fingerprint = obj => {
        try {
          const normalized =
            typeof obj === 'string'
              ? obj
              : JSON.stringify(obj, Object.keys(obj || {}).sort());
          let hash = 5381;
          for (let i = 0; i < normalized.length; i++) {
            hash = (hash << 5) + hash + normalized.charCodeAt(i);
            hash = hash & hash;
          }
          return `fp_${Math.abs(hash)}`;
        } catch (e) {
          return `fp_${String(obj)}`;
        }
      };
      const inFlightMap =
        typeof window !== 'undefined'
          ? (window.__inFlightSupabaseQueries =
              window.__inFlightSupabaseQueries || new Map())
          : new Map();
      const key = fingerprint({ type: 'product_quantity_ranges', productId });
      let tiersRes;
      if (inFlightMap.has(key)) {
        tiersRes = await inFlightMap.get(key);
      } else {
        const p = (async () => {
          return await supabase
            .from('product_quantity_ranges')
            .select('*')
            .eq('product_id', productId)
            .order('min_quantity', { ascending: true });
        })();
        inFlightMap.set(key, p);
        try {
          tiersRes = await p;
        } finally {
          inFlightMap.delete(key);
        }
      }
      const { data: tiers, error } = tiersRes || { data: [], error: null };

      if (error) throw error;

      return { success: true, data: tiers || [] };
    } catch (error) {
      set({ error: `Error obteniendo tramos: ${error.message}` });
      return { success: false, error: error.message };
    }
  },

  generateAutomaticTiers: (basePrice, discountRules = []) => {
    const defaultRules = [
      { minQuantity: 1, maxQuantity: 9, discountPercent: 0 },
      { minQuantity: 10, maxQuantity: 49, discountPercent: 5 },
      { minQuantity: 50, maxQuantity: 99, discountPercent: 10 },
      { minQuantity: 100, maxQuantity: null, discountPercent: 15 },
    ];

    const rules = discountRules.length > 0 ? discountRules : defaultRules;

    return rules.map(rule => ({
      cantidad: rule.minQuantity,
      maxCantidad: rule.maxQuantity,
      precio: basePrice * (1 - rule.discountPercent / 100),
      descuento: rule.discountPercent,
      descripcion: `${rule.discountPercent}% descuento por volumen`,
    }));
  },

  validatePriceCoherence: priceTiers => {
    const errors = [];
    const sortedTiers = [...priceTiers].sort((a, b) => a.cantidad - b.cantidad);

    for (let i = 1; i < sortedTiers.length; i++) {
      const prevTier = sortedTiers[i - 1];
      const currentTier = sortedTiers[i];

      if (currentTier.precio >= prevTier.precio) {
        errors.push(
          `Inconsistencia de precios: Tramo ${
            i + 1
          } debe tener menor precio que el anterior para incentivar compras por volumen`
        );
      }
    }

    return {
      isCoherent: errors.length === 0,
      errors,
      suggestions:
        errors.length > 0
          ? ['Considera aplicar descuentos progresivos por volumen']
          : [],
    };
  },

  clearError: () => set({ error: null }),

  isProcessingTiers: productId => {
    const state = get();
    return state.processingTiers[productId] || false;
  },

  formatPrice: (price, currency = 'CLP') => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  },

  calculateSavings: (basePrice, tierPrice, quantity) => {
    const baseCost = basePrice * quantity;
    const tierCost = tierPrice * quantity;
    const savings = baseCost - tierCost;
    const savingsPercent = (savings / baseCost) * 100;

    return {
      absoluteSavings: savings,
      percentSavings: savingsPercent,
      baseCost,
      tierCost,
    };
  },

  /**
   * Reset del store
   */
  reset: () => {
    set({
      loading: false,
      error: null,
      processingTiers: {},
    });
  },
}));

export default useProductPriceTiers;
