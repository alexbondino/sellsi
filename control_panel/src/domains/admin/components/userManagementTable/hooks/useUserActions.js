import { getCurrentAdminId } from '../utils/userUtils';
import { banUser, unbanUser, verifyUser, unverifyUser, deleteUser, deleteMultipleUsers } from '../../../services/adminUserService';

export function useUserActions({ loadData, setError, closeBanModal, closeVerificationModal, closeDeleteModal, closeDeleteMultipleModal, clearSelection }) {
  const exec = async (fn) => {
    try {
      const adminId = getCurrentAdminId();
      if (!adminId) {
        setError('No hay sesión administrativa activa');
        return { ok: false };
      }
      const res = await fn(adminId);
      if (res.success) return { ok: true, res };
      setError(res.error || 'Error');
      return { ok: false, res };
    } catch (e) {
      console.error(e);
      setError('Error interno del servidor');
      return { ok: false };
    }
  };

  const handleBanConfirm = async ({ user, action, reason }) => {
    const op = action === 'ban' ? banUser : unbanUser;
    const r = await exec((adminId) => op(user.user_id, reason, adminId));
    if (r.ok) { await loadData(); closeBanModal(); }
    return r;
  };

  const handleVerificationConfirm = async ({ user, action, reason }) => {
    const op = action === 'verify' ? verifyUser : unverifyUser;
    const r = await exec((adminId) => op(user.user_id, reason, adminId));
    if (r.ok) { await loadData(); closeVerificationModal(); }
    return r;
  };

  const handleDeleteConfirm = async (userId) => {
    const r = await exec((adminId) => deleteUser(userId, adminId));
    if (r.ok) { await loadData(); closeDeleteModal(); }
    return r;
  };

  const handleDeleteMultipleConfirm = async (userIds) => {
    const r = await exec((adminId) => deleteMultipleUsers(userIds, adminId));
    if (r.ok) { await loadData(); clearSelection(); closeDeleteMultipleModal(); }
    return r;
  };

  return { handleBanConfirm, handleVerificationConfirm, handleDeleteConfirm, handleDeleteMultipleConfirm };
}
