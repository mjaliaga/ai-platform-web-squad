import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(location.state?.from || "/portal", { replace: true });
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-tivit-red-light px-6">
      <div className="hero-mesh" aria-hidden="true" />
      <div className="relative w-full max-w-sm rounded-3xl border border-tivit-red-light bg-white p-8 shadow-xl shadow-tivit-red/10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-tivit-red hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tivit-red focus-visible:ring-offset-2">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al sitio
        </Link>
        <img
          src="/media/logos/logo-tivit-tile.png"
          alt="TIVIT — Almaviva Group"
          className="mt-6 h-10 w-auto"
        />
        <h1 className="mt-4 text-2xl font-bold text-tivit-red-dark">Portal del equipo</h1>
        <p className="mt-1 text-sm text-tivit-ink/60">Acceso exclusivo para el equipo TIVIT</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-tivit-ink">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-tivit-red-light bg-white px-3.5 py-2.5 outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20"
              placeholder="tu.email@tivit.com"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-tivit-ink">
            Contraseña
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-tivit-red-light bg-white px-3.5 py-2.5 outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20"
              placeholder="••••••••"
            />
          </label>

          {error && (
            <p className="rounded-xl bg-alert/10 px-3.5 py-2.5 text-sm font-medium text-alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-full bg-tivit-red px-4 py-2.5 font-semibold text-white shadow-sm shadow-tivit-red/25 transition hover:bg-tivit-red-dark hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
