// Constants extracted from UserManagementTable (no behavior change)
export const USER_STATUS = {
  active: { color: 'success', icon: '✅', label: 'Activo' },
  banned: { color: 'error', icon: '🚫', label: 'Baneado' },
  inactive: { color: 'warning', icon: '⏸️', label: 'Inactivo' }
};

export const USER_FILTERS = [
  { value: 'all', label: 'Todos los usuarios' },
  { value: 'active', label: 'Usuarios activos' },
  { value: 'banned', label: 'Usuarios baneados' },
  { value: 'inactive', label: 'Usuarios inactivos' },
  { value: 'suppliers', label: 'Solo proveedores' },
  { value: 'buyers', label: 'Solo compradores' },
  { value: 'verified', label: 'Solo verificados' }
];
