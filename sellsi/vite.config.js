import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar Material-UI en su propio chunk
          'mui-core': ['@mui/material', '@mui/system', '@emotion/react', '@emotion/styled'],
          
          // Separar iconos de MUI
          'mui-icons': ['@mui/icons-material'],
          
          // Separar React Router
          'router': ['react-router-dom'],
          
          // Separar librerías de animación
          'animation': ['framer-motion', 'canvas-confetti'],
          
          // Separar utilidades de terceros
          'utils': ['lodash.debounce', 'react-hot-toast'],
          
          // Separar stores/state management (solo archivos que existen)
          'stores': ['zustand']
        }
      }
    }
  }
})
