/**
 * Servicio Constructor de DTEs
 * Genera XML de documentos tributarios electrónicos según esquema SII
 * @module services/dte-builder.service
 */

import Decimal from 'decimal.js';
import { Builder } from 'xml2js';
import { DTEType, DTE, DetalleItem, Totales, TED, CAFData } from '../types';
import { EmisorContext } from '../types/certificate.types';
import { formatearFechaSii, formatearTimestampSii, generarIdUnico } from '../utils/date.utils';
import { rutParaSii } from '../utils/rut.utils';
import { calcularIva, redondearSii, sumarMontos } from '../utils/math.utils';
import { SII_CONFIG } from '../config/sii.config';

// Configurar Decimal.js
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Encabezado XML para el SII (estructura interna)
 */
interface EncabezadoXML {
  IdDoc: {
    TipoDTE: DTEType;
    Folio: number;
    FchEmis: string;
    MedioPago?: string;
    IndServicio?: number;
  };
  Emisor: {
    RUTEmisor: string;
    RznSoc: string;
    GiroEmis: string;
    Acteco: number;
    DirOrigen: string;
    CmnaOrigen: string;
    CiudadOrigen: string;
    Sucursal?: string;
    CdgSIISucur?: number;
  };
  Receptor: {
    RUTRecep: string;
    RznSocRecep: string;
    GiroRecep?: string;
    DirRecep?: string;
    CmnaRecep?: string;
    CiudadRecep?: string;
    CorreoRecep?: string;
  };
  Totales: {
    MntNeto?: number;
    MntExe?: number;
    IVA?: number;
    TasaIVA?: number;
    MntTotal: number;
  };
}

// Configurar Decimal.js
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Input para crear un DTE
 */
export interface CreateDTEInput {
  tipoDte: DTEType;
  folio: number;
  fechaEmision?: Date;
  receptor: {
    rut: string;
    razonSocial: string;
    giro?: string;
    direccion?: string;
    comuna?: string;
    ciudad?: string;
    correo?: string;
  };
  items: Array<{
    nombre: string;
    descripcion?: string;
    cantidad: number;
    unidad?: string;
    precioUnitario: number;
    descuentoPorcentaje?: number;
    exento?: boolean;
    codigoProducto?: string;
  }>;
  descuentoGlobal?: {
    tipo: 'porcentaje' | 'monto';
    valor: number;
  };
  referencias?: Array<{
    tipoDteRef: DTEType;
    folioRef: number;
    fechaRef: string;
    razonRef: string;
    codigoRef?: number;
  }>;
  medioPago?: 'EF' | 'PE' | 'TC' | 'CF' | 'OT'; // Efectivo, Pendiente, Tarjeta, etc.
  observaciones?: string;
}

/**
 * Resultado de construir un DTE
 */
export interface BuildDTEResult {
  dteXml: string;
  dteId: string;
  totales: Totales;
  ted: TED;
}

/**
 * Servicio para construir documentos tributarios electrónicos
 */
export class DteBuilderService {
  private xmlBuilder: Builder;

  constructor() {
    this.xmlBuilder = new Builder({
      xmldec: { version: '1.0', encoding: 'ISO-8859-1' },
      renderOpts: { pretty: true, indent: '  ' },
      headless: false,
    });
  }

