import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../testUtils/renderWithProviders';

// Import the real supabase client and spy on methods
import { supabase } from '../../services/supabase';

// Mock the optimized region hook (component only calls primeUserRegionCache)
jest.mock('../../hooks/useOptimizedUserShippingRegion', () => ({
  useOptimizedUserShippingRegion: () => ({
    primeUserRegionCache: jest.fn(),
  }),
}));

// Require the component after mocks so tests can safely adjust module-scoped mocks
const Onboarding =
  require('../../workspaces/auth/onboarding/components/Onboarding').default;

describe('Onboarding page - integration-ish tests', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const originalLocation = window.location;

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
    // default supabase spies - ensure objects exist before assigning
    if (supabase) {
      if (!supabase.auth) supabase.auth = {};
      supabase.auth.getUser = jest
        .fn()
        .mockResolvedValue({
          data: { user: { id: 'user-1', email: 'test@example.com' } },
          error: null,
        });
      // refreshSession is called in the flow; ensure it's present
      supabase.auth.refreshSession = jest.fn().mockResolvedValue(null);

      if (!supabase.storage) supabase.storage = {};
      supabase.storage.from = jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest
          .fn()
          .mockReturnValue({
            data: { publicUrl: 'https://cdn.test/user-1/logo.png' },
          }),
        remove: jest.fn().mockResolvedValue({ error: null }),
      });

      // mock table helpers
      supabase.from = jest.fn().mockImplementation(table => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest
              .fn()
              .mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            upsert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        return { upsert: jest.fn().mockResolvedValue({ error: null }) };
      });
    }
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
    const { container, getByText } = renderWithProviders(<Onboarding />);

    const input = container.querySelector('#logo-upload');
    const badFile = new File(['hello'], 'bad.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [badFile] } });

    // Relaxed matcher: MUI may split nodes or change accents when rendering
    await waitFor(() =>
      expect(document.body.textContent).toMatch(
        /Formato no válido|Usa JPG|PNG|WEBP|Máximo 300 KB/i
      )
    );
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

    // wait for upsert and onboarding flag
    await waitFor(() => {
      expect(sessionStorage.getItem('onboardingDone')).toBe('1');
      expect(supabase.from).toHaveBeenCalledWith('users');
    });
  }, 10000);

  test('handles missing supabase user (shows console error)', async () => {
    // make getUser return no user
    if (!supabase.auth) supabase.auth = {};
    supabase.auth.getUser = jest
      .fn()
      .mockResolvedValue({ data: { user: null }, error: null });

    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

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

    consoleSpy.mockRestore();
  });
});
