import { useState, useRef } from "react";
import {
  CheckCircle,
  Circle,
  Trash2,
  Plus,
  Filter,
  Calendar,
  AlertCircle,
  GripVertical,
  X,
  ChevronDown,
  Tag,
  Clock,
  CheckSquare,
  Square,
} from "lucide-react";
import { useTodos, useCreateTodo, useUpdateTodo, useDeleteTodo, useClearCompletedTodos, useReorderTodos } from "../../lib/queries";

const PRIORITIES = [
  { value: "low", label: "Baja", color: "text-green-600 bg-green-50 border-green-200" },
  { value: "medium", label: "Media", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  { value: "high", label: "Alta", color: "text-orange-600 bg-orange-50 border-orange-200" },
  { value: "urgent", label: "Urgente", color: "text-red-600 bg-red-50 border-red-200" },
];

const CATEGORIES = [
  { value: "general", label: "General", color: "bg-gray-100 text-gray-700" },
  { value: "work", label: "Trabajo", color: "bg-blue-100 text-blue-700" },
  { value: "personal", label: "Personal", color: "bg-purple-100 text-purple-700" },
  { value: "meeting", label: "Reunión", color: "bg-amber-100 text-amber-700" },
];

const FILTERS = ["all", "active", "completed"];

function formatDueDate(dateStr) {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Hoy";
    if (date.toDateString() === tomorrow.toDateString()) return "Mañana";
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  } catch {
    return null;
  }
}

function isOverdue(dueDate, completed) {
  if (!dueDate || completed) return false;
  try {
    const date = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  } catch {
    return false;
  }
}

function getPriorityInfo(priority) {
  return PRIORITIES.find((p) => p.value === priority) || PRIORITIES[1];
}

function getCategoryInfo(category) {
  return CATEGORIES.find((c) => c.value === category) || CATEGORIES[0];
}