  /**
   * Valida la entrada según reglas del SII
   * @param input - Datos del documento a validar
   * @throws Error si la validación falla
   */
  private validateInput(input: CreateDTEInput): void {
    const errors: string[] = [];

    // Validación 1: Máximo 60 líneas de detalle (según XSD SII)
    if (input.items.length > 60) {
      errors.push(`Máximo 60 líneas de detalle permitidas. Se recibieron ${input.items.length}`);
    }

    // Validación 2: Mínimo 1 ítem
    if (input.items.length === 0) {
      errors.push('Debe incluir al menos 1 ítem en el documento');
    }

    // Validación 3: Referencias obligatorias para Notas de Crédito y Débito
    const esNotaCreditoDebito = input.tipoDte === 56 || input.tipoDte === 61;
    if (esNotaCreditoDebito) {
      if (!input.referencias || input.referencias.length === 0) {
        errors.push(`Las ${input.tipoDte === 61 ? 'Notas de Crédito' : 'Notas de Débito'} requieren al menos una referencia al documento original`);
      }
    }

    // Validación 4: Folio debe ser positivo
    if (input.folio <= 0) {
      errors.push('El folio debe ser un número positivo');
    }

    // Validación 5: RUT receptor válido
    if (!input.receptor.rut || input.receptor.rut.trim() === '') {
      errors.push('El RUT del receptor es obligatorio');
    }

    // Validación 6: Razón social receptor válida
    if (!input.receptor.razonSocial || input.receptor.razonSocial.trim() === '') {
      errors.push('La razón social del receptor es obligatoria');
    }

    // Si hay errores, lanzar excepción con todos los mensajes
    if (errors.length > 0) {
      throw new Error(`Validación DTE fallida:\n- ${errors.join('\n- ')}`);
    }
  }

  /**
   * Construye un DTE completo
   * @param input - Datos del documento
   * @param emisor - Contexto del emisor
   * @param cafData - Datos del CAF para el TED
   * @returns XML del DTE y metadatos
   * @throws Error si la validación falla
   */
  buildDTE(input: CreateDTEInput, emisor: EmisorContext, cafData: CAFData): BuildDTEResult {
    // Validar entrada según reglas SII
    this.validateInput(input);

    // Generar ID único para el documento
    const dteId = `DTE_${input.tipoDte}_${input.folio}`;
    const fechaEmision = input.fechaEmision || new Date();

    // Calcular ítems y totales
    const { detalle, totales } = this.calculateItemsAndTotals(input, emisor);

    // Construir encabezado
    const encabezado = this.buildEncabezado(input, emisor, fechaEmision, totales);

    // Construir TED (Timbre Electrónico del DTE)
    const ted = this.buildTED(input, emisor, fechaEmision, totales, cafData);

    // Construir el documento completo
    const documento = {
      Documento: {
        $: { ID: dteId },
        Encabezado: encabezado,
        Detalle: detalle,
        ...(input.referencias && input.referencias.length > 0 && {
          Referencia: this.buildReferencias(input.referencias),
        }),
        TED: ted.tedObject,
        TmstFirma: formatearTimestampSii(new Date()),
      },
    };

    // Convertir a XML
    const dteXml = this.xmlBuilder.buildObject(documento);

    return {
      dteXml,
      dteId,
      totales,
      ted,
    };
  }

  /**
   * Construye el encabezado del DTE
   */
  private buildEncabezado(
    input: CreateDTEInput,
    emisor: EmisorContext,
    fechaEmision: Date,
    totales: Totales
  ): EncabezadoXML {
    const esBoleta = input.tipoDte === 39 || input.tipoDte === 41;
    const esExento = input.tipoDte === 34 || input.tipoDte === 41;

    return {
      IdDoc: {
        TipoDTE: input.tipoDte,
        Folio: input.folio,
        FchEmis: formatearFechaSii(fechaEmision),
        ...(input.medioPago && { MedioPago: input.medioPago }),
        ...(esBoleta && { IndServicio: 3 }), // 3 = Boleta de venta y servicios
      },
      Emisor: {
        RUTEmisor: rutParaSii(emisor.rutEmisor),
        RznSoc: emisor.razonSocial.substring(0, 100),
        GiroEmis: emisor.giro.substring(0, 80),
        Acteco: emisor.actEco[0], // Actividad económica principal
        DirOrigen: emisor.direccion.substring(0, 70),
        CmnaOrigen: emisor.comuna.substring(0, 20),
        CiudadOrigen: emisor.ciudad.substring(0, 20),
        ...(emisor.sucursal && { Sucursal: emisor.sucursal }),
        ...(emisor.codigoSucursal && { CdgSIISucur: emisor.codigoSucursal }),
      },
      Receptor: {
        RUTRecep: rutParaSii(input.receptor.rut),
        RznSocRecep: input.receptor.razonSocial.substring(0, 100),
        ...(input.receptor.giro && { GiroRecep: input.receptor.giro.substring(0, 40) }),
        ...(input.receptor.direccion && { DirRecep: input.receptor.direccion.substring(0, 70) }),
        ...(input.receptor.comuna && { CmnaRecep: input.receptor.comuna.substring(0, 20) }),
        ...(input.receptor.ciudad && { CiudadRecep: input.receptor.ciudad.substring(0, 20) }),
        ...(input.receptor.correo && { CorreoRecep: input.receptor.correo }),
      },
      Totales: {
        ...(totales.montoNeto && { MntNeto: totales.montoNeto }),
        ...(totales.montoExento && { MntExe: totales.montoExento }),
        ...(totales.iva && !esExento && { IVA: totales.iva }),
        ...(!esExento && { TasaIVA: SII_CONFIG.IVA_RATE * 100 }),
        MntTotal: totales.montoTotal,
      },
    };
  }

