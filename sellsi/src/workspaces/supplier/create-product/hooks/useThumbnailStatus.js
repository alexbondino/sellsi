/**
 * 🔄 Hook para trackear el estado de generación de thumbnails
 * Proporciona feedback visual al usuario sobre el estado de procesamiento de imágenes
 */

import { useState, useEffect, useCallback } from 'react'

export const useThumbnailStatus = (productId = null) => {
  const [status, setStatus] = useState('idle') // idle, processing, ready, error
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  // Manejar eventos de imágenes listas
  const handleImagesReady = useCallback((event) => {
    if (!productId || event.detail.productId !== productId) return
    
    setStatus('ready')
    setProgress(null)
    setError(null)
    setLastUpdate(new Date().toISOString())
    
    console.info('✅ [useThumbnailStatus] Thumbnails listos para producto:', productId)
  }, [productId])

  // Manejar errores de background processing
  const handleBackgroundError = useCallback((event) => {
    if (!productId || event.detail.productId !== productId) return
    
    setStatus('error')
    setError(event.detail.error)
    setLastUpdate(new Date().toISOString())
    
    console.error('❌ [useThumbnailStatus] Error en background para producto:', productId, event.detail.error)
  }, [productId])

  // Configurar listeners
  useEffect(() => {
    if (!productId) return

    window.addEventListener('productImagesReady', handleImagesReady)
    window.addEventListener('productBackgroundError', handleBackgroundError)

    return () => {
      window.removeEventListener('productImagesReady', handleImagesReady)
      window.removeEventListener('productBackgroundError', handleBackgroundError)
    }
  }, [productId, handleImagesReady, handleBackgroundError])

  // Métodos públicos
  const markAsProcessing = useCallback(() => {
    setStatus('processing')
    setProgress(null)
    setError(null)
    setLastUpdate(new Date().toISOString())
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setProgress(null)
    setError(null)
    setLastUpdate(null)
  }, [])

  const isProcessing = status === 'processing'
  const isReady = status === 'ready'
  const hasError = status === 'error'
  const isIdle = status === 'idle'

  return {
    status,
    progress,
    error,
    lastUpdate,
    isProcessing,
    isReady,
    hasError,
    isIdle,
    markAsProcessing,
    reset
  }
}

export default useThumbnailStatus
