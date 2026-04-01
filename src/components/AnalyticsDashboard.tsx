import React, { useState, useMemo } from 'react';
import { Expense } from '../utils/types';
import { formatCurrency as fmtCurrency } from '../utils/helpers';
import { Icons } from './ui/Icons';
import { StoreLogo } from './StoreLogo';

interface AnalyticsDashboardProps {
  expenses: Expense[];
  currency: string;
  formatCurrency: (value: number) => string;
}

type ViewMode = 'month' | 'year';

const calculateBarHeight = (value: number, max: number) => (max > 0 ? `${(value / max) * 100}%` : '0%');
const calculateBarWidth = (value: number, max: number) => (max > 0 ? `${(value / max) * 100}%` : '0%');

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ expenses, currency, formatCurrency }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
    else newDate.setFullYear(newDate.getFullYear() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
    else newDate.setFullYear(newDate.getFullYear() + 1);
    setCurrentDate(newDate);
  };

  const getLabel = () => {
    if (viewMode === 'month') {
      const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long' });
      return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${currentDate.getFullYear()}`;
    }
    return `Ano de ${currentDate.getFullYear()}`;
  };

  const filteredData = useMemo(() => {
    const targetYear = currentDate.getFullYear();
    const targetMonth = currentDate.getMonth();
    return expenses.filter((ex) => {
      const [y, m] = ex.date.split('-').map(Number);
      if (viewMode === 'year') return y === targetYear;
      return y === targetYear && m - 1 === targetMonth;
    });
  }, [expenses, currentDate, viewMode]);

  const monthlyData = useMemo(() => {
    if (viewMode !== 'year') return [];
    const months = Array(12).fill(0);
    filteredData.forEach((ex) => {
      const monthIndex = parseInt(ex.date.split('-')[1]) - 1;
      months[monthIndex] += ex.amount;
    });
    return months;
  }, [filteredData, viewMode]);

  const total = useMemo(() => filteredData.reduce((acc, curr) => acc + curr.amount, 0), [filteredData]);

  const expensesByStore = useMemo(() =>
    filteredData.reduce<Record<string, number>>((acc, curr) => {
      acc[curr.store] = (acc[curr.store] || 0) + curr.amount;
      return acc;
    }, {}), [filteredData]);

  const sortedStores = useMemo(() =>
    Object.entries(expensesByStore).sort((a, b) => b[1] - a[1]), [expensesByStore]);

  const expensesByCategory = useMemo(() =>
    filteredData.reduce<Record<string, number>>((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {}), [filteredData]);

  const sortedCategories = useMemo(() =>
    Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]), [expensesByCategory]);

  const topExpenses = useMemo(() =>
    [...filteredData].sort((a, b) => b.amount - a.amount).slice(0, 5), [filteredData]);

  return (
    <div className="space-y-8 fade-in">
      <div className="material-panel p-4 px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl" role="group" aria-label="Modo de visualização">
          <button onClick={() => setViewMode('month')} aria-pressed={viewMode === 'month'} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'month' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Mensal</button>
          <button onClick={() => setViewMode('year')} aria-pressed={viewMode === 'year'} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'year' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Anual</button>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handlePrev} aria-label="Período anterior" className="material-btn p-2 rounded-lg text-slate-500 transition-colors"><Icons.ChevronLeft className="w-5 h-5" /></button>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white min-w-[180px] text-center capitalize tracking-tight">{getLabel()}</h3>
          <button onClick={handleNext} aria-label="Próximo período" className="material-btn p-2 rounded-lg text-slate-500 transition-colors"><Icons.ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="material-panel p-16 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex justify-center mb-6 opacity-40"><Icons.Chart className="w-16 h-16" aria-hidden="true" /></div>
          <h3 className="text-xl font-bold text-slate-500">Sem dados neste período</h3>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="material-panel p-8 relative overflow-hidden bg-white border-l-4 border-l-blue-500">
              <div className="absolute top-0 right-0 p-6 opacity-5 text-blue-600 transform translate-x-4 -translate-y-4"><Icons.DollarSign className="w-32 h-32" aria-hidden="true" /></div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">Total {viewMode === 'year' ? 'Anual' : 'Mensal'}</p>
              <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{currency} {formatCurrency(total)}</h3>
              {viewMode === 'year' && (
                <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mt-4 bg-blue-50 dark:bg-blue-900/30 inline-block px-3 py-1 rounded-md">Média: {currency} {formatCurrency(total / 12)} / mês</p>
              )}
            </div>
            <div className="material-panel p-8 relative overflow-hidden bg-white">
              <div className="absolute top-0 right-0 p-6 opacity-5 text-slate-900 dark:text-white transform translate-x-4 -translate-y-4"><Icons.Store className="w-32 h-32" aria-hidden="true" /></div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">Loja Top 1</p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white truncate tracking-tight" title={sortedStores[0]?.[0]}>{sortedStores[0]?.[0] || '-'}</h3>
              <p className="text-base font-bold text-slate-500 mt-2">{currency} {formatCurrency(sortedStores[0]?.[1] || 0)}</p>
            </div>
            <div className="material-panel p-8 relative overflow-hidden bg-white">
              <div className="absolute top-0 right-0 p-6 opacity-5 text-slate-900 dark:text-white transform translate-x-4 -translate-y-4"><Icons.Tag className="w-32 h-32" aria-hidden="true" /></div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">Categoria Top 1</p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white truncate tracking-tight" title={sortedCategories[0]?.[0]}>{sortedCategories[0]?.[0] || '-'}</h3>
              <p className="text-base font-bold text-slate-500 mt-2">{currency} {formatCurrency(sortedCategories[0]?.[1] || 0)}</p>
            </div>
          </div>

          {viewMode === 'year' && (
            <div className="material-panel p-8">
              <h3 className="font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3 text-lg"><div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400"><Icons.FileSpreadsheet className="w-5 h-5" aria-hidden="true" /></div>Evolução Mensal ({currentDate.getFullYear()})</h3>
              <div className="h-64 flex items-end justify-between gap-2 md:gap-4 border-b border-slate-100 dark:border-slate-700 pb-2">
                {monthlyData.map((val, idx) => {
                  const maxVal = Math.max(...monthlyData);
                  const monthName = new Date(currentDate.getFullYear(), idx, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
                      {val > 0 && <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-sm px-2 py-1 rounded z-10 whitespace-nowrap mb-1">{formatCurrency(val)}</span>}
                      <div className="w-full max-w-[40px] progress-track transition-all duration-700 h-full flex flex-col justify-end"><div className={`w-full transition-all duration-700 ${val > 0 ? 'bg-blue-500 hover:bg-blue-600' : 'bg-transparent h-0'}`} style={{ height: val > 0 ? calculateBarHeight(val, maxVal) : '0%' }} /></div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase mt-2">{monthName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="material-panel p-8">
              <h3 className="font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3 text-lg"><div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400"><Icons.Store className="w-5 h-5" aria-hidden="true" /></div>Ranking de Lojas ({viewMode === 'month' ? 'Mês' : 'Ano'})</h3>
              <div className="space-y-6">
                {sortedStores.map(([store, value]) => (
                  <div key={store} className="relative">
                    <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 items-center">
                      <span className="flex items-center gap-3"><StoreLogo storeName={store} className="w-6 h-6" /> {store}</span>
                      <span className="text-slate-900 dark:text-white font-extrabold">{currency} {formatCurrency(value)}</span>
                    </div>
                    <div className="w-full progress-track h-2"><div className="progress-fill transition-all duration-1000 ease-out" style={{ width: calculateBarWidth(value, sortedStores[0][1]) }} /></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="material-panel p-8">
              <h3 className="font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3 text-lg"><div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-orange-500 dark:text-orange-400"><Icons.AlertTriangle className="w-5 h-5" aria-hidden="true" /></div>Maiores Lançamentos ({viewMode === 'month' ? 'Mês' : 'Ano'})</h3>
              <div className="overflow-hidden border border-slate-100 dark:border-slate-700 rounded-xl">
                <table className="w-full text-left text-sm bg-white dark:bg-slate-800" aria-label="Maiores lançamentos">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-slate-200 dark:border-slate-700">
                    <tr><th scope="col" className="p-4">Categoria</th><th scope="col" className="p-4">Loja</th><th scope="col" className="p-4 text-right">Valor</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {topExpenses.map((ex, idx) => (
                      <tr key={ex.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="p-4 font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{ex.category || ex.description}</td>
                        <td className="p-4 text-slate-500 dark:text-slate-400 truncate max-w-[120px] flex items-center gap-2"><StoreLogo storeName={ex.store} className="w-5 h-5" /> {ex.store}</td>
                        <td className="p-4 text-right font-extrabold text-slate-900 dark:text-white">{formatCurrency(ex.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
