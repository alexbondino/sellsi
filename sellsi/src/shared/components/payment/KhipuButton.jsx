import React from 'react';

/**
 * Safe wrapper for an optional Khipu integration component.
 * - If a platform script exposes `window.KhipuButton` (React component), render it.
 * - Otherwise render null (no-op) so the app doesn't crash when the integration isn't present.
 */
const KhipuButton = (props) => {
  try {
    if (typeof window !== 'undefined' && window.KhipuButton) {
      const Remote = window.KhipuButton;
      return <Remote {...props} />;
    }
  } catch (e) {
    // swallow errors to keep the app resilient
  }
  return null;
};

export default KhipuButton;
