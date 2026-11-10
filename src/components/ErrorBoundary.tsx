import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
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
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white">
          <div className="max-w-md w-full bg-slate-800/90 border border-white/10 rounded-2xl p-6 text-center shadow-2xl backdrop-blur-md">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-xl font-bold mb-2">
              {this.props.fallbackTitle || 'Something went wrong'}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {this.props.fallbackMessage || 'An unexpected rendering error occurred. You can reload the page or return to the dashboard.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-[#0A1C37] font-semibold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <RefreshCw size={14} />
                Reload Page
              </button>
              <a
                href="/crm"
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs rounded-xl transition-all cursor-pointer"
              >
                <Home size={14} />
                Go to CRM
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

