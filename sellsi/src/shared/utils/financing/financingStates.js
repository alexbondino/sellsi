/**
 * ============================================================================
 * FINANCING STATES UTILITIES (SHARED)
 * ============================================================================
 * 
 * Gestión centralizada de estados del flujo de financiamiento.
 * Define estados, categorías de filtro, etiquetas y colores.
 * 
 * COMPARTIDO entre Supplier y Buyer views.
 */

/**
 * Estados del sistema de financiamiento (snake_case)
 */
export const FINANCING_STATES = {
  // Paso 1
  PENDING_SUPPLIER_REVIEW: 'pending_supplier_review',
  REJECTED_BY_SUPPLIER: 'rejected_by_supplier',
  BUYER_SIGNATURE_PENDING: 'buyer_signature_pending',
  CANCELLED_BY_BUYER: 'cancelled_by_buyer',
  
  // Paso 2
  SUPPLIER_SIGNATURE_PENDING: 'supplier_signature_pending',
  CANCELLED_BY_SUPPLIER: 'cancelled_by_supplier',
  
  // Paso 3
  PENDING_SELLSI_APPROVAL: 'pending_sellsi_approval',
  
  // Paso 4
  APPROVED_BY_SELLSI: 'approved_by_sellsi',
  REJECTED_BY_SELLSI: 'rejected_by_sellsi',
};

/**
 * Categorías de filtro
 */
export const FILTER_CATEGORIES = {
  ALL: 'all',
  IN_PROCESS: 'in_process',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  FINALIZED: 'finalized',
};

/**
 * Mapeo de estados a sus configuraciones visuales y metadata
 */
export const STATE_CONFIG = {
  [FINANCING_STATES.PENDING_SUPPLIER_REVIEW]: {
    labelByRole: {
      supplier: 'Pendiente de revisión',
      buyer: 'Pendiente de aprobación',
    },
    color: 'warning',
    step: 1,
    requiresAction: true,
    actions: {
      supplier: ['approve', 'reject'],
      buyer: [],
    },
  },
  [FINANCING_STATES.REJECTED_BY_SUPPLIER]: {
    labelByRole: {
      supplier: 'Solicitud rechazada',
      buyer: 'Solicitud rechazada',
    },
    color: 'error',
    step: 1,
    requiresAction: false,
    actions: {
      supplier: [],
      buyer: ['view_reason'],
    },
    hasReason: true,
  },
  [FINANCING_STATES.BUYER_SIGNATURE_PENDING]: {
    labelByRole: {
      supplier: 'Firma comprador pendiente',
      buyer: 'Pendiente de firma',
    },
    color: 'info',
    step: 1,
    requiresAction: false,
    actions: {
      supplier: [],
      buyer: ['sign', 'cancel'],
    },
  },
  [FINANCING_STATES.CANCELLED_BY_BUYER]: {
    labelByRole: {
      supplier: 'Operación cancelada por el comprador',
      buyer: 'Operación cancelada',
    },
    color: 'default',
    step: 1,
    requiresAction: false,
    actions: {
      supplier: ['view_reason'],
      buyer: [],
    },
    hasReason: true,
  },
  [FINANCING_STATES.SUPPLIER_SIGNATURE_PENDING]: {
    labelByRole: {
      supplier: 'Pendiente de firma',
      buyer: 'Firma proveedor pendiente',
    },
    color: 'warning',
    step: 2,
    requiresAction: true,
    actions: {
      supplier: ['sign', 'cancel'],
      buyer: [],
    },
  },
  [FINANCING_STATES.CANCELLED_BY_SUPPLIER]: {
    labelByRole: {
      supplier: 'Operación cancelada',
      buyer: 'Operación cancelada por el proveedor',
    },
    color: 'default',
    step: 2,
    requiresAction: false,
    actions: {
      supplier: [],
      buyer: ['view_reason'],
    },
    hasReason: true,
  },
  [FINANCING_STATES.PENDING_SELLSI_APPROVAL]: {
    label: 'Firmado por ambas partes, esperando aprobación Sellsi',
    color: 'info',
    step: 3,
    requiresAction: false,
    actions: {
      supplier: [],
      buyer: [],
    },
  },
  [FINANCING_STATES.APPROVED_BY_SELLSI]: {
    label: 'Operación liberada',
    color: 'success',
    step: 4,
    requiresAction: false,
    actions: {
      supplier: [],
      buyer: [],
    },
  },
  [FINANCING_STATES.REJECTED_BY_SELLSI]: {
    label: 'Operación rechazada por Sellsi',
    color: 'error',
    step: 4,
    requiresAction: false,
    actions: {
      supplier: ['view_reason'],
      buyer: ['view_reason'],
    },
    hasReason: true,
  },
};

