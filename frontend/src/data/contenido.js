export const team = [
  { name: "Pablo Pietro", role: "Director de Digital Business", initials: "PP" },
  { name: "Marjorie Guerra", role: "Gerente de Digital Business", initials: "MG" },
  { name: "Jesús López", role: "Gerente de Consultoría Preventa", initials: "JL" },
  { name: "Sergio Aguas", role: "Arquitecto IA", initials: "SA" },
  { name: "Manuel Aliaga", role: "Líder Técnico", initials: "MA" },
  { name: "Matías Méndez", role: "Ingeniero IA", initials: "MM" },
  { name: "Nilton Condori", role: "Ingeniero IA", initials: "NC" },
  { name: "José Paye", role: "Ingeniero IA", initials: "JP" },
  { name: "Jesús Huerta", role: "Ingeniero IA", initials: "JH" },
  { name: "Pedro López", role: "Ingeniero IA", initials: "PL" },
];

/**
 * Los items de "proyectos" y "laboratorio" se cargan de forma incremental
 * desde archivos JSON (data/items.json) o desde la API pública del CMS.
 * "almaviva", "xms", "casos-de-exito" y "poc" se cargan desde módulos de
 * datos propios (almaviva.js, xms.js, casosExito.js, poc.js).
 *
 * Los items de proyectos y casos-de-exito ahora se almacenan en la BD via CMS.
 * El frontend carga primero desde la API; si la BD está vacía, cae al fallback
 * estático de los archivos JSON/JS.
 */

/** Detalle enriquecido de los items de Tivit Labs. Se mergea sobre los items
 *  base del CSV `data/laboratorio.csv` (mismo patrón que `detallesProyectos`). */
const detallesLabs = {
  "lab-002-assistdev": {
    cicloVida: [
      { fase: "01", titulo: "Solicitud en lenguaje natural", descripcion: "El equipo describe lo que necesita.", icono: "MessageSquare" },
      { fase: "02", titulo: "Orquestación inteligente", descripcion: "El orquestador planifica y delega a los agentes especializados.", icono: "Workflow" },
      { fase: "03", titulo: "Diseño y gobernanza", descripcion: "Se generan artefactos de diseño y se valida con políticas y estándares.", icono: "FileText" },
      { fase: "04", titulo: "Control y calidad", descripcion: "Validaciones automáticas, pruebas y veredicto Go / No-Go.", icono: "CheckCircle" },
      { fase: "05", titulo: "Implementación (Delivery)", descripcion: "Código, infraestructura y operación con mejores prácticas incorporadas.", icono: "Rocket" },
      { fase: "06", titulo: "Software listo para producción", descripcion: "Entregas rápidas, seguras y totalmente trazables.", icono: "Package" },
    ],
    puntosClave: [
      { stat: "4", etiqueta: "Agentes especializados", detalle: "Orchestrator, Design, Control y Delivery con límites y permisos propios." },
      { stat: "113", etiqueta: "Skills especializadas", detalle: "Catálogo reutilizable que acelera y estandariza cada proyecto." },
      { stat: "HITL", etiqueta: "Human-in-the-loop", detalle: "El equipo confirma cada decisión clave de gobierno y diseño." },
      { stat: "9", etiqueta: "Artículos de constitución", detalle: "Gobernanza, validadores automáticos y guardrails integrados." },
      { stat: "E2E", etiqueta: "Trazabilidad end-to-end", detalle: "Cada decisión y artefacto queda registrada para auditoría." },
    ],
    ventajas: [
      { titulo: "Velocidad", descripcion: "Reduce el tiempo de desarrollo y salida a producción.", icono: "Zap" },
      { titulo: "Estandarización", descripcion: "Estandariza la calidad y las mejores prácticas.", icono: "GitBranch" },
      { titulo: "Cumplimiento", descripcion: "Asegura cumplimiento, seguridad y auditoría.", icono: "ShieldCheck" },
      { titulo: "Reutilización", descripcion: "Reutiliza conocimiento y acelera la entrega de valor.", icono: "Layers" },
      { titulo: "Ingeniería repetible", descripcion: "Menos código artesanal, más ingeniería repetible.", icono: "Wrench" },
    ],
    stackAgrupado: [
      { categoria: "Backend & Frontend", tecnologias: ["Python / FastAPI", "React / Angular"] },
      { categoria: "Base de datos & Mensajería", tecnologias: ["PostgreSQL / pgvector", "Redis / Kafka"] },
      { categoria: "Autenticación & Seguridad", tecnologias: ["OAuth2 / JWT / Keycloak"] },
      { categoria: "Infraestructura & Despliegue", tecnologias: ["Terraform", "Docker", "Kubernetes", "CI/CD (GitLab / GitHub)"] },
    ],
    videoPromocional: { tipo: "youtube", url: "https://www.youtube.com/watch?v=KeBuv45ZqC4" },
    videoTecnico: null,
    documentacion: null,
    urlProyecto: null,
    videoPlaceholder: false,
    galeria: [],
    tipoSolucion: "Framework agéntico",
    version: "v0.1.0",
  },
};

