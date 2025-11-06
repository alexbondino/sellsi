import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno
  const env = loadEnv(mode, process.cwd(), '')
  
  // 🔒 VALIDACIÓN DE SEGURIDAD: Prevenir bypass en producción
  if (mode === 'production' || env.VITE_APP_ENV === 'production') {
    if (env.VITE_ALLOW_ADMIN_CREATION_WITHOUT_AUTH === 'true') {
      throw new Error(
        '🚨 SEGURIDAD CRÍTICA: VITE_ALLOW_ADMIN_CREATION_WITHOUT_AUTH=true detectado en producción.\n' +
        'Esta configuración permite acceso sin autenticación.\n' +
        'Cambia a false en .env o en Vercel Environment Variables.'
      )
    }
    
    console.log('✅ Validación de seguridad: VITE_ALLOW_ADMIN_CREATION_WITHOUT_AUTH está correctamente configurado')
  }
  
  return {
    plugins: [react()],
    build: {
      sourcemap: mode !== 'production',
      minify: mode === 'production' ? 'terser' : false,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'mui-vendor': ['@mui/material', '@mui/icons-material'],
          },
        },
      },
    },
    server: {
      port: 5174,
      strictPort: false,
    },
  }
})
