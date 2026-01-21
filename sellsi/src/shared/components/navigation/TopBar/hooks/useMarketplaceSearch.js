// Fase 2: Hook para búsqueda marketplace móvil (buyer)
// Reemplaza lógica inline y eventos window ad-hoc.
// Expone estado, handlers y dispara callback onReactive(term) con debounce.

import { useState, useEffect, useCallback, useMemo } from 'react';

export function useMarketplaceSearch({
  enabled,
  pathname,
  isBuyerRole,
  debounceMs = 300,
  onReactive,
  onNavigateOutside,
}) {
  const isOnBuyerMarketplace = pathname.startsWith('/buyer/marketplace');
  const [term, setTerm] = useState('');

  // Debounce reactivo cuando estamos dentro del marketplace
  useEffect(() => {
    if (!enabled || !isBuyerRole) return;
    if (!isOnBuyerMarketplace) return;
    const trimmed = sanitize(term);
    const h = setTimeout(() => {
      onReactive?.(trimmed);
    }, debounceMs);
    return () => clearTimeout(h);
  }, [term, enabled, isBuyerRole, isOnBuyerMarketplace, debounceMs, onReactive]);

  const sanitize = (raw) => {
    if (!raw) return '';
    let v = raw.trim();
    if (v.length > 120) v = v.slice(0, 120);
    return v;
  };

  const submit = useCallback(() => {
    const cleaned = sanitize(term);
    if (!isOnBuyerMarketplace) {
      onNavigateOutside?.(cleaned);
    } else {
      onReactive?.(cleaned);
    }
  }, [term, isOnBuyerMarketplace, onNavigateOutside, onReactive]);

  const handleChange = useCallback((e) => {
    setTerm(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') submit();
  }, [submit]);

  const inputProps = useMemo(() => ({
    value: term,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
  }), [term, handleChange, handleKeyDown]);

  return {
    term,
    setTerm,
    isOnBuyerMarketplace,
    inputProps,
    submit,
  };
}
