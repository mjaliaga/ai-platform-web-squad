/** Barra de filtros por área/tipo y estado para los listados de colección. */
export function FilterBar({
  tipos,
  estados,
  filtroTipo,
  filtroEstado,
  onTipo,
  onEstado,
  tipoEtiqueta = "Área",
  items = [],
}) {
  if (tipos.length === 0 && estados.length === 0) return null;

  const contar = (campo, valor) => items.filter((item) => item[campo] === valor).length;

  return (
    <div className="flex flex-col gap-3 border-b border-tivit-red-light pb-6 pt-10">
      {tipos.length > 0 && (
        <Fila
          etiqueta={tipoEtiqueta}
          opciones={tipos}
          valor={filtroTipo}
          onChange={onTipo}
          total={items.length}
          contar={(opcion) => contar("tipo", opcion)}
        />
      )}
      {estados.length > 0 && (
        <Fila
          etiqueta="Estado"
          opciones={estados}
          valor={filtroEstado}
          onChange={onEstado}
          total={items.length}
          contar={(opcion) => contar("estado", opcion)}
        />
      )}
    </div>
  );
}

function Fila({ etiqueta, opciones, valor, onChange, total, contar }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-14 text-xs font-semibold uppercase tracking-wide text-tivit-ink/50">
        {etiqueta}
      </span>
      <Boton activo={valor === "Todos"} onClick={() => onChange("Todos")} conteo={total}>
        Todos
      </Boton>
      {opciones.map((opcion) => (
        <Boton key={opcion} activo={valor === opcion} onClick={() => onChange(opcion)} conteo={contar(opcion)}>
          {opcion}
        </Boton>
      ))}
    </div>
  );
}

function Boton({ activo, onClick, children, conteo }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
        activo
          ? "border-tivit-red bg-tivit-red text-white shadow-sm"
          : "border-gray-200 bg-white text-gray-700 hover:border-tivit-red/50 hover:bg-tivit-red-light/30"
      }`}
    >
      {children}
      <span
        className={`rounded-full px-1.5 text-[10px] font-bold ${
          activo ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
        }`}
      >
        {conteo ?? 0}
      </span>
    </button>
  );
}