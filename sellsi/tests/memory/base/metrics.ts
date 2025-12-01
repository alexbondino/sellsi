/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  MÉTRICAS CDP - Funciones de Medición de Performance                      ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Funciones reutilizables para medir:                                      ║
 * ║    • Memoria (heap usage)                                                 ║
 * ║    • CDP Performance Metrics (ScriptDuration, Layout, etc.)               ║
 * ║    • Long Tasks, Layout Shifts                                            ║
 * ║    • Web Vitals (FCP, LCP, CLS, TTFB)                                     ║
 * ║    • Network y DOM metrics                                                ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import type { Page, CDPSession } from '@playwright/test';
import { CONFIG } from './config';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export interface MemorySnapshot {
  usedMB: number;
  totalMB: number;
  timestamp: Date;
  label: string;
}

export interface CDPMetrics {
  JSHeapUsedSize: number;
  JSHeapTotalSize: number;
  ScriptDuration: number;
  LayoutDuration: number;
  RecalcStyleDuration: number;
  TaskDuration: number;
  LayoutCount: number;
  RecalcStyleCount: number;
  Documents: number;
  Frames: number;
  JSEventListeners: number;
  Nodes: number;
}

export interface LongTaskDetail {
  startTime: number;
  duration: number;
  name: string;
  containerType?: string;
  containerSrc?: string;
  containerName?: string;
}

export interface LayoutShift {
  value: number;
  hadRecentInput: boolean;
  sources: string[];
}

export interface RenderBlockingResource {
  url: string;
  type: string;
  duration: number;
  renderBlocking: string;
}

