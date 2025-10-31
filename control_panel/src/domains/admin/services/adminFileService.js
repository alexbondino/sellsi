/**
 * 📎 Servicio de Gestión de Archivos Administrativos
 * 
 * Gestiona todas las operaciones de archivos del panel administrativo:
 * - Subida de comprobantes de pago
 * - Subida de adjuntos para rechazos
 * - Validación de archivos
 * - Gestión de storage
 * - Limpieza de archivos huérfanos
 * 
 * @author Panel Administrativo Sellsi
 * @date 21 de Julio de 2025 - Migrado a domains/admin/services/
 */

import { AdminApiService, AUDIT_ACTIONS } from './adminApiService'
import { supabase } from '../../../services/supabase'

// ========================================
// 📤 SUBIDA DE ARCHIVOS
// ========================================

/**
 * Subir comprobante de pago al storage
 * @param {File} file - Archivo a subir
 * @param {string} solicitudId - ID de la solicitud relacionada
 * @param {string} adminId - ID del administrador que sube el archivo
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const subirComprobante = async (file, solicitudId, adminId) => {
  return AdminApiService.executeQuery(async () => {
    // Validar parámetros
    if (!file || !solicitudId) {
      throw new Error('Archivo y ID de solicitud son requeridos')
    }

    // Validar archivo
    const validation = validateFile(file, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'image/webp']
    })

    if (!validation.valid) {
      throw new Error(validation.errors[0])
    }

    // Generar nombre único para el archivo
    const fileExtension = file.name.split('.').pop()
    const fileName = `comprobantes/${solicitudId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`
    
    // Subir archivo a Supabase Storage
    const { data, error } = await supabase.storage
      .from('admin-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      throw new Error(`Error subiendo archivo: ${error.message}`)
    }
    
    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('admin-documents')
      .getPublicUrl(fileName)

    // Registrar acción en auditoría
    if (adminId) {
      await AdminApiService.logAuditAction(adminId, 'upload_comprobante', solicitudId, {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: fileName,
        upload_time: new Date().toISOString()
      })
    }
    
    return { 
      url: urlData.publicUrl,
      fileName: fileName,
      originalName: file.name,
      size: file.size
    }
  }, 'Error subiendo comprobante')
}

/**
 * Subir adjuntos (para rechazos u otros)
 * @param {FileList} files - Archivos a subir
 * @param {string} solicitudId - ID de la solicitud relacionada
 * @param {string} adminId - ID del administrador que sube los archivos
 * @returns {Promise<{success: boolean, urls?: array, error?: string}>}
 */
export const subirAdjuntos = async (files, solicitudId, adminId) => {
  return AdminApiService.executeQuery(async () => {
    if (!files || files.length === 0 || !solicitudId) {
      throw new Error('Archivos y ID de solicitud son requeridos')
    }

    if (files.length > 10) {
      throw new Error('Máximo 10 archivos por operación')
    }

    const urls = []
    const errors = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        // Validar cada archivo
        const validation = validateFile(file, {
          maxSize: 5 * 1024 * 1024, // 5MB
          allowedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'image/webp', 'text/plain']
        })

        if (!validation.valid) {
          errors.push(`Archivo ${file.name}: ${validation.errors[0]}`)
          continue
        }

        // Generar nombre único
        const fileExtension = file.name.split('.').pop()
        const fileName = `adjuntos/${solicitudId}/${Date.now()}_${i}_${Math.random().toString(36).substring(7)}.${fileExtension}`
        
        // Subir archivo
        const { data, error } = await supabase.storage
          .from('admin-documents')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (error) {
          errors.push(`Archivo ${file.name}: Error subiendo - ${error.message}`)
          continue
        }
        
        // Obtener URL pública
        const { data: urlData } = supabase.storage
          .from('admin-documents')
          .getPublicUrl(fileName)
        
        urls.push({
          url: urlData.publicUrl,
          fileName: fileName,
          originalName: file.name,
          size: file.size,
          type: file.type
        })

      } catch (error) {
        errors.push(`Archivo ${file.name}: ${error.message}`)
      }
    }

    // Registrar acción en auditoría
    if (adminId && urls.length > 0) {
      await AdminApiService.logAuditAction(adminId, 'upload_adjuntos', solicitudId, {
        uploaded_count: urls.length,
        failed_count: errors.length,
        total_size: urls.reduce((sum, file) => sum + file.size, 0),
        upload_time: new Date().toISOString()
      })
    }

    if (urls.length === 0 && errors.length > 0) {
      throw new Error(`No se pudo subir ningún archivo: ${errors.join(', ')}`)
    }

    return { 
      urls,
      errors: errors.length > 0 ? errors : undefined,
      uploaded: urls.length,
      failed: errors.length
    }
  }, 'Error subiendo adjuntos')
}

