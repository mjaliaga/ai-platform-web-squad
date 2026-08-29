import { Component } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Centralized logging hook — replace with your monitoring service
    // (Sentry, Datadog, LogRocket, etc.) when ready.
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, errorInfo } = this.state;
    const isDev = import.meta.env.DEV;

    return (
      <div className="min-h-screen flex items-center justify-center bg-tivit-red-light/30 p-6">
        <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg p-8 border border-alert/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-alert/10 p-3">
              <AlertTriangle className="h-6 w-6 text-alert" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-tivit-ink">
                Algo salió mal
              </h1>
              <p className="text-sm text-tivit-ink/60">
                La aplicación encontró un error inesperado.
              </p>
            </div>
          </div>

          {isDev && error && (
            <details className="mb-6 rounded-lg bg-tivit-ink/5 p-4 text-sm">
              <summary className="cursor-pointer font-medium text-tivit-ink/80">
                Detalle del error (sólo desarrollo)
              </summary>
              <pre className="mt-3 overflow-auto text-xs text-tivit-red-dark">
                {error.toString()}
                {errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-lg bg-tivit-red px-4 py-2 text-sm font-semibold text-white hover:bg-tivit-red-dark transition"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 rounded-lg border border-tivit-red px-4 py-2 text-sm font-semibold text-tivit-red hover:bg-tivit-red-light transition"
            >
              <RefreshCw className="h-4 w-4" />
              Recargar página
            </button>
            <button
              type="button"
              onClick={this.handleHome}
              className="inline-flex items-center gap-2 rounded-lg border border-tivit-ink/20 px-4 py-2 text-sm font-semibold text-tivit-ink/70 hover:bg-tivit-ink/5 transition"
            >
              <Home className="h-4 w-4" />
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
