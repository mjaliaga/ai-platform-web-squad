import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

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

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-tivit-ink">Calendario</h1>
          <p className="mt-1 text-sm text-tivit-ink/60">
            Fechas de vencimiento de tareas del proyecto.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            const currentDay = isToday(day);
            const pastDay = isPast(day);

            return (
              <div
                key={dateKey}
                className={`min-h-24 border-b border-r border-black/5 p-1 ${
                  pastDay && dayTasks.length > 0 ? "bg-red-50/50" : ""
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
    </div>
  );
}
