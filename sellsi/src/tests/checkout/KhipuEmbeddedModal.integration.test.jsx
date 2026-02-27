import React from 'react';
import { render, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

import KhipuEmbeddedModal from '../../domains/checkout/components/KhipuEmbeddedModal';

jest.mock('../../shared/hooks/useBodyScrollLock', () => ({
  useBodyScrollLock: jest.fn(),
}));

describe('KhipuEmbeddedModal integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const script = document.createElement('script');
    script.src = 'https://js.khipu.com/v1/kws.js';
    document.head.appendChild(script);

    delete window.Khipu;
  });

  afterEach(() => {
    cleanup();
    document.head.querySelectorAll('script[src="https://js.khipu.com/v1/kws.js"]').forEach((s) => s.remove());
    delete window.Khipu;
  });

  function setupKhipuMock() {
    let callbackRef = null;
    const client = {
      startOperation: jest.fn((paymentId, callback) => {
        callbackRef = callback;
      }),
      close: jest.fn(),
    };

    window.Khipu = function Khipu() {
      return client;
    };

    return {
      client,
      getCallback: () => callbackRef,
    };
  }

  it('trata OK como éxito y callback duplicado no vuelve a ejecutar éxito', async () => {
    const { client, getCallback } = setupKhipuMock();
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const onClose = jest.fn();

    render(
      <KhipuEmbeddedModal
        open
        paymentId="pay_123"
        fallbackUrl={null}
        onSuccess={onSuccess}
        onError={onError}
        onClose={onClose}
      />
    );

    await waitFor(() => {
      expect(client.startOperation).toHaveBeenCalledTimes(1);
    });

    const callback = getCallback();
    expect(typeof callback).toBe('function');

    callback({ result: 'OK' });
    callback({ result: 'OK' });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('trata USER_CANCELED como cierre y no como error', async () => {
    const { client, getCallback } = setupKhipuMock();
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const onClose = jest.fn();

    render(
      <KhipuEmbeddedModal
        open
        paymentId="pay_456"
        fallbackUrl={null}
        onSuccess={onSuccess}
        onError={onError}
        onClose={onClose}
      />
    );

    await waitFor(() => {
      expect(client.startOperation).toHaveBeenCalledTimes(1);
    });

    const callback = getCallback();
    callback({ result: 'ERROR', failureReason: 'USER_CANCELED' });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('WARNING con continueUrl no marca éxito/error/cierre (branch de redirección)', async () => {
    const { client, getCallback } = setupKhipuMock();
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const onClose = jest.fn();

    render(
      <KhipuEmbeddedModal
        open
        paymentId="pay_789"
        fallbackUrl={null}
        onSuccess={onSuccess}
        onError={onError}
        onClose={onClose}
      />
    );

    await waitFor(() => {
      expect(client.startOperation).toHaveBeenCalledTimes(1);
    });

    const callback = getCallback();
    callback({ result: 'WARNING', continueUrl: 'https://khipu.com/continue' });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('ERROR operationFailed* con fallbackUrl evita onError/onClose (usa fallback hosted)', async () => {
    const { client, getCallback } = setupKhipuMock();
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const onClose = jest.fn();

    render(
      <KhipuEmbeddedModal
        open
        paymentId="pay_999"
        fallbackUrl="https://khipu.com/payment/info/hosted-123"
        onSuccess={onSuccess}
        onError={onError}
        onClose={onClose}
      />
    );

    await waitFor(() => {
      expect(client.startOperation).toHaveBeenCalledTimes(1);
    });

    const callback = getCallback();
    callback({
      result: 'ERROR',
      exitTitle: 'operationFailedTitle',
      exitMessage: 'operationFailedBody',
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
