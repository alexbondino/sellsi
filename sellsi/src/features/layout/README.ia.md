# 🚀 README.ia.md - Módulo Layout (Features/Layout)

---

## 1. 🎯 Resumen ejecutivo del módulo

- **Problema de negocio que resuelve:** Centraliza y estandariza todos los componentes de layout, navegación y estructura visual base de Sellsi, eliminando la inconsistencia de interfaz y proporcionando una experiencia de usuario coherente y profesional en toda la plataforma.

- **Responsabilidad principal:** Proveer componentes de layout reutilizables, navegación adaptativa por rol, optimización de imágenes, selectores universales y elementos de interfaz que mantienen consistencia visual y funcional en toda la aplicación.

- **Posición en la arquitectura:** Módulo frontend fundamental que actúa como la capa de presentación base, utilizado por todos los demás módulos para mantener coherencia visual y navegacional.

- **Criticidad:** ALTA - Es la base visual de toda la aplicación, define la experiencia de navegación y la consistencia de marca.

- **Usuarios objetivo:** Todos los usuarios de la plataforma (compradores y proveedores) que interactúan con la interfaz base, navegación y elementos visuales comunes.

---

## 2. 📊 Análisis de complejidad

- **Líneas de código:** ~2,218 líneas aproximadamente (8 archivos)
- **Complejidad ciclomática:** ALTA - Múltiples rutas de navegación, validaciones complejas, manejo de estados de sesión y roles
- **Acoplamiento:** ALTO - Fuerte dependencia con autenticación, carrito, rutas y servicios globales
- **Cohesión:** ALTA - Todos los componentes están enfocados en layout y experiencia visual base
- **Deuda técnica estimada:** BAJA - Código bien estructurado, componentes modulares, separación clara de responsabilidades

---

## 3. 🗂️ Inventario completo de archivos

| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| TopBar.jsx | Componente | ~597 | ALTA | Barra superior con navegación, autenticación y cambio de rol | supabase, useCartStore, Modal |
| BottomBar.jsx | Componente | ~407 | MEDIA | Footer con navegación, contacto y redes sociales | ContactModal, react-router |
| QuantitySelector.jsx | Componente | ~319 | ALTA | Selector universal de cantidad con validaciones avanzadas | QuantityInputModal, @mui/material |
| SideBar.jsx | Componente | ~309 | MEDIA | Navegación lateral adaptativa según rol de usuario | react-router, @mui/material |
| QuantityInputModal.jsx | Componente | ~201 | MEDIA | Modal para entrada directa de cantidad con validaciones | framer-motion, @mui/material |
| LazyImage.jsx | Componente | ~193 | MEDIA | Imagen optimizada con lazy loading e Intersection Observer | @mui/material, hooks custom |
| MobileBar.jsx | Componente | ~189 | MEDIA | Navegación móvil inferior con menú dinámico | useCartStore, react-router |
| index.js | Barrel | ~3 | BAJA | Exportaciones centralizadas del módulo | N/A |

---

## 4. 🏗️ Arquitectura y patrones

- **Patrones de diseño identificados:**
  - **Composite Pattern:** Composición de elementos de layout y navegación
  - **Strategy Pattern:** Diferentes estrategias de navegación según rol y dispositivo
  - **Observer Pattern:** Intersection Observer para lazy loading
  - **Factory Pattern:** Creación dinámica de elementos de menú
  - **Template Method Pattern:** Plantillas base para componentes de layout
  - **Adapter Pattern:** Adaptación de componentes para diferentes contextos

- **Estructura de carpetas:**
```
layout/
├── index.js (barrel principal)
├── TopBar.jsx (navegación superior)
├── SideBar.jsx (navegación lateral desktop)
├── MobileBar.jsx (navegación móvil)
├── BottomBar.jsx (footer)
├── QuantitySelector.jsx (selector universal)
├── QuantityInputModal.jsx (modal de cantidad)
└── LazyImage.jsx (imágenes optimizadas)
```

- **Flujo de datos principal:**
```
User Interaction → Layout Component → Navigation/Action → Route Change/State Update
                                   ↓
                            Global State (Cart, Auth) ← Services/Hooks
```

