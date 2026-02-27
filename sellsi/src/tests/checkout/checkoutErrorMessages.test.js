import { getFriendlyCheckoutErrorMessage } from '../../domains/checkout/services/checkoutErrorMessages';

describe('checkoutErrorMessages', () => {
  it('traduce operationFailed* a mensaje legible', () => {
    const msg = getFriendlyCheckoutErrorMessage({
      result: 'ERROR',
      exitTitle: 'operationFailedTitle',
      exitMessage: 'operationFailedBody',
    });

    expect(msg).toContain('No se pudo completar la operación en Khipu');
  });

  it('traduce timeout técnico a mensaje humano', () => {
    const msg = getFriendlyCheckoutErrorMessage(new Error('Socket disconnected: io server disconnect'));

    expect(msg).toContain('tardó demasiado');
  });

  it('traduce error de red a mensaje humano', () => {
    const msg = getFriendlyCheckoutErrorMessage(new Error('TypeError: Failed to fetch'));

    expect(msg).toContain('No fue posible conectarse');
  });

  it('usa fallback cuando no reconoce el error', () => {
    const msg = getFriendlyCheckoutErrorMessage(new Error('UNKNOWN_ERROR_123'), 'Mensaje fallback');

    expect(msg).toBe('Mensaje fallback');
  });
});
