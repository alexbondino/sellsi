# SideBar Colapsable - Documentación

## Descripción
La SideBar ha sido mejorada con funcionalidad de colapso/expansión que permite una experiencia de usuario más flexible y eficiente en el uso del espacio de pantalla.

## Nuevas Características

### 🎯 Funcionalidad Principal
- **Botón de Toggle**: Ubicado en la parte superior de la sidebar
- **Animación Suave**: Transición de 0.4s con cubic-bezier para una experiencia premium
- **Ancho Dinámico**: Colapsa al 40% del ancho original
- **Iconos Representativos**: Cada elemento del menú tiene un icono que lo representa
- **Tooltips**: Al colapsar, los nombres aparecen como tooltips al hacer hover

### 🎨 Iconos por Rol

#### Buyer (Comprador)
- **Marketplace**: `<MarketplaceIcon />` (Store)
- **Mis Pedidos**: `<OrdersIcon />` (ShoppingBag)
- **Mi Performance**: `<PerformanceIcon />` (TrendingUp)

#### Supplier (Proveedor)
- **Inicio**: `<HomeIcon />` (Home)
- **Mis Productos**: `<ProductsIcon />` (Inventory)
- **Mis Pedidos**: `<OrdersIcon />` (ShoppingBag)
- **Mi Performance**: `<PerformanceIcon />` (TrendingUp)
- **Marketplace**: `<MarketplaceIcon />` (Store)

### 🛠️ Implementación Técnica

#### Componente SideBar
```jsx
const SideBar = ({ role, width = '210px', onWidthChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Cálculo dinámico del ancho
  const expandedWidth = width;
  const collapsedWidth = `${Math.round(parseInt(width.replace('px', '')) * 0.4)}px`;
  const currentWidth = isCollapsed ? collapsedWidth : expandedWidth;
  
  // Notificación al componente padre
  useEffect(() => {
    if (onWidthChange) {
      onWidthChange(currentWidth, isCollapsed);
    }
  }, [currentWidth, isCollapsed, onWidthChange]);
};
```

#### Integración en App.jsx
```jsx
const [currentSideBarWidth, setCurrentSideBarWidth] = useState(SideBarWidth);
const [sideBarCollapsed, setSideBarCollapsed] = useState(false);

const handleSideBarWidthChange = (newWidth, isCollapsed) => {
  setCurrentSideBarWidth(newWidth);
  setSideBarCollapsed(isCollapsed);
};

// Uso dinámico del ancho
ml: isDashboardRoute ? { xs: 0, md: currentSideBarWidth } : 0,
width: isDashboardRoute ? { xs: '100%', md: `calc(100% - ${currentSideBarWidth})` } : '100%',
```

### 🎭 Estados de la UI

#### Estado Expandido
- Ancho: 210px (tamaño original)
- Muestra: Iconos + Texto
- Botón toggle: `<MenuOpenIcon />`
- Tooltips: Deshabilitados

#### Estado Colapsado
- Ancho: ~84px (40% del original)
- Muestra: Solo iconos
- Botón toggle: `<MenuIcon />`
- Tooltips: Habilitados con nombres

### 🚀 Animaciones y Transiciones

#### SideBar
```css
transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
```

#### Contenido Principal
```css
transition: 'margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1), width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
```

#### Elementos Internos
- **Texto**: `opacity 0.3s ease`
- **Iconos**: `min-width 0.3s ease`
- **Botones**: `all 0.2s ease`

### ♿ Accesibilidad

#### ARIA Labels
- Botón toggle tiene `aria-label` dinámico
- Tooltips proporcionan contexto adicional

#### Navegación por Teclado
- Todos los elementos mantienen su funcionalidad de teclado
- Focus visible en todos los elementos interactivos

#### Screen Readers
- Los tooltips son anunciados correctamente
- El estado del menú es comunicado via aria-label

### 📱 Responsividad
- **Móvil (xs)**: La sidebar permanece oculta (comportamiento existente)
- **Desktop (md+)**: Funcionalidad completa de colapso/expansión
- **Tooltips**: Solo activos en estado colapsado

### 🔧 API del Componente

#### Props de SideBar
```jsx
interface SideBarProps {
  role: 'buyer' | 'supplier' | null;
  width?: string; // Ancho expandido (default: '210px')
  onWidthChange?: (newWidth: string, isCollapsed: boolean) => void;
}
```

#### Props de SideBarProvider
```jsx
interface SideBarProviderProps {
  width?: string;
  onWidthChange?: (newWidth: string, isCollapsed: boolean) => void;
}
```

### 🎯 Casos de Uso

#### 1. Usuario con Pantalla Pequeña
- Puede colapsar la sidebar para más espacio de contenido
- Los tooltips le permiten identificar secciones rápidamente

#### 2. Usuario Experimentado
- Puede trabajar con iconos solamente para maximizar espacio
- Navegación rápida via tooltips

#### 3. Usuario Nuevo
- Puede mantener la sidebar expandida para ver todos los nombres
- Transición gradual al uso de iconos

### 🐛 Consideraciones y Limitaciones

#### Texto Largo
- Los nombres de secciones se truncan con ellipsis si son muy largos
- Los tooltips muestran el nombre completo

#### Performance
- Las animaciones usan `cubic-bezier` para mejor rendimiento
- Los re-renders se minimizan con `useCallback` y `useMemo`

#### Browser Compatibility
- Funciona en todos los navegadores modernos
- Fallback graceful en navegadores que no soportan `cubic-bezier`

### 🔮 Futuras Mejoras

#### Persistencia de Estado
- Recordar preferencia del usuario (expandido/colapsado)
- Guardar en localStorage o preferencias de usuario

#### Shortcuts de Teclado
- Atajo para toggle rápido (ej: Ctrl+B)
- Navegación por números (1-5 para cada sección)

#### Temas Personalizados
- Soporte para temas claro/oscuro
- Colores personalizables por empresa

#### Micro-animaciones
- Hover effects más sutiles
- Animaciones de entrada para nuevos elementos

### 📊 Testing

#### Tests Unitarios
```jsx
describe('SideBar Collapse', () => {
  it('should toggle between expanded and collapsed states', () => {
    // Test implementation
  });
  
  it('should call onWidthChange callback with correct values', () => {
    // Test implementation
  });
  
  it('should show tooltips only when collapsed', () => {
    // Test implementation
  });
});
```

#### Tests de Integración
- Verificar que el contenido principal se ajuste correctamente
- Confirmar que las animaciones no interfieren con la funcionalidad
- Validar accesibilidad en diferentes estados

¡La nueva SideBar colapsable está lista para mejorar significativamente la experiencia de usuario! 🎉
