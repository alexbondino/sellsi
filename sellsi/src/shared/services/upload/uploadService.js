// uploadService.js - Servicio optimizado para uploads a Supabase Storage
import { supabase } from '../../../services/supabase.js'
import { StorageCleanupService } from '../storage/storageCleanupService.js'
import { FeatureFlags, ThumbTimings } from '../../flags/featureFlags.js'
import { record as recordMetric } from '../../thumbnail/thumbnailMetrics.js'
const THUMBS_LOG_PREFIX = '[THUMBS]'
function thumbsLog(event, data) {
  try {
    if (!data) data = {}
    // Pequeño filtro para no spamear en producción si se desea: podría condicionarse a flag
    console.log(THUMBS_LOG_PREFIX, event, JSON.stringify(data))
  } catch(_) {}
}

// Solo verificar en desarrollo
if (import.meta.env.DEV && !supabase) {
  console.error('❌ [UploadService] Objeto supabase no disponible!')
  throw new Error('Supabase client no inicializado')
}


/**
 * Servicio optimizado para subir archivos PDF a Supabase Storage
 * Implementa buenas prácticas para agilidad del backend
 */
export class UploadService {
  static PDF_BUCKET = 'product-documents'
  static IMAGE_BUCKET = 'product-images'
  static THUMBNAIL_BUCKET = 'product-images-thumbnails'  // ✅ NUEVO: Bucket para thumbnails
  static MAX_PDF_SIZE = 5 * 1024 * 1024 // 5MB
  static MAX_IMAGE_SIZE = 2 * 1024 * 1024 // 2MB

  /**
   * Subir archivo PDF con validación y optimización
   * @param {File} file - Archivo PDF a subir
   * @param {string} productId - ID del producto
   * @param {string} supplierId - ID del proveedor
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  static async uploadPDF(file, productId, supplierId) {
    try {
      // Validaciones
      if (!file) {
        return { success: false, error: 'No se proporcionó archivo' }
      }

      if (file.type !== 'application/pdf') {
        return { success: false, error: 'Solo se permiten archivos PDF' }
      }

      if (file.size > this.MAX_PDF_SIZE) {
        return { success: false, error: 'El archivo debe ser menor a 5MB' }
      }

      // Generar nombre único del archivo
      const timestamp = Date.now()
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `${supplierId}/${productId}/${timestamp}_${sanitizedFileName}`

      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.PDF_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600', // Cache por 1 hora
          upsert: false, // No sobrescribir archivos existentes
        })

      if (error) {
        return { success: false, error: error.message }
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from(this.PDF_BUCKET)
        .getPublicUrl(fileName)

      return {
        success: true,
        data: {
          id: data.id || fileName,
          fileName: file.name,
          filePath: fileName,
          publicUrl: urlData.publicUrl,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        },
      }
    } catch (error) {
      return { success: false, error: 'Error inesperado al subir archivo' }
    }
  }

  /**
   * Subir múltiples archivos PDF de forma optimizada
   * @param {File[]} files - Array de archivos PDF
   * @param {string} productId - ID del producto
   * @param {string} supplierId - ID del proveedor
   * @returns {Promise<{success: boolean, data?: any[], errors?: string[]}>}
   */
  static async uploadMultiplePDFs(files, productId, supplierId) {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadPDF(file, productId, supplierId)
      )

      const results = await Promise.allSettled(uploadPromises)

