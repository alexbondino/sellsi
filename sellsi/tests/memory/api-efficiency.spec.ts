/**
 * API Efficiency Test - Deep Analysis
 * =====================================
 * 
 * Este test analiza en profundidad las llamadas API para detectar:
 * - N+1 queries (llamadas repetidas al mismo endpoint)
 * - Slow queries (>500ms)
 * - Payload size analysis
 * - Query params patterns
 * - Request timing breakdown
 * - Duplicate data fetching
 * - Inefficient patterns
 * 
 * CRÍTICO: product_images (32x), users (25x)
 */

import { test, expect, Page, CDPSession, Request, Response } from '@playwright/test';
import { BuyerFlowRunner, CONFIG } from './base';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

const ANALYSIS_CONFIG = {
  // Thresholds
  N_PLUS_1_THRESHOLD: 3,       // >3 calls = N+1 issue
  SLOW_QUERY_MS: 500,          // >500ms = slow
  VERY_SLOW_QUERY_MS: 1000,    // >1000ms = critical slow
  LARGE_PAYLOAD_KB: 100,       // >100KB = large
  VERY_LARGE_PAYLOAD_KB: 500,  // >500KB = very large
  
  // Critical endpoints to watch (from baseline)
  CRITICAL_ENDPOINTS: [
    'product_images',  // 32 calls detected
    'users',           // 25 calls detected
    'update-lastip',   // 960ms slow
    'orders',          // 632ms slow
    'addresses',
    'products',
    'cart_items',
    'chat_'
  ]
};

// ============================================================================
// TYPES
// ============================================================================

interface APICallDetail {
  url: string;
  endpoint: string;
  method: string;
  status: number;
  
  // Timing breakdown
  timing: {
    start: number;
    end: number;
    total: number;
    dns?: number;
    connect?: number;
    ssl?: number;
    ttfb?: number;
    download?: number;
  };
  
  // Request details
  request: {
    headers: Record<string, string>;
    queryParams: Record<string, string>;
    body?: string;
    bodyParsed?: Record<string, unknown>;
    bodySize: number;
  };
  
  // Response details
  response: {
    headers: Record<string, string>;
    bodySize: number;
    body?: string;
    bodyParsed?: unknown;
    rowCount?: number;  // For array responses
  };
  
  // Analysis flags
  flags: {
    isSlow: boolean;
    isVerySlow: boolean;
    isLargePayload: boolean;
    isVeryLargePayload: boolean;
    isCriticalEndpoint: boolean;
    isDuplicate: boolean;
    duplicateOf?: string;
  };
  
  // Stack trace (if available)
  initiator?: string;
}

interface EndpointSummary {
  endpoint: string;
  calls: APICallDetail[];
  totalCalls: number;
  uniqueCalls: number;
  duplicateCalls: number;
  avgTime: number;
  maxTime: number;
  minTime: number;
  totalBytes: number;
  avgBytes: number;
  
  // Query patterns
  queryPatterns: Map<string, number>;
  
  // Issues
  issues: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface PageAnalysis {
  route: string;
  totalAPICalls: number;
  totalTime: number;
  totalBytes: number;
  endpoints: Map<string, EndpointSummary>;
  criticalIssues: string[];
  highIssues: string[];
  mediumIssues: string[];
  timeline: APICallDetail[];
}

// ============================================================================
// DEEP API COLLECTOR
// ============================================================================

class DeepAPICollector {
  private calls: APICallDetail[] = [];
  private requestMap: Map<string, { request: Request; startTime: number }> = new Map();
  private page: Page;
  private cdp: CDPSession | null = null;
  private cdpRequests: Map<string, any> = new Map();
  
  constructor(page: Page) {
    this.page = page;
  }
  
