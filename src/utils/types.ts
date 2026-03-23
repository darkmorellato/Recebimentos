import { FieldValue, Timestamp } from 'firebase/firestore';

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  store: string;
  amount: number;
  quantity: number;
  notes?: string;
  employeeName: string;
  received: boolean;
  createdAt?: FieldValue | Timestamp;
  updatedAt?: FieldValue | Timestamp;
}

export interface AppSettings {
  employeeName: string;
  currency: string;
  receiptPassword: string;
  editPassword: string;
  categories: CategoryLabel[];
}

export interface CategoryLabel {
  label: string;
  odooRef: string;
}

export interface PaymentStatus {
  label: string;
  color: string;
  isLate: boolean;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ExpenseGroup {
  key: string;
  items: Expense[];
  total: number;
}

export type ViewType = 'dashboard' | 'calendar' | 'analytics' | 'payments_report';
export type FilterMode = 'day' | 'month' | 'late';
export type GroupBy = 'date' | 'store';
export type SyncStatus = 'offline' | 'syncing' | 'synced' | 'error';
