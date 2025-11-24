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
      />
    </>
  );
};

export default QuotationSection;
