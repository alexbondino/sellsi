#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRef = process.argv[2] || process.env.SUPABASE_PROJECT_REF;
if (!projectRef) {
  console.error('Usage: node scripts/deploy-supabase-changed.cjs <project-ref>');
  process.exit(1);
}

function safeExec(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).toString();
  } catch (e) {
    return '';
  }
}

// Try to fetch remote staging to have up-to-date ref (ignore errors)
try { execSync('git fetch origin staging', { stdio: 'ignore' }); } catch (_) {}

const diffOut = safeExec('git diff --name-only origin/staging...HEAD');
const files = diffOut.split(/\r?\n/).filter(Boolean);

const functionsDir = path.join(process.cwd(), 'supabase', 'functions');
const changedFuncs = new Set();
for (const f of files) {
  const m = f.match(/^supabase\/functions\/([^\/]+)\//);
  if (m) changedFuncs.add(m[1]);
}

let deployList = Array.from(changedFuncs);
if (deployList.length === 0) {
  // Fallback: deploy all functions found (excluding _shared and import_map.json)
  try {
    const all = fs.readdirSync(functionsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .filter(n => n !== '_shared');
    deployList = all;
    if (deployList.length === 0) {
      console.error('No functions found to deploy.');
      process.exit(1);
    }
    console.log('No changed functions detected; deploying all functions.');
  } catch (e) {
    console.error('Error reading supabase/functions directory:', e.message);
    process.exit(1);
  }
}

console.log('Functions to deploy:', deployList.join(', '));

const cmd = ['npx', 'supabase', 'functions', 'deploy', ...deployList, '--project-ref', projectRef].join(' ');
console.log('Running:', cmd);
try {
  execSync(cmd, { stdio: 'inherit' });
} catch (e) {
  console.error('Deploy command failed:', e.message);
  process.exit(1);
}
