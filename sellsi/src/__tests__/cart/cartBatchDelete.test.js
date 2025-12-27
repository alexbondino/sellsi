/**
 * Robust unit tests for batch deletion and cart behavior.
 * Uses a simple spy-builder mock for Supabase to avoid over-mocking logic.
 */
import { cartService } from '../../services/user/cartService';

// Spy-builder mock for Supabase (no Proxy, no internal logic)
jest.mock('../../services/supabase', () => {
  const mockDeleteBuilder = {
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    then: jest.fn(),
  };

  return {
    supabase: {
      from: jest.fn(() => mockDeleteBuilder),
    },
    _mockDeleteBuilder: mockDeleteBuilder,
  };
});

const { supabase, _mockDeleteBuilder } = require('../../services/supabase');

describe('cartService batch delete', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default successful DB responses
    _mockDeleteBuilder.then.mockImplementation((resolve) => resolve({ data: [], error: null }));
    _mockDeleteBuilder.delete.mockReturnThis();
    _mockDeleteBuilder.eq.mockReturnThis();
    _mockDeleteBuilder.in.mockReturnThis();
    _mockDeleteBuilder.update.mockReturnThis();
  });

  test('removeItemsFromCart dedupes ids and calls supabase with expected filters', async () => {
    // Avoid waiting for timestamp debounce by stubbing updateCartTimestamp
    const spyTimestamp = jest.spyOn(cartService, 'updateCartTimestamp').mockResolvedValue({});

    const res = await cartService.removeItemsFromCart('c1', ['l1','l2','l2']);
    expect(res).toBe(true);

    // Verify table selection and filters
    expect(supabase.from).toHaveBeenCalledWith('cart_items');
    expect(_mockDeleteBuilder.eq).toHaveBeenCalledWith('cart_id', 'c1');
    expect(_mockDeleteBuilder.in).toHaveBeenCalledWith('cart_items_id', expect.arrayContaining(['l1','l2']));

    // Ensure deduplication happened (2 unique ids)
    const calls = _mockDeleteBuilder.in.mock.calls[0];
    const passedIds = calls[1];
    expect(passedIds).toHaveLength(2);

    spyTimestamp.mockRestore();
  });

  // NOTE: We assert the EFFECT (that timestamp refresh occurs) by spying on the
  // internal updateCartTimestamp method. This spy works only if cartService
  // invokes it as a method on the exported object (i.e., this.updateCartTimestamp).
  // If the implementation changes to module-local function calls, this spy will
  // silently not detect the call — in that case, prefer asserting on the DB update
  // (supabase.from('carts').update(...)) instead.
  test('triggers timestamp refresh (updateCartTimestamp) after deletion', async () => {
    const spy = jest.spyOn(cartService, 'updateCartTimestamp').mockResolvedValue({});
    await cartService.removeItemsFromCart('c1', ['a','b']);
    expect(spy).toHaveBeenCalledWith('c1');
    spy.mockRestore();
  });

  test('returns false for empty ids array', async () => {
    const res = await cartService.removeItemsFromCart('c1', []);
    expect(res).toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('returns false for missing cartId', async () => {
    const res = await cartService.removeItemsFromCart(null, ['x']);
    expect(res).toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('throws when supabase delete fails', async () => {
    // Simulate DB error by making the then callback return an error
    _mockDeleteBuilder.then.mockImplementation((resolve) => resolve({ data: null, error: { message: 'DB Error' } }));

    await expect(cartService.removeItemsFromCart('c1', ['l1'])).rejects.toThrow(/DB Error/);

    // Restore success behavior for subsequent tests
    _mockDeleteBuilder.then.mockImplementation((resolve) => resolve({ data: [], error: null }));
  });
});
