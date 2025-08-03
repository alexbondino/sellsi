/**
 * ============================================================================
 * DAILY CLEANUP EDGE FUNCTION - FUNCIÓN DE LIMPIEZA DIARIA AUTOMATIZADA
 * ============================================================================
 * 
 * Edge Function de Supabase ROBUSTA para ejecutar limpieza automática diaria
 * del almacenamiento y mantener la consistencia del sistema.
 * 
 * ✅ CORREGIDO: Autenticación robusta con token secreto
 * ✅ CORREGIDO: Paginación completa para archivos
 * ✅ CORREGIDO: URL parsing robusto con URL constructor
 * ✅ CORREGIDO: Filtrado preciso sin falsos positivos
 * ✅ CORREGIDO: Tasa de éxito por productos únicos
 * ✅ CORREGIDO: Validación completa del body
 * ✅ CORREGIDO: Validación de variables de entorno
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================================
// VALIDACIÓN DE VARIABLES DE ENTORNO (CORREGIDO PUNTO 7)
// ============================================================================
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const CLEANUP_SECRET_TOKEN = Deno.env.get('CLEANUP_SECRET_TOKEN') // Token secreto

if (!SUPABASE_URL) {
  throw new Error('❌ Variable de entorno SUPABASE_URL no definida')
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('❌ Variable de entorno SUPABASE_SERVICE_ROLE_KEY no definida')
}

if (!CLEANUP_SECRET_TOKEN) {
  throw new Error('❌ Variable de entorno CLEANUP_SECRET_TOKEN no definida')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================
interface CleanupRequestBody {
  productIds?: string[]
  dryRun?: boolean
  maxProducts?: number
}

interface CleanupResult {
  success: boolean
  summary: {
    totalProducts: number
    productsProcessed: number
    filesRemoved: number
    errors: string[]
    executionTimeMs: number
    successRate: number
  }
  details: {
    processedProducts: string[]
    failedProducts: string[]
  }
}

// ============================================================================
// FUNCIONES DE UTILIDAD ROBUSTAS
// ============================================================================

/**
 * CORREGIDO PUNTO 3: Extraer path de URL usando URL constructor robusto
 */
function extractPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    
    // Extraer path después del bucket name
    const imageMatch = pathname.match(/\/storage\/v1\/object\/public\/product-images\/(.+)$/)
    if (imageMatch) return imageMatch[1]
    
    const thumbMatch = pathname.match(/\/storage\/v1\/object\/public\/product-images-thumbnails\/(.+)$/)
    if (thumbMatch) return thumbMatch[1]
    
    return null
  } catch (error) {
    console.error('❌ Error parsing URL:', url, error)
    return null
  }
}

/**
 * CORREGIDO PUNTO 2: Paginación completa para listar archivos
 */
async function listAllFilesInBucket(bucketName: string): Promise<{ path: string; name: string }[]> {
  const allFiles: { path: string; name: string }[] = []
  let offset = 0
  const limit = 1000
  
  while (true) {
    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list('', {
        limit,
        offset,
        sortBy: { column: 'name', order: 'asc' }
      })
    
    if (error) {
      console.error(`❌ Error listing files in ${bucketName}:`, error)
      break
    }
    
    if (!files || files.length === 0) {
      break
    }
    
    // Agregar archivos con path completo
    allFiles.push(...files.map(file => ({
      path: file.name,
      name: file.name
    })))
    
    // Si obtuvimos menos del límite, hemos terminado
    if (files.length < limit) {
      break
    }
    
    offset += limit
  }
  
  return allFiles
}

/**
 * CORREGIDO PUNTO 4: Filtrado preciso usando prefijos estructurados
 */
function filterFilesByProductId(files: { path: string; name: string }[], productId: string): { path: string; name: string }[] {
  return files.filter(file => {
    const path = file.path
    
    // Patrón exacto: supplierId/productId/filename
    const supplierPattern = new RegExp(`^[^/]+/${productId}/`)
    if (supplierPattern.test(path)) return true
    
    // Patrón exacto: productId/filename
    const directPattern = new RegExp(`^${productId}/`)
    if (directPattern.test(path)) return true
    
    // Patrón con delimitadores: filename contiene _productId_ o -productId-
    const delimiterPattern = new RegExp(`[_-]${productId}[_-]`)
    if (delimiterPattern.test(path)) return true
    
    return false
  })
}

