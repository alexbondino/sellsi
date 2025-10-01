# ============================================================================
# 🚀 GUÍA DE DEPLOYMENT - MONOREPO SELLSI
# ============================================================================

## 📋 ESTRUCTURA DEL REPOSITORIO

Este repositorio contiene DOS proyectos independientes:

1. **Marketplace Principal** (`/sellsi`) → `sellsi.cl`
2. **Panel Administrativo** (`/control_panel`) → `admin.sellsi.cl`

Ambos comparten:
- ✅ Mismo repositorio Git
- ✅ Mismas branches (main, staging)
- ✅ Misma base de datos Supabase
- ✅ Mismas Edge Functions de Supabase

Pero tienen:
- ❌ Deployments separados
- ❌ Dominios diferentes
- ❌ Builds independientes

---

## 🚀 DEPLOYMENT EN VERCEL

### Proyecto 1: Marketplace (sellsi.cl)

**Configuración en Vercel Dashboard:**

```
Project Name: sellsi-marketplace
Root Directory: sellsi
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Framework: Vite
Domain: sellsi.cl
```

**Variables de entorno:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_BACKEND_URL`
- (todas las demás variables del marketplace)

---

### Proyecto 2: Admin Panel (admin.sellsi.cl)

**Configuración en Vercel Dashboard:**

```
Project Name: sellsi-admin-panel
Root Directory: control_panel
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Framework: Vite
Domain: admin.sellsi.cl
```

**Variables de entorno:**
- `VITE_SUPABASE_URL` (las mismas que el marketplace)
- `VITE_SUPABASE_ANON_KEY` (las mismas que el marketplace)
- `VITE_APP_ENV`
- `VITE_APP_NAME="Sellsi Admin Panel"`
- `VITE_ALLOW_ADMIN_CREATION_WITHOUT_AUTH=false` (en producción)

---

## 📝 PASOS PARA CONFIGURAR VERCEL

### 1. Importar el Repositorio

1. Ve a Vercel Dashboard
2. Click en "Add New..." → "Project"
3. Importa el repositorio: `alexbondino/sellsi`

### 2. Crear Primer Proyecto (Marketplace)

1. **Project Name**: `sellsi-marketplace`
2. **Framework Preset**: Vite
3. **Root Directory**: `sellsi` ← **IMPORTANTE**
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. Click "Deploy"

Después del deployment:
- Ve a Settings → Domains
- Añade dominio custom: `sellsi.cl`

### 3. Crear Segundo Proyecto (Admin Panel)

1. Vuelve a importar el **MISMO repositorio**
2. **Project Name**: `sellsi-admin-panel`
3. **Framework Preset**: Vite
4. **Root Directory**: `control_panel` ← **IMPORTANTE**
5. **Build Command**: `npm run build`
6. **Output Directory**: `dist`
7. Click "Deploy"

Después del deployment:
- Ve a Settings → Domains
- Añade dominio custom: `admin.sellsi.cl`

---

## 🔄 BRANCHES Y DEPLOYMENTS

### Branch `main` (Producción)

```
sellsi-marketplace → sellsi.cl
sellsi-admin-panel → admin.sellsi.cl
```

### Branch `staging` (Testing)

```
sellsi-marketplace → sellsi-staging.vercel.app
sellsi-admin-panel → sellsi-admin-staging.vercel.app
```

**Configurar en Vercel:**
- Settings → Git → Production Branch: `main`
- Settings → Git → Preview Branches: `staging`

---

## 🌐 CONFIGURACIÓN DNS

En tu proveedor de DNS (GoDaddy, Cloudflare, etc.):

### Para sellsi.cl (ya configurado)
```
Tipo: A / CNAME
Nombre: @
Valor: (IP de Vercel o CNAME)
```

### Para admin.sellsi.cl (nuevo)
```
Tipo: CNAME
Nombre: admin
Valor: cname.vercel-dns.com
TTL: 3600
```

Después de configurar, añadir el dominio en Vercel Dashboard del proyecto admin.

---

## ✅ VENTAJAS DE ESTA ARQUITECTURA

1. **Un solo repositorio Git** - Fácil de mantener
2. **Deployments independientes** - El admin no afecta al marketplace
3. **Misma base de datos** - No hay duplicación de datos
4. **CI/CD automático** - Push a main/staging → deploy automático
5. **Rollbacks independientes** - Puedes hacer rollback del admin sin tocar el marketplace

---

## 🔧 COMANDOS ÚTILES

### Desarrollo Local

```powershell
# Marketplace
cd sellsi
npm run dev
# → http://localhost:5173

# Admin Panel
cd control_panel
npm run dev
# → http://localhost:5174 (puerto diferente automático)
```

### Build Local

```powershell
# Marketplace
cd sellsi
npm run build

# Admin Panel
cd control_panel
npm run build
```

### Verificar ambos proyectos

```powershell
# Desde la raíz del repo
cd C:\Users\klaus\OneDrive\Documentos\sellsi

# Instalar dependencias de ambos
cd sellsi && npm install && cd ..
cd control_panel && npm install && cd ..

# Verificar builds
cd sellsi && npm run build && cd ..
cd control_panel && npm run build && cd ..
```

---

## 📊 RESUMEN

| Aspecto | Marketplace | Admin Panel |
|---------|-------------|-------------|
| Carpeta | `/sellsi` | `/control_panel` |
| Dominio | `sellsi.cl` | `admin.sellsi.cl` |
| Puerto dev | 5173 | 5174 |
| Vercel Project | sellsi-marketplace | sellsi-admin-panel |
| Supabase | ✅ Compartido | ✅ Compartido |
| Git Repo | ✅ Mismo | ✅ Mismo |
| Deployment | ❌ Separado | ❌ Separado |

---

**Fecha de creación**: 30 de septiembre de 2025  
**Autor**: GitHub Copilot
