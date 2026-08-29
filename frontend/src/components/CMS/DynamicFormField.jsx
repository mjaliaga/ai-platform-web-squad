import { useState } from "react";
import { Plus, X, ChevronUp, ChevronDown } from "lucide-react";
import { MediaPicker } from "./MediaPicker";

export function DynamicFormField({ field, value, onChange, error }) {
  const handleChange = (newValue) => onChange(newValue);

  switch (field.tipo) {
    case "text":
      return (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.placeholder || ""}
          required={field.requerido}
          className={inputClasses(error)}
        />
      );

    case "textarea":
      return (
        <textarea
          rows={3}
          value={value || ""}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.placeholder || ""}
          required={field.requerido}
          className={inputClasses(error)}
        />
      );

    case "richtext":
      // SEC-003: Rich text is edited as plain text/markdown and stored as-is.
      // Rendering sanitization happens at the consumer site (see lib/sanitize.js)
      // — never use dangerouslySetInnerHTML on this value without sanitization.
      return (
        <div>
          <textarea
            rows={6}
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder || "Markdown soportado"}
            required={field.requerido}
            className={`${inputClasses(error)} font-mono text-xs`}
          />
          <p className="mt-1 text-xs text-tivit-ink/45">
            El contenido se sanitiza antes de mostrarse. HTML se filtra a etiquetas seguras.
          </p>
        </div>
      );

    case "slug":
      return (
        <SlugInput
          value={value || ""}
          onChange={handleChange}
          error={error}
          required={field.requerido}
        />
      );

    case "url":
      return (
        <input
          type="url"
          value={value || ""}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="https://..."
          required={field.requerido}
          className={inputClasses(error)}
        />
      );

    case "select":
      return (
        <select
          value={value || ""}
          onChange={(e) => handleChange(e.target.value)}
          required={field.requerido}
          className={inputClasses(error)}
        >
          <option value="">— Seleccionar —</option>
          {field.opciones?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case "array":
      return (
        <ArrayFieldEditor
          field={field}
          value={value || []}
          onChange={handleChange}
        />
      );

    case "object":
      return (
        <ObjectFieldEditor
          field={field}
          value={value || {}}
          onChange={handleChange}
        />
      );

    case "media":
      return <MediaFieldEditor value={value} onChange={handleChange} />;

    case "boolean":
      return (
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => handleChange(e.target.checked)}
            className="h-4 w-4 rounded border-black/20 text-tivit-red focus:ring-tivit-red/30"
          />
          <span className="text-sm text-tivit-ink/70">{field.label}</span>
        </label>
      );

    case "icon":
      return <IconInput value={value || ""} onChange={handleChange} error={error} />;

    default:
      return (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => handleChange(e.target.value)}
          className={inputClasses(error)}
        />
      );
  }
}

function inputClasses(error) {
  const base =
    "w-full rounded-lg border bg-white px-3 py-2 text-sm transition focus:outline-none focus:ring-2";
  return error
    ? `${base} border-alert focus:border-alert focus:ring-alert/20`
    : `${base} border-black/10 focus:border-tivit-red focus:ring-tivit-red/20`;
}

// ============================================================================
// Icon selector / input
// ============================================================================
const ICON_OPTIONS = [
  "Zap",
  "MessageSquare",
  "Workflow",
  "FileText",
  "CheckCircle",
  "Rocket",
  "Package",
  "GitBranch",
  "ShieldCheck",
  "Layers",
  "Wrench",
  "Sparkles",
  "Cpu",
  "Database",
  "Code",
  "Flame",
  "Target",
  "UserRound",
];

function IconInput({ value, onChange, error }) {
  return (
    <div>
      <input
        type="text"
        list="lucide-icons-list"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ej: Rocket, ShieldCheck, Zap..."
        className={inputClasses(error)}
      />
      <datalist id="lucide-icons-list">
        {ICON_OPTIONS.map((ico) => (
          <option key={ico} value={ico} />
        ))}
      </datalist>
    </div>
  );
}

// ============================================================================
// Slug
// ============================================================================
function SlugInput({ value, onChange, error, required }) {
  function handleChange(e) {
    const v = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    onChange(v);
  }
  return (
    <div>
      <input
        type="text"
        value={value || ""}
        onChange={handleChange}
        placeholder="mi-item-slug"
        required={required}
        className={`${inputClasses(error)} font-mono`}
      />
      <p className="mt-1 text-xs text-tivit-ink/45">
        Solo minúsculas, números y guiones. Se usa en la URL.
      </p>
    </div>
  );
}

