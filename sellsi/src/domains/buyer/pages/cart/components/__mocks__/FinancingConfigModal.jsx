import React from 'react';

export default function MockFinancingConfigModal({ open, onClose, cartItems = [], formatPrice, onSave }) {
  const [isFull, setIsFull] = React.useState(false);
  const product = cartItems[0] || { id: 'p1', price: 100000 };
  const amount = isFull ? product.price : 0;
  // For tests, always render the mock dialog regardless of the `open` prop
  return (
    React.createElement('div', { role: 'dialog' },
      React.createElement('label', { htmlFor: 'fin-select' }, 'Financiamiento a usar'),
      React.createElement('button', { id: 'fin-select', onClick: () => {} }, 'Financiamiento a usar'),
      // Render one numeric input per product so tests can interact with spinbuttons
      ...(cartItems.length > 0 ? cartItems.map((c) => React.createElement('input', { key: c.id, type: 'number', 'aria-label': `Monto a financiar ${c.id}`, defaultValue: 0 })) : [React.createElement('input', { key: 'p1', type: 'number', 'aria-label': 'Monto a financiar p1', defaultValue: 0 })]),
      React.createElement('input', { type: 'checkbox', 'aria-label': 'Pagar la totalidad de este producto con financiamiento', checked: isFull, onChange: () => setIsFull(v => !v) }),
      React.createElement('button', { onClick: () => {
        // Collect numeric inputs values for each product and build config
        const cfg = {};
        (cartItems.length > 0 ? cartItems : [product]).forEach((c) => {
          const node = document.querySelector(`input[aria-label=\"Monto a financiar ${c.id}\"]`);
          const val = node ? parseInt(node.value || '0', 10) : 0;
          const finalAmount = isFull ? (c.price || c.precio || 0) : val;
          cfg[c.id] = { amount: finalAmount, isFullAmount: !!isFull };
        });
        onSave({ config: cfg });
        onClose();
      } }, 'Confirmar'),
      React.createElement('button', { onClick: onClose }, 'Cancelar'),
      React.createElement('div', null, React.createElement('button', null, 'Fin #1'))
    )
  );
}
