#!/usr/bin/env node
/**
 * Analizador de valores inline inestables en JSX.
 * Detecta props con:
 *  - Objetos inline: <Comp foo={{ a: 1 }} />
 *  - Arrays inline: <Comp items={[1,2,3]} />
 *  - Funciones inline: <Comp onClick={() => ...} onChange={function(e){}} />
 *
 * Uso:
 *   node scripts/inline_jsx_analyzer.js <archivo_o_carpeta> [..masRutas]
 * Si se pasa una carpeta, se analiza recursivamente .js/.jsx/.ts/.tsx
 *
 * Flags opcionales:
 *   --json      Salida en JSON (array de findings)
 *   --summary   Muestra conteo total al final (modo texto)
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const exts = ['.js', '.jsx', '.ts', '.tsx'];
let OUTPUT_JSON = false;
let SHOW_SUMMARY = false;

// Heurística de severidad configurable en el futuro
function computeSeverity({ kind, size = 0, captureCount = 0, inMap = false }) {
  // Prioridad funciones > objetos > arrays
  if (kind.startsWith('funcion')) {
    if (inMap && (captureCount >= 3 || size >= 10)) return 'critical';
    if (inMap && captureCount >= 1) return 'high';
    if (captureCount >= 5) return 'high';
    if (captureCount >= 3) return 'medium';
    return 'low';
  }
  if (kind === 'objeto') {
    if (inMap && size > 10) return 'high';
    if (size > 10) return 'high';
    if (size >= 6) return 'medium';
    if (size >= 3) return 'low';
    return 'low';
  }
  if (kind === 'array') {
    if (inMap && size >= 8) return 'high';
    if (size >= 10) return 'high';
    if (size >= 5) return 'medium';
    if (size >= 3) return 'low';
    return 'low';
  }
  return 'low';
}

function collectTargets(inputs) {
  const files = new Set();
  if (!inputs.length) inputs = ['sellsi/src'];
  for (const input of inputs) {
    if (!fs.existsSync(input)) continue;
    const stat = fs.statSync(input);
    if (stat.isDirectory()) {
      const pattern = path.join(input, '**/*.{js,jsx,ts,tsx}').replace(/\\/g, '/');
      glob.sync(pattern, { nodir: true }).forEach(f => files.add(f));
    } else if (stat.isFile() && exts.includes(path.extname(input))) {
      files.add(input);
    }
  }
  return [...files];
}

function parseFile(file) {
  const code = fs.readFileSync(file, 'utf8');
  try {
    return parse(code, {
      sourceType: 'module',
      plugins: [
        'jsx',
        'typescript',
        'classProperties',
        'objectRestSpread',
        'optionalChaining',
        'nullishCoalescingOperator',
        'decorators-legacy'
      ]
    });
  } catch (e) {
    console.error(`[parse-error] ${file}: ${e.message}`);
    return null;
  }
}

function jsxNameToString(node) {
  if (!node) return 'Unknown';
  switch (node.type) {
    case 'JSXIdentifier':
      return node.name;
    case 'JSXMemberExpression':
      return `${jsxNameToString(node.object)}.${jsxNameToString(node.property)}`;
    case 'JSXNamespacedName':
      return `${node.namespace.name}:${node.name.name}`;
    default:
      return 'Unknown';
  }
}

function classifyExpression(expr) {
  if (!expr) return null;
  switch (expr.type) {
    case 'ObjectExpression':
      return 'objeto';
    case 'ArrayExpression':
      return 'array';
    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
      return 'funcion';
    default:
      return null;
  }
}

function collectFreeVariables(fnNode) {
  // Muy similar a heurística del analizador de hooks
  const free = new Set();
  const locals = new Set();
  // parámetros
  (fnNode.params || []).forEach(p => collectPatternNames(p, locals));
  function collectPatternNames(pattern, set) {
    if (!pattern) return;
    switch (pattern.type) {
      case 'Identifier': set.add(pattern.name); break;
      case 'ObjectPattern':
        for (const prop of pattern.properties) {
          if (prop.type === 'RestElement') collectPatternNames(prop.argument, set);
          else collectPatternNames(prop.value || prop.key, set);
        }
        break;
      case 'ArrayPattern':
        for (const el of pattern.elements) if (el) collectPatternNames(el, set);
        break;
      case 'AssignmentPattern': collectPatternNames(pattern.left, set); break;
      case 'RestElement': collectPatternNames(pattern.argument, set); break;
    }
  }
  function walk(node, parent) {
    if (!node || typeof node.type !== 'string') return;
    switch (node.type) {
      case 'VariableDeclarator':
        collectPatternNames(node.id, locals);
        if (node.init) walk(node.init, node);
        return;
      case 'FunctionDeclaration':
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
        // No profundizamos en funciones anidadas (considerarlas caja negra para capturas de la externa)
        return;
      case 'Identifier':
        if (parent) {
          if (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) return;
          if (['Property','ObjectProperty'].includes(parent.type) && parent.key === node && !parent.computed) return;
        }
        if (!locals.has(node.name) && !['undefined','NaN','Infinity'].includes(node.name)) free.add(node.name);
        return;
    }
    for (const k in node) {
      if (k === 'parent') continue;
      const v = node[k];
      if (Array.isArray(v)) v.forEach(c => walk(c, node)); else if (v && typeof v.type === 'string') walk(v, node);
    }
  }
  if (fnNode.body) {
    if (fnNode.body.type === 'BlockStatement') fnNode.body.body.forEach(stmt => walk(stmt, fnNode));
    else walk(fnNode.body, fnNode);
  }
  return [...free];
}

