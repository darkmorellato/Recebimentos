import { describe, it, expect } from 'vitest';
import {
  getTodayLocal,
  formatDateBR,
  formatMonthBR,
  formatCurrency,
  isCrefaz,
  isPayjoy,
  getExpectedDate,
  getPaymentStatus,
} from '../utils/helpers';
import { Expense } from '../utils/types';

describe('getTodayLocal', () => {
  it('deve retornar data no formato YYYY-MM-DD', () => {
    const result = getTodayLocal();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('formatDateBR', () => {
  it('deve formatar data YYYY-MM-DD para DD/MM/YYYY', () => {
    expect(formatDateBR('2025-03-15')).toBe('15/03/2025');
  });

  it('deve retornar string vazia para entrada vazia', () => {
    expect(formatDateBR('')).toBe('');
  });
});

describe('formatMonthBR', () => {
  it('deve formatar YYYY-MM para nome do mês e ano', () => {
    expect(formatMonthBR('2025-03')).toBe('Março 2025');
  });

  it('deve retornar string vazia para entrada vazia', () => {
    expect(formatMonthBR('')).toBe('');
  });
});

describe('formatCurrency', () => {
  it('deve formatar número com separador brasileiro', () => {
    expect(formatCurrency(1234.56)).toBe('1.234,56');
  });

  it('deve formatar zero', () => {
    expect(formatCurrency(0)).toBe('0,00');
  });

  it('deve formatar valores inteiros com duas casas decimais', () => {
    expect(formatCurrency(100)).toBe('100,00');
  });

  it('deve formatar valores grandes', () => {
    expect(formatCurrency(1000000.99)).toBe('1.000.000,99');
  });
});

describe('isCrefaz', () => {
  it('deve identificar categoria Crefaz', () => {
    expect(isCrefaz({ category: 'Pagamento Crefaz' })).toBe(true);
  });

  it('deve retornar false para Payjoy', () => {
    expect(isCrefaz({ category: 'Pagamento Payjoy' })).toBe(false);
  });

  it('deve ser case insensitive', () => {
    expect(isCrefaz({ category: 'pagamento crefaz' })).toBe(true);
  });
});

describe('isPayjoy', () => {
  it('deve identificar categoria Payjoy', () => {
    expect(isPayjoy({ category: 'Pagamento Payjoy' })).toBe(true);
  });

  it('deve retornar false para Crefaz', () => {
    expect(isPayjoy({ category: 'Pagamento Crefaz' })).toBe(false);
  });
});

describe('getExpectedDate', () => {
  it('deve retornar a mesma data para Crefaz', () => {
    const ex: Partial<Expense> = { date: '2025-03-15', category: 'Pagamento Crefaz' };
    expect(getExpectedDate(ex)).toBe('2025-03-15');
  });

  it('deve adicionar 7 dias para Payjoy normal (dia útil)', () => {
    const ex: Partial<Expense> = { date: '2025-03-03', category: 'Pagamento Payjoy', store: 'Dom Pedro II' };
    const expected = getExpectedDate(ex);
    // 03/03 + 7 = 10/03
    expect(expected).toBe('2025-03-10');
  });

  it('deve adicionar 10 dias para Payjoy Dark', () => {
    const ex: Partial<Expense> = { date: '2025-03-03', category: 'Pagamento Payjoy', store: 'Dark (Dom Pedro)' };
    const expected = getExpectedDate(ex);
    expect(expected).toBe('2025-03-13');
  });

  it('deve retornar string vazia sem data', () => {
    expect(getExpectedDate({})).toBe('');
  });
});

describe('getPaymentStatus', () => {
  it('deve retornar "Recebido" quando received=true', () => {
    const ex: Partial<Expense> = { date: '2025-03-01', received: true, category: 'Pagamento Payjoy' };
    const status = getPaymentStatus(ex);
    expect(status.label).toBe('Recebido');
    expect(status.isLate).toBe(false);
  });

  it('deve retornar "Atrasado" quando passou da previsão', () => {
    const ex: Partial<Expense> = { date: '2025-01-01', received: false, category: 'Pagamento Crefaz' };
    const status = getPaymentStatus(ex);
    expect(status.label).toBe('Atrasado');
    expect(status.isLate).toBe(true);
  });

  it('deve retornar "Pendente" quando dentro do prazo', () => {
    const today = getTodayLocal();
    const ex: Partial<Expense> = { date: today, received: false, category: 'Pagamento Crefaz' };
    const status = getPaymentStatus(ex);
    expect(status.label).toBe('Pendente');
    expect(status.isLate).toBe(false);
  });
});
