import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../lib/api";
import { formatRelative } from "./Badges";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    async function refreshWithSignal() {
      if (document.hidden) return;
      try {
        const [c, listResp] = await Promise.all([api.unreadCount(), api.listNotifications()]);
        if (!mounted || controller.signal.aborted) return;
        setCount(c.count);
        // listNotifications ahora devuelve PaginatedResponse { items, total, ... }
        setItems(Array.isArray(listResp) ? listResp : (listResp?.items || []));
      } catch (e) {
        if (e?.name !== "AbortError") console.error(e);
      }
    }
    refreshWithSignal();
    const interval = setInterval(() => {
      if (!document.hidden) refreshWithSignal();
    }, 30000);
    function onVisibilityChange() {
      if (!document.hidden) refreshWithSignal();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      mounted = false;
      controller.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleOpen() {
    setOpen((o) => !o);
    if (count > 0) {
      try {
        await api.markNotificationsRead();
        setCount(0);
        setItems((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      } catch (e) {
        console.error(e);
      }
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative rounded-lg p-2 text-tivit-ink/70 transition hover:bg-tivit-red-light hover:text-tivit-ink"
        aria-label="Notificaciones"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-tivit-red px-1 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[480px] overflow-y-auto rounded-2xl border border-black/5 bg-white shadow-xl z-50">
          <div className="sticky top-0 border-b border-black/5 bg-white p-3 text-xs font-bold uppercase tracking-wider text-tivit-ink/60">
            Notificaciones
          </div>
          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-tivit-ink/50">
              Sin notificaciones
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {items.map((n) => (
                <Link
                  key={n.id}
                  to={n.task_id ? `/portal/tasks/${n.task_id}` : "/portal"}
                  onClick={() => setOpen(false)}
                  className="block p-3 transition hover:bg-tivit-red-light/40"
                >
                  <div className="flex gap-3">
                    {n.actor && (
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ background: n.actor.avatar_color || "#dc2626" }}
                      >
                        {n.actor.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-tivit-ink">
                        {n.message}
                      </div>
                      <div className="mt-1 text-xs text-tivit-ink/50">
                        {formatRelative(n.created_at)}
                      </div>
                    </div>
                    {n.is_read === 0 && (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-tivit-red" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}