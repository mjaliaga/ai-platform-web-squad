import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { getColeccion, getItem, contenidoPendiente } from "../data/contenido";
import { SiteLayout } from "../components/SiteLayout";
import { DemoVideo } from "../components/DemoVideo";
import { Eyebrow } from "../components/SectionHeading";
import { BrandBanner } from "../components/BrandBanner";
import { EtiquetasItem, EtiquetaCodigo, EtiquetaTipo, EtiquetaEstado } from "../components/Etiquetas";
import { ClienteLinea } from "../components/ClienteLinea";
import { Reveal } from "../components/Reveal";
import { iniciales, esVideoPlaceholder } from "../lib/utils";
import { ArchitectureDiagram } from "../components/detalle/ArchitectureDiagram";
import { SeccionesLabs } from "../components/detalle/SeccionesLabs";
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

  const esXms = ruta === "xms";
  const esAlmaviva = ruta === "almaviva";
  const esExito = ruta === "casos-de-exito";
  const esLabs = ruta === "laboratorio";
  const esProyectos = ruta === "proyectos";
  const esPoc = ruta === "poc";
  const temaBloques = esLabs ? "labs" : esProyectos ? "proyectos" : esPoc ? "poc" : "tivit";
  const gradienteCarga = esXms
    ? "from-xms-blue-light"
    : esAlmaviva
      ? "from-almaviva-blue-light"
      : esExito
        ? "from-exito-green-light"
        : esLabs
          ? "from-labs-celeste-light"
          : esProyectos
            ? "from-proyectos-orange-light"
            : esPoc
              ? "from-poc-blue-light"
              : "from-tivit-red-light";
  const bordeSidebar = esXms
    ? "border-xms-blue-light"
    : esAlmaviva
      ? "border-almaviva-blue-light"
      : esExito
        ? "border-exito-green-light"
        : esLabs
          ? "border-labs-celeste-light"
          : esProyectos
            ? "border-proyectos-orange-light"
            : esPoc
              ? "border-poc-blue-light"
              : "border-tivit-red-light";
  const acentoSidebar = esXms
    ? "text-xms-blue"
    : esAlmaviva
      ? "text-almaviva-blue"
      : esExito
        ? "text-exito-green"
        : esLabs
          ? "text-labs-celeste"
          : esProyectos
            ? "text-proyectos-orange"
            : esPoc
              ? "text-poc-blue"
              : "text-tivit-red";

  if (cargando) {
    return (
      <SiteLayout>
        <div className={`bg-gradient-to-b ${gradienteCarga} to-white`}>
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
            className={`inline-block rounded-full px-6 py-3 font-semibold text-white transition active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-2 ${
              esXms
                ? "bg-xms-blue hover:bg-xms-blue-dark focus-visible:ring-xms-blue"
                : esAlmaviva
                  ? "bg-almaviva-blue hover:bg-almaviva-blue-dark focus-visible:ring-almaviva-blue"
                  : esExito
                    ? "bg-exito-green hover:bg-exito-green-dark focus-visible:ring-exito-green"
                    : esLabs
                      ? "bg-labs-celeste hover:bg-labs-celeste-dark focus-visible:ring-labs-celeste"
                      : esProyectos
                        ? "bg-proyectos-orange hover:bg-proyectos-orange-dark focus-visible:ring-proyectos-orange"
                        : esPoc
                          ? "bg-poc-blue hover:bg-poc-blue-dark focus-visible:ring-poc-blue"
                          : "bg-tivit-red hover:bg-tivit-red-dark focus-visible:ring-tivit-red"
            }`}
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
        <header>
        {esXms ? (
          <BrandBanner
            tema="xms"
            title={nombre}
            intro={
              <>
                {nombreProyecto && (
                  <p className="italic text-xms-ink/55">{nombreProyecto}</p>
                )}
                {item.cliente && (
                  <p className="mt-3 text-sm text-xms-ink/60">
                    <span className="font-medium text-xms-ink/75">Cliente:</span>{" "}
                    {item.cliente}
                  </p>
                )}
                {descripcion && <p className="mt-1">{descripcion}</p>}
              </>
            }
          >
            <nav aria-label="Ruta de navegación" className="flex flex-wrap items-center gap-1 text-sm">
              <Link
                to={`/${coleccion.ruta}`}
                className="rounded-md px-2 py-1 font-semibold text-xms-blue transition hover:bg-white/70 hover:underline"
              >
                {coleccion.nombre}
              </Link>
              <ChevronRight className="h-4 w-4 text-xms-ink/35" aria-hidden="true" />
              <span className="rounded-md px-2 py-1 font-medium text-xms-ink/60">
                {item.categoria}
              </span>
              <ChevronRight className="h-4 w-4 text-xms-ink/35" aria-hidden="true" />
              <span className="max-w-full truncate rounded-md px-2 py-1 font-semibold text-xms-ink/75">
                {nombre}
              </span>
            </nav>

            {item.categoria || item.codigo || item.tipoAgente ? (
              <div className="mt-5">
                <div className="flex flex-wrap items-center gap-2">
                  <EtiquetaCategoria categoria={item.categoria} xms />
                  <EtiquetaCodigo codigo={item.codigo} />
                  <EtiquetaTipo tipo={item.tipoAgente === "general" ? "Agente General" : "Agente específico"} />
                </div>
              </div>
            ) : null}
          </BrandBanner>
        ) : esAlmaviva ? (
          <BrandBanner
            tema="almaviva"
            title={nombre}
            intro={
              <>
                {nombreProyecto && (
                  <p className="italic text-almaviva-ink/55">{nombreProyecto}</p>
                )}
                {descripcion && <p className="mt-1">{descripcion}</p>}
              </>
            }
          >
            <nav aria-label="Ruta de navegación" className="flex flex-wrap items-center gap-1 text-sm">
              <Link
                to={`/${coleccion.ruta}`}
                className="rounded-md px-2 py-1 font-semibold text-almaviva-blue transition hover:bg-white/70 hover:underline"
              >
                {coleccion.nombre}
              </Link>
              <ChevronRight className="h-4 w-4 text-almaviva-ink/35" aria-hidden="true" />
              <span className="rounded-md px-2 py-1 font-medium text-almaviva-ink/60">
                {item.categoria}
              </span>
              <ChevronRight className="h-4 w-4 text-almaviva-ink/35" aria-hidden="true" />
              <span className="max-w-full truncate rounded-md px-2 py-1 font-semibold text-almaviva-ink/75">
                {nombre}
              </span>
            </nav>

            {item.categoria || item.tipo || item.estado ? (
              <div className="mt-5">
                <div className="flex flex-wrap items-center gap-2">
                  <EtiquetaCategoria categoria={item.categoria} almaviva />
                  <EtiquetaCodigo codigo={item.codigo} />
                  <EtiquetaTipo tipo={item.tipo} />
                  <EtiquetaEstado estado={item.estado} />
                </div>
              </div>
            ) : null}
          </BrandBanner>
          ) : esExito ? (
          <BrandBanner
            tema="exito"
            title={nombre}
            intro={
              <>
                {descripcion && <p className="mt-1">{descripcion}</p>}
                <ClienteLinea cliente={item.cliente} />
              </>
            }
          >
            <nav aria-label="Ruta de navegación" className="flex flex-wrap items-center gap-1 text-sm">
              <Link
                to={`/${coleccion.ruta}`}
                className="rounded-md px-2 py-1 font-semibold text-exito-green transition hover:bg-white/70 hover:underline"
              >
                {coleccion.nombre}
              </Link>
              <ChevronRight className="h-4 w-4 text-exito-ink/35" aria-hidden="true" />
              <span className="rounded-md px-2 py-1 font-medium text-exito-ink/60">
                {item.industria}
              </span>
              <ChevronRight className="h-4 w-4 text-exito-ink/35" aria-hidden="true" />
              <span className="max-w-full truncate rounded-md px-2 py-1 font-semibold text-exito-ink/75">
                {nombre}
              </span>
            </nav>

            {item.industria || item.codigo || item.estado ? (
              <div className="mt-5">
                <div className="flex flex-wrap items-center gap-2">
                  <EtiquetaCategoria categoria={item.industria} exito />
                  <EtiquetaCodigo codigo={item.codigo} />
                  <EtiquetaEstado estado={item.estado} />
                </div>
              </div>
            ) : null}
          </BrandBanner>
        ) : esLabs ? (
          <BrandBanner
            tema="labs"
            title={nombre}
            intro={
              <>
                {nombreProyecto && (
                  <p className="italic text-labs-ink/55">{nombreProyecto}</p>
                )}
                <ClienteLinea cliente={item.cliente} />
                {descripcion && <p className="mt-1">{descripcion}</p>}
              </>
            }
          >
            <nav aria-label="Ruta de navegación" className="flex flex-wrap items-center gap-1 text-sm">
              <Link
                to={`/${coleccion.ruta}`}
                className="rounded-md px-2 py-1 font-semibold text-labs-celeste transition hover:bg-white/70 hover:underline"
              >
                {coleccion.nombre}
              </Link>
              <ChevronRight className="h-4 w-4 text-labs-ink/35" aria-hidden="true" />
              <span className="rounded-md px-2 py-1 font-medium text-labs-ink/60">
                {item.categoria === "Producto"
                  ? "Productos"
                  : item.categoria === "Investigación"
                    ? "Investigación"
                    : item.categoria}
              </span>
              <ChevronRight className="h-4 w-4 text-labs-ink/35" aria-hidden="true" />
              <span className="max-w-full truncate rounded-md px-2 py-1 font-semibold text-labs-ink/75">
                {nombre}
              </span>
            </nav>

            {item.categoria || item.codigo || item.estado ? (
              <div className="mt-5">
                <div className="flex flex-wrap items-center gap-2">
                  <EtiquetaCategoria categoria={item.categoria} labs />
                  <EtiquetaCodigo codigo={item.codigo} />
                  <EtiquetaEstado estado={item.estado} />
                </div>
              </div>
            ) : null}
          </BrandBanner>
        ) : esProyectos ? (
          <BrandBanner
            tema="proyectos"
            title={nombre}
            intro={
              <>
                {nombreProyecto && (
                  <p className="italic text-proyectos-ink/55">{nombreProyecto}</p>
                )}
                <ClienteLinea cliente={item.cliente} />
                {descripcion && <p className="mt-1">{descripcion}</p>}
              </>
            }
          >
            <nav aria-label="Ruta de navegación" className="flex flex-wrap items-center gap-1 text-sm">
              <Link
                to={`/${coleccion.ruta}`}
                className="rounded-md px-2 py-1 font-semibold text-proyectos-orange transition hover:bg-white/70 hover:underline"
              >
                {coleccion.nombre}
              </Link>
              <ChevronRight className="h-4 w-4 text-proyectos-ink/35" aria-hidden="true" />
              <span className="max-w-full truncate rounded-md px-2 py-1 font-semibold text-proyectos-ink/75">
                {nombre}
              </span>
            </nav>

            {item.codigo || item.tipo || item.estado ? (
              <div className="mt-5">
                <EtiquetasItem item={item} tipoDestacado={coleccion.tipoDestacado} />
              </div>
            ) : null}
          </BrandBanner>
        ) : esPoc ? (
          <BrandBanner
            tema="poc"
            title={nombre}
            intro={
              <>
                {nombreProyecto && (
                  <p className="italic text-poc-ink/55">{nombreProyecto}</p>
                )}
                <ClienteLinea cliente={item.cliente} />
                {descripcion && <p className="mt-1">{descripcion}</p>}
              </>
            }
          >
            <nav aria-label="Ruta de navegación" className="flex flex-wrap items-center gap-1 text-sm">
              <Link
                to={`/${coleccion.ruta}`}
                className="rounded-md px-2 py-1 font-semibold text-poc-blue transition hover:bg-white/70 hover:underline"
              >
                {coleccion.nombre}
              </Link>
              <ChevronRight className="h-4 w-4 text-poc-ink/35" aria-hidden="true" />
              <span className="max-w-full truncate rounded-md px-2 py-1 font-semibold text-poc-ink/75">
                {nombre}
              </span>
            </nav>

            {item.codigo || item.tipo || item.estado ? (
              <div className="mt-5">
                <EtiquetasItem item={item} tipoDestacado={coleccion.tipoDestacado} />
              </div>
            ) : null}
          </BrandBanner>
        ) : (
        <div className="bg-gradient-to-b from-tivit-red-light to-white">
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
                {ruta === "casos-de-exito"
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

            {ruta === "casos-de-exito" && (item.industria || item.codigo || item.estado) ? (
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
        </div>
        )}
        </header>

        <div className="mx-auto max-w-5xl px-6 pb-24">
          <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="min-w-0">
              <aside className={`mb-10 rounded-2xl border bg-white p-5 shadow-sm md:hidden ${bordeSidebar}`}>
                <SidebarMeta item={item} stack={stack} ruta={ruta} />
                {equipo.length > 0 && <EquipoCard equipo={equipo} acento={acentoSidebar} />}
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
              {item.slug === "lab-002-assistdev" ? (
                <SeccionesLabs item={item} />
              ) : (
                <ArchitectureDiagram tipo="auditia" />
              )}
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
                  {autores.map((autor, idx) => {
                    const nombre = autor?.nombre ?? String(autor ?? "");
                    const rol = autor?.rol ?? "";
                    return (
                      <div
                        key={`${idx}-${nombre}`}
                        className="flex items-center gap-3 rounded-2xl bg-tivit-red-light/50 p-4"
                      >
                        <AutorAvatar nombre={nombre} foto={autor?.foto} />
                        <div>
                          <p className="text-sm font-semibold text-tivit-ink">{nombre}</p>
                          {rol && <p className="text-xs text-tivit-ink/60">{rol}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </Reveal>
          )}

          {pendiente ? (
            <Reveal>
              <div
                className={`mt-8 rounded-2xl border p-8 ${
                  esLabs
                    ? "border-labs-celeste-light bg-labs-celeste-light/30"
                    : esProyectos
                      ? "border-proyectos-orange-light bg-proyectos-orange-light/30"
                      : esPoc
                        ? "border-poc-blue-light bg-poc-blue-light/30"
                        : "border-tivit-red-light bg-tivit-red-light/30"
                }`}
              >
                <h2
                  className={`text-xl font-bold ${
                    esLabs
                      ? "text-labs-celeste-dark"
                      : esProyectos
                        ? "text-proyectos-orange-dark"
                        : esPoc
                          ? "text-poc-blue-dark"
                          : "text-tivit-red-dark"
                  }`}
                >
                  Ficha en preparación
                </h2>
                <p className="mt-2 max-w-2xl text-tivit-ink/70">
                  Falta completar la descripción, los videos, el equipo, las
                  tecnologías, los problemas y los resultados de este proyecto.
                </p>
                <p className="mt-4 text-sm text-tivit-ink/55">
                  Estos datos se gestionan desde{" "}
                  <code className="rounded bg-white px-1 py-0.5 text-xs">/portal/cms</code>
                  {" "}según la colección correspondiente.
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
                            <VideoPlaceholder nombre={nombre} />
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

              {item.highlights?.length > 0 && (
                <Reveal>
                  <section className="pt-10">
                    <Eyebrow>Cifras clave</Eyebrow>
                    <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {item.highlights.map((h, idx) => {
                        const valor = h?.valor ?? String(h ?? "");
                        const etiqueta = h?.etiqueta ?? "";
                        const detalle = h?.detalle ?? "";
                        return (
                          <div
                            key={`${idx}-${etiqueta}`}
                            className="rounded-2xl border border-proyectos-orange-light bg-white/80 p-4 shadow-sm backdrop-blur-sm"
                          >
                            <dd className="text-3xl font-bold text-proyectos-orange-dark">{valor}</dd>
                            <dt className="mt-1 text-xs font-semibold uppercase tracking-wide text-proyectos-orange">
                              {etiqueta}
                            </dt>
                            <p className="mt-1 text-xs text-tivit-ink/60">{detalle}</p>
                          </div>
                        );
                      })}
                    </dl>
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
                      <Bloque titulo="Problemas a enfrentar" tema={temaBloques}>
                        <ListaProblemas items={problemas} tema={temaBloques} />
                      </Bloque>
                    )}
                    {queHicimos.length > 0 && (
                      <Bloque titulo="Qué hicimos" tema={temaBloques}>
                        <ListaPasos items={queHicimos} tema={temaBloques} />
                      </Bloque>
                    )}
                    {resultados.length > 0 && (
                      <Bloque titulo="Resultados" tema={temaBloques}>
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
                      className={`inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white shadow-sm transition active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-2 ${
                        esXms
                          ? "bg-xms-blue hover:bg-xms-blue-dark focus-visible:ring-xms-blue"
                          : esAlmaviva
                            ? "bg-almaviva-blue hover:bg-almaviva-blue-dark focus-visible:ring-almaviva-blue"
                            : esExito
                              ? "bg-exito-green hover:bg-exito-green-dark focus-visible:ring-exito-green"
                              : esLabs
                                ? "bg-labs-celeste hover:bg-labs-celeste-dark focus-visible:ring-labs-celeste"
                                : esProyectos
                                  ? "bg-proyectos-orange hover:bg-proyectos-orange-dark focus-visible:ring-proyectos-orange"
                                  : esPoc
                                    ? "bg-poc-blue hover:bg-poc-blue-dark focus-visible:ring-poc-blue"
                                    : "bg-tivit-red hover:bg-tivit-red-dark focus-visible:ring-tivit-red"
                      }`}
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

            <aside className={`hidden self-start rounded-2xl border bg-white p-5 shadow-sm md:sticky md:top-24 md:block ${bordeSidebar}`}>
              <SidebarMeta item={item} stack={stack} ruta={ruta} />
              {equipo.length > 0 && <EquipoCard equipo={equipo} acento={acentoSidebar} />}
            </aside>
          </div>

          <RelatedItems ruta={ruta} slug={slug} />
        </div>
      </article>
    </SiteLayout>
  );
}

/**
 * Convierte un enlace de Google Drive/Docs en su URL de preview para iframe.
 * SEC-003: Restringimos estrictamente a hosts legítimos de Google para evitar
 * que un atacante inyecte un javascript: o un dominio arbitrario vía CMS.
 */
function documentoPreviewUrl(url) {
  if (!url || typeof url !== "string") return "";
  // Whitelist: solo http(s) hacia dominios conocidos de Google.
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return "";
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";
  const allowedHosts = new Set([
    "docs.google.com",
    "drive.google.com",
    "www.googleapis.com",
  ]);
  if (!allowedHosts.has(parsed.hostname)) return "";

  const doc = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (doc) return `https://docs.google.com/document/d/${doc[1]}/preview`;
  const file = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (file) return `https://drive.google.com/file/d/${file[1]}/preview`;
  // Si no encaja con los formatos conocidos pero el host es válido, no
  // devolvemos la URL original (sería un riesgo) — preferimos no renderizar.
  return "";
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