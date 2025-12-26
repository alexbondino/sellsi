import React from 'react';
import { render, screen, within } from '@testing-library/react';
import SupplierOfferActionModals from '../../workspaces/supplier/my-offers/components/SupplierOfferActionModals';

// NOTE: use literal formatted strings in tests to avoid Intl locale differences in CI

const baseBuyer = { id: 'buyer_1', name: 'Comprador Test' };

const renderModal = (offerOverrides = {}) => {
  const defaultOffer = {
    id: 'offer_test',
    price: 1000,
    quantity: 10,
    buyer: baseBuyer,
    product: { id: 'prod_1', name: 'Producto Demo', price: 1000, stock: 7000 },
  };
  const offer = {
    ...defaultOffer,
    ...offerOverrides,
    product: { ...defaultOffer.product, ...(offerOverrides.product || {}) },
  };
  const handlers = {
    onClose: jest.fn(),
    onAccept: jest.fn(),
    onReject: jest.fn(),
    onCleanup: jest.fn(),
  };
  const utils = render(
    <SupplierOfferActionModals
      open
      mode="accept"
      offer={offer}
      onClose={handlers.onClose}
      onAccept={handlers.onAccept}
      onReject={handlers.onReject}
      onCleanup={handlers.onCleanup}
    />
  );
  return { ...utils, offer, handlers };
};

describe('SupplierOfferActionModals - Price Tier Logic', () => {
  test('sin price tiers muestra el precio base como Precio Unitario Original (scoped, literal)', () => {
    renderModal();
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    const line = within(modal).getByTestId('original-unit-price-line');
    expect(line).toHaveTextContent('$1.000');
    expect(within(modal).queryByTestId('warning-amber-icon')).toBeNull();
    const stockLine = within(modal).getByTestId('stock-line');
    expect(stockLine).toHaveTextContent('Stock disponible:');
    expect(stockLine).toHaveTextContent('7000');
  });

  test('cantidad cae en un tier intermedio (>=50 <150) usa precio de ese tier', () => {
    renderModal({
      quantity: 60,
      product: {
        price_tiers: [
          { min_quantity: 50, price: 900 },
          { min_quantity: 150, price: 800 },
        ],
      },
    });
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    // Verify stock is present (regression check)
    const stockLine = within(modal).getByTestId('stock-line');
    expect(stockLine).toHaveTextContent('7000');
    const line = within(modal).getByTestId('original-unit-price-line');
    expect(line).toHaveTextContent('$900');
    expect(within(modal).queryByTestId('warning-amber-icon')).toBeNull();
  });

  test('cantidad supera el tier mas alto usa precio del ultimo tier', () => {
    renderModal({
      quantity: 300,
      product: {
        price_tiers: [
          { min_quantity: 50, price: 900 },
          { min_quantity: 150, price: 800 },
        ],
      },
    });
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    // Verify stock is present (regression check)
    const stockLine = within(modal).getByTestId('stock-line');
    expect(stockLine).toHaveTextContent('7000');
    const line = within(modal).getByTestId('original-unit-price-line');
    expect(line).toHaveTextContent('$800');
    expect(within(modal).queryByTestId('warning-amber-icon')).toBeNull();
  });

  test('cantidad menor al primer tier muestra precio del primer tier y warning', () => {
    renderModal({
      quantity: 30,
      product: {
        price_tiers: [
          { min_quantity: 50, price: 900 },
          { min_quantity: 150, price: 800 },
        ],
      },
    });
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    const line = within(modal).getByTestId('original-unit-price-line');
    expect(line).toHaveTextContent('$900');
    // Warning icon should be present
    expect(within(modal).getByTestId('warning-amber-icon')).toBeInTheDocument();
  });

  test('funciona con tramos no ordenados (sort) y selecciona el tramo correcto', () => {
    renderModal({
      quantity: 60,
      product: {
        price_tiers: [
          { min_quantity: 150, price: 800 },
          { min_quantity: 50, price: 900 },
        ],
      },
    });
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    const line = within(modal).getByTestId('original-unit-price-line');
    expect(line).toHaveTextContent('$900');
  });

  test('ignora tramos con price 0 y usa el siguiente válido', () => {
    renderModal({
      quantity: 15,
      product: {
        price_tiers: [
          { min_quantity: 10, price: 0 },
          { min_quantity: 5, price: 900 },
        ],
      },
    });
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    // Business rule: skip tiers with price 0 and use the next valid tier
    const line = within(modal).getByTestId('original-unit-price-line');
    expect(line).toHaveTextContent('$900');
  });

  test('acepta precio de tramo como string numérico y lo muestra correctamente', () => {
    renderModal({
      quantity: 15,
      product: {
        price_tiers: [
          { min_quantity: 10, price: '850' },
        ],
      },
    });
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    const line = within(modal).getByTestId('original-unit-price-line');
    expect(line).toHaveTextContent('$850');
  });
});
