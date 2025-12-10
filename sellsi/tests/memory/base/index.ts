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
export type { BrowserSetup, FlowOptions, AddedProductInfo } from './buyer-flow';

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
  // Network Metrics
  NetworkMetricsCollector,
  calculateNetworkTotals,
  printNetworkPageSummary,
  printNetworkTotalSummary,
  generateNetworkCSV,
  printNetworkCSV,
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
  // Network types
  NetworkRequest,
  NetworkPageMetrics,
  NetworkTestResult,
} from './metrics';
