// ============================================================================
// INVOICE STORAGE SERVICE - Upload de facturas (PDF) al bucket 'invoices'
// ============================================================================
import { supabase } from '../supabase'

const MAX_BYTES = 500 * 1024 // 500KB
const ALLOWED_TYPES = ['application/pdf', 'application/x-pdf']

const sanitizeFilename = (name) => {
  return name
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_.-]/g, '')
    .replace(/_+/g, '_')
}

export async function uploadInvoicePDF({ file, supplierId, orderId, userId }) {
  if (!file) throw new Error('Archivo requerido')
  if (!supplierId) throw new Error('supplierId requerido')
  if (!orderId) throw new Error('orderId requerido')

  if (file.size > MAX_BYTES) throw new Error('El archivo excede 500KB')
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Sólo se permiten PDF')

  // Validar magic bytes (sin leer todo el archivo)
  const firstChunk = await file.slice(0, 5).arrayBuffer()
  const signature = new TextDecoder().decode(new Uint8Array(firstChunk))
  if (!signature.startsWith('%PDF-')) throw new Error('Archivo no parece un PDF válido')

  const safeName = sanitizeFilename(file.name || 'factura.pdf') || 'factura.pdf'
  const ts = Date.now()
  const path = `${supplierId}/${orderId}/${ts}_${safeName}`

  const { data, error } = await supabase.storage
    .from('invoices')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'application/pdf'
    })

  if (error) throw new Error(error.message || 'Error subiendo factura')

  // Intentar registrar metadata si existe tabla invoices_meta
  try {
    await supabase.from('invoices_meta').insert({
      user_id: userId || supplierId,
      supplier_id: supplierId,
      order_id: orderId,
      path: data.path,
      filename: file.name,
      size: file.size,
      content_type: file.type
    })
  } catch (_) {
    // Silencioso si la tabla aún no existe
  }

  return { path: data.path }
}

export async function createSignedInvoiceUrl(path, expiresIn = 300) {
  const { data, error } = await supabase.storage.from('invoices').createSignedUrl(path, expiresIn)
  if (error) throw new Error(error.message || 'Error creando URL segura')
  return data.signedUrl
}

export default { uploadInvoicePDF, createSignedInvoiceUrl }
