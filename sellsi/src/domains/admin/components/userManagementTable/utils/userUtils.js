// Utility helpers extracted from UserManagementTable (pure functions / stable)
export function getUserStatus(user) {
  if (user.banned === true) return 'banned';
  if (user.is_active === false) return 'inactive';
  return 'active';
}

export function getUserActiveProducts(user) {
  return user.active_products_count || 0;
}

export function getCurrentAdminId() {
  try {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      const user = JSON.parse(adminUser);
      return user.id;
    }
    return null;
  } catch (error) {
    console.error('Error getting admin ID:', error);
    return null;
  }
}
