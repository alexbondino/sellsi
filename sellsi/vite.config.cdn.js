import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuración de producción con CDN para React
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    chunkSizeWarningLimit: 500,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        dead_code: true,
        unused: true,
      },
      mangle: {
        safari10: true,
      },
    },
    
    rollupOptions: {
      // Usar React desde CDN
      external: ['react', 'react-dom'],
      
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        },
        
        manualChunks: (id) => {
          // Material-UI core
          if (id.includes('@mui/material/') && !id.includes('icons')) {
            return 'mui-core';
          }
          
          // Material-UI iconos
          if (id.includes('@mui/icons-material')) {
            return 'mui-icons';
          }
          
          // Emotion
          if (id.includes('@emotion/')) {
            return 'emotion';
          }
          
          // Supabase
          if (id.includes('@supabase/')) {
            return 'supabase';
          }
          
          // PDF engine
          if (id.includes('@react-pdf/') || id.includes('pdfkit')) {
            return 'pdf-engine';
          }
          
          // Charts
          
          // Animation
          if (id.includes('framer-motion')) {
            return 'animation';
          }
          
          // Router
          if (id.includes('react-router')) {
            return 'router';
          }
          
          // Resto de librerías
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        },
        
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      },
      
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      }
    },
    
    sourcemap: false,
    target: 'es2020'
  },
  
  esbuild: {
    drop: ['console', 'debugger'],
  },
  
  optimizeDeps: {
    include: [
      '@mui/material',
      '@mui/icons-material',
      'react-router-dom',
      'zustand'
    ],
    exclude: [
      '@react-pdf/renderer'
    ]
  }
})
