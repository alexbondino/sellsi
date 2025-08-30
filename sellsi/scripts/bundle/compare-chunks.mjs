#!/usr/bin/env node
/**
 * compare-chunks.mjs
 * Experimento controlado para evaluar impacto de manualChunks.
 *
 * Uso básico:
 *   node scripts/bundle/compare-chunks.mjs collect --label baseline
 *   (modificar vite.config.js removiendo manualChunks)
 *   node scripts/bundle/compare-chunks.mjs collect --label no-manual
 *   (opcional: config refinada)
 *   node scripts/bundle/compare-chunks.mjs collect --label refined
 *
 * Comparar:
 *   node scripts/bundle/compare-chunks.mjs diff baseline no-manual
 *   node scripts/bundle/compare-chunks.mjs diff baseline refined
 *
 * Los resultados JSON se guardan en ./bundle-analysis/<label>.json
 */

import fs from 'fs';
import path from 'path';
import { gzipSync } from 'zlib';
import crypto from 'crypto';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const MANIFEST = path.join(DIST, '.vite', 'manifest.json');
const OUT_DIR = path.join(ROOT, 'bundle-analysis');

function fail(msg) {
  console.error('\u274c  ' + msg);
  process.exit(1);
}

function ok(msg) {
  console.log('\u2705 ' + msg);
}

function readManifest() {
  if (!fs.existsSync(MANIFEST)) fail('No se encontró manifest en ' + MANIFEST + ' (¿ejecutaste build?)');
  return JSON.parse(fs.readFileSync(MANIFEST, 'utf-8'));
}

function listFilesRecursive(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) out.push(...listFilesRecursive(full));
    else out.push(full);
  }
  return out;
}

function collectInitialChunks(manifest) {
  // Heurística: tomar el entry principal (con isEntry true y que contenga main o index) y recorrer imports estáticos.
  const entries = Object.values(manifest).filter(m => m.isEntry);
  if (!entries.length) fail('Manifest sin entries');
  const primary = entries.find(e => /main|index/.test(e.src)) || entries[0];

  const visited = new Set();
  const queue = [primary.file];
  const files = new Set();

  while (queue.length) {
    const f = queue.pop();
    if (visited.has(f)) continue;
    visited.add(f);
    files.add(f);
    const meta = Object.values(manifest).find(m => m.file === f);
    if (!meta) continue;
    // imports = relaciones estáticas; dynamicImports quedan fuera (lazy)
    (meta.imports || []).forEach(i => {
      const child = manifest[i]?.file;
      if (child) queue.push(child);
    });
  }
  return { files: [...files], primary: primary.file };
}

function fileStat(fullPath) {
  const raw = fs.readFileSync(fullPath);
  const gzip = gzipSync(raw);
  return {
    bytes: raw.length,
    gzip: gzip.length,
    hash: crypto.createHash('sha1').update(raw).digest('hex').slice(0, 10)
  };
}

function human(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kB';
  return (n / 1024 / 1024).toFixed(2) + ' MB';
}

function collect(label) {
  if (!fs.existsSync(DIST)) fail('Dist no existe. Ejecuta "npm run build" antes.');
  const manifest = readManifest();
  const { files, primary } = collectInitialChunks(manifest);

  const stats = [];
  for (const rel of files) {
    const full = path.join(DIST, rel);
    if (!fs.existsSync(full)) continue;
    const s = fileStat(full);
    stats.push({ file: rel, ...s });
  }
  stats.sort((a, b) => b.gzip - a.gzip);
  const totalGzip = stats.reduce((a, x) => a + x.gzip, 0);
  const largest = stats[0];
  const entropy = largest.gzip / totalGzip; // proporción del chunk mayor

  const allDistFiles = listFilesRecursive(DIST).filter(f => /\.js$/.test(f));
  const changedMap = Object.fromEntries(stats.map(s => [s.file, s.hash]));

  const result = {
    label,
    timestamp: new Date().toISOString(),
    primaryEntry: primary,
    initialChunks: stats,
    metrics: {
      initialChunkCount: stats.length,
      totalInitialGzip: totalGzip,
      largestChunkGzip: largest.gzip,
      largestChunkPercent: +(entropy * 100).toFixed(2),
      avgChunkGzip: +(totalGzip / stats.length).toFixed(2)
    },
    hashMap: changedMap,
    distFileCount: allDistFiles.length
  };

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);
  const outFile = path.join(OUT_DIR, `${label}.json`);
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
  ok(`Guardado ${outFile}`);
  console.log('Resumen métricas:');
  console.table([{
    label,
    chunks: result.metrics.initialChunkCount,
    totalGzip: human(result.metrics.totalInitialGzip),
    largestGzip: human(result.metrics.largestChunkGzip),
    largestPct: result.metrics.largestChunkPercent + '%',
    avgGzip: human(result.metrics.avgChunkGzip)
  }]);
}

