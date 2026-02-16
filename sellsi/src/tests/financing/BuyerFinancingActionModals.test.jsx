import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BuyerFinancingActionModals from '../../../workspaces/buyer/my-financing/components/BuyerFinancingActionModals';

describe('BuyerFinancingActionModals', () => {
  const financing = { id: 1, supplier_name: 'Prueba', amount: 1000, term_days: 7, amount_used: 500 };

  test('SignModal validates file type and size and calls onConfirm with file', async () => {
    const onSign = jest.fn();
    const onClose = jest.fn();

    render(<BuyerFinancingActionModals open={true} mode={'sign'} financing={financing} onClose={onClose} onSign={onSign} />);

    // Upload invalid type
    const uploadBtn = screen.getByRole('button', { name: /Adjuntar Contrato Firmado|PDF Adjuntado/i });
    const fileInput = uploadBtn.querySelector('input[type="file"]');

    // Create plain text file
    const txt = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [txt] } });

    expect(await screen.findByText(/El archivo debe ser un PDF/i)).toBeInTheDocument();

    // Create big pdf > 300KB
    const bigContent = new Uint8Array(350 * 1024).fill(0);
    const bigPDF = new File([bigContent], 'big.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [bigPDF] } });

    expect(await screen.findByText(/excede el tamaño máximo/i)).toBeInTheDocument();

    // Valid PDF small
    const smallPDF = new File([new Uint8Array(1024)], 'signed.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [smallPDF] } });

    expect(await screen.findByText(/PDF Adjuntado/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Firmar Documento/i });
    expect(confirmBtn).toBeEnabled();

    fireEvent.click(confirmBtn);

    await waitFor(() => expect(onSign).toHaveBeenCalled());
    expect(onSign.mock.calls[0][0]).toEqual(financing);
    // File should be passed as second arg
    expect(onSign.mock.calls[0][1]).toBeInstanceOf(File);
  });

  test('Cancel modal sends optional reason (null when empty)', async () => {
    const onCancel = jest.fn();
    const onClose = jest.fn();

    const { unmount } = render(<BuyerFinancingActionModals open={true} mode={'cancel'} financing={financing} onClose={onClose} onCancel={onCancel} />);

    // Click confirm without typing reason
    const confirmBtn = screen.getByRole('button', { name: /Sí, Cancelar|Cancelar Operación|Cancelar/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => expect(onCancel).toHaveBeenCalled());
    expect(onCancel.mock.calls[0][0]).toEqual(financing);
    // Reason should be null when empty
    expect(onCancel.mock.calls[0][1]).toBeNull();

    // Now test with reason
    unmount();
    const { unmount: unmount2 } = render(<BuyerFinancingActionModals open={true} mode={'cancel'} financing={financing} onClose={onClose} onCancel={onCancel} />);
    const textarea = screen.getByLabelText(/Motivo \(opcional\)/i);

    fireEvent.change(textarea, { target: { value: 'Necesito cancelar' } });
    const confirmBtn2 = screen.getByRole('button', { name: /Sí, Cancelar|Cancelar Operación|Cancelar/i });
    fireEvent.click(confirmBtn2);

    await waitFor(() => expect(onCancel).toHaveBeenCalled());
    // Last call includes reason
    expect(onCancel.mock.calls[onCancel.mock.calls.length - 1][1]).toBe('Necesito cancelar');
  });

  test('PayOnline modal calls onConfirm when clicking Ir a pagar', async () => {
    const onPayOnline = jest.fn();
    const onClose = jest.fn();

    render(<BuyerFinancingActionModals open={true} mode={'payOnline'} financing={financing} onClose={onClose} onPayOnline={onPayOnline} />);

    const payBtn = screen.getByRole('button', { name: /Ir a pagar/i });
    fireEvent.click(payBtn);

    await waitFor(() => expect(onPayOnline).toHaveBeenCalled());
    // onPayOnline is invoked with (financing, amount)
    expect(onPayOnline.mock.calls[0][0]).toEqual(financing);
    expect(typeof onPayOnline.mock.calls[0][1]).toBe('number');
  });
});
