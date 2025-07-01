# 📝 Plan de Implementación – Panel de Control Administrativo Sellsi (Integración Real con Código Existente)

## 1. Resumen ejecutivo

**Propósito general:**
Desarrollar un panel de control administrativo para gestionar pagos, solicitudes y devoluciones entre proveedores, compradores y Sellsi, centralizando la administración y trazabilidad de las operaciones.

**Usuario objetivo:**
Administradores internos de Sellsi responsables de la gestión de pagos y solicitudes.

**Problemas que resuelve:**
- Control seguro de acceso administrativo.
- Gestión centralizada de solicitudes y pagos.
- Validación y trazabilidad de estados de pedidos y pagos.
- Comunicación automatizada con compradores ante confirmaciones, rechazos y devoluciones.

---

## 2. Mapa funcional por requerimiento (con componentes y hooks existentes)

- **Login:**
  - Acceso seguro solo para usuarios registrados en `control_panel_users` (Supabase).
  - Reutilizar lógica y componentes de `/src/features/login` y hooks de autenticación (`useLoginForm`).
  - Adaptar el flujo para validar contra la nueva tabla de admins.
- **Tabla principal:**
  - Visualización/interacción con solicitudes (proveedor, comprador, ticket, dirección, fechas, venta, estado, acciones).
  - Reutilizar `Table`, `Rows`, `Filter` de `/src/features/ui/table`.
  - Usar `StatCard` y `Widget` para métricas/resúmenes.
- **Confirmación:**
  - Modal para confirmar pagos, mostrar comprobantes y enviar notificaciones.
  - Reutilizar `Modal`, `PrimaryButton`, `FileUploader`.
- **Rechazo:**
  - Modal para rechazar pagos, adjuntar motivos/documentos y notificar al comprador.
  - Reutilizar `Modal`, `FileUploader`, `PrimaryButton`.
- **Devolución:**
  - Modal para devolver dinero, subir comprobantes y notificar al comprador.
  - Reutilizar `Modal`, `FileUploader`, `PrimaryButton`.

**Flujo general:**
1. Admin accede vía login seguro (validación en Supabase).
2. Visualiza solicitudes en tabla principal (`Table`).
3. Gestiona solicitudes (confirmar, rechazar, devolver) mediante modales y acciones (`Modal`, `PrimaryButton`).
4. Estados y notificaciones se actualizan automáticamente (servicios y hooks).

---

## 3. Análisis de requisitos (aplicado a tu código)

**Funcionales:**
- Login seguro solo para usuarios autorizados (adaptar `/features/login`).
- Visualización y gestión de solicitudes con estados y acciones (`Table`, `Rows`).
- Confirmación, rechazo y devolución de pagos con notificaciones y adjuntos (`Modal`, `FileUploader`).

**No funcionales:**
- Seguridad en autenticación y manejo de datos (hash, validación, rate limiting).
- Rendimiento en carga y actualización de la tabla principal (optimizar queries y paginación).
- Mantenibilidad y modularidad del código (separar lógica, UI y servicios).

---

## 4. Diseño de arquitectura (integración real)

- **Estructura recomendada:**
  - `/src/features/admin_panel/` (nuevos componentes y lógica del panel)
  - Reutilizar `/src/features/ui/` para tablas, modales, botones, file uploaders, etc.
  - Servicios en `/src/services/` (crear `adminPanelService.js` para CRUD con Supabase)
- **Frontend–Supabase:**
  - Usar `supabase.js` para todas las operaciones (login, CRUD, storage).
  - Autenticación y autorización vía Supabase Auth y tabla `control_panel_users`.
- **Login seguro:**
  - Adaptar `useLoginForm` para validar contra `control_panel_users`.
  - Hash de contraseñas y protección contra ataques de fuerza bruta.

---

## 5. Modelo de datos (SQL sugerido)

```sql
CREATE TABLE control_panel_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario text UNIQUE NOT NULL,
  password_hash text NOT NULL
);

CREATE TABLE control_panel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor text NOT NULL,
  comprador text NOT NULL,
  ticket text NOT NULL,
  direccion_entrega text NOT NULL,
  fecha_solicitada date NOT NULL,
  fecha_entrega date,
  venta numeric NOT NULL,
  estado text NOT NULL,
  acciones text,
  comprobante_pago text
);

ALTER TABLE requests ADD COLUMN id_control_panel uuid REFERENCES control_panel(id);
ALTER TABLE requests ADD COLUMN detalles text;
ALTER TABLE requests ADD COLUMN adjuntos text;
```

---

## 6. Pasos de implementación (simulación real)