/**
 * Subir archivo genérico al storage administrativo
 * @param {File} file - Archivo a subir
 * @param {string} folder - Carpeta de destino
 * @param {string} adminId - ID del administrador
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const subirArchivoGenerico = async (file, folder, adminId) => {
  return AdminApiService.executeQuery(async () => {
    if (!file || !folder) {
      throw new Error('Archivo y carpeta son requeridos')
    }

    // Sanitizar nombre de carpeta
    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '_')

    // Validar archivo
    const validation = validateFile(file, {
      maxSize: 10 * 1024 * 1024, // 10MB para archivos genéricos
      allowedTypes: [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf', 
        'text/plain', 'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
    })

    if (!validation.valid) {
      throw new Error(validation.errors[0])
    }

    // Generar nombre único
    const fileExtension = file.name.split('.').pop()
    const fileName = `${sanitizedFolder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`
    
    // Subir archivo
    const { data, error } = await supabase.storage
      .from('admin-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      throw new Error(`Error subiendo archivo: ${error.message}`)
    }
    
    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('admin-documents')
      .getPublicUrl(fileName)

    // Registrar acción en auditoría
    if (adminId) {
      await AdminApiService.logAuditAction(adminId, 'upload_file', null, {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        folder: sanitizedFolder,
        storage_path: fileName,
        upload_time: new Date().toISOString()
      })
    }
    
    return { 
      url: urlData.publicUrl,
      fileName: fileName,
      originalName: file.name,
      size: file.size
    }
  }, 'Error subiendo archivo')
}

// ========================================
// 🗑️ ELIMINACIÓN DE ARCHIVOS
// ========================================

/**
 * Eliminar archivo del storage administrativo
 * @param {string} filePath - Ruta del archivo en storage
 * @param {string} adminId - ID del administrador
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const eliminarArchivo = async (filePath, adminId) => {
  return AdminApiService.executeQuery(async () => {
    if (!filePath) {
      throw new Error('Ruta del archivo es requerida')
    }

    // Eliminar archivo de Supabase Storage
    const { error } = await supabase.storage
      .from('admin-documents')
      .remove([filePath])
    
    if (error) {
      throw new Error(`Error eliminando archivo: ${error.message}`)
    }

    // Registrar acción en auditoría
    if (adminId) {
      await AdminApiService.logAuditAction(adminId, 'delete_file', null, {
        file_path: filePath,
        deletion_time: new Date().toISOString()
      })
    }
    
    return { deleted: true }
  }, 'Error eliminando archivo')
}

/**
 * Eliminar múltiples archivos del storage
 * @param {string[]} filePaths - Array de rutas de archivos
 * @param {string} adminId - ID del administrador
 * @returns {Promise<{success: boolean, deleted?: number, errors?: string[], error?: string}>}
 */
export const eliminarMultiplesArchivos = async (filePaths, adminId) => {
  return AdminApiService.executeQuery(async () => {
    if (!filePaths || filePaths.length === 0) {
      throw new Error('Lista de archivos es requerida')
    }

    let deletedCount = 0
    const errors = []

    // Eliminar archivos en lotes de 10
    const batchSize = 10
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize)
      
      try {
        const { error } = await supabase.storage
          .from('admin-documents')
          .remove(batch)
        
        if (error) {
          errors.push(`Error eliminando lote ${Math.floor(i/batchSize) + 1}: ${error.message}`)
        } else {
          deletedCount += batch.length
        }
      } catch (error) {
        errors.push(`Error procesando lote ${Math.floor(i/batchSize) + 1}: ${error.message}`)
      }
    }

    // Registrar acción en auditoría
    if (adminId) {
      await AdminApiService.logAuditAction(adminId, 'delete_multiple_files', null, {
        requested_count: filePaths.length,
        deleted_count: deletedCount,
        errors_count: errors.length,
        deletion_time: new Date().toISOString()
      })
    }

    return {
      deleted: deletedCount,
      errors: errors.length > 0 ? errors : undefined,
      total: filePaths.length
    }
  }, 'Error eliminando archivos múltiples')
}

