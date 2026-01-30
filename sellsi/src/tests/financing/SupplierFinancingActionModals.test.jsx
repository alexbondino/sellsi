import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SupplierFinancingActionModals from '../../../workspaces/supplier/my-financing/components/SupplierFinancingActionModals';

describe('SupplierFinancingActionModals', () => {
  const financing = { id: 11, requested_by: 'Comprador S.A.', amount: 1200, term_days: 10 };

  test('Approve modal calls onConfirm', async () => {
    const onApprove = jest.fn();
    render(<SupplierFinancingActionModals open={true} mode={'approve'} financing={financing} onClose={jest.fn()} onApprove={onApprove} />);

    const approveBtn = screen.getByRole('button', { name: /Aprobar/i });
    fireEvent.click(approveBtn);

    await waitFor(() => expect(onApprove).toHaveBeenCalledWith(financing));
  });

  test('Reject modal passes reason correctly', async () => {
    const onReject = jest.fn();
    render(<SupplierFinancingActionModals open={true} mode={'reject'} financing={financing} onClose={jest.fn()} onReject={onReject} />);

    const textarea = screen.getByLabelText(/Motivo \(opcional\)/i);
    fireEvent.change(textarea, { target: { value: 'No cumple requisitos' } });

    const rejectBtn = screen.getByRole('button', { name: /Rechazar/i });
    fireEvent.click(rejectBtn);

    await waitFor(() => expect(onReject).toHaveBeenCalled());
    expect(onReject.mock.calls[0][1]).toBe('No cumple requisitos');
  });

  test('Sign modal validates upload and calls onConfirm', async () => {
    const onSign = jest.fn();
    render(<SupplierFinancingActionModals open={true} mode={'sign'} financing={financing} onClose={jest.fn()} onSign={onSign} />);

    const uploadBtn = screen.getByRole('button', { name: /Adjuntar Contrato Firmado|PDF Adjuntado/i });
    const fileInput = uploadBtn.querySelector('input[type="file"]');

    const smallPDF = new File([new Uint8Array(1024)], 'signed.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [smallPDF] } });

    expect(await screen.findByText(/PDF Adjuntado/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Firmar Documento/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => expect(onSign).toHaveBeenCalled());
    expect(onSign.mock.calls[0][0]).toEqual(financing);
    expect(onSign.mock.calls[0][1]).toBeInstanceOf(File);
  });

  test('Cancel modal passes reason and calls onCancel', async () => {
    const onCancel = jest.fn();
    render(<SupplierFinancingActionModals open={true} mode={'cancel'} financing={financing} onClose={jest.fn()} onCancel={onCancel} />);

    const textarea = screen.getByLabelText(/Motivo \(opcional\)/i);
    fireEvent.change(textarea, { target: { value: 'Problema logístico' } });

    const btn = screen.getByRole('button', { name: /Si, Cancelar|Cancelar Operación|Cancelar/i });
    fireEvent.click(btn);

    await waitFor(() => expect(onCancel).toHaveBeenCalledWith(financing, 'Problema logístico'));
  });
});
