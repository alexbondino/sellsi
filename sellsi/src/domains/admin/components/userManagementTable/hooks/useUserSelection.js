import { useState, useCallback } from 'react';

export function useUserSelection(filteredUsers) {
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  const handleUserSelect = useCallback((userId, isSelected) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (isSelected) next.add(userId); else next.delete(userId);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((isSelected) => {
    if (isSelected) setSelectedUsers(new Set(filteredUsers.map(u => u.user_id))); else setSelectedUsers(new Set());
  }, [filteredUsers]);

  const clearSelection = useCallback(() => setSelectedUsers(new Set()), []);

  return { selectedUsers, handleUserSelect, handleSelectAll, clearSelection };
}
