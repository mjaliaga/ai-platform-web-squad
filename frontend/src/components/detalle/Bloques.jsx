import { CircleAlert, CircleCheck } from "lucide-react";

export function Bloque({ titulo, children }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-2xl font-bold text-tivit-red-dark">{titulo}</h2>
      {children}
    </section>
  );
}

export function ListaProblemas({ items }) {
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

export function ListaPasos({ items }) {
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

export function ListaResultados({ items }) {
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