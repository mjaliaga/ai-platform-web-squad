import { useEffect, useState } from "react";
import { Plus, Target, Calendar, User, Edit3, Trash2, X, ChevronRight } from "lucide-react";
import { api } from "../../lib/api";
import { UserAvatar, formatDate, StatusBadge } from "./components/Badges";

const EPIC_STATUSES = {
  open: { label: "Abierto", color: "bg-gray-100 text-gray-700" },
  in_progress: { label: "En curso", color: "bg-blue-100 text-blue-700" },
  done: { label: "Completado", color: "bg-green-100 text-green-700" },
};

const EPIC_COLORS = [
  "#dc2626", "#2563eb", "#16a34a", "#9333ea",
  "#ea580c", "#0891b2", "#db2777", "#65a30d",
];

export default function Epics() {
  const [epics, setEpics] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEpic, setEditingEpic] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [epicsData, projectsData] = await Promise.all([
        api.listEpics(),
        api.listProjects(),
      ]);
      setEpics(epicsData);
      setProjects(projectsData);
    } catch (err) {
      console.error("Error loading epics:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(formData) {
    try {
      if (editingEpic) {
        await api.updateEpic(editingEpic.id, formData);
      } else {
        await api.createEpic(formData);
      }
      setShowForm(false);
      setEditingEpic(null);
      await loadData();
    } catch (err) {
      alert("Error al guardar: " + err.message);
    }
  }

  async function handleDelete(epic) {
    if (!confirm(`¿Eliminar el epic "${epic.name}"? Las tareas asociadas se desacoplarán.`)) return;
    try {
      await api.deleteEpic(epic.id);
      await loadData();
    } catch (err) {
      alert("Error al eliminar: " + err.message);
    }
  }

  const filteredEpics = epics.filter((e) => {
    if (filter === "all") return true;
    return e.epic.status === filter;
  });

  if (loading) {
    return <div className="text-center text-gray-500 py-12">Cargando epics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-600" />
            Epics
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Agrupa tareas relacionadas en objetivos de mayor alcance
          </p>
        </div>
        <button
          onClick={() => { setEditingEpic(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus className="w-4 h-4" />
          Nuevo Epic
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { key: "all", label: "Todos" },
          { key: "open", label: "Abiertos" },
          { key: "in_progress", label: "En curso" },
          { key: "done", label: "Completados" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-sm rounded-full transition ${
              filter === f.key
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Epic cards */}
      {filteredEpics.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <Target className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No hay epics {filter !== "all" ? `con estado "${EPIC_STATUSES[filter]?.label}"` : ""}</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            Crear el primero
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEpics.map((item) => {
            const { epic, owner, task_count, done_count } = item;
            const status = EPIC_STATUSES[epic.status] || EPIC_STATUSES.open;
            const progress = task_count > 0 ? Math.round((done_count / task_count) * 100) : 0;
            const project = projects.find((p) => p.id === epic.project_id);

            return (
              <div
                key={epic.id}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition group"
                style={{ borderLeft: `4px solid ${epic.color || "#6366f1"}` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 flex-1">{epic.name}</h3>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => { setEditingEpic(epic); setShowForm(true); }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(epic)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {epic.summary && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{epic.summary}</p>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                  {project && (
                    <span className="text-xs text-gray-500">en {project.name}</span>
                  )}
                </div>

                {task_count > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{done_count} / {task_count} tareas</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-indigo-600 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    {owner && (
                      <div className="flex items-center gap-1">
                        <UserAvatar user={owner} size="xs" />
                      </div>
                    )}
                    {epic.due_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(epic.due_date)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <EpicForm
          epic={editingEpic}
          projects={projects}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingEpic(null); }}
        />
      )}
    </div>
  );
}

function EpicForm({ epic, projects, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: epic?.name || "",
    summary: epic?.summary || "",
    color: epic?.color || "#6366f1",
    owner_id: epic?.owner_id || "",
    project_id: epic?.project_id || "",
    start_date: epic?.start_date || "",
    due_date: epic?.due_date || "",
    status: epic?.status || "open",
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.listUsers({ limit: 100 }).then((d) => setUsers(d.users || d || [])).catch(() => {});
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("El nombre es requerido");
      return;
    }
    onSave({
      ...formData,
      owner_id: formData.owner_id || null,
      project_id: formData.project_id || null,
      start_date: formData.start_date || null,
      due_date: formData.due_date || null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">{epic ? "Editar Epic" : "Nuevo Epic"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resumen</label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proyecto</label>
              <select
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">— Sin proyecto —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
              <select
                value={formData.owner_id}
                onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">— Sin asignar —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vencimiento</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex gap-2">
              {EPIC_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === c ? "border-gray-900" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          {epic && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {Object.entries(EPIC_STATUSES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {epic ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
