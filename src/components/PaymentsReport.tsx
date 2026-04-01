import React, { useState, useMemo } from 'react';
import { Expense } from '../utils/types';
import { formatDateBR, getExpectedDate, getPaymentStatus } from '../utils/helpers';
import { Icons } from './ui/Icons';
import { StoreLogo } from './StoreLogo';
import { PasswordModal } from './ui/Modal';
import { StatusBadge } from './ui/StatusBadge';
import { ExpectedDateDisplay } from './ui/ExpectedDateDisplay';
import { useReceiptConfirmation } from '../hooks/useReceiptConfirmation';

interface PaymentsReportProps {
  expenses: Expense[];
  currency: string;
  formatCurrency: (value: number) => string;
  onUpdateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  adminPassword: string;
}

type Filter = 'all' | 'late' | 'pending' | 'received';
type SortField = 'store' | 'date' | 'expected';

const calculateTotals = (expenses: Expense[]) => {
  let late = 0, pending = 0, received = 0;
  expenses.forEach((ex) => {
    const status = getPaymentStatus(ex);
    if (ex.received) received += ex.amount;
    else if (status.isLate) late += ex.amount;
    else pending += ex.amount;
  });
  return { late, pending, received };
};

export const PaymentsReport: React.FC<PaymentsReportProps> = ({
  expenses,
  currency,
  formatCurrency,
  onUpdateExpense,
  showToast,
  adminPassword,
}) => {
  const [filter, setFilter] = useState<Filter>('all');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const { modal, openModal, closeModal, confirm } = useReceiptConfirmation(onUpdateExpense, showToast, adminPassword);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];
    if (filter !== 'all') {
      result = result.filter((ex) => {
        const status = getPaymentStatus(ex);
        if (filter === 'late') return status.isLate && !ex.received;
        if (filter === 'pending') return !status.isLate && !ex.received;
        if (filter === 'received') return ex.received;
        return true;
      });
    }
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'store') cmp = (a.store || '').localeCompare(b.store || '', 'pt-BR');
      else if (sortField === 'date') cmp = (a.date || '').localeCompare(b.date || '');
      else cmp = getExpectedDate(a).localeCompare(getExpectedDate(b));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [expenses, filter, sortField, sortDir]);

  const totals = useMemo(() => calculateTotals(expenses), [expenses]);

  return (
    <div className="space-y-6 fade-in relative">
      <PasswordModal
        isOpen={modal.open}
        title="Confirmar Ação"
        description="Digite a palavra-passe do administrador."
        onConfirm={confirm}
        onCancel={closeModal}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button onClick={() => setFilter('late')} className="material-panel p-6 border-l-4 border-l-red-500 relative overflow-hidden bg-white cursor-pointer hover:shadow-md text-left" aria-pressed={filter === 'late'}>
          <div className="absolute top-0 right-0 p-4 opacity-5 text-red-600 transform translate-x-2 -translate-y-2"><Icons.AlertTriangle className="w-24 h-24" aria-hidden="true" /></div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Atrasados</p>
          <h3 className="text-3xl font-extrabold text-red-600 dark:text-red-500">{currency} {formatCurrency(totals.late)}</h3>
        </button>
        <button onClick={() => setFilter('pending')} className="material-panel p-6 border-l-4 border-l-orange-400 relative overflow-hidden bg-white cursor-pointer hover:shadow-md text-left" aria-pressed={filter === 'pending'}>
          <div className="absolute top-0 right-0 p-4 opacity-5 text-orange-600 transform translate-x-2 -translate-y-2"><Icons.Clock className="w-24 h-24" aria-hidden="true" /></div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Pendentes</p>
          <h3 className="text-3xl font-extrabold text-orange-500 dark:text-orange-400">{currency} {formatCurrency(totals.pending)}</h3>
        </button>
        <button onClick={() => setFilter('received')} className="material-panel p-6 border-l-4 border-l-emerald-500 relative overflow-hidden bg-white cursor-pointer hover:shadow-md text-left" aria-pressed={filter === 'received'}>
          <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-600 transform translate-x-2 -translate-y-2"><Icons.Check className="w-24 h-24" aria-hidden="true" /></div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Recebidos</p>
          <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-500">{currency} {formatCurrency(totals.received)}</h3>
        </button>
      </div>

      <div className="material-panel p-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 border-b border-slate-100 dark:border-slate-700 pb-6">
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400"><Icons.FileSpreadsheet className="w-5 h-5" aria-hidden="true" /></div>
            Controle de Pagamentos
          </h3>
          <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto w-full md:w-auto" role="group" aria-label="Filtrar por status">
            {([
              { key: 'all' as Filter, label: 'Todos' },
              { key: 'late' as Filter, label: 'Atrasados', icon: Icons.AlertTriangle },
              { key: 'pending' as Filter, label: 'Pendentes' },
              { key: 'received' as Filter, label: 'Recebidos', icon: Icons.Check },
            ]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                aria-pressed={filter === key}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1 whitespace-nowrap ${
                  filter === key
                    ? key === 'late' ? 'bg-red-500 text-white shadow-sm' : key === 'pending' ? 'bg-orange-400 text-white shadow-sm' : key === 'received' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {Icon && <Icon className="w-3 h-3" aria-hidden="true" />} {label}
              </button>
            ))}
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <Icons.Check className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" aria-hidden="true" />
            <p className="text-slate-500 font-medium">Nenhum lançamento encontrado para este filtro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-sm relative border-collapse" aria-label="Controle de pagamentos">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th scope="col" className="px-5 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-widest cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onClick={() => handleSort('store')}>
                    <span className="flex items-center gap-1">Loja {sortField === 'store' ? (sortDir === 'asc' ? '↑' : '↓') : <span className="opacity-30">↕</span>}</span>
                  </th>
                  <th scope="col" className="px-5 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-widest">Categoria</th>
                  <th scope="col" className="px-5 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-widest cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onClick={() => handleSort('date')}>
                    <span className="flex items-center gap-1">Lançado {sortField === 'date' ? (sortDir === 'asc' ? '↑' : '↓') : <span className="opacity-30">↕</span>}</span>
                  </th>
                  <th scope="col" className="px-5 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-widest">Previsão</th>
                  <th scope="col" className="px-5 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-widest">Status</th>
                  <th scope="col" className="px-5 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-widest text-right">Valor</th>
                  <th scope="col" className="px-5 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-widest text-center no-print">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-900/50">
                {filteredExpenses.map((ex) => {
                  const status = getPaymentStatus(ex);
                  const expectedDate = getExpectedDate(ex);

                  return (
                    <tr key={ex.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${status.isLate && filter === 'all' ? 'bg-red-50/20 dark:bg-red-900/10' : ''}`}>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <StoreLogo storeName={ex.store} className="w-6 h-6" />
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{ex.store}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {ex.category && (
                          <span className="text-[10px] px-2.5 py-1 rounded-md font-bold border bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 flex items-center gap-1 w-fit">
                            <Icons.Tag className="w-3 h-3" aria-hidden="true" /> {ex.category}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm whitespace-nowrap">{formatDateBR(ex.date)}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <ExpectedDateDisplay date={formatDateBR(expectedDate)} isLate={status.isLate} isReceived={ex.received} />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-5 py-4 text-right font-extrabold text-slate-900 dark:text-white text-base whitespace-nowrap">{currency} {formatCurrency(ex.amount)}</td>
                      <td className="px-5 py-4 text-center no-print">
                        <button
                          onClick={() => openModal(ex)}
                          aria-label={ex.received ? 'Recebido' : 'Confirmar recebimento'}
                          className={`px-4 py-2 rounded-lg font-bold flex items-center justify-center mx-auto gap-2 transition-all text-xs border ${
                            ex.received
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                              : status.isLate
                                ? 'bg-red-500 text-white border-red-600 hover:bg-red-600 shadow-md animate-pulse'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-orange-500 dark:text-orange-400 hover:bg-orange-50'
                          }`}
                        >
                          {ex.received ? <Icons.Check className="w-3 h-3" aria-hidden="true" /> : <Icons.AlertCircle className="w-3 h-3" aria-hidden="true" />}
                          {ex.received ? 'Recebido' : 'Confirmar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
