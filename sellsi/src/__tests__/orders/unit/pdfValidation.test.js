import { validateTaxPdf, MAX_PDF_BYTES, PDF_MIME } from '../../../domains/supplier/pages/my-orders/validation/pdfValidation';

const fakeFile = (overrides={}) => ({
  type: PDF_MIME,
  size: 10_000,
  name: 'doc.pdf',
  ...overrides
});

describe('validateTaxPdf', () => {
  it('rechaza ausencia de archivo', () => {
    expect(validateTaxPdf(null)).toEqual({ ok:false, error:'Archivo PDF requerido' });
  });
  it('rechaza mime distinto a PDF', () => {
    const res = validateTaxPdf(fakeFile({ type:'text/plain' }));
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
    expect(res).toEqual({ ok:true });
  });
});
