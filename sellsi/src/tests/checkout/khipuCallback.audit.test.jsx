import '@testing-library/jest-dom';

describe('Khipu callback audit matrix', () => {
  function createKhipuCallbackHandler() {
    const state = { callbackHandled: false };
    const events = {
      onSuccess: jest.fn(),
      onError: jest.fn(),
      onClose: jest.fn(),
      redirectTo: jest.fn(),
    };

    const handle = (result) => {
      if (state.callbackHandled) {
        return;
      }
      state.callbackHandled = true;

      const failureReason = String(result?.failureReason || '').toUpperCase();
      const exitMessage = String(result?.exitMessage || '').toLowerCase();
      const isUserCanceled =
        failureReason === 'USER_CANCELED' ||
        exitMessage.includes('abandon') ||
        exitMessage.includes('cancel');

      switch (result?.result) {
        case 'OK':
          events.onSuccess(result);
          break;

        case 'WARNING':
          if (isUserCanceled) {
            events.onClose();
          } else if (result?.continueUrl) {
            events.redirectTo(result.continueUrl);
          } else {
            events.onClose();
          }
          break;

        case 'ERROR':
          if (isUserCanceled) {
            events.onClose();
          } else {
            events.onError(result);
          }
          break;

        case 'CONTINUE':
          if (result?.continueUrl) {
            events.redirectTo(result.continueUrl);
          }
          break;

        default:
          events.onError(result);
      }
    };

    const reset = () => {
      state.callbackHandled = false;
      events.onSuccess.mockClear();
      events.onError.mockClear();
      events.onClose.mockClear();
      events.redirectTo.mockClear();
    };

    return { handle, events, reset };
  }

  it('OK -> success', () => {
    const { handle, events } = createKhipuCallbackHandler();
    handle({ result: 'OK', paymentId: 'p-1' });

    expect(events.onSuccess).toHaveBeenCalledTimes(1);
    expect(events.onError).not.toHaveBeenCalled();
    expect(events.onClose).not.toHaveBeenCalled();
    expect(events.redirectTo).not.toHaveBeenCalled();
  });

  it('WARNING + cancel semantics -> close (no success)', () => {
    const { handle, events } = createKhipuCallbackHandler();
    handle({ result: 'WARNING', exitMessage: 'Usuario decidió abandonar pago' });

    expect(events.onClose).toHaveBeenCalledTimes(1);
    expect(events.onSuccess).not.toHaveBeenCalled();
    expect(events.onError).not.toHaveBeenCalled();
    expect(events.redirectTo).not.toHaveBeenCalled();
  });

  it('WARNING + continueUrl -> redirect', () => {
    const { handle, events } = createKhipuCallbackHandler();
    handle({ result: 'WARNING', continueUrl: 'https://khipu.com/continue' });

    expect(events.redirectTo).toHaveBeenCalledWith('https://khipu.com/continue');
    expect(events.onSuccess).not.toHaveBeenCalled();
    expect(events.onError).not.toHaveBeenCalled();
    expect(events.onClose).not.toHaveBeenCalled();
  });

  it('ERROR + USER_CANCELED -> close (no error)', () => {
    const { handle, events } = createKhipuCallbackHandler();
    handle({ result: 'ERROR', failureReason: 'USER_CANCELED' });

    expect(events.onClose).toHaveBeenCalledTimes(1);
    expect(events.onError).not.toHaveBeenCalled();
    expect(events.onSuccess).not.toHaveBeenCalled();
  });

  it('ERROR real -> error callback', () => {
    const { handle, events } = createKhipuCallbackHandler();
    handle({ result: 'ERROR', failureReason: 'DECLINED', exitMessage: 'Pago rechazado' });

    expect(events.onError).toHaveBeenCalledTimes(1);
    expect(events.onClose).not.toHaveBeenCalled();
    expect(events.onSuccess).not.toHaveBeenCalled();
  });

  it('idempotencia: callback duplicado se ignora', () => {
    const { handle, events } = createKhipuCallbackHandler();
    handle({ result: 'OK' });
    handle({ result: 'ERROR', failureReason: 'DECLINED' });

    expect(events.onSuccess).toHaveBeenCalledTimes(1);
    expect(events.onError).not.toHaveBeenCalled();
    expect(events.onClose).not.toHaveBeenCalled();
  });

  it('permite nuevo ciclo tras reset', () => {
    const { handle, events, reset } = createKhipuCallbackHandler();
    handle({ result: 'OK' });
    expect(events.onSuccess).toHaveBeenCalledTimes(1);

    reset();
    handle({ result: 'ERROR', failureReason: 'DECLINED' });
    expect(events.onError).toHaveBeenCalledTimes(1);
    expect(events.onSuccess).not.toHaveBeenCalled();
  });
});
