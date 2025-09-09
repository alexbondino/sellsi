#!/usr/bin/env node
// scripts/find-same-name-files.js
// Finds files that share the same basename (filename) across the repo.
// Excludes index.* barrels by default.
// Usage: node scripts/find-same-name-files.js [--root ./] [--ext "js,jsx,ts,tsx"] [--exclude-index true|false] [--output ./scripts/same-names.json]

const path = require('path');
const fs = require('fs');
const glob = require('glob');

function parseArgs() {
  const args = {};
  const raw = process.argv.slice(2);
  for (let i = 0; i < raw.length; i++) {
    const a = raw[i];
    if (a.startsWith('--')) {
      const key = a.replace(/^--/, '');
      const next = raw[i+1];
      if (!next || next.startsWith('--')) { args[key] = true; }
      else { args[key] = next; i++; }
    } else if (a.startsWith('-')) {
      const key = a.replace(/^-/, '');
      const next = raw[i+1];
      args[key] = next && !next.startsWith('-') ? next : true;
      if (args[key] === true) continue;
      i++;
    }
  }
  return args;
}

const opts = parseArgs();
const root = path.resolve(opts.root || process.cwd());
const exts = (opts.ext || 'js,jsx,ts,tsx,cjs,mjs').split(',').map(s => s.trim().replace(/^\./, ''));
const excludeIndex = opts['exclude-index'] === undefined ? true : !(opts['exclude-index'] === 'false');
const outPath = opts.output || path.join(process.cwd(), 'scripts', 'same-name-report.json');

function findFiles() {
  const pattern = `**/*.{${exts.join(',')}}`;
  const ignore = ['**/node_modules/**','**/.git/**','**/dist/**','**/build/**','**/coverage/**','**/bundle/**'];
  return glob.sync(pattern, { cwd: root, absolute: true, ignore, nodir: true });
}

function shortName(abs) { return path.relative(root, abs).replace(/\\/g, '/'); }

console.log(`Scanning ${root} for extensions: ${exts.join(',')} (excludeIndex=${excludeIndex})`);
const files = findFiles();
console.log(`Found ${files.length} files.`);

const groups = new Map();
for (const f of files) {
  const base = path.basename(f); // includes extension
  if (excludeIndex) {
    const nameNoExt = base.split('.').slice(0, -1).join('.') || base;
    if (/^index$/i.test(nameNoExt)) continue;
  }
  const key = base.toLowerCase();
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push({ path: f, rel: shortName(f), size: fs.existsSync(f) ? fs.statSync(f).size : 0 });
}

// Filter only groups with >1
const duplicates = [];
for (const [name, items] of groups) {
  if (items.length > 1) {
    duplicates.push({ name, count: items.length, items });
  }
}

duplicates.sort((a,b) => b.count - a.count || a.name.localeCompare(b.name));

const out = { generatedAt: new Date().toISOString(), root, exts, excludeIndex, totalFiles: files.length, groupsFound: duplicates.length, duplicates };
try {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(`Wrote report to ${outPath} with ${duplicates.length} groups.`);
} catch (e) {
  console.error('Unable to write report:', e.message);
}

if (duplicates.length === 0) console.log('No same-name groups found.');
else {
  console.log('Top groups:');
  duplicates.slice(0, 30).forEach(g => {
    console.log(`${g.count}x ${g.name}`);
    g.items.slice(0,10).forEach(it => console.log(`  - ${it.rel} (${it.size} bytes)`));
  });
}

process.exit(0);
