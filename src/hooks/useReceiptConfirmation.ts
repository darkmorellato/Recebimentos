import { useState, useCallback } from 'react';
import { Expense } from '../utils/types';

export const useReceiptConfirmation = (
  onUpdateExpense: (id: string, data: Partial<Expense>) => Promise<void>,
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void,
  adminPassword: string
) => {
  const [modal, setModal] = useState<{ open: boolean; ex: Expense | null }>({ open: false, ex: null });

  const openModal = useCallback((ex: Expense) => {
    setModal({ open: true, ex });
  }, []);

  const closeModal = useCallback(() => {
    setModal({ open: false, ex: null });
  }, []);

  const confirm = useCallback(async (password: string) => {
    if (!modal.ex) return;
    if (password === adminPassword) {
      const prevStatus = modal.ex.received;
      await onUpdateExpense(modal.ex.id, { received: !prevStatus });
      setModal({ open: false, ex: null });
      showToast(prevStatus ? 'Recebimento cancelado.' : 'Recebimento confirmado!', 'success');
    } else {
      showToast('Palavra-passe incorreta.', 'error');
    }
  }, [modal.ex, adminPassword, onUpdateExpense, showToast]);

  return { modal, openModal, closeModal, confirm };
};
