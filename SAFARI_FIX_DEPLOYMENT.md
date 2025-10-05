# 🚀 Safari Compatibility Fix - Deployment Guide

## 📋 Resumen de Cambios

Este commit resuelve **DOS PROBLEMAS CRÍTICOS** que afectan Safari:

1. **Cross-origin iframe access error** con Sentry Replay + YouTube
2. **ReferenceError: requestIdleCallback** no soportado en Safari < 18

---

## 📦 Archivos Modificados

### Nuevos archivos:
- ✨ `sellsi/src/lib/polyfills.js` - Polyfill para requestIdleCallback
- ✨ `control_panel/src/lib/polyfills.js` - Polyfill para control panel
- ✨ `sellsi/test-safari-compatibility.js` - Suite de tests para Safari
- 📄 `SAFARI_COMPATIBILITY_ANALYSIS.md` - Análisis completo del problema

### Archivos modificados:
- 🔧 `sellsi/src/main.jsx` - Import de polyfills
- 🔧 `control_panel/src/main.jsx` - Import de polyfills
- 🔧 `sellsi/src/lib/sentryDeferred.js` - Config de Sentry Replay con blockSelector
- 🔧 `sellsi/src/domains/marketplace/pages/sections/ProductsSection.jsx` - Fix para requestIdleCallback

---

## 🎯 Cambios Técnicos Detallados

### 1. Polyfill de requestIdleCallback (`sellsi/src/lib/polyfills.js`)

```javascript
// Detecta si requestIdleCallback no existe y crea un polyfill
if (typeof window !== 'undefined' && !('requestIdleCallback' in window)) {
  window.requestIdleCallback = function(callback, options) {
    // Usa setTimeout como fallback
    // Mantiene API compatible con deadline.timeRemaining()
  };
  
  window.cancelIdleCallback = function(id) {
    // Limpia el timeout correspondiente
  };
}
```

**Impacto:** Soluciona `ReferenceError` en Safari < 18

---

### 2. Configuración de Sentry Replay (`sellsi/src/lib/sentryDeferred.js`)

```javascript
mod.replayIntegration({
  blockAllMedia: false,
  maskAllText: false,
  maskAllInputs: true,
  // 🛡️ CLAVE: Bloquea grabación de iframes externos
  blockSelector: 'iframe[src*="youtube.com"], iframe[src*="youtu.be"], iframe[src*="vimeo.com"]',
}),
```

**Impacto:** Evita error "Blocked a frame with origin" en Safari

---

### 3. Fix en ProductsSection.jsx

**Antes:**
```javascript
requestIdleCallback?.(() => { ... })  // ❌ Causa ReferenceError
```

**Después:**
```javascript
if (window.requestIdleCallback) {
  window.requestIdleCallback(() => { ... })  // ✅ Safe access
}
```

**Impacto:** Acceso seguro sin ReferenceError

---

### 4. Import de polyfills en main.jsx

```javascript
// 🛡️ SAFARI FIX: debe ir PRIMERO
import './lib/polyfills.js';
```

**Impacto:** Garantiza que polyfill está disponible antes de cualquier código que lo use

---

## 🧪 Testing Checklist

Antes de mergear a producción, verificar:

### Safari Desktop (macOS)
- [ ] Safari 17.x en macOS Sonoma
- [ ] Safari 16.x en macOS Monterey
- [ ] No hay errores en consola
- [ ] YouTubeEmbed carga correctamente
- [ ] ProductsSection funciona sin errores
- [ ] Sentry Replay no causa errores cross-origin

### Safari Mobile (iOS)
- [ ] Safari iOS 17 (iPhone)
- [ ] Safari iOS 16 (iPhone/iPad)
- [ ] Navegación fluida sin crashes
- [ ] Console sin errores

### Regresión en otros navegadores
- [ ] Chrome Desktop/Mobile (no debe haber cambios)
- [ ] Firefox Desktop/Mobile (no debe haber cambios)
- [ ] Edge Desktop (no debe haber cambios)