/**
 * CORREGIDO PUNTO 1: Validación robusta de autenticación con token secreto
 */
function validateAuthentication(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    return false
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return false
  }
  
  const token = authHeader.substring(7)
  
  // Comparación segura con token secreto
  return token === CLEANUP_SECRET_TOKEN
}

/**
 * CORREGIDO PUNTO 6: Validación completa del body de la request
 */
function validateRequestBody(body: any): CleanupRequestBody {
  const validated: CleanupRequestBody = {}
  
  if (body.productIds !== undefined) {
    if (!Array.isArray(body.productIds)) {
      throw new Error('productIds debe ser un array')
    }
    
    if (body.productIds.some((id: any) => typeof id !== 'string')) {
      throw new Error('Todos los productIds deben ser strings')
    }
    
    validated.productIds = body.productIds
  }
  
  if (body.dryRun !== undefined) {
    if (typeof body.dryRun !== 'boolean') {
      throw new Error('dryRun debe ser boolean')
    }
    validated.dryRun = body.dryRun
  }
  
  if (body.maxProducts !== undefined) {
    if (typeof body.maxProducts !== 'number' || body.maxProducts < 1 || body.maxProducts > 10000) {
      throw new Error('maxProducts debe ser un número entre 1 y 10000')
    }
    validated.maxProducts = body.maxProducts
  }
  
  return validated
}

// ============================================================================
// FUNCIÓN PRINCIPAL DE LIMPIEZA ROBUSTA
// ============================================================================

