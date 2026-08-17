import {
  CircleCheck,
  ListChecks,
  Plug,
  Target,
  TrendingUp,
  Workflow,
} from "lucide-react";
import { Eyebrow } from "../SectionHeading";
import { Reveal } from "../Reveal";
import { Parrafo, TarjetaSeccion, ListaIcono } from "./SeccionesAlmaviva";

/** Secciones propias del portafolio de Agentes de IA de XMS. Sigue el mismo
 *  formato de tarjetas que la ficha de Almaviva y solo renderiza la
 *  información que cada agente tiene disponible. */
export function SeccionesXms({ item }) {
  const funcionalidades = comoLista(item.funcionalidades);
  const beneficios = comoLista(item.beneficios);
  const integraciones = comoLista(item.integraciones);

  const secciones = [
    {
      titulo: "Objetivo",
      icono: Target,
      visible: Boolean(item.objetivo),
      cuerpo: <Parrafo texto={item.objetivo} />,
    },
    {
      titulo: "Funcionalidades Clave",
      icono: ListChecks,
      visible: funcionalidades.length > 0,
      cuerpo: <ListaIcono items={funcionalidades} />,
    },
    {
      titulo: "Cómo funciona",
      icono: Workflow,
      visible: Boolean(item.flujo),
      cuerpo: <Parrafo texto={item.flujo} />,
    },
    {
      titulo: "Beneficios / Valor Entregado",
      icono: TrendingUp,
      visible: beneficios.length > 0,
      cuerpo: <ListaIcono icono={CircleCheck} tono="text-emerald-600" items={beneficios} />,
    },
    {
      titulo: "Integraciones",
      icono: Plug,
      visible: integraciones.length > 0,
      cuerpo: <ListaIcono icono={Plug} items={integraciones} />,
    },
  ].filter((seccion) => seccion.visible);

  if (secciones.length === 0) return null;

  return (
    <div className="mt-16">
      <Reveal>
        <section className="mb-14">
          <Eyebrow>Detalle del agente</Eyebrow>
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
