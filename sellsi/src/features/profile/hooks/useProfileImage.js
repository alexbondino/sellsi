import { useState, useEffect } from 'react';

/**
 * Hook personalizado para manejar la imagen de perfil
 * Gestiona imagen pendiente, preview y cleanup de URLs
 */
export const useProfileImage = (currentImageUrl) => {
  const [pendingImage, setPendingImage] = useState(null);

  // Cleanup de URLs de blob al desmontar o cambiar imagen
  useEffect(() => {
    return () => {
      if (pendingImage?.url) {
        URL.revokeObjectURL(pendingImage.url);
      }
    };
  }, [pendingImage]);

  /**
   * Maneja el cambio de imagen desde el modal
   * @param {object} imageData - Datos de la imagen (file, url, etc.)
   */
  const handleImageChange = (imageData) => {
    // Limpiar imagen pendiente anterior si existe
    if (pendingImage?.url) {
      URL.revokeObjectURL(pendingImage.url);
    }
    
    setPendingImage(imageData);
  };

  /**
   * Obtiene la URL de imagen a mostrar (pendiente o actual)
   * @returns {string|null} - URL de la imagen a mostrar
   */
  const getDisplayImageUrl = () => {
    if (pendingImage?.url) {
      return pendingImage.url; // Mostrar imagen preliminar
    }
    return currentImageUrl; // Mostrar imagen actual de BD
  };

  /**
   * Limpia la imagen pendiente (después de guardar exitosamente)
   */
  const clearPendingImage = () => {
    if (pendingImage?.url) {
      URL.revokeObjectURL(pendingImage.url);
    }
    setPendingImage(null);
  };

  /**
   * Cancela los cambios de imagen sin guardar
   */
  const cancelImageChanges = () => {
    clearPendingImage();
  };

  /**
   * Verifica si hay una imagen pendiente
   * @returns {boolean}
   */
  const hasPendingImage = () => {
    return pendingImage !== null;
  };

  return {
    pendingImage,
    handleImageChange,
    getDisplayImageUrl,
    clearPendingImage,
    cancelImageChanges,
    hasPendingImage
  };
};
