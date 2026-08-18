import {
  BookOpen,
  Building2,
  CalendarClock,
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
import { Reveal } from "../Reveal";

/** Secciones propias del portafolio de Almaviva: ficha de producto en tarjetas
 *  agrupadas por tema, en lugar del bloque genérico de "Detalle del proyecto".
 *  Solo renderiza la información que cada producto tiene, por lo que el formato
 *  es uniforme para todos los productos del grupo. */
export function SeccionesAlmaviva({ item }) {
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
      cuerpo: <ListaIcono icono={CircleCheck} tono="text-almaviva-blue" items={resultados} />,
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
            <span className="text-sm font-semibold uppercase tracking-wide text-almaviva-blue">
              {grupo.titulo}
            </span>
            <div className="mt-4 grid items-start gap-5 md:grid-cols-2">
              {grupo.secciones.map((seccion) => (
                <TarjetaSeccion key={seccion.titulo} tema="almaviva" icono={seccion.icono} titulo={seccion.titulo}>
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
            <span className="text-sm font-semibold uppercase tracking-wide text-almaviva-blue">
              Información adicional
            </span>
            <div className="mt-4">
              <TarjetaSeccion tema="almaviva" icono={BookOpen} titulo="Contenido adicional">
                <Parrafo texto={item.contenidoExtra} />
              </TarjetaSeccion>
            </div>
          </section>
        </Reveal>
      )}
    </div>
  );
}

/** Temas de color de las tarjetas de sección según la colección de marca. */
const TEMAS_TARJETA = {
  tivit: {
    borde: "border-tivit-red-light",
    titulo: "text-tivit-red-dark",
    iconoCaja: "bg-tivit-red-light text-tivit-red",
  },
  xms: {
    borde: "border-xms-blue-light",
    titulo: "text-xms-blue-dark",
    iconoCaja: "bg-xms-blue-light text-xms-blue",
  },
  almaviva: {
    borde: "border-almaviva-blue-light",
    titulo: "text-almaviva-blue-dark",
    iconoCaja: "bg-almaviva-blue-light text-almaviva-blue",
  },
  exito: {
    borde: "border-exito-green-light",
    titulo: "text-exito-green-dark",
    iconoCaja: "bg-exito-green-light text-exito-green",
  },
  labs: {
    borde: "border-labs-celeste-light",
    titulo: "text-labs-celeste-dark",
    iconoCaja: "bg-labs-celeste-light text-labs-celeste",
  },
  proyectos: {
    borde: "border-proyectos-orange-light",
    titulo: "text-proyectos-orange-dark",
    iconoCaja: "bg-proyectos-orange-light text-proyectos-orange",
  },
  poc: {
    borde: "border-poc-blue-light",
    titulo: "text-poc-blue-dark",
    iconoCaja: "bg-poc-blue-light text-poc-blue",
  },
};

/** Tarjeta de sección con icono y título, base de la ficha de producto Almaviva.
 *  `tema` elige la paleta (tivit por defecto, xms o almaviva). */
export function TarjetaSeccion({ icono: Icono, titulo, children, tema = "tivit" }) {
  const t = TEMAS_TARJETA[tema];

  return (
    <article className={`flex h-full flex-col rounded-2xl border ${t.borde} bg-white p-6 shadow-sm`}>
      <h3 className={`flex items-center gap-3 text-base font-bold ${t.titulo}`}>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${t.iconoCaja}`}
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
export function ListaIcono({ items, icono: Icono = CircleCheck, tono = "text-tivit-red" }) {
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
export function Parrafo({ texto, clase = "text-sm text-tivit-ink/75" }) {
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