// Forwarding shim for orders domain to reuse the canonical notifications service.
// Keeps old import path working while centralizing implementation.

/* eslint-disable import/no-unresolved, import/extensions */
import * as canonical from '../../../notifications/services/notificationService';

// Provide named and default exports expected by existing consumers
export const notificationService = canonical.notificationService || canonical.default || canonical;
export default notificationService;

// Re-export all named helpers from canonical module for compatibility
export * from '../../../notifications/services/notificationService';
