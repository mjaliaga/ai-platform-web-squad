import { lazy, Suspense } from "react";
import { Navigate, Routes, Route } from "react-router-dom";
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
const MemberProfile = lazy(() =>
  import("./pages/Portal/MemberProfile").then((modulo) => ({ default: modulo.MemberProfile }))
);
const ProjectLayout = lazy(() =>
  import("./pages/Portal/ProjectLayout").then((modulo) => ({ default: modulo.ProjectLayout }))
);

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center text-tivit-red">
      Cargando…
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
            <Route path="members" element={<Members />} />
            <Route path="members/:id" element={<MemberProfile />} />
            <Route path="profile" element={<Profile />} />
            <Route path="projects" element={<Projects />} />
            <Route path="tasks/new" element={<TaskForm />} />
            <Route path="tasks/:id" element={<TaskDetail />} />

            {/* Global fallback routes */}
            <Route path="backlog" element={<Backlog />} />
            <Route path="sprints" element={<Sprints />} />
            <Route path="feed" element={<Feed />} />

            {/* Project-scoped routes */}
            <Route path="projects/:id" element={<ProjectLayout />}>
              <Route index element={<Projects />} />
              <Route path="sprints" element={<Sprints />} />
              <Route path="feed" element={<Feed />} />
              <Route path="team" element={<Projects />} />
              <Route path="solicitudes" element={<Solicitudes />} />
              <Route path="tasks/new" element={<TaskForm />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;