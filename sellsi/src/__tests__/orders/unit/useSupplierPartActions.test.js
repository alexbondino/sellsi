import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Minimal supabase mock (hook may fallback to DB only when supplier_ids missing)
jest.mock('../../../services/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { supplier_ids: ['sup-1'] }, error: null }) }),
  },
}));

// Mock the orderService to capture calls
const mockUpdateOrderStatus = jest.fn().mockResolvedValue({ success: true });
const mockUpdateSupplierPartStatus = jest.fn().mockResolvedValue({ success: true });
jest.mock('../../../services/user', () => ({
  orderService: {
    updateOrderStatus: mockUpdateOrderStatus,
    updateSupplierPartStatus: mockUpdateSupplierPartStatus,
  },
}));

const { useSupplierPartActions } = require('../../../workspaces/supplier/my-requests/hooks/useSupplierPartActions');

function TestConsumer({ part, action }) {
  const actions = useSupplierPartActions('sup-1');
  return (
    <div>
      <button onClick={() => actions[action](part)}>{action}</button>
    </div>
  );
}

describe('useSupplierPartActions hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('mono-supplier uses updateOrderStatus', async () => {
    const monoPart = { order_id: 'o1', parent_order_id: 'o1', supplier_ids: ['sup-1'], supplier_id: 'sup-1' };
    render(<TestConsumer part={monoPart} action="accept" />);

    fireEvent.click(screen.getByText('accept'));

    await waitFor(() => {
      expect(mockUpdateOrderStatus).toHaveBeenCalledWith('o1', 'accepted', {});
    });
  });

  test('concurrent calls for same order are deduped', async () => {
    const monoPart = { order_id: 'o1', parent_order_id: 'o1', supplier_ids: ['sup-1'], supplier_id: 'sup-1' };
    render(<TestConsumer part={monoPart} action="accept" />);

    mockUpdateOrderStatus.mockClear();

    // Trigger two quick clicks
    fireEvent.click(screen.getByText('accept'));
    fireEvent.click(screen.getByText('accept'));

    await waitFor(() => {
      // Only one actual service invocation should have occurred
      expect(mockUpdateOrderStatus.mock.calls.filter(c => c[1] === 'accepted').length).toBe(1);
    });
  });

  test('UI shows disabled submit while updating', async () => {
    const { createDeferred } = require('../../utils/deferred');
    const deferred = createDeferred();
    mockUpdateOrderStatus.mockImplementationOnce(() => deferred.promise);

    function HookConsumer({ part }) {
      const actions = useSupplierPartActions('sup-1');
      return (
        <div>
          <button onClick={() => actions.accept(part)} aria-label="hook-accept">Accept</button>
          <button aria-label="submit" disabled={actions.updating}>Submit</button>
        </div>
      );
    }

    render(<HookConsumer part={{ order_id: 'o1', parent_order_id: 'o1', supplier_ids: ['sup-1'], supplier_id: 'sup-1' }} />);

    fireEvent.click(screen.getByLabelText('hook-accept'));

    // Submit button should be disabled while promise is pending
    await waitFor(() => expect(screen.getByLabelText('submit')).toBeDisabled());

    // Resolve
    deferred.resolve({ success: true });

    await waitFor(() => expect(screen.getByLabelText('submit')).not.toBeDisabled());
  });

  test('multi-supplier uses updateSupplierPartStatus', async () => {
    const multiPart = { order_id: 'o2', parent_order_id: 'o2', supplier_ids: ['sup-1', 'sup-2'], supplier_id: 'sup-1' };
    render(<TestConsumer part={multiPart} action="accept" />);

    fireEvent.click(screen.getByText('accept'));

    await waitFor(() => {
      expect(mockUpdateSupplierPartStatus).toHaveBeenCalledWith('o2', 'sup-1', 'accepted', {});
    });
  });
});
