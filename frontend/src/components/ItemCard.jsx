import { Link } from "react-router-dom";
import { ArrowRight, CirclePlay } from "lucide-react";
import { EtiquetasItem, EtiquetaCodigo, EtiquetaEstado } from "./Etiquetas";
import { EtiquetaCategoria } from "./detalle/SidebarMeta";
import { ClienteLinea } from "./ClienteLinea";
import { ChipsStack } from "./ChipsStack";
import { esVideoPlaceholder } from "../lib/utils";

const GRADIENTES_COLECCION = {
  proyectos: "from-proyectos-orange to-proyectos-orange-dark",
  "casos-de-exito": "from-exito-green to-exito-green-dark",
  laboratorio: "from-labs-celeste to-labs-pink",
  poc: "from-poc-blue to-poc-blue-dark",
  almaviva: "from-almaviva-blue to-almaviva-blue-dark",
  xms: "from-xms-blue to-xms-blue-dark",
};

/** Acentos de las colecciones de marca (XMS, Almaviva): borde/hover de la
 *  tarjeta, título, CTA y chip de grupo/industrias con su paleta. */
const ACENTOS_MARCA = {
  xms: {
    borde: "border-xms-blue-light hover:border-xms-blue",
    titulo: "text-xms-blue-dark group-hover:text-xms-blue",
    cta: "text-xms-blue",
    chip: "bg-xms-blue-light text-xms-blue-dark",
  },
  almaviva: {
    borde: "border-almaviva-blue-light hover:border-almaviva-blue",
    titulo: "text-almaviva-blue-dark group-hover:text-almaviva-blue",
    cta: "text-almaviva-blue",
    chip: "bg-almaviva-blue-light text-almaviva-blue-dark",
  },
  exito: {
    borde: "border-exito-green-light hover:border-exito-green",
    titulo: "text-exito-green-dark group-hover:text-exito-green",
    cta: "text-exito-green",
    chip: "bg-exito-green-light text-exito-green-dark",
  },
  labs: {
    borde: "border-labs-celeste-light hover:border-labs-celeste",
    titulo: "text-labs-celeste-dark group-hover:text-labs-celeste",
    cta: "text-labs-celeste",
    chip: "bg-labs-celeste-light text-labs-celeste-dark",
  },
  proyectos: {
    borde: "border-proyectos-orange-light hover:border-proyectos-orange",
    titulo: "text-proyectos-orange-dark group-hover:text-proyectos-orange",
    cta: "text-proyectos-orange",
    chip: "bg-proyectos-orange-light text-proyectos-orange-dark",
  },
  poc: {
    borde: "border-poc-blue-light hover:border-poc-blue",
    titulo: "text-poc-blue-dark group-hover:text-poc-blue",
    cta: "text-poc-blue",
    chip: "bg-poc-blue-light text-poc-blue-dark",
  },
};

/** Tarjeta de un elemento de colección. Enlaza a su ficha de detalle. */
export function ItemCard({
  item,
  ruta,
  tipoDestacado,
  mostrarStack = true,
  soloArea = false,
  sinEtiquetas = false,
  etiqueta,
  horizontal = false,
  cta,
  almaviva = false,
  xms = false,
  casosExito = false,
  labs = false,
  proyectos = false,
  poc = false,
}) {
  const nombre = item.nombreComercial || item.name;
  const descripcion = item.descripcion || item.description;
  const video = item.videoPromocional || item.demo;
  const tieneDemo = Boolean(video && !esVideoPlaceholder(video));
  const tieneEtiquetas = !sinEtiquetas && Boolean(item.codigo || item.tipo || item.estado);
  const textoCta = cta || (tieneDemo ? "Ver detalle y demo" : "Ver detalle");
  const industrias = item.industrias || [];
  const tituloAire = etiqueta || tieneEtiquetas || almaviva || xms || casosExito || labs || proyectos || poc;
  const marca = xms
    ? "xms"
    : almaviva
      ? "almaviva"
      : casosExito
        ? "exito"
        : labs
          ? "labs"
          : proyectos
            ? "proyectos"
            : poc
              ? "poc"
              : null;
  const acento = marca ? ACENTOS_MARCA[marca] : null;

  return (
    <Link
      to={`/${ruta}/${item.slug}`}
      className={`group h-full rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        acento?.borde ?? "border-tivit-red-light hover:border-tivit-red"
      } ${horizontal ? "grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center" : "flex flex-col p-6"}`}
    >
      {!horizontal && (
        <div
          className={`-mx-6 -mt-6 mb-5 h-1.5 rounded-t-2xl bg-gradient-to-r ${GRADIENTES_COLECCION[ruta] ?? "from-tivit-red to-tivit-red-dark"}`}
          aria-hidden="true"
        />
      )}

      <div className={horizontal ? "min-w-0" : "flex flex-1 flex-col"}>
        <div className={horizontal ? "contents" : ""}>
          {etiqueta && (
            <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${acento?.chip ?? "bg-tivit-red-light text-tivit-red-dark"}`}>
              {etiqueta}
            </span>
          )}

          {almaviva && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <EtiquetaCodigo codigo={item.codigo} />
              <EtiquetaEstado estado={item.estado} />
              {industrias.length > 0 && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${acento?.chip ?? "bg-tivit-red-light text-tivit-red-dark"}`}>
                  {industrias.length} {industrias.length === 1 ? "industria" : "industrias"}
                </span>
              )}
            </div>
          )}

          {xms && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <EtiquetaCodigo codigo={item.codigo} />
              <EtiquetaCategoria categoria={item.categoria} xms />
            </div>
          )}

          {casosExito && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <EtiquetaCodigo codigo={item.codigo} />
              <EtiquetaEstado estado={item.estado} />
            </div>
          )}

          {tieneEtiquetas && (
            <EtiquetasItem
              item={item}
              tipoDestacado={tipoDestacado}
              mostrarCodigo={!soloArea}
              mostrarEstado={!soloArea}
            />
          )}

          <h3
            className={`font-semibold transition ${acento?.titulo ?? "text-tivit-red-dark group-hover:text-tivit-red"} ${
              tituloAire ? "mt-3" : ""
            }`}
          >
            {nombre}
          </h3>

          {descripcion ? (
            <p className={`mt-2 text-sm text-tivit-ink/70 ${horizontal ? "" : ""}`}>{descripcion}</p>
          ) : (
            <p className="mt-2 text-sm italic text-tivit-ink/45">
              Descripción pendiente de completar.
            </p>
          )}

          <ClienteLinea cliente={item.cliente} />
        </div>

        <div className={horizontal ? "flex flex-col items-start md:items-end" : "mt-auto pt-4"}>
          {mostrarStack && <div className="mt-3"><ChipsStack tecnologias={item.stack} /></div>}

          <span className={`mt-5 inline-flex items-center gap-2 text-sm font-bold ${acento?.cta ?? "text-tivit-red"}`}>
            {tieneDemo && <CirclePlay className="h-4 w-4" aria-hidden="true" />}
            {textoCta}
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}