- **Puntos de entrada:**
  - `TopBar.jsx`: Entrada principal desde App.jsx
  - `SideBar.jsx`: Navegación principal de dashboard
  - `MobileBar.jsx`: Navegación móvil

- **Puntos de salida:**
  - React Router navigation
  - Global state updates (cart, auth)
  - Modal triggers y callbacks

```
Diagrama de flujo detallado:
User Action → Layout Component → Validation → State Update → UI Feedback
├── Navigation (role-based routing)
├── Authentication (login/logout flows)
└── State management (cart, session, UI state)
```

---

## 5. 🔗 Matriz de dependencias

#### Dependencias externas:
| Dependencia | Versión | Uso específico | Impacto en refactor | Alternativas |
|-------------|---------|----------------|-------------------|--------------|
| @mui/material | ^5.x | UI components y theming | ALTO - Toda la interfaz | Ant Design, Chakra UI |
| @mui/icons-material | ^5.x | Iconografía del sistema | ALTO - Identidad visual | React Icons, Heroicons |
| react-router-dom | ^6.x | Navegación y routing | ALTO - Core navigation | Next.js Router, Reach Router |
| framer-motion | ^10.x | Animaciones suaves | MEDIO - UX enhancement | React Spring, CSS animations |
| react | ^18.x | Framework base | CRÍTICO - Core dependency | N/A |
| supabase-js | ^2.x | Autenticación y sesión | ALTO - Auth management | Firebase Auth, custom auth |

#### Dependencias internas:
| Módulo interno | Tipo uso | Función específica | Acoplamiento |
|----------------|----------|-------------------|--------------|
| ../buyer/hooks/cartStore | Importa | Estado del carrito para badges y navegación | ALTO |
| ../../services/supabase | Importa | Cliente de autenticación | ALTO |
| ../ui/ContactModal | Importa | Modal de contacto reutilizable | MEDIO |
| ../ui/Modal | Importa | Sistema de modales | MEDIO |
| ../ui/Switch | Importa | Switch de rol reutilizable | MEDIO |
| ../login/Login | Importa | Componente de login (lazy) | MEDIO |
| ../register/Register | Importa | Componente de registro (lazy) | MEDIO |
| ../ScrollToTop | Importa | Utilidad de scroll | BAJO |

---

## 6. 🧩 API del módulo

#### Componentes exportados:
```jsx
// Ejemplo de uso completo del layout
import { 
  TopBar, 
  SideBar, 
  MobileBar, 
  BottomBar, 
  LazyImage, 
  QuantitySelector 
} from './layout';

// Layout principal de la aplicación
<TopBar 
  session={session} 
  isBuyer={true} 
  logoUrl="/logo.svg"
  onRoleChange={handleRoleChange}
/>
<SideBar role="buyer" width="250px" />
<MobileBar role="buyer" session={session} />
<BottomBar />

// Componentes utilitarios
<LazyImage src="/product.jpg" alt="Product" />
<QuantitySelector value={1} onChange={setValue} />
```

#### Props detalladas:

**TopBar**
| Prop | Tipo | Requerido | Valor por defecto | Validación | Descripción | Ejemplo |
|------|------|-----------|------------------|------------|-------------|---------|
| session | object | ❌ | null | object/null | Sesión de usuario actual | `{user: {...}}` |
| isBuyer | boolean | ❌ | false | boolean | Si el usuario es comprador | `true/false` |
| logoUrl | string | ❌ | '' | string | URL del logo de la empresa | `"/logo.svg"` |
| onNavigate | function | ❌ | undefined | function | Callback navegación personalizada | `(path) => navigate(path)` |
| onRoleChange | function | ❌ | undefined | function | Callback cambio de rol | `(role) => setRole(role)` |

**SideBar**
| Prop | Tipo | Requerido | Valor por defecto | Validación | Descripción | Ejemplo |
|------|------|-----------|------------------|------------|-------------|---------|
| role | string | ✅ | - | 'buyer'/'supplier' | Rol para menú dinámico | `"buyer"` |
| width | string | ❌ | '210px' | CSS width | Ancho de la sidebar | `"250px"` |
| onWidthChange | function | ❌ | undefined | function | Callback cambio de ancho | `(width) => setWidth(width)` |

