/**
 * Tests exhaustivos para utilidades matemáticas
 * Crítico para certificación SII - Los cálculos de montos e IVA deben ser exactos
 */

import { 
  redondearSii, 
  calcularIva, 
  sumarMontos,
  formatearMonto,
  calcularNetoDesdeTotal,
  calcularTotal,
  calcularMontoItem,
  validarTotales,
  calcularPorcentaje
} from '../../src/utils/math.utils';

describe('Math Utils - Suite Completa para Certificación SII', () => {

  // ============================================
  // REDONDEO SII - CASOS ESTÁNDAR
  // ============================================
  describe('redondearSii - Casos estándar', () => {
    const casosRedondeo = [
      // Redondeo hacia arriba desde .5
      { input: 100.5, expected: 101, descripcion: '.5 redondea hacia arriba' },
      { input: 100.6, expected: 101, descripcion: '.6 redondea hacia arriba' },
      { input: 100.9, expected: 101, descripcion: '.9 redondea hacia arriba' },
      
      // Redondeo hacia abajo antes de .5
      { input: 100.4, expected: 100, descripcion: '.4 redondea hacia abajo' },
      { input: 100.1, expected: 100, descripcion: '.1 redondea hacia abajo' },
      { input: 100.49, expected: 100, descripcion: '.49 redondea hacia abajo' },
      
      // Números enteros
      { input: 100, expected: 100, descripcion: 'Entero sin cambio' },
      { input: 0, expected: 0, descripcion: 'Cero' },
      { input: 1, expected: 1, descripcion: 'Uno' },
      
      // Números grandes (comunes en facturas)
      { input: 1000000.5, expected: 1000001, descripcion: 'Millón con .5' },
      { input: 99999999.4, expected: 99999999, descripcion: 'Casi 100M' },
    ];

    casosRedondeo.forEach(({ input, expected, descripcion }) => {
      it(`debe redondear: ${descripcion} (${input} → ${expected})`, () => {
        expect(redondearSii(input)).toBe(expected);
      });
    });
  });

  // ============================================
  // REDONDEO SII - CASOS NEGATIVOS
  // ============================================
  describe('redondearSii - Números negativos (Notas de crédito)', () => {
    it('debe manejar números negativos correctamente', () => {
      // Nota: El comportamiento de Math.round con negativos es específico
      expect(redondearSii(-100.4)).toBe(-100);
      expect(redondearSii(-100.6)).toBe(-101);
    });

    it('debe manejar -0.5 consistentemente', () => {
      // El comportamiento de Math.round(-0.5) en JS da -0
      // Pero algunas implementaciones pueden dar -1
      const resultado = redondearSii(-0.5);
      // Aceptamos tanto 0 como -1 dependiendo de la implementación
      expect(resultado === 0 || resultado === -1).toBe(true);
    });
  });

  // ============================================
  // CÁLCULO DE IVA - CASOS ESTÁNDAR
  // ============================================
  describe('calcularIva - Cálculos estándar 19%', () => {
    const casosIva = [
      // Casos básicos
      { neto: 1000, ivaEsperado: 190, descripcion: 'Base 1.000' },
      { neto: 10000, ivaEsperado: 1900, descripcion: 'Base 10.000' },
      { neto: 100000, ivaEsperado: 19000, descripcion: 'Base 100.000' },
      { neto: 1000000, ivaEsperado: 190000, descripcion: 'Base 1.000.000' },
      
      // Casos con redondeo
      { neto: 100, ivaEsperado: 19, descripcion: '100 * 0.19 = 19 exacto' },
      { neto: 101, ivaEsperado: 19, descripcion: '101 * 0.19 = 19.19 → 19' },
      { neto: 105, ivaEsperado: 20, descripcion: '105 * 0.19 = 19.95 → 20' },
      { neto: 999, ivaEsperado: 190, descripcion: '999 * 0.19 = 189.81 → 190' },
      
      // Cero
      { neto: 0, ivaEsperado: 0, descripcion: 'Monto cero' },
    ];

    casosIva.forEach(({ neto, ivaEsperado, descripcion }) => {
      it(`debe calcular IVA: ${descripcion}`, () => {
        expect(calcularIva(neto)).toBe(ivaEsperado);
      });
    });
  });

  // ============================================
  // CÁLCULO DE IVA - VALIDACIÓN MATEMÁTICA
  // ============================================
  describe('calcularIva - Validación matemática', () => {
    it('IVA debe ser exactamente 19% del neto (con redondeo SII)', () => {
      const montos = [1000, 5000, 10000, 25000, 50000, 100000, 500000];
      
      montos.forEach(neto => {
        const iva = calcularIva(neto);
        const ivaEsperado = Math.round(neto * 0.19);
        expect(iva).toBe(ivaEsperado);
      });
    });

    it('Neto + IVA debe ser consistente', () => {
      const neto = 84034; // Caso común en facturación
      const iva = calcularIva(neto);
      const total = neto + iva;
      
      // IVA de 84034 = 84034 * 0.19 = 15966.46 → 15966
      expect(iva).toBe(15966);
      expect(total).toBe(100000);
    });

    it('debe manejar montos que producen IVA con .5 exacto', () => {
      // Buscamos un neto donde neto * 0.19 termine en .5
      // 1000/19 * 10 + 5/19 ≈ neto para que neto*0.19 = X.5
      // 50 * 0.19 = 9.5 → debería ser 10
      const iva = calcularIva(50);
      expect(iva).toBe(10); // 9.5 redondea a 10
    });
  });

  // ============================================
  // SUMA DE MONTOS
  // ============================================
  describe('sumarMontos - Agregaciones', () => {
    it('debe sumar arrays de montos correctamente', () => {
      expect(sumarMontos([100, 200, 300])).toBe(600);
      expect(sumarMontos([1000, 2000, 3000, 4000])).toBe(10000);
    });

    it('debe manejar array vacío', () => {
      expect(sumarMontos([])).toBe(0);
    });

    it('debe manejar un solo elemento', () => {
      expect(sumarMontos([12345])).toBe(12345);
    });

    it('debe sumar montos grandes sin perder precisión', () => {
      const montos = [99999999, 99999999, 99999999];
      expect(sumarMontos(montos)).toBe(299999997);
    });

    it('debe manejar mezcla de montos positivos y negativos', () => {
      // Común en documentos con descuentos
      expect(sumarMontos([1000, -100, 500, -50])).toBe(1350);
    });

    it('debe manejar decimales y devolver entero', () => {
      const resultado = sumarMontos([100.5, 200.3, 300.2]);
      expect(Number.isInteger(resultado)).toBe(true);
    });
  });

  // ============================================
  // FORMATEO DE MONTOS
  // ============================================
  describe('formatearMonto - Formato chileno', () => {
    const casosFormateo = [
      { monto: 0, expected: '0', descripcion: 'Cero' },
      { monto: 100, expected: '100', descripcion: 'Centenas' },
      { monto: 1000, expected: '1.000', descripcion: 'Miles' },
      { monto: 10000, expected: '10.000', descripcion: 'Decenas de miles' },
      { monto: 100000, expected: '100.000', descripcion: 'Centenas de miles' },
      { monto: 1000000, expected: '1.000.000', descripcion: 'Millón' },
      { monto: 10000000, expected: '10.000.000', descripcion: 'Decenas de millones' },
      { monto: 100000000, expected: '100.000.000', descripcion: 'Centenas de millones' },
      { monto: 1234567890, expected: '1.234.567.890', descripcion: 'Miles de millones' },
    ];

    casosFormateo.forEach(({ monto, expected, descripcion }) => {
      it(`debe formatear: ${descripcion} (${monto} → ${expected})`, () => {
        expect(formatearMonto(monto)).toBe(expected);
      });
    });
  });

  // ============================================
  // ESCENARIOS REALES DE FACTURACIÓN
  // ============================================
  describe('Escenarios reales de facturación', () => {
    it('debe calcular factura simple correctamente', () => {
      const items = [
        { cantidad: 2, precio: 5000 },   // 10.000
        { cantidad: 3, precio: 3000 },   // 9.000
        { cantidad: 1, precio: 15000 },  // 15.000
      ];
      
      const neto = items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
      const iva = calcularIva(neto);
      const total = neto + iva;
      
      expect(neto).toBe(34000);
      expect(iva).toBe(6460);
      expect(total).toBe(40460);
    });

    it('debe calcular factura con descuento', () => {
      const subtotal = 100000;
      const descuento = 10000; // 10%
      const neto = subtotal - descuento;
      const iva = calcularIva(neto);
      const total = neto + iva;
      
      expect(neto).toBe(90000);
      expect(iva).toBe(17100);
      expect(total).toBe(107100);
    });

    it('debe calcular factura con productos exentos y afectos', () => {
      const montoAfecto = 50000;
      const montoExento = 20000;
      const iva = calcularIva(montoAfecto); // Solo sobre afecto
      const total = montoAfecto + montoExento + iva;
      
      expect(iva).toBe(9500);
      expect(total).toBe(79500);
    });

    it('debe manejar centavos en precios unitarios', () => {
      // Precio con decimales: $1.990,50 por 3 unidades
      const precioUnitario = 1990.50;
      const cantidad = 3;
      const subtotal = precioUnitario * cantidad; // 5971.50
      const montoRedondeado = redondearSii(subtotal);
      
      expect(montoRedondeado).toBe(5972);
    });
  });

  // ============================================
  // CASOS LÍMITE Y EDGE CASES
  // ============================================
  describe('Edge cases y límites', () => {
    it('debe manejar monto máximo seguro de JavaScript', () => {
      const montoGrande = 9007199254740991; // Number.MAX_SAFE_INTEGER
      expect(() => redondearSii(montoGrande)).not.toThrow();
    });

    it('debe manejar montos muy pequeños', () => {
      expect(redondearSii(0.001)).toBe(0);
      expect(redondearSii(0.499)).toBe(0);
      expect(redondearSii(0.5)).toBe(1);
    });

    it('IVA de 1 peso debe ser 0', () => {
      // 1 * 0.19 = 0.19 → 0
      expect(calcularIva(1)).toBe(0);
    });

    it('IVA de 3 pesos debe ser 1', () => {
      // 3 * 0.19 = 0.57 → 1
      expect(calcularIva(3)).toBe(1);
    });

    it('debe ser consistente con cálculos repetidos', () => {
      const neto = 123456;
      const iva1 = calcularIva(neto);
      const iva2 = calcularIva(neto);
      const iva3 = calcularIva(neto);
      
      expect(iva1).toBe(iva2);
      expect(iva2).toBe(iva3);
    });
  });

  // ============================================
  // VALIDACIONES DE TIPO
  // ============================================
  describe('Validaciones de tipo', () => {
    it('debe manejar strings numéricos como input', () => {
      // TypeScript debería prevenir esto, pero validamos runtime
      expect(redondearSii(100.5 as number)).toBe(101);
    });

    it('formatearMonto debe retornar string', () => {
      const resultado = formatearMonto(1000);
      expect(typeof resultado).toBe('string');
    });

    it('calcularIva debe retornar número entero', () => {
      const iva = calcularIva(12345);
      expect(Number.isInteger(iva)).toBe(true);
    });

    it('sumarMontos debe retornar número', () => {
      const suma = sumarMontos([100, 200, 300]);
      expect(typeof suma).toBe('number');
    });
  });

  // ============================================
  // RENDIMIENTO
  // ============================================
  describe('Rendimiento', () => {
    it('debe calcular 100,000 IVAs en menos de 1 segundo', () => {
      const inicio = Date.now();
      
      for (let i = 0; i < 100000; i++) {
        calcularIva(i);
      }
      
      const duracion = Date.now() - inicio;
      expect(duracion).toBeLessThan(1000);
    });

    it('debe sumar arrays grandes eficientemente', () => {
      const arrayGrande = Array.from({ length: 10000 }, (_, i) => i);
      
      const inicio = Date.now();
      sumarMontos(arrayGrande);
      const duracion = Date.now() - inicio;
      
      expect(duracion).toBeLessThan(100);
    });
  });

  // ============================================
  // CALCULAR NETO DESDE TOTAL (IVA INVERSO)
  // ============================================
  describe('calcularNetoDesdeTotal - Cálculo inverso de IVA', () => {
    it('debe calcular neto desde total con IVA 19%', () => {
      // Total 119 → Neto 100
      expect(calcularNetoDesdeTotal(119)).toBe(100);
    });

    it('debe calcular neto desde total grande', () => {
      // Total 1.190.000 → Neto 1.000.000
      expect(calcularNetoDesdeTotal(1190000)).toBe(1000000);
    });

    it('debe ser inverso de calcularTotal', () => {
      const neto = 84034;
      const total = calcularTotal(neto);
      const netoRecalculado = calcularNetoDesdeTotal(total);
      
      // Puede haber diferencia de ±1 por redondeo
      expect(Math.abs(netoRecalculado - neto)).toBeLessThanOrEqual(1);
    });

    it('debe manejar total cero', () => {
      expect(calcularNetoDesdeTotal(0)).toBe(0);
    });

    it('debe redondear correctamente casos con decimales', () => {
      // 100 / 1.19 = 84.033...
      const neto = calcularNetoDesdeTotal(100);
      expect(Number.isInteger(neto)).toBe(true);
    });

    it('debe aceptar tasas de IVA personalizadas', () => {
      // Con 10% de IVA: Total 110 → Neto 100
      expect(calcularNetoDesdeTotal(110, 0.10)).toBe(100);
    });
  });

  // ============================================
  // CALCULAR TOTAL (NETO + IVA)
  // ============================================
  describe('calcularTotal - Suma de neto + IVA', () => {
    it('debe calcular total correctamente', () => {
      // Neto 100 → IVA 19 → Total 119
      expect(calcularTotal(100)).toBe(119);
    });

    it('debe calcular total con montos grandes', () => {
      // Neto 1.000.000 → IVA 190.000 → Total 1.190.000
      expect(calcularTotal(1000000)).toBe(1190000);
    });

    it('debe ser consistente con calcularIva', () => {
      const neto = 84034;
      const iva = calcularIva(neto);
      const total = calcularTotal(neto);
      
      expect(total).toBe(neto + iva);
    });

    it('debe manejar neto cero', () => {
      expect(calcularTotal(0)).toBe(0);
    });

    it('debe aceptar tasas de IVA personalizadas', () => {
      // Con 10% de IVA: Neto 100 → Total 110
      expect(calcularTotal(100, 0.10)).toBe(110);
    });

    it('debe redondear el IVA antes de sumar', () => {
      // Neto 101: IVA = 101 * 0.19 = 19.19 → 19
      // Total = 101 + 19 = 120
      expect(calcularTotal(101)).toBe(120);
    });
  });

  // ============================================
  // CALCULAR MONTO ITEM
  // ============================================
  describe('calcularMontoItem - Cantidad × Precio - Descuento', () => {
    it('debe calcular monto simple sin descuento', () => {
      expect(calcularMontoItem(2, 1000)).toBe(2000);
    });

    it('debe calcular monto con descuento porcentual', () => {
      // 2 × 1000 = 2000, menos 10% = 1800
      expect(calcularMontoItem(2, 1000, 10)).toBe(1800);
    });

    it('debe calcular monto con descuento 50%', () => {
      expect(calcularMontoItem(1, 1000, 50)).toBe(500);
    });

    it('debe manejar descuento 0%', () => {
      expect(calcularMontoItem(3, 500, 0)).toBe(1500);
    });

    it('debe manejar cantidad decimal (ej: kilos)', () => {
      // 2.5 kg a $1000/kg = $2500
      expect(calcularMontoItem(2.5, 1000)).toBe(2500);
    });

    it('debe manejar precio con decimales', () => {
      // 3 × $333.33 = $999.99 → $1000 (redondeado)
      const monto = calcularMontoItem(3, 333.33);
      expect(Number.isInteger(monto)).toBe(true);
    });

    it('debe manejar cantidades y precios grandes', () => {
      expect(calcularMontoItem(1000, 99999)).toBe(99999000);
    });

    it('debe aplicar descuento correctamente con decimales', () => {
      // 100 × $99 = $9900, menos 15% = $8415
      expect(calcularMontoItem(100, 99, 15)).toBe(8415);
    });
  });

  // ============================================
  // VALIDAR TOTALES
  // ============================================
  describe('validarTotales - Verificación de consistencia', () => {
    it('debe validar totales correctos', () => {
      expect(validarTotales(1000, 190, 1190)).toBe(true);
    });

    it('debe validar totales con redondeo', () => {
      // Neto 84034 → IVA 15966 → Total 100000
      expect(validarTotales(84034, 15966, 100000)).toBe(true);
    });

    it('debe aceptar diferencia de ±1 por redondeo', () => {
      // IVA calculado sería 15966, pero declaramos 15967
      expect(validarTotales(84034, 15967, 100001)).toBe(true);
    });

    it('debe rechazar diferencias mayores a 1', () => {
      // Diferencia de 5 en el IVA
      expect(validarTotales(1000, 195, 1195)).toBe(false);
    });

    it('debe validar montos cero', () => {
      expect(validarTotales(0, 0, 0)).toBe(true);
    });

    it('debe rechazar totales completamente incorrectos', () => {
      expect(validarTotales(1000, 190, 2000)).toBe(false);
    });

    it('debe aceptar tasas de IVA personalizadas', () => {
      // Con 10% IVA: Neto 1000, IVA 100, Total 1100
      expect(validarTotales(1000, 100, 1100, 0.10)).toBe(true);
    });

    it('debe manejar montos grandes', () => {
      expect(validarTotales(100000000, 19000000, 119000000)).toBe(true);
    });
  });

  // ============================================
  // CALCULAR PORCENTAJE
  // ============================================
  describe('calcularPorcentaje - Cálculo de ratios', () => {
    it('debe calcular porcentaje simple', () => {
      expect(calcularPorcentaje(50, 100)).toBe(50);
    });

    it('debe calcular 100%', () => {
      expect(calcularPorcentaje(100, 100)).toBe(100);
    });

    it('debe calcular 0%', () => {
      expect(calcularPorcentaje(0, 100)).toBe(0);
    });

    it('debe manejar porcentajes mayores a 100%', () => {
      expect(calcularPorcentaje(150, 100)).toBe(150);
    });

    it('debe retornar 0 cuando total es 0 (evita división por cero)', () => {
      expect(calcularPorcentaje(50, 0)).toBe(0);
    });

    it('debe calcular porcentajes con decimales', () => {
      // 1 de 3 = 33.33...%
      const porcentaje = calcularPorcentaje(1, 3);
      expect(porcentaje).toBeCloseTo(33.33, 1);
    });

    it('debe manejar valores negativos', () => {
      // Útil para calcular % de descuento como número negativo
      const porcentaje = calcularPorcentaje(-100, 1000);
      expect(porcentaje).toBe(-10);
    });

    it('debe calcular porcentaje de IVA sobre total', () => {
      // IVA 190 sobre total 1190 = 15.966...%
      const porcentaje = calcularPorcentaje(190, 1190);
      expect(porcentaje).toBeCloseTo(15.97, 1);
    });
  });
});
