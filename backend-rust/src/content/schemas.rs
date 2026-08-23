//! Definición declarativa del schema de cada colección del CMS.
//!
//! Estos schemas se usan para:
//! - Generar formularios dinámicos en el frontend
//! - Validar los datos antes de persistir
//! - Documentar la estructura esperada de cada item
//!
//! Mantener sincronizado con `frontend/src/data/contenido.js` y los archivos
//! de datos (casosExito.js, almaviva.js, xms.js, items.json).

use crate::models::{FieldDef, FieldOption};

fn opt(value: &str, label: &str) -> FieldOption {
    FieldOption {
        value: value.to_string(),
        label: label.to_string(),
    }
}

fn field(
    key: &str,
    label: &str,
    tipo: &str,
    requerido: bool,
    descripcion: Option<&str>,
) -> FieldDef {
    FieldDef {
        key: key.to_string(),
        label: label.to_string(),
        tipo: tipo.to_string(),
        requerido,
        descripcion: descripcion.map(|s| s.to_string()),
        placeholder: None,
        opciones: None,
        item_label: None,
        item_fields: None,
    }
}

fn select_field(
    key: &str,
    label: &str,
    opciones: Vec<FieldOption>,
    requerido: bool,
    descripcion: Option<&str>,
) -> FieldDef {
    FieldDef {
        key: key.to_string(),
        label: label.to_string(),
        tipo: "select".to_string(),
        requerido,
        descripcion: descripcion.map(|s| s.to_string()),
        placeholder: None,
        opciones: Some(opciones),
        item_label: None,
        item_fields: None,
    }
}

fn array_field(
    key: &str,
    label: &str,
    item_label: &str,
    item_fields: Vec<FieldDef>,
    descripcion: Option<&str>,
) -> FieldDef {
    FieldDef {
        key: key.to_string(),
        label: label.to_string(),
        tipo: "array".to_string(),
        requerido: false,
        descripcion: descripcion.map(|s| s.to_string()),
        placeholder: None,
        opciones: None,
        item_label: Some(item_label.to_string()),
        item_fields: Some(item_fields),
    }
}

fn object_field(
    key: &str,
    label: &str,
    item_fields: Vec<FieldDef>,
    descripcion: Option<&str>,
) -> FieldDef {
    FieldDef {
        key: key.to_string(),
        label: label.to_string(),
        tipo: "object".to_string(),
        requerido: false,
        descripcion: descripcion.map(|s| s.to_string()),
        placeholder: None,
        opciones: None,
        item_label: None,
        item_fields: Some(item_fields),
    }
}

/// Devuelve el schema declarativo de una colección a partir de su `ruta`.
pub fn schema_for(ruta: &str) -> Option<Vec<FieldDef>> {
    match ruta {
        "proyectos" => Some(proyectos_schema()),
        "casos-de-exito" => Some(casos_exito_schema()),
        "laboratorio" => Some(laboratorio_schema()),
        "poc" => Some(poc_schema()),
        "almaviva" => Some(almaviva_schema()),
        "xms" => Some(xms_schema()),
        _ => None,
    }
}

/// Lista todas las rutas de colecciones soportadas.
pub fn all_collections() -> &'static [&'static str] {
    &[
        "proyectos",
        "casos-de-exito",
        "laboratorio",
        "poc",
        "almaviva",
        "xms",
    ]
}

/// Valida un valor JSON contra el schema declarativo de una colección.
/// Devuelve `Err(mensaje)` si hay errores.
pub fn validate_data(
    ruta: &str,
    data: &serde_json::Value,
) -> Result<(), String> {
    let fields = match schema_for(ruta) {
        Some(f) => f,
        None => return Err(format!("Colección '{}' no soportada", ruta)),
    };

    if !data.is_object() {
        return Err("El item debe ser un objeto JSON".to_string());
    }
    let obj = data.as_object().unwrap();

    for f in fields.iter().filter(|f| f.requerido) {
        if !obj.contains_key(&f.key) || obj[&f.key].is_null() {
            return Err(format!("Campo requerido '{}' falta", f.label));
        }
        let v = &obj[&f.key];
        let is_empty = match v {
            serde_json::Value::String(s) => s.trim().is_empty(),
            serde_json::Value::Array(a) => a.is_empty(),
            _ => false,
        };
        if is_empty {
            return Err(format!("Campo requerido '{}' está vacío", f.label));
        }
    }

    // Validación específica por tipo
    if let Some(slug) = obj.get("slug").and_then(|v| v.as_str()) {
        if !is_valid_slug(slug) {
            return Err(format!(
                "El slug '{}' solo puede contener minúsculas, números y guiones",
                slug
            ));
        }
    }

    Ok(())
}

