export const CATEGORIES_LIST: string[] = [
  'Pagamento Payjoy',
  'Pagamento Crefaz',
].sort();

export const STORES_LIST: string[] = [
  'Dom Pedro II',
  'Realme',
  'Xv de Novembro',
  'Premium',
  'Kassouf',
  'Dark (Dom Pedro)',
];

export const STORE_IMAGES: Record<string, string> = {
  'Dom Pedro II': '/images/dompedro.png',
  'Realme': '/images/realme.png',
  'Xv de Novembro': '/images/xv.png',
  'Premium': '/images/premium.png',
  'Kassouf': '/images/kassouf.png',
  'Dark (Dom Pedro)': '/images/dompedro.png',
};

export const DEFAULT_SETTINGS = {
  employeeName: 'Seu Nome',
  currency: 'R$',
  receiptPassword: import.meta.env.VITE_RECEIPT_PASSWORD || '#Banana@10',
  editPassword: import.meta.env.VITE_EDIT_PASSWORD || '#Banana@3433',
  categories: CATEGORIES_LIST.map((cat) => ({ label: cat, odooRef: cat })),
};

export const PRAZO_DARK_SABADO = 11;
export const PRAZO_DARK = 10;
export const PRAZO_NORMAL_SABADO = 9;
export const PRAZO_NORMAL = 7;
