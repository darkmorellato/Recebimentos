import { Expense, PaymentStatus } from './types';
import {
  PRAZO_DARK,
  PRAZO_DARK_SABADO,
  PRAZO_NORMAL,
  PRAZO_NORMAL_SABADO,
} from './constants';

const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const getTodayLocal = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateBR = (dateString: string): string => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export const formatMonthBR = (yearMonth: string): string => {
  if (!yearMonth) return '';
  const [year, month] = yearMonth.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  const monthName = date.toLocaleDateString('pt-BR', { month: 'long' });
  return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
};

export const formatCurrency = (value: number): string => {
  return BRL_FORMATTER.format(value);
};

export const isCrefaz = (ex: Partial<Expense>): boolean => {
  const cat = String(ex.category || ex.description || '').toLowerCase();
  return cat.includes('crefaz') || cat.includes('vrefaz');
};

export const isPayjoy = (ex: Partial<Expense>): boolean => {
  const cat = String(ex.category || ex.description || '').toLowerCase();
  return cat.includes('payjoy');
};

export const getExpectedDate = (ex: Partial<Expense>): string => {
  if (!ex || !ex.date) return '';
  const dateStr = ex.date;

  if (isCrefaz(ex)) return dateStr;

  if (isPayjoy(ex)) {
    const d = new Date(dateStr + 'T12:00:00');
    const dayOfWeek = d.getDay();

    const store = ex.store || '';
    if (store.includes('Dark')) {
      d.setDate(d.getDate() + (dayOfWeek === 6 ? PRAZO_DARK_SABADO : PRAZO_DARK));
    } else {
      d.setDate(d.getDate() + (dayOfWeek === 6 ? PRAZO_NORMAL_SABADO : PRAZO_NORMAL));
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  return dateStr;
};

export const getPaymentStatus = (ex: Partial<Expense>): PaymentStatus => {
  if (ex.received) {
    return {
      label: 'Recebido',
      color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
      isLate: false,
    };
  }
  const expectedDate = getExpectedDate(ex);
  const today = getTodayLocal();
  if (expectedDate < today) {
    return {
      label: 'Atrasado',
      color: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-800',
      isLate: true,
    };
  }
  return {
    label: 'Pendente',
    color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
    isLate: false,
  };
};