/**
 * Mapeo de categorías de filtro a estados incluidos
 */
export const FILTER_TO_STATES = {
  [FILTER_CATEGORIES.ALL]: Object.values(FINANCING_STATES),
  
  [FILTER_CATEGORIES.IN_PROCESS]: [
    FINANCING_STATES.PENDING_SUPPLIER_REVIEW,
    FINANCING_STATES.BUYER_SIGNATURE_PENDING,
    FINANCING_STATES.SUPPLIER_SIGNATURE_PENDING,
    FINANCING_STATES.PENDING_SELLSI_APPROVAL,
  ],
  
  [FILTER_CATEGORIES.REJECTED]: [
    FINANCING_STATES.REJECTED_BY_SUPPLIER,
    FINANCING_STATES.REJECTED_BY_SELLSI,
  ],
  
  [FILTER_CATEGORIES.CANCELLED]: [
    FINANCING_STATES.CANCELLED_BY_BUYER,
    FINANCING_STATES.CANCELLED_BY_SUPPLIER,
  ],
  
  [FILTER_CATEGORIES.FINALIZED]: [
    FINANCING_STATES.APPROVED_BY_SELLSI,
  ],
};

/**
 * Obtiene la configuración de un estado
 * @param {string} state - Estado del financiamiento
 * @param {string} role - Rol del usuario ('supplier' | 'buyer') - opcional
 * @returns {object} Configuración del estado
 */
export const getStateConfig = (state, role = null) => {
  const config = STATE_CONFIG[state] || {
    label: state,
    color: 'default',
    step: 0,
    requiresAction: false,
    actions: { supplier: [], buyer: [] },
  };

  // Si existe labelByRole y se especificó un rol, usar ese label
  if (role && config.labelByRole && config.labelByRole[role]) {
    return {
      ...config,
      label: config.labelByRole[role],
    };
  }

  return config;
};

/**
 * Verifica si un estado pertenece a una categoría de filtro
 * @param {string} state - Estado del financiamiento
 * @param {string} filterCategory - Categoría de filtro
 * @returns {boolean}
 */
export const stateMatchesFilter = (state, filterCategory) => {
  if (filterCategory === FILTER_CATEGORIES.ALL) return true;
  const allowedStates = FILTER_TO_STATES[filterCategory] || [];
  return allowedStates.includes(state);
};

/**
 * Obtiene las acciones disponibles para un estado según el rol
 * @param {string} state - Estado del financiamiento
 * @param {string} role - Rol del usuario ('supplier' | 'buyer')
 * @returns {string[]} Array de acciones disponibles
 */
export const getAvailableActions = (state, role = 'supplier') => {
  const config = getStateConfig(state);
  return config.actions?.[role] || [];
};

/**
 * Verifica si un estado requiere mostrar el motivo/razón
 * @param {string} state - Estado del financiamiento
 * @returns {boolean}
 */
export const hasReason = (state) => {
  const config = getStateConfig(state);
  return config.hasReason || false;
};

/**
 * Obtiene el paso del flujo para un estado
 * @param {string} state - Estado del financiamiento
 * @returns {number} Número de paso (1-4)
 */
export const getStateStep = (state) => {
  const config = getStateConfig(state);
  return config.step || 0;
};

/**
 * Verifica si un estado requiere acción del usuario
 * @param {string} state - Estado del financiamiento
 * @returns {boolean}
 */
export const requiresAction = (state) => {
  const config = getStateConfig(state);
  return config.requiresAction || false;
};
