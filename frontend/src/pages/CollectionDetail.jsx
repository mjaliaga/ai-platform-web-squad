import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { getColeccion, getItem, contenidoPendiente } from "../data/contenido";
import { SiteLayout } from "../components/SiteLayout";
import { DemoVideo } from "../components/DemoVideo";
import { Eyebrow } from "../components/SectionHeading";
import { EtiquetasItem, EtiquetaCodigo, EtiquetaTipo, EtiquetaEstado } from "../components/Etiquetas";
import { ClienteLinea } from "../components/ClienteLinea";
import { Reveal } from "../components/Reveal";
import { iniciales, esVideoPlaceholder } from "../lib/utils";
import { ArchitectureDiagram } from "../components/detalle/ArchitectureDiagram";
import { SidebarMeta, EquipoCard, EtiquetaCategoria } from "../components/detalle/SidebarMeta";
import { Bloque, ListaProblemas, ListaPasos, ListaResultados } from "../components/detalle/Bloques";
import { SeccionesAlmaviva, Parrafo } from "../components/detalle/SeccionesAlmaviva";
import { SeccionesXms } from "../components/detalle/SeccionesXms";
import { SeccionesCasosExito } from "../components/detalle/SeccionesCasosExito";
import { Galeria } from "../components/detalle/Galeria";
import { VideoPlaceholder } from "../components/detalle/VideoPlaceholder";
import { SkeletonDetail } from "../components/Skeleton";
import { RelatedItems } from "../components/RelatedItems";

