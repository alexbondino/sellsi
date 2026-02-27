import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { exec as execCallback } from 'child_process';

const execAsync = promisify(execCallback);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');

const PREVIEW_HOST = process.env.PRERENDER_PREVIEW_HOST || '127.0.0.1';
const PREVIEW_PORT = Number(process.env.PRERENDER_PREVIEW_PORT || 4173);
const PREVIEW_BASE = `http://${PREVIEW_HOST}:${PREVIEW_PORT}`;

const STATIC_ROUTES = ['/', '/faq'];

const PRODUCT_LIMIT = Number(process.env.PRERENDER_PRODUCTS_LIMIT || 500);
const CATALOG_LIMIT = Number(process.env.PRERENDER_CATALOGS_LIMIT || 500);
const PRERENDER_STRICT = process.env.PRERENDER_STRICT !== 'false';
const PRERENDER_RETRIES = Number(process.env.PRERENDER_RETRIES || 2);
const PRERENDER_CONCURRENCY = Math.max(
  1,
  Number(process.env.PRERENDER_CONCURRENCY || 6)
);
const CATALOG_VALIDATION_CONCURRENCY = Math.max(
  1,
  Number(process.env.PRERENDER_CATALOG_VALIDATION_CONCURRENCY || 10)
);
const DYNAMIC_WAIT_TIMEOUT_MS = Number(
  process.env.PRERENDER_DYNAMIC_WAIT_TIMEOUT_MS || 25000
);
const STATIC_SETTLE_MS = Number(process.env.PRERENDER_STATIC_SETTLE_MS || 150);
const DYNAMIC_SETTLE_MS = Number(process.env.PRERENDER_DYNAMIC_SETTLE_MS || 400);

function loadEnvFiles() {
  const candidates = [
    path.join(PROJECT_ROOT, '.env'),
    path.join(PROJECT_ROOT, '.env.local'),
    path.join(PROJECT_ROOT, '.env.production'),
    path.join(PROJECT_ROOT, '.env.production.local'),
  ];

  candidates.forEach(envPath => {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: true });
    }
  });
}

function toProductSlug(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function toSupplierSlug(name, fallback) {
  const source = (name || fallback || 'proveedor').toString();
  return source.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function runWithConcurrency(items, concurrency, worker) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const safeConcurrency = Math.max(1, Math.min(concurrency, items.length));
  const results = new Array(items.length);
  let currentIndex = 0;

  const workers = Array.from({ length: safeConcurrency }, () =>
    (async () => {
      while (true) {
        const idx = currentIndex;
        currentIndex += 1;

        if (idx >= items.length) break;

        results[idx] = await worker(items[idx], idx);
      }
    })()
  );

  await Promise.all(workers);
  return results;
}

async function getDynamicRoutes() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[prerender] Sin credenciales Supabase, solo se prerenderizan rutas estáticas.');
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: products = [], error: productsError } = await supabase
    .from('products')
    .select(
      'productid, productnm, supplier_id, users!products_supplier_id_fkey(user_id, user_nm, verified)'
    )
    .eq('is_active', true)
    .limit(PRODUCT_LIMIT);

  if (productsError) {
    console.warn('[prerender] Error cargando productos:', productsError.message);
  }

  const productRoutes = products
    .filter(item => item?.productid)
    .map(item => {
      const productId = String(item.productid || '').trim();
      if (!productId) return null;

      const slug = toProductSlug(item.productnm || 'producto');
      const base = `/marketplace/product/${productId}`;
      return slug ? `${base}/${slug}` : base;
    })
    .filter(Boolean);

  const catalogCandidates = products
    .map(item => {
      const user = item?.users || null;
      if (!user || user.verified !== true) return null;
      const supplierUserId = String(
        user?.user_id || item?.supplier_id || ''
      ).trim();
      if (!supplierUserId) return null;
      const shortId = supplierUserId.slice(0, 4) || supplierUserId;
      const supplierSlug = toSupplierSlug(
        user?.user_nm || 'proveedor',
        `proveedor${shortId}`
      );
      return {
        shortId,
        supplierSlug,
      };
    })
    .filter(Boolean);

  const uniqueCatalogCandidates = [
    ...new Map(
      catalogCandidates.map(item => [`${item.supplierSlug}/${item.shortId}`, item])
    ).values(),
  ];

  const catalogCandidatesToValidate = uniqueCatalogCandidates.slice(0, CATALOG_LIMIT);
  const catalogValidationResults = await runWithConcurrency(
    catalogCandidatesToValidate,
    CATALOG_VALIDATION_CONCURRENCY,
    async candidate => {
      try {
        const { data: rpcResult, error: rpcError } = await supabase.rpc(
          'find_supplier_by_short_id',
          {
            short_id: candidate.shortId,
            expected_name_slug: candidate.supplierSlug,
          }
        );

        if (!rpcError && Array.isArray(rpcResult) && rpcResult.length > 0) {
          return `/catalog/${candidate.supplierSlug}/${candidate.shortId}`;
        }
      } catch (e) {
        console.warn('[prerender] Error validando catálogo:', e?.message || e);
      }

      return null;
    }
  );

  const catalogRoutes = catalogValidationResults.filter(Boolean);

  return [...productRoutes, ...catalogRoutes];
}

