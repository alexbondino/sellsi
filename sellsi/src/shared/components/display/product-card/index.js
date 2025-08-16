// src/shared/components/display/product-card/index.js
// Se usa import explícito para evitar issues de re-export default en algunos entornos de HMR
import ProductCard from './ProductCard';
import ProductCardBuyerContext from './ProductCardBuyerContext';
import ProductCardSupplierContext from './ProductCardSupplierContext';
import ProductCardProviderContext from './ProductCardProviderContext';
import ActionMenu from './ActionMenu';
import ProductBadges from './ProductBadges';
import StatusChip from './StatusChip';

export {
	ProductCard,
	ProductCardBuyerContext,
	ProductCardSupplierContext,
	ProductCardProviderContext,
	ActionMenu,
	ProductBadges,
	StatusChip
};

export default ProductCard;
