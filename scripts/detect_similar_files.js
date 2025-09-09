#!/usr/bin/env node
// detect_similar_files.js
// Scans the repository for nearly-duplicate source files using token shingles + Jaccard similarity.
// Usage: node scripts/detect_similar_files.js [--threshold 0.9] [--exclude-index true|false] [--output ./similar.json]

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function parseArgs() {
  const args = {};
  const raw = process.argv.slice(2);
  for (let i = 0; i < raw.length; i++) {
    const a = raw[i];
    if (a.startsWith('--')) {
      const key = a.replace(/^--/, '');
      const next = raw[i + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    } else if (a.startsWith('-')) {
      // simple short flags
      const key = a.replace(/^-/, '');
      const next = raw[i + 1];
      args[key] = next && !next.startsWith('-') ? next : true;
      if (args[key] === true) continue;
      i++;
    }
  }
  return args;
}

const opts = parseArgs();
const threshold = parseFloat(opts.threshold || opts.t || '0.5');
const excludeIndex = opts['exclude-index'] === undefined ? true : !(opts['exclude-index'] === 'false');
const outPath = opts.output || './similar-files-report.json';
const exts = (opts.ext || '*.js,*.jsx,*.ts,*.tsx,*.cjs,*.mjs').split(',').map(s => s.replace(/^\*\./, '').trim());
const root = process.cwd();

function findFiles() {
  const pattern = `**/*.{${exts.join(',')}}`;
  const ignore = ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/bundle/**', '**/coverage/**'];
  return glob.sync(pattern, { cwd: root, absolute: true, ignore, nodir: true });
}

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (e) {
    return null;
  }
}

function stripComments(code) {
  // Remove JS/TS style comments (simple heuristics)
  return code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//gm, '');
}

function isBinaryLike(s) {
  if (!s) return true;
  // contains null byte or very high proportion of non-printable
  if (s.indexOf('\0') >= 0) return true;
  const len = Math.min(s.length, 5000);
  let nonPrintable = 0;
  for (let i = 0; i < len; i++) {
    const c = s.charCodeAt(i);
    if (c === 9 || c === 10 || c === 13) continue;
    if (c < 32 || c > 126) nonPrintable++;
  }
  return nonPrintable / Math.max(1, len) > 0.3;
}

function tokenize(code) {
  // basic tokenization: words only, lowercased
  const words = (code.match(/\w+/g) || []).map(w => w.toLowerCase());
  return words;
}

function buildShingles(tokens, k = 5) {
  const set = new Set();
  if (tokens.length <= 0) return set;
  if (tokens.length < k) k = Math.max(1, Math.floor(tokens.length / 2));
  for (let i = 0; i <= tokens.length - k; i++) {
    set.add(tokens.slice(i, i + k).join(' '));
  }
  return set;
}

function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 1;
  const [small, big] = a.size < b.size ? [a, b] : [b, a];
  let inter = 0;
  for (const x of small) if (big.has(x)) inter++;
  const uni = a.size + b.size - inter;
  return uni === 0 ? 0 : inter / uni;
}

function shortName(abs) {
  return path.relative(root, abs).replace(/\\/g, '/');
}

console.log(`Scanning for files under ${root} (extensions: ${exts.join(',')})...`);
const files = findFiles()
  .filter(f => {
    const bn = path.basename(f);
    if (excludeIndex && bn === 'index.ts') return false;
    return true;
  })
  .filter(Boolean);

console.log(`Found ${files.length} candidate files.`);

const docs = [];
for (const file of files) {
  const rel = shortName(file);
  const raw = readText(file);
  if (raw === null) {
    console.warn('skip (no read):', rel);
    continue;
  }
  if (isBinaryLike(raw)) {
    console.warn('skip (binary-like):', rel);
    continue;
  }
  const code = stripComments(raw);
  if (code.trim().length === 0) {
    console.warn('skip (empty after strip):', rel);
    continue;
  }
  const tokens = tokenize(code);
  const shingles = buildShingles(tokens, 5);
  docs.push({ path: file, rel, size: raw.length, tokens: tokens.length, shingles });
}

console.log(`Prepared ${docs.length} processed files for similarity check.`);

const results = [];
for (let i = 0; i < docs.length; i++) {
  for (let j = i + 1; j < docs.length; j++) {
    const A = docs[i];
    const B = docs[j];
    if (A.shingles.size === 0 || B.shingles.size === 0) continue;
    const sim = jaccard(A.shingles, B.shingles);
    if (sim >= threshold) {
      results.push({ a: A.rel, b: B.rel, similarity: Number(sim.toFixed(4)), sizeA: A.size, sizeB: B.size, tokensA: A.tokens, tokensB: B.tokens });
    }
  }
}

results.sort((x, y) => y.similarity - x.similarity);

const out = { generatedAt: new Date().toISOString(), root: root, threshold, excludeIndex, results };
try {
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(`Wrote report to ${outPath} (${results.length} pairs >= ${threshold}).`);
} catch (e) {
  console.error('Unable to write output:', e.message);
}

if (results.length === 0) console.log('No similar files found with the configured threshold.');
else {
  console.log('Top matches:');
  results.slice(0, 20).forEach(r => console.log(`${(r.similarity * 100).toFixed(2)}%  ${r.a}  <->  ${r.b}`));
}

process.exit(0);
