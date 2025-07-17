# Sistema de Cotizador para ProductPageView

## 📋 Descripción

Sistema de cotización que permite a los compradores descargar un PDF con los detalles de una cotización del producto, incluyendo precios por tramos, cantidad seleccionada, IVA y total.

## 🚀 Características

- ✅ **Botón de cotización** con tooltip explicativo
- ✅ **Modal de confirmación** utilizando el modal existente de sellsi
- ✅ **Cálculo dinámico de precios** basado en tramos de cantidad
- ✅ **Generación de PDF** usando React-PDF
- ✅ **Formato profesional** similar a la imagen proporcionada
- ✅ **Datos calculados automáticamente**: Total neto, IVA (19%) y Total final

## 📁 Estructura de Archivos

```
src/features/marketplace/ProductPageView/
├── components/
│   ├── QuotationButton.jsx       # Botón principal de cotización
│   ├── QuotationModal.jsx        # Modal de confirmación
│   └── PurchaseActions.jsx       # Modificado para incluir el botón
├── utils/
│   ├── quotationPDFGenerator.jsx # Generador de PDF
│   └── quotationUtils.js         # Utilidades para cálculos
└── README_QUOTATION.md           # Este archivo
```

## 🔧 Componentes

### QuotationButton
Botón principal con icono y tooltip que abre el modal de cotización.

**Props:**
- `product`: Objeto del producto
- `quantity`: Cantidad seleccionada
- `unitPrice`: Precio unitario calculado
- `tiers`: Array de tramos de precio

### QuotationModal
Modal de confirmación que usa el componente Modal existente de sellsi.

**Características:**
- Usa el `MODAL_TYPES.INFO` del sistema existente
- Muestra resumen de la cotización antes de generar
- Validación de datos antes de procesar

### quotationPDFGenerator.jsx
Generador de PDF usando React-PDF con formato profesional.

**Características:**
- Logo de sellsi
- Formato de tabla como en la imagen
- Cálculos automáticos de IVA y total
- Fecha y número de cotización automáticos

### quotationUtils.js
Utilidades para cálculos de precios y validaciones.

**Funciones:**
- `calculateUnitPrice()`: Calcula precio unitario según tramos
- `isValidQuantity()`: Valida cantidad seleccionada
- `formatPrice()`: Formatea precios para mostrar
- `calculateQuotationSummary()`: Calcula resumen de cotización

## 🎯 Integración

### En PurchaseActions.jsx
```jsx
import QuotationButton from './QuotationButton'
import { calculateUnitPrice } from '../utils/quotationUtils'

// Calcular precio unitario dinámico
const unitPrice = calculateUnitPrice(quantity, tiers, product.price)

// Mostrar botón solo para usuarios logueados
{isLoggedIn && (
  <QuotationButton
    product={product}
    quantity={quantity}
    unitPrice={unitPrice}
    tiers={tiers}
  />
)}
```

## 📊 Cálculos Automáticos

### Precio Unitario
- **Con tramos**: Se calcula según la cantidad seleccionada
- **Sin tramos**: Usa el precio base del producto

### Totales
- **Total Neto**: `cantidad × precio_unitario`
- **IVA (19%)**: `total_neto × 0.19`
- **Total Final**: `total_neto + iva`

## 🔒 Validaciones

- Solo se muestra para usuarios logueados (compradores)
- Validación de cantidad mínima y máxima
- Verificación de datos del producto antes de generar PDF
- Manejo de errores en generación de PDF

## 📝 Formato del PDF

El PDF generado incluye:

1. **Header**: Logo de sellsi, título "COTIZACIÓN #1", fecha, proveedor
2. **Saludo**: "Estimado 'Nombre Comprador'"
3. **Descripción**: Texto explicativo
4. **Tabla de productos**: Con columnas:
   - Ítem
   - Precio Unitario
   - Cantidad
   - Total Neto
   - IVA
   - Total
5. **Nota de validez**: "48 horas sujeta a disponibilidad"
6. **Footer**: Contacto de sellsi

## 🛠️ Instalación

Las dependencias necesarias ya están instaladas:
```bash
npm install @react-pdf/renderer
```

## 🎨 Personalización

### Estilos del PDF
Los estilos están definidos en `quotationPDFGenerator.jsx` usando StyleSheet de react-pdf.

### Colores del botón
El botón usa los colores del tema de Material-UI y se puede personalizar en `QuotationButton.jsx`.

## 🧪 Testing

Para probar el sistema:

1. Ir a cualquier página de producto como comprador
2. Seleccionar una cantidad
3. Hacer clic en "Cotizar"
4. Confirmar en el modal
5. Verificar que se descargue el PDF

## 🔄 Próximas Mejoras

- [ ] Añadir información real del proveedor
- [ ] Integrar con sistema de autenticación para nombre del comprador
- [ ] Permitir personalización del número de cotización
- [ ] Agregar múltiples productos en una cotización
- [ ] Sistema de seguimiento de cotizaciones
- [ ] Notificaciones por email

## 📱 Responsividad

El sistema está diseñado para funcionar en:
- ✅ Desktop
- ✅ Tablet
- ✅ Mobile

## 🐛 Debugging

Si hay problemas:

1. Verificar que React-PDF esté instalado
2. Comprobar que los props lleguen correctamente
3. Revisar la consola para errores de PDF
4. Validar que los cálculos sean correctos

## 📄 Licencia

Este código forma parte del proyecto sellsi y sigue las mismas políticas de licencia.
