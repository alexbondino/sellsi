/**
 * Playwright config específico para tests de memoria
 */

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/memory',
  timeout: 5 * 60 * 1000, // 5 minutos por test
  retries: 0,
  workers: 1, // Secuencial para medir memoria correctamente
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    video: 'on', // Grabar video para debugging
    screenshot: 'only-on-failure',
  },
  
  reporter: [
    ['list'],
    ['html', { outputFolder: 'tests/memory/report' }]
  ],
  
  // No arrancar server automáticamente - debes tener npm run dev corriendo
  webServer: undefined,
});
