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
    // Transform import.meta to work with Jest
    'babel-plugin-transform-import-meta',
  ],
};