export function TodoList() {
  const { data: todos = [], isLoading, error, refetch } = useTodos();
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const clearCompleted = useClearCompletedTodos();
  const reorderTodos = useReorderTodos();

  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [draggedId, setDraggedId] = useState(null);

  const [newTodo, setNewTodo] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium",
    category: "general",
  });

  const [editForm, setEditForm] = useState({});

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

  const overdueCount = todos.filter((t) => !t.completed && isOverdue(t.due_date, t.completed)).length;

  async function handleCreate(e) {
    e.preventDefault();
    if (!newTodo.title.trim()) return;

    try {
      await createTodo.mutateAsync({
        title: newTodo.title.trim(),
        description: newTodo.description || null,
        due_date: newTodo.due_date || null,
        priority: newTodo.priority,
        category: newTodo.category,
      });
      setNewTodo({ title: "", description: "", due_date: "", priority: "medium", category: "general" });
      setShowForm(false);
    } catch (err) {
      console.error("Error creating todo:", err);
    }
  }

  async function handleToggle(todo) {
    try {
      await updateTodo.mutateAsync({ id: todo.id, payload: { completed: !todo.completed } });
    } catch (err) {
      console.error("Error toggling todo:", err);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteTodo.mutateAsync(id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      console.error("Error deleting todo:", err);
    }
  }

  async function handleUpdate(id) {
    try {
      await updateTodo.mutateAsync({ id, payload: editForm });
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      console.error("Error updating todo:", err);
    }
  }

  async function handleClearCompleted() {
    try {
      await clearCompleted.mutateAsync();
      setSelectedIds(new Set());
      setShowClearConfirm(false);
    } catch (err) {
      console.error("Error clearing completed:", err);
    }
  }

  function handleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSelectAll() {
    if (selectedIds.size === filteredTodos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTodos.map((t) => t.id)));
    }
  }

  async function handleBulkDelete() {
    try {
      for (const id of selectedIds) {
        await deleteTodo.mutateAsync(id);
      }
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Error deleting selected:", err);
    }
  }

  async function handleBulkComplete() {
    try {
      for (const id of selectedIds) {
        const todo = todos.find((t) => t.id === id);
        if (todo && !todo.completed) {
          await updateTodo.mutateAsync({ id, payload: { completed: true } });
        }
      }
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Error completing selected:", err);
    }
  }

  function startEdit(todo) {
    setEditingId(todo.id);
    setEditForm({
      title: todo.title,
      description: todo.description || "",
      due_date: todo.due_date || "",
      priority: todo.priority,
      category: todo.category,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  function handleDragStart(e, id) {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e, id) {
    e.preventDefault();
    if (!draggedId || draggedId === id) return;

    const newTodos = [...todos];
    const draggedIndex = newTodos.findIndex((t) => t.id === draggedId);
    const overIndex = newTodos.findIndex((t) => t.id === id);

    if (draggedIndex === -1 || overIndex === -1) return;

    const [draggedItem] = newTodos.splice(draggedIndex, 1);
    newTodos.splice(overIndex, 0, draggedItem);

    const orderedIds = newTodos.map((t) => t.id);
    reorderTodos.mutate(orderedIds);
  }

  function handleDragEnd() {
    setDraggedId(null);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Tareas</h1>
            <p className="text-sm text-gray-500 mt-1">
              {counts.active} pendiente{counts.active !== 1 ? "s" : ""}
              {overdueCount > 0 && (
                <span className="text-red-500 ml-2">· {overdueCount} vencida{overdueCount !== 1 ? "s" : ""}</span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-tivit-red text-white rounded-xl text-sm font-medium hover:bg-tivit-red/90 flex items-center gap-2"
          >
            <Plus size={16} />
            Nueva Tarea
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 p-4 bg-white border border-gray-200 rounded-xl">
          <div className="space-y-3">
            <input
              type="text"
              value={newTodo.title}
              onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
              placeholder="Título de la tarea..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-tivit-red/20 focus:border-tivit-red"
              autoFocus
            />
            <textarea
              value={newTodo.description}
              onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
              placeholder="Descripción (opcional)..."
              className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-tivit-red/20 focus:border-tivit-red"
              rows={2}
            />
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <input
                  type="date"
                  value={newTodo.due_date}
                  onChange={(e) => setNewTodo({ ...newTodo, due_date: e.target.value })}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-tivit-red/20"
                />
              </div>
              <select
                value={newTodo.priority}
                onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value })}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-tivit-red/20"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <select
                value={newTodo.category}
                onChange={(e) => setNewTodo({ ...newTodo, category: e.target.value })}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-tivit-red/20"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!newTodo.title.trim() || createTodo.isPending}
              className="px-4 py-2 bg-tivit-red text-white rounded-xl text-sm font-medium hover:bg-tivit-red/90 disabled:opacity-50"
            >
              {createTodo.isPending ? "Guardando..." : "Crear Tarea"}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
          <AlertCircle size={16} />
          Error al cargar las tareas
          <button onClick={() => refetch()} className="ml-auto underline">Reintentar</button>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {FILTERS.map((f) => (
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
        <div className="flex-1" />
        {counts.completed > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-red-500 flex items-center gap-1"
          >
            <Trash2 size={14} />
            Limpiar completadas
          </button>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-4 p-3 bg-tivit-red/10 border border-tivit-red/20 rounded-xl flex items-center gap-3">
          <span className="text-sm text-tivit-red font-medium">
            {selectedIds.size} seleccionada{selectedIds.size !== 1 ? "s" : ""}
          </span>
          <div className="flex-1" />
          <button
            onClick={handleBulkComplete}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
          >
            Completar
          </button>
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
          >
            Eliminar
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {isLoading ? (
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
          {filteredTodos.length > 1 && (
            <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-400">
              <button onClick={handleSelectAll} className="hover:text-gray-600">
                {selectedIds.size === filteredTodos.length ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
              <span>Marcar todas</span>
            </div>
          )}
          {filteredTodos.map((todo) => {
            const priority = getPriorityInfo(todo.priority);
            const category = getCategoryInfo(todo.category);
            const overdue = isOverdue(todo.due_date, todo.completed);
            const dueFormatted = formatDueDate(todo.due_date);
            const isEditing = editingId === todo.id;
            const isDragging = draggedId === todo.id;

            return (
              <div
                key={todo.id}
                draggable={!isEditing}
                onDragStart={(e) => handleDragStart(e, todo.id)}
                onDragOver={(e) => handleDragOver(e, todo.id)}
                onDragEnd={handleDragEnd}
                className={`group flex items-start gap-3 px-4 py-3 bg-white border rounded-xl transition-all ${
                  isDragging ? "opacity-50 border-tivit-red" : "border-gray-100 hover:border-gray-200"
                } ${todo.completed ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-1 pt-0.5">
                  <button
                    onClick={() => handleSelect(todo.id)}
                    className="text-gray-300 hover:text-gray-500"
                  >
                    {selectedIds.has(todo.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </div>

                <button
                  onClick={() => handleToggle(todo)}
                  className="flex-shrink-0 text-gray-400 hover:text-tivit-red transition-colors mt-0.5"
                >
                  {todo.completed ? (
                    <CheckCircle size={20} className="text-tivit-red" />
                  ) : (
                    <Circle size={20} />
                  )}
                </button>

                <div
                  className="flex-shrink-0 text-gray-300 hover:text-gray-500 cursor-grab mt-0.5"
                >
                  <GripVertical size={16} />
                </div>

                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-tivit-red/20"
                        autoFocus
                      />
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Descripción..."
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-tivit-red/20"
                        rows={2}
                      />
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="date"
                          value={editForm.due_date}
                          onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                          className="px-2 py-1 border border-gray-200 rounded-lg text-xs"
                        />
                        <select
                          value={editForm.priority}
                          onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                          className="px-2 py-1 border border-gray-200 rounded-lg text-xs"
                        >
                          {PRIORITIES.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                        <select
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className="px-2 py-1 border border-gray-200 rounded-lg text-xs"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(todo.id)}
                          className="px-3 py-1 bg-tivit-red text-white text-xs rounded-lg"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm ${todo.completed ? "text-gray-400 line-through" : "text-gray-700"}`}
                        >
                          {todo.title}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${priority.color}`}>
                          {priority.label}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-xs ${category.color}`}>
                          {category.label}
                        </span>
                      </div>
                      {todo.description && (
                        <p className="text-xs text-gray-400 mt-1 truncate">{todo.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                        {dueFormatted && (
                          <span className={`flex items-center gap-1 ${overdue ? "text-red-500 font-medium" : ""}`}>
                            {overdue && <AlertCircle size={12} />}
                            <Clock size={12} />
                            {dueFormatted}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(todo)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="Editar"
                    >
                      <Tag size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(todo.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Limpiar tareas completadas</h3>
            <p className="text-sm text-gray-500 mb-4">
              Se eliminarán {counts.completed} tarea{counts.completed !== 1 ? "s" : ""} completada{counts.completed !== 1 ? "s" : ""}. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearCompleted}
                className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600"
              >
                Eliminar {counts.completed} completada{counts.completed !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