**MobileBar**
| Prop | Tipo | Requerido | Valor por defecto | Validación | Descripción | Ejemplo |
|------|------|-----------|------------------|------------|-------------|---------|
| role | string | ✅ | - | 'buyer'/'supplier' | Rol para navegación móvil | `"buyer"` |
| session | boolean | ❌ | false | boolean | Estado de sesión activa | `true/false` |
| isBuyer | boolean | ❌ | false | boolean | Si es usuario comprador | `true/false` |
| logoUrl | string | ❌ | '' | string | Logo para perfil móvil | `"/logo.svg"` |

**QuantitySelector**
| Prop | Tipo | Requerido | Valor por defecto | Validación | Descripción | Ejemplo |
|------|------|-----------|------------------|------------|-------------|---------|
| value | number | ✅ | - | positive number | Cantidad actual | `5` |
| onChange | function | ✅ | - | function | Callback cambio cantidad | `(qty) => setQty(qty)` |
| min | number | ❌ | 1 | positive number | Cantidad mínima | `1` |
| max | number | ❌ | 99 | positive number | Cantidad máxima | `50` |
| disabled | boolean | ❌ | false | boolean | Selector deshabilitado | `true/false` |
| size | string | ❌ | 'medium' | 'small'/'medium'/'large' | Tamaño del selector | `"large"` |
| orientation | string | ❌ | 'horizontal' | 'horizontal'/'vertical' | Orientación del layout | `"vertical"` |

**LazyImage**
| Prop | Tipo | Requerido | Valor por defecto | Validación | Descripción | Ejemplo |
|------|------|-----------|------------------|------------|-------------|---------|
| src | string | ✅ | - | valid URL | URL de la imagen | `"/product.jpg"` |
| alt | string | ✅ | - | string | Texto alternativo | `"Product image"` |
| aspectRatio | string | ❌ | '1' | CSS ratio | Ratio de aspecto | `"16/9"` |
| objectFit | string | ❌ | 'cover' | CSS object-fit | Ajuste de imagen | `"contain"` |
| showSkeleton | boolean | ❌ | true | boolean | Mostrar skeleton loader | `true/false` |

**BottomBar, QuantityInputModal**
- BottomBar: No requiere props, es completamente autónomo
- QuantityInputModal: Props específicas para modal (open, onClose, etc.)

#### Hooks personalizados internos:

**useLazyLoading(rootMargin)**
- **Propósito:** Implementa Intersection Observer para lazy loading
- **Parámetros:** rootMargin (string) - Margen para activar carga
- **Retorno:** [elementRef, isVisible] - Ref y estado de visibilidad
- **Casos de uso:** Optimización de carga de imágenes
- **Limitaciones:** Requiere soporte de Intersection Observer

---

## 7. 🔍 Análisis de estado

- **Estado global usado:**
  - useCartStore: Items del carrito para badges en navegación
  - Supabase session: Estado de autenticación global
  - React Router location: Estado de navegación actual

- **Estado local:**
  - TopBar: menús abiertos, modales, rol actual
  - SideBar: estado colapsado/expandido
  - QuantitySelector: valor temporal, validaciones
  - LazyImage: estados de carga, error, visibilidad
  - MobileBar: navegación activa

- **Persistencia:**
  - No maneja persistencia directa
  - Depende de stores externos (cart, auth)
  - URL state via React Router

- **Sincronización:**
  - Real-time: cambios de rol y autenticación
  - Event-driven: navegación y actualizaciones de carrito
  - Observer-based: lazy loading de imágenes

- **Mutaciones:**
  - Navigation: cambios de ruta via React Router
  - Authentication: login/logout via Supabase
  - UI state: apertura/cierre de menús y modales
  - Cart: acceso directo al carrito

---

## 8. 🎭 Lógica de negocio

- **Reglas de negocio implementadas:**
  - Navegación específica por rol (buyer vs supplier)
  - Autenticación requerida para ciertas acciones
  - Validación de cantidades con límites configurables
  - Optimización de carga de imágenes por performance
  - Responsive behavior para diferentes dispositivos

