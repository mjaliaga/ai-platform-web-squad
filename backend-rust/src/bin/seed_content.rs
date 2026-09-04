//! Seed inicial: migra los items de los archivos estáticos del frontend a la
//! base de datos del CMS. Se ejecuta como binario:
//!
//! ```bash
//! cargo run --bin seed_content
//! ```
//!
//! Idempotente: si un item con el mismo (collection, slug) ya existe, lo
//! actualiza solo si `--force` se pasa.

use anyhow::{Context, Result};
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::SqlitePool;
use std::path::Path;
use std::str::FromStr;
use uuid::Uuid;

#[tokio::main]
async fn main() -> Result<()> {
    let database_url =
        std::env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite://data/portal.db".to_string());

    let force = std::env::args().any(|a| a == "--force");

    println!("→ Conectando a {database_url}");
    // Asegurar que el directorio de la BD existe (necesario tras `down -v`)
    if let Some(path) = database_url.strip_prefix("sqlite://") {
        if let Some(dir) = Path::new(path).parent() {
            if !dir.as_os_str().is_empty() {
                std::fs::create_dir_all(dir).ok();
            }
        }
    }
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(
            SqliteConnectOptions::from_str(&database_url)?
                .create_if_missing(true)
                .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
                .foreign_keys(true),
        )
        .await
        .context("create pool")?;

    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    let data_dir =
        std::env::var("SEED_DATA_DIR").unwrap_or_else(|_| "../frontend/src/data".to_string());

    let items_json = format!("{}/items.json", data_dir);
    let casos_exito = format!("{}/casosExito.js", data_dir);
    let almaviva = format!("{}/almaviva.js", data_dir);
    let xms = format!("{}/xms.js", data_dir);
    let poc = format!("{}/poc.js", data_dir);

    let mut total = 0;
    total += seed_json_file(&pool, &items_json, "laboratorio", &now, force).await?;
    total += seed_json_file_projects(&pool, &items_json, &now, force).await?;
    total += seed_js_module(&pool, &casos_exito, "casos-de-exito", &now, force).await?;
    total += seed_js_module(&pool, &almaviva, "almaviva", &now, force).await?;
    total += seed_js_module(&pool, &xms, "xms", &now, force).await?;
    total += seed_js_module(&pool, &poc, "poc", &now, force).await?;

    println!("\n✓ Seed completo: {total} items insertados/actualizados");
    Ok(())
}

async fn seed_json_file(
    pool: &SqlitePool,
    path: &str,
    collection: &str,
    now: &str,
    force: bool,
) -> Result<usize> {
    let path = std::path::Path::new(path);
    if !path.exists() {
        println!("  ⚠ Archivo no encontrado: {}", path.display());
        return Ok(0);
    }

    let content =
        std::fs::read_to_string(path).with_context(|| format!("leyendo {}", path.display()))?;
    let items: Vec<serde_json::Value> =
        serde_json::from_str(&content).with_context(|| format!("parseando {}", path.display()))?;

    let mut count = 0;
    for item in items {
        let slug = match item.get("slug").and_then(|v| v.as_str()) {
            Some(s) => s.to_string(),
            None => continue,
        };
        let item_collection = item.get("coleccion").and_then(|v| v.as_str()).unwrap_or("");
        if item_collection != collection {
            continue;
        }

        if upsert(pool, collection, &slug, &item, now, force).await? {
            count += 1;
        }
    }
    println!("  → {collection}: {count} items");
    Ok(count)
}

