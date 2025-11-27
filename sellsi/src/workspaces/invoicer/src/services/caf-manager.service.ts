/**
 * Servicio de Gestión de CAF (Código de Autorización de Folios)
 * Parseo, validación y gestión de folios
 * @module services/caf-manager.service
 */

import { DOMParser } from '@xmldom/xmldom';
import * as forge from 'node-forge';
import { DTEType, CAFData, FolioRecord, NextFolioResult, CAFStats } from '../types';

/**
 * Servicio para gestionar Códigos de Autorización de Folios
 */
export class CafManagerService {
  /**
   * Parsea un archivo CAF XML
   * @param cafXml - XML del CAF
   * @returns Datos del CAF parseado
   */
  parseCAF(cafXml: string): CAFData {
    try {
      const doc = new DOMParser().parseFromString(cafXml, 'application/xml');

      // Obtener nodo AUTORIZACION/CAF
      const cafNode = doc.getElementsByTagName('CAF')[0];
      if (!cafNode) {
        throw new Error('El archivo no contiene un CAF válido');
      }

      // Obtener versión
      const version = cafNode.getAttribute('version') || '1.0';

      // Datos del CAF (dentro de DA)
      const daNode = cafNode.getElementsByTagName('DA')[0];
      if (!daNode) {
        throw new Error('No se encontró nodo DA en el CAF');
      }

      // Extraer datos
      const tipoDte = this.getTextContent(daNode, 'TD') as unknown as DTEType;
      const rutEmisor = this.getTextContent(daNode, 'RUT');
      const razonSocial = this.getTextContent(daNode, 'RS');
      
      // Rango de folios
      const rngNode = daNode.getElementsByTagName('RNG')[0];
      if (!rngNode) {
        throw new Error('No se encontró rango de folios en el CAF');
      }
      const folioDesde = parseInt(this.getTextContent(rngNode, 'D'), 10);
      const folioHasta = parseInt(this.getTextContent(rngNode, 'H'), 10);

      // Fecha de autorización
      const fechaAutorizacion = this.getTextContent(daNode, 'FA');

      // Clave pública RSA
      const rsapkNode = daNode.getElementsByTagName('RSAPK')[0];
      if (!rsapkNode) {
        throw new Error('No se encontró clave pública RSA en el CAF');
      }
      const modulus = this.getTextContent(rsapkNode, 'M');
      const exponent = this.getTextContent(rsapkNode, 'E');

      // ID de la clave
      const idK = parseInt(this.getTextContent(daNode, 'IDK'), 10);

      // Firma del SII
      const frma = this.getTextContent(cafNode, 'FRMA');
      if (!frma) {
        throw new Error('No se encontró firma del SII en el CAF');
      }

      return {
        version,
        tipoDte: parseInt(tipoDte.toString(), 10) as DTEType,
        rutEmisor,
        razonSocial,
        folioDesde,
        folioHasta,
        fechaAutorizacion,
        rsaPubKey: { modulus, exponent },
        idK,
        frma,
        cafXmlOriginal: cafXml,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al parsear CAF: ${error.message}`);
      }
      throw new Error('Error desconocido al parsear CAF');
    }
  }

  /**
   * Obtiene el contenido de texto de un elemento
   */
  private getTextContent(parent: Element, tagName: string): string {
    const element = parent.getElementsByTagName(tagName)[0];
    if (!element || !element.textContent) {
      throw new Error(`No se encontró elemento ${tagName}`);
    }
    return element.textContent.trim();
  }

  /**
   * Valida la firma del CAF
   * @param cafData - Datos del CAF parseado
   * @returns true si la firma es válida
   */
  verifyCAFSignature(cafData: CAFData): boolean {
    try {
      const doc = new DOMParser().parseFromString(cafData.cafXmlOriginal, 'application/xml');
      
      // Extraer el nodo DA (los datos firmados)
      const daNode = doc.getElementsByTagName('DA')[0];
      if (!daNode) return false;

      // Serializar DA para verificar (normalizado)
      const daXml = this.serializeNode(daNode);

      // Construir clave pública RSA desde los parámetros del CAF
      const publicKey = this.buildPublicKey(cafData.rsaPubKey.modulus, cafData.rsaPubKey.exponent);

      // Decodificar la firma (Base64)
      const signatureBytes = forge.util.decode64(cafData.frma);

      // Verificar firma RSA-SHA1
      const md = forge.md.sha1.create();
      md.update(daXml, 'utf8');
      
      return publicKey.verify(md.digest().bytes(), signatureBytes);
    } catch (error) {
      console.error('Error verificando firma CAF:', error);
      return false;
    }
  }

  /**
   * Construye la clave pública RSA desde modulus y exponente
   */
  private buildPublicKey(modulusB64: string, exponentB64: string): forge.pki.rsa.PublicKey {
    const n = new forge.jsbn.BigInteger(forge.util.bytesToHex(forge.util.decode64(modulusB64)), 16);
    const e = new forge.jsbn.BigInteger(forge.util.bytesToHex(forge.util.decode64(exponentB64)), 16);
    
    return forge.pki.rsa.setPublicKey(n, e);
  }

  /**
   * Serializa un nodo XML de forma consistente
   */
  private serializeNode(node: Node): string {
    // Implementación simplificada - en producción usar c14n
    const serializer = new (require('@xmldom/xmldom').XMLSerializer)();
    return serializer.serializeToString(node);
  }

  /**
   * Valida que el CAF sea válido para uso
   * @param cafData - Datos del CAF
   * @param rutEmisor - RUT del emisor que intenta usar el CAF
   * @returns Resultado de validación
   */
  validateCAF(cafData: CAFData, rutEmisor: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Verificar RUT emisor
    const cafRut = cafData.rutEmisor.replace(/[.-]/g, '').toUpperCase();
    const checkRut = rutEmisor.replace(/[.-]/g, '').toUpperCase();
    if (cafRut !== checkRut) {
      errors.push(`CAF es para RUT ${cafData.rutEmisor}, no para ${rutEmisor}`);
    }

    // Verificar tipo de DTE válido
    const tiposValidos = [33, 34, 39, 41, 52, 56, 61];
    if (!tiposValidos.includes(cafData.tipoDte)) {
      errors.push(`Tipo de DTE ${cafData.tipoDte} no válido`);
    }

    // Verificar rango de folios
    if (cafData.folioDesde > cafData.folioHasta) {
      errors.push('Rango de folios inválido');
    }

    // Verificar fecha de autorización
    const fechaAuth = new Date(cafData.fechaAutorizacion);
    const ahora = new Date();
    
    // CAF no puede ser del futuro
    if (fechaAuth > ahora) {
      errors.push('CAF tiene fecha de autorización futura');
    }

    // Para boletas, verificar vigencia de 6 meses
    if (cafData.tipoDte === 39 || cafData.tipoDte === 41) {
      const sesMeses = new Date(fechaAuth);
      sesMeses.setMonth(sesMeses.getMonth() + 6);
      if (ahora > sesMeses) {
        errors.push('CAF de boleta vencido (máximo 6 meses de vigencia)');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calcula estadísticas de uso de un CAF
   * @param record - Registro del CAF
   * @returns Estadísticas
   */
  calculateStats(record: FolioRecord): CAFStats {
    const totalAutorizados = record.folioHasta - record.folioDesde + 1;
    const usados = record.folioActual - record.folioDesde;
    const disponibles = record.folioHasta - record.folioActual + 1;
    const porcentajeUsado = (usados / totalAutorizados) * 100;

    return {
      tipoDte: record.tipoDte,
      totalAutorizados,
      usados,
      disponibles,
      porcentajeUsado: Math.round(porcentajeUsado * 100) / 100,
      alertaBaja: disponibles < 100,
    };
  }

  /**
   * Extrae el nodo CAF para incluir en el TED
   * @param cafXml - XML completo del CAF
   * @returns Nodo CAF serializado
   */
  extractCAFForTED(cafXml: string): string {
    const doc = new DOMParser().parseFromString(cafXml, 'application/xml');
    const cafNode = doc.getElementsByTagName('CAF')[0];
    
    if (!cafNode) {
      throw new Error('No se encontró nodo CAF');
    }

    // Serializar solo el nodo CAF
    const serializer = new (require('@xmldom/xmldom').XMLSerializer)();
    return serializer.serializeToString(cafNode);
  }

  /**
   * Obtiene el nombre del tipo de DTE
   * @param tipoDte - Código del tipo
   * @returns Nombre del tipo
   */
  getNombreTipoDte(tipoDte: DTEType): string {
    const nombres: Record<number, string> = {
      33: 'Factura Electrónica',
      34: 'Factura No Afecta o Exenta Electrónica',
      39: 'Boleta Electrónica',
      41: 'Boleta Exenta Electrónica',
      52: 'Guía de Despacho Electrónica',
      56: 'Nota de Débito Electrónica',
      61: 'Nota de Crédito Electrónica',
    };
    return nombres[tipoDte] || `Tipo ${tipoDte}`;
  }
}

// Singleton
export const cafManagerService = new CafManagerService();
