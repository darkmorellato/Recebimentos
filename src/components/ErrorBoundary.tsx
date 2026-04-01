import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icons } from './ui/Icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
          <div className="material-panel dark:bg-slate-800 p-8 md:p-12 max-w-md w-full text-center shadow-xl">
            <div className="mx-auto w-16 h-16 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-2xl flex items-center justify-center mb-6 text-red-600 dark:text-red-400">
              <Icons.AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
              Algo deu errado
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-2 font-medium">
              Ocorreu um erro inesperado na aplicação.
            </p>
            {this.state.error && (
              <details className="text-left mb-6 mt-4">
                <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">
                  Detalhes do erro
                </summary>
                <pre className="mt-2 text-xs bg-slate-100 dark:bg-slate-900 p-3 rounded-lg overflow-auto max-h-32 text-red-600 dark:text-red-400">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              className="material-btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Icons.Undo className="w-4 h-4" />
              Tentar novamente
            </button>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold"
            >
              Recarregar a página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
