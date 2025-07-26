# 🚀 README.ia.md - Análisis Profundo del Módulo `domains`

## 1. 🎯 Resumen ejecutivo del módulo

- **Problema de negocio que resuelve:** Organización por dominios de negocio de toda la lógica funcional de Sellsi, siguiendo Domain Driven Design (DDD) para separar responsabilidades por contextos de negocio específicos (autenticación, administración, compras, ventas, perfiles, etc.)

- **Responsabilidad principal:** Centralizar y organizar toda la lógica de negocio en dominios cohesivos e independientes, facilitando el mantenimiento, testing y escalabilidad del sistema

- **Posición en la arquitectura:** Capa de dominio central que actúa como intermediario entre la capa de presentación (components/features) y la capa de infraestructura (services), implementando patrones DDD

- **Criticidad:** CRÍTICA - Es el núcleo arquitectónico que define la estructura y organización de toda la aplicación

- **Usuarios objetivo:** Desarrolladores del equipo Sellsi, arquitectos de software, y cualquier desarrollador que necesite entender o extender la funcionalidad de negocio

## 2. 📊 Análisis de complejidad

- **Líneas de código:** ~59,783 líneas distribuidas en 348 archivos
- **Complejidad ciclomática:** ALTA - Múltiples dominios con lógica de negocio compleja, hooks especializados, y flujos de datos intrincados
- **Acoplamiento:** MEDIO - Dominios bien separados pero con dependencias compartidas a través del barrel exports en index.js
- **Cohesión:** ALTA - Cada dominio mantiene responsabilidades específicas y bien definidas
- **Deuda técnica estimada:** MEDIA - Refactorización reciente ha mejorado la estructura, pero algunos dominios pueden beneficiarse de mayor modularización

## 3. 🗂️ Inventario completo de archivos

