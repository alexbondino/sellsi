import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OfferModal from '../../domains/ProductPageView/components/OfferModal';
import { useOfferStore } from '../../stores/offerStore';
import { mockSupabase, mockLocalStorage } from '../mocks/supabaseMock';

jest.mock('../../services/supabase', () => {
  const { mockSupabase: injected } = require('../mocks/supabaseMock');
  return { supabase: injected };
});

const Wrapper = ({ children }) => {
  const [client] = React.useState(() => new QueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('OfferModal restrictions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Configurar implementación de getItem para que OfferModal pueda leer user_id
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'user_id') return 'buyer_restr_1';
      if (key === 'user_nm') return 'Buyer Test';
      if (key === 'user_email') return 'buyer@test.com';
      return null;
    });
    // (setItem no persiste en el mock, por eso usamos implementación directa de getItem)
    useOfferStore.setState({ buyerOffers: [], supplierOffers: [], error: null, loading: false });
  });

  it('bloquea envío si ya existe oferta pendiente para el producto', async () => {
    // Seed pending offer in store
    useOfferStore.setState({ buyerOffers: [{ id: 'o1', product_id: 'prod_1', status: 'pending' }] });

    const product = { id: 'prod_1', name: 'Producto X', supplier_id: 'sup_1', price: 1200, stock: 50 };

    render(
      <Wrapper>
        <OfferModal open={true} onClose={()=>{}} product={product} />
      </Wrapper>
    );

    // Mensaje de bloqueo visible
    expect(await screen.findByTestId('pending-offer-block')).toBeInTheDocument();

    // Botón deshabilitado
    const submit = screen.getByRole('button', { name: /enviar oferta/i });
    expect(submit).toBeDisabled();
  });

  it('muestra límite alcanzado por supplier_count (supplier_limit) aunque product_count < product_limit', async () => {
    mockSupabase.rpc
      .mockResolvedValueOnce({ data: { allowed: false, product_count: 2, supplier_count: 5, product_limit: 3, supplier_limit: 5, reason: 'Se alcanzó el límite mensual de ofertas (proveedor)' }, error: null });

    const product = { id: 'prod_2', name: 'Producto Y', supplier_id: 'sup_2', price: 500, stock: 20 };

    render(
      <Wrapper>
        <OfferModal open={true} onClose={()=>{}} product={product} />
      </Wrapper>
    );

  // Esperar aparición de texto de límites (puede tardar un ciclo en validar)
  const limitsNode = await screen.findByText(/límites de ofertas/i, {}, { timeout: 3000 });
  expect(limitsNode).toBeInTheDocument();
  // Confirmar que existe al menos un nodo que contenga la razón de proveedor (pueden existir otros textos con "proveedor")
  const reasonNodes = await screen.findAllByText(/proveedor/i, {}, { timeout: 3000 });
  expect(reasonNodes.length).toBeGreaterThan(0);
  const hasSupplierLimitReason = reasonNodes.some(n => /límite mensual de ofertas \(proveedor\)/i.test(n.textContent));
  expect(hasSupplierLimitReason).toBe(true);
  });
});
