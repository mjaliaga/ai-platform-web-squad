import { Nav } from "./Nav";
import { Footer } from "./Footer";

export function SiteLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="min-h-[calc(100vh-4rem)] flex-1">{children}</main>
      <Footer />
    </div>
  );
}
