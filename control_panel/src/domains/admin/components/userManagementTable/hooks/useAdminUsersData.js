import { useState, useEffect, useCallback, useRef } from 'react';
import { getUsers, getUserStats } from '../../../services/adminUserService';

// Data loader (no filtering logic here)
export function useAdminUsersData() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const fetchInProgressRef = useRef(false);

  const loadData = useCallback(async () => {
    // Protección contra llamadas concurrentes
    if (fetchInProgressRef.current) {
      console.info('useAdminUsersData: fetch already in progress, skipping');
      return;
    }

    fetchInProgressRef.current = true;
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
      fetchInProgressRef.current = false;
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  return { users, stats, loading, error, setError, initialLoadComplete, loadData };
}
