import { useState, useEffect, useRef } from 'react';
import { getUserProfile } from '../services/user';

/**
 * Hook para manejar la región de envío del usuario
 * - localStorage para performance y sincronización local
 * - Polling ligero para detectar cambios entre dispositivos
 * - Fallback a base de datos si no existe en localStorage
 */
export const useUserShippingRegion = () => {
  const [userRegion, setUserRegion] = useState(null);
  const [isLoadingUserRegion, setIsLoadingUserRegion] = useState(true);
  const intervalRef = useRef(null);
  const userIdRef = useRef(null);
  const lastCheckedRef = useRef(null);

  useEffect(() => {
    const initializeUserRegion = async () => {
      try {
        setIsLoadingUserRegion(true);
        
        // Obtener user_id
        const userId = localStorage.getItem('user_id');
        if (!userId) {
          setIsLoadingUserRegion(false);
          return;
        }
        
        userIdRef.current = userId;

        // 1. Intentar obtener desde localStorage primero (performance)
        const cachedRegion = localStorage.getItem('user_shipping_region');
        if (cachedRegion) {
          setUserRegion(cachedRegion);
          lastCheckedRef.current = cachedRegion;
          setIsLoadingUserRegion(false);
        }

        // 2. Verificar con base de datos (siempre, para asegurar consistencia)
        const { data: profile } = await getUserProfile(userId);
        const currentRegion = profile?.shipping_region || null;
        
        // Actualizar solo si es diferente a lo cacheado
        if (currentRegion !== cachedRegion) {
          setUserRegion(currentRegion);
          lastCheckedRef.current = currentRegion;
          
          // Actualizar localStorage
          if (currentRegion) {
            localStorage.setItem('user_shipping_region', currentRegion);
          } else {
            localStorage.removeItem('user_shipping_region');
          }
        }

        // 3. Configurar polling ligero (cada 1 minuto) solo en producción
        if (process.env.NODE_ENV === 'production') {
          intervalRef.current = setInterval(async () => {
            try {
              const { data: profile } = await getUserProfile(userId);
              const newRegion = profile?.shipping_region || null;
              
              if (newRegion !== lastCheckedRef.current) {
                console.log('🔄 Región actualizada desde otro dispositivo:', newRegion);
                setUserRegion(newRegion);
                lastCheckedRef.current = newRegion;
                
                // Actualizar localStorage
                if (newRegion) {
                  localStorage.setItem('user_shipping_region', newRegion);
                } else {
                  localStorage.removeItem('user_shipping_region');
                }
              }
            } catch (error) {
              console.error('Error verificando cambios de región:', error);
            }
          }, 60000); // 1 minuto
        }

      } catch (error) {
        console.error('Error inicializando región del usuario:', error);
        setUserRegion(null);
      } finally {
        setIsLoadingUserRegion(false);
      }
    };

    // Escuchar cambios en localStorage (para cambios en el mismo dispositivo)
    const handleStorageChange = (e) => {
      if (e.key === 'user_shipping_region') {
        setUserRegion(e.newValue);
        lastCheckedRef.current = e.newValue;
      }
    };

    // Inicializar
    initializeUserRegion();

    // Escuchar cambios en localStorage
    window.addEventListener('storage', handleStorageChange);

    return () => {
      // Limpiar interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Función para forzar actualización manual
  const refreshRegion = async () => {
    if (!userIdRef.current) return;
    
    try {
      setIsLoadingUserRegion(true);
      const { data: profile } = await getUserProfile(userIdRef.current);
      const region = profile?.shipping_region || null;
      setUserRegion(region);
      lastCheckedRef.current = region;
      
      // Actualizar localStorage
      if (region) {
        localStorage.setItem('user_shipping_region', region);
      } else {
        localStorage.removeItem('user_shipping_region');
      }
    } catch (error) {
      console.error('Error actualizando región manualmente:', error);
    } finally {
      setIsLoadingUserRegion(false);
    }
  };

  return { userRegion, isLoadingUserRegion, refreshRegion };
};
