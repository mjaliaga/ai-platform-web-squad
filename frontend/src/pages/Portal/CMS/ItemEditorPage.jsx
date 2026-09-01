import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Save, Loader2, Eye, EyeOff } from "lucide-react";
import {
  useContentItem,
  useContentSchema,
  useCreateContentItem,
  useUpdateContentItem,
  usePublishContentItem,
} from "../../../lib/contentQueries";
import { useCollections } from "../../../lib/contentQueries";
import { DynamicFormField } from "../../../components/CMS/DynamicFormField";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext.jsx";
import { RfChart } from "../../../components/RfChart";

// Todas las colecciones son editables para usuarios autenticados (RBAC en backend)
// "proyectos" se redirige a /portal/portfolio por vivir en tabla projects
const EDITABLE_COLLECTIONS = ["laboratorio", "poc", "casos-de-exito", "almaviva", "xms"];

export function ItemEditorPage() {
  const { collection, slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === "admin";
  const isEditor = user?.role === "editor" || user?.role === "admin" || user?.role === "member";
  const isEditableCollection = EDITABLE_COLLECTIONS.includes(collection);
  const isReadOnlyCollection = false;
  const canEdit = !!user && isEditor && isEditableCollection;
  const isNew = !slug || slug === "new";

  const { data: collections } = useCollections();
  const meta = collections?.find((c) => c.ruta === collection);

  const { data: schema, isLoading: schemaLoading } =
    useContentSchema(collection);
  const { data: existing, isLoading: existingLoading } = useContentItem(
    collection,
    !isNew ? slug : null
  );

  const createMut = useCreateContentItem(collection);
  const updateMut = useUpdateContentItem(collection);
  const publishMut = usePublishContentItem(collection);

  const [data, setData] = useState({});
  const [published, setPublished] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isNew) {
      setData({});
      setPublished(false);
    } else if (existing) {
      setData(existing.data || {});
      setPublished(existing.published);
    }
  }, [isNew, existing]);

  function setField(key, value) {
    setData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function validate() {
    if (!schema) return true;
    const errs = {};
    for (const f of schema) {
      if (f.requerido) {
        const v = data[f.key];
        const empty =
          v === undefined ||
          v === null ||
          v === "" ||
          (Array.isArray(v) && v.length === 0);
        if (empty) errs[f.key] = "Requerido";
      }
      if (f.tipo === "slug" && data[f.key]) {
        if (!/^[a-z0-9-]+$/.test(data[f.key])) {
          errs[f.key] = "Solo minúsculas, números y guiones";
        }
      }
      if (f.opciones && data[f.key]) {
        if (!f.opciones.some((o) => o.value === data[f.key])) {
          errs[f.key] = "Valor inválido para esta opción";
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave(forcePublished) {
    if (!canEdit) {
      toast.warning("No tienes permisos para editar esta colección (solo admin en Tivit Labs y PoC).");
      return;
    }
    if (!validate()) return;
    const pub = forcePublished ?? published;
    try {
      if (isNew) {
        const result = await createMut.mutateAsync({
          slug: data.slug,
          data,
          published: pub,
        });
        if (forcePublished !== undefined) setPublished(pub);
        toast.success("Item creado");
        navigate(`/portal/cms/${collection}/${result.slug}`, { replace: true });
      } else {
        await updateMut.mutateAsync({
          slug,
          payload: { slug: data.slug, data, published: pub },
        });
        if (forcePublished !== undefined) setPublished(pub);
        toast.success("Cambios guardados");
      }
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleSaveAndPublish() {
    await handleSave(true);
  }

  async function handleTogglePublish() {
    if (!canEdit) {
      toast.warning("No tienes permisos para publicar en esta colección.");
      return;
    }
    if (isNew) {
      setPublished((p) => !p);
      return;
    }
    try {
      await publishMut.mutateAsync({ slug, published: !published });
      setPublished(!published);
      toast.success(!published ? "Publicado" : "Pasado a borrador");
    } catch (err) {
      toast.error(err.message);
    }
  }

  const groupedFields = useMemo(() => {
    if (!schema) return { basics: [], narrative: [], structured: [], media: [] };
    const basicKeys = [
      "slug",
      "codigo",
      "nombreComercial",
      "nombreProyecto",
      "tipo",
      "estado",
      "version",
      "industria",
      "categoria",
      "tipoAgente",
      "cliente",
      "pais",
      "plazo",
      "precioValor",
      "precioMoneda",
      "tipoSolucion",
    ];
    const mediaKeys = [
      "videoPromocional",
      "videoTecnico",
      "galeria",
      "documentacion",
      "urlProyecto",
      "documentoDrive",
      "videoPlaceholder",
    ];

    // Filter by schema presence so only fields that exist in the collection are shown
    const basics = schema.filter((f) => basicKeys.includes(f.key));
    const media = schema.filter((f) => mediaKeys.includes(f.key));
    const remaining = schema.filter(
      (f) => !basicKeys.includes(f.key) && !mediaKeys.includes(f.key)
    );

    const narrative = remaining.filter((f) =>
      ["text", "textarea", "richtext"].includes(f.tipo)
    );
    const structured = remaining.filter(
      (f) => !["text", "textarea", "richtext"].includes(f.tipo)
    );

    return { basics, narrative, structured, media };
  }, [schema]);

  if (collection === "proyectos") {
    return (
      <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-bold text-tivit-ink">Portafolio gestionado en otra sección</h2>
        <p className="mt-2 text-sm text-tivit-ink/60">
          Los elementos del portafolio se administran en <code className="rounded bg-tivit-ink/5 px-1">/portal/portfolio</code> (tabla projects, 6 categorías) y no en el CMS genérico.
        </p>
        <Link to="/portal/portfolio" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-tivit-red px-4 py-2 text-sm font-semibold text-white hover:bg-tivit-red-dark">
          Ir a Portafolio
        </Link>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
        <p className="text-tivit-ink/60">Colección no encontrada.</p>
      </div>
    );
  }

  if (schemaLoading || (!isNew && existingLoading)) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-tivit-ink/55">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to={`/portal/cms/${collection}`}
            className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-tivit-ink/50 hover:text-tivit-red"
          >
            <ChevronLeft className="h-3 w-3" /> {meta.nombre}
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-tivit-ink">
            {isNew
              ? `Nuevo item · ${meta.nombre}`
              : data.nombreComercial || data.slug || slug}
          </h1>
          {!isNew && existing && (
            <p className="mt-1 text-xs text-tivit-ink/45">
              Creado {new Date(existing.created_at).toLocaleString("es-AR")} ·{" "}
              Actualizado {new Date(existing.updated_at).toLocaleString("es-AR")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canEdit ? (
            <>
              <button
                onClick={handleTogglePublish}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  published
                    ? "border-green-300 bg-green-50 text-green-700"
                    : "border-black/10 text-tivit-ink/70 hover:bg-tivit-red-light"
                }`}
              >
                {published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {published ? "Publicado" : "Borrador"}
              </button>
              <button
                onClick={handleSave}
                disabled={createMut.isPending || updateMut.isPending}
                className="flex items-center gap-2 rounded-lg bg-tivit-red px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-tivit-red-dark disabled:opacity-50"
              >
                {createMut.isPending || updateMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isNew ? "Crear" : "Guardar"}
              </button>
            </>
          ) : (
            <span className="rounded-lg bg-tivit-ink/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-tivit-ink/50">
              Solo lectura
            </span>
          )}
        </div>
      </div>

      {!canEdit && (
        <div className="rounded-xl border border-alert/20 bg-alert/5 p-3 text-sm text-alert">
          No tienes permisos para editar. Necesitas estar autenticado como <strong>member/editor/admin</strong>. Tu rol actual: <strong>{user?.role || "—"}</strong>.
        </div>
      )}

      <div className={`grid gap-5 md:grid-cols-2 ${!canEdit ? "opacity-60 pointer-events-none" : ""}`}>
        <Section title="Datos básicos & Metadatos" description="Identificación y clasificación principal">
          {groupedFields.basics.map((f) => (
            <FieldRow
              key={f.key}
              field={f}
              value={data[f.key]}
              onChange={(v) => canEdit && setField(f.key, v)}
              error={errors[f.key]}
            />
          ))}
        </Section>

        <Section title="Descripción & Textos" description="Textos narrativos, resumen y especificación">
          {groupedFields.narrative.map((f) => (
            <FieldRow
              key={f.key}
              field={f}
              value={data[f.key]}
              onChange={(v) => canEdit && setField(f.key, v)}
              error={errors[f.key]}
            />
          ))}
        </Section>

        {groupedFields.structured.length > 0 && (
          <Section title="Estructura, Listas & Métricas" description="Problemas, pasos, resultados, equipo, stack, highlights" wide>
            <div className="grid gap-4 md:grid-cols-2">
              {groupedFields.structured.map((f) => (
                <FieldRow
                  key={f.key}
                  field={f}
                  value={data[f.key]}
                  onChange={(v) => canEdit && setField(f.key, v)}
                  error={errors[f.key]}
                />
              ))}
            </div>
          </Section>
        )}

        {groupedFields.media.length > 0 && (
          <Section title="Media & Enlaces" description="Videos demo, visor de documento Drive, galería y enlaces" wide>
            <div className="grid gap-4 md:grid-cols-2">
              {groupedFields.media.map((f) => (
                <FieldRow
                  key={f.key}
                  field={f}
                  value={data[f.key]}
                  onChange={(v) => canEdit && setField(f.key, v)}
                  error={errors[f.key]}
                />
              ))}
            </div>
          </Section>
        )}

        {Array.isArray(data.mediciones) && data.mediciones.length > 0 && (
          <Section title="Vista previa — dB / Fase (ADS)" description="La magnitud se convierte a dB con 20·log10(|mag|) y la fase se grafica en grados" wide>
            <RfChart mediciones={data.mediciones} />
            <p className="mt-2 text-xs text-tivit-ink/45">Esta vista previa es idéntica al gráfico público. Carga <code className="rounded bg-tivit-ink/5 px-1">magnitud lineal</code> o <code className="rounded bg-tivit-ink/5 px-1">magDb</code> + <code className="rounded bg-tivit-ink/5 px-1">fase</code> por punto.</p>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, description, children, wide }) {
  return (
    <section
      className={`rounded-2xl border border-black/5 bg-white p-5 shadow-sm ${
        wide ? "lg:col-span-2" : ""
      }`}
    >
      <header className="mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-tivit-ink/55">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs text-tivit-ink/45">{description}</p>
        )}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function FieldRow({ field, value, onChange, error }) {
  return (
    <div>
      <label className="mb-1 flex items-baseline justify-between text-xs font-semibold text-tivit-ink/65">
        <span>
          {field.label}
          {field.requerido && (
            <span className="ml-0.5 text-tivit-red">*</span>
          )}
        </span>
      </label>
      <DynamicFormField
        field={field}
        value={value}
        onChange={onChange}
        error={error}
      />
      {field.descripcion && (
        <p className="mt-1 text-xs text-tivit-ink/45">{field.descripcion}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-alert">{error}</p>
      )}
    </div>
  );
}
