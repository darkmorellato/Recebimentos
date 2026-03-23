import { useState, useCallback, useRef } from 'react';
import { Expense } from '../utils/types';
import { formatDateBR, getTodayLocal } from '../utils/helpers';
import { BackupFileSchema } from '../schemas';

export const useBackup = (
  expenses: Expense[],
  onBatchImport: (items: Omit<Expense, 'id'>[]) => Promise<number>,
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
) => {
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveToComputer = useCallback(async () => {
    const backupData = { data: expenses, version: 3 };
    const dataStr = JSON.stringify(backupData, null, 2);
    const fileName = `backup_completo_${formatDateBR(getTodayLocal()).replace(/\//g, '-')}.json`;
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Backup baixado para Downloads!', 'success');
    setShowOptions(false);
  }, [expenses, showToast]);

  const handleRestoreFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showToast('Arquivo muito grande (máx 5MB).', 'error');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') return;
        const parsed = JSON.parse(result);

        const validation = BackupFileSchema.safeParse(parsed);
        if (!validation.success) {
          const firstError = validation.error.issues[0];
          showToast(firstError?.message || 'Arquivo de backup inválido.', 'error');
          return;
        }

        const validItems = validation.data.data.filter(
          (item): item is Omit<Expense, 'id'> =>
            !!item.date && !!item.store && !!item.category && typeof item.amount === 'number'
        );

        if (validItems.length === 0) {
          return showToast('Nenhum registro válido encontrado.', 'error');
        }

        if (confirm(`ATENÇÃO: Enviar ${validItems.length} registros para a nuvem?`)) {
          const count = await onBatchImport(validItems);
          showToast(`${count} registros enviados!`, 'success');
        }
      } catch {
        showToast('Erro ao ler arquivo.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [onBatchImport, showToast]);

  const triggerRestore = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const openOptions = useCallback(() => setShowOptions(true), []);
  const closeOptions = useCallback(() => setShowOptions(false), []);

  return {
    showOptions,
    fileInputRef,
    saveToComputer,
    handleRestoreFile,
    triggerRestore,
    openOptions,
    closeOptions,
  };
};
