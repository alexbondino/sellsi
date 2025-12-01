/**
 * useProductHeaderState.js - Hook para manejar el estado del ProductHeader
 *
 * Centraliza toda la lógica de estado de los subcomponentes:
 * - Estados de modales (cotización, contacto)
 * - Estado de texto copiado (feedback visual)
 * - Funciones de utilidad compartidas
 */
import { useState, useCallback } from 'react';

export const useProductHeaderState = () => {
  // Estados de modales
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Estado de texto copiado (para feedback visual)
  // Estructura: { name: false, price: false, allTiers: false }
  const [copied, setCopied] = useState({
    name: false,
    price: false,
    allTiers: false,
  });

  /**
   * Maneja la copia de texto al clipboard con feedback visual
   * @param {string} type - Tipo de contenido copiado ('name', 'price', 'allTiers')
   * @param {string} value - Valor a copiar
   * @returns {Promise<boolean>} - true si se copió exitosamente
   */
  const handleCopy = useCallback(async (type, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(prev => ({ ...prev, [type]: true }));

      // Reset después de 1.2 segundos
      setTimeout(() => {
        setCopied(prev => ({ ...prev, [type]: false }));
      }, 1200);

      return true;
    } catch (err) {
      console.error('Error al copiar texto:', err);
      return false;
    }
  }, []);

  /**
   * Genera el formato CSV de todos los tramos de precio
   * @param {Array} tiers - Array de tramos de precio
   * @returns {string} - Contenido CSV
   */
  const generateTiersCSV = useCallback(tiers => {
    if (!tiers || tiers.length === 0) return '';

    const header = 'Cantidad mínima,Precio unitario';
    const rows = tiers.map(
      tier => `${tier.min_quantity},$${tier.price.toLocaleString('es-CL')}`
    );
    return [header, ...rows].join('\n');
  }, []);

  /**
   * Copia todos los tramos en formato CSV
   * @param {Array} tiers - Array de tramos de precio
   */
  const handleCopyAllTiers = useCallback(
    tiers => {
      if (tiers && tiers.length > 0) {
        const csvContent = generateTiersCSV(tiers);
        handleCopy('allTiers', csvContent);
      }
    },
    [generateTiersCSV, handleCopy]
  );

  /**
   * Abre el modal de cotización
   */
  const openQuotationModal = useCallback(() => {
    setIsQuotationModalOpen(true);
  }, []);

  /**
   * Cierra el modal de cotización
   */
  const closeQuotationModal = useCallback(() => {
    setIsQuotationModalOpen(false);
  }, []);

  /**
   * Abre el modal de contacto
   */
  const openContactModal = useCallback(() => {
    setIsContactModalOpen(true);
  }, []);

  /**
   * Cierra el modal de contacto
   */
  const closeContactModal = useCallback(() => {
    setIsContactModalOpen(false);
  }, []);

  /**
   * Cierra todos los modales
   */
  const closeAllModals = useCallback(() => {
    setIsQuotationModalOpen(false);
    setIsContactModalOpen(false);
  }, []);

  /**
   * Reset completo del estado
   */
  const resetState = useCallback(() => {
    setIsQuotationModalOpen(false);
    setIsContactModalOpen(false);
    setCopied({ name: false, price: false, allTiers: false });
  }, []);

  /**
   * Calcula precio unitario y cantidad por defecto para cotización
   * @param {Object} product - Producto
   * @param {Array} tiers - Tramos de precio
   * @returns {Object} - { defaultQuantity, defaultUnitPrice }
   */
  const getQuotationDefaults = useCallback((product, tiers) => {
    const defaultQuantity = product?.compraMinima || 1;
    let defaultUnitPrice = product?.precio || 0;

    // Si hay tramos, usar el precio del primer tramo o el que corresponda a la cantidad mínima
    if (tiers && tiers.length > 0) {
      const applicableTier =
        tiers.find(tier => tier.min_quantity <= defaultQuantity) || tiers[0];
      defaultUnitPrice = applicableTier.price;
    }

    return { defaultQuantity, defaultUnitPrice };
  }, []);

  return {
    // Estados de modales
    isQuotationModalOpen,
    isContactModalOpen,

    // Estado de copia
    copied,

    // Funciones de copia
    handleCopy,
    handleCopyAllTiers,
    generateTiersCSV,

    // Funciones de modales - Cotización
    openQuotationModal,
    closeQuotationModal,

    // Funciones de modales - Contacto
    openContactModal,
    closeContactModal,

    // Utilidades
    closeAllModals,
    resetState,
    getQuotationDefaults,

    // Helpers
    isAnyModalOpen: isQuotationModalOpen || isContactModalOpen,
  };
};

export default useProductHeaderState;
