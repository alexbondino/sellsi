import { sentryVitePlugin } from '@sentry/vite-plugin';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: 'sellsi',
      project: 'sellsi',
    }),
  ],
  server: {
    port: 3000,
  },
  build: {
    // Configuración de chunking optimizada y estable
    chunkSizeWarningLimit: 1000,
    // Generar manifest para análisis comparativo de chunks
    manifest: true,

    // Minificación optimizada
    minify: 'terser',
    terserOptions: {
      compress: {
        // 🔍 DEBUG TEMPORAL: desactivar drop_console para diagnosticar bug de price tiers
        drop_console: false, // TODO: volver a true después del debug
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },

    rollupOptions: {
      output: {
        // ✅ OPTIMIZACIÓN: Chunking por flujo de usuario (buyer vs supplier)
        manualChunks(id) {
          // 1️⃣ VENDORS (compartidos por todos)
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@mui/material') || id.includes('@emotion')) {
              return 'mui-core';
            }
            if (id.includes('@mui/icons-material')) {
              return 'mui-icons';
            }
            if (id.includes('@mui/lab') || id.includes('@mui/x-charts')) {
              return 'mui-extras';
            }
            if (id.includes('react-router-dom')) {
              return 'router';
            }
            if (id.includes('@supabase/supabase-js')) {
              return 'supabase';
            }
            if (id.includes('framer-motion') || id.includes('react-confetti')) {
              return 'animation';
            }
            if (id.includes('lodash.debounce') || id.includes('react-hot-toast') || 
                id.includes('zustand') || id.includes('immer')) {
              return 'utils';
            }
          }

          // 2️⃣ SEPARACIÓN BUYER vs SUPPLIER (nunca se usan juntos)
          if (id.includes('workspaces/buyer') || id.includes('domains/buyer')) {
            // Marketplace tiene uso dual (público + buyer autenticado)
            if (id.includes('workspaces/marketplace')) {
              return 'marketplace-shared';
            }
            // Ofertas buyer menos frecuente
            if (id.includes('buyer/my-offers')) {
              return 'buyer-offers';
            }
            // Core buyer (marketplace autenticado, orders)
            return 'buyer-workspace';
          }

          if (id.includes('workspaces/supplier') || id.includes('domains/supplier')) {
            // Ofertas supplier menos frecuente
            if (id.includes('supplier/my-offers')) {
              return 'supplier-offers';
            }
            // Core supplier (home, products, orders)
            return 'supplier-workspace';
          }

          // 3️⃣ CHECKOUT FLOW (Cart + Payment siempre juntos)
          if (id.includes('domains/checkout') || id.includes('buyer/pages/BuyerCart')) {
            return 'checkout-flow';
          }

          // 4️⃣ PRODUCT DETAIL (separado, usado por anónimos y autenticados)
          if (id.includes('product/product-page-view')) {
            return 'product-detail';
          }

          // 5️⃣ PROFILE (separado, usado por ambos roles pero no frecuente)
          if (id.includes('domains/profile')) {
            return 'profile';
          }

          // 6️⃣ AUTH (solo al inicio)
          if (id.includes('workspaces/auth')) {
            return 'auth';
          }

          // 7️⃣ SHARED COMPONENTS - REMOVIDO
          // El chunk shared-ui era demasiado grande (928 KB) y creaba dependencias circulares
          // Dejamos que Vite maneje automáticamente los componentes compartidos
          // if (id.includes('shared/components') || id.includes('ui-components')) {
          //   return 'shared-ui';
          // }

          // Default: dejar que Vite decida (code splitting automático para shared)
        },

        // Optimizar nombres de archivos
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },

      // Tree shaking optimizado
      treeshake: {
        moduleSideEffects: false,
      },
    },

    // Sourcemaps (evalúa desactivar en prod pública)
    sourcemap: true,

    // Target moderno para mejor optimización
    target: 'es2020',
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
      'zustand',
    ],
    exclude: [
      '@react-pdf/renderer', // Excluir PDF renderer del pre-bundling
    ],
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
      '@shared-components': '/src/shared-components',
      '@': path.resolve(__dirname, './src'),
    },
  },
});
