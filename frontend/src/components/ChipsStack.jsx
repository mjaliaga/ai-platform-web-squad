import { useState } from "react";

/**
 * Pills neutras con las tecnologías de un elemento; null si no hay stack.
 * Muestra hasta `limite` y agrupa el resto en "+N más", que se despliega al
 * pasar el mouse o al enfocarlo con el teclado.
 */
export function ChipsStack({ tecnologias, limite = 4 }) {
  if (!tecnologias || tecnologias.length === 0) return null;

  const tecnologiasLimpias = normalizarTecnologias(tecnologias);
  const visibles = tecnologiasLimpias.slice(0, limite);
  const ocultas = tecnologiasLimpias.slice(limite);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visibles.map((tecnologia) => (
        <Chip key={tecnologia}>{tecnologia}</Chip>
      ))}
      {ocultas.length > 0 && <MasTecnologias tecnologias={ocultas} />}
    </div>
  );
}

function MasTecnologias({ tecnologias }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        onClick={() => setAbierto((actual) => !actual)}
        aria-expanded={abierto}
        aria-label={`Mostrar ${tecnologias.length} tecnologías adicionales`}
        className="cursor-pointer rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-300 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tivit-red"
      >
        +{tecnologias.length} más
      </button>
      <span className={`absolute left-0 top-full z-20 mt-1 w-max max-w-64 flex-wrap gap-1.5 rounded-xl border border-gray-200 bg-white p-2 shadow-lg group-hover:flex group-focus-within:flex ${abierto ? "flex" : "hidden"}`}>
        {tecnologias.map((tecnologia) => (
          <Chip key={tecnologia}>{tecnologia}</Chip>
        ))}
      </span>
    </span>
  );
}

const ALIAS_TECNOLOGIAS = {
  "Python 3.12 + FastAPI": ["Python", "FastAPI"],
  "Bun + TypeScript": ["Bun", "TypeScript"],
  "LangChain / LangGraph": ["LangChain", "LangGraph"],
  "React 18+ / Angular 17+": ["React", "Angular"],
  "PostgreSQL 16 + pgvector": ["PostgreSQL", "pgvector"],
  "Redis + Kafka": ["Redis", "Kafka"],
  "OAuth2/JWT + Keycloak": ["Keycloak"],
  "Prometheus + Grafana + OpenTelemetry": ["Prometheus", "Grafana", "OpenTelemetry"],
  "Python 3.11+": ["Python"],
  "YAML (políticas)": ["YAML"],
  "GitHub Actions (quality gate)": ["GitHub Actions"],
  "DOCX / JSON (reportes)": [],
};

function normalizarTecnologias(tecnologias) {
  return [...new Set(tecnologias.flatMap((tecnologia) => ALIAS_TECNOLOGIAS[tecnologia] ?? [tecnologia]))];
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
      {children}
    </span>
  );
}
