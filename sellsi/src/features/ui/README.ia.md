# 🚀 README.ia.md - Módulo UI

## 1. 🎯 Resumen ejecutivo del módulo
- **Problema de negocio que resuelve:** Proporciona un sistema de componentes de interfaz unificado para toda la plataforma Sellsi, garantizando coherencia visual, accesibilidad y experiencia de usuario profesional
- **Responsabilidad principal:** Centralizar componentes reutilizables de UI y establecer estándares de diseño consistentes
- **Posición en la arquitectura:** Capa de presentación - Biblioteca de componentes base que sirve a todos los módulos de la aplicación
- **Criticidad:** ALTA - Es la base visual de toda la aplicación y afecta directamente la experiencia del usuario
- **Usuarios objetivo:** Desarrolladores frontend, equipos de UX/UI, y usuarios finales que interactúan con la interfaz

## 2. 📊 Análisis de complejidad
- **Líneas de código:** ~8,837 LOC
- **Complejidad ciclomática:** MEDIA-ALTA - Alto número de props opcionales, estados complejos y lógica de interacción
- **Acoplamiento:** MEDIO - Dependiente de Material-UI y hooks internos, algunos componentes acoplados a módulos específicos
- **Cohesión:** ALTA - Todos los componentes están relacionados funcionalmente con la presentación y UI
- **Deuda técnica estimada:** MEDIA - Necesita consolidación de variantes similares, testing automatizado y optimización de bundle

## 3. 🗂️ Inventario completo de archivos
| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| wizard/Wizard.jsx | Componente | ~244 | ALTA | Sistema wizard navegable con auto-avance | @mui/material, hooks avanzados |
| SearchBar.jsx | Componente | ~282 | MEDIA | Barra de búsqueda con debouncing y filtros | @mui/material, useDebounce |
| StatsCards.jsx | Componente | ~250 | MEDIA | Dashboard de métricas y estadísticas | @mui/material, formatters |
| table/Table.jsx | Componente | ~150 | MEDIA | Tabla de datos con filtros y ordenamiento | @mui/material, filtros |
| Modal.jsx | Componente | ~120 | BAJA | Modal genérico reutilizable | @mui/material |
| PrimaryButton.jsx | Componente | ~80 | BAJA | Botón principal estilizado | @mui/material |
| banner/BannerContext.jsx | Context | ~50 | BAJA | Context para sistema de notificaciones | React Context |
| SecurityBadge.jsx | Componente | ~143 | MEDIA | Indicador de confianza y verificación | @mui/material, iconos |
| ContactModal.jsx | Componente | ~200 | MEDIA | Modal de contacto con soporte | @mui/material, routing |
| ProfileImageModal.jsx | Componente | ~388 | ALTA | Modal complejo para subida de imágenes | @mui/material, file handling |
| ShippingRegionsModal.jsx | Componente | ~481 | ALTA | Modal gestión regiones de envío | @mui/material, geolocalización |
| product-card/ProductCardSupplierContext.jsx | Componente | ~180 | MEDIA | Tarjeta de producto para proveedores | formatters, ActionMenu |
| graphs/BarChart.jsx | Componente | ~120 | MEDIA | Gráfico de barras para métricas | @mui/x-charts |
| CheckoutProgressStepper.jsx | Componente | ~205 | MEDIA | Stepper para proceso de checkout | @mui/material, constants |
| FileUploader.jsx | Componente | ~100 | MEDIA | Componente genérico subida archivos | React refs, file handling |
| CountrySelector.jsx | Componente | ~80 | BAJA | Selector de países e indicativos | @mui/material |
| Switch.jsx | Componente | ~19 | BAJA | Switch toggle personalizado | @mui/material |
| RequestList.jsx | Componente | ~174 | MEDIA | Lista de solicitudes/requests | @mui/material |
| PasswordRequirements.jsx | Componente | ~60 | BAJA | Validador visual de contraseñas | @mui/material, iconos |
| NotFound.jsx | Componente | ~50 | BAJA | Página 404 personalizada | @mui/material, routing |
| LoadingOverlay.jsx | Componente | ~40 | BAJA | Overlay de carga | @mui/material |
| ScrollToTop.jsx | Utilidad | ~23 | BAJA | Control automático de scroll en navegación | react-router-dom, efectos |

