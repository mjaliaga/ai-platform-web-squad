import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  Briefcase,
  Building2,
  FlaskConical,
  Sparkles,
  Trophy,
} from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";

/** Mapa de las secciones del sitio con su color de marca. */
const AREAS = [
  {
    ruta: "proyectos",
    nombre: "Proyectos",
    descripcion: "Entregas para clientes e iniciativas internas del equipo.",
    icono: Briefcase,
    chip: "bg-proyectos-orange-light text-proyectos-orange-dark",
    borde: "hover:border-proyectos-orange",
    flecha: "text-proyectos-orange",
    cinta: "from-proyectos-orange to-proyectos-orange-dark",
  },
  {
    ruta: "casos-de-exito",
    nombre: "Casos de éxito",
    descripcion: "Problemas reales resueltos con IA y datos en clientes.",
    icono: Trophy,
    chip: "bg-exito-green-light text-exito-green-dark",
    borde: "hover:border-exito-green",
    flecha: "text-exito-green",
    cinta: "from-exito-green to-exito-green-dark",
  },
  {
    ruta: "laboratorio",
    nombre: "Tivit Labs",
    descripcion: "Investigaciones, frameworks y herramientas reutilizables.",
    icono: FlaskConical,
    chip: "bg-labs-celeste-light text-labs-celeste-dark",
    borde: "hover:border-labs-celeste",
    flecha: "text-labs-celeste",
    cinta: "from-labs-celeste to-labs-pink",
  },
  {
    ruta: "poc",
    nombre: "PoC",
    descripcion: "Pruebas de concepto para validar ideas nuevas.",
    icono: Sparkles,
    chip: "bg-poc-blue-light text-poc-blue-dark",
    borde: "hover:border-poc-blue",
    flecha: "text-poc-blue",
    cinta: "from-poc-blue to-poc-blue-dark",
  },
  {
    ruta: "almaviva",
    nombre: "Almaviva Group",
    descripcion: "Soluciones de IA del grupo, clasificadas por capacidad.",
    icono: Building2,
    chip: "bg-almaviva-blue-light text-almaviva-blue-dark",
    borde: "hover:border-almaviva-blue",
    flecha: "text-almaviva-blue",
    cinta: "from-almaviva-blue to-almaviva-blue-dark",
  },
  {
    ruta: "xms",
    nombre: "XMS",
    descripcion: "Agentes de inteligencia artificial para operaciones.",
    icono: Bot,
    chip: "bg-xms-blue-light text-xms-blue-dark",
    borde: "hover:border-xms-blue",
    flecha: "text-xms-blue",
    cinta: "from-xms-blue to-xms-blue-dark",
  },
];

export function Areas() {
  return (
    <section id="areas" className="mx-auto max-w-6xl px-6 py-14 md:py-16">
      <Reveal>
        <SectionHeading eyebrow="Explora" title="Nuestras áreas de trabajo" />
      </Reveal>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {AREAS.map((area, index) => {
          const Icono = area.icono;
          return (
            <Reveal key={area.ruta} delay={index * 60}>
              <Link
                to={`/${area.ruta}`}
                className={`group block h-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${area.borde}`}
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${area.chip}`}
                >
                  <Icono className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-tivit-ink">{area.nombre}</h3>
                <p className="mt-1 text-sm text-tivit-ink/70">{area.descripcion}</p>
                <span
                  className={`mt-4 inline-flex items-center gap-1.5 text-sm font-bold ${area.flecha}`}
                >
                  Explorar
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
                <div
                  className={`-mx-6 -mb-6 mt-5 h-1.5 rounded-b-2xl bg-gradient-to-r ${area.cinta}`}
                  aria-hidden="true"
                />
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}