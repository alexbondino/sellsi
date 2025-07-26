import { useState, useCallback } from 'react';
import { ProductValidator } from '../../../validators/ProductValidator';

/**
 * ============================================================================
 * USE PRODUCT VALIDATION - HOOK PROFESIONAL DE VALIDACIÓN
 * ============================================================================
 * 
 * Hook refactorizado que utiliza el validador centralizado para
 * garantizar consistencia y robustez en todas las validaciones.
 */
export const useProductValidation = () => {
  const [localErrors, setLocalErrors] = useState({});
  const [triedSubmit, setTriedSubmit] = useState(false);

  /**
   * Valida todos los campos del formulario de producto
   * Utiliza el validador centralizado para máxima consistencia
   */
  const validateForm = useCallback((formData) => {
    const validationResult = ProductValidator.validateProduct(formData);
    setLocalErrors(validationResult.errors);
    return validationResult.errors;
  }, []);

  /**
   * Valida un campo específico - versión simplificada
   */
  const validateField = useCallback((fieldName, value, formData = {}) => {
    // Para validación individual, usamos validación completa y extraemos el campo
    const tempFormData = { ...formData, [fieldName]: value };
    const validationResult = ProductValidator.validateProduct(tempFormData);
    const error = validationResult.errors[fieldName] || null;
    
    setLocalErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
    
    return error;
  }, []);

  /**
   * Verifica si el producto está listo para ser guardado
   */
  const isProductValid = useCallback((formData) => {
    const validationResult = ProductValidator.validateProduct(formData);
    return validationResult.isValid;
  }, []);

  /**
   * Resetea los errores de validación
   */
  const resetErrors = useCallback(() => {
    setLocalErrors({});
    setTriedSubmit(false);
  }, []);

  /**
   * Marca que se intentó hacer submit
   */
  const markSubmitAttempt = useCallback(() => {
    setTriedSubmit(true);
  }, []);

  /**
   * Obtiene un resumen de los errores actuales
   */
  const getErrorSummary = useCallback(() => {
    const errorCount = Object.keys(localErrors).length;
    return {
      hasErrors: errorCount > 0,
      errorCount,
      errors: localErrors
    };
  }, [localErrors]);

  return {
    // Estado
    localErrors,
    triedSubmit,
    hasErrors: Object.keys(localErrors).length > 0,
    
    // Métodos de validación
    validateForm,
    validateField,
    isProductValid,
    
    // Utilidades
    resetErrors,
    markSubmitAttempt,
    getErrorSummary,
  };
};
