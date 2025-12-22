/**
 * 🎯 COMPONENTE SEO HEAD - SELLSI B2B MARKETPLACE
 * 
 * Componente reutilizable para gestionar metadata SEO
 * en todas las páginas del marketplace.
 * 
 * Incluye:
 * - Meta tags básicos (title, description)
 * - Open Graph para redes sociales
 * - Twitter Cards
 * - Schema.org JSON-LD
 * - Canonical URLs
 * 
 * @author Sellsi Development Team
 * @date 15 de Octubre de 2025
 */

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// ========================================
// 🔧 CONFIGURACIÓN
// ========================================

const SITE_CONFIG = {
  name: 'Sellsi',
  title: 'Sellsi - Marketplace B2B de Repuestos y Suministros Industriales en Chile',
  description: 'Plataforma B2B líder en Chile para compra y venta de repuestos, suministros industriales y productos al por mayor. Conecta con proveedores verificados.',
  url: 'https://sellsi.cl',
  image: 'https://sellsi.cl/assets/social/sellsi_OGCard.webp',
  twitterHandle: '@sellsi_cl',
  locale: 'es_CL',
  type: 'website'
}

// ========================================
// 📝 COMPONENTE
// ========================================

export default function SEOHead({
  title,
  description,
  image,
  url,
  type = 'website',
  noindex = false,
  nofollow = false,
  canonical,
  schema,
  keywords,
  author
}) {
  const location = useLocation()
  
  // Valores por defecto
  const pageTitle = title ? `${title} | ${SITE_CONFIG.name}` : SITE_CONFIG.title
  const pageDescription = description || SITE_CONFIG.description
  const pageImage = image || SITE_CONFIG.image
  const pageUrl = url || `${SITE_CONFIG.url}${location.pathname}`
  const canonicalUrl = canonical || pageUrl
  
  useEffect(() => {
    // Actualizar title
    document.title = pageTitle
    
    // Actualizar meta tags
    updateMetaTag('description', pageDescription)
    updateMetaTag('keywords', keywords)
    updateMetaTag('author', author)
    
    // Robots
    if (noindex || nofollow) {
      const robotsContent = [
        noindex ? 'noindex' : 'index',
        nofollow ? 'nofollow' : 'follow'
      ].join(', ')
      updateMetaTag('robots', robotsContent)
    } else {
      updateMetaTag('robots', 'index, follow')
    }
    
    // Open Graph
    updateMetaProperty('og:title', title || SITE_CONFIG.title)
    updateMetaProperty('og:description', pageDescription)
    updateMetaProperty('og:image', pageImage)
    updateMetaProperty('og:image:secure_url', pageImage)
    updateMetaProperty('og:image:type', 'image/webp')
    updateMetaProperty('og:image:width', '1200')
    updateMetaProperty('og:image:height', '630')
    updateMetaProperty('og:image:alt', `${title || SITE_CONFIG.name} - Conecta. Vende. Crece.`)
    updateMetaProperty('og:url', pageUrl)
    updateMetaProperty('og:type', type)
    updateMetaProperty('og:site_name', SITE_CONFIG.name)
    updateMetaProperty('og:locale', SITE_CONFIG.locale)
    
    // Twitter Card
    updateMetaTag('twitter:card', 'summary_large_image', 'name')
    updateMetaTag('twitter:site', SITE_CONFIG.twitterHandle, 'name')
    updateMetaTag('twitter:title', title || SITE_CONFIG.title, 'name')
    updateMetaTag('twitter:description', pageDescription, 'name')
    updateMetaTag('twitter:image', pageImage, 'name')
    updateMetaTag('twitter:image:alt', `${title || SITE_CONFIG.name} - Conecta. Vende. Crece.`, 'name')
    
    // Canonical
    updateLinkTag('canonical', canonicalUrl)
    
    // Schema.org JSON-LD
    if (schema) {
      updateSchemaTag(schema)
    } else {
      // Schema por defecto para el sitio
      updateSchemaTag({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_CONFIG.name,
        url: SITE_CONFIG.url,
        description: SITE_CONFIG.description,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_CONFIG.url}/marketplace?search={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      })
    }
    
  }, [pageTitle, pageDescription, pageImage, pageUrl, type, noindex, nofollow, canonicalUrl, schema, keywords, author])
  
  return null // Este componente no renderiza nada visualmente
}

// ========================================
// 🛠️ UTILIDADES
// ========================================

