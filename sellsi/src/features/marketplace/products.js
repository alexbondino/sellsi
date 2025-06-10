export const PRODUCTOS = [
  {
    id: 1,
    nombre: 'DOÑA AURORA BREBAJE ARTESANAL PAIS 6 unidades',
    proveedor: 'Viña Doña Aurora',
    imagen: '/Marketplace productos/notebookasustuf.jpg',
    precio: 10000,
    precioOriginal: 12000,
    descuento: 17,
    categoria: 'Supermercado',
    tipo: 'nuevo',
    // comision: 15, // COMMENTED OUT: Commission functionality removed
    tipoVenta: 'directa',
    rating: 4.8,
    ventas: 234,
    stock: 1876, // 12 * 156
    compraMinima: 15,
    negociable: true, // ✅ AGREGAR: Funcionalidad negociable
  },
  {
    id: 2,
    nombre: 'LATE HARVEST DOÑA AURORA 6 unidades',
    proveedor: 'Viña Doña Aurora',
    imagen: '/Marketplace productos/estufapellet.jpg',
    precio: 5000,
    precioOriginal: 6000,
    descuento: 17,
    categoria: 'Supermercado',
    tipo: 'nuevo',
    // comision: 18, // COMMENTED OUT: Commission functionality removed
    tipoVenta: 'directa',
    rating: 4.5,
    ventas: 89,
    stock: 1368, // 8 * 171
    compraMinima: 22,
    negociable: false, // ✅ AGREGAR: Funcionalidad negociable
  },
  {
    id: 3,
    nombre: 'Cabernet Sauvignon STARCK HAUS 6 unidades',
    proveedor: 'Viña Doña Aurora',
    imagen: '/Marketplace productos/colchonking.jpg',
    precio: 12000,
    precioOriginal: 14400,
    descuento: 17,
    categoria: 'Supermercado',
    tipo: 'nuevo',
    // comision: 20, // COMMENTED OUT: Commission functionality removed
    tipoVenta: 'directa',
    rating: 4.7,
    ventas: 156,
    stock: 745, // 5 * 149
    compraMinima: 18,
    negociable: true, // ✅ AGREGAR: Funcionalidad negociable
  },
  {
    id: 4,
    nombre: 'EL PEUCO ROSE 6 unidades',
    proveedor: 'Viña Doña Aurora',
    imagen: '/Marketplace productos/lavadora.jpg',
    precio: 6000,
    precioOriginal: 7200,
    descuento: 17,
    categoria: 'Supermercado',
    tipo: 'nuevo',
    // comision: 15, // COMMENTED OUT: Commission functionality removed
    tipoVenta: 'directa',
    rating: 4.6,
    ventas: 312,
    stock: 2085, // 15 * 139
    compraMinima: 12,
    negociable: false, // ✅ AGREGAR: Funcionalidad negociable
  },
  {
    id: 5,
    nombre: 'STARCK HAUS 6 unidades',
    proveedor: 'Viña Doña Aurora',
    imagen: '/Marketplace productos/hervidor.jpg',
    precio: 12000,
    precioOriginal: 14400,
    descuento: 17,
    categoria: 'Supermercado',
    tipo: 'oferta',
    // comision: 22, // COMMENTED OUT: Commission functionality removed
    tipoVenta: 'indirecta',
    rating: 4.3,
    ventas: 567,
    stock: 6840, // 45 * 152
    compraMinima: 25,
    negociable: true, // ✅ AGREGAR: Funcionalidad negociable
  },
  {
    id: 6,
    nombre: 'EL PEUCO 6 unidades',
    proveedor: 'Viña Doña Aurora',
    imagen: '/Marketplace productos/estanteria.jpg',
    precio: 6000,
    precioOriginal: 7200,
    descuento: 17,
    categoria: 'Supermercado',
    tipo: 'oferta',
    // comision: 18, // COMMENTED OUT: Commission functionality removed
    tipoVenta: 'directa',
    rating: 4.4,
    ventas: 178,
    stock: 3256, // 22 * 148
    compraMinima: 14,
    negociable: false, // ✅ AGREGAR: Funcionalidad negociable
  },
  {
    id: 7,
    nombre: 'Climatizador portátil',
    proveedor: 'ElectroHogar Chile',
    imagen: '/Marketplace productos/climatizador.webp',
    precio: 119990,
    precioOriginal: 159990,
    descuento: 25,
    categoria: 'Electrodomésticos',
    tipo: 'oferta',
    // comision: 16, // COMMENTED OUT: Commission functionality removed
    tipoVenta: 'directa',
    rating: 4.2,
    ventas: 93,
    stock: 2952, // 18 * 164
    compraMinima: 10,
    negociable: true, // ✅ AGREGAR: Funcionalidad negociable
  },
  {
    id: 8,
    nombre: 'Horno eléctrico',
    proveedor: 'Cocina Profesional',
    imagen: '/Marketplace productos/horno electrico.png',
    precio: 69990,
    precioOriginal: 89990,
    descuento: 22,
    categoria: 'Electrodomésticos',
    tipo: 'oferta',
    // comision: 20, // COMMENTED OUT: Commission functionality removed
    tipoVenta: 'todos',
    rating: 4.5,
    ventas: 145,
    stock: 1463, // 11 * 133
    compraMinima: 28,
    negociable: false, // ✅ AGREGAR: Funcionalidad negociable
  },
  {
    id: 9,
    nombre: 'Zapatos de vestir',
    proveedor: 'Fashion Elite',
    imagen: '/Marketplace productos/zapatos.jpg',
    precio: 39990,
    precioOriginal: 59990,
    descuento: 33,
    categoria: 'Moda',
    tipo: 'top',
    // comision: 25, // COMMENTED OUT: Commission functionality removed
    tipoVenta: 'indirecta',
    rating: 4.1,
    ventas: 423,
    stock: 8308, // 67 * 124
    compraMinima: 20,
    negociable: true, // ✅ AGREGAR: Funcionalidad negociable
  },
  {
    id: 10,
    nombre: 'Silla ergonómica',
    proveedor: 'Oficina Premium',
    imagen: '/Marketplace productos/silla.jpg',
    precio: 89990,
    precioOriginal: 119990,
    descuento: 25,
    categoria: 'Hogar y Muebles',
    tipo: 'top',
    // comision: 18, // COMMENTED OUT: Commission functionality removed
    tipoVenta: 'directa',
    rating: 4.8,
    ventas: 289,
    stock: 1377, // 9 * 153
    compraMinima: 16,
    negociable: false, // ✅ AGREGAR: Funcionalidad negociable
  },
  {
    id: 11,
    nombre: 'Inodoro (WC)',
    proveedor: 'Construcciones del Sur',
    imagen: '/Marketplace productos/WC.jpg',
    precio: 79990,
    precioOriginal: 99990,
    descuento: 20,
    categoria: 'Construcción',
    tipo: 'general',
    // comision: 15, // COMMENTED OUT: Commission functionality removed
    tipoVenta: 'directa',
    rating: 4.0,
    ventas: 78,
    stock: 1904, // 14 * 136
    compraMinima: 30,
    negociable: true, // ✅ AGREGAR: Funcionalidad negociable
  },
  {
    id: 12,
    nombre: 'Limpiador de vidrios',
    proveedor: 'Limpieza Total',
    imagen: '/Marketplace productos/limpiadordevidrios.webp',
    precio: 19990,
    precioOriginal: 24990,
    descuento: 20,
    categoria: 'Hogar y Muebles',
    tipo: 'top',
    // comision: 30, // COMMENTED OUT: Commission functionality removed
    tipoVenta: 'indirecta',
    rating: 4.3,
    ventas: 634,
    stock: 12163, // 89 * 137
    compraMinima: 11,
    negociable: false, // ✅ AGREGAR: Funcionalidad negociable
  },
  {
    id: 13,
    nombre: 'CERRO NAME 6 unidades',
    proveedor: 'Viña Doña Aurora',
    imagen: '/Marketplace productos/bicicleta.jpg',
    precio: 16000,
    precioOriginal: 19200,
    descuento: 17,
    categoria: 'Supermercado',
    tipo: 'general',
    // comision: 12, // COMMENTED OUT: Commission functionality removed
    tipoVenta: 'directa',
    rating: 4.6,
    ventas: 112,
    stock: 882, // 6 * 147
    compraMinima: 26,
    negociable: true, // ✅ AGREGAR: Funcionalidad negociable
  },
]

export const CATEGORIAS = [
  'Tecnología',
  'Electrodomésticos',
  'Hogar y Muebles',
  'Moda',
  'Construcción',
  'Deportes y Fitness',
  'Vehículos',
  'Inmuebles',
  'Supermercado',
  'Accesorios para Vehículos',
  'Belleza y Cuidado personal',
  'Juegos y Juguetes',
  'Mascotas',
  'Herramientas',
  'Compra Internacional',
  'Farmacias',
  'Bebés',
  'Productos Sustentables',
  'Más vendidos',
  'Industrias y Oficinas',
  'Tiendas oficiales',
]
