import {
  addBusinessDaysChile,
  toISODateOnly,
} from '../../../utils/businessDaysChile';

// Generic deadline calculator; productResolver(productId) -> product object with product_delivery_regions
export function calculateEstimatedDeliveryDate(
  createdAtISO,
  items,
  buyerRegion,
  productResolver
) {
  try {
    if (!createdAtISO || !Array.isArray(items) || !items.length) return null;
    let maxDays = 0;
    const norm = v => (v || '').toString().trim().toLowerCase();
    const regionLower = norm(buyerRegion);
    for (const it of items) {
      const pid = it.product_id || it.productid;
      const product = productResolver ? productResolver(pid) : it.product || {};
      const deliveryRegions =
        product?.product_delivery_regions || product?.delivery_regions || [];
      if (Array.isArray(deliveryRegions)) {
        const match = deliveryRegions.find(
          dr => norm(dr.region) === regionLower
        );
        if (match && Number(match.delivery_days) > maxDays)
          maxDays = Number(match.delivery_days);
      }
    }
    if (maxDays === 0) maxDays = 7; // fallback
    const start = new Date(createdAtISO);
    const deadline = addBusinessDaysChile(start, maxDays);
    return toISODateOnly(deadline);
  } catch {
    return null;
  }
}
