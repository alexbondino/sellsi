/**
 * Servicio de Firma Digital para SII
 * Implementa XMLDSig según especificación del SII
 * @module services/signature.service
 */

import * as crypto from 'crypto';
import * as forge from 'node-forge';
import { SignedXml } from 'xml-crypto';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { ParsedCertificate, CertificateValidationResult } from '../types';

/**
 * Servicio para manejo de certificados y firma digital
 */
export class SignatureService {
  private certificate: ParsedCertificate | null = null;
  private privateKey: forge.pki.PrivateKey | null = null;

  /**
   * Carga un certificado PFX/P12
   * @param pfxBase64 - Certificado en Base64
   * @param passphrase - Contraseña del certificado
   */
  async loadCertificate(pfxBase64: string, passphrase: string): Promise<ParsedCertificate> {
    try {
      // Decodificar PFX
      const pfxDer = forge.util.decode64(pfxBase64);
      const pfxAsn1 = forge.asn1.fromDer(pfxDer);
      const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, passphrase);

      // Extraer certificado
      const certBags = pfx.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag];
      
      if (!certBag || certBag.length === 0) {
        throw new Error('No se encontró certificado en el archivo PFX');
      }

      const cert = certBag[0].cert;
      if (!cert) {
        throw new Error('Certificado inválido');
      }