// Los items se cargan de forma diferida según la colección (ver cargarItems).
const FUENTES = {
  proyectos: "items",
  "casos-de-exito": "casosExito",
  laboratorio: "items",
  poc: "poc",
  almaviva: "almaviva",
  xms: "xms",
};

// PoC data is now in ./poc.js (lazy-loaded)

export const colecciones = {
  proyectos: {
    ruta: "proyectos",
    nombre: "Proyectos",
    titulo: "Lo que hemos construido",
    intro:
      "Proyectos entregados para clientes externos e iniciativas internas del equipo. Entra en cualquiera para ver el detalle de lo que hicimos y su video demostrativo.",
    resumenPortada: "Externos e internos",
    cta: "Ver todos los proyectos",
    agruparPor: null,
    filtroTipoEtiqueta: "Cliente",
    tipoDestacado: null,
    fuente: "items",
  },

  "casos-de-exito": {
    ruta: "casos-de-exito",
    nombre: "Casos de éxito",
    titulo: "Casos de éxito en Inteligencia Artificial y Datos",
    intro:
      "Casos de éxito implementados en clientes corporativos y sector público. Cada caso describe el perfil del cliente, el alcance de la solución, la arquitectura técnica y el stack tecnológico.",
    resumenPortada: "IA y datos en clientes reales",
    cta: "Ver todos los casos de éxito",
    sinClasificaciones: true,
    agruparPor: [
      {
        valor: "Minería",
        titulo: "Minería",
        campo: "industria",
        etiqueta: "MINERÍA",
      },
      {
        valor: "Salud y Seguros",
        titulo: "Salud y Seguros",
        campo: "industria",
        etiqueta: "SALUD",
      },
      {
        valor: "Transporte e Infraestructura Aeroportuaria",
        titulo: "Transporte e Infraestructura Aeroportuaria",
        campo: "industria",
        etiqueta: "AEROPUERTO",
      },
      {
        valor: "Deporte y Tecnología (SportsTech)",
        titulo: "Deporte y Tecnología (SportsTech)",
        campo: "industria",
        etiqueta: "SPORTSTECH",
      },
      {
        valor: "Tecnología y Construcción (ConTech)",
        titulo: "Tecnología y Construcción (ConTech)",
        campo: "industria",
        etiqueta: "CONTECH",
      },
      {
        valor: "Sector Público y Transporte",
        titulo: "Sector Público y Transporte",
        campo: "industria",
        etiqueta: "SECTOR PÚBLICO",
      },
    ],
    fuente: "casosExito",
  },

  laboratorio: {
    ruta: "laboratorio",
    nombre: "Tivit Labs",
    titulo: "Tivit Labs — Exploración e Innovación en IA",
    intro:
      "Un espacio para explorar, validar y compartir nuevas capacidades de inteligencia artificial. Aquí reunimos investigaciones, frameworks y herramientas que convierten ideas en soluciones reutilizables.",
    resumenPortada: "Investigaciones y productos del equipo",
    cta: "Ir al laboratorio",
    agruparPor: [
      {
        valor: "Producto",
        titulo: "Producto",
        campo: "categoria",
        etiqueta: "FRAMEWORK",
      },
      {
        valor: "Investigación",
        titulo: "Investigación",
        campo: "categoria",
        etiqueta: "PAPER / ESTUDIO",
        horizontal: true,
        cta: "Leer informe",
      },
    ],
    sinClasificaciones: true,
    tipoDestacado: null,
    vacio: {
      titulo: "Aún no hay publicaciones",
      mensaje:
        "Aquí se irán publicando las investigaciones y los productos elaborados por el equipo.",
    },
    fuente: "items",
  },

  poc: {
    ruta: "poc",
    nombre: "PoC",
    titulo: "Explorando nuevas ideas",
    intro:
      "Pruebas de concepto con las que validamos la viabilidad técnica de una idea antes de comprometernos con ella.",
    resumenPortada: "Explorando nuevas ideas",
    cta: "Ver todas las PoC",
    agruparPor: null,
    fuente: "poc",
  },

  almaviva: {
    ruta: "almaviva",
    nombre: "Almaviva Group",
    titulo: "Soluciones de IA de Almaviva Group",
    intro:
      "Portafolio de soluciones de inteligencia artificial de Almaviva Group, clasificadas por capacidad de IA. Explora cada una para conocer su alcance, clientes de referencia, arquitectura y condiciones de implementación.",
    resumenPortada: "Soluciones y productos de IA del grupo",
    cta: "Ver todas las soluciones",
    sinClasificaciones: true,
    tipoDestacado: null,
    agruparPor: [
      {
        valor: "Documental y Conocimiento",
        titulo: "IA Documental y del Conocimiento",
        campo: "categoria",
        etiqueta: "DOCUMENTAL",
      },
      {
        valor: "Salud y Clínica",
        titulo: "Salud y Clínica",
        campo: "categoria",
        etiqueta: "SALUD",
      },
      {
        valor: "Conversacional y Atención al Cliente",
        titulo: "Conversacional y Atención al Cliente",
        campo: "categoria",
        etiqueta: "CONVERSACIONAL",
      },
      {
        valor: "Voz y Multimodal",
        titulo: "Voz y Multimodal",
        campo: "categoria",
        etiqueta: "VOZ",
      },
      {
        valor: "Analítica, Predicción y Riesgo",
        titulo: "Analítica, Predicción y Riesgo",
        campo: "categoria",
        etiqueta: "ANALÍTICA",
      },
      {
        valor: "Asistencia en Campo y Mantenimiento",
        titulo: "Asistencia en Campo y Mantenimiento",
        campo: "categoria",
        etiqueta: "CAMPO",
      },
    ],
    fuente: "almaviva",
  },

  xms: {
    ruta: "xms",
    nombre: "XMS",
    titulo: "Portafolio de Agentes de Inteligencia Artificial",
    intro:
      "Agentes de IA para automatizar la atención, las operaciones y el cumplimiento. Conoce cada agente, su alcance, cliente de referencia, precio y tecnologías.",
    resumenPortada: "Agentes de IA",
    cta: "Ver todos los agentes",
    sinClasificaciones: true,
    tipoDestacado: null,
    agruparPor: [
      {
        valor: "especifico",
        titulo: "Agentes específicos",
        campo: "tipoAgente",
        etiqueta: "ESPECÍFICO",
      },
      {
        valor: "general",
        titulo: "Agentes Generales",
        campo: "tipoAgente",
        etiqueta: "GENERAL",
      },
    ],
    fuente: "xms",
  },
};

