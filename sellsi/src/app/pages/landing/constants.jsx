import React from 'react'
import {
  Store,
  Person,
  Inventory,
  Visibility,
  AttachMoney,
  LocalShipping,
  CheckCircle,
  TrendingUp,
  Groups,
  ShoppingCart,
  AccountBalance,
  Receipt,
} from '@mui/icons-material'

/**
 * ============================================================================
 * LANDING PAGE CONSTANTS - CONSTANTES DE LA PÁGINA DE INICIO
 * ============================================================================
 *
 * Archivo central para todas las constantes y configuraciones estáticas
 * utilizadas en los componentes de la landing page
 *
 * CONTENIDO:
 * - PROMO_SLIDES: Slides del carrusel principal
 * - CAROUSEL_IMAGES: Imágenes del carrusel secundario
 * - SERVICES_DATA: Datos de servicios con timelines
 * - PROVIDERS_DATA: Logos de proveedores destacados
 *
 * CARACTERÍSTICAS:
 * - Configuración centralizada y reutilizable
 * - Soporte para contenido HTML inline
 * - Iconos de Material UI integrados
 * - Estructura extensible y mantenible
 * - Separación de datos y lógica de presentación
 */

// ============================================================================
// SLIDES PROMOCIONALES - CARRUSEL PRINCIPAL
// ============================================================================

/**
 * Configuración de slides para el carrusel promocional principal
 * Soporta dos tipos: 'standard' (título/subtítulo) y 'multi-section' (secciones múltiples)
 */
export const PROMO_SLIDES = [
  {
    id: 1,
    src: '/promotion.png',
    alt: 'Promoción 1',
    title:
      'Somos <span style="color: #1565c0;">Sellsi</span>, el primer marketplace B2B y B2C de Chile',
    subtitle: 'Únete a un ecosistema único en Chile que desarrollamos para ti.',
    type: 'standard',
  },
  {
    id: 2,
    src: '/promotion.png',
    alt: 'Promoción 2',
    title:
      '¡Termina este <span style="color: #1565c0;">2025</span> con todo! Diversifica tus canales de ventas con <span style="color: #1565c0;">Sellsi</span>',
    subtitle:
      'No te pierdas el lanzamiento de nuestro nuevo hub de negocios. <br> Suscríbete y sé parte de esta experiencia única.',

    type: 'standard',
  },
  {
    id: 3,
    src: '/promotion.png',
    alt: 'Promoción 3',
    title:
      'Con <span style="color: #1565c0; font-size: 1.3em;">Sellsi</span>, todos ganan',
    subtitle: '',
    type: 'multi-section',
    sections: [
      {
        title: '¿Proveedor?',
        description: 'Vende directamente sin intermediarios',
      },
      {
        title: '¿Comprador?',
        description: 'Encuentra los mejores productos al mejor precio',
      },
    ],
  },
]

// ============================================================================
// IMÁGENES DEL CARRUSEL SECUNDARIO
// ============================================================================

/**
 * Imágenes y textos para el carrusel secundario de la página de inicio
 */
export const CAROUSEL_IMAGES = [
  {
    src: '/Landing Page/QuienesSomos.jpg',
    title: 'Conectamos Proveedores y Vendedores',
    description: 'La plataforma que revoluciona el comercio digital',
  },
  {
    src: '/Landing Page/Proveedor.webp',
    title: 'Para Proveedores',
    description: 'Vende tus productos de forma directa y eficiente',
  },
  {
    src: '/Landing Page/Vendedor.webp',
    title: 'Para Vendedores',
    description: 'Encuentra productos únicos para revender',
  },
  {
    src: '/Landing Page/Punto de Venta.webp',
    title: 'Puntos de Venta',
    description: 'Optimiza tu espacio comercial y genera ingresos',
  },
]

// ============================================================================
// DATOS DE SERVICIOS CON TIMELINES
// ============================================================================

/**
 * Datos y estructura para los servicios ofrecidos en la landing page
 * Incluye un timeline con pasos para cada tipo de usuario: Proveedor, Vendedor y Punto de Venta
 */
export const SERVICES_DATA = [
  {
    title: 'Proveedor',
    description: 'Vende tus productos de forma directa',
    icon: <Store sx={{ fontSize: { xs: 16, sm: 20, md: 28 } }} />,
    image: '/Landing Page/Proveedor.webp',
    timeline: [
      {
        title: 'Publica',
        description: 'Sube tus productos en el el sitio web',
        icon: <Inventory />,
        image: '/Landing Page/Proveedor/publica.webp',
      },
      {
        title: 'Hazte visible',
        description: 'Tu catálogo será visible para miles de vendedores',
        icon: <Visibility />,
        image: '/Landing Page/Proveedor/visible.webp',
      },
      {
        title: 'Define tu precio',
        description: 'Establece precios y condiciones de venta',
        icon: <AttachMoney />,
        image: '/Landing Page/Proveedor/define.webp',
      },
      {
        title: 'Despacho',
        description: 'Coordina la entrega directa a tus clientes',
        icon: <LocalShipping />,
        image: '/Landing Page/Proveedor/despacho.webp',
      },
      {
        title: 'Venta exitosa',
        description: 'Recibe el pago y construye tu reputación',
        icon: <CheckCircle />,
        image: '/Landing Page/Proveedor/venta.webp',
      },
    ],
  },
  {
    title: 'Comprador',
    description: 'Gestiona tus compras de forma ágil',
    icon: <Groups sx={{ fontSize: { xs: 16, sm: 20, md: 28 } }} />,
    image: '/Landing Page/Punto de Venta.webp',
    timeline: [
      {
        title: 'Explora fácilmente',
        description: 'Accede a un catálogo confiable, filtra por lo que necesitas',
        icon: <Store />,
        image: '/Landing Page/PuntoDeVenta/vendeespacio.webp',
      },
      {
        title: 'Suma productos',
        description: 'Amplía tu oferta con productos de otros proveedores',
        icon: <Inventory />,
        image: '/Landing Page/PuntoDeVenta/sumaproductos.webp',
      },
      {
        title: 'Simple y transparente',
        description: 'Proceso fácil de gestionar y comisiones claras',
        icon: <Receipt />,
        image: '/Landing Page/PuntoDeVenta/simpletransparente.webp',
      },
      {
        title: 'Acuerdo económico',
        description: 'Genera ingresos adicionales con tu espacio',
        icon: <AccountBalance />,
        image: '/Landing Page/PuntoDeVenta/acuerdodinero.webp',
      },
    ],
  },
];

// ============================================================================
// LOGOS DE PROVEEDORES DESTACADOS
// ============================================================================

/**
 * Lista de proveedores destacados en la landing page
 * Usado para mostrar confianza y variedad de productos
 */
export const PROVIDERS_DATA = [
  {
    src: '/Landing Page/Nuestros Proveedores/aurorawines.png',
    alt: 'IKEA',
  },
  {
    src: '/Landing Page/Nuestros Proveedores/clickbar.webp',
    alt: "Click Bar",
  },
  {
    src: '/Landing Page/Nuestros Proveedores/piscomesias.png',
    alt: 'La Roche',
  },
  {
    src: '/Landing Page/Nuestros Proveedores/inchalam.webp',
    alt: 'PC Factory',
  },
  {
    src: '/Landing Page/Nuestros Proveedores/scheiner.webp',
    alt: 'Walmart',
  },
]
