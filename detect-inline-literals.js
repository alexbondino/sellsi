#!/usr/bin/env node
/**
 * detect-inline-literals.js
 * Analiza archivos (JS/TS/JSX/TSX) y reporta arrays u objetos literales inline dentro de JSX.
 * Uso básico: node detect-inline-literals.js <archivo|carpeta|glob> [...mas]
 * Flags:
 *   --json      Salida en JSON
 *   --summary   Incluye resumen (totales por tipo)
 * Ejemplos:
 *   node detect-inline-literals.js src/components/Button.jsx
 *   node detect-inline-literals.js src --summary
 *   node detect-inline-literals.js "src/**/*.{jsx,tsx}" --json --summary > report.json
 */

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { glob } = require('glob');

const VALID_EXT = new Set(['.js', '.jsx', '.ts', '.tsx']);

function printUsageAndExit(msg) {
  if (msg) console.error(`Error: ${msg}`);
  console.log(`Uso: node detect-inline-literals.js [opciones] <paths|globs>\n\nOpciones:\n  --json       Salida JSON\n  --summary    Añade resumen (totales)\n\nEjemplos:\n  node detect-inline-literals.js src/components/Button.jsx\n  node detect-inline-literals.js src --summary\n  node detect-inline-literals.js "src/**/*.{jsx,tsx}" --json --summary`);
  process.exit(1);
}

// Parse CLI args
const rawArgs = process.argv.slice(2);
if (rawArgs.length === 0) printUsageAndExit('Faltan paths.');

const options = { json: false, summary: false };
const inputPatterns = [];
for (const a of rawArgs) {
  if (a === '--json') options.json = true;
  else if (a === '--summary') options.summary = true;
  else if (a.startsWith('--')) printUsageAndExit(`Flag no reconocida: ${a}`);
  else inputPatterns.push(a);
}
if (inputPatterns.length === 0) printUsageAndExit('No se proporcionaron rutas.');

// Recolecta archivos a partir de paths o globs
async function collectFiles(patterns) {
  const collected = new Set();
  for (const p of patterns) {
    const abs = path.resolve(process.cwd(), p);
    if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
      // Recorrer recursivo
      const files = await glob('**/*.*', { cwd: abs, dot: false, nodir: true, absolute: true });
      for (const f of files) if (VALID_EXT.has(path.extname(f))) collected.add(path.normalize(f));
    } else if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
      if (VALID_EXT.has(path.extname(abs))) collected.add(path.normalize(abs));
    } else {
      // Tratar como glob
      const files = await glob(p, { absolute: true, nodir: true });
      for (const f of files) if (VALID_EXT.has(path.extname(f))) collected.add(path.normalize(f));
    }
  }
  return Array.from(collected).sort();
}

// Configuración de parser (soporta TS + JSX)
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
              issues.push({
                file: filePath,
                component: componentName,
                prop: propName,
                line: expr.loc.start.line,
                column: expr.loc.start.column + 1,
                type: expr.type === 'ArrayExpression' ? 'Array literal' : 'Object literal',
                kind: expr.type === 'ArrayExpression' ? 'array' : 'object',
                value: snippetFrom(expr, code),
                message: 'Warning: literal inline crea nueva referencia en cada render.'
              });
            }
          }
        } else if (attr.type === 'JSXSpreadAttribute') {
          const arg = attr.argument;
          if (isInlineCollection(arg)) {
            issues.push({
              file: filePath,
              component: componentName,
              prop: '{...spread}',
              line: arg.loc.start.line,
              column: arg.loc.start.column + 1,
              type: arg.type === 'ArrayExpression' ? 'Array literal (spread)' : 'Object literal (spread)',
              kind: arg.type === 'ArrayExpression' ? 'array' : 'object',
              value: snippetFrom(arg, code),
              message: 'Warning: spread de literal inline crea nueva referencia.'
            });
          }
        }
      });
      element.children.forEach(child => {
        const expr = inspectChild(child);
        if (expr) {
          issues.push({
            file: filePath,
            component: componentName,
            prop: 'children',
            line: expr.loc.start.line,
            column: expr.loc.start.column + 1,
            type: expr.type === 'ArrayExpression' ? 'Array literal (child)' : 'Object literal (child)',
            kind: expr.type === 'ArrayExpression' ? 'array' : 'object',
            value: snippetFrom(expr, code),
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
  results.forEach(r => {
    if (r.issues.length > 0) {
      summary.filesWithIssues++;
      summary.totalIssues += r.issues.length;
      r.issues.forEach(i => summary.byKind[i.kind]++);
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
  const allIssues = results.flatMap(r => r.issues);
  const summary = options.summary ? buildSummary(results) : null;

  if (options.json) {
    const out = { issues: allIssues, summary };
    console.log(JSON.stringify(out, null, 2));
    process.exit(0);
  }

  if (files.length === 1) {
    const targetPath = files[0];
    if (allIssues.length === 0) {
      console.log(`No se detectaron arrays u objetos literales inline en JSX en: ${targetPath}`);
    } else {
      console.log(`\nInline array/object literals detectados en JSX (${allIssues.length}) - Archivo: ${targetPath}\n`);
      if (typeof console.table === 'function') {
        console.table(allIssues.map(i => ({
          Componente: i.component,
            Prop: i.prop,
            Linea: i.line,
            Col: i.column,
            Tipo: i.type,
            Valor: i.value,
            Nota: 'warning'
        })));
      } else {
        allIssues.forEach(i => {
          console.log(`- [${i.line}:${i.column}] ${i.component} prop=${i.prop} (${i.type}) -> ${i.value}`);
          console.log(`  ${i.message}`);
        });
      }
    }
  } else {
    console.log(`Archivos analizados: ${files.length}`);
    if (allIssues.length === 0) {
      console.log('No se detectaron arrays/objetos inline en JSX.');
    } else {
      console.log(`Issues encontrados: ${allIssues.length}\n`);
      if (typeof console.table === 'function') {
        console.table(allIssues.map(i => ({
          Archivo: path.relative(process.cwd(), i.file),
          Componente: i.component,
          Prop: i.prop,
          Linea: i.line,
          Col: i.column,
          Tipo: i.type,
          Valor: i.value
        })));
      } else {
        allIssues.forEach(i => {
          console.log(`[${path.relative(process.cwd(), i.file)}:${i.line}:${i.column}] ${i.component} prop=${i.prop} ${i.type} -> ${i.value}`);
        });
      }
    }
  }

  if (summary) {
    console.log('\nResumen:');
    console.log(`  Archivos con issues: ${summary.filesWithIssues}/${summary.filesScanned}`);
    console.log(`  Total issues: ${summary.totalIssues}`);
    console.log(`  Arrays: ${summary.byKind.array}`);
    console.log(`  Objetos: ${summary.byKind.object}`);
  }

  console.log('\nSugerencia: extrae estos literales a constantes fuera del componente o memoriza con useMemo si dependen de props/state.');
})();
