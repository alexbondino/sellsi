#!/usr/bin/env node
/**
 * Audit básico de políticas de caché en staging.
 * Ajustar host si es necesario.
 */
import https from 'https';

const host = process.env.AUDIT_HOST || 'staging-sellsi.vercel.app';
const targets = [
  '/index.html',
  '/robots.txt',
  '/manifest.json',
  '/assets/js/', // list directory? we probe a sample below
];

// Sample hashed file names can be discovered dynamically if needed; here static fallback
const sampleHashed = [
  '/assets/js/react-vendor-placeholder.js',
  '/fonts/inter-400.woff2'
];

const EXPECT = [
  { test: /index\.html$/, policy: /no-cache/ },
  { test: /inter-400\.woff2$/, policy: /immutable/ },
  { test: /react-vendor-.*\.js$/, policy: /immutable/ },
  { test: /robots\.txt$/, policy: /max-age=86400/ }
];

function head(path) {
  return new Promise((resolve) => {
    const req = https.request({ method: 'HEAD', host, path }, (res) => {
      resolve({
        path,
        status: res.statusCode,
        cacheControl: res.headers['cache-control'] || '',
      });
    });
    req.on('error', (e) => resolve({ path, error: e.message }));
    req.end();
  });
}

(async () => {
  const results = [];
  for (const p of [...targets, ...sampleHashed]) {
    // eslint-disable-next-line no-await-in-loop
    const r = await head(p);
    results.push(r);
  }
  let failed = false;
  for (const r of results) {
    const rule = EXPECT.find(e => e.test.test(r.path));
    if (rule) {
      if (!rule.policy.test(r.cacheControl)) {
        failed = true;
        console.error('POLICY MISMATCH', r.path, 'got:', r.cacheControl, 'expected pattern:', rule.policy);
      } else {
        console.log('OK', r.path, r.cacheControl);
      }
    } else {
      console.log('INFO', r.path, r.cacheControl || '(no cache-control)');
    }
  }
  if (failed) {
    console.error('\nCache header audit FAILED');
    process.exit(1);
  } else {
    console.log('\nCache header audit PASSED');
  }
})();