function updateMetaTag(name, content, attribute = 'name') {
  if (!content) return
  
  let element = document.querySelector(`meta[${attribute}="${name}"]`)
  
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, name)
    document.head.appendChild(element)
  }
  
  element.setAttribute('content', content)
}

function updateMetaProperty(property, content) {
  updateMetaTag(property, content, 'property')
}

function updateLinkTag(rel, href) {
  if (!href) return
  
  let element = document.querySelector(`link[rel="${rel}"]`)
  
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }
  
  element.setAttribute('href', href)
}

function updateSchemaTag(schema) {
  if (!schema) return
  
  const schemaId = 'sellsi-schema-ld'
  let element = document.getElementById(schemaId)
  
  if (!element) {
    element = document.createElement('script')
    element.id = schemaId
    element.type = 'application/ld+json'
    document.head.appendChild(element)
  }
  
  element.textContent = JSON.stringify(schema)
}

// ========================================
// 📦 HOOKS PERSONALIZADOS
// ========================================

/**
 * Hook para SEO de página de producto
 */
export function useProductSEO(product) {
  if (!product) return null
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.productname,
    description: product.description || product.productname,
    image: product.image_url || SITE_CONFIG.image,
    offers: {
      '@type': 'Offer',
      price: product.unit_price,
      priceCurrency: 'CLP',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: product.supplier_name || 'Sellsi'
      }
    }
  }
  
  return {
    title: product.productname,
    description: product.description || `${product.productname} - Compra al por mayor en Sellsi`,
    image: product.image_url,
    url: `${SITE_CONFIG.url}/producto/${product.productid}`,
    type: 'product',
    schema
  }
}

/**
 * Hook para SEO de página de proveedor
 */
export function useSupplierSEO(supplier) {
  if (!supplier) return null
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: supplier.user_nm,
    description: supplier.bio || `Proveedor verificado en Sellsi`,
    url: `${SITE_CONFIG.url}/proveedor/${supplier.user_id}`,
    logo: supplier.profile_image_url
  }
  
  return {
    title: `${supplier.user_nm} - Proveedor B2B`,
    description: supplier.bio || `Productos y servicios de ${supplier.user_nm} en Sellsi Marketplace`,
    image: supplier.profile_image_url,
    url: `${SITE_CONFIG.url}/proveedor/${supplier.user_id}`,
    type: 'profile',
    schema
  }
}

/**
 * Hook para SEO de marketplace
 */
export function useMarketplaceSEO(filters) {
  const { category, search } = filters || {}
  
  let title = 'Marketplace B2B'
  let description = 'Encuentra miles de productos industriales y repuestos al por mayor'
  
  if (category) {
    title = `${category} - Marketplace B2B`
    description = `Productos de ${category} al por mayor. Compara precios y proveedores en Sellsi`
  }
  
  if (search) {
    title = `Resultados para "${search}" - Marketplace`
    description = `Encuentra productos de "${search}" en nuestro marketplace B2B`
  }
  
  return {
    title,
    description,
    url: `${SITE_CONFIG.url}/marketplace`,
    keywords: category ? `${category}, repuestos, suministros, b2b, al por mayor` : undefined
  }
}

// ========================================
// 📋 PRESETS COMUNES
// ========================================

export const SEO_PRESETS = {
  HOME: {
    title: 'Inicio',
    description: 'Marketplace B2B líder en Chile. Conecta con proveedores, compara precios y compra repuestos y suministros industriales al por mayor.',
    keywords: 'marketplace b2b chile, repuestos industriales, suministros, compra por mayor, proveedores'
  },
  
  MARKETPLACE: {
    title: 'Marketplace B2B',
    description: 'Explora miles de productos industriales de proveedores verificados. Compara precios, solicita cotizaciones y compra al por mayor.',
    keywords: 'productos industriales, repuestos, suministros, b2b, mayorista'
  },
  
  SUPPLIER_DASHBOARD: {
    title: 'Panel de Proveedor',
    description: 'Gestiona tus productos, ofertas, cotizaciones y pedidos en Sellsi',
    noindex: true, // Páginas privadas no deben indexarse
    nofollow: true
  },
  
  BUYER_PROFILE: {
    title: 'Mi Perfil',
    description: 'Gestiona tu cuenta y preferencias en Sellsi',
    noindex: true,
    nofollow: true
  },
  
  CART: {
    title: 'Carrito de Compras',
    description: 'Revisa y gestiona tus productos seleccionados',
    noindex: true,
    nofollow: true
  }
}
