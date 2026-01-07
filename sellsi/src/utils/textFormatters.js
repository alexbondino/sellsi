/**
 * Utilidades para formateo de texto
 */

/**
 * Convierte un string a Title Case (primera letra de cada palabra en mayúscula, resto en minúscula)
 * @param {string} str - El string a convertir
 * @returns {string} - El string en Title Case
 * @example
 * toTitleCase("PRODUCTO EJEMPLO") // "Producto Ejemplo"
 * toTitleCase("producto ejemplo") // "Producto Ejemplo"
 * toTitleCase("IPHONE 15 PRO MAX") // "Iphone 15 Pro Max"
 */
export const toTitleCase = str => {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default {
  toTitleCase,
};
