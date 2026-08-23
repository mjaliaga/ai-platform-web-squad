import {
  ArrowRight,
  CheckCircle,
  FileText,
  GitBranch,
  Layers,
  MessageSquare,
  Package,
  Rocket,
  ShieldCheck,
  Wrench,
  Workflow,
  Zap,
} from "lucide-react";
import { Reveal } from "../Reveal";
import { TarjetaSeccion } from "./SeccionesAlmaviva";

const ICONOS = {
  MessageSquare,
  Workflow,
  FileText,
  CheckCircle,
  Rocket,
  Package,
  Zap,
  GitBranch,
  ShieldCheck,
  Layers,
  Wrench,
};

/** Normaliza un item que puede venir como string (datos estáticos) o como objeto
 *  `{value: "..."}` (datos del CMS) a un string renderizable. */
function normalizarItem(item) {
  if (item === null || item === undefined) return "";
  if (typeof item === "string") return item;
  if (typeof item === "object" && "value" in item) return String(item.value ?? "");
  return String(item);
}

/** Secciones propias de Tivit Labs. Hoy solo AssistDev usa el ciclo de vida,
 *  los puntos clave, las ventajas y el stack agrupado. Si en el futuro hay
 *  otros productos con la misma estructura, basta con añadir los campos al
 *  item y este componente los renderiza automáticamente. */
export function SeccionesLabs({ item }) {
  if (!item) return null;

  const tieneCiclo = Array.isArray(item.cicloVida) && item.cicloVida.length > 0;
  const tienePuntos = Array.isArray(item.puntosClave) && item.puntosClave.length > 0;
  const tieneVentajas = Array.isArray(item.ventajas) && item.ventajas.length > 0;
  const tieneStack = Array.isArray(item.stackAgrupado) && item.stackAgrupado.length > 0;

  if (!tieneCiclo && !tienePuntos && !tieneVentajas && !tieneStack) return null;

  return (
    <div className="mt-16">
      {tieneCiclo && (
        <Reveal>
          <section className="mb-14">
            <span className="text-sm font-semibold uppercase tracking-wide text-labs-celeste-dark">
              Flujo del ciclo de vida
            </span>
            <h3 className="mt-1 text-2xl font-bold text-tivit-ink">Fases secuenciales</h3>
            <CicloVidaPipeline fases={item.cicloVida} />
          </section>
        </Reveal>
      )}

      {tienePuntos && (
        <Reveal>
          <section className="mb-14">
            <span className="text-sm font-semibold uppercase tracking-wide text-labs-celeste-dark">
              Puntos clave
            </span>
            <h3 className="mt-1 text-2xl font-bold text-tivit-ink">Lo que define al framework</h3>
            <PuntosClaveStrip puntos={item.puntosClave} />
          </section>
        </Reveal>
      )}

      {tieneVentajas && (
        <Reveal>
          <section className="mb-14">
            <span className="text-sm font-semibold uppercase tracking-wide text-labs-celeste-dark">
              Ventajas
            </span>
            <h3 className="mt-1 text-2xl font-bold text-tivit-ink">Por qué importa</h3>
            <div className="mt-6 grid items-start gap-5 md:grid-cols-2 lg:grid-cols-3">
              {item.ventajas.map((ventaja) => {
                const Icono = ICONOS[ventaja.icono] ?? CheckCircle;
                return (
                  <TarjetaSeccion key={ventaja.titulo} tema="labs" icono={Icono} titulo={ventaja.titulo}>
                    <p className="text-sm leading-relaxed text-tivit-ink/75">{ventaja.descripcion}</p>
                  </TarjetaSeccion>
                );
              })}
            </div>
          </section>
        </Reveal>
      )}

      {tieneStack && (
        <Reveal>
          <section className="mb-14">
            <span className="text-sm font-semibold uppercase tracking-wide text-labs-celeste-dark">
              Stack de referencia
            </span>
            <h3 className="mt-1 text-2xl font-bold text-tivit-ink">Tecnologías</h3>
            <StackAgrupado grupos={item.stackAgrupado} />
          </section>
        </Reveal>
      )}
    </div>
  );
}

/** Pipeline horizontal de6 fases con flechas. En mobile se apila vertical. */
function CicloVidaPipeline({ fases }) {
  return (
    <ol className="mt-6 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {fases.map((fase, index) => {
        const Icono = ICONOS[fase.icono] ?? Workflow;
        return (
          <li
            key={fase.fase}
            className="relative flex h-full flex-col rounded-2xl border border-labs-celeste-light bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-labs-pink">
                Fase {fase.fase}
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-labs-celeste-light text-labs-celeste-dark">
                <Icono className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <h4 className="mt-3 text-base font-bold text-tivit-ink">{fase.titulo}</h4>
            <p className="mt-2 text-sm leading-relaxed text-tivit-ink/70">{fase.descripcion}</p>
            {index < fases.length - 1 && (
              <ArrowRight
                className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-labs-celeste lg:block"
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Strip horizontal de stats con número grande (estilo métricas del Hero / DeskFlow). */
function PuntosClaveStrip({ puntos }) {
  return (
    <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {puntos.map((punto) => (
        <div
          key={punto.etiqueta}
          className="rounded-2xl border border-labs-celeste-light bg-white/80 p-4 shadow-sm backdrop-blur-sm"
        >
          <dd className="text-3xl font-bold text-labs-celeste-dark">{punto.stat}</dd>
          <dt className="mt-1 text-xs font-semibold uppercase tracking-wide text-labs-pink">
            {punto.etiqueta}
          </dt>
          <p className="mt-1 text-xs text-tivit-ink/60">{punto.detalle}</p>
        </div>
      ))}
    </dl>
  );
}

/** Stack agrupado por categoría con encabezado y chips de tecnologías. */
function StackAgrupado({ grupos }) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {grupos.map((grupo, idx) => (
        <div
          key={`${idx}-${grupo.categoria}`}
          className="rounded-2xl border border-labs-celeste-light bg-white p-5 shadow-sm"
        >
          <h4 className="text-sm font-semibold uppercase tracking-wide text-labs-celeste-dark">
            {grupo.categoria}
          </h4>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {grupo.tecnologias.map((tech, tidx) => {
              const texto = normalizarItem(tech);
              return (
                <span
                  key={`${tidx}-${texto}`}
                  className="inline-flex items-center rounded-full bg-labs-celeste-light px-2.5 py-0.5 text-xs font-medium text-labs-celeste-dark"
                >
                  {texto}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}