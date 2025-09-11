#!/usr/bin/env node
/**
 * extract-critical-css.mjs
 * Fase 1: SSR simulado para extraer estilos críticos mínimos.
 * No rompe el build si falla. Compatible con App React.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import React from 'react';
import * as ReactDOMServer from 'react-dom/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importApp() {
  const candidates = ['../src/App.jsx', '../src/App.tsx', '../src/app/App.jsx', '../src/app/App.tsx'];
  for (const c of candidates) {
    try {
      const mod = await import(c);
      return mod.default || mod.App || mod;
    } catch { /* continue */ }
  }
  return null;
}

async function run() {
  const distDir = path.resolve(__dirname, '..', 'dist');
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
  const outFile = path.join(distDir, 'critical.css');

  const App = await importApp();
  if (!App) {
    console.warn('[critical-css] App no encontrada – usando fallback estático.');
    // Fallback: construir critical.css a partir de index.css + App.css filtrando reglas esenciales
    const projectRoot = path.resolve(__dirname, '..');
    const idxPath = path.join(projectRoot, 'src', 'index.css');
    const appCssPath = path.join(projectRoot, 'src', 'App.css');
    let base = '';
    if (fs.existsSync(idxPath)) base += fs.readFileSync(idxPath, 'utf-8');
    if (fs.existsSync(appCssPath)) base += '\n' + fs.readFileSync(appCssPath, 'utf-8');
    // Seleccionar sólo bloques relevantes
    const keepBlocks = [];
    const blockRegex = /(@keyframes[^}]+}\s*|[^{}]+{[^}]*})/g;
    const allow = /(html|body|#root|:root|\.logo|@keyframes logo-spin|button|a|\.product-card__img-wrapper|aspect-ratio)/;
    let m;
    while ((m = blockRegex.exec(base)) !== null) {
      const blk = m[0];
      if (allow.test(blk)) keepBlocks.push(blk);
    }
    // Incluir nota spinner logo
    keepBlocks.unshift('/* Fallback critical CSS (incluye spinner logo) */');
    const fallbackCss = keepBlocks.join('\n');
    const outFile = path.join(path.resolve(__dirname, '..', 'dist'), 'critical.css');
    fs.writeFileSync(outFile, fallbackCss, 'utf-8');
    console.log('[critical-css] Fallback critical.css generado');
    return;
  }

  let createEmotionServer, createCache;
  try {
    const esmServer = await import('@emotion/server/create-instance');
    createEmotionServer = esmServer.default;
    const esmCache = await import('@emotion/cache');
    createCache = esmCache.default;
  } catch (e) {
    console.warn('[critical-css] @emotion/server no instalado, omitiendo extracción (instala @emotion/server para habilitar).');
    return;
  }
  const cache = createCache({ key: 'css' });
  const { extractCriticalToChunks, constructStyleTagsFromChunks } = createEmotionServer(cache);

  function Providers({ children }) { return React.createElement(React.Fragment, null, children); }

  let html;
  try {
    html = ReactDOMServer.renderToString(React.createElement(Providers, null, React.createElement(App, { __critical: true })));
  } catch (e) {
    console.warn('[critical-css] Error render SSR simulado:', e.message);
    return;
  }

  const chunks = extractCriticalToChunks(html);
  const styleTags = constructStyleTagsFromChunks(chunks);
  const rawCss = [];
  styleTags.replace(/<style[^>]*>([\s\S]*?)<\/style>/g, (_, css) => { rawCss.push(css); return ''; });
  let combined = rawCss.join('\n');

  // Heurística simple de poda (Fase 1)
  const keepRegex = /(html|body|#root|Mui|product|grid|img|button|h1|h2|h3|h4|h5|h6|\.logo)/i; // incluye .logo para spinner
  combined = combined
    .split(/}\n?/)
    .filter(b => keepRegex.test(b))
    .map(b => b.trim())
    .filter(Boolean)
    .map(b => b.endsWith('}') ? b : b + '}')
    .join('\n');

  combined = combined.replace(/\/\*[^*]*\*+([^/*][^*]*\*+)*\//g, '');

  const bytes = Buffer.byteLength(combined, 'utf-8');
  if (bytes === 0) {
    console.warn('[critical-css] Resultado vacío, omitiendo.');
    return;
  }
  if (bytes > 60_000) {
    console.warn('[critical-css] Excesivo (>60KB), omitiendo inline.');
    return;
  }

  fs.writeFileSync(outFile, combined, 'utf-8');
  console.log(`[critical-css] Generado ${outFile} ${(bytes/1024).toFixed(2)} KB`);
}

run().catch(e => { console.warn('[critical-css] fallo silencioso', e.message); });