- **Validaciones:**
  - Authentication validation: sesión válida para acciones protegidas
  - Role validation: menús y acciones según rol de usuario
  - Quantity validation: límites min/max con feedback visual
  - Navigation validation: rutas válidas según permisos
  - Image validation: URLs válidas y fallbacks

- **Transformaciones de datos:**
  - Session data → UI state para autenticación
  - Role data → Menu items dinámicos
  - Cart data → Badge counts y navegación
  - Image URLs → Optimized loading con fallbacks
  - Quantity input → Validated numeric values

- **Casos especiales:**
  - Usuario no autenticado: navegación limitada y login prompts
  - Cambio de rol: actualización dinámica de menús
  - Conexión lenta: skeleton loading para imágenes
  - Dispositivo móvil: navegación adaptativa
  - Error de carga: fallbacks y retry logic

- **Integraciones:**
  - Supabase: autenticación y gestión de sesión
  - React Router: navegación programática
  - Cart Store: sincronización de estado del carrito
  - Modal System: integración con sistema de modales global

---

## 9. 🔄 Flujos de usuario

**Flujo principal de navegación:**
1. Usuario carga aplicación → TopBar se renderiza → Verifica sesión
2. Si autenticado → Muestra menú completo → Habilita navegación por rol
3. Usuario navega → SideBar/MobileBar actualiza → Marca ruta activa
4. Usuario cambia rol → TopBar actualiza → Refresca menús disponibles

**Flujo de autenticación:**
1. Usuario click login → TopBar abre modal → Muestra formulario de login
2. Usuario completa login → Supabase autentica → TopBar actualiza estado
3. Navegación se habilita → Menús se actualizan → Redirección según rol

**Flujo de cantidad (QuantitySelector):**
1. Usuario ajusta cantidad → Componente valida → Aplica límites
2. Si valor inválido → Muestra error → Bloquea cambio
3. Si click en input → Abre modal → Permite entrada directa
4. Usuario confirma → Valida entrada → Aplica cambio

**Flujos alternativos:**
- **Flujo de error:** Error de navegación → Muestra fallback → Permite retry
- **Flujo móvil:** Detecta dispositivo → Usa MobileBar → Adapta navegación
- **Flujo de logout:** Usuario logout → Limpia estado → Redirige a home
- **Flujo de imagen:** Lazy loading → Muestra skeleton → Carga optimizada

---

## 10. 🧪 Puntos de testing

- **Casos de prueba críticos:**
  - Renderizado de navegación según rol de usuario
  - Flujos completos de login/logout
  - Validaciones del QuantitySelector con límites
  - Lazy loading de imágenes con Intersection Observer
  - Navegación responsive entre desktop y móvil
  - Cambio dinámico de roles y actualización de menús
  - Manejo de errores de autenticación

- **Mocks necesarios:**
  - Supabase client y métodos de auth
  - React Router navigation hooks
  - useCartStore con datos de prueba
  - Intersection Observer API
  - Window resize events para responsive
  - Modal system y ContactModal

- **Datos de prueba:**
  - Usuarios con diferentes roles (buyer/supplier)
  - Sesiones válidas e inválidas
  - URLs de imágenes válidas e inválidas
  - Diferentes tamaños de carrito
  - Rutas de navegación válidas e inválidas

- **Escenarios de error:**
  - Fallo de autenticación con Supabase
  - URLs de imagen rotas o timeout
  - Navegación a rutas no autorizadas
  - Pérdida de conexión durante operaciones
  - Errores de validación en quantity selector

- **Performance:**
  - Tiempo de renderizado inicial de TopBar
  - Memoria utilizada en navegación extensa
  - Lag en lazy loading de imágenes
  - Responsive performance en dispositivos lentos

---

## 11. 🚨 Puntos críticos para refactor

- **Código legacy:**
  - Algunos estados locales que podrían centralizarse
  - Hard-coded menu items que podrían ser configurables