// ============================================================================
// Array genérico
// ============================================================================
function ArrayFieldEditor({ field, value, onChange }) {
  const items = Array.isArray(value) ? value : [];
  const itemFields = field.item_fields || [];
  const itemLabel = field.item_label || "Item";

  function add() {
    const empty = itemFields.length === 1 && itemFields[0].key === "value"
      ? { value: "" }
      : Object.fromEntries(itemFields.map((f) => [f.key, ""]));
    onChange([...items, empty]);
  }

  function remove(idx) {
    onChange(items.filter((_, i) => i !== idx));
  }

  function move(idx, delta) {
    const next = [...items];
    const target = idx + delta;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  function setItem(idx, key, v) {
    const next = [...items];
    const current = next[idx];
    if (typeof current === "object" && current !== null) {
      next[idx] = { ...current, [key]: v };
    } else {
      next[idx] = { [key]: v };
    }
    onChange(next);
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="rounded-lg border border-black/10 bg-white p-3"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-tivit-ink/55">
              {itemLabel} #{idx + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                className="rounded p-1 text-tivit-ink/40 hover:bg-tivit-red-light hover:text-tivit-red disabled:opacity-30"
                title="Subir"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(idx, 1)}
                disabled={idx === items.length - 1}
                className="rounded p-1 text-tivit-ink/40 hover:bg-tivit-red-light hover:text-tivit-red disabled:opacity-30"
                title="Bajar"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => remove(idx)}
                className="rounded p-1 text-tivit-ink/40 hover:bg-alert/10 hover:text-alert"
                title="Eliminar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {itemFields.length === 1 && itemFields[0].key === "value" ? (
            <input
              type="text"
              value={typeof item === "object" && item !== null ? item.value || "" : item || ""}
              onChange={(e) => setItem(idx, "value", e.target.value)}
              placeholder={itemFields[0].label}
              className={inputClasses(false)}
            />
          ) : (
            <div className="space-y-2">
              {itemFields.map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-xs font-medium text-tivit-ink/55">
                    {f.label}
                  </label>
                  <DynamicFormField
                    field={f}
                    value={item ? item[f.key] : ""}
                    onChange={(v) => setItem(idx, f.key, v)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-black/15 bg-white/60 py-2 text-sm font-medium text-tivit-ink/60 hover:border-tivit-red hover:text-tivit-red"
      >
        <Plus className="h-4 w-4" /> Agregar {itemLabel.toLowerCase()}
      </button>
    </div>
  );
}

// ============================================================================
// Object (video, etc.)
// ============================================================================
function ObjectFieldEditor({ field, value, onChange }) {
  const obj = value || {};
  const itemFields = field.item_fields || [];

  function setKey(k, v) {
    onChange({ ...obj, [k]: v });
  }

  return (
    <div className="rounded-lg border border-black/10 bg-white p-3 space-y-3">
      {itemFields.map((f) => (
        <div key={f.key}>
          <label className="mb-1 block text-xs font-medium text-tivit-ink/55">
            {f.label}
          </label>
          <DynamicFormField
            field={f}
            value={obj[f.key]}
            onChange={(v) => setKey(f.key, v)}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange({})}
        className="text-xs text-tivit-ink/45 hover:text-alert"
      >
        Vaciar
      </button>
    </div>
  );
}

// ============================================================================
// Media picker (para items de galería, etc.)
// ============================================================================
function MediaFieldEditor({ value, onChange }) {
  const [open, setOpen] = useState(false);

  if (!value) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-black/15 bg-white/60 py-3 text-sm font-medium text-tivit-ink/60 hover:border-tivit-red hover:text-tivit-red"
        >
          <Plus className="h-4 w-4" /> Seleccionar imagen
        </button>
        {open && <MediaPicker onClose={() => setOpen(false)} onSelect={onChange} />}
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 rounded-lg border border-black/10 bg-white p-2">
        <img
          src={value.url || value}
          alt={value.alt || ""}
          className="h-16 w-16 rounded object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="truncate text-xs font-medium text-tivit-ink/70">
            {value.url || value}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="rounded p-1.5 text-tivit-ink/40 hover:bg-alert/10 hover:text-alert"
        >
          <X className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded p-1.5 text-xs font-semibold text-tivit-red hover:bg-tivit-red-light"
        >
          Cambiar
        </button>
      </div>
      {open && <MediaPicker onClose={() => setOpen(false)} onSelect={onChange} />}
    </>
  );
}
