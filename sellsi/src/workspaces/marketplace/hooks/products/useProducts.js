import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../../services/supabase';
import { regiones as CHILE_REGIONES } from '../../../../utils/chileData';
import { filterActiveProducts } from '../../../../utils/productActiveStatus';
import { ENV } from '../../../../utils/env';

// Helper para normalizar URLs de thumbnails
// Si es path relativo, construye la URL completa de Supabase Storage
function normalizeThumbnailUrl(url, supplierId, productId) {
  if (!url) return null;
  // Si ya es URL absoluta, retornar tal cual
  if (/^https?:\/\//.test(url)) return url;
  // Si es path relativo, construir URL de storage
  if (supplierId && productId) {
    const filename = url.split('/').pop();
    const correctPath = `${supplierId}/${productId}/${filename}`;
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(correctPath);
    return data?.publicUrl || null;
  }
  return null;
}

// Helper para normalizar objeto thumbnails completo
function normalizeThumbnails(thumbnails, supplierId, productId) {
  if (!thumbnails || typeof thumbnails !== 'object') return null;
  return {
    desktop: normalizeThumbnailUrl(thumbnails.desktop, supplierId, productId),
    tablet: normalizeThumbnailUrl(thumbnails.tablet, supplierId, productId),
    mobile: normalizeThumbnailUrl(thumbnails.mobile, supplierId, productId),
    minithumb: normalizeThumbnailUrl(
      thumbnails.minithumb,
      supplierId,
      productId
    ),
  };
}

// --- Parche mínimo anti redundancia (StrictMode + doble montaje) ---
const PRODUCTS_CACHE_TTL = 60_000; // 60 segundos
let productsCache = { data: null, fetchedAt: 0, inFlight: null };

function isCacheFresh() {
  return (
    Array.isArray(productsCache.data) &&
    Date.now() - productsCache.fetchedAt < PRODUCTS_CACHE_TTL
  );
}

// --- Cache GLOBAL para price summaries (persiste entre navegaciones) ---
const PRICE_SUMMARY_TTL = Number(ENV.VITE_PRICE_SUMMARY_TTL_MS) || 3 * 60_000;
const globalSummariesCache = new Map(); // id -> { data, ts }

// --- Cache GLOBAL para tiers (persiste entre navegaciones) ---
const TIERS_CACHE_TTL = 3 * 60_000;
const globalTiersCache = new Map(); // productId -> { data, ts }

// Variable de entorno para usar mocks en desarrollo
const USE_MOCKS = ENV.VITE_USE_MOCKS;

// ============================================================================
// FUNCIONES DIRECTAS PARA CARGA PARALELA (no dependen del estado del hook)
// ============================================================================

async function fetchPriceSummariesDirect(productIds) {
  const now = Date.now();
  const result = new Map();
  const idsToFetch = [];

  for (const id of productIds || []) {
    const pid = String(id);
    const cached = globalSummariesCache.get(pid);
    if (cached && now - cached.ts < PRICE_SUMMARY_TTL) {
      result.set(pid, cached.data);
    } else {
      idsToFetch.push(pid);
    }
  }

  if (idsToFetch.length === 0) return result;

  const CHUNK_SIZE = 50;
  const chunks = [];
  for (let i = 0; i < idsToFetch.length; i += CHUNK_SIZE) {
    chunks.push(idsToFetch.slice(i, i + CHUNK_SIZE));
  }

  await Promise.all(
    chunks.map(async chunk => {
      try {
        const { data, error } = await supabase
          .from('product_price_summary')
          .select(
            'product_id, min_price, max_price, tiers_count, has_variable_pricing'
          )
          .in('product_id', chunk);

        if (error) throw error;

        for (const row of data || []) {
          const pid = String(row.product_id);
          globalSummariesCache.set(pid, { data: row, ts: now });
          result.set(pid, row);
        }
      } catch (e) {
        console.warn('[fetchPriceSummariesDirect] Error:', e);
      }
    })
  );

  return result;
}

async function fetchAllTiersDirect(productIds) {
  const now = Date.now();
  const result = new Map();
  const idsToFetch = [];

  for (const id of productIds || []) {
    const pid = String(id);
    const cached = globalTiersCache.get(pid);
    if (cached && now - cached.ts < TIERS_CACHE_TTL) {
      result.set(pid, cached.data);
    } else {
      idsToFetch.push(pid);
    }
  }

  if (idsToFetch.length === 0) return result;

  const CHUNK_SIZE = 100;
  const chunks = [];
  for (let i = 0; i < idsToFetch.length; i += CHUNK_SIZE) {
    chunks.push(idsToFetch.slice(i, i + CHUNK_SIZE));
  }

  await Promise.all(
    chunks.map(async chunk => {
      try {
        const { data, error } = await supabase
          .from('product_quantity_ranges')
          .select('*')
          .in('product_id', chunk);

        if (error) throw error;

        const grouped = new Map();
        for (const tier of data || []) {
          const pid = String(tier.product_id);
          if (!grouped.has(pid)) grouped.set(pid, []);
          grouped.get(pid).push(tier);
        }

        for (const pid of chunk) {
          const tiers = grouped.get(pid) || [];
          globalTiersCache.set(pid, { data: tiers, ts: now });
          result.set(pid, tiers);
        }
      } catch (e) {
        console.warn('[fetchAllTiersDirect] Error:', e);
      }
    })
  );

  return result;
}

function enrichProductsWithSummariesAndTiers(
  baseProducts,
  summariesMap,
  tiersMap
) {
  return (baseProducts || []).map(p => {
    const pid = String(p.id);
    const summary = summariesMap?.get(pid);
    const tiers = tiersMap?.get(pid) || [];

    let minPrice = p.minPrice;
    let maxPrice = p.maxPrice;
    let tiersCount = 0;
    let hasVariable = false;

    if (summary) {
      minPrice =
        summary.min_price != null ? Number(summary.min_price) : minPrice;
      maxPrice =
        summary.max_price != null ? Number(summary.max_price) : maxPrice;
      tiersCount =
        summary.tiers_count != null ? Number(summary.tiers_count) : 0;
      hasVariable = !!summary.has_variable_pricing;
    }

    if (tiers.length > 0) {
      const precios = tiers.map(t => Number(t.price) || 0).filter(n => n > 0);
      if (precios.length > 0) {
        minPrice = Math.min(...precios);
        maxPrice = Math.max(...precios);
      }
    }

    return {
      ...p,
      minPrice,
      maxPrice,
      tiers_count: tiersCount,
      has_variable_pricing: hasVariable,
      priceTiers: tiers,
      tiersStatus: 'loaded',
    };
  });
}

/**
 * Hook para obtener productos del marketplace, usando mocks o backend según flag.
 */
export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);
  const observerRef = useRef(null);
  const mountedRef = useRef(true);

  const refreshProducts = useCallback(async controller => {
    if (controller.signal.aborted) return;
    if (isCacheFresh()) return;

    // Dedupe de fetch en vuelo
    if (productsCache.inFlight) {
      const cached = await productsCache.inFlight;
      if (mountedRef.current && !controller.signal.aborted) {
        setProducts(cached);
        setLoading(false);
      }
      return;
    }

    productsCache.inFlight = (async () => {
      // 1) Intentar obtener productos con ranking diario desde la vista marketplace_products_daily
      // La vista ya filtra is_active=true y ordena por daily_rank ASC
      let data = null;
      let pErr = null;

      // Primero intentar con la vista de ranking diario
      const viewResult = await supabase
        .from('marketplace_products_daily')
        .select(
          'productid,supplier_id,productnm,price,category,product_type,productqty,minimum_purchase,negotiable,is_active,free_shipping_enabled,free_shipping_min_quantity,daily_rank,product_images(image_url,thumbnail_url,thumbnails,image_order),product_delivery_regions(region)'
        );

      // Si la vista funciona y tiene datos, usarla
      if (!viewResult.error && viewResult.data && viewResult.data.length > 0) {
        data = viewResult.data;
      } else {
        // Fallback: Si la vista está vacía o falla, usar tabla products directamente
        // Esto ocurre si no se ha ejecutado refresh_products_daily_rank() hoy
        console.warn(
          '[useProducts] Vista marketplace_products_daily vacía o con error, usando fallback a products'
        );
        const fallbackResult = await supabase
          .from('products')
          .select(
            'productid,supplier_id,productnm,price,category,product_type,productqty,minimum_purchase,negotiable,is_active,free_shipping_enabled,free_shipping_min_quantity,product_images(image_url,thumbnail_url,thumbnails,image_order),product_delivery_regions(region)'
          )
          .eq('is_active', true);

        if (fallbackResult.error) {
          pErr = fallbackResult.error;
        } else {
          data = fallbackResult.data;
        }
      }

      if (pErr) throw pErr;

      // 2) Suppliers verificados
      let usersMap = {};
      const supplierIds = [
        ...new Set((data || []).map(p => p.supplier_id).filter(Boolean)),
      ];
      if (supplierIds.length > 0) {
        const { data: usersData, error: uErr } = await supabase
          .from('users')
          .select('user_id, user_nm, logo_url, descripcion_proveedor, verified')
          .in(
            'user_id',
            supplierIds.map(id => String(id))
          )
          .eq('verified', true)
          .eq('main_supplier', true);

        if (!uErr && usersData) {
          usersMap = Object.fromEntries(
            usersData.map(u => [
              u.user_id,
              {
                name: u.user_nm,
                logo_url: u.logo_url,
                descripcion_proveedor: u.descripcion_proveedor,
                verified: u.verified,
              },
            ])
          );
        }
      }

      const normalizeRegionValue = raw => {
        if (!raw) return null;
        const key = String(raw).trim().toLowerCase();
        const match = (CHILE_REGIONES || []).find(
          r =>
            r?.value === key ||
            String(r?.label || '')
              .trim()
              .toLowerCase() === key
        );
        return match ? match.value : key;
      };

      // 3) Map + filter proveedores verificados
      const mapped = (data || [])
        .filter(p => p.supplier_id && usersMap[p.supplier_id])
        .map(p => {
          const basePrice = p.price || 0;
          const shippingRegions = Array.isArray(p.product_delivery_regions)
            ? p.product_delivery_regions
                .map(r => normalizeRegionValue(r?.region))
                .filter(Boolean)
            : [];

          // Extraer imágenes del producto (ordenadas por image_order si existe)
          const productImages = (p.product_images || []).sort(
            (a, b) => (a.image_order ?? 999) - (b.image_order ?? 999)
          );
          const firstImage = productImages[0] || {};

          // Normalizar URLs de imágenes (convertir paths relativos a URLs completas)
          const imagen =
            normalizeThumbnailUrl(
              firstImage.image_url,
              p.supplier_id,
              p.productid
            ) ||
            firstImage.image_url ||
            null;
          const thumbnail_url =
            normalizeThumbnailUrl(
              firstImage.thumbnail_url,
              p.supplier_id,
              p.productid
            ) ||
            firstImage.thumbnail_url ||
            null;
          const thumbnails = normalizeThumbnails(
            firstImage.thumbnails,
            p.supplier_id,
            p.productid
          );

          return {
            id: p.productid,
            productid: p.productid,
            supplier_id: p.supplier_id,
            nombre: p.productnm,
            proveedor:
              usersMap[p.supplier_id]?.name || 'Proveedor no encontrado',
            user_nm: usersMap[p.supplier_id]?.name,
            supplier_logo_url: usersMap[p.supplier_id]?.logo_url,
            logo_url: usersMap[p.supplier_id]?.logo_url,
            descripcion_proveedor:
              usersMap[p.supplier_id]?.descripcion_proveedor,
            verified: usersMap[p.supplier_id]?.verified || false,
            proveedorVerificado: usersMap[p.supplier_id]?.verified || false,
            imagen,
            thumbnails,
            thumbnail_url,
            precio: basePrice,
            precioOriginal: p.price || null,
            descuento: 0,
            categoria: p.category,
            tipo: p.product_type ?? 'normal',
            tipoVenta: 'directa',
            rating: 0,
            ventas: 0,
            stock: p.productqty,
            compraMinima: p.minimum_purchase,
            minimum_purchase: p.minimum_purchase,
            negociable: p.negotiable,
            is_active: p.is_active,
            free_shipping_enabled: p.free_shipping_enabled || false,
            free_shipping_min_quantity: p.free_shipping_min_quantity || null,
            freeShippingEnabled: p.free_shipping_enabled || false,
            freeShippingMinQuantity: p.free_shipping_min_quantity || null,
            priceTiers: [],
            minPrice: basePrice,
            maxPrice: basePrice,
            tiersStatus: basePrice > 0 ? 'loaded' : 'idle',
            shippingRegions,
            // Ranking diario para ordenamiento en marketplace
            daily_rank: p.daily_rank ?? null,
          };
        });

      const active = filterActiveProducts(mapped);
      return active;
    })();

    const result = await productsCache.inFlight;
    productsCache.inFlight = null;
    productsCache.data = result;
    productsCache.fetchedAt = Date.now();

    // Enriquecer (summaries + tiers) antes de setear (como querías)
    const productIds = result.map(p => p.id);
    const [summaries, tiers] = await Promise.all([
      fetchPriceSummariesDirect(productIds),
      fetchAllTiersDirect(productIds),
    ]);
    const enriched = enrichProductsWithSummariesAndTiers(
      result,
      summaries,
      tiers
    );

    productsCache.data = enriched;
    productsCache.fetchedAt = Date.now();

    if (mountedRef.current && !controller.signal.aborted) {
      setProducts(enriched);
      setLoading(false);
    }
  }, []);

  // Fetch inicial
  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    setError(null);

    // MOCK path
    if (USE_MOCKS) {
      const base = (PRODUCTOS || []).map(p => ({
        ...p,
        priceTiers: p.priceTiers || [],
        minPrice: p.minPrice ?? p.precio ?? p.price ?? 0,
        maxPrice: p.maxPrice ?? p.precio ?? p.price ?? 0,
        imagen: undefined,
        thumbnail_url: undefined,
        thumbnails: undefined,
      }));
      const filtered = filterActiveProducts(base);
      setProducts(filtered);
      setLoading(false);
      return () => {
        mountedRef.current = false;
      };
    }

    const controller = new AbortController();
    abortRef.current = controller;

    // Si hay cache fresh, mostrar y enriquecer en background
    if (isCacheFresh()) {
      const cachedProducts = productsCache.data || [];
      setProducts(cachedProducts);
      setLoading(false);

      const ids = cachedProducts.map(p => p.id);

      Promise.all([fetchPriceSummariesDirect(ids), fetchAllTiersDirect(ids)])
        .then(([summaries, tiers]) => {
          if (!mountedRef.current || controller.signal.aborted) return;
          const enriched = enrichProductsWithSummariesAndTiers(
            cachedProducts,
            summaries,
            tiers
          );
          productsCache.data = enriched;
          productsCache.fetchedAt = Date.now();
          if (mountedRef.current && !controller.signal.aborted) {
            setProducts(enriched);
          }
        })
        .catch(e => {
          console.warn('[useProducts] Error enriqueciendo cache:', e);
        });
    } else {
      refreshProducts(controller).catch(e => {
        productsCache.inFlight = null;
        if (!controller.signal.aborted && mountedRef.current) {
          setError(e?.message || 'Error cargando productos');
          setLoading(false);
        }
      });
    }

    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [refreshProducts]);

  // --- Lazy tiers (mantengo tu observer, pero tu fetchTiersBatch completo no lo pegaste bien aquí)
  // Si lo necesitas, lo reinsertamos limpio después.

  return {
    products,
    loading,
    error,
    getPriceTiers: () => [],
    registerProductNode: () => {},
  };
}

// Mock products data
const PRODUCTOS = [
  // ... mock data
];