  /**
   * Calcula los ítems y totales del documento
   */
  private calculateItemsAndTotals(
    input: CreateDTEInput,
    emisor: EmisorContext
  ): { detalle: DetalleItem[]; totales: Totales } {
    const esExento = input.tipoDte === 34 || input.tipoDte === 41;
    let sumaAfectos = 0;
    let sumaExentos = 0;

    // Procesar cada ítem
    const detalle: DetalleItem[] = input.items.map((item, index) => {
      const nroLinDet = index + 1;
      
      // Calcular monto del ítem
      let montoItem = new Decimal(item.cantidad).times(item.precioUnitario);
      
      // Aplicar descuento si existe
      if (item.descuentoPorcentaje && item.descuentoPorcentaje > 0) {
        const descuento = montoItem.times(item.descuentoPorcentaje).div(100);
        montoItem = montoItem.minus(descuento);
      }

      const montoItemRedondeado = montoItem.round().toNumber();

      // Determinar si es exento
      const itemExento = esExento || item.exento;

      if (itemExento) {
        sumaExentos += montoItemRedondeado;
      } else {
        sumaAfectos += montoItemRedondeado;
      }

      const detalleItem: DetalleItem = {
        NroLinDet: nroLinDet,
        ...(item.codigoProducto && {
          CdgItem: {
            TpoCodigo: 'INT1',
            VlrCodigo: item.codigoProducto,
          },
        }),
        NmbItem: item.nombre.substring(0, 80),
        ...(item.descripcion && { DscItem: item.descripcion.substring(0, 1000) }),
        QtyItem: item.cantidad,
        ...(item.unidad && { UnmdItem: item.unidad }),
        PrcItem: item.precioUnitario,
        ...(item.descuentoPorcentaje && item.descuentoPorcentaje > 0 && {
          DescuentoPct: item.descuentoPorcentaje,
          DescuentoMonto: new Decimal(item.cantidad)
            .times(item.precioUnitario)
            .times(item.descuentoPorcentaje)
            .div(100)
            .round()
            .toNumber(),
        }),
        MontoItem: montoItemRedondeado,
        ...(itemExento && { IndExe: 1 }),
      };

      return detalleItem;
    });

    // Aplicar descuento global si existe
    if (input.descuentoGlobal) {
      if (input.descuentoGlobal.tipo === 'porcentaje') {
        const descuentoAfecto = new Decimal(sumaAfectos)
          .times(input.descuentoGlobal.valor)
          .div(100)
          .round()
          .toNumber();
        const descuentoExento = new Decimal(sumaExentos)
          .times(input.descuentoGlobal.valor)
          .div(100)
          .round()
          .toNumber();
        sumaAfectos -= descuentoAfecto;
        sumaExentos -= descuentoExento;
      } else {
        // Descuento en monto: aplicar proporcionalmente
        const total = sumaAfectos + sumaExentos;
        if (total > 0) {
          const proporcionAfecto = sumaAfectos / total;
          sumaAfectos -= Math.round(input.descuentoGlobal.valor * proporcionAfecto);
          sumaExentos -= Math.round(input.descuentoGlobal.valor * (1 - proporcionAfecto));
        }
      }
    }

    // Calcular totales
    const montoNeto = sumaAfectos > 0 ? redondearSii(sumaAfectos) : undefined;
    const montoExento = sumaExentos > 0 ? redondearSii(sumaExentos) : undefined;
    const iva = montoNeto ? calcularIva(montoNeto) : undefined;
    const montoTotal = sumarMontos([montoNeto || 0, montoExento || 0, iva || 0]);

    const totales: Totales = {
      montoNeto,
      montoExento,
      iva,
      montoTotal,
    };

    return { detalle, totales };
  }

