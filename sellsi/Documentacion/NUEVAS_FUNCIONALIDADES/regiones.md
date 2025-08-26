## Nueva Funcionalidad: Configuraciones Guardadas de Regiones de Despacho (hasta 3 presets)

### 1. Objetivo
Permitir al proveedor guardar hasta 3 configuraciones predefinidas ("Config. 1", "Config. 2", "Config. 3") que incluyen:
- Conjunto de regiones habilitadas
- Precio por región (price)
- Tiempo máximo de despacho (delivery_days)

De esta forma, al crear un nuevo producto, el usuario puede aplicar una configuración ya guardada en un solo click sin volver a rellenar manualmente los datos.

### 2. Estado Actual (Resumen de Arquitectura Existente)
Componentes y utilidades clave:
1. `ProductRegions.jsx` coordina:
	- Apertura del modal `ShippingRegionsModal`.
	- Conversión de formatos usando `convertModalRegionsToDisplay` y `convertFormRegionsToDb`.
	- Mantiene snapshot local `displayRegions` para evitar parpadeos mientras se congela la UI (`freezeDisplay`).
2. `ShippingRegionsModal.jsx`:
	- Renderiza tabla de 16 regiones (lista base en `utils/chileData.js`).
	- Estado interno `regionsConfig[]` con: `{ region, regionLabel, enabled, shippingValue (string formateado), maxDeliveryDays }`.
	- Al guardar emite array reducido: `[{ region, price, delivery_days }]` solo para regiones habilitadas.
3. Formatos de datos:
	- Formulario/UI (`formData.shippingRegions`): `[{ region, shippingValue, maxDeliveryDays, regionLabel }]`.
	- Base de datos (tabla `product_delivery_regions`): `[{ region, price, delivery_days }]`.
	- Conversión vía `shippingRegionsUtils.js` (tres funciones de mapeo existentes y consistentes).
4. Hook `useProductForm`:
	- Hidrata `shippingRegions` al editar producto usando `convertDbRegionsToForm` sobre `delivery_regions`.
	- Detecta cambios reales (`hasActualChanges`) comparando arrays de regiones.
5. Validación (`ProductValidator`): exige `shippingRegions.length > 0`.
6. Persistencia actual:
	- En `AddProduct.handleSubmit` (no mostrado completo), después de crear producto se convierte `shippingRegions` a formato DB y se guarda (probablemente mediante un insert/upsert en Supabase – revisar implementación exacta al añadir la nueva capa de presets).
7. Consumo en el frontend (carrito, página de producto, cálculo de despacho) usa siempre fallback: `shippingRegions || delivery_regions || shipping_regions` para resiliencia.

### 3. Gap para la Nueva Funcionalidad
Actualmente no existe almacenamiento reutilizable de configuraciones de despacho a nivel de proveedor. Cada producto define sus regiones de forma aislada. Requerimos:
- Persistir hasta 3 presets por proveedor.
- Posibilidad de renombrar cada preset (nombre amigable editable).
- Cargar un preset en el formulario antes (o después) de abrir el modal.
- Guardar/actualizar un preset desde la configuración editada en el modal o desde la vista de `ProductRegions`.

### 4. Opciones de Persistencia
1. Tabla dedicada (recomendado): `supplier_shipping_region_presets`
	- Campos sugeridos:
	  - `id uuid PK default gen_random_uuid()`
	  - `supplier_id uuid NOT NULL` (FK a users.user_id)
	  - `preset_index smallint NOT NULL` (1..3) con UNIQUE(supplier_id, preset_index)
	  - `name text NOT NULL` (default: 'Config. 1', etc.)
	  - `regions jsonb NOT NULL` (array de `{ region, price, delivery_days }`)
	  - `updated_at timestamptz DEFAULT now()`
	  - `created_at timestamptz DEFAULT now()`
	- Ventajas: escalable, clara, permite futuras extensiones (versionado, métricas).
2. Columna JSON en tabla `users` (menos aislado, riesgo de inflar perfil). Descartado.
3. Tabla genérica key/value de preferencias. Más complejidad para query directa. Descartado para simplicidad inicial.

=> Elegimos Opción 1.

### 5. Flujo de Uso (UX / UI)
1. Al abrir la sección "Regiones de Despacho" en `AddProduct`:
	- Mostrar 3 botones (outline) + (opcional) menú contextual de renombrado:
	  - `Config. 1`, `Config. 2`, `Config. 3`.
	  - Estado visual:
		 - Activo/aplicado (filled / contained o color distinto).
		 - Vacío (tooltip: "Vacío - guarda una configuración").
	- Botón "Guardar Configuración" (disabled si no hay regiones cargadas o no hay cambios vs preset activo).
