#!/usr/bin/env node
/**
 * detect-inline-literals.js
 * Analiza archivos (JS/TS/JSX/TSX) y reporta arrays u objetos literales inline dentro de JSX.
 * Uso básico: node detect-inline-literals.js <archivo|carpeta|glob> [...mas]
 * Flags:
 *   --json      Salida en JSON
 *   --summary   Incluye resumen (totales por tipo)
 */

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { glob } = require('glob');

const VALID_EXT = new Set(['.js', '.jsx', '.ts', '.tsx']);

function printUsageAndExit(msg) {
  if (msg) console.error(`Error: ${msg}`);
  console.log(`Uso: node detect-inline-literals.js [opciones] <paths|globs>\n\nOpciones:\n  --json       Salida JSON\n  --summary    Añade resumen (totales)\n`);
  process.exit(1);
}

const rawArgs = process.argv.slice(2);
if (rawArgs.length === 0) printUsageAndExit('Faltan paths.');

const options = { json: false, summary: false, out: null };
const inputPatterns = [];
for (let i = 0; i < rawArgs.length; i++) {
  const a = rawArgs[i];
  if (a === '--json') { options.json = true; continue; }
  if (a === '--summary') { options.summary = true; continue; }
  if (a === '--out') {
    const next = rawArgs[i + 1];
    if (!next) printUsageAndExit('--out requiere una ruta de archivo');
    options.out = path.resolve(process.cwd(), next);
    i++; // consume next
    continue;
  }
  if (a.startsWith('--')) printUsageAndExit(`Flag no reconocida: ${a}`);
  inputPatterns.push(a);
}
if (inputPatterns.length === 0) printUsageAndExit('No se proporcionaron rutas.');

async function collectFiles(patterns) {
  const collected = new Set();
  for (const p of patterns) {
    const abs = path.resolve(process.cwd(), p);
    if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
      const files = await glob('**/*.*', { cwd: abs, dot: false, nodir: true, absolute: true });
      for (const f of files) if (VALID_EXT.has(path.extname(f))) collected.add(path.normalize(f));
    } else if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
      if (VALID_EXT.has(path.extname(abs))) collected.add(path.normalize(abs));
    } else {
      const files = await glob(p, { absolute: true, nodir: true });
      for (const f of files) if (VALID_EXT.has(path.extname(f))) collected.add(path.normalize(f));
    }
  }
  return Array.from(collected).sort();
}

function parse(code, filename) {
  return parser.parse(code, {
    sourceType: 'module',
    sourceFilename: filename,
    plugins: [
      'jsx',
      'typescript',
      'classProperties',
      'decorators-legacy',
      'objectRestSpread',
      'optionalChaining',
      'nullishCoalescingOperator',
      'dynamicImport',
      'topLevelAwait'
    ]
  });
}

function snippetFrom(node, code) {
  if (!node || typeof node.start !== 'number' || typeof node.end !== 'number') return '';
  const raw = code.slice(node.start, node.end).trim();
  return raw.length > 120 ? raw.slice(0, 117) + '...' : raw;
}

function getComponentName(node) {
  const opening = node.openingElement;
  const nameNode = opening.name;
  if (!nameNode) return '<unknown>';
  if (nameNode.type === 'JSXIdentifier') return nameNode.name;
  if (nameNode.type === 'JSXMemberExpression') {
    const parts = [];
    let current = nameNode;
    while (current) {
      if (current.property) parts.unshift(current.property.name);
      if (current.object) {
        if (current.object.type === 'JSXIdentifier') {
          parts.unshift(current.object.name);
          break;
        } else {
          current = current.object;
        }
      } else break;
      break;
    }
    return parts.join('.') || '<member>';
  }
  return '<complex>';
}

function isInlineCollection(node) {
  return !!node && (node.type === 'ArrayExpression' || node.type === 'ObjectExpression');
}

