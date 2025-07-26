import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), sentryVitePlugin({
    org: "sellsi",
    project: "sellsi"
  })],
  server: {
    port: 3000,
  },
  build: {
    // Configuración de chunking optimizada y estable
    chunkSizeWarningLimit: 1000,
    
    // Minificación optimizada
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
    
    rollupOptions: {
      output: {
        // Chunking mejorado pero estable
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom'],
          
          // Material-UI core
          'mui-core': ['@mui/material', '@emotion/react', '@emotion/styled'],
          
          // Material-UI iconos (separado por ser muy pesado)
          'mui-icons': ['@mui/icons-material'],
          
          // Material-UI extras
          'mui-extras': ['@mui/lab', '@mui/x-charts'],
          
          // Router
          'router': ['react-router-dom'],
          
          // Supabase
          'supabase': ['@supabase/supabase-js'],
          
          // Animaciones
          'animation': ['framer-motion', 'canvas-confetti', 'react-confetti'],
          
          // Charts - SEPARAR DE PDFs
          'charts': ['recharts'],
          
          // Utilidades pequeñas
          'utils': ['lodash.debounce', 'react-hot-toast', 'zustand', 'immer']
        },
        
        // Optimizar nombres de archivos
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      },
      
      // Tree shaking optimizado
      treeshake: {
        moduleSideEffects: false
      }
    },
    
    // Sin sourcemaps en producción
    sourcemap: true,
    
    // Target moderno para mejor optimización
    target: 'es2020'
  },
  
  // Configuración de resolución para compatibilidad del navegador
  define: {
    global: 'globalThis',
  },
  
  // Optimización de dependencias
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mui/material',
      'react-router-dom',
      'zustand'
    ],
    exclude: [
      '@react-pdf/renderer' // Excluir PDF renderer del pre-bundling
    ]
  },
  
  // Resolución de módulos para el navegador
  resolve: {
    alias: {
      // Polyfills para Node.js modules en el navegador
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      util: 'util',
      url: 'url',
      buffer: 'buffer',
    },
  }
})