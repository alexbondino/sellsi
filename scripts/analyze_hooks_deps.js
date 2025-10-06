#!/usr/bin/env node
/*
 * Análisis de dependencias para useEffect/useMemo/useCallback.
 * Requisitos:
 * - Detectar dependencias faltantes (error)
 * - Dependencias innecesarias (warning)
 * - Valores inline inestables en el array (warning)
 * Uso:
 *   node scripts/analyze_hooks_deps.js [ruta/glob ...]
 * Si no se pasa argumento, analiza archivos dentro de ./sellsi/src
 */

const { readFileSync } = require('fs');
const path = require('path');
const glob = require('glob');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const HOOKS = new Set(['useEffect', 'useMemo', 'useCallback']);
const exts = ['.js', '.jsx', '.ts', '.tsx'];
// Identificadores globales / built-ins que NO deben contarse como dependencias
const BUILT_INS = new Set([
  'window','document','navigator','location','console','performance','self','globalThis','history','screen','crypto',
  'setTimeout','clearTimeout','setInterval','clearInterval','requestAnimationFrame','cancelAnimationFrame',
  'Promise','Error','TypeError','Map','Set','WeakMap','WeakSet','Date','Array','Object','String','Number','Boolean','Math','JSON','Intl','URL','URLSearchParams','Symbol','BigInt','RegExp','parseInt','parseFloat','isNaN','isFinite','localStorage','sessionStorage','CustomEvent','IntersectionObserver','Image','File','Blob','process','queueMicrotask'
]);
let EXTRA_GLOBALS = new Set();
let IGNORE_NAMES = new Set();
let OUTPUT_JSON = false;
let STABLE_NAMES = new Set();
let AUTO_STABLE_CONSTANTS = false;
let TOP_N = null;
let OUTPUT_SUMMARY = false;
let NORMALIZE_SYNONYMS = false;

// Grupos de sinónimos para reducir ruido en conteo (el primero es canónico)
const SYNONYM_GROUPS = [
  ['price','precio','precioOriginal','originalPrice','priceTiers','price_tiers','min_price','max_price'],
  ['name','nombre','user_nm'],
  ['thumbnail','thumbnails','thumbnail_url','thumbnailUrl','image_url','imagen','image','minithumb'],
  ['supplier','proveedor'],
  ['minimum_purchase','compraMinima','min_quantity','minimumPurchase'],
  ['maxStock','stock','productqty','max_purchase','maxPurchase'],
  ['shippingRegions','delivery_regions'],
  ['id','user_id','productid'],
  ['logo_url','logo','logoUrl'],
  ['verified','isVerified'],
  ['region','regiones','delivery_days'],
  ['url','image_url','thumbnail_url','thumbnailUrl'],
  ['toast','showErrorToast','showSuccessToast','showCartSuccess','showCartError'],
  ['FeatureFlags','FeatureFlag']
];
const SYNONYM_MAP = (() => {
  const m = new Map();
  for (const g of SYNONYM_GROUPS) {
    const canon = g[0];
    for (const v of g) m.set(v, canon);
  }
  return m;
})();

function canonicalName(name) {
  if (!NORMALIZE_SYNONYMS) return name;
  return SYNONYM_MAP.get(name) || name;
}

function isStableSetter(name) {
  // Heurística: set + Mayúscula => probablemente setter de useState estable
  return /^set[A-Z]/.test(name);
}

function isStableRef(name) {
  return /Ref$/.test(name);
}

function isAutoStableConstant(name) {
  return AUTO_STABLE_CONSTANTS && /^[A-Z0-9_]{3,}$/.test(name);
}

function collectFiles(args) {
  if (args.length === 0) {
    return glob.sync('sellsi/src/**/*.{js,jsx,ts,tsx}', { nodir: true });
  }
  const files = new Set();
  for (const pattern of args) {
    const matches = glob.sync(pattern, { nodir: true });
    matches.forEach(m => {
      if (exts.includes(path.extname(m))) files.add(m);
    });
  }
  return [...files];
}

function isInlineUnstable(node) {
  if (!node) return false;
  switch (node.type) {
    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
    case 'ObjectExpression':
    case 'ArrayExpression':
      return true;
    default:
      return false;
  }
}

function getHookName(callee) {
  if (!callee) return null;
  if (callee.type === 'Identifier') return callee.name;
  if (callee.type === 'MemberExpression' && !callee.computed && callee.property.type === 'Identifier') {
    return callee.property.name; // e.g. React.useEffect
  }
  return null;
}