- **Antipatrones:**
  - TopBar con demasiadas responsabilidades (600+ LOC)
  - Lógica de navegación duplicada entre SideBar y MobileBar
  - Props drilling en algunos componentes anidados

- **Oportunidades de mejora:**
  - Separar lógica de autenticación del TopBar
  - Centralizar configuración de menús
  - Implementar error boundaries específicos
  - Migrar a compound components pattern
  - Implementar virtualization para menús grandes
  - Mejorar accesibilidad con ARIA labels

- **Riesgos:**
  - Cambios en TopBar pueden afectar toda la aplicación
  - Dependencia fuerte de estructura de Supabase auth
  - Breaking changes en Material-UI pueden requerir refactor extenso
  - Cambios en roles de usuario requieren actualización manual de menús

- **Orden de refactor:**
  1. **Prioridad ALTA:** Separar lógica de auth del TopBar
  2. **Prioridad ALTA:** Centralizar configuración de menús dinámicos
  3. **Prioridad MEDIA:** Implementar error boundaries
  4. **Prioridad MEDIA:** Migrar a compound components
  5. **Prioridad BAJA:** Optimizaciones de performance y bundle

---

## 12. 🔧 Consideraciones técnicas

#### Limitaciones actuales:
- **Performance:**
  - Re-renders frecuentes en TopBar con cambios de estado
  - Intersection Observer puede ser costoso con muchas imágenes
  - Sin memoización en cálculos de menús dinámicos

- **Memoria:**
  - Event listeners no limpiados en algunos casos
  - Referencias a imágenes pueden causar memory leaks
  - Estados locales acumulados en navegación extensa

- **Escalabilidad:**
  - Menús hardcoded no escalan con nuevos roles
  - Sin sistema de permisos granular
  - Falta de internacionalización (i18n)

- **Compatibilidad:**
  - Requiere Intersection Observer (polyfill para IE)
  - Dependencia de localStorage para algunos estados
  - Sin fallbacks para JavaScript deshabilitado

#### Configuración requerida:
- **Variables de entorno:**
  - VITE_SUPABASE_URL: Para autenticación
  - VITE_SUPABASE_ANON_KEY: Clave pública

- **Inicialización:**
  - React Router configurado con rutas
  - Supabase client inicializado
  - Material-UI theme provider

- **Permisos:**
  - No requiere permisos especiales del navegador

---

## 13. 🛡️ Seguridad y compliance

- **Datos sensibles:**
  - Tokens de sesión de Supabase
  - Información de rol y permisos de usuario
  - URLs de logos y avatares de usuario

- **Validaciones de seguridad:**
  - Validación de sesión antes de mostrar contenido protegido
  - Sanitización de URLs de imágenes
  - Validación de navegación según permisos de rol

- **Permisos:**
  - Navegación basada en rol de usuario autenticado
  - Acceso a carrito requiere sesión válida
  - Funciones admin ocultas para usuarios normales

- **Auditoría:**
  - No implementa logging específico
  - Depende de logging de Supabase para auth events

---

## 14. 📚 Referencias y documentación

