#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
// Scan only the application sources to avoid node_modules and unrelated files
const SRC_ROOT = path.join(ROOT, 'sellsi', 'src');
const OUT_JSON = path.join(__dirname, 'refactor_candidates.json');
const EXTS = ['.js', '.jsx', '.ts', '.tsx'];
const IGNORE = ['node_modules', '.git', 'dist', 'build', 'coverage', 'scripts/refactor_candidates.json', 'scripts/detect_cycles_output.txt'];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.relative(ROOT, full);
    if (IGNORE.some(ig => rel.startsWith(ig))) continue;
    if (e.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function countMatches(re, text) {
  const m = text.match(re);
  return m ? m.length : 0;
}

function getGitChurn(filePath) {
  try {
    // Use git log to count commits touching the file
    const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
    const out = execSync(`git log --pretty=format:%H --follow -- "${rel}"`, { cwd: ROOT, stdio: ['pipe', 'pipe', 'ignore'] }).toString('utf8').trim();
    if (!out) return 0;
    return out.split('\n').length;
  } catch (e) {
    return 0;
  }
}

function analyzeFile(file) {
  const ext = path.extname(file).toLowerCase();
  if (!EXTS.includes(ext)) return null;
  let src;
  try { src = fs.readFileSync(file, 'utf8'); } catch (e) { return null; }
  const lines = src.split(/\r?\n/);
  const nonEmpty = lines.filter(l => l.trim() !== '').length;
  const importCount = countMatches(/^\s*(import\s.+from\s.+|const\s.+=\srequire\(.+\))/gm, src);
  const functionCount = countMatches(/\bfunction\b/g, src) + countMatches(/=>/g, src);
  const ifCount = countMatches(/\bif\s*\(|\belse\b/g, src);
  const todoCount = countMatches(/TODO|FIXME|@todo/gi, src);
  const exportCount = countMatches(/\bexport\b/g, src);
  const nestedBlocks = Math.max(0, (src.match(/\{/g)||[]).length - (src.match(/\}/g)||[]).length);
  const churn = getGitChurn(file);

  return {
    path: path.relative(ROOT, file).replace(/\\/g, '/'),
    loc: nonEmpty,
    importCount,
    functionCount,
    ifCount,
    todoCount,
    exportCount,
    nestedBlocks,
    churn
  };
}

function scoreMetrics(m) {
  // weights
  const w = {
    loc: 0.35,
    importCount: 0.08,
    functionCount: 0.18,
    ifCount: 0.09,
    todoCount: 0.1,
    churn: 0.2
  };
  const locScore = Math.min(m.loc / 800, 1);
  const importScore = Math.min(m.importCount / 30, 1);
  const funcScore = Math.min(m.functionCount / 100, 1);
  const ifScore = Math.min(m.ifCount / 200, 1);
  const todoScore = Math.min(m.todoCount / 10, 1);
  const churnScore = Math.min(m.churn / 200, 1);

  const total = (
    locScore * w.loc +
    importScore * w.importCount +
    funcScore * w.functionCount +
    ifScore * w.ifCount +
    todoScore * w.todoCount +
    churnScore * w.churn
  );
  return Math.round(total * 100);
}

function classify(score) {
  if (score >= 70) return 'critico';
  if (score >= 40) return 'alto';
  if (score >= 15) return 'medio';
  return 'bajo';
}

function main() {
  console.log('Scanning sellsi/src for refactor candidates...');
  if (!fs.existsSync(SRC_ROOT)) {
    console.error('Source directory not found:', SRC_ROOT);
    process.exit(1);
  }
  const files = walk(SRC_ROOT);
  const total = files.length;
  console.log(`Found ${total} files under sellsi/src to consider (will skip non-js/ts and tiny files)`);
  const results = [];
  const start = Date.now();
  const PROGRESS_EVERY = 25; // log progress every N files
  let processed = 0;
  for (let idx = 0; idx < files.length; idx++) {
    const f = files[idx];
    processed++;
    const analysis = analyzeFile(f);
    if (!analysis) {
      if (processed % PROGRESS_EVERY === 0) {
        const elapsed = (Date.now() - start) / 1000;
        const rate = (processed / elapsed).toFixed(2);
        const eta = processed > 0 ? ((total - processed) / (processed / elapsed)).toFixed(0) : '??';
        console.log(`Progress: ${processed}/${total} files processed — ${rate} files/s — ETA ${eta}s`);
      }
      continue;
    }
    // skip tiny files
    if (analysis.loc < 20) {
      if (processed % PROGRESS_EVERY === 0) {
        const elapsed = (Date.now() - start) / 1000;
        const rate = (processed / elapsed).toFixed(2);
        const eta = processed > 0 ? ((total - processed) / (processed / elapsed)).toFixed(0) : '??';
        console.log(`Progress: ${processed}/${total} files processed — ${rate} files/s — ETA ${eta}s`);
      }
      continue;
    }
    const score = scoreMetrics(analysis);
    results.push({ ...analysis, score, severity: classify(score) });

    if (processed % PROGRESS_EVERY === 0) {
      const elapsed = (Date.now() - start) / 1000;
      const rate = (processed / elapsed).toFixed(2);
      const eta = processed > 0 ? ((total - processed) / (processed / elapsed)).toFixed(0) : '??';
      console.log(`Progress: ${processed}/${total} files processed — ${rate} files/s — ETA ${eta}s`);
    }
  }
  // sort by score desc
  results.sort((a,b) => b.score - a.score);

  const grouped = { critico: [], alto: [], medio: [], bajo: [] };
  for (const r of results) grouped[r.severity].push(r);

  const out = { generatedAt: new Date().toISOString(), summary: { totalChecked: results.length }, grouped };
  fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote', OUT_JSON);
}

if (require.main === module) main();
module.exports = { analyzeFile, scoreMetrics, classify };