export interface AdvancedMetrics {
  step: string;
  url: string;
  cycle: number;
  cdp: CDPMetrics;
  cdpDelta: Partial<CDPMetrics>;
  FCP: number | null;
  LCP: number | null;
  CLS: number | null;
  TTFB: number | null;
  INP: number | null;
  longTasks: LongTaskDetail[];
  totalBlockingTime: number;
  layoutShifts: LayoutShift[];
  totalRequests: number;
  totalSizeKB: number;
  renderBlockingResources: RenderBlockingResource[];
  slowestResources: { name: string; duration: number; type: string }[];
  domNodes: number;
  domDepth: number;
  timestamp: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// MEMORIA BÁSICA
// ═══════════════════════════════════════════════════════════════════════════

export async function getMemoryUsage(cdp: CDPSession, label: string): Promise<MemorySnapshot> {
  // Forzar GC antes de medir
  await cdp.send('HeapProfiler.collectGarbage');
  await new Promise((r) => setTimeout(r, 500));

  const metrics = await cdp.send('Runtime.getHeapUsage');

  return {
    usedMB: metrics.usedSize / 1024 / 1024,
    totalMB: metrics.totalSize / 1024 / 1024,
    timestamp: new Date(),
    label,
  };
}

export function printMemoryReport(snapshots: MemorySnapshot[]): number {
  console.log('\n' + '='.repeat(60));
  console.log('📊 REPORTE DE MEMORIA - SELLSI');
  console.log('='.repeat(60));

  snapshots.forEach((snap) => {
    console.log(`${snap.label}: ${snap.usedMB.toFixed(2)} MB`);
  });

  const initial = snapshots[0].usedMB;
  const final = snapshots[snapshots.length - 1].usedMB;
  const growth = final - initial;
  const growthPercent = ((growth / initial) * 100).toFixed(1);

  console.log('-'.repeat(60));
  console.log(`📈 Memoria inicial: ${initial.toFixed(2)} MB`);
  console.log(`📈 Memoria final:   ${final.toFixed(2)} MB`);
  console.log(`📈 Crecimiento:     ${growth.toFixed(2)} MB (${growthPercent}%)`);
  console.log('='.repeat(60));

  if (growth > CONFIG.thresholds.memoryGrowthMB) {
    console.log(`⚠️  ALERTA: Crecimiento supera umbral de ${CONFIG.thresholds.memoryGrowthMB} MB`);
  } else {
    console.log('✅ Memoria dentro de parámetros normales');
  }
  console.log('');

  return growth;
}

// ═══════════════════════════════════════════════════════════════════════════
// CDP PERFORMANCE METRICS
// ═══════════════════════════════════════════════════════════════════════════

export async function getCDPMetrics(cdp: CDPSession): Promise<CDPMetrics> {
  const { metrics } = await cdp.send('Performance.getMetrics');

  const result: CDPMetrics = {
    JSHeapUsedSize: 0,
    JSHeapTotalSize: 0,
    ScriptDuration: 0,
    LayoutDuration: 0,
    RecalcStyleDuration: 0,
    TaskDuration: 0,
    LayoutCount: 0,
    RecalcStyleCount: 0,
    Documents: 0,
    Frames: 0,
    JSEventListeners: 0,
    Nodes: 0,
  };

  metrics.forEach((m: { name: string; value: number }) => {
    if (m.name in result) {
      (result as any)[m.name] = m.value;
    }
  });

  return result;
}

export function calculateCDPDelta(
  current: CDPMetrics,
  previous: CDPMetrics | null
): Partial<CDPMetrics> {
  if (!previous) return {};

  return {
    ScriptDuration: current.ScriptDuration - previous.ScriptDuration,
    LayoutDuration: current.LayoutDuration - previous.LayoutDuration,
    RecalcStyleDuration: current.RecalcStyleDuration - previous.RecalcStyleDuration,
    TaskDuration: current.TaskDuration - previous.TaskDuration,
    LayoutCount: current.LayoutCount - previous.LayoutCount,
    RecalcStyleCount: current.RecalcStyleCount - previous.RecalcStyleCount,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// OBSERVERS (Long Tasks, Layout Shifts, Interactions)
// ═══════════════════════════════════════════════════════════════════════════

export async function setupAdvancedObservers(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).__longTasks = [];
    (window as any).__layoutShifts = [];
    (window as any).__interactions = [];

    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          const task: any = {
            startTime: entry.startTime,
            duration: entry.duration,
            name: entry.name,
          };
          if (entry.attribution && entry.attribution.length > 0) {
            const attr = entry.attribution[0];
            task.containerType = attr.containerType;
            task.containerSrc = attr.containerSrc;
            task.containerName = attr.containerName;
          }
          (window as any).__longTasks.push(task);
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      (window as any).__longTaskObserver = longTaskObserver;
    } catch (e) {}

    try {
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          (window as any).__layoutShifts.push({
            value: entry.value,
            hadRecentInput: entry.hadRecentInput,
            sources: entry.sources?.map((s: any) => s.node?.nodeName || 'unknown') || [],
          });
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      (window as any).__clsObserver = clsObserver;
    } catch (e) {}

    try {
      const inpObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          (window as any).__interactions.push({
            name: entry.name,
            duration: entry.duration,
            processingStart: entry.processingStart,
            processingEnd: entry.processingEnd,
          });
        });
      });
      inpObserver.observe({ entryTypes: ['first-input', 'event'] });
      (window as any).__inpObserver = inpObserver;
    } catch (e) {}
  });
}

