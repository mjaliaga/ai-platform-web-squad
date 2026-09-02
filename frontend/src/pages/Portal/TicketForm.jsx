import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext.jsx";

export function TicketForm() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [config, setConfig] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "incidencia",
    level: 1,
    project_id: "",
    due_date: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const [projs, cfg] = await Promise.all([api.listProjects({ limit: 100 }), api.getTicketConfig()]);
        setProjects(Array.isArray(projs) ? projs : []);
        setConfig(Array.isArray(cfg) ? cfg : []);
        if (Array.isArray(projs) && projs.length > 0) {
          setForm((f) => ({ ...f, project_id: projs[0].id }));
        }
      } catch (e) {
        setError(e.message);
      }
    }
    load();
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const level1User = config.find((c) => c.level === 1);
  const level2User = config.find((c) => c.level === 2);
  const selectedLevelUser = form.level === 1 ? level1User : level2User;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("El título es requerido");
      return;
    }
    if (!form.project_id) {
      setError("Debes seleccionar un proyecto");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
        category: form.category,
        level: Number(form.level),
        project_id: form.project_id,
        due_date: form.due_date || null,
      };
      const created = await api.createTicket(payload);
      const ticketId = created?.ticket?.id || created?.id;
      toast.success(`Ticket ${created?.ticket?.code || created?.code} creado — asignado a ${selectedLevelUser ? selectedLevelUser.user_name : form.level === 1 ? "Nivel 1" : "Nivel 2"}`);
      navigate(`/portal/tickets/${ticketId}`);
    } catch (err) {
      setError(err.message || "No se pudo crear el ticket");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/portal/tickets" className="inline-flex items-center gap-1.5 text-xs font-semibold text-tivit-red hover:underline mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Tickets
      </Link>
      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-tivit-ink">Nuevo Ticket</h1>
        <p className="mt-1 text-sm text-tivit-ink/60">
          Asociado a un proyecto de tu portfolio. Nivel 1 contacta a {level1User ? `${level1User.user_name} (${level1User.user_email})` : "Manuel Aliaga"} · Nivel 2 a {level2User ? `${level2User.user_name} (${level2User.user_email})` : "Sergio Aguas"}.
          Se notificará por in-app y email (Brevo si está configurado).
        </p>

        {error && <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-tivit-ink">Proyecto *</label>
            <select
              value={form.project_id}
              onChange={(e) => update("project_id", e.target.value)}
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm"
              required
            >
              <option value="">Seleccionar proyecto...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-tivit-ink/40">Ej: si se cayó {projects.find((p) => p.id === form.project_id)?.name || "un proyecto"}.</p>
          </div>

          <div>
            <label className="text-sm font-medium text-tivit-ink">Título *</label>
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Ej: Caída de servicio en producción"
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm"
              required
              maxLength={200}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-tivit-ink">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Describe el incidente, pasos para reproducir, impacto..."
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm min-h-[100px]"
              maxLength={5000}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-tivit-ink">Nivel *</label>
              <select value={form.level} onChange={(e) => update("level", Number(e.target.value))} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm">
                <option value={1}>Nivel 1 — {level1User?.user_name || "Manuel Aliaga"}</option>
                <option value={2}>Nivel 2 — {level2User?.user_name || "Sergio Aguas"}</option>
              </select>
              <p className="mt-1 text-xs text-tivit-ink/40">Asignado a: {selectedLevelUser?.user_email || (form.level === 1 ? "manuel.aliaga@tivit.com" : "sergio.aguas@tivit.com")}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-tivit-ink">Prioridad</label>
              <select value={form.priority} onChange={(e) => update("priority", e.target.value)} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm">
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Crítica</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-tivit-ink">Categoría</label>
              <select value={form.category} onChange={(e) => update("category", e.target.value)} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm">
                <option value="incidencia">Incidencia</option>
                <option value="solicitud">Solicitud</option>
                <option value="consulta">Consulta</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-tivit-ink">Vencimiento (opcional)</label>
            <input type="date" value={form.due_date} onChange={(e) => update("due_date", e.target.value)} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link to="/portal/tickets" className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-medium">
              Cancelar
            </Link>
            <button type="submit" disabled={saving} className="rounded-xl bg-tivit-red px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? "Creando..." : "Crear ticket"}
            </button>
          </div>

          <p className="text-xs text-tivit-ink/40">Reportado por: {user?.name} ({user?.email})</p>
        </form>
      </div>
    </div>
  );
}
