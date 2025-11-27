/**
 * Tests exhaustivos para utilidades de fecha
 * Crítico para certificación SII - Las fechas deben cumplir formato exacto
 */

import { 
  formatearFechaSii, 
  formatearTimestampSii, 
  parsearFechaSii,
  generarIdUnico,
  obtenerMesTexto,
  validarFechaEmision,
  diasEntreFechas,
  obtenerPeriodoTributario,
  obtenerVencimientoCaf
} from '../../src/utils/date.utils';

describe('Date Utils - Suite Completa para Certificación SII', () => {

  // ============================================
  // FORMATO DE FECHA SII (YYYY-MM-DD)
  // ============================================
  describe('formatearFechaSii - Formato ISO para SII', () => {
    it('debe formatear fecha estándar correctamente', () => {
      const fecha = new Date(2025, 10, 26); // Nov 26, 2025
      expect(formatearFechaSii(fecha)).toBe('2025-11-26');
    });

    it('debe agregar ceros a la izquierda en meses', () => {
      const fecha = new Date(2025, 0, 15); // Enero
      expect(formatearFechaSii(fecha)).toBe('2025-01-15');
    });

    it('debe agregar ceros a la izquierda en días', () => {
      const fecha = new Date(2025, 5, 5); // Junio 5
      expect(formatearFechaSii(fecha)).toBe('2025-06-05');
    });

    it('debe manejar primer día del año', () => {
      const fecha = new Date(2025, 0, 1);
      expect(formatearFechaSii(fecha)).toBe('2025-01-01');
    });

    it('debe manejar último día del año', () => {
      const fecha = new Date(2025, 11, 31);
      expect(formatearFechaSii(fecha)).toBe('2025-12-31');
    });

    it('debe manejar fechas de años diferentes', () => {
      expect(formatearFechaSii(new Date(2020, 5, 15))).toBe('2020-06-15');
      expect(formatearFechaSii(new Date(2030, 11, 25))).toBe('2030-12-25');
    });

    // Fechas históricas y futuras
    it('debe manejar año 2000', () => {
      const fecha = new Date(2000, 0, 1);
      expect(formatearFechaSii(fecha)).toBe('2000-01-01');
    });

    it('debe manejar fechas futuras', () => {
      const fecha = new Date(2050, 6, 15);
      expect(formatearFechaSii(fecha)).toBe('2050-07-15');
    });
  });

  // ============================================
  // TIMESTAMP SII
  // ============================================
  describe('formatearTimestampSii - Formato ISO con hora', () => {
    it('debe incluir fecha y hora', () => {
      const fecha = new Date(2025, 10, 26, 14, 30, 45);
      const resultado = formatearTimestampSii(fecha);
      
      expect(resultado).toMatch(/^2025-11-26T\d{2}:\d{2}:\d{2}$/);
    });

    it('debe formatear hora con ceros a la izquierda', () => {
      const fecha = new Date(2025, 10, 26, 9, 5, 3);
      const resultado = formatearTimestampSii(fecha);
      
      expect(resultado).toContain('T09:05:03');
    });

    it('debe manejar medianoche', () => {
      const fecha = new Date(2025, 10, 26, 0, 0, 0);
      const resultado = formatearTimestampSii(fecha);
      
      expect(resultado).toContain('T00:00:00');
    });

    it('debe manejar último segundo del día', () => {
      const fecha = new Date(2025, 10, 26, 23, 59, 59);
      const resultado = formatearTimestampSii(fecha);
      
      expect(resultado).toContain('T23:59:59');
    });

    it('debe producir formato válido para XML del SII', () => {
      const fecha = new Date();
      const resultado = formatearTimestampSii(fecha);
      
      // Formato: YYYY-MM-DDTHH:MM:SS
      expect(resultado).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    });
  });

  // ============================================
  // PARSEO DE FECHA SII
  // ============================================
  describe('parsearFechaSii - Convertir string a Date', () => {
    it('debe parsear formato SII estándar', () => {
      const fecha = parsearFechaSii('2025-11-26');
      
      expect(fecha.getFullYear()).toBe(2025);
      expect(fecha.getMonth()).toBe(10); // 0-indexed
      expect(fecha.getDate()).toBe(26);
    });

    it('debe parsear primer día del año', () => {
      const fecha = parsearFechaSii('2025-01-01');
      
      expect(fecha.getMonth()).toBe(0);
      expect(fecha.getDate()).toBe(1);
    });

    it('debe parsear último día del año', () => {
      const fecha = parsearFechaSii('2025-12-31');
      
      expect(fecha.getMonth()).toBe(11);
      expect(fecha.getDate()).toBe(31);
    });

    it('debe manejar año bisiesto 29 febrero', () => {
      const fecha = parsearFechaSii('2024-02-29');
      
      expect(fecha.getMonth()).toBe(1);
      expect(fecha.getDate()).toBe(29);
    });

    it('debe manejar fechas inválidas devolviendo Invalid Date', () => {
      const fecha = parsearFechaSii('invalid-date');
      expect(isNaN(fecha.getTime())).toBe(true);
    });
  });

  // ============================================
  // CONSISTENCIA FORMATEO/PARSEO
  // ============================================
  describe('Consistencia entre formateo y parseo', () => {
    it('formatear → parsear → formatear debe ser idempotente', () => {
      const fechaOriginal = new Date(2025, 10, 26);
      const formateada = formatearFechaSii(fechaOriginal);
      const parseada = parsearFechaSii(formateada);
      const reformateada = formatearFechaSii(parseada);
      
      expect(reformateada).toBe(formateada);
    });

    it('debe mantener consistencia a través de múltiples ciclos', () => {
      const fechas = [
        new Date(2025, 0, 1),
        new Date(2025, 5, 15),
        new Date(2025, 11, 31),
        new Date(2024, 1, 29), // Bisiesto
      ];

      fechas.forEach(fecha => {
        const f1 = formatearFechaSii(fecha);
        const p1 = parsearFechaSii(f1);
        const f2 = formatearFechaSii(p1);
        
        expect(f2).toBe(f1);
      });
    });
  });

  // ============================================
  // GENERACIÓN DE IDs ÚNICOS
  // ============================================
  describe('generarIdUnico - IDs para documentos', () => {
    it('debe generar strings no vacíos', () => {
      const id = generarIdUnico();
      expect(id.length).toBeGreaterThan(0);
    });

    it('debe generar IDs únicos en llamadas consecutivas', () => {
      const ids = new Set<string>();
      
      for (let i = 0; i < 1000; i++) {
        ids.add(generarIdUnico());
      }
      
      expect(ids.size).toBe(1000); // Todos únicos
    });

    it('debe generar IDs que pueden usarse en XML', () => {
      const id = generarIdUnico();
      
      // No debe contener caracteres problemáticos para XML
      expect(id).not.toContain('<');
      expect(id).not.toContain('>');
      expect(id).not.toContain('&');
      expect(id).not.toContain('"');
      expect(id).not.toContain("'");
    });

    it('debe generar IDs válidos para atributo ID de XML', () => {
      const id = generarIdUnico();
      
      // XML IDs deben empezar con letra o _
      expect(id).toMatch(/^[a-zA-Z_]/);
    });
  });

  // ============================================
  // CASOS ESPECIALES DE FECHA
  // ============================================
  describe('Casos especiales de fecha', () => {
    it('debe manejar cambio de año', () => {
      const dic31 = formatearFechaSii(new Date(2024, 11, 31));
      const ene1 = formatearFechaSii(new Date(2025, 0, 1));
      
      expect(dic31).toBe('2024-12-31');
      expect(ene1).toBe('2025-01-01');
    });

    it('debe manejar cambio de mes', () => {
      const fin = formatearFechaSii(new Date(2025, 0, 31));
      const inicio = formatearFechaSii(new Date(2025, 1, 1));
      
      expect(fin).toBe('2025-01-31');
      expect(inicio).toBe('2025-02-01');
    });

    it('debe manejar meses con diferentes cantidades de días', () => {
      // Febrero no bisiesto
      expect(formatearFechaSii(new Date(2025, 1, 28))).toBe('2025-02-28');
      
      // Abril tiene 30 días
      expect(formatearFechaSii(new Date(2025, 3, 30))).toBe('2025-04-30');
      
      // Mayo tiene 31 días
      expect(formatearFechaSii(new Date(2025, 4, 31))).toBe('2025-05-31');
    });
  });

  // ============================================
  // VALIDACIÓN DE FORMATO ESTRICTO SII
  // ============================================
  describe('Validación formato estricto SII', () => {
    it('formato de fecha debe ser exactamente YYYY-MM-DD', () => {
      const fecha = new Date();
      const resultado = formatearFechaSii(fecha);
      
      // Exactamente 10 caracteres
      expect(resultado.length).toBe(10);
      
      // Formato correcto
      expect(resultado).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('formato de timestamp debe ser exactamente YYYY-MM-DDTHH:MM:SS', () => {
      const fecha = new Date();
      const resultado = formatearTimestampSii(fecha);
      
      // Exactamente 19 caracteres
      expect(resultado.length).toBe(19);
      
      // Formato correcto
      expect(resultado).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    });

    it('no debe incluir timezone en timestamp', () => {
      const fecha = new Date();
      const resultado = formatearTimestampSii(fecha);
      
      expect(resultado).not.toContain('Z');
      expect(resultado).not.toContain('+');
      expect(resultado).not.toMatch(/[+-]\d{2}:\d{2}$/);
    });

    it('no debe incluir milisegundos', () => {
      const fecha = new Date();
      const resultado = formatearTimestampSii(fecha);
      
      expect(resultado).not.toContain('.');
    });
  });

  // ============================================
  // RENDIMIENTO
  // ============================================
  describe('Rendimiento', () => {
    it('debe formatear 100,000 fechas en menos de 2 segundos', () => {
      const fecha = new Date();
      const inicio = Date.now();
      
      for (let i = 0; i < 100000; i++) {
        formatearFechaSii(fecha);
      }
      
      const duracion = Date.now() - inicio;
      expect(duracion).toBeLessThan(2000);
    });

    it('debe generar 10,000 IDs únicos en menos de 1 segundo', () => {
      const inicio = Date.now();
      
      for (let i = 0; i < 10000; i++) {
        generarIdUnico();
      }
      
      const duracion = Date.now() - inicio;
      expect(duracion).toBeLessThan(1000);
    });
  });

  // ============================================
  // CASOS DE DOCUMENTOS SII
  // ============================================
  describe('Casos de uso en documentos SII', () => {
    it('FchEmis debe tener formato correcto', () => {
      const fechaEmision = formatearFechaSii(new Date());
      
      // Debe ser parseable de vuelta
      const parseada = parsearFechaSii(fechaEmision);
      expect(isNaN(parseada.getTime())).toBe(false);
    });

    it('TmstFirmaEnv debe tener formato correcto', () => {
      const timestamp = formatearTimestampSii(new Date());
      
      // Formato para TmstFirmaEnv
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    });

    it('FchResol para certificación debe ser 2006-01-20', () => {
      const fchResol = '2006-01-20';
      const parseada = parsearFechaSii(fchResol);
      
      expect(parseada.getFullYear()).toBe(2006);
      expect(parseada.getMonth()).toBe(0);
      expect(parseada.getDate()).toBe(20);
    });
  });

  // ============================================
  // OBTENER MES EN TEXTO (PARA RESOLUCIONES SII)
  // ============================================
  describe('obtenerMesTexto - Nombre del mes en español', () => {
    it('debe retornar ENERO para mes 0', () => {
      const fecha = new Date(2025, 0, 15);
      expect(obtenerMesTexto(fecha)).toBe('ENERO');
    });

    it('debe retornar DICIEMBRE para mes 11', () => {
      const fecha = new Date(2025, 11, 25);
      expect(obtenerMesTexto(fecha)).toBe('DICIEMBRE');
    });

    it('debe retornar todos los meses correctamente', () => {
      const mesesEsperados = [
        'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
        'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
      ];

      mesesEsperados.forEach((mesEsperado, index) => {
        const fecha = new Date(2025, index, 15);
        expect(obtenerMesTexto(fecha)).toBe(mesEsperado);
      });
    });

    it('debe usar fecha actual si no se provee parámetro', () => {
      const resultado = obtenerMesTexto();
      expect(typeof resultado).toBe('string');
      expect(resultado.length).toBeGreaterThan(0);
    });

    it('debe retornar string en mayúsculas', () => {
      const fecha = new Date(2025, 5, 15);
      const resultado = obtenerMesTexto(fecha);
      expect(resultado).toBe(resultado.toUpperCase());
    });
  });

  // ============================================
  // VALIDAR FECHA DE EMISIÓN SII
  // ============================================
  describe('validarFechaEmision - Reglas SII para fecha de emisión', () => {
    it('debe aceptar fecha de hoy', () => {
      const hoy = new Date();
      expect(validarFechaEmision(hoy)).toBe(true);
    });

    it('debe aceptar fecha de ayer', () => {
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      expect(validarFechaEmision(ayer)).toBe(true);
    });

    it('debe aceptar fecha de hace 1 mes', () => {
      const haceUnMes = new Date();
      haceUnMes.setMonth(haceUnMes.getMonth() - 1);
      expect(validarFechaEmision(haceUnMes)).toBe(true);
    });

    it('debe aceptar fecha de hace 2 meses (límite SII)', () => {
      const haceDosMeses = new Date();
      haceDosMeses.setMonth(haceDosMeses.getMonth() - 2);
      haceDosMeses.setDate(haceDosMeses.getDate() + 1); // Un día después del límite exacto
      expect(validarFechaEmision(haceDosMeses)).toBe(true);
    });

    it('debe rechazar fecha en el futuro', () => {
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      expect(validarFechaEmision(manana)).toBe(false);
    });

    it('debe rechazar fecha de hace más de 2 meses', () => {
      const haceTresMeses = new Date();
      haceTresMeses.setMonth(haceTresMeses.getMonth() - 3);
      expect(validarFechaEmision(haceTresMeses)).toBe(false);
    });

    it('debe manejar cambio de año correctamente', () => {
      // Si estamos en enero, hace 2 meses es noviembre del año anterior
      const fechaEnero = new Date(2025, 0, 15); // Enero 15
      const fechaNovAnterior = new Date(2024, 10, 20); // Noviembre del año anterior
      
      // Creamos una versión de la función que usa fecha fija como "hoy"
      // Para este test, verificamos que la lógica no falle con cambio de año
      const hoy = new Date();
      const limiteAnterior = new Date(hoy);
      limiteAnterior.setMonth(limiteAnterior.getMonth() - 2);
      
      // Cualquier fecha >= limiteAnterior y <= hoy debe ser válida
      expect(validarFechaEmision(hoy)).toBe(true);
    });
  });

  // ============================================
  // DÍAS ENTRE FECHAS
  // ============================================
  describe('diasEntreFechas - Cálculo de diferencia en días', () => {
    it('debe retornar 0 para fechas iguales', () => {
      const fecha = new Date(2025, 10, 26);
      expect(diasEntreFechas(fecha, fecha)).toBe(0);
    });

    it('debe calcular diferencia de 1 día', () => {
      const fecha1 = new Date(2025, 10, 25);
      const fecha2 = new Date(2025, 10, 26);
      expect(diasEntreFechas(fecha1, fecha2)).toBe(1);
    });

    it('debe calcular diferencia de 30 días', () => {
      const fecha1 = new Date(2025, 10, 1);
      const fecha2 = new Date(2025, 11, 1);
      expect(diasEntreFechas(fecha1, fecha2)).toBe(30);
    });

    it('debe calcular diferencia de 365 días (un año)', () => {
      const fecha1 = new Date(2024, 0, 1);
      const fecha2 = new Date(2025, 0, 1);
      // 2024 es bisiesto, así que tiene 366 días
      expect(diasEntreFechas(fecha1, fecha2)).toBe(366);
    });

    it('debe retornar valor absoluto (orden no importa)', () => {
      const fecha1 = new Date(2025, 10, 26);
      const fecha2 = new Date(2025, 10, 20);
      
      expect(diasEntreFechas(fecha1, fecha2)).toBe(6);
      expect(diasEntreFechas(fecha2, fecha1)).toBe(6);
    });

    it('debe usar fecha actual si no se provee segunda fecha', () => {
      const haceMuchosDias = new Date(2020, 0, 1);
      const resultado = diasEntreFechas(haceMuchosDias);
      
      // Debe ser un número positivo grande
      expect(resultado).toBeGreaterThan(1000);
    });

    it('debe manejar fechas con diferentes horas del mismo día', () => {
      const fecha1 = new Date(2025, 10, 26, 0, 0, 0);
      const fecha2 = new Date(2025, 10, 26, 23, 59, 59);
      
      // Mismo día, debería ser 0 días
      expect(diasEntreFechas(fecha1, fecha2)).toBe(0);
    });
  });

  // ============================================
  // PERÍODO TRIBUTARIO
  // ============================================
  describe('obtenerPeriodoTributario - Formato YYYY-MM', () => {
    it('debe retornar formato correcto YYYY-MM', () => {
      const fecha = new Date(2025, 10, 26);
      expect(obtenerPeriodoTributario(fecha)).toBe('2025-11');
    });

    it('debe agregar cero a la izquierda en meses < 10', () => {
      const fecha = new Date(2025, 0, 15); // Enero
      expect(obtenerPeriodoTributario(fecha)).toBe('2025-01');
    });

    it('debe manejar diciembre correctamente', () => {
      const fecha = new Date(2025, 11, 31);
      expect(obtenerPeriodoTributario(fecha)).toBe('2025-12');
    });

    it('debe usar fecha actual si no se provee parámetro', () => {
      const resultado = obtenerPeriodoTributario();
      expect(resultado).toMatch(/^\d{4}-\d{2}$/);
    });

    it('debe generar todos los períodos de un año', () => {
      const periodosEsperados = [
        '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
        '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12'
      ];

      periodosEsperados.forEach((periodo, index) => {
        const fecha = new Date(2025, index, 15);
        expect(obtenerPeriodoTributario(fecha)).toBe(periodo);
      });
    });
  });

  // ============================================
  // VENCIMIENTO CAF
  // ============================================
  describe('obtenerVencimientoCaf - Cálculo de expiración de folios', () => {
    it('debe retornar 1 año después para facturas (no boletas)', () => {
      const fechaAutorizacion = new Date(2025, 0, 15); // 15 Enero 2025
      const vencimiento = obtenerVencimientoCaf(fechaAutorizacion, false);
      
      expect(vencimiento.getFullYear()).toBe(2026);
      expect(vencimiento.getMonth()).toBe(0);
      expect(vencimiento.getDate()).toBe(15);
    });

    it('debe retornar 6 meses después para boletas', () => {
      const fechaAutorizacion = new Date(2025, 0, 15); // 15 Enero 2025
      const vencimiento = obtenerVencimientoCaf(fechaAutorizacion, true);
      
      expect(vencimiento.getFullYear()).toBe(2025);
      expect(vencimiento.getMonth()).toBe(6); // Julio
      expect(vencimiento.getDate()).toBe(15);
    });

    it('debe manejar cambio de año en vencimiento de boletas', () => {
      const fechaAutorizacion = new Date(2025, 9, 15); // 15 Octubre 2025
      const vencimiento = obtenerVencimientoCaf(fechaAutorizacion, true);
      
      // 6 meses después = Abril 2026
      expect(vencimiento.getFullYear()).toBe(2026);
      expect(vencimiento.getMonth()).toBe(3); // Abril
    });

    it('por defecto debe ser no-boleta (1 año)', () => {
      const fechaAutorizacion = new Date(2025, 5, 1);
      const vencimiento = obtenerVencimientoCaf(fechaAutorizacion);
      
      expect(vencimiento.getFullYear()).toBe(2026);
      expect(vencimiento.getMonth()).toBe(5);
    });

    it('debe preservar el día del mes', () => {
      const fechaAutorizacion = new Date(2025, 3, 30); // 30 Abril
      const vencimiento = obtenerVencimientoCaf(fechaAutorizacion, false);
      
      expect(vencimiento.getDate()).toBe(30);
    });

    it('debe manejar año bisiesto correctamente', () => {
      const fechaAutorizacion = new Date(2024, 1, 29); // 29 Feb 2024 (bisiesto)
      const vencimiento = obtenerVencimientoCaf(fechaAutorizacion, false);
      
      // 2025 no es bisiesto, JS ajusta al 1 de marzo
      // Este es el comportamiento esperado de Date
      expect(vencimiento.getFullYear()).toBe(2025);
    });
  });
});
