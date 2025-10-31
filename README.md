# 🚀 SELLSI - MONOREPO

Este repositorio contiene DOS proyectos independientes en una estructura de monorepo:

## 📁 Estructura

```
C:\Users\klaus\OneDrive\Documentos\sellsi\
├── .git/                           ← Repositorio Git (compartido)
├── sellsi/                         ← Proyecto 1: Marketplace
│   ├── src/                        
│   ├── package.json
│   └── vite.config.js
├── control_panel/                  ← Proyecto 2: Admin Panel
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── DEPLOYMENT_GUIDE.md             ← Guía de deployment
└── README.md                       ← Este archivo
```

## 🌐 Dominios

| Proyecto | Carpeta | Dominio | Branch |
|----------|---------|---------|--------|
| Marketplace | `/sellsi` | `sellsi.cl` | main/staging |
| Admin Panel | `/control_panel` | `admin.sellsi.cl` | main/staging |

## 🎯 MIGRACIÓN DEL ADMIN PANEL

### Opción 1: Script Automático Completo (RECOMENDADO)

```powershell
cd C:\Users\klaus\OneDrive\Documentos\sellsi\control_panel
.\SETUP_COMPLETE.ps1
```

Este script hace TODO:
- ✅ Copia archivos del marketplace
- ✅ Instala todas las dependencias
- ✅ Crea App.jsx con rutas correctas
- ✅ Actualiza package.json
- ✅ Configura .env
- ✅ Listo para `npm run dev`

### Opción 2: Paso a Paso

```powershell
# 1. Copiar archivos
cd C:\Users\klaus\OneDrive\Documentos\sellsi\control_panel
.\MIGRATION_SCRIPT.ps1

# 2. Instalar dependencias
.\INSTALL_DEPENDENCIES.ps1

# 3. Actualizar App.jsx manualmente (ver guía)
```

## 🔧 Desarrollo Local

### Marketplace
```powershell
cd C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi
npm run dev
# → http://localhost:5173
```

### Admin Panel
```powershell
cd C:\Users\klaus\OneDrive\Documentos\sellsi\control_panel
npm run dev
# → http://localhost:5174
```

## 🚀 Deployment

Ver **DEPLOYMENT_GUIDE.md** para instrucciones detalladas.

### Resumen:
1. Ambos proyectos en el **mismo repositorio Git**
2. **Dos proyectos separados en Vercel**:
   - `sellsi-marketplace` (root: `/sellsi`)
   - `sellsi-admin-panel` (root: `/control_panel`)
3. Dominios custom configurados en Vercel
4. Mismas credenciales de Supabase

## 📊 Ventajas del Monorepo

- ✅ Un solo repositorio Git para ambos proyectos
- ✅ Deployments independientes
- ✅ Misma base de datos (Supabase)
- ✅ Branches compartidos (main/staging)
- ✅ Fácil de mantener
- ✅ CI/CD automático

## 🔗 Links Útiles

- [Guía de Deployment](./DEPLOYMENT_GUIDE.md)
- [Guía de Migración del Admin](./control_panel/migracion.md)
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Vercel](https://vercel.com/docs)

## 🆘 Troubleshooting

### El admin panel no encuentra módulos
```powershell
cd control_panel
npm install
```

### Conflictos de puerto
Si ambos proyectos usan el mismo puerto, Vite automáticamente usa el siguiente disponible.

### Errores de Supabase
Verificar que `.env` tiene las credenciales correctas en ambos proyectos.

---

**Última actualización**: 30 de septiembre de 2025