1. **Crear tablas en Supabase** usando el SQL anterior.
2. **Crear `/src/features/admin_panel/`** y definir rutas protegidas solo para admins.
3. **Adaptar login**: reutilizar `/features/login` y `useLoginForm`, pero validar contra `control_panel_users`.
4. **Crear servicio `adminPanelService.js`** en `/src/services/` para CRUD de solicitudes y usuarios admins.
5. **Construir tabla principal** reutilizando `Table`, `Rows`, `Filter`.
6. **Crear modales** de confirmación, rechazo y devolución usando `Modal`, `FileUploader`, `PrimaryButton`.
7. **Integrar notificaciones**: usar lógica de correo ya existente o crear función en el servicio.
8. **Gestionar estados**: hooks personalizados o adaptar hooks de marketplace/supplier.
9. **Testing**: pruebas unitarias de servicios y componentes, pruebas de integración de flujos.
10. **Checklist de integración**:
    - [ ] Login admin funcional
    - [ ] Tabla principal muestra datos reales
    - [ ] Modales operativos y suben archivos
    - [ ] Estados y notificaciones funcionan
    - [ ] Todo modular y reutilizable

---

## 7. Reutilización y modularidad (con ejemplos de tu código)

- **Tablas:** `/src/features/ui/table/Table.js`, `/src/features/ui/table/Rows.js`
- **Modales:** `/src/features/ui/Modal.js`, `/src/features/ui/ContactModal.js`
- **Botones:** `/src/features/ui/PrimaryButton.js`
- **File uploaders:** `/src/features/ui/FileUploader.js`, `/src/features/ui/ImageUploader.js`
- **Cards y widgets:** `/src/features/ui/StatCard.js`, `/src/features/ui/Widget.js`
- **Hooks:** `useLoginForm`, `useLazyImage`, hooks de supplier/marketplace para paginación y estado
- **Servicios:** `/src/services/supabase.js` (crear `adminPanelService.js`)

---

## 8. Diseño de componentes frontend (con props y eventos sugeridos)

- **AdminPanelTable**: props (`data`, `onAction`), eventos (`onView`, `onConfirm`, `onReject`, `onRefund`)
- **AdminModalConfirmarPago**: props (`transaccion`, `comprobante`), eventos (`onConfirm`)
- **AdminModalRechazarPago**: props (`motivo`, `adjuntos`), eventos (`onReject`)
- **AdminModalDevolverPago**: props (`datos`, `comprobante`), eventos (`onRefund`)
- **Estados visuales:** usar `StatusChip` o badges existentes para: depositado, en proceso, entregado, rechazado, pagado, cancelado, devuelto

---

## 9. Gestión de estados y eventos (con hooks y patrones de tu código)

- Usar hooks personalizados (`useState`, `useEffect`, `useCallback`) para manejar estados de solicitudes y modales.
- Adaptar patrones de hooks de marketplace/supplier para paginación y filtros.
- Contexto global o store si el panel crece (ejemplo: React Context o Zustand).

---

## 10. Interacción con Supabase (ejemplo de integración real)

- **Login:**
  - `adminPanelService.loginAdmin(usuario, password)` → consulta en `control_panel_users`.
- **Tabla:**
  - `adminPanelService.getSolicitudes()` → consulta en `control_panel`.
- **Requests:**
  - `adminPanelService.createRequest(data)` → inserta en `requests`.
- **Archivos:**
  - Usar `supabase.storage` para comprobantes y adjuntos.
- **Filtros:**
  - Filtrar por estado, usuario, fechas usando queries en el servicio.

---

## 11. Estrategia de testing (aplicada a tu código)

- Pruebas unitarias de servicios (`adminPanelService.js`).
- Pruebas de componentes (`AdminPanelTable`, modales).
- Pruebas de integración de flujos completos (login, confirmación, rechazo, devolución).
- Casos borde: acceso no autorizado, archivos inválidos, estados inconsistentes.

---

## 12. Ambigüedades, dudas o riesgos

- ¿Qué datos exactos debe contener el comprobante de pago? (definir formato y validaciones)
- ¿Qué adjuntos se permiten en rechazos? (tipos y tamaño)
- ¿Hay límites de tamaño/tipo de archivo? (definir en FileUploader)
- ¿Quién puede ver el historial de acciones? (solo admins, auditores, etc.)
- ¿Se requiere logging/auditoría avanzada desde el inicio?

---

## 13. Mejoras futuras

- Logs y auditoría de acciones (crear tabla de logs o usar Supabase logs).
- Dashboard de métricas y reportes (reutilizar `StatCard`, `Widget`).
- Permisos avanzados por rol (ampliar `control_panel_users`).
- Integración con sistemas externos de pago.

---

## 14. Checklist final de integración real