- **Documentación técnica:**
  - [Material-UI Layout Components](https://mui.com/material-ui/react-app-bar/)
  - [React Router Navigation](https://reactrouter.com/en/main/components/nav-link)
  - [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
  - [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/react)

- **Decisiones de arquitectura:**
  - Material-UI elegido para consistencia de diseño
  - Componentes modulares para reusabilidad máxima
  - Lazy loading implementado para performance
  - Navegación adaptativa para mejor UX móvil

- **Recursos externos:**
  - Intersection Observer polyfill para compatibilidad
  - Framer Motion para animaciones suaves
  - React Router para SPA navigation

- **Historial de cambios:**
  - v1.0: Implementación inicial de TopBar y SideBar
  - v1.1: Adición de MobileBar para responsividad
  - v1.2: Implementación de LazyImage con optimizaciones
  - v1.3: Mejoras en QuantitySelector y accesibilidad

---

## 15. 🎨 Ejemplos de uso avanzados

```jsx
// Ejemplo 1: Layout completo con configuración avanzada
import { TopBar, SideBar, MobileBar, BottomBar } from './layout';

function LayoutWrapper({ children }) {
  const [sidebarWidth, setSidebarWidth] = useState('250px');
  
  return (
    <Box>
      <TopBar 
        session={session}
        isBuyer={userRole === 'buyer'}
        logoUrl={companyLogo}
        onRoleChange={handleRoleSwitch}
      />
      
      <SideBar 
        role={userRole}
        width={sidebarWidth}
        onWidthChange={(width, collapsed) => {
          setSidebarWidth(width);
          handleLayoutResize(collapsed);
        }}
      />
      
      <MobileBar role={userRole} session={!!session} />
      
      <main style={{ marginLeft: sidebarWidth }}>
        {children}
      </main>
      
      <BottomBar />
    </Box>
  );
}

// Ejemplo 2: QuantitySelector personalizado
function ProductQuantity({ product }) {
  const [quantity, setQuantity] = useState(1);
  
  return (
    <QuantitySelector
      value={quantity}
      onChange={setQuantity}
      min={product.minOrder || 1}
      max={product.stock}
      size="large"
      orientation="horizontal"
      showStockLimit={true}
      stockText={`Stock: ${product.stock}`}
      label="Cantidad a comprar"
      disabled={!product.available}
    />
  );
}

// Ejemplo 3: LazyImage con configuración avanzada
function ProductImageGallery({ images }) {
  return (
    <Grid container spacing={2}>
      {images.map((image, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <LazyImage
            src={image.url}
            alt={image.alt}
            aspectRatio="4/3"
            objectFit="cover"
            borderRadius={8}
            showSkeleton={true}
            rootMargin="50px"
            onLoad={() => analytics.track('image_loaded')}
            onError={() => console.error('Image failed to load')}
            sx={{
              cursor: 'pointer',
              '&:hover': { transform: 'scale(1.05)' }
            }}
          />
        </Grid>
      ))}
    </Grid>
  );
}

// Ejemplo 4: Navegación condicional
function ConditionalNavigation({ userRole, permissions }) {
  if (!permissions.canAccessDashboard) {
    return <MobileBar role="guest" />;
  }
  
  return (
    <>
      <SideBar 
        role={userRole}
        width={permissions.canCollapseSidebar ? '250px' : '180px'}
      />
      {permissions.isMobileUser && (
        <MobileBar role={userRole} session={true} />
      )}
    </>
  );
}

// Ejemplo 5: Layout con error boundary
function SafeLayout({ children }) {
  return (
    <ErrorBoundary
      fallback={<div>Error en el layout</div>}
      onError={(error) => console.error('Layout error:', error)}
    >
      <TopBar session={session} />
      <SideBar role="buyer" />
      {children}
      <BottomBar />
    </ErrorBoundary>
  );
}
```

---

## 16. 🔄 Guía de migración

- **Desde versión anterior:**
  - MobileBar es nuevo: agregar para soporte móvil
  - QuantitySelector unificado: migrar llamadas dispersas
  - LazyImage optimizada: reemplazar img tags básicos

- **Breaking changes:**
  - Cambios en props de TopBar si se actualiza auth system
  - Estructura de menús si se modifican roles
  - LazyImage API si se cambian parámetros

- **Checklist de migración:**
  - [ ] Verificar compatibilidad de props en TopBar
  - [ ] Migrar componentes a usar LazyImage
  - [ ] Implementar MobileBar en layouts móviles
  - [ ] Probar navegación con nuevos roles
  - [ ] Verificar responsive behavior

- **Rollback:**
  - Revertir a componentes de imagen básicos
  - Restaurar menús hardcoded si falla configuración dinámica
  - Usar navegación básica si MobileBar causa problemas

---

## 17. 📋 Metadatos del documento

- **Creado:** 18/07/2025
- **Última actualización:** 18/07/2025
- **Versión del código:** staging branch
- **Autor:** Generado automáticamente por Pipeline ReadmeV4
- **Próxima revisión:** 01/08/2025
- **Cobertura de análisis:** 8 archivos, ~2,218 LOC
- **Nivel de detalle:** Completo para refactor y mantenimiento
- **Estado del módulo:** Producción activa, base de toda la aplicación
