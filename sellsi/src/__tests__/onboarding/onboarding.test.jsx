import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../testUtils/renderWithProviders';

// Import the real supabase client and spy on methods
import { supabase } from '../../services/supabase';
const { createSupabaseMock } = require('../utils/createSupabaseMock');

const mockRefreshUserProfile = jest.fn().mockResolvedValue(undefined);

jest.mock('../../infrastructure/providers/UnifiedAuthProvider', () => ({
  useAuth: () => ({
    refreshUserProfile: mockRefreshUserProfile,
  }),
}));

// Mock the optimized region hook (component only calls primeUserRegionCache)
jest.mock('../../hooks/useOptimizedUserShippingRegion', () => ({
  useOptimizedUserShippingRegion: () => ({
    primeUserRegionCache: jest.fn(),
  }),
}));

// Onboarding imports from src/shared/components (barrel) which pulls in modules
// that rely on import.meta.env (Vite). Jest in this repo isn't configured for
// import.meta, so we stub only what Onboarding needs.
jest.mock('../../shared/components', () => ({
  TaxDocumentSelector: () => null,
  BillingInfoForm: () => null,
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Require the component after mocks so tests can safely adjust module-scoped mocks
const Onboarding =
  require('../../workspaces/auth/onboarding/components/Onboarding').default; 

describe('Onboarding page - integration-ish tests', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const originalLocation = window.location;
  let usersTable;
  let storageFrom; 

  beforeAll(() => {
    // stub URL.createObjectURL used by avatar preview
    URL.createObjectURL = jest.fn(() => 'blob:mock');
    URL.revokeObjectURL = jest.fn();
  });

  afterAll(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevoke;
    window.location = originalLocation;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRefreshUserProfile.mockClear();
    // Use shared helper to create/spawn supabase mocks for tests
    ({ usersTable, storageFrom } = createSupabaseMock(supabase));
  });

  test('renders onboarding and Save button is disabled until basic fields are filled', () => {
    const { getByText, getByLabelText } = renderWithProviders(<Onboarding />);

    const saveBtn = getByText(/Guardar y Finalizar/i);
    expect(saveBtn).toBeDisabled();

    // Fill minimal fields: select provider card (we simulate by typing company name)
    const nameField = getByLabelText(/Nombre de Empresa o Personal \*/i);
    fireEvent.change(nameField, { target: { value: 'ACME S.A.' } });

    // Now we still need to choose account type. Simulate click on card by finding text
    const providerText = getByText(/Soy Proveedor/i);
    fireEvent.click(providerText);

    // After filling name and selecting type the button should be enabled
    expect(saveBtn).not.toBeDisabled();
  });

  test('shows logo error when uploading invalid file type', async () => {
    const { container, getByText, findByText } = renderWithProviders(
      <Onboarding />
    );

    const input = container.querySelector('#logo-upload');
    const badFile = new File(['hello'], 'bad.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [badFile] } });

    // Prefer findByText to wait for the error to appear in the DOM
    await findByText(/Formato no válido|Usa JPG|PNG|WEBP|Máximo 300 KB/i);
  });

  test('gracefully handles URL.createObjectURL throwing', async () => {
    // make createObjectURL throw for this test
    const original = URL.createObjectURL;
    URL.createObjectURL = jest.fn(() => { throw new Error('boom'); });

    try {
      const { container, findByText } = renderWithProviders(<Onboarding />);
      const input = container.querySelector('#logo-upload');
      const file = new File([new ArrayBuffer(100)], 'logo.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1024 });
      fireEvent.change(input, { target: { files: [file] } });

      // Expect a friendly error message and no upload attempted
      await findByText(/No se pudo procesar la imagen|Corrige el error del logo/i);
      expect(storageFrom.upload).not.toHaveBeenCalled();
    } finally {
      // restore stubbed behavior used across the file
      URL.createObjectURL = original;
    }
  });

  test('happy path: provider without factura uploads logo and navigates home', async () => {
    const { getByText, getByLabelText, container } = renderWithProviders(
      <Onboarding />
    );

    // Select provider
    fireEvent.click(getByText(/Soy Proveedor/i));

    // Fill required name
    const nameField = getByLabelText(/Nombre de Empresa o Personal \*/i);
    fireEvent.change(nameField, { target: { value: 'ACME S.A.' } });

    // Provide a valid small png file
    const input = container.querySelector('#logo-upload');
    const goodFile = new File([new ArrayBuffer(100)], 'logo.png', {
      type: 'image/png',
    });
    Object.defineProperty(goodFile, 'size', { value: 1024 });
    fireEvent.change(input, { target: { files: [goodFile] } });

    // Click save
    const saveBtn = getByText(/Guardar y Finalizar/i);
    expect(saveBtn).not.toBeDisabled();
    fireEvent.click(saveBtn);

    // wait for upload, upsert, onboarding flag and navigation
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(storageFrom.upload).toHaveBeenCalled();
      expect(storageFrom.getPublicUrl).toHaveBeenCalled();
      expect(usersTable.upsert).toHaveBeenCalled();
      const upsertPayload = usersTable.upsert.mock.calls[0][0];
      expect(upsertPayload).toEqual(
        expect.objectContaining({
          user_nm: 'ACME S.A.',
          logo_url: expect.stringContaining('https://cdn.test'),
        })
      );
      expect(mockRefreshUserProfile).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalled();
    });
  }, 10000);

  test('shows error when storage upload fails', async () => {
    // Simulate upload failure
    storageFrom.upload.mockResolvedValue({ error: { message: 'upload failed' } });

    const { getByText, getByLabelText, container, findByText } = renderWithProviders(
      <Onboarding />
    );

    fireEvent.click(getByText(/Soy Proveedor/i));
    const nameField = getByLabelText(/Nombre de Empresa o Personal \*/i);
    fireEvent.change(nameField, { target: { value: 'ACME S.A.' } });

    const input = container.querySelector('#logo-upload');
    const goodFile = new File([new ArrayBuffer(100)], 'logo.png', { type: 'image/png' });
    Object.defineProperty(goodFile, 'size', { value: 1024 });
    fireEvent.change(input, { target: { files: [goodFile] } });

    fireEvent.click(getByText(/Guardar y Finalizar/i));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      // upload should be attempted and error logged; upsert should not be called
      await waitFor(() => {
        expect(storageFrom.upload).toHaveBeenCalled();
        expect(usersTable.upsert).not.toHaveBeenCalled();
        const calls = consoleSpy.mock.calls.flat().join(' ');
        expect(calls).toMatch(/Error al subir|upload failed/i);
      });
    } finally {
      consoleSpy.mockRestore();
    }
  });

  test('shows error when upsert fails', async () => {
    // Simulate upsert failure
    usersTable.upsert.mockResolvedValue({ error: { message: 'upsert failed' } });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { getByText, getByLabelText, container, findByText } = renderWithProviders(
        <Onboarding />
      );

      fireEvent.click(getByText(/Soy Proveedor/i));
      const nameField = getByLabelText(/Nombre de Empresa o Personal \*/i);
      fireEvent.change(nameField, { target: { value: 'ACME S.A.' } });

      const input = container.querySelector('#logo-upload');
      const goodFile = new File([new ArrayBuffer(100)], 'logo.png', { type: 'image/png' });
      Object.defineProperty(goodFile, 'size', { value: 1024 });
      fireEvent.change(input, { target: { files: [goodFile] } });

      fireEvent.click(getByText(/Guardar y Finalizar/i));

      await waitFor(() => {
        const calls = consoleSpy.mock.calls.flat().join(' ');
        expect(calls).toMatch(/Error al actualizar el perfil|upsert failed/i);
        expect(usersTable.upsert).toHaveBeenCalled();
        expect(mockRefreshUserProfile).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    } finally {
      consoleSpy.mockRestore();
    }
  });

  test('shows error when file is too large', async () => {
    const { getByText, container, findByText } = renderWithProviders(<Onboarding />);

    const input = container.querySelector('#logo-upload');
    const bigFile = new File([new ArrayBuffer(400 * 1024)], 'big.png', { type: 'image/png' });
    Object.defineProperty(bigFile, 'size', { value: 400 * 1024 });
    fireEvent.change(input, { target: { files: [bigFile] } });

    await findByText(/Máximo 300 KB|Formato no válido/i);
    expect(storageFrom.upload).not.toHaveBeenCalled();
  });

  test('handles missing supabase user (shows console error)', async () => {
    // make getUser return no user
    if (!supabase.auth) supabase.auth = {};
    supabase.auth.getUser = jest
      .fn()
      .mockResolvedValue({ data: { user: null }, error: null });

    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      const { getByText, getByLabelText } = renderWithProviders(<Onboarding />);

      // select provider and fill name
      fireEvent.click(getByText(/Soy Proveedor/i));
      const nameField = getByLabelText(/Nombre de Empresa o Personal \*/i);
      fireEvent.change(nameField, { target: { value: 'ACME S.A.' } });

      // Click save
      const saveBtn = getByText(/Guardar y Finalizar/i);
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
        // At least one of the calls should mention 'Error al actualizar el perfil' or user not found
        const calls = consoleSpy.mock.calls.flat().join(' ');
        expect(calls).toMatch(
          /Usuario no encontrado|Error al actualizar el perfil/i
        );
      });
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
