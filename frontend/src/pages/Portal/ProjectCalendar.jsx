import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, X, Star } from "lucide-react";

function formatDateShort(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function isToday(date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isPast(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export function ProjectCalendar() {
  const { id: projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [importantDates, setImportantDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddDateModal, setShowAddDateModal] = useState(false);
  const [newDate, setNewDate] = useState({ date: "", label: "" });

  useEffect(() => {
    refresh();
  }, [projectId]);

  async function refresh() {
    try {
      setLoading(true);
      const data = await api.listTasks({ project: projectId });
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function getMonthData(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    const paddingDays = startingDay === 0 ? 6 : startingDay - 1;

    const days = [];
    for (let i = 0; i < paddingDays; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }

  function formatMonthYear(date) {
    return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  }

  function prevMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  function getDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function handleAddDate() {
    if (!newDate.date || !newDate.label) return;
    setImportantDates([...importantDates, { ...newDate, id: Date.now() }]);
    setNewDate({ date: "", label: "" });
    setShowAddDateModal(false);
  }

  function handleRemoveDate(id) {
    setImportantDates(importantDates.filter((d) => d.id !== id));
  }

  if (error) return <div className="text-alert">Error: {error}</div>;
  if (loading) return <div className="py-8 text-center text-sm text-tivit-ink/50">Cargando calendario…</div>;

  const days = getMonthData(currentDate);
  const tasksByDate = {};
  tasks.forEach((task) => {
    if (task.due_date) {
      const dateKey = task.due_date.split("T")[0];
      if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
      tasksByDate[dateKey].push(task);
    }
  });

  const importantDatesByDate = {};
  importantDates.forEach((imp) => {
    const dateKey = imp.date;
    if (!importantDatesByDate[dateKey]) importantDatesByDate[dateKey] = [];
    importantDatesByDate[dateKey].push(imp);
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-tivit-ink">Calendario</h1>
          <p className="mt-1 text-sm text-tivit-ink/60">
            Fechas de vencimiento y fechas importantes del proyecto.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddDateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-tivit-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-tivit-red-dark"
          >
            <Plus className="h-4 w-4" />
            Fecha importante
          </button>
          <button
            onClick={prevMonth}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-tivit-ink/70 transition hover:bg-tivit-red-light"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToToday}
            className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium text-tivit-ink/70 transition hover:bg-tivit-red-light"
          >
            <CalendarIcon className="h-4 w-4" />
            Hoy
          </button>
          <button
            onClick={nextMonth}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-tivit-ink/70 transition hover:bg-tivit-red-light"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="ml-2 text-lg font-semibold text-tivit-ink capitalize">
            {formatMonthYear(currentDate)}
          </span>
        </div>
      </div>

      {importantDates.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800">
            <Star className="h-4 w-4" />
            Fechas importantes
          </h3>
          <div className="flex flex-wrap gap-2">
            {importantDates.map((imp) => (
              <div
                key={imp.id}
                className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm shadow-sm"
              >
                <span className="font-medium text-amber-700">{formatDateShort(imp.date)}</span>
                <span className="text-amber-600">- {imp.label}</span>
                <button
                  onClick={() => handleRemoveDate(imp.id)}
                  className="ml-1 text-amber-400 hover:text-amber-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-black/5 bg-white overflow-hidden">
        <div className="grid grid-cols-7 border-b border-black/5 bg-gray-50">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
            <div key={day} className="px-2 py-3 text-center text-xs font-semibold uppercase text-tivit-ink/60">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            if (!day) {
              return <div key={`pad-${index}`} className="min-h-24 border-b border-r border-black/5 bg-gray-50/50 p-1" />;
            }

            const dateKey = getDateKey(day);
            const dayTasks = tasksByDate[dateKey] || [];
            const dayImportantDates = importantDatesByDate[dateKey] || [];
            const currentDay = isToday(day);
            const pastDay = isPast(day);

            return (
              <div
                key={dateKey}
                className={`min-h-24 border-b border-r border-black/5 p-1 ${
                  pastDay && (dayTasks.length > 0 || dayImportantDates.length > 0) ? "bg-red-50/50" : ""
                }`}
              >
                <div
                  className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    currentDay
                      ? "bg-tivit-red text-white"
                      : pastDay
                      ? "text-red-500"
                      : "text-tivit-ink/60"
                  }`}
                >
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayImportantDates.map((imp) => (
                    <div
                      key={imp.id}
                      className="flex items-center gap-1 truncate rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700"
                      title={imp.label}
                    >
                      <Star className="h-3 w-3 flex-shrink-0" />
                      {imp.label}
                    </div>
                  ))}
                  {dayTasks.slice(0, 3).map((task) => (
                    <Link
                      key={task.id}
                      to={`/portal/tasks/${task.id}`}
                      className={`block truncate rounded px-1.5 py-0.5 text-xs font-medium transition hover:opacity-80 ${
                        task.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : task.priority === "medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                      title={task.title}
                    >
                      {task.code} - {task.title}
                    </Link>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-center text-xs text-tivit-ink/50">
                      +{dayTasks.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showAddDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-tivit-ink">Agregar fecha importante</h2>
              <button
                onClick={() => setShowAddDateModal(false)}
                className="text-tivit-ink/50 hover:text-tivit-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-tivit-ink/60">
                  Fecha
                </label>
                <input
                  type="date"
                  value={newDate.date}
                  onChange={(e) => setNewDate({ ...newDate, date: e.target.value })}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/10"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-tivit-ink/60">
                  Descripción
                </label>
                <input
                  type="text"
                  value={newDate.label}
                  onChange={(e) => setNewDate({ ...newDate, label: e.target.value })}
                  placeholder="Ej: Entrega de milestone, Review con cliente..."
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/10"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAddDateModal(false)}
                  className="rounded-lg border border-black/20 px-4 py-2 text-sm font-semibold text-tivit-ink hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddDate}
                  disabled={!newDate.date || !newDate.label}
                  className="rounded-lg bg-tivit-red px-4 py-2 text-sm font-semibold text-white hover:bg-tivit-red-dark disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
