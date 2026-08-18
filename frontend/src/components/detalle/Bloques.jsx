import { CircleAlert, CircleCheck } from "lucide-react";

/** Colores por tema para los bloques genéricos (Problemas, Qué hicimos, Resultados).
 *  Default `tivit` (rojo) para mantener el resto del sitio sin cambios. */
const TEMAS = {
  tivit: {
    titulo: "text-tivit-red-dark",
    problema: {
      caja: "border-tivit-red-light bg-tivit-red-light/20 text-tivit-ink/75",
      icono: "text-tivit-red",
    },
    paso: {
      linea: "before:bg-tivit-red-light",
      caja: "border-tivit-red-light/70 bg-white",
      numero: "bg-tivit-red text-white",
    },
  },
  labs: {
    titulo: "text-labs-celeste-dark",
    problema: {
      caja: "border-labs-celeste-light bg-labs-celeste-light/40 text-tivit-ink/75",
      icono: "text-labs-celeste-dark",
    },
    paso: {
      linea: "before:bg-labs-celeste-light",
      caja: "border-labs-celeste-light bg-white",
      numero: "bg-labs-celeste text-white",
    },
  },
  proyectos: {
    titulo: "text-proyectos-orange-dark",
    problema: {
      caja: "border-proyectos-orange-light bg-proyectos-orange-light/40 text-tivit-ink/75",
      icono: "text-proyectos-orange-dark",
    },
    paso: {
      linea: "before:bg-proyectos-orange-light",
      caja: "border-proyectos-orange-light/70 bg-white",
      numero: "bg-proyectos-orange text-white",
    },
  },
};

export function Bloque({ titulo, children, tema = "tivit" }) {
  const t = TEMAS[tema] ?? TEMAS.tivit;
  return (
    <section className="mb-10">
      <h2 className={`mb-3 text-2xl font-bold ${t.titulo}`}>{titulo}</h2>
      {children}
    </section>
  );
}

export function ListaProblemas({ items, tema = "tivit" }) {
  const t = TEMAS[tema] ?? TEMAS.tivit;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item}
          className={`flex gap-3 rounded-xl border p-4 text-sm ${t.problema.caja}`}
        >
          <CircleAlert className={`mt-0.5 h-4 w-4 shrink-0 ${t.problema.icono}`} aria-hidden="true" />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

export function ListaPasos({ items, tema = "tivit" }) {
  const t = TEMAS[tema] ?? TEMAS.tivit;
  return (
    <ol className={`relative flex flex-col gap-3 before:absolute before:bottom-5 before:left-[15px] before:top-5 before:w-px ${t.paso.linea}`}>
      {items.map((item, index) => (
        <li key={item} className={`relative flex gap-4 rounded-xl border p-4 pl-3 ${t.paso.caja}`}>
          <span className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${t.paso.numero}`}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <p className="pt-1 text-sm leading-relaxed text-tivit-ink/75">{item}</p>
        </li>
      ))}
    </ol>
  );
}

export function ListaResultados({ items, tema: _tema = "tivit" }) {
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