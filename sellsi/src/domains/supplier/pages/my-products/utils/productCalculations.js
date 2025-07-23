/**
 * Utilidades para cálculos de productos
 * Contiene funciones para calcular ingresos, tarifas y totales
 */

const SERVICE_RATE = 0.02; // 2% de tarifa de servicio

/**
 * Calcula el valor mínimo de ingresos (peor escenario) para tramos de precio
 * @param {Array} tramos - Array de tramos con cantidad y precio
 * @param {number} stock - Stock disponible
 * @returns {number} Ingreso mínimo
 */
export const calculateMinimumIncome = (tramos, stock) => {
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
export const calculateMaximumIncome = (tramos, stock) => {
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

/**
 * Calcula los ingresos totales para un producto
 * @param {Object} formData - Datos del formulario del producto
 * @returns {Object} Objeto con cálculos de ingresos y totales
 */
export const calculateEarnings = (formData) => {
  if (
    formData.pricingType === 'Por Unidad' &&
    formData.precioUnidad &&
    formData.stock
  ) {
    // Cálculo simple para precio por unidad
    const totalIncome =
      parseFloat(formData.precioUnidad) * parseInt(formData.stock);
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
  } else if (
    formData.pricingType === 'Por Tramo' &&
    formData.tramos.length > 0
  ) {
    // Cálculo de rangos para precios por tramo
    const validTramos = formData.tramos.filter(
      t =>
        t.cantidad &&
        t.precio &&
        !isNaN(Number(t.cantidad)) &&
        !isNaN(Number(t.precio))
    );

    if (validTramos.length > 0 && formData.stock) {
      const stock = parseInt(formData.stock);

      // Calcular valor mínimo (peor escenario)
      const minIncome = calculateMinimumIncome(validTramos, stock);

      // Calcular valor máximo (mejor escenario)
      const maxIncome = calculateMaximumIncome(validTramos, stock);

      // Calcular tarifas de servicio
      const minServiceFee = minIncome * SERVICE_RATE;
      const maxServiceFee = maxIncome * SERVICE_RATE;

      // Calcular totales
      const minTotal = minIncome - minServiceFee;
      const maxTotal = maxIncome - maxServiceFee;

      return {
        ingresoPorVentas: 0, // No se usa en modo rango
        tarifaServicio: 0, // No se usa en modo rango
        total: 0, // No se usa en modo rango
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
