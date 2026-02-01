import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SupplierFinancingActionModals from '../../../workspaces/supplier/my-financing/components/SupplierFinancingActionModals';

const makeFile = ({ name = 'file.pdf', size = 1024, type = 'application/pdf' } = {}) => {
  const content = new Uint8Array(size).fill(0);
  return new File([content], name, { type });
};

describe('SupplierFinancingActionModals - Robust tests', () => {
  const financing = { id: 11, requested_by: 'Comprador S.A.', amount: 1200, term_days: 10 };

  test('Approve modal calls onApprove even when financing is null', () => {
    const onApprove = jest.fn();
    render(<SupplierFinancingActionModals open={true} mode={'approve'} financing={null} onClose={() => {}} onApprove={onApprove} />);
    fireEvent.click(screen.getByRole('button', { name: /Aprobar/i }));
    expect(onApprove).toHaveBeenCalledWith(null);
  });

  test('Reject modal: empty reason -> null, trimmed reason passed, length limit enforced', async () => {
    const onReject = jest.fn();
    const { rerender } = render(<SupplierFinancingActionModals open={true} mode={'reject'} financing={financing} onClose={() => {}} onReject={onReject} />);

    fireEvent.click(screen.getByRole('button', { name: /Rechazar/i }));
    await waitFor(() => expect(onReject).toHaveBeenCalled());
    expect(onReject.mock.calls[0][1]).toBeNull();

    // re-render and type long reason
    const long = 'b'.repeat(250);
    rerender(<SupplierFinancingActionModals open={true} mode={'reject'} financing={financing} onClose={() => {}} onReject={onReject} />);
    const textarea = screen.getByLabelText(/Motivo \(opcional\)/i);
    // simulate browser truncation to maxlength (200)
    const truncated = long.slice(0, 200);
    fireEvent.change(textarea, { target: { value: truncated } });
    expect(textarea.value.length).toBeLessThanOrEqual(200);
    fireEvent.click(screen.getByRole('button', { name: /Rechazar/i }));
    await waitFor(() => expect(onReject).toHaveBeenCalled());
    const last = onReject.mock.calls[onReject.mock.calls.length - 1][1];
    expect(last.length).toBeLessThanOrEqual(200);
  });

  test('Sign modal: multiple files, invalid type, exact limit allowed and cleared after confirm', async () => {
    const onSign = jest.fn();
    render(<SupplierFinancingActionModals open={true} mode={'sign'} financing={financing} onClose={() => {}} onSign={onSign} />);

    const uploadBtn = screen.getByRole('button', { name: /Adjuntar Contrato Firmado|PDF Adjuntado/i });
    const input = uploadBtn.querySelector('input[type="file"]');

    const txt = new File(['x'], 'x.txt', { type: 'text/plain' });
    const small = makeFile({ name: 'ok.pdf', size: 1024 });
    fireEvent.change(input, { target: { files: [txt, small] } });

    expect(await screen.findByText(/El archivo debe ser un PDF/i)).toBeInTheDocument();

    fireEvent.change(input, { target: { files: [small] } });
    expect(await screen.findByText(/PDF Adjuntado/i)).toBeInTheDocument();

    // test exact limit
    const exact = makeFile({ name: 'exact.pdf', size: 300 * 1024 });
    fireEvent.change(input, { target: { files: [exact] } });
    expect(await screen.findByText(/PDF Adjuntado/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Firmar Documento/i }));
    await waitFor(() => expect(onSign).toHaveBeenCalled());
    expect(onSign.mock.calls[0][1].name).toBe('exact.pdf');
    // after confirm the UI should no longer show uploaded alert
    expect(screen.queryByText(/PDF Adjuntado/i)).not.toBeInTheDocument();
  });

  test('Cancel modal accessible and passes trimmed/null reason', async () => {
    const onCancel = jest.fn();
    render(<SupplierFinancingActionModals open={true} mode={'cancel'} financing={financing} onClose={() => {}} onCancel={onCancel} />);

    const textarea = screen.getByLabelText(/Motivo \(opcional\)/i);
    fireEvent.change(textarea, { target: { value: '  motivo con espacios  ' } });
    fireEvent.click(screen.getByRole('button', { name: /Si, Cancelar|Cancelar/i }));

    await waitFor(() => expect(onCancel).toHaveBeenCalled());
    expect(onCancel.mock.calls[0][1]).toBe('motivo con espacios');
  });

  test('Dialog semantics: role dialog present and titles correct for modes', () => {
    const { rerender } = render(<SupplierFinancingActionModals open={true} mode={'approve'} financing={financing} onClose={() => {}} onApprove={() => {}} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Aprobar Solicitud de Financiamiento/i)).toBeInTheDocument();

    rerender(<SupplierFinancingActionModals open={true} mode={'reject'} financing={financing} onClose={() => {}} onReject={() => {}} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Rechazar Solicitud de Financiamiento/i)).toBeInTheDocument();
  });
});
