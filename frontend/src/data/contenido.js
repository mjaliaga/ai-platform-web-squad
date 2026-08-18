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
    cliente: "Externo",
    estado: "Desplegado",
    version: "v1.0.0",
    tipoSolucion: "Plataforma web de automatización y asistencia QA",
    videoPromocional: { tipo: "youtube", url: "https://www.youtube.com/watch?v=40dzhwuRF1g" },
    videoTecnico: null,
    documentacion: null,
    urlProyecto: "https://docs.empresa.com/prj-009",
    videoPlaceholder: false,
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
    cliente: "Interno",
    estado: "Desplegado",
    version: "v1.0.0",
    tipoSolucion: "Plataforma web de inteligencia para licitaciones",
    videoPromocional: { tipo: "youtube", url: "https://www.youtube.com/watch?v=Sd_p2Be00B4" },
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
  "prj-018-deskflow-ai-xcally": {
    nombreComercial: "DeskFlow AI — Agente Virtual Inteligente para Mesa de Ayuda en XCALLY",
    nombreProyecto: "Agente virtual de voz para Mesa de Ayuda integrado con XCALLY",
    cliente: "Interno",
    estado: "En desarrollo",
    version: "En desarrollo",
    tipoSolucion: "Agente Virtual Inteligente de voz para Mesa de Ayuda / Prueba de Concepto (PoC)",
    videoPromocional: { tipo: "youtube", url: "https://www.youtube.com/watch?v=A7vS4M2inUw" },
    videoTecnico: null,
    documentacion: null,
    urlProyecto: null,
    videoPlaceholder: false,
    galeria: [],
    descripcion:
      "Agente virtual de voz para Mesa de Ayuda integrado con XCALLY Motion / Cally Square que transforma procedimientos de soporte en conversaciones guiadas y acciones automatizadas.",
    descripcionLarga:
      "Desarrolla una prueba de concepto de agente virtual de voz para Mesa de Ayuda integrado con XCALLY Motion / Cally Square. Está orientado a transformar procedimientos de soporte en conversaciones guiadas y acciones automatizadas. Su alcance funcional validado incluye el cambio/restablecimiento de contraseña y tratamiento de cuentas bloqueadas, captura segura de documento de identidad, mantenimiento de contexto, ejecución controlada de operaciones y escalamiento a Mesa de Servicio. Combina XCALLY, Google STT/TTS, FastAPI, LangGraph, Vertex AI Gemini, Cloud Run, Firestore y Cloud Spanner.",
    queHicimos: [
      "Modelado de procedimientos: análisis y transformación de instrucciones operativas (ej. cambio de contraseña vía portales Microsoft y TIVIT) en comportamientos conversacionales",
      "Construcción del flujo en XCALLY: uso de bloques nativos en Cally Square para Google TTS/ASR, captura DTMF, consumo REST, ruteo condicional (GoToIf), reproducción dinámica y escalamiento",
      "Orquestador desacoplado: API con FastAPI y LangGraph en Cloud Run que desacopla la telefonía del cerebro conversacional y reduce la interfaz de XCALLY a cuatro rutas (CONTINUE, COLLECT_IDENTITY, COMPLETE, ESCALATE)",
      "Capa NLP/NLU con Gemini: integración de Vertex AI Gemini para comprensión contextual y variaciones lingüísticas controladas, manteniendo deterministas las consultas y operaciones sensibles",
      "Persistencia de contexto: implementación de Firestore por identificador de llamada para conservar el estado multiturno y datos pendientes",
      "Dominio corporativo simulado: base de datos en Cloud Spanner para consultar empleados, estados de cuenta y simular operaciones de restablecimiento y desbloqueo tipo AD",
      "Captura y validación de identidad: ingreso seguro de documento mediante teclado telefónico (DTMF) separado del reconocimiento de voz",
      "Pruebas y calidad: implementación de pruebas unitarias e integración (166 aprobadas, 94 % de cobertura global, validación con Ruff y MyPy)",
    ],
    highlights: [
      { valor: "166", etiqueta: "Pruebas aprobadas", detalle: "Unitarias e integración" },
      { valor: "94%", etiqueta: "Cobertura global", detalle: "Ruff + MyPy" },
      { valor: "4", etiqueta: "Rutas de integración", detalle: "CONTINUE · COLLECT_IDENTITY · COMPLETE · ESCALATE" },
      { valor: "Multi", etiqueta: "Contexto multiturno", detalle: "Estado persistente por llamada" },
    ],
  },
  "prj-008-tivit-soc": {
    nombreComercial: "TivitSOC — Centro de Operaciones de Seguridad Inteligente",
    nombreProyecto: "Plataforma de monitoreo, análisis y gobernanza de incidentes de ciberseguridad",
    cliente: "Interno",
    estado: "Operativo / En evolución",
    version: "1.0.0",
    tipoSolucion: "Plataforma web de gestión y monitoreo SOC con IA",
    videoPromocional: { tipo: "youtube", url: "https://www.youtube.com/watch?v=oi5Jr7ExlMs" },
    videoTecnico: null,
    documentacion: null,
    urlProyecto: null,
    videoPlaceholder: false,
    galeria: [],
    descripcion:
      "Plataforma que centraliza, enriquece y gestiona el flujo operativo de eventos de seguridad mediante inteligencia artificial y supervisión de analistas.",
    descripcionLarga:
      "TivitSOC centraliza la recepción, análisis y resolución de eventos de seguridad dentro de un flujo gobernado y trazable. Integra inteligencia artificial para acelerar la contextualización de incidentes mediante análisis automatizado y mentoría operativa (Copilot), permitiendo a los analistas evaluar observables (IoCs), gestionar clientes y auditar decisiones críticas en tiempo real.",
    queHicimos: [
      "Diseño de un pipeline de eventos estructurado en cinco fases: Ingesta, Threat Intel, Análisis, Reporte y Notificación",
      "Integración de un motor de inteligencia artificial y mentoría tipo Copilot para análisis de payloads y recomendaciones de mitigación",
      "Módulo interactivo de observables basado en grafos para correlacionar IPs, dominios y hashes con tickets",
      "Panel de control centralizado con métricas clave (MTTD, tasa de falsos positivos, volumen y severidad)",
      "Módulos de gestión multicliente y administración de analistas con control de monitoreo activo",
      "Exportación de datos en formatos CSV, Excel para analistas y reportes ejecutivos en PDF",
    ],
  },
  "prj-017-tivit-acv": {
    nombreComercial: "TivitACV — Asistente Comercial de Planillas ACV",
    nombreProyecto: "Plataforma de analítica financiera y asistencia conversacional con IA",
    cliente: "Interno",
    estado: "Operativo",
    version: "1.0.0",
    tipoSolucion: "Plataforma analítica y asistente virtual de finanzas comerciales",
    videoPromocional: { tipo: "youtube", url: "https://www.youtube.com/watch?v=H-brqU897YM" },
    videoTecnico: null,
    documentacion: null,
    urlProyecto: null,
    videoPlaceholder: false,
    galeria: [],
    descripcion:
      "Plataforma que centraliza el seguimiento del Annual Contract Value (ACV), el control presupuestario y la consulta ágil de planillas comerciales.",
    descripcionLarga:
      "TivitACV combina un dashboard ejecutivo de indicadores comerciales con un asistente conversacional dotado de inteligencia artificial y reglas de gobernanza de dominio. Facilita el análisis comparativo de metas, variaciones entre cortes semanales/mensuales y la exploración de métricas financieras por país y línea de negocio a partir de planillas estructuradas.",
    queHicimos: [
      "Dashboard ejecutivo con KPIs clave: ACV acumulado, presupuesto YTD, pipeline total/avanzado y cumplimiento",
      "Visualización comparativa de variaciones y desgloses multidimensionales por país y línea de negocio",
      "Asistente conversacional con IA gobernada (guardrails) restringido exclusivamente a datos financieros y comerciales",
      "Ingesta flexible de documentos mediante carga directa de archivos Excel y vinculación de carpetas en Google Drive",
      "Historial de sesiones de chat con guardado automático, conteo de interacciones y títulos editables",
      "Exportación directa de dashboards a reportes PDF estructurados y módulo de administración de usuarios y permisos",
    ],
  },
};

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

