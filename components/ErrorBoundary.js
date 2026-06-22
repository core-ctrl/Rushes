import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Extract file info from stack if possible
    const stack = error.stack || '';
    let fileMatch = stack.match(/at\s+.*?\((.*?):\d+:\d+\)/);
    let file = fileMatch ? fileMatch[1] : 'Unknown';
    
    fetch('/api/report-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: errorInfo.componentStack || error.stack,
        file,
        url: window.location.href,
        source: 'client'
      })
    }).catch(err => console.error('Failed to report error:', err));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slateDark flex flex-col items-center justify-center text-white p-4 text-center font-sans">
          <h1 className="text-3xl font-bold text-rose-500 mb-4">Something went wrong.</h1>
          <p className="text-slate-400 mb-6 max-w-md">
            Our self-healing AI agent has been notified and is analyzing the issue. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