export const listaColecciones = Object.values(colecciones);

/** Enlaces externos que se muestran junto a las secciones (abren en pestaña nueva).
 *  Compartidos por el menú de navegación y el pie de página. */
export const enlacesExternos = [
  {
    nombre: "Repositorio",
    url: "https://drive.google.com/drive/folders/1Tx50ubrmj6x6syyrYkLkxog_21dePFzd?usp=drive_link",
  },
];

/** Mensaje por defecto cuando una colección aún no tiene contenido. */
export const VACIO_DEFAULT = {
  titulo: "Aún no hay contenido",
  mensaje: "Esta sección se completará próximamente.",
};

export function getColeccion(ruta) {
  return colecciones[ruta];
}

/**
 * Carga diferida de los items de una colección.
 *
 * Estrategia híbrida:
 * 1. Primero intenta leer de la API pública (`/api/public/content/:collection`).
 *    Esta API devuelve los items gestionados por el CMS (solo publicados).
 * 2. Si la API responde vacío (BD sin items), cae al fallback estático
 *    (items.json, casosExito.js, almaviva.js, xms.js, poc.js).
 *
 * El resultado se cachea por ruta para evitar re-importar y re-filtrar en cada
 * llamada. Esto permite migrar gradualmente los items al CMS sin perder el
 * contenido preexistente.
 */
