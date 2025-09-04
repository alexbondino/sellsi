// Plugin ESLint estándar: eslint-plugin-custom-hooks
// Exporta la regla hook-deps

module.exports = {
  rules: {
    'hook-deps': require('./rules/hook-deps.js')
  }
};
