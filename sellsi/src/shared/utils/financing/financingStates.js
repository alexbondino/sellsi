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
  
  // Estados de financiamientos activos
  EXPIRED: 'expired',
  PAID: 'paid',
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
 * Categorías de filtro para financiamientos aprobados
 * 
 * LÓGICA:
 * - ACTIVE (Vigente): Contrato NO vencido (expires_at >= hoy)
 * - EXPIRED (Vencido): Contrato vencido + deuda pendiente (amount_paid < amount_used)
 * - PAID (Pagado): Contrato vencido + deuda saldada (amount_paid >= amount_used)
 */
export const APPROVED_FILTER_CATEGORIES = {
  ALL: 'all',
  ACTIVE: 'active',       // Vigente: NO vencido
  EXPIRED: 'expired',     // Vencido: vencido + con deuda
  PAID: 'paid',           // Pagado: vencido + sin deuda
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
      buyer: ['cancel'],
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
    label: 'Firmado por ambas partes, esperando\naprobación de Sellsi',
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
  [FINANCING_STATES.EXPIRED]: {
    label: 'Vencido',
    color: 'error',
    step: 5,
    requiresAction: false,
    actions: {
      supplier: [],
      buyer: ['pay_online'],
    },
  },
  [FINANCING_STATES.PAID]: {
    label: 'Pagado',
    color: 'success',
    step: 5,
    requiresAction: false,
    actions: {
      supplier: [],
      buyer: [],
    },
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

/**
 * Calcula el estado de un financiamiento aprobado basándose en fechas y pagos
 * @param {object} financing - Objeto de financiamiento con expires_at, status, amount_used, amount_paid
 * @returns {string} Estado calculado: 'approved_by_sellsi', 'expired', o 'paid'
 * 
 * REGLAS:
 * - Vigente: Contrato NO vencido (expires_at >= hoy)
 * - Vencido: Contrato vencido + monto pagado < monto utilizado
 * - Pagado: Contrato vencido + monto pagado >= monto utilizado
 */
export const getApprovedFinancingStatus = (financing) => {
  // Si el status ya indica que está pagado, retornarlo
  if (financing.status === FINANCING_STATES.PAID) {
    return FINANCING_STATES.PAID;
  }
  
  // Si no está aprobado o expirado, retornar el status actual
  if (financing.status !== FINANCING_STATES.APPROVED_BY_SELLSI && 
      financing.status !== FINANCING_STATES.EXPIRED) {
    return financing.status;
  }
  
  // Verificar si el contrato está vencido
  let isExpired = false;
  if (financing.expires_at) {
    const expiryDate = new Date(financing.expires_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    isExpired = expiryDate < today;
  }
  
  // Si NO está vencido, está VIGENTE
  if (!isExpired) {
    return FINANCING_STATES.APPROVED_BY_SELLSI;
  }
  
  // Contrato vencido: verificar si está pagado
  const amountUsed = Number(financing.amount_used || 0);
  const amountPaid = Number(financing.amount_paid || 0);
  
  // Si monto pagado >= monto utilizado, está PAGADO
  if (amountPaid >= amountUsed) {
    return FINANCING_STATES.PAID;
  }
  
  // Si monto pagado < monto utilizado, está VENCIDO
  return FINANCING_STATES.EXPIRED;
};

/**
 * Obtiene el chip de estado para financiamientos aprobados
 * @param {object} financing - Objeto de financiamiento
 * @returns {object} { label, color }
 */
export const getApprovedFinancingChip = (financing) => {
  // If paused, show paused chip instead of the usual 'Vigente'
  if (financing?.paused) {
    return { label: 'Pausado', color: 'warning' };
  }

  const status = getApprovedFinancingStatus(financing);
  
  switch (status) {
    case FINANCING_STATES.APPROVED_BY_SELLSI:
      return { label: 'Vigente', color: 'primary' };
    case FINANCING_STATES.EXPIRED:
      return { label: 'Vencido', color: 'error' };
    case FINANCING_STATES.PAID:
      return { label: 'Pagado', color: 'success' };
    default:
      return { label: 'Desconocido', color: 'default' };
  }
};

/**
 * Obtiene la categoría de filtro a la que pertenece un estado
 * (para mostrar en chips de estado)
 * @param {string} state - Estado del financiamiento
 * @returns {object} { category, label, color }
 */
export const getStateFilterCategory = (state) => {
  // Buscar en qué categoría está el estado
  if (FILTER_TO_STATES[FILTER_CATEGORIES.IN_PROCESS]?.includes(state)) {
    return {
      category: FILTER_CATEGORIES.IN_PROCESS,
      label: 'En Proceso',
      color: 'warning',
    };
  }
  
  if (FILTER_TO_STATES[FILTER_CATEGORIES.REJECTED]?.includes(state)) {
    return {
      category: FILTER_CATEGORIES.REJECTED,
      label: 'Rechazado',
      color: 'error',
    };
  }
  
  if (FILTER_TO_STATES[FILTER_CATEGORIES.CANCELLED]?.includes(state)) {
    return {
      category: FILTER_CATEGORIES.CANCELLED,
      label: 'Cancelado',
      color: 'default',
    };
  }
  
  if (FILTER_TO_STATES[FILTER_CATEGORIES.FINALIZED]?.includes(state)) {
    return {
      category: FILTER_CATEGORIES.FINALIZED,
      label: 'Aprobado',
      color: 'success',
    };
  }
  
  // Fallback
  return {
    category: FILTER_CATEGORIES.ALL,
    label: 'Desconocido',
    color: 'default',
  };
};

/**
 * Verifica si un financiamiento aprobado coincide con un filtro
 * @param {object} financing - Objeto de financiamiento
 * @param {string} filter - Categoría de filtro ('all', 'active', 'expired', 'paid')
 * @returns {boolean}
 */
export const approvedFinancingMatchesFilter = (financing, filter) => {
  if (filter === APPROVED_FILTER_CATEGORIES.ALL) return true;
  
  const status = getApprovedFinancingStatus(financing);
  
  switch (filter) {
    case APPROVED_FILTER_CATEGORIES.ACTIVE:
      return status === FINANCING_STATES.APPROVED_BY_SELLSI;
    case APPROVED_FILTER_CATEGORIES.EXPIRED:
      return status === FINANCING_STATES.EXPIRED;
    case APPROVED_FILTER_CATEGORIES.PAID:
      return status === FINANCING_STATES.PAID;
    default:
      return true;
  }
};
