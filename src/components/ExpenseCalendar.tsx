import React, { useState, useMemo } from 'react';
import { Expense } from '../utils/types';
import { formatDateBR, getExpectedDate, getPaymentStatus, getTodayLocal } from '../utils/helpers';
import { Icons } from './ui/Icons';
import { StoreLogo } from './StoreLogo';
import { PasswordModal } from './ui/Modal';
import { StatusBadge } from './ui/StatusBadge';
import { ExpectedDateDisplay } from './ui/ExpectedDateDisplay';
import { useReceiptConfirmation } from '../hooks/useReceiptConfirmation';

interface ExpenseCalendarProps {
  expenses: Expense[];
  currency: string;
  formatCurrency: (value: number) => string;
  onUpdateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  adminPassword: string;
}

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const ExpenseCalendar: React.FC<ExpenseCalendarProps> = ({
  expenses,
  currency,
  formatCurrency,
  onUpdateExpense,
  showToast,
  adminPassword,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(getTodayLocal());
  const { modal, openModal, closeModal, confirm } = useReceiptConfirmation(onUpdateExpense, showToast, adminPassword);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const expensesByDate = useMemo(() => {
    const map = new Map<string, Expense[]>();
    expenses.forEach((ex) => {
      const list = map.get(ex.date) || [];
      list.push(ex);
      map.set(ex.date, list);
    });
    return map;
  }, [expenses]);

  const selectedExpenses = useMemo(
    () => expenses.filter((e) => e.date === selectedDateStr),
    [expenses, selectedDateStr]
  );

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => { setCurrentDate(new Date()); setSelectedDateStr(getTodayLocal()); };

  const handleDayClick = (day: number) => {
    const d = String(day).padStart(2, '0');
    const m = String(month + 1).padStart(2, '0');
    setSelectedDateStr(`${year}-${m}-${d}`);
  };

  return (
    <div className="space-y-6 fade-in relative">
      <PasswordModal
        isOpen={modal.open}
        title="Confirmar Ação"
        description="Digite a palavra-passe do administrador."
        onConfirm={confirm}
        onCancel={closeModal}
      />

      <div className="material-panel p-5 md:p-6 flex flex-col relative transition-all duration-300">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-5">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {MONTH_NAMES[month]} <span className="text-slate-400 dark:text-slate-500 font-medium">{year}</span>
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={handlePrevMonth} aria-label="Mês anterior" className="material-btn p-1.5 rounded-lg text-slate-500 hover:text-blue-600 transition-all">
              <Icons.ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={handleToday} className="material-btn px-4 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 rounded-lg transition-all uppercase tracking-wider">
              Hoje
            </button>
            <button onClick={handleNextMonth} aria-label="Próximo mês" className="material-btn p-1.5 rounded-lg text-slate-500 hover:text-blue-600 transition-all">
              <Icons.ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-7 mb-2 border-b border-slate-100 dark:border-slate-700 pb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5 md:gap-2">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === getTodayLocal();
              const isSelected = dateStr === selectedDateStr;
              const dayExpenses = expensesByDate.get(dateStr) || [];
              const hasLate = dayExpenses.some((e) => getPaymentStatus(e).isLate);
              const hasPending = dayExpenses.some((e) => !e.received && !getPaymentStatus(e).isLate);
              const allReceived = dayExpenses.length > 0 && dayExpenses.every((e) => e.received);

              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${day} de ${MONTH_NAMES[month]}${dayExpenses.length > 0 ? `, ${dayExpenses.length} lançamentos` : ''}`}
                  onKeyDown={(e) => e.key === 'Enter' && handleDayClick(day)}
                  className={`h-16 md:h-20 p-1 md:p-1.5 flex flex-col relative transition-all duration-200 rounded-lg md:rounded-xl cursor-pointer border
                    ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 shadow-sm' : 'bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600'}
                    ${hasLate ? 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-900/20' : ''}`}
                >
                  <div className="flex justify-center items-start mt-1">
                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs md:text-sm font-bold transition-all
                      ${isToday ? 'bg-blue-600 text-white' : isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}
                      ${hasLate && !isToday && !isSelected ? 'text-red-600 dark:text-red-400' : ''}`}>
                      {day}
                    </span>
                  </div>
                  <div className="mt-auto flex justify-center gap-1 mb-1">
                    {hasLate && <span role="status" aria-label="Pagamentos atrasados" className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-500 shadow-sm animate-pulse" />}
                    {hasPending && <span role="status" aria-label="Recebimentos pendentes" className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-orange-400 shadow-sm" />}
                    {allReceived && <span role="status" aria-label="Tudo recebido" className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 shadow-sm" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <section className="material-panel p-6 md:p-8" aria-label="Lançamentos do dia">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <Icons.Calendar className="w-5 h-5" aria-hidden="true" />
          </div>
          Lançamentos do dia {formatDateBR(selectedDateStr)}
        </h3>

        {selectedExpenses.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-slate-400 font-medium">Nenhum lançamento nesta data.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedExpenses.map((ex) => {
              const status = getPaymentStatus(ex);
              const expectedDate = getExpectedDate(ex);

              return (
                <div key={ex.id} className={`bg-white dark:bg-slate-800 border shadow-sm p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition-shadow ${status.isLate ? 'border-red-300 dark:border-red-700 bg-red-50/10 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-700'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <StoreLogo storeName={ex.store} className="w-6 h-6" /> {ex.store}
                      </span>
                      <StatusBadge status={status} size="md" />
                    </div>
                    <div className="flex flex-col">
                      <p className="font-extrabold text-slate-900 dark:text-white text-2xl tracking-tight">{currency} {formatCurrency(ex.amount)}</p>
                      {!ex.received && (
                        <ExpectedDateDisplay date={formatDateBR(expectedDate)} isLate={status.isLate} isReceived={ex.received} />
                      )}
                    </div>
                    {ex.notes && <p className="text-sm text-slate-500 mt-2 italic border-l-2 border-slate-200 dark:border-slate-700 pl-2">{ex.notes}</p>}
                  </div>
                  <button
                    onClick={() => openModal(ex)}
                    aria-label={ex.received ? 'Cancelar recebimento' : 'Confirmar recebimento'}
                    className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all text-sm border ${
                      ex.received
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                        : status.isLate
                          ? 'bg-red-500 text-white border-red-600 hover:bg-red-600 shadow-md animate-pulse'
                          : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-orange-500 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30'
                    }`}
                  >
                    {ex.received ? <Icons.Check className="w-4 h-4" aria-hidden="true" /> : <Icons.AlertCircle className="w-4 h-4" aria-hidden="true" />}
                    {ex.received ? 'Confirmado' : 'Confirmar'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
