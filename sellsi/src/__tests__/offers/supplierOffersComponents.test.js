import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BannerProvider } from '../../shared/components/display/banners/BannerContext';
import { dashboardThemeCore } from '../../styles/dashboardThemeCore';
import SupplierOffersList from '../../workspaces/supplier/my-offers/components/SupplierOffersList';

const createClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });

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
    render(
      <Wrapper>
        <SupplierOffersList offers={[]} setOffers={() => {}} />
      </Wrapper>
    );
    expect(screen.getByText('Aún no tienes ofertas')).toBeInTheDocument();
    expect(
      screen.queryByText('No hay ofertas con este estado')
    ).not.toBeInTheDocument();
  });

  it('muestra mensaje contextual cuando el filtro no retorna resultados', async () => {
    const offers = [
      {
        id: 'sup1',
        status: 'pending',
        quantity: 2,
        price: 1000,
        product: { name: 'P1' },
        buyer: { name: 'B1' },
      },
      {
        id: 'sup2',
        status: 'pending',
        quantity: 3,
        price: 2000,
        product: { name: 'P2' },
        buyer: { name: 'B2' },
      },
    ];
    const setOffers = jest.fn();
    const utils = render(
      <Wrapper>
        <SupplierOffersList offers={offers} setOffers={setOffers} />
      </Wrapper>
    );

    // abrir select y elegir un estado sin ofertas (approved) de forma robusta
    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);
    const listbox = await screen.findByRole('listbox');
    fireEvent.click(within(listbox).getByText('Aceptada'));

    await waitFor(() => {
      expect(
        screen.queryByText('Aún no tienes ofertas')
      ).not.toBeInTheDocument();
      expect(
        screen.getByText('No hay ofertas con este estado')
      ).toBeInTheDocument();

      // No se deben mostrar las filas originales
      expect(screen.queryByText('P1')).not.toBeInTheDocument();
      expect(screen.queryByText('P2')).not.toBeInTheDocument();

      // Y existe una fila que muestra el mensaje contextual para el filtro
      const rows = utils.container.querySelectorAll('tbody tr');
      expect(rows.length).toBe(1);
      expect(rows[0].textContent).toContain('No hay ofertas con este estado');
    });
  });

  it('muestra skeleton cuando initializing=true o loading=true', () => {
    const setOffers = jest.fn();
    const { container } = render(
      <Wrapper>
        <SupplierOffersList offers={[]} setOffers={setOffers} initializing={true} />
      </Wrapper>
    );

    // No debería mostrar el mensaje de 'Aún no tienes ofertas' cuando está inicializando
    expect(screen.queryByText('Aún no tienes ofertas')).not.toBeInTheDocument();
    // Verificar existencia de skeletons (clase MUI)
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);

    // También cuando loading=true
    const { container: c2 } = render(
      <Wrapper>
        <SupplierOffersList offers={[]} setOffers={setOffers} loading={true} />
      </Wrapper>
    );
    expect(c2.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0);
  });

  it('muestra la vista mobile cuando useMediaQuery indica móvil y filtra correctamente', async () => {
    const offers = [
      {
        id: 'sup1',
        status: 'pending',
        quantity: 2,
        price: 1000,
        product: { name: 'P1' },
        buyer: { name: 'B1' },
      }
    ];
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: true,
      media: '',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    try {
      render(
        <Wrapper>
          <SupplierOffersList offers={offers} setOffers={() => {}} />
        </Wrapper>
      );

      // Expandir el accordion de filtros en móvil y elegir 'Aceptada' para provocar el mensaje
      const allT = screen.getAllByText('Todas');
      const summaryEl = allT.find(el => el.closest('button') || el.closest('div[role="button"]'));
      const accordion = summaryEl ? (summaryEl.closest('button') || summaryEl.closest('div[role="button"]')) : null;
      expect(accordion).toBeTruthy();
      fireEvent.click(accordion);
      // Wait for the accordion details region to appear
      await waitFor(() => expect(screen.getByRole('region')).toBeInTheDocument());
      const region = screen.getByRole('region');
      const candidates = within(region).getAllByText(/Aceptada/);
      const approvedEl = candidates.find(el => el.closest('label') && el.closest('label').querySelector('input[value="approved"]'));
      expect(approvedEl).toBeTruthy();
      fireEvent.click(approvedEl.closest('label'));

      await waitFor(() => {
        expect(screen.getByText('No hay ofertas con este estado')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('No hay ofertas con este estado')).toBeInTheDocument();
      });
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('muestra estado desconocido cuando status no está en STATUS_MAP', () => {
    const offers = [
      { id: 'o1', status: 'weird_status', quantity: 1, price: 1000, product: { name: 'X' } },
    ];
    render(
      <Wrapper>
        <SupplierOffersList offers={offers} setOffers={() => {}} />
      </Wrapper>
    );

    expect(screen.getByText('Desconocido')).toBeInTheDocument();
  });

  it('formatea precio y total correctamente y muestra tiempo restante / caducada', () => {
    const now = Date.now();
    const inOneHour = new Date(now + 60 * 60 * 1000).toISOString();
    const past = new Date(now - 60 * 60 * 1000).toISOString();

    const offers = [
      {
        id: 'a1',
        status: 'pending',
        quantity: 2,
        price: 1000,
        product: { name: 'P-Format' },
        buyer: { name: 'B' },
        expires_at: inOneHour,
      },
      {
        id: 'a2',
        status: 'pending',
        quantity: 1,
        price: 1000,
        product: { name: 'P-Expired' },
        buyer: { name: 'B' },
        expires_at: past,
      },
      {
        id: 'a3',
        status: 'approved',
        quantity: 3,
        price: 1500,
        product: { name: 'P-Price' },
        buyer: { name: 'B' },
      },
    ];

    render(
      <Wrapper>
        <SupplierOffersList offers={offers} setOffers={() => {}} />
      </Wrapper>
    );

    // Price and total check for first row
    expect(screen.getByText(/2 uds \* \$1.000 = \$2.000/)).toBeInTheDocument();

    // Expires in shows some time text (h or m) in the row for P-Format
    const rowFormat = screen.getByText('P-Format').closest('tr');
    expect(within(rowFormat).getByText(/\d+\s*[hm]/)).toBeInTheDocument();

    // Expired shows 'Caducada' in the row for P-Expired
    const rowExpired = screen.getByText('P-Expired').closest('tr');
    expect(within(rowExpired).getByText('Caducada')).toBeInTheDocument();
  });

  it('al hacer click en Aceptar abre la modal de acciones', async () => {
    const offers = [
      {
        id: 'o-accept',
        status: 'pending',
        quantity: 1,
        price: 1000,
        product: { name: 'OpenModal' },
        buyer: { name: 'B' },
      },
    ];
    render(
      <Wrapper>
        <SupplierOffersList offers={offers} setOffers={() => {}} />
      </Wrapper>
    );

    // Click accept button
    const acceptBtn = screen.getByLabelText('Aceptar Oferta');
    fireEvent.click(acceptBtn);

    // The SupplierOfferActionModals should open a dialog
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });
});