## 4. 🏗️ Arquitectura y patrones
- **Patrones de diseño identificados:** 
  - **Compound Components** (Table + Filter, Wizard + Stepper)
  - **Provider Pattern** (BannerContext)
  - **Higher-Order Components** (Modal wrappers)
  - **Render Props** (Wizard renderStep)
  - **Observer Pattern** (Banner notifications)
- **Estructura de carpetas:** 
  ```
  ui/
  ├── Core components (Button, Modal, SearchBar)
  ├── wizard/ (Multi-step navigation)
  ├── table/ (Data display)
  ├── graphs/ (Chart components)
  ├── banner/ (Notification system)
  ├── product-card/ (Specialized components)
  └── utilities/ (ScrollToTop, routing helpers)
  ```
- **Flujo de datos principal:**
  ```
  Props Input → Component Logic → Material-UI Rendering → User Events → Callbacks
  ├── State Management (useState, useContext)
  ├── Side Effects (useEffect, debouncing)
  └── Event Handling (onClick, onChange)
  ```
- **Puntos de entrada:** Exports individuales de cada componente, index.js centralizado
- **Puntos de salida:** Componentes JSX listos para usar, hooks personalizados (useWizard, useBanner)

## 5. 🔗 Matriz de dependencias
#### Dependencias externas:
| Dependencia | Versión | Uso específico | Impacto en refactor | Alternativas |
|-------------|---------|----------------|-------------------|--------------|
| @mui/material | ^5.0.0 | Framework UI completo | CRÍTICO - Todo el diseño | React Native Elements, Chakra UI |
| @mui/icons-material | ^5.0.0 | Iconografía consistente | ALTO - UX visual | React Icons, Heroicons |
| @mui/x-charts | ^6.0.0 | Componentes de gráficos | MEDIO - Solo charts | Chart.js, Recharts |
| react | ^18.0.0 | Framework base | CRÍTICO - Core functionality | No hay alternativas |
| react-router-dom | ^6.0.0 | Navegación (ContactModal, NotFound) | MEDIO - Solo routing | Reach Router |

#### Dependencias internas:
| Módulo interno | Tipo uso | Función específica | Acoplamiento |
|----------------|----------|-------------------|--------------|
| /features/marketplace/utils/formatters | Importa | Formateo precios y datos | MEDIO |
| /features/checkout/constants | Importa | Constantes de checkout steps | BAJO |
| /features/terms_policies/content | Importa | Contenido legal estático | BAJO |
| /features/terms_policies/TextFormatter | Importa | Formateo de texto legal | MEDIO |
| react-router-dom/useLocation | Hook | Detección cambios de ruta para scroll | BAJO |

## 6. 🧩 API del módulo
#### Componentes exportados:
```jsx
// Ejemplo de uso completo del sistema UI
import { 
  PrimaryButton, 
  Modal, 
  SearchBar,
  Wizard,
  useWizard,
  useBanner,
  StatsCards 
} from 'src/features/ui';

// Uso típico en dashboard
<Box>
  <SearchBar 
    busqueda={searchTerm}
    setBusqueda={setSearchTerm}
    ordenamiento={sort}
    setOrdenamiento={setSort}
    onToggleFilters={() => setShowFilters(!showFilters)}
    hayFiltrosActivos={hasActiveFilters}
  />
  
  <StatsCards data={metrics} />
  
  <PrimaryButton onClick={() => openModal()}>
    Nueva Acción
  </PrimaryButton>
</Box>
```

