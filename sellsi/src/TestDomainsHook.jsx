/**
 * ============================================================================
 * TEST COMPONENT - AUDITORÍA DOMAINS/useSupplierDashboard.js
 * ============================================================================
 * 
 * Componente de prueba para validar el hook domains/useSupplierDashboard
 * antes de activarlo en ProviderHome.jsx.
 * 
 * USO: 
 * - Importar temporalmente en App.jsx para probar
 * - Verificar que no arroja errores en consola
 * - Confirmar que los datos se cargan correctamente
 */

import React, { useEffect, useState } from 'react'
import { useSupplierDashboard } from '../domains/supplier/hooks/dashboard-management/useSupplierDashboard'

const TestDomainsHook = () => {
  const [testSupplierId, setTestSupplierId] = useState(null)
  
  const {
    products, 
    sales, 
    productStocks, 
    weeklyRequests, 
    loading, 
    error,
    // Nuevos en domains/
    filteredProducts, 
    searchTerm, 
    categoryFilter, 
    sortBy, 
    sortOrder,
    deleting, 
    updating, 
    applyFilters, 
    loadProducts
  } = useSupplierDashboard()

  useEffect(() => {
    // Simular supplier ID de prueba (usar uno real de tu DB)
    setTestSupplierId('00000000-0000-0000-0000-000000000000') // Cambiar por ID real
  }, [])

  useEffect(() => {
    if (testSupplierId && loadProducts) {
      console.log('🧪 TEST: Ejecutando loadProducts...')
      loadProducts(testSupplierId)
    }
  }, [testSupplierId, loadProducts])

  return (
    <div style={{ padding: '20px', border: '2px solid orange', margin: '20px' }}>
      <h2>🧪 AUDITORÍA - domains/useSupplierDashboard</h2>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Estado del Hook:</strong>
        <br />
        Loading: {loading ? 'SÍ' : 'NO'}
        <br />
        Error: {error || 'Ninguno'}
        <br />
        Products: {products?.length || 0}
        <br />
        Sales: {sales?.length || 0}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Nuevas Funcionalidades:</strong>
        <br />
        filteredProducts: {filteredProducts?.length || 0}
        <br />
        searchTerm: {searchTerm || 'vacío'}
        <br />
        categoryFilter: {categoryFilter || 'vacío'}
        <br />
        applyFilters disponible: {applyFilters ? 'SÍ' : 'NO'}
        <br />
        loadProducts disponible: {loadProducts ? 'SÍ' : 'NO'}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Estados de Operaciones:</strong>
        <br />
        deleting: {JSON.stringify(deleting)}
        <br />
        updating: {JSON.stringify(updating)}
      </div>

      {error && (
        <div style={{ color: 'red', background: '#ffe6e6', padding: '10px' }}>
          <strong>❌ ERROR DETECTADO:</strong>
          <br />
          {error}
        </div>
      )}

      {!loading && !error && products?.length > 0 && (
        <div style={{ color: 'green', background: '#e6ffe6', padding: '10px' }}>
          <strong>✅ PRUEBA EXITOSA:</strong>
          <br />
          Hook cargado correctamente con {products.length} productos
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        Supplier ID de prueba: {testSupplierId}
        <br />
        <button onClick={() => setTestSupplierId('supplier-id-real-aqui')}>
          Cambiar Supplier ID
        </button>
      </div>
    </div>
  )
}

export default TestDomainsHook
