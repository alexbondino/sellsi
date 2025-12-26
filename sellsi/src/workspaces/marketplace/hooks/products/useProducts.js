import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../../services/supabase';
import { regiones as CHILE_REGIONES } from '../../../../utils/chileData';
import { filterActiveProducts } from '../../../../utils/productActiveStatus';
import { ENV } from '../../../../utils/env';
import { getRecommendations } from '../../../../services/recommenderClient';

// --- Parche mínimo anti redundancia (StrictMode + doble montaje) ---
// Cache in-memory muy simple con TTL + dedupe de petición en vuelo.
// Mantener extremadamente ligero para futura migración a un service dedicado.
const PRODUCTS_CACHE_TTL = 60_000; // 60 segundos
let productsCache = { data: null, fetchedAt: 0, inFlight: null };

function isCacheFresh() {
  return (
    productsCache.data &&
    Date.now() - productsCache.fetchedAt < PRODUCTS_CACHE_TTL
  );
}

// --- Cache GLOBAL para price summaries (persiste entre navegaciones) ---
const PRICE_SUMMARY_TTL = Number(ENV.VITE_PRICE_SUMMARY_TTL_MS) || 3 * 60_000; // 3 minutes default
const globalSummariesCache = new Map(); // id -> { data: summaryObj, ts }
const globalSummariesInFlight = new Map(); // chunkKey -> promise

// --- Cache GLOBAL para tiers (persiste entre navegaciones) ---
const TIERS_CACHE_TTL = 3 * 60_000; // 3 minutes
const globalTiersCache = new Map(); // productId -> { data: tiersArray, ts }
const globalTiersPending = new Set(); // productIds en vuelo

// Variable de entorno para usar mocks en desarrollo
const USE_MOCKS = ENV.VITE_USE_MOCKS;

// ============================================================================
// FUNCIONES DIRECTAS PARA CARGA PARALELA (no dependen del estado del hook)
// ============================================================================

/**
 * Obtiene price summaries directamente sin actualizar estado
 * @param {string[]} productIds - IDs de productos
 * @returns {Promise<Map<string, object>>} - Map de id -> summary
 */