fn is_valid_slug(slug: &str) -> bool {
    !slug.is_empty()
        && slug.len() <= 200
        && slug
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
}

// ============================================================================
// Proyectos
// ============================================================================
fn proyectos_schema() -> Vec<FieldDef> {
    let estado_opts = vec![
        opt("Desplegado", "Desplegado"),
        opt("En desarrollo", "En desarrollo"),
        opt("Operativo", "Operativo"),
        opt("Operativo / En evolución", "Operativo / En evolución"),
        opt("Operativo / Demostración funcional", "Operativo / Demostración funcional"),
        opt("Implementado en Producción", "Implementado en Producción"),
        opt("Implementado en Pre-Producción", "Implementado en Pre-Producción"),
        opt("Video Demo", "Video Demo"),
        opt("En Producción", "En Producción"),
        opt("Pausado", "Pausado"),
        opt("Cancelado", "Cancelado"),
        opt("En preparación", "En preparación"),
    ];

    let tipo_opts = vec![opt("Interno", "Interno"), opt("Externo", "Externo")];

    let equipo_fields = vec![
        field("nombre", "Nombre", "text", true, None),
        field("rol", "Rol", "text", true, None),
    ];

    let video_fields = vec![
        select_field(
            "tipo",
            "Tipo",
            vec![
                opt("youtube", "YouTube"),
                opt("vimeo", "Vimeo"),
                opt("drive", "Google Drive"),
                opt("archivo", "Archivo local"),
                opt("mp4", "MP4 directo"),
            ],
            true,
            None,
        ),
        field("url", "URL", "url", true, None),
    ];

    let highlight_fields = vec![
        field("valor", "Valor", "text", true, None),
        field("etiqueta", "Etiqueta", "text", true, None),
        field("detalle", "Detalle", "text", false, None),
    ];

    vec![
        field("slug", "Slug (URL)", "slug", true, Some("Identificador único para la URL. Solo minúsculas, números y guiones.")),
        field("codigo", "Código", "text", false, Some("Código interno, ej. PRJ-009")),
        field("nombreComercial", "Nombre comercial", "text", true, None),
        field("nombreProyecto", "Nombre del proyecto", "text", false, None),
        select_field("tipo", "Tipo", tipo_opts, true, None),
        select_field("estado", "Estado", estado_opts, true, None),
        field("version", "Versión", "text", false, None),
        field("tipoSolucion", "Tipo de solución", "text", false, None),
        field("cliente", "Cliente", "text", false, None),
        field("descripcion", "Descripción corta", "textarea", true, None),
        field("descripcionLarga", "Descripción larga", "richtext", false, None),
        array_field("equipo", "Equipo", "Persona", equipo_fields, None),
        array_field("stack", "Stack tecnológico", "Tecnología", vec![
            field("value", "Tecnología", "text", true, None),
        ], Some("Una tecnología por item. Ej: Python, React, PostgreSQL.")),
        array_field("problemas", "Problemas", "Problema", vec![
            field("value", "Problema", "textarea", true, None),
        ], None),
        array_field("queHicimos", "Qué hicimos", "Actividad", vec![
            field("value", "Actividad", "textarea", true, None),
        ], None),
        array_field("resultados", "Resultados", "Resultado", vec![
            field("value", "Resultado", "textarea", true, None),
        ], None),
        array_field("highlights", "Highlights / Cifras clave", "Highlight", highlight_fields, None),
        object_field(
            "videoPromocional",
            "Video promocional",
            video_fields.clone(),
            None,
        ),
        object_field("videoTecnico", "Video técnico", video_fields, None),
        field("documentoDrive", "Documento Google Drive (URL)", "url", false, Some("Enlace de visualización de Google Docs o Drive")),
        field("documentacion", "Documentación (URL)", "url", false, None),
        field("urlProyecto", "URL del proyecto", "url", false, None),
        array_field("galeria", "Galería", "Imagen", vec![
            field("url", "URL imagen", "media", true, None),
            field("alt", "Texto alternativo", "text", false, None),
        ], None),
    ]
}

