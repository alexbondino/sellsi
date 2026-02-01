import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FinancingRequestModal from '../../../../workspaces/buyer/my-financing/components/FinancingRequestModal';

describe('FinancingRequestModal', () => {
  test('Confirm disabled until a type is selected and onSelectType called with correct value', () => {
    const onClose = jest.fn();
    const onSelectType = jest.fn();

    render(<FinancingRequestModal open={true} onClose={onClose} onSelectType={onSelectType} />);

    const confirmBtn = screen.getByRole('button', { name: /Confirmar/i });
    expect(confirmBtn).toBeDisabled();

    // Open select (combobox) and choose 'express'
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);
    // click the option inside the popup
    fireEvent.click(screen.getByText(/Solicitud Express/i));

    expect(confirmBtn).toBeEnabled();

    fireEvent.click(confirmBtn);
    expect(onSelectType).toHaveBeenCalledWith('express');
  });

  test('Close button calls onClose and resets selection', () => {
    const onClose = jest.fn();
    const onSelectType = jest.fn();

    const { rerender } = render(<FinancingRequestModal open={true} onClose={onClose} onSelectType={onSelectType} />);

    // Select an option using the combobox
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);
    fireEvent.click(screen.getByText(/Solicitud Extendida/i));

    // Click close icon (use svg test id to find button)
    const closeBtn = screen.getByTestId('CloseIcon').closest('button');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();

    // Re-open and the selection should be reset (Confirm disabled)
    rerender(<FinancingRequestModal open={true} onClose={onClose} onSelectType={onSelectType} />);
    expect(screen.getByRole('button', { name: /Confirmar/i })).toBeDisabled();
  });
});