      // Extraer clave privada
      const keyBags = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];
      
      if (!keyBag || keyBag.length === 0) {
        throw new Error('No se encontró clave privada en el archivo PFX');
      }

      this.privateKey = keyBag[0].key as forge.pki.PrivateKey;
      if (!this.privateKey) {
        throw new Error('Clave privada inválida');
      }

      // Construir objeto ParsedCertificate
      this.certificate = {
        subject: {
          commonName: cert.subject.getField('CN')?.value || '',
          serialNumber: cert.subject.getField('serialNumber')?.value || '',
          organization: cert.subject.getField('O')?.value,
          country: cert.subject.getField('C')?.value || 'CL',
        },
        issuer: {
          commonName: cert.issuer.getField('CN')?.value || '',
          organization: cert.issuer.getField('O')?.value || '',
          country: cert.issuer.getField('C')?.value || '',
        },
        serialNumber: cert.serialNumber,
        validity: {
          notBefore: cert.validity.notBefore,
          notAfter: cert.validity.notAfter,
        },
        fingerprint: this.calculateFingerprint(cert),
        pem: forge.pki.certificateToPem(cert),
        privateKeyPem: forge.pki.privateKeyToPem(this.privateKey),
      };

      return this.certificate;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Invalid password')) {
          throw new Error('Contraseña del certificado incorrecta');
        }
        throw error;
      }
      throw new Error('Error al cargar el certificado');
    }
  }

  /**
   * Calcula la huella digital SHA-256 del certificado
   */
  private calculateFingerprint(cert: forge.pki.Certificate): string {
    const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
    const md = forge.md.sha256.create();
    md.update(der);
    return md.digest().toHex().toUpperCase();
  }

  /**
   * Valida el certificado cargado
   */
  validateCertificate(): CertificateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.certificate) {
      return { isValid: false, errors: ['No hay certificado cargado'], warnings: [] };
    }

    const now = new Date();
    const { notBefore, notAfter } = this.certificate.validity;

    // Verificar que no esté vencido
    if (now > notAfter) {
      errors.push(`Certificado vencido el ${notAfter.toISOString().split('T')[0]}`);
    }

    // Verificar que ya sea válido
    if (now < notBefore) {
      errors.push(`Certificado aún no válido, inicia el ${notBefore.toISOString().split('T')[0]}`);
    }

    // Advertir si vence pronto (30 días)
    const diasRestantes = Math.floor((notAfter.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diasRestantes > 0 && diasRestantes <= 30) {
      warnings.push(`Certificado vence en ${diasRestantes} días`);
    }

    // Verificar que tenga RUT en serialNumber
    const rut = this.certificate.subject.serialNumber;
    if (!rut || !rut.match(/^\d{7,8}-[\dkK]$/)) {
      warnings.push('El certificado no contiene RUT válido en serialNumber');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      certificate: this.certificate,
    };
  }

  /**
   * Firma un documento XML según especificación XMLDSig del SII
   * @param xml - XML a firmar
   * @param referenceUri - URI del elemento a firmar (default: "" para documento completo)
   * @returns XML firmado
   */
  signXml(xml: string, referenceUri: string = ''): string {
    if (!this.certificate || !this.privateKey) {
      throw new Error('Certificado no cargado. Llame a loadCertificate primero.');
    }

    // Parsear el XML
    const doc = new DOMParser().parseFromString(xml, 'application/xml');

    // Crear objeto de firma con opciones del SII
    const sig = new SignedXml(null, {
      signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
      canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    });

    // Configurar la clave de firma
    sig.signingKey = this.certificate.privateKeyPem!;

    // Agregar referencia al documento usando la firma correcta del método
    const xpath = referenceUri ? `//*[@ID='${referenceUri}']` : '/*';
    const transforms = [
      'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
      'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    ];
    const digestAlgorithm = 'http://www.w3.org/2000/09/xmldsig#sha1';
    const uri = referenceUri ? `#${referenceUri}` : '';

    sig.addReference(xpath, transforms, digestAlgorithm, uri);

    // Computar la firma
    sig.computeSignature(xml, {
      location: { reference: '/*', action: 'append' },
    });

    return sig.getSignedXml();
  }

  /**
   * Firma específica para Documento DTE
   * @param dteXml - XML del DTE (sin firma)
   * @param dteId - ID del DTE para la referencia
   * @returns XML del DTE firmado
   */
  signDte(dteXml: string, dteId: string): string {
    return this.signXml(dteXml, dteId);
  }

  /**
   * Firma el SetDTE completo
   * @param setDteXml - XML del SetDTE
   * @param setDteId - ID del SetDTE
   * @returns XML del SetDTE firmado
   */
  signSetDte(setDteXml: string, setDteId: string): string {
    return this.signXml(setDteXml, setDteId);
  }

  /**
   * Firma el EnvioDTE completo
   * @param envioDteXml - XML del EnvioDTE
   * @param envioDteId - ID del EnvioDTE
   * @returns XML del EnvioDTE firmado
   */
  signEnvioDte(envioDteXml: string, envioDteId: string): string {
    return this.signXml(envioDteXml, envioDteId);
  }

  /**
   * Verifica la firma de un XML
   * @param signedXml - XML firmado
   * @returns true si la firma es válida
   */
  verifySignature(signedXml: string): boolean {
    try {
      const doc = new DOMParser().parseFromString(signedXml, 'application/xml');
      const signatureElements = doc.getElementsByTagNameNS(
        'http://www.w3.org/2000/09/xmldsig#',
        'Signature'
      );

      if (signatureElements.length === 0) {
        return false;
      }

      const sig = new SignedXml();
      sig.loadSignature(new XMLSerializer().serializeToString(signatureElements[0]));
      
      return sig.checkSignature(signedXml);
    } catch {
      return false;
    }
  }

  /**
   * Obtiene el certificado cargado
   */
  getCertificate(): ParsedCertificate | null {
    return this.certificate;
  }

  /**
   * Obtiene el RUT del titular del certificado
   */
  getRutTitular(): string | null {
    return this.certificate?.subject.serialNumber || null;
  }

  /**
   * Obtiene el certificado X.509 en formato Base64 (para incluir en XML)
   */
  getCertificateBase64(): string {
    if (!this.certificate) {
      throw new Error('Certificado no cargado');
    }
    
    // Extraer solo el contenido Base64 del PEM
    const pem = this.certificate.pem;
    const base64 = pem
      .replace('-----BEGIN CERTIFICATE-----', '')
      .replace('-----END CERTIFICATE-----', '')
      .replace(/\s/g, '');
    
    return base64;
  }

  /**
   * Firma el contenido DD del TED (Timbre Electrónico del DTE)
   * Genera la firma FRMT requerida por el SII usando RSA-SHA1
   * 
   * @param ddContent - Contenido DD del TED serializado canónicamente (sin espacios ni saltos de línea)
   * @returns Firma en Base64 para el campo FRMT del TED
   * @throws Error si no hay certificado/clave privada cargados
   * 
   * @example
   * ```typescript
   * const ddXml = '<DD><RE>12345678-9</RE><TD>33</TD>...</DD>';
   * const frmt = signatureService.signTED(ddXml);
   * // frmt contiene la firma Base64 para insertar en <FRMT algoritmo="SHA1withRSA">...</FRMT>
   * ```
   */
  signTED(ddContent: string): string {
    if (!this.certificate || !this.certificate.privateKeyPem) {
      throw new Error('Certificado no cargado. Llame a loadCertificate primero.');
    }

    // Crear firma RSA-SHA1 según especificación SII
    const sign = crypto.createSign('RSA-SHA1');
    sign.update(ddContent, 'utf8');
    
    // Firmar con la clave privada del certificado del emisor
    const signature = sign.sign(this.certificate.privateKeyPem, 'base64');
    
    return signature;
  }

  /**
   * Serializa canónicamente el contenido DD para firma
   * Elimina espacios en blanco entre tags según requerimiento SII
   * 
   * @param ddObject - Objeto con los datos del DD
   * @returns XML canónico del DD (sin espacios ni saltos de línea)
   */
  canonicalizeDDForSignature(ddObject: {
    RE: string;   // RUT Emisor
    TD: number;   // Tipo DTE
    F: number;    // Folio
    FE: string;   // Fecha Emisión
    RR: string;   // RUT Receptor
    RSR: string;  // Razón Social Receptor
    MNT: number;  // Monto Total
    IT1: string;  // Primer Item
    CAF: string;  // XML del CAF (nodo completo)
    TSTED: string; // Timestamp
  }): string {
    // El SII requiere el DD serializado sin espacios entre tags
    return `<DD><RE>${ddObject.RE}</RE><TD>${ddObject.TD}</TD><F>${ddObject.F}</F><FE>${ddObject.FE}</FE><RR>${ddObject.RR}</RR><RSR>${this.escapeXml(ddObject.RSR)}</RSR><MNT>${ddObject.MNT}</MNT><IT1>${this.escapeXml(ddObject.IT1)}</IT1>${ddObject.CAF}<TSTED>${ddObject.TSTED}</TSTED></DD>`;
  }

  /**
   * Escapa caracteres especiales para XML
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Limpia los datos sensibles de memoria
   */
  clear(): void {
    this.certificate = null;
    this.privateKey = null;
  }
}

// Singleton para uso común
export const signatureService = new SignatureService();
