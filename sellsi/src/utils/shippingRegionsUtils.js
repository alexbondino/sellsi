import { regiones } from './chileData';

/**
 * Convierte datos de regiones desde formato de base de datos a formato de formulario
 * @param {Array} regions - Array de regiones desde la base de datos
 * @returns {Array} Array de regiones en formato de formulario
 */
export const convertDbRegionsToForm = (regions = []) => {
  console.log('[convertDbRegionsToForm] - Input regions:', regions);
  
  if (!regions || regions.length === 0) {
    console.log('[convertDbRegionsToForm] - No hay regiones, retornando array vacío');
    return [];
  }
  
  const result = regions.map(region => {
    // Buscar el label de la región en chileData
    const regionData = regiones.find(r => r.value === region.region);
    
    const converted = {
      region: region.region,
      shippingValue: region.price,
      maxDeliveryDays: region.delivery_days,
      regionLabel: regionData ? regionData.label : region.region,
    };
    
    console.log('[convertDbRegionsToForm] - Convirtiendo región:', region, '-> resultado:', converted);
    return converted;
  });
  
  console.log('[convertDbRegionsToForm] - Resultado final:', result);
  return result;
};

/**
 * Convierte datos de regiones desde formato de formulario a formato de base de datos
 * @param {Array} regions - Array de regiones desde el formulario
 * @returns {Array} Array de regiones en formato de base de datos
 */
export const convertFormRegionsToDb = (regions = []) => {
  console.log('[convertFormRegionsToDb] - Input regions:', regions);
  
  if (!regions || regions.length === 0) {
    console.log('[convertFormRegionsToDb] - No hay regiones, retornando array vacío');
    return [];
  }
  
  const result = regions.map(region => {
    const converted = {
      region: region.region,
      price: parseFloat(region.shippingValue || region.price || 0),
      delivery_days: parseInt(region.maxDeliveryDays || region.delivery_days || 0),
    };
    
    console.log('[convertFormRegionsToDb] - Convirtiendo región:', region, '-> resultado:', converted);
    return converted;
  });
  
  console.log('[convertFormRegionsToDb] - Resultado final:', result);
  return result;
};

/**
 * Convierte datos de regiones desde formato de modal a formato de display
 * @param {Array} regions - Array de regiones desde el modal
 * @returns {Array} Array de regiones en formato para display
 */
export const convertModalRegionsToDisplay = (regions = []) => {
  console.log('[convertModalRegionsToDisplay] - Input regions:', regions);
  
  if (!regions || regions.length === 0) {
    console.log('[convertModalRegionsToDisplay] - No hay regiones, retornando array vacío');
    return [];
  }
  
  const result = regions.map(region => {
    // Buscar el label de la región en chileData
    const regionData = regiones.find(r => r.value === region.region);
    
    const converted = {
      region: region.region,
      shippingValue: region.price,
      maxDeliveryDays: region.delivery_days,
      regionLabel: regionData ? regionData.label : region.region,
    };
    
    console.log('[convertModalRegionsToDisplay] - Convirtiendo región:', region, '-> resultado:', converted);
    return converted;
  });
  
  console.log('[convertModalRegionsToDisplay] - Resultado final:', result);
  return result;
};
