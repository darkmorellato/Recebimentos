import React, { useMemo } from 'react';
import { Expense, FilterMode, GroupBy } from '../utils/types';
import { formatDateBR, formatMonthBR, getExpectedDate, getPaymentStatus, isPayjoy, isCrefaz } from '../utils/helpers';
import { Icons } from './ui/Icons';
import { StoreLogo } from './StoreLogo';
import { StatusBadge } from './ui/StatusBadge';
import { ExpectedDateDisplay } from './ui/ExpectedDateDisplay';

interface ExpenseListProps {
  expenses: Expense[];
  filteredExpenses: Expense[];
  currency: string;
  formatCurrency: (value: number) => string;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterMode: FilterMode;
  setFilterMode: (v: FilterMode) => void;
  selectedDate: string;
  setSelectedDate: (v: string) => void;
  selectedMonth: string;
  setSelectedMonth: (v: string) => void;
  groupBy: GroupBy;
  setGroupBy: (v: GroupBy) => void;
  availableDates: string[];
  availableMonths: string[];
  onInitiateEdit: (ex: Expense) => void;
  onCopySummary: () => void;
  onExportCSV: () => void;
  totalGeneral: number;
  getTotalTitle: () => string;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  filteredExpenses,
  currency,
  formatCurrency,
  searchTerm,
  setSearchTerm,
  filterMode,
  setFilterMode,
  selectedDate,
  setSelectedDate,
  selectedMonth,
  setSelectedMonth,
  groupBy,
  setGroupBy,
  availableDates,
  availableMonths,
  onInitiateEdit,
  onCopySummary,
  onExportCSV,
  totalGeneral,
  getTotalTitle,
}) => {
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, Expense[]> = {};
    filteredExpenses.forEach((ex) => {
      const key = groupBy === 'date' ? ex.date : ex.store;
      if (!groups[key]) groups[key] = [];
      groups[key].push(ex);
    });
    const sortedKeys = Object.keys(groups).sort((a, b) =>
      groupBy === 'date' ? b.localeCompare(a) : a.localeCompare(b)
    );
    return sortedKeys.map((key) => ({
      key,
      items: groups[key],
      total: groups[key].reduce((sum, item) => sum + item.amount, 0),
    }));
  }, [filteredExpenses, groupBy]);

  const handlePrevDate = () => { const idx = availableDates.indexOf(selectedDate); if (idx > 0) setSelectedDate(availableDates[idx - 1]); };
  const handleNextDate = () => { const idx = availableDates.indexOf(selectedDate); if (idx < availableDates.length - 1) setSelectedDate(availableDates[idx + 1]); };
  const handlePrevMonth = () => { const idx = availableMonths.indexOf(selectedMonth); if (idx > 0) setSelectedMonth(availableMonths[idx - 1]); };
  const handleNextMonth = () => { const idx = availableMonths.indexOf(selectedMonth); if (idx < availableMonths.length - 1) setSelectedMonth(availableMonths[idx + 1]); };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-16 md:py-24 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl md:rounded-[2rem] bg-slate-50 dark:bg-slate-800/30 no-print flex flex-col items-center justify-center mt-6">
        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-full shadow-sm mb-4 md:mb-6 border border-slate-100 dark:border-slate-700">
          <Icons.FileSpreadsheet className="w-10 h-10 md:w-12 md:h-12 text-blue-500" aria-hidden="true" />
        </div>
        <p className="font-extrabold text-slate-700 dark:text-white text-lg md:text-xl tracking-tight">Nenhum lançamento no banco.</p>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium text-sm md:text-base">Os dados não foram encontrados ou o sistema está vazio.</p>
      </div>
    );
  }

  return (
    <>
      {/* Summary & Filters */}
      <div className="material-panel p-6 md:p-10 print:border-none print:shadow-none print:p-0 print:mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b border-slate-100 dark:border-slate-800 pb-6 md:pb-8">
          <div>
            <p className="text-[10px] md:text-xs text-slate-500 uppercase font-bold mb-1 no-print tracking-widest">Total {getTotalTitle()}</p>
            <p className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              <span className="text-xl md:text-2xl text-slate-400 font-bold mr-2 align-top">{currency}</span>
              {formatCurrency(totalGeneral)}
            </p>
          </div>
          <div className="flex flex-wrap lg:flex-nowrap gap-2 md:gap-3 w-full lg:w-auto no-print">
            <button onClick={onCopySummary} className="material-btn flex-1 lg:flex-none justify-center flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-emerald-700 dark:text-emerald-400 font-bold border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30">
              <Icons.MessageCircle className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" /> <span className="text-xs md:text-sm">Copiar Resumo</span>
            </button>
            <button onClick={() => window.print()} className="material-btn hidden md:flex flex-1 lg:flex-none justify-center items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-slate-700 font-bold">
              <Icons.Printer className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" /> <span className="text-xs md:text-sm">Imprimir</span>
            </button>
            <button onClick={onExportCSV} className="material-btn-primary flex-1 lg:flex-none justify-center flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold">
              <Icons.Download className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" /> <span className="text-xs md:text-sm">Exportar</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 no-print items-start lg:items-center">
          <div className="relative w-full lg:flex-1">
            <label htmlFor="search-expenses" className="sr-only">Pesquisar lançamentos</label>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Icons.Search className="w-5 h-5 text-slate-400" aria-hidden="true" /></div>
            <input id="search-expenses" type="text" placeholder="Pesquisar lançamentos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="material-input w-full pl-12 pr-4 py-3 rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full lg:w-auto items-start sm:items-center">
            {!searchTerm ? (
              <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto justify-center" role="group" aria-label="Filtrar por">
                  <button onClick={() => setFilterMode('late')} aria-pressed={filterMode === 'late'} className={`flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${filterMode === 'late' ? 'bg-red-500 text-white shadow-sm animate-pulse' : 'text-slate-500 hover:text-red-500'}`}><Icons.AlertTriangle className="w-3 h-3" aria-hidden="true" /> Atrasos</button>
                  <button onClick={() => setFilterMode('day')} aria-pressed={filterMode === 'day'} className={`flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-lg transition-all ${filterMode === 'day' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Dia</button>
                  <button onClick={() => setFilterMode('month')} aria-pressed={filterMode === 'month'} className={`flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-lg transition-all ${filterMode === 'month' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Mês</button>
                </div>
                {filterMode === 'day' && (
                  <div className="flex items-center justify-between sm:justify-start gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 rounded-xl shadow-sm w-full sm:w-auto" role="group" aria-label="Navegar datas">
                    <button onClick={handlePrevDate} disabled={availableDates.indexOf(selectedDate) <= 0} aria-label="Data anterior" className="p-1.5 text-slate-500 hover:text-blue-600 disabled:opacity-30 transition-colors"><Icons.ChevronLeft className="w-4 h-4" /></button>
                    <span className="font-bold text-slate-700 dark:text-slate-200 px-2 text-xs md:text-sm tracking-tight" aria-live="polite">{selectedDate ? formatDateBR(selectedDate) : '...'}</span>
                    <button onClick={handleNextDate} disabled={availableDates.indexOf(selectedDate) >= availableDates.length - 1} aria-label="Próxima data" className="p-1.5 text-slate-500 hover:text-blue-600 disabled:opacity-30 transition-colors"><Icons.ChevronRight className="w-4 h-4" /></button>
                  </div>
                )}
                {filterMode === 'month' && (
                  <div className="flex items-center justify-between sm:justify-start gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 rounded-xl shadow-sm w-full sm:w-auto" role="group" aria-label="Navegar meses">
                    <button onClick={handlePrevMonth} disabled={availableMonths.indexOf(selectedMonth) <= 0} aria-label="Mês anterior" className="p-1.5 text-slate-500 hover:text-blue-600 disabled:opacity-30 transition-colors"><Icons.ChevronLeft className="w-4 h-4" /></button>
                    <span className="font-bold text-slate-700 dark:text-slate-200 px-2 text-xs md:text-sm capitalize tracking-tight" aria-live="polite">{selectedMonth ? formatMonthBR(selectedMonth) : '...'}</span>
                    <button onClick={handleNextMonth} disabled={availableMonths.indexOf(selectedMonth) >= availableMonths.length - 1} aria-label="Próximo mês" className="p-1.5 text-slate-500 hover:text-blue-600 disabled:opacity-30 transition-colors"><Icons.ChevronRight className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold w-full sm:w-auto text-center">Modo Busca Ativo</div>
            )}
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden lg:block" />
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto justify-center" role="group" aria-label="Agrupar por">
              <button onClick={() => setGroupBy('date')} aria-pressed={groupBy === 'date'} className={`flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-lg transition-all ${groupBy === 'date' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Agrupar Data</button>
              <button onClick={() => setGroupBy('store')} aria-pressed={groupBy === 'store'} className={`flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-lg transition-all ${groupBy === 'store' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Agrupar Loja</button>
            </div>
          </div>
        </div>
      </div>

      {/* Grouped List */}
      <div className="space-y-6 md:space-y-8 print:space-y-6">
        {groupedExpenses.length === 0 && filterMode === 'late' && (
          <div className="text-center py-10 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl md:rounded-[2rem]">
            <Icons.Check className="w-10 h-10 md:w-12 md:h-12 text-emerald-500 mx-auto mb-3 md:mb-4" aria-hidden="true" />
            <h3 className="text-lg md:text-xl font-bold text-emerald-700 dark:text-emerald-400">Tudo em dia!</h3>
            <p className="text-sm md:text-base text-emerald-600 dark:text-emerald-500">Nenhum pagamento atrasado encontrado.</p>
          </div>
        )}

        {groupedExpenses.map((group) => (
          <div key={group.key} className="print-break-inside-avoid">
            <div className="flex items-center justify-between mb-3 md:mb-4 px-1 md:px-2">
              <h3 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 md:gap-3 tracking-tight">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-1.5 md:p-2 rounded-lg text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  {groupBy === 'date' ? <Icons.Calendar className="w-4 h-4 md:w-5 md:h-5 m-0.5" aria-hidden="true" /> : <StoreLogo storeName={group.key} className="w-5 h-5 md:w-6 md:h-6" />}
                </div>
                {groupBy === 'date' ? formatDateBR(group.key) : group.key}
              </h3>
              <span className="text-xs md:text-sm font-extrabold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 md:px-4 py-1.5 rounded-full">
                {currency} {formatCurrency(group.total)}
              </span>
            </div>

            <div className="material-panel overflow-hidden print:shadow-none print:border print:border-slate-300">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-left text-sm relative border-collapse" aria-label={`Lançamentos ${groupBy === 'date' ? 'do dia ' + formatDateBR(group.key) : 'da loja ' + group.key}`}>
                  <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900/90 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      {groupBy === 'date' && <th scope="col" className="px-4 md:px-6 py-3 md:py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] md:text-xs tracking-widest whitespace-nowrap">Loja</th>}
                      <th scope="col" className="px-4 md:px-6 py-3 md:py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] md:text-xs tracking-widest whitespace-nowrap">Status</th>
                      <th scope="col" className="px-4 md:px-6 py-3 md:py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] md:text-xs tracking-widest whitespace-nowrap">Categoria</th>
                      <th scope="col" className="px-4 md:px-6 py-3 md:py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] md:text-xs tracking-widest">Observações</th>
                      <th scope="col" className="px-4 md:px-6 py-3 md:py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] md:text-xs tracking-widest whitespace-nowrap">Previsão</th>
                      <th scope="col" className="px-4 md:px-6 py-3 md:py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] md:text-xs tracking-widest text-right whitespace-nowrap">Valor</th>
                      <th scope="col" className="px-4 md:px-6 py-3 md:py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] md:text-xs tracking-widest text-center no-print">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-900/30">
                    {group.items.map((ex) => {
                      const status = getPaymentStatus(ex);
                      const expectedDate = getExpectedDate(ex);

                      return (
                        <tr key={ex.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${status.isLate ? 'bg-red-50/20 dark:bg-red-900/10' : ''}`}>
                          {groupBy === 'date' && (
                            <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2 md:gap-3">
                                <StoreLogo storeName={ex.store} className="w-5 h-5 md:w-6 md:h-6" />
                                <span className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300">{ex.store}</span>
                              </div>
                            </td>
                          )}
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            <StatusBadge status={status} />
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 text-slate-900 dark:text-white text-xs md:text-sm font-bold whitespace-nowrap">
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{ex.category}</span>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 min-w-[150px]">
                            <div className="font-medium text-slate-500 dark:text-slate-400 text-xs md:text-sm leading-tight">{ex.notes || ex.description || '-'}</div>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            {(isPayjoy(ex) || isCrefaz(ex)) ? (
                              <ExpectedDateDisplay date={formatDateBR(expectedDate)} isLate={status.isLate} isReceived={ex.received} />
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 font-bold">-</span>
                            )}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 text-right font-extrabold text-slate-900 dark:text-white text-sm md:text-base whitespace-nowrap">
                            {formatCurrency(ex.amount)}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 text-center no-print">
                            <div className="flex justify-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all md:transform md:translate-y-1 md:group-hover:translate-y-0">
                              <button onClick={() => onInitiateEdit(ex)} aria-label="Editar lançamento" className="material-btn p-1.5 md:p-2 text-slate-500 hover:text-orange-500 rounded-lg">
                                <Icons.Edit className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