async fn seed_json_file_projects(
    pool: &SqlitePool,
    path: &str,
    now: &str,
    force: bool,
) -> Result<usize> {
    if std::env::var("SKIP_SEED_PROJECTS").is_ok() {
        println!("  → proyectos skip (SKIP_SEED_PROJECTS set)");
        return Ok(0);
    }
    let path = std::path::Path::new(path);
    if !path.exists() {
        println!("  ⚠ Archivo no encontrado: {}", path.display());
        return Ok(0);
    }
    let content =
        std::fs::read_to_string(path).with_context(|| format!("leyendo {}", path.display()))?;
    let items: Vec<serde_json::Value> =
        serde_json::from_str(&content).with_context(|| format!("parseando {}", path.display()))?;
    let mut count = 0;
    for item in items {
        let slug = match item.get("slug").and_then(|v| v.as_str()) {
            Some(s) => s.to_string(),
            None => continue,
        };
        let coleccion = item.get("coleccion").and_then(|v| v.as_str()).unwrap_or("");
        if coleccion != "proyectos" {
            continue;
        }
        // Extraer campos para tabla `projects`
        let codigo = item.get("codigo").and_then(|v| v.as_str()).unwrap_or("");
        let nombre_comercial = item
            .get("nombreComercial")
            .and_then(|v| v.as_str())
            .unwrap_or(&slug);
        let descripcion = item
            .get("descripcion")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        let descripcion_larga = item
            .get("descripcionLarga")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        let tipo = item
            .get("tipo")
            .and_then(|v| v.as_str())
            .unwrap_or("Interno");
        let version = item
            .get("version")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        let tipo_solucion = item
            .get("tipoSolucion")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        let cliente = item
            .get("cliente")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        let estado = item
            .get("estado")
            .and_then(|v| v.as_str())
            .unwrap_or("Operativo");
        let reservado = item
            .get("reservado")
            .and_then(|v| v.as_bool())
            .unwrap_or(false) as i64;
        let video_placeholder = item
            .get("videoPlaceholder")
            .and_then(|v| v.as_bool())
            .unwrap_or(false) as i64;
        let equipo = serde_json::to_string(
            item.get("equipo")
                .unwrap_or(&serde_json::Value::Array(vec![])),
        )
        .unwrap_or("[]".into());
        let stack = serde_json::to_string(
            item.get("stack")
                .unwrap_or(&serde_json::Value::Array(vec![])),
        )
        .unwrap_or("[]".into());
        let problemas = serde_json::to_string(
            item.get("problemas")
                .unwrap_or(&serde_json::Value::Array(vec![])),
        )
        .unwrap_or("[]".into());
        let que_hicimos = serde_json::to_string(
            item.get("queHicimos")
                .unwrap_or(&serde_json::Value::Array(vec![])),
        )
        .unwrap_or("[]".into());
        let resultados = serde_json::to_string(
            item.get("resultados")
                .unwrap_or(&serde_json::Value::Array(vec![])),
        )
        .unwrap_or("[]".into());
        let highlights = serde_json::to_string(
            item.get("highlights")
                .unwrap_or(&serde_json::Value::Array(vec![])),
        )
        .unwrap_or("[]".into());
        let galeria = serde_json::to_string(
            item.get("galeria")
                .unwrap_or(&serde_json::Value::Array(vec![])),
        )
        .unwrap_or("[]".into());
        let video_promocional = item
            .get("videoPromocional")
            .map(|v| serde_json::to_string(v).unwrap_or("null".into()));
        let video_tecnico = item
            .get("videoTecnico")
            .map(|v| serde_json::to_string(v).unwrap_or("null".into()));
        let documento_drive = item
            .get("documentoDrive")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        let documentacion = item
            .get("documentacion")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        let url_proyecto = item
            .get("urlProyecto")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        let existing: Option<(String, String, i64, String)> = sqlx::query_as("SELECT id, stage, published, status FROM projects WHERE slug = ? AND deleted_at IS NULL")
            .bind(&slug)
            .fetch_optional(pool)
            .await?;
        if let Some((existing_id, existing_stage, existing_published, existing_status)) = existing {
            if force {
                // Respetar vaciado manual: si el usuario dejó stage en blanco o archived/published=0, no sobreescribir (todo en 0)
                if existing_stage.is_empty()
                    || existing_published == 0
                    || existing_status == "archived"
                {
                    // No actualizar, mantener en blanco para que siga en 0
                    continue;
                }
                sqlx::query(
                    "UPDATE projects SET code=?, name=?, description=?, sector=?, status=?, \
                     color=?, slug=?, published=?, reservado=?, tipo=?, version=?, tipo_solucion=?, cliente=?, \
                     nombre_comercial=?, descripcion_larga=?, equipo=?, stack=?, problemas=?, que_hicimos=?, resultados=?, \
                     highlights=?, galeria=?, video_promocional=?, video_tecnico=?, documento_drive=?, documentacion=?, \
                     url_proyecto=?, video_placeholder=?, updated_at=? WHERE id=?"
                )
                .bind(codigo).bind(nombre_comercial).bind(descripcion).bind("Proyecto").bind("active").bind("#9333ea").bind(&slug).bind(1).bind(reservado)
                .bind(tipo).bind(&version).bind(&tipo_solucion).bind(&cliente)
                .bind(nombre_comercial).bind(&descripcion_larga).bind(&equipo).bind(&stack).bind(&problemas).bind(&que_hicimos).bind(&resultados)
                .bind(&highlights).bind(&galeria).bind(&video_promocional).bind(&video_tecnico).bind(&documento_drive).bind(&documentacion)
                .bind(&url_proyecto).bind(video_placeholder).bind(now).bind(&existing_id)
                .execute(pool).await?;
                println!("    ↻ proyecto {} actualizado", slug);
                count += 1;
            }
            continue;
        }
        let id = Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT INTO projects (id, slug, code, name, description, sector, status, published, reservado, \
             tipo, version, tipo_solucion, cliente, nombre_comercial, descripcion_larga, equipo, stack, problemas, \
             que_hicimos, resultados, highlights, galeria, video_promocional, video_tecnico, documento_drive, \
             documentacion, url_proyecto, video_placeholder, color, created_at, updated_at) \
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&id).bind(&slug).bind(codigo).bind(nombre_comercial).bind(descripcion).bind("Proyecto").bind("active").bind(1).bind(reservado)
        .bind(tipo).bind(&version).bind(&tipo_solucion).bind(&cliente)
        .bind(nombre_comercial).bind(&descripcion_larga).bind(&equipo).bind(&stack).bind(&problemas).bind(&que_hicimos).bind(&resultados)
        .bind(&highlights).bind(&galeria).bind(&video_promocional).bind(&video_tecnico).bind(&documento_drive).bind(&documentacion)
        .bind(&url_proyecto).bind(video_placeholder).bind("#9333ea").bind(now).bind(now)
        .execute(pool).await?;
        println!("    + proyecto {slug}");
        count += 1;
        let _ = estado; // reservado para futuro uso de status
    }
    println!("  → proyectos (projects table): {count} items");
    Ok(count)
}

