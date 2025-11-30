module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  moduleNameMapper: {
    // Mock uuid package to avoid ESM/CommonJS issues
    '^uuid$': '<rootDir>/src/__mocks__/uuid.js',
    // Mock utils/env to avoid import.meta.env issues
    '^@/utils/env$': '<rootDir>/src/__mocks__/utils/env.js',
    '^(\\.\\./)+utils/env$': '<rootDir>/src/__mocks__/utils/env.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub'
  },
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.js',
    '<rootDir>/src/__tests__/**/*.test.jsx'
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
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  moduleFileExtensions: ['js', 'jsx', 'json'],
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@testing-library|@mui|uuid))'
  ],
  // Set environment variables for tests (replacing import.meta.env)
  setupFiles: ['<rootDir>/src/__tests__/setEnvVars.js'],
}
