import { ChipsStack } from "../ChipsStack";
import { iniciales } from "../../lib/utils";

export function SidebarMeta({ item, stack, ruta }) {
  const tipo =
    ruta === "casos-de-exito"
      ? item.industria
      : ruta === "almaviva" || ruta === "xms"
        ? item.categoria
        : item.tipoSolucion || (item.categoria === "Producto"
    ? item.slug === "lab-003-auditia" ? "Framework de seguridad" : "Framework agéntico"
    : item.categoria === "Investigación" ? "Investigación aplicada" : item.categoria || "Proyecto de software");

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-tivit-red">Ficha técnica</h3>
      <dl className="mt-4 flex flex-col gap-3 text-sm">
        <div>
          <dt className="text-xs text-gray-600">{ruta === "xms" ? "Categoría" : ruta === "casos-de-exito" ? "Industria" : "Tipo de solución"}</dt>
          <dd className="mt-0.5 font-semibold text-tivit-ink">{tipo}</dd>
        </div>
        {ruta === "almaviva" && item.tipo && (
          <div>
            <dt className="text-xs text-gray-600">Proceso</dt>
            <dd className="mt-0.5 font-semibold text-tivit-ink">{item.tipo}</dd>
          </div>
        )}
        {ruta !== "xms" && (
          <div>
            <dt className="text-xs text-gray-600">Estado</dt>
            <dd className="mt-1">
              <StatusBadge estado={item.estado || "Publicado"} />
            </dd>
          </div>
        )}
        {item.codigo && (
          <div>
            <dt className="text-xs text-gray-600">Referencia</dt>
            <dd className="mt-0.5 font-mono text-xs font-semibold text-tivit-ink/75">{item.codigo}</dd>
          </div>
        )}
        {ruta === "xms" && item.proceso && (
          <div>
            <dt className="text-xs text-gray-600">Proceso de negocio</dt>
            <dd className="mt-0.5 font-semibold text-tivit-ink">{item.proceso}</dd>
          </div>
        )}
        {ruta === "xms" && item.cliente && (
          <div>
            <dt className="text-xs text-gray-600">Cliente de referencia</dt>
            <dd className="mt-0.5 font-semibold text-tivit-ink">{item.cliente}</dd>
          </div>
        )}
        {ruta === "xms" && item.tiempo && (
          <div>
            <dt className="text-xs text-gray-600">Tiempo de implementación</dt>
            <dd className="mt-0.5 font-semibold text-tivit-ink">{item.tiempo}</dd>
          </div>
        )}
        {ruta === "xms" && item.precio && (
          <div>
            <dt className="text-xs text-gray-600">Inversión</dt>
            <dd className="mt-0.5 font-semibold text-tivit-ink">{item.precio}</dd>
          </div>
        )}
        {ruta === "casos-de-exito" && item.cliente && (
          <div>
            <dt className="text-xs text-gray-600">Cliente</dt>
            <dd className="mt-0.5 font-semibold text-tivit-ink">{item.cliente}</dd>
          </div>
        )}
        {ruta === "casos-de-exito" && item.pais && (
          <div>
            <dt className="text-xs text-gray-600">País</dt>
            <dd className="mt-0.5 font-semibold text-tivit-ink">{item.pais}</dd>
          </div>
        )}
        {ruta === "casos-de-exito" && item.plazo && (
          <div>
            <dt className="text-xs text-gray-600">Plazo de ejecución</dt>
            <dd className="mt-0.5 font-semibold text-tivit-ink">{item.plazo}</dd>
          </div>
        )}
        {ruta === "casos-de-exito" && item.inversion && (
          <div>
            <dt className="text-xs text-gray-600">Inversión</dt>
            <dd className="mt-0.5 font-semibold text-tivit-ink">{item.inversion}</dd>
          </div>
        )}
        {item.version && (
          <div>
            <dt className="text-xs text-gray-600">Versión</dt>
            <dd className="mt-0.5 font-semibold text-tivit-ink">{item.version}</dd>
          </div>
        )}
      </dl>

      {item.industrias?.length > 0 && <IndustriasCard industrias={item.industrias} />}

      {stack.length > 0 && <TecnologiasCard stack={stack} />}
    </div>
  );
}

function StatusBadge({ estado }) {
  const enDesarrollo = /desarrollo|planific/i.test(estado);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
      enDesarrollo ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${enDesarrollo ? "bg-amber-500" : "bg-emerald-500"}`} />
      {estado}
    </span>
  );
}

/** Chip destacado de categoría de producto (portafolio Almaviva). */
function EtiquetaCategoria({ categoria }) {
  if (!categoria) return null;

  return (
    <span className="shrink-0 rounded-full bg-tivit-ink px-2.5 py-0.5 text-xs font-semibold text-white">
      {categoria}
    </span>
  );
}

export { EtiquetaCategoria, EquipoCard };

function EquipoCard({ equipo }) {
  return (
    <div className="mt-5 border-t border-gray-100 pt-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-tivit-red">Equipo desarrollador</h3>
      <ul className="mt-4 flex flex-col gap-3">
        {equipo.map((miembro) => (
          <li key={`${miembro.nombre}-${miembro.rol}`} className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tivit-red-light text-sm font-bold text-tivit-red-dark">
              {iniciales(miembro.nombre)}
            </span>
            <div>
              <p className="text-sm font-semibold text-tivit-ink">{miembro.nombre}</p>
              {miembro.rol && <p className="text-xs text-tivit-ink/60">{miembro.rol}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TecnologiasCard({ stack }) {
  return (
    <div className="mt-5 border-t border-gray-100 pt-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-tivit-red">Tecnologías</h3>
      <div className="mt-4">
        <ChipsStack tecnologias={stack} limite={stack.length} />
      </div>
    </div>
  );
}

function IndustriasCard({ industrias }) {
  if (!industrias || industrias.length === 0) return null;
  return (
    <div className="mt-5 border-t border-gray-100 pt-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-tivit-red">Industrias aplicables</h3>
      <ul className="mt-4 flex flex-wrap gap-1.5">
        {industrias.map((industria) => (
          <li
            key={industria}
            className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
          >
            {industria}
          </li>
        ))}
      </ul>
    </div>
  );
}