module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: 'current',
      },
    }],
    ['@babel/preset-react', {
      runtime: 'automatic',
    }],
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
    // Ensure import.meta syntax is understood
    '@babel/plugin-syntax-import-meta',
    // Transform import.meta to work with Jest
    'babel-plugin-transform-import-meta',
  ],
};
