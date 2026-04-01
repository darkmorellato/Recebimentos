import { describe, it, expect } from 'vitest';
import { CATEGORIES_LIST, STORES_LIST, STORE_IMAGES, DEFAULT_SETTINGS } from '../utils/constants';

describe('CATEGORIES_LIST', () => {
  it('deve conter categorias esperadas', () => {
    expect(CATEGORIES_LIST).toContain('Pagamento Payjoy');
    expect(CATEGORIES_LIST).toContain('Pagamento Crefaz');
  });

  it('deve estar ordenada alfabeticamente', () => {
    const sorted = [...CATEGORIES_LIST].sort();
    expect(CATEGORIES_LIST).toEqual(sorted);
  });
});

describe('STORES_LIST', () => {
  it('deve conter lojas esperadas', () => {
    expect(STORES_LIST).toContain('Dom Pedro II');
    expect(STORES_LIST).toContain('Realme');
    expect(STORES_LIST).toContain('Xv de Novembro');
    expect(STORES_LIST).toContain('Premium');
    expect(STORES_LIST).toContain('Kassouf');
    expect(STORES_LIST).toContain('Dark (Dom Pedro)');
  });

  it('deve ter pelo menos 6 lojas', () => {
    expect(STORES_LIST.length).toBeGreaterThanOrEqual(6);
  });
});

describe('STORE_IMAGES', () => {
  it('deve ter imagem para cada loja', () => {
    STORES_LIST.forEach((store) => {
      expect(STORE_IMAGES[store]).toBeDefined();
      expect(STORE_IMAGES[store]).toMatch(/^\/images\//);
    });
  });
});

describe('DEFAULT_SETTINGS', () => {
  it('deve ter valores padrão corretos', () => {
    expect(DEFAULT_SETTINGS.employeeName).toBe('Seu Nome');
    expect(DEFAULT_SETTINGS.currency).toBe('R$');
    expect(DEFAULT_SETTINGS.receiptPassword).toBeTruthy();
    expect(DEFAULT_SETTINGS.editPassword).toBeTruthy();
  });

  it('deve ter categorias mapeadas', () => {
    expect(DEFAULT_SETTINGS.categories.length).toBe(CATEGORIES_LIST.length);
    DEFAULT_SETTINGS.categories.forEach((cat) => {
      expect(cat.label).toBeTruthy();
      expect(cat.odooRef).toBeTruthy();
    });
  });
});
