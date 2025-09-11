#!/usr/bin/env node
/**
 * inline-critical-css.cjs
 * Inserta <style data-critical> en index.html post build y convierte link principal en patrón preload+media=print.
 * Preserva animación del logo (no se elimina) – spinner solicitado intacto.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '..', 'dist');
const htmlFile = path.join(distDir, 'index.html');
const criticalFile = path.join(distDir, 'critical.css');

if (!fs.existsSync(htmlFile)) {
  console.warn('[inline-critical] No index.html – saltando');
  process.exit(0);
}
if (!fs.existsSync(criticalFile)) {
  console.warn('[inline-critical] No critical.css – saltando');
  process.exit(0);
}

let html = fs.readFileSync(htmlFile, 'utf-8');
const criticalCss = fs.readFileSync(criticalFile, 'utf-8');

// Evitar inlining duplicado
if (html.includes('data-critical')) {
  console.log('[inline-critical] Ya inline – nada que hacer');
  process.exit(0);
}

// Insertar justo después de <head>
html = html.replace(/<head>(\s*)/i, (m, ws) => `<head>$1<style data-critical>${criticalCss}</style>`);

// Transformar primer <link rel="stylesheet"> si existe
html = html.replace(/<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/i, (tag, href) => {
  // Mantener fallback noscript
  return `<!-- critical-css: transformed -->\n<link rel="preload" as="style" href="${href}" />\n<link rel="stylesheet" href="${href}" media="print" onload="this.media='all'" />\n<noscript>${tag}</noscript>`;
});

fs.writeFileSync(htmlFile, html, 'utf-8');
console.log('[inline-critical] Inlined critical CSS y aplicado patrón diferido.');
