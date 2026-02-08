
import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

class RootErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    isChunkError: false
  };

  static getDerivedStateFromError(error: Error): State {
    // Detect chunk loading errors which are common in preview environments
    const isChunkError = error.message?.includes('Failed to fetch dynamically imported module') || 
                         error.message?.includes('Importing a module script failed') ||
                         error.name === 'ChunkLoadError';
    return { hasError: true, error, isChunkError };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  handleRefresh = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      } catch (e) {
        console.warn('Failed to unregister SW (safe to ignore)', e);
      }
    }
    // Force reload from server, ignoring cache
    window.location.reload();
  };

  handleGoHome = async () => {
    if (this.state.isChunkError && 'serviceWorker' in navigator) {
       try {
         const registrations = await navigator.serviceWorker.getRegistrations();
         for (const registration of registrations) await registration.unregister();
       } catch (e) {
         console.warn('SW unregister error during home nav', e);
       }
    }
    window.location.hash = '/'; 
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)] p-6 text-center">
          <div className="glass-panel max-w-md w-full p-8 rounded-[var(--radius-xl)] animate-fade-in shadow-xl">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-soft">
              <svg className="w-10 h-10 text-[var(--color-error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {this.state.isChunkError ? (
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                ) : (
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                )}
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
                {this.state.isChunkError ? "Update Available" : "Oops! Something went wrong"}
            </h1>
            <p className="text-[var(--color-text-secondary)] mb-6 text-sm">
              {this.state.isChunkError 
                ? "A new version of the app is available. Please reload to apply updates."
                : "We encountered an unexpected error. Don't worry, your data is safe in the database."}
            </p>
            
            {this.state.error && !this.state.isChunkError && (
              <div className="bg-gray-100 p-3 rounded-lg mb-6 text-left overflow-auto max-h-32 border border-gray-200">
                <code className="text-xs text-red-600 font-mono">
                  {this.state.error.message}
                </code>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={this.handleGoHome}
                className="px-4 py-2.5 bg-white border border-[var(--color-border)] text-[var(--color-text)] font-semibold rounded-xl hover:bg-gray-50 transition-all active:scale-95"
              >
                Go Home
              </button>
              <button
                onClick={this.handleRefresh}
                className="px-4 py-2.5 bg-[var(--color-primary)] text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg transition-all active:scale-95"
              >
                {this.state.isChunkError ? "Reload App" : "Try Again"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default RootErrorBoundary;
