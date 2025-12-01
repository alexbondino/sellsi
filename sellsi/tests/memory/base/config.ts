/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  CONFIGURACIÓN CENTRALIZADA PARA TESTS E2E                                ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Única fuente de verdad para:                                             ║
 * ║    • CONFIG: URLs, credenciales, timeouts, umbrales                       ║
 * ║    • ROUTES: Rutas de la aplicación                                       ║
 * ║    • SELECTORS: Selectores DOM para navegación                            ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN GENERAL
// ═══════════════════════════════════════════════════════════════════════════
export const CONFIG = {
  baseUrl: 'http://localhost:3000',
  credentials: {
    email: 'klausanderson95@gmail.com',
    password: 'Aa1234567',
  },
  // Tiempos de espera
  waitTime: 5000,          // Espera estándar entre navegaciones
  measureDelay: 2000,      // Delay antes de medir métricas
  modalAnimationDelay: 2000, // Espera animación modal MUI
  sessionCheckDelay: 3000,  // Espera para detectar estado de sesión
  // Configuración de tests
  cycles: {
    memory: 5,       // Ciclos para test de memoria
    performance: 2,  // Ciclos para test de performance
  },
  // Umbrales
  thresholds: {
    memoryGrowthMB: 30,     // Máximo crecimiento de memoria permitido
    scriptDurationMs: 100,   // Máximo tiempo JS por navegación
    layoutDurationMs: 50,    // Máximo tiempo de layout
    layoutCount: 10,         // Máximo número de reflows
    longTaskCount: 5,        // Máximo long tasks permitidos
    blockingTimeMs: 300,     // Máximo blocking time total
    heapSizeMB: 100,         // Alerta de heap alto
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// RUTAS DE LA APLICACIÓN
// ═══════════════════════════════════════════════════════════════════════════
// Basadas en SideBar.jsx líneas 31-35:
// buyerMenuItems = [
//   { text: 'Marketplace', path: '/buyer/marketplace', icon: <MarketplaceIcon /> },
//   { text: 'Mis Ofertas', path: '/buyer/offers', icon: <OffersIcon /> },
//   { text: 'Mis Pedidos', path: '/buyer/orders', icon: <OrdersIcon /> },
// ]
export const ROUTES = {
  home: '/',
  buyer: {
    marketplace: '/buyer/marketplace',
    offers: '/buyer/offers',
    orders: '/buyer/orders',
    cart: '/buyer/cart',
    paymentMethod: '/buyer/paymentmethod',
  },
  supplier: {
    products: '/supplier/products',
    orders: '/supplier/orders',
    analytics: '/supplier/analytics',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SELECTORES DOM
// ═══════════════════════════════════════════════════════════════════════════
export const SELECTORS = {
  // -------------------------------------------------------------------------
  // TOPBAR SIN SESIÓN (TopBarContainer.jsx líneas 141-158)
  // -------------------------------------------------------------------------
  loginButton: 'button:has-text("Iniciar sesión")',
  registerButton: 'button:has-text("Registrarse")',

  // -------------------------------------------------------------------------
  // TOPBAR CON SESIÓN (TopBarContainer.jsx líneas 159-177)
  // -------------------------------------------------------------------------
  cartIconButton: '[title="Carrito"], button:has(svg[data-testid="ShoppingCartIcon"])',
  profileButton: '#topbar-profile-button',
  roleSwitch: '[class*="MuiSwitch"], [role="switch"]',

  // -------------------------------------------------------------------------
  // LOGIN MODAL (Login.jsx líneas 72-123)
  // -------------------------------------------------------------------------
  emailInput: 'input[placeholder="Ingrese su correo electrónico"]',
  passwordInput: 'input[type="password"][placeholder="Ingrese su contraseña"]',
  submitButton: 'button:has-text("Aceptar")',

  // -------------------------------------------------------------------------
  // SIDEBAR (SideBar.jsx)
  // -------------------------------------------------------------------------
  sidebarItem: (text: string) => `[role="button"]:has-text("${text}")`,
  sidebarItemByPath: (path: string) => `a[href="${path}"], [role="button"][href="${path}"]`,

  // -------------------------------------------------------------------------
  // PRODUCT CARD (ProductCard.jsx)
  // -------------------------------------------------------------------------
  productCard: '.MuiCard-root',
};

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS EXPORTADOS
// ═══════════════════════════════════════════════════════════════════════════
export type TestConfig = typeof CONFIG;
export type AppRoutes = typeof ROUTES;
export type DOMSelectors = typeof SELECTORS;