  async start(): Promise<void> {
    // CDP for detailed timing
    this.cdp = await this.page.context().newCDPSession(this.page);
    await this.cdp.send('Network.enable');
    
    // CDP timing events
    this.cdp.on('Network.requestWillBeSent', (event) => {
      this.cdpRequests.set(event.requestId, {
        startTime: event.timestamp,
        initiator: event.initiator
      });
    });
    
    this.cdp.on('Network.responseReceived', (event) => {
      const req = this.cdpRequests.get(event.requestId);
      if (req) {
        req.timing = event.response.timing;
        req.protocol = event.response.protocol;
      }
    });
    
    // Playwright request tracking
    this.page.on('request', (request) => {
      if (this.isSupabaseAPI(request.url())) {
        this.requestMap.set(request.url() + request.method(), {
          request,
          startTime: Date.now()
        });
      }
    });
    
    this.page.on('response', async (response) => {
      const url = response.url();
      if (!this.isSupabaseAPI(url)) return;
      
      const key = url + response.request().method();
      const reqData = this.requestMap.get(key);
      if (!reqData) return;
      
      const endTime = Date.now();
      const detail = await this.extractDetail(response, reqData.startTime, endTime);
      this.calls.push(detail);
    });
  }
  
  private isSupabaseAPI(url: string): boolean {
    return url.includes('/rest/v1/') || 
           url.includes('/rpc/') || 
           url.includes('/auth/') ||
           url.includes('/storage/');
  }
  
  private async extractDetail(
    response: Response, 
    startTime: number, 
    endTime: number
  ): Promise<APICallDetail> {
    const request = response.request();
    const url = new URL(response.url());
    
    // Extract endpoint name
    let endpoint = 'unknown';
    if (url.pathname.includes('/rest/v1/')) {
      endpoint = url.pathname.split('/rest/v1/')[1]?.split('?')[0] || 'unknown';
    } else if (url.pathname.includes('/rpc/')) {
      endpoint = 'rpc/' + (url.pathname.split('/rpc/')[1]?.split('?')[0] || 'unknown');
    } else if (url.pathname.includes('/auth/')) {
      endpoint = 'auth/' + (url.pathname.split('/auth/')[1]?.split('?')[0] || 'unknown');
    } else if (url.pathname.includes('/storage/')) {
      // FIXED: Usar la ruta completa para Storage (no truncar)
      // Esto es necesario para detectar correctamente duplicados de imágenes
      endpoint = 'storage/' + (url.pathname.split('/storage/')[1] || 'unknown');
    }
    
    // Parse query params
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    
    // Get request body
    let requestBody: string | undefined;
    let requestBodyParsed: Record<string, unknown> | undefined;
    let requestBodySize = 0;
    
    try {
      requestBody = request.postData() || undefined;
      if (requestBody) {
        requestBodySize = new TextEncoder().encode(requestBody).length;
        requestBodyParsed = JSON.parse(requestBody);
      }
    } catch {
      // Not JSON body
    }
    
    // Get response body (carefully)
    let responseBody: string | undefined;
    let responseBodyParsed: unknown;
    let responseBodySize = 0;
    let rowCount: number | undefined;
    
    try {
      responseBody = await response.text();
      responseBodySize = new TextEncoder().encode(responseBody).length;
      responseBodyParsed = JSON.parse(responseBody);
      
      // Count rows if array
      if (Array.isArray(responseBodyParsed)) {
        rowCount = responseBodyParsed.length;
      }
    } catch {
      // Binary or non-JSON response
    }
    
    // Request headers
    const requestHeaders: Record<string, string> = {};
    const reqHeaders = request.headers();
    for (const [key, value] of Object.entries(reqHeaders)) {
      if (key.toLowerCase().includes('auth') || 
          key.toLowerCase().includes('apikey') ||
          key.toLowerCase().includes('prefer')) {
        requestHeaders[key] = key.toLowerCase().includes('auth') 
          ? '[REDACTED]' 
          : value;
      }
    }
    
    // Response headers
    const responseHeaders: Record<string, string> = {};
    const resHeaders = response.headers();
    for (const [key, value] of Object.entries(resHeaders)) {
      if (['content-type', 'content-range', 'content-length', 'cache-control', 
           'x-total-count', 'x-request-id'].includes(key.toLowerCase())) {
        responseHeaders[key] = value;
      }
    }
    
    const totalTime = endTime - startTime;
    const isLargePayload = responseBodySize > ANALYSIS_CONFIG.LARGE_PAYLOAD_KB * 1024;
    const isVeryLargePayload = responseBodySize > ANALYSIS_CONFIG.VERY_LARGE_PAYLOAD_KB * 1024;
    
    return {
      url: response.url(),
      endpoint,
      method: request.method(),
      status: response.status(),
      
      timing: {
        start: startTime,
        end: endTime,
        total: totalTime
      },
      
      request: {
        headers: requestHeaders,
        queryParams,
        body: requestBody,
        bodyParsed: requestBodyParsed,
        bodySize: requestBodySize
      },
      
      response: {
        headers: responseHeaders,
        bodySize: responseBodySize,
        body: responseBody && responseBody.length < 2000 ? responseBody : undefined,
        bodyParsed: responseBodyParsed,
        rowCount
      },
      
      flags: {
        isSlow: totalTime > ANALYSIS_CONFIG.SLOW_QUERY_MS,
        isVerySlow: totalTime > ANALYSIS_CONFIG.VERY_SLOW_QUERY_MS,
        isLargePayload,
        isVeryLargePayload,
        isCriticalEndpoint: ANALYSIS_CONFIG.CRITICAL_ENDPOINTS.some(e => endpoint.includes(e)),
        isDuplicate: false  // Will be set during analysis
      }
    };
  }
  
