import { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Award, Plus, X, User } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { formatDate } from "./components/Badges";

export function Certificaciones() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const calendarRef = useRef(null);
  const [certifications, setCertifications] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ user_id: "", certification_name: "", issue_date: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([loadCertifications(), loadMembers()]).finally(() => setLoading(false));
  }, []);

  async function loadCertifications() {
    try {
      const data = await api.listCertifications();
      setCertifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "No se pudieron cargar las certificaciones");
    }
  }

  async function loadMembers() {
    try {
      const data = await api.users();
      setMembers(Array.isArray(data) ? data : []);
    } catch {
      setMembers([]);
    }
  }

  async function handleAddCertification(e) {
    e.preventDefault();
    if (!form.user_id || !form.certification_name || !form.issue_date) {
      setError("Todos los campos son requeridos");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await api.createCertification(form);
      setCertifications((prev) => [...prev, created]);
      setForm({ user_id: "", certification_name: "", issue_date: "" });
      setShowModal(false);
      if (calendarRef.current) {
        calendarRef.current.getApi().refetchEvents();
      }
    } catch (err) {
      setError(err.message || "No se pudo crear la certificación");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCertification(id) {
    try {
      await api.deleteCertification(id);
      setCertifications((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err.message || "No se pudo eliminar");
    }
  }

  const calendarEvents = certifications.map((cert) => ({
    id: cert.id,
    title: cert.certification_name,
    start: cert.issue_date,
    extendedProps: {
      userName: cert.user_name,
      userEmail: cert.user_email,
    },
  }));

  function renderEventContent(eventInfo) {
    return (
      <div className="p-1 text-xs overflow-hidden">
        <div className="font-medium truncate">{eventInfo.event.title}</div>
        <div className="text-white/70 truncate">{eventInfo.event.extendedProps.userName}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award size={24} className="text-tivit-red" />
            Certificaciones
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {certifications.length} certificación{certifications.length !== 1 ? "es" : ""} registrada
            {certifications.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-tivit-red text-white rounded-xl text-sm font-medium hover:bg-tivit-red/90 flex items-center gap-2"
          >
            <Plus size={16} />
            Nueva Certificación
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="es"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth",
          }}
          buttonText={{
            today: "Hoy",
            month: "Mes",
          }}
          events={calendarEvents}
          eventContent={renderEventContent}
          height="auto"
          eventDisplay="block"
          eventBackgroundColor="#dc2626"
          eventBorderColor="#dc2626"
          eventTextColor="#ffffff"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {certifications.map((cert) => (
          <div
            key={cert.id}
            className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-tivit-red/10 flex items-center justify-center">
                  <Award size={20} className="text-tivit-red" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{cert.certification_name}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <User size={12} />
                    {cert.user_name}
                  </div>
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={() => handleDeleteCertification(cert.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500" title={formatDate(cert.issue_date)}>
                Fecha: {formatDate(cert.issue_date)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Nueva Certificación</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setError("");
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddCertification} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Miembro del equipo
                </label>
                <select
                  value={form.user_id}
                  onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-tivit-red/20 focus:border-tivit-red"
                  required
                >
                  <option value="">Seleccionar miembro...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre de la certificación
                </label>
                <input
                  type="text"
                  value={form.certification_name}
                  onChange={(e) => setForm((f) => ({ ...f, certification_name: e.target.value }))}
                  placeholder="Ej: AWS Solutions Architect"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-tivit-red/20 focus:border-tivit-red"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Fecha de obtención
                </label>
                <input
                  type="date"
                  value={form.issue_date}
                  onChange={(e) => setForm((f) => ({ ...f, issue_date: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-tivit-red/20 focus:border-tivit-red"
                  required
                />
              </div>
              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setError("");
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-tivit-red text-white rounded-xl text-sm font-medium hover:bg-tivit-red/90 disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
