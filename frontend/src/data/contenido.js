export const team = [
  { name: "Marjorie Guerra", role: "Gerente Digital", initials: "MG" },
  { name: "Sergio Aguas", role: "Arquitecto IA", initials: "SA" },
  { name: "Manuel Aliaga", role: "Líder Técnico", initials: "MA" },
  { name: "Matías Méndez", role: "Ingeniero IA", initials: "MM" },
  { name: "Nilton Condori", role: "Ingeniero IA", initials: "NC" },
  { name: "José Paye", role: "Ingeniero IA", initials: "JP" },
  { name: "Jesús Huerta", role: "Ingeniero IA", initials: "JH" },
  { name: "Pedro López", role: "Ingeniero IA", initials: "PL" },
];

/**
 * Las cuatro colecciones del sitio (Proyectos, Casos de éxito, Laboratorio y PoC)
 * comparten la misma forma, y por eso comparten también las mismas páginas de
 * listado y detalle.
 *
 * Los items de "proyectos" y "laboratorio" se cargan de forma incremental desde
 * CSVs (data/*.csv) con el script scripts/cargar_proyectos.py, que genera
 * src/data/items.json. "almaviva", "xms" y "casos-de-exito" se cargan desde
 * módulos de datos propios (almaviva.js, xms.js, casosExito.js). Cada item
 * admite estos campos:
 *
 *   slug             (obligatorio) identificador para la URL: /coleccion/slug
 *   coleccion        colección a la que pertenece (proyectos, casos-de-exito, …)
 *   nombreComercial  título mostrado en tarjetas y ficha
 *   nombreProyecto   nombre oficial (subtítulo en la ficha, si difiere)
 *   codigo           código interno, p. ej. "PRJ-009"
 *   tipo             área (solo "Interno" o "Externo")
 *   estado           p. ej. "Desplegado"
 *   cliente          p. ej. "Antamina"
 *   descripcion      resumen de una o dos líneas
 *   equipo           [{ nombre, rol }]  → "Manuel Aliaga (Líder Técnico)" en CSV
 *   videoPromocional video comercial  → "youtube|URL", "vimeo|URL", "archivo|/ruta"
 *   videoTecnico     video técnico (mismo formato)
 *   documentacion    URL de la documentación
 *   galeria          lista de rutas de imágenes "/media/proyectos/<slug>/xxx.jpg"
 *   stack            lista de tecnologías
 *   problemas        lista de problemas a enfrentar
 *   resultados       lista de resultados
 *   reservado        true → borrador oculto: no se muestra hasta estar listo
 *
 * Los campos vacíos no se muestran en la ficha. Si el item no tiene contenido
 * (sin descripción, videos, equipo, stack, problemas ni resultados) la ficha
 * muestra un aviso de "en preparación".
 */