#### Props detalladas:
**Wizard**
| Prop | Tipo | Requerido | Valor por defecto | Validación | Descripción | Ejemplo |
|------|------|-----------|------------------|------------|-------------|---------|
| steps | array | ✅ | [] | Array de objetos | Configuración de pasos del wizard | [{id: 'step1', title: 'Paso 1', component: Step1}] |
| autoAdvance | boolean | ❌ | false | boolean | Activar auto-avance de pasos | true |
| autoAdvanceInterval | number | ❌ | 30000 | > 0 | Intervalo en ms para auto-avance | 5000 |
| showControls | boolean | ❌ | true | boolean | Mostrar controles navegación | false |
| onStepChange | function | ❌ | undefined | function | Callback cambio de paso | (step, stepData) => {} |
| currentStep | number | ❌ | undefined | >= 0 | Paso actual (modo controlado) | 2 |

**SearchBar**
| Prop | Tipo | Requerido | Valor por defecto | Validación | Descripción | Ejemplo |
|------|------|-----------|------------------|------------|-------------|---------|
| busqueda | string | ✅ | "" | string | Valor actual de búsqueda | "productos" |
| setBusqueda | function | ✅ | undefined | function | Callback actualizar búsqueda | (value) => setSearch(value) |
| ordenamiento | string | ❌ | "" | string | Valor actual ordenamiento | "precio_asc" |
| sortOptions | array | ❌ | [] | Array de objetos | Opciones de ordenamiento | [{value: 'price', label: 'Precio'}] |
| onToggleFilters | function | ❌ | undefined | function | Toggle panel de filtros | () => setShowFilters(!show) |
| hayFiltrosActivos | boolean | ❌ | false | boolean | Indicador filtros activos | true |

**Modal**
| Prop | Tipo | Requerido | Valor por defecto | Validación | Descripción | Ejemplo |
|------|------|-----------|------------------|------------|-------------|---------|
| open | boolean | ✅ | false | boolean | Estado apertura modal | true |
| onClose | function | ✅ | undefined | function | Callback cerrar modal | () => setOpen(false) |
| title | string | ❌ | "" | string | Título del modal | "Confirmar acción" |
| maxWidth | string | ❌ | "sm" | sm\|md\|lg\|xl | Ancho máximo del modal | "lg" |
| children | node | ✅ | undefined | React node | Contenido del modal | \<Form /\> |

#### Hooks personalizados:
**useWizard(steps, options)**
- **Propósito:** Gestión completa de estado para componentes wizard multi-paso
- **Parámetros:** 
  - steps: Array de configuración de pasos
  - options: Objeto con configuraciones adicionales
- **Retorno:** 
  ```jsx
  {
    currentStep: number,
    totalSteps: number,
    nextStep: () => void,
    prevStep: () => void,
    goToStep: (index) => void,
    isFirstStep: boolean,
    isLastStep: boolean,
    canGoNext: boolean,
    canGoPrev: boolean
  }
  ```
- **Estados internos:** Maneja índice actual, validaciones de navegación, historial
- **Efectos:** Auto-avance, limpieza de intervalos, validaciones
- **Casos de uso:** Onboarding, checkout multi-paso, configuraciones complejas
- **Limitaciones:** No maneja validación asíncrona entre pasos

**useBanner()**
- **Propósito:** Sistema global de notificaciones y banners de la aplicación
- **Parámetros:** Ninguno (obtiene contexto)
- **Retorno:**
  ```jsx
  {
    bannerState: { show, message, severity, duration },
    showBanner: ({ message, severity, duration }) => void,
    hideBanner: () => void
  }
  ```
- **Estados internos:** Estado global de banner activo
- **Efectos:** Auto-hide basado en duration
- **Casos de uso:** Notificaciones de éxito/error, mensajes informativos
- **Limitaciones:** Solo un banner a la vez, requiere BannerProvider

**setSkipScrollToTopOnce()**
- **Propósito:** Control temporal del comportamiento de scroll automático en navegación
- **Parámetros:** Ninguno (función utilitaria global)
- **Retorno:** Void (modifica flag interno)
- **Estados internos:** Flag global skipScrollToTop
- **Efectos:** Previene scroll automático en la siguiente navegación de ruta
- **Casos de uso:** Navegación por secciones, links internos, navegación manual
- **Limitaciones:** Solo afecta la próxima navegación, requiere llamada antes de navigate

