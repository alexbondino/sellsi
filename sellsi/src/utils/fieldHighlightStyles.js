/**
 * Estilos compartidos para resaltar campos de formulario faltantes/requeridos.
 * Usado por: TransferInfoSection, ShippingInfoSection, BillingInfoSection
 * 
 * Este módulo estandariza la visualización de campos vacíos cuando el usuario
 * es redirigido desde una validación fallida (ej: agregar al carrito sin dirección).
 */

/**
 * Color rojo para bordes y labels de campos faltantes
 */
export const HIGHLIGHT_COLOR = '#f44336';

/**
 * Grosor del borde para campos destacados
 */
export const HIGHLIGHT_BORDER_WIDTH = '2px';

/**
 * Genera estilos MUI `sx` para resaltar un TextField o Select vacío.
 * 
 * @param {any} fieldValue - Valor actual del campo
 * @param {boolean} shouldHighlight - Si true, aplica estilos de highlight (viene de URL param)
 * @param {boolean} isRequiredField - Si false, no se aplica highlight aunque esté vacío
 * @returns {object} Objeto sx para MUI
 * 
 * @example
 * <TextField
 *   label="Nombre Titular"
 *   value={formData.accountHolder}
 *   sx={getHighlightFieldStyle(formData.accountHolder, shouldHighlight)}
 * />
 */
export const getHighlightFieldStyle = (fieldValue, shouldHighlight, isRequiredField = true) => {
  if (!shouldHighlight || !isRequiredField) {
    return {};
  }

  const isEmpty = !fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '');
  if (isEmpty) {
    return {
      '& .MuiOutlinedInput-root': {
        '& fieldset': {
          borderColor: HIGHLIGHT_COLOR,
          borderWidth: HIGHLIGHT_BORDER_WIDTH,
        },
      },
      '& .MuiInputLabel-root': {
        color: HIGHLIGHT_COLOR,
        fontWeight: 'bold',
      },
    };
  }

  return {};
};

/**
 * Genera texto de helper para campos vacíos cuando se requiere highlight.
 * Mantiene el helper text existente si hay errores de validación.
 * 
 * @param {any} fieldValue - Valor actual del campo
 * @param {boolean} shouldHighlight - Si true y campo vacío, retorna mensaje
 * @param {string} existingHelperText - Helper text existente (ej: de validación RUT)
 * @param {string} requiredMessage - Mensaje a mostrar si está vacío (default: 'Campo obligatorio')
 * @returns {string} Helper text a mostrar
 * 
 * @example
 * <TextField
 *   helperText={getHighlightHelperText(formData.shippingAddress, shouldHighlight, '', 'Dirección es obligatoria')}
 * />
 */
export const getHighlightHelperText = (
  fieldValue, 
  shouldHighlight, 
  existingHelperText = '', 
  requiredMessage = 'Campo obligatorio'
) => {
  // Si hay helper text existente (ej: error de validación), priorizar
  if (existingHelperText) {
    return existingHelperText;
  }
  
  if (!shouldHighlight) {
    return '';
  }

  const isEmpty = !fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '');
  if (isEmpty) {
    return requiredMessage;
  }

  return '';
};

/**
 * Genera estilos para labels de FormControl (Select) cuando necesitan highlight.
 * Usado para los labels tipo Typography que no son InputLabel.
 * 
 * @param {any} fieldValue - Valor actual del campo
 * @param {boolean} shouldHighlight - Si true, aplica estilos de highlight
 * @returns {object} Objeto sx para Typography
 */
export const getHighlightLabelStyle = (fieldValue, shouldHighlight) => {
  if (!shouldHighlight) {
    return {};
  }

  const isEmpty = !fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '');
  if (isEmpty) {
    return {
      color: HIGHLIGHT_COLOR,
      fontWeight: 'bold',
    };
  }

  return {};
};
