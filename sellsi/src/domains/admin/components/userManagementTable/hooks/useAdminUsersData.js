import { useState, useEffect, useCallback } from 'react';
import { getUsers, getUserStats } from '../../../services/adminUserService';

// Data loader (no filtering logic here)
export function useAdminUsersData() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usersResult, statsResult] = await Promise.all([
        getUsers({}),
        getUserStats()
      ]);
      if (usersResult.success) {
        setUsers(usersResult.data || []);
        setInitialLoadComplete(true);
      } else setError(usersResult.error || 'Error cargando usuarios');
      if (statsResult.success) setStats(statsResult.stats || {});
    } catch (e) {
      console.error('Error cargando datos:', e);
      setError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return { users, stats, loading, error, setError, initialLoadComplete, loadData };
}
