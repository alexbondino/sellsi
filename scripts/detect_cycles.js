#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

// NOTE: This improved parser requires dependencies. Install with:
// npm install @babel/parser @babel/traverse
let parser, traverse;
try {
  parser = require('@babel/parser');
  traverse = require('@babel/traverse').default;
} catch (e) {
  console.error('Missing dependency @babel/parser or @babel/traverse. Run: npm install @babel/parser @babel/traverse');
  process.exit(1);
}

const repoRoot = path.resolve(__dirname);
const srcRoot = path.join(repoRoot, 'sellsi', 'src');
const exts = ['.js','.jsx','.ts','.tsx','.mjs','.cjs'];

function walk(dir){
  const files = [];
  const entries = fs.readdirSync(dir,{withFileTypes:true});
  for(const e of entries){
    const full = path.join(dir,e.name);
    if(e.isDirectory()){
      files.push(...walk(full));
    } else if(e.isFile()){
      if(exts.includes(path.extname(e.name))){
        files.push(full);
      }
    }
  }
  return files;
}

function resolveImport(fromFile, imp){
  if(!imp) return null;
  // handle project alias @/path
  if(imp.startsWith('@/')){
    const candidate = path.join(repoRoot,'sellsi','src', imp.slice(2));
    return resolveAsFileOrIndex(candidate);
  }
  // relative imports
  if(imp.startsWith('.')){
    const candidate = path.join(path.dirname(fromFile), imp);
    return resolveAsFileOrIndex(candidate);
  }
  return null; // ignore node modules / absolute package imports
}

function resolveAsFileOrIndex(base){
  for(const e of exts){
    const f = base + e;
    if(fs.existsSync(f)) return path.resolve(f);
  }
  // try as directory index
  if(fs.existsSync(base) && fs.lstatSync(base).isDirectory()){
    for(const e of exts){
      const f = path.join(base, 'index' + e);
      if(fs.existsSync(f)) return path.resolve(f);
    }
  }
  return null;
}

function parseImports(file){
  const src = fs.readFileSync(file,'utf8');
  let ast;
  try{
    ast = parser.parse(src, {
      sourceType: 'unambiguous',
      plugins: ['jsx','typescript','classProperties','dynamicImport'],
      errorRecovery: true,
      allowImportExportEverywhere: true
    });
  } catch (e){
    // fallback: return empty
    return [];
  }
  const results = [];
  traverse(ast, {
    ImportDeclaration(p){
      const n = p.node;
      const srcVal = n.source && n.source.value;
      results.push({raw: 'import', spec: srcVal, loc: n.loc && n.loc.start});
    },
    ExportAllDeclaration(p){
      const n = p.node;
      const srcVal = n.source && n.source.value;
      if(srcVal) results.push({raw: 'export * from', spec: srcVal, loc: n.loc && n.loc.start});
    },
    ExportNamedDeclaration(p){
      const n = p.node;
      const srcVal = n.source && n.source.value;
      if(srcVal) results.push({raw: 'export { ... } from', spec: srcVal, loc: n.loc && n.loc.start});
    },
    CallExpression(p){
      const n = p.node;
      const callee = n.callee;
      if(callee && callee.type === 'Identifier' && callee.name === 'require'){
        const arg = n.arguments && n.arguments[0];
        if(arg && arg.type === 'StringLiteral'){
          results.push({raw: 'require', spec: arg.value, loc: n.loc && n.loc.start});
        }
      }
    },
    Import(p){
      // dynamic import() expressions
      const parent = p.parent;
      if(parent && parent.arguments && parent.arguments[0] && parent.arguments[0].type === 'StringLiteral'){
        results.push({raw: 'dynamic import', spec: parent.arguments[0].value, loc: parent.loc && parent.loc.start});
      }
    }
  });
  return results;
}

// --- CLI OPTIONS -----------------------------------------------------------
const args = process.argv.slice(2);
function getArg(key, def){
  const idx = args.indexOf(key);
  if(idx === -1) return def;
  const val = args[idx+1];
  if(!val || val.startsWith('--')) return true; // flag style
  return val;
}

const optMaxLen = parseInt(getArg('--max-len', '12'),10) || 12;
const optFormat = getArg('--format','json'); // json | pretty | md
const optInclude = getArg('--include', null); // substring filter
const optIgnore = getArg('--ignore', null); // substring filter
const optCiFail = !!getArg('--ci-fail', false);
const optShowAll = !!getArg('--show-all', false);
const optWhitelistFile = getArg('--whitelist', null);
const optBreak = !!getArg('--suggest-breaks', false);
const optOutput = getArg('--output', null); // when format=md (or others) write to file

