import React from 'react';
import { ViewType } from '../../utils/types';
import { Icons } from './Icons';

interface NavigationTabsProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  variant: 'desktop' | 'mobile';
}

const VIEW_CONFIG: Record<ViewType, { icon: React.FC<{ className?: string }>; label: string; mobileLabel: string }> = {
  dashboard: { icon: Icons.Home, label: 'Home', mobileLabel: 'Início' },
  calendar: { icon: Icons.Calendar, label: 'Calendário', mobileLabel: 'Calendário' },
  analytics: { icon: Icons.Chart, label: 'Análise', mobileLabel: 'Análise' },
  payments_report: { icon: Icons.FileSpreadsheet, label: 'Relatório', mobileLabel: 'Relatório' },
};

const VIEWS: ViewType[] = ['dashboard', 'calendar', 'analytics', 'payments_report'];

export const NavigationTabs: React.FC<NavigationTabsProps> = ({ currentView, onNavigate, variant }) => {
  if (variant === 'mobile') {
    return (
      <nav aria-label="Navegação principal" className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-[80] flex justify-around items-center p-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {VIEWS.map((view) => {
          const { icon: Icon, mobileLabel } = VIEW_CONFIG[view];
          const isActive = currentView === view;
          return (
            <button
              key={view}
              onClick={() => onNavigate(view)}
              aria-label={mobileLabel}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center w-16 p-1 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <div className={`p-1.5 rounded-full ${isActive ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-bold mt-0.5">{mobileLabel}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Navegação" className="hidden md:flex items-center gap-2 ml-4 border-l border-slate-200 dark:border-slate-700 pl-4">
      {VIEWS.map((view) => {
        const { icon: Icon, label } = VIEW_CONFIG[view];
        const isActive = currentView === view;
        return (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            aria-current={isActive ? 'page' : undefined}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-bold text-sm ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        );
      })}
    </nav>
  );
};
