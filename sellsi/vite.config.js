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
        // Restaurado manualChunks tras experimento
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'mui-core': ['@mui/material', '@emotion/react', '@emotion/styled'],
          'mui-icons': ['@mui/icons-material'],
          'mui-extras': ['@mui/lab', '@mui/x-charts'],
          router: ['react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          animation: ['framer-motion', 'react-confetti'],
          utils: ['lodash.debounce', 'react-hot-toast', 'zustand', 'immer'],
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
