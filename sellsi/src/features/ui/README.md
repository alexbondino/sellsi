# Módulo: ui

## 1. Resumen funcional del módulo
- **Problema que resuelve:** Centraliza componentes de interfaz reutilizables para garantizar coherencia visual, accesibilidad y experiencia de usuario profesional en toda la plataforma Sellsi.
- **Arquitectura de alto nivel:** Sistema de componentes atómicos y moleculares con hooks especializados, organizados por categorías funcionales (forms, tables, modals, graphs).
- **Función y casos de uso principales:** Componentes base para formularios, tablas, modales, gráficos, navegación y elementos interactivos reutilizables.
- **Flujo de datos/información simplificado:**
  ```
  Props → Component Logic → UI Rendering → User Events → Callbacks
  ```

## 2. Listado de archivos
| Archivo | Tipo | Descripción | Responsabilidad |
|---------|------|------------|----------------|
| PrimaryButton.jsx | Componente | Botón principal estilizado | Acciones primarias consistentes |
| CountrySelector.jsx | Componente | Selector país/indicativo telefónico | Selección internacional formularios |
| graphs/BarChart.jsx | Componente | Gráfico de barras para métricas | Visualización datos dashboard |
| Modal.jsx | Componente | Modal genérico reutilizable | Diálogos y overlays |
| SearchBar.jsx | Componente | Barra de búsqueda avanzada | Funcionalidad search global |
| table/Table.jsx | Componente | Tabla de datos con filtros | Listados y gestión datos |
| wizard/Wizard.jsx | Componente | Componente wizard multi-paso | Flujos guiados complejos |
| banner/Banner.jsx | Componente | Sistema de notificaciones | Feedback visual usuario |
| ContactModal.jsx | Componente | Modal de contacto integrado | Comunicación con soporte |
| SecurityBadge.jsx | Componente | Indicador de seguridad | Confianza y validación |
| ScrollToTop.jsx | Utilidad | Scroll automático al cambiar rutas | Navegación UX consistente |

## 3. Relaciones internas del módulo
**Diagrama de dependencias:**
```
UI Components Library
├── Core Components (Button, Modal, SearchBar)
├── Data Display (Table, BarChart, StatsCards)
├── Form Controls (CountrySelector, Switch, SelectChip)
├── Navigation (Wizard, Stepper)
├── Feedback (Banner, SecurityBadge)
├── Utilities (ScrollToTop)
└── Specialized (ContactModal, ShippingRegionsModal)
```

**Patrones de comunicación:**
- **Compound Components**: Tabla con filtros, wizard con pasos
- **Render Props**: Componentes flexibles con children functions
- **Controlled Components**: Estado externo via props
- **Event Delegation**: Callbacks para comunicación padre-hijo

## 4. Props de los componentes
### PrimaryButton
| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|------------|
| children | node | ✓ | Contenido del botón |
| onClick | función | ✗ | Callback al hacer click |
| disabled | boolean | ✗ | Estado deshabilitado |
| variant | string | ✗ | Variante visual ('primary', 'secondary') |
| sx | object | ✗ | Estilos adicionales Material-UI |

### Modal
| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|------------|
| open | boolean | ✓ | Estado de apertura del modal |
| onClose | función | ✓ | Callback para cerrar modal |
| title | string | ✗ | Título del modal |
| children | node | ✓ | Contenido del modal |
| maxWidth | string | ✗ | Ancho máximo ('sm', 'md', 'lg') |

### SearchBar
| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|------------|
| value | string | ✓ | Valor actual de búsqueda |
| onChange | función | ✓ | Callback cambio de valor |
| placeholder | string | ✗ | Texto placeholder |
| onSearch | función | ✗ | Callback búsqueda ejecutada |

## 5. Hooks personalizados
### useWizard (wizard/Wizard.jsx)
- **Propósito:** Gestión de estado para componentes wizard multi-paso
- **Inputs:** steps (array), options (object)
- **Outputs:** currentStep, nextStep, prevStep, goToStep, isFirstStep, isLastStep
- **Efectos secundarios:** Navegación entre pasos, validaciones

### useBanner (banner/BannerContext.jsx)
- **Propósito:** Sistema global de notificaciones y banners
- **Inputs:** Ninguno (context provider)
- **Outputs:** showBanner, hideBanner, bannerState
- **Efectos secundarios:** Gestión estado global notificaciones

### setSkipScrollToTopOnce (ScrollToTop.jsx)
- **Propósito:** Control temporal del comportamiento de scroll automático
- **Inputs:** Ninguno (función global)
- **Outputs:** Void (modifica flag global)
- **Efectos secundarios:** Previene scroll automático en siguiente navegación

