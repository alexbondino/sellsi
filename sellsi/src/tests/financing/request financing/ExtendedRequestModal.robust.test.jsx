import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExtendedRequestModal from '../../../../workspaces/buyer/my-financing/components/ExtendedRequestModal';

const makeFile = ({ name = 'doc.pdf', size = 1024, type = 'application/pdf' } = {}) => {
  const content = new Uint8Array(size).fill(0);
  return new File([content], name, { type });
};

const fillValidExtendedForm = async (dialog, { skipFileUploads = false } = {}) => {
  const w = within(dialog);
  await userEvent.type(w.getByLabelText(/Monto a financiar/i), '1000000');
  await userEvent.type(w.getByLabelText(/Plazo de pago/i), '30');
  await userEvent.type(w.getByLabelText(/RUT de la Empresa/i), '12345678-5');
  await userEvent.type(w.getByLabelText(/Raz[oó]n Social/i), 'Empresa SA');
  await userEvent.type(w.getByLabelText(/RUT Representante Legal/i), '12345678-5');
  const reps = w.getAllByLabelText(/Representante Legal/i);
  const repInput = reps[reps.length - 1];
  await userEvent.clear(repInput);
  await userEvent.click(repInput);
  // Some environments don't update controlled inputs reliably with userEvent; fall back to input event
  fireEvent.input(repInput, { target: { value: 'Rep Legal' } });
  await waitFor(() => expect(repInput).toHaveValue('Rep Legal'));
  await userEvent.type(w.getByLabelText(/Direcci[oó]n Legal/i), 'Calle 1');

  // Select region and commune by opening MUI menus and clicking menu items (robust in JSDOM)
  // Open the Select (combobox) elements and pick menu items — combobox role is reliable here
  const comboboxes = within(dialog).getAllByRole('combobox');
  const regionBox = comboboxes[0];
  await userEvent.click(regionBox);
  const regionOption = await screen.findByRole('option', { name: /Región Metropolitana/i });
  await userEvent.click(regionOption);
  await waitFor(() => expect(regionBox).toHaveTextContent(/Región Metropolitana/i));

  const communeBox = comboboxes[1];
  await userEvent.click(communeBox);
  const communeOption = await screen.findByRole('option', { name: /Santiago/i });
  await userEvent.click(communeOption);
  await waitFor(() => expect(communeBox).toHaveTextContent(/Santiago/i));

  if (!skipFileUploads) {
    // upload required files (scoped) - use buttons by visible text
    const fileButtons = w.getAllByRole('button', { name: /Seleccionar archivo/i });
    const powersInput = fileButtons[0].querySelector('input[type="file"]');
    fireEvent.change(powersInput, { target: { files: [makeFile()] } });

    const powers2Input = fileButtons[1].querySelector('input[type="file"]');
    fireEvent.change(powers2Input, { target: { files: [makeFile()] } });

    const taxInput = fileButtons[2].querySelector('input[type="file"]');
    fireEvent.change(taxInput, { target: { files: [makeFile()] } });
  }
};

describe('ExtendedRequestModal - robust', () => {
  test('validation errors prevent submit and show messages', async () => {
    const onSubmit = jest.fn();
    render(<ExtendedRequestModal open={true} onClose={() => {}} onBack={() => {}} onSubmit={onSubmit} />);

    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /Solicitar/i }));

    await waitFor(() => expect(within(dialog).getByText(/El monto debe ser mayor a 0/i)).toBeInTheDocument());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('file size >10MB shows error and blocks submit', async () => {
    const onSubmit = jest.fn();
    render(<ExtendedRequestModal open={true} onClose={() => {}} onBack={() => {}} onSubmit={onSubmit} />);

    // simulate a large file (scope to dialog)
    const dialog = screen.getByRole('dialog');
    const big = new File([new Uint8Array(11 * 1024 * 1024)], 'big.pdf', { type: 'application/pdf' });
    // use visible 'Seleccionar archivo' buttons and pick the first
    const fileButtons = within(dialog).getAllByRole('button', { name: /Seleccionar archivo/i });
    const powersInput = fileButtons[0].querySelector('input[type="file"]');
    fireEvent.change(powersInput, { target: { files: [big] } });

    expect(await within(dialog).findByText(/El archivo no debe superar 10MB/i)).toBeInTheDocument();

    // fill other required fields minimally (skip re-uploading files so the large file remains)
    await fillValidExtendedForm(dialog, { skipFileUploads: true });

    // submit should not call onSubmit because of file error
    fireEvent.click(within(dialog).getByRole('button', { name: /Solicitar/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('submits successfully with all valid data and resets state', async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    render(<ExtendedRequestModal open={true} onClose={() => {}} onBack={() => {}} onSubmit={onSubmit} />);

    const dialog = screen.getByRole('dialog');
    await fillValidExtendedForm(dialog);

    // ensure no validation/file errors remain (include RUT format)
    await waitFor(() => expect(within(dialog).queryAllByText(/Campo requerido|Documento requerido|El archivo no debe superar 10MB|Formato de RUT inválido/i).length).toBe(0));

    // Use userEvent to trigger full click lifecycle
    await userEvent.click(within(dialog).getByRole('button', { name: /Solicitar/i }));

    // Log current form field values for debugging
    const amountInput = within(dialog).getByLabelText(/Monto a financiar/i);
    const termInput = within(dialog).getByLabelText(/Plazo de pago/i);
    const rutInput = within(dialog).getByLabelText(/RUT de la Empresa/i);
    const repRut = within(dialog).getAllByLabelText(/RUT Representante Legal/i)[0];
    const regionText = within(dialog).getAllByRole('combobox')[0].textContent;
    const communeText = within(dialog).getAllByRole('combobox')[1].textContent;
// ensure no validation/file errors remain (double-check before submit)
  const remainingErrors = within(dialog).queryAllByText(/Campo requerido|Documento requerido|El archivo no debe superar 10MB|Formato de RUT inválido|El monto debe ser mayor a 0|El plazo debe ser entre 1 y 60 días/i);
  expect(remainingErrors.length).toBe(0);

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.type).toBe('extended');
    expect(payload.amount).toBe('1000000');
    expect(payload.term).toBe('30');
    expect(payload.businessName).toBe('Empresa SA');

    // After success the form should be reset (e.g., amount input empty)
    expect(screen.getByLabelText(/Monto a financiar/i).value).toBe('');
  });

  test('Volver calls onBack', () => {
    const onBack = jest.fn();
    render(<ExtendedRequestModal open={true} onClose={() => {}} onBack={onBack} onSubmit={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /Volver/i }));
    expect(onBack).toHaveBeenCalled();
  });
});