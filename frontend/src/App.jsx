import { Routes, Route } from "react-router-dom";
import { listaColecciones } from "./data/contenido";
import { PublicSite } from "./pages/PublicSite";
import { CollectionList } from "./pages/CollectionList";
import { CollectionDetail } from "./pages/CollectionDetail";
import { AlmavivaPage } from "./pages/AlmavivaPage";
import { Login } from "./pages/Login";
import { Panel } from "./pages/Panel";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ScrollManager } from "./components/ScrollManager";

function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<PublicSite />} />
        <Route path="/almaviva" element={<AlmavivaPage />} />

        {/* Cada colección (proyectos, casos de uso, laboratorio, PoC) genera su
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
        <Route
          path="/panel"
          element={
            <ProtectedRoute>
              <Panel />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
