#!/usr/bin/env node
/**
 * extract-critical-css.cjs
 * Fase 1: SSR simulado para extraer estilos críticos de la ruta /buyer/marketplace
 * Nota: Implementación mínima segura; evita romper build si falla → fallback silencioso.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const distDir = path.resolve(__dirname, '..', 'dist');
  const outFile = path.join(distDir, 'critical.css');

  // Lazy imports para no penalizar build si faltan dependencias en esta fase inicial
  let React, ReactDOMServer, createEmotionServer, createCache, App;
  try {
    React = (await import('react')).default;
    ReactDOMServer = await import('react-dom/server');
    createEmotionServer = (await import('@emotion/server/create-instance')).default;
    createCache = (await import('@emotion/cache')).default;
  } catch (e) {
    console.warn('[critical-css] Dependencias SSR no disponibles, saltando extracción.');
    return;
  }

  // Intentar cargar App
  let AppModule;
  const appEntryCandidates = [
    '../src/App.jsx',
    '../src/App.tsx'
  ];
  for (const candidate of appEntryCandidates) {
    try {
      AppModule = await import(candidate);
      break;
    } catch (_) { /* continue */ }
  }
  if (!AppModule) {
    console.warn('[critical-css] No se pudo importar App.jsx, abortando extracción.');
    return;
  }
  App = AppModule.default || AppModule.App || AppModule;

  // Crear cache Emotion aislado
  const cache = createCache({ key: 'css' });
  const { extractCriticalToChunks, constructStyleTagsFromChunks } = createEmotionServer(cache);

  // Mock de router simple (sin navegación) — se puede expandir
  function MockProviders({ children }) {
    return React.createElement(React.Fragment, null, children);
  }

  // Render estático
  let html;
  try {
    html = ReactDOMServer.renderToString(
      React.createElement(MockProviders, null, React.createElement(App, { __critical: true }))
    );
  } catch (e) {
    console.warn('[critical-css] Error durante render SSR simulado:', e.message);
    return;
  }

  const chunks = extractCriticalToChunks(html);
  const fullStyles = constructStyleTagsFromChunks(chunks);

  // Baseline: extraer solo contenido entre <style data-emotion=...>...</style>
  const rawCss = [];
  fullStyles.replace(/<style[^>]*>([\s\S]*?)<\/style>/g, (_, css) => {
    rawCss.push(css);
    return '';
  });
  let combined = rawCss.join('\n');

  // Poda heurística ligera (Fase 1): mantener reglas claves
  const keepRegex = /(html|body|#root|\.Mui|product|grid|img|button|h1|h2|h3|h4|h5|h6)/i;
  combined = combined
    .split(/}\n?/)
    .filter(block => keepRegex.test(block))
    .map(b => b.trim())
    .filter(Boolean)
    .map(b => b.endsWith('}') ? b : b + '}')
    .join('\n');

  // Limpiar comentarios
  combined = combined.replace(/\/\*[^*]*\*+([^/*][^*]*\*+)*\//g, '');

  // Safe guard tamaño
  const bytes = Buffer.byteLength(combined, 'utf-8');
  if (bytes > 50_000) {
    console.warn(`[critical-css] Tamaño crítico demasiado grande (${bytes} bytes) – abortando inline.`);
    return;
  }

  fs.writeFileSync(outFile, combined, 'utf-8');
  console.log(`[critical-css] Generado critical.css (${(bytes/1024).toFixed(2)} KB)`);
}

run().catch(e => {
  console.error('[critical-css] FATAL', e);
  process.exit(0); // No romper build
});