      const successful = []
      const errors = []

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          successful.push(result.value.data)
        } else {
          const errorMsg =
            result.status === 'rejected'
              ? result.reason.message
              : result.value.error
          errors.push(`Archivo ${files[index].name}: ${errorMsg}`)
        }
      })

      return {
        success: successful.length > 0,
        data: successful,
        errors: errors.length > 0 ? errors : undefined,
      }
    } catch (error) {
      return { success: false, errors: ['Error inesperado al subir archivos'] }
    }
  }

  /**
   * Eliminar archivo PDF de Supabase Storage
   * @param {string} filePath - Ruta del archivo en storage
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async deletePDF(filePath) {
    try {
      const { error } = await supabase.storage
        .from(this.PDF_BUCKET)
        .remove([filePath])

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Error inesperado al eliminar archivo' }
    }
  }

  /**
   * Subir imagen con optimización
   * @param {File} file - Archivo de imagen
   * @param {string} productId - ID del producto
   * @param {string} supplierId - ID del proveedor
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  static async uploadImage(file, productId, supplierId) {
    try {
      // Validaciones
      if (!file) {
        return { success: false, error: 'No se proporcionó archivo' }
      }

      if (!file.type.startsWith('image/')) {
        return { success: false, error: 'Solo se permiten archivos de imagen' }
      }

      if (file.size > this.MAX_IMAGE_SIZE) {
        return { success: false, error: 'La imagen debe ser menor a 2MB' }
      }

      // Generar nombre único del archivo
      const timestamp = Date.now()
      const extension = file.name.split('.').pop()
      const fileName = `${supplierId}/${productId}/${timestamp}.${extension}`

      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.IMAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600', // Cache por 1 hora
          upsert: false,
        })

      if (error) {
        return { success: false, error: error.message }
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from(this.IMAGE_BUCKET)
        .getPublicUrl(fileName)

      return {
        success: true,
        data: {
          id: data.id || fileName,
          fileName: file.name,
          filePath: fileName,
          publicUrl: urlData.publicUrl,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        },
      }
    } catch (error) {
      return { success: false, error: 'Error inesperado al subir imagen' }
    }
  }

  /**
   * ✅ NUEVO: Subir múltiples imágenes con generación automática de thumbnails
   * @param {File[]} files - Archivos de imagen a subir
   * @param {string} productId - ID del producto
   * @param {string} supplierId - ID del proveedor
   * @param {Object} options - Opciones adicionales
   * @param {boolean} options.replaceExisting - Si debe limpiar imágenes existentes antes
   * @returns {Promise<{success: boolean, data?: any[], errors?: string[]}>}
   */
  static async uploadMultipleImagesWithThumbnails(files, productId, supplierId, options = {}) {
    const { replaceExisting = false } = options
    
    try {
      // Detect if there is already a main image (image_order = 0) persisted
      let hasMain = false
      try {
        const { data: existing } = await supabase
          .from('product_images')
          .select('id')
          .eq('product_id', productId)
          .eq('image_order', 0)
          .limit(1)
        hasMain = !!existing && existing.length > 0
      } catch (_) {}

      // Si replaceExisting es true, limpiar todas las imágenes del producto primero
      if (replaceExisting) {
        try {
          const cleanupResult = await StorageCleanupService.deleteAllProductImages(productId)
        } catch (cleanupError) {
          console.warn('⚠️ [uploadMultipleImages] Error en limpieza (continuando):', cleanupError.message)
          // No fallar por errores de limpieza, continuar con el upload
        }
      }
      // En modo reemplazo, crear referencias para archivos existentes
      if (replaceExisting) {
        const existingFiles = files.filter(file => file.isExisting || (file.file && file.file.size === 0))
        const newFiles = files.filter(file => !(file.isExisting || (file.file && file.file.size === 0)))
        // Crear referencias para archivos existentes EN PARALELO
        const referencePromises = existingFiles.map(async (file, index) => {
          if (file.url) {
            const { error: dbInsertError } = await supabase
              .from('product_images')
              .insert({
                product_id: productId,
                image_url: file.url,
                thumbnail_url: null,
                thumbnails: null,
                image_order: index // Usar índice del array
              })
            if (dbInsertError) {
              console.error('❌ [uploadMultipleImages] Error recreando referencia:', dbInsertError.message)
              return { success: false, error: dbInsertError.message }
            } else {
              return { success: true }
            }
          }
          return { success: false, error: 'No URL provided' }
        })
        // Esperar a que todas las referencias se creen
        await Promise.allSettled(referencePromises)
        // Procesar solo archivos nuevos
        const filesToProcess = newFiles
        if (filesToProcess.length === 0) {
          return {
            success: true,
            data: [],
            message: `Referencias recreadas: ${existingFiles.length}`
          }
        }
        // Subir archivos nuevos preservando orden: primera imagen SIEMPRE primero (garantiza image_order=0)
        const results = []
        if (filesToProcess.length > 0) {
          // Primera (main) secuencial
          const firstRes = await this.uploadImageWithThumbnail(filesToProcess[0], productId, supplierId, true)
          results.push({ status: 'fulfilled', value: firstRes })
        }
        if (filesToProcess.length > 1) {
          const parallel = await Promise.allSettled(
            filesToProcess.slice(1).map(f => this.uploadImageWithThumbnail(f, productId, supplierId, false))
          )
          results.push(...parallel)
        }
        const successful = []
        const errors = []
        results.forEach((result, idx) => {
          if (result.status === 'fulfilled' && result.value?.success) {
            successful.push(result.value.data)
          } else {
            const errorMsg = result.status === 'rejected' 
              ? (result.reason?.message || 'Error desconocido')
              : (result.value?.error || 'Error de procesamiento')
            const fileRef = filesToProcess[idx]
            errors.push(`Archivo ${fileRef?.name || fileRef?.file?.name}: ${errorMsg}`)
          }
        })
          // 🔔 Dispatch evento global cuando haya al menos una subida exitosa
          if (successful.length > 0) {
            this.dispatchProductImagesReady(productId, { count: successful.length, mode: 'multiple', mainUpdated: successful.some(img => img.isMain) })
          }
        return {
          success: successful.length > 0 || existingFiles.length > 0,
          data: successful,
          errors: errors.length > 0 ? errors : undefined,
          message: `Nuevos: ${successful.length}, Referencias: ${existingFiles.length}`
        }
      }
      // MODO NORMAL: Filtrar imágenes existentes para no procesarlas
      const newFiles = files.filter(file => {
        // Si tiene isExisting o si el file.size es 0 (marcador de existente), saltarlo
        const isExisting = file.isExisting || (file.file && file.file.size === 0);
        return !isExisting;
      });
      // Si no hay archivos nuevos que subir, retornar éxito
      if (newFiles.length === 0) {
        return {
          success: true,
          data: [],
          message: 'No hay archivos nuevos que procesar'
        };
      }
      // Subida determinista: primera nueva (si no había main) se sube primero para asegurar orden 0
      const results = []
      if (newFiles.length > 0) {
        const firstShouldBeMain = !hasMain
        const firstRes = await this.uploadImageWithThumbnail(newFiles[0], productId, supplierId, firstShouldBeMain)
        results.push({ status: 'fulfilled', value: firstRes })
      }
      if (newFiles.length > 1) {
        const parallel = await Promise.allSettled(
          newFiles.slice(1).map(f => this.uploadImageWithThumbnail(f, productId, supplierId, false))
        )
        results.push(...parallel)
      }
      const successful = []
      const errors = []
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value?.success) {
          successful.push(result.value.data)
        } else {
          const errorMsg = result.status === 'rejected' 
            ? (result.reason?.message || 'Error desconocido')
            : (result.value?.error || 'Error de procesamiento')
          const fileRef = newFiles[idx]
          errors.push(`Archivo ${fileRef?.name || fileRef?.file?.name}: ${errorMsg}`)
        }
      })
        // 🔔 Dispatch evento global cuando haya al menos una subida exitosa
        if (successful.length > 0) {
          this.dispatchProductImagesReady(productId, { count: successful.length, mode: 'multiple', mainUpdated: successful.some(img => img.isMain) })
        }
      return {
        success: successful.length > 0 || files.length > newFiles.length, // Éxito si subió algo O si había existentes
        data: successful,
        errors: errors.length > 0 ? errors : undefined,
      }
    } catch (error) {
      return { success: false, errors: ['Error inesperado al subir imágenes'] }
    }
  }

  /**
   * 🔐 Reemplazo atómico y robusto de TODAS las imágenes de un producto.
   * Estrategia:
   * 1. Sube todos los archivos (genera URLs) SIN tocar BD todavía.
   * 2. Ejecuta función SQL replace_product_images(p_product_id, p_supplier_id, p_image_urls[]) que:
   *    - Borra filas previas
   *    - Inserta nuevas en orden (0..n) garantizando single main y constraints
   * 3. Genera thumbnail SOLO para image_order=0 si no es webp.
   * 4. Limpia en background archivos huérfanos si se pasa { cleanup: true }.
   */
  static async replaceAllProductImages(files, productId, supplierId, opts = {}) {
    const { cleanup = true } = opts
    try {
      if (!files || files.length === 0) {
        // Reemplazo a vacío -> borra todas
        await supabase.from('product_images').delete().eq('product_id', productId)
  // Fase inicial (modelo phased canónico)
  this._dispatchPhase(productId, 'base_insert', { count: 0, mode: 'replace' })
        return { success: true, data: [] }
      }
  thumbsLog('REPLACE_START', {
        productId,
        totalIncoming: files.length,
        sample: files.slice(0,3).map(f => ({
          hasFile: !!f?.file,
          name: f?.file?.name || f?.name || 'n/a',
          isExisting: !!f?.isExisting,
          hasUrl: !!f?.url,
          type: f?.file?.type || f?.type || 'unknown'
        }))
      })

      // Clasificar entradas en EXISTENTES vs NUEVAS manteniendo orden original
      const orderedEntries = [] // { kind: 'existing'|'new', url, uploadData?, originalIndex }
      for (let idx = 0; idx < files.length; idx++) {
        const item = files[idx]
        const isExisting = item?.isExisting === true || (!!item?.url && !item?.file)
        if (isExisting) {
          const existingUrl = item.url || item.image_url || item.publicUrl
          if (!existingUrl) {
            console.warn('⚠️ [replaceAllProductImages] Entrada marcada existing sin URL, se ignora índice', idx)
            continue
          }
          orderedEntries.push({ kind: 'existing', url: existingUrl, originalIndex: idx })
        } else {
          const actualFile = item?.file || item
          if (!actualFile || !actualFile.name || !actualFile.type) {
            console.error('❌ [replaceAllProductImages] Entrada no válida para upload en índice', idx, item)
            return { success: false, error: 'Entrada de imagen no válida (faltan metadatos de archivo)' }
          }
          const uploadRes = await this.uploadImage(actualFile, productId, supplierId)
          if (!uploadRes.success) {
            console.error('❌ [replaceAllProductImages] Falló upload índice', idx, uploadRes.error)
            return { success: false, error: uploadRes.error }
          }
          orderedEntries.push({ kind: 'new', url: uploadRes.data.publicUrl, uploadData: uploadRes.data, originalIndex: idx })
        }
      }

      // Determinar main esperada: la PRIMERA entrada válida conservando intención del usuario
      const expectedMainEntry = orderedEntries[0]
      if (!expectedMainEntry) {
        return { success: false, error: 'No se encontró ninguna entrada de imagen válida (todas inválidas)' }
      }
      const expectedMainUrl = expectedMainEntry.url

      if (orderedEntries.length === 0) {
        // Nada válido -> eliminar todas
        await supabase.from('product_images').delete().eq('product_id', productId)
        this.dispatchProductImagesReady(productId, { count: 0, mode: 'replace' })
        return { success: true, data: [] }
      }

      const orderedUrls = orderedEntries.map(e => e.url)
  thumbsLog('REPLACE_RPC_CALL', { productId, count: orderedUrls.length })

      // RPC reemplazo atómico (usa función que preserva thumbnails si firma igual cuando está habilitado signature)
      const rpcName = FeatureFlags.ENABLE_SIGNATURE_COLUMN ? 'replace_product_images_preserve_thumbs' : 'replace_product_images'
      const { data: replacedRows, error: replaceErr } = await supabase.rpc(rpcName, {
        p_product_id: productId,
        p_supplier_id: supplierId,
        p_image_urls: orderedUrls
      })
      if (replaceErr) {
        console.error('❌ [replaceAllProductImages] RPC error:', replaceErr, { rpcName })
        return { success: false, error: replaceErr.message }
      }

      // Post-verificación: reconsultar filas para validar orden y cardinalidad
      let verifiedRows = replacedRows
      try {
        const { data: recheck, error: reErr } = await supabase
          .from('product_images')
          .select('id,image_url,image_order')
          .eq('product_id', productId)
          .order('image_order', { ascending: true })
        if (!reErr && Array.isArray(recheck)) {
          verifiedRows = recheck
          // Validar secuencia 0..n-1
          const sequenceOk = recheck.every((r, idx) => r.image_order === idx)
          if (!sequenceOk) {
            console.error('❌ [replaceAllProductImages] Secuencia image_order inconsistente', recheck)
          }
          // Validar cardinalidad
          if (recheck.length !== orderedUrls.length) {
            console.error('❌ [replaceAllProductImages] Cardinalidad inesperada', { esperado: orderedUrls.length, real: recheck.length })
          }
        }
      } catch (vErr) {
        console.warn('⚠️ [replaceAllProductImages] Verificación post-replace falló:', vErr.message)
      }

      // Verificar que la imagen principal real coincide con la esperada; si no, SWAP seguro
      try {
        if (verifiedRows && verifiedRows.length > 0 && verifiedRows[0].image_url !== expectedMainUrl) {
          const currentMain = verifiedRows[0]
            const expectedIdx = verifiedRows.findIndex(r => r.image_url === expectedMainUrl)
          if (expectedIdx > -1) {
            const expectedRow = verifiedRows[expectedIdx]
            thumbsLog('MAIN_SWAP', {
              currentMain: currentMain.image_url, expectedMain: expectedMainUrl, expectedIdx
            })
            // Swap en 3 pasos para respetar índice único (image_order=0)
            await supabase.from('product_images').update({ image_order: -1 }).eq('id', expectedRow.id)
            await supabase.from('product_images').update({ image_order: expectedRow.image_order }).eq('id', currentMain.id)
            await supabase.from('product_images').update({ image_order: 0 }).eq('id', expectedRow.id)
            // Reconsultar filas ordenadas
            const { data: afterSwap } = await supabase
              .from('product_images')
              .select('id,image_url,image_order')
              .eq('product_id', productId)
              .order('image_order', { ascending: true })
            if (afterSwap) verifiedRows = afterSwap
          }
        }
      } catch (swapErr) {
        console.error('❌ [replaceAllProductImages] Error corrigiendo main:', swapErr.message)
      }

  this._dispatchPhase(productId, 'base_insert', { count: verifiedRows?.length || 0, mode: 'replace', mainUpdated: true })

  if ((verifiedRows?.length || 0) > 0) {
        this._ensureMainThumbnails(productId, supplierId, verifiedRows[0].image_url)
          .then(result => {
            // Propagar posible staleDetected (si Edge enforcement aplicado) en evento final
            if (result.status === 'ready') this._dispatchPhase(productId, 'thumbnails_ready', result)
            else if (result.status === 'skipped_webp') this._dispatchPhase(productId, 'thumbnails_skipped_webp', result)
            else if (result.status === 'partial') this._dispatchPhase(productId, 'thumbnails_partial', result)
            else this._dispatchPhase(productId, 'thumbnails_failed', result)
            if (['ready','partial'].includes(result.status)) {
              setTimeout(()=>this._autoRepairIf404(productId, supplierId), 1500)
      // Iniciar grace period para cleanup (45s)
      try { StorageCleanupService.markRecentGeneration(productId, 45000) } catch(_){}
            }
          })
          .catch(err => {
            recordMetric('generation_result', { productId, outcome: 'exception', error: err?.message })
            this._dispatchPhase(productId, 'thumbnails_failed', { error: err?.message })
          })
      }

  if (cleanup) {
        // Opcional: retrasar cleanup hasta fase final si flag activo
        if (FeatureFlags.ENABLE_DELAYED_CLEANUP) {
          // Esperar a que fase final se emita (listener simple con timeout de seguridad)
          const listener = (ev) => {
            if (ev?.detail?.productId === productId && ['thumbnails_ready','thumbnails_skipped_webp','thumbnails_partial','thumbnails_failed'].includes(ev?.detail?.phase)) {
              window.removeEventListener('productImagesReady', listener)
              setTimeout(() => StorageCleanupService.cleanupProductOrphans(productId).catch(err => {
                recordMetric('cleanup_error', { productId, error: err?.message })
              }), 25)
            }
          }
          try { window.addEventListener('productImagesReady', listener) } catch(_) { /* noop */ }
          // Fallback: si no llega evento en 8s, ejecutar cleanup
          setTimeout(() => {
            try { window.removeEventListener('productImagesReady', listener) } catch(_) {}
            StorageCleanupService.cleanupProductOrphans(productId).catch(err => {
              recordMetric('cleanup_error', { productId, error: err?.message, fallback: true })
            })
          }, 8000)
        } else {
          // Programar cleanup tras grace period (45s + buffer)
          setTimeout(() => {
            StorageCleanupService.cleanupProductOrphans(productId).catch(err => {
              recordMetric('cleanup_error', { productId, error: err?.message, delayed: true })
            })
          }, 46000)
        }
      }

  thumbsLog('REPLACE_DONE', { total: verifiedRows?.length, productId })
      return { success: true, data: verifiedRows }
    } catch (e) {
      return { success: false, error: e.message }
    }
  }

  /**
   * ✅ NUEVO: Subir una imagen individual con generación automática de thumbnail
   * @param {File} file - Archivo de imagen a subir
   * @param {string} productId - ID del producto
   * @param {string} supplierId - ID del proveedor
   * @param {boolean} isMainImage - Si es la imagen principal (para generar thumbnails)
   * @param {Object} options - Opciones adicionales
   * @param {boolean} options.replaceExisting - Si debe limpiar imágenes existentes antes
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  static async uploadImageWithThumbnail(file, productId, supplierId, isMainImage = false, options = {}) {
    const { replaceExisting = false } = options
    

    try {
      // 🔥 REMOVIDO: Limpieza duplicada (ya se hace en uploadMultipleImagesWithThumbnails)

      // 🔥 CRÍTICO: Manejar objetos wrapper del ImageUploader
      const actualFile = file?.file || file // Si es wrapper, usar file.file, sino usar file directamente
      
      // 1. Validaciones
      if (!actualFile) {
        console.error('❌ [uploadImageWithThumbnail] No se proporcionó archivo')
        return { success: false, error: 'No se proporcionó archivo' }
      }

      if (!actualFile.type || !actualFile.type.startsWith('image/')) {
        console.error('❌ [uploadImageWithThumbnail] Tipo de archivo inválido:', actualFile.type)
        return { success: false, error: 'Solo se permiten archivos de imagen' }
      }

      if (actualFile.size > this.MAX_IMAGE_SIZE) {
        console.error('❌ [uploadImageWithThumbnail] Archivo muy grande:', actualFile.size, 'vs', this.MAX_IMAGE_SIZE)
        return { success: false, error: 'La imagen debe ser menor a 2MB' }
      }

  // 2. Generar nombre único del archivo (timestamp + sufijo aleatorio + nombre saneado)
  const timestamp = Date.now()
  const rand = (crypto?.randomUUID ? crypto.randomUUID().slice(0,8) : Math.random().toString(36).slice(2,10))
  const safeName = actualFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const fileName = `${supplierId}/${productId}/${timestamp}_${rand}_${safeName}`
      
      // 🔥 REMOVIDO: Verificación de bucket (innecesaria para cada imagen)

      const { data, error } = await supabase.storage
        .from(this.IMAGE_BUCKET)
        .upload(fileName, actualFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        console.error('❌ [uploadImageWithThumbnail] Error en upload:', error)
        return { success: false, error: error.message }
      }

      // 4. Obtener URL pública de la imagen original
      const { data: publicUrlData } = supabase.storage
        .from(this.IMAGE_BUCKET)
        .getPublicUrl(fileName)

      
      // Insert atómico del registro y obtención del orden mediante RPC
      let imageOrder = 0
      try {
        const { data: rpcResult, error: rpcError } = await supabase.rpc('insert_image_with_order', {
          p_product_id: productId,
          p_image_url: publicUrlData.publicUrl,
          p_supplier_id: supplierId
        })
        if (rpcError) {
          console.error('❌ [uploadImageWithThumbnail] Error RPC insert_image_with_order:', rpcError.message)
        } else {
          imageOrder = rpcResult ?? 0
        }
      } catch (rpcCatch) {
        console.error('❌ [uploadImageWithThumbnail] Excepción RPC:', rpcCatch)
      }

  // 5. Generar thumbnail usando Edge Function (solo si el orden REAL es 0)
  let thumbnailUrl = null
  const effectiveIsMain = imageOrder === 0
  if (effectiveIsMain) {
        // Skip thumbnail generation for WebP images since Edge Function doesn't support them
        if (actualFile.type !== 'image/webp') {
          try {
            // 🔥 MEJORA: Usar generateThumbnailWithRetry en lugar de generateThumbnail
            const thumbnailResult = await this.generateThumbnailWithRetry(publicUrlData.publicUrl, productId, supplierId, { maxRetries: 2 })
            if (thumbnailResult.success) {
              thumbnailUrl = thumbnailResult.thumbnailUrl
              // Iniciar grace period porque se generarán variantes
              try { StorageCleanupService.markRecentGeneration(productId, 45000) } catch(_){}
              
              // Log si fue necesario retry
              if (thumbnailResult.wasRetried) {
                console.info(`✅ [uploadImageWithThumbnail] Thumbnail generado exitosamente después de ${thumbnailResult.attemptUsed} intentos`)
              }
            } else {
              console.warn(`⚠️ [uploadImageWithThumbnail] Falló generación de thumbnail después de ${thumbnailResult.attemptUsed} intentos:`, thumbnailResult.error)
            }
          } catch (thumbnailError) {
            console.error('❌ [uploadImageWithThumbnail] Error crítico en generación de thumbnail:', thumbnailError)
            // Continue without thumbnail if generation fails
          }
        }
      }

      return {
        success: true,
        data: {
          id: data.id || fileName,
          fileName: actualFile.name,
          filePath: fileName,
          publicUrl: publicUrlData.publicUrl,
          thumbnailUrl: thumbnailUrl, // ✅ NUEVO: URL del thumbnail
          size: actualFile.size,
          type: actualFile.type,
          uploadedAt: new Date().toISOString(),
          imageOrder,
          isMain: imageOrder === 0,
        },
      }
    } catch (error) {
      // Logging detallado para debugging
      const actualFile = file?.file || file
      console.error('🔥 [uploadImageWithThumbnail] Error detallado:', {
        fileName: actualFile?.name,
        fileSize: actualFile?.size,
        fileType: actualFile?.type,
        isWrapper: !!file?.file,
        productId,
        supplierId,
        errorMessage: error?.message,
        errorStack: error?.stack,
        errorName: error?.name
      })
      
      return { 
        success: false, 
        error: `Error al subir imagen ${actualFile?.name}: ${error?.message || error || 'Error desconocido'}` 
      }
    }
  }

  /**
   * ✅ NUEVO: Generar thumbnail con retry logic para mayor robustez
   * @param {string} imageUrl - URL de la imagen original
   * @param {string} productId - ID del producto
   * @param {string} supplierId - ID del proveedor
   * @param {object} options - { force, maxRetries }
   * @returns {Promise<{success: boolean, thumbnailUrl?: string, error?: string}>}
   */
  static async generateThumbnailWithRetry(imageUrl, productId, supplierId, options = {}) {
    const { force = false, maxRetries = 2 } = options;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.generateThumbnail(imageUrl, productId, supplierId, { force })
        if (result.success) {
          return {
            ...result,
            attemptUsed: attempt,
            wasRetried: attempt > 1
          }
        }
        
        // Si falló pero no es el último intento, esperar antes de reintentar
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 3000) // 2s, 3s max
          console.warn(`🔄 [generateThumbnailWithRetry] Intento ${attempt} falló, reintentando en ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      } catch (error) {
        console.error(`❌ [generateThumbnailWithRetry] Error en intento ${attempt}:`, error.message)
        if (attempt === maxRetries) {
          return { 
            success: false, 
            error: `Max retries (${maxRetries}) exceeded: ${error.message}`,
            attemptUsed: attempt
          }
        }
        // Esperar antes del siguiente intento
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 3000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    return { 
      success: false, 
      error: 'Max retries exceeded without success',
      attemptUsed: maxRetries
    }
  }

  /**
   * ✅ ORIGINAL: Generar thumbnail usando Edge Function (solo para imagen principal)
   * @param {string} imageUrl - URL de la imagen original
   * @param {string} productId - ID del producto
   * @param {string} supplierId - ID del proveedor
   * @returns {Promise<{success: boolean, thumbnailUrl?: string, error?: string}>}
   */
  static async generateThumbnail(imageUrl, productId, supplierId, { force = false } = {}) {
    try {
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/generate-thumbnail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`,
        },
        body: JSON.stringify({
          imageUrl: imageUrl, // Correcto: imageUrl en lugar de imagePath
          productId,
          supplierId,
          force
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Edge Function error: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      if (result.thumbnailUrl) {
        // Programar verificación 404 posterior (auto-repair) ligera
        setTimeout(()=>this._autoRepairIf404(productId, supplierId), 2000)
        return {
          success: true,
          thumbnailUrl: result.thumbnailUrl,
          forced: !!result.forced
        }
      } else {
        return {
          success: false,
          error: 'No thumbnail URL returned from Edge Function',
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * 🔔 Dispatch de evento global para notificar actualización de imágenes de un producto
   * Consumido por UniversalProductImage (listener productImagesReady) para invalidar cache y recargar thumbnails.
   * @param {string} productId
   * @param {object} meta Información adicional (count, mode, mainUpdated, etc.)
   */
  static dispatchProductImagesReady(productId, meta = {}) {
    try {
      if (typeof window === 'undefined' || !productId) return;
      const detail = { productId, timestamp: Date.now(), ...meta };
      window.dispatchEvent(new CustomEvent('productImagesReady', { detail }));
    } catch (e) {
  recordMetric('dispatch_error', { productId, error: e?.message })
    }
  }

  static _dispatchPhase(productId, phase, meta = {}) {
    try {
      if (typeof window === 'undefined' || !productId) return
      const detail = { productId, phase, timestamp: Date.now(), ...meta }
      recordMetric('event_emit', { productId, phase })
      window.dispatchEvent(new CustomEvent('productImagesReady', { detail }))
    } catch (_) { /* noop */ }
  }

  /**
   * Verifica si la URL principal del thumbnail retorna 404 y si es así fuerza regeneración.
   * Usa HEAD para minimizar transferencia. Emite phase 'repair' si se detecta y se intenta regenerar.
   */
  static async _autoRepairIf404(productId, supplierId) {
    try {
      const { data: row } = await supabase
        .from('product_images')
        .select('image_url, thumbnail_url')
        .eq('product_id', productId)
        .eq('image_order', 0)
        .single()
      if (!row || !row.thumbnail_url || !row.image_url) return
      // HEAD check
      const controller = new AbortController()
      const t = setTimeout(()=>controller.abort(), 4000)
      let status = 0
      try {
        const resp = await fetch(row.thumbnail_url, { method: 'HEAD', signal: controller.signal })
        status = resp.status
      } catch (_) { status = 0 }
      clearTimeout(t)
      if (status === 404) {
        recordMetric('generation_start', { productId, reason: 'auto_repair_404' })
        this._dispatchPhase(productId, 'repair', { reason: 'thumbnail_404_detected' })
        // 🔥 MEJORA: Forzar regeneración con retry logic para auto-repair
        const regen = await this.generateThumbnailWithRetry(row.image_url, productId, supplierId, { force: true, maxRetries: 2 })
        recordMetric('generation_result', { productId, outcome: regen?.success ? 'repair_forced_success' : 'repair_forced_failed' })
      }
    } catch (_) { /* noop */ }
  }

  /**
   * 🔄 Garantiza generación de las 4 variantes de thumbnails con reintentos escalonados.
   * Estrategia:
   * 1. Invoca Edge Function si faltan variantes (o todo null)
   * 2. Relee fila principal y verifica presence de desktop/tablet/mobile/minithumb
   * 3. Hasta maxAttempts, con backoff exponencial ligero.
   */
  static async _ensureMainThumbnails(productId, supplierId, mainImageUrl) {
    const BACKOFFS = [250, 750, 2000]
    const resultBase = { productId }
    try {
      recordMetric('generation_start', { productId })
      if (/\.webp($|\?)/i.test(mainImageUrl || '')) {
        recordMetric('generation_result', { productId, outcome: 'skipped_webp' })
        return { ...resultBase, status: 'skipped_webp', reason: 'webp_main_ignored' }
      }
      let lastRow = null
      for (let attempt = 1; attempt <= BACKOFFS.length; attempt++) {
        const { data: mainRow } = await supabase
          .from('product_images')
          .select('id, thumbnails, thumbnail_url, thumbnail_signature')
          .eq('product_id', productId)
          .eq('image_order', 0)
          .single()
        lastRow = mainRow || null
        const hasAll = !!(mainRow && mainRow.thumbnails && mainRow.thumbnails.desktop && mainRow.thumbnails.tablet && mainRow.thumbnails.mobile && mainRow.thumbnails.minithumb && mainRow.thumbnail_url)
        if (hasAll) {
          recordMetric('generation_result', { productId, outcome: 'ready', attempt })
          return { ...resultBase, status: 'ready', attempt, signature: mainRow?.thumbnail_signature || null }
        }
        const hasDesktop = !!(mainRow && mainRow.thumbnails && mainRow.thumbnails.desktop && mainRow.thumbnail_url)
        if (!hasDesktop) {
          // 🔥 MEJORA: Usar generateThumbnailWithRetry para la garantía de generación
          const gen = await this.generateThumbnailWithRetry(mainImageUrl, productId, supplierId, { maxRetries: 1 })
          if (!gen.success) recordMetric('generation_error', { productId, attempt, error: gen.error })
        }
        if (attempt < BACKOFFS.length) await new Promise(r => setTimeout(r, BACKOFFS[attempt - 1]))
      }
      if (lastRow && lastRow.thumbnail_url && lastRow.thumbnails) {
        const variants = ['desktop','tablet','mobile','minithumb']
        const present = variants.filter(v => !!lastRow.thumbnails[v])
        const haveSome = present.length > 0
        const complete = present.length === variants.length
        if (haveSome && !complete) {
          recordMetric('generation_result', { productId, outcome: 'partial', present: present.length })
          return { ...resultBase, status: 'partial', signature: lastRow?.thumbnail_signature || null, presentVariants: present }
        }
      }
      recordMetric('generation_result', { productId, outcome: 'failed' })
      return { ...resultBase, status: 'failed' }
    } catch (err) {
      recordMetric('generation_result', { productId, outcome: 'exception', error: err?.message })
      return { ...resultBase, status: 'failed', error: err?.message }
    }
  }

  /**
   * Crear buckets si no existen (función de inicialización)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async initializeBuckets() {
    try {
      // Verificar y crear bucket para PDFs
      const { data: pdfBuckets } = await supabase.storage.listBuckets()
      const pdfBucketExists = pdfBuckets?.some(
        (bucket) => bucket.name === this.PDF_BUCKET
      )

      if (!pdfBucketExists) {
        const { error: pdfError } = await supabase.storage.createBucket(
          this.PDF_BUCKET,
          {
            public: true,
            allowedMimeTypes: ['application/pdf'],
            fileSizeLimit: this.MAX_PDF_SIZE,
          }
        )
        // No logs
      }

      // Verificar y crear bucket para imágenes
      const imageBucketExists = pdfBuckets?.some(
        (bucket) => bucket.name === this.IMAGE_BUCKET
      )

      if (!imageBucketExists) {
        const { error: imageError } = await supabase.storage.createBucket(
          this.IMAGE_BUCKET,
          {
            public: true,
            allowedMimeTypes: ['image/*'],
            fileSizeLimit: this.MAX_IMAGE_SIZE,
          }
        )
        // No logs
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

export default UploadService
