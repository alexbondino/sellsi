import { useState, useCallback } from 'react';

/**
 * Hook personalizado para validación de productos
 * Maneja toda la lógica de validación del formulario de productos
 */
export const useProductValidation = () => {
  const [localErrors, setLocalErrors] = useState({});
  const [triedSubmit, setTriedSubmit] = useState(false);

  /**
   * Valida todos los campos del formulario de producto
   * @param {Object} formData - Datos del formulario
   * @returns {Object} Objeto con errores de validación
   */
  const validateForm = useCallback((formData) => {
    const newErrors = {};

    // Validación del nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del producto es requerido';
    } else if (formData.nombre.length > 40) {
      newErrors.nombre = 'Máximo 40 caracteres';
    }

    // Validación de la descripción
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    } else if (formData.descripcion.length > 3000) {
      newErrors.descripcion = 'Máximo 3000 caracteres';
    }

    // Validación de la categoría
    if (!formData.categoria) {
      newErrors.categoria = 'Selecciona una categoría';
    }

    // Validación del stock
    if (!formData.stock) {
      newErrors.stock = 'El stock es requerido';
    } else if (
      parseInt(formData.stock) < 1 ||
      parseInt(formData.stock) > 15000
    ) {
      newErrors.stock = 'Ingrese un número entre 1 y 15.000';
    } else if (!Number.isInteger(parseFloat(formData.stock))) {
      newErrors.stock = 'El stock debe ser un número entero positivo';
    }

    // Validación de la compra mínima
    if (!formData.compraMinima) {
      newErrors.compraMinima = 'La compra mínima es requerida';
    } else if (
      parseInt(formData.compraMinima) < 1 ||
      parseInt(formData.compraMinima) > 15000
    ) {
      newErrors.compraMinima = 'Seleccione un número entre 1 y 15.000';
    } else if (!Number.isInteger(parseFloat(formData.compraMinima))) {
      newErrors.compraMinima = 'La compra mínima debe ser un número entero positivo';
    } else if (
      parseInt(formData.compraMinima) > parseInt(formData.stock || 0)
    ) {
      newErrors.compraMinima =
        'La compra mínima no puede ser mayor al stock disponible';
    }

    // Validación de precios según el tipo
    if (formData.pricingType === 'Por Unidad') {
      if (!formData.precioUnidad || isNaN(Number(formData.precioUnidad))) {
        newErrors.precioUnidad = 'El precio es requerido';
      } else if (parseFloat(formData.precioUnidad) < 1) {
        newErrors.precioUnidad = 'El precio mínimo es 1';
      } else if (!Number.isInteger(parseFloat(formData.precioUnidad))) {
        newErrors.precioUnidad = 'El precio debe ser un número entero positivo';
      }
    } else {
      // Validación para tramos de precio
      const validTramos = formData.tramos.filter(
        t =>
          t.cantidad !== '' &&
          t.precio !== '' &&
          !isNaN(Number(t.cantidad)) &&
          !isNaN(Number(t.precio))
      );

      if (validTramos.length < 2) {
        newErrors.tramos =
          'Debe agregar al menos dos tramos válidos (cantidad y precio definidos)';
      } else {
        // Validar que el primer tramo coincida con la compra mínima
        const compraMinima = parseInt(formData.compraMinima || 0);
        const firstTramo = formData.tramos[0]; // El primer tramo siempre debe ser el Tramo 1
        
        if (!firstTramo || !firstTramo.cantidad || parseInt(firstTramo.cantidad) !== compraMinima) {
          newErrors.tramos =
            'La cantidad del Tramo 1 debe ser igual a la Compra Mínima';
        }

        // Validar que ningún precio de tramo supere los 8 dígitos
        const tramosConPrecioAlto = validTramos.filter(
          t => parseFloat(t.precio) > 99999999
        );
        if (tramosConPrecioAlto.length > 0) {
          newErrors.tramos =
            'Los precios de los tramos no pueden superar los 8 dígitos (99,999,999)';
        } else {
          // Validar que las cantidades de los tramos no excedan el stock
          const stockNumber = parseInt(formData.stock || 0);
          const invalidTramos = validTramos.filter(
            tramo => parseInt(tramo.cantidad) > stockNumber
          );
          if (invalidTramos.length > 0) {
            newErrors.tramos =
              'Las cantidades de los tramos no pueden ser mayores al stock disponible';
          } else {
            // Validar que ningún precio de tramo sea menor a 1
            const tramosConPrecioBajo = validTramos.filter(t => parseFloat(t.precio) < 1);
            if (tramosConPrecioBajo.length > 0) {
              newErrors.tramos = 'El precio mínimo por tramo es 1';
            } else {
              // Validar que las cantidades sean números enteros positivos
              const tramosConCantidadInvalida = validTramos.filter(t => !Number.isInteger(parseFloat(t.cantidad)) || parseInt(t.cantidad) < 1);
              if (tramosConCantidadInvalida.length > 0) {
                newErrors.tramos = 'Las cantidades de los tramos deben ser números enteros positivos';
              }
              // Validar que los precios sean números enteros positivos
              const tramosConPrecioInvalido = validTramos.filter(t => !Number.isInteger(parseFloat(t.precio)) || parseFloat(t.precio) < 1);
              if (tramosConPrecioInvalido.length > 0) {
                newErrors.tramos = 'Los precios de los tramos deben ser números enteros positivos';
              }
            }
          }
        }
      }
    }

    // Validación de imágenes
    if (formData.imagenes.length === 0) {
      newErrors.imagenes = 'Debe agregar al menos una imagen';
    } else if (formData.imagenes.length > 5) {
      newErrors.imagenes = 'Máximo 5 imágenes permitidas';
    } else {
      // Validar tamaño de cada imagen
      const oversizedImages = formData.imagenes.filter(
        img => img.file && img.file.size > 2 * 1024 * 1024
      );
      if (oversizedImages.length > 0) {
        newErrors.imagenes = 'Algunas imágenes exceden el límite de 2MB';
      }
    }

    // Validación opcional para documentos PDF
    if (formData.documentos && formData.documentos.length > 0) {
      const validDocuments = formData.documentos.filter(
        doc =>
          doc.file &&
          doc.file.type === 'application/pdf' &&
          doc.file.size <= 5 * 1024 * 1024
      );
      if (validDocuments.length !== formData.documentos.length) {
        newErrors.documentos = 'Solo se permiten archivos PDF de máximo 5MB';
      }
    }

    // Validación de especificaciones
    if (formData.specifications.some(s => s.key && !s.value)) {
      newErrors.specifications =
        'Completa todos los valores de las especificaciones';
    }

    // Validación de regiones de despacho (obligatorio al menos una)
    if (!formData.shippingRegions || formData.shippingRegions.length === 0) {
      newErrors.shippingRegions = 'Debe configurar al menos una región de despacho';
    }

    setLocalErrors(newErrors);
    return newErrors;
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

  return {
    localErrors,
    triedSubmit,
    validateForm,
    resetErrors,
    markSubmitAttempt,
  };
};