## 6. Dependencias principales
| Dependencia | Versión | Propósito | Impacto |
|-------------|---------|-----------|---------|
| @mui/material | ^5.0.0 | Sistema de componentes UI base | Alto - Core de toda la UI |
| @mui/icons-material | ^5.0.0 | Iconografía consistente | Medio - Experiencia visual |
| @mui/x-charts | ^6.0.0 | Componentes de gráficos avanzados | Medio - Visualización datos |
| react | ^18.0.0 | Framework base | Alto - Funcionalidad core |
| react-hot-toast | ^2.0.0 | Sistema de notificaciones | Medio - Feedback usuario |
| react-router-dom | ^6.0.0 | Routing y navegación | Medio - ScrollToTop hook |

## 7. Consideraciones técnicas
### Limitaciones y advertencias:
- **Theme dependency**: Componentes requieren Material-UI ThemeProvider
- **Bundle size**: Librería extensa, considerar tree shaking
- **Customization limits**: Props sx potentes pero pueden romper consistencia
- **Accessibility**: Algunos componentes requieren configuración ARIA adicional

### Deuda técnica relevante:
- **[MEDIA]** Implementar tests visuales automatizados (Storybook/Chromatic)
- **[MEDIA]** Consolidar variantes de componentes similares
- **[BAJA]** Documentar design tokens y tokens de spacing
- **[BAJA]** Agregar soporte completo para dark mode

## 8. Puntos de extensión
- **Component variants**: Agregar nuevas variantes y themes para componentes existentes
- **Design system**: Evolucionar hacia design system completo con tokens
- **Animation library**: Integrar animaciones consistentes y micro-interacciones
- **Accessibility enhancements**: Mejorar soporte completo WCAG 2.1
- **Mobile optimization**: Componentes específicos para experiencia móvil

## 9. Ejemplos de uso
### Implementación básica de componentes:
```jsx
import { 
  PrimaryButton, 
  Modal, 
  SearchBar,
  StatsCards 
} from 'src/features/ui';

function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Box>
      <SearchBar 
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar productos..."
        onSearch={(term) => handleSearch(term)}
      />
      
      <StatsCards data={dashboardData} />
      
      <PrimaryButton onClick={() => setModalOpen(true)}>
        Agregar Producto
      </PrimaryButton>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nuevo Producto"
        maxWidth="md"
      >
        <ProductForm onSave={handleSave} />
      </Modal>
    </Box>
  );
}
```

### Uso avanzado con wizard:
```jsx
import { Wizard, useWizard } from 'src/features/ui/wizard';

function OnboardingFlow() {
  const steps = [
    { id: 'basic', title: 'Información Básica', component: BasicInfoStep },
    { id: 'business', title: 'Datos Empresa', component: BusinessStep },
    { id: 'verification', title: 'Verificación', component: VerificationStep }
  ];

  const {
    currentStep,
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep
  } = useWizard(steps);

  return (
    <Wizard
      steps={steps}
      currentStep={currentStep}
      onNext={nextStep}
      onPrev={prevStep}
      isFirstStep={isFirstStep}
      isLastStep={isLastStep}
    />
  );
}
```

### Sistema de notificaciones:
```jsx
import { useBanner } from 'src/features/ui/banner';

function ProductManager() {
  const { showBanner } = useBanner();

  const handleSaveProduct = async (productData) => {
    try {
      await saveProduct(productData);
      showBanner({
        type: 'success',
        message: 'Producto guardado exitosamente',
        duration: 3000
      });
    } catch (error) {
      showBanner({
        type: 'error',
        message: 'Error al guardar producto',
        action: { label: 'Reintentar', onClick: () => handleSaveProduct(productData) }
      });
    }
  };

  return <ProductForm onSave={handleSaveProduct} />;
}
```

### Control de scroll en navegación:
```jsx
import ScrollToTop, { setSkipScrollToTopOnce } from 'src/features/ui/ScrollToTop';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
      </Routes>
    </Router>
  );
}

// Para evitar scroll automático en navegación específica
function TopBarButton() {
  const navigate = useNavigate();
  
  const handleSectionNavigation = () => {
    setSkipScrollToTopOnce(); // Evita scroll automático
    navigate('/products#section-2');
  };
  
  return <Button onClick={handleSectionNavigation}>Ir a Sección</Button>;
}
```

## 10. Rendimiento y optimización
- **Component memoization**: React.memo en componentes pesados como SearchBar
- **Lazy loading**: Carga diferida de componentes complejos (gráficos, modales)
- **Tree shaking**: Imports específicos para reducir bundle size
- **Event optimization**: Debounce en SearchBar, throttle en scroll listeners
- **Style optimization**: CSS-in-JS optimizado, evitar inline styles pesados
- **Bundle analysis**: Separación de chunks para componentes opcionales

## 11. Actualización
- **Última actualización:** 18/07/2025