async fn seed_js_module(
    pool: &SqlitePool,
    path: &str,
    collection: &str,
    now: &str,
    force: bool,
) -> Result<usize> {
    let path = Path::new(path);
    if !path.exists() {
        println!("  ⚠ Archivo no encontrado: {}", path.display());
        return Ok(0);
    }

    let content =
        std::fs::read_to_string(path).with_context(|| format!("leyendo {}", path.display()))?;

    let var_name = match collection {
        "casos-de-exito" => "casosExito",
        "almaviva" => "productosAlmaviva",
        "xms" => "agentesXms",
        "poc" => "pocs",
        _ => return Ok(0),
    };

    // Primero: inline las constantes en todo el archivo (no solo en el array)
    let content_with_inlined = inline_constants_simple(&content);

    // Segundo: extraer el array a partir del nombre de la variable
    let patterns = [
        format!("export const {} = [", var_name),
        format!("const {} = [", var_name),
    ];
    let mut start_pos = None;
    for pat in &patterns {
        if let Some(idx) = content_with_inlined.find(pat.as_str()) {
            start_pos = Some(idx + pat.len() - 1); // apunta al `[`
            break;
        }
    }
    let start = match start_pos {
        Some(s) => s,
        None => {
            println!("  ⚠ No se encontró '{}' en {}", var_name, path.display());
            return Ok(0);
        }
    };

    // Extraer balanceando brackets
    let chars: Vec<char> = content_with_inlined[start..].chars().collect();
    let mut depth = 0;
    let mut end = chars.len();
    for (i, &c) in chars.iter().enumerate() {
        if c == '[' {
            depth += 1;
        } else if c == ']' {
            depth -= 1;
            if depth == 0 {
                end = i + 1;
                break;
            }
        }
    }
    let raw: String = chars[..end].iter().collect();
    let json_text = js_object_to_json(&raw);
    let json_text = strip_trailing_commas(&json_text);
    let json_text = normalize_string_delimiters(&json_text);
    let items: Vec<serde_json::Value> = serde_json::from_str(&json_text)
        .with_context(|| format!("parseando array en {}", path.display()))?;

    let mut count = 0;
    for item in items {
        let slug = match item.get("slug").and_then(|v| v.as_str()) {
            Some(s) => s.to_string(),
            None => continue,
        };
        if upsert(pool, collection, &slug, &item, now, force).await? {
            count += 1;
        }
    }
    println!("  → {collection}: {count} items");
    Ok(count)
}

