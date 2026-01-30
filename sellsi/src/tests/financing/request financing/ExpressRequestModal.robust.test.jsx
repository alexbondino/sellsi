import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpressRequestModal from '../../../../workspaces/buyer/my-financing/components/ExpressRequestModal';

const fillValidForm = async (dialog) => {
  const w = within(dialog);
  const amount = w.getByLabelText(/Monto a financiar/i);
  const term = w.getByLabelText(/Plazo de pago/i);
  const rut = w.getByLabelText(/^RUT\s*de la Empresa/i);
  const repRut = w.getByLabelText(/RUT Representante Legal/i);
  const businessName = w.getByLabelText(/Razón Social/i);
  const reps = w.getAllByLabelText(/Representante Legal/i);
  const rep = reps.find(el => el !== repRut);
  const address = w.getByLabelText(/Dirección Legal/i);

  await userEvent.type(amount, '500000');
  await userEvent.type(term, '15');
  await userEvent.type(rut, '12345678-5');
  await userEvent.type(repRut, '12345678-5');
  await userEvent.type(businessName, 'ACME SRL');
  await userEvent.clear(rep);
  fireEvent.change(rep, { target: { value: 'Fulano' } });
  await waitFor(() => expect(rep).toHaveValue('Fulano'));
  await userEvent.type(address, 'Calle Falsa 123');

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
};

describe('ExpressRequestModal - robust', () => {
  test('shows validation errors when required fields are missing and prevents submit', async () => {
    const onSubmit = jest.fn();
    const onBack = jest.fn();
    render(<ExpressRequestModal open={true} onClose={() => {}} onBack={onBack} onSubmit={onSubmit} />);

    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /Solicitar/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    // there may be multiple "Campo requerido" messages, assert at least one
    const errors = within(dialog).getAllByText(/Campo requerido/i);
    expect(errors.length).toBeGreaterThan(0);
  });

  test('submits successfully with valid data', async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    render(<ExpressRequestModal open={true} onClose={() => {}} onBack={() => {}} onSubmit={onSubmit} />);

    const dialog = screen.getByRole('dialog');
    await fillValidForm(dialog);

    // ensure no validation errors remain (including RUT format)
    await waitFor(() => expect(within(dialog).queryAllByText(/Campo requerido|El monto debe ser mayor a 0|El plazo debe ser entre 1 y 60 días|Formato de RUT inválido/i).length).toBe(0));

    // Use userEvent to trigger full click lifecycle
    await userEvent.click(within(dialog).getByRole('button', { name: /Solicitar/i }));

    // ensure no validation/file errors remain (double-check before submit)
    const remainingErrors = within(dialog).queryAllByText(/Campo requerido|Formato de RUT inválido|El archivo no debe superar 10MB|El monto debe ser mayor a 0|El plazo debe ser entre 1 y 60 días/i);
    expect(remainingErrors.length).toBe(0);

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.type).toBe('express');
    expect(payload.amount).toBe('500000');
    expect(payload.term).toBe('15');
    expect(payload.businessName).toBe('ACME SRL');
  });

  test('onBack is called when clicking Volver', () => {
    const onBack = jest.fn();
    render(<ExpressRequestModal open={true} onClose={() => {}} onBack={onBack} onSubmit={() => {}} />);

    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /Volver/i }));
    expect(onBack).toHaveBeenCalled();
  });
});