# Propuestas y Limitaciones Backend - Supplier Products

## Limitaciones actuales

1. **Soporte de archivos PDF y documentos**

   - Actualmente, la tabla de productos de proveedor no soporta adjuntar archivos PDF, manuales o fichas técnicas.
   - Requiere integración con Supabase Storage y campos adicionales en la base de datos para almacenar URLs de documentos.

2. **Integridad referencial de categorías**

   - Las categorías de productos no están normalizadas ni validadas por claves foráneas.
   - Es posible ingresar categorías no válidas o inconsistentes.
   - Se recomienda crear una tabla de categorías y usar claves foráneas.

3. **Estructura de producto limitada**

   - Faltan campos para variantes, atributos dinámicos, stock por sucursal, etc.
   - No hay soporte para precios escalonados ni promociones complejas.

4. **Sin control de permisos avanzado**

   - Cualquier usuario autenticado puede manipular productos si conoce el supplierId.
   - Se recomienda implementar RLS (Row Level Security) en Supabase.

5. **Sin historial de cambios ni auditoría**
   - No se registra quién ni cuándo se modifica un producto.
   - Se recomienda agregar triggers o tablas de auditoría.

## Propuestas de mejora

- Integrar Supabase Storage para subir y asociar documentos PDF a productos.
- Crear tabla de categorías y relacionar productos por clave foránea.
- Ampliar el modelo de producto para soportar variantes, atributos y stock avanzado.
- Implementar RLS y validaciones de permisos en Supabase.
- Agregar historial de cambios y auditoría de acciones.
- Mejorar validaciones y mensajes de error en el frontend.

---

_Documento generado automáticamente para seguimiento de mejoras backend en gestión de productos de proveedor._
