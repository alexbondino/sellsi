// src/shared/utils/supplierDocumentTypes.js

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';

/**
 * Obtiene los tipos de documento que un proveedor puede emitir
 * @param {string} supplierId - ID del proveedor
 * @returns {Promise<Array<string>>} Array de tipos de documento habilitados
 */
export const getSupplierDocumentTypes = async (supplierId) => {
  if (!supplierId) return [];
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('document_types')
      .eq('user_id', supplierId)
      .single();
    
    if (error) {
      console.error('Error obteniendo document_types del proveedor:', error);
      return [];
    }
    
    // Filtrar solo los tipos válidos (excluir 'ninguno')
    const documentTypes = data?.document_types || [];
    return documentTypes.filter(type => type !== 'ninguno');
  } catch (error) {
    console.error('Error en getSupplierDocumentTypes:', error);
    return [];
  }
};

/**
 * Filtra las opciones de documento según los tipos disponibles del proveedor
 * @param {Array<string>} supplierDocumentTypes - Tipos de documento del proveedor
 * @returns {Array<Object>} Opciones de documento filtradas para UI
 */
export const getAvailableDocumentOptions = (supplierDocumentTypes = []) => {
  const allOptions = [
    { value: 'boleta', label: 'Boleta' },
    { value: 'factura', label: 'Factura' }
  ];
  
  // Filtrar opciones que el proveedor tiene habilitadas
  const enabledOptions = allOptions.filter(option => 
    supplierDocumentTypes.includes(option.value)
  );
  
  // Solo agregar "ninguno" si no hay otras opciones habilitadas O si explícitamente tiene "ninguno"
  if (enabledOptions.length === 0 || supplierDocumentTypes.includes('ninguno')) {
    enabledOptions.push({ value: 'ninguno', label: 'Ninguno' });
  }
  
  return enabledOptions;
};

/**
 * Obtiene el primer tipo de documento válido como valor por defecto
 * @param {Array<string>} supplierDocumentTypes - Tipos de documento del proveedor
 * @returns {string|null} Primer tipo de documento válido o null si no hay ninguno
 */
export const getDefaultDocumentType = (supplierDocumentTypes = []) => {
  const validTypes = supplierDocumentTypes.filter(type => type !== 'ninguno');
  return validTypes.length > 0 ? validTypes[0] : null;
};

/**
 * Verifica si un proveedor tiene tipos de documento configurados
 * @param {Array<string>} supplierDocumentTypes - Tipos de documento del proveedor
 * @returns {boolean} true si tiene al menos un tipo válido configurado
 */
export const hasValidDocumentTypes = (supplierDocumentTypes = []) => {
  return supplierDocumentTypes.some(type => type !== 'ninguno' && type);
};

/**
 * Hook para obtener y gestionar los tipos de documento de un proveedor
 * @param {string} supplierId - ID del proveedor
 * @returns {Object} Estado y funciones relacionadas con document types
 */
export const useSupplierDocumentTypes = (supplierId) => {
  const [documentTypes, setDocumentTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  console.log('🔍 [useSupplierDocumentTypes] Hook llamado con supplierId:', supplierId);
  
  useEffect(() => {
    if (!supplierId) {
      console.log('🔍 [useSupplierDocumentTypes] No supplierId, limpiando estado');
      setDocumentTypes([]);
      return;
    }
    
    const fetchDocumentTypes = async () => {
      console.log('🔍 [useSupplierDocumentTypes] Iniciando fetch para supplierId:', supplierId);
      setIsLoading(true);
      setError(null);
      
      try {
        const types = await getSupplierDocumentTypes(supplierId);
        console.log('🔍 [useSupplierDocumentTypes] Tipos obtenidos:', types);
        setDocumentTypes(types);
      } catch (err) {
        console.error('🔍 [useSupplierDocumentTypes] Error:', err);
        setError(err.message);
        setDocumentTypes([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDocumentTypes();
  }, [supplierId]);
  
  const availableOptions = useMemo(() => 
    getAvailableDocumentOptions(documentTypes), 
    [documentTypes]
  );
  
  const defaultType = useMemo(() => 
    getDefaultDocumentType(documentTypes), 
    [documentTypes]
  );
  
  const hasValidTypes = useMemo(() => 
    hasValidDocumentTypes(documentTypes), 
    [documentTypes]
  );
  
  return {
    documentTypes,
    availableOptions,
    defaultType,
    hasValidTypes,
    loading: isLoading, // Alias para compatibilidad
    isLoading,
    error
  };
};