// ========================================
// 📋 GESTIÓN Y LISTADO
// ========================================

/**
 * Listar archivos en una carpeta del storage administrativo
 * @param {string} folder - Carpeta a listar
 * @param {object} options - Opciones de listado
 * @returns {Promise<{success: boolean, files?: array, error?: string}>}
 */
export const listarArchivos = async (folder = '', options = {}) => {
  return AdminApiService.executeQuery(async () => {
    const { limit = 100, offset = 0 } = options

    const { data, error } = await supabase.storage
      .from('admin-documents')
      .list(folder, {
        limit,
        offset,
        sortBy: { column: 'created_at', order: 'desc' }
      })
    
    if (error) {
      throw new Error(`Error listando archivos: ${error.message}`)
    }

    // Enriquecer datos con URLs públicas
    const filesWithUrls = data.map(file => {
      const filePath = folder ? `${folder}/${file.name}` : file.name
      const { data: urlData } = supabase.storage
        .from('admin-documents')
        .getPublicUrl(filePath)

      return {
        ...file,
        path: filePath,
        url: urlData.publicUrl,
        size_mb: (file.metadata?.size || 0) / (1024 * 1024)
      }
    })
    
    return {
      files: filesWithUrls,
      count: filesWithUrls.length,
      folder
    }
  }, 'Error listando archivos')
}

/**
 * Obtener estadísticas de uso del storage administrativo
 * @returns {Promise<{success: boolean, stats?: object, error?: string}>}
 */
export const getStorageStats = async () => {
  return AdminApiService.executeQuery(async () => {
    // Obtener archivos de las principales carpetas
    const [comprobantes, adjuntos, genericos] = await Promise.allSettled([
      supabase.storage.from('admin-documents').list('comprobantes', { limit: 1000 }),
      supabase.storage.from('admin-documents').list('adjuntos', { limit: 1000 }),
      supabase.storage.from('admin-documents').list('', { limit: 1000 })
    ])

    let totalFiles = 0
    let totalSize = 0
    const byType = {
      comprobantes: { count: 0, size: 0 },
      adjuntos: { count: 0, size: 0 },
      otros: { count: 0, size: 0 }
    }

    // Procesar comprobantes
    if (comprobantes.status === 'fulfilled' && comprobantes.value.data) {
      byType.comprobantes.count = comprobantes.value.data.length
      byType.comprobantes.size = comprobantes.value.data.reduce(
        (sum, file) => sum + (file.metadata?.size || 0), 0
      )
    }

    // Procesar adjuntos
    if (adjuntos.status === 'fulfilled' && adjuntos.value.data) {
      byType.adjuntos.count = adjuntos.value.data.length
      byType.adjuntos.size = adjuntos.value.data.reduce(
        (sum, file) => sum + (file.metadata?.size || 0), 0
      )
    }

    // Procesar archivos genéricos
    if (genericos.status === 'fulfilled' && genericos.value.data) {
      const genericFiles = genericos.value.data.filter(
        file => !file.name.startsWith('comprobantes/') && !file.name.startsWith('adjuntos/')
      )
      byType.otros.count = genericFiles.length
      byType.otros.size = genericFiles.reduce(
        (sum, file) => sum + (file.metadata?.size || 0), 0
      )
    }

    totalFiles = byType.comprobantes.count + byType.adjuntos.count + byType.otros.count
    totalSize = byType.comprobantes.size + byType.adjuntos.size + byType.otros.size

    return {
      total_files: totalFiles,
      total_size_mb: totalSize / (1024 * 1024),
      by_type: {
        comprobantes: {
          count: byType.comprobantes.count,
          size_mb: byType.comprobantes.size / (1024 * 1024)
        },
        adjuntos: {
          count: byType.adjuntos.count,
          size_mb: byType.adjuntos.size / (1024 * 1024)
        },
        otros: {
          count: byType.otros.count,
          size_mb: byType.otros.size / (1024 * 1024)
        }
      }
    }
  }, 'Error obteniendo estadísticas de storage')
}

// ========================================
// 🧹 LIMPIEZA Y MANTENIMIENTO
// ========================================

/**
 * Limpiar archivos huérfanos (no referenciados en BD)
 * @param {string} adminId - ID del administrador que ejecuta la limpieza
 * @returns {Promise<{success: boolean, cleaned?: number, error?: string}>}
 */
