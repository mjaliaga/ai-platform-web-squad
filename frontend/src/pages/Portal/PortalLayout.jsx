import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, FolderKanban, Users, Menu, X, LogOut, ChevronDown, CheckSquare, Award, Shield, FileClock, Ticket } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { NotificationBell } from "./components/NotificationBell";

const links = [
  { to: "/portal", label: "Inicio", icon: Home, end: true },
  { to: "/portal/todos", label: "Mis Tareas", icon: CheckSquare },
  { to: "/portal/portfolio", label: "Portafolio", icon: FolderKanban },
  { to: "/portal/tickets", label: "Tickets", icon: Ticket },
];

// Gating por rol — corrige "no todas las secciones salen" para member/editor
// Certificaciones: cualquier autenticado (backend permite list a todos) — se muestra si hay user
// Contenido: member/editor/admin (canEdit en CMS/ContentManager.jsx:27)
// Auditoría: solo admin
const cmsLink = { to: "/portal/cms", label: "Contenido", icon: FileClock };
const certLink = { to: "/portal/certifications", label: "Certificaciones", icon: Award };
const auditLink = { to: "/portal/admin/audit", label: "Auditoría", icon: Shield };

export function PortalLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const profileRef = useRef(null);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // UX/a11y: cerrar dropdown perfil con Escape y click outside + focus-trap simple
  useEffect(() => {
    if (!profileOpen) return;
    function onKeyDown(e) {
      if (e.key === "Escape") {
        setProfileOpen(false);
        // devolver foco al botón disparador si existe
        const btn = profileRef.current?.querySelector('button[aria-haspopup="menu"]');
        if (btn) btn.focus();
      }
      // focus-trap sencillo: si está abierto y se presiona Tab, ciclar dentro del menú
      if (e.key === "Tab" && profileRef.current) {
        const focusable = profileRef.current.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    function onMouseDown(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [profileOpen]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinkClass = ({ isActive }) =>
    `flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 text-xs font-medium transition-colors xl:gap-2 xl:px-3.5 xl:text-sm ${
      isActive
        ? "bg-tivit-red text-white shadow-sm"
        : "text-tivit-ink/70 hover:bg-tivit-red-light/70 hover:text-tivit-ink"
    }`;

  return (
    <div className="min-h-screen bg-tivit-red-light/40">
      <header
        className={`sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur-md transition-shadow ${
          scrolled ? "shadow-sm" : ""
        }`}
      >
        {/* FIX: grid-cols con minmax(0,1fr) permite que el nav central haga shrink correctamente.
            Antes auto 1fr auto impedía shrink y causaba overflow/wrap vertical en 768-1024px con 8 items.
            breakpoint lg (1024) en lugar de md (768) evita overflow: a 768-1023 el nav no cabe (668px) → mejor hamburguesa.
            1280 (xl) ya cabe holgado. */}
        <div className="mx-auto grid h-16 w-full max-w-7xl 2xl:max-w-[1536px] min-[1920px]:max-w-[1600px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex shrink-0 items-center gap-3">
            <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="TIVIT">
              <img src="/media/logos/logo-tivit-tile.png" alt="TIVIT" className="h-8 w-auto" />
              <div className="hidden flex-col leading-tight sm:flex">
                <span className="text-sm font-semibold tracking-tight text-tivit-ink">
                  Portal del equipo
                </span>
                <span className="text-[11px] font-medium text-tivit-ink/45">
                  Colaboración y seguimiento
                </span>
              </div>
            </Link>
          </div>

          {/* FIX: breakpoint lg (1024) para evitar overflow de 8 items en 768-1023. Añadido wrapper relative + gradiente para indicar scroll cuando hay overflow en lg-xl. */}
          <div className="relative hidden min-w-0 lg:flex lg:items-center lg:justify-center">
            <nav className="flex min-w-0 items-center justify-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:gap-1.5" aria-label="Principal">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} className={navLinkClass}>
                  <l.icon className="h-4 w-4" aria-hidden="true" />
                  {l.label}
                </NavLink>
              ))}
              {/* Certificaciones visible a cualquier autenticado */}
              {!!user && (
                <NavLink to={certLink.to} className={navLinkClass}>
                  <certLink.icon className="h-4 w-4" aria-hidden="true" />
                  {certLink.label}
                </NavLink>
              )}
              {/* Contenido visible a member/editor/admin */}
              {!!user && ["member", "editor", "admin"].includes(user.role) && (
                <NavLink to={cmsLink.to} className={navLinkClass}>
                  <cmsLink.icon className="h-4 w-4" aria-hidden="true" />
                  {cmsLink.label}
                </NavLink>
              )}
              {/* Auditoría solo admin */}
              {user?.role === "admin" && (
                <NavLink to={auditLink.to} className={navLinkClass}>
                  <auditLink.icon className="h-4 w-4" aria-hidden="true" />
                  {auditLink.label}
                </NavLink>
              )}
              <NavLink to="/portal/members" className={navLinkClass}>
                <Users className="h-4 w-4" aria-hidden="true" />
                Miembros
              </NavLink>
            </nav>
            <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 hidden h-full w-6 bg-gradient-to-l from-white to-transparent lg:block" />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell />
            <div className="relative shrink-0" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex shrink-0 items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition hover:bg-tivit-red-light/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tivit-red focus-visible:ring-offset-2"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                aria-label="Menú de perfil"
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-white shadow-sm"
                  style={{ background: user?.avatar_color || "#dc2626" }}
                >
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="hidden text-left sm:block">
                  <div className="max-w-[7rem] sm:max-w-[10rem] truncate text-sm font-semibold leading-tight text-tivit-ink">
                    {user?.name}
                  </div>
                  <div className="max-w-[7rem] sm:max-w-[10rem] truncate text-xs leading-tight text-tivit-ink/50">
                    {user?.email}
                  </div>
                </div>
                <ChevronDown
                  className={`hidden h-4 w-4 text-tivit-ink/40 transition-transform sm:block ${
                    profileOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>

              {profileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-56 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-black/5 bg-white p-1.5 shadow-xl"
                >
                  <Link
                    to="/portal/profile"
                    role="menuitem"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-tivit-ink transition hover:bg-tivit-red-light/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tivit-red focus-visible:ring-offset-1"
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: user?.avatar_color || "#dc2626" }}
                    >
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="truncate">{user?.name}</span>
                  </Link>
                  <div className="my-1 border-t border-black/5" />
                  <button
                    onClick={logout}
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-alert transition hover:bg-alert/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-alert focus-visible:ring-offset-1"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" /> Salir
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/5 text-tivit-ink/70 transition hover:bg-tivit-red-light/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tivit-red focus-visible:ring-offset-2 lg:hidden"
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={mobileOpen}
              aria-controls="portal-mobile-nav"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav
            id="portal-mobile-nav"
            className="border-t border-black/5 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden"
            aria-label="Principal"
          >
            <div className="flex flex-col gap-1">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} className={navLinkClass}>
                  <l.icon className="h-4 w-4" aria-hidden="true" />
                  {l.label}
                </NavLink>
              ))}
              {!!user && (
                <NavLink to={certLink.to} className={navLinkClass}>
                  <certLink.icon className="h-4 w-4" aria-hidden="true" />
                  {certLink.label}
                </NavLink>
              )}
              {!!user && ["member", "editor", "admin"].includes(user.role) && (
                <NavLink to={cmsLink.to} className={navLinkClass}>
                  <cmsLink.icon className="h-4 w-4" aria-hidden="true" />
                  {cmsLink.label}
                </NavLink>
              )}
              {user?.role === "admin" && (
                <NavLink to={auditLink.to} className={navLinkClass}>
                  <auditLink.icon className="h-4 w-4" aria-hidden="true" />
                  {auditLink.label}
                </NavLink>
              )}
              <NavLink to="/portal/members" className={navLinkClass}>
                <Users className="h-4 w-4" aria-hidden="true" />
                Miembros
              </NavLink>
            </div>
          </nav>
        )}
      </header>

      <main className="portal-main mx-auto max-w-7xl 2xl:max-w-[1536px] min-[1920px]:max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
        <Outlet />
      </main>
    </div>
  );
}