function classifyNode(node, propName) {
  // Returns severity: 'critical' | 'high' | 'medium' | 'low'
  try {
    if (!node) return 'low';
    // critical: dangerous HTML injection patterns
    if (propName === 'dangerouslySetInnerHTML') return 'critical';
    if (node.type === 'ObjectExpression') {
      for (const p of node.properties || []) {
        const key = p && p.key && (p.key.name || p.key.value);
        if (key === '__html') return 'critical';
      }
      const propCount = (node.properties || []).length;
      const hasNested = (node.properties || []).some(p => p && p.value && (p.value.type === 'ObjectExpression' || p.value.type === 'ArrayExpression'));
      if (propName === 'style' && propCount > 2) return 'high';
      if (propName === 'sx' && propCount > 3) return 'high';
      if (hasNested && propCount > 0) return 'high';
      if (propCount > 6) return 'high';
      if (propCount > 2) return 'medium';
      return 'low';
    }
    if (node.type === 'ArrayExpression') {
      const len = (node.elements || []).length;
      const hasNested = (node.elements || []).some(e => e && (e.type === 'ArrayExpression' || e.type === 'ObjectExpression'));
      if (len === 0) return 'low';
      if (len > 10) return 'high';
      if (hasNested) return 'high';
      if (len > 4) return 'medium';
      return 'low';
    }
  } catch (e) {
    return 'low';
  }
  return 'low';
}

function inspectChild(child) {
  if (child.type === 'JSXExpressionContainer') {
    return isInlineCollection(child.expression) ? child.expression : null;
  }
  return null;
}

async function analyzeFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  let ast;
  try {
    ast = parse(code, path.basename(filePath));
  } catch (err) {
    return { file: filePath, parseError: err.message, issues: [] };
  }
  const issues = [];
  traverse(ast, {
    JSXElement(p) {
      const element = p.node;
      const componentName = getComponentName(element);
      element.openingElement.attributes.forEach(attr => {
        if (attr.type === 'JSXAttribute') {
          const propName = attr.name && attr.name.name;
          if (!attr.value) return;
          if (attr.value.type === 'JSXExpressionContainer') {
            const expr = attr.value.expression;
            if (isInlineCollection(expr)) {
              const severity = classifyNode(expr, propName);
              issues.push({
                file: filePath,
                component: componentName,
                prop: propName,
                line: expr.loc.start.line,
                column: expr.loc.start.column + 1,
                type: expr.type === 'ArrayExpression' ? 'Array literal' : 'Object literal',
                kind: expr.type === 'ArrayExpression' ? 'array' : 'object',
                value: snippetFrom(expr, code),
                severity,
                message: 'Warning: literal inline crea nueva referencia en cada render.'
              });
            }
          }
        } else if (attr.type === 'JSXSpreadAttribute') {
          const arg = attr.argument;
          if (isInlineCollection(arg)) {
            const severity = classifyNode(arg, '{...spread}');
            issues.push({
              file: filePath,
              component: componentName,
              prop: '{...spread}',
              line: arg.loc.start.line,
              column: arg.loc.start.column + 1,
              type: arg.type === 'ArrayExpression' ? 'Array literal (spread)' : 'Object literal (spread)',
              kind: arg.type === 'ArrayExpression' ? 'array' : 'object',
              value: snippetFrom(arg, code),
              severity,
              message: 'Warning: spread de literal inline crea nueva referencia.'
            });
          }
        }
      });
      element.children.forEach(child => {
        const expr = inspectChild(child);
        if (expr) {
          const severity = classifyNode(expr, 'children');
          issues.push({
            file: filePath,
            component: componentName,
            prop: 'children',
            line: expr.loc.start.line,
            column: expr.loc.start.column + 1,
            type: expr.type === 'ArrayExpression' ? 'Array literal (child)' : 'Object literal (child)',
            kind: expr.type === 'ArrayExpression' ? 'array' : 'object',
            value: snippetFrom(expr, code),
            severity,
            message: 'Warning: literal inline en children crea nueva referencia.'
          });
        }
      });
    }
  });
  return { file: filePath, issues };
}

