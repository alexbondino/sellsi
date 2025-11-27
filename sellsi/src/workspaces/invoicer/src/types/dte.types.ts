/**
 * Tipos para Documentos Tributarios Electrónicos (DTE)
 * Basado en los XSD oficiales del SII
 * @module types/dte.types
 */

/**
 * Tipos de documento tributario soportados
 */
export type DTEType = 33 | 34 | 39 | 41 | 46 | 52 | 56 | 61 | 110 | 111 | 112;

/**
 * RUT con número y dígito verificador
 */
export interface RUT {
  numero: number;
  dv: string;
  formatted: string; // "12345678-9"
}

/**
 * Emisor del documento
 */
export interface Emisor {
  RUTEmisor: string;
  RznSoc: string;           // max 100 chars
  GiroEmis: string;         // max 80 chars
  Acteco?: number[];        // códigos actividad económica
  DirOrigen: string;        // max 70 chars
  CmnaOrigen: string;       // max 20 chars
  CiudadOrigen?: string;    // max 20 chars
  Telefono?: string;        // max 20 chars
  CorreoEmisor?: string;
  CdgSIISucur?: number;     // código sucursal SII
}

/**
 * Receptor del documento
 */
export interface Receptor {
  RUTRecep: string;
  RznSocRecep: string;      // max 100 chars
  GiroRecep?: string;       // max 40 chars
  DirRecep?: string;        // max 70 chars
  CmnaRecep?: string;       // max 20 chars
  CiudadRecep?: string;     // max 20 chars
  Contacto?: string;        // max 80 chars
  CorreoRecep?: string;
}

/**
 * Identificación del documento
 */
export interface IdDoc {
  TipoDTE: DTEType;
  Folio: number;
  FchEmis: string;          // YYYY-MM-DD
  FchVenc?: string;         // YYYY-MM-DD
  TpoTranCompra?: number;
  TpoTranVenta?: number;
  FmaPago?: 1 | 2 | 3;      // 1=Contado, 2=Crédito, 3=Sin costo
  MntBruto?: 0 | 1;         // 1=Montos incluyen IVA
  MedioPago?: 'CH' | 'LT' | 'EF' | 'PE' | 'TC' | 'CF' | 'OT';
}

/**
 * Línea de detalle del documento
 */
export interface DetalleItem {
  NroLinDet: number;        // 1-60
  CdgItem?: {
    TpoCodigo: string;      // INT1, INT2, EAN13, PLU, etc.
    VlrCodigo: string;
  };
  NmbItem: string;          // max 80 chars
  DscItem?: string;         // max 1000 chars
  QtyItem: number;
  UnmdItem?: string;        // max 4 chars
  PrcItem: number;
  DescuentoPct?: number;
  DescuentoMonto?: number;
  RecargoMonto?: number;
  MontoItem: number;
  IndExe?: 1 | 2 | 6;       // 1=no afecto, 2=no fact, 6=producto/servicio
}

/**
 * Totales del documento (formato SII XML)
 */
export interface TotalesSII {
  MntNeto?: number;
  MntExe?: number;
  TasaIVA?: number;
  IVA?: number;
  MntTotal: number;
  ImptoReten?: ImpuestoRetencion[];
}

/**
 * Totales del documento (formato interno camelCase)
 */
export interface Totales {
  montoNeto?: number;
  montoExento?: number;
  tasaIVA?: number;
  iva?: number;
  montoTotal: number;
  impuestosRetencion?: ImpuestoRetencion[];
}

/**
 * Impuesto de retención o adicional
 */
export interface ImpuestoRetencion {
  TipoImp: number;          // código impuesto adicional
  TasaImp?: number;
  MontoImp: number;
}

/**
 * Referencia a otro documento
 */
export interface Referencia {
  NroLinRef: number;
  TpoDocRef: string;        // código tipo doc o nombre libre
  FolioRef?: string;
  FchRef?: string;          // YYYY-MM-DD
  CodRef?: 1 | 2 | 3;       // 1=Anula, 2=Corrige texto, 3=Corrige monto
  RazonRef?: string;        // max 90 chars
}

/**
 * Encabezado del DTE
 */
export interface Encabezado {
  IdDoc: IdDoc;
  Emisor: Emisor;
  Receptor: Receptor;
  Totales: Totales;
}

