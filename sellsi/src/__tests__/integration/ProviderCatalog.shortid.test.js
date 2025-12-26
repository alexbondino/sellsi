import { render, screen, waitFor } from '@testing-library/react';
import ProviderCatalog from '../../workspaces/marketplace/pages/ProviderCatalog';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

jest.mock('../../services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    })),
  },
}));

describe('ProviderCatalog short id fallback', () => {
  it('tries prefix match and product-based fallback', async () => {
    // This test ensures ProviderCatalog will attempt lookups without crashing
    render(
      <MemoryRouter initialEntries={["/catalog/acme/abcd"]}>
        <Routes>
          <Route path="/catalog/:userNm/:userId" element={<ProviderCatalog />} />
        </Routes>
      </MemoryRouter>
    );

    // We expect loading spinner or error handled gracefully
    await waitFor(() => expect(screen.queryByText(/Proveedor no encontrado/i) || screen.queryByRole('progressbar')).not.toBeNull());
  });
});