function diff(aLabel, bLabel) {
  const aPath = path.join(OUT_DIR, `${aLabel}.json`);
  const bPath = path.join(OUT_DIR, `${bLabel}.json`);
  if (!fs.existsSync(aPath) || !fs.existsSync(bPath)) fail('Faltan archivos para diff');
  const A = JSON.parse(fs.readFileSync(aPath, 'utf-8'));
  const B = JSON.parse(fs.readFileSync(bPath, 'utf-8'));

  function pct(delta, base) {
    return (delta === 0 || base === 0) ? 0 : +(delta / base * 100).toFixed(2);
  }

  const metrics = [
    ['totalInitialGzip', A.metrics.totalInitialGzip, B.metrics.totalInitialGzip],
    ['largestChunkGzip', A.metrics.largestChunkGzip, B.metrics.largestChunkGzip],
    ['initialChunkCount', A.metrics.initialChunkCount, B.metrics.initialChunkCount],
    ['largestChunkPercent', A.metrics.largestChunkPercent, B.metrics.largestChunkPercent]
  ];

  console.log(`\nDiff métricas ${aLabel} -> ${bLabel}`);
  console.table(metrics.map(([k, av, bv]) => ({
    metric: k,
    from: av,
    to: bv,
    delta: bv - av,
    deltaPct: pct(bv - av, av) + '%'
  })));

  // Hash churn: cuántos initial chunks cambian
  const aHashes = A.hashMap;
  const bHashes = B.hashMap;
  let stable = 0, changed = 0;
  for (const file of Object.keys(aHashes)) {
    if (bHashes[file] && bHashes[file] === aHashes[file]) stable++; else changed++;
  }
  console.log(`\nHash churn initial chunks: ${changed} cambiados / ${stable} estables (total considerados: ${stable + changed})`);

  // Top movers (chunks cuyo tamaño gzip varió más) — unir por nombre
  const sizeMapA = Object.fromEntries(A.initialChunks.map(c => [c.file, c.gzip]));
  const sizeMapB = Object.fromEntries(B.initialChunks.map(c => [c.file, c.gzip]));
  const union = new Set([...Object.keys(sizeMapA), ...Object.keys(sizeMapB)]);
  const movers = [];
  union.forEach(f => {
    const ag = sizeMapA[f] || 0; const bg = sizeMapB[f] || 0; const d = bg - ag;
    if (Math.abs(d) > 0) movers.push({ file: f, from: ag, to: bg, delta: d, deltaPct: pct(d, ag) + '%' });
  });
  movers.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
  console.log('\nTop cambios por chunk (gzip bytes):');
  console.table(movers.slice(0, 10));
}

function help() {
  console.log(`Uso:
  collect --label <nombre>   Recolecta métricas del build actual
  diff <labelA> <labelB>      Compara métricas entre dos capturas
  `);
}

const [cmd, ...rest] = process.argv.slice(2);

switch (cmd) {
  case 'collect': {
    const labelIndex = rest.indexOf('--label');
    if (labelIndex === -1) help();
    else {
      const label = rest[labelIndex + 1];
      if (!label) fail('Falta label');
      collect(label);
    }
    break;
  }
  case 'diff': {
    if (rest.length < 2) help();
    else diff(rest[0], rest[1]);
    break;
  }
  default:
    help();
}
