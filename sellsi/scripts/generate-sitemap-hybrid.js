import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = 'https://sellsi.cl';
const OUTPUT_DIR = path.join(__dirname, '../public');
const DIST_DIR = path.join(__dirname, '../dist');
const SITEMAP_PATH = path.join(OUTPUT_DIR, 'sitemap.xml');
const DIST_SITEMAP_PATH = path.join(DIST_DIR, 'sitemap.xml');

const PRIORITY = {
  HOME: '1.0',
  FAQ: '0.8',
  MARKETPLACE: '0.9',
  PRODUCT: '0.9',
  CATALOG: '0.8',
  LEGAL: '0.3',
};

const CHANGEFREQ = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

function loadEnvFiles() {
  const candidates = [
    path.join(__dirname, '../.env'),
    path.join(__dirname, '../.env.local'),
    path.join(__dirname, '../.env.production'),
    path.join(__dirname, '../.env.production.local'),
  ];

  candidates.forEach(envPath => {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: true });
    }
  });
}

function escapeXml(value = '') {
  return value
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(dateLike) {
  if (!dateLike) {
    return new Date().toISOString().split('T')[0];
  }

  const parsed = new Date(dateLike);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().split('T')[0];
  }

  return parsed.toISOString().split('T')[0];
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

function createEntry({ loc, lastmod, changefreq, priority }) {
  const esClHref = escapeXml(loc);
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${formatDate(lastmod)}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n    <xhtml:link rel="alternate" hreflang="es-CL" href="${esClHref}" />\n    <xhtml:link rel="alternate" hreflang="x-default" href="${esClHref}" />\n  </url>`;
}

function staticEntries(now) {
  return [
    {
      loc: `${SITE_URL}/`,
      lastmod: now,
      changefreq: CHANGEFREQ.DAILY,
      priority: PRIORITY.HOME,
    },
    {
      loc: `${SITE_URL}/faq`,
      lastmod: now,
      changefreq: CHANGEFREQ.WEEKLY,
      priority: PRIORITY.FAQ,
    },
    {
      loc: `${SITE_URL}/marketplace`,
      lastmod: now,
      changefreq: CHANGEFREQ.DAILY,
      priority: PRIORITY.MARKETPLACE,
    },
    {
      loc: `${SITE_URL}/terms-and-conditions`,
      lastmod: now,
      changefreq: CHANGEFREQ.MONTHLY,
      priority: PRIORITY.LEGAL,
    },
    {
      loc: `${SITE_URL}/privacy-policy`,
      lastmod: now,
      changefreq: CHANGEFREQ.MONTHLY,
      priority: PRIORITY.LEGAL,
    },
  ];
}

async function getDynamicEntries() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[sitemap-hybrid] Supabase env no disponible, se genera solo sitemap estático.');
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: products = [], error: productsError } = await supabase
    .from('products')
    .select(
      'productid, productnm, supplier_id, users!products_supplier_id_fkey(user_id, user_nm, verified)'
    )
    .eq('is_active', true)
    .limit(5000);

  if (productsError) {
    console.warn('[sitemap-hybrid] Error cargando productos:', productsError.message);
  }
  const now = new Date();

  const productEntries = products
    .filter(item => item?.productid)
    .map(item => {
      const productId = String(item.productid).trim();
      if (!productId) return null;

      const slug = toProductSlug(item.productnm || 'producto');
      const basePath = `${SITE_URL}/marketplace/product/${productId}`;
      const loc = slug ? `${basePath}/${slug}` : basePath;
      return {
        loc,
        lastmod: now,
        changefreq: CHANGEFREQ.WEEKLY,
        priority: PRIORITY.PRODUCT,
      };
    })
    .filter(Boolean);

  const supplierCandidates = products
    .map(item => {
      const user = item?.users || null;
      if (!user || user.verified !== true) return null;
      const supplierUserId = String(user?.user_id || item?.supplier_id || '').trim();
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
      supplierCandidates.map(item => [`${item.supplierSlug}/${item.shortId}`, item])
    ).values(),
  ];

  const validCatalogCandidates = [];
  for (const candidate of uniqueCatalogCandidates) {
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'find_supplier_by_short_id',
        {
          short_id: candidate.shortId,
          expected_name_slug: candidate.supplierSlug,
        }
      );

      if (!rpcError && Array.isArray(rpcResult) && rpcResult.length > 0) {
        validCatalogCandidates.push(candidate);
      }
    } catch (e) {
      console.warn('[sitemap-hybrid] Error validando catálogo:', e?.message || e);
    }
  }

  const supplierEntries = validCatalogCandidates.map(item => ({
    loc: `${SITE_URL}/catalog/${item.supplierSlug}/${item.shortId}`,
    lastmod: now,
    changefreq: CHANGEFREQ.WEEKLY,
    priority: PRIORITY.CATALOG,
  }));

  return [...productEntries, ...supplierEntries];
}

function dedupe(entries) {
  const map = new Map();
  entries.forEach(entry => {
    if (!entry?.loc) return;
    if (!map.has(entry.loc)) {
      map.set(entry.loc, entry);
    }
  });
  return [...map.values()];
}

async function run() {
  loadEnvFiles();

  const now = new Date();
  const staticPages = staticEntries(now);
  const dynamicPages = await getDynamicEntries();
  const allPages = dedupe([...staticPages, ...dynamicPages]);

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...allPages.map(createEntry),
    '</urlset>',
    '',
  ].join('\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  fs.writeFileSync(SITEMAP_PATH, xml, 'utf8');
  fs.writeFileSync(DIST_SITEMAP_PATH, xml, 'utf8');
  console.log(
    `[sitemap-hybrid] sitemap.xml generado (${allPages.length} URLs) en public/ y dist/`
  );
}

run().catch(error => {
  console.error('[sitemap-hybrid] Error fatal:', error);
  process.exit(1);
});