const tStart = Date.now();
let files = walk(srcRoot);
if(optInclude){
  files = files.filter(f=>f.includes(optInclude));
}
if(optIgnore){
  files = files.filter(f=>!f.includes(optIgnore));
}

const graph = new Map();
const edgeMeta = {};
for(const f of files){
  const imps = parseImports(f);
  const edges = new Set();
  for(const imp of imps){
    const resolved = resolveImport(f, imp.spec);
    if(resolved){
      edges.add(resolved);
      // store direction a->b
      if(!edgeMeta[`${f}-->${resolved}`]){
        edgeMeta[`${f}-->${resolved}`] = { type: imp.raw, spec: imp.spec, line: imp.loc && imp.loc.line || null, col: imp.loc && imp.loc.column || null };
      }
    }
  }
  graph.set(f, Array.from(edges));
}

// find cycles using DFS up to a given max length (copy visited for more exhaustive coverage)
const cycles = [];
const maxLen = optMaxLen;

function findCyclesFrom(start){
  const stack = [start];
  function visit(node, visited){
    if(stack.length > maxLen) return;
    const neighbors = graph.get(node) || [];
    for(const n of neighbors){
      if(n === start && stack.length > 1){
        cycles.push([...stack, start]);
      } else if(!visited.has(n)){
        visited = new Set(visited); // copy for branch
        visited.add(n);
        stack.push(n);
        visit(n, visited);
        stack.pop();
      }
    }
  }
  visit(start, new Set([start]));
}

const nodes = Array.from(graph.keys());
for(const n of nodes){
  findCyclesFrom(n);
}

// canonicalize cycles (orientation + rotation)
function canonicalCycle(arr){
  const norm = (list)=>{
    const rots = list.map((_,i)=>list.slice(i).concat(list.slice(0,i)));
    rots.sort((a,b)=>a.join('|').localeCompare(b.join('|')));
    return rots[0];
  };
  const r1 = norm(arr);
  const r2 = norm([...arr].reverse());
  return r1.join('|') <= r2.join('|') ? r1 : r2;
}

const seen = new Set();
const uniqueCycles = [];
for(const c of cycles){
  const core = c.slice(0,-1);
  const cc = canonicalCycle(core);
  const key = cc.join('->');
  if(!seen.has(key)){
    seen.add(key);
    uniqueCycles.push(cc);
  }
}

// heuristics to suggest break edges
function suggestBreakEdges(cycle){
  const suggestions = [];
  for(let i=0;i<cycle.length;i++){
    const a = cycle[i];
    const b = cycle[(i+1)%cycle.length];
    const meta = edgeMeta[`${a}-->${b}`];
    if(!meta) continue;
    const aBase = path.basename(a).toLowerCase();
    const bBase = path.basename(b).toLowerCase();
    const score = (
      (aBase === 'index.js' ? 2 : 0) +
      (bBase === 'index.js' ? 1 : 0) +
      (meta.type === 'dynamic import' ? 2 : 0) +
      (meta.type === 'export { ... } from' || meta.type === 'export * from' ? 1 : 0)
    );
    suggestions.push({from:a,to:b,score,reason:meta.type,meta});
  }
  suggestions.sort((a,b)=>b.score-a.score);
  return suggestions.slice(0,3); // top 3
}

const cyclesOutput = uniqueCycles.map(cycle=>{
  const edges = [];
  for(let i=0;i<cycle.length;i++){
    const a = cycle[i];
    const b = cycle[(i+1)%cycle.length];
    const meta = edgeMeta[`${a}-->${b}`] || null;
    edges.push({
      from: path.relative(repoRoot,a),
      to: path.relative(repoRoot,b),
      meta
    });
  }
  return {
    size: cycle.length,
    nodes: cycle.map(n=>path.relative(repoRoot,n)),
    edges,
    breakCandidates: optBreak ? suggestBreakEdges(cycle).map(c=>({
      from: path.relative(repoRoot,c.from),
      to: path.relative(repoRoot,c.to),
      score: c.score,
      reason: c.reason,
      meta: c.meta
    })) : undefined
  };
});

// Optionally include all edges (non-cycle) for debugging
let allEdgesOutput;
if(optShowAll){
  allEdgesOutput = Object.entries(edgeMeta).map(([k,v])=>{
    const [from,to] = k.split('-->');
    return {from: path.relative(repoRoot,from), to: path.relative(repoRoot,to), meta: v};
  });
}

const durationMs = Date.now()-tStart;
const summary = {
  scannedFiles: files.length,
  edges: Object.keys(edgeMeta).length,
  cycles: cyclesOutput.length,
  maxLen,
  durationMs
};

