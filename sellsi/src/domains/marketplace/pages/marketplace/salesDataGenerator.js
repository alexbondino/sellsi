// Utility for generating random sales characteristics data
// This helps create realistic sample data for the sales characteristics section

/**
 * Generates random sales characteristics for a product
 * @param {Object} product - The product object
 * @returns {Object} - Object containing sales characteristics
 */
export const generateSalesCharacteristics = (product) => {
  // Base data from the product
  const baseData = {
    ventasUltimos30Dias: Math.floor(Math.random() * 200) + 50,
    promedioCalificacion: product?.rating || (Math.random() * 2 + 3).toFixed(1),
    tiempoPromedioEntrega: Math.floor(Math.random() * 5) + 2,
    satisfaccionCliente: Math.floor(Math.random() * 20) + 80,
  }

  // Generate additional characteristics based on product data
  const additionalCharacteristics = {
    devolucionesUltimos6Meses: Math.floor(Math.random() * 10) + 1,
    clientesRepetidores: Math.floor(Math.random() * 40) + 30,
    tiempoEnMercado: Math.floor(Math.random() * 24) + 6, // months
    certificacionesCalidad: Math.floor(Math.random() * 3) + 1,
    garantiaExtendida: Math.random() > 0.3, // 70% probability
    envioGratis: Math.random() > 0.4, // 60% probability
    stockDisponibilidad:
      product?.stock > 50 ? 'Alta' : product?.stock > 20 ? 'Media' : 'Baja',
    categoriaPopularidad: Math.floor(Math.random() * 5) + 1, // 1-5 stars
  }

  return {
    ...baseData,
    ...additionalCharacteristics,
  }
}

/**
 * Generates technical specifications for a product
 * @param {Object} product - The product object
 * @returns {Array} - Array of specification objects
 */
export const generateTechnicalSpecifications = (product) => {
  // Base specifications that most products might have
  const baseSpecs = [
    {
      categoria: 'Información General',
      especificaciones: [
        { nombre: 'Marca', valor: 'Sellsi Premium' },
        {
          nombre: 'Modelo',
          valor: `SP-${Math.floor(Math.random() * 9999) + 1000}`,
        },
        {
          nombre: 'SKU',
          valor: `SKU${Math.floor(Math.random() * 999999) + 100000}`,
        },
        {
          nombre: 'Código de Barras',
          valor: `${Math.floor(Math.random() * 9999999999999) + 1000000000000}`,
        },
      ],
    },
    {
      categoria: 'Dimensiones y Peso',
      especificaciones: [
        {
          nombre: 'Largo',
          valor: `${(Math.random() * 30 + 10).toFixed(1)} cm`,
        },
        { nombre: 'Ancho', valor: `${(Math.random() * 20 + 5).toFixed(1)} cm` },
        { nombre: 'Alto', valor: `${(Math.random() * 15 + 3).toFixed(1)} cm` },
        { nombre: 'Peso', valor: `${(Math.random() * 5 + 0.5).toFixed(2)} kg` },
      ],
    },
    {
      categoria: 'Características Técnicas',
      especificaciones: [
        { nombre: 'Material Principal', valor: getRandomMaterial() },
        { nombre: 'Color', valor: getRandomColor() },
        { nombre: 'Origen', valor: getRandomOrigin() },
        {
          nombre: 'Garantía',
          valor: `${Math.floor(Math.random() * 24) + 12} meses`,
        },
      ],
    },
    {
      categoria: 'Información Comercial',
      especificaciones: [
        {
          nombre: 'Precio Base',
          valor: `$${product?.precio?.toLocaleString('es-CL') || '0'}`,
        },
        {
          nombre: 'Disponibilidad',
          valor: product?.stock > 0 ? 'En stock' : 'Sin stock',
        },
        {
          nombre: 'Tiempo de Envío',
          valor: `${Math.floor(Math.random() * 5) + 1}-${
            Math.floor(Math.random() * 3) + 3
          } días hábiles`,
        },
        { nombre: 'Métodos de Pago', valor: 'Tarjetas, Transferencia, PayPal' },
      ],
    },
  ]

  return baseSpecs
}

// Helper functions for generating random values
const getRandomMaterial = () => {
  const materials = [
    'Acero Inoxidable',
    'Plástico ABS',
    'Aluminio',
    'Fibra de Carbono',
    'Silicona Premium',
    'Cuero Sintético',
    'Vidrio Templado',
    'Cerámica',
    'Bambú Natural',
    'Polímero Reforzado',
  ]
  return materials[Math.floor(Math.random() * materials.length)]
}

const getRandomColor = () => {
  const colors = [
    'Negro Mate',
    'Blanco Perla',
    'Gris Metálico',
    'Azul Marino',
    'Rojo Cereza',
    'Verde Esmeralda',
    'Dorado',
    'Plateado',
    'Bronce',
    'Transparente',
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

const getRandomOrigin = () => {
  const origins = [
    'Chile',
    'China',
    'Estados Unidos',
    'Alemania',
    'Japón',
    'Corea del Sur',
    'Brasil',
    'México',
    'España',
    'Italia',
  ]
  return origins[Math.floor(Math.random() * origins.length)]
}

/**
 * Formats sales data for display
 * @param {Object} salesData - Raw sales data
 * @returns {Array} - Formatted data for UI display
 */
export const formatSalesDataForDisplay = (salesData) => {
  return [
    {
      titulo: 'Ventas Recientes',
      valor: salesData.ventasUltimos30Dias,
      sufijo: 'últimos 30 días',
      icono: '📈',
      color: 'success',
    },
    {
      titulo: 'Calificación',
      valor: salesData.promedioCalificacion,
      sufijo: '/ 5.0',
      icono: '⭐',
      color: 'warning',
    },
  ]
}
