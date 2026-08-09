import { SiteLayout } from "../components/SiteLayout";
import { Eyebrow } from "../components/SectionHeading";

export function AlmavivaPage() {
  return (
    <SiteLayout>
      <div className="bg-gradient-to-b from-tivit-red-light to-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <Eyebrow>Almaviva</Eyebrow>
          <h1 className="mt-1 max-w-3xl text-4xl font-bold text-tivit-red-dark">
            Parte de Almaviva Group
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-tivit-ink/70">
            Contenido por definir: aquí se presentará la relación con Almaviva
            Group y el contexto del grupo al que pertenecemos.
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}
