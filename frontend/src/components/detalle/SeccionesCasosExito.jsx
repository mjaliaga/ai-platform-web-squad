import { Cpu, Target, UserRound, Wrench } from "lucide-react";
import { Eyebrow } from "../SectionHeading";
import { Reveal } from "../Reveal";
import { Parrafo, TarjetaSeccion, ListaIcono } from "./SeccionesAlmaviva";

/** Secciones propias de la ficha de Casos de Éxito. Sigue el mismo formato de
 *  tarjetas que Almaviva y XMS y solo renderiza la información que cada caso
 *  tiene disponible. */
export function SeccionesCasosExito({ item }) {
  const stack = comoLista(item.stack);

  const secciones = [
    {
      titulo: "Perfil del Cliente",
      icono: UserRound,
      visible: Boolean(item.perfil),
      cuerpo: <Parrafo texto={item.perfil} />,
    },
    {
      titulo: "Alcance de la Solución",
      icono: Target,
      visible: Boolean(item.alcance),
      cuerpo: <Parrafo texto={item.alcance} />,
    },
    {
      titulo: "Detalle Técnico y Arquitectura",
      icono: Cpu,
      visible: Boolean(item.detalleTecnico),
      cuerpo: <Parrafo texto={item.detalleTecnico} />,
    },
    {
      titulo: "Stack Tecnológico",
      icono: Wrench,
      visible: stack.length > 0,
      cuerpo: <ListaIcono icono={Wrench} items={stack} />,
    },
  ].filter((seccion) => seccion.visible);

  if (secciones.length === 0) return null;

  return (
    <div className="mt-16">
      <Reveal>
        <section className="mb-14">
          <Eyebrow>Detalle del caso</Eyebrow>
          <div className="mt-4 grid items-start gap-5 md:grid-cols-2">
            {secciones.map((seccion) => (
              <TarjetaSeccion key={seccion.titulo} icono={seccion.icono} titulo={seccion.titulo}>
                {seccion.cuerpo}
              </TarjetaSeccion>
            ))}
          </div>
        </section>
      </Reveal>
    </div>
  );
}

/** Normaliza un campo que puede llegar como string o array a una lista. */
function comoLista(valor) {
  if (Array.isArray(valor)) return valor;
  return valor ? [String(valor)] : [];
}