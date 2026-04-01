import { useState, useEffect, useCallback } from 'react';
import { AppSettings } from '../utils/types';
import { DEFAULT_SETTINGS, CATEGORIES_LIST } from '../utils/constants';

const SETTINGS_KEY = 'miplace_pay_settings';

const loadSettings = (): AppSettings => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        categories: CATEGORIES_LIST.map((cat) => ({ label: cat, odooRef: cat })),
        receiptPassword: parsed.receiptPassword || DEFAULT_SETTINGS.receiptPassword,
        editPassword: parsed.editPassword || DEFAULT_SETTINGS.editPassword,
      };
    }
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
};

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [isOpen, setIsOpen] = useState(false);

  const save = useCallback(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setIsOpen(false);
  }, [settings]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return {
    settings,
    setSettings,
    isOpen,
    save,
    open,
    close,
  };
};
