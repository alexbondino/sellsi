/**
 * Tests para utilidades de fechas
 */

import { 
  formatearFechaSii, 
  formatearTimestampSii, 
  parsearFechaSii,
  generarIdUnico 
} from '../../src/utils/date.utils';

describe('Date Utils', () => {
  describe('formatearFechaSii', () => {
    it('debe formatear fecha en formato SII (YYYY-MM-DD)', () => {
      const fecha = new Date(2025, 10, 26); // Noviembre 26, 2025
      expect(formatearFechaSii(fecha)).toBe('2025-11-26');
    });

    it('debe manejar fechas con día/mes de un dígito', () => {
      const fecha = new Date(2025, 0, 5); // Enero 5, 2025
      expect(formatearFechaSii(fecha)).toBe('2025-01-05');
    });
  });

  describe('formatearTimestampSii', () => {
    it('debe formatear timestamp en formato SII', () => {
      const fecha = new Date(2025, 10, 26, 14, 30, 45);
      const resultado = formatearTimestampSii(fecha);
      
      // Formato esperado: 2025-11-26T14:30:45
      expect(resultado).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
      expect(resultado.startsWith('2025-11-26')).toBe(true);
    });
  });

  describe('parsearFechaSii', () => {
    it('debe parsear fecha desde formato SII', () => {
      const fecha = parsearFechaSii('2025-11-26');
      expect(fecha.getFullYear()).toBe(2025);
      expect(fecha.getMonth()).toBe(10); // Noviembre = 10
      expect(fecha.getDate()).toBe(26);
    });

    it('debe manejar formatos de fecha flexibles', () => {
      // La función puede aceptar diferentes formatos
      // Los formatos inválidos devuelven Invalid Date
      const fechaInvalida = parsearFechaSii('invalid');
      expect(isNaN(fechaInvalida.getTime())).toBe(true);
    });
  });

  describe('generarIdUnico', () => {
    it('debe generar IDs únicos', () => {
      const id1 = generarIdUnico();
      const id2 = generarIdUnico();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });
  });
});
