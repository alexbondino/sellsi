// Script para analizar el tamaño del bundle
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core + DOM
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          
          // Material-UI core
          if (id.includes('@mui/material') || id.includes('@emotion')) {
            return 'mui-core';
          }
          
          // Material-UI iconos
          if (id.includes('@mui/icons-material')) {
            return 'mui-icons';
          }
          
          // Material-UI extras
          if (id.includes('@mui/x-charts') || id.includes('@mui/lab')) {
            return 'mui-extras';
          }
          
          // Supabase
          if (id.includes('@supabase')) {
            return 'supabase';
          }
          
          // PDFs y visualización
          if (id.includes('@react-pdf') || id.includes('recharts') || id.includes('canvas-confetti')) {
            return 'visual-libs';
          }
          
          // Animaciones
          if (id.includes('framer-motion') || id.includes('react-confetti')) {
            return 'animation';
          }
          
          // Router
          if (id.includes('react-router')) {
            return 'router';
          }
          
          // Utilidades
          if (id.includes('lodash') || id.includes('react-hot-toast') || id.includes('bcryptjs')) {
            return 'utils';
          }
          
          // State management
          if (id.includes('zustand') || id.includes('immer')) {
            return 'state';
          }
          
          // Vendors grandes
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})
