# 🛡️ BACKUP Y ROLLBACK PLAN - CACHE POLICY OPTIMIZATION
## Sellsi Marketplace - Plan de Contingencia

**Fecha del backup:** 11 de septiembre de 2025  
**Rama:** staging  
**Commit actual:** `git log -1 --oneline` para verificar  

---

## 📋 **ARCHIVOS RESPALDADOS**

### 1. **Configuración Original de Vercel**
- **Archivo:** `vercel.json.backup`
- **Ubicación:** `c:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\vercel.json.backup`
- **Estado:** ✅ Respaldado

```json
{
  "rewrites": [
    { "source": "/robots.txt", "destination": "/robots.txt" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

### 2. **Build Actual**
- **Directorio:** `dist/` (generado con configuración actual)
- **Estado:** ✅ Disponible como referencia

---

## 🚨 **PLAN DE ROLLBACK INMEDIATO**

### **Opción 1: Rollback Completo (2 minutos)**
```powershell
# 1. Restaurar configuración original
cd C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi
copy vercel.json.backup vercel.json

# 2. Re-deploy inmediato
git add vercel.json
git commit -m "ROLLBACK: Restore original vercel.json configuration"
git push origin staging

# 3. Verificar en Vercel Dashboard que el deploy se complete
# URL: https://vercel.com/alexbondino/sellsi
```

### **Opción 2: Rollback de Headers Específicos**
Si solo algunos headers causan problemas, puedes editarlos selectivamente:

```json
// vercel.json - Rollback parcial
{
  "rewrites": [
    { "source": "/robots.txt", "destination": "/robots.txt" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "headers": [
    // Mantener solo headers que funcionan bien
    // Comentar o remover headers problemáticos
  ]
}
```

---

## 🔍 **TESTING SEGURO PASO A PASO**

### **Fase 1: Test en Preview Environment**
```powershell
# 1. Aplicar cambios solo en branch de testing
git checkout -b feature/cache-optimization-test
git add .
git commit -m "TEST: Add cache headers configuration"
git push origin feature/cache-optimization-test

# 2. Vercel creará preview deployment automáticamente
# URL será: https://sellsi-[hash]-alexbondino.vercel.app
```

### **Fase 2: Validación de Headers**
```bash
# Testing con curl para verificar headers
curl -I https://sellsi-[preview-hash].vercel.app/assets/js/[cualquier-archivo].js

# Debe mostrar:
# Cache-Control: public, max-age=31536000, immutable
# Vary: Accept-Encoding
```

### **Fase 3: Performance Testing**
- [ ] **Lighthouse en preview URL**: Score antes/después
- [ ] **DevTools Network**: Verificar cache hits en segunda carga
- [ ] **Funcionalidad**: Verificar que todo sigue funcionando

### **Fase 4: Merge Gradual**
```powershell
# Solo si todo funciona bien en preview
git checkout staging
git merge feature/cache-optimization-test
git push origin staging
```

---

## 🚩 **INDICADORES DE PROBLEMAS**

### **Señales de que necesitas rollback:**
- ❌ **404 errors** en assets estáticos
- ❌ **Lighthouse score** baja significativamente
- ❌ **Console errors** sobre recursos no encontrados
- ❌ **Funcionalidad rota** (botones, navegación, etc.)
- ❌ **Tiempo de carga** aumenta en lugar de disminuir

### **Cómo verificar en tiempo real:**
```javascript
// Ejecutar en DevTools Console para verificar cache
const resources = performance.getEntriesByType('resource');
const cached = resources.filter(r => r.transferSize === 0 && r.decodedBodySize > 0);
console.log(`Cache hit ratio: ${(cached.length/resources.length*100).toFixed(1)}%`);
console.log(`Cached resources: ${cached.length}/${resources.length}`);
```

---

## ⚡ **IMPLEMENTACIÓN PROGRESIVA SEGURA**

### **Paso 1: Solo JS/CSS Files (Bajo riesgo)**
```json
{
  "headers": [
    {
      "source": "/assets/js/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/assets/css/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

### **Paso 2: Si Paso 1 OK, añadir Imágenes**
```json
{
  "source": "/(.*\\.(png|jpg|jpeg|webp|gif|ico))",
  "headers": [
    { "key": "Cache-Control", "value": "public, max-age=2592000" }
  ]
}
```

### **Paso 3: Si todo OK, configuración completa**
Implementar la configuración completa de `vercel-optimized.json`

---

## 🔧 **COMANDOS DE EMERGENCIA**

### **Rollback Inmediato (1 comando)**
```powershell
# Restaurar y deploy en una sola línea
cd C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi && copy vercel.json.backup vercel.json && git add vercel.json && git commit -m "EMERGENCY ROLLBACK" && git push origin staging
```

### **Verificar Status de Deploy**
```powershell
# Ver logs de Vercel (si tienes CLI instalado)
vercel logs --app=sellsi

# O verificar en navegador:
# https://vercel.com/alexbondino/sellsi/deployments
```

### **Limpiar Cache de Browser (Testing)**
```javascript
// Ejecutar en DevTools para limpiar cache local
caches.keys().then(names => 
  Promise.all(names.map(name => caches.delete(name)))
).then(() => location.reload(true));
```

---

## 📊 **MÉTRICAS DE VALIDACIÓN**

### **Antes de los cambios (Baseline)**
- [ ] Lighthouse Score: ___
- [ ] Load Time: ___
- [ ] Cache Hit Ratio: 0%
- [ ] Total Transfer Size: ___

### **Después de los cambios (Target)**
- [ ] Lighthouse Score: >= Baseline
- [ ] Load Time: <= Baseline (primera carga), < 50% Baseline (segunda carga)
- [ ] Cache Hit Ratio: > 70%
- [ ] Total Transfer Size: < 50% Baseline (returning users)

---

## ⏰ **TIMELINE DE TESTING**

1. **T+0min**: Implementar cambios en preview
2. **T+5min**: Verificar preview deployment exitoso
3. **T+10min**: Testing manual en preview URL
4. **T+15min**: Lighthouse audit en preview
5. **T+20min**: Si todo OK → merge a staging
6. **T+25min**: Monitor producción por 30 minutos
7. **T+60min**: Si no hay problemas → Success ✅

### **Criterio de Rollback:**
Si en cualquier punto hay problemas → ROLLBACK INMEDIATO

---

## 💡 **RECOMENDACIÓN EJECUTIVA**

**Para máxima seguridad:**
1. Empieza con **solo headers de JS/CSS** (riesgo mínimo)
2. Testa en **preview environment** primero
3. Monitorea **métricas en tiempo real**
4. Ten el **comando de rollback** listo

**El backup está listo. ¿Procedo con la implementación gradual empezando por el paso más seguro (solo JS/CSS cache headers)?**