- [ ] Tablas creadas en Supabase
- [ ] Servicio `adminPanelService.js` implementado
- [ ] Login admin funcional y seguro
- [ ] Tabla principal muestra datos reales
- [ ] Modales de confirmación, rechazo y devolución operativos
- [ ] Subida y descarga de archivos comprobantes
- [ ] Estados y notificaciones funcionando
- [ ] Pruebas unitarias e integración completas
- [ ] Cumplimiento de estructura y modularidad
- [ ] Documentación técnica actualizada

---

## 15. Medidas de seguridad avanzadas (implementación y funcionamiento)

### 1. Autenticación de dos factores (2FA)

**¿Qué es?**
- Un segundo paso de verificación, además de la contraseña, usando una app como Google Authenticator.

**¿Cómo funciona?**
- Al iniciar sesión, tras ingresar usuario y contraseña, el sistema solicita un código temporal de 6 dígitos generado por una app 2FA.
- El código cambia cada 30 segundos y solo el usuario con acceso físico a su dispositivo puede verlo.

**¿Cómo se implementa?**
- Al registrar o activar 2FA, el backend genera un secreto único para el usuario (usando librerías como `speakeasy` en Node.js).
- Se muestra un QR en el frontend (usando `qrcode.react` o similar) para que el admin lo escanee con Google Authenticator.
- El secreto se guarda cifrado en la base de datos (`control_panel_users.twofa_secret`).
- En cada login, tras validar usuario y contraseña, el backend solicita y valida el código 2FA:
  - El usuario ingresa el código de su app.
  - El backend verifica el código usando el secreto guardado.
  - Si es correcto, concede acceso; si no, lo rechaza.

**Reflejo en la práctica:**
- Los admins verán una pantalla adicional pidiendo el código 2FA después del login.
- Si pierden acceso a su app 2FA, se debe tener un proceso de recuperación manual.

---

### 2. Configuración avanzada de cookies seguras

**¿Qué es?**
- Configurar las cookies de sesión para que sean resistentes a ataques y robos.

**¿Cómo funciona?**
- Se establecen las siguientes propiedades en las cookies de autenticación:
  - `httpOnly`: la cookie no es accesible por JavaScript, solo por el servidor.
  - `Secure`: la cookie solo viaja por HTTPS.
  - `SameSite=Strict`: la cookie solo se envía en navegación directa, nunca en peticiones de otros sitios.
  - `maxAge`/`expires`: la cookie expira automáticamente tras un tiempo definido.

**¿Cómo se implementa?**
- En el backend, al crear la cookie de sesión, se configuran estas opciones. Ejemplo en Node.js/Express:
```js
res.cookie('token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'Strict',
  maxAge: 3600000 // 1 hora
});
```
- En Supabase, si se usa JWT o sesión, asegurarse de que las cookies cumplen estas propiedades.

**Reflejo en la práctica:**
- Si un atacante logra inyectar código en el frontend, no podrá leer la cookie.
- La cookie solo viaja por HTTPS y no se envía a otros sitios.
- Si la sesión expira, el usuario debe volver a iniciar sesión.

---

### 3. Auditoría avanzada y alertas automáticas

**¿Qué es?**
- Registrar y monitorear todas las acciones administrativas y accesos, y generar alertas ante eventos sospechosos.

**¿Cómo funciona?**
- Cada vez que un admin inicia sesión, realiza una acción crítica (confirmar/rechazar/devolver pago, cambiar datos, etc.), se registra un log detallado:
  - Usuario, acción, fecha/hora, IP, detalles de la acción.
- Se pueden definir alertas automáticas:
  - Intentos fallidos de login repetidos.
  - Acceso desde IPs no habituales.
  - Acciones críticas fuera de horario normal.
- Las alertas pueden enviarse por email, Slack, o mostrarse en un dashboard.

**¿Cómo se implementa?**
- Crear una tabla `admin_logs` en la base de datos:
```sql
CREATE TABLE admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario text NOT NULL,
  accion text NOT NULL,
  detalles text,
  fecha timestamp with time zone DEFAULT now(),
  ip text
);
```
- En cada endpoint crítico del backend, registrar la acción en esta tabla.
- Implementar lógica para detectar patrones sospechosos y enviar alertas (puede ser un script, función serverless o integración con servicios de monitoreo).

**Reflejo en la práctica:**
- Los superadmins pueden revisar un historial completo de acciones.
- Si hay intentos de acceso sospechosos, se recibe una alerta inmediata.
- Se puede auditar quién hizo qué y cuándo, útil para cumplimiento y seguridad.

---

Estas medidas, combinadas, elevan la seguridad del panel admin a nivel empresarial y protegen contra la mayoría de los ataques modernos.

---

**¡Sigue estos pasos y recomendaciones para una integración real, modular y profesional del panel de control administrativo en Sellsi!**