function extractUsedIdentifiers(callbackFnPath) {
  const used = new Set();
  // property name -> base object identifier (only for simple a.b or a.b.c chains where base is Identifier)
  const propertyBase = new Map();

  function getRootObject(node) {
    let current = node;
    while (current && current.type === 'MemberExpression') current = current.object;
    return current;
  }

  function walk(node, parent) {
    if (!node || typeof node.type !== 'string') return;
    if (node.type === 'MemberExpression') {
      // Record base + property (if simple identifier property)
      if (!node.computed && node.property.type === 'Identifier') {
        const root = getRootObject(node);
        if (root && root.type === 'Identifier') {
          propertyBase.set(node.property.name, root.name);
        }
      }
    }
    if (node.type === 'Identifier') {
      if (parent) {
        if (parent.type === 'VariableDeclarator' && parent.id === node) return;
        if (parent.type === 'FunctionDeclaration' && parent.id === node) return;
        if (parent.type === 'ClassDeclaration' && parent.id === node) return;
        if (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) return; // property name (handled separately)
        if (['Property','ObjectProperty'].includes(parent.type) && parent.key === node && !parent.computed) return;
      }
      if (!['undefined','NaN','Infinity'].includes(node.name)) used.add(node.name);
    }
    for (const key in node) {
      if (key === 'parent') continue;
      const val = node[key];
      if (Array.isArray(val)) val.forEach(child => walk(child, node));
      else if (val && typeof val.type === 'string') walk(val, node);
    }
  }
  if (callbackFnPath.node.body) {
    if (callbackFnPath.node.body.type === 'BlockStatement') walk(callbackFnPath.node.body, callbackFnPath.node);
    else walk(callbackFnPath.node.body, callbackFnPath.node); // concise body
  }
  return { usedIds: used, propertyBase };
}

function getParamsAndLocals(callbackFn) {
  const locals = new Set();
  // Parameters
  for (const p of callbackFn.node.params) {
    collectPatternNames(p, locals);
  }
  // Inner variable/function/class declarations
  callbackFn.traverse({
    VariableDeclarator(p) {
      collectPatternNames(p.node.id, locals);
    },
    FunctionDeclaration(p) {
      if (p.node.id) locals.add(p.node.id.name);
    },
    FunctionExpression(p) {
      for (const prm of p.node.params) collectPatternNames(prm, locals);
    },
    ArrowFunctionExpression(p) {
      for (const prm of p.node.params) collectPatternNames(prm, locals);
    },
    ClassDeclaration(p) {
      if (p.node.id) locals.add(p.node.id.name);
    },
    CatchClause(p) {
      if (p.node.param) collectPatternNames(p.node.param, locals);
    }
  });
  return locals;
}

function collectPatternNames(pattern, set) {
  if (!pattern) return;
  switch (pattern.type) {
    case 'Identifier':
      set.add(pattern.name);
      break;
    case 'ObjectPattern':
      for (const prop of pattern.properties) {
        if (prop.type === 'RestElement') collectPatternNames(prop.argument, set);
        else collectPatternNames(prop.value || prop.key, set);
      }
      break;
    case 'ArrayPattern':
      for (const el of pattern.elements) {
        if (el) collectPatternNames(el, set);
      }
      break;
    case 'AssignmentPattern':
      collectPatternNames(pattern.left, set);
      break;
    case 'RestElement':
      collectPatternNames(pattern.argument, set);
      break;
  }
}

