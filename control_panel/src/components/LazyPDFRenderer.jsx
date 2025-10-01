// Lazy loading mejorado para PDFs
import React, { Suspense } from 'react'

// PDF Renderer lazy loading con error boundary
const PDFRenderer = React.lazy(() => 
  import('@react-pdf/renderer').catch(error => {
    console.warn('PDF Renderer no disponible:', error)
    return {
      default: ({ children }) => (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '4px' }}>
          <p>⚠️ Generador de PDF no disponible</p>
          <p>Los PDFs se generarán en el servidor</p>
          {children}
        </div>
      )
    }
  })
)

// Hook para cargar PDF solo cuando se necesite
export const usePDFRenderer = () => {
  const [isLoaded, setIsLoaded] = React.useState(false)
  
  const loadPDF = React.useCallback(() => {
    if (!isLoaded) {
      import('@react-pdf/renderer').then(() => {
        setIsLoaded(true)
      }).catch(error => {
        console.warn('Error cargando PDF renderer:', error)
      })
    }
  }, [isLoaded])
  
  return { loadPDF, isLoaded }
}

// Componente wrapper para PDFs
export const PDFViewer = ({ children, ...props }) => (
  <Suspense fallback={<div>Cargando generador de PDF...</div>}>
    <PDFRenderer {...props}>
      {children}
    </PDFRenderer>
  </Suspense>
)

export default PDFRenderer
