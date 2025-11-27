/**
 * @sellsi/invoicer
 * Módulo de Facturación Electrónica SII Chile
 * 
 * @description
 * Sistema completo de emisión de Documentos Tributarios Electrónicos (DTE)
 * para el Servicio de Impuestos Internos de Chile.
 * 
 * @features
 * - Emisión de Facturas Electrónicas (33)
 * - Emisión de Facturas Exentas (34)
 * - Emisión de Boletas Electrónicas (39)
 * - Emisión de Guías de Despacho (52)
 * - Emisión de Notas de Crédito (61)
 * - Emisión de Notas de Débito (56)
 * - Generación de PDF con timbre electrónico
 * - Multi-tenant: múltiples emisores
 * 
 * @example
 * ```typescript
 * import { DteEmissionService } from '@sellsi/invoicer';
 * 
 * const emitter = new DteEmissionService(
 *   process.env.SUPABASE_URL!,
 *   process.env.SUPABASE_KEY!,
 *   process.env.ENCRYPTION_KEY!
 * );
 * 
 * const result = await emitter.emitDTE('supplier-uuid', {
 *   tipoDte: 33,
 *   receptor: {
 *     rut: '12345678-9',
 *     razonSocial: 'Cliente SpA',
 *     giro: 'Comercio',
 *     direccion: 'Av. Principal 123',
 *     comuna: 'Santiago',
 *     ciudad: 'Santiago',
 *   },
 *   items: [
 *     {
 *       nombre: 'Producto A',
 *       cantidad: 2,
 *       precioUnitario: 10000,
 *     },
 *   ],
 * });
 * 
 * console.log('Folio:', result.folio);
 * console.log('PDF Base64:', result.pdfBase64);
 * ```
 * 
 * @module @sellsi/invoicer
 */

// Config
export { SII_CONFIG } from './config/sii.config';

// Types
export * from './types';

// Utils
export * from './utils';

// Services
export * from './services';
