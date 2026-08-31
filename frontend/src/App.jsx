import { lazy, Suspense } from "react";
import { Link, Navigate, Routes, Route } from "react-router-dom";
import { listaColecciones } from "./data/contenido";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ScrollManager } from "./components/ScrollManager";

const PublicSite = lazy(() =>
  import("./pages/PublicSite").then((modulo) => ({ default: modulo.PublicSite }))
);
const CollectionList = lazy(() =>
  import("./pages/CollectionList").then((modulo) => ({ default: modulo.CollectionList }))
);
const CollectionDetail = lazy(() =>
  import("./pages/CollectionDetail").then((modulo) => ({ default: modulo.CollectionDetail }))
);
const Login = lazy(() =>
  import("./pages/Login").then((modulo) => ({ default: modulo.Login }))
);
const PortalLayout = lazy(() =>
  import("./pages/Portal/PortalLayout").then((modulo) => ({ default: modulo.PortalLayout }))
);
const Dashboard = lazy(() =>
  import("./pages/Portal/Dashboard").then((modulo) => ({ default: modulo.Dashboard }))
);
const TodoList = lazy(() =>
  import("./pages/Portal/TodoList").then((modulo) => ({ default: modulo.TodoList }))
);
const Certificaciones = lazy(() =>
  import("./pages/Portal/Certificaciones").then((modulo) => ({ default: modulo.Certificaciones }))
);
const Backlog = lazy(() =>
  import("./pages/Portal/Backlog").then((modulo) => ({ default: modulo.Backlog }))
);
const TaskForm = lazy(() =>
  import("./pages/Portal/TaskForm").then((modulo) => ({ default: modulo.TaskForm }))
);
const TaskDetail = lazy(() =>
  import("./pages/Portal/TaskDetail").then((modulo) => ({ default: modulo.TaskDetail }))
);
const Sprints = lazy(() =>
  import("./pages/Portal/Sprints").then((modulo) => ({ default: modulo.Sprints }))
);
const Feed = lazy(() =>
  import("./pages/Portal/Feed").then((modulo) => ({ default: modulo.Feed }))
);
const Solicitudes = lazy(() =>
  import("./pages/Portal/Solicitudes").then((modulo) => ({ default: modulo.Solicitudes }))
);
const Members = lazy(() =>
  import("./pages/Portal/Members").then((modulo) => ({ default: modulo.Members }))
);
const Profile = lazy(() =>
  import("./pages/Portal/Profile").then((modulo) => ({ default: modulo.Profile }))
);
const Projects = lazy(() =>
  import("./pages/Portal/Projects").then((modulo) => ({ default: modulo.Projects }))
);
const Portfolio = lazy(() =>
  import("./pages/Portal/Projects").then((modulo) => ({ default: modulo.Projects }))
);

const MemberProfile = lazy(() =>
  import("./pages/Portal/MemberProfile").then((modulo) => ({ default: modulo.MemberProfile }))
);
const ProjectLayout = lazy(() =>
  import("./pages/Portal/ProjectLayout").then((modulo) => ({ default: modulo.ProjectLayout }))
);
const ProjectTasks = lazy(() =>
  import("./pages/Portal/ProjectTasks").then((modulo) => ({ default: modulo.ProjectTasks }))
);
const ProjectCalendar = lazy(() =>
  import("./pages/Portal/ProjectCalendar").then((modulo) => ({ default: modulo.ProjectCalendar }))
);
const ProjectActivity = lazy(() =>
  import("./pages/Portal/ProjectActivity").then((modulo) => ({ default: modulo.ProjectActivity }))
);
const ProjectSettings = lazy(() =>
  import("./pages/Portal/ProjectSettings").then((modulo) => ({ default: modulo.ProjectSettings }))
);
const ProjectBacklog = lazy(() =>
  import("./pages/Portal/ProjectBacklog").then((modulo) => ({ default: modulo.ProjectBacklog }))
);
const ProjectBoard = lazy(() =>
  import("./pages/Portal/ProjectBoard").then((modulo) => ({ default: modulo.ProjectBoard }))
);
const ProjectTimeTracking = lazy(() =>
  import("./pages/Portal/ProjectTimeTracking").then((modulo) => ({ default: modulo.ProjectTimeTracking }))
);
const ProjectSummary = lazy(() =>
  import("./pages/Portal/ProjectSummary").then((modulo) => ({ default: modulo.ProjectSummary }))
);