if(optFormat === 'pretty'){
  function hr(len=80){ return '-'.repeat(len); }
  console.log(`Cycle Detector Report`);
  console.log(hr());
  console.log(`Files scanned: ${summary.scannedFiles}`);
  console.log(`Edges: ${summary.edges}`);
  console.log(`Cycles: ${summary.cycles}`);
  console.log(`Max cycle length considered: ${summary.maxLen}`);
  console.log(`Duration: ${summary.durationMs} ms`);
  console.log(hr());
  cyclesOutput.forEach((c,idx)=>{
    console.log(`Cycle #${idx+1} (size=${c.size})`);
    console.log(' Nodes:');
    c.nodes.forEach(n=>console.log(`  - ${n}`));
    console.log(' Edges:');
    c.edges.forEach(e=>{
      const m = e.meta || {}; 
      console.log(`  ${e.from} -> ${e.to} [${m.type || '?'} spec=${m.spec || ''} line=${m.line || ''}]`);
    });
    if(c.breakCandidates){
      console.log(' Break candidates:');
      c.breakCandidates.forEach(b=>{
        console.log(`   * ${b.from} -> ${b.to} (score=${b.score}, reason=${b.reason})`);
      });
    }
    console.log(hr());
  });
  if(allEdgesOutput){
    console.log('All edges (debug):');
    allEdgesOutput.forEach(e=>{
      console.log(`  ${e.from} -> ${e.to} [${e.meta.type} spec=${e.meta.spec}]`);
    });
  }
} else if (optFormat === 'md') {
  // Build Markdown content
  const lines = [];
  lines.push(`# Cycle Detector Report`); 
  lines.push('');
  lines.push(`**Summary**`);
  lines.push('');
  lines.push(`- Files scanned: ${summary.scannedFiles}`);
  lines.push(`- Edges: ${summary.edges}`);
  lines.push(`- Cycles: ${summary.cycles}`);
  lines.push(`- Max cycle length considered: ${summary.maxLen}`);
  lines.push(`- Duration: ${summary.durationMs} ms`);
  lines.push('');
  if(cyclesOutput.length){
    lines.push(`## Cycles (${cyclesOutput.length})`);
    lines.push('');
    cyclesOutput.forEach((c, idx)=>{
      lines.push(`### Cycle ${idx+1} (size=${c.size})`);
      lines.push('**Nodes:**');
      c.nodes.forEach(n=>lines.push(`- ${n}`));
      lines.push('');
      lines.push('**Edges:**');
      c.edges.forEach(e=>{
        const m = e.meta || {}; 
        lines.push(`- ${e.from} -> ${e.to} (type: ${m.type || '?'} | spec: ${m.spec || ''} | line: ${m.line || ''})`);
      });
      if(c.breakCandidates){
        lines.push('');
        lines.push('**Break candidates:**');
        c.breakCandidates.forEach(b=>{
          lines.push(`- ${b.from} -> ${b.to} (score=${b.score}, reason=${b.reason})`);
        });
      }
      lines.push('');
      lines.push('---');
      lines.push('');
    });
  } else {
    lines.push('No cycles detected.');
  }
  if(allEdgesOutput){
    lines.push('');
    lines.push('## All Edges (debug)');
    allEdgesOutput.forEach(e=>{
      lines.push(`- ${e.from} -> ${e.to} (type: ${e.meta.type} | spec: ${e.meta.spec})`);
    });
  }
  const md = lines.join('\n');
  if(optOutput){
    try {
      const outPath = path.isAbsolute(optOutput) ? optOutput : path.join(repoRoot, optOutput);
      const dir = path.dirname(outPath);
      fs.mkdirSync(dir, {recursive:true});
      fs.writeFileSync(outPath, md, 'utf8');
      console.log(`Markdown report written to ${outPath}`);
    } catch(err){
      console.error('Failed to write markdown output:', err.message);
      process.exit(1);
    }
  } else {
    console.log(md);
  }
} else {
  const payload = { summary, cycles: cyclesOutput, allEdges: allEdgesOutput };
  console.log(JSON.stringify(payload, null, 2));
}

// Whitelist handling / CI fail
if(optWhitelistFile && fs.existsSync(optWhitelistFile)){
  const wl = new Set(fs.readFileSync(optWhitelistFile,'utf8').split(/\r?\n/).map(l=>l.trim()).filter(Boolean));
  const notWhitelisted = cyclesOutput.filter(c=>{
    const key = c.nodes.join('->');
    return !wl.has(key);
  });
  if(optCiFail && notWhitelisted.length){
    console.error(`CI FAIL: ${notWhitelisted.length} non-whitelisted cycle(s) detected.`);
    process.exit(2);
  }
} else if(optCiFail && cyclesOutput.length){
  console.error(`CI FAIL: ${cyclesOutput.length} cycle(s) detected.`);
  process.exit(2);
}