async function fetchPriceSummariesDirect(productIds) {
  const now = Date.now();
  const result = new Map();
  const idsToFetch = [];

  // Verificar cache primero
  for (const id of productIds) {
    const pid = String(id);
    const cached = globalSummariesCache.get(pid);
    if (cached && now - cached.ts < PRICE_SUMMARY_TTL) {
      result.set(pid, cached.data);
    } else {
      idsToFetch.push(pid);
    }
  }

  if (idsToFetch.length === 0) {
    return result;
  }

  // Fetch en chunks de 50
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

/**
 * Obtiene TODOS los price tiers directamente sin actualizar estado
 * @param {string[]} productIds - IDs de productos
 * @returns {Promise<Map<string, array>>} - Map de id -> tiers[]
 */
async function fetchAllTiersDirect(productIds) {
  const now = Date.now();
  const result = new Map();
  const idsToFetch = [];

  // Verificar cache primero
  for (const id of productIds) {
    const pid = String(id);
    const cached = globalTiersCache.get(pid);
    if (cached && now - cached.ts < TIERS_CACHE_TTL) {
      result.set(pid, cached.data);
    } else {
      idsToFetch.push(pid);
    }
  }

  if (idsToFetch.length === 0) {
    return result;
  }

  // Fetch todos los tiers de una vez (o en chunks si son muchos)
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

        // Agrupar por product_id
        const grouped = new Map();
        for (const tier of data || []) {
          const pid = String(tier.product_id);
          if (!grouped.has(pid)) grouped.set(pid, []);
          grouped.get(pid).push(tier);
        }

        // Guardar en cache y resultado
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

/**
 * Hook para obtener productos del marketplace, usando mocks o backend según flag.
 */
export function useProducts() {
  const [products, setProducts] = useState([]);

  // Log de productos cada vez que cambian
  useEffect(() => {
    if (products && Array.isArray(products)) {
      console.log(`🛒 Productos en frontend: ${products.length}`);
      products.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.nombre || p.name || p.productnm || p.id}`);
      });
    }
  }, [products]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Refs locales solo para control de montaje y métricas
  const abortRef = useRef(null);
  const observerRef = useRef(null);
  const mountedRef = useRef(true);
  // Instrumentation for debugging network counts (temporary)
  const metricsRef = useRef({ priceSummaryCalls: 0, tiersBatchCalls: 0 });

  // --- Fetch inicial (sin tiers) ---
  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    setError(null);

    // MOCK path sin cambios
    if (USE_MOCKS) {
      const base = PRODUCTOS.map(p => ({
        ...p,
        priceTiers: p.priceTiers || [],
        minPrice: p.minPrice ?? p.precio ?? p.price ?? 0,
        maxPrice: p.maxPrice ?? p.precio ?? p.price ?? 0,
      }));
      setProducts(filterActiveProducts(base));
      setLoading(false);
      return () => {
        mountedRef.current = false;
      };
    }

    const controller = new AbortController();
    abortRef.current = controller;
    performance.mark?.('products_fetch_start');

    // Si cache fresca, usar directamente pero enriquecer con tiers cacheados
    if (isCacheFresh()) {
      // ✅ FIX CRÍTICO: Cargar price summaries/tiers en paralelo INCLUSO cuando se usa cache
      // Esto evita el bug de "Cargando precios..." infinito para productos con basePrice = 0
      const cachedProducts = productsCache.data;
      const productIds = cachedProducts.map(p => p.id);

      // Lanzar carga paralela en background
      Promise.all([
        fetchPriceSummariesDirect(productIds),
        fetchAllTiersDirect(productIds),
      ])
        .then(([summariesResult, tiersResult]) => {
          if (!mountedRef.current) return;

          const enrichedProducts = cachedProducts.map(p => {
            const pid = String(p.id);
            const summary = summariesResult?.get(pid);
            const tiers = tiersResult?.get(pid) || [];

            let minPrice = p.minPrice;
            let maxPrice = p.maxPrice;
            let tiersCount = 0;
            let hasVariable = false;

            if (summary) {
              minPrice =
                summary.min_price != null
                  ? Number(summary.min_price)
                  : minPrice;
              maxPrice =
                summary.max_price != null
                  ? Number(summary.max_price)
                  : maxPrice;
              tiersCount =
                summary.tiers_count != null ? Number(summary.tiers_count) : 0;
              hasVariable = !!summary.has_variable_pricing;
            }

            if (tiers.length > 0) {
              const precios = tiers
                .map(t => Number(t.price) || 0)
                .filter(n => n > 0);
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

          // ✅ RANDOMIZACIÓN ML: Aplicar orden aleatorio usando el modelo de recomendaciones
          (async () => {
            try {
              const recommendationsData = await getRecommendations(
                Math.min(enrichedProducts.length, 50) // Limitar a 50 para no sobrecargar
              );

              if (recommendationsData && recommendationsData.products) {
                // Crear un mapa de ID -> score del modelo ML
                const scoreMap = new Map(
                  recommendationsData.products.map(rec => [
                    rec.id,
                    rec.recommendation_score,
                  ])
                );

                // Ordenar los productos según los scores del modelo
                const finalProducts = [...enrichedProducts].sort((a, b) => {
                  const scoreA = scoreMap.get(a.id) ?? 0;
                  const scoreB = scoreMap.get(b.id) ?? 0;
                  return scoreB - scoreA; // Mayor score primero
                });

                if (mountedRef.current) {
                  setProducts(finalProducts);
                  productsCache.data = finalProducts;
                }
              } else {
                setProducts(enrichedProducts);
                productsCache.data = enrichedProducts;
              }
            } catch (mlError) {
              // Si el backend ML falla, continuar con el orden original
              console.warn(
                '[useProducts] ML Backend no disponible en cache, usando orden original'
              );
              setProducts(enrichedProducts);
              productsCache.data = enrichedProducts;
            }
          })();
        })
        .catch(e => {
          console.warn('[useProducts] Error enriqueciendo cache:', e);
          // Si falla, usar cache como está
          setProducts(cachedProducts);
        });

      // Mientras tanto, mostrar cache actual
      setProducts(cachedProducts);
      setLoading(false);
    } else {
      refreshProducts(controller, setProducts, setError, true);
    }

    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, []);

  // Función externa para refrescar (dedup + eq is_active true)
  const refreshProducts = useCallback(
    async (
      controller,
      setProductsCb,
      setErrorCb,
      setLoadingInitially = false
    ) => {
      try {
        if (isCacheFresh() || controller.signal.aborted) {
          return;
        }
        if (productsCache.inFlight) {
          const data = await productsCache.inFlight;
          if (!controller.signal.aborted && mountedRef.current) {
            setProductsCb(data);
            setLoading(false);
          }
          return;
        }
        if (setLoadingInitially) setLoading(true);

        productsCache.inFlight = (async () => {
          let data, error;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              const res = await supabase
                .from('products')
                .select(
                  'productid,supplier_id,productnm,price,category,product_type,productqty,minimum_purchase,negotiable,is_active,free_shipping_enabled,free_shipping_min_quantity,product_images(image_url,thumbnail_url,thumbnails),product_delivery_regions(region)'
                )
                .eq('is_active', true); // filtro directo para reducir payload

              if (res.error) throw res.error;
              data = res.data;
              error = null;
              break; // Success
            } catch (err) {
              console.warn(`[useProducts] Attempt ${attempt} failed:`, err);
              error = err;
              if (attempt < 3) {
                const delay = attempt === 1 ? 1000 : 2000;
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
          }
          if (error) throw new Error(error.message || 'Error loading products');

          // Enriquecer proveedores (embedding futuro)
          let usersMap = {};
          if (data && data.length > 0) {
            const supplierIds = [
              ...new Set(data.map(p => p.supplier_id).filter(Boolean)),
            ];
            if (supplierIds.length > 0) {
              const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select(
                  'user_id, user_nm, logo_url, descripcion_proveedor, verified'
                )
                .in(
                  'user_id',
                  supplierIds.map(id => String(id))
                )
                .eq('verified', true) // ✅ SOLO PROVEEDORES VERIFICADOS
                .eq('main_supplier', true); // ✅ SOLO USUARIOS CON ROL PROVEEDOR
              if (!usersError && usersData) {
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

          // ✅ FILTRAR: Solo productos con proveedor verificado (que existe en usersMap)
          const mapped = (data || [])
            .filter(p => p.supplier_id && usersMap[p.supplier_id]) // Solo productos de proveedores verificados
            .map(p => {
              const firstImg =
                p.product_images && p.product_images.length > 0
                  ? p.product_images[0]
                  : null;
              const imagenPrincipal =
                firstImg?.image_url || '/placeholder-product.jpg';
              const thumbnailUrl = firstImg?.thumbnail_url || null;
              const thumbnails = firstImg?.thumbnails
                ? typeof firstImg.thumbnails === 'string'
                  ? safeParseJSON(firstImg.thumbnails)
                  : firstImg.thumbnails
                : null;
              const basePrice = p.price || 0;
              // Extraer regiones de despacho como slugs canónicos
              const shippingRegions = Array.isArray(p.product_delivery_regions)
                ? p.product_delivery_regions
                    .map(r => normalizeRegionValue(r?.region))
                    .filter(Boolean)
                : [];
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
                imagen: imagenPrincipal,
                thumbnails,
                thumbnail_url: thumbnailUrl,
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
                // Conservamos nombre de propiedad "negociable" pero la columna real es 'negotiable'
                negociable: p.negotiable,
                is_active: p.is_active,
                // ✅ FREE SHIPPING: Propagar campos de despacho gratuito
                free_shipping_enabled: p.free_shipping_enabled || false,
                free_shipping_min_quantity:
                  p.free_shipping_min_quantity || null,
                freeShippingEnabled: p.free_shipping_enabled || false,
                freeShippingMinQuantity: p.free_shipping_min_quantity || null,
                priceTiers: [],
                minPrice: basePrice,
                maxPrice: basePrice,
                // ✅ Si tiene precio base válido, marcar loaded. Si no, marcar idle para cargar tiers.
                tiersStatus: basePrice > 0 ? 'loaded' : 'idle',
                shippingRegions,
              };
            });
          // Añado createdAt/updatedAt para consistencia con otros mappers
          const mappedWithDates = mapped.map(prod => {
            const src =
              (data || []).find(d => String(d.productid) === String(prod.id)) ||
              {};
            return {
              ...prod,
              createdAt: src.createddt || null,
              updatedAt: src.updateddt || null,
            };
          });
          const active = filterActiveProducts(mappedWithDates); // por compatibilidad (debería ya estar filtrado)
          return active;
        })();

        const result = await productsCache.inFlight;
        productsCache.data = result;
        productsCache.fetchedAt = Date.now();
        productsCache.inFlight = null;
        // ✅ FIX: Solo verificar si el componente sigue montado, NO si está abortado
        // Los datos ya se obtuvieron exitosamente, debemos procesarlos
        if (mountedRef.current) {
          // ✅ GUARD: Cargar TODOS los datos necesarios en paralelo ANTES de mostrar productos
          const productIds = result.map(p => p.id);

          try {
            // Cargar price summaries y tiers en PARALELO
            const [summariesResult, tiersResult] = await Promise.all([
              fetchPriceSummariesDirect(productIds),
              fetchAllTiersDirect(productIds),
            ]);

            // Merge todos los datos en los productos
            const enrichedProducts = result.map(p => {
              const pid = String(p.id);
              const summary = summariesResult?.get(pid);
              const tiers = tiersResult?.get(pid) || [];

              // Aplicar summary
              let minPrice = p.minPrice;
              let maxPrice = p.maxPrice;
              let tiersCount = 0;
              let hasVariable = false;

              if (summary) {
                minPrice =
                  summary.min_price != null
                    ? Number(summary.min_price)
                    : minPrice;
                maxPrice =
                  summary.max_price != null
                    ? Number(summary.max_price)
                    : maxPrice;
                tiersCount =
                  summary.tiers_count != null ? Number(summary.tiers_count) : 0;
                hasVariable = !!summary.has_variable_pricing;
              }

              // Aplicar tiers
              if (tiers.length > 0) {
                const precios = tiers
                  .map(t => Number(t.price) || 0)
                  .filter(n => n > 0);
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

            // ✅ RANDOMIZACIÓN ML: Aplicar orden aleatorio usando el modelo de recomendaciones
            let finalProducts = enrichedProducts;
            try {
              const recommendationsData = await getRecommendations(
                Math.min(enrichedProducts.length, 50) // Limitar a 50 para no sobrecargar
              );

              if (recommendationsData && recommendationsData.products) {
                // Crear un mapa de ID -> score del modelo ML
                const scoreMap = new Map(
                  recommendationsData.products.map(rec => [
                    rec.id,
                    rec.recommendation_score,
                  ])
                );

                // Ordenar los productos según los scores del modelo
                finalProducts = [...enrichedProducts].sort((a, b) => {
                  const scoreA = scoreMap.get(a.id) ?? 0;
                  const scoreB = scoreMap.get(b.id) ?? 0;
                  return scoreB - scoreA; // Mayor score primero
                });
              }
            } catch (mlError) {
              // Si el backend ML falla, continuar con el orden original
              console.warn(
                '[useProducts] ML Backend no disponible, usando orden original'
              );
            }

            setProductsCb(finalProducts);
            // Actualizar cache con productos enriquecidos
            productsCache.data = finalProducts;
          } catch (e) {
            console.warn(
              '[useProducts] Error en carga paralela, usando datos básicos:',
              e
            );
            setProductsCb(result);
          }

          setLoading(false);
          performance.mark?.('products_fetch_end');
          if (performance.measure) {
            try {
              performance.measure(
                'products_fetch',
                'products_fetch_start',
                'products_fetch_end'
              );
            } catch {}
          }
        }
      } catch (e) {
        productsCache.inFlight = null;
        if (!controller.signal.aborted && mountedRef.current) {
          setErrorCb(e.message || 'Error cargando productos');
          setLoading(false);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    []
  );

  // Utilidad segura para parsear JSON de thumbnails
  const safeParseJSON = str => {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  // --- Fetch summaries from backend view (min/max/tiers_count) ---
  const PRICE_SUMMARY_CHUNK = 100;

  const chunkArray = (arr, size) => {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };

  const fetchPriceSummaries = useCallback(async productIds => {
    const now = Date.now();
    const ids = (productIds || [])
      .map(id => (id == null ? '' : String(id).trim()))
      .filter(s => s && s.toLowerCase() !== 'nan');
    if (ids.length === 0) {
      return;
    }

    // ✅ Ya no validamos contra products state - los IDs vienen del resultado del fetch
    const validIds = ids;

    // Determine which ids need fetching (not cached or expired)
    const idsToFetch = [];
    const cachedById = new Map();
    for (const id of validIds) {
      const entry = globalSummariesCache.get(id);
      if (entry && now - entry.ts < PRICE_SUMMARY_TTL) {
        cachedById.set(id, entry.data);
      } else {
        idsToFetch.push(id);
      }
    }

    // If nothing to fetch, just apply cached results
    if (idsToFetch.length === 0) {
      setProducts(prev => {
        return prev.map(p => {
          const s = cachedById.get(String(p.id));
          if (!s) return p;
          const minPrice =
            s.min_price != null ? Number(s.min_price) : p.minPrice;
          const maxPrice =
            s.max_price != null ? Number(s.max_price) : p.maxPrice;
          const tiersCount = s.tiers_count != null ? Number(s.tiers_count) : 0;
          const hasVariable = !!s.has_variable_pricing;
          // ✅ Si tenemos price summary, marcar como 'loaded' (ya tenemos min/max para mostrar)
          return {
            ...p,
            minPrice,
            maxPrice,
            tiers_count: tiersCount,
            has_variable_pricing: hasVariable,
            tiersStatus: 'loaded',
          };
        });
      });
      return;
    }

    try {
      // Chunk and fetch, with simple in-flight dedupe per chunk
      const chunks = chunkArray(idsToFetch, PRICE_SUMMARY_CHUNK);
      const fetchedResults = [];
      for (const chunk of chunks) {
        const chunkKey = chunk.join(',');
        let p;
        if (globalSummariesInFlight.has(chunkKey)) {
          p = globalSummariesInFlight.get(chunkKey);
        } else {
          p = (async () => {
            return await supabase
              .from('product_price_summary')
              .select(
                'productid,min_price,max_price,tiers_count,has_variable_pricing'
              )
              .in('productid', chunk);
          })();
          globalSummariesInFlight.set(chunkKey, p);
        }
        try {
          const res = await p;
          globalSummariesInFlight.delete(chunkKey);
          const { data, error } = res || { data: [], error: null };
          if (error) throw error;
          // store into cache
          for (const d of data || []) {
            globalSummariesCache.set(String(d.productid), {
              data: d,
              ts: Date.now(),
            });
            fetchedResults.push(d);
          }
        } catch (errChunk) {
          globalSummariesInFlight.delete(chunkKey);
          throw errChunk;
        }
      }

      // Merge cached + fetched and update products
      setProducts(prev => {
        const updated = prev.map(p => {
          const id = String(p.id);
          const s = globalSummariesCache.get(id)?.data || cachedById.get(id);
          if (!s) return p;
          const minPrice =
            s.min_price != null ? Number(s.min_price) : p.minPrice;
          const maxPrice =
            s.max_price != null ? Number(s.max_price) : p.maxPrice;
          const tiersCount = s.tiers_count != null ? Number(s.tiers_count) : 0;
          const hasVariable = !!s.has_variable_pricing;
          // ✅ Si tenemos price summary, marcar como 'loaded' (ya tenemos min/max para mostrar)
          return {
            ...p,
            minPrice,
            maxPrice,
            tiers_count: tiersCount,
            has_variable_pricing: hasVariable,
            tiersStatus: 'loaded',
          };
        });
        return updated;
      });
    } catch (e) {
      console.warn(
        '[useProducts] fetchPriceSummaries failed - falling back to base prices',
        e
      );
      // Mark products that were waiting for summaries as loaded so UI uses base price instead of perpetual loading
      setProducts(prev =>
        prev.map(p => ({
          ...p,
          tiersStatus: p.tiersStatus === 'idle' ? 'loaded' : p.tiersStatus,
        }))
      );
      return;
    }
  }, []); // ✅ Sin dependencia de products - usamos setProducts con callback

  // --- Fetch diferido de tiers (batch) ---
  const fetchTiersBatch = useCallback(
    async productIds => {
      const now = Date.now();
      // Normalize incoming ids to strings and filter invalids (empty / 'NaN')
      const incoming = (productIds || []).map(id =>
        id == null ? '' : String(id).trim()
      );
      // If we already fetched price summaries, avoid requesting tiers for products that have 0 tiers
      // Only request tiers for ids that correspond to known products in memory.
      const ids = incoming.filter(id => {
        if (!id || id.toLowerCase() === 'nan') return false;
        // Check global cache with TTL
        const cached = globalTiersCache.get(id);
        if (cached && now - cached.ts < TIERS_CACHE_TTL) return false;
        if (globalTiersPending.has(id)) return false;
        // Only proceed if this id belongs to a product currently in state
        const prod = products.find(p => String(p.id) === id);
        if (!prod) return false;
        if (prod.tiers_count === 0) return false; // skip known empty
        return true;
      });
      if (ids.length === 0) return;
      ids.forEach(id => globalTiersPending.add(id));
      // Instrumentation
      try {
        metricsRef.current.tiersBatchCalls += 1;
      } catch (_) {}
      const batchKey = ids.join(',');
      performance.mark?.(`tiers_fetch_start_${batchKey}`);
      try {
        const { data, error: tiersError } = await supabase
          .from('product_quantity_ranges')
          .select('*')
          .in('product_id', ids);
        if (tiersError) throw tiersError;
        const grouped = new Map();
        for (const t of data || []) {
          const key = t.product_id == null ? '' : String(t.product_id).trim();
          if (!grouped.has(key)) grouped.set(key, []);
          grouped.get(key).push(t);
        }
        // Actualizar cache + productos
        setProducts(prev =>
          prev.map(p => {
            const pid = String(p.id);
            if (!ids.includes(pid)) return p;
            const tiers = grouped.get(pid) || [];
            globalTiersCache.set(pid, { data: tiers, ts: Date.now() });
            if (tiers.length === 0) {
              return { ...p, priceTiers: [], tiersStatus: 'loaded' };
            }
            const precios = tiers
              .map(t => Number(t.price) || 0)
              .filter(n => n > 0);
            const minPrice = precios.length ? Math.min(...precios) : p.minPrice;
            const maxPrice = precios.length ? Math.max(...precios) : p.maxPrice;
            return {
              ...p,
              priceTiers: tiers,
              minPrice,
              maxPrice,
              tiersStatus: 'loaded',
            };
          })
        );
      } catch (e) {
        console.error('[tiers] error batch', e);
        setProducts(prev =>
          prev.map(p =>
            ids.includes(p.id) ? { ...p, tiersStatus: 'error' } : p
          )
        );
      } finally {
        ids.forEach(id => globalTiersPending.delete(id));
        const endKey = ids.join(',');
        performance.mark?.(`tiers_fetch_end_${endKey}`);
        if (performance.measure) {
          try {
            performance.measure(
              `tiers_fetch_${endKey}`,
              `tiers_fetch_start_${endKey}`,
              `tiers_fetch_end_${endKey}`
            );
          } catch {}
        }
      }
    },
    [products]
  );

  // API pública: obtener tiers de un producto (trigger fetch si necesario)
  const getPriceTiers = useCallback(
    productId => {
      const pid = productId == null ? '' : String(productId).trim();
      if (!pid || pid.toLowerCase() === 'nan') return [];
      const cached = globalTiersCache.get(pid);
      if (cached && Date.now() - cached.ts < TIERS_CACHE_TTL)
        return cached.data;
      // lanzar fetch individual (batch de 1) si no está
      fetchTiersBatch([pid]);
      setProducts(prev =>
        prev.map(p =>
          String(p.id) === pid && p.tiersStatus === 'idle'
            ? { ...p, tiersStatus: 'loading' }
            : p
        )
      );
      return [];
    },
    [fetchTiersBatch]
  );

  // IntersectionObserver para carga diferida automática
  const ensureObserver = useCallback(() => {
    if (observerRef.current) return observerRef.current;
    if (typeof IntersectionObserver === 'undefined') return null;
    observerRef.current = new IntersectionObserver(
      entries => {
        const visibleIds = [];
        for (const e of entries) {
          if (e.isIntersecting) {
            const pid = e.target.getAttribute('data-product-id');
            if (pid) visibleIds.push(String(pid));
            observerRef.current.unobserve(e.target);
          }
        }
        if (visibleIds.length) {
          // marcar loading
          setProducts(prev =>
            prev.map(p =>
              visibleIds.includes(String(p.id)) && p.tiersStatus === 'idle'
                ? { ...p, tiersStatus: 'loading' }
                : p
            )
          );
          // pass string ids directly (don't coerce to Number for UUIDs)
          fetchTiersBatch(visibleIds);
        }
      },
      { rootMargin: '150px 0px', threshold: 0.15 }
    );
    return observerRef.current;
  }, [fetchTiersBatch]);

  const registerProductNode = useCallback(
    (productId, node) => {
      if (!node) return;
      const obs = ensureObserver();
      if (!obs) return; // sin soporte
      // Evitar re-observar si no es un producto conocido
      const product = products.find(p => String(p.id) === String(productId));
      if (!product) return;
      if (product.tiersStatus === 'loaded' || product.tiersStatus === 'loading')
        return;
      // If we already know this product has zero tiers, no need to observe
      if (product.tiers_count === 0) return;
      node.setAttribute('data-product-id', String(productId));
      obs.observe(node);
    },
    [ensureObserver, products]
  );

  // Limpieza observer al desmontar
  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  return { products, loading, error, getPriceTiers, registerProductNode };
}

// Mock products data (unchanged)
const PRODUCTOS = [
  // ... existing mock data would go here
];
