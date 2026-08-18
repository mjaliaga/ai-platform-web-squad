const AV = "Almaviva Group";

const IND_EXTENDEDAS = [
  "Utilities (Electricity, Water, Gas & Sanitation)",
  "Public Administration, Government & Social Security",
  "Financial Services, Healthcare",
  "Mining, Steel, Logistics & Industrial Infrastructure",
  "Consumer Goods, Food, Beverages & Retail",
];

export const productosAlmaviva = [
  {
    slug: "it-01-ia-para-comparacion-y-analisis-de-politicas",
    codigo: "IT-01",
    nombreComercial: "IA para Comparación y Análisis de Políticas",
    categoria: "Documental y Conocimiento",
    tipo: "Administrative Processes",
    estado: "Video Demo",
    industrias: IND_EXTENDEDAS,
    clientes: null,
    autores: [{ nombre: AV, rol: "Autor" }],
    descripcion:
      "Interfaz de análisis de documentos y datos orientada a la investigación generativa, evaluación de riesgos y toma de decisiones. Visualmente se muestran pantallas comparativas de documentos de texto.",
    descripcionLarga: `Solución basada en funcionalidades de Investigación Conversacional y Generación Aumentada por Recuperación (RAG), orientada a potenciar el valor y aprovechamiento de la información contenida en documentos de interés para una organización, desde fuentes regulatorias hasta políticas internas.

Permite a los usuarios consultar documentos y normativa utilizando lenguaje natural, combinando búsqueda semántica, comprensión de contenido y generación de respuestas contextualizadas.

A través de consultas que no requieren conocer la estructura completa del repositorio ni utilizar palabras clave específicas, los usuarios pueden acceder rápidamente a la información, realizar comparaciones y controles, ejecutar verificaciones de cumplimiento y consistencia, identificar similitudes o anomalías, y obtener resúmenes e informes..

Automatización de los procesos de comparación de políticas y normativas: revisiones más rápidas, reducción de riesgos de cumplimiento y mayor consistencia en la interpretación.
Respuestas contextualizadas, con referencias precisas a los documentos fuente.
Identificación de cambios a lo largo del tiempo, así como de similitudes y variaciones entre documentos.
Identificación de posibles impactos sobre casos específicos.
Consultas conversacionales en lenguaje natural, facilitando el acceso y análisis de la información.
Generación automática de resúmenes y explicaciones de documentos y actos complejos, como resoluciones, reglamentos y normativas.`,
    videoPromocional: { tipo: "drive", url: "https://drive.google.com/file/d/1E86Ungvkxlc7BmUDy-3hfpQGtgik_Q3N/preview" },
    clientesReferencia: `Parte de un concepto diseñado para una entidad del Gobierno Central (AGEA – Agencia Nacional Italiana para la Agricultura) y sus áreas de Legal y Compliance.
Parte de una solución diseñada para Administraciones Regionales, orientada a la búsqueda y consulta de procedimientos y normativa aplicable.`,
    gtm: `Solución dirigida a entidades gubernamentales y empresas medianas y grandes que cuenten con áreas legales y/o de cumplimiento (Compliance) estructuradas.
Orientada a mejorar la eficiencia y productividad de las áreas legales y de aquellas áreas responsables de analizar y gestionar solicitudes de beneficios e incentivos, reclamos, controversias y disputas, entre otros procesos.`,
    prerrequisitos: `Procesos: Gestión de Casos (Case Management), incluyendo la gestión de solicitudes y requerimientos, y Evaluación de Impacto Regulatorio, desde las áreas Legal y Compliance.
Datos: marcos regulatorios, políticas y estándares, normativas internas de la organización, taxonomías y clasificaciones, referencias normativas y repositorios de casos gestionados.`,
    procesos: [
      "Automatización de los procesos de comparación de políticas y normativas",
      "Identificación de cambios en políticas y normativas",
      "Identificación de posibles impactos en casos específicos",
    ],
    resultados: [
      "Mayor rapidez en la revisión de políticas y normativas",
      "Reducción de riesgos de cumplimiento",
      "Mayor consistencia en la interpretación",
    ],
    flexibilidadIA: `Compatible tanto con Velvet (modelo especializado/verticalizado) como con LLMs de Hyperscalers.
Pueden existir restricciones cuando las políticas, contratos u otros documentos sensibles no puedan ser compartidos o procesados en una infraestructura de nube pública.`,
    soberania:
      "Posibles restricciones en caso de que las políticas y/o contratos no puedan ser compartidos o procesados en una infraestructura de nube pública.",
    herramientas: `Video demo disponible (demostración conceptual).
Solución demostrable con AGEA, actualmente en desarrollo.
Posibilidad de contar con un video sin audio, con presentación en español o portugués.`,
    insumos: [
      "Descripción y análisis del proceso a automatizar",
      "Ejemplos de datos",
      "Posibles restricciones relacionadas con IA y el dominio de los datos",
    ],
    alcance: `El alcance dependerá del número y la complejidad de los procesos que deberá gestionar la PoC.
Los criterios de éxito deberán ser definidos y acordados con el cliente.`,
    framework: `Actualmente se encuentra en fase conceptual; se contará con información más detallada en una etapa posterior.
Primera arquitectura en evaluación: modelo híbrido, con front-end y middleware en las instalaciones del cliente (on-premise) y LLM consumido como servicio (LLM as a Service).`,
    cronogramaRiesgos: `El plazo depende en gran medida de la complejidad del cliente. Para una entidad gubernamental de alta complejidad, la implementación suele tomar entre 6 y 8 meses, debido a la necesidad de alinear las distintas áreas internas, incluyendo los equipos de TI y técnicos.
Para una empresa privada pequeña o mediana, el plazo puede reducirse a aproximadamente 2 a 3 meses.`,
    servicios: `Altamente dependiente de la tecnología objetivo y de la arquitectura asociada.
Se requiere un co-diseño de la estrategia Go-to-Market (Almaviva Group + TIVIT), considerando los clientes en pipeline, su tamaño y la tecnología que mejor se adapte a sus necesidades.`,
    licenciamiento: `Implementación: costo por única vez, asociado al esfuerzo del equipo + infraestructura de desarrollo.
Mantenimiento: costo recurrente, con diferentes niveles de servicio:
Soporte y corrección de errores (bug fixing).
Corrección de errores + monitoreo y optimización.
Corrección de errores + monitoreo y optimización + actividades evolutivas, bajo un esquema de paquetes.`,
    contenidoExtra: `Para brindar un soporte integral a las áreas Legal y Compliance, la solución conversacional de IA Generativa para Comparación y Análisis de Políticas y Normativas puede complementarse con algoritmos de clustering y clasificación de casos, proporcionando capacidades adicionales para el análisis y evaluación de expedientes.

La solución incorpora herramientas para la gestión avanzada de grandes volúmenes de documentos —solicitudes, reclamos, disputas y comunicaciones— basadas en técnicas de clustering y clasificación automática, que permiten agrupar documentos según su similitud y facilitar su análisis comparativo.

Mediante algoritmos de similitud semántica y el análisis de los resultados de casos previamente gestionados, el sistema también brinda soporte para identificar la normativa aplicable y localizar precedentes similares, favoreciendo evaluaciones más rápidas, consistentes y fundamentadas.

Principales capacidades

Recopilación y clasificación de casos: centralización de la información, agrupación por similitud y clasificación según tipología, riesgo y prioridad.
Análisis de casos similares y normativa: comparación con precedentes, análisis de sus resultados e identificación de referencias regulatorias aplicables.
Soporte legal y eficiencia: análisis de tendencias en la toma de decisiones y reducción de los tiempos destinados a la investigación y preparación documental.
Gobierno y monitoreo: trazabilidad, reporting, personalización e integración con los sistemas de la organización.

REFERENCIAS

Solución desarrollada para el Banco de Italia (Banca d’Italia), con el objetivo de:

Clasificar fragmentos o secciones de normativa (“chunks”) de acuerdo con la misión y taxonomía de la institución.
Brindar soporte en la identificación de las normas aplicables a cada caso.
Recuperar casos precedentes similares y sus respectivos resultados.`,
  },
  {
    slug: "it-02-ia-para-licitaciones",
    codigo: "IT-02",
    nombreComercial: "IA para Licitaciones",
    categoria: "Documental y Conocimiento",
    tipo: "Administrative Processes",
    estado: "Video Demo",
    industrias: ["Public Administration, Government & Social Security"],
    clientes: null,
    autores: [{ nombre: AV, rol: "Autor" }],
    descripcion:
      "Herramienta de asistencia para la revisión y creación de documentos relacionados con concursos públicos y normativas. Se observa una interfaz tipo editor de texto asistido.",
    descripcionLarga: `Herramientas de recopilación de datos, comprensión de texto e Inteligencia Artificial Generativa orientadas a automatizar el análisis y/o definición de criterios técnicos para procesos de licitación, apoyar la búsqueda de referencias normativas, revisar el cumplimiento de requisitos y ofertas, así como facilitar la elaboración de documentos.

En particular, a partir de una base de conocimiento (Knowledge Base) de licitaciones previamente publicadas, la solución brinda soporte para la generación de nuevas licitaciones. La IA ayuda a seleccionar la plantilla de referencia más adecuada y, a partir de requerimientos expresados en lenguaje natural, permite generar dinámicamente documentos como especificaciones técnicas, que posteriormente pueden ser revisados y validados por un experto antes de su publicación final.

La solución incorpora funcionalidades de Retrieval-Augmented Generation (RAG) aplicadas a procesos altamente especializados y que tradicionalmente requieren una importante dedicación de tiempo.

La IA Generativa se aplica sobre plantillas y procesos controlables y validables, permitiendo automatizar múltiples controles de consistencia y coherencia, mejorar el cumplimiento normativo (compliance) y reducir el esfuerzo requerido para la preparación de las licitaciones.

Como resultado, se logra una simplificación y aceleración de los procesos, manteniendo además referencias verificables y trazables a las fuentes de origen.`,
    videoPromocional: { tipo: "drive", url: "https://drive.google.com/file/d/1Pjopy021-Xw6049zt6S4GWi2GR43Ze1m/preview" },
    clientesReferencia: `Desarrollada para la entidad de compras de la Región de Emilia-Romaña (IntercentER).
Los principales desafíos están relacionados con la gestión de la Base de Conocimiento (Knowledge Base – KB), compuesta por licitaciones anteriores similares, así como con la identificación y aplicación de la normativa correspondiente para garantizar una correcta elaboración de los procesos de licitación.
Otro factor relevante de complejidad es la cantidad de códigos CPV (Common Procurement Vocabulary) que deben ser mapeados y gestionados por la solución.`,
    gtm: `Solución orientada a mejorar la productividad y eficiencia de las áreas de Licitaciones.
Dirigida a entidades gubernamentales y empresas medianas y grandes que cuenten con un área de Licitaciones estructurada.`,
    prerrequisitos: `Procesos: gestión de licitaciones, especialmente en la fase de preparación y elaboración.
Datos: licitaciones históricas, normativa de contratación y adquisiciones, taxonomía CPV, plantillas y repositorios de conocimiento.`,
    procesos: [
      "Automatización de los procesos asociados a la elaboración de licitaciones.",
      "Automatización de controles de consistencia y coherencia de la documentación.",
    ],
    resultados: [
      "Mayor rapidez en la elaboración de licitaciones",
      "Mejora del cumplimiento normativo",
      "Reducción del esfuerzo requerido para su preparación",
    ],
    flexibilidadIA: `Compatible tanto con Velvet (modelo especializado/verticalizado) como con LLMs de Hyperscalers.
Posibles restricciones en caso de que las políticas, contratos u otros documentos sensibles no puedan ser compartidos o procesados en una infraestructura de nube pública.`,
    soberania: null,
    herramientas: `Disponibilidad de un entorno de Demo y un Video Demo.
Se recomienda comenzar con el Video Demo, para validar rápidamente si la solución se ajusta a las necesidades del cliente y, posteriormente, evaluar la realización de una demostración en vivo (Live Demo).`,
    insumos: [
      "Descripción y análisis del proceso a automatizar",
      "Ejemplos de datos",
      "Posibles restricciones relacionadas con IA y el dominio de los datos",
    ],
    alcance: `El alcance dependerá del número y la complejidad de los procesos que deberá gestionar la PoC.
Los criterios de éxito deberán ser definidos y acordados con el cliente.`,
    framework:
      "Arquitectura híbrida: front-end y lógica de negocio desplegados en las instalaciones del cliente (on-premise), con LLM y servicios cognitivos provistos a través de la plataforma AIWave PaaS",
    cronogramaRiesgos: `El plazo depende en gran medida de la complejidad del cliente. Para una entidad gubernamental de alta complejidad, la implementación suele tomar entre 6 y 8 meses, debido a la necesidad de alinear las distintas áreas internas, incluyendo los equipos de TI y técnicos.
Para una empresa privada pequeña o mediana, el plazo puede reducirse a aproximadamente 2 a 3 meses.`,
    servicios: `Altamente dependiente de la tecnología objetivo y de la arquitectura asociada.
Se requiere un co-diseño de la estrategia Go-to-Market (Almaviva Group + TIVIT), considerando los clientes en pipeline, su tamaño y el tipo de tecnología que mejor se adapte a sus necesidades.`,
    licenciamiento: `Implementación: costo por única vez, asociado al esfuerzo del equipo + infraestructura de desarrollo.
Mantenimiento: costo recurrente, con distintos niveles de servicio:
Soporte y corrección de errores (bug fixing).
Corrección de errores + monitoreo y optimización.
Corrección de errores + monitoreo y optimización + actividades evolutivas, bajo un esquema de paquetes.`,
    contenidoExtra: null,
  },
  {
    slug: "it-03-ia-para-simplificacion-de-textos",
    codigo: "IT-03",
    nombreComercial: "IA para Simplificación de Textos",
    categoria: "Documental y Conocimiento",
    tipo: "Administrative Processes",
    estado: "Video Demo",
    industrias: null,
    clientes: null,
    autores: [{ nombre: AV, rol: "Autor" }],
    descripcion: "Plataforma con paneles laterales de apoyo para reformular documentos.",
    descripcionLarga:
      "Soporte para cumplimiento normativo, reformulación o parafraseo de lenguaje y navegación asistida en portales.",
    videoPromocional: { tipo: "drive", url: "https://drive.google.com/file/d/16jtFYckxF_X2fy3sOVC75H9eOrgVvM9p/preview" },
    clientesReferencia: null,
    gtm: null,
    prerrequisitos: null,
    procesos: null,
    resultados: null,
    flexibilidadIA: null,
    soberania: null,
    herramientas: null,
    insumos: null,
    alcance: null,
    framework: null,
    cronogramaRiesgos: null,
    servicios: null,
    licenciamiento: null,
    contenidoExtra: null,
  },
  {
    slug: "it-04-ia-para-seudonimizacion-de-datos-personales",
    codigo: "IT-04",
    nombreComercial: "IA para Seudonimización de Datos Personales",
    categoria: "Documental y Conocimiento",
    tipo: "Administrative Processes",
    estado: "Video Demo",
    industrias: IND_EXTENDEDAS,
    clientes: null,
    autores: [{ nombre: AV, rol: "Autor" }],
    descripcion: "Interfaz enfocada en la privacidad y el manejo seguro de datos sensibles en documentos.",
    descripcionLarga: `Solución basada en Inteligencia Artificial para la identificación, extracción, anonimización y seudonimización de información personal contenida en documentos, permitiendo su utilización en pleno cumplimiento de las normativas de privacidad y protección de datos.

Mediante algoritmos especializados de reconocimiento de entidades, la solución identifica datos sensibles dentro de documentos de texto y posteriormente los anonimiza o seudonimiza de acuerdo con las necesidades específicas. Estas capacidades pueden ser gestionadas a través de aplicaciones web dedicadas, que permiten incorporar una revisión manual cuando sea necesario.

Principales capacidades y beneficios:

Detección de Información Personal Identificable (PII – Personally Identifiable Information).
Enmascaramiento y/o seudonimización automática de datos sensibles.
Posibilidad de combinar la reutilización de datos —incluyendo su uso con IA— y la transparencia, manteniendo la adecuada protección de los datos personales.
Identificación de entidades nominales considerando también el contexto, por ejemplo, las partes involucradas en un determinado caso o expediente.
Posibilidad de realizar despliegues on-premise, reforzando la seguridad y protección de la información.
Capacidad para procesar grandes volúmenes de datos de manera eficiente y confiable, reduciendo los tiempos de revisión y facilitando una gestión estructurada del cumplimiento normativo.`,
    videoPromocional: { tipo: "drive", url: "https://drive.google.com/file/d/1Mmodu6go3wTIXPGD2_R3coij2dKTae2p/preview" },
    clientesReferencia: `Desarrollada para el Ministerio de Justicia de Italia (DG SIA).
Desarrollada para la Corte Suprema de Justicia de Italia (Corte di Cassazione).
Ofrecida al INPS (Instituto Nacional de Seguridad Social de Italia), para la publicación de sentencias de interés.
Propuesta a clientes del sector salud.`,
    gtm:
      "Solución dirigida a entidades del Gobierno Central (por ejemplo, del sector Justicia), al sector Salud y a organizaciones que requieran garantizar el cumplimiento de las normativas de privacidad y protección de datos personales.",
    prerrequisitos: `Procesos: gestión de datos y cumplimiento de requisitos de privacidad y protección de información personal.
Datos: conjuntos de datos estructurados y no estructurados que contienen Información Personal Identificable (PII), así como políticas de privacidad y reglas de retención de datos.`,
    procesos: [
      "Detección de Información Personal Identificable (PII).",
      "Enmascaramiento y/o seudonimización automática de datos sensibles.",
    ],
    resultados: [
      "Implementación simplificada de las normativas de protección de datos.",
      "Reducción del riesgo de filtraciones de información.",
      "Posibilidad de reutilizar los datos de forma segura y conforme a las normativas de privacidad, para Analytics y entrenamiento de modelos de IA.",
    ],
    flexibilidadIA: `Para documentos sujetos a normativas de privacidad y protección de datos personales, el uso de LLMs provistos por Hyperscalers puede presentar restricciones para garantizar el cumplimiento normativo.

Por ello, generalmente se prioriza un modelo de despliegue privado (Private Deployment) del LLM.

Velvet, como modelo especializado/verticalizado, representa una alternativa adecuada; asimismo, pueden evaluarse otros LLMs de pesos abiertos (Open-Weight LLMs) en función de los requerimientos específicos.`,
    soberania:
      "Esta propuesta es especialmente adecuada para escenarios que requieren Soberanía de IA y Datos (AI/Data Sovereignty), considerando los estrictos requerimientos regulatorios asociados a la privacidad y protección de datos.",
    herramientas: "Disponibilidad de Demo y Video Demo.\nEl Video Demo puede adaptarse al idioma local.",
    insumos: [
      "Descripción y análisis del proceso a automatizar.",
      "Ejemplos de datos.",
      "Posibles restricciones relacionadas con IA y el dominio de los datos.",
    ],
    alcance: `El alcance dependerá del número y la complejidad de los procesos que deberá gestionar la PoC.
Los criterios de éxito deberán ser definidos y acordados con el cliente.`,
    framework: `Arquitectura on-premise con LLM privado, orientada a garantizar un mayor control y protección de la información.
Actualmente se está trabajando en un despliegue centralizado del LLM, con el objetivo de mejorar la eficiencia y optimizar costos.`,
    cronogramaRiesgos: `El plazo depende en gran medida de la complejidad del cliente:

Para una entidad gubernamental de alta complejidad, la implementación suele tomar entre 6 y 8 meses, debido a la necesidad de alinear las distintas áreas internas, incluyendo los equipos de TI y técnicos.
Para una empresa privada pequeña o mediana, el plazo puede reducirse a aproximadamente 2 a 3 meses.
Un piloto sobre un conjunto de datos previamente definido puede implementarse en aproximadamente 4 a 6 semanas.`,
    servicios: `Altamente dependiente de la tecnología objetivo y de la arquitectura asociada.
Se requiere un co-diseño de la estrategia Go-to-Market (Almaviva Group + TIVIT), considerando los clientes en pipeline, su tamaño y el tipo de tecnología que mejor se adapte a sus necesidades.`,
    licenciamiento: `Implementación: costo por única vez, asociado al esfuerzo del equipo + infraestructura de desarrollo.
Mantenimiento: costo recurrente, con diferentes niveles de servicio:
Soporte y corrección de errores (bug fixing).
Corrección de errores + monitoreo y optimización.
Corrección de errores + monitoreo y optimización + actividades evolutivas, bajo un esquema de paquetes.`,
    contenidoExtra: null,
  },
  {
    slug: "it-05-asistente-de-ia-para-soporte-en-quirofano",
    codigo: "IT-05",
    nombreComercial: "Asistente de IA para Soporte en Quirófano",
    categoria: "Salud y Clínica",
    tipo: "Healthcare",
    estado: "Video Demo",
    industrias: null,
    clientes: null,
    autores: [{ nombre: AV, rol: "Autor" }],
    descripcion:
      'Interfaz en pantalla con un avatar virtual femenino y paneles de texto, diseñada para el soporte sin reemplazo del personal médico (Human in the Loop).',
    descripcionLarga:
      'Transcripción estructurada en vivo ("speech-to-text") con identificación de hablante, recuperación de datos del paciente mediante comandos de voz y redacción automática de informes quirúrgicos sujetos a validación humana.',
    videoPromocional: { tipo: "drive", url: "https://drive.google.com/file/d/1knuOxdWPMhpU3PyKYPf-AqITl2FC57l8/preview" },
    clientesReferencia: null,
    gtm: null,
    prerrequisitos: null,
    procesos: null,
    resultados: null,
    flexibilidadIA: null,
    soberania: null,
    herramientas: null,
    insumos: null,
    alcance: null,
    framework: null,
    cronogramaRiesgos: null,
    servicios: null,
    licenciamiento: null,
    contenidoExtra: null,
  },
  {
    slug: "it-06-asistente-de-transcripcion-con-ia",
    codigo: "IT-06",
    nombreComercial: "Asistente de Transcripción con IA para Informes de Visitas Médicas más Inteligentes",
    categoria: "Salud y Clínica",
    tipo: "Healthcare",
    estado: "Video Demo",
    industrias: ["Healthcare"],
    clientes: null,
    autores: [{ nombre: AV, rol: "Autor" }],
    descripcion:
      'Herramienta conversacional pasiva que utiliza tecnología de "voz ambiental" para escuchar la interacción natural entre el médico y el paciente durante una consulta, eliminando la necesidad de que el médico teclee mientras atiende.',
    descripcionLarga: `Herramientas de transcripción de lenguaje hablado y comprensión de lenguaje natural (NLU) que permiten registrar y transcribir automáticamente los reportes de visitas, clasificar la información y transformar el texto transcrito en informes estructurados, de acuerdo con el formato requerido.

Principales capacidades:

Extracción de datos a partir de informes clínicos, notas y registros.
Capacidad para reconocer acrónimos, terminología especializada y unidades de medida.
Posibilidad de realizar consultas avanzadas sobre los datos y la información recopilada.
Transformación de datos no estructurados en conocimiento estructurado y utilizable.`,
    videoPromocional: { tipo: "drive", url: "https://drive.google.com/file/d/1OYh85AFaHvzf8_nMh8q5WLUpAIuk5TKO/preview" },
    clientesReferencia: `Desarrollada para un hospital italiano (S. Giuseppe Moscati, Avellino, Campania).
El principal desafío está relacionado con el cumplimiento de las normativas de privacidad y protección de datos. Por ello, es fundamental diseñar la arquitectura y seleccionar el LLM adecuado, de acuerdo con las políticas y requerimientos específicos del cliente.`,
    gtm: `Solución desarrollada para el sector Salud (Healthcare).
Orientada a incrementar la productividad y reducir el esfuerzo manual requerido para la preparación de documentación.`,
    prerrequisitos: `Procesos: gestión de datos, incluyendo elaboración de informes clínicos, flujos de validación y cumplimiento de requisitos de privacidad y protección de datos.
Datos: grabaciones de audio o conversaciones en tiempo real, plantillas clínicas / historias clínicas electrónicas (EHR) y terminología médica especializada.`,
    procesos: `Captura y transcripción de la interacción médico-paciente, estructurando automáticamente la información de acuerdo con formatos clínicos predefinidos, para su posterior validación por parte del profesional de salud.`,
    resultados: [
      "Reducción de la carga administrativa y documental del médico, permitiéndole dedicar más tiempo a la atención e interacción con el paciente.",
      "No se limita a una simple transcripción: la solución genera documentos clínicos estructurados a partir del diálogo médico-paciente.",
    ],
    flexibilidadIA: `Estos documentos están sujetos a normativas de privacidad y protección de datos personales. En este contexto, el uso de un LLM provisto por un Hyperscaler puede presentar restricciones para garantizar el cumplimiento normativo.

Por ello, generalmente se prioriza un modelo de despliegue privado (Private Deployment) del LLM.

Velvet, como modelo especializado/verticalizado, representa una alternativa adecuada; asimismo, pueden evaluarse otros LLMs de pesos abiertos (Open-Weight LLMs) según los requerimientos específicos del cliente.`,
    soberania:
      "Esta propuesta es especialmente adecuada para escenarios que requieren Soberanía de IA y Datos (AI/Data Sovereignty), considerando los estrictos requerimientos regulatorios asociados a la privacidad y protección de datos.",
    herramientas: "Disponibilidad de Demo y Video Demo.\nEl Video Demo puede adaptarse al idioma local.",
    insumos: [
      "Descripción y análisis del proceso a automatizar.",
      "Ejemplos de datos.",
      "Posibles restricciones relacionadas con IA y el dominio de los datos.",
    ],
    alcance: `El alcance dependerá del número y la complejidad de los procesos que deberá gestionar la PoC.
Los criterios de éxito deberán ser definidos y acordados con el cliente.`,
    framework: `Arquitectura on-premise con LLM privado, orientada a garantizar un mayor control y protección de la información.
Actualmente se está trabajando en un despliegue centralizado del LLM, con el objetivo de mejorar la eficiencia y optimizar costos.`,
    cronogramaRiesgos: `El plazo depende en gran medida de la complejidad del cliente:

Para una entidad gubernamental de alta complejidad, la implementación suele tomar entre 6 y 8 meses, debido a la necesidad de alinear las distintas áreas internas, incluyendo los equipos de TI y técnicos.
Para una empresa privada pequeña o mediana, el plazo puede reducirse a aproximadamente 2 a 3 meses.
Un piloto sobre un conjunto de datos previamente definido puede implementarse en aproximadamente 4 a 6 semanas.`,
    servicios: `Altamente dependiente de la tecnología objetivo y de la arquitectura asociada.
Se requiere un co-diseño de la estrategia Go-to-Market (Almaviva Group + TIVIT), considerando los clientes en pipeline, su tamaño y el tipo de tecnología que mejor se adapte a sus necesidades.`,
    licenciamiento: `Implementación: costo por única vez, asociado al esfuerzo del equipo + infraestructura de desarrollo.
Mantenimiento: costo recurrente, con diferentes niveles de servicio:
Soporte y corrección de errores (bug fixing).
Corrección de errores + monitoreo y optimización.
Corrección de errores + monitoreo y optimización + actividades evolutivas, bajo un esquema de paquetes.`,
    contenidoExtra: null,
  },
  {
    slug: "it-07-generacion-automatica-de-borradores-de-documentos-medicos",
    codigo: "IT-07",
    nombreComercial: "Generación Automática de Borradores de Documentos Médicos",
    categoria: "Salud y Clínica",
    tipo: "Healthcare",
    estado: "Video Demo",
    industrias: ["Healthcare"],
    clientes: null,
    autores: [{ nombre: AV, rol: "Autor" }],
    descripcion:
      "Un motor de automatización documental que extrae la información ya consolidada en el expediente electrónico del paciente para redactar de forma autónoma los documentos administrativos y clínicos necesarios al final de un proceso de atención.",
    descripcionLarga: `Solución para la generación automática de documentos precompletados, como la Carta de Alta Hospitalaria, a partir de la información obtenida de la Historia Clínica Electrónica (EHR).

El médico responsable del alta recibe una propuesta de documento generada automáticamente, sobre la cual puede realizar modificaciones y/o completar secciones específicas previamente definidas, como la fecha y diagnóstico de alta, indicaciones de seguimiento, plan de tratamiento posterior al alta y recomendaciones o advertencias.

Una vez revisado y validado por el médico, el documento puede ser firmado electrónicamente. Posteriormente, se genera el PDF correspondiente y se almacena en el repositorio definido por la organización.

La solución está diseñada para asistir al médico, no para reemplazarlo: el LLM propone; el profesional médico revisa, valida y mantiene el control final.

Principales beneficios:

Reducción del tiempo de elaboración de documentos y de la carga administrativa para los profesionales de salud.
Mayor consistencia en la estructura y completitud de la información.
Reducción del riesgo de omisiones de información clínicamente relevante.
Posibilidad de personalización y actualización continua de la solución.`,
    videoPromocional: { tipo: "drive", url: "https://drive.google.com/file/d/1X0WfpZpMuCO2T0W6HtyEPqiJtfD39uvF/preview" },
    clientesReferencia: `Desarrollada para un hospital italiano (S. Pio, Benevento, Campania).
El principal desafío está relacionado con el cumplimiento de las normativas de privacidad y protección de datos. Por ello, es fundamental diseñar la arquitectura y seleccionar el LLM adecuado, de acuerdo con las políticas y requerimientos específicos del cliente.`,
    gtm: `Solución desarrollada para el sector Salud (Healthcare).
Orientada a incrementar la productividad y reducir el esfuerzo manual requerido para la preparación de documentación.`,
    prerrequisitos: `Procesos: gestión de datos, incluyendo elaboración de informes clínicos, flujos de validación y cumplimiento de requisitos de privacidad y protección de datos.
Datos: grabaciones de audio o conversaciones en tiempo real, plantillas clínicas / Historia Clínica Electrónica (EHR) y terminología médica especializada.`,
    procesos: `Generación de derivaciones, cartas de alta e informes clínicos similares, mediante la recopilación de datos desde diversas fuentes (por ejemplo, la Historia Clínica Electrónica – EHR), agregando y estructurando la información del paciente para la elaboración automática de documentos.`,
    resultados: [
      "Mayor rapidez en la generación de documentos y reducción de la carga documental y administrativa del médico.",
      "Estandarización de los documentos generados: mayor consistencia y completitud de la información, reduciendo el riesgo de omisiones clínicamente relevantes.",
      "Validación médica garantizada, manteniendo al profesional de salud como responsable de la revisión y aprobación final.",
    ],
    flexibilidadIA: `Estos documentos están sujetos a normativas de privacidad y protección de datos personales. En este contexto, el uso de un LLM provisto por un Hyperscaler puede presentar restricciones para garantizar el cumplimiento normativo.

Por ello, generalmente se prioriza un modelo de despliegue privado (Private Deployment) del LLM.

Velvet, como modelo especializado/verticalizado, representa una alternativa adecuada; asimismo, pueden evaluarse otros LLMs de pesos abiertos (Open-Weight LLMs) según los requerimientos específicos del cliente.`,
    soberania:
      "Esta propuesta es especialmente adecuada para escenarios que requieren Soberanía de IA y Datos (AI/Data Sovereignty), considerando los estrictos requerimientos regulatorios asociados a la privacidad y protección de datos.",
    herramientas: "Disponibilidad de Demo y Video Demo.\nEl Video Demo puede adaptarse al idioma local.",
    insumos: [
      "Descripción y análisis del proceso a automatizar.",
      "Ejemplos de datos.",
      "Posibles restricciones relacionadas con IA y el dominio de los datos.",
    ],
    alcance: `El alcance dependerá del número y la complejidad de los procesos que deberá gestionar la PoC.
Los criterios de éxito deberán ser definidos y acordados con el cliente.`,
    framework: `Arquitectura on-premise con LLM privado, orientada a garantizar un mayor control y protección de la información.
Actualmente se está trabajando en un despliegue centralizado del LLM, con el objetivo de mejorar la eficiencia y optimizar costos.`,
    cronogramaRiesgos: `El plazo depende en gran medida de la complejidad del cliente:

Para una entidad gubernamental de alta complejidad, la implementación suele tomar entre 6 y 8 meses, debido a la necesidad de alinear las distintas áreas internas, incluyendo los equipos de TI y técnicos.
Para una empresa privada pequeña o mediana, el plazo puede reducirse a aproximadamente 2 a 3 meses.
Un piloto sobre un conjunto de datos previamente definido puede implementarse en aproximadamente 4 a 6 semanas.`,
    servicios: `Altamente dependiente de la tecnología objetivo y de la arquitectura asociada.
Se requiere un co-diseño de la estrategia Go-to-Market (Almaviva Group + TIVIT), considerando los clientes en pipeline, su tamaño y el tipo de tecnología que mejor se adapte a sus necesidades.`,
    licenciamiento: `Implementación: costo por única vez, asociado al esfuerzo del equipo + infraestructura de desarrollo.
Mantenimiento: costo recurrente, con diferentes niveles de servicio:
Soporte y corrección de errores (bug fixing).
Corrección de errores + monitoreo y optimización.
Corrección de errores + monitoreo y optimización + actividades evolutivas, bajo un esquema de paquetes.`,
    contenidoExtra: null,
  },
  {
    slug: "it-08-visor-clinico",
    codigo: "IT-08",
    nombreComercial: "Sistema de Soporte para la Toma de Decisiones Clínicas: Visor Clínico",
    categoria: "Salud y Clínica",
    tipo: "Healthcare",
    estado: "Video Demo",
    industrias: null,
    clientes: null,
    autores: [{ nombre: AV, rol: "Autor" }],
    descripcion:
      "Un panel de control avanzado (dashboard) que consolida y organiza de manera visual toda la información compleja del paciente, integrando IA generativa para procesar y mostrar literatura médica actualizada pertinente al caso.",
    descripcionLarga:
      "Visualización de historiales médicos mediante gráficos de red interconectados, sugerencias y tips procesados por IA sobre posibles diagnósticos, y herramientas visuales para la planificación de dosis, terapias y rutas de tratamiento.",
    videoPromocional: { tipo: "drive", url: "https://drive.google.com/file/d/1U8lr002_gKvmjsLl47OghO3kqdHIEOgd/preview" },
    clientesReferencia: null,
    gtm: null,
    prerrequisitos: null,
    procesos: null,
    resultados: null,
    flexibilidadIA: null,
    soberania: null,
    herramientas: null,
    insumos: null,
    alcance: null,
    framework: null,
    cronogramaRiesgos: null,
    servicios: null,
    licenciamiento: null,
    contenidoExtra: null,
  },
  {
    slug: "it-09-algoritmos-predictivos",
    codigo: "IT-09",
    nombreComercial: "Sistema de Soporte para la Toma de Decisiones Clínicas: Algoritmos Predictivos",
    categoria: "Salud y Clínica",
    tipo: "Healthcare",
    estado: "Video Demo",
    industrias: null,
    clientes: null,
    autores: [{ nombre: AV, rol: "Autor" }],
    descripcion:
      "Modelos analíticos y matemáticos de IA que evalúan el historial y los datos en tiempo real del paciente para anticipar escenarios clínicos adversos antes de que ocurran.",
    descripcionLarga:
      "Generación de indicadores de pronóstico para prever riesgos relacionados con enfermedades (como el riesgo de sepsis o complicaciones postoperatorias) y apoyo algorítmico preventivo para la toma de decisiones del personal de salud.",
    videoPromocional: { tipo: "drive", url: "https://drive.google.com/file/d/1gXS3zOrDSYRTxIxx71GEfYsnmbCt4sh4/preview" },
    clientesReferencia: null,
    gtm: null,
    prerrequisitos: null,
    procesos: null,
    resultados: null,
    flexibilidadIA: null,
    soberania: null,
    herramientas: null,
    insumos: null,
    alcance: null,
    framework: null,
    cronogramaRiesgos: null,
    servicios: null,
    licenciamiento: null,
    contenidoExtra: null,
  },
  {
    slug: "it-10-asistentes-virtuales-de-bienestar",
    codigo: "IT-10",
    nombreComercial: "Asistentes Virtuales de Bienestar / Asistencia Social",
    categoria: "Conversacional y Atención al Cliente",
    tipo: "Customer Care",
    estado: "Video Demo",
    industrias: null,
    clientes: null,
    autores: [{ nombre: AV, rol: "Autor" }],
    descripcion:
      'Representación de un usuario interactuando de forma autónoma con una plataforma asistida por IA (ilustrada con un pulpo robótico llamado "ROCCO AI"). Se menciona su implementación en un instituto financiero brasileño.',
    descripcionLarga:
      "Soporte en derechos de pensión no reclamados, recompras y contribuciones voluntarias, asistencia a empleadores en declaraciones y herramientas de búsqueda avanzada mediante IA Generativa.",
    videoPromocional: { tipo: "drive", url: "https://drive.google.com/file/d/17VC2IQmNnEt4PBJyf_S2oubI-PKVrJNU/preview" },
    clientesReferencia: null,
    gtm: null,
    prerrequisitos: null,
    procesos: null,
    resultados: null,
    flexibilidadIA: null,
    soberania: null,
    herramientas: null,
    insumos: null,
    alcance: null,
    framework: null,
    cronogramaRiesgos: null,
    servicios: null,
    licenciamiento: null,
    contenidoExtra: null,
  },
  {
    slug: "it-11-asistente-virtual-de-trafico-ferroviario",
    codigo: "IT-11",
    nombreComercial: "Asistente Virtual para la Atención Inteligente en el Tráfico Ferroviario",
    categoria: "Conversacional y Atención al Cliente",
    tipo: "Customer Care",
    estado: "Video Demo",
    industrias: null,
    clientes: null,
    autores: [{ nombre: AV, rol: "Autor" }],
    descripcion:
      "Usuarios interactuando con dispositivos móviles para obtener información de tránsito apoyada por IA conversacional.",
    descripcionLarga:
      "Actualizaciones en tiempo real sobre cambios o retrasos, uso de agentes coordinados de IA con razonamiento avanzado y generación de salidas estructuradas para operaciones y reportes.",
    videoPromocional: { tipo: "drive", url: "https://drive.google.com/file/d/1rf6J4CUhPsU8RQR7ZfHPum3mm-Bd0Gjo/preview" },
    clientesReferencia: null,
    gtm: null,
    prerrequisitos: null,
    procesos: null,
    resultados: null,
    flexibilidadIA: null,
    soberania: null,
    herramientas: null,
    insumos: null,
    alcance: null,
    framework: null,
    cronogramaRiesgos: null,
    servicios: null,
    licenciamiento: null,
    contenidoExtra: null,
  },
  {
    slug: "it-12-asistente-de-ia-para-atencion-al-cliente-avanzada",
    codigo: "IT-12",
    nombreComercial: "Asistente de IA para Atención al Cliente Avanzada",
    categoria: "Conversacional y Atención al Cliente",
    tipo: "Customer Care",
    estado: "Video Demo",
    industrias: ["Consumer Goods, Food, Beverages & Retail"],
    clientes: null,
    autores: [{ nombre: AV, rol: "Autor" }],
    descripcion:
      "Entorno de centro de llamadas donde los operadores reciben soporte en pantalla mientras atienden solicitudes.",
    descripcionLarga: `Agentes virtuales capaces de comprender y responder de manera natural a las necesidades de operadores y supervisores de Contact Centers.

Brindan a los operadores soporte rápido y oportuno en la consulta de procesos y procedimientos, permitiendo optimizar las respuestas a los clientes, incluso en tiempo real. Asimismo, permiten a los supervisores obtener análisis rápidos del desempeño del servicio, facilitando y orientando la toma de decisiones.

Principales beneficios:

Mayor eficiencia, precisión y calidad en la atención al cliente.
Capacidad para gestionar altos volúmenes de actividades, grandes bases documentales y equipos de gran escala.
Mayor uniformidad y consistencia en las respuestas generadas.
Reducción de tiempos y costos de capacitación de los equipos.
Experiencia de usuario fluida e intuitiva, con uso inmediato e interacción mediante lenguaje natural.
Análisis inmediatos y precisos, accesibles incluso sin necesidad de conocimientos de programación (no-code).`,
    videoPromocional: { tipo: "drive", url: "https://drive.google.com/file/d/1mUqQ0fwjmEfk6OxdSf9ATJQvrurjaLgM/preview" },
    clientesReferencia: `La solución ha sido desarrollada para Almaviva Experience, operación de BPO en Brasil.
Los principales desafíos están relacionados con la diversidad de procesos y procedimientos que deben gestionarse según los distintos clientes finales atendidos por el Contact Center.
La Base de Conocimiento (Knowledge Base) ha sido diseñada con especial rigurosidad, considerando que un mismo operador puede gestionar interacciones de múltiples clientes finales, cada uno con sus propios procedimientos y reglas.
Los agentes del Contact Center requieren una capacitación adecuada para interactuar y formular correctamente las consultas (prompts) al Agente de IA. Para facilitar este proceso de adopción, se han desarrollado videos instructivos y materiales de capacitación.`,
    gtm: `Desarrollada para clientes que operan Contact Centers / Centros de Atención al Cliente.
Orientada a incrementar la productividad y eficiencia de los agentes.`,
    prerrequisitos: `Procesos: servicios de Atención al Cliente (Customer Care) gestionados manualmente por los agentes del Contact Center, incluyendo ejemplos de las consultas que deberá responder el Asistente Virtual.
Datos: base de conocimiento, FAQs, procedimientos, información del CRM, historial de interacciones y transcripciones de llamadas y chats.
Definición del dominio y la documentación de referencia en los que se espera encontrar la información necesaria para generar las respuestas.`,
    procesos: [
      "Asistencia al agente durante llamadas y chats, mediante recomendaciones en tiempo real y generación automática de resúmenes.",
      "La adopción de la solución en producción se realizará de manera gradual y por fases, con el objetivo de ajustar y optimizar la calidad de las respuestas, así como gestionar adecuadamente la carga de trabajo global sobre el sistema de IA.",
    ],
    resultados: [
      "Mejora de la resolución en el primer contacto (First Contact Resolution – FCR).",
      "Reducción del tiempo promedio de atención: disminución de aproximadamente 70 segundos en el tiempo de intervención del agente del Contact Center, manteniendo además los niveles de precisión requeridos.",
      "Reducción de la necesidad de capacitación operativa de los agentes.",
    ],
    flexibilidadIA: `Compatible tanto con Velvet (modelo especializado/verticalizado) como con LLMs de Hyperscalers.
Pueden existir restricciones cuando las políticas, contratos u otra información sensible no puedan ser procesados en una infraestructura de nube pública.
Estas restricciones pueden mitigarse cuando el proveedor Hyperscaler garantiza el cumplimiento de los requerimientos de privacidad y protección de datos. En consecuencia, el LLM y su modelo de despliegue deberán seleccionarse de acuerdo con las restricciones de privacidad y seguridad de los datos del cliente.`,
    soberania: `La elección dependerá de los requerimientos de privacidad y protección de datos.
En el caso de BPOs de gran escala, un despliegue privado (Private Deployment) puede resultar comercialmente más conveniente que una solución basada en Cloud con un modelo de pago por uso, especialmente ante altos volúmenes de procesamiento.`,
    herramientas: "Disponibilidad de Demo y Video Demo.\nEl Video Demo puede adaptarse al idioma local.",
    insumos: [
      "Descripción y análisis del proceso a automatizar.",
      "Ejemplos de datos.",
      "Posibles restricciones relacionadas con IA y el dominio de los datos.",
    ],
    alcance: `El alcance dependerá del número y la complejidad de los procesos que deberá gestionar la PoC.
Los criterios de éxito deberán ser definidos y acordados con el cliente.`,
    framework: `La elección dependerá de los requerimientos de privacidad y protección de datos, así como del tamaño del BPO:

Para un BPO de gran escala, un despliegue privado (Private Deployment) puede resultar más costo-eficiente.
Para un BPO pequeño o mediano, un modelo Cloud basado en consumo (pago por uso) suele resultar más costo-eficiente.`,
    cronogramaRiesgos: `El plazo depende en gran medida de la complejidad del cliente y del alcance de los procesos a automatizar mediante RAG/NLQ:

Para un BPO de gran escala, la implementación suele tomar entre 5 y 6 meses.
Para un BPO pequeño o mediano, el plazo puede reducirse a aproximadamente 2 a 3 meses.
Un piloto sobre un conjunto de datos previamente definido puede implementarse en aproximadamente 4 a 6 semanas, siempre que se utilice un idioma ya soportado por la solución, como italiano o portugués.`,
    servicios: `Altamente dependiente de la tecnología objetivo y de la arquitectura asociada.
Se requiere un co-diseño de la estrategia Go-to-Market (Almaviva Group + TIVIT), considerando los clientes en pipeline, su tamaño y el tipo de tecnología que mejor se adapte a sus necesidades.`,
    licenciamiento: `Implementación: costo por única vez, asociado al esfuerzo del equipo + infraestructura de desarrollo.
Mantenimiento: costo recurrente, con diferentes niveles de servicio:
Soporte y corrección de errores (bug fixing).
Corrección de errores + monitoreo y optimización.
Corrección de errores + monitoreo y optimización + actividades evolutivas, bajo un esquema de paquetes.`,
    contenidoExtra: null,
  },
  {
    slug: "it-13-servicios-de-voz-impulsados-por-ia",
    codigo: "IT-13",
    nombreComercial: "Servicios de Voz Impulsados por IA para Informes e Inspecciones",
    categoria: "Voz y Multimodal",
    tipo: "Transportation & Manufacturing",
    estado: "Video Demo",
    industrias: ["Utilities (Electricity, Water, Gas & Sanitation)", "Mining, Steel, Logistics & Industrial Infrastructure"],
    clientes: null,
    autores: [{ nombre: AV, rol: "Autor" }],
    descripcion:
      "Operario industrial en campo realizando labores de inspección mediante comandos de voz (manos libres).",
    descripcionLarga: `Solución basada en servicios de voz y herramientas de automatización de procesos, diseñada para apoyar a los operadores en la transcripción y generación de reportes por voz de actividades técnicas y de mantenimiento, como inspecciones en plantas de producción, revisiones de maquinaria industrial, elaboración de informes, entre otros.

La solución permite además realizar consultas operativas sobre información, incluyendo datos geolocalizados, completar automáticamente formularios de acuerdo con los formatos requeridos y transmitir la información directamente al centro de control.

Las capacidades de IA Generativa permiten reconstruir el contexto y estructurar de manera más eficiente la información de fichas técnicas a partir de notas de voz, así como procesar los datos recopilados para generar reportes y documentos, analizar su contenido y proporcionar indicaciones y recomendaciones.

Principales capacidades:

Reconocimiento de voz, incluso con terminología técnica especializada.
Capacidad para identificar acrónimos, unidades de medida y otros términos técnicos.
Alto desempeño en entornos con ruido.
Consultas en lenguaje natural sobre datos estructurados.
Generación de fichas técnicas estructuradas, incluso a partir de notas de voz poco estructuradas.
Actualización directa de sistemas back-end y plataformas de Workforce Management.
Herramientas de IA Generativa para la creación automática de resúmenes y reportes.`,
    videoPromocional: { tipo: "drive", url: "https://drive.google.com/file/d/175HNShjkjiIz3BQPvSbEB2fsmlhEaYie/preview" },
    clientesReferencia: `La solución ha sido desarrollada para la empresa italiana de infraestructura ferroviaria (RFI), con el objetivo de facilitar el reporte de actividades de mantenimiento en modalidad manos libres (hands-free).
Los principales desafíos están relacionados con la integración con los sistemas de Workforce Management (WFM), basados en SAP.`,
    gtm: `Solución dirigida a grandes clientes de los sectores Transporte, Energía & Utilities y Manufactura.
Orientada a incrementar la productividad y eficiencia de los operadores y equipos técnicos.`,
    prerrequisitos: `Procesos: procesos de mantenimiento en campo (Field Maintenance), incluyendo la gestión de la Base de Conocimiento (KB) y de los datos asociados.
Datos: formularios de inspección, plantillas de reportes, registro de activos, órdenes de trabajo, muestras de voz e historiales/registros de mantenimiento.`,
    procesos: "Captura de voz en modalidad manos libres (hands-free), transcripción automática y generación de reportes.",
    resultados: [
      "Operación manos libres (hands-free): detección y gestión contextual de la información, permitiendo una mayor concentración en las actividades en campo.",
      "Mayor rapidez en la generación de reportes.",
      "Reducción del riesgo de omisiones de información relevante.",
    ],
    flexibilidadIA: `Compatible tanto con Velvet (modelo especializado/verticalizado) como con LLMs de Hyperscalers.
Pueden existir restricciones cuando la información o documentación sensible no pueda ser procesada en una infraestructura de nube pública.
Estas restricciones pueden mitigarse cuando el proveedor Hyperscaler garantiza el cumplimiento de los requerimientos de privacidad y protección de datos. Por ello, el LLM y su modelo de despliegue deberán seleccionarse de acuerdo con las restricciones de privacidad y seguridad de los datos del cliente.`,
    soberania:
      "Generalmente, esta solución es especialmente adecuada para una propuesta de Soberanía de IA y Datos (AI/Data Sovereignty), ya que los clientes suelen requerir que la documentación privada relacionada con sus operaciones de mantenimiento no sea compartida ni procesada mediante un LLM público.",
    herramientas:
      "Disponibilidad de Video Demo.\nEs posible organizar una Demo en vivo ad hoc, adaptada específicamente al sector Transporte.",
    insumos: [
      "Descripción y análisis del proceso a automatizar.",
      "Ejemplos de datos.",
      "Posibles restricciones relacionadas con IA y el dominio de los datos.",
    ],
    alcance: `El alcance dependerá del número y la complejidad de los procesos que deberá gestionar la PoC.
Los criterios de éxito deberán ser definidos y acordados con el cliente.`,
    framework: `La arquitectura dependerá de las restricciones y requerimientos asociados a la gestión de los datos.
Hasta el momento, los pilotos se han desarrollado utilizando una arquitectura on-premise con LLM privado.
Actualmente se está trabajando en un despliegue centralizado del LLM, con el objetivo de mejorar la eficiencia y optimizar costos.`,
    cronogramaRiesgos: `El plazo depende en gran medida de la complejidad del cliente:

Para una entidad gubernamental de alta complejidad, la implementación suele tomar entre 6 y 8 meses, debido a la necesidad de alinear las diferentes áreas internas, incluyendo los equipos de TI y técnicos.
Para una empresa privada pequeña o mediana, el plazo puede reducirse a aproximadamente 2 a 3 meses.
Un primer piloto utilizando infraestructura externa puede implementarse en aproximadamente 4 a 6 semanas.`,
    servicios: `Altamente dependiente de la tecnología objetivo y de la arquitectura asociada.
Se requiere un co-diseño de la estrategia Go-to-Market (Almaviva Group + TIVIT), considerando los clientes en pipeline, su tamaño y el tipo de tecnología que mejor se adapte a sus necesidades.`,
    licenciamiento: `Implementación: costo por única vez, asociado al esfuerzo del equipo + infraestructura de desarrollo.
Mantenimiento: costo recurrente, con diferentes niveles de servicio:
Soporte y corrección de errores (bug fixing).
Corrección de errores + monitoreo y optimización.
Corrección de errores + monitoreo y optimización + actividades evolutivas, bajo un esquema de paquetes.`,
    contenidoExtra: null,
  },
  {
    slug: "it-14-busqueda-conversacional-para-operadores",
    codigo: "IT-14",
    nombreComercial: "Búsqueda Conversacional para Operadores de Campo y de Sala de Control",
    categoria: "Documental y Conocimiento",
    tipo: "Transportation & Manufacturing",
    estado: "Video Demo",
    industrias: ["Utilities (Electricity, Water, Gas & Sanitation)", "Mining, Steel, Logistics & Industrial Infrastructure"],
    clientes: null,
    autores: [{ nombre: AV, rol: "Autor" }],
    descripcion:
      "Operador visualizando información estructurada y modelado 3D de piezas en una tableta/pantalla en entornos industriales.",
    descripcionLarga: `Solución basada en IA Generativa, búsqueda conversacional y tecnologías de Retrieval-Augmented Generation (RAG), diseñada para garantizar que los equipos que trabajan tanto en campo como en salas o centros de control de sistemas de redes complejas puedan acceder de manera rápida y eficiente a la información necesaria para tomar decisiones, ejecutar operaciones y realizar actividades de mantenimiento preventivo, correctivo y extraordinario.

Principales capacidades y beneficios:

Experiencia de usuario intuitiva, con acceso conversacional a manuales técnicos, procedimientos y documentación especializada.
Consulta inmediata de KPIs operativos, capas GIS, alarmas, eventos, incidentes históricos y documentación técnica.
Mayor precisión y relevancia de la información obtenida automáticamente.
Actualización rápida de la Base de Conocimiento (Knowledge Base), sin necesidad de reentrenar los modelos.
Posibilidad de integración con servicios de voz para procesos de autenticación y búsqueda de información.`,
    videoPromocional: { tipo: "drive", url: "https://drive.google.com/file/d/1dWL-sVv5ydum_RpgfT5Wp7S7XND3AgNQ/preview" },
    clientesReferencia: `La solución ha sido desarrollada como un servicio de valor agregado para la plataforma de monitoreo MoovA de Almaviva Group.
Su principal valor diferencial es la capacidad de gestionar y consultar capas GIS, así como interpretar y explicar los KPIs de MoovA mediante lenguaje natural.
El principal desafío está relacionado con la integración con los sistemas GIS y la capa de gestión de datos (Data Management Layer).`,
    gtm: `Capacidades de IA de valor agregado para soluciones verticales de Centros de Control (Control Rooms).
Especialmente adecuada como componente complementario (add-on) para soluciones de Gestión de Tráfico (Traffic Management).`,
    prerrequisitos: `Procesos: monitoreo y gestión del tráfico (Traffic Monitoring), incluyendo la administración de la Base de Conocimiento (Knowledge Base) y la gestión de los datos asociados.
Datos: KPIs operativos, capas GIS, alarmas, eventos, incidentes históricos y documentación técnica.`,
    procesos:
      "Consulta en lenguaje natural de los sistemas de monitoreo y operación, facilitando el acceso rápido e intuitivo a la información operativa.",
    resultados:
      "Acceso más rápido y eficiente a la información operativa, facilitando la consulta y apoyando la toma de decisiones.",
    flexibilidadIA: `Compatible tanto con Velvet (modelo especializado/verticalizado) como con LLMs de Hyperscalers.
Pueden existir restricciones cuando la información operativa o documentación sensible no pueda ser procesada en una infraestructura de nube pública.
Estas restricciones pueden mitigarse cuando el proveedor Hyperscaler garantiza el cumplimiento de los requerimientos de privacidad y protección de datos. Por ello, el LLM y su modelo de despliegue deberán seleccionarse de acuerdo con las restricciones de privacidad, seguridad y soberanía de los datos del cliente.`,
    soberania:
      "Generalmente, esta solución es especialmente adecuada para una propuesta de Soberanía de IA y Datos (AI/Data Sovereignty), ya que los clientes suelen requerir que la documentación privada y la información asociada a las operaciones de sus Centros de Control no sean compartidas ni procesadas mediante un LLM público.",
    herramientas:
      "Disponibilidad de Video Demo.\nEs posible organizar una Demo en vivo ad hoc, adaptada específicamente al sector Transporte.",
    insumos: [
      "Descripción y análisis del proceso a automatizar.",
      "Ejemplos de datos.",
      "Posibles restricciones relacionadas con IA y el dominio de los datos.",
    ],
    alcance: `El alcance dependerá del número y la complejidad de los procesos que deberá gestionar la PoC.
Los criterios de éxito deberán ser definidos y acordados con el cliente.`,
    framework: `La arquitectura dependerá de las restricciones y requerimientos asociados a la gestión de los datos.
Hasta el momento, los pilotos se han desarrollado utilizando una arquitectura on-premise con LLM privado.
Actualmente se está trabajando en un despliegue centralizado del LLM, con el objetivo de mejorar la eficiencia y optimizar costos.`,
    cronogramaRiesgos: `El plazo depende en gran medida de la complejidad del cliente:

Para una entidad gubernamental de alta complejidad, la implementación suele tomar entre 6 y 8 meses, debido a la necesidad de alinear las diferentes áreas internas, incluyendo los equipos de TI y técnicos.
Para una empresa privada pequeña o mediana, el plazo puede reducirse a aproximadamente 2 a 3 meses.
Un primer piloto utilizando infraestructura externa puede implementarse en aproximadamente 4 a 6 semanas.`,
    servicios: `Altamente dependiente de la tecnología objetivo y de la arquitectura asociada.
Se requiere un co-diseño de la estrategia Go-to-Market (Almaviva Group + TIVIT), considerando los clientes en pipeline, su tamaño y el tipo de tecnología que mejor se adapte a sus necesidades.`,
    licenciamiento: `Implementación: costo por única vez, asociado al esfuerzo del equipo + infraestructura de desarrollo.
Mantenimiento: costo recurrente, con diferentes niveles de servicio:
Soporte y corrección de errores (bug fixing).
Corrección de errores + monitoreo y optimización.
Corrección de errores + monitoreo y optimización + actividades evolutivas, bajo un esquema de paquetes.`,
    contenidoExtra: null,
  },
  {
    slug: "it-15-asistencia-virtual-para-tecnicos-de-mantenimiento",
    codigo: "IT-15",
    nombreComercial: "Asistencia Virtual para Técnicos de Mantenimiento",
    categoria: "Asistencia en Campo y Mantenimiento",
    tipo: "Transportation & Manufacturing",
    estado: "Video Demo",
    industrias: ["Utilities (Electricity, Water, Gas & Sanitation)", "Mining, Steel, Logistics & Industrial Infrastructure"],
    clientes: null,
    autores: [{ nombre: AV, rol: "Autor" }],
    descripcion:
      "Operario utilizando gafas de realidad aumentada/visión asistida interactuando con un avatar virtual femenino.",
    descripcionLarga: `Solución basada en tecnologías de Retrieval-Augmented Generation (RAG), Avatar Humano Digital y Realidad Aumentada (AR), diseñada para brindar asistencia activa a los técnicos de mantenimiento en campo durante sus intervenciones sobre activos ferroviarios.

La solución proporciona procedimientos guiados paso a paso, recuperando información desde manuales de mantenimiento y bases de conocimiento, y permite una interacción manos libres (hands-free) mediante un Avatar de IA proyectado en gafas inteligentes de Realidad Aumentada (AR Smart Glasses).

Principales beneficios:

Mayor autonomía de los técnicos de mantenimiento en campo.
Reducción de las solicitudes de soporte al Centro de Control (Control Room).
Ejecución paso a paso de procedimientos de mantenimiento asistida por IA.
Mayor productividad y efectividad de las intervenciones.
Transferencia de conocimiento (Knowledge Transfer – KT) y capacitación en el puesto de trabajo (Training-on-the-Job) más rápidas.
Mayor estandarización y consistencia en la ejecución de las actividades de mantenimiento entre los diferentes técnicos.`,
    videoPromocional: { tipo: "drive", url: "https://drive.google.com/file/d/1Um3OxC3gYTcB9jVR79nnWrb7xmgIv0TV/preview" },
    clientesReferencia: `La solución ha sido desarrollada para la empresa italiana de infraestructura ferroviaria (RFI).
Uno de los principales desafíos está relacionado con la integración con el sistema de gestión documental IMAN.
Adicionalmente, debido al gran volumen y complejidad de la base documental, la arquitectura RAG requiere un LLM multimodal, capaz de interpretar y procesar planos, tablas y esquemas técnicos, además de contenido textual.
Otro desafío relevante corresponde a las limitaciones de capacidad de hardware de los dispositivos móviles utilizados por los técnicos de mantenimiento en campo.`,
    gtm: `Solución especialmente adecuada para grandes clientes de los sectores Transporte, Energía & Utilities y Manufactura.
Orientada a incrementar la productividad de los operadores en campo, reducir la carga de soporte del Centro de Control (Control Room) y acelerar el onboarding y la capacitación del personal de mantenimiento.`,
    prerrequisitos: `Procesos: procesos de mantenimiento en campo (Field Maintenance), incluyendo la gestión de la Base de Conocimiento (Knowledge Base) y de los datos asociados.
Datos: manuales, planos, procedimientos técnicos, historiales de mantenimiento, información de activos y repositorios documentales.`,
    procesos:
      "Búsqueda y recuperación de procedimientos, manuales y planos técnicos, proporcionando asistencia guiada y contextual en respuesta a las consultas realizadas por los técnicos de mantenimiento.",
    resultados: [
      "Reducción del tiempo de diagnóstico y resolución de problemas (troubleshooting).",
      "Reducción de los tiempos de capacitación del personal de mantenimiento.",
    ],
    flexibilidadIA: `Compatible tanto con Velvet (modelo especializado/verticalizado) como con LLMs de Hyperscalers.
Pueden existir restricciones cuando la documentación técnica o información sensible no pueda ser procesada en una infraestructura de nube pública.
Estas restricciones pueden mitigarse cuando el proveedor Hyperscaler garantiza el cumplimiento de los requerimientos de privacidad y protección de datos. Por ello, el LLM y su modelo de despliegue deberán seleccionarse de acuerdo con las restricciones de privacidad y seguridad de los datos del cliente.`,
    soberania:
      "Generalmente, esta solución es especialmente adecuada para una propuesta de Soberanía de IA y Datos (AI/Data Sovereignty), ya que los clientes suelen requerir que la documentación privada asociada a sus operaciones de mantenimiento no sea compartida ni procesada mediante un LLM público.",
    herramientas:
      "Disponibilidad de Video Demo.\nEs posible organizar una Demo en vivo ad hoc, adaptada específicamente al sector Transporte.",
    insumos: [
      "Descripción y análisis del proceso a automatizar.",
      "Ejemplos de datos.",
      "Posibles restricciones relacionadas con IA y el dominio de los datos.",
    ],
    alcance: `El alcance dependerá del número y la complejidad de los procesos que deberá gestionar la PoC.
Los criterios de éxito deberán ser definidos y acordados con el cliente.`,
    framework: `La arquitectura dependerá de las restricciones y requerimientos asociados a la gestión de los datos.
Hasta el momento, los pilotos se han desarrollado utilizando una arquitectura on-premise con LLM privado.
Actualmente se está trabajando en un despliegue centralizado del LLM, con el objetivo de mejorar la eficiencia y optimizar costos.`,
    cronogramaRiesgos: `El plazo depende en gran medida de la complejidad del cliente:

Para una entidad gubernamental de alta complejidad, la implementación suele tomar entre 6 y 8 meses, debido a la necesidad de alinear las diferentes áreas internas, incluyendo los equipos de TI y técnicos.
Para una empresa privada pequeña o mediana, el plazo puede reducirse a aproximadamente 2 a 3 meses.
Un primer piloto utilizando infraestructura externa puede implementarse en aproximadamente 4 a 6 semanas.`,
    servicios: `Altamente dependiente de la tecnología objetivo y de la arquitectura asociada.
Se requiere un co-diseño de la estrategia Go-to-Market (Almaviva Group + TIVIT), considerando los clientes en pipeline, su tamaño y el tipo de tecnología que mejor se adapte a sus necesidades.`,
    licenciamiento: `Implementación: costo por única vez, asociado al esfuerzo del equipo + infraestructura de desarrollo.
Mantenimiento: costo recurrente, con diferentes niveles de servicio:
Soporte y corrección de errores (bug fixing).
Corrección de errores + monitoreo y optimización.
Corrección de errores + monitoreo y optimización + actividades evolutivas, bajo un esquema de paquetes.`,
    contenidoExtra: null,
  },
  {
    slug: "it-16-sistemas-de-soporte-decisiones-smart-cities",
    codigo: "IT-16",
    nombreComercial: "Sistemas de Soporte para la Toma de Decisiones en Ciudades Inteligentes (Smart Cities)",
    categoria: "Analítica, Predicción y Riesgo",
    tipo: "Smart Cities and e-Government",
    estado: "Video Demo",
    industrias: null,
    clientes: null,
    autores: [{ nombre: AV, rol: "Autor" }],
    descripcion:
      "Paneles de control (dashboards) mostrando mapas interactivos, gráficos circulares y métricas de rendimiento de la ciudad.",
    descripcionLarga:
      'Plataforma Big Data integrada que combina múltiples fuentes para generar KPIs urbanos, gemelos digitales ("Digital Twin") para simulaciones y apoyo a políticas, y aplicaciones para seguridad y gestión de áreas verdes urbanas.',
    videoPromocional: { tipo: "drive", url: "https://drive.google.com/file/d/1SfRwCeQZ894czIo-EWaAt994OqTK7d7z/preview" },
    clientesReferencia: null,
    gtm: null,
    prerrequisitos: null,
    procesos: null,
    resultados: null,
    flexibilidadIA: null,
    soberania: null,
    herramientas: null,
    insumos: null,
    alcance: null,
    framework: null,
    cronogramaRiesgos: null,
    servicios: null,
    licenciamiento: null,
    contenidoExtra: null,
  },
  {
    slug: "it-17-consultas-lenguaje-natural-ciudades-inteligentes",
    codigo: "IT-17",
    nombreComercial: "Consultas en Lenguaje Natural para Perspectivas de Ciudades Inteligentes",
    categoria: "Conversacional y Atención al Cliente",
    tipo: "Smart Cities and e-Government",
    estado: "Video Demo",
    industrias: null,
    clientes: null,
    autores: [{ nombre: AV, rol: "Autor" }],
    descripcion:
      "Mapa de calor (heatmap) interactivo de una zona urbana con una barra lateral de conversación por chat.",
    descripcionLarga:
      'Consultas conversacionales para explorar datos de la ciudad (ej. accidentes viales), detección automática de tendencias y anomalías, y generación de mapas de calor a partir de "prompts" simples.',
    videoPromocional: { tipo: "drive", url: "https://drive.google.com/file/d/134HqYXYsmPpfaq9BSZ0aIZL38f8Ex1id/preview" },
    clientesReferencia: null,
    gtm: null,
    prerrequisitos: null,
    procesos: null,
    resultados: null,
    flexibilidadIA: null,
    soberania: null,
    herramientas: null,
    insumos: null,
    alcance: null,
    framework: null,
    cronogramaRiesgos: null,
    servicios: null,
    licenciamiento: null,
    contenidoExtra: null,
  },
  {
    slug: "it-18-habla-y-voz-multimodal-y-multilingue-para-la-inclusion",
    codigo: "IT-18",
    nombreComercial: "Habla y Voz Multimodal y Multilingüe para la Inclusión",
    categoria: "Voz y Multimodal",
    tipo: "Smart Cities and e-Government",
    estado: "Video Demo",
    industrias: null,
    clientes: null,
    autores: [{ nombre: AV, rol: "Autor" }],
    descripcion:
      "Transmisión de video de una asamblea pública con transcripción de texto automatizada al margen de la pantalla.",
    descripcionLarga:
      "Subtítulos en tiempo real y lenguaje de señas para sesiones en vivo, transcripción y traducción multilingüe (soporte para docenas de idiomas), y transcripciones sincronizadas y buscables (texto-audio-video).",
    videoPromocional: { tipo: "drive", url: "https://drive.google.com/file/d/1vhWB_XMzXg1byZ1HTIXms4C5ycZjiv90/preview" },
    clientesReferencia: null,
    gtm: null,
    prerrequisitos: null,
    procesos: null,
    resultados: null,
    flexibilidadIA: null,
    soberania: null,
    herramientas: null,
    insumos: null,
    alcance: null,
    framework: null,
    cronogramaRiesgos: null,
    servicios: null,
    licenciamiento: null,
    contenidoExtra: null,
  },
  {
    slug: "it-19-consultas-lenguaje-natural-analisis-financiero",
    codigo: "IT-19",
    nombreComercial: "Consultas en Lenguaje Natural para Análisis Financiero",
    categoria: "Conversacional y Atención al Cliente",
    tipo: "Finance & Banking",
    estado: "Video Demo",
    industrias: null,
    clientes: null,
    autores: [{ nombre: AV, rol: "Autor" }],
    descripcion:
      "Interfaz de chat corporativo integrada en un entorno de datos bancarios para realizar consultas financieras.",
    descripcionLarga:
      "Acceso conversacional a cuentas, transacciones y patrones de gasto; insights automatizados sobre comportamientos financieros y anomalías; y soporte de decisiones para asesores con recomendaciones personalizadas.",
    videoPromocional: { tipo: "drive", url: "https://drive.google.com/file/d/1T7yf1968eGRKSb8Sm4gH09-DFkdZ5VmY/preview" },
    clientesReferencia: null,
    gtm: null,
    prerrequisitos: null,
    procesos: null,
    resultados: null,
    flexibilidadIA: null,
    soberania: null,
    herramientas: null,
    insumos: null,
    alcance: null,
    framework: null,
    cronogramaRiesgos: null,
    servicios: null,
    licenciamiento: null,
    contenidoExtra: null,
  },
  {
    slug: "it-20-ia-para-agrupacion-y-clasificacion-de-casos",
    codigo: "IT-20",
    nombreComercial: "IA para la Agrupación (Clustering) y Clasificación de Casos",
    categoria: "Analítica, Predicción y Riesgo",
    tipo: "Finance & Banking",
    estado: "Video Demo",
    industrias: null,
    clientes: null,
    autores: [{ nombre: AV, rol: "Autor" }],
    descripcion:
      "Gráfico de dispersión cuadriculado y listas para clasificar grandes volúmenes de reportes.",
    descripcionLarga:
      "Clasificación automatizada de quejas, casos y reportes de alto volumen; detección de precedentes similares y reglas regulatorias; y apoyo a la toma de decisiones con supervisión humana.",
    videoPromocional: { tipo: "drive", url: "https://drive.google.com/file/d/1Dpqv-E6htUCTCW-Hhus7Z9DE4weLEBSE/preview" },
    clientesReferencia: null,
    gtm: null,
    prerrequisitos: null,
    procesos: null,
    resultados: null,
    flexibilidadIA: null,
    soberania: null,
    herramientas: null,
    insumos: null,
    alcance: null,
    framework: null,
    cronogramaRiesgos: null,
    servicios: null,
    licenciamiento: null,
    contenidoExtra: null,
  },
  {
    slug: "it-21-inteligencia-de-reclamaciones-con-analisis-de-sentimiento",
    codigo: "IT-21",
    nombreComercial: "Inteligencia de Reclamaciones con Análisis de Sentimiento",
    categoria: "Analítica, Predicción y Riesgo",
    tipo: "Finance & Banking",
    estado: "Video Demo",
    industrias: [
      "Utilities (Electricity, Water, Gas & Sanitation)",
      "Public Administration, Government & Social Security",
      "Financial Services, Healthcare",
      "Consumer Goods, Food, Beverages & Retail",
    ],
    clientes: null,
    autores: [{ nombre: AV, rol: "Autor" }],
    descripcion:
      "Tablero analítico (dashboard) enfocado en métricas de reclamos (barras, indicadores de estrés/riesgo).",
    descripcionLarga: `Solución basada en tecnologías de IA Multimodal, Procesamiento de Lenguaje Natural (NLP) y Speech Analytics, aplicadas a la gestión de siniestros de seguros, que permite analizar automáticamente evidencia textual y de audio, identificar señales de riesgo y brindar soporte a los gestores y liquidadores de siniestros mediante recomendaciones explicables generadas por IA.

La plataforma transforma grandes volúmenes de información asociada a siniestros en inteligencia accionable, facilitando la gestión operativa y la toma de decisiones de supervisores, gestores y liquidadores.

Principales capacidades y beneficios:

Priorización de siniestros mediante IA, identificando aquellos que requieren atención inmediata.
Explicabilidad de las recomendaciones generadas por los modelos de IA.
Identificación temprana de casos complejos, anómalos o de alto riesgo.
Visibilidad consolidada del portafolio de siniestros para supervisores y responsables de operaciones.
Capa de inteligencia escalable, aplicable de manera transversal a múltiples procesos del negocio asegurador.`,
    videoPromocional: { tipo: "drive", url: "https://drive.google.com/file/d/1P9HdApG7WotgAmszZMe77Bfv_qJCpIdb/preview" },
    clientesReferencia: `Concepto diseñado para ilustrar ejemplos de capacidades aplicables al ámbito de Customer Care / Atención al Cliente.
Puede integrarse con capacidades de análisis de riesgo basadas en datos alternativos —como sentimiento y popularidad— y con soluciones de Inteligencia de Localización (Location Intelligence).`,
    gtm: `Solución especialmente adecuada para clientes con operaciones de Contact Center.
Beneficio principal: proporciona un motor de triaje (triage) explicable basado en IA, capaz de analizar y priorizar siniestros a partir de evidencia textual y de audio.`,
    prerrequisitos: `Procesos: servicios y procesos de Contact Center, especialmente gestión de siniestros, atención de reclamos y flujos de atención al cliente.
Datos: expedientes de siniestros, correos electrónicos, transcripciones, interacciones con clientes, resoluciones históricas, categorías y etiquetas de resultados.`,
    procesos:
      "Análisis de siniestros, conversaciones y documentos, con clasificación automática de sentimiento, nivel de urgencia y riesgo.",
    resultados: [
      "Mayor rapidez en la gestión y resolución de siniestros.",
      "Mejor priorización de casos, facilitando la atención oportuna de aquellos con mayor urgencia o nivel de riesgo.",
    ],
    flexibilidadIA: `Compatible tanto con Velvet (modelo especializado/verticalizado) como con LLMs de Hyperscalers.
Pueden existir restricciones cuando la información sensible, como pólizas, contratos, expedientes de siniestros o datos de clientes, no pueda ser procesada en una infraestructura de nube pública.
Estas restricciones pueden mitigarse cuando el proveedor Hyperscaler garantiza el cumplimiento de los requerimientos de privacidad y protección de datos. Por ello, el LLM y su modelo de despliegue deberán seleccionarse de acuerdo con las políticas de privacidad, seguridad y soberanía de datos del cliente.`,
    soberania: `La elección dependerá de los requerimientos de privacidad y protección de datos.
En el caso de BPOs de gran escala, un despliegue privado (Private Deployment) puede resultar comercialmente más conveniente que una solución Cloud basada en un modelo de pago por uso, especialmente cuando existen altos volúmenes de procesamiento.`,
    herramientas: "Disponibilidad de Video Demo para un entorno genérico de Contact Center.",
    insumos: [
      "Descripción y análisis del proceso a automatizar.",
      "Ejemplos de datos.",
      "Posibles restricciones relacionadas con IA y el dominio de los datos.",
    ],
    alcance: `El alcance de la PoC dependerá del número y la complejidad de los procesos que se deseen abordar.
Los criterios de éxito deberán ser definidos y acordados previamente con el cliente.`,
    framework: `Actualmente, la solución se encuentra aún en fase conceptual. El framework tecnológico y la arquitectura dependerán de las políticas de Datos e IA del cliente.
Para un BPO pequeño o mediano, un modelo de provisión basado en Cloud suele resultar más costo-eficiente.
Para un BPO de gran escala, con altos volúmenes de interacciones, suele ser más conveniente un despliegue privado o gestionado (Private/Managed Deployment), tanto para las capacidades de cómputo y almacenamiento como para la infraestructura de IA.`,
    cronogramaRiesgos: `Actualmente es un concepto, por lo que será necesario un esfuerzo de Solution Engineering para evolucionarlo hacia un piloto o una solución lista para producción.
El esfuerzo, plazo y nivel de riesgo dependerán principalmente de la complejidad y madurez tecnológica del cliente.
Si el cliente ya cuenta con una plataforma madura de Contact Center Omnicanal —por ejemplo, Genesys, Five9 o Avaya—, el esfuerzo de integración puede reducirse, con una estimación aproximada de 12 a 16 semanas. Sin embargo, en este escenario se deberá considerar la competencia con proveedores especializados de Workforce Optimization (WFO), como Verint.
Si el cliente no dispone de una plataforma omnicanal madura, el esfuerzo de integración puede ser significativamente mayor y extenderse por varios meses. No obstante, en este escenario podría existir menor competencia directa con plataformas Enterprise especializadas, como Verint o NICE.`,
    servicios: `Altamente dependiente de la tecnología objetivo y de la arquitectura asociada.
Se requiere un co-diseño de la estrategia Go-to-Market (Almaviva Group + TIVIT), considerando los clientes en pipeline, su tamaño y el tipo de tecnología que mejor se adapte a sus necesidades.`,
    licenciamiento: `Implementación (Realization): costo por única vez, asociado al esfuerzo del equipo + infraestructura de desarrollo.
Mantenimiento: costo recurrente, con diferentes niveles de servicio:
Soporte y corrección de errores (bug fixing).
Corrección de errores + monitoreo y optimización.
Corrección de errores + monitoreo y optimización + actividades evolutivas, bajo un esquema de paquetes.`,
    contenidoExtra: `Indicadores y áreas de aplicación en el sector asegurador

Seguridad percibida vs. seguridad real

Comercial: focalización en zonas con mayor exposición a robos y vandalismo.
Negocio: evaluación del riesgo para establecimientos de retail y hotelería.
Siniestros: detección de variaciones anómalas en los niveles de riesgo local.

Predicción dinámica del riesgo

Suscripción (Underwriting): modelos de pricing enriquecidos con datos dinámicos de riesgo.
Operaciones: planificación preventiva de peritos y servicios de asistencia.
Estrategia: identificación de zonas con alto potencial comercial y menor nivel de riesgo.

Alertas tempranas de seguridad

Monitoreo: alertas oportunas ante el deterioro de las condiciones de seguridad de una zona.
Prevención: soporte para la definición de medidas preventivas y de seguridad.
Controles: priorización de controles sobre zonas o clusters críticos.

Flujos turísticos y conectividad aérea

Turismo: evaluación de la exposición de los clientes a la estacionalidad turística.
Movilidad: estimación de posibles incrementos de siniestros en función de los flujos aéreos.
Oportunidades: campañas comerciales focalizadas en zonas de alta atracción turística.

Eventos y picos territoriales

Gestión de picos: monitoreo de zonas sujetas a incrementos temporales de exposición al riesgo.
Hotelería: insights de negocio asociados a establecimientos, zonas y eventos de gran escala.
Timing: adaptación de ofertas y coberturas a ventanas temporales específicas.

Benchmarking de competidores

Red: identificación de zonas con baja cobertura y potencial de expansión.
Benchmark: comparación de la calidad percibida (ratings) frente a competidores.
Desarrollo de negocio: foco en zonas con alta demanda y baja presión competitiva.`,
  },
  {
    slug: "it-22-deteccion-de-anomalias-en-la-distribucion-de-agua",
    codigo: "IT-22",
    nombreComercial: "Detección y Evaluación de Anomalías en la Distribución de Agua",
    categoria: "Analítica, Predicción y Riesgo",
    tipo: "Water & Energy Management",
    estado: "Video Demo",
    industrias: null,
    clientes: null,
    autores: [{ nombre: AV, rol: "Autor" }],
    descripcion:
      "Consiste en la aplicación de modelos de Inteligencia Artificial y analítica avanzada dentro del sistema de gestión (SWMS) para monitorear continuamente el estado de la infraestructura hídrica. Su objetivo es identificar patrones de comportamiento inusuales en tiempo real que puedan indicar fallas, optimizando así la eficiencia operativa y previniendo pérdidas.",
    descripcionLarga:
      "Procesamiento de datos en tiempo real provenientes de más de 100,000 sensores e integraciones IoT y SCADA: Detección automatizada de fugas, caídas de presión o irregularidades en los más de 110,000 km de red gestionada. Generación de alertas tempranas para habilitar labores de mantenimiento predictivo antes de que ocurra una rotura mayor.",
    videoPromocional: { tipo: "drive", url: "https://drive.google.com/file/d/1Q7HGxdPtk4cohHlRwsgdfnPym3VWI-T1/preview" },
    clientesReferencia: null,
    gtm: null,
    prerrequisitos: null,
    procesos: null,
    resultados: null,
    flexibilidadIA: null,
    soberania: null,
    herramientas: null,
    insumos: null,
    alcance: null,
    framework: null,
    cronogramaRiesgos: null,
    servicios: null,
    licenciamiento: null,
    contenidoExtra: null,
  },
  {
    slug: "it-23-busqueda-en-lenguaje-natural-sobre-datos-geograficos",
    codigo: "IT-23",
    nombreComercial: "Búsqueda en Lenguaje Natural sobre Datos Geográficos",
    categoria: "Documental y Conocimiento",
    tipo: "Water & Energy Management",
    estado: "Video Demo",
    industrias: null,
    clientes: null,
    autores: [{ nombre: AV, rol: "Autor" }],
    descripcion:
      "Una interfaz interactiva que permite a los operadores, ingenieros y planificadores consultar datos espaciales y técnicos complejos de la red utilizando preguntas o comandos conversacionales cotidianos (lenguaje natural), en lugar de requerir conocimientos avanzados en lenguajes de consulta de bases de datos.",
    descripcionLarga:
      'Interacción directa con el módulo de Sistemas de Información Geográfica (GIS) para solicitar, mediante un "prompt" de texto, la visualización de áreas específicas de la red en el mapa interactivo. Consultas conversacionales para integrar y cruzar datos heterogéneos (ej. "muéstrame el estado operativo y las simulaciones de la red en esta zona geográfica"). Creación automatizada y fácil de reportes visuales basados en los datos territoriales y de infraestructura solicitados por el usuario.',
    videoPromocional: { tipo: "drive", url: "https://drive.google.com/file/d/1_kgMXzcUsZeFx3PBrIm3mkWLH6jG4YiN/preview" },
    clientesReferencia: null,
    gtm: null,
    prerrequisitos: null,
    procesos: null,
    resultados: null,
    flexibilidadIA: null,
    soberania: null,
    herramientas: null,
    insumos: null,
    alcance: null,
    framework: null,
    cronogramaRiesgos: null,
    servicios: null,
    licenciamiento: null,
    contenidoExtra: null,
  },
  {
    slug: "it-24-plataforma-de-gestion-de-destinos-impulsada-por-ia",
    codigo: "IT-24",
    nombreComercial: "Plataforma de Gestión de Destinos Impulsada por IA",
    categoria: "Analítica, Predicción y Riesgo",
    tipo: "Tourism and Location Intelligence",
    estado: "Video Demo",
    industrias: null,
    clientes: null,
    autores: [{ nombre: AV, rol: "Autor" }],
    descripcion:
      "Múltiples mapas geográficos mundiales con clústeres de puntos de interés, mapas de calor, y paneles de análisis de sentimiento con métricas de cuota de mercado (251M+ puntos de interés, 5000+ destinos monitoreados).",
    descripcionLarga:
      "Herramientas para fortalecer redes de ventas y estudiar nuevos mercados, aumento del atractivo de los territorios a través de KPIs y tableros que combinan datos alternativos, datos de mercado, análisis de sentimientos e IA Generativa.",
    videoPromocional: { tipo: "drive", url: "https://drive.google.com/file/d/1lPLq1ghxkQT3qgtxc5XQvmXC-b9OpHcR/preview" },
    clientesReferencia: null,
    gtm: null,
    prerrequisitos: null,
    procesos: null,
    resultados: null,
    flexibilidadIA: null,
    soberania: null,
    herramientas: null,
    insumos: null,
    alcance: null,
    framework: null,
    cronogramaRiesgos: null,
    servicios: null,
    licenciamiento: null,
    contenidoExtra: null,
  },
];