/**
 * 🎯 UTILIDAD CENTRALIZADA: Cálculos de Productos y Inventario
 * Centraliza toda la lógica matemática de productos para evitar duplicación
 * 
 * USADO EN:
 * - AddProduct.jsx (calculateEarnings)
 * - MyProducts.jsx (valor del inventario)
 * - useSupplierProducts.js (estadísticas)
 * 
 * ✅ MIGRACIÓN COMPLETA: Se eliminó la dependencia circular
 * - calculateMinimumIncome y calculateMaximumIncome ahora están aquí
 * - Se eliminó el import desde productCalculations.js
 */

import { useMemo } from 'react';

// ============================================================================
// 🧮 FUNCIONES AUXILIARES DE CÁLCULO (Movidas desde productCalculations.js)
// ============================================================================

/**
 * Calcula el valor mínimo de ingresos (peor escenario) para tramos de precio
 * @param {Array} tramos - Array de tramos con cantidad y precio
 * @param {number} stock - Stock disponible
 * @returns {number} Ingreso mínimo
 */
const calculateMinimumIncome = (tramos, stock) => {
  // Ordenar tramos de mayor a menor cantidad (más barato a más caro)
  const sortedTramos = [...tramos].sort(
    (a, b) => parseInt(b.cantidad) - parseInt(a.cantidad)
  );

  let remainingStock = stock;
  let totalIncome = 0;

  for (const tramo of sortedTramos) {
    if (remainingStock <= 0) break;

    const tramoCantidad = parseInt(tramo.cantidad);
    const tramoPrecio = parseFloat(tramo.precio);

    // Usar división entera
    const tramosCompletos = Math.floor(remainingStock / tramoCantidad);

    if (tramosCompletos > 0) {
      totalIncome += tramosCompletos * tramoPrecio;
      remainingStock -= tramosCompletos * tramoCantidad;
    }
  }

  return totalIncome;
};

/**
 * Calcula el valor máximo de ingresos (mejor escenario) para tramos de precio
 * @param {Array} tramos - Array de tramos con cantidad y precio
 * @param {number} stock - Stock disponible
 * @returns {number} Ingreso máximo
 */
const calculateMaximumIncome = (tramos, stock) => {
  // Encontrar el tramo con menor cantidad (más caro)
  const smallestTramo = tramos.reduce((min, current) =>
    parseInt(current.cantidad) < parseInt(min.cantidad) ? current : min
  );

  const tramoCantidad = parseInt(smallestTramo.cantidad);
  const tramoPrecio = parseFloat(smallestTramo.precio);

  // Usar división entera
  const tramosCompletos = Math.floor(stock / tramoCantidad);

  return tramosCompletos * tramoPrecio;
};

// ============================================================================
// 📊 CÁLCULOS INDIVIDUALES DE PRODUCTOS (Para AddProduct)
// ============================================================================

/**
 * Calcula ingresos para un producto individual (AddProduct)
 * Centraliza la lógica que estaba en productCalculations.js
 */
export const calculateProductEarnings = (formData) => {
  const SERVICE_RATE = 0.02; // 2% de tarifa de servicio

  if (formData.pricingType === 'Por Unidad' && formData.precioUnidad && formData.stock) {
    // Cálculo simple para precio por unidad
    const totalIncome = parseFloat(formData.precioUnidad) * parseInt(formData.stock);
    const serviceFee = totalIncome * SERVICE_RATE;
    const finalTotal = totalIncome - serviceFee;

    return {
      ingresoPorVentas: totalIncome,
      tarifaServicio: serviceFee,
      total: finalTotal,
      isRange: false,
      rangos: {
        ingresoPorVentas: { min: 0, max: 0 },
        tarifaServicio: { min: 0, max: 0 },
        total: { min: 0, max: 0 },
      },
    };
  } else if (formData.pricingType === 'Por Tramo' && formData.tramos?.length > 0) {
    // Cálculo de rangos para precios por tramo
    const validTramos = formData.tramos.filter(
      t => t.cantidad && t.precio && !isNaN(Number(t.cantidad)) && !isNaN(Number(t.precio))
    );

    if (validTramos.length > 0 && formData.stock) {
      const stock = parseInt(formData.stock);

      // Calcular valor mínimo (escenario conservador)
      const minIncome = calculateMinimumIncome(validTramos, stock);
      // Calcular valor máximo (escenario optimista)
      const maxIncome = calculateMaximumIncome(validTramos, stock);

      // Calcular tarifas de servicio
      const minServiceFee = minIncome * SERVICE_RATE;
      const maxServiceFee = maxIncome * SERVICE_RATE;

      // Calcular totales
      const minTotal = minIncome - minServiceFee;
      const maxTotal = maxIncome - maxServiceFee;

      return {
        ingresoPorVentas: 0, // No se usa en modo rango
        tarifaServicio: 0,   // No se usa en modo rango
        total: 0,           // No se usa en modo rango
        isRange: true,
        rangos: {
          ingresoPorVentas: { min: minIncome, max: maxIncome },
          tarifaServicio: { min: minServiceFee, max: maxServiceFee },
          total: { min: minTotal, max: maxTotal },
        },
      };
    }
  }

  // Sin datos válidos, retornar valores por defecto
  return {
    ingresoPorVentas: 0,
    tarifaServicio: 0,
    total: 0,
    isRange: false,
    rangos: {
      ingresoPorVentas: { min: 0, max: 0 },
      tarifaServicio: { min: 0, max: 0 },
      total: { min: 0, max: 0 },
    },
  };
};