// ============================================================================
// Casos de éxito
// ============================================================================
fn casos_exito_schema() -> Vec<FieldDef> {
    let industria_opts = vec![
        opt("Minería", "Minería"),
        opt("Salud y Seguros", "Salud y Seguros"),
        opt("Transporte e Infraestructura Aeroportuaria", "Transporte e Infraestructura Aeroportuaria"),
        opt("Deporte y Tecnología (SportsTech)", "Deporte y Tecnología (SportsTech)"),
        opt("Tecnología y Construcción (ConTech)", "Tecnología y Construcción (ConTech)"),
        opt("Sector Público y Transporte", "Sector Público y Transporte"),
    ];

    let estado_opts = vec![
        opt("Implementado en Producción", "Implementado en Producción"),
        opt("Implementado en Pre-Producción", "Implementado en Pre-Producción"),
        opt("En desarrollo", "En desarrollo"),
        opt("Pausado", "Pausado"),
    ];

    vec![
        field("slug", "Slug (URL)", "slug", true, None),
        field("codigo", "Código", "text", false, None),
        field("nombreComercial", "Nombre comercial", "text", true, None),
        select_field("industria", "Industria", industria_opts, true, None),
        field("pais", "País", "text", false, None),
        select_field("estado", "Estado", estado_opts, true, None),
        field("plazo", "Plazo", "text", false, None),
        field("precio", "Precio", "text", false, None),
        field("cliente", "Cliente", "text", false, None),
        field("descripcion", "Descripción", "textarea", true, None),
        field("perfil", "Perfil del cliente", "richtext", false, None),
        field("alcance", "Alcance", "richtext", false, None),
        field("detalleTecnico", "Detalle técnico", "richtext", false, None),
        array_field("stack", "Stack", "Tecnología", vec![
            field("value", "Tecnología", "text", true, None),
        ], None),
    ]
}

// ============================================================================
// Laboratorio (Tivit Labs)
// ============================================================================
fn laboratorio_schema() -> Vec<FieldDef> {
    let categoria_opts = vec![
        opt("Producto", "Producto"),
        opt("Investigación", "Investigación"),
        opt("Framework", "Framework"),
        opt("Paper / Estudio", "Paper / Estudio"),
        opt("Herramienta", "Herramienta"),
    ];

    let autores_fields = vec![
        field("nombre", "Nombre", "text", true, None),
        field("rol", "Rol", "text", false, None),
        field("foto", "Foto", "media", false, None),
    ];

    let equipo_fields = vec![
        field("nombre", "Nombre", "text", true, None),
        field("rol", "Rol", "text", true, None),
    ];

    let ciclo_fields = vec![
        field("fase", "Fase (ej: 01)", "text", true, None),
        field("titulo", "Título de fase", "text", true, None),
        field("descripcion", "Descripción", "textarea", false, None),
        field("icono", "Ícono Lucide", "icon", false, None),
    ];

    vec![
        field("slug", "Slug (URL)", "slug", true, None),
        field("codigo", "Código", "text", false, None),
        field("nombreComercial", "Nombre comercial", "text", true, None),
        field("nombreProyecto", "Nombre del proyecto", "text", false, None),
        select_field("categoria", "Categoría", categoria_opts, false, None),
        field("estado", "Estado", "text", false, None),
        field("version", "Versión", "text", false, None),
        field("tipoSolucion", "Tipo de solución", "text", false, None),
        field("cliente", "Cliente", "text", false, None),
        field("descripcion", "Descripción corta", "textarea", true, None),
        field("descripcionLarga", "Descripción larga", "richtext", false, None),
        field("documentoDrive", "Documento Google Drive / Docs (URL)", "url", false, Some("Embebe un visor de documento en la ficha")),
        array_field("autores", "Autores (Investigación)", "Autor", autores_fields, None),
        array_field("equipo", "Equipo desarrollador", "Persona", equipo_fields, None),
        array_field("stack", "Stack", "Tecnología", vec![
            field("value", "Tecnología", "text", true, None),
        ], None),
        array_field("puntosClave", "Puntos clave", "Punto", vec![
            field("stat", "Valor", "text", true, None),
            field("etiqueta", "Etiqueta", "text", true, None),
            field("detalle", "Detalle", "text", false, None),
        ], None),
        array_field("ventajas", "Ventajas", "Ventaja", vec![
            field("titulo", "Título", "text", true, None),
            field("descripcion", "Descripción", "textarea", true, None),
            field("icono", "Ícono Lucide", "icon", false, None),
        ], None),
        array_field("cicloVida", "Ciclo de vida / Pipeline", "Fase", ciclo_fields, None),
        array_field("problemas", "Problemas a enfrentar", "Problema", vec![
            field("value", "Problema", "textarea", true, None),
        ], None),
        array_field("queHicimos", "Qué hicimos", "Actividad", vec![
            field("value", "Actividad", "textarea", true, None),
        ], None),
        array_field("resultados", "Resultados", "Resultado", vec![
            field("value", "Resultado", "textarea", true, None),
        ], None),
        object_field(
            "videoPromocional",
            "Video promocional",
            video_ref_fields(),
            None,
        ),
        object_field(
            "videoTecnico",
            "Video técnico",
            video_ref_fields(),
            None,
        ),
        array_field("galeria", "Galería", "Imagen", vec![
            field("url", "URL imagen", "media", true, None),
            field("alt", "Texto alternativo", "text", false, None),
        ], None),
        field("documentacion", "Documentación (URL)", "url", false, None),
        field("urlProyecto", "URL del proyecto", "url", false, None),
    ]
}