const detallesProyectos = {
  "prj-009-automatizacion-qa": {
    nombreComercial: "TivitQA — Automatización de Documentación QA",
    nombreProyecto: "Plataforma de automatización y asistencia para documentación QA",
    cliente: null,
    estado: "Desplegado",
    version: "No especificada",
    tipoSolucion: "Plataforma web de automatización y asistencia QA",
    videoPromocional: null,
    videoTecnico: null,
    documentacion: null,
    urlProyecto: "https://docs.empresa.com/prj-009",
    videoPlaceholder: true,
    galeria: [],
    descripcion:
      "Plataforma que automatiza la generación de documentación QA a partir de requerimientos y secuencias de capturas de pantalla.",
    descripcionLarga:
      "TivitQA utiliza inteligencia artificial con Gemini para transformar documentos de requerimientos y flujos visuales en entregables de calidad estructurados. Genera matrices de casos de prueba clásicas, matrices Gherkin y especificaciones completas de casos de uso, reduciendo el trabajo manual y estandarizando la documentación entre equipos QA.",
    stack: [
      "Python",
      "Flask",
      "FastAPI",
      "React",
      "TypeScript",
      "Vite",
      "PostgreSQL",
      "SQLAlchemy",
      "Gemini / Vertex AI",
      "Google Cloud Storage",
      "Microsoft SSO",
      "Socket.IO",
      "Google Cloud Run",
      "Docker",
    ],
    problemas: [
      "Elaboración manual, lenta e inconsistente de matrices de prueba",
      "Dificultad para transformar documentos PDF y DOCX en casos estructurados",
      "Falta de estandarización entre entregables de distintos analistas QA",
      "Complejidad para documentar flujos funcionales a partir de capturas de pantalla",
      "Riesgo de omitir escenarios, secuencias alternativas y condiciones relevantes",
      "Necesidad de mantener numeración y continuidad entre distintas generaciones",
    ],
    queHicimos: [
      "Implementamos generación automática de matrices a partir de documentos PDF, DOCX y TXT",
      "Incorporamos tres tipos de salida: matriz clásica, matriz Gherkin y especificación de casos de uso",
      "Integramos Gemini AI y Vertex AI para analizar requerimientos, capturas y flujos funcionales",
      "Construimos exportaciones basadas en plantillas oficiales: Excel para matrices y Word para casos de uso",
      "Desarrollamos generación incremental con numeración secuencial de casos de prueba y casos de uso",
      "Implementamos Microsoft SSO, almacenamiento en Google Cloud, actualizaciones en tiempo real y controles de seguridad",
    ],
    resultados: [
      "Plataforma desplegada y operativa sobre Google Cloud",
      "Generación automatizada de matrices clásicas y Gherkin",
      "Especificaciones de casos de uso desde secuencias de capturas de pantalla",
      "Exportación de matrices en Excel y documentos de casos de uso en Word",
      "Diagramas UML generados automáticamente para bloques temáticos",
      "Continuidad de numeración y actualización de estados en tiempo real",
      "Auditoría de seguridad completada y vulnerabilidades críticas remediadas",
    ],
  },
  "prj-010-analisis-mercado-publico": {
    nombreComercial: "Mercado Público Management",
    nombreProyecto: "Plataforma de inteligencia para licitaciones públicas chilenas",
    cliente: null,
    estado: "Desplegado",
    version: "v1.0.0",
    tipoSolucion: "Plataforma web de inteligencia para licitaciones",
    videoPromocional: null,
    videoTecnico: null,
    documentacion: null,
    urlProyecto: "https://docs.empresa.com/prj-010",
    videoPlaceholder: true,
    galeria: [],
    descripcion:
      "Plataforma de inteligencia para gestionar, buscar y analizar licitaciones públicas chilenas de Mercado Público.",
    descripcionLarga:
      "Mercado Público Management centraliza el seguimiento de oportunidades de mercadopublico.cl y convierte grandes volúmenes de licitaciones, actas y documentos PDF en información accionable. La plataforma combina búsqueda tradicional y lenguaje natural, análisis documental con inteligencia artificial, alertas multicanal e inteligencia competitiva para ayudar a los equipos a decidir dónde participar y cómo mejorar sus propuestas.",
    stack: [
      ".NET 8",
      "C#",
      "ASP.NET Core",
      "React",
      "TypeScript",
      "PostgreSQL",
      "Dapper",
      "SignalR",
      "Redis",
      "Gemini / Vertex AI",
      "Google Cloud Run",
      "Playwright",
    ],
    problemas: [
      "Seguimiento manual y diario de licitaciones y aclaraciones",
      "Gran volumen de información difícil de filtrar con búsquedas literales",
      "Análisis lento y propenso a errores de actas y documentos PDF",
      "Poca visibilidad sobre competidores, ofertas y resultados históricos",
      "Alertas imprecisas y criterios poco consistentes para decidir un go/no-go",
    ],
    queHicimos: [
      "Implementamos la sincronización automática de licitaciones mediante la API oficial y procesos programados",
      "Incorporamos búsqueda semántica con Gemini y degradación controlada a búsqueda tradicional",
      "Creamos un workspace por licitación para analizar actas y validar documentos enviados",
      "Desarrollamos alertas configurables por palabra clave, monto, organismo y tipo de licitación",
      "Construimos inteligencia competitiva sobre participación, montos ofertados y adjudicaciones",
      "Separamos API, sincronización, scraping y análisis en servicios escalables sobre Google Cloud",
    ],
    resultados: [
      "Versión v1.0.0 desplegada en producción sobre Google Cloud",
      "Sincronización automática, búsqueda semántica y análisis de actas con IA",
      "Dashboard ejecutivo con indicadores de licitaciones ganadas y perdidas",
      "Alertas por aplicación, correo electrónico y Telegram",
      "Flujo colaborativo con responsables, comentarios y decisión go/no-go",
    ],
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

// TODO: contenido de ejemplo pendiente de reemplazar por las PoC reales.
const pocs = [
  {
    slug: "asistente-interno-ia",
    name: "Asistente interno con IA",
    estado: "En planificación",
    description:
      "Prueba de concepto de un asistente conversacional para soporte de primer nivel del equipo.",
    contexto: "",
    queHicimos: [],
    resultados: [],
    stack: [],
    demo: null,
  },
  {
    slug: "migracion-microservicios",
    name: "Migración a arquitectura de microservicios",
    estado: "Desplegado",
    description:
      "Validación de viabilidad técnica para descomponer un monolito en servicios independientes.",
    contexto: "",
    queHicimos: [],
    resultados: [],
    stack: [],
    demo: null,
  },
];

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
    nombre: "Laboratorio",
    titulo: "Laboratorio de IA",
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
    nombre: "Almaviva",
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
      "Agentes de IA para automatizar la atención, las operaciones y el cumplimiento. Conoce cada agente, su alcance, cliente de referencia, inversión y tecnologías.",
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

/** Mensaje por defecto cuando una colección aún no tiene contenido. */
export const VACIO_DEFAULT = {
  titulo: "Aún no hay contenido",
  mensaje: "Esta sección se completará próximamente.",
};

export function getColeccion(ruta) {
  return colecciones[ruta];
}

/**
 * Carga diferida de los items de una colección. Los datos pesados
 * (items.json, almaviva.js) se traen solo cuando la página los necesita,
 * generando chunks separados en el bundle. El resultado se cachea por ruta
 * para evitar re-importar y re-filtrar en cada llamada.
 */
const cacheItems = new Map();

export async function cargarItems(coleccion) {
  const fuente = FUENTES[coleccion?.ruta];
  if (!fuente) return [];

  if (cacheItems.has(coleccion.ruta)) {
    return cacheItems.get(coleccion.ruta);
  }

  let resultado;
  if (fuente === "poc") {
    resultado = pocs;
  } else if (fuente === "almaviva") {
    const modulo = await import("./almaviva.js");
    resultado = modulo.productosAlmaviva;
  } else if (fuente === "xms") {
    const modulo = await import("./xms.js");
    resultado = modulo.agentesXms;
  } else if (fuente === "casosExito") {
    const modulo = await import("./casosExito.js");
    resultado = modulo.casosExito;
  } else if (fuente === "items") {
    const { default: items } = await import("./items.json");
    if (coleccion.ruta === "proyectos") {
      resultado = items
        .filter((item) => item.coleccion === "proyectos" && item.slug !== "prj-001-plataforma-gestion-comercial")
        .map((item) => ({ ...item, ...(detallesProyectos[item.slug] ?? {}) }));
    } else {
      resultado = items.filter((item) => item.coleccion === coleccion.ruta);
    }
  } else {
    resultado = [];
  }

  cacheItems.set(coleccion.ruta, resultado);
  return resultado;
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
