import React, { useState, useMemo, useRef, useCallback, lazy, Suspense } from 'react';
import { AppSettings, ViewType, FilterMode, GroupBy } from './utils/types';
import { CATEGORIES_LIST, STORES_LIST } from './utils/constants';
import { getTodayLocal, formatDateBR, formatMonthBR, formatCurrency, getPaymentStatus, getExpectedDate } from './utils/helpers';
import { serverTimestamp } from 'firebase/firestore';
import { Icons } from './components/ui/Icons';
import { ToastContainer, useToast } from './components/ui/Toast';
import { DateInput } from './components/ui/DateInput';
import { PasswordModal } from './components/ui/Modal';
import { NavigationTabs } from './components/ui/NavigationTabs';
import { StoreLogo } from './components/StoreLogo';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useExpenses } from './hooks/useExpenses';
import { useSettings } from './hooks/useSettings';
import { useBackup } from './hooks/useBackup';

const ExpenseCalendar = lazy(() => import('./components/ExpenseCalendar').then(m => ({ default: m.ExpenseCalendar })));
const PaymentsReport = lazy(() => import('./components/PaymentsReport').then(m => ({ default: m.PaymentsReport })));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const ExpenseList = lazy(() => import('./components/ExpenseList').then(m => ({ default: m.ExpenseList })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center py-20">
    <div className="flex flex-col items-center gap-4">
      <Icons.Clock className="w-8 h-8 text-blue-500 animate-spin" />
      <p className="text-sm text-slate-500 font-medium">Carregando...</p>
    </div>
  </div>
);

export const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('date');
  const [filterMode, setFilterMode] = useState<FilterMode>('day');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState(getTodayLocal());
  const [store, setStore] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editModal, setEditModal] = useState<{ open: boolean; ex: any }>({ open: false, ex: null });

  const amountInputRef = useRef<HTMLInputElement>(null);
  const { toasts, showToast, removeToast } = useToast();

  const {
    expenses,
    syncStatus,
    handleAdd,
    handleUpdate,
    handleBatchImport,
    availableDates,
    availableMonths,
    getFilteredExpenses,
  } = useExpenses(showToast);

  const { settings, setSettings, isOpen: isSettingsOpen, save: saveSettings, open: openSettings, close: closeSettings } = useSettings();

  const {
    showOptions: showBackupOptions,
    fileInputRef,
    saveToComputer,
    handleRestoreFile,
    triggerRestore,
    openOptions: openBackupOptions,
    closeOptions: closeBackupOptions,
  } = useBackup(expenses, handleBatchImport, showToast);

  // Theme
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('miplace_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia?.('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
    }
  }, []);

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('miplace_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Derived state
  React.useEffect(() => {
    if (availableDates.length > 0 && (!selectedDate || !availableDates.includes(selectedDate))) {
      setSelectedDate(availableDates[availableDates.length - 1]);
    }
  }, [availableDates, selectedDate]);

  React.useEffect(() => {
    if (availableMonths.length > 0 && (!selectedMonth || !availableMonths.includes(selectedMonth))) {
      setSelectedMonth(availableMonths[availableMonths.length - 1]);
    }
  }, [availableMonths, selectedMonth]);

  const filteredExpenses = useMemo(
    () => getFilteredExpenses(searchTerm, filterMode, selectedDate, selectedMonth),
    [getFilteredExpenses, searchTerm, filterMode, selectedDate, selectedMonth]
  );

  const totalsByStore = useMemo(() => {
    const acc: Record<string, number> = {};
    filteredExpenses.forEach((ex) => { acc[ex.store] = (acc[ex.store] || 0) + ex.amount; });
    return acc;
  }, [filteredExpenses]);

  const totalGeneral = useMemo(
    () => filteredExpenses.reduce((sum, ex) => sum + ex.amount, 0),
    [filteredExpenses]
  );

  const getTotalTitle = useCallback(() => {
    if (searchTerm) return '(Busca)';
    if (filterMode === 'month') return `(Mês: ${formatMonthBR(selectedMonth)})`;
    if (filterMode === 'late') return '(Valores em Atraso)';
    return '(Do Dia)';
  }, [searchTerm, filterMode, selectedMonth]);

  // Form helpers
  const resetForm = useCallback(() => { setAmount(''); setNotes(''); setEditingId(null); }, []);
  const cancelEdit = useCallback(() => { resetForm(); showToast('Cancelado', 'info'); }, [resetForm, showToast]);

  const startEdit = useCallback((ex: any) => {
    setEditingId(ex.id);
    setDate(ex.date);
    setStore(ex.store);
    setCategory(ex.category);
    setAmount(formatCurrency(ex.amount));
    setNotes(ex.notes || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Editando...', 'info');
    if (currentView !== 'dashboard') setCurrentView('dashboard');
  }, [currentView, showToast]);

  const initiateEdit = useCallback((ex: any) => {
    setEditModal({ open: true, ex });
  }, []);

  const confirmEdit = useCallback((password: string) => {
    if (password === settings.editPassword && editModal.ex) {
      startEdit(editModal.ex);
      setEditModal({ open: false, ex: null });
    } else {
      showToast('Palavra-passe incorreta.', 'error');
    }
  }, [settings.editPassword, editModal.ex, startEdit, showToast]);

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (!val) { setAmount(''); return; }
    setAmount(formatCurrency(parseFloat(val) / 100));
  }, []);

  const applyShortcut = useCallback((cat: string, st: string) => {
    setCategory(cat);
    setStore(st);
    amountInputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (settings.employeeName === 'Seu Nome' || !settings.employeeName.trim()) {
      showToast('Configure seu nome antes de lançar.', 'error');
      openSettings();
      return;
    }
    if (!store) return showToast('Selecione uma loja.', 'error');
    if (!category) return showToast('Selecione uma categoria.', 'error');

    const totalVal = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
    if (isNaN(totalVal) || totalVal <= 0) return showToast('Valor inválido', 'error');

    const today = getTodayLocal();
    if (date > today) return showToast('A data não pode ser futura.', 'error');

    if (!editingId) {
      const isDuplicate = expenses.some((ex) =>
        ex.date === date && ex.store === store && ex.category === category && Math.abs(ex.amount - totalVal) < 0.01
      );
      if (isDuplicate) return showToast('Já existe um lançamento idêntico nesta data.', 'error');
    }

    try {
      setIsSaving(true);
      if (editingId) {
        await handleUpdate(editingId, {
          date, description: category, store, category, amount: totalVal, notes,
          employeeName: settings.employeeName, updatedAt: serverTimestamp(),
        });
        showToast('Lançamento atualizado!');
        resetForm();
      } else {
        await handleAdd({
          date, description: category, category, notes, store, amount: totalVal,
          quantity: 1.0, employeeName: settings.employeeName, received: false,
          createdAt: serverTimestamp(),
        });
        showToast('Despesa salva!');
        resetForm();
      }
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, settings, store, category, amount, date, editingId, notes, expenses, handleUpdate, handleAdd, showToast, openSettings, resetForm]);

  const handleCopySummary = useCallback(() => {
    const dateStr = filterMode === 'day' && selectedDate ? formatDateBR(selectedDate) : formatDateBR(getTodayLocal());
    let late = 0, pending = 0, received = 0;
    filteredExpenses.forEach((ex) => {
      const status = getPaymentStatus(ex);
      if (ex.received) received += ex.amount;
      else if (status.isLate) late += ex.amount;
      else pending += ex.amount;
    });

    const text = `📊 *Fecho Miplace - ${dateStr}*\n\n💰 Total Lançado: ${settings.currency} ${formatCurrency(totalGeneral)}\n✅ Confirmados: ${settings.currency} ${formatCurrency(received)}\n⏳ Pendentes: ${settings.currency} ${formatCurrency(pending)}\n⚠️ Atrasados: ${settings.currency} ${formatCurrency(late)}\n\n_Enviado via Sistema de Gestão_`;

    navigator.clipboard?.writeText(text)
      .then(() => showToast('Resumo copiado para WhatsApp!', 'success'))
      .catch(() => showToast('Erro ao copiar.', 'error'));
  }, [filterMode, selectedDate, filteredExpenses, settings.currency, totalGeneral, showToast]);

  const exportToCSV = useCallback(() => {
    if (expenses.length === 0) return showToast('Nada para exportar', 'error');
    const headers = ['date', 'expected_date', 'name', 'store_name', 'product_id', 'unit_amount', 'quantity', 'description', 'employee_id', 'status'];
    const rows = expenses.map((ex) => {
      const status = getPaymentStatus(ex).label;
      const expected = getExpectedDate(ex);
      return [formatDateBR(ex.date), formatDateBR(expected), ex.category || ex.description, ex.store, ex.category, formatCurrency(ex.amount), ex.quantity, ex.notes, ex.employeeName || settings.employeeName, status];
    });
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(';'))].join('\n');
    const url = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `lancamentos_odoo_${formatDateBR(getTodayLocal()).replace(/\//g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Arquivo CSV gerado!');
  }, [expenses, settings.employeeName, showToast]);

  return (
    <div className="pb-28 md:pb-10 print:pb-0 min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <PasswordModal
        isOpen={editModal.open}
        title="Autorizar Edição"
        description="Digite a palavra-passe para editar este lançamento."
        icon="edit"
        onConfirm={confirmEdit}
        onCancel={() => setEditModal({ open: false, ex: null })}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 no-print px-4 py-4 md:py-6 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="bg-blue-600 p-2 md:p-3 rounded-xl text-white shadow-md">
                <Icons.Wallet className="w-6 h-6 md:w-7 md:h-7" aria-hidden="true" />
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-4">
                  <h1 className="font-extrabold text-slate-900 dark:text-white text-lg md:text-xl tracking-tight">Miplace Pay</h1>
                  <NavigationTabs currentView={currentView} onNavigate={setCurrentView} variant="desktop" />
                </div>
                <div className="flex items-center gap-3 mt-1">
                  {settings.employeeName !== 'Seu Nome' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] md:text-[11px] bg-slate-100 dark:bg-slate-800 px-2 md:px-3 py-1 rounded-full font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                        <Icons.User className="w-3 h-3" aria-hidden="true" /> {settings.employeeName}
                      </span>
                      {syncStatus === 'synced' && <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" role="status" aria-label="Online" />}
                      {syncStatus === 'syncing' && <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" role="status" aria-label="Sincronizando" />}
                      {syncStatus === 'error' && <Icons.WifiOff className="w-3 h-3 text-red-500" role="status" aria-label="Erro de conexão" />}
                    </div>
                  ) : (
                    <span className="text-[10px] md:text-[11px] bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-3 py-1 rounded-full font-bold animate-pulse">Offline (Configurar)</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="material-btn p-2 md:p-3 rounded-xl text-slate-500 hover:text-blue-600" aria-label={isDarkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro'}>
                {isDarkMode ? <Icons.Sun className="w-5 h-5 text-yellow-500" /> : <Icons.Moon className="w-5 h-5 text-slate-600" />}
              </button>
              <button onClick={openBackupOptions} className="material-btn hidden md:block p-2 md:p-3 rounded-xl text-slate-500 hover:text-blue-600" aria-label="Salvar backup">
                <Icons.HardDrive className="w-5 h-5" />
              </button>
              <button onClick={openSettings} className="material-btn p-2 md:p-3 rounded-xl text-slate-500 hover:text-blue-600" aria-label="Configurações">
                <Icons.Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 space-y-6 md:space-y-8 mt-6 md:mt-8">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            {currentView === 'calendar' ? (
              <ExpenseCalendar expenses={expenses} formatCurrency={formatCurrency} onUpdateExpense={handleUpdate} currency={settings.currency} showToast={showToast} adminPassword={settings.receiptPassword} />
            ) : currentView === 'analytics' ? (
              <AnalyticsDashboard expenses={expenses} currency={settings.currency} formatCurrency={formatCurrency} />
            ) : currentView === 'payments_report' ? (
              <PaymentsReport expenses={expenses} currency={settings.currency} formatCurrency={formatCurrency} onUpdateExpense={handleUpdate} showToast={showToast} adminPassword={settings.receiptPassword} />
            ) : (
          <>
            {expenses.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 no-print fade-in">
                {Object.entries(totalsByStore).sort((a, b) => b[1] - a[1]).map(([storeName, val]) => (
                  <div key={storeName} className="material-panel p-4 md:p-5 flex flex-col justify-between hover:-translate-y-1 transition-transform">
                    <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                      <StoreLogo storeName={storeName} className="w-6 h-6 md:w-8 md:h-8" />
                      <span className="text-[9px] md:text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 truncate block tracking-widest">{storeName}</span>
                    </div>
                    <div>
                      <span className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white block mb-2 tracking-tight">{settings.currency} {formatCurrency(val)}</span>
                      <div className="w-full progress-track h-1.5"><div className="h-full progress-fill" style={{ width: '70%' }} /></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <section className="material-panel p-6 md:p-10 no-print" aria-label="Formulário de lançamento">
              <div className="flex justify-between items-center mb-6 md:mb-8 border-b border-slate-100 dark:border-slate-800 pb-4 md:pb-6">
                <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                  <div className="p-2 md:p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                    {editingId ? <Icons.Edit className="w-5 h-5 md:w-6 md:h-6" /> : <Icons.Plus className="w-5 h-5 md:w-6 md:h-6" />}
                  </div>
                  {editingId ? 'Editar Lançamento' : 'Novo Lançamento'}
                </h2>
                {editingId && (
                  <button onClick={cancelEdit} className="material-btn px-4 md:px-5 py-2 rounded-lg text-sm font-bold text-slate-600 hover:text-red-600">Cancelar Edição</button>
                )}
              </div>

              {!editingId && (
                <div className="mb-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Preenchimento Rápido</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                    {CATEGORIES_LIST.flatMap((cat) =>
                      STORES_LIST.map((st) => (
                        <button key={`${cat}-${st}`} type="button" onClick={() => applyShortcut(cat, st)} className="px-2 md:px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-[10px] md:text-xs font-bold text-slate-600 dark:text-slate-300 transition-all flex items-center justify-center gap-1.5 shadow-sm overflow-hidden">
                          <Icons.Zap className="w-3 h-3 text-yellow-500 shrink-0" aria-hidden="true" />
                          <span className="truncate">{cat.replace('Pagamento ', '')} {st.split(' ')[0]}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label htmlFor="expense-date" className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Data</label>
                    <DateInput required value={date} onChange={(e) => setDate(e.target.value)} className="material-input w-full px-4 md:px-5 py-3 md:py-3.5 rounded-xl text-slate-900 font-semibold text-sm md:text-base" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="expense-category" className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Categoria</label>
                    <div className="relative group">
                      <select id="expense-category" required value={category} onChange={(e) => setCategory(e.target.value)} className="material-input w-full px-4 md:px-5 py-3 md:py-3.5 rounded-xl appearance-none text-slate-900 font-semibold cursor-pointer text-sm md:text-base">
                        <option value="" disabled>Selecione...</option>
                        {settings.categories.map((c, i) => <option key={i} value={c.label}>{c.label}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-blue-500"><Icons.Tag className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" /></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="expense-store" className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Loja / Grupo</label>
                    <div className="relative group">
                      <select id="expense-store" required value={store} onChange={(e) => setStore(e.target.value)} className="material-input w-full px-4 md:px-5 py-3 md:py-3.5 rounded-xl appearance-none text-slate-900 font-semibold cursor-pointer text-sm md:text-base">
                        <option value="" disabled>Selecione...</option>
                        {STORES_LIST.map((l, i) => <option key={i} value={l}>{l}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-blue-500"><Icons.Store className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" /></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="expense-amount" className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Valor ({settings.currency})</label>
                    <div className="relative group">
                      <input id="expense-amount" type="text" ref={amountInputRef} inputMode="numeric" required placeholder="0,00" value={amount} onChange={handleAmountChange} className="material-input w-full pl-5 pr-14 py-3 md:py-3.5 rounded-xl text-blue-600 dark:text-blue-400 font-extrabold text-lg md:text-xl tracking-tight" />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-blue-500"><Icons.DollarSign className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" /></div>
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="expense-notes" className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Observações (Opcional)</label>
                    <input id="expense-notes" type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: Referente a parcela 2..." className="material-input w-full px-4 md:px-5 py-3 md:py-3.5 rounded-xl text-slate-700 font-medium text-sm md:text-base" />
                  </div>
                </div>
                <button type="submit" disabled={isSaving} className={`material-btn-primary w-full py-4 rounded-xl font-bold text-base md:text-lg mt-4 md:mt-8 flex items-center justify-center gap-3 tracking-wide ${isSaving ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  {isSaving ? <Icons.Clock className="w-5 h-5 animate-spin" /> : editingId ? <Icons.Check className="w-5 h-5" /> : <Icons.Plus className="w-5 h-5" />}
                  {isSaving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Adicionar Lançamento'}
                </button>
              </form>
            </section>

            <ExpenseList
              expenses={expenses}
              filteredExpenses={filteredExpenses}
              currency={settings.currency}
              formatCurrency={formatCurrency}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterMode={filterMode}
              setFilterMode={setFilterMode}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              groupBy={groupBy}
              setGroupBy={setGroupBy}
              availableDates={availableDates}
              availableMonths={availableMonths}
              onInitiateEdit={initiateEdit}
              onCopySummary={handleCopySummary}
              onExportCSV={exportToCSV}
              totalGeneral={totalGeneral}
              getTotalTitle={getTotalTitle}
            />
          </>
          )}
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Backup Modal */}
      {showBackupOptions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in no-print" role="dialog" aria-modal="true" aria-labelledby="backup-title">
          <div className="material-panel dark:bg-slate-800 w-full max-w-sm overflow-hidden relative p-6 md:p-8 text-center shadow-2xl">
            <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-2xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
              <Icons.Save className="w-8 h-8" aria-hidden="true" />
            </div>
            <h3 id="backup-title" className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Salvar Backup</h3>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium">Como deseja salvar seus dados?</p>
            <div className="grid grid-cols-1 gap-4">
              <button onClick={saveToComputer} className="material-btn w-full py-4 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-3 text-sm md:text-base">
                <Icons.HardDrive className="w-5 h-5 text-slate-500" aria-hidden="true" /> <span>No Computador</span>
              </button>
              <button onClick={() => { showToast('Dados já estão na nuvem!', 'info'); closeBackupOptions(); }} className="material-btn-primary w-full py-4 font-bold rounded-xl flex items-center justify-center gap-3 text-sm md:text-base">
                <Icons.CloudUpload className="w-5 h-5" aria-hidden="true" /> <span>Salvar Nuvem</span>
              </button>
            </div>
            <button onClick={closeBackupOptions} className="mt-8 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold uppercase tracking-widest text-[10px] md:text-xs transition-colors">Cancelar</button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print" role="dialog" aria-modal="true" aria-labelledby="settings-title">
          <div className="material-panel dark:bg-slate-800 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            <div className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h3 id="settings-title" className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                <div className="p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-blue-600 dark:text-blue-400 shadow-sm"><Icons.Settings className="w-4 h-4 md:w-5 h-5" aria-hidden="true" /></div> Ajustes
              </h3>
              <button onClick={closeSettings} aria-label="Fechar configurações" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-2"><Icons.X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 md:p-6 space-y-6 md:space-y-8 overflow-y-auto">
              <div className="space-y-3">
                <h4 className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Identificação</h4>
                <input type="text" placeholder="Nome do Funcionário" value={settings.employeeName} onChange={(e) => setSettings({ ...settings, employeeName: e.target.value })} className="material-input w-full p-3 md:p-4 rounded-xl font-bold text-slate-900 text-sm md:text-base" />
              </div>
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <h4 className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Segurança</h4>
                <div>
                  <label htmlFor="receipt-password" className="text-xs text-slate-500 font-bold mb-1 block">Senha de Confirmação de Recebimento</label>
                  <input id="receipt-password" type="password" placeholder="Senha para confirmar recebimentos" value={settings.receiptPassword || ''} onChange={(e) => setSettings({ ...settings, receiptPassword: e.target.value })} className="material-input w-full p-3 md:p-4 rounded-xl font-bold text-slate-900 text-sm md:text-base" />
                </div>
                <div>
                  <label htmlFor="edit-password" className="text-xs text-slate-500 font-bold mb-1 block">Senha de Edição de Lançamentos</label>
                  <input id="edit-password" type="password" placeholder="Senha para editar lançamentos" value={settings.editPassword || ''} onChange={(e) => setSettings({ ...settings, editPassword: e.target.value })} className="material-input w-full p-3 md:p-4 rounded-xl font-bold text-slate-900 text-sm md:text-base" />
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <h4 className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Backup do PC</h4>
                <button onClick={triggerRestore} className="flex items-center justify-center gap-2 w-full py-3 md:py-4 material-btn text-slate-700 font-bold rounded-xl text-sm">
                  <Icons.Upload className="w-4 h-4 md:w-5 h-5 text-slate-500" aria-hidden="true" /> Restaurar Arquivo
                </button>
                <input type="file" ref={fileInputRef} onChange={handleRestoreFile} accept=".json" className="hidden" />
              </div>
            </div>
            <div className="p-5 md:p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
              <button onClick={() => { saveSettings(); showToast('Configurações salvas!', 'success'); }} className="w-full py-3 md:py-4 material-btn-primary font-bold rounded-xl text-sm md:text-base tracking-wide">Salvar e Fechar</button>
            </div>
          </div>
        </div>
      )}

      <NavigationTabs currentView={currentView} onNavigate={setCurrentView} variant="mobile" />
    </div>
  );
};
