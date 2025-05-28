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

// Constantes para las diapositivas promocionales
export const PROMO_SLIDES = [
  { src: '/promotion.png', alt: 'Promoción 1' },
  { src: '/promotion.png', alt: 'Promoción 2' },
  { src: '/promotion.png', alt: 'Promoción 3' },
]

// Constantes para el carrusel de imágenes
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

// Constantes para los datos de servicios del Wizard
export const SERVICES_DATA = [
  {
    title: 'Proveedor',
    description: 'Vende tus productos de forma directa',
    icon: <Store sx={{ fontSize: { xs: 20, md: 24 } }} />,
    image: '/Landing Page/Proveedor.webp',
    timeline: [
      {
        title: 'Publica',
        description: 'Sube tus productos con fotos y descripciones detalladas',
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
        description: 'Establece precios competitivos y condiciones de venta',
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
    title: 'Vendedor',
    description: 'Encuentra productos para revender',
    icon: <Person sx={{ fontSize: { xs: 20, md: 24 } }} />,
    image: '/Landing Page/Vendedor.webp',
    timeline: [
      {
        title: 'Elige productos',
        description:
          'Explora nuestro catálogo y selecciona lo que quieres vender',
        icon: <ShoppingCart />,
        image: '/Landing Page/Vendedor/elige.webp',
      },
      {
        title: 'Vende como quieras',
        description: 'Usa redes sociales, tienda física o marketplace',
        icon: <TrendingUp />,
        image: '/Landing Page/Vendedor/vendecomoquieras.webp',
      },
      {
        title: 'Gana comisión',
        description: 'Obtén ganancias por cada venta realizada',
        icon: <AttachMoney />,
        image: '/Landing Page/Vendedor/ganacomision.webp',
      },
    ],
  },
  {
    title: 'Punto de Venta',
    description: 'Optimiza tu espacio comercial',
    icon: <Groups sx={{ fontSize: { xs: 20, md: 24 } }} />,
    image: '/Landing Page/Punto de Venta.webp',
    timeline: [
      {
        title: 'Vende tu espacio',
        description: 'Ofrece tu local como punto de retiro',
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
]

// Constantes para los proveedores
export const PROVIDERS_DATA = [
  {
    src: '/Landing Page/Nuestros Proveedores/IKEA.webp',
    alt: 'IKEA',
  },
  {
    src: '/Landing Page/Nuestros Proveedores/johnsons.webp',
    alt: "Johnson's",
  },
  {
    src: '/Landing Page/Nuestros Proveedores/laroche.webp',
    alt: 'La Roche',
  },
  {
    src: '/Landing Page/Nuestros Proveedores/pcfactory.webp',
    alt: 'PC Factory',
  },
  {
    src: '/Landing Page/Nuestros Proveedores/walmart.webp',
    alt: 'Walmart',
  },
]
