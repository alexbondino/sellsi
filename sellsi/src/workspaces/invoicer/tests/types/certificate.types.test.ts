/**
 * Tests exhaustivos para tipos de Certificados Digitales
 * Verificación de estructuras para manejo de certificados X.509
 */

import {
  ParsedCertificate,
  CertificateRecord,
  CertificateUploadData,
  CertificateValidationResult,
  EmisorContext,
  CertificateSummary,
} from '../../src/types/certificate.types';

describe('Certificate Types - Suite Completa para Certificación', () => {
  // ============================================
  // ParsedCertificate Interface
  // ============================================
  describe('ParsedCertificate Interface', () => {
    it('debe representar certificado parseado completo', () => {
      const cert: ParsedCertificate = {
        subject: {
          commonName: 'Juan Pérez González',
          serialNumber: '12345678-9',
          organization: 'Empresa SpA',
          country: 'CL',
        },
        issuer: {
          commonName: 'E-SIGN S.A.',
          organization: 'E-SIGN S.A.',
          country: 'CL',
        },
        serialNumber: 'ABC123DEF456',
        validity: {
          notBefore: new Date('2024-01-01'),
          notAfter: new Date('2025-01-01'),
        },
        fingerprint: 'SHA256:AB:CD:EF:12:34:56:78:90',
        pem: '-----BEGIN CERTIFICATE-----\nMIIC...\n-----END CERTIFICATE-----',
        privateKeyPem: '-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----',
      };

      expect(cert.subject.commonName).toBe('Juan Pérez González');
      expect(cert.subject.serialNumber).toBe('12345678-9');
      expect(cert.issuer.organization).toBe('E-SIGN S.A.');
      expect(cert.validity.notBefore instanceof Date).toBe(true);
    });

    it('debe permitir organization opcional en subject', () => {
      const cert: ParsedCertificate = {
        subject: {
          commonName: 'Persona Natural',
          serialNumber: '11111111-1',
          country: 'CL',
        },
        issuer: {
          commonName: 'Certifier',
          organization: 'Certifier SA',
          country: 'CL',
        },
        serialNumber: 'SERIAL123',
        validity: {
          notBefore: new Date(),
          notAfter: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        fingerprint: 'SHA256:XX:XX:XX',
        pem: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----',
      };

      expect(cert.subject.organization).toBeUndefined();
    });

    it('debe permitir privateKeyPem opcional', () => {
      const cert: ParsedCertificate = {
        subject: {
          commonName: 'Test',
          serialNumber: '1-9',
          country: 'CL',
        },
        issuer: {
          commonName: 'Issuer',
          organization: 'Issuer Org',
          country: 'CL',
        },
        serialNumber: 'SN001',
        validity: {
          notBefore: new Date(),
          notAfter: new Date(),
        },
        fingerprint: 'FP123',
        pem: 'PEM_DATA',
      };

      expect(cert.privateKeyPem).toBeUndefined();
    });

    it('validity debe contener fechas válidas', () => {
      const notBefore = new Date('2024-01-01T00:00:00Z');
      const notAfter = new Date('2025-01-01T00:00:00Z');

      const cert: ParsedCertificate = {
        subject: { commonName: 'Test', serialNumber: '1-9', country: 'CL' },
        issuer: { commonName: 'CA', organization: 'CA', country: 'CL' },
        serialNumber: 'SN',
        validity: { notBefore, notAfter },
        fingerprint: 'FP',
        pem: 'PEM',
      };

      expect(cert.validity.notBefore.getTime()).toBeLessThan(cert.validity.notAfter.getTime());
    });

    it('subject debe contener RUT chileno en serialNumber', () => {
      const cert: ParsedCertificate = {
        subject: {
          commonName: 'Empresa de Prueba',
          serialNumber: '76086428-5', // RUT válido
          organization: 'Empresa SpA',
          country: 'CL',
        },
        issuer: { commonName: 'CA', organization: 'CA', country: 'CL' },
        serialNumber: 'SN',
        validity: { notBefore: new Date(), notAfter: new Date() },
        fingerprint: 'FP',
        pem: 'PEM',
      };

      // Verificar formato RUT
      expect(cert.subject.serialNumber).toMatch(/^\d{1,8}-[\dkK]$/);
    });
  });

  // ============================================
  // CertificateRecord Interface
  // ============================================
  describe('CertificateRecord Interface', () => {
    it('debe representar registro de BD completo', () => {
      const record: CertificateRecord = {
        id: 'cert-uuid-123',
        supplierId: 'supplier-uuid-456',
        rutTitular: '76086428-5',
        nombreTitular: 'Empresa de Prueba SpA',
        pfxEncrypted: 'base64EncryptedPfxData...',
        iv: 'base64IvData',
        authTag: 'base64AuthTagData',
        passphraseHash: 'sha256HashOfPassphrase',
        validFrom: '2024-01-01T00:00:00Z',
        validTo: '2025-01-01T00:00:00Z',
        fingerprint: 'SHA256:AB:CD:EF:12:34',
        isActive: true,
        createdAt: '2024-01-02T10:00:00Z',
        updatedAt: '2024-01-15T15:30:00Z',
      };

      expect(record.id).toBeDefined();
      expect(record.supplierId).toBeDefined();
      expect(record.pfxEncrypted).toBeDefined();
      expect(record.isActive).toBe(true);
    });

    it('debe incluir datos de cifrado AES-256-GCM', () => {
      const record: CertificateRecord = {
        id: '1',
        supplierId: 'sup1',
        rutTitular: '1-9',
        nombreTitular: 'Test',
        pfxEncrypted: 'ENCRYPTED_PFX_BASE64',
        iv: 'INITIALIZATION_VECTOR_BASE64',
        authTag: 'AUTH_TAG_BASE64',
        passphraseHash: 'HASH_SHA256',
        validFrom: '2024-01-01',
        validTo: '2025-01-01',
        fingerprint: 'FP',
        isActive: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      // Todos los campos de cifrado deben estar presentes
      expect(record.pfxEncrypted).toBeDefined();
      expect(record.iv).toBeDefined();
      expect(record.authTag).toBeDefined();
      expect(record.passphraseHash).toBeDefined();
    });

    it('isActive indica si el certificado está en uso', () => {
      const recordActivo: CertificateRecord = {
        id: '1',
        supplierId: 'sup1',
        rutTitular: '1-9',
        nombreTitular: 'Test',
        pfxEncrypted: 'ENC',
        iv: 'IV',
        authTag: 'TAG',
        passphraseHash: 'HASH',
        validFrom: '2024-01-01',
        validTo: '2025-01-01',
        fingerprint: 'FP',
        isActive: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      const recordInactivo: CertificateRecord = {
        ...recordActivo,
        id: '2',
        isActive: false,
      };

      expect(recordActivo.isActive).toBe(true);
      expect(recordInactivo.isActive).toBe(false);
    });

    it('debe tener timestamps de auditoría', () => {
      const record: CertificateRecord = {
        id: '1',
        supplierId: 'sup1',
        rutTitular: '1-9',
        nombreTitular: 'Test',
        pfxEncrypted: 'ENC',
        iv: 'IV',
        authTag: 'TAG',
        passphraseHash: 'HASH',
        validFrom: '2024-01-01',
        validTo: '2025-01-01',
        fingerprint: 'FP',
        isActive: true,
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-15T15:30:00Z',
      };

      expect(record.createdAt).toBeDefined();
      expect(record.updatedAt).toBeDefined();
      expect(new Date(record.createdAt).getTime()).toBeLessThanOrEqual(
        new Date(record.updatedAt).getTime()
      );
    });
  });

  // ============================================
  // CertificateUploadData Interface
  // ============================================
  describe('CertificateUploadData Interface', () => {
    it('debe contener datos para subir certificado', () => {
      const uploadData: CertificateUploadData = {
        pfxBase64: 'SGVsbG8gV29ybGQ=', // Base64 de "Hello World"
        passphrase: 'mi_contraseña_segura',
        supplierId: 'supplier-123',
      };

      expect(uploadData.pfxBase64).toBeDefined();
      expect(uploadData.passphrase).toBeDefined();
      expect(uploadData.supplierId).toBeDefined();
    });

    it('pfxBase64 debe ser Base64 válido', () => {
      const uploadData: CertificateUploadData = {
        pfxBase64: 'TWlJRXZnSUJBREFOQmdrcWhraUc5dzBCQVFFRkFBU0NCS2d3Z2dTa0FnRUFBb0lCQVFD',
        passphrase: 'password',
        supplierId: 'sup1',
      };

      // Verificar que es Base64 válido
      expect(uploadData.pfxBase64).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('passphrase puede contener caracteres especiales', () => {
      const uploadData: CertificateUploadData = {
        pfxBase64: 'PFXDATA',
        passphrase: 'P@$$w0rd!#%&*()_+-=[]{}|;:,.<>?',
        supplierId: 'sup1',
      };

      expect(uploadData.passphrase).toContain('@');
      expect(uploadData.passphrase).toContain('!');
    });
  });

  // ============================================
  // CertificateValidationResult Interface
  // ============================================
  describe('CertificateValidationResult Interface', () => {
    it('debe representar validación exitosa', () => {
      const validCert: ParsedCertificate = {
        subject: { commonName: 'Test', serialNumber: '1-9', country: 'CL' },
        issuer: { commonName: 'CA', organization: 'CA', country: 'CL' },
        serialNumber: 'SN',
        validity: {
          notBefore: new Date('2024-01-01'),
          notAfter: new Date('2025-01-01'),
        },
        fingerprint: 'FP',
        pem: 'PEM',
      };

      const result: CertificateValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        certificate: validCert,
      };

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.certificate).toBeDefined();
    });

    it('debe representar validación con errores', () => {
      const result: CertificateValidationResult = {
        isValid: false,
        errors: [
          'Certificado expirado',
          'Clave privada no encontrada',
          'RUT no coincide con el esperado',
        ],
        warnings: [],
      };

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.certificate).toBeUndefined();
    });

    it('debe representar validación con advertencias', () => {
      const result: CertificateValidationResult = {
        isValid: true,
        errors: [],
        warnings: ['Certificado vence en menos de 30 días', 'Emisor desconocido'],
        certificate: {
          subject: { commonName: 'Test', serialNumber: '1-9', country: 'CL' },
          issuer: { commonName: 'Unknown CA', organization: 'Unknown', country: 'XX' },
          serialNumber: 'SN',
          validity: {
            notBefore: new Date(),
            notAfter: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 días
          },
          fingerprint: 'FP',
          pem: 'PEM',
        },
      };

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(2);
    });

    it('certificate debe ser opcional cuando hay errores', () => {
      const result: CertificateValidationResult = {
        isValid: false,
        errors: ['No se pudo parsear el certificado'],
        warnings: [],
      };

      expect(result.certificate).toBeUndefined();
    });
  });

  // ============================================
  // EmisorContext Interface
  // ============================================
  describe('EmisorContext Interface', () => {
    it('debe representar contexto de emisor completo', () => {
      const ctx: EmisorContext = {
        supplierId: 'supplier-uuid-123',
        rutEmisor: '76086428-5',
        razonSocial: 'Empresa de Prueba SpA',
        giro: 'Venta al por mayor de productos',
        direccion: 'Av. Principal 123, Of. 456',
        comuna: 'Santiago',
        ciudad: 'Santiago',
        actEco: [461000, 462000],
        sucursal: 'Casa Matriz',
        codigoSucursal: 0,
        ambiente: 'CERT',
      };

      expect(ctx.supplierId).toBeDefined();
      expect(ctx.rutEmisor).toBe('76086428-5');
      expect(ctx.actEco).toHaveLength(2);
      expect(ctx.ambiente).toBe('CERT');
    });

    it('debe soportar ambiente CERT', () => {
      const ctx: EmisorContext = {
        supplierId: 'sup1',
        rutEmisor: '1-9',
        razonSocial: 'Test',
        giro: 'Test',
        direccion: 'Dir',
        comuna: 'Com',
        ciudad: 'Ciu',
        actEco: [1],
        ambiente: 'CERT',
      };

      expect(ctx.ambiente).toBe('CERT');
    });

    it('debe soportar ambiente PROD', () => {
      const ctx: EmisorContext = {
        supplierId: 'sup1',
        rutEmisor: '1-9',
        razonSocial: 'Test',
        giro: 'Test',
        direccion: 'Dir',
        comuna: 'Com',
        ciudad: 'Ciu',
        actEco: [1],
        ambiente: 'PROD',
      };

      expect(ctx.ambiente).toBe('PROD');
    });

    it('sucursal y codigoSucursal deben ser opcionales', () => {
      const ctx: EmisorContext = {
        supplierId: 'sup1',
        rutEmisor: '1-9',
        razonSocial: 'Test',
        giro: 'Test',
        direccion: 'Dir',
        comuna: 'Com',
        ciudad: 'Ciu',
        actEco: [1],
        ambiente: 'CERT',
      };

      expect(ctx.sucursal).toBeUndefined();
      expect(ctx.codigoSucursal).toBeUndefined();
    });

    it('actEco debe ser array de códigos de actividad económica', () => {
      const ctx: EmisorContext = {
        supplierId: 'sup1',
        rutEmisor: '76086428-5',
        razonSocial: 'Empresa Multiactividad',
        giro: 'Comercio y Servicios',
        direccion: 'Dir',
        comuna: 'Com',
        ciudad: 'Ciu',
        actEco: [461000, 462000, 463000, 471100],
        ambiente: 'PROD',
      };

      expect(ctx.actEco).toBeInstanceOf(Array);
      expect(ctx.actEco.length).toBeGreaterThan(0);
      ctx.actEco.forEach((codigo) => {
        expect(typeof codigo).toBe('number');
      });
    });

    it('certificate debe ser opcional (solo en memoria)', () => {
      const ctxSinCert: EmisorContext = {
        supplierId: 'sup1',
        rutEmisor: '1-9',
        razonSocial: 'Test',
        giro: 'Test',
        direccion: 'Dir',
        comuna: 'Com',
        ciudad: 'Ciu',
        actEco: [1],
        ambiente: 'CERT',
      };

      expect(ctxSinCert.certificate).toBeUndefined();

      const ctxConCert: EmisorContext = {
        ...ctxSinCert,
        certificate: {
          subject: { commonName: 'Test', serialNumber: '1-9', country: 'CL' },
          issuer: { commonName: 'CA', organization: 'CA', country: 'CL' },
          serialNumber: 'SN',
          validity: { notBefore: new Date(), notAfter: new Date() },
          fingerprint: 'FP',
          pem: 'PEM',
        },
      };

      expect(ctxConCert.certificate).toBeDefined();
    });
  });

  // ============================================
  // CertificateSummary Interface
  // ============================================
  describe('CertificateSummary Interface', () => {
    it('debe representar resumen de certificado vigente', () => {
      const summary: CertificateSummary = {
        id: 'cert-123',
        rutTitular: '76086428-5',
        nombreTitular: 'Empresa de Prueba SpA',
        validFrom: '2024-01-01',
        validTo: '2025-01-01',
        isActive: true,
        diasRestantes: 180,
        estado: 'vigente',
      };

      expect(summary.estado).toBe('vigente');
      expect(summary.diasRestantes).toBeGreaterThan(0);
      expect(summary.isActive).toBe(true);
    });

    it('debe representar certificado por vencer', () => {
      const summary: CertificateSummary = {
        id: 'cert-456',
        rutTitular: '76086428-5',
        nombreTitular: 'Empresa',
        validFrom: '2024-01-01',
        validTo: '2024-12-15',
        isActive: true,
        diasRestantes: 20,
        estado: 'por_vencer',
      };

      expect(summary.estado).toBe('por_vencer');
      expect(summary.diasRestantes).toBeLessThanOrEqual(30);
    });

    it('debe representar certificado vencido', () => {
      const summary: CertificateSummary = {
        id: 'cert-789',
        rutTitular: '76086428-5',
        nombreTitular: 'Empresa',
        validFrom: '2023-01-01',
        validTo: '2024-01-01',
        isActive: false,
        diasRestantes: 0,
        estado: 'vencido',
      };

      expect(summary.estado).toBe('vencido');
      expect(summary.diasRestantes).toBe(0);
      expect(summary.isActive).toBe(false);
    });

    it('diasRestantes debe ser coherente con estado', () => {
      // Vigente: más de 30 días
      const vigente: CertificateSummary = {
        id: '1',
        rutTitular: '1-9',
        nombreTitular: 'Test',
        validFrom: '2024-01-01',
        validTo: '2025-01-01',
        isActive: true,
        diasRestantes: 365,
        estado: 'vigente',
      };
      expect(vigente.diasRestantes).toBeGreaterThan(30);
      expect(vigente.estado).toBe('vigente');

      // Por vencer: entre 1 y 30 días
      const porVencer: CertificateSummary = {
        id: '2',
        rutTitular: '1-9',
        nombreTitular: 'Test',
        validFrom: '2024-01-01',
        validTo: '2024-12-10',
        isActive: true,
        diasRestantes: 15,
        estado: 'por_vencer',
      };
      expect(porVencer.diasRestantes).toBeLessThanOrEqual(30);
      expect(porVencer.diasRestantes).toBeGreaterThan(0);
      expect(porVencer.estado).toBe('por_vencer');

      // Vencido: 0 días
      const vencido: CertificateSummary = {
        id: '3',
        rutTitular: '1-9',
        nombreTitular: 'Test',
        validFrom: '2023-01-01',
        validTo: '2023-12-31',
        isActive: false,
        diasRestantes: 0,
        estado: 'vencido',
      };
      expect(vencido.diasRestantes).toBe(0);
      expect(vencido.estado).toBe('vencido');
    });
  });

  // ============================================
  // Casos de uso para certificación
  // ============================================
  describe('Casos de uso para certificación', () => {
    it('flujo completo de carga de certificado', () => {
      // 1. Recibir datos de upload
      const uploadData: CertificateUploadData = {
        pfxBase64: 'BASE64_PFX_DATA',
        passphrase: 'mi_password_seguro',
        supplierId: 'supplier-001',
      };

      expect(uploadData.pfxBase64).toBeDefined();

      // 2. Validar certificado (usar fechas dinámicas para evitar tests frágiles)
      const now = new Date();
      const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      const validationResult: CertificateValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        certificate: {
          subject: {
            commonName: 'Empresa SpA',
            serialNumber: '76086428-5',
            organization: 'Empresa SpA',
            country: 'CL',
          },
          issuer: {
            commonName: 'E-SIGN S.A.',
            organization: 'E-SIGN S.A.',
            country: 'CL',
          },
          serialNumber: 'CERT_SN_123',
          validity: {
            notBefore: oneYearAgo,
            notAfter: oneYearFromNow,
          },
          fingerprint: 'SHA256:AB:CD:EF',
          pem: 'PEM_DATA',
          privateKeyPem: 'PRIVATE_KEY_PEM',
        },
      };

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.certificate?.privateKeyPem).toBeDefined();

      // 3. Guardar en BD
      const record: CertificateRecord = {
        id: 'new-cert-uuid',
        supplierId: uploadData.supplierId,
        rutTitular: validationResult.certificate!.subject.serialNumber,
        nombreTitular: validationResult.certificate!.subject.commonName,
        pfxEncrypted: 'ENCRYPTED_PFX',
        iv: 'IV_BASE64',
        authTag: 'AUTH_TAG_BASE64',
        passphraseHash: 'PASSPHRASE_HASH',
        validFrom: validationResult.certificate!.validity.notBefore.toISOString(),
        validTo: validationResult.certificate!.validity.notAfter.toISOString(),
        fingerprint: validationResult.certificate!.fingerprint,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(record.isActive).toBe(true);
      expect(record.rutTitular).toBe('76086428-5');

      // 4. Generar resumen
      const diasRestantes = Math.ceil(
        (new Date(record.validTo).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      const summary: CertificateSummary = {
        id: record.id,
        rutTitular: record.rutTitular,
        nombreTitular: record.nombreTitular,
        validFrom: record.validFrom,
        validTo: record.validTo,
        isActive: record.isActive,
        diasRestantes: diasRestantes,
        estado: diasRestantes > 30 ? 'vigente' : diasRestantes > 0 ? 'por_vencer' : 'vencido',
      };

      expect(summary.estado).toBe('vigente');
    });

    it('contexto de emisor para emisión de DTE', () => {
      const ctx: EmisorContext = {
        supplierId: 'supplier-001',
        rutEmisor: '76086428-5',
        razonSocial: 'Empresa de Prueba SpA',
        giro: 'Venta al por mayor',
        direccion: 'Av. Principal 123',
        comuna: 'Santiago',
        ciudad: 'Santiago',
        actEco: [461000],
        ambiente: 'CERT',
        certificate: {
          subject: {
            commonName: 'Empresa de Prueba SpA',
            serialNumber: '76086428-5',
            country: 'CL',
          },
          issuer: {
            commonName: 'E-SIGN',
            organization: 'E-SIGN',
            country: 'CL',
          },
          serialNumber: 'SN123',
          validity: {
            notBefore: new Date('2024-01-01'),
            notAfter: new Date('2025-01-01'),
          },
          fingerprint: 'FP123',
          pem: 'CERT_PEM',
          privateKeyPem: 'PRIVATE_KEY_PEM',
        },
      };

      // El contexto tiene todo lo necesario para emitir
      expect(ctx.rutEmisor).toBe('76086428-5');
      expect(ctx.certificate).toBeDefined();
      expect(ctx.certificate?.privateKeyPem).toBeDefined();
      expect(ctx.ambiente).toBe('CERT');
    });
  });
});
