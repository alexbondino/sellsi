import {
  validateTaxPdf,
  MAX_PDF_BYTES,
  PDF_MIME,
} from '../../../workspaces/supplier/my-requests/utils/pdfValidation';

const fakeFile = (overrides = {}) => ({
  type: PDF_MIME,
  size: 10_000,
  name: 'doc.pdf',
  ...overrides,
});

describe('validateTaxPdf', () => {
  it('rechaza ausencia de archivo', () => {
    expect(validateTaxPdf(null)).toEqual({
      ok: false,
      error: 'Archivo PDF requerido',
    });
  });
  it('rechaza mime distinto a PDF', () => {
    const res = validateTaxPdf(fakeFile({ type: 'text/plain' }));
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/PDF/);
  });
  it('rechaza tamaño > 500KB', () => {
    const res = validateTaxPdf(fakeFile({ size: MAX_PDF_BYTES + 1 }));
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/500KB/);
  });
  it('acepta PDF válido dentro de límite', () => {
    const res = validateTaxPdf(fakeFile({ size: MAX_PDF_BYTES }));
    expect(res).toEqual({ ok: true });
  });

  it('acepta MIME con parámetros y case-insensitive', () => {
    const res = validateTaxPdf(fakeFile({ type: 'Application/PDF;version=1.7', size: MAX_PDF_BYTES }));
    expect(res.ok).toBe(true);
  });

  it('rechaza cuando size no es número (missing or NaN)', () => {
    const r1 = validateTaxPdf(fakeFile({ size: undefined }));
    expect(r1.ok).toBe(false);
    expect(r1.error).toMatch(/Tamaño/);

    const r2 = validateTaxPdf(fakeFile({ size: NaN }));
    expect(r2.ok).toBe(false);
    expect(r2.error).toMatch(/Tamaño/);
  });
});