export async function collectObserverData(page: Page): Promise<{
  longTasks: LongTaskDetail[];
  layoutShifts: LayoutShift[];
  worstINP: number | null;
}> {
  return await page.evaluate(() => {
    const longTasks = (window as any).__longTasks || [];
    const layoutShifts = (window as any).__layoutShifts || [];
    const interactions = (window as any).__interactions || [];

    if ((window as any).__longTaskObserver) (window as any).__longTaskObserver.disconnect();
    if ((window as any).__clsObserver) (window as any).__clsObserver.disconnect();
    if ((window as any).__inpObserver) (window as any).__inpObserver.disconnect();

    const worstINP =
      interactions.length > 0 ? Math.max(...interactions.map((i: any) => i.duration)) : null;

    return { longTasks, layoutShifts, worstINP };
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// WEB VITALS
// ═══════════════════════════════════════════════════════════════════════════

export async function getWebVitals(
  page: Page
): Promise<{ FCP: number | null; LCP: number | null; TTFB: number | null }> {
  return await page.evaluate(() => {
    const result = {
      FCP: null as number | null,
      LCP: null as number | null,
      TTFB: null as number | null,
    };

    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find((e) => e.name === 'first-contentful-paint');
    if (fcpEntry) result.FCP = fcpEntry.startTime;

    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navEntries.length > 0) {
      result.TTFB = navEntries[0].responseStart - navEntries[0].requestStart;
    }

    // @ts-ignore
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      result.LCP = (lcpEntries[lcpEntries.length - 1] as PerformanceEntry).startTime;
    }

    return result;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// NETWORK / RESOURCES
// ═══════════════════════════════════════════════════════════════════════════

export async function getResourcesWithBlocking(page: Page): Promise<{
  renderBlocking: RenderBlockingResource[];
  slowest: { name: string; duration: number; type: string }[];
  totalRequests: number;
  totalSizeKB: number;
}> {
  return await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    const renderBlocking: any[] = [];
    const allResources: any[] = [];
    let totalSize = 0;

    resources.forEach((r) => {
      const name = r.name.split('/').pop() || r.name;
      totalSize += r.transferSize || 0;

      allResources.push({
        name,
        duration: r.duration,
        type: r.initiatorType,
      });

      // @ts-ignore
      if (r.renderBlockingStatus && r.renderBlockingStatus !== 'non-blocking') {
        renderBlocking.push({
          url: name,
          type: r.initiatorType,
          duration: r.duration,
          // @ts-ignore
          renderBlocking: r.renderBlockingStatus,
        });
      }
    });

    const slowest = allResources.sort((a, b) => b.duration - a.duration).slice(0, 5);

    return {
      renderBlocking,
      slowest,
      totalRequests: resources.length,
      totalSizeKB: totalSize / 1024,
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// DOM METRICS
// ═══════════════════════════════════════════════════════════════════════════

export async function getDOMMetrics(page: Page): Promise<{ nodes: number; depth: number }> {
  return await page.evaluate(() => {
    function getMaxDepth(node: Node, depth = 0): number {
      if (node.childNodes.length === 0) return depth;
      let maxChildDepth = depth;
      node.childNodes.forEach((child) => {
        const childDepth = getMaxDepth(child, depth + 1);
        if (childDepth > maxChildDepth) maxChildDepth = childDepth;
      });
      return maxChildDepth;
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ALL, null);
    let nodes = 0;
    while (walker.nextNode()) nodes++;

    return {
      nodes,
      depth: getMaxDepth(document.body),
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MEDICIÓN COMPLETA AVANZADA
// ═══════════════════════════════════════════════════════════════════════════

let previousCDPMetrics: CDPMetrics | null = null;

export function resetPreviousCDPMetrics(): void {
  previousCDPMetrics = null;
}

export async function setPreviousCDPMetrics(cdp: CDPSession): Promise<void> {
  previousCDPMetrics = await getCDPMetrics(cdp);
}

export async function measureAdvanced(
  page: Page,
  cdp: CDPSession,
  step: string,
  cycle: number
): Promise<AdvancedMetrics> {
  // GC antes de medir
  try {
    await cdp.send('HeapProfiler.collectGarbage');
  } catch {}

  // Setup observers
  await setupAdvancedObservers(page);

  // Esperar estabilización
  await page.waitForTimeout(CONFIG.measureDelay);

  // Recoger métricas
  const [cdpMetrics, webVitals, observerData, resourceData, domMetrics] = await Promise.all([
    getCDPMetrics(cdp),
    getWebVitals(page),
    collectObserverData(page),
    getResourcesWithBlocking(page),
    getDOMMetrics(page),
  ]);

  // Calcular delta
  const cdpDelta = calculateCDPDelta(cdpMetrics, previousCDPMetrics);
  previousCDPMetrics = cdpMetrics;

  // CLS total
  const cls = observerData.layoutShifts
    .filter((ls) => !ls.hadRecentInput)
    .reduce((sum, ls) => sum + ls.value, 0);

  // TBT
  const tbt = observerData.longTasks.reduce((sum, t) => sum + Math.max(0, t.duration - 50), 0);

  return {
    step,
    url: page.url(),
    cycle,
    cdp: cdpMetrics,
    cdpDelta,
    FCP: webVitals.FCP,
    LCP: webVitals.LCP,
    CLS: cls,
    TTFB: webVitals.TTFB,
    INP: observerData.worstINP,
    longTasks: observerData.longTasks,
    totalBlockingTime: tbt,
    layoutShifts: observerData.layoutShifts,
    totalRequests: resourceData.totalRequests,
    totalSizeKB: resourceData.totalSizeKB,
    renderBlockingResources: resourceData.renderBlocking,
    slowestResources: resourceData.slowest,
    domNodes: domMetrics.nodes,
    domDepth: domMetrics.depth,
    timestamp: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// FORMATTERS
// ═══════════════════════════════════════════════════════════════════════════

export function formatMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return 'N/A';
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatBytes(kb: number): string {
  if (kb < 1024) return `${kb.toFixed(1)}KB`;
  return `${(kb / 1024).toFixed(2)}MB`;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRINTERS
// ═══════════════════════════════════════════════════════════════════════════

export function printDetailedMetrics(m: AdvancedMetrics): void {
  console.log(
    `\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓`
  );
  console.log(`┃ ${m.step.padEnd(77)}┃`);
  console.log(`┃ URL: ${m.url.substring(0, 70).padEnd(72)}┃`);
  console.log(
    `┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫`
  );

  // Web Vitals
  console.log(
    `┃ 📊 CORE WEB VITALS                                                          ┃`
  );
  console.log(
    `┃   FCP: ${formatMs(m.FCP).padStart(8)}  LCP: ${formatMs(m.LCP).padStart(8)}  CLS: ${m.CLS?.toFixed(4).padStart(7) || 'N/A'.padStart(7)}  TTFB: ${formatMs(m.TTFB).padStart(7)}  ┃`
  );

  // CDP Metrics
  console.log(
    `┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫`
  );
  console.log(
    `┃ ⚡ TIEMPO DE EJECUCIÓN (CDP - Delta desde última navegación)                ┃`
  );
  const d = m.cdpDelta;
  if (d.ScriptDuration !== undefined) {
    console.log(
      `┃   📜 JavaScript:    ${formatMs((d.ScriptDuration || 0) * 1000).padStart(10)}  ← Tiempo ejecutando scripts         ┃`
    );
    console.log(
      `┃   📐 Layout:        ${formatMs((d.LayoutDuration || 0) * 1000).padStart(10)}  ← Tiempo calculando posiciones       ┃`
    );
    console.log(
      `┃   🎨 RecalcStyle:   ${formatMs((d.RecalcStyleDuration || 0) * 1000).padStart(10)}  ← Tiempo recalculando CSS            ┃`
    );
    console.log(
      `┃   ⏱️  Task Total:    ${formatMs((d.TaskDuration || 0) * 1000).padStart(10)}  ← Tiempo total de tareas             ┃`
    );
    console.log(
      `┃   🔢 Layouts:       ${String(d.LayoutCount || 0).padStart(10)}  ← Número de reflows                  ┃`
    );
    console.log(
      `┃   🔢 RecalcStyles:  ${String(d.RecalcStyleCount || 0).padStart(10)}  ← Número de recálculos CSS           ┃`
    );
  }

  // Memoria y DOM
  console.log(
    `┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫`
  );
  console.log(
    `┃ 💾 MEMORIA Y DOM                                                            ┃`
  );
  console.log(
    `┃   Heap: ${(m.cdp.JSHeapUsedSize / 1024 / 1024).toFixed(1).padStart(6)}MB / ${(m.cdp.JSHeapTotalSize / 1024 / 1024).toFixed(1).padStart(6)}MB    DOM: ${String(m.domNodes).padStart(5)} nodos   Depth: ${m.domDepth}     ┃`
  );
  console.log(
    `┃   Event Listeners: ${String(m.cdp.JSEventListeners).padStart(5)}   Frames: ${String(m.cdp.Frames).padStart(3)}   Documents: ${String(m.cdp.Documents).padStart(3)}                  ┃`
  );

  // Long Tasks
  console.log(
    `┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫`
  );
  console.log(
    `┃ 🐌 LONG TASKS (>50ms que causan LAG)                                        ┃`
  );
  console.log(
    `┃   Total: ${String(m.longTasks.length).padStart(3)} tareas   Blocking Time: ${formatMs(m.totalBlockingTime).padStart(8)}                          ┃`
  );

  if (m.longTasks.length > 0) {
    const worst = [...m.longTasks].sort((a, b) => b.duration - a.duration).slice(0, 3);
    worst.forEach((t, i) => {
      const src = t.containerSrc ? t.containerSrc.split('/').pop()?.substring(0, 30) : 'unknown';
      console.log(
        `┃   ${i + 1}. ${formatMs(t.duration).padStart(7)} - ${(src || 'script').padEnd(35)} ┃`
      );
    });
  } else {
    console.log(
      `┃   ✅ No se detectaron long tasks                                            ┃`
    );
  }

  // Layout Shifts
  if (m.layoutShifts.length > 0) {
    console.log(
      `┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫`
    );
    console.log(
      `┃ 📐 LAYOUT SHIFTS (causan "saltos" visuales)                                 ┃`
    );
    console.log(
      `┃   Total shifts: ${m.layoutShifts.length}   CLS acumulado: ${m.CLS?.toFixed(4) || 0}                              ┃`
    );
    m.layoutShifts.slice(0, 2).forEach((ls, i) => {
      const elements = ls.sources.slice(0, 2).join(', ') || 'unknown';
      console.log(
        `┃   ${i + 1}. Score: ${ls.value.toFixed(4)} - Elementos: ${elements.substring(0, 40).padEnd(40)} ┃`
      );
    });
  }

  // Network
  console.log(
    `┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫`
  );
  console.log(
    `┃ 🌐 NETWORK                                                                   ┃`
  );
  console.log(
    `┃   Requests: ${String(m.totalRequests).padStart(4)}   Size: ${formatBytes(m.totalSizeKB).padStart(8)}                                       ┃`
  );

  if (m.renderBlockingResources.length > 0) {
    console.log(
      `┃   ⚠️ Render-blocking resources: ${m.renderBlockingResources.length}                                       ┃`
    );
    m.renderBlockingResources.slice(0, 2).forEach((r) => {
      console.log(
        `┃      - ${r.url.substring(0, 50).padEnd(50)} ${formatMs(r.duration).padStart(8)} ┃`
      );
    });
  }

  if (m.slowestResources.length > 0) {
    console.log(
      `┃   🐌 Recursos más lentos:                                                   ┃`
    );
    m.slowestResources.slice(0, 3).forEach((r) => {
      console.log(
        `┃      - ${r.name.substring(0, 40).padEnd(40)} ${formatMs(r.duration).padStart(8)} (${r.type}) ┃`
      );
    });
  }

  console.log(
    `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`
  );
}

export function printDiagnosis(allMetrics: AdvancedMetrics[]): void {
  console.log('\n');
  console.log(
    '╔═══════════════════════════════════════════════════════════════════════════════╗'
  );
  console.log(
    '║                    🔬 DIAGNÓSTICO DE CAUSAS DE LAG                            ║'
  );
  console.log(
    '╠═══════════════════════════════════════════════════════════════════════════════╣'
  );

  const totalLongTasks = allMetrics.reduce((sum, m) => sum + m.longTasks.length, 0);
  const avgScriptTime =
    (allMetrics
      .filter((m) => m.cdpDelta.ScriptDuration !== undefined)
      .reduce((sum, m) => sum + (m.cdpDelta.ScriptDuration || 0), 0) /
      allMetrics.length) *
    1000;
  const avgLayoutTime =
    (allMetrics
      .filter((m) => m.cdpDelta.LayoutDuration !== undefined)
      .reduce((sum, m) => sum + (m.cdpDelta.LayoutDuration || 0), 0) /
      allMetrics.length) *
    1000;
  const avgLayoutCount =
    allMetrics
      .filter((m) => m.cdpDelta.LayoutCount !== undefined)
      .reduce((sum, m) => sum + (m.cdpDelta.LayoutCount || 0), 0) / allMetrics.length;
  const totalBlockingTime = allMetrics.reduce((sum, m) => sum + m.totalBlockingTime, 0);
  const maxHeap = Math.max(...allMetrics.map((m) => m.cdp.JSHeapUsedSize / 1024 / 1024));

  console.log(
    '║                                                                               ║'
  );

  // JavaScript
  if (avgScriptTime > CONFIG.thresholds.scriptDurationMs) {
    console.log(
      '║ ❌ PROBLEMA: Alto tiempo de ejecución JavaScript                              ║'
    );
    console.log(
      `║    Promedio: ${formatMs(avgScriptTime).padStart(8)} por navegación                                      ║`
    );
    console.log(
      '║    SOLUCIÓN: Revisar componentes con lógica pesada, usar React.memo,         ║'
    );
    console.log(
      '║              mover cálculos a Web Workers, lazy loading de componentes       ║'
    );
  } else {
    console.log(
      '║ ✅ JavaScript: Tiempo de ejecución aceptable                                  ║'
    );
  }

  console.log(
    '║                                                                               ║'
  );

  // Layout
  if (
    avgLayoutTime > CONFIG.thresholds.layoutDurationMs ||
    avgLayoutCount > CONFIG.thresholds.layoutCount
  ) {
    console.log(
      '║ ❌ PROBLEMA: Demasiados reflows/layouts                                       ║'
    );
    console.log(
      `║    Promedio: ${formatMs(avgLayoutTime).padStart(8)} de layout, ${avgLayoutCount.toFixed(0)} layouts por navegación        ║`
    );
    console.log(
      '║    SOLUCIÓN: Evitar leer+escribir DOM en loops, usar CSS transforms,         ║'
    );
    console.log(
      '║              agrupar cambios de DOM, usar will-change en animaciones         ║'
    );
  } else {
    console.log(
      '║ ✅ Layout: Número de reflows aceptable                                        ║'
    );
  }

  console.log(
    '║                                                                               ║'
  );

  // Long Tasks
  if (
    totalLongTasks > CONFIG.thresholds.longTaskCount ||
    totalBlockingTime > CONFIG.thresholds.blockingTimeMs
  ) {
    console.log(
      '║ ❌ PROBLEMA: Long tasks bloqueando el main thread                             ║'
    );
    console.log(
      `║    Total: ${totalLongTasks} long tasks, ${formatMs(totalBlockingTime).padStart(8)} de blocking time              ║`
    );
    console.log(
      '║    SOLUCIÓN: Code splitting, defer/async en scripts, usar requestIdleCallback║'
    );
    console.log(
      '║              para tareas no urgentes, virtualizar listas largas              ║'
    );
  } else {
    console.log(
      '║ ✅ Main thread: No hay bloqueos significativos                                ║'
    );
  }

  console.log(
    '║                                                                               ║'
  );

  // Memoria
  if (maxHeap > CONFIG.thresholds.heapSizeMB) {
    console.log(
      '║ ⚠️ ALERTA: Alto uso de memoria                                                ║'
    );
    console.log(
      `║    Máximo heap: ${maxHeap.toFixed(0).padStart(4)}MB                                                       ║`
    );
    console.log(
      '║    SOLUCIÓN: Revisar memory leaks, limpiar subscripciones/listeners,         ║'
    );
    console.log(
      '║              virtualizar listas, lazy loading de datos                       ║'
    );
  } else {
    console.log(
      '║ ✅ Memoria: Uso de heap aceptable                                             ║'
    );
  }

  console.log(
    '║                                                                               ║'
  );
  console.log(
    '╠═══════════════════════════════════════════════════════════════════════════════╣'
  );
  console.log(
    '║                         📋 RESUMEN POR PÁGINA                                 ║'
  );
  console.log(
    '╠═══════════════════════════════════════════════════════════════════════════════╣'
  );
  console.log(
    '║ Paso                         │ JS Time │ Layout │ Reflows │ LongTasks │ Heap  ║'
  );
  console.log(
    '╟──────────────────────────────┼─────────┼────────┼─────────┼───────────┼───────╢'
  );

  allMetrics.forEach((m) => {
    const step = m.step.substring(0, 28).padEnd(28);
    const js = formatMs((m.cdpDelta.ScriptDuration || 0) * 1000).padStart(7);
    const layout = formatMs((m.cdpDelta.LayoutDuration || 0) * 1000).padStart(6);
    const reflows = String(m.cdpDelta.LayoutCount || 0).padStart(7);
    const lt = String(m.longTasks.length).padStart(9);
    const heap = `${(m.cdp.JSHeapUsedSize / 1024 / 1024).toFixed(0)}MB`.padStart(5);
    console.log(`║ ${step} │ ${js} │ ${layout} │ ${reflows} │ ${lt} │ ${heap} ║`);
  });

  console.log(
    '╚═══════════════════════════════════════════════════════════════════════════════╝'
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// REACT DEVTOOLS METRICS (si están disponibles)
// ═══════════════════════════════════════════════════════════════════════════

export interface ReactRenderInfo {
  componentName: string;
  renderCount: number;
  totalTime: number;
}

/**
 * Intenta capturar información de React DevTools si está disponible
 */
export async function getReactRenderInfo(page: Page): Promise<ReactRenderInfo[]> {
  return await page.evaluate(() => {
    const info: any[] = [];
    
    // Intentar acceder a React DevTools global hook
    const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook || !hook.getFiberRoots) return info;
    
    try {
      // Esto es experimental y puede no funcionar en todos los casos
      const roots = hook.getFiberRoots(1);
      if (roots && roots.size > 0) {
        // Solo indicar que React está presente
        info.push({ componentName: 'React App Detected', renderCount: 1, totalTime: 0 });
      }
    } catch (e) {
      // React DevTools no disponible o versión incompatible
    }
    
    return info;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// CSS ANIMATION METRICS
// ═══════════════════════════════════════════════════════════════════════════

export interface CSSAnimationInfo {
  totalAnimations: number;
  runningAnimations: number;
  animationNames: string[];
}

/**
 * Cuenta las animaciones CSS activas en la página
 */
export async function getCSSAnimationInfo(page: Page): Promise<CSSAnimationInfo> {
  return await page.evaluate(() => {
    const animations = document.getAnimations();
    const names = new Set<string>();
    
    animations.forEach((anim) => {
      if (anim instanceof CSSAnimation && anim.animationName) {
        names.add(anim.animationName);
      }
    });
    
    return {
      totalAnimations: animations.length,
      runningAnimations: animations.filter(a => a.playState === 'running').length,
      animationNames: Array.from(names),
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTAR CSV
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Genera un string CSV con todas las métricas para análisis externo
 */
export function generateCSV(allMetrics: AdvancedMetrics[]): string {
  const headers = [
    'Timestamp',
    'Step',
    'Cycle',
    'URL',
    'JS_Time_ms',
    'Layout_Time_ms',
    'RecalcStyle_Time_ms',
    'Task_Time_ms',
    'Layout_Count',
    'RecalcStyle_Count',
    'Heap_MB',
    'DOM_Nodes',
    'DOM_Depth',
    'Event_Listeners',
    'Long_Tasks',
    'Blocking_Time_ms',
    'FCP_ms',
    'LCP_ms',
    'CLS',
    'TTFB_ms',
    'Total_Requests',
    'Total_Size_KB',
  ];
  
  const rows = allMetrics.map((m) => [
    m.timestamp,
    `"${m.step}"`,
    m.cycle,
    `"${m.url}"`,
    ((m.cdpDelta.ScriptDuration || 0) * 1000).toFixed(2),
    ((m.cdpDelta.LayoutDuration || 0) * 1000).toFixed(2),
    ((m.cdpDelta.RecalcStyleDuration || 0) * 1000).toFixed(2),
    ((m.cdpDelta.TaskDuration || 0) * 1000).toFixed(2),
    m.cdpDelta.LayoutCount || 0,
    m.cdpDelta.RecalcStyleCount || 0,
    (m.cdp.JSHeapUsedSize / 1024 / 1024).toFixed(2),
    m.domNodes,
    m.domDepth,
    m.cdp.JSEventListeners,
    m.longTasks.length,
    m.totalBlockingTime.toFixed(2),
    m.FCP?.toFixed(2) || '',
    m.LCP?.toFixed(2) || '',
    m.CLS?.toFixed(4) || '',
    m.TTFB?.toFixed(2) || '',
    m.totalRequests,
    m.totalSizeKB.toFixed(2),
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Imprime el CSV en consola para copiar/pegar
 */
export function printCSV(allMetrics: AdvancedMetrics[]): void {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                         📊 CSV DATA (copiar/pegar)                            ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log(generateCSV(allMetrics));
  console.log('\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPARACIÓN ANTES/DESPUÉS
// ═══════════════════════════════════════════════════════════════════════════

export interface PageComparison {
  pageName: string;
  avgJSTime: number;
  avgLayoutTime: number;
  avgReflows: number;
  avgRecalcStyles: number;
  avgHeap: number;
}

/**
 * Agrupa métricas por página y calcula promedios
 */
export function getPageComparisons(allMetrics: AdvancedMetrics[]): PageComparison[] {
  const pageGroups: { [key: string]: AdvancedMetrics[] } = {};
  
  // Agrupar por nombre de página
  allMetrics.forEach((m) => {
    const pageName = extractPageName(m.step);
    if (!pageGroups[pageName]) pageGroups[pageName] = [];
    pageGroups[pageName].push(m);
  });
  
  // Calcular promedios
  return Object.entries(pageGroups).map(([pageName, metrics]) => ({
    pageName,
    avgJSTime: avg(metrics.map(m => (m.cdpDelta.ScriptDuration || 0) * 1000)),
    avgLayoutTime: avg(metrics.map(m => (m.cdpDelta.LayoutDuration || 0) * 1000)),
    avgReflows: avg(metrics.map(m => m.cdpDelta.LayoutCount || 0)),
    avgRecalcStyles: avg(metrics.map(m => m.cdpDelta.RecalcStyleCount || 0)),
    avgHeap: avg(metrics.map(m => m.cdp.JSHeapUsedSize / 1024 / 1024)),
  }));
}

function extractPageName(step: string): string {
  if (step.includes('Marketplace')) return 'Marketplace';
  if (step.includes('Pedidos')) return 'Mis Pedidos';
  if (step.includes('Ofertas')) return 'Mis Ofertas';
  if (step.includes('Product')) return 'Product Page';
  if (step.includes('Inicial')) return 'Inicial';
  return 'Otro';
}

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

/**
 * Imprime comparación por página
 */
export function printPageComparison(allMetrics: AdvancedMetrics[]): void {
  const comparisons = getPageComparisons(allMetrics);
  
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    📊 PROMEDIOS POR PÁGINA                                    ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║ Página           │ JS Time   │ Layout   │ Reflows │ RecalcCSS │ Heap        ║');
  console.log('╟──────────────────┼───────────┼──────────┼─────────┼───────────┼─────────────╢');
  
  comparisons.forEach((c) => {
    const page = c.pageName.padEnd(16);
    const js = formatMs(c.avgJSTime).padStart(9);
    const layout = formatMs(c.avgLayoutTime).padStart(8);
    const reflows = c.avgReflows.toFixed(0).padStart(7);
    const recalc = c.avgRecalcStyles.toFixed(0).padStart(9);
    const heap = `${c.avgHeap.toFixed(1)}MB`.padStart(11);
    console.log(`║ ${page} │ ${js} │ ${layout} │ ${reflows} │ ${recalc} │ ${heap} ║`);
  });
  
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
}
