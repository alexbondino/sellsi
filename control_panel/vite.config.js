import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'

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
    plugins: [
      react(),
      // ⚡ Bundle analyzer - genera reporte visual del bundle
      visualizer({
        open: false, // No abrir automáticamente
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
      // ⚡ Compresión Brotli (mejor que gzip)
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 10240, // Solo archivos > 10KB
        deleteOriginFile: false,
      }),
      // ⚡ Compresión Gzip (fallback para navegadores viejos)
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 10240,
        deleteOriginFile: false,
      }),
    ],
    build: {
      sourcemap: mode !== 'production',
      minify: mode === 'production' ? 'terser' : false,
      // ⚡ OPTIMIZACIÓN: Configuración de terser para mejor compresión
      terserOptions: mode === 'production' ? {
        compress: {
          drop_console: true, // Eliminar console.logs en producción
          drop_debugger: true,
        },
      } : undefined,
      rollupOptions: {
        output: {
          // ✅ Code splitting conservador (evita dependencias circulares)
          manualChunks: {
            // Vendors básicos juntos (evita circular refs)
            'vendor': [
              'react',
              'react-dom',
              'react-router-dom'
            ],
            'mui-core': [
              '@mui/material',
              '@emotion/react',
              '@emotion/styled'
            ],
            'mui-icons': ['@mui/icons-material'],
            'mui-datagrid': ['@mui/x-data-grid'],
            'supabase': ['@supabase/supabase-js'],
            'react-query': ['@tanstack/react-query']
          },
          // ⚡ Nombres de chunks consistentes para mejor caching
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
      // ⚡ Aumentar límite de advertencia de chunks
      chunkSizeWarningLimit: 600,
    },
    server: {
      port: 5174,
      strictPort: false,
    },
  }
})
