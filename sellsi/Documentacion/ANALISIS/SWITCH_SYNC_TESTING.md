# 🧪 SCRIPT DE TESTING: Sincronización de Switch de Rol

## ⚡ CASOS DE PRUEBA

### **Test 1: Navegación Manual**
```bash
# Usuario: Supplier (main_supplier=true)
# 1. Navegar a /buyer/marketplace
# 2. Verificar: Switch muestra "Comprador" ✅
# 3. Navegar a /supplier/home  
# 4. Verificar: Switch muestra "Proveedor" ✅
```

### **Test 2: Cambio de Rol en Profile**
```bash
# Usuario: Supplier (main_supplier=true)
# 1. Ir a /supplier/profile
# 2. Cambiar rol de "Proveedor" → "Comprador"
# 3. Guardar cambios
# 4. Verificar: Switch en TopBar actualiza a "Comprador" inmediatamente ✅
# 5. Verificar: Navegación automática funciona correctamente ✅
```

### **Test 3: Persistencia tras Recarga**
```bash
# Usuario: Cambió rol a Buyer en Profile
# 1. Recargar página (F5)
# 2. Verificar: Switch mantiene "Comprador" ✅
# 3. Verificar: Redirección automática a /buyer/marketplace ✅
```

### **Test 4: Cierre y Apertura de Navegador**
```bash
# Usuario: Session activa, rol = Supplier
# 1. Cerrar navegador completamente
# 2. Abrir navegador y ir a la aplicación
# 3. Login automático (sesión persistente)
# 4. Verificar: Switch muestra "Proveedor" ✅
# 5. Verificar: Redirección a /supplier/home ✅
```

## 🔍 DEBUGGING

### **Console Logs Esperados (Development)**
```javascript
// ✅ Sincronización exitosa
// (No logs de warning)

// ❌ Desincronización detectada
console.warn('🔄 Role sync issue detected:', {
  userProfileMainSupplier: true,
  currentAppRole: 'buyer',
  profileRole: 'supplier',
  hasSession: true,
  hasUserProfile: true
});
```

### **Verificaciones en React DevTools**
```javascript
// RoleProvider state
{
  currentAppRole: 'supplier',
  isRoleSwitching: false,
  isRoleLoading: false,
  isBuyer: false
}

// TopBar props
{
  isBuyer: false,
  // currentRole calculado = 'supplier'
}

// useRoleSync state
{
  isInSync: true,
  currentRole: 'supplier',
  profileRole: 'supplier'
}
```

## 🚨 PROBLEMAS CONOCIDOS Y SOLUCIONES

### **Problema**: Switch no actualiza tras cambio en Profile
**Causa**: RoleProvider no detecta cambio en userProfile.main_supplier
**Solución**: Verificar que AuthProvider.refreshUserProfile() funciona correctamente

### **Problema**: Navegación automática interrumpe edición
**Causa**: handleRoleChange navega sin skipNavigation
**Solución**: useRoleSync usa { skipNavigation: true }

### **Problema**: localStorage conflicto con perfil
**Causa**: Override manual en localStorage prevalece sobre perfil
**Solución**: useRoleSync verifica coherencia entre localStorage y perfil

## 📋 CHECKLIST DE VALIDACIÓN

- [ ] Test 1: Navegación manual actualiza Switch
- [ ] Test 2: Cambio en Profile sincroniza Switch
- [ ] Test 3: Persistencia tras recarga
- [ ] Test 4: Persistencia tras cierre de navegador
- [ ] No warnings en consola (development)
- [ ] React DevTools muestra estados coherentes
- [ ] UX fluida sin parpadeos
- [ ] Performance: sin re-renders excesivos

## 🛠️ COMANDO DE TESTING

```bash
# 1. Verificar build
npm run build

# 2. Iniciar modo desarrollo
npm run dev

# 3. Abrir React DevTools
# 4. Ejecutar casos de prueba
# 5. Verificar console logs
# 6. Validar estados en DevTools
```

---

*Ejecutar estos tests después de implementar las mejoras de sincronización.*