// ============================================================================
// PoC
// ============================================================================
fn poc_schema() -> Vec<FieldDef> {
    let tipo_opts = vec![opt("Interno", "Interno"), opt("Externo", "Externo")];

    let highlight_fields = vec![
        field("valor", "Valor", "text", true, None),
        field("etiqueta", "Etiqueta", "text", true, None),
        field("detalle", "Detalle", "text", false, None),
    ];

    vec![
        field("slug", "Slug (URL)", "slug", true, None),
        field("codigo", "Código", "text", false, None),
        field("nombreComercial", "Nombre comercial", "text", true, None),
        field("nombreProyecto", "Nombre del proyecto", "text", false, None),
        select_field("tipo", "Tipo", tipo_opts, true, None),
        field("estado", "Estado", "text", true, None),
        field("version", "Versión", "text", false, None),
        field("tipoSolucion", "Tipo de solución", "text", false, None),
        field("cliente", "Cliente", "text", false, None),
        field("descripcion", "Descripción", "textarea", true, None),
        field("descripcionLarga", "Descripción larga", "richtext", false, None),
        array_field("equipo", "Equipo", "Persona", vec![
            field("nombre", "Nombre", "text", true, None),
            field("rol", "Rol", "text", true, None),
        ], None),
        array_field("stack", "Stack", "Tecnología", vec![
            field("value", "Tecnología", "text", true, None),
        ], None),
        array_field("highlights", "Highlights / Cifras clave", "Highlight", highlight_fields, None),
        array_field("problemas", "Problemas", "Problema", vec![
            field("value", "Problema", "textarea", true, None),
        ], None),
        array_field("queHicimos", "Qué hicimos", "Actividad", vec![
            field("value", "Actividad", "textarea", true, None),
        ], None),
        array_field("resultados", "Resultados", "Resultado", vec![
            field("value", "Resultado", "textarea", true, None),
        ], None),
        object_field(
            "videoPromocional",
            "Video promocional",
            video_ref_fields(),
            None,
        ),
        object_field(
            "videoTecnico",
            "Video técnico",
            video_ref_fields(),
            None,
        ),
        field("documentoDrive", "Documento Google Drive (URL)", "url", false, None),
        array_field("galeria", "Galería", "Imagen", vec![
            field("url", "URL imagen", "media", true, None),
            field("alt", "Texto alternativo", "text", false, None),
        ], None),
        field("documentacion", "Documentación (URL)", "url", false, None),
        field("urlProyecto", "URL del proyecto", "url", false, None),
    ]
}

fn video_ref_fields() -> Vec<FieldDef> {
    vec![
        select_field(
            "tipo",
            "Tipo",
            vec![
                opt("youtube", "YouTube"),
                opt("vimeo", "Vimeo"),
                opt("drive", "Google Drive"),
                opt("archivo", "Archivo local"),
                opt("mp4", "MP4 directo"),
            ],
            true,
            None,
        ),
        field("url", "URL", "url", true, None),
    ]
}

