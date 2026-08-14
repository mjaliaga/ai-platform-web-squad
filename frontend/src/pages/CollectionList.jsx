import { useState } from "react";
import { getColeccion, itemsPublicados, VACIO_DEFAULT } from "../data/contenido";
import { SiteLayout } from "../components/SiteLayout";
import { Eyebrow } from "../components/SectionHeading";
import { ItemCard } from "../components/ItemCard";
import { FilterBar } from "../components/FilterBar";

/** Página de listado de una colección: /proyectos, /casos-de-exito, /laboratorio, /poc */
export function CollectionList({ ruta }) {
  const coleccion = getColeccion(ruta);
  const publicados = itemsPublicados(coleccion);

  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const soloArea = Boolean(coleccion.soloArea);
  const sinClasificaciones = Boolean(coleccion.sinClasificaciones);
  const tipos = sinClasificaciones
    ? []
    : [...new Set(publicados.map((item) => item.tipo).filter(Boolean))];
  const estados = soloArea || sinClasificaciones
    ? []
    : [...new Set(publicados.map((item) => item.estado).filter(Boolean))];

  const filtrados = publicados.filter(
    (item) =>
      (filtroTipo === "Todos" || item.tipo === filtroTipo) &&
      (filtroEstado === "Todos" || item.estado === filtroEstado)
  );

  return (
    <SiteLayout>
      <div className="bg-gradient-to-b from-tivit-red-light to-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <Eyebrow>{coleccion.nombre}</Eyebrow>
          <h1 className="mt-1 max-w-3xl text-4xl font-bold text-tivit-red-dark">
            {coleccion.titulo}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-tivit-ink/70">{coleccion.intro}</p>
          {coleccion.ruta === "laboratorio" && (
            <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
              <DatoLaboratorio
                valor={publicados.length}
                etiqueta="Publicaciones"
                detalle="Productos e investigaciones"
              />
              <DatoLaboratorio
                valor={publicados.filter((item) => item.categoria === "Producto").length}
                etiqueta="Frameworks"
                detalle="Herramientas reutilizables"
              />
              <DatoLaboratorio
                valor={publicados.filter((item) => item.categoria === "Investigación").length}
                etiqueta="Investigación"
                detalle="Estudios en profundidad"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-24">
        {publicados.length === 0 ? (
          <EstadoVacio coleccion={coleccion} />
        ) : (
          <>
            <FilterBar
              tipos={tipos}
              estados={estados}
              filtroTipo={filtroTipo}
              filtroEstado={filtroEstado}
              onTipo={setFiltroTipo}
              onEstado={setFiltroEstado}
              tipoEtiqueta={coleccion.filtroTipoEtiqueta}
            />

            {coleccion.agruparPor ? (
              coleccion.agruparPor.map((grupo) => (
                <Grupo
                  key={grupo.valor}
                  titulo={grupo.titulo}
                  items={filtrados.filter((item) => item[grupo.campo ?? "tipo"] === grupo.valor)}
                  coleccion={coleccion}
                  etiqueta={grupo.etiqueta}
                  horizontal={
                    grupo.horizontal &&
                    filtrados.filter((item) => item[grupo.campo ?? "tipo"] === grupo.valor).length === 1
                  }
                  cta={grupo.cta}
                />
              ))
            ) : (
              <Grupo items={filtrados} coleccion={coleccion} />
            )}

            {filtrados.length === 0 && (
              <p className="pt-10 text-sm text-tivit-ink/60">
                No hay elementos que coincidan con los filtros seleccionados.
              </p>
            )}
          </>
        )}
      </div>
    </SiteLayout>
  );
}

function DatoLaboratorio({ valor, etiqueta, detalle }) {
  return (
    <div className="rounded-xl border border-white/80 bg-white/60 px-4 py-3 shadow-sm backdrop-blur-sm">
      <p className="text-2xl font-bold text-tivit-red-dark">{valor}</p>
      <p className="text-xs font-semibold uppercase tracking-wide text-tivit-red">{etiqueta}</p>
      <p className="mt-1 text-xs text-tivit-ink/60">{detalle}</p>
    </div>
  );
}

function Grupo({ titulo, items, coleccion, etiqueta, horizontal, cta }) {
  if (items.length === 0) return null;

  return (
    <section className="pt-14">
      {titulo && <h2 className="text-2xl font-bold text-tivit-red-dark">{titulo}</h2>}
      <div className={`grid gap-6 ${horizontal ? "mt-6" : titulo ? "mt-6 md:grid-cols-2" : "mt-2 md:grid-cols-2"}`}>
        {items.map((item) => (
          <ItemCard
            key={item.slug}
            item={item}
            ruta={coleccion.ruta}
            tipoDestacado={coleccion.tipoDestacado}
            soloArea={coleccion.soloArea}
            sinEtiquetas={coleccion.sinClasificaciones}
            etiqueta={etiqueta}
            horizontal={horizontal}
            cta={cta}
            almaviva={coleccion.ruta === "almaviva"}
          />
        ))}
      </div>
    </section>
  );
}

function EstadoVacio({ coleccion }) {
  const vacio = coleccion.vacio ?? VACIO_DEFAULT;

  return (
    <div className="mt-14 rounded-2xl border-2 border-dashed border-tivit-red-light bg-tivit-red-light/20 px-8 py-16 text-center">
      <h2 className="text-xl font-bold text-tivit-red-dark">{vacio.titulo}</h2>
      <p className="mx-auto mt-2 max-w-xl text-tivit-ink/70">{vacio.mensaje}</p>
    </div>
  );
}
