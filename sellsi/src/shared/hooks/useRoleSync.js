import { useEffect } from 'react';
import { useRole } from '../../infrastructure/providers/RoleProvider';
import { useAuth } from '../../infrastructure/providers/AuthProvider';

/**
 * Hook personalizado para sincronizar el rol del usuario entre diferentes componentes
 * 
 * Este hook se encarga de:
 * 1. Detectar cambios en userProfile.main_supplier
 * 2. Sincronizar automáticamente el currentAppRole en RoleProvider
 * 3. Proporcionar estado de sincronización para debugging
 * 
 * @returns {Object} Estado de sincronización del rol
 */
export const useRoleSync = () => {
  const { currentAppRole, handleRoleChange } = useRole();
  const { userProfile, session } = useAuth();

  // Sincronizar rol cuando userProfile.main_supplier cambia
  useEffect(() => {
    if (userProfile && userProfile.main_supplier !== undefined && session) {
      const profileRole = userProfile.main_supplier ? 'supplier' : 'buyer';
      
      // Solo actualizar si hay diferencia
      if (currentAppRole !== profileRole) {
        // Obtener rol almacenado en localStorage
        let storedRole = null;
        try {
          storedRole = localStorage.getItem('currentAppRole');
        } catch (e) {}
        
        // ✅ SOLO sincronizar si NO hay rol almacenado (primera vez)
        // Si hay rol almacenado, respetar la elección manual del usuario
        if (!storedRole) {
          // Actualizar sin navegación forzada para no interrumpir al usuario
          handleRoleChange(profileRole, { skipNavigation: true });
        }
      }
    }
  }, [userProfile?.main_supplier, currentAppRole, handleRoleChange, session]);

  // Estado derivado para debugging y validación
  const isInSync = userProfile ? 
    (userProfile.main_supplier ? 'supplier' : 'buyer') === currentAppRole : 
    true;

  const profileRole = userProfile?.main_supplier ? 'supplier' : 'buyer';

  return {
    currentRole: currentAppRole,
    profileRole,
    isInSync,
    // Para debugging
    debug: {
      userProfileMainSupplier: userProfile?.main_supplier,
      currentAppRole,
      profileRole,
      hasSession: !!session,
      hasUserProfile: !!userProfile
    }
  };
};

/**
 * Hook simplificado para componentes que solo necesitan saber el rol actual
 */
export const useCurrentRole = () => {
  const { currentAppRole } = useRole();
  const { userProfile } = useAuth();
  
  return {
    role: currentAppRole,
    isBuyer: currentAppRole === 'buyer',
    isSupplier: currentAppRole === 'supplier',
    profileRole: userProfile?.main_supplier ? 'supplier' : 'buyer'
  };
};

export default useRoleSync;