const cacheItems = new Map();

/**
 * Normaliza un item proveniente de la API del CMS.
 *
 * El CMS almacena los arrays de un solo campo (stack, problemas, queHicimos,
 * resultados, procesos, industrias, funcionalidades, etc.) como arreglos de
 * objetos `{ value: "..." }` en lugar de arrays de strings simples.
 * Renderizarlos directamente causa el React error #31
 * ("Objects are not valid as a React child").
 *
 * Esta función detecta genéricamente cualquier array de objetos `{value}`
 * y los convierte a strings antes de que lleguen a los componentes.
 */
function normalizarItemApi(item) {
  if (!item || typeof item !== "object") return item;

  const result = { ...item };

  // Parse JSON strings for array fields (from projects table flat columns)
  const arrayFields = ["equipo", "stack", "problemas", "que_hicimos", "queHicimos", "resultados", "highlights", "galeria"];
  for (const campo of arrayFields) {
    const val = result[campo];
    if (typeof val === "string" && val.startsWith("[")) {
      try {
        result[campo] = JSON.parse(val);
      } catch {
        // leave as-is
      }
    }
  }

  // Parse JSON strings for object fields
  const objectFields = ["video_promocional", "videoPromocional", "video_tecnico", "videoTecnico"];
  for (const campo of objectFields) {
    const val = result[campo];
    if (typeof val === "string" && val.startsWith("{")) {
      try {
        result[campo] = JSON.parse(val);
      } catch {
        // leave as-is
      }
    }
  }

  // Map snake_case to camelCase for projects table fields
  if (result.nombre_comercial && !result.nombreComercial) result.nombreComercial = result.nombre_comercial;
  if (result.descripcion_larga && !result.descripcionLarga) result.descripcionLarga = result.descripcion_larga;
  if (result.tipo_solucion && !result.tipoSolucion) result.tipoSolucion = result.tipo_solucion;
  if (result.video_promocional && !result.videoPromocional) result.videoPromocional = result.video_promocional;
  if (result.video_tecnico && !result.videoTecnico) result.videoTecnico = result.video_tecnico;
  if (result.documento_drive && !result.documentoDrive) result.documentoDrive = result.documento_drive;
  if (result.url_proyecto && !result.urlProyecto) result.urlProyecto = result.url_proyecto;
  if (result.video_placeholder !== undefined && result.videoPlaceholder === undefined) result.videoPlaceholder = !!result.video_placeholder;
  if (result.que_hicimos && !result.queHicimos) result.queHicimos = result.que_hicimos;

  // Use slug as codigo fallback
  if (!result.codigo && result.code) result.codigo = result.code;

  for (const campo of Object.keys(result)) {
    const val = result[campo];
    if (!Array.isArray(val) || val.length === 0) continue;

    const esArrayDeValue = val.some(
      (entry) =>
        entry !== null &&
        typeof entry === "object" &&
        !Array.isArray(entry) &&
        Object.keys(entry).length === 1 &&
        "value" in entry
    );

    if (esArrayDeValue) {
      result[campo] = val.map((entry) => {
        if (typeof entry === "string") return entry;
        if (entry && typeof entry === "object" && "value" in entry) {
          return String(entry.value ?? "");
        }
        return String(entry ?? "");
      });
    }
  }

  return result;
}