function buildSummary(results) {
  const summary = {
    filesScanned: results.length,
    filesWithIssues: 0,
    totalIssues: 0,
    byKind: { array: 0, object: 0 }
  };
  summary.bySeverity = { critical: 0, high: 0, medium: 0 };
  results.forEach(r => {
    if (r.issues.length > 0) {
      summary.filesWithIssues++;
      summary.totalIssues += r.issues.length;
      r.issues.forEach(i => summary.byKind[i.kind]++);
      r.issues.forEach(i => {
        const s = i.severity || 'low';
        if (s === 'critical') summary.bySeverity.critical++;
        else if (s === 'high') summary.bySeverity.high++;
        else if (s === 'medium') summary.bySeverity.medium++;
      });
    }
  });
  return summary;
}

(async () => {
  const files = await collectFiles(inputPatterns);
  if (files.length === 0) {
    printUsageAndExit('No se encontraron archivos para analizar.');
  }
  const results = [];
  for (const f of files) {
    results.push(await analyzeFile(f));
  }
  // Filter out 'low' severity issues as requested
  const allIssues = results.flatMap(r => r.issues).filter(i => i && i.severity && i.severity !== 'low');
  // Build a filtered results array (same shape) for summary calculation
  const filteredResults = results.map(r => ({ file: r.file, issues: (r.issues || []).filter(i => i && i.severity && i.severity !== 'low') }));
  const summary = options.summary ? buildSummary(filteredResults) : null;

  // Build text output
  function buildTextOutput() {
    const lines = [];
    if (files.length === 1) {
      const targetPath = files[0];
      if (allIssues.length === 0) {
        lines.push(`No se detectaron arrays u objetos literales inline en JSX en: ${targetPath}`);
      } else {
        lines.push(`Inline array/object literals detectados en JSX (${allIssues.length}) - Archivo: ${targetPath}`);
        lines.push('');
        allIssues.forEach(i => {
          lines.push(`- [${i.line}:${i.column}] ${i.component} prop=${i.prop} (${i.type}) severity=${i.severity} -> ${i.value}`);
          lines.push(`  ${i.message}`);
        });
      }
    } else {
      lines.push(`Archivos analizados: ${files.length}`);
      if (allIssues.length === 0) {
        lines.push('No se detectaron arrays/objetos inline en JSX.');
      } else {
        lines.push(`Issues encontrados: ${allIssues.length}`);
        lines.push('');
        allIssues.forEach(i => {
          lines.push(`[${path.relative(process.cwd(), i.file)}:${i.line}:${i.column}] ${i.component} prop=${i.prop} ${i.type} severity=${i.severity} -> ${i.value}`);
        });
      }
    }
    if (summary) {
      lines.push('');
      lines.push('Resumen:');
      lines.push(`  Archivos con issues: ${summary.filesWithIssues}/${summary.filesScanned}`);
      lines.push(`  Total issues: ${summary.totalIssues}`);
      lines.push(`  Arrays: ${summary.byKind.array}`);
      lines.push(`  Objetos: ${summary.byKind.object}`);
    }
    lines.push('');
    lines.push('Sugerencia: extrae estos literales a constantes fuera del componente o memoriza con useMemo si dependen de props/state.');
    return lines.join('\n');
  }

  if (options.json) {
    const out = { issues: allIssues, summary };
    const jsonStr = JSON.stringify(out, null, 2);
    if (options.out) fs.writeFileSync(options.out, jsonStr, 'utf8');
    else console.log(jsonStr);
    process.exit(0);
  }

  const textOutput = buildTextOutput();
  if (options.out) {
    try {
      fs.writeFileSync(options.out, textOutput, 'utf8');
      // still print a short confirmation to stdout
      console.log(`Reporte escrito en: ${options.out}`);
    } catch (e) {
      console.error('Error al escribir archivo:', e.message);
      console.log(textOutput);
    }
  } else {
    console.log(textOutput);
  }
})();
