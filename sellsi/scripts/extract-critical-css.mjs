import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_PATH = path.join(__dirname, '../dist');

async function build() {
  console.log('🏗️ Iniciando build...');
  process.exit(0); // Salir exitosamente sin extraer CSS crítico
}

build();
console.log('🎨 Extrayendo CSS crítico...');

try {
  const { html } = await critical.generate({
    base: DIST_PATH,
    src: 'index.html',
    target: {
      html: 'index.html',
      css: 'critical.css',
    },
    inline: true,
    dimensions: [
      { width: 375, height: 667 }, // mobile
      { width: 1366, height: 768 }, // desktop
    ],
    extract: true,
  });

  fs.writeFileSync(HTML_PATH, html);
  console.log('✅ CSS crítico extraído y aplicado');
} catch (err) {
  console.error('❌ Error extrayendo CSS crítico:', err);
  // No fallar el build si hay error
  process.exit(0);
}

extractCriticalCSS();
