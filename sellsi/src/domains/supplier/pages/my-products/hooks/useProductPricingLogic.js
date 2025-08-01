/**
 * ============================================================================
 * useProductPricingLogic - Hook para Manipulación UI de Tramos de Precios
 * ============================================================================
 * 
 * Extrae la lógica compleja de manipulación de tramos desde AddProduct.jsx
 * para mejorar la separación de responsabilidades y reusabilidad.
 * 
 * RESPONSABILIDADES:
 * - Manipulación UI de tramos (cambio de valores, blur events)
 * - Cálculo automático de rangos MIN/MAX
 * - Agregar/Remover tramos con lógica correcta
 * - Validación de constraints de stock vs tramos
 * 
 * @author Refactor - Julio 2025
 */

import { useCallback } from 'react';

/**
 * Hook para manejar toda la lógica de manipulación UI de tramos de precios
 * 
 * @param {Object} formData - Datos del formulario
 * @param {Function} updateField - Función para actualizar campos del formulario
 * @returns {Object} - Handlers para manipulación de tramos
 */
export const useProductPricingLogic = (formData, updateField) => {
  
  /**
   * Maneja cambios en los campos de tramos
   */
  const handleTramoChange = useCallback((index, field, value) => {
    const newTramos = [...formData.tramos];
    newTramos[index] = { ...newTramos[index], [field]: value };
    updateField('tramos', newTramos);
  }, [formData.tramos, updateField]);

  /**
   * Maneja eventos blur con lógica de sincronización automática
   * - Actualiza MIN/MAX automáticamente entre tramos
   * - Valida ranges y corrige valores incorrectos
   * - 🔧 FIX 1: Sincroniza compraMinima con primer tramo
   */
  const handleTramoBlur = useCallback((index, field, value) => {
    const newTramos = [...formData.tramos];
    newTramos[index] = { ...newTramos[index], [field]: value };

    // Si se modifica el MAX del Rango 1, actualizar el MIN del Rango 2 automáticamente
    if (index === 0 && field === 'max' && newTramos[1]) {
      const rango1Max = parseInt(value) || 0;
      const rango2Min = rango1Max + 1;
      newTramos[1] = { ...newTramos[1], min: rango2Min.toString() };
    }

    // 🔧 FIX 1: Si se modifica el MIN del primer tramo, sincronizar con compraMinima
    if (index === 0 && field === 'min') {
      const primerTramoMin = parseInt(value) || 1;
      if (primerTramoMin > 0 && parseInt(formData.compraMinima) !== primerTramoMin) {
        console.log(`🔄 [useProductPricingLogic] Sincronizando compra mínima desde primer tramo: ${formData.compraMinima} -> ${primerTramoMin}`);
        updateField('compraMinima', primerTramoMin.toString());
      }
    }

    // Lógica para rangos 2+: MIN = MAX del rango anterior + 1
    if (index > 0) {
      if (field === 'max' && index > 0) {
        // Validación al salir del campo: Si el nuevo max es menor o igual al min del mismo rango, corregir
        const currentMin = parseInt(newTramos[index].min) || 1;
        const newMax = parseInt(value) || 0;

        if (newMax <= currentMin) {
          // Corregir el max al mínimo + 1
          newTramos[index] = { ...newTramos[index], max: (currentMin + 1).toString() };
        }

        // Cuando se actualiza MAX de un rango 2+, actualizar MIN del siguiente si existe
        if (newTramos[index + 1]) {
          const finalMax = parseInt(newTramos[index].max) || 0;
          const nextMin = finalMax + 1;
          newTramos[index + 1] = { ...newTramos[index + 1], min: nextMin.toString() };
        }
      }

      // Actualizar MIN del rango actual basado en el MAX del rango anterior
      if (index > 0 && newTramos[index - 1]?.max) {
        const prevMax = parseInt(newTramos[index - 1].max) || 0;
        const autoMin = prevMax + 1;
        newTramos[index] = { ...newTramos[index], min: autoMin.toString() };
      } else if (index === 1 && newTramos[0]?.max) {
        // Caso especial para rango 2: MIN = MAX del rango 1 + 1
        const rango1Max = parseInt(newTramos[0].max) || 0;
        const rango2Min = rango1Max + 1;
        newTramos[1] = { ...newTramos[1], min: rango2Min.toString() };
      }
    }

    updateField('tramos', newTramos);
  }, [formData.tramos, formData.compraMinima, updateField]);

  /**
   * Agrega un nuevo tramo con lógica de cálculo automático
   */
  const addTramo = useCallback(() => {
    // Cuando se agrega un nuevo tramo:
    // 1. El tramo anterior (que era el último) ahora debe tener su MAX habilitado y vacío
    // 2. El nuevo tramo será el último con MAX = stock disponible
    
    const lastTramo = formData.tramos[formData.tramos.length - 1];
    const newTramos = [...formData.tramos];
    
    // Si hay un tramo anterior y es del rango 2+, limpiar su MAX para que se habilite
    if (newTramos.length > 1) {
      const previousTramoIndex = newTramos.length - 1;
      newTramos[previousTramoIndex] = { 
        ...newTramos[previousTramoIndex], 
        max: '' // Limpiar MAX para habilitarlo y resaltarlo en rojo
      };
    }
    
    // Calcular MIN para el nuevo tramo
    let newMin = '';
    if (lastTramo && lastTramo.max && lastTramo.max !== '') {
      newMin = (parseInt(lastTramo.max) + 1).toString();
    } else if (lastTramo && lastTramo.min) {
      // Si el tramo anterior no tiene MAX definido, usar MIN + 2
      newMin = (parseInt(lastTramo.min) + 2).toString();
    }
    
    // Agregar el nuevo tramo
    newTramos.push({ 
      min: newMin, 
      max: '', // El último tramo tendrá MAX oculto = stock disponible 
      precio: '' 
    });
    
    updateField('tramos', newTramos);
  }, [formData.tramos, updateField]);

  /**
   * Remueve un tramo (mínimo 2 tramos requeridos)
   */
  const removeTramo = useCallback((index) => {
    // Solo permitir eliminar si hay más de 2 tramos (mínimo debe haber Tramo 1 y Tramo 2)
    if (formData.tramos.length > 2) {
      const newTramos = formData.tramos.filter((_, i) => i !== index);
      updateField('tramos', newTramos);
    }
  }, [formData.tramos, updateField]);

  /**
   * Valida constraints de stock vs tramos cuando cambia el stock
   * Aplica solo para rangos 3, 4 y 5 con pricing type 'Volumen'
   */
  const validateStockConstraints = useCallback((newStock) => {
    if (formData.pricingType === 'Volumen' && formData.tramos.length >= 3) {
      const newStockValue = parseInt(newStock) || 0;
      
      // Filtrar tramos cuyo MIN sea mayor al nuevo stock (solo para rangos 3+)
      const validatedTramos = formData.tramos.filter((tramo, index) => {
        if (index < 2) return true; // Mantener siempre los primeros 2 tramos
        const min = parseInt(tramo.min) || 0;
        return min <= newStockValue;
      });

      // Solo actualizar si cambió la cantidad de tramos
      if (validatedTramos.length !== formData.tramos.length) {
        updateField('tramos', validatedTramos);
      }
    }
  }, [formData.tramos, formData.pricingType, updateField]);

  return {
    handleTramoChange,
    handleTramoBlur,
    addTramo,
    removeTramo,
    validateStockConstraints
  };
};
