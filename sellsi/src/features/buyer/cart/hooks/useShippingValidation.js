/**
 * ============================================================================
 * SHIPPING VALIDATION HOOK - VALIDACIÓN DE COMPATIBILIDAD DE DESPACHO
 * ============================================================================
 * 
 * Hook para validar la compatibilidad de despacho entre productos del carrito
 * y la región del usuario, implementando la lógica avanzada de validación.
 */

import { useState, useEffect, useCallback } from 'react';
import { getUserProfile } from '../../../../services/profileService';

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
  const [userRegion, setUserRegion] = useState(null);
  const [shippingStates, setShippingStates] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [incompatibleProducts, setIncompatibleProducts] = useState([]);

  /**
   * Obtener información del perfil del usuario
   */
  const fetchUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);
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
      setError(null);
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
      setError('Error al obtener información del perfil');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Validar estado de despacho para un producto específico
   * @param {Object} product - Producto a validar
   * @param {string} userRegion - Región del usuario
   * @returns {Object} Estado de validación del producto
   */
  const validateProductShipping = useCallback((product, userRegion) => {
    // Si no hay región del usuario, no se puede validar
    if (!userRegion) {
      return {
        state: SHIPPING_STATES.NO_SHIPPING_INFO,
        message: 'Configura tu región de envío en tu perfil',
        canShip: false
      };
    }

    // Obtener información de despacho del producto
    const shippingRegions = product.shippingRegions || 
                          product.delivery_regions || 
                          product.shipping_regions || 
                          [];

    // Estado: Sin información de despacho
    if (!shippingRegions || shippingRegions.length === 0) {
      return {
        state: SHIPPING_STATES.NO_SHIPPING_INFO,
        message: 'Este producto no cuenta con información de despacho. Por favor, contacta a Sellsi.',
        canShip: false
      };
    }

    // Buscar la región del usuario en las regiones del producto
    const matchingRegion = shippingRegions.find(region => 
      region.region === userRegion || region.value === userRegion
    );

    // Estado: Compatible
    if (matchingRegion) {
      const days = matchingRegion.maxDeliveryDays || matchingRegion.days || 'N/A';
      const cost = matchingRegion.shippingValue || matchingRegion.price || 0;
      
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
    const availableRegions = shippingRegions.map(region => 
      region.regionLabel || region.label || region.region
    );
    
    return {
      state: SHIPPING_STATES.INCOMPATIBLE_REGION,
      message: `Este producto no cuenta con despacho a tu región: ${getUserRegionName(userRegion)}`,
      canShip: false,
      availableRegions: availableRegions
    };
  }, []);

  /**
   * Validar compatibilidad de todos los productos del carrito
   */
  const validateAllProducts = useCallback(() => {
    if (!isAdvancedMode) {
      // Modo simple: limpiar estados
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
    if (!isAdvancedMode) return true;
    
    // Si no hay región del usuario, el carrito no es compatible
    if (!userRegion) return false;
    
    return Object.values(shippingStates).every(state => 
      state.canShip
    );
  }, [shippingStates, isAdvancedMode, userRegion]);

  /**
   * Verificar si el usuario ha completado su información de envío
   */
  const isShippingInfoComplete = useCallback(async () => {
    if (!isAdvancedMode) return true;
    
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) return false;

      const { data: profile, error: profileError } = await getUserProfile(userId);
      if (profileError) return false;

      // Verificar campos requeridos
      const requiredFields = [
        'shipping_region',
        'shipping_comuna', 
        'shipping_address',
        'shipping_number'
      ];

      return requiredFields.every(field => 
        profile[field] && profile[field].toString().trim() !== ''
      );
    } catch (err) {
      console.error('Error checking shipping info:', err);
      return false;
    }
  }, [isAdvancedMode]);

  /**
   * Obtener nombre legible de la región
   */
  const getUserRegionName = (regionValue) => {
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
    return regionMap[regionValue] || regionValue;
  };

  // Efecto para cargar perfil del usuario
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Efecto para revalidar cuando cambian los items del carrito o la región
  useEffect(() => {
    validateAllProducts();
  }, [validateAllProducts]);

  // Efecto para revalidar cuando el usuario inicia/cierra sesión
  useEffect(() => {
    const handleStorageChange = () => {
      fetchUserProfile();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchUserProfile]);

  return {
    // Estados
    userRegion,
    shippingStates,
    isLoading,
    error,
    incompatibleProducts,

    // Funciones de validación
    validateProductShipping,
    isCartCompatible: isCartCompatible(),
    isShippingInfoComplete,

    // Funciones de control
    revalidate: validateAllProducts,
    refreshUserProfile: fetchUserProfile,

    // Utilidades
    getUserRegionName,
    SHIPPING_STATES
  };
};

export default useShippingValidation;