/** Ficha de detalle de un elemento: /proyectos/:slug, /laboratorio/:slug, … */
export function CollectionDetail({ ruta }) {
  const { slug } = useParams();
  const coleccion = getColeccion(ruta);
  const [item, setItem] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [noEncontrado, setNoEncontrado] = useState(false);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setNoEncontrado(false);
    getItem(ruta, slug)
      .then((res) => {
        if (!activo) return;
        if (res) setItem(res);
        else setNoEncontrado(true);
      })
      .catch(() => activo && setNoEncontrado(true))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [ruta, slug]);

  if (cargando) {
    return (
      <SiteLayout>
        <div className="bg-gradient-to-b from-tivit-red-light to-white">
          <div className="mx-auto max-w-5xl px-6 py-14">
            <div className="skeleton h-4 w-40 rounded-full" />
            <div className="skeleton mt-6 h-9 w-2/3 rounded-full" />
            <div className="skeleton mt-4 h-4 w-1/2 rounded-full" />
          </div>
        </div>
        <SkeletonDetail />
      </SiteLayout>
    );
  }

  if (noEncontrado || !item) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-6 py-32 text-center">
          <h1 className="text-3xl font-bold text-tivit-red-dark">Contenido no encontrado</h1>
          <p className="mt-3 text-tivit-ink/70">
            Lo que buscas no existe o cambió de dirección.
          </p>
          <Link
            to={`/${coleccion.ruta}`}
            className="mt-8 inline-block rounded-full bg-tivit-red px-6 py-3 font-semibold text-white transition hover:bg-tivit-red-dark"
          >
            {coleccion.cta}
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const pendiente = contenidoPendiente(item);
  const nombre = item.nombreComercial || item.name;
  const nombreProyecto = item.nombreProyecto && item.nombreProyecto !== nombre ? item.nombreProyecto : null;
  const descripcion = item.descripcion || item.description;
  const videoPromo = esVideoPlaceholder(item.videoPromocional || item.demo)
    ? null
    : item.videoPromocional || item.demo;
  const videoTec = item.videoTecnico;
  const problemas = item.problemas?.length
    ? item.problemas
    : item.contexto
      ? [item.contexto]
      : [];
  const queHicimos = item.queHicimos || [];
  const resultados = item.resultados || [];
  const equipo = item.equipo || [];
  const autores = item.autores || [];
  const stack = item.stack || [];
  const galeria = item.galeria || [];
  const hayVideos = Boolean(videoPromo || videoTec || item.videoPlaceholder);
  const urlProyecto = item.urlProyecto || item.documentacion;

  return (
    <SiteLayout>
      <article>
        <header className="bg-gradient-to-b from-tivit-red-light to-white">
          <div className="mx-auto max-w-5xl px-6 py-14">
            <nav aria-label="Ruta de navegación" className="flex flex-wrap items-center gap-1 text-sm">
              <Link
                to={`/${coleccion.ruta}`}
                className="rounded-md px-2 py-1 font-semibold text-tivit-red transition hover:bg-white/70 hover:underline"
              >
                {coleccion.nombre}
              </Link>
              <ChevronRight className="h-4 w-4 text-tivit-ink/35" aria-hidden="true" />
              <span className="rounded-md px-2 py-1 font-medium text-tivit-ink/60">
                {ruta === "almaviva" || ruta === "xms"
                  ? item.categoria
                  : ruta === "casos-de-exito"
                    ? item.industria
                    : item.categoria === "Producto"
                      ? "Productos"
                      : item.categoria === "Investigación"
                        ? "Investigación"
                        : coleccion.nombre}
              </span>
              <ChevronRight className="h-4 w-4 text-tivit-ink/35" aria-hidden="true" />
              <span className="max-w-full truncate rounded-md px-2 py-1 font-semibold text-tivit-ink/75">
                {nombre}
              </span>
            </nav>

            {ruta === "xms" && (item.categoria || item.codigo || item.tipoAgente) ? (
              <div className="mt-6">
                <div className="flex flex-wrap items-center gap-2">
                  <EtiquetaCategoria categoria={item.categoria} />
                  <EtiquetaCodigo codigo={item.codigo} />
                  <EtiquetaTipo tipo={item.tipoAgente === "general" ? "Agente General" : "Agente específico"} />
                </div>
              </div>
            ) : ruta === "casos-de-exito" && (item.industria || item.codigo || item.estado) ? (
              <div className="mt-6">
                <div className="flex flex-wrap items-center gap-2">
                  <EtiquetaCategoria categoria={item.industria} />
                  <EtiquetaCodigo codigo={item.codigo} />
                  <EtiquetaEstado estado={item.estado} />
                </div>
              </div>
            ) : ruta === "almaviva" && (item.categoria || item.tipo || item.estado) ? (
              <div className="mt-6">
                <div className="flex flex-wrap items-center gap-2">
                  <EtiquetaCategoria categoria={item.categoria} />
                  <EtiquetaCodigo codigo={item.codigo} />
                  <EtiquetaTipo tipo={item.tipo} />
                  <EtiquetaEstado estado={item.estado} />
                </div>
              </div>
            ) : !coleccion.sinClasificaciones && (item.codigo || item.tipo || item.estado) ? (
              <div className="mt-6">
                <EtiquetasItem item={item} tipoDestacado={coleccion.tipoDestacado} />
              </div>
            ) : null}

            <h1 className="mt-3 max-w-3xl text-4xl font-bold text-tivit-red-dark">{nombre}</h1>

            {nombreProyecto && (
              <p className="mt-2 max-w-3xl text-lg italic text-tivit-ink/55">{nombreProyecto}</p>
            )}

            <ClienteLinea cliente={item.cliente} />

            {descripcion && (
              <p className="mt-3 max-w-2xl text-lg text-tivit-ink/70">{descripcion}</p>
            )}
          </div>
        </header>

        <div className="mx-auto max-w-5xl px-6 pb-24">
          <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="min-w-0">
              <aside className="mb-10 rounded-2xl border border-tivit-red-light bg-white p-5 shadow-sm md:hidden">
                <SidebarMeta item={item} stack={stack} ruta={ruta} />
                {equipo.length > 0 && <EquipoCard equipo={equipo} />}
              </aside>

          {item.descripcionLarga && (
            <Reveal>
              <section className="pt-10">
                <Eyebrow>Resumen</Eyebrow>
                {ruta === "almaviva" ? (
                  <div className="mt-3">
                    <Parrafo texto={item.descripcionLarga} clase="text-lg text-tivit-ink/80" />
                  </div>
                ) : (
                  <p className="mt-3 max-w-3xl whitespace-pre-line text-lg leading-relaxed text-tivit-ink/80">
                    {item.descripcionLarga}
                  </p>
                )}
              </section>
            </Reveal>
          )}

          {(item.slug === "lab-002-assistdev" || item.slug === "lab-003-auditia") && (
            <Reveal>
              <ArchitectureDiagram tipo={item.slug === "lab-003-auditia" ? "auditia" : "assistdev"} />
            </Reveal>
          )}

          {item.documentoDrive && (
            <Reveal>
              <section className="pt-10">
                <Eyebrow>Documento</Eyebrow>
                <div className="mt-3 overflow-hidden rounded-2xl border border-tivit-red-light shadow-sm">
                  <iframe
                    src={documentoPreviewUrl(item.documentoDrive)}
                    title={`Documento de ${nombre}`}
                    className="h-[75vh] w-full"
                    allow="autoplay"
                  />
                </div>
                <p className="mt-2 text-xs text-tivit-ink/50">
                  Si el documento no se ve, ábrelo{" "}
                  <a
                    href={item.documentoDrive}
                    target="_blank"
                    rel="noreferrer"
                    className="text-tivit-red underline"
                  >
                    en Google Drive
                  </a>
                  .
                </p>
              </section>
            </Reveal>
          )}

          {autores.length > 0 && (
            <Reveal>
              <section className="pt-12">
                <Eyebrow>Autores</Eyebrow>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {autores.map((autor) => (
                    <div
                      key={autor.nombre}
                      className="flex items-center gap-3 rounded-2xl bg-tivit-red-light/50 p-4"
                    >
                      <AutorAvatar nombre={autor.nombre} foto={autor.foto} />
                      <div>
                        <p className="text-sm font-semibold text-tivit-ink">{autor.nombre}</p>
                        {autor.rol && <p className="text-xs text-tivit-ink/60">{autor.rol}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </Reveal>
          )}

          {pendiente ? (
            <Reveal>
              <div className="mt-8 rounded-2xl border border-tivit-red-light bg-tivit-red-light/30 p-8">
                <h2 className="text-xl font-bold text-tivit-red-dark">Ficha en preparación</h2>
                <p className="mt-2 max-w-2xl text-tivit-ink/70">
                  Falta completar la descripción, los videos, el equipo, las
                  tecnologías, los problemas y los resultados de este proyecto.
                </p>
                <p className="mt-4 text-sm text-tivit-ink/55">
                  Estos datos se cargan desde{" "}
                  <code className="rounded bg-white px-1 py-0.5 text-xs">data/proyectos.csv</code>{" "}
                  con <code className="rounded bg-white px-1 py-0.5 text-xs">scripts/cargar_proyectos.py</code>.
                </p>
              </div>
            </Reveal>
          ) : (
            <>
              {hayVideos && (
                <Reveal>
                  <section className="pt-10">
                    <div
                      className={`grid gap-6 ${videoPromo && videoTec ? "md:grid-cols-2" : "md:grid-cols-1"}`}
                    >
                      {videoPromo ? (
                        <div>
                          <Eyebrow>Video promocional</Eyebrow>
                          <div className="mt-3">
                            <DemoVideo demo={videoPromo} titulo={nombre} />
                          </div>
                        </div>
                      ) : item.videoPlaceholder ? (
                        <div>
                          <Eyebrow>Video promocional</Eyebrow>
                          <div className="mt-3">
                            <VideoPlaceholder />
                          </div>
                        </div>
                      ) : null}
                      {videoTec ? (
                        <div>
                          <Eyebrow>Video técnico</Eyebrow>
                          <div className="mt-3">
                            <DemoVideo demo={videoTec} titulo={nombre} />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </section>
                </Reveal>
              )}

              {ruta !== "almaviva" &&
                ruta !== "xms" &&
                ruta !== "casos-de-exito" &&
                (problemas.length > 0 ||
                queHicimos.length > 0 ||
                resultados.length > 0 ||
                equipo.length > 0 ||
                stack.length > 0) && (
                <div className="mt-14">
                  <Reveal>
                    {problemas.length > 0 && (
                      <Bloque titulo="Problemas a enfrentar">
                        <ListaProblemas items={problemas} />
                      </Bloque>
                    )}
                    {queHicimos.length > 0 && (
                      <Bloque titulo="Qué hicimos">
                        <ListaPasos items={queHicimos} />
                      </Bloque>
                    )}
                    {resultados.length > 0 && (
                      <Bloque titulo="Resultados">
                        <ListaResultados items={resultados} />
                      </Bloque>
                    )}
                  </Reveal>
                </div>
              )}

              {ruta === "almaviva" && <SeccionesAlmaviva item={item} />}

              {ruta === "xms" && <SeccionesXms item={item} />}

              {ruta === "casos-de-exito" && <SeccionesCasosExito item={item} />}

              {galeria.length > 0 && (
                <Galeria imagenes={galeria} />
              )}

              {urlProyecto && (
                <Reveal>
                  <section className="pt-10">
                    <a
                      href={urlProyecto}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-tivit-red px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-tivit-red-dark active:scale-95 focus-visible:ring-2 focus-visible:ring-tivit-red focus-visible:ring-offset-2"
                    >
                      {item.urlProyecto ? "Acceder al proyecto" : "Ver documentación"}
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </section>
                </Reveal>
              )}
            </>
          )}
            </div>

            <aside className="hidden self-start rounded-2xl border border-tivit-red-light bg-white p-5 shadow-sm md:sticky md:top-24 md:block">
              <SidebarMeta item={item} stack={stack} ruta={ruta} />
              {equipo.length > 0 && <EquipoCard equipo={equipo} />}
            </aside>
          </div>

          <RelatedItems ruta={ruta} slug={slug} />
        </div>
      </article>
    </SiteLayout>
  );
}

/** Convierte un enlace de Google Drive/Docs en su URL de preview para iframe. */
function documentoPreviewUrl(url) {
  if (!url) return "";
  const doc = url.match(/docs\.google\.com\/document\/d\/([\w-]+)/);
  if (doc) return `https://docs.google.com/document/d/${doc[1]}/preview`;
  const file = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (file) return `https://drive.google.com/file/d/${file[1]}/preview`;
  return url;
}

function AutorAvatar({ nombre, foto }) {
  const [error, setError] = useState(false);
  const inicialesNombre = iniciales(nombre);

  if (!foto || error) {
    return (
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tivit-red-light text-sm font-bold text-tivit-red-dark">
        {inicialesNombre}
      </span>
    );
  }

  return (
    <img
      src={foto}
      alt=""
      width={48}
      height={48}
      onError={() => setError(true)}
      className="h-12 w-12 shrink-0 rounded-full object-cover"
    />
  );
}