/**
 * Servicio de Generación de PDF para DTEs
 * Genera representación impresa según normativa SII
 * @module services/DTEPrint-print.service
 */

import PdfPrinter from 'pdfmake';
import bwipjs from 'bwip-js';
import { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces';
import { DTEType, TED, DetalleItem } from '../types';
import { EmisorContext } from '../types/certificate.types';
import { formatearMonto } from '../utils/math.utils';
import { formatearRut } from '../utils/rut.utils';

/**
 * DTEPrint para impresión (estructura simplificada)
 */
export interface DTEPrint {
  id: string;
  encabezado: {
    idDoc: {
      TipoDTE: DTEType;
      Folio: number;
      FchEmis: string;
    };
    emisor: {
      RUTEmisor: string;
      RznSoc: string;
      GiroEmis: string;
      Acteco?: number;
      DirOrigen: string;
      CmnaOrigen: string;
      CiudadOrigen?: string;
    };
    receptor: {
      RUTRecep: string;
      RznSocRecep: string;
      GiroRecep?: string;
      DirRecep?: string;
      CmnaRecep?: string;
      CiudadRecep?: string;
    };
    totales: {
      MntNeto?: number;
      MntExe?: number;
      TasaIVA?: number;
      IVA?: number;
      MntTotal: number;
    };
  };
  detalle: DetalleItem[];
  observaciones?: string;
  ted?: TED;
}

// Fuentes para pdfmake
const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

/**
 * Opciones de impresión
 */
export interface PrintOptions {
  copiaTexto?: string; // "ORIGINAL", "COPIA CEDIBLE", etc.
  incluirCedible?: boolean;
  tamañoPapel?: 'carta' | 'oficio' | 'termica80';
  logoBase64?: string;
}

/**
 * Servicio para generar PDFs de DTEs
 */
export class DtePrintService {
  private printer: PdfPrinter;

  constructor() {
    this.printer = new PdfPrinter(fonts);
  }

  /**
   * Genera el PDF de un DTEPrint
   * @param DTEPrint - Datos del DTEPrint
   * @param emisor - Contexto del emisor
   * @param ted - Timbre electrónico
   * @param options - Opciones de impresión
   * @returns Buffer del PDF
   */
  async generatePdf(
    DTEPrint: DTEPrint,
    emisor: EmisorContext,
    ted: TED,
    options: PrintOptions = {}
  ): Promise<Buffer> {
    // Generar código de barras PDF417
    const barcodeBase64 = await this.generatePDF417(ted);

    // Construir definición del documento
    const docDefinition = this.buildDocDefinition(DTEPrint, emisor, ted, barcodeBase64, options);

    // Generar PDF
    return new Promise((resolve, reject) => {
      const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];

      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);

      pdfDoc.end();
    });
  }

  /**
   * Genera el código de barras PDF417 del TED
   * @param ted - Timbre electrónico
   * @returns Base64 del código de barras
   */
  private async generatePDF417(ted: TED): Promise<string> {
    // Construir el XML del TED para el código de barras
    const tedXml = this.buildTedXml(ted);

    try {
      // Opciones de PDF417 requieren type assertion por tipos incompletos
      const png = await bwipjs.toBuffer({
        bcid: 'pdf417',
        text: tedXml,
        scale: 2,
        height: 8,
        includetext: false,
        columns: 10,
        eclevel: 5, // Nivel de corrección de errores (5 = ~62.5%)
      } as Parameters<typeof bwipjs.toBuffer>[0]);

      return `data:image/png;base64,${png.toString('base64')}`;
    } catch (error) {
      console.error('Error generando PDF417:', error);
      throw new Error('No se pudo generar el código de barras PDF417');
    }
  }

  /**
   * Construye el XML del TED para el código de barras
   */
  private buildTedXml(ted: TED): string {
    return `<TED version="${ted.version}">` +
      `<DD>` +
      `<RE>${ted.dd.re}</RE>` +
      `<TD>${ted.dd.td}</TD>` +
      `<F>${ted.dd.f}</F>` +
      `<FE>${ted.dd.fe}</FE>` +
      `<RR>${ted.dd.rr}</RR>` +
      `<RSR>${ted.dd.rsr}</RSR>` +
      `<MNT>${ted.dd.mnt}</MNT>` +
      `<IT1>${ted.dd.it1}</IT1>` +
      `</DD>` +
      `<FRMT algoritmo="SHA1withRSA">${ted.frmt}</FRMT>` +
      `</TED>`;
  }

  /**
   * Construye la definición del documento PDF
   */
  private buildDocDefinition(
    DTEPrint: DTEPrint,
    emisor: EmisorContext,
    ted: TED,
    barcodeBase64: string,
    options: PrintOptions
  ): TDocumentDefinitions {
    const tipoDte = DTEPrint.encabezado.idDoc.TipoDTE;
    const nombreDoc = this.getNombreDocumento(tipoDte);
    const esBoleta = tipoDte === 39 || tipoDte === 41;

    return {
      pageSize: this.getPageSize(options.tamañoPapel),
      pageMargins: [40, 40, 40, 60],
      defaultStyle: {
        font: 'Helvetica',
        fontSize: 9,
      },
      content: [
        // Encabezado con logo y datos emisor
        this.buildHeader(emisor, options.logoBase64),

        // Recuadro tipo documento
        this.buildDocTypeBox(tipoDte, nombreDoc, DTEPrint.encabezado.idDoc.Folio),

        // Datos del receptor
        this.buildReceptorSection(DTEPrint),

        // Tabla de detalle
        this.buildDetalleTable(DTEPrint.detalle, esBoleta),

        // Totales
        this.buildTotalesSection(DTEPrint, esBoleta),

        // Observaciones
        ...(DTEPrint.observaciones ? [this.buildObservaciones(DTEPrint.observaciones)] : []),

        // Timbre electrónico
        this.buildTimbreSection(barcodeBase64, ted),

        // Acuse de recibo (si es cedible)
        ...(options.incluirCedible ? [this.buildAcuseRecibo()] : []),

        // Texto de copia
        ...(options.copiaTexto ? [this.buildCopiaTexto(options.copiaTexto)] : []),
      ],
      footer: this.buildFooter(),
    };
  }

  /**
   * Construye el encabezado del documento
   */
  private buildHeader(emisor: EmisorContext, logoBase64?: string): Content {
    const content: Content[] = [];

    if (logoBase64) {
      content.push({
        image: logoBase64,
        width: 120,
        alignment: 'left',
      });
    }

    content.push({
      stack: [
        { text: emisor.razonSocial, style: 'empresaNombre', bold: true },
        { text: `Giro: ${emisor.giro}`, fontSize: 8 },
        { text: `${emisor.direccion}, ${emisor.comuna}`, fontSize: 8 },
        { text: emisor.ciudad, fontSize: 8 },
      ],
      margin: [0, 10, 0, 10],
    });

    return {
      columns: content,
      columnGap: 10,
    };
  }

  /**
   * Construye el recuadro del tipo de documento
   */
  private buildDocTypeBox(tipoDte: DTEType, nombreDoc: string, folio: number): Content {
    return {
      columns: [
        { width: '*', text: '' }, // Spacer para alinear a la derecha
        {
          width: 200,
          table: {
            widths: ['*'],
            body: [
              [
                {
                  stack: [
                    { text: `R.U.T.: [RUT EMISOR]`, alignment: 'center', bold: true },
                    { text: nombreDoc.toUpperCase(), alignment: 'center', bold: true, fontSize: 12 },
                    { text: `N° ${folio}`, alignment: 'center', bold: true, fontSize: 14 },
                  ],
                  margin: [10, 10],
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 2,
            vLineWidth: () => 2,
            hLineColor: () => 'red',
            vLineColor: () => 'red',
          },
        },
      ],
      margin: [0, 0, 0, 15],
    };
  }

  /**
   * Construye la sección del receptor
   */
  private buildReceptorSection(DTEPrint: DTEPrint): Content {
    const receptor = DTEPrint.encabezado.receptor;

    return {
      table: {
        widths: [80, '*'],
        body: [
          ['RUT:', formatearRut(receptor.RUTRecep)],
          ['Razón Social:', receptor.RznSocRecep],
          ...(receptor.GiroRecep ? [['Giro:', receptor.GiroRecep]] : []),
          ...(receptor.DirRecep ? [['Dirección:', receptor.DirRecep]] : []),
          ...(receptor.CmnaRecep ? [['Comuna:', receptor.CmnaRecep]] : []),
        ] as TableCell[][],
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 15],
    };
  }

  /**
   * Construye la tabla de detalle
   */
  private buildDetalleTable(detalle: DetalleItem[], esBoleta: boolean): Content {
    const headers = esBoleta
      ? ['Cant.', 'Descripción', 'P.Unit', 'Total']
      : ['Item', 'Código', 'Descripción', 'Cant.', 'Unidad', 'P.Unit', 'Dcto', 'Total'];

    const widths = esBoleta
      ? [40, '*', 60, 60]
      : [25, 50, '*', 40, 40, 50, 40, 60];

    const body: TableCell[][] = [
      headers.map((h) => ({ text: h, bold: true, fillColor: '#eeeeee' })),
    ];

    detalle.forEach((item) => {
      if (esBoleta) {
        body.push([
          item.QtyItem.toString(),
          item.NmbItem,
          `$${formatearMonto(item.PrcItem)}`,
          `$${formatearMonto(item.MontoItem)}`,
        ]);
      } else {
        body.push([
          item.NroLinDet.toString(),
          item.CdgItem?.VlrCodigo || '-',
          item.NmbItem,
          item.QtyItem.toString(),
          item.UnmdItem || '-',
          `$${formatearMonto(item.PrcItem)}`,
          item.DescuentoPct ? `${item.DescuentoPct}%` : '-',
          `$${formatearMonto(item.MontoItem)}`,
        ]);
      }
    });

    return {
      table: {
        headerRows: 1,
        widths,
        body,
      },
      margin: [0, 0, 0, 15],
    };
  }

  /**
   * Construye la sección de totales
   */
  private buildTotalesSection(DTEPrint: DTEPrint, esBoleta: boolean): Content {
    const totales = DTEPrint.encabezado.totales;
    const rows: TableCell[][] = [];

    if (totales.MntNeto) {
      rows.push(['Monto Neto:', `$${formatearMonto(totales.MntNeto)}`]);
    }
    if (totales.MntExe) {
      rows.push(['Monto Exento:', `$${formatearMonto(totales.MntExe)}`]);
    }
    if (totales.IVA && !esBoleta) {
      rows.push([`IVA (${totales.TasaIVA || 19}%):`, `$${formatearMonto(totales.IVA)}`]);
    }
    rows.push([
      { text: 'TOTAL:', bold: true },
      { text: `$${formatearMonto(totales.MntTotal)}`, bold: true },
    ]);

    return {
      columns: [
        { width: '*', text: '' },
        {
          width: 200,
          table: {
            widths: ['*', 80],
            body: rows,
          },
          layout: 'noBorders',
        },
      ],
      margin: [0, 0, 0, 15],
    };
  }

  /**
   * Construye la sección de observaciones
   */
  private buildObservaciones(observaciones: string): Content {
    return {
      stack: [
        { text: 'Observaciones:', bold: true },
        { text: observaciones, fontSize: 8 },
      ],
      margin: [0, 0, 0, 15],
    };
  }

  /**
   * Construye la sección del timbre electrónico
   */
  private buildTimbreSection(barcodeBase64: string, ted: TED): Content {
    return {
      columns: [
        {
          width: 180,
          image: barcodeBase64,
          fit: [180, 80],
        },
        {
          width: '*',
          stack: [
            { text: 'Timbre Electrónico SII', fontSize: 7, bold: true },
            { text: `Resolución N° ${ted.dd.td === 39 ? '80' : '0'} del 2006`, fontSize: 6 },
            { text: 'Verifique documento: www.sii.cl', fontSize: 6 },
          ],
          margin: [10, 10, 0, 0],
        },
      ],
      margin: [0, 10, 0, 10],
    };
  }

  /**
   * Construye el acuse de recibo para documentos cedibles
   */
  private buildAcuseRecibo(): Content {
    return {
      table: {
        widths: ['*'],
        body: [
          [
            {
              stack: [
                { text: 'ACUSE DE RECIBO', bold: true, alignment: 'center' },
                { text: '\n' },
                {
                  text: 'Nombre: _______________________________',
                  fontSize: 8,
                },
                { text: 'RUT: _________________________________', fontSize: 8 },
                { text: 'Fecha: ________________ Hora: _________', fontSize: 8 },
                { text: 'Recinto: ______________________________', fontSize: 8 },
                { text: '\n' },
                { text: 'Firma: ________________________________', fontSize: 8 },
                {
                  text:
                    'El acuse de recibo que se declara en este acto, de acuerdo a lo dispuesto en la letra b) del Art. 4° y la letra c) del Art. 5° de la Ley 19.983, acredita que la entrega de mercaderías o servicio(s) prestado(s) ha(n) sido recibido(s).',
                  fontSize: 6,
                  italics: true,
                  margin: [0, 5, 0, 0],
                },
              ],
              margin: [10, 10],
            },
          ],
        ],
      },
      layout: 'lightHorizontalLines',
      margin: [0, 20, 0, 0],
    };
  }

  /**
   * Construye el texto de tipo de copia
   */
  private buildCopiaTexto(texto: string): Content {
    return {
      text: texto,
      alignment: 'center',
      bold: true,
      fontSize: 10,
      margin: [0, 10, 0, 0],
    };
  }

  /**
   * Construye el pie de página
   */
  private buildFooter(): Content {
    return {
      columns: [
        {
          text: 'Documento generado electrónicamente',
          fontSize: 7,
          alignment: 'center',
        },
      ],
      margin: [40, 0],
    };
  }

  /**
   * Obtiene el nombre del documento según tipo
   */
  private getNombreDocumento(tipoDte: DTEType): string {
    const nombres: Record<number, string> = {
      33: 'Factura Electrónica',
      34: 'Factura No Afecta o Exenta Electrónica',
      39: 'Boleta Electrónica',
      41: 'Boleta Exenta Electrónica',
      52: 'Guía de Despacho Electrónica',
      56: 'Nota de Débito Electrónica',
      61: 'Nota de Crédito Electrónica',
    };
    return nombres[tipoDte] || `Documento ${tipoDte}`;
  }

  /**
   * Obtiene el tamaño de página según opción
   */
  private getPageSize(
    tamaño?: 'carta' | 'oficio' | 'termica80'
  ): 'LETTER' | 'LEGAL' | { width: number; height: number } {
    switch (tamaño) {
      case 'oficio':
        return 'LEGAL';
      case 'termica80':
        return { width: 226.77, height: 841.89 }; // 80mm x 297mm
      default:
        return 'LETTER';
    }
  }
}

// Singleton
export const dtePrintService = new DtePrintService();
