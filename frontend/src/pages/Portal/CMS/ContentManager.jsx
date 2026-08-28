import { Link, NavLink, Outlet } from "react-router-dom";
import { useCollections } from "../../../lib/contentQueries";
import { useAuth } from "../../../context/AuthContext";
import {
  FileText,
  ImageIcon,
  Database,
  Layers,
  ChevronRight,
  History,
  Globe,
  AlertCircle,
} from "lucide-react";

const ICONS = {
  proyectos: FileText,
  "casos-de-exito": FileText,
  laboratorio: Layers,
  poc: Database,
  almaviva: Globe,
  xms: FileText,
};

const READ_ONLY_COLLECTIONS = ["proyectos", "casos-de-exito", "almaviva", "xms"];

export function ContentManager() {
  const { user } = useAuth();
  const { data: collections, isLoading, error } = useCollections();
  const canEdit = user?.role === "admin";

  // Solo admin puede editar; otros ven en solo lectura
  // No bloqueamos el acceso, solo deshabilitamos acciones en hijos

  return (
    <>
      {!canEdit && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Estás en modo <strong>solo lectura</strong> (rol: <strong>{user?.role}</strong>). Solo los <strong>administradores</strong> pueden editar. Puedes ver el contenido pero no crear ni modificar.
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-4">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-tivit-ink/55">
            Contenido público
          </h2>
          {isLoading && (
            <p className="text-sm text-tivit-ink/45">Cargando colecciones…</p>
          )}
          {error && (
            <p className="text-sm text-alert">Error al cargar colecciones</p>
          )}
          {collections && (
            <nav className="space-y-1">
              {collections.map((c) => {
                const Icon = ICONS[c.ruta] || FileText;
                // Proyectos ahora vive en la tabla `projects` (migración 020/027).
                // En el CMS lo mostramos pero redirige a /portal/portfolio donde se gestiona como Portafolio.
                const isProyectos = c.ruta === "proyectos";
                const to = isProyectos ? "/portal/portfolio" : `/portal/cms/${c.ruta}`;
                return (
                  <NavLink
                    key={c.ruta}
                    to={to}
                    className={({ isActive }) =>
                      `group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                        isActive && !isProyectos
                          ? "bg-tivit-red text-white"
                          : "text-tivit-ink hover:bg-tivit-red-light/40"
                      }`
                    }
                    title={isProyectos ? "Gestionado en Portafolio (tabla projects, 6 categorías)" : undefined}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{c.nombre}</span>
                      {isProyectos && (
                        <span className="rounded bg-tivit-ink/10 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-tivit-ink/50">
                          projects
                        </span>
                      )}
                    </span>
                    <span
                      className={`ml-2 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        c.total_items > 0
                          ? "bg-white/20 text-current"
                          : "bg-tivit-ink/10 text-tivit-ink/40"
                      }`}
                    >
                      {c.total_items}
                    </span>
                  </NavLink>
                );
              })}
            </nav>
          )}
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-tivit-ink/55">
            Herramientas
          </h3>
          <Link
            to="/portal/cms/media"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-tivit-ink hover:bg-tivit-red-light/40"
          >
            <ImageIcon className="h-4 w-4" aria-hidden="true" />
            Biblioteca de medios
          </Link>
          <Link
            to="/portal/cms/audit"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-tivit-ink hover:bg-tivit-red-light/40"
          >
            <History className="h-4 w-4" aria-hidden="true" />
            Historial de cambios
          </Link>
        </div>
      </aside>

        <main>
        <Outlet />
      </main>
    </div>
    </>
  );
}