2. Acciones:
	- Clic en un preset con datos: carga instantáneamente `formData.shippingRegions` (formato display) y marca preset activo.
	- Clic en un preset vacío: si ya hay regiones en el formulario -> prompt modal: "¿Guardar configuración actual como Config. X?".
	- Botón "Guardar Configuración": persiste las regiones actuales en el preset activo (o abre popover para elegir a cuál si ninguno está activo todavía).
	- Opción renombrar (icono editar al lado del nombre).
3. Al abrir el `ShippingRegionsModal` y guardar cambios, si hay un preset activo se puede marcar una bandera de "dirty vs preset" para habilitar botón de re-guardar.

### 6. Formatos y Conversiones (Reutilización)
Preservamos los converters existentes. Nuevas utilidades:
```js
// shippingRegionPresetsUtils.js (nuevo)
export const toPresetPayload = (displayRegions=[]) => convertFormRegionsToDb(displayRegions);
export const fromPresetPayload = (dbRegions=[]) => convertDbRegionsToForm(dbRegions);
```
Servirá para mantener consistencia con producto.

### 7. API / Servicio Supabase (Sugerido)
Crear un servicio dedicado: `services/supplier/shippingRegionPresetsService.js` con funciones:
```ts
getPresets(supplierId): Promise<Array<{preset_index, name, regions[]}>>
upsertPreset(supplierId, presetIndex, name, regionsArray)
renamePreset(supplierId, presetIndex, newName)
deletePreset(optional)
```
Restricciones:
- Validar máximo 3.
- Validar estructura: cada region debe existir en `utils/chileData.regiones`.
- price >= 0 entero; delivery_days >=1 entero.

### 8. Cambios en UI (Detalle Técnico)
`ProductRegions.jsx` ampliado:
1. Nuevo estado:
	- `presets` (length <=3) con shape `{ index, name, regions: displayFormat[] }`.
	- `activePresetIndex` (number | null).
	- `presetDirty` (bool) para saber si difiere de su origen.
2. Efecto inicial: cargar presets vía servicio (supplierId de localStorage).
3. Botonera superior antes del botón de abrir modal:
	- Map 1..3 -> render botón.
	- Si `presets[i]` existe mostrar nombre, si no placeholder.
4. Botón "Guardar Configuración":
	- Llama a `upsertPreset` con `activePresetIndex` (si null, abrir popover de selección 1..3 vacíos o sobrescribir existente con confirmación).
5. Renombrar: small inline TextField + confirm al blur o Enter.
6. Al aplicar preset: `setDisplayRegions(preset.regions)` y `onRegionChange(preset.regions)`.
7. Detectar dirty: comparar JSON.stringify(preset.regions) vs JSON.stringify(displayRegions) cuando `activePresetIndex` cambia o modal guarda.

### 9. Validaciones y Edge Cases
- Usuario sin presets: mostrar botones vacíos + tooltip.
- Intento de guardar sin regiones: deshabilitar.
- Duplicado de contenido entre presets: permitido (no hay restricción funcional fuerte).
- Renombrar a string vacío: revertir al anterior.
- Cambiar de preset con cambios no guardados: prompt de confirmación ("Perderás los cambios no guardados del preset activo").
- Producto en modo edición: si sus regiones coinciden exactamente con algún preset -> autoseleccionar ese preset (optimización opcional).

### 10. Migración SQL Propuesta
```sql
create table if not exists public.supplier_shipping_region_presets (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.users(user_id) on delete cascade,
  preset_index smallint not null check (preset_index between 1 and 3),
  name text not null default 'Config.' || preset_index,
  regions jsonb not null check (jsonb_typeof(regions) = 'array'),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (supplier_id, preset_index)
);

-- Index para queries rápidas
create index if not exists idx_shipping_region_presets_supplier on public.supplier_shipping_region_presets (supplier_id);
```
Políticas RLS (si RLS habilitado):
```sql
alter table public.supplier_shipping_region_presets enable row level security;
create policy "select_own_presets" on public.supplier_shipping_region_presets for select using (auth.uid() = supplier_id);
create policy "upsert_own_presets" on public.supplier_shipping_region_presets for all using (auth.uid() = supplier_id) with check (auth.uid() = supplier_id);
```

### 11. Seguridad / Integridad
- Server-side (RPC opcional) podría validar lista de regiones contra catálogo estático.
- Limitar tamaño JSON (< 8KB) ya que son 16 regiones máximo.

### 12. Performance
- Carga inicial: 1 query ligera (max 3 filas).
- Sin impacto significativo en AddProduct render.

### 13. Plan de Implementación Incremental
Fases sugeridas:
1. Migración DB + servicio Supabase.
2. Hook `useShippingRegionPresets(supplierId)` para encapsular lógica CRUD + estados (loading, error, saving).
3. Extender `ProductRegions.jsx` con UI de presets (lectura y aplicación) sin guardar aún.
4. Añadir guardado / renombrado.
5. Edge cases (dirty prompt, autoselect edit).
6. Tests manuales + logs. (Opcional: unit tests conversores).