// ============================================================================
// 📈 CÁLCULOS DE INVENTARIO (Para MyProducts)
// ============================================================================

/**
 * Calcula el valor total del inventario considerando tramos de precios
 * @param {Array} products - Array de productos
 * @param {string} scenario - 'conservative' | 'optimistic' | 'average'
 * @returns {number} Valor total del inventario
 */
export const calculateInventoryValue = (products, scenario = 'conservative') => {
  return products.reduce((total, product) => {
    const stock = product.productqty || product.stock || 0;
    
    // Skip productos sin stock
    if (stock <= 0) return total;
    
    // Revisar si tiene tramos de precio (priceTiers array)
    const hasPriceTiers = product.priceTiers && Array.isArray(product.priceTiers) && product.priceTiers.length > 0;
    
    if (!hasPriceTiers) {
      // Cálculo simple para precios fijos (usa price de la tabla products)
      const price = product.price || 0;
      return total + (price * stock);
      
    } else {
      // Validar tramos (convertir estructura de BD a estructura esperada)
      const validTramos = product.priceTiers
        .filter(t => t.min_quantity && t.price && !isNaN(Number(t.min_quantity)) && !isNaN(Number(t.price)))
        .map(t => ({
          cantidad: t.min_quantity,  // Mapear min_quantity -> cantidad
          precio: t.price            // Mapear price -> precio
        }));
      
      if (validTramos.length === 0) {
        // Fallback a precio base si tramos inválidos
        const price = product.price || 0;
        return total + (price * stock);
      }
      
      // Calcular según escenario
      let value = 0;
      
      switch (scenario) {
        case 'conservative':
          // Usa escenario mínimo (más realista para inventario)
          value = calculateMinimumIncome(validTramos, stock);
          break;
          
        case 'optimistic':
          // Usa escenario máximo
          value = calculateMaximumIncome(validTramos, stock);
          break;
          
        case 'average':
          // Promedio entre mínimo y máximo
          const min = calculateMinimumIncome(validTramos, stock);
          const max = calculateMaximumIncome(validTramos, stock);
          value = (min + max) / 2;
          break;
          
        default:
          value = calculateMinimumIncome(validTramos, stock);
      }
      
      return total + value;
    }
    
    return total;
  }, 0);
};

/**
 * Calcula estadísticas completas del inventario
 * @param {Array} products - Array de productos
 * @returns {Object} Estadísticas completas
 */
export const calculateInventoryStats = (products) => {
  const total = products.length;
  const inStock = products.filter(p => (p.productqty || p.stock || 0) > 0).length;
  
  // Calcular valores en diferentes escenarios
  const conservativeValue = calculateInventoryValue(products, 'conservative');
  const optimisticValue = calculateInventoryValue(products, 'optimistic');
  const averageValue = calculateInventoryValue(products, 'average');
  
  return {
    total,
    inStock,
    outOfStock: total - inStock,
    value: {
      conservative: conservativeValue,
      optimistic: optimisticValue,
      average: averageValue,
      // Para compatibilidad con código existente
      totalValue: conservativeValue, // Usa el conservador como default
    },
    range: {
      min: conservativeValue,
      max: optimisticValue,
      spread: optimisticValue - conservativeValue,
      spreadPercentage: conservativeValue > 0 
        ? ((optimisticValue - conservativeValue) / conservativeValue * 100).toFixed(1)
        : 0
    }
  };
};

/**
 * Hook optimizado para estadísticas de inventario
 * Se puede integrar en useSupplierProducts.js
 */
export const useInventoryStats = (products) => {
  return useMemo(() => {
    if (!products?.length) {
      return {
        total: 0,
        inStock: 0,
        outOfStock: 0,
        value: { totalValue: 0, conservative: 0, optimistic: 0, average: 0 },
        range: { min: 0, max: 0, spread: 0, spreadPercentage: 0 }
      };
    }
    
    return calculateInventoryStats(products);
  }, [products]);
};