function analyzeFile(file) {
  const ast = parseFile(file);
  if (!ast) return [];
  const findings = [];

  traverse(ast, {
    JSXOpeningElement(pathEl) {
      const compName = jsxNameToString(pathEl.node.name);
      const inMap = !!pathEl.findParent(p => p.isCallExpression() && p.node.callee && (
        (p.node.callee.type === 'MemberExpression' && p.node.callee.property && p.node.callee.property.name === 'map') ||
        (p.node.callee.type === 'Identifier' && p.node.callee.name === 'map')
      ));
      for (const attr of pathEl.node.attributes) {
        if (attr.type !== 'JSXAttribute') continue;
        const propName = attr.name && attr.name.name;
        if (!attr.value) continue; // boolean shorthand
        if (attr.value.type !== 'JSXExpressionContainer') continue;
        const expr = attr.value.expression;
        const baseType = classifyExpression(expr);
        if (baseType && baseType !== 'funcion') {
          const size = baseType === 'objeto' ? expr.properties.length : baseType === 'array' ? expr.elements.length : 0;
            const severity = computeSeverity({ kind: baseType, size, inMap });
          findings.push({
            file,
            component: compName,
            prop: propName,
            kind: baseType,
            size,
            captureCount: 0,
            inMap,
            severity,
            loc: expr.loc && { line: expr.loc.start.line, column: expr.loc.start.column }
          });
          continue;
        }
        if (baseType === 'funcion') {
          const captures = collectFreeVariables(expr);
          const size = expr.body && expr.body.type === 'BlockStatement' ? expr.body.body.length : 1;
          const severity = computeSeverity({ kind: 'funcion', size, captureCount: captures.length, inMap });
          findings.push({
            file,
            component: compName,
            prop: propName,
            kind: 'funcion',
            size,
            captureCount: captures.length,
            inMap,
            severity,
            loc: expr.loc && { line: expr.loc.start.line, column: expr.loc.start.column }
          });
          // Arrow concise returning object/array inline (funcion->objeto/array)
          if (expr.type === 'ArrowFunctionExpression' && expr.body && expr.body.type !== 'BlockStatement') {
            const retType = classifyExpression(expr.body);
            if (retType && retType !== 'funcion') {
              const rSize = retType === 'objeto' ? expr.body.properties.length : retType === 'array' ? expr.body.elements.length : 0;
              const nestedSeverity = computeSeverity({ kind: 'funcion', size: rSize, captureCount: captures.length, inMap });
              findings.push({
                file,
                component: compName,
                prop: propName,
                kind: 'funcion->'+retType,
                size: rSize,
                captureCount: captures.length,
                inMap,
                severity: nestedSeverity,
                loc: expr.body.loc && { line: expr.body.loc.start.line, column: expr.body.loc.start.column }
              });
            }
          }
        }
      }
    }
  });

  return findings;
}

function formatText(findings) {
  if (!findings.length) return 'Sin valores inline inestables encontrados.';
  const lines = [];
  lines.push('REPORTE INLINE JSX');
  lines.push('='.repeat(70));
  for (const f of findings) {
    lines.push([
      `Componente: ${f.component}`,
      `Prop: ${f.prop}`,
      `Tipo: ${f.kind}`,
      f.size!=null ? `Size:${f.size}` : null,
      f.captureCount!=null ? `Capturas:${f.captureCount}` : null,
      f.inMap ? 'enMap:true' : null,
      `Severidad:${f.severity}`,
      `Ubicacion: ${f.file}:${f.loc ? f.loc.line+':'+f.loc.column : '?'}`
    ].filter(Boolean).join(' | '));
  }
  return lines.join('\n');
}

function main() {
  const rawArgs = process.argv.slice(2);
  const targets = [];
  for (let i=0;i<rawArgs.length;i++) {
    const a = rawArgs[i];
    if (a === '--json') { OUTPUT_JSON = true; continue; }
    if (a === '--summary') { SHOW_SUMMARY = true; continue; }
    targets.push(a);
  }
  const files = collectTargets(targets);
  const all = [];
  for (const f of files) {
    all.push(...analyzeFile(f));
  }

  if (OUTPUT_JSON) {
    console.log(JSON.stringify(all, null, 2));
  } else {
    console.log(formatText(all));
    if (SHOW_SUMMARY) {
      console.log('\nResumen:');
      const porTipo = all.reduce((acc, f) => { acc[f.kind] = (acc[f.kind]||0)+1; return acc; }, {});
      const porSev = all.reduce((acc, f) => { acc[f.severity] = (acc[f.severity]||0)+1; return acc; }, {});
      console.log('Total hallazgos:', all.length);
      Object.entries(porTipo).forEach(([k,v]) => console.log(`  ${k}: ${v}`));
      console.log('Severidades:');
      Object.entries(porSev).sort((a,b)=>{
        const order = {critical:3,high:2,medium:1,low:0};
        return order[b[0]]-order[a[0]];
      }).forEach(([k,v]) => console.log(`  ${k}: ${v}`));
    }
  }
  if (all.length) process.exitCode = 1; // para CI marcar hallazgos
}

main();