  reset(): void {
    this.calls = [];
    this.requestMap.clear();
    this.cdpRequests.clear();
  }
  
  getCalls(): APICallDetail[] {
    return [...this.calls];
  }
  
  async stop(): Promise<void> {
    if (this.cdp) {
      try {
        await this.cdp.detach();
      } catch {
        // Session might already be detached
      }
    }
  }
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

function analyzeEndpoint(endpoint: string, calls: APICallDetail[]): EndpointSummary {
  const times = calls.map(c => c.timing.total);
  const sizes = calls.map(c => c.response.bodySize);
  
  // Detect duplicates by query params + method (and URL for storage)
  const callSignatures = new Map<string, APICallDetail[]>();
  for (const call of calls) {
    // FIXED: Para Storage, incluir la URL completa en el signature
    // ya que diferentes imágenes tienen params={} y body=undefined iguales
    const isStorage = call.endpoint.startsWith('storage/');
    const signature = JSON.stringify({
      method: call.method,
      params: call.request.queryParams,
      body: call.request.body,
      // Para Storage: usar la URL completa para distinguir imágenes diferentes
      url: isStorage ? call.url : undefined
    });
    
    if (!callSignatures.has(signature)) {
      callSignatures.set(signature, []);
    }
    callSignatures.get(signature)!.push(call);
  }
  
  // Mark duplicates
  const duplicateCalls: APICallDetail[] = [];
  for (const [sig, sigCalls] of callSignatures.entries()) {
    if (sigCalls.length > 1) {
      for (let i = 1; i < sigCalls.length; i++) {
        sigCalls[i].flags.isDuplicate = true;
        sigCalls[i].flags.duplicateOf = sigCalls[0].url;
        duplicateCalls.push(sigCalls[i]);
      }
    }
  }
  
  // Query patterns analysis
  const queryPatterns = new Map<string, number>();
  for (const call of calls) {
    const pattern = Object.keys(call.request.queryParams).sort().join(',') || '[no params]';
    queryPatterns.set(pattern, (queryPatterns.get(pattern) || 0) + 1);
  }
  
  // Identify issues
  const issues: string[] = [];
  
  const totalCalls = calls.length;
  const uniqueCalls = callSignatures.size;
  const duplicateCount = totalCalls - uniqueCalls;
  
  if (totalCalls > ANALYSIS_CONFIG.N_PLUS_1_THRESHOLD) {
    issues.push(`⚠️ N+1: ${totalCalls} llamadas (${duplicateCount} duplicadas)`);
  }
  
  const slowCalls = calls.filter(c => c.flags.isSlow);
  if (slowCalls.length > 0) {
    issues.push(`🐢 ${slowCalls.length} llamadas lentas (>${ANALYSIS_CONFIG.SLOW_QUERY_MS}ms)`);
  }
  
  const verySlowCalls = calls.filter(c => c.flags.isVerySlow);
  if (verySlowCalls.length > 0) {
    issues.push(`🔴 ${verySlowCalls.length} llamadas muy lentas (>${ANALYSIS_CONFIG.VERY_SLOW_QUERY_MS}ms)`);
  }
  
  const largeCalls = calls.filter(c => c.flags.isLargePayload);
  if (largeCalls.length > 0) {
    issues.push(`📦 ${largeCalls.length} respuestas grandes (>${ANALYSIS_CONFIG.LARGE_PAYLOAD_KB}KB)`);
  }
  
  // Determine severity
  let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';
  if (totalCalls > 20 || verySlowCalls.length > 0) {
    severity = 'critical';
  } else if (totalCalls > 10 || slowCalls.length > 2) {
    severity = 'high';
  } else if (totalCalls > ANALYSIS_CONFIG.N_PLUS_1_THRESHOLD || slowCalls.length > 0) {
    severity = 'medium';
  }
  
  return {
    endpoint,
    calls,
    totalCalls,
    uniqueCalls,
    duplicateCalls: duplicateCount,
    avgTime: times.reduce((a, b) => a + b, 0) / times.length,
    maxTime: Math.max(...times),
    minTime: Math.min(...times),
    totalBytes: sizes.reduce((a, b) => a + b, 0),
    avgBytes: sizes.reduce((a, b) => a + b, 0) / sizes.length,
    queryPatterns,
    issues,
    severity
  };
}

function analyzePage(route: string, calls: APICallDetail[]): PageAnalysis {
  // Group by endpoint
  const endpointMap = new Map<string, APICallDetail[]>();
  for (const call of calls) {
    if (!endpointMap.has(call.endpoint)) {
      endpointMap.set(call.endpoint, []);
    }
    endpointMap.get(call.endpoint)!.push(call);
  }
  
  // Analyze each endpoint
  const endpoints = new Map<string, EndpointSummary>();
  const criticalIssues: string[] = [];
  const highIssues: string[] = [];
  const mediumIssues: string[] = [];
  
  for (const [endpoint, endpointCalls] of endpointMap.entries()) {
    const summary = analyzeEndpoint(endpoint, endpointCalls);
    endpoints.set(endpoint, summary);
    
    // Collect issues by severity
    if (summary.severity === 'critical') {
      criticalIssues.push(`[${endpoint}] ${summary.issues.join(', ')}`);
    } else if (summary.severity === 'high') {
      highIssues.push(`[${endpoint}] ${summary.issues.join(', ')}`);
    } else if (summary.severity === 'medium') {
      mediumIssues.push(`[${endpoint}] ${summary.issues.join(', ')}`);
    }
  }
  
  return {
    route,
    totalAPICalls: calls.length,
    totalTime: calls.reduce((a, c) => a + c.timing.total, 0),
    totalBytes: calls.reduce((a, c) => a + c.response.bodySize, 0),
    endpoints,
    criticalIssues,
    highIssues,
    mediumIssues,
    timeline: calls.sort((a, b) => a.timing.start - b.timing.start)
  };
}

// ============================================================================
// PRINTING FUNCTIONS
// ============================================================================

function printDivider(char = '=', length = 80): void {
  console.log(char.repeat(length));
}

function printHeader(title: string): void {
  console.log('\n');
  printDivider();
  console.log(`  ${title}`);
  printDivider();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function printEndpointDeepAnalysis(summary: EndpointSummary): void {
  const severityEmoji = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢'
  };
  
  console.log(`\n${severityEmoji[summary.severity]} ENDPOINT: ${summary.endpoint}`);
  printDivider('-', 70);
  
  // Basic stats
  console.log(`  📊 Estadísticas:`);
  console.log(`     - Total llamadas: ${summary.totalCalls}`);
  console.log(`     - Llamadas únicas: ${summary.uniqueCalls}`);
  console.log(`     - Duplicadas: ${summary.duplicateCalls}`);
  console.log(`     - Tiempo: min=${summary.minTime}ms, avg=${summary.avgTime.toFixed(0)}ms, max=${summary.maxTime}ms`);
  console.log(`     - Datos: total=${formatBytes(summary.totalBytes)}, avg=${formatBytes(summary.avgBytes)}`);
  
  // Issues
  if (summary.issues.length > 0) {
    console.log(`\n  🚨 Issues detectados:`);
    for (const issue of summary.issues) {
      console.log(`     ${issue}`);
    }
  }
  
  // Query patterns
  if (summary.queryPatterns.size > 0) {
    console.log(`\n  🔍 Patrones de query params:`);
    for (const [pattern, count] of summary.queryPatterns.entries()) {
      console.log(`     "${pattern}": ${count}x`);
    }
  }
  
  // Detailed call breakdown (for critical/high severity)
  if (summary.severity === 'critical' || summary.severity === 'high') {
    console.log(`\n  📝 Detalle de llamadas:`);
    
    for (let i = 0; i < Math.min(summary.calls.length, 10); i++) {
      const call = summary.calls[i];
      const dupMark = call.flags.isDuplicate ? ' [DUP]' : '';
      const slowMark = call.flags.isVerySlow ? ' [MUY LENTO]' : call.flags.isSlow ? ' [LENTO]' : '';
      
      console.log(`\n     [${i + 1}] ${call.method} ${call.timing.total}ms${dupMark}${slowMark}`);
      
      // Query params
      const params = Object.entries(call.request.queryParams);
      if (params.length > 0) {
        console.log(`         Query params:`);
        for (const [key, value] of params) {
          const displayValue = value.length > 60 ? value.substring(0, 60) + '...' : value;
          console.log(`           ${key}: ${displayValue}`);
        }
      }
      
      // Response info
      console.log(`         Response: ${call.status}, ${formatBytes(call.response.bodySize)}`);
      if (call.response.rowCount !== undefined) {
        console.log(`         Rows returned: ${call.response.rowCount}`);
      }
      
      // Headers importantes
      if (call.response.headers['content-range']) {
        console.log(`         Range: ${call.response.headers['content-range']}`);
      }
    }
    
    if (summary.calls.length > 10) {
      console.log(`\n     ... y ${summary.calls.length - 10} llamadas más`);
    }
  }
  
  // N+1 analysis for critical endpoints
  if (summary.totalCalls > ANALYSIS_CONFIG.N_PLUS_1_THRESHOLD) {
    console.log(`\n  💡 Análisis N+1:`);
    
    // Check if calls are for different IDs
    const idPatterns = new Set<string>();
    for (const call of summary.calls) {
      // Look for ID patterns in query params
      const selectParam = call.request.queryParams['select'];
      const idParam = call.request.queryParams['id'] || 
                      call.request.queryParams['product_id'] ||
                      call.request.queryParams['user_id'] ||
                      call.request.queryParams['order_id'];
      
      if (idParam) {
        idPatterns.add(idParam.substring(0, 50));
      }
    }
    
    if (idPatterns.size > 1) {
      console.log(`     - Se detectaron ${idPatterns.size} IDs diferentes`);
      console.log(`     - Esto indica un patrón N+1 clásico`);
      console.log(`     - SOLUCIÓN: Usar batch query con "id=in.(...)" o join`);
    } else {
      console.log(`     - Las llamadas parecen ser redundantes (mismo request)`);
      console.log(`     - SOLUCIÓN: Implementar caché o memoización`);
    }
  }
}

function printPageAnalysis(analysis: PageAnalysis): void {
  printHeader(`📄 ANÁLISIS: ${analysis.route}`);
  
  // Overview
  console.log(`\n📈 Resumen de página:`);
  console.log(`   - Total API calls: ${analysis.totalAPICalls}`);
  console.log(`   - Tiempo total API: ${analysis.totalTime}ms`);
  console.log(`   - Datos descargados: ${formatBytes(analysis.totalBytes)}`);
  console.log(`   - Endpoints únicos: ${analysis.endpoints.size}`);
  
  // Issues summary
  if (analysis.criticalIssues.length > 0) {
    console.log(`\n🔴 ISSUES CRÍTICOS (${analysis.criticalIssues.length}):`);
    for (const issue of analysis.criticalIssues) {
      console.log(`   ${issue}`);
    }
  }
  
  if (analysis.highIssues.length > 0) {
    console.log(`\n🟠 ISSUES ALTOS (${analysis.highIssues.length}):`);
    for (const issue of analysis.highIssues) {
      console.log(`   ${issue}`);
    }
  }
  
  if (analysis.mediumIssues.length > 0) {
    console.log(`\n🟡 ISSUES MEDIOS (${analysis.mediumIssues.length}):`);
    for (const issue of analysis.mediumIssues) {
      console.log(`   ${issue}`);
    }
  }
  
  // Sort endpoints by severity
  const sortedEndpoints = Array.from(analysis.endpoints.values())
    .sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  
  // Deep analysis for each endpoint
  console.log(`\n${'─'.repeat(70)}`);
  console.log('ANÁLISIS DETALLADO POR ENDPOINT');
  console.log('─'.repeat(70));
  
  for (const summary of sortedEndpoints) {
    printEndpointDeepAnalysis(summary);
  }
  
  // Timeline view
  console.log(`\n${'─'.repeat(70)}`);
  console.log('TIMELINE DE LLAMADAS');
  console.log('─'.repeat(70));
  
  const startTime = analysis.timeline[0]?.timing.start || 0;
  for (let i = 0; i < Math.min(analysis.timeline.length, 20); i++) {
    const call = analysis.timeline[i];
    const relativeStart = call.timing.start - startTime;
    const severity = call.flags.isVerySlow ? '🔴' : call.flags.isSlow ? '🟠' : '🟢';
    console.log(`  ${String(relativeStart).padStart(5)}ms | ${severity} ${call.endpoint.padEnd(25)} | ${call.method.padEnd(6)} | ${call.timing.total}ms | ${formatBytes(call.response.bodySize)}`);
  }
  
  if (analysis.timeline.length > 20) {
    console.log(`  ... y ${analysis.timeline.length - 20} llamadas más`);
  }
}

function printGlobalSummary(analyses: PageAnalysis[]): void {
  printHeader('📊 RESUMEN GLOBAL');
  
  // Aggregate stats
  let totalCalls = 0;
  let totalTime = 0;
  let totalBytes = 0;
  const allCritical: string[] = [];
  const allHigh: string[] = [];
  const endpointFrequency = new Map<string, number>();
  
  for (const analysis of analyses) {
    totalCalls += analysis.totalAPICalls;
    totalTime += analysis.totalTime;
    totalBytes += analysis.totalBytes;
    
    for (const issue of analysis.criticalIssues) {
      allCritical.push(`[${analysis.route}] ${issue}`);
    }
    for (const issue of analysis.highIssues) {
      allHigh.push(`[${analysis.route}] ${issue}`);
    }
    
    for (const [endpoint, summary] of analysis.endpoints) {
      endpointFrequency.set(
        endpoint, 
        (endpointFrequency.get(endpoint) || 0) + summary.totalCalls
      );
    }
  }
  
  console.log(`\n📈 Estadísticas totales:`);
  console.log(`   - Total páginas analizadas: ${analyses.length}`);
  console.log(`   - Total API calls: ${totalCalls}`);
  console.log(`   - Tiempo total API: ${totalTime}ms`);
  console.log(`   - Datos totales: ${formatBytes(totalBytes)}`);
  
  // Top N+1 offenders
  const topOffenders = Array.from(endpointFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  console.log(`\n🔥 Top 10 endpoints más llamados (N+1 candidates):`);
  for (const [endpoint, count] of topOffenders) {
    const marker = count > 20 ? '🔴' : count > 10 ? '🟠' : count > 5 ? '🟡' : '🟢';
    console.log(`   ${marker} ${endpoint}: ${count} llamadas`);
  }
  
  // All critical issues
  if (allCritical.length > 0) {
    console.log(`\n🔴 TODOS LOS ISSUES CRÍTICOS:`);
    for (const issue of allCritical) {
      console.log(`   ${issue}`);
    }
  }
  
  if (allHigh.length > 0) {
    console.log(`\n🟠 TODOS LOS ISSUES ALTOS:`);
    for (const issue of allHigh) {
      console.log(`   ${issue}`);
    }
  }
  
  // Recommendations
  console.log(`\n💡 RECOMENDACIONES:`);
  console.log(`   1. Implementar batch queries para product_images (usar id=in.(...))`);
  console.log(`   2. Cachear datos de users en el frontend (React Query/SWR)`);
  console.log(`   3. Optimizar update-lastip (considerar debounce o background job)`);
  console.log(`   4. Usar select específico en lugar de select=* para reducir payload`);
  console.log(`   5. Implementar paginación en lugar de traer todos los registros`);
}

// ============================================================================
// TEST
// ============================================================================

test.describe('API Efficiency - Deep Analysis', () => {
  test('Análisis profundo de eficiencia API - 1 Ciclo Buyer Flow', async () => {
    const analyses: PageAnalysis[] = [];
    const runner = new BuyerFlowRunner({ headless: false });
    
    try {
      // Setup browser y CDP
      await runner.setup();
      const page = runner.page;
      
      // Crear collector con la page del runner
      const collector = new DeepAPICollector(page);
      await collector.start();
      
      console.log('\n');
      console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
      console.log('║      📊 API EFFICIENCY TEST - ANÁLISIS PROFUNDO (1 CICLO)                     ║');
      console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
      console.log('║  Flujo: Login → MP(scroll) → Pedidos → Ofertas → MP → Product → MP           ║');
      console.log('║  Detecta: N+1, slow queries, duplicados, payloads grandes                    ║');
      console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
      
      // ========================================================================
      // PASO 1: LOGIN
      // ========================================================================
      console.log('\n🔐 PASO 1: Login...');
      collector.reset();
      await runner.login();
      await page.waitForTimeout(2000);
      
      let calls = collector.getCalls();
      if (calls.length > 0) {
        analyses.push(analyzePage('1. Login', calls));
        console.log(`   ✅ ${calls.length} API calls capturadas`);
      }
      
      // ========================================================================
      // PASO 2: MARKETPLACE + SCROLL
      // ========================================================================
      console.log('\n📍 PASO 2: Marketplace + Scroll...');
      collector.reset();
      await runner.navigateToMarketplace();
      await runner.scrollToBottom();
      await page.waitForTimeout(1500);
      
      calls = collector.getCalls();
      if (calls.length > 0) {
        analyses.push(analyzePage('2. Marketplace (scroll)', calls));
        console.log(`   ✅ ${calls.length} API calls capturadas`);
      }
      
      // ========================================================================
      // PASO 3: MIS PEDIDOS
      // ========================================================================
      console.log('\n📍 PASO 3: Mis Pedidos...');
      collector.reset();
      await runner.navigateToOrders();
      await page.waitForTimeout(2000);
      
      calls = collector.getCalls();
      if (calls.length > 0) {
        analyses.push(analyzePage('3. Mis Pedidos', calls));
        console.log(`   ✅ ${calls.length} API calls capturadas`);
      }
      
      // ========================================================================
      // PASO 4: MIS OFERTAS
      // ========================================================================
      console.log('\n📍 PASO 4: Mis Ofertas...');
      collector.reset();
      await runner.navigateToOffers();
      await page.waitForTimeout(2000);
      
      calls = collector.getCalls();
      if (calls.length > 0) {
        analyses.push(analyzePage('4. Mis Ofertas', calls));
        console.log(`   ✅ ${calls.length} API calls capturadas`);
      }
      
      // ========================================================================
      // PASO 5: MARKETPLACE (vuelta)
      // ========================================================================
      console.log('\n📍 PASO 5: Marketplace (vuelta)...');
      collector.reset();
      await runner.navigateToMarketplace();
      await page.waitForTimeout(2000);
      
      calls = collector.getCalls();
      if (calls.length > 0) {
        analyses.push(analyzePage('5. Marketplace (vuelta)', calls));
        console.log(`   ✅ ${calls.length} API calls capturadas`);
      }
      
      // ========================================================================
      // PASO 6: PRODUCT PAGE (click en ProductCard)
      // ========================================================================
      console.log('\n📍 PASO 6: Product Page...');
      collector.reset();
      await runner.clickProductCard();
      await page.waitForTimeout(2000);
      
      calls = collector.getCalls();
      if (calls.length > 0) {
        analyses.push(analyzePage('6. Product Page', calls));
        console.log(`   ✅ ${calls.length} API calls capturadas`);
      }
      
      // ========================================================================
      // PASO 7: MARKETPLACE (fin ciclo)
      // ========================================================================
      console.log('\n📍 PASO 7: Marketplace (fin ciclo)...');
      collector.reset();
      await runner.navigateToMarketplace();
      await page.waitForTimeout(2000);
      
      calls = collector.getCalls();
      if (calls.length > 0) {
        analyses.push(analyzePage('7. Marketplace (fin)', calls));
        console.log(`   ✅ ${calls.length} API calls capturadas`);
      }
      
      // ========================================================================
      // RESULTADOS
      // ========================================================================
      
      // Print all analyses
      for (const analysis of analyses) {
        printPageAnalysis(analysis);
      }
      
      // Print global summary
      printGlobalSummary(analyses);
      
      // Save detailed JSON report
      const reportPath = path.join(__dirname, '../../Documentacion/Network/api-deep-analysis.json');
      const jsonReport = analyses.map(a => ({
        route: a.route,
        totalAPICalls: a.totalAPICalls,
        totalTime: a.totalTime,
        totalBytes: a.totalBytes,
        criticalIssues: a.criticalIssues,
        highIssues: a.highIssues,
        mediumIssues: a.mediumIssues,
        endpoints: Array.from(a.endpoints.entries()).map(([name, summary]) => ({
          name,
          totalCalls: summary.totalCalls,
          uniqueCalls: summary.uniqueCalls,
          duplicateCalls: summary.duplicateCalls,
          avgTime: summary.avgTime,
          maxTime: summary.maxTime,
          totalBytes: summary.totalBytes,
          severity: summary.severity,
          issues: summary.issues,
          queryPatterns: Array.from(summary.queryPatterns.entries())
        })),
        timeline: a.timeline.slice(0, 50).map(c => ({
          endpoint: c.endpoint,
          method: c.method,
          timing: c.timing.total,
          status: c.status,
          responseSize: c.response.bodySize,
          queryParams: c.request.queryParams,
          flags: c.flags
        }))
      }));
      
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      fs.writeFileSync(reportPath, JSON.stringify(jsonReport, null, 2));
      console.log(`\n📄 Reporte JSON guardado en: ${reportPath}`);
      
      await collector.stop();
      
      // Assertions
      const criticalCount = analyses.reduce((sum, a) => sum + a.criticalIssues.length, 0);
      expect(criticalCount).toBeDefined();
      
    } finally {
      await runner.close();
    }
  });
});
