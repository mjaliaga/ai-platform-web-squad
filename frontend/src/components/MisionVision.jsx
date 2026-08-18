import { Compass, Telescope } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";

export function MisionVision() {
  return (
    <section id="mision" className="bg-tivit-red-light/40 py-14 md:py-16">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionHeading eyebrow="Nosotros" title="Misión y visión" />
        </Reveal>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Reveal delay={0}>
            <Bloque
              icono={Compass}
              titulo="Misión"
              texto="Construir soluciones basadas en inteligencia artificial que resuelvan
                problemas reales de nuestros clientes —internos y externos—, acompañándolas
                de la ingeniería de software, los datos y la infraestructura necesarios para
                llevarlas de la idea a la producción."
            />
          </Reveal>
          <Reveal delay={80}>
            <Bloque
              icono={Telescope}
              titulo="Visión"
              texto="Ser un equipo referente en IA aplicada dentro de Almaviva Group: cada
                proyecto y cada prueba de concepto que impulsamos se traduce en valor
                medible para el cliente y en aprendizaje constante para el equipo."
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Bloque({ icono: Icono, titulo, texto }) {
  return (
    <div className="h-full rounded-2xl bg-white p-8 shadow-md transition hover:-translate-y-1 hover:shadow-lg">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-tivit-red-light text-tivit-red">
        <Icono className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 font-semibold text-tivit-red-dark">{titulo}</h3>
      <p className="mt-3 text-sm leading-relaxed text-tivit-ink/70">{texto}</p>
    </div>
  );
}
