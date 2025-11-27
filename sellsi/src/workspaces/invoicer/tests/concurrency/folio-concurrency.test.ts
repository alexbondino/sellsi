/**
 * Tests de Concurrencia para Gestión de Folios
 * 
 * §6 de CERTIFICACION.md - Pruebas de stress y atomicidad
 * 
 * Estos tests verifican que:
 * 1. No se generan folios duplicados bajo concurrencia
 * 2. Los folios se liberan correctamente en caso de error
 * 3. El sistema maneja correctamente múltiples peticiones simultáneas
 * 4. La performance es adecuada para producción
 */

import { EventEmitter } from 'events';

// ============================================
// FolioLockManager - Simulación de atomicidad
// ============================================

interface FolioRange {
  tipoDte: number;
  folioDesde: number;
  folioHasta: number;
  folioActual: number;
  cafXml: string;
}

interface FolioResult {
  folio: number;
  cafXml: string;
  released: boolean;
}

/**
 * Gestor de folios con locks para atomicidad
 * Simula el comportamiento de get_next_folio RPC en PostgreSQL
 */
class FolioLockManager {
  private ranges: Map<number, FolioRange> = new Map();
  private locks: Map<number, boolean> = new Map();
  private usedFolios: Map<number, Set<number>> = new Map();
  private pendingFolios: Map<string, FolioResult> = new Map();
  private lockQueue: Map<number, Array<() => void>> = new Map();

  /**
   * Registra un rango de folios (CAF)
   */
  registerRange(tipoDte: number, folioDesde: number, folioHasta: number, cafXml: string): void {
    this.ranges.set(tipoDte, {
      tipoDte,
      folioDesde,
      folioHasta,
      folioActual: folioDesde,
      cafXml,
    });
    this.usedFolios.set(tipoDte, new Set());
    this.locks.set(tipoDte, false);
    this.lockQueue.set(tipoDte, []);
  }

  /**
   * Obtiene el siguiente folio de forma atómica
   * Implementa locking para simular transacciones de base de datos
   */
  async getNextFolio(tipoDte: number): Promise<FolioResult> {
    // Verificar que existe el rango ANTES de intentar adquirir lock
    const range = this.ranges.get(tipoDte);
    if (!range) {
      throw new Error(`No hay CAF registrado para tipo DTE ${tipoDte}`);
    }

    // Esperar si hay lock activo
    await this.acquireLock(tipoDte);
    
    try {
      if (range.folioActual > range.folioHasta) {
        throw new Error(`Folios agotados para tipo DTE ${tipoDte}`);
      }

      const folio = range.folioActual;
      range.folioActual++;

      // Verificar que no sea duplicado (doble check)
      const usados = this.usedFolios.get(tipoDte)!;
      if (usados.has(folio)) {
        throw new Error(`Folio ${folio} ya fue usado - ERROR DE CONCURRENCIA`);
      }

      // Marcar como pendiente (no confirmado aún)
      const pendingKey = `${tipoDte}-${folio}`;
      const result: FolioResult = {
        folio,
        cafXml: range.cafXml,
        released: false,
      };
      this.pendingFolios.set(pendingKey, result);

      return result;
    } finally {
      this.releaseLock(tipoDte);
    }
  }

  /**
   * Confirma el uso de un folio (commit)
   */
  async confirmFolio(tipoDte: number, folio: number): Promise<void> {
    await this.acquireLock(tipoDte);
    
    try {
      const pendingKey = `${tipoDte}-${folio}`;
      const pending = this.pendingFolios.get(pendingKey);
      
      if (!pending) {
        throw new Error(`Folio ${folio} no está pendiente de confirmación`);
      }

      if (pending.released) {
        throw new Error(`Folio ${folio} ya fue liberado`);
      }

      // Marcar como usado definitivamente
      this.usedFolios.get(tipoDte)!.add(folio);
      this.pendingFolios.delete(pendingKey);
    } finally {
      this.releaseLock(tipoDte);
    }
  }

