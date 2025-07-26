import { useState } from 'react';
import { maskSensitiveData } from '../../../utils/profileHelpers';

/**
 * Hook personalizado para manejar campos sensibles con máscara
 * Controla la visibilidad de datos como números de cuenta, RUT, etc.
 */
export const useSensitiveFields = () => {
  const [showSensitiveData, setShowSensitiveData] = useState({
    accountNumber: false,
    transferRut: false,
    billingRut: false,
  });

  /**
   * Alterna la visibilidad de un campo sensible
   * @param {string} field - Nombre del campo
   */
  const toggleSensitiveData = (field) => {
    setShowSensitiveData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  /**
   * Obtiene el valor de un campo sensible (enmascarado o visible)
   * @param {string} field - Nombre del campo
   * @param {string} value - Valor del campo
   * @param {number} showLast - Cantidad de caracteres a mostrar al final
   * @returns {string} - Valor enmascarado o completo
   */
  const getSensitiveFieldValue = (field, value, showLast = 4) => {
    return showSensitiveData[field] ? value : maskSensitiveData(value, showLast);
  };

  /**
   * Verifica si un campo sensible está visible
   * @param {string} field - Nombre del campo
   * @returns {boolean}
   */
  const isFieldVisible = (field) => {
    return showSensitiveData[field];
  };

  /**
   * Oculta todos los campos sensibles
   */
  const hideAllFields = () => {
    setShowSensitiveData({
      accountNumber: false,
      transferRut: false,
      billingRut: false,
    });
  };

  /**
   * Muestra un campo sensible específico
   * @param {string} field - Nombre del campo
   */
  const showField = (field) => {
    setShowSensitiveData(prev => ({
      ...prev,
      [field]: true
    }));
  };

  /**
   * Oculta un campo sensible específico
   * @param {string} field - Nombre del campo
   */
  const hideField = (field) => {
    setShowSensitiveData(prev => ({
      ...prev,
      [field]: false
    }));
  };

  return {
    showSensitiveData,
    toggleSensitiveData,
    getSensitiveFieldValue,
    isFieldVisible,
    hideAllFields,
    showField,
    hideField
  };
};
