/** Temas de marca para el banner de colección. Cada tema define las clases
 *  estáticas de la paleta (fondo, acentos, logo y cinta) para que Tailwind
 *  pueda generarlas en el build. */
const TEMAS_BANNER = {
  xms: {
    logo: "/media/logos/logo-xms.png",
    logoAlt: "Logo XMS — TIVIT",
    fondo: "from-xms-blue-light to-white",
    blobs: [
      "absolute -right-20 -top-24 h-80 w-80 rounded-full bg-xms-blue/10 blur-3xl",
      "absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-xms-green/10 blur-3xl",
      "absolute right-1/3 top-1/3 h-44 w-44 rounded-full bg-xms-yellow/15 blur-3xl",
      "absolute -left-16 bottom-1/4 h-52 w-52 rounded-full bg-xms-red/10 blur-3xl",
    ],
    eyebrow: "text-xms-blue",
    titulo: "text-xms-blue-dark",
    intro: "text-xms-ink/70",
    bordeLogo: "border-xms-blue-light",
    cinta: ["bg-xms-blue", "bg-xms-green", "bg-xms-yellow", "bg-xms-red"],
  },
  almaviva: {
    logo: "/media/logos/almaviva.png",
    logoAlt: "Logo Almaviva Group",
    fondo: "from-almaviva-blue-light to-white",
    blobs: [
      "absolute -right-24 -top-28 h-96 w-96 rounded-full bg-almaviva-blue/10 blur-3xl",
      "absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-almaviva-sky/20 blur-3xl",
      "absolute right-1/3 top-1/2 h-44 w-44 rounded-full bg-almaviva-blue/10 blur-3xl",
    ],
    eyebrow: "text-almaviva-blue",
    titulo: "text-almaviva-blue-dark",
    intro: "text-almaviva-ink/70",
    bordeLogo: "border-almaviva-blue-light",
    cinta: ["bg-almaviva-blue", "bg-almaviva-sky"],
  },
  exito: {
    logo: "/media/logos/tivit.png",
    logoAlt: "Logo TIVIT",
    logoClase: "h-14 w-auto p-2",
    fondo: "from-exito-green-light to-white",
    blobs: [
      "absolute -right-24 -top-28 h-96 w-96 rounded-full bg-exito-green/10 blur-3xl",
      "absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-exito-green-light blur-3xl",
      "absolute right-1/3 top-1/2 h-44 w-44 rounded-full bg-exito-green-dark/10 blur-3xl",
    ],
    eyebrow: "text-exito-green",
    titulo: "text-exito-green-dark",
    intro: "text-exito-ink/70",
    bordeLogo: "border-exito-green-light",
    cinta: ["bg-exito-green", "bg-exito-green-dark"],
  },
  labs: {
    logo: "/media/logos/tivit-labs.png",
    logoAlt: "Logo Tivit Labs",
    fondo: "from-labs-celeste-light to-white",
    blobs: [
      "absolute -right-24 -top-28 h-96 w-96 rounded-full bg-labs-celeste/10 blur-3xl",
      "absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-labs-pink/10 blur-3xl",
      "absolute right-1/3 top-1/2 h-44 w-44 rounded-full bg-labs-celeste-dark/10 blur-3xl",
    ],
    eyebrow: "text-labs-celeste-dark",
    titulo: "text-labs-celeste-dark",
    intro: "text-labs-ink/70",
    bordeLogo: "border-labs-celeste-light",
    cinta: ["bg-labs-celeste", "bg-labs-pink"],
  },
  proyectos: {
    logo: "/media/logos/tivit.png",
    logoAlt: "Logo TIVIT",
    logoClase: "h-14 w-auto p-2",
    fondo: "from-proyectos-orange-light to-white",
    blobs: [
      "absolute -right-24 -top-28 h-96 w-96 rounded-full bg-proyectos-orange/10 blur-3xl",
      "absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-proyectos-orange-light blur-3xl",
      "absolute right-1/3 top-1/2 h-44 w-44 rounded-full bg-proyectos-orange-dark/10 blur-3xl",
    ],
    eyebrow: "text-proyectos-orange-dark",
    titulo: "text-proyectos-orange-dark",
    intro: "text-proyectos-ink/70",
    bordeLogo: "border-proyectos-orange-light",
    cinta: ["bg-proyectos-orange", "bg-proyectos-orange-dark"],
  },
  poc: {
    logo: "/media/logos/tivit.png",
    logoAlt: "Logo TIVIT",
    logoClase: "h-14 w-auto p-2",
    fondo: "from-poc-blue-light to-white",
    blobs: [
      "absolute -right-24 -top-28 h-96 w-96 rounded-full bg-poc-blue/10 blur-3xl",
      "absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-poc-blue-light blur-3xl",
      "absolute right-1/3 top-1/2 h-44 w-44 rounded-full bg-poc-blue-dark/10 blur-3xl",
    ],
    eyebrow: "text-poc-blue-dark",
    titulo: "text-poc-blue-dark",
    intro: "text-poc-ink/70",
    bordeLogo: "border-poc-blue-light",
    cinta: ["bg-poc-blue", "bg-poc-blue-dark"],
  },
};

/** Encabezado de una colección de marca (XMS, Almaviva): logo de la empresa,
 *  título e intro con su paleta corporativa. Se usa tanto en el listado como
 *  en la ficha de detalle de cada colección. */
export function BrandBanner({
  tema,
  eyebrow,
  title,
  intro,
  children,
}) {
  const t = TEMAS_BANNER[tema];

  return (
    <div className={`relative overflow-hidden bg-gradient-to-b ${t.fondo}`}>
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {t.blobs.map((clase, index) => (
          <div key={index} className={clase} />
        ))}
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-14 pt-12 md:pt-16">
        {children && <div className="mb-6">{children}</div>}

        <div className="flex flex-col gap-7 md:flex-row md:items-start md:gap-9">
          <img
            src={t.logo}
            alt={t.logoAlt}
            width={96}
            height={96}
            className={`shrink-0 rounded-2xl border bg-white shadow-sm ${t.logoClase ?? "h-20 w-20 p-1.5 md:h-24 md:w-24"} ${t.bordeLogo}`}
          />
          <div className="min-w-0">
            {eyebrow && (
              <span className={`text-sm font-semibold uppercase tracking-wide ${t.eyebrow}`}>
                {eyebrow}
              </span>
            )}
            <h1 className={`mt-1 max-w-3xl text-4xl font-bold ${t.titulo}`}>{title}</h1>
            {intro && (
              <div className={`mt-3 max-w-2xl text-lg ${t.intro}`}>{intro}</div>
            )}
          </div>
        </div>
      </div>

      <div className="relative flex h-1.5" aria-hidden="true">
        {t.cinta.map((clase, index) => (
          <span key={index} className={`flex-1 ${clase}`} />
        ))}
      </div>
    </div>
  );
}