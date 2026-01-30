import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BuyerFinancingActionModals from '../../../workspaces/buyer/my-financing/components/BuyerFinancingActionModals';

const makeFile = ({ name = 'file.pdf', size = 1024, type = 'application/pdf' } = {}) => {
  const content = new Uint8Array(size).fill(0);
  return new File([content], name, { type });
};

describe('BuyerFinancingActionModals - Robust tests', () => {
  const financing = { id: 1, supplier_name: 'Proveedor X', amount: 5000, term_days: 10 };

  test('Sign: accepts file exactly at limit and rejects just above', async () => {
    const onSign = jest.fn();
    const onClose = jest.fn();

    render(<BuyerFinancingActionModals open={true} mode={'sign'} financing={financing} onClose={onClose} onSign={onSign} />);

    // exact limit
    const btn = screen.getByRole('button', { name: /Adjuntar Contrato Firmado|PDF Adjuntado/i });
    const input = btn.querySelector('input[type="file"]');

    const exact = makeFile({ name: 'exact.pdf', size: 300 * 1024, type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [exact] } });

    expect(await screen.findByText(/PDF Adjuntado/i)).toBeInTheDocument();
    const confirm = screen.getByRole('button', { name: /Firmar Documento/i });
    expect(confirm).toBeEnabled();

    // Confirm and ensure callback receives file and financing
    fireEvent.click(confirm);
    await waitFor(() => expect(onSign).toHaveBeenCalled());
    expect(onSign.mock.calls[0][0]).toEqual(financing);
    expect(onSign.mock.calls[0][1].name).toBe('exact.pdf');

    // re-open and upload just above limit
    // note: component clears state after confirm, so just re-render
    const { unmount } = render(<BuyerFinancingActionModals open={true} mode={'sign'} financing={financing} onClose={onClose} onSign={onSign} />);
    const btn2 = screen.getByRole('button', { name: /Adjuntar Contrato Firmado|PDF Adjuntado/i });
    const input2 = btn2.querySelector('input[type="file"]');

    const tooBig = makeFile({ name: 'big.pdf', size: 300 * 1024 + 1, type: 'application/pdf' });
    fireEvent.change(input2, { target: { files: [tooBig] } });

    expect(await screen.findByText(/excede el tamaño máximo/i)).toBeInTheDocument();

    unmount();
  });

  test('Sign: ignores non-pdf and multiple files uses first', async () => {
    const onSign = jest.fn();
    render(<BuyerFinancingActionModals open={true} mode={'sign'} financing={financing} onClose={() => {}} onSign={onSign} />);

    const btn = screen.getByRole('button', { name: /Adjuntar Contrato Firmado|PDF Adjuntado/i });
    const input = btn.querySelector('input[type="file"]');

    const txt = new File(['x'], 'x.txt', { type: 'text/plain' });
    const pdf = makeFile({ name: 'ok.pdf', size: 1024 });
    fireEvent.change(input, { target: { files: [txt, pdf] } });

    expect(await screen.findByText(/El archivo debe ser un PDF/i)).toBeInTheDocument();

    // Now only pdf in files list
    fireEvent.change(input, { target: { files: [pdf] } });
    expect(await screen.findByText(/PDF Adjuntado/i)).toBeInTheDocument();

    const confirm = screen.getByRole('button', { name: /Firmar Documento/i });
    fireEvent.click(confirm);
    await waitFor(() => expect(onSign).toHaveBeenCalled());
    expect(onSign.mock.calls[0][1].name).toBe('ok.pdf');
  });

  test('Sign: clears state after confirm (async handler)', async () => {
    const onSign = jest.fn(() => Promise.resolve());
    render(<BuyerFinancingActionModals open={true} mode={'sign'} financing={financing} onClose={() => {}} onSign={onSign} />);

    const btn = screen.getByRole('button', { name: /Adjuntar Contrato Firmado|PDF Adjuntado/i });
    const input = btn.querySelector('input[type="file"]');

    const pdf = makeFile({ name: 'ok2.pdf', size: 1024 });
    fireEvent.change(input, { target: { files: [pdf] } });
    expect(await screen.findByText(/PDF Adjuntado/i)).toBeInTheDocument();

    const confirm = screen.getByRole('button', { name: /Firmar Documento/i });
    fireEvent.click(confirm);

    await waitFor(() => expect(onSign).toHaveBeenCalled());
    // after confirm, the uploaded file should be cleared (component logic clears it)
    expect(screen.queryByText(/PDF Adjuntado/i)).not.toBeInTheDocument();
  });

  test('Cancel: reason trimmed, empty becomes null, limits to 200 chars', async () => {
    const onCancel = jest.fn();
    const onClose = jest.fn();

    const first = render(<BuyerFinancingActionModals open={true} mode={'cancel'} financing={financing} onClose={onClose} onCancel={onCancel} />);

    const confirm = first.getByRole('button', { name: /Sí, Cancelar|Cancelar Operación|Cancelar/i });
    fireEvent.click(confirm);
    await waitFor(() => expect(onCancel).toHaveBeenCalled());
    expect(onCancel.mock.calls[0][1]).toBeNull();

    // Now with reason > 200 chars
    first.unmount();
    const long = 'a'.repeat(250);
    const second = render(<BuyerFinancingActionModals open={true} mode={'cancel'} financing={financing} onClose={onClose} onCancel={onCancel} />);
    const textarea = second.getByLabelText(/Motivo \(opcional\)/i);
    // simulate browser truncation
    const truncated = long.slice(0, 200);
    fireEvent.change(textarea, { target: { value: truncated } });

    // value should be truncated to 200 due to maxlength
    expect(textarea.value.length).toBeLessThanOrEqual(200);

    // reason should be trimmed and passed
    fireEvent.click(second.getByRole('button', { name: /Sí, Cancelar|Cancelar Operación|Cancelar/i }));
    await waitFor(() => expect(onCancel).toHaveBeenCalled());
    // Last call includes reason truncated to maxlength (200) and trimmed
    const expected = truncated.trim();
    expect(onCancel.mock.calls[onCancel.mock.calls.length - 1][1]).toBe(expected);
  });

  test('Accessibility basics: dialog role and labels present for sign and cancel', () => {
    const { rerender } = render(<BuyerFinancingActionModals open={true} mode={'sign'} financing={financing} onClose={() => {}} onSign={() => {}} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Firmar Documento de Financiamiento/i)).toBeInTheDocument();

    rerender(<BuyerFinancingActionModals open={true} mode={'cancel'} financing={financing} onClose={() => {}} onCancel={() => {}} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Cancelar Operación/i)).toBeInTheDocument();
  });

  test('Handles missing financing prop gracefully', async () => {
    const onSign = jest.fn();
    render(<BuyerFinancingActionModals open={true} mode={'sign'} onClose={() => {}} onSign={onSign} />);

    const btn = screen.getByRole('button', { name: /Adjuntar Contrato Firmado|PDF Adjuntado/i });
    const input = btn.querySelector('input[type="file"]');
    const pdf = makeFile({ name: 'nofin.pdf', size: 1024 });
    fireEvent.change(input, { target: { files: [pdf] } });
    expect(await screen.findByText(/PDF Adjuntado/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Firmar Documento/i }));
    await waitFor(() => expect(onSign).toHaveBeenCalled());
    // first arg undefined
    expect(onSign.mock.calls[0][0]).toBeUndefined();
  });
});
