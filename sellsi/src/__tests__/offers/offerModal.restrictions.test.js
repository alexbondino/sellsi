const React = require('react');
const { render, screen, fireEvent, act, within } = require('@testing-library/react');
const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');
const OfferModal = require('../../workspaces/product/product-page-view/components/OfferModal').default;
const { useOfferStore } = require('../../stores/offerStore');
const { mockSupabase } = require('../mocks/supabaseMock');
const { resetOfferStore } = require('../utils/resetOfferStore');

jest.mock('../../services/supabase', () => {
  const { mockSupabase: injected } = require('../mocks/supabaseMock');
  return { supabase: injected };
});

const Wrapper = ({ children }) => {
  const [client] = React.useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));
  return React.createElement(QueryClientProvider, { client }, children);
};

describe('OfferModal restrictions', () => {
  let localStorageGetSpy;
  let localStorageSetSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    // Espiar getItem/setItem nativos para evitar dependencia del mock y facilitar limpieza
    localStorageGetSpy = jest.spyOn(window.localStorage, 'getItem').mockImplementation(key => {
      if (key === 'user_id') return 'buyer_restr_1';
      if (key === 'user_nm') return 'Buyer Test';
      if (key === 'user_email') return 'buyer@test.com';
      return null;
    });
    localStorageSetSpy = jest.spyOn(window.localStorage, 'setItem').mockImplementation(() => {});

    // Reset completo del store
    resetOfferStore();
  });

  afterEach(() => {
    localStorageGetSpy.mockRestore();
    localStorageSetSpy.mockRestore();
  });

  it('bloquea envío si ya existe oferta pendiente para el producto (mantiene bloqueo aun con inputs válidos) y se habilita si no hay pending', async () => {
    // Seed pending offer in store
    useOfferStore.setState({
      buyerOffers: [{ id: 'o1', product_id: 'prod_1', status: 'pending' }],
    });

    const product = {
      id: 'prod_1',
      name: 'Producto X',
      supplier_id: 'sup_1',
      price: 1200,
      stock: 50,
    };

    const { rerender } = render(React.createElement(Wrapper, null, React.createElement(OfferModal, { open: true, onClose: () => {}, product })));

    // Mensaje de bloqueo visible
    expect(await screen.findByTestId('pending-offer-block')).toBeInTheDocument();

    // Rellenar inputs con valores válidos
    const priceInput = screen.getByLabelText(/precio por unidad/i);
    const qtyInput = screen.getByLabelText(/cantidad/i);
    await act(async () => {
      fireEvent.change(priceInput, { target: { value: '100' } });
      fireEvent.change(qtyInput, { target: { value: '2' } });
    });

    const submit = screen.getByRole('button', { name: /enviar oferta/i });

    // Aun con inputs válidos, el botón debe permanecer deshabilitado por pending
    expect(submit).toBeDisabled();

    // Quitar pending del store y re-renderizar -> ahora el botón debe habilitarse
    await act(async () => {
      useOfferStore.setState({ buyerOffers: [] });
      rerender(React.createElement(Wrapper, null, React.createElement(OfferModal, { open: true, onClose: () => {}, product })));
      
    });

    // Revisar que el bloque de pending ya no exista
    expect(screen.queryByTestId('pending-offer-block')).toBeNull();
    // Ahora el botón debe estar habilitado (inputs válidos)
    expect(screen.getByRole('button', { name: /enviar oferta/i })).not.toBeDisabled();
  });

  it('muestra límite alcanzado por supplier_count (supplier_limit) aunque product_count < product_limit y llama validateOfferLimits', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: {
        allowed: false,
        product_count: 2,
        supplier_count: 5,
        product_limit: 3,
        supplier_limit: 5,
        reason: 'Se alcanzó el límite mensual de ofertas (proveedor)',
      },
      error: null,
    });

    const product = {
      id: 'prod_2',
      name: 'Producto Y',
      supplier_id: 'sup_2',
      price: 500,
      stock: 20,
    };

    render(React.createElement(Wrapper, null, React.createElement(OfferModal, { open: true, onClose: () => {}, product })));

    // Esperar aparición del alert de límites
    const limitsAlert = await screen.findByTestId('limits-alert', {}, { timeout: 3000 });
    expect(limitsAlert).toBeInTheDocument();

    // Verificar que validateOfferLimits (RPC) fue invocado con buyer/supplier/product
    const validateCall = mockSupabase.rpc.mock.calls.find(c => c[0] === 'validate_offer_limits');
    expect(validateCall).toBeDefined();
    const args = validateCall[1] || validateCall[1];
    // Dependiendo de wrapper, keys pueden variar; al menos asegurar que product is present
    expect(JSON.stringify(args)).toMatch(/prod_2/);

    // Confirmar que muestra la razón de proveedor exactamente (al menos uno visible)
    expect(within(limitsAlert).getByText(/Se alcanzó el límite mensual de ofertas \(proveedor\)/i)).toBeDefined();
  });

  it('muestra límite por product_count cuando product >= limit', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: {
        allowed: false,
        product_count: 3,
        supplier_count: 1,
        product_limit: 3,
        supplier_limit: 5,
        reason: 'Se alcanzó el límite mensual de ofertas (producto)',
      },
      error: null,
    });

    const product = { id: 'prod_3', name: 'Producto Z', supplier_id: 'sup_3', price: 200, stock: 10 };

    render(React.createElement(Wrapper, null, React.createElement(OfferModal, { open: true, onClose: () => {}, product })));
    

    const limitsAlert = await screen.findByTestId('limits-alert');
    expect(limitsAlert).toBeDefined();
    expect(within(limitsAlert).getByText(/límite mensual de ofertas \(producto\)/i)).toBeDefined();
  });

  it('respeta initialLimits y no realiza RPC cuando se proveen', async () => {
    // Si initialLimits está presente, OfferModal debería usarlo sin llamar a validate
    const initial = { allowed: false, product_count: 5, product_limit: 3, reason: 'initial' };
    const product = { id: 'prod_4', name: 'Producto W', supplier_id: 'sup_4', price: 300, stock: 5 };

    render(React.createElement(Wrapper, null, React.createElement(OfferModal, { open: true, onClose: () => {}, product, initialLimits: initial })));
    

    // Debería mostrar el reason del initialLimits y no haber llamado al RPC (validate)
    const alerts = await screen.findAllByRole('alert');
    const limitsAlert = alerts.find(a => /límites de ofertas/i.test(a.textContent) || /initial/i.test(a.textContent));
    expect(limitsAlert).toBeDefined();
    expect(within(limitsAlert).getByText(/initial/i)).toBeDefined();

    const validateCall = mockSupabase.rpc.mock.calls.find(c => c[0] === 'validate_offer_limits');
    expect(validateCall).toBeUndefined();
  });
});