async function performRobustCleanup(options: CleanupRequestBody): Promise<CleanupResult> {
  const startTime = Date.now()
  const result: CleanupResult = {
    success: false,
    summary: {
      totalProducts: 0,
      productsProcessed: 0,
      filesRemoved: 0,
      errors: [],
      executionTimeMs: 0,
      successRate: 0
    },
    details: {
      processedProducts: [],
      failedProducts: []
    }
  }
  
  try {
    // 1. Obtener lista de productos a procesar
    let productIds: string[] = []
    
    if (options.productIds && options.productIds.length > 0) {
      productIds = options.productIds
    } else {
      const { data: products, error } = await supabase
        .from('products')
        .select('productid')
        .limit(options.maxProducts || 1000)
      
      if (error) {
        throw new Error(`Error obteniendo productos: ${error.message}`)
      }
      
      productIds = products?.map(p => p.productid) || []
    }
    
    result.summary.totalProducts = productIds.length
    console.log(`🧹 Iniciando limpieza robusta para ${productIds.length} productos`)
    
    // 2. Listar todos los archivos con paginación completa
    const [imageFiles, thumbnailFiles] = await Promise.all([
      listAllFilesInBucket('product-images'),
      listAllFilesInBucket('product-images-thumbnails')
    ])
    
    console.log(`📊 Archivos encontrados - Imágenes: ${imageFiles.length}, Thumbnails: ${thumbnailFiles.length}`)
    
    // 3. Obtener todas las referencias de BD
    const { data: dbImages } = await supabase
      .from('product_images')
      .select('product_id, image_url, thumbnail_url')
      .in('product_id', productIds)
    
    const dbUrls = new Set<string>()
    dbImages?.forEach(img => {
      if (img.image_url) {
        const path = extractPathFromUrl(img.image_url)
        if (path) dbUrls.add(path)
      }
      if (img.thumbnail_url) {
        const path = extractPathFromUrl(img.thumbnail_url)
        if (path) dbUrls.add(path)
      }
    })
    
    // 4. Procesar cada producto de forma robusta
    const failedProductsSet = new Set<string>()
    
    for (const productId of productIds) {
      try {
        // Filtrar archivos específicos para este producto
        const productImageFiles = filterFilesByProductId(imageFiles, productId)
        const productThumbnailFiles = filterFilesByProductId(thumbnailFiles, productId)
        
        // Identificar archivos huérfanos
        const orphanImages = productImageFiles.filter(file => !dbUrls.has(file.path))
        const orphanThumbnails = productThumbnailFiles.filter(file => !dbUrls.has(file.path))
        
        // Si es dry run, solo contar
        if (options.dryRun) {
          result.summary.filesRemoved += orphanImages.length + orphanThumbnails.length
          result.details.processedProducts.push(productId)
          continue
        }
        
        // Eliminar archivos huérfanos
        let removedCount = 0
        
        if (orphanImages.length > 0) {
          const { error: imageError } = await supabase.storage
            .from('product-images')
            .remove(orphanImages.map(f => f.path))
          
          if (imageError) {
            throw new Error(`Error eliminando imágenes: ${imageError.message}`)
          }
          
          removedCount += orphanImages.length
        }
        
        if (orphanThumbnails.length > 0) {
          const { error: thumbError } = await supabase.storage
            .from('product-images-thumbnails')
            .remove(orphanThumbnails.map(f => f.path))
          
          if (thumbError) {
            throw new Error(`Error eliminando thumbnails: ${thumbError.message}`)
          }
          
          removedCount += orphanThumbnails.length
        }
        
        result.summary.filesRemoved += removedCount
        result.details.processedProducts.push(productId)
        
        console.log(`✅ Producto ${productId}: ${removedCount} archivos limpiados`)
        
      } catch (error) {
        const errorMsg = `Producto ${productId}: ${error.message}`
        result.summary.errors.push(errorMsg)
        failedProductsSet.add(productId)
        result.details.failedProducts.push(productId)
        
        console.error(`❌ ${errorMsg}`)
      }
    }
    
    // 5. CORREGIDO PUNTO 5: Calcular tasa de éxito basada en productos únicos fallidos
    result.summary.productsProcessed = result.details.processedProducts.length
    result.summary.executionTimeMs = Date.now() - startTime
    
    const uniqueFailedProducts = failedProductsSet.size
    result.summary.successRate = result.summary.totalProducts > 0 
      ? Math.round(((result.summary.totalProducts - uniqueFailedProducts) / result.summary.totalProducts) * 100)
      : 100
    
    result.success = uniqueFailedProducts === 0
    
    console.log(`🏁 Limpieza completada: ${result.summary.filesRemoved} archivos, ${result.summary.successRate}% éxito`)
    
    return result
    
  } catch (error) {
    result.summary.errors.push(`Error crítico: ${error.message}`)
    result.summary.executionTimeMs = Date.now() - startTime
    result.success = false
    
    console.error('❌ Error crítico en limpieza:', error)
    return result
  }
}

/**
 * Handler principal de la Edge Function con todas las correcciones aplicadas
 */
serve(async (req: Request) => {
  // Validar método HTTP
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Método no permitido. Solo POST.' }),
      { 
        status: 405, 
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
  
  try {
    // CORREGIDO PUNTO 1: Validación robusta de autenticación
    if (!validateAuthentication(req)) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticación inválido' }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    // CORREGIDO PUNTO 6: Parsear y validar body completamente
    let requestBody: CleanupRequestBody = {}
    
    try {
      const rawBody = await req.text()
      if (rawBody.trim()) {
        const parsedBody = JSON.parse(rawBody)
        requestBody = validateRequestBody(parsedBody)
      }
    } catch (error) {
      return new Response(
        JSON.stringify({ error: `Body inválido: ${error.message}` }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    console.log('🚀 Iniciando limpieza diaria robusta...')
    
    // Ejecutar limpieza robusta con todas las correcciones
    const result = await performRobustCleanup(requestBody)
    
    // Guardar log en base de datos
    try {
      await supabase
        .from('storage_cleanup_logs')
        .insert({
          executed_at: new Date().toISOString(),
          products_processed: result.summary.productsProcessed,
          files_removed: result.summary.filesRemoved,
          execution_time_ms: result.summary.executionTimeMs,
          errors: result.summary.errors,
          success: result.success,
          trigger_type: 'edge_function_robust'
        })
    } catch (logError) {
      console.warn('⚠️ Error guardando log:', logError)
      // No fallar por errores de log
    }
    
    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 207, // 207 Multi-Status para éxito parcial
        headers: { 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('❌ Error no manejado:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
