import { useState, useEffect, useCallback, useMemo } from 'react';
import { Expense, FilterMode, SyncStatus } from '../utils/types';
import { getPaymentStatus, getTodayLocal, formatMonthBR } from '../utils/helpers';
import { initAuth, onAuthChange, subscribeExpenses, addExpense, updateExpense, batchImport } from '../services/firebase';
import { User } from 'firebase/auth';
import { serverTimestamp } from 'firebase/firestore';

export const useExpenses = (showToast: (msg: string, type?: 'success' | 'error' | 'info') => void) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    initAuth().catch(() => {
      setSyncStatus('error');
      showToast('Erro ao conectar.', 'error');
    });
    const unsub = onAuthChange((u) => { if (u) setUser(u); });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    setSyncStatus('syncing');
    const unsub = subscribeExpenses(
      (loaded) => { setExpenses(loaded); setSyncStatus('synced'); },
      () => setSyncStatus('error')
    );
    return unsub;
  }, [user]);

  const handleAdd = useCallback(async (newExpense: Omit<Expense, 'id'>) => {
    try {
      await addExpense(newExpense);
      setSyncStatus('synced');
    } catch {
      showToast('Erro ao salvar online', 'error');
    }
  }, [showToast]);

  const handleUpdate = useCallback(async (id: string, data: Partial<Expense>) => {
    try {
      await updateExpense(id, data);
      setSyncStatus('synced');
    } catch (e) {
      console.error('Erro update:', e);
    }
  }, []);

  const handleBatchImport = useCallback(async (items: Omit<Expense, 'id'>[]): Promise<number> => {
    const count = await batchImport(items);
    setSyncStatus('synced');
    return count;
  }, []);

  const availableDates = useMemo(
    () => [...new Set(expenses.map((e) => e.date))].sort(),
    [expenses]
  );

  const availableMonths = useMemo(
    () => [...new Set(expenses.map((e) => e.date.substring(0, 7)))].sort(),
    [expenses]
  );

  const getFilteredExpenses = useCallback((
    searchTerm: string,
    filterMode: FilterMode,
    selectedDate: string,
    selectedMonth: string
  ): Expense[] => {
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      return expenses.filter((ex) =>
        ex.description?.toLowerCase().includes(lower) ||
        ex.category.toLowerCase().includes(lower) ||
        ex.store.toLowerCase().includes(lower) ||
        ex.notes?.toLowerCase().includes(lower)
      );
    }
    if (filterMode === 'month' && selectedMonth) {
      return expenses.filter((ex) => ex.date.startsWith(selectedMonth));
    }
    if (filterMode === 'day' && selectedDate) {
      return expenses.filter((ex) => ex.date === selectedDate);
    }
    if (filterMode === 'late') {
      return expenses.filter((ex) => getPaymentStatus(ex).isLate);
    }
    return expenses;
  }, [expenses]);

  return {
    expenses,
    syncStatus,
    handleAdd,
    handleUpdate,
    handleBatchImport,
    availableDates,
    availableMonths,
    getFilteredExpenses,
  };
};
