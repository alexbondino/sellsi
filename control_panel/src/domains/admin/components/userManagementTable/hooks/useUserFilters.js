import { useState, useEffect, useMemo } from 'react';
import { getUserStatus } from '../utils/userUtils';

// Handles filters + debounced search (no external side effects)
export function useUserFilters(users) {
  const [filters, setFilters] = useState({ status: 'all', search: '', userType: 'all' });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 150);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // sync debounced search into filters
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearchTerm }));
  }, [debouncedSearchTerm]);

  const handleFilterChange = (field, value) => {
    if (field === 'search') setSearchTerm(value);
    else setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredUsers = useMemo(() => {
    if (!users?.length) return [];
    return users.filter(user => {
      if (filters.status !== 'all') {
        const status = getUserStatus(user);
        if (filters.status === 'suppliers' && !user.main_supplier) return false;
        if (filters.status === 'buyers' && user.main_supplier) return false;
        if (filters.status === 'verified' && !user.verified) return false;
        if (!['suppliers','buyers','verified'].includes(filters.status) && status !== filters.status) return false;
      }
      if (filters.userType === 'suppliers' && !user.main_supplier) return false;
      if (filters.userType === 'buyers' && user.main_supplier) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        return (
          user.user_nm?.toLowerCase().includes(s) ||
          user.email?.toLowerCase().includes(s) ||
          user.user_id?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [users, filters]);

  return {
    filters,
    handleFilterChange,
    searchTerm,
    debouncedSearchTerm,
    filteredUsers
  };
}
