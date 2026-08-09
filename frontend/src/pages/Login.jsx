import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
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
      navigate("/panel");
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-tivit-red-light px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-tivit-red hover:underline">
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
              className="rounded-lg border border-tivit-red-light px-3 py-2 outline-none focus:border-tivit-red"
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
              className="rounded-lg border border-tivit-red-light px-3 py-2 outline-none focus:border-tivit-red"
              placeholder="••••••••"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-alert/10 px-3 py-2 text-sm font-medium text-alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-full bg-tivit-red px-4 py-2 font-semibold text-white transition hover:bg-tivit-red-dark disabled:opacity-60"
          >
            {submitting ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        <p className="mt-6 text-xs text-tivit-ink/50">
          Demo: demo@tivit.com / tivit2026
        </p>
      </div>
    </div>
  );
}
