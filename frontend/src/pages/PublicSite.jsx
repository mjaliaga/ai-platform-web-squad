import { SiteLayout } from "../components/SiteLayout";
import { Hero } from "../components/Hero";
import { Areas } from "../components/Areas";
import { MisionVision } from "../components/MisionVision";
import { Destacados } from "../components/Destacados";
import { Team } from "../components/Team";
import { CtaFinal } from "../components/CtaFinal";

export function PublicSite() {
  return (
    <SiteLayout>
      <Hero />
      <Areas />
      <MisionVision />
      <Destacados />
      <Team />
      <CtaFinal />
    </SiteLayout>
  );
}