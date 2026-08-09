function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function claseEstado(estado) {
  const n = normalizar(estado);
  if (/(produccion|finalizad|completad|en uso|desplegad)/.test(n)) return "bg-emerald-100 text-emerald-800";
  if (/(beta|evaluacion)/.test(n)) return "bg-amber-100 text-amber-800";
  if (/(desarrollo|curso|planific)/.test(n)) return "bg-sky-100 text-sky-800";
  return "bg-gray-100 text-gray-700";
}

/** Categoría tecnológica o área; neutra, distinta del estado. */
export function EtiquetaTipo({ tipo, destacado }) {
  if (!tipo) return null;

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        destacado ? "bg-tivit-ink text-white" : "bg-gray-100 text-gray-700"
      }`}
    >
      {tipo}
    </span>
  );
}

/** Estado del elemento con código de color funcional (verde/ámbar/azul). */
export function EtiquetaEstado({ estado }) {
  if (!estado) return null;

  return (
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${claseEstado(estado)}`}>
      {estado}
    </span>
  );
}

/** Código interno (PRJ-009), en monoespaciada neutra. */
export function EtiquetaCodigo({ codigo, atenuado }) {
  if (!codigo) return null;

  return (
    <span
      className={`font-mono text-xs font-semibold ${
        atenuado ? "text-tivit-ink/40" : "text-tivit-ink/60"
      }`}
    >
      {codigo}
    </span>
  );
}

/** Fila de etiquetas de encabezado de un elemento (código, tipo y estado). */
export function EtiquetasItem({
  item,
  tipoDestacado,
  atenuado,
  mostrarCodigo = true,
  mostrarEstado = true,
}) {
  const tieneEtiquetas =
    (mostrarCodigo && item.codigo) || item.tipo || (mostrarEstado && item.estado);
  if (!tieneEtiquetas) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {mostrarCodigo && <EtiquetaCodigo codigo={item.codigo} atenuado={atenuado} />}
      <EtiquetaTipo tipo={item.tipo} destacado={item.tipo === tipoDestacado} />
      {mostrarEstado && <EtiquetaEstado estado={item.estado} />}
    </div>
  );
}