fn inline_constants_simple(text: &str) -> String {
    let mut out = text.to_string();

    // Encontrar todas las declaraciones `const NAME = value;`
    let mut i = 0;
    let chars: Vec<char> = out.chars().collect();
    let mut constants: Vec<(String, String)> = Vec::new();

    while i < chars.len() {
        if i + 6 <= chars.len() && chars[i..i + 6].iter().collect::<String>() == "const " {
            let name_start = i + 6;
            let mut name_end = name_start;
            while name_end < chars.len() {
                let c = chars[name_end];
                if c.is_alphanumeric() || c == '_' {
                    name_end += 1;
                } else {
                    break;
                }
            }
            if name_end > name_start {
                let name: String = chars[name_start..name_end].iter().collect();
                let mut j = name_end;
                while j < chars.len() && chars[j].is_whitespace() {
                    j += 1;
                }
                if j < chars.len() && chars[j] == '=' {
                    j += 1;
                    while j < chars.len() && chars[j].is_whitespace() {
                        j += 1;
                    }
                    let value_start = j;
                    let c = chars[j];
                    if c == '"' || c == '\'' {
                        let quote = c;
                        j += 1;
                        while j < chars.len() && chars[j] != quote {
                            if chars[j] == '\\' && j + 1 < chars.len() {
                                j += 2;
                            } else {
                                j += 1;
                            }
                        }
                        if j < chars.len() {
                            j += 1;
                        }
                    } else if c.is_ascii_digit() || c == '-' {
                        while j < chars.len() && (chars[j].is_ascii_digit() || chars[j] == '.') {
                            j += 1;
                        }
                    } else if chars[j..].starts_with(&['n', 'u', 'l', 'l'])
                        || chars[j..].starts_with(&['t', 'r', 'u', 'e'])
                        || chars[j..].starts_with(&['f', 'a', 'l', 's', 'e'])
                    {
                        let kw: String = chars[j..j + 5.min(chars.len() - j)].iter().collect();
                        if kw.starts_with("null") || kw.starts_with("true") {
                            j += 4;
                        } else if kw.starts_with("false") {
                            j += 5;
                        }
                    } else if c == '[' {
                        let mut depth = 1;
                        j += 1;
                        while j < chars.len() && depth > 0 {
                            if chars[j] == '[' {
                                depth += 1;
                            } else if chars[j] == ']' {
                                depth -= 1;
                            }
                            if depth == 0 {
                                break;
                            }
                            j += 1;
                        }
                        if j < chars.len() {
                            j += 1;
                        }
                    }

                    let value: String = chars[value_start..j].iter().collect();
                    constants.push((name, value));
                    i = j;
                    continue;
                }
            }
        }
        i += 1;
    }

    // Ordenar por longitud descendente
    constants.sort_by_key(|(n, _)| std::cmp::Reverse(n.len()));

    for (name, value) in &constants {
        // NO reemplazar la declaración `const NAME = ...` (donde NAME aparece como identificador de la izquierda)
        let mut result = String::new();
        let mut j = 0;
        let out_chars: Vec<char> = out.chars().collect();
        while j < out_chars.len() {
            let pos = find_word(&out_chars[j..], name);
            if pos.is_none() {
                result.extend(out_chars[j..].iter());
                break;
            }
            let p = pos.unwrap();
            let before_ok = p == 0 || {
                let c = out_chars[j + p - 1];
                !(c.is_alphanumeric() || c == '_' || c == '$')
            };
            let after_pos = j + p + name.len();
            let mut k = after_pos;
            while k < out_chars.len() && out_chars[k].is_whitespace() {
                k += 1;
            }
            // No reemplazar si va seguido de `=` (es la declaración `const NAME = ...`)
            // No reemplazar si va seguido de `:` (es una clave de objeto)
            let after_ok =
                after_pos >= out_chars.len() || !(out_chars[k] == '=' || out_chars[k] == ':');

            result.extend(out_chars[j..j + p].iter());
            if before_ok && after_ok {
                result.push_str(value);
            } else {
                result.push_str(name);
            }
            j = after_pos;
        }
        out = result;
    }

    out
}

/// Encuentra la posición de `word` en `chars` que sea word boundary.
fn find_word(chars: &[char], word: &str) -> Option<usize> {
    let word_chars: Vec<char> = word.chars().collect();
    if word_chars.is_empty() {
        return None;
    }
    for i in 0..=chars.len() - word_chars.len() {
        if chars[i..i + word_chars.len()] == word_chars[..] {
            let before_ok = i == 0 || !is_word_char(chars[i - 1]);
            let after_pos = i + word_chars.len();
            let after_ok = after_pos >= chars.len() || !is_word_char(chars[after_pos]);
            if before_ok && after_ok {
                return Some(i);
            }
        }
    }
    None
}

