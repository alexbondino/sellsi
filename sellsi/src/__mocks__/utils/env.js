/**
 * Mock for src/utils/env.js
 * Jest will automatically use this file instead of the real one
 */

const isTest = true;

function getEnv(key) {
  return process.env[key];
}

const ENV = {
  get VITE_USE_MOCKS() {
    return process.env.VITE_USE_MOCKS === 'true';
  },
  get VITE_SUPABASE_URL() {
    return process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
  },
  get VITE_SUPABASE_ANON_KEY() {
    return process.env.VITE_SUPABASE_ANON_KEY || 'test-key';
  },
  get VITE_PRICE_SUMMARY_TTL_MS() {
    return process.env.VITE_PRICE_SUMMARY_TTL_MS;
  },
  get MODE() {
    return 'test';
  },
  get DEV() {
    return false;
  },
  get PROD() {
    return false;
  },
  isTest: true,
};

module.exports = { getEnv, ENV, default: ENV };