export const limpiarArchivosHuerfanos = async (adminId) => {
  return AdminApiService.executeQuery(async () => {
    // TODO: Implementar cuando se tengan las tablas de referencia
    // Por ahora retornamos éxito simulado
    
    // Registrar acción en auditoría
    if (adminId) {
      await AdminApiService.logAuditAction(adminId, 'cleanup_orphaned_files', null, {
        cleanup_time: new Date().toISOString(),
        files_cleaned: 0 // Actualizar cuando se implemente
      })
    }

    return { cleaned: 0 }
  }, 'Error limpiando archivos huérfanos')
}

// ========================================
// ✅ VALIDACIÓN DE ARCHIVOS
// ========================================

/**
 * Validar formato y tamaño de archivo
 * @param {File} file - Archivo a validar
 * @param {object} options - Opciones de validación
 * @returns {{valid: boolean, errors: Array<string>}}
 */
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB por defecto
    allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/webp'],
    allowedExtensions = null
  } = options

  const errors = []
  
  if (!file) {
    errors.push('Archivo es requerido')
    return { valid: false, errors }
  }
  
  // Validar tipo MIME
  if (!allowedTypes.includes(file.type)) {
    errors.push(`Tipo de archivo no permitido. Permitidos: ${allowedTypes.join(', ')}`)
  }
  
  // Validar extensión si se especifica
  if (allowedExtensions) {
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!allowedExtensions.includes(fileExtension)) {
      errors.push(`Extensión no permitida. Permitidas: ${allowedExtensions.join(', ')}`)
    }
  }
  
  // Validar tamaño
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024)
    errors.push(`Archivo demasiado grande. Máximo permitido: ${maxSizeMB.toFixed(1)}MB`)
  }
  
  // Validar tamaño mínimo
  if (file.size < 100) { // 100 bytes mínimo
    errors.push('Archivo demasiado pequeño')
  }
  
  // Validar nombre de archivo
  if (file.name.length > 255) {
    errors.push('Nombre de archivo demasiado largo')
  }
  
  if (!/^[a-zA-Z0-9._-]+$/.test(file.name.replace(/\s/g, '_'))) {
    // Permitir solo caracteres seguros en nombres de archivo
    console.warn('Nombre de archivo contiene caracteres especiales, se sanitizará')
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * Sanitizar nombre de archivo
 * @param {string} fileName - Nombre original del archivo
 * @returns {string} Nombre sanitizado
 */
export const sanitizeFileName = (fileName) => {
  if (!fileName) return 'archivo'
  
  // Remover caracteres peligrosos y espacios
  let sanitized = fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
  
  // Asegurar que no esté vacío
  if (!sanitized) {
    sanitized = 'archivo'
  }
  
  // Limitar longitud
  if (sanitized.length > 100) {
    const extension = sanitized.split('.').pop()
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'))
    sanitized = nameWithoutExt.substring(0, 95) + '.' + extension
  }
  
  return sanitized
}

/**
 * Obtener información detallada de un archivo
 * @param {File} file - Archivo a analizar
 * @returns {object} Información del archivo
 */
export const getFileInfo = (file) => {
  if (!file) return null
  
  return {
    name: file.name,
    size: file.size,
    size_mb: (file.size / (1024 * 1024)).toFixed(2),
    type: file.type,
    extension: file.name.split('.').pop()?.toLowerCase(),
    last_modified: new Date(file.lastModified).toISOString(),
    is_image: file.type.startsWith('image/'),
    is_pdf: file.type === 'application/pdf',
    is_text: file.type.startsWith('text/')
  }
}

// ========================================
// 🔧 ALIASES PARA COMPATIBILIDAD
// ========================================

/**
 * @deprecated Usar validateFile en su lugar
 * Alias para compatibilidad con código legacy
 */
export const validarArchivo = (file) => {
  const tiposPermitidos = ['image/jpeg', 'image/png', 'application/pdf', 'image/webp']
  const tamañoMaximo = 5 * 1024 * 1024 // 5MB
  
  if (!tiposPermitidos.includes(file.type)) {
    return { valido: false, error: 'Tipo de archivo no permitido' }
  }
  
  if (file.size > tamañoMaximo) {
    return { valido: false, error: 'Archivo demasiado grande (máx. 5MB)' }
  }
  
  return { valido: true }
}
