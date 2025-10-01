import { useState, useCallback } from 'react';

export function useUserModals() {
  const [banModal, setBanModal] = useState({ open: false, user: null, action: 'ban' });
  const [detailsModal, setDetailsModal] = useState({ open: false, user: null });
  const [verificationModal, setVerificationModal] = useState({ open: false, user: null, action: 'verify' });
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
  const [deleteMultipleModal, setDeleteMultipleModal] = useState({ open: false, users: [] });

  const openBanModal = useCallback((user, action) => setBanModal({ open: true, user, action }), []);
  const closeBanModal = useCallback(() => setBanModal({ open: false, user: null, action: 'ban' }), []);

  const openDetailsModal = useCallback((user) => setDetailsModal({ open: true, user }), []);
  const closeDetailsModal = useCallback(() => setDetailsModal({ open: false, user: null }), []);

  const openVerificationModal = useCallback((user, action) => setVerificationModal({ open: true, user, action }), []);
  const closeVerificationModal = useCallback(() => setVerificationModal({ open: false, user: null, action: 'verify' }), []);

  const openDeleteModal = useCallback((user) => setDeleteModal({ open: true, user }), []);
  const closeDeleteModal = useCallback(() => setDeleteModal({ open: false, user: null }), []);

  const openDeleteMultipleModal = useCallback((users) => setDeleteMultipleModal({ open: true, users }), []);
  const closeDeleteMultipleModal = useCallback(() => setDeleteMultipleModal({ open: false, users: [] }), []);

  return {
    banModal, openBanModal, closeBanModal,
    detailsModal, openDetailsModal, closeDetailsModal,
    verificationModal, openVerificationModal, closeVerificationModal,
    deleteModal, openDeleteModal, closeDeleteModal,
    deleteMultipleModal, openDeleteMultipleModal, closeDeleteMultipleModal
  };
}