fn is_word_char(c: char) -> bool {
    c.is_alphanumeric() || c == '_' || c == '$'
}

/// Convierte un objeto/array literal de JS (con claves sin comillas y strings
/// con comillas dobles o backticks) en JSON estricto. Solo soporta el subset
/// que usan nuestros archivos de contenido estático:
/// - `clave: valor` → `"clave": valor`
/// - `clave: 'valor'` → `"clave": "valor"`
/// - `clave: \`texto\`` → `"clave": "texto\n..."` (template literal sin interpolaciones)
/// - Comentarios `//` y `/* */` se eliminan
/// - Comas colgantes al final de objetos/arrays se eliminan
fn js_object_to_json(text: &str) -> String {
    let mut out = String::with_capacity(text.len() + 32);
    let chars: Vec<char> = text.chars().collect();
    let mut i = 0;

    while i < chars.len() {
        let c = chars[i];

        // Comentario de línea
        if c == '/' && i + 1 < chars.len() && chars[i + 1] == '/' {
            while i < chars.len() && chars[i] != '\n' {
                i += 1;
            }
            continue;
        }
        // Comentario de bloque
        if c == '/' && i + 1 < chars.len() && chars[i + 1] == '*' {
            i += 2;
            while i + 1 < chars.len() && !(chars[i] == '*' && chars[i + 1] == '/') {
                i += 1;
            }
            i += 2;
            continue;
        }
        // String con comillas dobles
        if c == '"' {
            out.push('"');
            i += 1;
            while i < chars.len() {
                let ch = chars[i];
                if ch == '\\' && i + 1 < chars.len() {
                    out.push(ch);
                    out.push(chars[i + 1]);
                    i += 2;
                    continue;
                }
                if ch == '"' {
                    out.push('"');
                    i += 1;
                    break;
                }
                out.push(ch);
                i += 1;
            }
            continue;
        }
        // String con comillas simples
        if c == '\'' {
            out.push('"');
            i += 1;
            while i < chars.len() {
                let ch = chars[i];
                if ch == '\\' && i + 1 < chars.len() {
                    out.push(ch);
                    out.push(chars[i + 1]);
                    i += 2;
                    continue;
                }
                if ch == '\'' {
                    out.push('"');
                    i += 1;
                    break;
                }
                // Escapar comillas dobles internas para que sean JSON válido
                if ch == '"' {
                    out.push('\\');
                    out.push('"');
                    i += 1;
                    continue;
                }
                out.push(ch);
                i += 1;
            }
            continue;
        }
        // Template literal `...` - sin interpolaciones (las ${} las tratamos como texto)
        if c == '`' {
            out.push('"');
            i += 1;
            while i < chars.len() {
                let ch = chars[i];
                if ch == '\\' && i + 1 < chars.len() {
                    let next = chars[i + 1];
                    match next {
                        'n' => {
                            out.push_str("\\n");
                            i += 2;
                        }
                        't' => {
                            out.push_str("\\t");
                            i += 2;
                        }
                        'r' => {
                            out.push_str("\\r");
                            i += 2;
                        }
                        '\\' => {
                            out.push_str("\\\\");
                            i += 2;
                        }
                        '`' => {
                            out.push('`');
                            i += 2;
                        }
                        '$' => {
                            out.push('$');
                            i += 2;
                        }
                        _ => {
                            out.push(ch);
                            out.push(next);
                            i += 2;
                        }
                    }
                    continue;
                }
                if ch == '`' {
                    out.push('"');
                    i += 1;
                    break;
                }
                if ch == '\n' {
                    out.push_str("\\n");
                } else {
                    out.push(ch);
                }
                i += 1;
            }
            continue;
        }
        // Identificador como clave (siguiente es ':')
        if c.is_alphabetic() || c == '_' || c == '$' {
            let start = i;
            while i < chars.len() {
                let ch = chars[i];
                if !(ch.is_alphanumeric() || ch == '_' || ch == '$') {
                    break;
                }
                i += 1;
            }
            let ident: String = chars[start..i].iter().collect();
            // Detectar si es una clave (siguiente no-whitespace es ':')
            let mut j = i;
            while j < chars.len() && chars[j].is_whitespace() {
                j += 1;
            }
            if j < chars.len() && chars[j] == ':' {
                out.push('"');
                out.push_str(&ident);
                out.push('"');
            } else {
                out.push_str(&ident);
            }
            continue;
        }
        out.push(c);
        i += 1;
    }

    // Eliminar trailing commas (`,` seguido de cierre `}` o `]`)
    let out_chars: Vec<char> = out.chars().collect();
    let mut final_str = String::with_capacity(out.len());
    let mut skip_next = false;
    for i in 0..out_chars.len() {
        let ch = out_chars[i];
        if skip_next && ch == ',' {
            skip_next = false;
            continue;
        }
        skip_next = false;
        if ch == ',' && i + 1 < out_chars.len() {
            let mut j = i + 1;
            while j < out_chars.len() && out_chars[j].is_whitespace() {
                j += 1;
            }
            if j < out_chars.len() && (out_chars[j] == '}' || out_chars[j] == ']') {
                skip_next = true;
                continue;
            }
        }
        final_str.push(ch);
    }

    final_str
}

