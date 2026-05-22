import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    if (
      process.env.NEXT_PUBLIC_SENTRY_DSN &&
      typeof window !== "undefined" &&
      window.Sentry &&
      typeof window.Sentry.captureException === "function"
    ) {
      window.Sentry.captureException(error, { extra: errorInfo });
    }
  }

  resetError = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[320px] w-full items-center justify-center rounded-2xl border border-white/10 bg-neutral-900/80 p-8 text-center">
          <div>
            <div className="mb-3 text-4xl">🎬</div>
            <h2 className="mb-2 text-2xl font-black text-white">Something went wrong</h2>
            <p className="mb-5 text-sm text-neutral-400">This section crashed. Try loading it again.</p>
            <button
              type="button"
              onClick={this.resetError}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
