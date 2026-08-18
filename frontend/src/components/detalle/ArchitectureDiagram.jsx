import { Eyebrow } from "../SectionHeading";

/** Diagrama de arquitectura para AuditIA. Para AssistDev se usa
 *  `SeccionesLabs` con más detalle, así que aquí solo queda AuditIA. */
export function ArchitectureDiagram({ tipo }) {
  if (tipo === "auditia") return <SecurityArchitectureDiagram />;
  return null;
}

function SecurityArchitectureDiagram() {
  const reglas = ["A001–A012 agentes", "B001–B007 plataformas"];
  const salidas = ["Consola", "JSON", "DOCX", "Código de salida"];

  return (
    <section className="pt-12">
      <Eyebrow>Arquitectura de seguridad</Eyebrow>
      <div className="mt-4 overflow-hidden rounded-2xl border border-tivit-red-light bg-tivit-ink p-6 text-white shadow-sm">
        <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Entrada</p>
            <div className="mt-2 rounded-xl border border-white/15 bg-white/10 p-4">
              <p className="font-semibold">Repositorio local</p>
              <p className="mt-1 text-sm text-white/70">Código, configuración y políticas</p>
            </div>
          </div>
          <div className="hidden text-2xl text-tivit-red-light md:block" aria-hidden="true">→</div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Motor SAF</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {reglas.map((regla) => (
                <div key={regla} className="rounded-lg border border-tivit-red bg-[#2D151A] px-3 py-2 text-center text-sm font-bold text-white">
                  {regla}
                </div>
              ))}
              <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-center text-sm font-semibold">
                Políticas YAML
              </div>
              <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-center text-sm font-semibold">
                Quality gates
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Evidencia</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {salidas.map((salida) => (
                <span key={salida} className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80">
                  {salida}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 border-t border-white/10 pt-4 text-center text-sm text-white/70">
          Análisis local · Solo lectura · Severidad · Confianza · Remediación accionable
        </div>
      </div>
    </section>
  );
}