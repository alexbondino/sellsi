import React from 'react';
import { render, screen } from '@testing-library/react';
import MobileCartLayout from '../MobileCartLayout';

describe('MobileCartLayout', () => {
  test('shows financing buttons when financingEnabled=true', () => {
    render(
      <MobileCartLayout
        items={[]}
        calculations={{}}
        cartStats={{}}
        onCheckout={() => {}}
        onBack={() => {}}
        onQuantityChange={() => {}}
        onRemoveItem={() => {}}
        formatPrice={(v) => `$${v}`}
        isCheckingOut={false}
        financingEnabled={true}
        onOpenFinancingModal={() => {}}
      />
    );

    expect(screen.getByText(/Pagar con Financiamiento/i)).toBeInTheDocument();
    expect(screen.getByText(/Financiamientos Disponibles/i)).toBeInTheDocument();
  });

  test('does not show financing buttons when financingEnabled=false', () => {
    render(
      <MobileCartLayout
        items={[]}
        calculations={{}}
        cartStats={{}}
        onCheckout={() => {}}
        onBack={() => {}}
        onQuantityChange={() => {}}
        onRemoveItem={() => {}}
        formatPrice={(v) => `$${v}`}
        isCheckingOut={false}
        financingEnabled={false}
        onOpenFinancingModal={() => {}}
      />
    );

    expect(screen.queryByText(/Pagar con Financiamiento/i)).toBeNull();
    expect(screen.queryByText(/Financiamientos Disponibles/i)).toBeNull();
  });
});