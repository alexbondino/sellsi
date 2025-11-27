/**
 * Tests para utilidades matemáticas
 */

import { 
  redondearSii, 
  calcularIva, 
  sumarMontos,
  formatearMonto 
} from '../../src/utils/math.utils';

describe('Math Utils', () => {
  describe('redondearSii', () => {
    it('debe redondear según reglas del SII', () => {
      expect(redondearSii(100.4)).toBe(100);
      expect(redondearSii(100.5)).toBe(101);
      expect(redondearSii(100.6)).toBe(101);
    });

    it('debe manejar números enteros', () => {
      expect(redondearSii(100)).toBe(100);
      expect(redondearSii(0)).toBe(0);
    });

    it('debe manejar números negativos', () => {
      // Math.round(-100.5) = -100 en algunos engines, -101 en otros
      // El comportamiento real es -101 por el algoritmo interno
      expect(redondearSii(-100.5)).toBe(-101);
    });
  });

  describe('calcularIva', () => {
    it('debe calcular IVA 19% correctamente', () => {
      expect(calcularIva(1000)).toBe(190);
      expect(calcularIva(10000)).toBe(1900);
    });

    it('debe redondear IVA correctamente', () => {
      // 100 * 0.19 = 19
      expect(calcularIva(100)).toBe(19);
      // 999 * 0.19 = 189.81 -> 190
      expect(calcularIva(999)).toBe(190);
    });

    it('debe retornar 0 para monto 0', () => {
      expect(calcularIva(0)).toBe(0);
    });
  });

  describe('sumarMontos', () => {
    it('debe sumar array de montos', () => {
      expect(sumarMontos([100, 200, 300])).toBe(600);
      expect(sumarMontos([1000, 190])).toBe(1190);
    });

    it('debe manejar array vacío', () => {
      expect(sumarMontos([])).toBe(0);
    });

    it('debe manejar un solo elemento', () => {
      expect(sumarMontos([500])).toBe(500);
    });
  });

  describe('formatearMonto', () => {
    it('debe formatear montos con separador de miles', () => {
      expect(formatearMonto(1000)).toBe('1.000');
      expect(formatearMonto(1000000)).toBe('1.000.000');
      expect(formatearMonto(100)).toBe('100');
    });

    it('debe manejar monto 0', () => {
      expect(formatearMonto(0)).toBe('0');
    });
  });
});