---

## 🚀 Comandos de Deploy

### Staging
```bash
# 1. Verificar cambios
git status

# 2. Agregar archivos
git add .

# 3. Commit
git commit -m "fix(safari): add requestIdleCallback polyfill and configure Sentry Replay for cross-origin iframes

PROBLEMAS RESUELTOS:
- ❌ ReferenceError: requestIdleCallback no soportado en Safari < 18
- ❌ Cross-origin error con Sentry Replay intentando acceder a iframes de YouTube

CAMBIOS:
- ✨ Nuevo: polyfills.js para requestIdleCallback (Safari < 18 support)
- 🔧 sentryDeferred.js: blockSelector para iframes externos en Sentry Replay
- 🔧 ProductsSection.jsx: safe access a window.requestIdleCallback
- 🔧 main.jsx: import de polyfills al inicio (sellsi + control_panel)
- 📄 SAFARI_COMPATIBILITY_ANALYSIS.md: documentación completa del problema
- 🧪 test-safari-compatibility.js: suite de tests para validar fixes

IMPACTO:
- Resuelve errores críticos para ~30-40% de usuarios (Safari Desktop + iOS)
- Mejora experiencia en Safari sin afectar otros navegadores
- Sentry Replay sigue funcionando pero sin causar errores cross-origin

TESTING:
- Validar en Safari 16+ y Safari iOS 16+
- Verificar que no hay ReferenceError en consola
- Confirmar que YouTubeEmbed carga sin errores
- Regresión: Chrome, Firefox, Edge funcionan normalmente

Refs: #safari-compatibility"

# 4. Push a staging
git push origin staging

# 5. Verificar en staging-sellsi.vercel.app con Safari
```

### Producción (después de validar staging)
```bash
# 1. Cambiar a rama main
git checkout main

# 2. Merge desde staging
git merge staging

# 3. Push a producción
git push origin main

# 4. Verificar deploy automático en Vercel
```

---

## 📊 Métricas a Monitorear Post-Deploy

### En Vercel Analytics
- Error rate en Safari (debe bajar significativamente)
- Bounce rate en Safari (debe mejorar)

### En Sentry
- Reducción de errores "ReferenceError: requestIdleCallback"
- Reducción de errores "Blocked a frame with origin"
- Verificar que Replay sigue funcionando en otros navegadores

### En Google Analytics
- Engagement de usuarios Safari (debe mejorar)
- Conversiones desde Safari (debe aumentar)

---

## 🆘 Rollback Plan

Si aparecen problemas después del deploy:

```bash
# 1. Revert del commit
git revert HEAD

# 2. Push del revert
git push origin staging

# 3. Investigar logs en Sentry
```

**Archivos críticos a revisar:**
- `sellsi/src/lib/polyfills.js`
- `sellsi/src/lib/sentryDeferred.js`
- `sellsi/src/main.jsx`

---

## 📚 Referencias

- **Análisis completo:** `SAFARI_COMPATIBILITY_ANALYSIS.md`
- **Suite de tests:** `sellsi/test-safari-compatibility.js`
- **Sentry Replay docs:** https://docs.sentry.io/platforms/javascript/session-replay/
- **requestIdleCallback support:** https://caniuse.com/requestidlecallback

---

## ✅ Checklist Final Pre-Deploy

- [ ] Todos los archivos modificados están en el commit
- [ ] Tests locales pasaron
- [ ] Revisión de código completada
- [ ] Documentación actualizada
- [ ] Plan de rollback definido
- [ ] Métricas de monitoreo identificadas
- [ ] Safari testing en staging completado
- [ ] Equipo notificado del deploy

---

**Generado:** 5 de Octubre, 2025  
**Prioridad:** 🔴 CRÍTICA  
**Estimación de impacto:** 30-40% de usuarios (Safari Desktop + iOS)  
**Risk level:** Bajo (cambios aislados con fallbacks)
