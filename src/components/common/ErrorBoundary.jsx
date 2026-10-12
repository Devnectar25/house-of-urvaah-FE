import React from 'react';
import { sendErrorReport } from '../../services/errorTracker';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Send error report to the database
    sendErrorReport({
      errorMessage: error?.message || 'React Component Render Crash',
      errorName: error?.name || 'ReactRenderError',
      errorStack: error?.stack || '',
      errorType: 'ui',
      severity: 'fatal',
      url: typeof window !== 'undefined' ? window.location.href : '',
      componentStack: errorInfo?.componentStack || ''
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6 bg-neutral-50/50">
          <div className="max-w-md w-full bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-6 text-center font-sans">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h2 className="text-base font-semibold text-neutral-900 mb-1">
              Something went wrong
            </h2>
            <p className="text-xs text-neutral-500 mb-5 leading-relaxed">
              An unexpected error occurred while rendering this section. Our monitoring system has automatically logged this incident.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 text-left p-3 rounded-lg bg-neutral-900 text-rose-300 font-mono text-[11px] overflow-x-auto max-h-36">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-lg border border-neutral-200 transition-all cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
