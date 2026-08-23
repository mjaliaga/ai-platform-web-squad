import { ChipsStack } from "../ChipsStack";
import { iniciales } from "../../lib/utils";

/** Normaliza un item que puede venir como string (datos estáticos) o como objeto
 *  `{value: "..."}` (datos del CMS) a un string renderizable. */
function normalizarItem(item) {
  if (item === null || item === undefined) return "";
  if (typeof item === "string") return item;
  if (typeof item === "object" && "value" in item) return String(item.value ?? "");
  return String(item);
}

export function SidebarMeta({ item, stack, ruta }) {
  const xms = ruta === "xms";
  const almaviva = ruta === "almaviva";
  const exito = ruta === "casos-de-exito";
  const labs = ruta === "laboratorio";
  const proyectos = ruta === "proyectos";
  const acento = xms
    ? "text-xms-blue"
    : almaviva
      ? "text-almaviva-blue"
      : exito
        ? "text-exito-green"
        : labs
          ? "text-labs-celeste"
          : proyectos
            ? "text-proyectos-orange"
            : ruta === "poc"
              ? "text-poc-blue"
              : "text-tivit-red";
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
      <h3 className={`text-sm font-semibold uppercase tracking-wide ${acento}`}>Ficha técnica</h3>
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
            <dt className="text-xs text-gray-600">Precio</dt>
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
        {ruta === "casos-de-exito" && item.precio && (
          <div>
            <dt className="text-xs text-gray-600">Precio</dt>
            <dd className="mt-0.5 font-semibold text-tivit-ink">{item.precio}</dd>
          </div>
        )}
        {item.version && (
          <div>
            <dt className="text-xs text-gray-600">Versión</dt>
            <dd className="mt-0.5 font-semibold text-tivit-ink">{item.version}</dd>
          </div>
        )}
      </dl>

      {item.industrias?.length > 0 && <IndustriasCard industrias={item.industrias} acento={acento} />}

      {stack.length > 0 && <TecnologiasCard stack={stack} acento={acento} />}
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

/** Chip destacado de categoría de producto (portafolio Almaviva / XMS / Casos de Éxito). */
function EtiquetaCategoria({ categoria, xms = false, almaviva = false, exito = false, labs = false }) {
  if (!categoria) return null;

  const clase = xms
    ? "bg-xms-blue-dark text-white"
    : almaviva
      ? "bg-almaviva-blue-dark text-white"
      : exito
        ? "bg-exito-green-dark text-white"
        : labs
          ? "bg-labs-celeste-dark text-white"
          : "bg-tivit-ink text-white";

  return (
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${clase}`}>
      {categoria}
    </span>
  );
}

export { EtiquetaCategoria, EquipoCard };

function EquipoCard({ equipo, acento = "text-tivit-red" }) {
  const avatarClase =
    {
      "text-proyectos-orange": "bg-proyectos-orange-light text-proyectos-orange-dark",
      "text-poc-blue": "bg-poc-blue-light text-poc-blue-dark",
      "text-labs-celeste": "bg-labs-celeste-light text-labs-celeste-dark",
      "text-exito-green": "bg-exito-green-light text-exito-green-dark",
      "text-xms-blue": "bg-xms-blue-light text-xms-blue-dark",
      "text-almaviva-blue": "bg-almaviva-blue-light text-almaviva-blue-dark",
    }[acento] ?? "bg-tivit-red-light text-tivit-red-dark";

  return (
    <div className="mt-5 border-t border-gray-100 pt-5">
      <h3 className={`text-sm font-semibold uppercase tracking-wide ${acento}`}>Equipo desarrollador</h3>
      <ul className="mt-4 flex flex-col gap-3">
        {equipo.map((miembro, idx) => {
          const nombre = normalizarItem(miembro?.nombre ?? miembro);
          const rol = normalizarItem(miembro?.rol ?? "");
          return (
            <li key={`${idx}-${nombre}`} className="flex items-center gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarClase}`}>
                {iniciales(nombre)}
              </span>
              <div>
                <p className="text-sm font-semibold text-tivit-ink">{nombre}</p>
                {rol && <p className="text-xs text-tivit-ink/60">{rol}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TecnologiasCard({ stack, acento = "text-tivit-red" }) {
  return (
    <div className="mt-5 border-t border-gray-100 pt-5">
      <h3 className={`text-sm font-semibold uppercase tracking-wide ${acento}`}>Tecnologías</h3>
      <div className="mt-4">
        <ChipsStack tecnologias={stack.filter(normalizarItem)} limite={stack.filter(normalizarItem).length} />
      </div>
    </div>
  );
}

function IndustriasCard({ industrias, acento = "text-tivit-red" }) {
  if (!industrias || industrias.length === 0) return null;
  const items = industrias.map(normalizarItem).filter(Boolean);
  if (items.length === 0) return null;
  return (
    <div className="mt-5 border-t border-gray-100 pt-5">
      <h3 className={`text-sm font-semibold uppercase tracking-wide ${acento}`}>Industrias aplicables</h3>
      <ul className="mt-4 flex flex-wrap gap-1.5">
        {items.map((industria, idx) => (
          <li
            key={`${idx}-${industria}`}
            className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
          >
            {industria}
          </li>
        ))}
      </ul>
    </div>
  );
}