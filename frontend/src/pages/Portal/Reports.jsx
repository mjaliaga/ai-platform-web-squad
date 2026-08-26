import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Users, Activity } from "lucide-react";
import { api } from "../../lib/api";
import { UserAvatar } from "./components/Badges";

export function Reports() {
  const [reports, setReports] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState("");

  useEffect(() => {
    api.listProjects().then(setProjects).catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    loadReports();
  }, [projectFilter]);

  async function loadReports() {
    setLoading(true);
    try {
      const params = projectFilter ? { project: projectFilter } : {};
      const data = await api.getProjectReports(params);
      setReports(data);
    } catch (err) {
      console.error("Error loading reports:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center text-gray-500 py-12">Cargando reportes...</div>;
  }

  if (!reports) {
    return <div className="text-center text-red-500 py-12">Error al cargar reportes</div>;
  }

  const { summary, velocity, workload, burndown } = reports;
  const completionPct = summary.total_tasks > 0
    ? Math.round((summary.done_tasks / summary.total_tasks) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Reportes
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Métricas y estadísticas del equipo
          </p>
        </div>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">Todos los proyectos</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Tareas totales"
          value={summary.total_tasks}
          color="bg-blue-50 text-blue-700"
        />
        <SummaryCard
          label="Completadas"
          value={summary.done_tasks}
          subtext={`${completionPct}%`}
          color="bg-green-50 text-green-700"
        />
        <SummaryCard
          label="En progreso"
          value={summary.in_progress_tasks}
          color="bg-amber-50 text-amber-700"
        />
        <SummaryCard
          label="Velocidad promedio"
          value={summary.avg_velocity.toFixed(1)}
          subtext="horas/sprint"
          color="bg-indigo-50 text-indigo-700"
        />
      </div>

      {/* Velocity chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          Velocidad por sprint
        </h2>
        {velocity.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No hay sprints con tareas aún</p>
        ) : (
          <VelocityChart data={velocity} />
        )}
      </div>

      {/* Workload */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          Distribución de carga
        </h2>
        {workload.length === 0 || workload.every(w => w.task_count === 0) ? (
          <p className="text-sm text-gray-500 py-8 text-center">No hay datos de carga</p>
        ) : (
          <div className="space-y-3">
            {workload.filter(w => w.task_count > 0).map((w) => (
              <WorkloadBar key={w.user_id} entry={w} />
            ))}
          </div>
        )}
      </div>

      {/* Burndown */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          Burndown (últimos 14 días)
        </h2>
        {burndown.length < 2 ? (
          <p className="text-sm text-gray-500 py-8 text-center">Datos insuficientes</p>
        ) : (
          <BurndownChart data={burndown} />
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, subtext, color }) {
  return (
    <div className={`rounded-lg p-4 ${color}`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {subtext && <p className="text-xs opacity-60 mt-0.5">{subtext}</p>}
    </div>
  );
}

function VelocityChart({ data }) {
  const max = Math.max(...data.map(d => Math.max(d.committed, d.completed)), 1);
  const width = 100;
  const height = 40;

  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i} className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span className="font-medium">{d.sprint_name}</span>
            <span>{d.completed.toFixed(0)} / {d.committed.toFixed(0)} h</span>
          </div>
          <div className="relative h-6 bg-gray-100 rounded">
            <div
              className="absolute inset-y-0 left-0 bg-indigo-200 rounded"
              style={{ width: `${(d.committed / max) * width}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 bg-indigo-600 rounded"
              style={{ width: `${(d.completed / max) * width}%` }}
            />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-indigo-600 rounded" /> Completado
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-indigo-200 rounded" /> Comprometido
        </div>
      </div>
    </div>
  );
}

function WorkloadBar({ entry }) {
  const total = entry.task_count;
  const segments = [
    { value: entry.todo, color: "bg-gray-400", label: "Todo" },
    { value: entry.in_progress, color: "bg-blue-500", label: "En progreso" },
    { value: entry.review, color: "bg-purple-500", label: "Revisión" },
    { value: entry.done, color: "bg-green-500", label: "Hecho" },
  ];

  return (
    <div className="flex items-center gap-3">
      <div className="w-32 flex items-center gap-2 truncate">
        <UserAvatar user={{ id: entry.user_id, name: entry.user_name, avatar_color: entry.avatar_color }} size="xs" />
        <span className="text-sm truncate">{entry.user_name}</span>
      </div>
      <div className="flex-1 flex h-6 bg-gray-100 rounded overflow-hidden">
        {segments.map((s, i) => {
          const pct = total > 0 ? (s.value / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={i}
              className={`${s.color} transition-all`}
              style={{ width: `${pct}%` }}
              title={`${s.label}: ${s.value}`}
            />
          );
        })}
      </div>
      <div className="w-16 text-right text-sm font-medium text-gray-700">
        {total} {entry.story_points ? `(${entry.story_points} sp)` : ""}
      </div>
    </div>
  );
}

function BurndownChart({ data }) {
  const max = Math.max(...data.map(d => Math.max(d.remaining, d.ideal)), 1);
  const width = 500;
  const height = 150;
  const padding = 20;

  const xStep = (width - padding * 2) / Math.max(data.length - 1, 1);

  const idealPath = data.map((d, i) => {
    const x = padding + i * xStep;
    const y = height - padding - (d.ideal / max) * (height - padding * 2);
    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");

  const actualPath = data.map((d, i) => {
    const x = padding + i * xStep;
    const y = height - padding - (d.remaining / max) * (height - padding * 2);
    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <line
            key={i}
            x1={padding} y1={padding + p * (height - padding * 2)}
            x2={width - padding} y2={padding + p * (height - padding * 2)}
            stroke="#f3f4f6" strokeWidth="1"
          />
        ))}
        {/* Ideal line */}
        <path d={idealPath} fill="none" stroke="#d1d5db" strokeWidth="2" strokeDasharray="4 4" />
        {/* Actual line */}
        <path d={actualPath} fill="none" stroke="#4f46e5" strokeWidth="2" />
        {/* Dots */}
        {data.map((d, i) => {
          const x = padding + i * xStep;
          const y = height - padding - (d.remaining / max) * (height - padding * 2);
          return <circle key={i} cx={x} cy={y} r="3" fill="#4f46e5" />;
        })}
      </svg>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-indigo-600" /> Real
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-gray-400 border-dashed" /> Ideal
        </div>
      </div>
    </div>
  );
}
