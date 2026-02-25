import '@testing-library/jest-dom';

describe('Duplicate order -> pending resume audit', () => {
  function detectDuplicateOrderError(error) {
    const message = String(error?.message || '').toLowerCase();
    return message.includes('uniq_orders_cart_pending') || message.includes('duplicate key');
  }

  async function handleDuplicateBranch({ error, resumeResult }) {
    const navigate = jest.fn();
    const toastInfo = jest.fn();
    const resume = jest.fn(async () => resumeResult);

    const isDuplicateOrder = detectDuplicateOrderError(error);
    if (!isDuplicateOrder) {
      return { navigate, toastInfo, resume, handled: false };
    }

    const resumed = await resume();
    if (resumed) {
      return { navigate, toastInfo, resume, handled: true, resumed: true };
    }

    toastInfo('Ya tienes un pago en proceso para este carrito. Revisa tus pedidos.');
    navigate('/buyer/orders');
    return { navigate, toastInfo, resume, handled: true, resumed: false };
  }

  it('si duplicate + resume true => no navega a orders', async () => {
    const result = await handleDuplicateBranch({
      error: new Error('duplicate key value violates unique constraint "uniq_orders_cart_pending"'),
      resumeResult: true,
    });

    expect(result.handled).toBe(true);
    expect(result.resumed).toBe(true);
    expect(result.resume).toHaveBeenCalledTimes(1);
    expect(result.navigate).not.toHaveBeenCalled();
    expect(result.toastInfo).not.toHaveBeenCalled();
  });

  it('si duplicate + resume false => fallback a orders', async () => {
    const result = await handleDuplicateBranch({
      error: new Error('duplicate key value violates unique constraint "uniq_orders_cart_pending"'),
      resumeResult: false,
    });

    expect(result.handled).toBe(true);
    expect(result.resumed).toBe(false);
    expect(result.resume).toHaveBeenCalledTimes(1);
    expect(result.toastInfo).toHaveBeenCalledTimes(1);
    expect(result.navigate).toHaveBeenCalledWith('/buyer/orders');
  });

  it('si no es duplicate => branch no aplica', async () => {
    const result = await handleDuplicateBranch({
      error: new Error('network timeout'),
      resumeResult: true,
    });

    expect(result.handled).toBe(false);
    expect(result.resume).not.toHaveBeenCalled();
    expect(result.navigate).not.toHaveBeenCalled();
    expect(result.toastInfo).not.toHaveBeenCalled();
  });
});
