/**
 * QuotationSection - Modales de cotización y contacto
 *
 * Encapsula:
 * - QuotationModal
 * - ContactModal
 */
import React from 'react';
import QuotationModal from '../QuotationModal';
import ContactModal from '../../../../../shared/components/modals/ContactModal';

const QuotationSection = ({
  product,
  tiers,
  isQuotationModalOpen,
  isContactModalOpen,
  onCloseQuotationModal,
  onCloseContactModal,
  quotationDefaults,
}) => {
  // Preparar contexto para ContactModal
  const contactContext = product ? {
    source: 'product_inquiry',
    product: {
      id: product.id,
      name: product.name || product.nombre,
      // Si hay tiers, usar el precio más bajo (primer tier)
      // Si no hay tiers, usar el precio base del producto
      price: (tiers && tiers.length > 0) 
        ? tiers[0].price 
        : (product.precio || product.price),
      has_tiers: !!(tiers && tiers.length > 0),
      tiers_count: tiers?.length || 0,
      supplier_id: product.supplier_id || product.supplierId,
      supplier_name: product.supplier?.name || product.proveedor,
      supplier: product.supplier,
      slug: product.slug || product.productSlug
    }
  } : null;
  
  return (
    <>
      {/* Modal de Cotización */}
      <QuotationModal
        open={isQuotationModalOpen}
        onClose={onCloseQuotationModal}
        product={product}
        quantity={quotationDefaults?.defaultQuantity || product?.compraMinima || 1}
        unitPrice={quotationDefaults?.defaultUnitPrice || product?.precio || 0}
        tiers={tiers}
      />

      {/* Modal de Contacto */}
      <ContactModal
        open={isContactModalOpen}
        onClose={onCloseContactModal}
        context={contactContext}
      />
    </>
  );
};

export default QuotationSection;
