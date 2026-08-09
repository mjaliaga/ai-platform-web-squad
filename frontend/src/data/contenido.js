import items from "./items.json";

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
 * Los items de "proyectos", "casos-de-exito" y "laboratorio" se cargan de forma
 * incremental desde CSVs (data/*.csv) con el script scripts/cargar_proyectos.py,
 * que genera src/data/items.json. Cada item admite estos campos:
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

const proyectos = items
  .filter((item) => item.coleccion === "proyectos" && item.slug !== "prj-001-plataforma-gestion-comercial")
  .map((item) => ({ ...item, ...(detallesProyectos[item.slug] ?? {}) }));
const casosDeExito = items.filter((item) => item.coleccion === "casos-de-exito");
const laboratorio = items.filter((item) => item.coleccion === "laboratorio");

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
    items: proyectos,
  },

  "casos-de-exito": {
    ruta: "casos-de-exito",
    nombre: "Casos de éxito",
    titulo: "Problemas reales que hemos resuelto",
    intro:
      "Situaciones concretas en las que nuestro trabajo cambió la forma de operar de un equipo o un cliente.",
    resumenPortada: "Problemas reales que hemos resuelto",
    cta: "Ver todos los casos de éxito",
    agruparPor: null,
    soloArea: true,
    items: casosDeExito,
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
    items: laboratorio,
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
    items: pocs,
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

/** Elementos con ficha propia (excluye los espacios reservados). */
export function itemsPublicados(coleccion) {
  return coleccion.items.filter((item) => !item.reservado);
}

export function getItem(ruta, slug) {
  const coleccion = getColeccion(ruta);
  if (!coleccion) return undefined;
  return itemsPublicados(coleccion).find((item) => item.slug === slug);
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
