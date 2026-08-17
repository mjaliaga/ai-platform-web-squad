import { useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { UserAvatar } from "./components/Badges";

export function Profile() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phoneInput, setPhoneInput] = useState(user?.phone || "");
  const [linkedinInput, setLinkedinInput] = useState(user?.linkedin || "");
  const [githubInput, setGithubInput] = useState(user?.github || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function saveProfile(e) {
    e.preventDefault();
    setError("");
    setMsg("");
    setSaving(true);
    try {
      await api.updateProfile({ name, phone: phoneInput, linkedin: linkedinInput, github: githubInput });
      await refreshUser();
      setMsg("Perfil actualizado");
    } catch (err) {
      setError(err.message || "No se pudo actualizar");
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setError("");
    setMsg("");
    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setSaving(true);
    try {
      await api.changePassword({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMsg("Contraseña actualizada");
    } catch (err) {
      setError(err.message || "No se pudo cambiar la contraseña");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-tivit-red-light bg-white px-3.5 py-2.5 outline-none transition focus:border-tivit-red focus:ring-2 focus:ring-tivit-red/20";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-tivit-red-dark">Mi perfil</h1>
      <p className="mt-1 text-sm text-tivit-ink/60">Gestiona tu información personal y contraseña.</p>

      {msg && <p className="mt-4 rounded-xl bg-green-100 px-3.5 py-2.5 text-sm font-medium text-green-800">{msg}</p>}
      {error && <p className="mt-4 rounded-xl bg-alert/10 px-3.5 py-2.5 text-sm font-medium text-alert">{error}</p>}

      <div className="mt-6 flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-5">
        <UserAvatar user={user} size="lg" />
        <div>
          <div className="text-base font-semibold text-tivit-ink">{user?.name}</div>
          <div className="text-sm text-tivit-ink/60">{user?.email}</div>
          <div className="mt-1">
            <span className="rounded-full bg-tivit-red-light px-2 py-0.5 text-xs font-semibold text-tivit-red-dark">
              {user?.role === "admin" ? "Administrador" : "Miembro"}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={saveProfile} className="mt-6 rounded-2xl border border-black/5 bg-white p-6">
        <h2 className="text-lg font-semibold text-tivit-ink">Datos personales</h2>
        <label className="mt-4 flex flex-col gap-1 text-sm font-medium text-tivit-ink">
          Nombre
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
        </label>
        <div className="mt-4 flex flex-col gap-1 text-sm font-medium text-tivit-ink">
          Email
          <span className="text-sm font-normal text-tivit-ink/50">El correo solo puede cambiarlo un administrador.</span>
          <input className={`${inputClass} bg-tivit-ink/5`} value={user?.email || ""} disabled />
        </div>
        <label className="mt-4 flex flex-col gap-1 text-sm font-medium text-tivit-ink">
          Teléfono
          <input className={inputClass} value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} />
        </label>
        <label className="mt-4 flex flex-col gap-1 text-sm font-medium text-tivit-ink">
          LinkedIn
          <input className={inputClass} type="url" placeholder="https://www.linkedin.com/in/usuario" value={linkedinInput} onChange={(e) => setLinkedinInput(e.target.value)} />
        </label>
        <label className="mt-4 flex flex-col gap-1 text-sm font-medium text-tivit-ink">
          GitHub
          <input className={inputClass} type="url" placeholder="https://github.com/usuario" value={githubInput} onChange={(e) => setGithubInput(e.target.value)} />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-full bg-tivit-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-tivit-red-dark disabled:opacity-60"
        >
          Guardar cambios
        </button>
      </form>

      <form onSubmit={savePassword} className="mt-6 rounded-2xl border border-black/5 bg-white p-6">
        <h2 className="text-lg font-semibold text-tivit-ink">Cambiar contraseña</h2>
        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-tivit-ink">
            Contraseña actual
            <input
              type="password"
              className={inputClass}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-tivit-ink">
            Nueva contraseña
            <input
              type="password"
              className={inputClass}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-tivit-ink">
            Confirmar nueva contraseña
            <input
              type="password"
              className={inputClass}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-full bg-tivit-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-tivit-red-dark disabled:opacity-60"
        >
          Cambiar contraseña
        </button>
      </form>
    </div>
  );
}