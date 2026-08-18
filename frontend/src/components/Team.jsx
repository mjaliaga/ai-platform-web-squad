import { team } from "../data/contenido";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";

export function Team() {
  return (
    <section id="equipo" className="mx-auto max-w-6xl px-6 py-14 md:py-16">
      <Reveal>
        <SectionHeading eyebrow="Equipo" title="Las personas detrás del trabajo" />
      </Reveal>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {team.map((member, index) => (
          <Reveal key={member.name} delay={index * 50}>
            <div className="flex h-full flex-col items-center gap-3 rounded-2xl border border-tivit-red-light bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-tivit-red hover:shadow-md">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-tivit-red-light text-base font-bold text-tivit-red-dark">
                {member.initials}
              </div>
              <div className="min-w-0">
                <p className="break-words font-semibold text-tivit-ink">{member.name}</p>
                <p className="mt-1 line-clamp-2 text-sm font-medium text-tivit-ink/70">
                  {member.role}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}