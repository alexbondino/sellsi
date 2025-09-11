#!/usr/bin/env node
/**
 * inline-critical-css.mjs
 * Inserta critical.css dentro de index.html y transforma primera hoja a diferida.
 * Conserva animación/spinner de logo (no tocamos sus reglas; si no se inlinéan cargan luego).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', 'dist');
const htmlPath = path.join(distDir, 'index.html');
const criticalPath = path.join(distDir, 'critical.css');

if (!fs.existsSync(htmlPath) || !fs.existsSync(criticalPath)) {
  console.warn('[inline-critical] Archivos faltantes, omitiendo.');
  process.exit(0);
}

let html = fs.readFileSync(htmlPath, 'utf-8');
if (html.includes('data-critical')) {
  console.log('[inline-critical] Ya aplicado.');
  process.exit(0);
}

const criticalCss = fs.readFileSync(criticalPath, 'utf-8');
html = html.replace(/<head>(\s*)/i, (m, ws) => `<head>${ws}<style data-critical>${criticalCss}</style>`);

// Transformar primera hoja de estilos estándar
html = html.replace(/<link([^>]+rel="stylesheet"[^>]*href="([^"]+)"[^>]*)>/i, (full, attrs, href) => {
  return `<!-- critical-css transformed -->\n<link rel="preload" as="style" href="${href}" />\n<link rel="stylesheet" href="${href}" media="print" onload="this.media='all'" />\n<noscript><link ${attrs}></noscript>`;
});

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log('[inline-critical] Inlined critical.css y diferido resto.');