  /**
   * Libera un folio en caso de error (rollback)
   */
  async releaseFolio(tipoDte: number, folio: number): Promise<boolean> {
    await this.acquireLock(tipoDte);
    
    try {
      const pendingKey = `${tipoDte}-${folio}`;
      const pending = this.pendingFolios.get(pendingKey);
      
      if (!pending) {
        // Ya fue confirmado o nunca existió
        return false;
      }

      if (pending.released) {
        return false;
      }

      // Solo se puede liberar si es el último folio obtenido
      const range = this.ranges.get(tipoDte)!;
      if (folio === range.folioActual - 1) {
        // Retroceder el contador
        range.folioActual = folio;
        pending.released = true;
        this.pendingFolios.delete(pendingKey);
        return true;
      }

      // No es el último, marcar como liberado pero no reutilizable
      pending.released = true;
      this.pendingFolios.delete(pendingKey);
      return false;
    } finally {
      this.releaseLock(tipoDte);
    }
  }

  /**
   * Obtiene estadísticas del rango
   */
  getStats(tipoDte: number): { disponibles: number; usados: number; pendientes: number } {
    const range = this.ranges.get(tipoDte);
    if (!range) {
      return { disponibles: 0, usados: 0, pendientes: 0 };
    }

    const usados = this.usedFolios.get(tipoDte)!.size;
    let pendientes = 0;
    this.pendingFolios.forEach((_, key) => {
      if (key.startsWith(`${tipoDte}-`)) pendientes++;
    });

    return {
      disponibles: range.folioHasta - range.folioActual + 1,
      usados,
      pendientes,
    };
  }

  /**
   * Verifica si un folio fue usado
   */
  isFolioUsed(tipoDte: number, folio: number): boolean {
    return this.usedFolios.get(tipoDte)?.has(folio) ?? false;
  }

  /**
   * Limpia todos los datos (para tests)
   */
  reset(): void {
    this.ranges.clear();
    this.locks.clear();
    this.usedFolios.clear();
    this.pendingFolios.clear();
    this.lockQueue.clear();
  }

  // ---- Métodos privados de locking ----

  private async acquireLock(tipoDte: number): Promise<void> {
    return new Promise(resolve => {
      const isLocked = this.locks.get(tipoDte);
      
      if (!isLocked) {
        this.locks.set(tipoDte, true);
        resolve();
      } else {
        // Agregar a la cola
        this.lockQueue.get(tipoDte)!.push(resolve);
      }
    });
  }

  private releaseLock(tipoDte: number): void {
    const queue = this.lockQueue.get(tipoDte);
    
    if (queue && queue.length > 0) {
      // Dar el lock al siguiente en la cola
      const next = queue.shift()!;
      next();
    } else {
      this.locks.set(tipoDte, false);
    }
  }
}

// ============================================
// TESTS DE CONCURRENCIA
// ============================================

