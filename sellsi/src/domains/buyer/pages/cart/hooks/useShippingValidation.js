/**
 * ============================================================================
 * SHIPPING VALIDATION HOOK - VALIDACIÓN DE COMPATIBILIDAD DE DESPACHO
 * ============================================================================
 * 
 * Hook para validar la compatibilidad de despacho entre productos del carrito
 * y la región del usuario, implementando la lógica avanzada de validación.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getUserProfile } from '../../../../../services/user';

/**
 * Estados posibles para cada producto en el carrito
 */
export const SHIPPING_STATES = {
  COMPATIBLE: 'compatible',
  INCOMPATIBLE_REGION: 'incompatible_region', 
  NO_SHIPPING_INFO: 'no_shipping_info'
};

/**
 * Hook para validación de despacho
 * @param {Array} cartItems - Items del carrito
 * @param {boolean} isAdvancedMode - Toggle para activar/desactivar validación avanzada
 * @returns {Object} Estado de validación y funciones
 */
export const useShippingValidation = (cartItems = [], isAdvancedMode = false) => {
  // ✅ NUEVO: Función para leer userRegion de sessionStorage de forma síncrona
  const getUserRegionFromStorage = () => {
    try {
      const stored = sessionStorage.getItem('shippingValidation_userRegion');
      return stored;
    } catch {
      return null;
    }
  };

  // ✅ NUEVO: Inicializar userRegion desde sessionStorage si existe
  const [userRegion, setUserRegion] = useState(getUserRegionFromStorage);
  const [shippingStates, setShippingStates] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [incompatibleProducts, setIncompatibleProducts] = useState([]);

  /**
   * Obtener nombre legible de la región - memoizado para evitar recreaciones
   */
  const getUserRegionName = useMemo(() => {
    const regionMap = {
      'arica-parinacota': 'Arica y Parinacota',
      'tarapaca': 'Tarapacá',
      'antofagasta': 'Antofagasta',
      'atacama': 'Atacama',
      'coquimbo': 'Coquimbo',
      'valparaiso': 'Valparaíso',
      'metropolitana': 'Región Metropolitana',
      'ohiggins': "O'Higgins",
      'maule': 'Maule',
      'nuble': 'Ñuble',
      'biobio': 'Biobío',
      'araucania': 'Araucanía',
      'los-rios': 'Los Ríos',
      'los-lagos': 'Los Lagos',
      'aysen': 'Aysén',
      'magallanes': 'Magallanes'
    };
    
    return (regionValue) => regionMap[regionValue] || regionValue;
  }, []);

  /**
   * Obtener información del perfil del usuario - estable con useCallback
   */
  const fetchUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        setUserRegion(null);
        return;
      }

      const { data: profile, error: profileError } = await getUserProfile(userId);
      
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        setError('Error al obtener información del perfil');
        return;
      }

      setUserRegion(profile?.shipping_region || null);
      
      // ✅ NUEVO: Verificar si la región cambió vs sessionStorage
      const storedRegion = getUserRegionFromStorage();
      if (storedRegion && storedRegion !== profile?.shipping_region) {
        console.log('User region changed from', storedRegion, 'to', profile?.shipping_region);
        // La región cambió, sessionStorage se actualizará automáticamente por el useEffect
      }
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
      setError('Error al obtener información del perfil');
    } finally {
      setIsLoading(false);
    }
  }, []); // ✅ Array vacío - función estable

  /**
   * Validar estado de despacho para un producto específico - función pura memoizada
   */
  const validateProductShipping = useMemo(() => {
    return (product, userRegion) => {
      // Si no hay región del usuario, no se puede validar
      if (!userRegion) {
        return {
          state: SHIPPING_STATES.NO_SHIPPING_INFO,
          message: 'Configura tu región de envío en tu perfil',
          canShip: false
        };
      }

      // Obtener información de despacho del producto con múltiples fuentes
      const shippingRegions = product.shippingRegions || 
                            product.delivery_regions || 
                            product.shipping_regions || 
                            product.product_delivery_regions ||
                            [];

      // Debug para entender qué datos llegan
      console.log('📦 Product shipping data:', {
        productId: product.id,
        productName: product.nombre || product.name,
        shippingRegionsCount: shippingRegions.length,
        shippingRegions,
        allProductKeys: Object.keys(product), // Ver todas las propiedades del producto
        rawProduct: {
          shippingRegions: product.shippingRegions,
          delivery_regions: product.delivery_regions,
          shipping_regions: product.shipping_regions,
          product_delivery_regions: product.product_delivery_regions,
          deliveryRegions: product.deliveryRegions,
          // Ver si hay otras variantes de nombres
          productDeliveryRegions: product.productDeliveryRegions,
        },
      });

      // Si no hay regiones, mostrar mensaje específico
      if (!shippingRegions || shippingRegions.length === 0) {
        console.warn('⚠️ No shipping regions found for product:', {
          productId: product.id,
          productName: product.nombre || product.name,
          availableFields: Object.keys(product).filter(key => 
            key.toLowerCase().includes('region') || 
            key.toLowerCase().includes('delivery') || 
            key.toLowerCase().includes('shipping')
          )
        });
      }

      // Estado: Sin información de despacho
      if (!shippingRegions || shippingRegions.length === 0) {
        return {
          state: SHIPPING_STATES.NO_SHIPPING_INFO,
          message: 'Este producto no cuenta con información de despacho. Por favor, contacta a Sellsi.',
          canShip: false
        };
      }

      // Buscar la región del usuario en las regiones del producto
      const matchingRegion = shippingRegions.find(region => {
        const regionValue = region.region || region.value;
        return regionValue === userRegion;
      });

      // Estado: Compatible
      if (matchingRegion) {
        const days = matchingRegion.delivery_days || 
                    matchingRegion.maxDeliveryDays || 
                    matchingRegion.days || 
                    'N/A';
        
        const cost = matchingRegion.price || 
                    matchingRegion.shippingValue || 
                    matchingRegion.cost || 
                    0;
        
        return {
          state: SHIPPING_STATES.COMPATIBLE,
          message: `${days} días hábiles - $${cost.toLocaleString('es-CL')}`,
          canShip: true,
          shippingInfo: {
            days: days,
            cost: cost
          }
        };
      }

      // Estado: Incompatible por región
      const availableRegions = shippingRegions.map(region => {
        const regionValue = region.region || region.value;
        return getUserRegionName(regionValue);
      });
      
      // Debug para ver qué está pasando
      console.log('🚚 Shipping Validation Debug:', {
        userRegion,
        shippingRegions,
        availableRegions,
        productId: product.id,
        productName: product.nombre || product.name
      });
      
      return {
        state: SHIPPING_STATES.INCOMPATIBLE_REGION,
        message: `Este producto no cuenta con despacho a tu región: ${getUserRegionName(userRegion)}`,
        canShip: false,
        availableRegions: availableRegions
      };
    };
  }, [getUserRegionName]); // ✅ Solo depende de getUserRegionName que es estable

  /**
   * Función para revalidar manualmente los productos - estable
   */
  const revalidate = useCallback(() => {
    if (!isAdvancedMode) {
      setShippingStates({});
      setIncompatibleProducts([]);
      return;
    }

    const newStates = {};
    const incompatible = [];

    cartItems.forEach(item => {
      const validation = validateProductShipping(item, userRegion);
      newStates[item.id] = validation;
      
      if (!validation.canShip && validation.state !== SHIPPING_STATES.NO_SHIPPING_INFO) {
        incompatible.push({
          id: item.id,
          name: item.name || item.nombre,
          availableRegions: validation.availableRegions || []
        });
      }
    });

    setShippingStates(newStates);
    setIncompatibleProducts(incompatible);
  }, [cartItems, userRegion, isAdvancedMode, validateProductShipping]);

  /**
   * Verificar si todos los productos son compatibles
   */
  const isCartCompatible = useCallback(() => {
    if (!isAdvancedMode) {
      return true;
    }
    
    // Si no hay región del usuario, el carrito no es compatible
    if (!userRegion) {
      return false;
    }

    // Si hay productos incompatibles, el carrito no es compatible
    const compatible = incompatibleProducts.length === 0;
    return compatible;
  }, [isAdvancedMode, userRegion, incompatibleProducts]);

  /**
   * Verificar si la información de envío está completa
   */
  const isShippingInfoComplete = useCallback(() => {
    try {
      return !!(
        userRegion && 
        Object.keys(shippingStates).length > 0 &&
        Object.values(shippingStates).every(state => 
          state.state !== SHIPPING_STATES.NO_SHIPPING_INFO
        )
      );
    } catch (err) {
      console.error('Error checking shipping info:', err);
      return false;
    }
  }, [userRegion, shippingStates]);

  // ============================================================================
  // EFECTOS - SIMPLIFICADOS PARA EVITAR BUCLES
  // ============================================================================

  // Efecto para cargar perfil del usuario - solo al montar
  useEffect(() => {
    // ✅ NUEVO: Siempre fetch profile para verificar que sessionStorage sea correcto
    // Esto asegura que si el usuario cambió su región, se actualice
    fetchUserProfile();
  }, []); // ✅ Solo ejecutar una vez

  // Efecto para revalidar cuando cambian los datos relevantes - SIN validateProductShipping en deps
  useEffect(() => {
    // Solo ejecutar si tenemos los datos necesarios y está en modo avanzado
    if (isAdvancedMode && cartItems.length > 0 && userRegion) {
      const newStates = {};
      const incompatible = [];

      cartItems.forEach(item => {
        const validation = validateProductShipping(item, userRegion);
        newStates[item.id] = validation;
        
        if (!validation.canShip && validation.state !== SHIPPING_STATES.NO_SHIPPING_INFO) {
          incompatible.push({
            id: item.id,
            name: item.name || item.nombre,
            availableRegions: validation.availableRegions || []
          });
        }
      });

      setShippingStates(newStates);
      setIncompatibleProducts(incompatible);
    } else if (!isAdvancedMode) {
      // Limpiar estados en modo simple
      setShippingStates({});
      setIncompatibleProducts([]);
    }
  }, [isAdvancedMode, cartItems.length, userRegion]); // ✅ Solo dependencias primitivas

  // ✅ NUEVO: Efecto para guardar userRegion en sessionStorage cuando cambie
  useEffect(() => {
    if (userRegion) {
      try {
        const storedRegion = sessionStorage.getItem('shippingValidation_userRegion');
        if (storedRegion !== userRegion) {
          sessionStorage.setItem('shippingValidation_userRegion', userRegion);
          console.log('Updated sessionStorage region from', storedRegion, 'to', userRegion);
        }
      } catch (err) {
        console.warn('Failed to save userRegion to sessionStorage:', err);
      }
    } else {
      // Si userRegion es null, limpiar sessionStorage
      try {
        sessionStorage.removeItem('shippingValidation_userRegion');
      } catch (err) {
        console.warn('Failed to clear userRegion from sessionStorage:', err);
      }
    }
  }, [userRegion]);

  // Efecto para escuchar cambios en localStorage (login/logout)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user_id') {
        // Limpiar sessionStorage cuando cambia user_id
        try {
          sessionStorage.removeItem('shippingValidation_userRegion');
        } catch (err) {
          console.warn('Failed to clear userRegion from sessionStorage:', err);
        }
        fetchUserProfile();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []); // ✅ Array vacío porque fetchUserProfile es estable

  return {
    // Estados
    userRegion,
    shippingStates,
    isLoading,
    error,
    incompatibleProducts,

    // Estados derivados
    isCartCompatible: isCartCompatible(),
    isShippingInfoComplete: isShippingInfoComplete(),

    // Funciones de control
    revalidate,
    refreshUserProfile: fetchUserProfile,

    // Utilidades
    getUserRegionName,
    validateProductShipping,
    SHIPPING_STATES
  };
};

export default useShippingValidation;