### 14. Reutilización Futuras
- Podrían agregarse presets globales sugeridos por la plataforma (preset_index > 3 y flag `is_global`).
- Versionado histórico (tabla hija) si se requiere auditoría.

### 15. Minimal API Contrato
Entrada upsert:
```json
{ "supplier_id": "uuid", "preset_index": 1, "name": "Config Norte", "regions": [ {"region":"valparaiso","price":5000,"delivery_days":3} ] }
```
Salida get:
```json
[{ "preset_index":1, "name":"Config Norte", "regions":[{"region":"valparaiso","price":5000,"delivery_days":3}] }]
```

### 16. Componentes a Modificar / Añadir
- Nuevo: `src/services/supplier/shippingRegionPresetsService.js`
- Nuevo: `src/domains/supplier/hooks/useShippingRegionPresets.js`
- Editar: `ProductRegions.jsx` (añadir barra de presets, estado, handlers).
- (Opcional) Editar `ShippingRegionsModal.jsx` para botón rápido "Guardar como preset" (fase posterior).

### 17. Estrategia de Comparación (Dirty Check)
Utilizar `JSON.stringify(a) === JSON.stringify(b)` dado tamaño pequeño y simplicidad.
Si se busca optimización: mapear a firma hash `regions.map(r=>r.region+':'+r.price+':'+r.delivery_days).join('|')`.

### 18. Métricas de Éxito
- % de productos nuevos que usan un preset.
- Tiempo promedio de configuración reducido.
- Número de sobrescrituras por preset (indicador de estabilidad).

### 19. Riesgos y Mitigaciones
| Riesgo | Mitigación |
| ------ | ---------- |
| Inconsistencia de formatos | Reutilizar utils existentes estrictamente |
| Usuario sobrescribe sin querer | Confirmación al sobrescribir preset existente |
| Falta de RLS | Implementar políticas antes de exponer UI |
| Errores silenciosos en fetch | Hook devuelve estados `error` y logs en consola |

### 20. Próximos Pasos Inmediatos
1. Crear migración.
2. Implementar servicio y hook.
3. Ajustar UI `ProductRegions` (fase 1: solo lectura y aplicación).
4. Añadir guardado y renombrado.
5. QA manual y documentación adicional.

---
Documento generado para guiar implementación de presets de regiones.

### 21. Verificación Profunda Adicional (Corroboración)
Revisión extendida de código existente para asegurar alineación:

1. Persistencia actual de regiones por producto:
	- Servicio `productDeliveryRegionsService.js` realiza estrategia destructiva: elimina todas las filas previas y reinserta (`delete` + `insert`). Presets NO deben reutilizar ese patrón directo, sino operar sobre su propia tabla independiente.
2. Puntos de consumo de datos de regiones (alias):
	- Múltiples lugares consultan cualquier de: `shippingRegions`, `delivery_regions`, `shipping_regions`, `product_delivery_regions` (fallback defensivo). Presets deben entregar datos al formulario en formato `shippingRegions` (display) y luego el flujo existente ya los convertirá a DB sin cambios.
3. Cálculo y validación de envío:
	- `shippingCalculation.js`, `useUnifiedShippingValidation.js`, y hooks/cart suman y validan usando claves `price` o `shippingValue`. El formato de preset (usando `price` y `delivery_days`) es 100% compatible tras pasar por `convertDbRegionsToForm`.
4. Hook de formulario (`useProductForm`):
	- Detecta cambios profundos en `shippingRegions` vía comparación JSON simple. Aplicar un preset modificará el array y marcará el formulario como cambiado (esperado). No requiere ajuste.
5. Validación (`ProductValidator`):
	- Solo exige >0 regiones. Un preset aplicado satisface esto inmediatamente.
6. Riesgos confirmados:
	- Sobrescritura accidental de un preset existente: se implementará confirmación explícita.
	- Cambio de preset con modificaciones sin guardar: requiere prompt (ya listado en Edge Cases sección 9).
7. No se hallaron dependencias que esperen campos adicionales (ej. no se usa `id` dentro de cada región salvo en tablas). Presets almacenarán únicamente `region`, `price`, `delivery_days`.
8. Consistencia de nombres:
	- DB productos usa `delivery_days` (snake). Display usa `maxDeliveryDays` (camel). Converters actuales cubren esta diferencia; reutilizables para presets.
9. Escalabilidad:
	- `supplier_shipping_region_presets` agregará como máximo 3 filas por proveedor → cardinalidad baja, consultas rápidas con índice por `supplier_id`.
10. Seguridad (RLS):
	- Necesario replicar patrón de otras tablas dependientes del proveedor (observado que varias tablas no muestran RLS aquí, pero la propuesta incluye políticas). Confirmar si proyecto ya activó RLS globalmente.

Conclusión: El diseño propuesto es compatible sin requerir refactors en validaciones, cálculo de envío ni servicios existentes. Se confirma viabilidad inmediata.
