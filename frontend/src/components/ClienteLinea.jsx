/** Línea "Cliente: …"; null si no hay cliente definido. */
export function ClienteLinea({ cliente }) {
  if (!cliente) return null;

  return (
    <p className="mt-3 text-sm text-tivit-ink/60">
      <span className="font-medium text-tivit-ink/75">Cliente:</span> {cliente}
    </p>
  );
}
