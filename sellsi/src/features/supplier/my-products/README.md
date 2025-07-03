# Supplier My Products

## 1. Resumen funcional del módulo
El módulo `supplier/my-products` permite a los proveedores gestionar su catálogo de productos en Sellsi. Incluye funcionalidades para listar, crear, editar, eliminar y actualizar el stock de productos, integrando formularios validados, feedback visual y sincronización con el backend.

- **Problema que resuelve:** Facilita la administración eficiente y segura del inventario de productos del proveedor.
- **Arquitectura:** Componentes de listado y edición, hooks de estado, servicios de backend y helpers de validación.
- **Patrones:** CRUD, validación progresiva, feedback inmediato, separación de lógica y presentación.
- **Flujo de datos:** Acciones UI → Estado local/hooks → Backend (persistencia) → Actualización de UI.

## 2. Listado de archivos
| Archivo         | Tipo        | Descripción                                 | Responsabilidad principal                |
|-----------------|-------------|---------------------------------------------|------------------------------------------|
| MyProducts.jsx  | Componente  | Listado y gestión principal de productos    | Orquestar UI y acciones de inventario    |
| ProductForm.jsx | Componente  | Formulario de alta/edición de producto      | Validación y persistencia de datos       |
| ...otros        | Componente/Hook | Helpers, modales, validaciones         | Extensión de lógica y UX                |
| ...servicios    | Servicio    | productService: comunicación backend        | Fetch y actualización de productos       |

## 3. Relaciones internas del módulo
```
MyProducts (componente principal)
├── ProductForm (alta/edición)
├── productService (servicio backend)
└── Helpers y hooks de validación
```
- Comunicación por props y callbacks.
- Renderizado condicional según estado y acciones.

## 4. Props de los componentes
### MyProducts
No recibe props externas (es punto de entrada del módulo de productos).

### ProductForm
| Prop      | Tipo    | Requerido | Descripción                         |
|-----------|---------|-----------|-------------------------------------|
| product   | object  | No        | Producto a editar (si aplica)       |
| onSave    | func    | Sí        | Callback para guardar cambios       |
| onCancel  | func    | Sí        | Callback para cancelar edición      |

**Notas:**
- Los subcomponentes pueden recibir props para validación y feedback.

## 5. Hooks personalizados
No se exportan hooks personalizados, pero pueden existir hooks internos para validación y sincronización.

**Ejemplo de uso básico:**
```jsx
import MyProducts from './MyProducts';

function App() {
  return <MyProducts />;
}
```

## 6. Dependencias principales
| Dependencia         | Versión   | Propósito                        | Impacto                  |
|---------------------|-----------|----------------------------------|--------------------------|
| react               | ^18.x     | Renderizado y estado             | Core                     |
| @mui/material       | ^5.x      | Componentes UI                   | Experiencia visual       |
| ...internas         | -         | productService, helpers          | Lógica y backend         |

## 7. Consideraciones técnicas
### Limitaciones y advertencias
- El módulo depende de la correcta configuración del proveedor y permisos.
- Validaciones locales y backend para evitar inconsistencias.
- No implementa control de versiones de productos.

### Deuda técnica relevante
- [MEDIA] Mejorar feedback de errores y validaciones avanzadas.
- [MEDIA] Modularizar helpers y formularios para testing.

## 8. Puntos de extensión
- Integrar importación/exportación masiva de productos.
- Agregar filtros y búsquedas avanzadas.
- Exponer hooks personalizados para lógica de UI compleja.

## 9. Ejemplos de uso
### Ejemplo básico
```jsx
import MyProducts from './MyProducts';

function Proveedor() {
  return <MyProducts />;
}
```

## 10. Rendimiento y optimización
- Renderizado eficiente de listas con paginación o lazy loading.
- Validaciones locales para evitar llamadas innecesarias al backend.
- Áreas de mejora: memoización de listas y formularios.

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
