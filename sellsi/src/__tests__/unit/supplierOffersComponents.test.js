import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BannerProvider } from '../../shared/components/display/banners/BannerContext';
import { dashboardThemeCore } from '../../styles/dashboardThemeCore';
import SupplierOffersList from '../../domains/supplier/pages/offers/components/SupplierOffersList';

const createClient = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });

const Wrapper = ({ children }) => {
  const clientRef = React.useRef();
  if (!clientRef.current) clientRef.current = createClient();
  return (
    <QueryClientProvider client={clientRef.current}>
      <BannerProvider>
        <ThemeProvider theme={dashboardThemeCore}>{children}</ThemeProvider>
      </BannerProvider>
    </QueryClientProvider>
  );
};

describe('SupplierOffersList filtered empty vs global empty', () => {
  it('muestra estado global vacío cuando no hay ofertas', () => {
    render(<Wrapper><SupplierOffersList offers={[]} setOffers={()=>{}} /></Wrapper>);
    expect(screen.getByText('Aún no tienes ofertas')).toBeInTheDocument();
    expect(screen.queryByText('No hay ofertas con este estado')).not.toBeInTheDocument();
  });

  it('muestra mensaje contextual cuando el filtro no retorna resultados', async () => {
    const offers = [
      { id: 'sup1', status: 'pending', quantity: 2, price: 1000, product: { name: 'P1' }, buyer: { name: 'B1' } },
      { id: 'sup2', status: 'pending', quantity: 3, price: 2000, product: { name: 'P2' }, buyer: { name: 'B2' } }
    ];
    const setOffers = jest.fn();
    render(<Wrapper><SupplierOffersList offers={offers} setOffers={setOffers} /></Wrapper>);

    // abrir select y elegir un estado sin ofertas (approved)
    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);
    const approvedOpt = await screen.findAllByText('Aceptada');
    fireEvent.click(approvedOpt.find(el => el.getAttribute('role') === 'option') || approvedOpt[0]);

    await waitFor(() => {
      expect(screen.queryByText('Aún no tienes ofertas')).not.toBeInTheDocument();
      expect(screen.getByText('No hay ofertas con este estado')).toBeInTheDocument();
    });
  });
});
