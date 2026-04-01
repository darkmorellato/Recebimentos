import { z } from 'zod';

export const ExpenseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  description: z.string().optional(),
  category: z.string().min(1, 'Categoria é obrigatória').max(100),
  store: z.string().min(1, 'Loja é obrigatória').max(100),
  amount: z.number().positive('Valor deve ser positivo').max(999999, 'Valor máximo excedido'),
  quantity: z.number().positive().default(1.0),
  notes: z.string().max(500, 'Observações muito longas').optional(),
  employeeName: z.string().min(1, 'Nome do funcionário é obrigatório').max(100),
  received: z.boolean().default(false),
});

export const BackupExpenseSchema = z.object({
  date: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  store: z.string().optional(),
  amount: z.number().optional(),
  quantity: z.number().optional(),
  notes: z.string().optional(),
  employeeName: z.string().optional(),
  received: z.boolean().optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
}).refine(
  (data) => data.date && data.store && data.category && typeof data.amount === 'number',
  { message: 'Registro de backup inválido' }
);

export const BackupFileSchema = z.object({
  data: z.array(BackupExpenseSchema).min(1, 'Backup deve conter pelo menos um registro'),
  version: z.number().optional(),
});

export const SettingsSchema = z.object({
  employeeName: z.string().min(1, 'Nome é obrigatório').max(100),
  currency: z.string().min(1).max(5),
  receiptPassword: z.string().min(4, 'Senha muito curta').max(50),
  editPassword: z.string().min(4, 'Senha muito curta').max(50),
  categories: z.array(z.object({
    label: z.string().min(1),
    odooRef: z.string().min(1),
  })),
});

export type ValidatedExpense = z.infer<typeof ExpenseSchema>;
export type ValidatedSettings = z.infer<typeof SettingsSchema>;