## 7. 🔍 Análisis de estado
- **Estado global usado:** 
  - BannerContext para notificaciones globales
  - Material-UI Theme context para estilos
  - useLocation hook para detectar cambios de ruta
- **Estado local:** 
  - Estados de componentes (open/closed modals, search terms, selected values)
  - Estados de wizard (current step, navigation history)
  - Estados de formularios (validaciones, loading states)
  - Flag global de scroll control (skipScrollToTop)
- **Persistencia:** 
  - Wizard progress en sessionStorage (opcional)
  - Theme preferences en localStorage
- **Sincronización:** 
  - Debounced search sync con parent components
  - Banner state sync a través de context
- **Mutaciones:** 
  - Estado modal vía props callbacks
  - Banner state vía context actions
  - Wizard navigation vía hook actions

## 8. 🎭 Lógica de negocio
- **Reglas de negocio implementadas:**
  - Validación de contraseñas con requisitos específicos
  - Formateo de precios según configuración regional
  - Restricciones de navegación en wizard según validaciones
  - Auto-hide de banners según severidad y duración
  - Scroll automático al inicio en cambios de ruta (excepto cuando se desactiva)
- **Validaciones:**
  - Props validation con PropTypes/TypeScript inferido
  - Validación de pasos en wizard
  - Validación de archivos en uploaders (tipo, tamaño)
  - Control de navegación válida en ScrollToTop
- **Transformaciones de datos:**
  - Formateo de números y precios
  - Transformación de datos para gráficos
  - Sanitización de inputs de búsqueda
- **Casos especiales:**
  - Manejo de estados de carga durante subida de archivos
  - Fallbacks para componentes sin datos
  - Comportamiento responsive en componentes complejos
- **Integraciones:**
  - Sistema de routing para navegación
  - APIs de subida de archivos
  - Sistema de notificaciones global

## 9. 🔄 Flujos de usuario
**Flujo principal de búsqueda:**
1. Usuario escribe en SearchBar → Debounce 300ms → Callback a parent component
2. Si hay filtros → Mostrar badge → Usuario puede toggle panel filtros
3. Si selecciona ordenamiento → Ejecutar callback inmediato
4. Si limpia búsqueda → Reset estados → Notificar parent

**Flujo de wizard:**
1. Usuario inicia wizard → Mostrar primer paso → Validar entrada
2. Usuario navega → Validar paso actual → Permitir/denegar navegación
3. Si auto-advance → Iniciar timer → Avanzar automáticamente
4. Si último paso → Mostrar acción final → Callback de completado

**Flujo de notificaciones:**
1. Acción del usuario → Trigger showBanner → Mostrar banner con animación
2. Si duration > 0 → Iniciar timer auto-hide → Ocultar automáticamente
3. Si usuario cierra → Cancelar timer → Ocultar inmediatamente
4. Si nueva notificación → Reemplazar anterior → Reiniciar timer

**Flujo de control de scroll:**
1. Usuario navega a nueva ruta → useLocation detecta cambio → ScrollToTop se ejecuta
2. Si skipScrollToTop = true → Reset flag → No hacer scroll
3. Si skipScrollToTop = false → Ejecutar scroll smooth al top
4. Para navegación específica → Llamar setSkipScrollToTopOnce() → Activar flag

**Flujos alternativos:**
- **Error de validación:** Mostrar mensaje → Mantener focus → Permitir corrección
- **Carga lenta:** Mostrar skeleton/spinner → Mantener layout → Actualizar al cargar
- **Móvil:** Adaptar controles → Gestos touch → Navegación optimizada
- **Navegación por secciones:** Usar setSkipScrollToTopOnce() → Mantener posición → Scroll manual

## 10. 🧪 Puntos de testing
- **Casos de prueba críticos:**
  - Navegación completa de wizard (forward/backward/jump)
  - Debouncing correcto en SearchBar
  - Apertura/cierre de modales con escape/overlay
  - Renderizado correcto de gráficos con datos vacíos
  - Subida de archivos con diferentes tipos/tamaños
  - Comportamiento de scroll en cambios de ruta
  - Control de skipScrollToTop en navegaciones específicas
