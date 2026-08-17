import { Link } from "react-router-dom";
import { ArrowRight, CirclePlay } from "lucide-react";
import { EtiquetasItem, EtiquetaCodigo, EtiquetaEstado } from "./Etiquetas";
import { EtiquetaCategoria } from "./detalle/SidebarMeta";
import { ClienteLinea } from "./ClienteLinea";
import { ChipsStack } from "./ChipsStack";
import { esVideoPlaceholder } from "../lib/utils";

const GRADIENTES_COLECCION = {
  proyectos: "from-tivit-red-dark to-tivit-red",
  "casos-de-exito": "from-emerald-600 to-green-500",
  laboratorio: "from-violet-700 to-fuchsia-500",
  poc: "from-sky-600 to-cyan-400",
  almaviva: "from-tivit-red to-rose-500",
  xms: "from-teal-600 to-cyan-500",
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
}) {
  const nombre = item.nombreComercial || item.name;
  const descripcion = item.descripcion || item.description;
  const video = item.videoPromocional || item.demo;
  const tieneDemo = Boolean(video && !esVideoPlaceholder(video));
  const tieneEtiquetas = !sinEtiquetas && Boolean(item.codigo || item.tipo || item.estado);
  const textoCta = cta || (tieneDemo ? "Ver detalle y demo" : "Ver detalle");
  const industrias = item.industrias || [];
  const tituloAire = etiqueta || tieneEtiquetas || almaviva || xms || casosExito;

  return (
    <Link
      to={`/${ruta}/${item.slug}`}
      className={`group h-full rounded-2xl border border-tivit-red-light bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-tivit-red hover:shadow-md ${
        horizontal ? "grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center" : "flex flex-col p-6"
      }`}
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
            <span className="inline-flex w-fit rounded-full bg-tivit-red-light px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-tivit-red-dark">
              {etiqueta}
            </span>
          )}

          {almaviva && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <EtiquetaCodigo codigo={item.codigo} />
              <EtiquetaEstado estado={item.estado} />
              {industrias.length > 0 && (
                <span className="rounded-full bg-tivit-red-light px-2.5 py-0.5 text-xs font-semibold text-tivit-red-dark">
                  {industrias.length} {industrias.length === 1 ? "industria" : "industrias"}
                </span>
              )}
            </div>
          )}

          {xms && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <EtiquetaCodigo codigo={item.codigo} />
              <EtiquetaCategoria categoria={item.categoria} />
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
            className={`font-semibold text-tivit-red-dark transition group-hover:text-tivit-red ${
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

          <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-tivit-red">
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