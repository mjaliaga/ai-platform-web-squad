import { UserPlus, X } from "lucide-react";
import { UserAvatar } from "./components/Badges";

const ROLE_LABELS = {
  lead: "Lead",
  arquitecto: "Arquitecto",
  dev: "Desarrollador",
  design: "Diseño",
  qa: "QA",
  viewer: "Visualizador",
};

const ROLE_COLORS = {
  lead: "bg-tivit-red/10 text-tivit-red",
  arquitecto: "bg-amber-100 text-amber-700",
  dev: "bg-blue-100 text-blue-700",
  design: "bg-pink-100 text-pink-700",
  qa: "bg-emerald-100 text-emerald-700",
  viewer: "bg-gray-100 text-gray-600",
};

const ROLE_BORDER_COLORS = {
  lead: "border-l-tivit-red",
  arquitecto: "border-l-amber-400",
  dev: "border-l-blue-400",
  design: "border-l-pink-400",
  qa: "border-l-emerald-400",
  viewer: "border-l-gray-400",
};

const ROLE_HIERARCHY = { lead: 0, arquitecto: 1, dev: 2, design: 3, qa: 4, viewer: 5 };

const selectClass =
  "rounded-lg border border-tivit-red/30 bg-white px-2 py-1.5 text-xs focus:border-tivit-red focus:outline-none focus:ring-2 focus:ring-tivit-red/20";

export function TeamSection({
  current,
  isAdmin,
  showAddMember,
  setShowAddMember,
  newMember,
  setNewMember,
  availableUsers,
  addMember,
  changeMemberRole,
  removeMember,
}) {
  const sortedMembers = [...(current.members || [])].sort(
    (a, b) => (ROLE_HIERARCHY[a.role] ?? 99) - (ROLE_HIERARCHY[b.role] ?? 99)
  );
  return (
    <div className="mt-6 rounded-2xl border border-black/5 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-tivit-ink/60">
          Equipo del proyecto ({current.members?.length || 0})
        </h2>
        {isAdmin && (
          <button
            onClick={() => setShowAddMember((s) => !s)}
            className="flex items-center gap-1.5 text-xs font-semibold text-tivit-red hover:underline"
          >
            <UserPlus className="h-3.5 w-3.5" aria-hidden="true" /> Añadir
          </button>
        )}
      </div>

      {showAddMember && isAdmin && (
        <form
          onSubmit={addMember}
          className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-tivit-red/30 bg-tivit-red/5 p-3"
        >
          <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">
            Usuario
            <select
              value={newMember.user_id}
              onChange={(e) => setNewMember({ ...newMember, user_id: e.target.value })}
              className={selectClass}
              required
            >
              <option value="">Seleccionar…</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-tivit-ink">
            Rol
            <select
              value={newMember.role}
              onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
              className={selectClass}
            >
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-lg bg-tivit-red px-3 py-2 text-xs font-semibold text-white transition hover:bg-tivit-red-dark"
          >
            Añadir
          </button>
          <button
            type="button"
            onClick={() => setShowAddMember(false)}
            className="rounded-lg border border-tivit-red-light px-3 py-2 text-xs font-semibold text-tivit-ink transition hover:bg-tivit-red-light"
          >
            Cancelar
          </button>
        </form>
      )}

      <div className="mt-4 space-y-2">
        {sortedMembers.length === 0 && (
          <p className="py-4 text-center text-sm text-tivit-ink/50">
            Sin miembros asignados.
          </p>
        )}
        {sortedMembers.map((m) => (
          <div
            key={m.user_id}
            className={`flex items-center justify-between rounded-xl border border-black/5 border-l-4 ${ROLE_BORDER_COLORS[m.role] || "border-l-gray-400"} p-3`}
          >
            <div className="flex items-center gap-3">
              <UserAvatar user={{ name: m.name, avatar_color: m.avatar_color }} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-tivit-ink">{m.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_COLORS[m.role] || ROLE_COLORS.viewer}`}
                  >
                    {ROLE_LABELS[m.role] || m.role}
                  </span>
                </div>
                <div className="text-xs text-tivit-ink/50">{m.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <select
                  value={m.role}
                  onChange={(e) => changeMemberRole(m.user_id, e.target.value)}
                  className={selectClass}
                >
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              ) : null}
              {isAdmin && (
                <button
                  onClick={() => removeMember(m.user_id)}
                  className="rounded-lg p-1.5 text-tivit-ink/40 transition hover:bg-alert/10 hover:text-alert"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { ROLE_LABELS, ROLE_COLORS, ROLE_BORDER_COLORS, ROLE_HIERARCHY };