- **Mocks necesarios:**
  - Material-UI theme provider
  - React Router para componentes con navegación
  - File API para uploaders
  - Timer functions para auto-advance y debouncing
- **Datos de prueba:**
  - Datasets completos para gráficos
  - Configuraciones de wizard con validaciones
  - Arrays de opciones para selectores
  - Objetos de configuración de tema
- **Escenarios de error:**
  - Fallo en subida de archivos
  - Datos malformados en gráficos
  - Props faltantes en componentes requeridos
  - Context no disponible para hooks
- **Performance:**
  - Tiempo de renderizado con datasets grandes
  - Memoria en componentes con auto-refresh
  - Bundle size por componente

## 11. 🚨 Puntos críticos para refactor
- **Código legacy:**
  - Componentes con props excesivas (ShippingRegionsModal ~481 LOC)
  - Lógica mixta de presentación y negocio en algunos componentes
  - Uso inconsistente de TypeScript/PropTypes
- **Antipatrones:**
  - Props drilling en componentes complejos
  - Componentes que violan single responsibility
  - Hardcoded styles mezclados con theme
- **Oportunidades de mejora:**
  - Consolidar variantes similares de botones/modales
  - Implementar design tokens consistentes
  - Separar lógica de negocio en custom hooks
  - Implementar error boundaries
- **Riesgos:**
  - Cambios en Material-UI pueden romper estilos
  - Componentes acoplados a módulos específicos
  - Falta de tests puede ocultar regresiones
- **Orden de refactor:**
  1. Consolidar componentes similares (Button variants)
  2. Extraer hooks de lógica compleja (Wizard, SearchBar)
  3. Implementar error boundaries y loading states
  4. Migrar a design tokens
  5. Optimizar bundle size y performance

## 12. 🔧 Consideraciones técnicas
#### Limitaciones actuales:
- **Performance:** 
  - Re-renders excesivos en SearchBar sin memoization
  - Bundle size grande por importar toda Material-UI
  - Memory leaks potenciales en auto-advance timers
- **Memoria:** 
  - Acumulación de event listeners en componentes complejos
  - Referencias no limpiadas en useEffect
- **Escalabilidad:** 
  - Dificultad para mantener consistencia con muchos componentes
  - Props interface se vuelve compleja en componentes grandes
- **Compatibilidad:** 
  - Dependiente de características ES6+ específicas
  - Requiere polyfills para funcionalidades avanzadas

#### Configuración requerida:
- **Variables de entorno:** 
  - REACT_APP_THEME_MODE para tema por defecto
  - REACT_APP_DEBOUNCE_DELAY para configurar debouncing
- **Inicialización:** 
  - Material-UI ThemeProvider obligatorio
  - BannerProvider para sistema de notificaciones
- **Permisos:** 
  - File API para components de subida
  - Local/Session Storage para persistencia

## 13. 🔒 Seguridad y compliance
- **Datos sensibles:** 
  - Archivos subidos (potencial malware)
  - Datos de formularios antes de validación
  - URLs y routing information
- **Validaciones de seguridad:** 
  - Sanitización de inputs de búsqueda
  - Validación de tipos de archivo en uploaders
  - Escape de contenido dinámico en modales
- **Permisos:** 
  - File system access para uploaders
  - LocalStorage access para persistencia
- **Auditoría:** 
  - Log de acciones de usuario en wizards
  - Tracking de errores en componentes críticos

