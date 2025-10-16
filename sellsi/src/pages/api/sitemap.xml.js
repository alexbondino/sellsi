/**
 * 🗺️ SITEMAP DINÁMICO API - SELLSI B2B MARKETPLACE
 * 
 * Este endpoint genera y sirve el sitemap.xml dinámicamente
 * con cache inteligente para optimizar performance.
 * 
 * Ruta: /api/sitemap.xml
 * 
 * Ventajas sobre sitemap estático:
 * - Siempre actualizado con productos recientes
 * - No requiere re-build del proyecto
 * - Cache en memoria para performance
 * - Regeneración automática cada X minutos
 * 
 * @author Sellsi Development Team
 * @date 15 de Octubre de 2025
 */

import { createClient } from '@supabase/supabase-js'

// ========================================
// 🔧 CONFIGURACIÓN
// ========================================

const SITE_URL = 'https://sellsi.cl'
const CACHE_DURATION = 60 * 60 * 1000 // 1 hora en milisegundos
const MAX_URLS_PER_SITEMAP = 50000

// Cache en memoria
let cachedSitemap = null
let cacheTimestamp = null

// ========================================
// 🔌 SUPABASE CLIENT
// ========================================

function getSupabaseClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured')
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

// ========================================
// 📝 UTILIDADES
// ========================================

function escapeXml(unsafe) {
  if (!unsafe) return ''
  return unsafe
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatDate(date) {
  if (!date) return new Date().toISOString().split('T')[0]
  return new Date(date).toISOString().split('T')[0]
}

function createUrlEntry({ loc, lastmod, changefreq, priority }) {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    ${lastmod ? `<lastmod>${formatDate(lastmod)}</lastmod>` : ''}
    ${changefreq ? `<changefreq>${changefreq}</changefreq>` : ''}
    ${priority ? `<priority>${priority}</priority>` : ''}
  </url>`
}

// ========================================
// 🌐 GENERADOR DE URLs
// ========================================

function getStaticPages() {
  const now = new Date()
  
  return [
    { loc: `${SITE_URL}/`, lastmod: now, changefreq: 'daily', priority: '1.0' },
    { loc: `${SITE_URL}/marketplace`, lastmod: now, changefreq: 'daily', priority: '1.0' },
    { loc: `${SITE_URL}/mi-perfil`, lastmod: now, changefreq: 'monthly', priority: '0.6' },
    { loc: `${SITE_URL}/carrito`, lastmod: now, changefreq: 'daily', priority: '0.6' },
    { loc: `${SITE_URL}/proveedor/inicio`, lastmod: now, changefreq: 'weekly', priority: '0.6' },
    { loc: `${SITE_URL}/proveedor/productos`, lastmod: now, changefreq: 'weekly', priority: '0.6' },
    { loc: `${SITE_URL}/proveedor/ofertas`, lastmod: now, changefreq: 'daily', priority: '0.6' },
    { loc: `${SITE_URL}/proveedor/cotizaciones`, lastmod: now, changefreq: 'daily', priority: '0.6' },
    { loc: `${SITE_URL}/proveedor/pedidos`, lastmod: now, changefreq: 'daily', priority: '0.6' }
  ]
}

async function getProductPages(supabase, limit = 10000) {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('productid, updated_at, created_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    return products.map(product => ({
      loc: `${SITE_URL}/producto/${product.productid}`,
      lastmod: product.updated_at || product.created_at,
      changefreq: 'weekly',
      priority: '0.9'
    }))
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

async function getSupplierPages(supabase) {
  try {
    const { data: suppliers, error } = await supabase
      .from('users')
      .select('user_id, updated_at, created_at')
      .eq('main_supplier', true)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
    
    if (error) throw error
    
    return suppliers.map(supplier => ({
      loc: `${SITE_URL}/proveedor/${supplier.user_id}`,
      lastmod: supplier.updated_at || supplier.created_at,
      changefreq: 'monthly',
      priority: '0.8'
    }))
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return []
  }
}

async function getCategoryPages(supabase) {
  try {
    const { data: categories, error } = await supabase
      .from('products')
      .select('category')
      .eq('is_active', true)
      .not('category', 'is', null)
    
    if (error) throw error
    
    const uniqueCategories = [...new Set(categories.map(p => p.category).filter(Boolean))]
    const now = new Date()
    
    return uniqueCategories.map(category => ({
      loc: `${SITE_URL}/marketplace?category=${encodeURIComponent(category)}`,
      lastmod: now,
      changefreq: 'daily',
      priority: '0.7'
    }))
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

// ========================================
// 🎯 GENERADOR DE SITEMAP
// ========================================

async function generateSitemapXml() {
  const supabase = getSupabaseClient()
  
  // Obtener todas las URLs
  const staticPages = getStaticPages()
  const productPages = await getProductPages(supabase)
  const supplierPages = await getSupplierPages(supabase)
  const categoryPages = await getCategoryPages(supabase)
  
  // Combinar y limitar a 50,000 URLs
  const allPages = [
    ...staticPages,
    ...productPages,
    ...supplierPages,
    ...categoryPages
  ].slice(0, MAX_URLS_PER_SITEMAP)
  
  // Generar XML
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...allPages.map(page => createUrlEntry(page)),
    '</urlset>'
  ].join('\n')
  
  return xml
}

// ========================================
// 🚀 HANDLER DE LA API
// ========================================

export async function GET(request) {
  try {
    // Verificar cache
    const now = Date.now()
    const cacheIsValid = cachedSitemap && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)
    
    if (cacheIsValid) {
      console.log('✅ Sirviendo sitemap desde cache')
      return new Response(cachedSitemap, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600', // Cache en CDN por 1 hora
          'X-Sitemap-Cache': 'HIT'
        }
      })
    }
    
    // Regenerar sitemap
    console.log('🔄 Regenerando sitemap...')
    const sitemapXml = await generateSitemapXml()
    
    // Actualizar cache
    cachedSitemap = sitemapXml
    cacheTimestamp = now
    
    console.log(`✅ Sitemap generado: ${sitemapXml.split('\n').length - 2} URLs`)
    
    return new Response(sitemapXml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'X-Sitemap-Cache': 'MISS'
      }
    })
    
  } catch (error) {
    console.error('❌ Error generando sitemap:', error)
    
    // Si hay cache antiguo, servirlo aunque esté expirado
    if (cachedSitemap) {
      console.warn('⚠️  Sirviendo cache antiguo debido a error')
      return new Response(cachedSitemap, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'X-Sitemap-Cache': 'STALE'
        }
      })
    }
    
    return new Response('Error generating sitemap', { status: 500 })
  }
}

// Para desarrollo local o pre-rendering
if (import.meta.env.MODE === 'development') {
  console.log('🗺️  Sitemap API disponible en: /api/sitemap.xml')
}
