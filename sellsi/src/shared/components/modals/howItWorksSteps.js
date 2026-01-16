/**
 * Configuraciones de pasos para el modal "¿Cómo funciona?" de financiamientos
 * Usado en workspaces de buyer y supplier
 */

// Pasos para Buyer (Comprador)
export const BUYER_FINANCING_STEPS = [
  {
    title: 'Primer Paso',
    description: 'El comprador solicita financiamiento para sus órdenes de compra. Selecciona los productos y proveedores que necesita, y Sellsi evalúa la solicitud de forma rápida y eficiente.',
    image: '/assets/Modal HowItWorks/First_Step.webp',
  },
  {
    title: 'Segundo Paso',
    description: 'Sellsi revisa y aprueba el financiamiento. Una vez aprobado, el proveedor recibe la notificación y puede proceder con el envío de la mercancía con la garantía de pago.',
    image: '/assets/Modal HowItWorks/Second_Step.webp',
  },
  {
    title: 'Paso Final',
    description: 'El proveedor cobra al presentar la factura. Una vez confirmada la entrega, el pago se libera automáticamente. El comprador paga según los términos acordados con Sellsi.',
    image: '/assets/Modal HowItWorks/Final_Step.webp',
  },
];

// Pasos para Supplier (Proveedor)
export const SUPPLIER_FINANCING_STEPS = [
  {
    title: 'Primer Paso',
    description: 'El comprador solicita financiamiento para comprar tus productos. Recibes una notificación cuando la orden es financiada por Sellsi, garantizando el pago.',
    image: '/assets/Modal HowItWorks/First_Step.webp',
  },
  {
    title: 'Segundo Paso',
    description: 'Procesa y envía la orden con total seguridad. Sellsi garantiza el pago, eliminando el riesgo de impago. Puedes seguir el estado de tus órdenes financiadas en tiempo real.',
    image: '/assets/Modal HowItWorks/Second_Step.webp',
  },
  {
    title: 'Paso Final',
    description: 'Cobra al presentar tu factura. Una vez confirmada la entrega de la mercancía, recibes el pago de forma rápida y segura. Mejora tu flujo de caja con pagos anticipados.',
    image: '/assets/Modal HowItWorks/Final_Step.webp',
  },
];