## 14. 📚 Referencias y documentación
- **Documentación técnica:** 
  - [Material-UI v5 Documentation](https://mui.com/)
  - [React Hooks Documentation](https://reactjs.org/docs/hooks-intro.html)
  - [Design System Guidelines](../../../docs/design-system.md)
- **Decisiones de arquitectura:** 
  - Elección de Material-UI por consistencia y ecosystem
  - Pattern de compound components para flexibilidad
  - Context API para estado global de notificaciones
- **Recursos externos:** 
  - [MUI X Charts](https://mui.com/x/react-charts/)
  - [React Router v6](https://reactrouter.com/)
  - [React Hot Toast patterns](https://react-hot-toast.com/)
- **Historial de cambios:** 
  - v1.0: Componentes básicos (Button, Modal)
  - v2.0: Sistema de wizard y navegación
  - v3.0: Integración con charts y gráficos
  - v4.0: Sistema de notificaciones global

## 15. 🎨 Ejemplos de uso avanzados
```jsx
// Ejemplo 1: Wizard complejo con validación
import { Wizard, useWizard } from 'src/features/ui';

function ComplexOnboarding() {
  const steps = [
    {
      id: 'personal',
      title: 'Datos Personales',
      component: PersonalInfoStep,
      validate: (data) => validatePersonalInfo(data)
    },
    {
      id: 'business',
      title: 'Información Empresarial',
      component: BusinessStep,
      validate: (data) => validateBusinessData(data)
    },
    {
      id: 'verification',
      title: 'Verificación',
      component: VerificationStep,
      validate: (data) => validateDocuments(data)
    }
  ];

  const {
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    isFirstStep,
    isLastStep
  } = useWizard(steps, {
    autoAdvance: false,
    persistProgress: true,
    onStepValidation: (step, isValid) => {
      if (!isValid) {
        showBanner({
          message: 'Por favor complete todos los campos requeridos',
          severity: 'error'
        });
      }
    }
  });

  return (
    <Wizard
      steps={steps}
      currentStep={currentStep}
      onNext={nextStep}
      onPrev={prevStep}
      showIndicators={true}
      fadeTransition={true}
    />
  );
}

// Ejemplo 2: Dashboard integrado con múltiples componentes
import { 
  SearchBar, 
  StatsCards, 
  Table, 
  Modal,
  useBanner 
} from 'src/features/ui';

function IntegratedDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({});
  const { showBanner } = useBanner();

  const handleBulkAction = async (selectedItems) => {
    try {
      await processBulkAction(selectedItems);
      showBanner({
        message: `${selectedItems.length} elementos procesados correctamente`,
        severity: 'success',
        duration: 4000
      });
    } catch (error) {
      showBanner({
        message: 'Error en el procesamiento masivo',
        severity: 'error',
        action: {
          label: 'Reintentar',
          onClick: () => handleBulkAction(selectedItems)
        }
      });
    }
  };

  return (
    <Box>
      {/* Barra de búsqueda integrada */}
      <SearchBar
        busqueda={searchTerm}
        setBusqueda={setSearchTerm}
        ordenamiento={sortBy}
        setOrdenamiento={setSortBy}
        sortOptions={[
          { value: 'date_desc', label: 'Más recientes' },
          { value: 'name_asc', label: 'Nombre A-Z' },
          { value: 'price_desc', label: 'Precio mayor' }
        ]}
        onToggleFilters={() => setShowFilters(!showFilters)}
        hayFiltrosActivos={Object.keys(filters).length > 0}
      />

      {/* Dashboard de métricas */}
      <StatsCards 
        data={dashboardMetrics}
        onCardClick={(metric) => setSelectedMetric(metric)}
      />

      {/* Tabla de datos con acciones */}
      <Table
        data={filteredData}
        columns={tableColumns}
        onBulkAction={handleBulkAction}
        selectable={true}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Modal de acción */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Confirmar Acción"
        maxWidth="md"
      >
        <ActionConfirmation
          onConfirm={() => {
            executeAction();
            setShowModal(false);
          }}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
    </Box>
  );
}

// Ejemplo 3: Sistema de subida con preview
import { FileUploader, Modal, ProgressBar } from 'src/features/ui';

function AdvancedFileUpload() {
  const [uploads, setUploads] = useState([]);
  const [previewModal, setPreviewModal] = useState(false);
  const { showBanner } = useBanner();

  const handleFileUpload = async (files) => {
    const uploadPromises = files.map(async (file) => {
      try {
        const result = await uploadFile(file, {
          onProgress: (progress) => updateUploadProgress(file.id, progress)
        });
        return { file, result, status: 'success' };
      } catch (error) {
        showBanner({
          message: `Error subiendo ${file.name}`,
          severity: 'error'
        });
        return { file, error, status: 'error' };
      }
    });

    const results = await Promise.allSettled(uploadPromises);
    processUploadResults(results);
  };

  return (
    <Box>
      <FileUploader
        multiple={true}
        maxSize={10 * 1024 * 1024} // 10MB
        acceptedTypes={['image/*', 'application/pdf']}
        onFilesSelected={handleFileUpload}
        onPreview={(file) => setPreviewModal(true)}
        showProgress={true}
      />
      
      {uploads.map((upload) => (
        <ProgressBar
          key={upload.id}
          progress={upload.progress}
          status={upload.status}
          fileName={upload.fileName}
        />
      ))}
    </Box>
  );
}

// Ejemplo 4: Notificaciones avanzadas con acciones
import { useBanner } from 'src/features/ui';

function NotificationSystem() {
  const { showBanner } = useBanner();

  const handleComplexAction = async () => {
    // Notificación de inicio
    showBanner({
      message: 'Procesando solicitud...',
      severity: 'info',
      duration: 0 // Permanente hasta que se actualice
    });

    try {
      const result = await longRunningTask();
      
      // Notificación de éxito con acción
      showBanner({
        message: 'Proceso completado exitosamente',
        severity: 'success',
        duration: 8000,
        action: {
          label: 'Ver resultados',
          onClick: () => navigateToResults(result.id)
        }
      });
    } catch (error) {
      // Notificación de error con retry
      showBanner({
        message: 'Error en el proceso',
        severity: 'error',
        duration: 0,
        action: {
          label: 'Reintentar',
          onClick: () => handleComplexAction()
        },
        secondaryAction: {
          label: 'Reportar error',
          onClick: () => reportError(error)
        }
      });
    }
  };

  return (
    <Button onClick={handleComplexAction}>
      Iniciar Proceso Complejo
    </Button>
  );
}

// Ejemplo 4: Control de navegación y scroll
import ScrollToTop, { setSkipScrollToTopOnce } from 'src/features/ui';
import { useNavigate } from 'react-router-dom';

function NavigationExample() {
  const navigate = useNavigate();

  const handleSectionNavigation = () => {
    // Evitar scroll automático para navegación por secciones
    setSkipScrollToTopOnce();
    navigate('/products#section-electronics');
  };

  const handleNormalNavigation = () => {
    // Scroll normal al cambiar de página
    navigate('/about');
  };

  return (
    <Box>
      <Button onClick={handleSectionNavigation}>
        Ir a Electrónicos (sin scroll)
      </Button>
      <Button onClick={handleNormalNavigation}>
        Ir a Acerca de (con scroll)
      </Button>
    </Box>
  );
}

// En App.jsx - Setup del componente ScrollToTop
function App() {
  return (
    <Router>
      <ScrollToTop /> {/* Debe estar dentro del Router */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Router>
  );
}
```

## 16. 🔄 Guía de migración
- **Desde versión anterior:** 
  - Actualizar imports de componentes movidos
  - Migrar props deprecated a nueva API
  - Actualizar theme configuration para Material-UI v5
- **Breaking changes:** 
  - Cambio en API de Wizard (currentStep ahora es controlled)
  - Banner context ahora requiere provider explícito
  - SearchBar props reorganizadas para mejor UX
- **Checklist de migración:** 
  1. ✅ Actualizar imports de @mui/material
  2. ✅ Envolver app en BannerProvider
  3. ✅ Migrar theme custom a formato v5
  4. ✅ Actualizar props de Wizard en componentes existentes
  5. ✅ Testing completo de componentes críticos
- **Rollback:** 
  - Mantener versión anterior en rama backup
  - Document compatibility shims
  - Gradual rollout con feature flags

## 17. 📋 Metadatos del documento
- **Creado:** 18/07/2025
- **Última actualización:** 18/07/2025
- **Versión del código:** staging branch
- **Autor:** Generado automáticamente por Pipeline ReadmeV4
- **Próxima revisión:** 18/08/2025
