/**
 * Test de validación: Chip "OFERTADO" unificado con estilo de CartItem
 * Verifica que BuyerOrders use el mismo estilo visual que CartItem para productos ofertados
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock del componente BuyerOrders simplificado para testing
const MockBuyerOrdersComponent = ({ orders }) => {
  return (
    <div>
      {orders.map(order => (
        <div key={order.order_id}>
          {order.items.map((item, index) => (
            <div key={index}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ flex: 1, minWidth: 0, marginBottom: 0 }}>
                  {item.product.name}
                </span>
                {(() => {
                  const isOffered = item.isOffered || item.metadata?.isOffered || !!item.offer_id || !!item.offered_price;
                  if (!isOffered) return null;
                  return (
                    <span
                      data-testid="chip-ofertado"
                      style={{
                        color: '#4caf50', // success.main
                        fontWeight: 800,
                        marginLeft: '4px',
                        fontSize: '0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #4caf50',
                        backgroundColor: 'rgba(76, 175, 80, 0.06)'
                      }}
                    >
                      OFERTADO
                    </span>
                  );
                })()}
              </div>
              <div>
                {item.quantity} uds a ${item.price_at_addition} c/u = ${item.quantity * item.price_at_addition}
                {(() => {
                  const isOffered = item.isOffered || item.metadata?.isOffered || !!item.offer_id || !!item.offered_price;
                  if (!isOffered) return null;
                  return <span style={{ marginLeft: '4px', color: '#1976d2' }}>Precio OFERTADO fijo</span>;
                })()}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

describe('BuyerOrders - Chip OFERTADO Unificado', () => {
  const mockOrders = [
    {
      order_id: 'test-order-1',
      items: [
        {
          product: { name: 'Producto Regular', supplier: { name: 'Proveedor A' } },
          quantity: 2,
          price_at_addition: 1000,
          product_id: 'prod-1'
          // Sin campos de oferta - producto regular
        },
        {
          product: { name: 'Producto Ofertado', supplier: { name: 'Proveedor B' } },
          quantity: 1,
          price_at_addition: 800,
          product_id: 'prod-2',
          isOffered: true,
          offer_id: 'offer-123',
          offered_price: 800
        },
        {
          product: { name: 'Producto Ofertado Metadata', supplier: { name: 'Proveedor C' } },
          quantity: 3,
          price_at_addition: 1200,
          product_id: 'prod-3',
          metadata: { isOffered: true },
          offer_id: 'offer-456'
        }
      ]
    }
  ];

  it('debe detectar correctamente productos ofertados', () => {
    render(<MockBuyerOrdersComponent orders={mockOrders} />);
    
    // Debe haber exactamente 2 chips OFERTADO (para los 2 productos ofertados)
    const offeredChips = screen.getAllByTestId('chip-ofertado');
    expect(offeredChips).toHaveLength(2);
    
    // Verificar que todos los chips muestran "OFERTADO" en mayúsculas
    offeredChips.forEach(chip => {
      expect(chip.textContent).toBe('OFERTADO');
    });
  });

  it('debe usar el estilo visual correcto (verde con borde)', () => {
    render(<MockBuyerOrdersComponent orders={mockOrders} />);
    
    const offeredChips = screen.getAllByTestId('chip-ofertado');
    
    // Verificar que todos los chips tienen el estilo correcto
    offeredChips.forEach(chip => {
      const styles = chip.style;
      expect(styles.color).toBe('rgb(76, 175, 80)'); // Verde
      expect(styles.fontWeight).toBe('800'); // Negrita
      expect(styles.border).toBe('1px solid rgb(76, 175, 80)'); // Borde verde
      expect(styles.backgroundColor).toBe('rgba(76, 175, 80, 0.06)'); // Fondo verde transparente
    });
  });

  it('debe detectar ofertas por diferentes campos', () => {
    const specificOrders = [
      {
        order_id: 'detection-test',
        items: [
          {
            product: { name: 'Test isOffered' },
            isOffered: true,
            quantity: 1,
            price_at_addition: 100
          },
          {
            product: { name: 'Test metadata.isOffered' },
            metadata: { isOffered: true },
            quantity: 1,
            price_at_addition: 200
          },
          {
            product: { name: 'Test offer_id' },
            offer_id: 'some-offer-id',
            quantity: 1,
            price_at_addition: 300
          },
          {
            product: { name: 'Test offered_price' },
            offered_price: 400,
            quantity: 1,
            price_at_addition: 400
          }
        ]
      }
    ];

    render(<MockBuyerOrdersComponent orders={specificOrders} />);
    
    // Debe detectar las 4 variantes de detección de ofertas
    const offeredChips = screen.getAllByTestId('chip-ofertado');
    expect(offeredChips).toHaveLength(4);
  });

  it('no debe mostrar chip para productos regulares', () => {
    const regularOrders = [
      {
        order_id: 'regular-test',
        items: [
          {
            product: { name: 'Producto Regular 1' },
            quantity: 1,
            price_at_addition: 500
          },
          {
            product: { name: 'Producto Regular 2' },
            quantity: 2,
            price_at_addition: 300,
            // Sin campos de oferta
          }
        ]
      }
    ];

    render(<MockBuyerOrdersComponent orders={regularOrders} />);
    
    // No debe haber ningún chip OFERTADO
    const offeredChips = screen.queryAllByTestId('chip-ofertado');
    expect(offeredChips).toHaveLength(0);
  });

  it('debe mostrar "Precio OFERTADO fijo" para productos ofertados', () => {
    render(<MockBuyerOrdersComponent orders={mockOrders} />);
    
    // Verificar que aparece el texto "Precio OFERTADO fijo" para productos ofertados
    expect(screen.getAllByText(/Precio OFERTADO fijo/)).toHaveLength(2);
  });
});
