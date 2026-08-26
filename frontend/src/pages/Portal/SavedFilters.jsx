import { useEffect, useState } from "react";
import { Plus, Search, Bookmark, Trash2, Edit3, X, Play, Save } from "lucide-react";
import { api } from "../../lib/api";

const FIELD_HINTS = [
  "status = \"done\"",
  "assignee = currentUser()",
  "priority = \"high\"",
  "story_points >= 5",
  "epic = \"epic-id\"",
];

export function SavedFilters() {
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFilter, setEditingFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadFilters();
  }, []);

  async function loadFilters() {
    setLoading(true);
    try {
      const data = await api.listSavedFilters();
      setFilters(data);
    } catch (err) {
      console.error("Error loading filters:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(payload) {
    try {
      if (editingFilter) {
        await api.updateSavedFilter(editingFilter.id, payload);
      } else {
        await api.createSavedFilter(payload);
      }
      setShowForm(false);
      setEditingFilter(null);
      await loadFilters();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  async function handleDelete(filter) {
    if (!confirm(`¿Eliminar el filtro "${filter.name}"?`)) return;
    try {
      await api.deleteSavedFilter(filter.id);
      await loadFilters();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  async function handleSearch(e) {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await api.searchTasks(searchQuery, 50, 0);
      setSearchResults(results);
    } catch (err) {
      alert("Error: " + err.message);
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  }

  async function executeFilter(filter) {
    setSearching(true);
    try {
      const results = await api.executeSavedFilter(filter.id);
      setSearchResults(results);
      setSearchQuery(filter.query);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSearching(false);
    }
  }

  if (loading) {
    return <div className="text-center text-gray-500 py-12">Cargando filtros...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-indigo-600" />
          Filtros guardados
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Búsquedas guardadas con sintaxis JQL
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Ej: status = "done" AND assignee = currentUser()'
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {searching ? "Buscando..." : "Buscar"}
          </button>
          <button
            type="button"
            onClick={() => { setEditingFilter(null); setShowForm(true); }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="text-xs text-gray-500">Ejemplos:</span>
          {FIELD_HINTS.map((hint) => (
            <button
              key={hint}
              type="button"
              onClick={() => setSearchQuery(hint)}
              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 font-mono"
            >
              {hint}
            </button>
          ))}
        </div>
      </form>

      {/* Search results */}
      {searchResults && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">
              Resultados ({searchResults.length})
            </h2>
            <button
              onClick={() => setSearchResults(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {searchResults.length === 0 ? (
            <p className="text-sm text-gray-500">No se encontraron tareas</p>
          ) : (
            <div className="space-y-2">
              {searchResults.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                  <span className="text-xs font-mono text-gray-500">{task.code}</span>
                  <span className="flex-1 text-sm text-gray-900">{task.title}</span>
                  <span className={`px-2 py-0.5 text-xs rounded ${
                    task.status === "done" ? "bg-green-100 text-green-700" :
                    task.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {task.status}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded ${
                    task.priority === "urgent" ? "bg-red-100 text-red-700" :
                    task.priority === "high" ? "bg-orange-100 text-orange-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Saved filters list */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Mis filtros</h2>
        {filters.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <Bookmark className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">No hay filtros guardados</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filters.map((f) => (
              <div
                key={f.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 flex-1">{f.name}</h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => executeFilter(f)}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                      title="Ejecutar"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setEditingFilter(f); setShowForm(true); }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(f)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <code className="block text-xs font-mono text-gray-600 bg-gray-50 p-2 rounded">
                  {f.query}
                </code>
                {f.is_shared === 1 && (
                  <span className="inline-block mt-2 text-xs text-green-600">Compartido</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <FilterForm
          filter={editingFilter}
          initialQuery={searchQuery}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingFilter(null); }}
        />
      )}
    </div>
  );
}

function FilterForm({ filter, initialQuery, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: filter?.name || "",
    query: filter?.query || initialQuery || "",
    is_shared: filter?.is_shared === 1,
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.query.trim()) {
      alert("Nombre y query son requeridos");
      return;
    }
    onSave(formData);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">{filter ? "Editar filtro" : "Nuevo filtro"}</h2>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Query (JQL) *</label>
            <textarea
              value={formData.query}
              onChange={(e) => setFormData({ ...formData, query: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              placeholder='status = "done" AND priority = "high"'
              required
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_shared}
              onChange={(e) => setFormData({ ...formData, is_shared: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Compartir con el equipo</span>
          </label>
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
              {filter ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