describe('§6 Tests de Concurrencia - Gestión de Folios', () => {
  let folioManager: FolioLockManager;

  const TIPO_FACTURA = 33;
  const TIPO_BOLETA = 39;
  const CAF_XML_MOCK = '<CAF><DA><TD>33</TD></DA></CAF>';

  beforeEach(() => {
    folioManager = new FolioLockManager();
    // Registrar rango de prueba: folios 1-1000
    folioManager.registerRange(TIPO_FACTURA, 1, 1000, CAF_XML_MOCK);
  });

  afterEach(() => {
    folioManager.reset();
  });

  // ============================================
  // TESTS BÁSICOS DE ATOMICIDAD
  // ============================================
  describe('Atomicidad básica', () => {
    it('debe obtener folios secuenciales', async () => {
      const folio1 = await folioManager.getNextFolio(TIPO_FACTURA);
      const folio2 = await folioManager.getNextFolio(TIPO_FACTURA);
      const folio3 = await folioManager.getNextFolio(TIPO_FACTURA);

      expect(folio1.folio).toBe(1);
      expect(folio2.folio).toBe(2);
      expect(folio3.folio).toBe(3);
    });

    it('debe retornar CAF XML junto con el folio', async () => {
      const result = await folioManager.getNextFolio(TIPO_FACTURA);

      expect(result.cafXml).toBe(CAF_XML_MOCK);
    });

    it('debe lanzar error cuando no hay CAF registrado', async () => {
      await expect(folioManager.getNextFolio(TIPO_BOLETA))
        .rejects.toThrow('No hay CAF registrado');
    });

    it('debe lanzar error cuando se agotan los folios', async () => {
      // Registrar rango pequeño
      folioManager.registerRange(TIPO_BOLETA, 1, 3, CAF_XML_MOCK);

      await folioManager.getNextFolio(TIPO_BOLETA);
      await folioManager.getNextFolio(TIPO_BOLETA);
      await folioManager.getNextFolio(TIPO_BOLETA);

      await expect(folioManager.getNextFolio(TIPO_BOLETA))
        .rejects.toThrow('Folios agotados');
    });
  });

  // ============================================
  // TESTS DE CONFIRMACIÓN Y LIBERACIÓN
  // ============================================
  describe('Confirmación y liberación de folios', () => {
    it('debe confirmar folio correctamente', async () => {
      const result = await folioManager.getNextFolio(TIPO_FACTURA);
      
      await folioManager.confirmFolio(TIPO_FACTURA, result.folio);

      expect(folioManager.isFolioUsed(TIPO_FACTURA, result.folio)).toBe(true);
    });

    it('debe liberar folio en caso de error', async () => {
      const result1 = await folioManager.getNextFolio(TIPO_FACTURA);
      
      // Simular error y liberar
      const released = await folioManager.releaseFolio(TIPO_FACTURA, result1.folio);
      
      expect(released).toBe(true);
      
      // El siguiente debe ser el mismo folio
      const result2 = await folioManager.getNextFolio(TIPO_FACTURA);
      
      expect(result2.folio).toBe(result1.folio);
    });

    it('no debe liberar folio ya confirmado', async () => {
      const result = await folioManager.getNextFolio(TIPO_FACTURA);
      
      await folioManager.confirmFolio(TIPO_FACTURA, result.folio);
      
      const released = await folioManager.releaseFolio(TIPO_FACTURA, result.folio);
      
      expect(released).toBe(false);
    });

    it('no debe liberar folio que no es el último', async () => {
      const result1 = await folioManager.getNextFolio(TIPO_FACTURA);
      const result2 = await folioManager.getNextFolio(TIPO_FACTURA);
      
      // Intentar liberar el primero (no el último)
      const released = await folioManager.releaseFolio(TIPO_FACTURA, result1.folio);
      
      expect(released).toBe(false);
      
      // El siguiente NO debe ser result1.folio
      const result3 = await folioManager.getNextFolio(TIPO_FACTURA);
      
      expect(result3.folio).toBe(result2.folio + 1);
    });

    it('debe rechazar confirmación de folio inexistente', async () => {
      await expect(folioManager.confirmFolio(TIPO_FACTURA, 999))
        .rejects.toThrow('no está pendiente');
    });

    it('debe rechazar confirmación de folio ya liberado', async () => {
      const result = await folioManager.getNextFolio(TIPO_FACTURA);
      
      await folioManager.releaseFolio(TIPO_FACTURA, result.folio);
      
      await expect(folioManager.confirmFolio(TIPO_FACTURA, result.folio))
        .rejects.toThrow('no está pendiente');
    });
  });

  // ============================================
  // TESTS DE CONCURRENCIA PARALELA
  // ============================================
  describe('Concurrencia paralela - Sin duplicados', () => {
    it('debe manejar 10 peticiones simultáneas sin duplicados', async () => {
      const numRequests = 10;
      
      const promises = Array.from({ length: numRequests }, () =>
        folioManager.getNextFolio(TIPO_FACTURA)
      );

      const results = await Promise.all(promises);
      const folios = results.map(r => r.folio);

      // Verificar que todos son únicos
      const uniqueFolios = new Set(folios);
      expect(uniqueFolios.size).toBe(numRequests);

      // Verificar que son secuenciales (aunque no en orden)
      const sorted = [...folios].sort((a, b) => a - b);
      expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it('debe manejar 100 peticiones simultáneas sin duplicados', async () => {
      const numRequests = 100;
      
      const promises = Array.from({ length: numRequests }, () =>
        folioManager.getNextFolio(TIPO_FACTURA)
      );

      const results = await Promise.all(promises);
      const folios = results.map(r => r.folio);

      // Verificar unicidad
      const uniqueFolios = new Set(folios);
      expect(uniqueFolios.size).toBe(numRequests);

      // Verificar rango correcto
      expect(Math.min(...folios)).toBe(1);
      expect(Math.max(...folios)).toBe(numRequests);
    });

    it('debe manejar 500 peticiones simultáneas sin duplicados (stress)', async () => {
      const numRequests = 500;
      
      const promises = Array.from({ length: numRequests }, () =>
        folioManager.getNextFolio(TIPO_FACTURA)
      );

      const results = await Promise.all(promises);
      const folios = results.map(r => r.folio);

      // Verificar unicidad total
      const uniqueFolios = new Set(folios);
      expect(uniqueFolios.size).toBe(numRequests);
    });

    it('debe manejar peticiones para múltiples tipos de DTE simultáneamente', async () => {
      // Registrar rango para boletas
      folioManager.registerRange(TIPO_BOLETA, 1, 1000, '<CAF><DA><TD>39</TD></DA></CAF>');

      const numEach = 50;
      
      const facturaPromises = Array.from({ length: numEach }, () =>
        folioManager.getNextFolio(TIPO_FACTURA)
      );
      
      const boletaPromises = Array.from({ length: numEach }, () =>
        folioManager.getNextFolio(TIPO_BOLETA)
      );

      const [facturaResults, boletaResults] = await Promise.all([
        Promise.all(facturaPromises),
        Promise.all(boletaPromises),
      ]);

      const facturaFolios = facturaResults.map(r => r.folio);
      const boletaFolios = boletaResults.map(r => r.folio);

      // Ambos deben ser únicos dentro de su tipo
      expect(new Set(facturaFolios).size).toBe(numEach);
      expect(new Set(boletaFolios).size).toBe(numEach);

      // Ambos deben empezar desde 1
      expect(Math.min(...facturaFolios)).toBe(1);
      expect(Math.min(...boletaFolios)).toBe(1);
    });
  });

  // ============================================
  // TESTS DE RACE CONDITIONS
  // ============================================
  describe('Race conditions', () => {
    it('debe manejar obtención y liberación intercaladas', async () => {
      const results: number[] = [];
      
      // Simular patrón: obtener, liberar, obtener, confirmar...
      const iterations = 20;
      
      for (let i = 0; i < iterations; i++) {
        const result = await folioManager.getNextFolio(TIPO_FACTURA);
        
        if (i % 3 === 0) {
          // Cada 3ra iteración: liberar y volver a obtener
          await folioManager.releaseFolio(TIPO_FACTURA, result.folio);
          const newResult = await folioManager.getNextFolio(TIPO_FACTURA);
          await folioManager.confirmFolio(TIPO_FACTURA, newResult.folio);
          results.push(newResult.folio);
        } else {
          await folioManager.confirmFolio(TIPO_FACTURA, result.folio);
          results.push(result.folio);
        }
      }

      // Todos deben ser únicos
      expect(new Set(results).size).toBe(iterations);
    });

    it('debe mantener consistencia con confirmaciones paralelas', async () => {
      const numRequests = 30;
      
      // Obtener todos los folios
      const results = await Promise.all(
        Array.from({ length: numRequests }, () =>
          folioManager.getNextFolio(TIPO_FACTURA)
        )
      );

      // Confirmar todos en paralelo
      await Promise.all(
        results.map(r => folioManager.confirmFolio(TIPO_FACTURA, r.folio))
      );

      // Verificar que todos están usados
      results.forEach(r => {
        expect(folioManager.isFolioUsed(TIPO_FACTURA, r.folio)).toBe(true);
      });
    });

    it('debe manejar patrón de retry con liberación', async () => {
      const attempts = 5;
      let successFolio: number | null = null;

      for (let i = 0; i < attempts; i++) {
        const result = await folioManager.getNextFolio(TIPO_FACTURA);
        
        // Simular fallo aleatorio (excepto último intento)
        const shouldFail = i < attempts - 1 && Math.random() > 0.5;
        
        if (shouldFail) {
          await folioManager.releaseFolio(TIPO_FACTURA, result.folio);
        } else {
          await folioManager.confirmFolio(TIPO_FACTURA, result.folio);
          successFolio = result.folio;
          break;
        }
      }

      expect(successFolio).not.toBeNull();
      expect(folioManager.isFolioUsed(TIPO_FACTURA, successFolio!)).toBe(true);
    });
  });

  // ============================================
  // TESTS DE ESTADÍSTICAS
  // ============================================
  describe('Estadísticas bajo carga', () => {
    it('debe reportar estadísticas correctas', async () => {
      const statsInicial = folioManager.getStats(TIPO_FACTURA);
      
      expect(statsInicial.disponibles).toBe(1000);
      expect(statsInicial.usados).toBe(0);
      expect(statsInicial.pendientes).toBe(0);

      // Obtener 10 folios
      const results = await Promise.all(
        Array.from({ length: 10 }, () => folioManager.getNextFolio(TIPO_FACTURA))
      );

      const statsPendientes = folioManager.getStats(TIPO_FACTURA);
      
      expect(statsPendientes.disponibles).toBe(990);
      expect(statsPendientes.usados).toBe(0);
      expect(statsPendientes.pendientes).toBe(10);

      // Confirmar 5
      await Promise.all(
        results.slice(0, 5).map(r => folioManager.confirmFolio(TIPO_FACTURA, r.folio))
      );

      const statsConfirmados = folioManager.getStats(TIPO_FACTURA);
      
      expect(statsConfirmados.usados).toBe(5);
      expect(statsConfirmados.pendientes).toBe(5);
    });

    it('debe mantener estadísticas consistentes bajo concurrencia', async () => {
      const numRequests = 100;
      
      // Obtener todos
      const results = await Promise.all(
        Array.from({ length: numRequests }, () =>
          folioManager.getNextFolio(TIPO_FACTURA)
        )
      );

      // Confirmar mitad
      await Promise.all(
        results.slice(0, numRequests / 2).map(r =>
          folioManager.confirmFolio(TIPO_FACTURA, r.folio)
        )
      );

      const stats = folioManager.getStats(TIPO_FACTURA);
      
      expect(stats.usados).toBe(numRequests / 2);
      expect(stats.pendientes).toBe(numRequests / 2);
      expect(stats.disponibles).toBe(1000 - numRequests);
    });
  });

  // ============================================
  // TESTS DE PERFORMANCE
  // ============================================
  describe('Performance', () => {
    it('debe procesar 1000 folios en menos de 1 segundo', async () => {
      const iterations = 1000;
      
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const result = await folioManager.getNextFolio(TIPO_FACTURA);
        await folioManager.confirmFolio(TIPO_FACTURA, result.folio);
      }
      
      const elapsed = performance.now() - start;
      
      expect(elapsed).toBeLessThan(1000); // Menos de 1 segundo
      
      // Log para referencia
      console.log(`Performance: ${iterations} folios en ${elapsed.toFixed(2)}ms`);
      console.log(`Throughput: ${((iterations / elapsed) * 1000).toFixed(0)} folios/segundo`);
    });

    it('debe mantener performance con concurrencia alta', async () => {
      const numRequests = 500;
      
      const start = performance.now();
      
      const results = await Promise.all(
        Array.from({ length: numRequests }, () =>
          folioManager.getNextFolio(TIPO_FACTURA)
        )
      );
      
      await Promise.all(
        results.map(r => folioManager.confirmFolio(TIPO_FACTURA, r.folio))
      );
      
      const elapsed = performance.now() - start;
      
      expect(elapsed).toBeLessThan(2000); // Menos de 2 segundos para 500 ops paralelas
      
      console.log(`Concurrencia: ${numRequests} folios paralelos en ${elapsed.toFixed(2)}ms`);
    });
  });

  // ============================================
  // TESTS DE EDGE CASES
  // ============================================
  describe('Edge cases', () => {
    it('debe manejar rango de un solo folio', async () => {
      folioManager.registerRange(52, 1, 1, '<CAF><DA><TD>52</TD></DA></CAF>');
      
      const result = await folioManager.getNextFolio(52);
      expect(result.folio).toBe(1);
      
      await expect(folioManager.getNextFolio(52))
        .rejects.toThrow('Folios agotados');
    });

    it('debe manejar rango empezando en número alto', async () => {
      folioManager.registerRange(56, 99901, 100000, '<CAF/>');
      
      const result = await folioManager.getNextFolio(56);
      
      expect(result.folio).toBe(99901);
    });

    it('debe aislar rangos de diferentes tipos de DTE', async () => {
      folioManager.registerRange(TIPO_BOLETA, 500, 600, '<CAF/>');
      
      // Usar todos los de factura no afecta boleta
      for (let i = 0; i < 100; i++) {
        await folioManager.getNextFolio(TIPO_FACTURA);
      }
      
      const boletaResult = await folioManager.getNextFolio(TIPO_BOLETA);
      
      expect(boletaResult.folio).toBe(500);
    });

    it('debe manejar reset correctamente', async () => {
      await folioManager.getNextFolio(TIPO_FACTURA);
      await folioManager.getNextFolio(TIPO_FACTURA);
      
      folioManager.reset();
      
      // Debe requerir nuevo registro
      await expect(folioManager.getNextFolio(TIPO_FACTURA))
        .rejects.toThrow('No hay CAF registrado');
    });

    it('debe manejar liberaciones múltiples del mismo folio', async () => {
      const result = await folioManager.getNextFolio(TIPO_FACTURA);
      
      const released1 = await folioManager.releaseFolio(TIPO_FACTURA, result.folio);
      expect(released1).toBe(true);
      
      // Segunda liberación debe fallar
      const released2 = await folioManager.releaseFolio(TIPO_FACTURA, result.folio);
      expect(released2).toBe(false);
    });
  });

  // ============================================
  // TESTS DE SIMULACIÓN REAL
  // ============================================
  describe('Simulación de escenario real', () => {
    it('debe simular emisión masiva de facturas', async () => {
      const numFacturas = 100;
      const errores: Error[] = [];
      const exitosos: number[] = [];

      // Simular 100 emisiones "paralelas"
      const promesas = Array.from({ length: numFacturas }, async (_, i) => {
        try {
          // 1. Obtener folio
          const result = await folioManager.getNextFolio(TIPO_FACTURA);
          
          // 2. Simular procesamiento (puede fallar)
          const shouldFail = Math.random() < 0.1; // 10% falla
          
          if (shouldFail) {
            await folioManager.releaseFolio(TIPO_FACTURA, result.folio);
            throw new Error(`Simulación de error en factura ${i}`);
          }
          
          // 3. Confirmar
          await folioManager.confirmFolio(TIPO_FACTURA, result.folio);
          exitosos.push(result.folio);
        } catch (error) {
          errores.push(error as Error);
        }
      });

      await Promise.all(promesas);

      // Verificar que exitosos son únicos
      expect(new Set(exitosos).size).toBe(exitosos.length);
      
      // Total debe ser ~100 (algunos errores)
      expect(exitosos.length + errores.length).toBe(numFacturas);
      
      console.log(`Simulación: ${exitosos.length} exitosos, ${errores.length} errores`);
    });

    it('debe simular picos de carga', async () => {
      const spikes = [20, 50, 100, 50, 20]; // Patrón de carga
      const allFolios: number[] = [];

      for (const spike of spikes) {
        const results = await Promise.all(
          Array.from({ length: spike }, () =>
            folioManager.getNextFolio(TIPO_FACTURA)
          )
        );

        await Promise.all(
          results.map(r => folioManager.confirmFolio(TIPO_FACTURA, r.folio))
        );

        allFolios.push(...results.map(r => r.folio));

        // Pequeña pausa entre spikes
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const totalFolios = spikes.reduce((a, b) => a + b, 0);
      
      expect(allFolios.length).toBe(totalFolios);
      expect(new Set(allFolios).size).toBe(totalFolios);
    });
  });
});

// ============================================
// TESTS DE INTEGRACIÓN CON EVENTOS
// ============================================
describe('FolioLockManager con eventos', () => {
  class FolioLockManagerWithEvents extends EventEmitter {
    private manager: FolioLockManager;

    constructor() {
      super();
      this.manager = new FolioLockManager();
    }

    registerRange(tipoDte: number, desde: number, hasta: number, caf: string): void {
      this.manager.registerRange(tipoDte, desde, hasta, caf);
      this.emit('rangeRegistered', { tipoDte, desde, hasta });
    }

    async getNextFolio(tipoDte: number): Promise<{ folio: number; cafXml: string }> {
      const result = await this.manager.getNextFolio(tipoDte);
      this.emit('folioObtained', { tipoDte, folio: result.folio });
      
      // Verificar si quedan pocos
      const stats = this.manager.getStats(tipoDte);
      if (stats.disponibles < 10) {
        this.emit('lowFolios', { tipoDte, disponibles: stats.disponibles });
      }
      
      return result;
    }

    async confirmFolio(tipoDte: number, folio: number): Promise<void> {
      await this.manager.confirmFolio(tipoDte, folio);
      this.emit('folioConfirmed', { tipoDte, folio });
    }

    reset(): void {
      this.manager.reset();
      this.removeAllListeners();
    }
  }

  let manager: FolioLockManagerWithEvents;

  beforeEach(() => {
    manager = new FolioLockManagerWithEvents();
  });

  afterEach(() => {
    manager.reset();
  });

  it('debe emitir evento al registrar rango', (done) => {
    manager.on('rangeRegistered', (data) => {
      expect(data.tipoDte).toBe(33);
      expect(data.desde).toBe(1);
      expect(data.hasta).toBe(100);
      done();
    });

    manager.registerRange(33, 1, 100, '<CAF/>');
  });

  it('debe emitir evento al obtener folio', (done) => {
    manager.registerRange(33, 1, 100, '<CAF/>');

    manager.on('folioObtained', (data) => {
      expect(data.tipoDte).toBe(33);
      expect(data.folio).toBe(1);
      done();
    });

    manager.getNextFolio(33);
  });

  it('debe emitir alerta de folios bajos', async () => {
    manager.registerRange(33, 1, 15, '<CAF/>');
    
    const lowFoliosPromise = new Promise<{ tipoDte: number; disponibles: number }>((resolve) => {
      manager.on('lowFolios', resolve);
    });

    // Usar 6 folios (quedan 9 = menos de 10)
    for (let i = 0; i < 6; i++) {
      const result = await manager.getNextFolio(33);
      await manager.confirmFolio(33, result.folio);
    }

    // El siguiente dispara la alerta
    await manager.getNextFolio(33);

    const alert = await lowFoliosPromise;
    
    expect(alert.tipoDte).toBe(33);
    expect(alert.disponibles).toBeLessThan(10);
  });
});