function analyzeFile(file) {
  const code = readFileSync(file, 'utf8');
  let ast;
  try {
    ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
  } catch (e) {
    console.error(`[parse-error] ${file}: ${e.message}`);
    return [];
  }

  const results = [];

  traverse(ast, {
    CallExpression(path) {
      const hookName = getHookName(path.node.callee);
      if (!HOOKS.has(hookName)) return;

      const args = path.node.arguments;
      if (args.length === 0) return; // improbable
      const callback = args[0];
      const depsArray = args[1];

      if (!callback || (callback.type !== 'ArrowFunctionExpression' && callback.type !== 'FunctionExpression')) return;

  const { usedIds, propertyBase } = extractUsedIdentifiers(path.get('arguments.0'));
      const locals = getParamsAndLocals(path.get('arguments.0'));
      // Remove locals from used
      for (const l of locals) usedIds.delete(l);

      const declaredInCallback = locals; // alias

      // Mapeo de variables provenientes de destructuring -> objeto fuente
      // Ej: const { id, nombre } = product; si 'product' está en deps, consideramos cubiertos id y nombre.
      const destructuredParentMap = new Map(); // variableName -> parentObjectName
      path.get('arguments.0').traverse({
        VariableDeclarator(p) {
          const idNode = p.node.id;
          const init = p.node.init;
            if (!init) return;
          // Solo considerar casos simples init Identifier (ignoramos llamadas, member expressions, etc.)
          if (init.type !== 'Identifier') return;
          const parentName = init.name;
          if (idNode.type === 'ObjectPattern') {
            for (const prop of idNode.properties) {
              if (prop.type === 'RestElement') {
                // Rest: const { ...rest } = obj -> rest cubre obj entero, lo podemos mapear también
                if (prop.argument.type === 'Identifier') destructuredParentMap.set(prop.argument.name, parentName);
                continue;
              }
              const value = prop.value || prop.key;
              if (value && value.type === 'Identifier') {
                destructuredParentMap.set(value.name, parentName);
              }
            }
          } else if (idNode.type === 'ArrayPattern') {
            for (const el of idNode.elements) {
              if (!el) continue;
              if (el.type === 'Identifier') destructuredParentMap.set(el.name, parentName);
              else if (el.type === 'RestElement' && el.argument.type === 'Identifier') destructuredParentMap.set(el.argument.name, parentName);
            }
          }
        }
      });

      // Attempt to filter out globals (window, document, etc.) if not declared anywhere
  for (const g of BUILT_INS) usedIds.delete(g);
  // Remove common event / placeholder names if they are function params in nested functions (already removed) else keep.

      const deps = new Set();
      const inlineUnstable = [];
      if (depsArray && depsArray.type === 'ArrayExpression') {
        for (const elem of depsArray.elements) {
          if (!elem) continue;
          if (isInlineUnstable(elem)) {
            inlineUnstable.push({ name: '[inline]', loc: elem.loc });
            continue;
          }
          if (elem.type === 'Identifier') deps.add(elem.name);
          else if (elem.type === 'MemberExpression') {
            // Collect the full text for member expressions a.b.c
            const text = code.slice(elem.start, elem.end);
            deps.add(text);
          } else {
            inlineUnstable.push({ name: '[complex]', loc: elem.loc });
          }
        }
      }

      // Missing = usedIds not in deps (only simple identifiers considered)
      let missing = [...usedIds].filter(id => {
        if (isStableSetter(id) || isStableRef(id)) return false;
        if (BUILT_INS.has(id) || EXTRA_GLOBALS.has(id)) return false;
        if (IGNORE_NAMES.has(id)) return false;
        if (STABLE_NAMES.has(id)) return false;
        if (isAutoStableConstant(id)) return false;
  // Si proviene de destructuring y su objeto padre está ya en deps, lo consideramos cubierto
  const parentObj = destructuredParentMap.get(id);
  if (parentObj && ([...deps].some(d => d === parentObj))) return false;
        return ![...deps].some(d => d === id || d.startsWith(id + '.'));
      });

      // Heurística property keys: si un identificador aparece únicamente como propiedad de un objeto cuyo root está presente
      // ya sea en deps o también marcado como missing, podemos eliminar la propiedad (nos quedamos con la raíz).
      if (propertyBase.size) {
        const depsArr = [...deps];
        const missingSet = new Set(missing);
        for (const prop of missing) {
          const base = propertyBase.get(prop);
            if (!base) continue;
            // Si base está en deps o también está en missing, descartamos prop.
            if (depsArr.includes(base) || missingSet.has(base)) {
              missingSet.delete(prop);
            }
        }
        missing = [...missingSet];
      }
      // Unnecessary = deps not actually used
      const unnecessary = [...deps].filter(d => {
        const base = d.split('.')[0];
        return !usedIds.has(base);
      });

      results.push({
        hook: hookName,
        file,
        loc: path.node.loc && { start: path.node.loc.start, end: path.node.loc.end },
        missing,
        unnecessary,
        inlineUnstable
      });
    }
  });

  return results.filter(r => r.missing.length || r.unnecessary.length || r.inlineUnstable.length);
}

