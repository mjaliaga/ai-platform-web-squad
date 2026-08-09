import { SiteLayout } from "../components/SiteLayout";
import { Hero } from "../components/Hero";
import { MisionVision } from "../components/MisionVision";
import { Team } from "../components/Team";

export function PublicSite() {
  return (
    <SiteLayout>
      <Hero />
      <MisionVision />
      <Team />
    </SiteLayout>
  );
}
