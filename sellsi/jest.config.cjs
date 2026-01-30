module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  moduleNameMapper: {
    // Mock uuid package to avoid ESM/CommonJS issues
    '^uuid$': '<rootDir>/src/__mocks__/uuid.js',
    // Mock utils/env to avoid import.meta.env issues
    '^@/utils/env$': '<rootDir>/src/__mocks__/utils/env.js',
    '^(\\.\\./)+utils/env$': '<rootDir>/src/__mocks__/utils/env.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^((?:\\.\\.\\/){3,})(shared/.*)$': '<rootDir>/src/$2',
    '^((?:\\.\\.\\/){1,})(workspaces/.*)$': '<rootDir>/src/$2',
    '\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub'
  },
  testMatch: [
    '<rootDir>/src/tests/**/*.test.js',
    '<rootDir>/src/tests/**/*.test.jsx'
  ],
  collectCoverageFrom: [
    'src/stores/offerStore.js',
    'src/domains/notifications/services/notificationService.js',
    'src/domains/**/hooks/*.js',
    'src/domains/**/components/*.jsx',
    '!src/__tests__/**/*',
    '!src/**/node_modules/**'
  ],
  testTimeout: 10000,
  verbose: true,
  transform: {
    '^.+\\.[tj]sx?$': '<rootDir>/scripts/jest-transform-preprocess.cjs'
  },
  extensionsToTreatAsEsm: ['.jsx'],
  moduleFileExtensions: ['js', 'jsx', 'mjs', 'json'],
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@testing-library|@mui|uuid))'
  ],
  // Set environment variables for tests (replacing import.meta.env)
  setupFiles: ['<rootDir>/src/tests/setEnvVars.js'],
}
