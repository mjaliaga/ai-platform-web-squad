import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: "bg-tivit-ink border-tivit-green/40 text-white",
  error: "bg-alert/95 border-alert text-white",
  warning: "bg-tivit-red-dark border-tivit-red text-white",
  info: "bg-tivit-ink/95 border-tivit-ink/40 text-white",
};

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (type, message, options = {}) => {
      const id = ++toastId;
      const ttl = options.ttl ?? (type === "error" ? 6000 : 3500);
      setToasts((prev) => [...prev, { id, type, message, ttl }]);
      if (ttl > 0) {
        setTimeout(() => dismiss(id), ttl);
      }
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      success: (msg, opts) => show("success", msg, opts),
      error: (msg, opts) => show("error", msg, opts),
      warning: (msg, opts) => show("warning", msg, opts),
      info: (msg, opts) => show("info", msg, opts),
      dismiss,
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div
              key={t.id}
              role="status"
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg animate-in fade-in slide-in-from-right-4 ${STYLES[t.type]}`}
            >
              <Icon className="h-5 w-5 mt-0.5 shrink-0" />
              <p className="flex-1 text-sm leading-snug break-words">
                {t.message}
              </p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Cerrar"
                className="text-current opacity-70 hover:opacity-100 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }
  return ctx;
}

export default ToastProvider;