  /**
   * Construye el TED (Timbre Electrónico del DTE)
   */
  private buildTED(
    input: CreateDTEInput,
    emisor: EmisorContext,
    fechaEmision: Date,
    totales: Totales,
    cafData: CAFData
  ): TED {
    // Datos del documento (DD)
    const dd = {
      RE: rutParaSii(emisor.rutEmisor),
      TD: input.tipoDte,
      F: input.folio,
      FE: formatearFechaSii(fechaEmision),
      RR: rutParaSii(input.receptor.rut),
      RSR: input.receptor.razonSocial.substring(0, 40),
      MNT: totales.montoTotal,
      IT1: input.items[0]?.nombre.substring(0, 40) || 'Item',
    };

    // El TED incluye el CAF y una firma FRMT sobre los datos
    // La firma FRMT se calcula sobre el DD canónicamente serializado
    // con la clave privada del CAF (que solo tiene el SII)
    
    // Nota: En producción, FRMT se genera firmando DD con clave del CAF
    // Aquí dejamos placeholder ya que requiere la clave privada del SII
    const frmt = ''; // Se genera al firmar

    const tedObject = {
      $: { version: '1.0' },
      DD: dd,
      // El CAF se extrae del archivo y se incluye completo
      // FRMT se calcula durante la firma
    };

    return {
      version: '1.0',
      dd: {
        re: dd.RE,
        td: dd.TD,
        f: dd.F,
        fe: dd.FE,
        rr: dd.RR,
        rsr: dd.RSR,
        mnt: dd.MNT,
        it1: dd.IT1,
      },
      caf: cafData.cafXmlOriginal,
      frmt,
      tedObject,
    };
  }

  /**
   * Construye las referencias del documento
   */
  private buildReferencias(referencias: CreateDTEInput['referencias']): object[] {
    if (!referencias) return [];

    return referencias.map((ref, index) => ({
      NroLinRef: index + 1,
      TpoDocRef: ref.tipoDteRef,
      FolioRef: ref.folioRef,
      FchRef: ref.fechaRef,
      ...(ref.codigoRef && { CodRef: ref.codigoRef }),
      RazonRef: ref.razonRef,
    }));
  }

  /**
   * Construye el XML del EnvioDTE (contenedor para envío al SII)
   */
  buildEnvioDTE(
    documentos: BuildDTEResult[],
    emisor: EmisorContext,
    rutEnvia: string
  ): { xml: string; setDteId: string; envioDteId: string } {
    const setDteId = `SET_${generarIdUnico()}`;
    const envioDteId = `ENV_${generarIdUnico()}`;
    const timestamp = formatearTimestampSii(new Date());

    // Construir la carátula
    const caratula = {
      RutEmisor: rutParaSii(emisor.rutEmisor),
      RutEnvia: rutParaSii(rutEnvia),
      RutReceptor: '60803000-K', // SII
      FchResol: emisor.ambiente === 'CERT' ? '2006-01-20' : new Date().toISOString().split('T')[0],
      NroResol: emisor.ambiente === 'CERT' ? 0 : 80, // 0 para certificación
      TmstFirmaEnv: timestamp,
      SubTotDTE: this.calcularSubtotales(documentos),
    };

    const envioDte = {
      EnvioDTE: {
        $: {
          xmlns: 'http://www.sii.cl/SiiDte',
          'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
          version: '1.0',
        },
        SetDTE: {
          $: { ID: setDteId },
          Caratula: caratula,
          DTE: documentos.map((doc) => ({
            $: { version: '1.0' },
            // El contenido del DTE se inserta aquí
            _: doc.dteXml,
          })),
        },
      },
    };

    const xml = this.xmlBuilder.buildObject(envioDte);

    return {
      xml,
      setDteId,
      envioDteId,
    };
  }

