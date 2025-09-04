import React from 'react';
import { render, screen } from '@testing-library/react';
import SupplierOfferActionModals from '../../domains/supplier/pages/offers/components/SupplierOfferActionModals';

// Helper to format CLP like component
const clp = (v) => '$' + new Intl.NumberFormat('es-CL').format(Math.round(v));

const baseBuyer = { id: 'buyer_1', name: 'Comprador Test' };

const renderModal = (offerOverrides = {}) => {
  const defaultOffer = {
    id: 'offer_test',
    price: 1000,
    quantity: 10,
    buyer: baseBuyer,
    product: { id: 'prod_1', name: 'Producto Demo', price: 1000, stock: 7000 },
  };
  const offer = { ...defaultOffer, ...offerOverrides, product: { ...defaultOffer.product, ...(offerOverrides.product||{}) } };
  render(
    <SupplierOfferActionModals
      open
      mode="accept"
      offer={offer}
      onClose={()=>{}}
      onAccept={()=>{}}
      onReject={()=>{}}
      onCleanup={()=>{}}
    />
  );
  return offer;
};

describe('SupplierOfferActionModals - Price Tier Logic', () => {
  test('sin price tiers muestra el precio base como Precio Unitario Original', () => {
    renderModal();
  const line = screen.getByTestId('original-unit-price-line');
  expect(line).toHaveTextContent(clp(1000));
    expect(screen.queryByTestId('WarningAmberIcon')).toBeNull();
  const stockLine = screen.getByTestId('stock-line');
  expect(stockLine).toHaveTextContent('Stock disponible:');
  expect(stockLine).toHaveTextContent('7000');
  });

  test('cantidad cae en un tier intermedio (>=50 <150) usa precio de ese tier', () => {
    renderModal({
      quantity: 60,
      product: { price_tiers: [ { min_quantity: 50, price: 900 }, { min_quantity: 150, price: 800 } ] }
    });
  const line = screen.getByTestId('original-unit-price-line');
  expect(line).toHaveTextContent(clp(900));
    expect(screen.queryByTestId('WarningAmberIcon')).toBeNull();
  });

  test('cantidad supera el tier mas alto usa precio del ultimo tier', () => {
    renderModal({
      quantity: 300,
      product: { price_tiers: [ { min_quantity: 50, price: 900 }, { min_quantity: 150, price: 800 } ] }
    });
  const line = screen.getByTestId('original-unit-price-line');
  expect(line).toHaveTextContent(clp(800));
    expect(screen.queryByTestId('WarningAmberIcon')).toBeNull();
  });

  test('cantidad menor al primer tier muestra precio del primer tier y warning', () => {
    renderModal({
      quantity: 30,
      product: { price_tiers: [ { min_quantity: 50, price: 900 }, { min_quantity: 150, price: 800 } ] }
    });
  const line = screen.getByTestId('original-unit-price-line');
  expect(line).toHaveTextContent(clp(900));
    // Warning icon should be present
    expect(screen.getByTestId('WarningAmberIcon')).toBeInTheDocument();
  });
});
