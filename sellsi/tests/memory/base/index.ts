/**
 * Base modules for E2E tests
 * 
 * Usage:
 *   import { CONFIG, ROUTES, SELECTORS } from './base';
 *   import { BuyerFlowRunner, createBuyerFlowRunner } from './base';
 *   import { measureAdvanced, printDiagnosis, getMemoryUsage } from './base';
 */

// Config
export { CONFIG, ROUTES, SELECTORS } from './config';
export type { TestConfig, AppRoutes, DOMSelectors } from './config';

// Buyer Flow
export { BuyerFlowRunner, createBuyerFlowRunner } from './buyer-flow';
export type { BrowserSetup, FlowOptions } from './buyer-flow';

// Metrics
export {
  // Memory
  getMemoryUsage,
  printMemoryReport,
  // CDP
  getCDPMetrics,
  calculateCDPDelta,
  resetPreviousCDPMetrics,
  setPreviousCDPMetrics,
  // Observers
  setupAdvancedObservers,
  collectObserverData,
  // Web Vitals
  getWebVitals,
  // Resources
  getResourcesWithBlocking,
  // DOM
  getDOMMetrics,
  // Advanced
  measureAdvanced,
  // Formatters
  formatMs,
  formatBytes,
  // Printers
  printDetailedMetrics,
  printDiagnosis,
  // NEW: Additional analysis
  getCSSAnimationInfo,
  getReactRenderInfo,
  generateCSV,
  printCSV,
  getPageComparisons,
  printPageComparison,
} from './metrics';

export type {
  MemorySnapshot,
  CDPMetrics,
  LongTaskDetail,
  LayoutShift,
  RenderBlockingResource,
  AdvancedMetrics,
  CSSAnimationInfo,
  ReactRenderInfo,
  PageComparison,
} from './metrics';
