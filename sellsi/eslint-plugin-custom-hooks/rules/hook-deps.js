// Regla personalizada para verificar dependencias de useEffect/useMemo/useCallback
// Requerimientos:
// 1. Error: dependencias usadas pero no incluidas
// 2. Warning: dependencias declaradas pero no usadas
// 3. Warning: valores inline (objetos, arrays, funciones) en el array de dependencias
// Mejora: usar el scope manager de ESLint para reducir falsos positivos y quitar uso incorrecto de "severity".

const TARGET_HOOKS = new Set(['useEffect', 'useMemo', 'useCallback']);
const BUILT_INS = new Set([
  'window','document','console','navigator','localStorage','sessionStorage',
  'setTimeout','clearTimeout','setInterval','clearInterval','requestAnimationFrame','cancelAnimationFrame'
]);

function getHookName(callee) {
  if (!callee) return null;
  if (callee.type === 'Identifier') return callee.name;
  if (callee.type === 'MemberExpression' && !callee.computed && callee.property.type === 'Identifier') {
    return callee.property.name; // React.useEffect
  }
  return null;
}

function isInline(node) {
  if (!node) return false;
  // No marcamos literales primitivos, solo estos tipos "inestables"
  return ['ArrowFunctionExpression','FunctionExpression','ObjectExpression','ArrayExpression'].includes(node.type);
}

// Recolecta variables externas usadas dentro del callback (en él y scopes hijos) usando el scope manager
function collectExternalUsedIdentifiers(callbackNode, context) {
  const sourceCode = context.getSourceCode();
  const scopeManager = sourceCode.scopeManager;
  const rootScope = scopeManager.acquire(callbackNode); // function scope del callback
  if (!rootScope) return new Set();

  const scopesInside = [];
  (function walk(scope){
    scopesInside.push(scope);
    scope.childScopes.forEach(walk);
  })(rootScope);

  // Variables locales (incluye params) definidas en todos los scopes internos
  const localNames = new Set();
  scopesInside.forEach(s => {
    s.variables.forEach(v => localNames.add(v.name));
  });

  // Referencias usadas que apuntan a variables fuera del callback
  const used = new Set();
  scopesInside.forEach(s => {
    s.references.forEach(ref => {
      const name = ref.identifier.name;
      if (localNames.has(name)) return; // es local
      if (BUILT_INS.has(name)) return; // builtin o global común
      // ref.resolved puede ser null (global implícito) o variable externa
      if (ref.resolved) {
        // Si la definición NO está en un scope interno, entonces es externa
        if (!scopesInside.includes(ref.resolved.scope)) used.add(name);
      } else {
        // No resuelto: tratamos como global, pero si no es builtin lo contamos
        used.add(name);
      }
    });
  });
  return used;
}

module.exports = {
  meta: {
    docs: { description: 'Complementa react-hooks comprobando dependencias y valores inline.' },
    type: 'problem',
    schema: [],
    messages: {
      missing: 'Dependencia faltante: {{name}}',
      unnecessary: 'Dependencia innecesaria: {{name}}',
      inline: 'Valor inline inestable en el array de dependencias'
    }
  },
  create(context) {
    return {
      CallExpression(node) {
        const hook = getHookName(node.callee);
        if (!TARGET_HOOKS.has(hook)) return;
        if (!node.arguments.length) return;
        const callback = node.arguments[0];
        const depsArg = node.arguments[1];
        if (!callback || !['ArrowFunctionExpression','FunctionExpression'].includes(callback.type)) return;

  // Identificadores externos usados (excluye params, locales, built-ins)
  const used = collectExternalUsedIdentifiers(callback, context);

        const deps = new Set();
        const inlineNodes = [];
        if (depsArg && depsArg.type === 'ArrayExpression') {
          for (const el of depsArg.elements) {
            if (!el) continue;
            if (isInline(el)) { inlineNodes.push(el); continue; }
            if (el.type === 'Identifier') deps.add(el.name);
            else if (el.type === 'MemberExpression') {
              // base object name
              let obj = el;
              while (obj && obj.type === 'MemberExpression') obj = obj.object;
              if (obj && obj.type === 'Identifier') deps.add(obj.name);
            }
          }
        }

        // Missing: used not in deps
        for (const u of used) if (!deps.has(u)) {
          context.report({ node: callback, messageId: 'missing', data: { name: u } });
        }
        // Unnecessary: deps not used
        for (const d of deps) if (!used.has(d)) {
          context.report({ node: depsArg || node, messageId: 'unnecessary', data: { name: d } });
        }
        // Inline warnings
        inlineNodes.forEach(inNode => context.report({ node: inNode, messageId: 'inline' }));
      }
    };
  }
};
