/** Barra de filtros por área/tipo y estado para los listados de colección. */
export function FilterBar({ tipos, estados, filtroTipo, filtroEstado, onTipo, onEstado, tipoEtiqueta = "Área" }) {
  if (tipos.length === 0 && estados.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 border-b border-tivit-red-light pb-6 pt-10">
      {tipos.length > 0 && (
        <Fila etiqueta={tipoEtiqueta} opciones={tipos} valor={filtroTipo} onChange={onTipo} />
      )}
      {estados.length > 0 && (
        <Fila
          etiqueta="Estado"
          opciones={estados}
          valor={filtroEstado}
          onChange={onEstado}
        />
      )}
    </div>
  );
}

function Fila({ etiqueta, opciones, valor, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-14 text-xs font-semibold uppercase tracking-wide text-tivit-ink/50">
        {etiqueta}
      </span>
      <Boton activo={valor === "Todos"} onClick={() => onChange("Todos")}>
        Todos
      </Boton>
      {opciones.map((opcion) => (
        <Boton key={opcion} activo={valor === opcion} onClick={() => onChange(opcion)}>
          {opcion}
        </Boton>
      ))}
    </div>
  );
}

function Boton({ activo, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
        activo
          ? "border-tivit-red bg-tivit-red text-white"
          : "border-gray-200 bg-white text-gray-700 hover:border-tivit-red/50 hover:bg-tivit-red-light/30"
      }`}
    >
      {children}
    </button>
  );
}