// PoC de TivitVision — Video Analítica Inteligente con IA.
const pocs = [
  {
    slug: "prj-vis-03-tivit-vision",
    codigo: "PRJ-VIS-03",
    nombreComercial: "TivitVision — Plataforma de Video Analítica Inteligente con IA",
    nombreProyecto:
      "Plataforma de visión computacional, analítica en tiempo real y seguridad operativa",
    tipo: "Interno",
    estado: "Operativo / Demostración funcional",
    cliente: "Interno",
    descripcion:
      "Plataforma que procesa flujos de video para automatizar la detección de incidentes de seguridad laboral, control de zonas y monitoreo patrimonial.",
    descripcionLarga:
      "TivitVision utiliza modelos de visión artificial e inteligencia artificial generativa para transformar cámaras de seguridad convencionales en sensores analíticos avanzados. Permite delimitar zonas interactivas en video para monitorear el cumplimiento de EPP, detectar riesgos de atropello, controlar tiempos de espera y colas en almacenes, e identificar intrusiones fuera de horario laboral, generando clips de evidencia y reportes forenses automatizados.",
    videoPromocional: { tipo: "youtube", url: "https://www.youtube.com/watch?v=pt2iC9Sc7u0" },
    problemas: [
      "Imposibilidad de supervisar manualmente múltiples transmisiones de video en simultáneo 24/7",
      "Incumplimiento no detectado de Equipos de Protección Personal (EPP) en zonas de alto riesgo operativo",
      "Riesgos críticos de accidentes y atropellos por interacción cercana entre maquinaria/vehículos y personas",
      "Falta de visibilidad sobre ineficiencias operativas, tiempos excesivos de espera y congestión de colas en almacenes",
      "Intrusiones e ingresos no autorizados en horarios no laborales difíciles de auditar de forma inmediata",
      "Extracción lenta y manual de clips de video al momento de documentar o auditar incidentes de seguridad",
    ],
    queHicimos: [
      "Motor de dibujo y configuración de polígonos interactivos para delimitar zonas sobre las transmisiones de video",
      "Analítica de seguridad laboral (HSE) para detectar omisión de EPP (casco, lentes, guantes, overol y chaleco de alta visibilidad)",
      "Modelos de detección de riesgo de atropello que calculan distancias entre personas y vehículos junto con velocidades aproximadas",
      "Algoritmos para analítica de almacén: medición de tiempos de permanencia, detección de demoras en atención y aforo en colas",
      "IA generativa para el resumen automatizado de eventos críticos (descripción de sujetos, vestimenta y comportamiento) y recorte automático de clips de evidencia",
      "Dashboard de analítica histórica con matriz de riesgo temporal, salud de cámaras, geolocalización y editor de prompts para personalización de reglas de IA",
    ],
    resultados: [
      "Detección y notificación casi instantánea de anomalías operativas y faltas de seguridad",
      "Reducción de riesgos de accidentes mediante cálculo continuo de proximidad y uso de distractores (celular al conducir)",
      "Generación automatizada de fragmentos de video y análisis forense como evidencia accionable",
      "Supervisión patrimonial perimetral con reglas programables según calendarios y horarios no laborales",
      "Centralización multisede con geolocalización y monitoreo del estado operativo de las cámaras",
      "Optimización de flujos de atención y tiempos de servicio en almacenes",
    ],
    stack: [
      "Python",
      "OpenCV",
      "PyTorch / YOLO",
      "FastAPI",
      "React",
      "TypeScript",
      "Vite",
      "WebSockets",
      "LLM / Vision AI Frameworks",
      "Docker",
      "Cloud Run",
    ],
    equipo: [
      { nombre: "Jesús Huerta", rol: "Ingeniero IA" },
      { nombre: "Manuel Aliaga", rol: "Líder Técnico" },
      { nombre: "Sergio Aguas", rol: "Arquitecto" },
    ],
    videoPlaceholder: false,
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
    } else if (coleccion.ruta === "laboratorio") {
      resultado = items
        .filter((item) => item.coleccion === "laboratorio")
        .map((item) => ({ ...item, ...(detallesLabs[item.slug] ?? {}) }));
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