// Estrategia híbrida: prioriza la BD (content_items), cae a fallback estático si la BD está vacía.
// Ver docs/CONTENT-FLOW.md para documentación completa del flujo.
async function fetchFromApi(ruta) {
  const base = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
  const url = `${base}/public/content/${ruta}?limit=500`;
  try {
    const res = await fetch(url, { credentials: "omit" });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.items || json.items.length === 0) return null;

    // Proyectos: items are flat columns from projects table
    if (ruta === "proyectos") {
      return json.items.map((item) => normalizarItemApi(item));
    }

    // Other collections: items have item.data from content_items table
    return json.items.map((item) => normalizarItemApi(item.data));
  } catch {
    return null;
  }
}

async function loadStaticFallback(coleccion) {
  const fuente = FUENTES[coleccion.ruta];
  if (fuente === "poc") {
    const modulo = await import("./poc.js");
    return modulo.pocs;
  }
  if (fuente === "almaviva") {
    const modulo = await import("./almaviva.js");
    return modulo.productosAlmaviva;
  }
  if (fuente === "xms") {
    const modulo = await import("./xms.js");
    return modulo.agentesXms;
  }
  if (fuente === "casosExito") {
    const modulo = await import("./casosExito.js");
    return modulo.casosExito;
  }
  if (fuente === "items") {
    const { default: items } = await import("./items.json");
    if (coleccion.ruta === "proyectos") {
      return items.filter((item) => item.coleccion === "proyectos");
    }
    if (coleccion.ruta === "laboratorio") {
      return items
        .filter((item) => item.coleccion === "laboratorio")
        .map((item) => ({ ...item, ...(detallesLabs[item.slug] ?? {}) }));
    }
    return items.filter((item) => item.coleccion === coleccion.ruta);
  }
  return [];
}

export async function cargarItems(coleccion) {
  const fuente = FUENTES[coleccion?.ruta];
  if (!fuente) return [];

  if (cacheItems.has(coleccion.ruta)) {
    return cacheItems.get(coleccion.ruta);
  }

  // 1) Intentar desde la API (items gestionados por el CMS)
  const fromApi = await fetchFromApi(coleccion.ruta);
  if (fromApi && fromApi.length > 0) {
    cacheItems.set(coleccion.ruta, fromApi);
    return fromApi;
  }

  // 2) Fallback a archivos estáticos
  const fallback = await loadStaticFallback(coleccion);
  cacheItems.set(coleccion.ruta, fallback);
  return fallback;
}

/** Limpia el cache (útil cuando el usuario publica cambios en el CMS). */
export function invalidarCacheItems(ruta) {
  if (ruta) {
    cacheItems.delete(ruta);
  } else {
    cacheItems.clear();
  }
}

/** Elementos con ficha propia (excluye los espacios reservados). */
export function itemsPublicados(items) {
  return items.filter((item) => !item.reservado);
}

export async function getItem(ruta, slug) {
  const coleccion = getColeccion(ruta);
  if (!coleccion) return undefined;
  const items = await cargarItems(coleccion);
  return itemsPublicados(items).find((item) => item.slug === slug);
}

/** Indica si la ficha todavía no tiene contenido descriptivo. */
export function contenidoPendiente(item) {
  return (
    !item.descripcion &&
    !item.videoPromocional &&
    !item.videoTecnico &&
    !item.documentacion &&
    !item.documentoDrive &&
    (item.equipo?.length ?? 0) === 0 &&
    (item.galeria?.length ?? 0) === 0 &&
    (item.stack?.length ?? 0) === 0 &&
    (item.problemas?.length ?? 0) === 0 &&
    (item.resultados?.length ?? 0) === 0 &&
    !item.contexto &&
    (item.queHicimos?.length ?? 0) === 0
  );
}
