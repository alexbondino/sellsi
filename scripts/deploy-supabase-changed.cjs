#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRef = process.argv[2] || process.env.SUPABASE_PROJECT_REF;
if (!projectRef) {
  console.error('Usage: node scripts/deploy-supabase-changed.cjs <project-ref>');
  process.exit(1);
}

// ============================================================================
// Funciones que deben ser PÚBLICAS (sin JWT) - webhooks externos, etc.
// ============================================================================
const PUBLIC_FUNCTIONS = new Set([
  'create-payment-flow',
  'process-flow-webhook',
  'flow-return',
  'create-khipu-payment',
  'process-khipu-webhook',
  'verify-khipu-payment',
  'preview-invoice',
]);

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

// Separar funciones públicas de las que requieren JWT
const publicFuncs = deployList.filter(f => PUBLIC_FUNCTIONS.has(f));
const privateFuncs = deployList.filter(f => !PUBLIC_FUNCTIONS.has(f));

// Deploy funciones privadas (con JWT)
if (privateFuncs.length > 0) {
  const cmdPrivate = ['npx', 'supabase', 'functions', 'deploy', ...privateFuncs, '--project-ref', projectRef].join(' ');
  console.log('\n🔒 Deploying PRIVATE functions (with JWT):', privateFuncs.join(', '));
  console.log('Running:', cmdPrivate);
  try {
    execSync(cmdPrivate, { stdio: 'inherit' });
  } catch (e) {
    console.error('Deploy command failed for private functions:', e.message);
    process.exit(1);
  }
}

// Deploy funciones públicas (sin JWT) - webhooks, etc.
if (publicFuncs.length > 0) {
  const cmdPublic = ['npx', 'supabase', 'functions', 'deploy', ...publicFuncs, '--project-ref', projectRef, '--no-verify-jwt'].join(' ');
  console.log('\n🌐 Deploying PUBLIC functions (no JWT):', publicFuncs.join(', '));
  console.log('Running:', cmdPublic);
  try {
    execSync(cmdPublic, { stdio: 'inherit' });
  } catch (e) {
    console.error('Deploy command failed for public functions:', e.message);
    process.exit(1);
  }
}

console.log('\n✅ All functions deployed successfully!');