function routeToOutputPath(routePath) {
  if (routePath === '/') {
    return path.join(DIST_DIR, 'index.html');
  }

  const safePath = routePath.replace(/^\//, '').replace(/\?.*$/, '');
  return path.join(DIST_DIR, safePath, 'index.html');
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer(url, attempts = 30) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 404) {
        return;
      }
    } catch (_) {
      // no-op
    }
    await wait(500);
  }
  throw new Error('Timeout esperando vite preview');
}

function startPreviewServer() {
  const previewCommand = `npx vite preview --host ${PREVIEW_HOST} --port ${PREVIEW_PORT} --strictPort`;
  const child = spawn(previewCommand, {
    cwd: PROJECT_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
    shell: true,
  });

  child.stdout.on('data', chunk => {
    process.stdout.write(`[prerender:preview] ${chunk}`);
  });

  child.stderr.on('data', chunk => {
    process.stderr.write(`[prerender:preview] ${chunk}`);
  });

  return child;
}

async function stopPreviewServer(child) {
  if (!child || child.killed) return;

  const closePromise = new Promise(resolve => {
    child.once('close', () => resolve());
  });

  if (process.platform === 'win32') {
    try {
      await execAsync(`taskkill /pid ${child.pid} /t /f`);
    } catch (_) {
      child.kill();
    }
  } else {
    child.kill('SIGTERM');
  }

  await Promise.race([closePromise, wait(2500)]);

  if (child.stdout) {
    child.stdout.removeAllListeners('data');
    child.stdout.destroy();
  }

  if (child.stderr) {
    child.stderr.removeAllListeners('data');
    child.stderr.destroy();
  }
}

function uniqueRoutes(routes) {
  return [...new Set(routes)].filter(Boolean);
}

function isDynamicSeoRoute(route) {
  return (
    route.startsWith('/marketplace/product/') || route.startsWith('/catalog/')
  );
}

function hasNoindexRobots(html) {
  const match = html.match(
    /<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i
  );
  if (!match) return false;
  return /noindex/i.test(match[1] || '');
}

async function waitForDynamicSeoReady(page, route) {
  if (!isDynamicSeoRoute(route)) return;

  await page.waitForFunction(
    () => {
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (!robotsMeta) return false;
      const robots = robotsMeta.getAttribute('content') || '';
      return !/noindex/i.test(robots);
    },
    { timeout: DYNAMIC_WAIT_TIMEOUT_MS }
  );
}

async function renderRouteHtml(context, route) {
  const target = `${PREVIEW_BASE}${route}`;
  const dynamicRoute = isDynamicSeoRoute(route);
  let lastError = null;

  for (let attempt = 1; attempt <= PRERENDER_RETRIES + 1; attempt += 1) {
    const page = await context.newPage();
    try {
      console.log(
        `[prerender] Renderizando ${route} (intento ${attempt}/${PRERENDER_RETRIES + 1})`
      );

      await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await waitForDynamicSeoReady(page, route);
      await page.waitForTimeout(dynamicRoute ? DYNAMIC_SETTLE_MS : STATIC_SETTLE_MS);

      const html = await page.content();
      if (dynamicRoute && hasNoindexRobots(html)) {
        throw new Error('robots=noindex en ruta dinámica');
      }

      await page.close();
      return html;
    } catch (error) {
      lastError = error;
      await page.close();

      if (attempt <= PRERENDER_RETRIES) {
        await wait(1000 * attempt);
        continue;
      }
    }
  }

  throw new Error(
    `No se pudo prerenderizar ${route}: ${lastError?.message || 'error desconocido'}`
  );
}

async function prerenderRoutes(routes) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  try {
    await runWithConcurrency(routes, PRERENDER_CONCURRENCY, async route => {
      const html = await renderRouteHtml(context, route);
      const outputPath = routeToOutputPath(route);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, html, 'utf8');
    });
  } finally {
    await context.close();
    await browser.close();
  }
}

async function run() {
  loadEnvFiles();

  if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    throw new Error('No existe dist/index.html. Ejecuta vite build antes de prerender.');
  }

  const dynamicRoutes = await getDynamicRoutes();
  const routes = uniqueRoutes([...STATIC_ROUTES, ...dynamicRoutes]);
  console.log(
    `[prerender] Config → rutas=${routes.length}, concurrencia=${PRERENDER_CONCURRENCY}, retries=${PRERENDER_RETRIES}`
  );

  const preview = startPreviewServer();

  try {
    await waitForServer(`${PREVIEW_BASE}/`);
    await prerenderRoutes(routes);
    console.log(`[prerender] Completado. Rutas generadas: ${routes.length}`);
  } finally {
    await stopPreviewServer(preview);
  }
}

run().catch(error => {
  console.error('[prerender] Error:', error.message);

  if (PRERENDER_STRICT) {
    process.exit(1);
  }

  console.warn('[prerender] Continuando sin fallar build (PRERENDER_STRICT=false).');
});
