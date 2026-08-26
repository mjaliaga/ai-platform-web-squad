import { useEffect, useState } from "react";
import { CheckCircle, Circle, Trash2, Plus, Filter } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export function TodoList() {
  const { user } = useAuth();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTodos();
  }, []);

  async function loadTodos() {
    setLoading(true);
    setError("");
    try {
      const data = await api.listTodos();
      setTodos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "No se pudieron cargar las tareas");
    } finally {
      setLoading(false);
    }
  }

  async function addTodo(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    setError("");
    try {
      const created = await api.createTodo({ title: newTitle.trim() });
      setTodos((prev) => [created, ...prev]);
      setNewTitle("");
    } catch (err) {
      setError(err.message || "No se pudo crear la tarea");
    } finally {
      setSaving(false);
    }
  }

  async function toggleTodo(todo) {
    setError("");
    try {
      const updated = await api.updateTodo(todo.id, { completed: !todo.completed });
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setError(err.message || "No se pudo actualizar la tarea");
    }
  }

  async function deleteTodo(id) {
    setError("");
    try {
      await api.deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message || "No se pudo eliminar la tarea");
    }
  }

  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  const counts = {
    all: todos.length,
    active: todos.filter((t) => !t.completed).length,
    completed: todos.filter((t) => t.completed).length,
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis Tareas</h1>
        <p className="text-sm text-gray-500 mt-1">
          {counts.active} tarea{counts.active !== 1 ? "s" : ""} pendiente{counts.active !== 1 ? "s" : ""}
        </p>
      </div>

      <form onSubmit={addTodo} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Nueva tarea..."
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-tivit-red/20 focus:border-tivit-red"
          disabled={saving}
        />
        <button
          type="submit"
          disabled={saving || !newTitle.trim()}
          className="px-4 py-2.5 bg-tivit-red text-white rounded-xl text-sm font-medium hover:bg-tivit-red/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Plus size={16} />
          Agregar
        </button>
      </form>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {["all", "active", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? "bg-tivit-red text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "all" ? "Todas" : f === "active" ? "Pendientes" : "Completadas"} ({counts[f]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
      ) : filteredTodos.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <CheckCircle size={32} className="text-gray-300" />
          </div>
          <p className="text-gray-500 text-sm">
            {filter === "all"
              ? "No tienes tareas todavía"
              : filter === "active"
              ? "No tienes tareas pendientes"
              : "No tienes tareas completadas"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTodos.map((todo) => (
            <div
              key={todo.id}
              className="group flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
            >
              <button
                onClick={() => toggleTodo(todo)}
                className="flex-shrink-0 text-gray-400 hover:text-tivit-red transition-colors"
              >
                {todo.completed ? (
                  <CheckCircle size={20} className="text-tivit-red" />
                ) : (
                  <Circle size={20} />
                )}
              </button>
              <span
                className={`flex-1 text-sm ${
                  todo.completed ? "text-gray-400 line-through" : "text-gray-700"
                }`}
              >
                {todo.title}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