// ============================================================================
// Almaviva
// ============================================================================
fn almaviva_schema() -> Vec<FieldDef> {
    let categoria_opts = vec![
        opt("Documental y Conocimiento", "Documental y Conocimiento"),
        opt("Salud y Clínica", "Salud y Clínica"),
        opt("Conversacional y Atención al Cliente", "Conversacional y Atención al Cliente"),
        opt("Voz y Multimodal", "Voz y Multimodal"),
        opt("Analítica, Predicción y Riesgo", "Analítica, Predicción y Riesgo"),
        opt("Asistencia en Campo y Mantenimiento", "Asistencia en Campo y Mantenimiento"),
    ];

    vec![
        field("slug", "Slug (URL)", "slug", true, None),
        field("codigo", "Código", "text", false, None),
        field("nombreComercial", "Nombre comercial", "text", true, None),
        select_field("categoria", "Categoría", categoria_opts, true, None),
        field("tipo", "Tipo", "text", false, None),
        field("estado", "Estado", "text", false, None),
        field("descripcion", "Descripción", "textarea", true, None),
        field("descripcionLarga", "Descripción larga", "richtext", false, None),
        field("clientesReferencia", "Clientes de referencia", "textarea", false, None),
        field("gtm", "Go-to-market", "richtext", false, None),
        field("prerrequisitos", "Prerrequisitos", "richtext", false, None),
        array_field("procesos", "Procesos", "Proceso", vec![
            field("value", "Proceso", "textarea", true, None),
        ], None),
        array_field("resultados", "Resultados", "Resultado", vec![
            field("value", "Resultado", "textarea", true, None),
        ], None),
        field("flexibilidadIA", "Flexibilidad IA", "richtext", false, None),
        field("soberania", "Soberanía", "richtext", false, None),
        field("herramientas", "Herramientas", "richtext", false, None),
        field("insumos", "Insumos", "richtext", false, None),
        field("alcance", "Alcance", "richtext", false, None),
        field("framework", "Framework", "richtext", false, None),
        field("cronogramaRiesgos", "Cronograma y riesgos", "richtext", false, None),
        field("servicios", "Servicios", "richtext", false, None),
        field("licenciamiento", "Licenciamiento", "richtext", false, None),
        field("contenidoExtra", "Contenido extra", "richtext", false, None),
        object_field(
            "videoPromocional",
            "Video promocional",
            video_ref_fields(),
            None,
        ),
        array_field("industrias", "Industrias", "Industria", vec![
            field("value", "Industria", "text", true, None),
        ], None),
        array_field("autores", "Autores", "Autor", vec![
            field("nombre", "Nombre", "text", true, None),
            field("rol", "Rol", "text", false, None),
        ], None),
        array_field("clientes", "Clientes", "Cliente", vec![
            field("value", "Cliente", "text", true, None),
        ], None),
    ]
}

// ============================================================================
// XMS
// ============================================================================
fn xms_schema() -> Vec<FieldDef> {
    let tipo_agente_opts = vec![
        opt("especifico", "Específico"),
        opt("general", "General"),
    ];

    vec![
        field("slug", "Slug (URL)", "slug", true, None),
        field("codigo", "Código", "text", false, None),
        field("nombreComercial", "Nombre comercial", "text", true, None),
        select_field("tipoAgente", "Tipo de agente", tipo_agente_opts, true, None),
        field("categoria", "Categoría", "text", false, None),
        field("proceso", "Proceso", "text", false, None),
        field("cliente", "Cliente", "text", false, None),
        field("precio", "Precio", "text", false, None),
        field("tiempo", "Tiempo", "text", false, None),
        field("objetivo", "Objetivo", "textarea", false, None),
        field("descripcion", "Descripción", "textarea", true, None),
        array_field("funcionalidades", "Funcionalidades", "Funcionalidad", vec![
            field("value", "Funcionalidad", "text", true, None),
        ], None),
        field("flujo", "Flujo", "text", false, None),
        array_field("beneficios", "Beneficios", "Beneficio", vec![
            field("value", "Beneficio", "text", true, None),
        ], None),
        array_field("stack", "Stack", "Tecnología", vec![
            field("value", "Tecnología", "text", true, None),
        ], None),
        array_field("integraciones", "Integraciones", "Integración", vec![
            field("value", "Integración", "text", true, None),
        ], None),
    ]
}
