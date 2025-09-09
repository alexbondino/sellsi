// Reglas para deshabilitar el botón principal
export function shouldDisableButton(params) {
  const {
    isOwnProduct,
    isProcessing,
    shippingValidation,
    isOfferMode,
    quantityError,
    effectiveUserRegion,
    isLoadingUserProfile,
    isLoadingUserRegion,
    justOpened,
  } = params || {};
  const noRegionConfigured = !effectiveUserRegion && !isLoadingUserProfile && !isLoadingUserRegion && !justOpened;
  const explicitIncompatible = shippingValidation && !shippingValidation.canShip;
  const hasQuantityError = !isOfferMode && !!quantityError;
  return (
    isOwnProduct ||
    isProcessing ||
    explicitIncompatible ||
    hasQuantityError ||
    noRegionConfigured
  );
}