### Dominio Admin
| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| index.js | Barrel | ~15 | BAJA | Exportaciones centrales admin | N/A |
| hooks/* | Hooks | ~800 | ALTA | Hooks de administración | react, supabase |
| pages/* | Páginas | ~1200 | ALTA | Interfaces administrativas | @mui/material |

### Dominio Auth  
| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| index.js | Barrel | ~20 | BAJA | Exportaciones centrales auth | N/A |
| services/* | Servicios | ~600 | ALTA | Lógica de autenticación | supabase-js |
| hooks/* | Hooks | ~500 | MEDIA | Hooks de sesión y auth | react |

### Dominio Ban
| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| index.js | Barrel | ~10 | BAJA | Exportaciones centrales ban | N/A |
| components/* | Componentes | ~400 | MEDIA | UI para sistema de bans | @mui/material |
| hooks/* | Hooks | ~300 | MEDIA | Lógica de verificación ban | react |

### Dominio Buyer
| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| index.js | Barrel | ~25 | BAJA | Exportaciones centrales buyer | N/A |
| pages/* | Páginas | ~2000 | ALTA | Interfaces de comprador | @mui/material |
| hooks/* | Hooks | ~1500 | ALTA | Hooks de carrito y compras | zustand, react |

### Dominio Checkout
| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| index.js | Barrel | ~30 | BAJA | Exportaciones centrales checkout | N/A |
| pages/* | Páginas | ~1800 | ALTA | Proceso de checkout | @mui/material |
| hooks/* | Hooks | ~600 | ALTA | Hooks de pago | react |
| services/* | Servicios | ~800 | ALTA | Integración pagos | khipu, supabase |

### Dominio Marketplace
| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| index.js | Barrel | ~20 | BAJA | Exportaciones centrales marketplace | N/A |
| components/* | Componentes | ~3000 | ALTA | UI del marketplace | @mui/material |
| hooks/* | Hooks | ~2000 | ALTA | Hooks de productos y filtros | react |
| utils/* | Utilidades | ~500 | MEDIA | Helpers del marketplace | lodash |

### Dominio Profile
| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| index.js | Barrel | ~15 | BAJA | Exportaciones centrales profile | N/A |
| pages/* | Páginas | ~800 | MEDIA | Gestión de perfiles | @mui/material |
| hooks/* | Hooks | ~600 | MEDIA | Hooks de perfil | react |
| components/* | Componentes | ~700 | MEDIA | UI de perfil | @mui/material |

### Dominio Supplier
| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| index.js | Barrel | ~15 | BAJA | Exportaciones centrales supplier | N/A |
| hooks/* | Hooks | ~8000 | CRÍTICA | Hooks complejos de productos | react, zustand |
| pages/* | Páginas | ~15000 | CRÍTICA | Dashboard y gestión productos | @mui/material |
| components/* | Componentes | ~10000 | ALTA | UI especializada supplier | @mui/material |

## 4. 🏗️ Arquitectura y patrones

- **Patrones de diseño identificados:**
  - **Domain Driven Design (DDD)**: Separación por contextos de negocio
  - **Facade Pattern**: Hooks principales que encapsulan complejidad
  - **Barrel Exports**: index.js centraliza exportaciones
  - **Composite Pattern**: Hooks compuestos que combinan funcionalidades
  - **Repository Pattern**: Services actúan como repositories de datos

- **Estructura de carpetas:**
```
domains/
├── admin/          # Gestión administrativa
├── auth/           # Autenticación y autorización
├── ban/            # Sistema de bans de usuarios
├── buyer/          # Funcionalidad de comprador
├── checkout/       # Proceso de pago
├── marketplace/    # Marketplace público
├── profile/        # Gestión de perfiles
├── supplier/       # Funcionalidad de proveedor
└── index.js        # Barrel exports central
```

- **Flujo de datos principal:**
```
UI Components → Domain Hooks → Domain Services → Supabase/External APIs
     ↑                ↓
Domain Pages ← Domain State Management (Zustand)
```

- **Puntos de entrada:**
  - `index.js`: Barrel export principal
  - Cada dominio expone su propio `index.js`
  - Hooks principales actúan como facades

- **Puntos de salida:**
  - Exportaciones nombradas y por defecto
  - APIs consistentes por dominio
  - Hooks reutilizables cross-domain

## 5. 🔗 Matriz de dependencias

#### Dependencias externas:
| Dependencia | Versión | Uso específico | Impacto en refactor | Alternativas |
|-------------|---------|----------------|-------------------|--------------|
| react | ^18.x | Hooks y componentes | CRÍTICO - Base del sistema | Ninguna viable |
| @mui/material | ^5.x | UI components | ALTO - Toda la interfaz | Chakra UI, Ant Design |
| zustand | ^4.x | Estado global | ALTO - Gestión de estado | Redux Toolkit, Jotai |
| supabase-js | ^2.x | Backend y DB | CRÍTICO - Toda la persistencia | Firebase, AWS Amplify |
| react-router-dom | ^6.x | Navegación | ALTO - Rutas y navegación | Reach Router |
| framer-motion | ^10.x | Animaciones | MEDIO - UX mejorada | React Spring |

#### Dependencias internas:
| Módulo interno | Tipo uso | Función específica | Acoplamiento |
|----------------|----------|-------------------|--------------|
| services/* | Importa | Comunicación con backend | ALTO |
| utils/* | Importa | Utilidades compartidas | MEDIO |
| shared/* | Importa | Componentes reutilizables | MEDIO |
| infrastructure/* | Importa | Configuración y setup | ALTO |

## 6. 🧩 API del módulo

#### Exportaciones principales:
```jsx
// Uso básico - importar dominio completo
import { Admin, Auth, Buyer, Supplier } from '@/domains';

// Uso específico - importar elementos específicos
import { 
  useSupplierProducts, 
  ProviderHome,
  MyProducts 
} from '@/domains/supplier';

// Uso de utilidades cross-domain  
import { AVAILABLE_DOMAINS, isDomainAvailable } from '@/domains';
```

#### API por dominio:

**Dominio Supplier (El más complejo)**
| Export | Tipo | Requerido | Descripción | Ejemplo |
|--------|------|-----------|-------------|---------|
| useSupplierProducts | Hook | ❌ | Hook principal facade | `const { products, loading } = useSupplierProducts()` |
| useSupplierProductsCRUD | Hook | ❌ | Solo CRUD básico | `const { create, update, delete } = useSupplierProductsCRUD()` |
| ProviderHome | Componente | ❌ | Dashboard principal | `<ProviderHome />` |
| MyProducts | Componente | ❌ | Gestión de productos | `<MyProducts />` |

**Dominio Auth**
| Export | Tipo | Requerido | Descripción | Ejemplo |
|--------|------|-----------|-------------|---------|
| useAuth | Hook | ❌ | Estado de autenticación | `const { user, login, logout } = useAuth()` |
| useSession | Hook | ❌ | Gestión de sesión | `const { session, refresh } = useSession()` |

**Dominio Buyer**
| Export | Tipo | Requerido | Descripción | Ejemplo |
|--------|------|-----------|-------------|---------|
| useCart | Hook | ❌ | Gestión del carrito | `const { items, addItem, removeItem } = useCart()` |
| MarketplaceBuyer | Componente | ❌ | Vista de comprador | `<MarketplaceBuyer />` |

## 7. 🔍 Análisis de estado

- **Estado global usado:**
  - Zustand stores por dominio (cart, products, auth, etc.)
  - Context providers para datos transversales
  - Supabase real-time subscriptions

- **Estado local:**
  - React useState en hooks especializados
  - Form state en componentes de formularios
  - UI state (loading, errors, modals)

- **Persistencia:**
  - localStorage: carrito, preferencias usuario
  - sessionStorage: datos temporales de sesión
  - Supabase: datos permanentes
  - IndexedDB: cache de imágenes y datos grandes

- **Sincronización:**
  - Real-time con Supabase subscriptions
  - Polling manual para datos críticos
  - Optimistic updates con rollback

- **Mutaciones:**
  - CRUD operations vía services
  - Estado optimista con confirmación
  - Background sync para operaciones no críticas

## 8. 🎭 Lógica de negocio

- **Reglas de negocio implementadas:**
  - **Supplier**: Validación de productos, gestión de inventario, tramos de precio
  - **Buyer**: Límites de carrito, validación de stock, cálculo de descuentos
  - **Auth**: Roles y permisos, sesiones, 2FA para admin
  - **Checkout**: Validación de pagos, integración Khipu, confirmación de órdenes
  - **Profile**: Validación de datos, campos sensibles, upload de imágenes

- **Validaciones:**
  - Validación en tiempo real con schemas
  - Validación cruzada entre campos
  - Validación de permisos por rol
  - Sanitización de datos de entrada

- **Transformaciones de datos:**
  - Normalización de datos de APIs externas
  - Formateo de precios y monedas  
  - Optimización de imágenes
  - Serialización para persistencia

- **Casos especiales:**
  - Manejo de usuarios baneados
  - Productos sin stock
  - Pagos fallidos o cancelados
  - Sesiones expiradas

- **Integraciones:**
  - Supabase (DB, Auth, Storage)
  - Khipu (Pagos)
  - Servicios de imágenes y CDN

## 9. 🔄 Flujos de usuario

**Flujo principal Supplier:**
1. Usuario crea producto → Validación → Guardado → Actualización UI
2. Usuario sube imagen → Optimización → Upload → Preview → Confirmación
3. Usuario configura precio → Validación tramos → Cálculo automático → Guardado

**Flujo principal Buyer:**
1. Usuario busca producto → Filtros → Resultados → Selección
2. Usuario agrega al carrito → Validación stock → Actualización carrito → Confirmación
3. Usuario procede al checkout → Validación → Método pago → Confirmación → Orden

**Flujos de error:**
- Error de red → Retry automático → Notificación usuario
- Sesión expirada → Redirect login → Recuperación estado
- Validación fallida → Mensajes específicos → Corrección guiada

## 10. 🧪 Puntos de testing

- **Casos de prueba críticos:**
  - CRUD operations en todos los dominios
  - Flujos de autenticación y autorización
  - Validaciones de formularios
  - Integración con Supabase
  - Estado optimista y rollback

- **Mocks necesarios:**
  - Supabase client y responses
  - Servicios de pago (Khipu)
  - LocalStorage y SessionStorage
  - File uploads y image processing
  - Router y navegación

- **Datos de prueba:**
  - Usuarios con diferentes roles
  - Productos con diferentes estados
  - Órdenes en varios estados
  - Datos de pago ficticios

- **Escenarios de error:**
  - Network failures
  - Invalid data
  - Authentication errors
  - Payment failures
  - Storage errors

## 11. 🚨 Puntos críticos para refactor

- **Código legacy:** 
  - Algunos hooks del dominio supplier tienen alta complejidad
  - Patrones inconsistentes entre dominios más antiguos vs nuevos

- **Antipatrones:**
  - Algunos hooks hacen demasiadas cosas (violando SRP)
  - Dependencias circulares entre algunos hooks
  - Estado local no persistente en componentes grandes

- **Oportunidades de mejora:**
  - Standardizar patrones de error handling
  - Implementar cache layer común
  - Mejorar typing con TypeScript
  - Optimizar re-renders con React.memo

- **Riesgos:**
  - Dominio supplier es crítico y complejo
  - Cambios en auth afectan toda la app
  - Estado del carrito debe mantener consistencia

- **Orden de refactor:**
  1. Migrar hooks complejos a TypeScript
  2. Standardizar error handling
  3. Implementar testing comprehensive  
  4. Optimizar performance crítica

## 12. 🔧 Consideraciones técnicas

#### Limitaciones actuales:
- **Performance:** Algunos hooks del supplier son pesados computacionalmente
- **Memoria:** Posibles leaks en subscriptions de Supabase
- **Escalabilidad:** Barrel exports pueden crecer excesivamente
- **Compatibilidad:** Dependencia fuerte de características modernas de React

#### Configuración requerida:
- **Variables de entorno:** 
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_KHIPU_*` variables
- **Inicialización:** Setup de Supabase client
- **Permisos:** RLS policies configuradas en Supabase

## 13. 🛡️ Seguridad y compliance

- **Datos sensibles:** Información de usuarios, datos de pago, tokens de sesión
- **Validaciones de seguridad:** 
  - Sanitización de inputs
  - Validación de permisos por operación
  - Rate limiting en operations críticas
- **Permisos:** Sistema de roles (buyer, supplier, admin)
- **Auditoría:** Logs de operaciones críticas, tracking de cambios

## 14. 📚 Referencias y documentación

- **Documentación técnica:** READMEs específicos por dominio
- **Decisiones de arquitectura:** DDD implementation basada en contextos de negocio
- **Recursos externos:** 
  - [Supabase Docs](https://supabase.com/docs)
  - [Zustand Guide](https://github.com/pmndrs/zustand)
  - [Domain Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)

## 15. 🎨 Ejemplos de uso avanzados

### Ejemplo 1: Uso básico de dominio
```jsx
import { Supplier } from '@/domains';

function SupplierDashboard() {
  const { products, loading, error, createProduct } = Supplier.useSupplierProducts();
  
  return (
    <div>
      {loading && <p>Cargando productos...</p>}
      {error && <p>Error: {error.message}</p>}
      <Supplier.ProviderHome />
    </div>
  );
}
```

### Ejemplo 2: Composición de hooks
```jsx
import { Buyer, Marketplace } from '@/domains';

function ShoppingExperience() {
  const { items, addToCart } = Buyer.useCart();
  const { products, filters } = Marketplace.useProducts();
  
  const handleAddProduct = (product) => {
    addToCart(product);
    // Lógica adicional
  };
  
  return (
    <Marketplace.ProductGrid 
      products={products}
      onAddToCart={handleAddProduct}
    />
  );
}
```

### Ejemplo 3: Manejo de errores cross-domain
```jsx
import { Auth, Profile } from '@/domains';

function UserProfile() {
  const { user, logout } = Auth.useAuth();
  const { updateProfile, error } = Profile.useProfile();
  
  useErrorHandler(error, {
    unauthorized: logout,
    validation: (err) => showValidationErrors(err),
    network: () => toast.error('Error de conexión')
  });
  
  return <Profile.ProfileForm onSave={updateProfile} />;
}
```

### Ejemplo 4: Integración completa
```jsx
import { 
  Auth, 
  Buyer, 
  Checkout, 
  AVAILABLE_DOMAINS 
} from '@/domains';

function CompleteCheckoutFlow() {
  const { user } = Auth.useAuth();
  const { items, total } = Buyer.useCart();
  const { processPayment } = Checkout.usePayment();
  
  // Verificar dominios disponibles
  const canCheckout = AVAILABLE_DOMAINS.CHECKOUT && 
                     AVAILABLE_DOMAINS.BUYER;
  
  if (!canCheckout) {
    return <div>Checkout no disponible</div>;
  }
  
  return (
    <Checkout.PaymentFlow 
      user={user}
      items={items}
      total={total}
      onPayment={processPayment}
    />
  );
}
```

## 16. 🔄 Guía de migración

- **Desde versión anterior:** 
  - Migrar imports directos a barrel exports
  - Actualizar hooks deprecados por nuevas versiones
  - Revisar breaking changes en APIs de dominio

- **Breaking changes:**
  - Estructura de exports ha cambiado
  - Algunos hooks han sido refactorizados con nuevas APIs
  - Dependencias de MUI actualizadas

- **Checklist de migración:**
  - [ ] Actualizar imports a nuevos barrel exports
  - [ ] Revisar uso de hooks deprecados
  - [ ] Actualizar tests que dependían de estructura anterior
  - [ ] Verificar funcionamiento de integraciones externas

## 17. 📋 Metadatos del documento

- **Creado:** 23/07/2025
- **Última actualización:** 23/07/2025  
- **Versión del código:** Sprint-3.0 branch
- **Autor:** Generado automáticamente por Pipeline ReadmeV4
- **Próxima revisión:** 30/07/2025

---

## 🎯 Conclusiones del análisis ultra profundo

### ✅ Fortalezas identificadas:
1. **Arquitectura sólida**: DDD bien implementado con separación clara de responsabilidades
2. **Refactorización exitosa**: El dominio supplier muestra excelente modularización post-refactor
3. **Consistencia**: Barrel exports y patrones consistentes entre dominios
4. **Escalabilidad**: Estructura preparada para crecimiento

### ⚠️ Áreas de mejora identificadas:
1. **Dominio supplier**: Aunque refactorizado, aún contiene la mayor complejidad (23,000+ LOC)
2. **Testing coverage**: Falta documentación de cobertura de tests
3. **TypeScript migration**: Oportunidad de migrar a TS para mejor type safety
4. **Performance optimization**: Algunos hooks podrían beneficiarse de optimización

### 🔥 Puntos calientes que requieren atención:
1. **Supplier hooks**: Revisar `useSupplierProducts` y hooks relacionados para posible simplificación adicional
2. **Cross-domain dependencies**: Revisar y documentar dependencias entre dominios
3. **Error handling**: Standardizar manejo de errores entre todos los dominios
4. **State management**: Evaluar consolidación de stores de Zustand

### 🚀 Recomendaciones de próximos pasos:
1. Implementar testing comprehensivo para dominios críticos
2. Migración gradual a TypeScript empezando por interfaces más simples
3. Crear documentación específica de performance benchmarks
4. Implementar monitoring y métricas de uso por dominio
