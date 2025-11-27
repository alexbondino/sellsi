/**
 * Tests para utilidades de RUT
 */

import { 
  validarRut, 
  formatearRut, 
  limpiarRut, 
  rutParaSii 
} from '../../src/utils/rut.utils';

describe('RUT Utils', () => {
  describe('validarRut', () => {
    it('debe validar RUTs correctos', () => {
      expect(validarRut('12.345.678-5')).toBe(true);
      expect(validarRut('11111111-1')).toBe(true);
      expect(validarRut('76.086.428-5')).toBe(true);
      expect(validarRut('5.126.663-3')).toBe(true);
    });

    it('debe rechazar RUTs incorrectos', () => {
      expect(validarRut('12.345.678-0')).toBe(false);
      expect(validarRut('11111111-2')).toBe(false);
      expect(validarRut('')).toBe(false);
      expect(validarRut('abc')).toBe(false);
    });

    it('debe validar RUTs con K', () => {
      // RUT 23.000.000-K es válido (dígito verificador K)
      expect(validarRut('23.000.000-K')).toBe(true);
      expect(validarRut('23000000-k')).toBe(true);
    });
  });

  describe('formatearRut', () => {
    it('debe formatear RUT correctamente', () => {
      expect(formatearRut('123456785')).toBe('12.345.678-5');
      expect(formatearRut('12345678-5')).toBe('12.345.678-5');
      expect(formatearRut('12.345.678-5')).toBe('12.345.678-5');
    });

    it('debe manejar RUTs cortos', () => {
      expect(formatearRut('51266633')).toBe('5.126.663-3');
    });

    it('debe manejar RUTs con K', () => {
      expect(formatearRut('10000000K')).toBe('10.000.000-K');
    });
  });

  describe('limpiarRut', () => {
    it('debe limpiar formato de RUT', () => {
      expect(limpiarRut('12.345.678-5')).toBe('123456785');
      expect(limpiarRut('12345678-5')).toBe('123456785');
      expect(limpiarRut('12345678 5')).toBe('123456785');
    });
  });

  describe('rutParaSii', () => {
    it('debe formatear RUT para envío al SII', () => {
      expect(rutParaSii('12.345.678-5')).toBe('12345678-5');
      expect(rutParaSii('12345678-5')).toBe('12345678-5');
      expect(rutParaSii('123456785')).toBe('12345678-5');
    });
  });
});
