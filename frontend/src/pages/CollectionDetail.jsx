import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  CalendarClock,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Cpu,
  KeyRound,
  ListChecks,
  MonitorPlay,
  Network,
  Package,
  Ruler,
  ShieldCheck,
  Target,
  TrendingUp,
  Workflow,
  Wrench,
} from "lucide-react";
import { getColeccion, getItem, contenidoPendiente } from "../data/contenido";
import { SiteLayout } from "../components/SiteLayout";
import { DemoVideo } from "../components/DemoVideo";
import { Eyebrow } from "../components/SectionHeading";
import { EtiquetasItem, EtiquetaCodigo, EtiquetaTipo, EtiquetaEstado } from "../components/Etiquetas";
import { ClienteLinea } from "../components/ClienteLinea";
import { ChipsStack } from "../components/ChipsStack";
import { Reveal } from "../components/Reveal";

/** Ficha de detalle de un elemento: /proyectos/:slug, /laboratorio/:slug, … */
export function CollectionDetail({ ruta }) {
  const { slug } = useParams();
  const coleccion = getColeccion(ruta);
  const item = getItem(ruta, slug);

  if (!item) {
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
                {ruta === "almaviva"
                  ? item.categoria
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

            {ruta === "almaviva" && (item.categoria || item.tipo || item.estado) ? (
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
        </div>
      </article>
    </SiteLayout>
  );
}

function iniciales(nombre) {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join("");
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

function esVideoPlaceholder(video) {
  const url = typeof video === "string" ? video : video?.url;
  return !url || /assistdev-demo|auditia-demo/.test(url);
}

function AutorAvatar({ nombre, foto }) {
  const [error, setError] = useState(false);
  const iniciales = nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join("");

  if (!foto || error) {
    return (
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tivit-red-light text-sm font-bold text-tivit-red-dark">
        {iniciales}
      </span>
    );
  }

  return (
    <img
      src={foto}
      alt=""
      onError={() => setError(true)}
      className="h-12 w-12 shrink-0 rounded-full object-cover"
    />
  );
}

function ArchitectureDiagram({ tipo }) {
  if (tipo === "auditia") return <SecurityArchitectureDiagram />;

  const agentes = ["orchestrator", "design", "control", "delivery"];
  const mcps = ["Context7", "Playwright", "Docker", "Postgres", "GitHub"];

  return (
    <section className="pt-12">
      <Eyebrow>Arquitectura del framework</Eyebrow>
      <div className="mt-4 overflow-hidden rounded-2xl border border-tivit-red-light bg-tivit-ink p-6 text-white shadow-sm">
        <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
              Entrada
            </p>
            <div className="mt-2 rounded-xl border border-white/10 bg-white/10 p-4">
              <p className="font-semibold">Necesidad de negocio</p>
              <p className="mt-1 text-sm text-white/60">Contexto, requisitos y criterios de calidad</p>
            </div>
          </div>
          <div className="hidden text-2xl text-tivit-red-light md:block" aria-hidden="true">→</div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
              Capa agéntica
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {agentes.map((agente) => (
                <div key={agente} className="rounded-lg border border-tivit-red bg-[#2D151A] px-3 py-2 text-center text-sm font-bold text-white">
                  {agente}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
              Capacidades MCP
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {mcps.map((mcp) => (
                <span key={mcp} className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/75">
                  {mcp}
                </span>
              ))}
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/50">+5 más</span>
            </div>
          </div>
        </div>
        <div className="mt-6 border-t border-white/10 pt-4 text-center text-sm text-white/60">
          Skills especializadas · Gobernanza · Seguridad · Observabilidad · Código productivo
        </div>
      </div>
    </section>
  );
}

function SecurityArchitectureDiagram() {
  const reglas = ["A001–A012 agentes", "B001–B007 plataformas"];
  const salidas = ["Consola", "JSON", "DOCX", "Código de salida"];

  return (
    <section className="pt-12">
      <Eyebrow>Arquitectura de seguridad</Eyebrow>
      <div className="mt-4 overflow-hidden rounded-2xl border border-tivit-red-light bg-tivit-ink p-6 text-white shadow-sm">
        <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Entrada</p>
            <div className="mt-2 rounded-xl border border-white/15 bg-white/10 p-4">
              <p className="font-semibold">Repositorio local</p>
              <p className="mt-1 text-sm text-white/70">Código, configuración y políticas</p>
            </div>
          </div>
          <div className="hidden text-2xl text-tivit-red-light md:block" aria-hidden="true">→</div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Motor SAF</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {reglas.map((regla) => (
                <div key={regla} className="rounded-lg border border-tivit-red bg-[#2D151A] px-3 py-2 text-center text-sm font-bold text-white">
                  {regla}
                </div>
              ))}
              <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-center text-sm font-semibold">
                Políticas YAML
              </div>
              <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-center text-sm font-semibold">
                Quality gates
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Evidencia</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {salidas.map((salida) => (
                <span key={salida} className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80">
                  {salida}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 border-t border-white/10 pt-4 text-center text-sm text-white/70">
          Análisis local · Solo lectura · Severidad · Confianza · Remediación accionable
        </div>
      </div>
    </section>
  );
}

function SidebarMeta({ item, stack, ruta }) {
  const tipo = ruta === "almaviva"
    ? item.categoria
    : item.tipoSolucion || (item.categoria === "Producto"
    ? item.slug === "lab-003-auditia" ? "Framework de seguridad" : "Framework agéntico"
    : item.categoria === "Investigación" ? "Investigación aplicada" : item.categoria || "Proyecto de software");

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-tivit-red">Ficha técnica</h3>
      <dl className="mt-4 flex flex-col gap-3 text-sm">
        <div>
          <dt className="text-xs text-gray-600">Tipo de solución</dt>
          <dd className="mt-0.5 font-semibold text-tivit-ink">{tipo}</dd>
        </div>
        {ruta === "almaviva" && item.tipo && (
          <div>
            <dt className="text-xs text-gray-600">Proceso</dt>
            <dd className="mt-0.5 font-semibold text-tivit-ink">{item.tipo}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs text-gray-600">Estado</dt>
          <dd className="mt-1">
            <StatusBadge estado={item.estado || "Publicado"} />
          </dd>
        </div>
        {item.codigo && (
          <div>
            <dt className="text-xs text-gray-600">Referencia</dt>
            <dd className="mt-0.5 font-mono text-xs font-semibold text-tivit-ink/75">{item.codigo}</dd>
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

function VideoPlaceholder() {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-tivit-red-light bg-tivit-red-light/25 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-tivit-red" aria-hidden="true">
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l9.58-6.86a1.03 1.03 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
        </svg>
      </span>
      <p className="font-semibold text-tivit-red-dark">Video promocional en preparación</p>
      <p className="max-w-md text-sm text-tivit-ink/60">
        Próximamente podrás conocer Mercado Público Management en funcionamiento.
      </p>
    </div>
  );
}

function Galeria({ imagenes }) {
  return (
    <Reveal>
      <section className="pt-14">
        <Eyebrow>Galería</Eyebrow>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {imagenes.map((imagen) => (
            <ImagenGaleria key={imagen} src={imagen} />
          ))}
        </div>
      </section>
    </Reveal>
  );
}

function ImagenGaleria({ src }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setVisible(false)}
      className="aspect-video w-full rounded-2xl object-cover shadow-sm"
    />
  );
}

function Bloque({ titulo, children }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-2xl font-bold text-tivit-red-dark">{titulo}</h2>
      {children}
    </section>
  );
}

function ListaProblemas({ items }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item} className="flex gap-3 rounded-xl border border-tivit-red-light bg-tivit-red-light/20 p-4 text-sm text-tivit-ink/75">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-tivit-red" aria-hidden="true" />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function ListaPasos({ items }) {
  return (
    <ol className="relative flex flex-col gap-3 before:absolute before:bottom-5 before:left-[15px] before:top-5 before:w-px before:bg-tivit-red-light">
      {items.map((item, index) => (
        <li key={item} className="relative flex gap-4 rounded-xl border border-tivit-red-light/70 bg-white p-4 pl-3">
          <span className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tivit-red text-xs font-bold text-white">
            {String(index + 1).padStart(2, "0")}
          </span>
          <p className="pt-1 text-sm leading-relaxed text-tivit-ink/75">{item}</p>
        </li>
      ))}
    </ol>
  );
}

function ListaResultados({ items }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item, index) => (
        <div
          key={item}
          className={`rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 ${
            items.length % 2 === 1 && index === items.length - 1
              ? "sm:col-span-2 sm:flex sm:items-center sm:gap-4"
              : ""
          }`}
        >
          <CircleCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium leading-relaxed text-tivit-ink/80 sm:mt-3">{item}</p>
        </div>
      ))}
    </div>
  );
}

/** Secciones propias del portafolio de Almaviva: ficha de producto en tarjetas
 *  agrupadas por tema, en lugar del bloque genérico de "Detalle del proyecto".
 *  Solo renderiza la información que cada producto tiene, por lo que el formato
 *  es uniforme para todos los productos del grupo. */
function SeccionesAlmaviva({ item }) {
  const procesos = comoLista(item.procesos);
  const resultados = comoLista(item.resultados);
  const insumos = comoLista(item.insumos);

  const grupoProceso = [
    {
      titulo: "Procesos impactados",
      icono: Workflow,
      visible: procesos.length > 0,
      cuerpo: <ListaIcono icono={Workflow} items={procesos} />,
    },
    {
      titulo: "Resultados esperados",
      icono: TrendingUp,
      visible: resultados.length > 0,
      cuerpo: <ListaIcono icono={CircleCheck} tono="text-emerald-600" items={resultados} />,
    },
    {
      titulo: "Prerrequisitos",
      icono: ListChecks,
      visible: Boolean(item.prerrequisitos),
      cuerpo: <Parrafo texto={item.prerrequisitos} />,
    },
    {
      titulo: "Insumos requeridos",
      icono: Package,
      visible: insumos.length > 0,
      cuerpo: <ListaIcono icono={CircleAlert} items={insumos} />,
    },
  ].filter((seccion) => seccion.visible);

  const grupoComercial = [
    { titulo: "Clientes de referencia", icono: Building2, texto: item.clientesReferencia },
    { titulo: "Go-to-market", icono: Target, texto: item.gtm },
    { titulo: "Alcance", icono: Ruler, texto: item.alcance },
    { titulo: "Herramientas y demo", icono: MonitorPlay, texto: item.herramientas },
  ]
    .filter((seccion) => Boolean(seccion.texto))
    .map((seccion) => ({ ...seccion, cuerpo: <Parrafo texto={seccion.texto} /> }));

  const grupoTecnico = [
    { titulo: "Flexibilidad de IA", icono: Cpu, texto: item.flexibilidadIA },
    { titulo: "Soberanía y privacidad de datos", icono: ShieldCheck, texto: item.soberania },
    { titulo: "Arquitectura y framework", icono: Network, texto: item.framework },
  ]
    .filter((seccion) => Boolean(seccion.texto))
    .map((seccion) => ({ ...seccion, cuerpo: <Parrafo texto={seccion.texto} /> }));

  const grupoContrato = [
    { titulo: "Cronograma y riesgos", icono: CalendarClock, texto: item.cronogramaRiesgos },
    { titulo: "Servicios y soporte", icono: Wrench, texto: item.servicios },
    { titulo: "Licenciamiento", icono: KeyRound, texto: item.licenciamiento },
  ]
    .filter((seccion) => Boolean(seccion.texto))
    .map((seccion) => ({ ...seccion, cuerpo: <Parrafo texto={seccion.texto} /> }));

  const grupos = [
    { titulo: "Proceso y resultados", secciones: grupoProceso },
    { titulo: "Comercial y go-to-market", secciones: grupoComercial },
    { titulo: "Técnico y datos", secciones: grupoTecnico },
    { titulo: "Contrato y soporte", secciones: grupoContrato },
  ].filter((grupo) => grupo.secciones.length > 0);

  if (grupos.length === 0 && !item.contenidoExtra) return null;

  return (
    <div className="mt-16">
      {grupos.map((grupo) => (
        <Reveal key={grupo.titulo}>
          <section className="mb-14">
            <Eyebrow>{grupo.titulo}</Eyebrow>
            <div className="mt-4 grid items-start gap-5 md:grid-cols-2">
              {grupo.secciones.map((seccion) => (
                <TarjetaSeccion key={seccion.titulo} icono={seccion.icono} titulo={seccion.titulo}>
                  {seccion.cuerpo}
                </TarjetaSeccion>
              ))}
            </div>
          </section>
        </Reveal>
      ))}

      {item.contenidoExtra && (
        <Reveal>
          <section className="mb-14">
            <Eyebrow>Información adicional</Eyebrow>
            <div className="mt-4">
              <TarjetaSeccion icono={BookOpen} titulo="Contenido adicional">
                <Parrafo texto={item.contenidoExtra} />
              </TarjetaSeccion>
            </div>
          </section>
        </Reveal>
      )}
    </div>
  );
}

/** Tarjeta de sección con icono y título, base de la ficha de producto Almaviva. */
function TarjetaSeccion({ icono: Icono, titulo, children }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-tivit-red-light bg-white p-6 shadow-sm">
      <h3 className="flex items-center gap-3 text-base font-bold text-tivit-red-dark">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-tivit-red-light text-tivit-red"
          aria-hidden="true"
        >
          <Icono className="h-5 w-5" />
        </span>
        {titulo}
      </h3>
      <div className="mt-4 flex-1">{children}</div>
    </article>
  );
}

/** Lista simple con icono por ítem, para dentro de las tarjetas. */
function ListaIcono({ items, icono: Icono, tono = "text-tivit-red" }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="flex items-start gap-2.5 text-sm leading-relaxed text-tivit-ink/75"
        >
          <Icono className={`mt-0.5 h-4 w-4 shrink-0 ${tono}`} aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Renderiza un campo de texto largo respetando su estructura: párrafos,
 *  etiquetas (líneas con rótulo al inicio o final) y listas. */
function Parrafo({ texto, clase = "text-sm text-tivit-ink/75" }) {
  if (!texto) return null;

  const parrafos = String(texto)
    .split(/\n\s*\n/)
    .map((parrafo) => parrafo.trim())
    .filter(Boolean);

  return (
    <div className={`flex flex-col gap-3 leading-relaxed ${clase}`}>
      {parrafos.map((parrafo, index) => (
        <ParrafoBloque key={index} texto={parrafo} />
      ))}
    </div>
  );
}

function ParrafoBloque({ texto }) {
  const lineas = texto.split("\n").map((linea) => linea.trim()).filter(Boolean);
  if (lineas.length === 0) return null;

  const esLista = lineas.length > 1 && lineas.every((linea) => /^([-•·*]|\d+[.)])/.test(linea));
  const tieneEtiqueta = lineas.length > 1 && /:$/.test(lineas[0]);
  const esListaPuntual =
    lineas.length > 1 &&
    lineas.every((linea) => /\.$/.test(linea)) &&
    !lineas.some((linea) => /^[^:]{1,48}:|:$/.test(linea));

  if (esListaPuntual) {
    return (
      <ul className="flex flex-col gap-1.5">
        {lineas.map((linea, index) => (
          <li key={index} className="flex items-start gap-2.5">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-tivit-red/70" aria-hidden="true" />
            <span>{linea}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (tieneEtiqueta) {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="font-semibold text-tivit-ink">{lineas[0]}</p>
        <ul className="flex flex-col gap-1.5">
          {lineas.slice(1).map((linea, index) => (
            <li key={index} className="flex items-start gap-2.5">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-tivit-red/70" aria-hidden="true" />
              <span>{linea}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (esLista) {
    return (
      <ul className="flex flex-col gap-1.5">
        {lineas.map((linea, index) => (
          <li key={index} className="flex items-start gap-2.5">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-tivit-red/70" aria-hidden="true" />
            <span>{linea.replace(/^([-•·*]|\d+[.)])\s*/, "")}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {lineas.map((linea, index) =>
        /^[^:]{1,48}:/.test(linea) || /:$/.test(linea) ? (
          <p key={index} className="font-semibold text-tivit-ink">{linea}</p>
        ) : (
          <p key={index}>{linea}</p>
        )
      )}
    </div>
  );
}

/** Normaliza un campo que puede llegar como string o array a una lista. */
function comoLista(valor) {
  if (Array.isArray(valor)) return valor;
  return valor ? [String(valor)] : [];
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