function main() {
  const rawArgs = process.argv.slice(2);
  const patterns = [];
  for (let i=0;i<rawArgs.length;i++) {
    const a = rawArgs[i];
    if (a === '--extra-globals' && rawArgs[i+1]) {
      EXTRA_GLOBALS = new Set(rawArgs[++i].split(',').map(s=>s.trim()).filter(Boolean));
      continue;
    }
    if (a === '--ignore' && rawArgs[i+1]) {
      IGNORE_NAMES = new Set(rawArgs[++i].split(',').map(s=>s.trim()).filter(Boolean));
      continue;
    }
    if (a === '--stable' && rawArgs[i+1]) {
      STABLE_NAMES = new Set(rawArgs[++i].split(',').map(s=>s.trim()).filter(Boolean));
      continue;
    }
    if (a === '--auto-stable-constants') { AUTO_STABLE_CONSTANTS = true; continue; }
    if (a === '--top' && rawArgs[i+1]) { TOP_N = parseInt(rawArgs[++i],10) || null; continue; }
    if (a === '--json') { OUTPUT_JSON = true; continue; }
  if (a === '--summary') { OUTPUT_SUMMARY = true; continue; }
  if (a === '--normalize-synonyms') { NORMALIZE_SYNONYMS = true; continue; }
    patterns.push(a);
  }
  const files = collectFiles(patterns);
  if (files.length === 0) {
    console.error('No se encontraron archivos para analizar.');
    process.exit(1);
  }
  const all = [];
  for (const f of files) {
    all.push(...analyzeFile(f));
  }
  if (!all.length) {
    if (OUTPUT_JSON) {
      console.log(JSON.stringify({ errors: 0, warnings: 0, issues: [] }, null, 2));
    } else {
      console.log('Sin problemas de dependencias en hooks.');
    }
    return;
  }
  let errorCount = 0;
  let warnCount = 0;
  for (const r of all) {
    const rel = r.file;
    if (r.missing.length) {
      errorCount += r.missing.length;
      if (!OUTPUT_JSON) console.log(`ERROR ${rel} (${r.hook}) dependencias faltantes: ${r.missing.join(', ')}`);
    }
    if (r.unnecessary.length) {
      warnCount += r.unnecessary.length;
      if (!OUTPUT_JSON) console.log(`WARN  ${rel} (${r.hook}) dependencias innecesarias: ${r.unnecessary.join(', ')}`);
    }
    if (r.inlineUnstable.length) {
      warnCount += r.inlineUnstable.length;
      if (!OUTPUT_JSON) console.log(`WARN  ${rel} (${r.hook}) valores inline inestables (${r.inlineUnstable.length})`);
    }
  }
  if (OUTPUT_JSON) {
    let issues = all.map(r => ({
      file: r.file,
      hook: r.hook,
      missing: r.missing,
      unnecessary: r.unnecessary,
      inline: r.inlineUnstable.length
    }));
    // ordenar por cantidad de missing desc
    issues.sort((a,b)=> (b.missing.length - a.missing.length) || (b.inline - a.inline));
    if (TOP_N != null) issues = issues.slice(0, TOP_N);
    let summary = undefined;
    if (OUTPUT_SUMMARY) {
      const orderScore = { critical:3, high:2, medium:1, low:0 };
      summary = issues.map(it => {
        const canonSet = new Set(it.missing.map(canonicalName));
        const canonCount = canonSet.size;
        let severity;
        if (canonCount >= 10) severity = 'critical';
        else if (canonCount >= 5) severity = 'high';
        else if (canonCount >= 3) severity = 'medium';
        else severity = 'low';
        return {
          file: it.file,
          hook: it.hook,
          missingCanonical: canonCount,
          missingRaw: it.missing.length,
          unnecessary: it.unnecessary.length,
          inline: it.inline,
          severity
        };
      }).sort((a,b)=> ( ( {critical:3,high:2,medium:1,low:0}[b.severity] - {critical:3,high:2,medium:1,low:0}[a.severity]) ) || (b.missingCanonical - a.missingCanonical));
    }
    console.log(JSON.stringify({ errors: errorCount, warnings: warnCount, issues, summary }, null, 2));
  } else {
    console.log(`\nResumen: ${errorCount} errores, ${warnCount} warnings`);
    if (TOP_N != null) {
      const sorted = [...all].sort((a,b)=> (b.missing.length - a.missing.length) || (b.inlineUnstable.length - a.inlineUnstable.length));
      console.log(`Top ${TOP_N} hooks con más missing:`);
      sorted.slice(0, TOP_N).forEach(r => {
        console.log(`  ${r.file} (${r.hook}) missing=${r.missing.length} unnecessary=${r.unnecessary.length} inline=${r.inlineUnstable.length}`);
      });
    }
  }
  if (errorCount) process.exitCode = 1;
}

main();
