// Casos de Éxito en Inteligencia Artificial y Datos.
// Colección pública con código "casos-de-exito". Consolida exclusivamente los
// casos de éxito implementados en clientes corporativos y sector público.
// Cada caso incluye perfil del cliente, alcance, detalle técnico y stack.

export const casosExito = [
  {
    slug: "ce-01-gemma-ai-project-adp",
    codigo: "CE-01",
    nombreComercial: "Gemma AI Project",
    industria: "Transporte e Infraestructura Aeroportuaria",
    pais: "Perú",
    estado: "Implementado en Producción",
    plazo: "2 meses",
    precio: "USD 8.000",
    cliente: "ADP",
    descripcion:
      "Extracción automática de metadatos de documentos PDF con IA generativa para autocompletar el portal SharePoint de ADP.",
    perfil:
      "Operador privado responsable de la gestión, operación y desarrollo de aeropuertos regionales del Perú.",
    alcance:
      "Situación inicial: el proceso de carga de documentos en el portal SharePoint de ADP exige que los usuarios ingresen manualmente los campos clave asociados a cada documento. Este proceso manual está expuesto a errores y genera una carga operativa significativa en tiempo y esfuerzo.\n\nAlcance del proyecto: oportunidad de mejora mediante la automatización de la extracción de información de los documentos PDF cargados, utilizando IA generativa (ChatGPT) para identificar y extraer automáticamente los datos relevantes y completar los campos correspondientes en la interfaz existente de SharePoint.\n\nCampos a extraer automáticamente:\nDependencia\nAsunto\nCódigo de proyecto\nFecha\nRemitente",
    detalleTecnico:
      "El alcance de la solución contempla la implementación de una integración directa entre ChatGPT y la interfaz existente desarrollada en .NET, considerando los siguientes componentes:\n- Integración mediante Power Automate, Logic Apps o API Management: la solicitud para completar los campos se realiza mediante un flujo automatizado que recupera y procesa la información del documento cargado.\n- Autocompletado de campos: los valores identificados y propuestos por ChatGPT se muestran automáticamente en los campos y listas desplegables de la interfaz de SharePoint.\n- Edición y validación por el usuario: el usuario puede revisar y modificar cualquiera de los valores propuestos cuando la información extraída sea incorrecta, imprecisa o incompleta.\n- Registro de diferencias y retroalimentación: los valores modificados se almacenan en una base de datos SQL, generando un histórico de correcciones para mejorar progresivamente la precisión de la solución.\n- Monitoreo y auditoría: la información extraída y las modificaciones quedan registradas para fines de trazabilidad, auditoría y control interno.",
    stack: [".NET", "Power Automate", "Logic Apps", "API Management"],
  },
  {
    slug: "ce-02-access-fan-portal-video-fan",
    codigo: "CE-02",
    nombreComercial: "Access Fan — Portal Video Fan",
    industria: "Deporte y Tecnología (SportsTech)",
    pais: "Argentina",
    estado: "Implementado en Pre-Producción",
    plazo: "3 meses",
    precio: "USD 5.000",
    cliente: "AccessFan",
    descripcion:
      "Plataforma web para la recepción, análisis, moderación y aprobación de videos enviados por hinchas, integrada a AccessFan.",
    perfil:
      "Plataforma tecnológica para la gestión digital de clubes deportivos, incluyendo socios, ticketing, accesos a estadios y experiencia del hincha.",
    alcance:
      "Desarrollo e implementación de una plataforma web para la recepción, análisis, moderación y gestión de videos enviados por hinchas, integrada a AccessFan. Incluye carga y almacenamiento de videos, análisis automático mediante IA para identificar contenido potencialmente ilícito o inapropiado, revisión y aprobación por administradores ONST y descarga de los videos seleccionados para su posterior proyección en las pantallas del estadio. La decisión final de publicación se mantiene bajo control humano.",
    detalleTecnico:
      "Flujo end-to-end desde la carga del video hasta su aprobación. Los videos son almacenados en nube y procesados mediante un componente de IA/Video Analytics que analiza su contenido y genera información para apoyar la moderación. El administrador accede a un portal para visualizar videos, consultar el resultado del análisis, revisar y aprobar o rechazar contenido y descargar los clips seleccionados. Incluye almacenamiento de metadatos, trazabilidad y auditoría de las operaciones.",
    stack: [
      "Google Cloud Platform",
      "Cloud Run",
      "Cloud Storage",
      "Cloud SQL / MySQL",
      "Cloud Logging",
      "IA / Video Analytics",
    ],
  },
  {
    slug: "ce-03-chatbot-mantenimiento-antamina",
    codigo: "CE-03",
    nombreComercial: "Chatbot de Mantenimiento",
    industria: "Minería",
    pais: "Perú",
    estado: "Implementado en Producción",
    plazo: "3 meses",
    precio: "USD 55.000 (75% Portal + 25% Chatbot AI)",
    cliente: "Minera Antamina",
    descripcion:
      "Portal web de mantenimiento de maquinaria con dashboard centralizado, seguimiento de órdenes de trabajo y módulo GenAI de consultas por lenguaje natural.",
    perfil:
      "Compañía minera peruana de gran escala, dedicada principalmente a la extracción y producción de cobre y zinc.",
    alcance:
      "Desarrollo e implementación de un Portal Web de Mantenimiento de Maquinaria para Antamina, orientado a centralizar y facilitar el acceso a información crítica de mantenimiento. La solución permite consultar equipos y ubicaciones técnicas, próximas y últimas fechas de mantenimiento preventivo, seguimiento de órdenes de trabajo abiertas y cerradas, así como el estado de garantías. Incluye dashboard centralizado, capacidades de búsqueda y un módulo GenAI para realizar consultas mediante lenguaje natural.",
    detalleTecnico:
      "Aplicación web integrada con las APIs existentes de Antamina para consumir información de mantenimiento en tiempo real. Arquitectura cloud-native/serverless, contemplando frontend web responsivo, backend de integración, autenticación y autorización, seguridad, monitoreo, ambientes Dev/UAT/Producción y pipelines CI/CD.",
    stack: [
      "AWS Cloud Native / Serverless",
      "Amazon S3",
      "CloudFront",
      "API Gateway",
      "Lambda",
      "Cognito",
      "WAF",
      "Secrets Manager",
      "CloudWatch",
      "X-Ray",
      "CI/CD AWS",
      "React / Angular / Vue.js",
      "Python / Node.js / Java",
    ],
  },
  {
    slug: "ce-04-paas-bigdata-subsecretaria-transporte",
    codigo: "CE-04",
    nombreComercial: "Implementación PaaS Bigdata",
    industria: "Sector Público y Transporte",
    pais: "Chile",
    estado: "Implementado en Producción",
    plazo: "3 meses",
    precio: null,
    cliente: "Subsecretaría de Transporte",
    descripcion:
      "Plataforma PaaS de Big Data sobre AWS para gestionar y analizar grandes volúmenes de datos semiestructurados del sistema de transporte de Chile.",
    perfil:
      "Organismo público responsable de políticas, regulación y gestión del sistema de transporte en Chile.",
    alcance:
      "Diseño e implementación de una plataforma PaaS de Big Data sobre AWS para gestionar y analizar grandes volúmenes de datos semiestructurados asociados a aplicaciones de transporte. La plataforma habilita capacidades de ingesta, almacenamiento, procesamiento, analítica y visualización, incorporando seguridad, automatización, optimización de costos y transferencia de conocimiento para su posterior operación autónoma.",
    detalleTecnico:
      "Arquitectura end-to-end de datos que contempla ingesta desde múltiples fuentes, almacenamiento en Data Lake, procesamiento y transformación, y analítica y visualización. Incluye pipelines de ingesta, procesamiento distribuido, consultas serverless, almacén analítico, automatización de eventos, gestión de identidades y permisos, monitoreo, CI/CD, FinOps y capacidades opcionales de ML. Considera ambientes DEV/TEST/PROD y despliegue productivo.",
    stack: [
      "Amazon S3",
      "AWS Glue",
      "Amazon EMR",
      "Amazon Athena",
      "Amazon Redshift",
      "AWS Lambda",
      "IAM",
      "CloudWatch",
      "CodePipeline",
      "SageMaker (opcional)",
      "Amazon QuickSight",
      "Power BI",
    ],
  },
  {
    slug: "ce-05-azure-data-platform-makers150",
    codigo: "CE-05",
    nombreComercial: "Azure Data Platform with MS Fabric",
    industria: "Tecnología y Construcción (ConTech)",
    pais: "Perú",
    estado: "Implementado en Producción",
    plazo: "3 meses",
    precio: "PEN 125.500",
    cliente: "Makers150",
    descripcion:
      "Azure Data Platform con Microsoft Fabric para integrar, transformar y explotar grandes volúmenes de información mediante Power BI.",
    perfil:
      "Empresa de la Familia Pacasmayo, enfocada en desarrollar soluciones digitales para el ecosistema de la construcción.",
    alcance:
      "Diseño, construcción y soporte de una Azure Data Platform con Microsoft Fabric, destinada a integrar y transformar grandes volúmenes de información y habilitar su explotación mediante Power BI. La solución establece una plataforma escalable con capacidades de gobierno, metadata, seguridad y DataOps, contemplando ambientes de Desarrollo/QA y Producción.",
    detalleTecnico:
      "Implementación de una arquitectura de datos por capas Landing Zone, Bronze, Silver y Gold, cubriendo desde la recepción de datos hasta su transformación y preparación para consumo. Incluye construcción de pipelines, modelos físicos y lógicos, catálogo inicial y plan de metadata, automatización CI/CD, gestión segura de credenciales y lineamientos de gobierno de datos.",
    stack: [
      "Microsoft Fabric",
      "Azure Data Factory",
      "Microsoft Purview",
      "Azure DevOps",
      "Azure Key Vault",
      "Power BI",
    ],
  },
  {
    slug: "ce-06-cloud-data-lakehouse-pacifico-salud",
    codigo: "CE-06",
    nombreComercial: "Implementación de Cloud Data Lakehouse",
    industria: "Salud y Seguros",
    pais: "Perú",
    estado: "Implementado en Producción",
    plazo: "4 meses",
    precio: "PEN 61.910",
    cliente: "Pacífico Salud",
    descripcion:
      "Cloud Data Lakehouse en Microsoft Azure para centralizar, integrar y procesar información de salud y seguros con gobernanza de datos.",
    perfil:
      "Empresa peruana especializada en seguros y servicios de salud, orientada a la gestión y cobertura integral de la salud.",
    alcance:
      "Implementación de una plataforma Cloud Data Lakehouse en Microsoft Azure, orientada a centralizar, integrar y procesar información proveniente de múltiples fuentes, habilitando una base de datos escalable y gobernada para analítica avanzada. La solución busca mejorar la trazabilidad, calidad, seguridad y disponibilidad de la información, sentando las bases para la implementación progresiva de un modelo de Gobierno de Datos alineado a DAMA-DMBOK.",
    detalleTecnico:
      "Implementación de arquitectura Medallion (Landing, Trusted, Enriched y Curated) para gestionar el ciclo de vida de los datos desde su ingesta hasta su preparación para consumo. Incluye pipelines de integración y transformación, procesamiento con Databricks, automatización mediante CI/CD e IaC, gestión de accesos y secretos, monitoreo y observabilidad. Integra fuentes como SAP, ERP, CRM, bases de datos, APIs, archivos y logs, aplicaciones internas y terceros.",
    stack: [
      "Azure Data Factory",
      "Azure Data Lake Storage Gen2",
      "Azure Databricks",
      "Azure Key Vault",
      "Azure Monitor / Log Analytics",
      "Azure DevOps",
      "Terraform",
    ],
  },
];