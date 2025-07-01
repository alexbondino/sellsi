# Medidas de Seguridad del Panel de Control Administrativo Sellsi

1. **Login seguro solo para usuarios autorizados**
   - Acceso restringido a usuarios registrados en la tabla `control_panel_users` de Supabase.

2. **Contraseñas hasheadas**
   - Almacenamiento seguro de contraseñas usando algoritmos de hash robustos.

3. **Autenticación de dos factores (2FA)**
   - Segundo factor de verificación con Google Authenticator u otra app compatible.

4. **Rutas y componentes protegidos**
   - Solo accesibles para usuarios autenticados y autorizados como administradores.

5. **Configuración avanzada de cookies seguras**
   - `httpOnly`: solo accesibles por el servidor.
   - `Secure`: solo transmitidas por HTTPS.
   - `SameSite=Strict`: no se envían en peticiones cross-site.
   - `maxAge`/`expires`: expiración automática de sesión.

6. **Protección contra ataques de fuerza bruta**
   - Rate limiting en el endpoint de login para limitar intentos fallidos.

7. **Validación y autorización estricta**
   - Comprobación de permisos en cada acción administrativa.

8. **Auditoría avanzada**
   - Registro detallado de accesos y acciones críticas en la tabla `admin_logs`.
   - Historial completo disponible para superadmins.

9. **Alertas automáticas ante eventos sospechosos**
   - Notificaciones por email, Slack o dashboard ante:
     - Intentos fallidos de login repetidos.
     - Accesos desde IPs no habituales.
     - Acciones críticas fuera de horario normal.

10. **Comunicación solo por HTTPS**
    - Toda la aplicación y las cookies funcionan únicamente sobre conexiones cifradas.

11. **Cifrado de datos sensibles**
    - Cifrado de datos críticos tanto en tránsito como en reposo.

12. **Proceso de recuperación manual para 2FA**
    - Procedimiento seguro para restaurar acceso en caso de pérdida del segundo factor.

---

Estas medidas, implementadas en conjunto, garantizan un nivel de seguridad empresarial para el panel administrativo de Sellsi.