/// Elimina comas colgantes `,` seguidas de `}` o `]` (con whitespace opcional).
fn strip_trailing_commas(text: &str) -> String {
    let chars: Vec<char> = text.chars().collect();
    let mut out = String::with_capacity(text.len());
    let mut i = 0;
    while i < chars.len() {
        let ch = chars[i];
        if ch == ',' {
            // Mirar si el siguiente no-whitespace es `}` o `]`
            let mut j = i + 1;
            while j < chars.len() && chars[j].is_whitespace() {
                j += 1;
            }
            if j < chars.len() && (chars[j] == '}' || chars[j] == ']') {
                // Skip esta coma
                i += 1;
                continue;
            }
        }
        out.push(ch);
        i += 1;
    }
    out
}

/// Convierte strings delimitados por comillas simples `'` a comillas dobles `"`.
/// Esto solo se aplica fuera de strings ya delimitados por `"`.
fn normalize_string_delimiters(text: &str) -> String {
    let chars: Vec<char> = text.chars().collect();
    let mut out = String::with_capacity(text.len());
    let mut i = 0;
    while i < chars.len() {
        let ch = chars[i];
        // Si estamos dentro de un string "...", copiar tal cual hasta cerrar
        if ch == '"' {
            out.push('"');
            i += 1;
            while i < chars.len() {
                let c = chars[i];
                if c == '\\' && i + 1 < chars.len() {
                    out.push(c);
                    out.push(chars[i + 1]);
                    i += 2;
                    continue;
                }
                out.push(c);
                if c == '"' {
                    i += 1;
                    break;
                }
                i += 1;
            }
            continue;
        }
        // Si encontramos una comilla simple suelta, reemplazarla por doble
        if ch == '\'' {
            out.push('"');
            i += 1;
            while i < chars.len() {
                let c = chars[i];
                if c == '\\' && i + 1 < chars.len() {
                    out.push(c);
                    out.push(chars[i + 1]);
                    i += 2;
                    continue;
                }
                if c == '\'' {
                    out.push('"');
                    i += 1;
                    break;
                }
                out.push(c);
                i += 1;
            }
            continue;
        }
        out.push(ch);
        i += 1;
    }
    out
}

async fn upsert(
    pool: &SqlitePool,
    collection: &str,
    slug: &str,
    item: &serde_json::Value,
    now: &str,
    force: bool,
) -> Result<bool> {
    let data_str = serde_json::to_string(item)?;
    let id = Uuid::new_v4().to_string();

    let existing: Option<(String,)> =
        sqlx::query_as("SELECT id FROM content_items WHERE collection = ? AND slug = ?")
            .bind(collection)
            .bind(slug)
            .fetch_optional(pool)
            .await?;

    if let Some((existing_id,)) = existing {
        if force {
            sqlx::query(
                "UPDATE content_items SET data = ?, published = 1, updated_at = ? WHERE id = ?",
            )
            .bind(&data_str)
            .bind(now)
            .bind(&existing_id)
            .execute(pool)
            .await?;
            println!("    ↻ {} actualizado", slug);
            return Ok(true);
        }
        return Ok(false);
    }

    sqlx::query(
        "INSERT INTO content_items (id, collection, slug, data, published, created_by, updated_by, created_at, updated_at) \
         VALUES (?, ?, ?, ?, 1, NULL, NULL, ?, ?)",
    )
    .bind(&id)
    .bind(collection)
    .bind(slug)
    .bind(&data_str)
    .bind(now)
    .bind(now)
    .execute(pool)
    .await?;
    println!("    + {slug}");
    Ok(true)
}
