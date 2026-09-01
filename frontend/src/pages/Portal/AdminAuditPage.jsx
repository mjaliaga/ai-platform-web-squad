import { useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Filter, Clock, User, AlertTriangle, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { formatDateTime } from "./components/Badges";

const EVENT_LABELS = {
  login_success: { label: "Login OK", color: "bg-green-100 text-green-700" },
  login_failure: { label: "Login fallo", color: "bg-red-100 text-red-700" },
  logout: { label: "Logout", color: "bg-gray-100 text-gray-600" },
  role_change: { label: "Cambio rol", color: "bg-purple-100 text-purple-700" },
  user_deactivated: { label: "Usuario desactivado", color: "bg-amber-100 text-amber-700" },
  password_change: { label: "Cambio clave", color: "bg-blue-100 text-blue-700" },
  created: { label: "Creado", color: "bg-green-100 text-green-700" },
  updated: { label: "Editado", color: "bg-blue-100 text-blue-700" },
  deleted: { label: "Eliminado", color: "bg-red-100 text-red-700" },
  published: { label: "Publicado", color: "bg-emerald-100 text-emerald-700" },
};

export function AdminAuditPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState("security"); // security | content

  const isAdmin = user?.role === "admin";

  const securityQuery = useQuery({
    queryKey: ["admin", "audit", "security", filter],
    queryFn: () => api.listSecurityAudit(filter ? { event_type: filter, limit: 200 } : { limit: 200 }),
    enabled: isAdmin && tab === "security",
  });

  const contentQuery = useQuery({
    queryKey: ["admin", "audit", "content", tab],
    queryFn: () => api.listContentAudit({ limit: 200 }),
    enabled: isAdmin && tab === "content",
  });

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-alert/20 bg-alert/5 p-8 text-center">
        <Shield className="mx-auto h-8 w-8 text-alert" />
        <h2 className="mt-3 text-lg font-bold text-alert">Solo administradores</h2>
        <p className="mt-1 text-sm text-alert/80">Tu rol es <strong>{user?.role}</strong>. Solo admin puede ver auditoría de seguridad.</p>
        <Link to="/portal" className="mt-4 inline-flex rounded-lg bg-tivit-red px-4 py-2 text-sm font-semibold text-white">Volver</Link>
      </div>
    );
  }

  const secItems = Array.isArray(securityQuery.data) ? securityQuery.data : (securityQuery.data?.items || []);
  const contentItems = Array.isArray(contentQuery.data) ? contentQuery.data : (contentQuery.data?.items || []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-tivit-ink">
          <Shield className="h-6 w-6 text-tivit-red" /> Auditoría
        </h1>
        <p className="mt-1 text-sm text-tivit-ink/55">Logs de seguridad y contenido. Solo visible para <strong>admin</strong> vía <code className="rounded bg-tivit-ink/5 px-1">/portal/admin/audit</code> (no linkeado en sitio público).</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab("security")} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === "security" ? "bg-tivit-red text-white" : "border border-black/10 text-tivit-ink hover:bg-tivit-red-light"}`}>Seguridad</button>
        <button onClick={() => setTab("content")} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === "content" ? "bg-tivit-red text-white" : "border border-black/10 text-tivit-ink hover:bg-tivit-red-light"}`}>Contenido</button>
      </div>

      {tab === "security" && (
        <>
          <div className="flex items-center gap-2 rounded-2xl border border-black/5 bg-white p-3 shadow-sm">
            <Filter className="h-4 w-4 text-tivit-ink/45" />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-black/10 px-3 py-1.5 text-sm focus:border-tivit-red focus:outline-none">
              <option value="">Todos los eventos</option>
              <option value="login_success">Login OK</option>
              <option value="login_failure">Login fallo</option>
              <option value="logout">Logout</option>
              <option value="role_change">Cambio rol</option>
              <option value="user_deactivated">Usuario desactivado</option>
              <option value="password_change">Cambio clave</option>
            </select>
            <span className="ml-auto text-xs text-tivit-ink/45">{secItems.length} eventos</span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
            {securityQuery.isLoading ? (
              <div className="p-8 text-center text-sm text-tivit-ink/45">Cargando…</div>
            ) : secItems.length === 0 ? (
              <div className="p-8 text-center text-sm text-tivit-ink/45">Sin eventos.</div>
            ) : (
              <ul className="divide-y divide-black/5">
                {secItems.map((e) => {
                  const meta = EVENT_LABELS[e.event_type] || { label: e.event_type, color: "bg-tivit-ink/5 text-tivit-ink/70" };
                  return (
                    <li key={e.id} className="flex items-start gap-3 p-4">
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${meta.color}`}>{meta.label}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-tivit-ink">
                          <span className="font-mono text-xs text-tivit-ink/60">{e.user_id || e.actor_id || "—"}</span>
                          {e.details && <span className="ml-2 text-xs text-tivit-ink/55">· {e.details}</span>}
                          {!e.success && <span className="ml-2 inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700"><AlertTriangle className="h-3 w-3" />Fallo</span>}
                          {e.success && e.event_type.includes("success") && <span className="ml-2 inline-flex items-center gap-1 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700"><CheckCircle className="h-3 w-3" />OK</span>}
                        </p>
                        <p className="mt-0.5 flex flex-wrap gap-2 text-xs text-tivit-ink/45">
                          {e.ip_address && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{e.ip_address}</span>}
                          {e.user_agent && <span className="truncate max-w-[20rem]">{e.user_agent}</span>}
                        </p>
                      </div>
                      <time className="shrink-0 text-xs text-tivit-ink/45" title={formatDateTime(e.created_at)}>{formatDateTime(e.created_at)}</time>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}

      {tab === "content" && (
        <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
          {contentQuery.isLoading ? (
            <div className="p-8 text-center text-sm text-tivit-ink/45">Cargando…</div>
          ) : contentItems.length === 0 ? (
            <div className="p-8 text-center text-sm text-tivit-ink/45">Sin actividad de contenido.</div>
          ) : (
            <ul className="divide-y divide-black/5">
              {contentItems.map((entry) => {
                const meta = EVENT_LABELS[entry.action] || { label: entry.action, color: "bg-tivit-ink/5 text-tivit-ink/70" };
                return (
                  <li key={entry.id} className="flex items-start gap-3 p-4">
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${meta.color}`}>{meta.label}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-tivit-ink">
                        <span className="font-semibold flex inline items-center gap-1"><User className="h-3 w-3" />{entry.actor_name || entry.actor_id || "—"}</span>{" "}
                        {entry.action} <Link to={`/portal/cms/${entry.collection}/${entry.slug}`} className="font-mono text-tivit-red hover:underline">{entry.collection}/{entry.slug}</Link>
                      </p>
                      {entry.details && <p className="mt-0.5 text-xs text-tivit-ink/55">{entry.details}</p>}
                    </div>
                    <time className="shrink-0 text-xs text-tivit-ink/45" title={formatDateTime(entry.created_at)}>{formatDateTime(entry.created_at)}</time>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
