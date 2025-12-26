/**
 * ============================================================================
 * PRODUCT SPECIFICATIONS HOOK - GESTIÓN DE ESPECIFICACIONES
 * ============================================================================
 *
 * Hook especializado únicamente en la gestión de especificaciones de productos.
 * Se enfoca en validación, procesamiento y almacenamiento de specs.
 */

import { create } from 'zustand';
import { updateProductSpecifications } from '../../../workspaces/marketplace';

// Concurrency helpers: per-product tracking (module-level, shared across tests/runtime)
const _inFlightSpecs = new Map()
const _pendingSpecs = new Map()
const _pendingResolvers = new Map()

const useProductSpecifications = create((set, get) => ({
  // ============================================================================
  // ESTADO
  // ============================================================================
  loading: false,
  error: null,
  processingSpecs: {}, // { productId: boolean }

  // ============================================================================
  // OPERACIONES DE ESPECIFICACIONES
  // ============================================================================

  /**
   * Procesar especificaciones del producto
   */
  processProductSpecifications: (productId, specifications) => {
    if (!specifications?.length) {
      return Promise.resolve({ success: true, data: [] })
    }

    // Validate & sanitize input first
    const validatedSpecs = get().validateSpecifications(specifications)

    if (!validatedSpecs.isValid) {
      return Promise.resolve({ success: false, error: `Especificaciones inválidas: ${validatedSpecs.errors.join(', ')}` })
    }

    // Map to service shape and sanitize fields
    const payload = validatedSpecs.data.map(s => ({
      key: s.nombre.trim(),
      value: s.valor.trim(),
      descripcion: s.descripcion ? s.descripcion.trim() : null,
      categoria: s.categoria && s.categoria.trim() ? s.categoria.trim() : 'general',
      unidad: s.unidad ? s.unidad.trim() : null,
    }))

    // Mark processing flag immediately
    set(state => ({ processingSpecs: { ...state.processingSpecs, [productId]: true }, error: null }))

    // Return a promise that resolves when processing (and any pending replacements) finish
    return new Promise(async resolve => {
      // helper to actually call service
      const _callService = async (pl) => {
        try {
          const ok = await updateProductSpecifications(productId, pl)
          return { success: !!ok, data: pl }
        } catch (err) {
          return { success: false, error: err?.message || String(err) }
        }
      }

      // If already processing, replace pending payload (last-write-wins) and register resolver
      if (_inFlightSpecs.has(productId)) {
        _pendingSpecs.set(productId, payload)
        if (!_pendingResolvers.has(productId)) _pendingResolvers.set(productId, [])
        _pendingResolvers.get(productId).push(resolve)
        return
      }

      // Not in flight: start processing loop
      _inFlightSpecs.set(productId, true)

      let currentPayload = payload
      let result = null
      try {
        while (currentPayload) {
          result = await _callService(currentPayload)
          // after running, check if someone queued a replacement
          currentPayload = _pendingSpecs.get(productId)
          if (currentPayload) _pendingSpecs.delete(productId)
        }
      } finally {
        // clear in-flight
        _inFlightSpecs.delete(productId)
        // unset processing flag
        set(state => ({ processingSpecs: { ...state.processingSpecs, [productId]: false } }))

        if (result && !result.success) {
          set(state => ({ error: `Error procesando especificaciones: ${result.error}` }))
        }

        // resolve original caller
        resolve(result)

        // Resolve any resolvers that were waiting for pending replacements with the final result
        if (_pendingResolvers.has(productId)) {
          const resolvers = _pendingResolvers.get(productId)
          _pendingResolvers.delete(productId)
          for (const r of resolvers) r(result)
        }
      }
    })
  },

  /**
   * Validar especificaciones
   */
  validateSpecifications: specifications => {
    const errors = [];
    const validatedSpecs = [];

    for (let i = 0; i < specifications.length; i++) {
      const spec = specifications[i];

      // Validar campos requeridos
      if (
        !spec.nombre ||
        typeof spec.nombre !== 'string' ||
        spec.nombre.trim() === ''
      ) {
        errors.push(`Especificación ${i + 1}: Nombre es requerido`);
        continue;
      }

      if (
        !spec.valor ||
        typeof spec.valor !== 'string' ||
        spec.valor.trim() === ''
      ) {
        errors.push(`Especificación ${i + 1}: Valor es requerido`);
        continue;
      }

      // Validar longitud
      if (spec.nombre.length > 100) {
        errors.push(
          `Especificación ${i + 1}: Nombre muy largo (máximo 100 caracteres)`
        );
      }

      if (spec.valor.length > 500) {
        errors.push(
          `Especificación ${i + 1}: Valor muy largo (máximo 500 caracteres)`
        );
      }

      // Validar caracteres especiales
      const nameRegex = /^[a-zA-Z0-9\s\-_áéíóúÁÉÍÓÚñÑ]+$/;
      if (!nameRegex.test(spec.nombre)) {
        errors.push(
          `Especificación ${i + 1}: Nombre contiene caracteres no válidos`
        );
      }

      // Si pasa validaciones, agregar a la lista
      validatedSpecs.push({
        nombre: spec.nombre.trim(),
        valor: spec.valor.trim(),
        descripcion: spec.descripcion ? spec.descripcion.trim() : null,
        categoria: spec.categoria ? spec.categoria.trim() : 'general',
        unidad: spec.unidad ? spec.unidad.trim() : null,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: validatedSpecs,
    };
  },

  /**
   * Agregar nueva especificación
   */
  addSpecification: async (productId, specification) => {
    try {
      const validationResult = get().validateSpecifications([specification]);

      if (!validationResult.isValid) {
        throw new Error(validationResult.errors[0]);
      }

      // Obtener especificaciones actuales (si existen)
      // y agregar la nueva
      const updatedSpecs = [
        ...(specification.existingSpecs || []),
        validationResult.data[0],
      ];

      return await get().processProductSpecifications(productId, updatedSpecs);
    } catch (error) {
      set({ error: `Error agregando especificación: ${error.message}` });
      return { success: false, error: error.message };
    }
  },

  /**
   * Actualizar especificación existente
   */
  updateSpecification: async (
    productId,
    specIndex,
    updatedSpec,
    existingSpecs = []
  ) => {
    try {
      const validationResult = get().validateSpecifications([updatedSpec]);

      if (!validationResult.isValid) {
        throw new Error(validationResult.errors[0]);
      }

      // Crear nueva lista con la especificación actualizada
      const updatedSpecs = [...existingSpecs];
      updatedSpecs[specIndex] = validationResult.data[0];

      return await get().processProductSpecifications(productId, updatedSpecs);
    } catch (error) {
      set({ error: `Error actualizando especificación: ${error.message}` });
      return { success: false, error: error.message };
    }
  },

  /**
   * Eliminar especificación
   */
  removeSpecification: async (productId, specIndex, existingSpecs = []) => {
    try {
      // Crear nueva lista sin la especificación eliminada
      const updatedSpecs = existingSpecs.filter(
        (_, index) => index !== specIndex
      );

      return await get().processProductSpecifications(productId, updatedSpecs);
    } catch (error) {
      set({ error: `Error eliminando especificación: ${error.message}` });
      return { success: false, error: error.message };
    }
  },

  /**
   * Duplicar especificación
   */
  duplicateSpecification: async (productId, specIndex, existingSpecs = []) => {
    try {
      if (specIndex >= existingSpecs.length) {
        throw new Error('Índice de especificación inválido');
      }

      const specToDuplicate = existingSpecs[specIndex];
      const duplicatedSpec = {
        ...specToDuplicate,
        nombre: `${specToDuplicate.nombre} (Copia)`,
      };

      // Crear nueva lista con la especificación duplicada
      const updatedSpecs = [...existingSpecs, duplicatedSpec];

      return await get().processProductSpecifications(productId, updatedSpecs);
    } catch (error) {
      set({ error: `Error duplicando especificación: ${error.message}` });
      return { success: false, error: error.message };
    }
  },

  /**
   * Validar y limpiar especificaciones masivamente
   */
  bulkValidateAndClean: specifications => {
    const validationResult = get().validateSpecifications(specifications);

    // Eliminar duplicados por nombre
    const uniqueSpecs = [];
    const seenNames = new Set();

    for (const spec of validationResult.data) {
      const normalizedName = spec.nombre.toLowerCase().trim();
      if (!seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        uniqueSpecs.push(spec);
      }
    }

    return {
      isValid: validationResult.isValid,
      errors: validationResult.errors,
      data: uniqueSpecs,
      duplicatesRemoved: validationResult.data.length - uniqueSpecs.length,
    };
  },

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  /**
   * Limpiar errores
   */
  clearError: () => set({ error: null }),

  /**
   * Obtener estado de procesamiento
   */
  isProcessingSpecs: productId => {
    const state = get();
    return state.processingSpecs[productId] || false;
  },

  /**
   * Obtener categorías comunes de especificaciones
   */
  getCommonCategories: () => [
    'general',
    'dimensiones',
    'material',
    'tecnicas',
    'rendimiento',
    'compatibilidad',
    'certificaciones',
    'garantia',
  ],

  /**
   * Obtener unidades comunes
   */
  getCommonUnits: () => [
    'cm',
    'mm',
    'm',
    'kg',
    'g',
    'l',
    'ml',
    'V',
    'A',
    'W',
    'Hz',
    'dB',
    '%',
    '°C',
    'años',
    'meses',
    'días',
  ],

  /**
   * Reset del store
   */
  reset: () => {
    set({
      loading: false,
      error: null,
      processingSpecs: {},
    });
  },
}));

export default useProductSpecifications;
