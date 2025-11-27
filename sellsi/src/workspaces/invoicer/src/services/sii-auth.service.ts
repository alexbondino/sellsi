/**
 * Servicio de Autenticación con SII
 * Implementa flujo GetSeed → SignSeed → GetToken
 * @module services/sii-auth.service
 */

import axios, { AxiosInstance } from 'axios';
import { DOMParser } from '@xmldom/xmldom';
import { SII_CONFIG } from '../config/sii.config';
import { SignatureService } from './signature.service';
import { SiiToken } from '../types';

interface TokenCache {
  [key: string]: SiiToken;
}

/**
 * Servicio para autenticación con el SII
 */
export class SiiAuthService {
  private signatureService: SignatureService;
  private httpClient: AxiosInstance;
  private tokenCache: TokenCache = {};
  private ambiente: 'CERT' | 'PROD';

  constructor(signatureService: SignatureService, ambiente: 'CERT' | 'PROD' = 'CERT') {
    this.signatureService = signatureService;
    this.ambiente = ambiente;
    
    const baseURL = ambiente === 'CERT' 
      ? SII_CONFIG.ENDPOINTS.CERT.AUTH 
      : SII_CONFIG.ENDPOINTS.PROD.AUTH;

    this.httpClient = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/xml',
      },
    });
  }

  /**
   * Obtiene un token de autenticación del SII
   * Implementa caché para evitar solicitudes innecesarias
   */
  async getToken(): Promise<string> {
    const rutEmisor = this.signatureService.getRutTitular();
    if (!rutEmisor) {
      throw new Error('No hay certificado cargado en el SignatureService');
    }

    const cacheKey = `${rutEmisor}-${this.ambiente}`;
    
    // Verificar si hay token válido en caché
    const cachedToken = this.tokenCache[cacheKey];
    if (cachedToken && cachedToken.expiresAt > new Date()) {
      return cachedToken.token;
    }

    // Obtener nuevo token
    const token = await this.requestNewToken();
    
    // Guardar en caché (expira en 60 minutos, usamos 55 para margen)
    this.tokenCache[cacheKey] = {
      token,
      rutEmisor,
      expiresAt: new Date(Date.now() + 55 * 60 * 1000),
      ambiente: this.ambiente,
    };

    return token;
  }

  /**
   * Solicita un nuevo token al SII
   * Flujo: GetSeed → SignSeed → GetToken
   */
  private async requestNewToken(): Promise<string> {
    // Paso 1: Obtener semilla
    const seed = await this.getSeed();
    
    // Paso 2: Firmar semilla
    const signedSeed = this.signSeed(seed);
    
    // Paso 3: Obtener token
    const token = await this.exchangeSeedForToken(signedSeed);
    
    return token;
  }

  /**
   * Paso 1: Obtiene la semilla del SII
   */
  private async getSeed(): Promise<string> {
    try {
      const response = await this.httpClient.get('/CrSeed.jws?WSDL');
      
      // Extraer el SOAP endpoint
      const wsdl = response.data;
      
      // Llamar al método getSeed
      const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <getSeed/>
  </soapenv:Body>
</soapenv:Envelope>`;

      const seedResponse = await this.httpClient.post('/CrSeed.jws', soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': '',
        },
      });

      // Parsear respuesta y extraer semilla
      const seed = this.extractSeedFromResponse(seedResponse.data);
      
      if (!seed) {
        throw new Error('No se pudo obtener la semilla del SII');
      }

      return seed;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener semilla del SII: ${errorMessage}`);
    }
  }

  /**
   * Extrae la semilla de la respuesta SOAP
   */
  private extractSeedFromResponse(soapResponse: string): string {
    try {
      const doc = new DOMParser().parseFromString(soapResponse, 'application/xml');
      
      // Buscar el elemento SEMILLA dentro de la respuesta
      // La respuesta tiene estructura: <RESP><ESTADO>00</ESTADO><SEMILLA>xxx</SEMILLA></RESP>
      const respBody = doc.getElementsByTagName('getSeedReturn')[0]?.textContent;
      
      if (!respBody) {
        throw new Error('Respuesta inválida del SII');
      }

      // Parsear el XML interno
      const respDoc = new DOMParser().parseFromString(respBody, 'application/xml');
      const estado = respDoc.getElementsByTagName('ESTADO')[0]?.textContent;
      
      if (estado !== '00') {
        const glosa = respDoc.getElementsByTagName('GLOSA')[0]?.textContent || 'Error desconocido';
        throw new Error(`Error del SII: ${glosa}`);
      }

      const semilla = respDoc.getElementsByTagName('SEMILLA')[0]?.textContent;
      
      if (!semilla) {
        throw new Error('No se encontró la semilla en la respuesta');
      }

      return semilla;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al parsear respuesta de semilla');
    }
  }

  /**
   * Paso 2: Firma la semilla con el certificado
   */
  private signSeed(seed: string): string {
    const seedXml = `<getToken>
  <item>
    <Semilla>${seed}</Semilla>
  </item>
</getToken>`;

    // Firmar el XML de la semilla
    const signedXml = this.signatureService.signXml(seedXml);
    
    return signedXml;
  }

  /**
   * Paso 3: Intercambia la semilla firmada por un token
   */
  private async exchangeSeedForToken(signedSeed: string): Promise<string> {
    try {
      const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <getToken>
      <pszXml><![CDATA[${signedSeed}]]></pszXml>
    </getToken>
  </soapenv:Body>
</soapenv:Envelope>`;

      const response = await this.httpClient.post('/GetTokenFromSeed.jws', soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': '',
        },
      });

      const token = this.extractTokenFromResponse(response.data);
      
      if (!token) {
        throw new Error('No se pudo obtener el token del SII');
      }

      return token;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener token del SII: ${errorMessage}`);
    }
  }

  /**
   * Extrae el token de la respuesta SOAP
   */
  private extractTokenFromResponse(soapResponse: string): string {
    try {
      const doc = new DOMParser().parseFromString(soapResponse, 'application/xml');
      
      const respBody = doc.getElementsByTagName('getTokenReturn')[0]?.textContent;
      
      if (!respBody) {
        throw new Error('Respuesta inválida del SII');
      }

      // Parsear el XML interno
      const respDoc = new DOMParser().parseFromString(respBody, 'application/xml');
      const estado = respDoc.getElementsByTagName('ESTADO')[0]?.textContent;
      
      if (estado !== '00') {
        const glosa = respDoc.getElementsByTagName('GLOSA')[0]?.textContent || 'Error desconocido';
        throw new Error(`Error del SII al obtener token: ${glosa}`);
      }

      const token = respDoc.getElementsByTagName('TOKEN')[0]?.textContent;
      
      if (!token) {
        throw new Error('No se encontró el token en la respuesta');
      }

      return token;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al parsear respuesta de token');
    }
  }

  /**
   * Invalida el token en caché para forzar renovación
   */
  invalidateToken(): void {
    const rutEmisor = this.signatureService.getRutTitular();
    if (rutEmisor) {
      const cacheKey = `${rutEmisor}-${this.ambiente}`;
      delete this.tokenCache[cacheKey];
    }
  }

  /**
   * Limpia toda la caché de tokens
   */
  clearCache(): void {
    this.tokenCache = {};
  }

  /**
   * Cambia el ambiente (CERT/PROD)
   */
  setAmbiente(ambiente: 'CERT' | 'PROD'): void {
    this.ambiente = ambiente;
    
    const baseURL = ambiente === 'CERT' 
      ? SII_CONFIG.ENDPOINTS.CERT.AUTH 
      : SII_CONFIG.ENDPOINTS.PROD.AUTH;
    
    this.httpClient.defaults.baseURL = baseURL;
    
    // Invalidar tokens del ambiente anterior
    this.clearCache();
  }

  /**
   * Obtiene el ambiente actual
   */
  getAmbiente(): 'CERT' | 'PROD' {
    return this.ambiente;
  }
}