// CMS de Contenido Público
const ContentManager = lazy(() =>
  import("./pages/Portal/CMS/ContentManager").then((m) => ({ default: m.ContentManager }))
);
const CollectionListPage = lazy(() =>
  import("./pages/Portal/CMS/CollectionListPage").then((m) => ({ default: m.CollectionListPage }))
);
const ItemEditorPage = lazy(() =>
  import("./pages/Portal/CMS/ItemEditorPage").then((m) => ({ default: m.ItemEditorPage }))
);
const MediaManagerPage = lazy(() =>
  import("./pages/Portal/CMS/MediaManagerPage").then((m) => ({ default: m.MediaManagerPage }))
);
const ContentAuditPage = lazy(() =>
  import("./pages/Portal/CMS/ContentAuditPage").then((m) => ({ default: m.ContentAuditPage }))
);
const AdminAuditPage = lazy(() =>
  import("./pages/Portal/AdminAuditPage").then((m) => ({ default: m.AdminAuditPage }))
);

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center text-tivit-red">
      Cargando…
    </div>
  );
}

function ContentManagerIndex() {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-bold text-tivit-ink">Bienvenido al CMS</h2>
      <p className="mt-2 text-sm text-tivit-ink/55">
        Seleccioná una colección del panel izquierdo para empezar a editar el
        contenido del sitio público. También podés administrar la{" "}
        <a
          href="/portal/cms/media"
          className="font-semibold text-tivit-red hover:underline"
        >
          biblioteca de medios
        </a>{" "}
        o ver el{" "}
        <a
          href="/portal/cms/audit"
          className="font-semibold text-tivit-red hover:underline"
        >
          historial de cambios
        </a>
        .
      </p>
    </div>
  );
}

function App() {
  return (
    <>
      <ScrollManager />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<PublicSite />} />

          {/* Cada colección (proyectos, casos de éxito, laboratorio, PoC, almaviva) genera su
              página de listado y su ficha de detalle a partir de la misma vista. */}
          {listaColecciones.flatMap((coleccion) => [
            <Route
              key={coleccion.ruta}
              path={`/${coleccion.ruta}`}
              element={<CollectionList ruta={coleccion.ruta} />}
            />,
            <Route
              key={`${coleccion.ruta}-detalle`}
              path={`/${coleccion.ruta}/:slug`}
              element={<CollectionDetail ruta={coleccion.ruta} />}
            />,
          ])}

          <Route path="/login" element={<Login />} />
          <Route path="/panel" element={<Navigate to="/portal" replace />} />
          <Route
            path="/portal"
            element={
              <ProtectedRoute>
                <PortalLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="todos" element={<TodoList />} />
            <Route path="certifications" element={<Certificaciones />} />
            <Route path="members" element={<Members />} />
            <Route path="members/:id" element={<MemberProfile />} />
            <Route path="profile" element={<Profile />} />
            {/* Portafolio — canónico profesional, projects como alias legacy */}
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="projects" element={<Navigate to="/portal/portfolio" replace />} />
            <Route path="tasks/new" element={<TaskForm />} />
            <Route path="tasks/:id" element={<TaskDetail />} />

            {/* Global fallback routes */}
            <Route path="backlog" element={<Backlog />} />
            <Route path="sprints" element={<Sprints />} />
            <Route path="feed" element={<Feed />} />

            {/* Portafolio-scoped routes — canónico */}
            <Route path="portfolio/:id" element={<ProjectLayout />}>
              <Route index element={<ProjectBacklog />} />
              <Route path="summary" element={<ProjectSummary />} />
              <Route path="calendar" element={<ProjectCalendar />} />
              <Route path="settings" element={<ProjectSettings />} />
              <Route path="feed" element={<Feed />} />
              <Route path="team" element={<Members />} />
              <Route path="solicitudes" element={<Solicitudes />} />
              <Route path="tasks/new" element={<TaskForm />} />
            </Route>
            {/* Legacy alias portfolio → projects para compatibilidad */}
            <Route path="projects/:id" element={<ProjectLayout />}>
              <Route index element={<ProjectBacklog />} />
              <Route path="summary" element={<ProjectSummary />} />
              <Route path="calendar" element={<ProjectCalendar />} />
              <Route path="settings" element={<ProjectSettings />} />
              <Route path="feed" element={<Feed />} />
              <Route path="team" element={<Members />} />
              <Route path="solicitudes" element={<Solicitudes />} />
              <Route path="tasks/new" element={<TaskForm />} />
            </Route>

            {/* CMS de contenido público (editor/admin) */}
            <Route path="cms" element={<ContentManager />}>
              <Route index element={<ContentManagerIndex />} />
              <Route path=":collection" element={<CollectionListPage />} />
              <Route path=":collection/new" element={<ItemEditorPage />} />
              <Route path=":collection/:slug" element={<ItemEditorPage />} />
              <Route path="media" element={<MediaManagerPage />} />
              <Route path="audit" element={<ContentAuditPage />} />
            </Route>
            <Route path="admin/audit" element={<AdminAuditPage />} />
          </Route>
          <Route path="*" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">404 — Página no encontrada</h1><Link to="/" className="text-tivit-red hover:underline">Volver al inicio</Link></div>} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;