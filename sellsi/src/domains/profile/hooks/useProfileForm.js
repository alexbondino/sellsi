import { useState, useEffect } from 'react';
import { mapUserProfileToFormData } from '../../../utils/profileHelpers';

/**
 * Hook personalizado para manejar el estado del formulario de perfil
 * Centraliza la lógica de estado, detección de cambios y actualización de campos
 */
export const useProfileForm = (userProfile) => {
  const [formData, setFormData] = useState({});
  const [initialData, setInitialData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Mapeo BD → FormData cuando cambia userProfile
  useEffect(() => {
    if (userProfile) {
      if (userProfile.shipping_commune !== undefined) {
      } else {
      }
      const userData = mapUserProfileToFormData(userProfile);
      setFormData(userData);
      setInitialData(userData);
    }
  }, [userProfile]);

  // Detección de cambios en el formulario
  useEffect(() => {
    const changed = JSON.stringify(formData) !== JSON.stringify(initialData);
    setHasChanges(changed);
  }, [formData, initialData]);

  /**
   * Actualiza un campo específico del formulario
   * @param {string} field - Nombre del campo
   * @param {any} value - Nuevo valor
   */
  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Actualiza múltiples campos a la vez
   * @param {object} updates - Objeto con los campos a actualizar
   */
  const updateFields = (updates) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  /**
   * Resetea el formulario a los valores iniciales
   */
  const resetForm = () => {
    setFormData(initialData);
    setHasChanges(false);
  };

  /**
   * Actualiza los datos iniciales (después de guardar exitosamente)
   */
  const updateInitialData = (newData = null) => {
    const dataToSet = newData || formData;
    setInitialData(dataToSet);
    setHasChanges(false);
  };

  return {
    formData,
    hasChanges,
    updateField,
    updateFields,
    resetForm,
    updateInitialData
  };
};