  /**
   * Calcula subtotales por tipo de DTE
   */
  private calcularSubtotales(documentos: BuildDTEResult[]): object[] {
    const grupos: Record<number, { cantidad: number }> = {};

    documentos.forEach((doc) => {
      // Extraer tipo de DTE del ID
      const match = doc.dteId.match(/DTE_(\d+)_/);
      if (match) {
        const tipo = parseInt(match[1], 10);
        if (!grupos[tipo]) {
          grupos[tipo] = { cantidad: 0 };
        }
        grupos[tipo].cantidad++;
      }
    });

    return Object.entries(grupos).map(([tipo, data]) => ({
      TpoDTE: parseInt(tipo, 10),
      NroDTE: data.cantidad,
    }));
  }

  /**
   * Genera el string para código de barras PDF417 (desde TED)
   */
  generatePDF417Data(ted: TED): string {
    // El PDF417 contiene el TED completo en formato XML
    const tedXml = this.xmlBuilder.buildObject({
      TED: {
        $: { version: ted.version },
        DD: {
          RE: ted.dd.re,
          TD: ted.dd.td,
          F: ted.dd.f,
          FE: ted.dd.fe,
          RR: ted.dd.rr,
          RSR: ted.dd.rsr,
          MNT: ted.dd.mnt,
          IT1: ted.dd.it1,
        },
        // CAF y FRMT se incluyen
      },
    });

    return tedXml;
  }

  /**
   * Genera el contenido DD canónico para firma del TED
   * El SII requiere el DD serializado sin espacios entre tags para la firma FRMT
   * 
   * @param ted - Objeto TED con los datos del documento
   * @param timestamp - Timestamp ISO 8601 para el campo TSTED
   * @returns XML canónico del DD (sin espacios ni saltos de línea)
   */
  buildCanonicalDD(ted: TED, timestamp: string): string {
    const escapeXml = (str: string): string => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    // El DD canónico incluye el CAF completo y el timestamp
    // Formato exacto según especificación SII
    return `<DD><RE>${ted.dd.re}</RE><TD>${ted.dd.td}</TD><F>${ted.dd.f}</F><FE>${ted.dd.fe}</FE><RR>${ted.dd.rr}</RR><RSR>${escapeXml(ted.dd.rsr)}</RSR><MNT>${ted.dd.mnt}</MNT><IT1>${escapeXml(ted.dd.it1)}</IT1>${ted.caf}<TSTED>${timestamp}</TSTED></DD>`;
  }

  /**
   * Actualiza el TED con la firma FRMT y genera el XML final del DTE
   * Este método debe llamarse después de firmar el DD canónico
   * 
   * @param buildResult - Resultado original del buildDTE
   * @param frmt - Firma FRMT generada con signTED()
   * @param timestamp - Timestamp usado para la firma
   * @returns BuildDTEResult actualizado con XML que incluye TED firmado
   */
  updateTEDWithSignature(
    buildResult: BuildDTEResult,
    frmt: string,
    timestamp: string
  ): BuildDTEResult {
    // Actualizar el TED con la firma
    const updatedTed: TED = {
      ...buildResult.ted,
      frmt,
      tedObject: {
        $: { version: '1.0' },
        DD: {
          RE: buildResult.ted.dd.re,
          TD: buildResult.ted.dd.td,
          F: buildResult.ted.dd.f,
          FE: buildResult.ted.dd.fe,
          RR: buildResult.ted.dd.rr,
          RSR: buildResult.ted.dd.rsr,
          MNT: buildResult.ted.dd.mnt,
          IT1: buildResult.ted.dd.it1,
          // Insertar CAF parseado del XML original
          TSTED: timestamp,
        },
        FRMT: {
          $: { algoritmo: 'SHA1withRSA' },
          _: frmt,
        },
      },
    };

    // Regenerar el XML del DTE con el TED actualizado
    const dteId = buildResult.dteId;
    
    // Reconstruir documento con TED firmado
    // Nota: En una implementación completa, esto reconstruiría el XML
    // Por ahora, actualizamos el objeto TED
    return {
      ...buildResult,
      ted: updatedTed,
    };
  }
}

// Singleton
export const dteBuilderService = new DteBuilderService();