/**
 * Timbre Electrónico (TED) - formato XML SII
 */
export interface TimbreElectronicoSII {
  DD: {
    RE: string;             // RUT Emisor
    TD: number;             // Tipo DTE
    F: number;              // Folio
    FE: string;             // Fecha Emisión
    RR: string;             // RUT Receptor
    RSR: string;            // Razón Social Receptor
    MNT: number;            // Monto Total
    IT1: string;            // Item 1 (primer producto)
    CAF: {
      DA: CAFAutorizacion;
    };
    TSTED: string;          // Timestamp del timbre
  };
  FRMT: string;             // Firma del timbre (Base64)
}

/**
 * Timbre Electrónico (TED) - formato interno para servicios
 */
export interface TimbreElectronico {
  version: string;
  dd: {
    re: string;             // RUT Emisor
    td: number;             // Tipo DTE
    f: number;              // Folio
    fe: string;             // Fecha Emisión
    rr: string;             // RUT Receptor
    rsr: string;            // Razón Social Receptor
    mnt: number;            // Monto Total
    it1: string;            // Item 1 (primer producto)
  };
  caf: string;              // CAF XML original
  frmt: string;             // Firma del timbre
  tedObject: object;        // Objeto para XML
}

/**
 * Datos de autorización del CAF dentro del TED
 */
export interface CAFAutorizacion {
  RE: string;               // RUT Emisor
  RS: string;               // Razón Social
  TD: number;               // Tipo DTE
  RNG: {
    D: number;              // Folio Desde
    H: number;              // Folio Hasta
  };
  FA: string;               // Fecha Autorización
  RSAPK: {
    M: string;              // Módulo (Base64)
    E: string;              // Exponente (Base64)
  };
  IDK: number;              // ID de la clave
}

/**
 * DTE completo
 */
export interface DTE {
  Encabezado: Encabezado;
  Detalle: DetalleItem[];
  Referencia?: Referencia[];
  TED?: TimbreElectronico;
}

/**
 * Sobre de envío de DTEs
 */
export interface EnvioDTE {
  SetDTE: {
    Caratula: {
      RutEmisor: string;
      RutEnvia: string;
      RutReceptor: string;
      FchResol: string;
      NroResol: number;
      TmstFirmaEnv: string;
      SubTotDTE: {
        TpoDTE: DTEType;
        NroDTE: number;
      }[];
    };
    DTE: DTE[];
  };
  Signature?: XMLSignature;
}

/**
 * Firma XML
 */
export interface XMLSignature {
  SignedInfo: {
    CanonicalizationMethod: { Algorithm: string };
    SignatureMethod: { Algorithm: string };
    Reference: {
      URI: string;
      Transforms: { Transform: { Algorithm: string }[] };
      DigestMethod: { Algorithm: string };
      DigestValue: string;
    };
  };
  SignatureValue: string;
  KeyInfo: {
    KeyValue: {
      RSAKeyValue: {
        Modulus: string;
        Exponent: string;
      };
    };
    X509Data: {
      X509Certificate: string;
    };
  };
}

/**
 * Alias para compatibilidad - TED es sinónimo de TimbreElectronico
 */
export type TED = TimbreElectronico;

/**
 * Input para crear un DTE (con nombres en camelCase para conveniencia)
 */
export interface DTEInput {
  tipoDTE: DTEType;
  folio: number;
  fechaEmision: string;
  emisor: {
    rut: string;
    razonSocial: string;
    giro: string;
    direccion: string;
    comuna: string;
    ciudad?: string;
    acteco?: number[];
  };
  receptor: {
    rut: string;
    razonSocial: string;
    giro?: string;
    direccion?: string;
    comuna?: string;
    ciudad?: string;
    correo?: string;
  };
  items: {
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    montoItem: number;
    codigoInterno?: string;
    descripcion?: string;
    unidad?: string;
    exento?: boolean;
  }[];
  montoNeto?: number;
  montoExento?: number;
  tasaIVA?: number;
  iva?: number;
  montoTotal: number;
  referencias?: {
    tipoDocRef: string;
    folioRef?: string;
    fechaRef?: string;
    codigoRef?: 1 | 2 | 3;
    razonRef?: string;
  }[];
}
