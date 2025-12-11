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
    chunkSizeWarningLimit: 1500, // Aumentar límite para evitar warning de vendor-misc
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
        // Chunking estratégico: solo vendors grandes, código app automático
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // MUI + Emotion - TODO junto (el más pesado ~500KB)
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'mui';
            }
            // React core (incluye react-is, scheduler, etc)
            if (id.includes('react/') || id.includes('react-dom/') || 
                id.includes('scheduler/')) {
              return 'react';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            // TODO lo demás junto para evitar circular deps
            return 'vendor';
          }
          // NO chunking manual del código de la app
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
      'react-router-dom',
      'zustand',
    ],
    exclude: [
      '@react-pdf/renderer',
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
