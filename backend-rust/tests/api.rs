use axum::body::{Body, Bytes};
use axum::http::{header, Request, StatusCode};
use http_body_util::BodyExt;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use tower::util::ServiceExt;

use tivit_portal_backend::{build_router, db, AppState};

const ADMIN_EMAIL: &str = "admin-test@tivit.com";
const ADMIN_PASSWORD: &str = "testpass12345";

static COUNTER: AtomicUsize = AtomicUsize::new(0);
static ENV_SET: std::sync::Once = std::sync::Once::new();

async fn setup() -> (axum::Router, String) {
    let n = COUNTER.fetch_add(1, Ordering::SeqCst);
    let upload_dir =
        std::env::temp_dir().join(format!("tivit_test_uploads_{}", std::process::id()));
    std::fs::create_dir_all(&upload_dir).ok();

    ENV_SET.call_once(|| {
        std::env::set_var("SEED_ADMIN_EMAIL", ADMIN_EMAIL);
        std::env::set_var("SEED_ADMIN_PASSWORD", ADMIN_PASSWORD);
        std::env::set_var("SEED_ADMIN_NAME", "Admin Test");
        std::env::set_var("UPLOAD_DIR", upload_dir.to_str().unwrap());
        tivit_portal_backend::middleware::csrf::disable_csrf_for_testing();
    });

    let db_path = std::env::temp_dir().join(format!("tivit_test_{}_{}.db", std::process::id(), n));
    let _ = std::fs::remove_file(&db_path);
    let _ = std::fs::remove_file(format!("{}-wal", db_path.display()));
    let _ = std::fs::remove_file(format!("{}-shm", db_path.display()));

    let database_url = format!("sqlite://{}", db_path.display());
    let pool = db::create_pool(&database_url).await.unwrap();
    db::run_migrations(&pool).await.unwrap();
    db::seed_admin(&pool).await.unwrap();

    let rate_limiter = tivit_portal_backend::ratelimit_redis::create_rate_limiter(
        None,
        std::time::Duration::from_secs(15 * 60),
        10,
    )
    .await;

    let state = Arc::new(AppState {
        db: pool,
        jwt_secret: "test-secret-for-testing-only-do-not-use-in-prod-please-32".to_string(),
        rate_limiter,
    });
    let router = build_router(state).await;
    (router, db_path.display().to_string())
}

async fn send(router: &axum::Router, req: Request<Body>) -> (StatusCode, Bytes) {
    let res = router.clone().oneshot(req).await.unwrap();
    let status = res.status();
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    (status, bytes)
}

fn json_bytes(bytes: &Bytes) -> serde_json::Value {
    serde_json::from_slice(bytes).unwrap_or(serde_json::Value::Null)
}

async fn login(router: &axum::Router, email: &str, password: &str) -> String {
    let body = format!(r#"{{"email":"{email}","password":"{password}"}}"#);
    let (status, _) = send(
        router,
        Request::builder()
            .method("POST")
            .uri("/api/auth/login")
            .header("content-type", "application/json")
            .body(Body::from(body))
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::OK, "login debería funcionar");

    let res = router
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/auth/login")
                .header("content-type", "application/json")
                .body(Body::from(format!(
                    r#"{{"email":"{email}","password":"{password}"}}"#
                )))
                .unwrap(),
        )
        .await
        .unwrap();
    let auth_cookie = res
        .headers()
        .get(header::SET_COOKIE)
        .unwrap()
        .to_str()
        .unwrap()
        .split(';')
        .next()
        .unwrap()
        .to_string();

    format!("{}; csrf_token={}", auth_cookie, TEST_CSRF_TOKEN)
}

fn authed_get(uri: &str, token: &str) -> Request<Body> {
    Request::builder()
        .method("GET")
        .uri(uri)
        .header("cookie", token)
        .body(Body::empty())
        .unwrap()
}

async fn get_json(
    router: &axum::Router,
    uri: &str,
    token: &str,
) -> (StatusCode, serde_json::Value) {
    let (status, bytes) = send(router, authed_get(uri, token)).await;
    (status, json_bytes(&bytes))
}

async fn create_task(router: &axum::Router, token: &str, title: &str) -> serde_json::Value {
    let body = format!(r#"{{"title":"{title}","status":"todo"}}"#);
    let (status, bytes) = send(
        router,
        Request::builder()
            .method("POST")
            .uri("/api/tasks")
            .header("cookie", token)
            .header("content-type", "application/json")
            .body(Body::from(body))
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED, "debería crear la tarea");
    json_bytes(&bytes)
}

#[tokio::test]
async fn health_y_auth() {
    let (router, db_path) = setup().await;

    let (status, bytes) = send(
        &router,
        Request::builder()
            .method("GET")
            .uri("/api/health")
            .body(Body::empty())
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(json_bytes(&bytes)["status"], "ok");

    // me sin cookie → 401
    let (status, _) = get_json(&router, "/api/auth/me", "tivit_token=invalido").await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);

    // login mal
    let (status, _) = send(
        &router,
        Request::builder()
            .method("POST")
            .uri("/api/auth/login")
            .header("content-type", "application/json")
            .body(Body::from(
                r#"{"email":"admin-test@tivit.com","password":"mala"}"#,
            ))
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);

    let token = login(&router, ADMIN_EMAIL, ADMIN_PASSWORD).await;
    let (status, json) = get_json(&router, "/api/auth/me", &token).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(json["email"], ADMIN_EMAIL);

    let _ = std::fs::remove_file(&db_path);
}

#[tokio::test]
async fn crud_tareas() {
    let (router, db_path) = setup().await;
    let token = login(&router, ADMIN_EMAIL, ADMIN_PASSWORD).await;

    let created = create_task(&router, &token, "Tarea de prueba").await;
    let id = created["id"].as_str().unwrap().to_string();
    assert_eq!(created["code"], "TIV-0001");

    // Regression: list/board/backlog/dashboard deben responder 200
    for uri in ["/api/tasks", "/api/board", "/api/backlog", "/api/dashboard"] {
        let (status, _) = get_json(&router, uri, &token).await;
        assert_eq!(status, StatusCode::OK, "GET {uri} debería ser 200");
    }

    let (status, json) = get_json(&router, &format!("/api/tasks/{id}"), &token).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(json["title"], "Tarea de prueba");

    let (status, _) = get_json(&router, "/api/tasks/no-existe", &token).await;
    assert_eq!(status, StatusCode::NOT_FOUND);

    let _ = std::fs::remove_file(&db_path);
}

#[tokio::test]
async fn comentarios_y_subtareas() {
    let (router, db_path) = setup().await;
    let token = login(&router, ADMIN_EMAIL, ADMIN_PASSWORD).await;
    let created = create_task(&router, &token, "Con comentario").await;
    let id = created["id"].as_str().unwrap().to_string();

    let (status, _) = send(
        &router,
        Request::builder()
            .method("POST")
            .uri(format!("/api/tasks/{id}/comments"))
            .header("cookie", &token)
            .header("content-type", "application/json")
            .body(Body::from(r#"{"body":"Primer comentario"}"#))
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);

    let (status, json) = get_json(&router, &format!("/api/tasks/{id}/comments"), &token).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(json.as_array().unwrap().len(), 1);

    let (status, _) = send(
        &router,
        Request::builder()
            .method("POST")
            .uri(format!("/api/tasks/{id}/comments"))
            .header("cookie", &token)
            .header("content-type", "application/json")
            .body(Body::from(r#"{"body":""}"#))
            .unwrap(),
    )
    .await;
    assert_eq!(
        status,
        StatusCode::BAD_REQUEST,
        "comentario vacío debe fallar"
    );

    // comentar en tarea inexistente → 404
    let (status, _) = send(
        &router,
        Request::builder()
            .method("POST")
            .uri("/api/tasks/inexistente/comments")
            .header("cookie", &token)
            .header("content-type", "application/json")
            .body(Body::from(r#"{"body":"hola"}"#))
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::NOT_FOUND);

    // subtarea
    let sub = create_task(&router, &token, "Subtarea").await;
    let sub_id = sub["id"].as_str().unwrap().to_string();
    let (status, _) = send(
        &router,
        Request::builder()
            .method("PATCH")
            .uri(format!("/api/subtasks/{sub_id}/toggle"))
            .header("cookie", &token)
            .header("content-type", "application/json")
            .body(Body::from(r#"{"completed":true}"#))
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::OK);

    let _ = std::fs::remove_file(&db_path);
}

#[tokio::test]
async fn sprints() {
    let (router, db_path) = setup().await;
    let token = login(&router, ADMIN_EMAIL, ADMIN_PASSWORD).await;

    let (status, bytes) = send(
        &router,
        Request::builder()
            .method("POST")
            .uri("/api/sprints")
            .header("cookie", &token)
            .header("content-type", "application/json")
            .body(Body::from(
                r#"{"name":"Sprint 1","start_date":"2026-08-01","end_date":"2026-08-14"}"#,
            ))
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let sprint = json_bytes(&bytes);
    let sprint_id = sprint["id"].as_str().unwrap().to_string();

    // fechas inválidas
    let (status, _) = send(
        &router,
        Request::builder()
            .method("POST")
            .uri("/api/sprints")
            .header("cookie", &token)
            .header("content-type", "application/json")
            .body(Body::from(
                r#"{"name":"Mal","start_date":"2026-08-20","end_date":"2026-08-01"}"#,
            ))
            .unwrap(),
    )
    .await;
    assert_eq!(
        status,
        StatusCode::BAD_REQUEST,
        "fin anterior a inicio debe fallar"
    );

    let (status, _) = send(
        &router,
        Request::builder()
            .method("POST")
            .uri(format!("/api/sprints/{sprint_id}/activate"))
            .header("cookie", &token)
            .body(Body::empty())
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::OK);

    let (status, json) =
        get_json(&router, &format!("/api/sprints/{sprint_id}/board"), &token).await;
    assert_eq!(status, StatusCode::OK);
    assert!(json["columns"].as_array().unwrap().len() >= 4);

    let _ = std::fs::remove_file(&db_path);
}

#[tokio::test]
async fn adjuntos_upload_y_download() {
    let (router, db_path) = setup().await;
    let token = login(&router, ADMIN_EMAIL, ADMIN_PASSWORD).await;
    let created = create_task(&router, &token, "Con adjunto").await;
    let task_id = created["id"].as_str().unwrap().to_string();

    let boundary = "X-BOUNDARY-7MA4YWxkTrZu0gW";
    let body = format!(
        "--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"prueba.txt\"\r\nContent-Type: text/plain\r\n\r\nHola mundo\r\n--{boundary}--\r\n"
    );

    let (status, bytes) = send(
        &router,
        Request::builder()
            .method("POST")
            .uri(format!("/api/tasks/{task_id}/attachments"))
            .header("cookie", &token)
            .header(
                "content-type",
                format!("multipart/form-data; boundary={boundary}"),
            )
            .body(Body::from(body.clone()))
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED, "upload debería funcionar");
    let attachment = json_bytes(&bytes);
    let att_id = attachment["id"].as_str().unwrap().to_string();

    // upload a tarea inexistente → 404
    let (status, _) = send(
        &router,
        Request::builder()
            .method("POST")
            .uri("/api/tasks/inexistente/attachments")
            .header("cookie", &token)
            .header(
                "content-type",
                format!("multipart/form-data; boundary={boundary}"),
            )
            .body(Body::from(body.clone()))
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::NOT_FOUND);

    let (status, bytes) = send(
        &router,
        authed_get(&format!("/api/attachments/{att_id}"), &token),
    )
    .await;
    assert_eq!(status, StatusCode::OK, "descarga debería funcionar");
    assert_eq!(bytes.as_ref(), b"Hola mundo");

    let _ = std::fs::remove_file(&db_path);
}

#[tokio::test]
async fn validacion_y_errores() {
    let (router, db_path) = setup().await;
    let token = login(&router, ADMIN_EMAIL, ADMIN_PASSWORD).await;
    let created = create_task(&router, &token, "Para validar").await;
    let task_id = created["id"].as_str().unwrap().to_string();

    // estado inválido
    let (status, _) = send(
        &router,
        Request::builder()
            .method("POST")
            .uri("/api/tasks")
            .header("cookie", &token)
            .header("content-type", "application/json")
            .body(Body::from(r#"{"title":"X","status":"inventado"}"#))
            .unwrap(),
    )
    .await;
    assert_eq!(
        status,
        StatusCode::BAD_REQUEST,
        "estado inválido debe fallar"
    );

    // assignee inexistente
    let (status, _) = send(
        &router,
        Request::builder()
            .method("POST")
            .uri("/api/tasks")
            .header("cookie", &token)
            .header("content-type", "application/json")
            .body(Body::from(r#"{"title":"Y","assignee_id":"no-existe"}"#))
            .unwrap(),
    )
    .await;
    assert_eq!(
        status,
        StatusCode::BAD_REQUEST,
        "assignee inexistente debe fallar"
    );

    // horas negativas
    let (status, _) = send(
        &router,
        Request::builder()
            .method("POST")
            .uri(format!("/api/tasks/{task_id}/time"))
            .header("cookie", &token)
            .header("content-type", "application/json")
            .body(Body::from(r#"{"hours":-5}"#))
            .unwrap(),
    )
    .await;
    assert_eq!(
        status,
        StatusCode::BAD_REQUEST,
        "horas negativas deben fallar"
    );

    // horas válidas
    let (status, _) = send(
        &router,
        Request::builder()
            .method("POST")
            .uri(format!("/api/tasks/{task_id}/time"))
            .header("cookie", &token)
            .header("content-type", "application/json")
            .body(Body::from(r#"{"hours":2.5}"#))
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);

    // dependencia a tarea inexistente
    let (status, _) = send(
        &router,
        Request::builder()
            .method("POST")
            .uri(format!("/api/tasks/{task_id}/dependencies"))
            .header("cookie", &token)
            .header("content-type", "application/json")
            .body(Body::from(r#"{"depends_on_id":"no-existe"}"#))
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::NOT_FOUND);

    let _ = std::fs::remove_file(&db_path);
}

async fn create_member(router: &axum::Router, admin_token: &str, email: &str) {
    let body = format!(r#"{{"name":"Miembro","email":"{email}","password":"member123"}}"#);
    let (status, _) = send(
        router,
        Request::builder()
            .method("POST")
            .uri("/api/users")
            .header("cookie", admin_token)
            .header("content-type", "application/json")
            .body(Body::from(body))
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED, "debería crear el miembro");
}

const TEST_CSRF_TOKEN: &str = "test-csrf-token-1234567890";

fn json_req(method: &str, uri: &str, token: &str, body: &str) -> Request<Body> {
    let cookie = if token.starts_with("tivit_token=") {
        format!("{}; csrf_token={}", token, TEST_CSRF_TOKEN)
    } else {
        format!("tivit_token={}; csrf_token={}", token, TEST_CSRF_TOKEN)
    };
    Request::builder()
        .method(method)
        .uri(uri)
        .header("cookie", cookie)
        .header("x-csrf-token", TEST_CSRF_TOKEN)
        .header("content-type", "application/json")
        .body(Body::from(body.to_string()))
        .unwrap()
}

#[tokio::test]
async fn anuncios_y_wiki() {
    let (router, db_path) = setup().await;
    let token = login(&router, ADMIN_EMAIL, ADMIN_PASSWORD).await;

    // anuncio
    let (status, bytes) = send(
        &router,
        json_req(
            "POST",
            "/api/announcements",
            &token,
            r#"{"title":"Bienvenida","body":"Hola equipo","pinned":1}"#,
        ),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let ann = json_bytes(&bytes);
    let ann_id = ann["id"].as_str().unwrap().to_string();
    assert_eq!(ann["pinned"], 1);

    let (status, json) = get_json(&router, "/api/announcements", &token).await;
    assert_eq!(status, StatusCode::OK);
    let list = json.as_array().unwrap();
    assert_eq!(list.len(), 1);
    assert!(list[0]["author"]["email"].is_string());

    // anuncio vacío falla
    let (status, _) = send(
        &router,
        json_req(
            "POST",
            "/api/announcements",
            &token,
            r#"{"title":"","body":"x"}"#,
        ),
    )
    .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);

    // wiki
    let (status, bytes) = send(
        &router,
        json_req(
            "POST",
            "/api/wiki",
            &token,
            r#"{"title":"Guía de inicio","body":"Contenido"}"#,
        ),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let page = json_bytes(&bytes);
    let slug = page["slug"].as_str().unwrap().to_string();
    assert_eq!(slug, "guia-de-inicio");

    let (status, json) = get_json(&router, &format!("/api/wiki/{slug}"), &token).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(json["body"], "Contenido");

    // slug duplicado → auto-único
    let (status, bytes) = send(
        &router,
        json_req(
            "POST",
            "/api/wiki",
            &token,
            r#"{"title":"Guía de inicio","body":"Otra"}"#,
        ),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    assert_eq!(json_bytes(&bytes)["slug"], "guia-de-inicio-2");

    // member no puede editar ni borrar anuncios/páginas ajenas
    create_member(&router, &token, "member@tivit.com").await;
    let member_token = login(&router, "member@tivit.com", "member123").await;

    let (status, _) = send(
        &router,
        json_req(
            "PATCH",
            &format!("/api/announcements/{ann_id}"),
            &member_token,
            r#"{"title":"Hack"}"#,
        ),
    )
    .await;
    assert_eq!(status, StatusCode::FORBIDDEN);

    let (status, _) = send(
        &router,
        json_req(
            "PATCH",
            &format!("/api/wiki/{slug}"),
            &member_token,
            r#"{"body":"hack"}"#,
        ),
    )
    .await;
    assert_eq!(status, StatusCode::FORBIDDEN);

    let (status, _) = send(
        &router,
        Request::builder()
            .method("DELETE")
            .uri(format!("/api/wiki/{slug}"))
            .header("cookie", &member_token)
            .body(Body::empty())
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "member no puede borrar wiki");

    // admin edita y borra
    let (status, json) = send(
        &router,
        json_req(
            "PATCH",
            &format!("/api/wiki/{slug}"),
            &token,
            r#"{"title":"Guía actualizada"}"#,
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(json_bytes(&json)["title"], "Guía actualizada");

    let (status, _) = send(
        &router,
        Request::builder()
            .method("DELETE")
            .uri(format!("/api/wiki/{slug}"))
            .header("cookie", &token)
            .body(Body::empty())
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::NO_CONTENT);

    let _ = std::fs::remove_file(&db_path);
}

#[tokio::test]
async fn perfil_y_password() {
    let (router, db_path) = setup().await;
    let token = login(&router, ADMIN_EMAIL, ADMIN_PASSWORD).await;

    let (status, json) = send(
        &router,
        json_req(
            "PATCH",
            "/api/auth/profile",
            &token,
            r#"{"name":"Nuevo Nombre"}"#,
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(json_bytes(&json)["name"], "Nuevo Nombre");

    // contraseña actual incorrecta → 400
    let (status, _) = send(
        &router,
        json_req(
            "PATCH",
            "/api/auth/password",
            &token,
            r#"{"current_password":"mala","new_password":"nueva1234"}"#,
        ),
    )
    .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);

    // nueva corta → 400
    let (status, _) = send(
        &router,
        json_req(
            "PATCH",
            "/api/auth/password",
            &token,
            &format!(r#"{{"current_password":"{ADMIN_PASSWORD}","new_password":"corta"}}"#),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);

    // cambio correcto → 200; login antiguo falla, nuevo funciona
    let (status, _) = send(
        &router,
        json_req(
            "PATCH",
            "/api/auth/password",
            &token,
            &format!(r#"{{"current_password":"{ADMIN_PASSWORD}","new_password":"nueva1234"}}"#),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK);

    let (status, _) = send(
        &router,
        Request::builder()
            .method("POST")
            .uri("/api/auth/login")
            .header("content-type", "application/json")
            .body(Body::from(format!(
                r#"{{"email":"{ADMIN_EMAIL}","password":"{ADMIN_PASSWORD}"}}"#
            )))
            .unwrap(),
    )
    .await;
    assert_eq!(
        status,
        StatusCode::UNAUTHORIZED,
        "login con password viejo debe fallar"
    );

    let (status, _) = send(
        &router,
        Request::builder()
            .method("POST")
            .uri("/api/auth/login")
            .header("content-type", "application/json")
            .body(Body::from(format!(
                r#"{{"email":"{ADMIN_EMAIL}","password":"nueva1234"}}"#
            )))
            .unwrap(),
    )
    .await;
    assert_eq!(
        status,
        StatusCode::OK,
        "login con password nuevo debe funcionar"
    );

    let _ = std::fs::remove_file(&db_path);
}

#[tokio::test]
async fn usuarios_admin() {
    let (router, db_path) = setup().await;
    let token = login(&router, ADMIN_EMAIL, ADMIN_PASSWORD).await;

    create_member(&router, &token, "gest@tivit.com").await;

    // obtener id del member
    let (status, json) = get_json(&router, "/api/users", &token).await;
    assert_eq!(status, StatusCode::OK);
    let member = json["items"]
        .as_array()
        .unwrap()
        .iter()
        .find(|u| u["email"] == "gest@tivit.com")
        .cloned()
        .unwrap();
    let member_id = member["id"].as_str().unwrap().to_string();
    assert_eq!(member["active"], 1);

    // member no puede PATCH usuarios
    let member_token = login(&router, "gest@tivit.com", "member123").await;
    let (status, _) = send(
        &router,
        json_req(
            "PATCH",
            &format!("/api/users/{member_id}"),
            &member_token,
            r#"{"role":"admin"}"#,
        ),
    )
    .await;
    assert_eq!(status, StatusCode::FORBIDDEN);

    // admin desactiva al member
    let (status, json) = send(
        &router,
        json_req(
            "PATCH",
            &format!("/api/users/{member_id}"),
            &token,
            r#"{"active":0}"#,
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(json_bytes(&json)["active"], 0);

    // login del member desactivado → 403
    let (status, _) = send(
        &router,
        Request::builder()
            .method("POST")
            .uri("/api/auth/login")
            .header("content-type", "application/json")
            .body(Body::from(
                r#"{"email":"gest@tivit.com","password":"member123"}"#,
            ))
            .unwrap(),
    )
    .await;
    assert_eq!(
        status,
        StatusCode::FORBIDDEN,
        "usuario desactivado no puede loguearse"
    );

    // admin cambia rol a admin
    let (status, json) = send(
        &router,
        json_req(
            "PATCH",
            &format!("/api/users/{member_id}"),
            &token,
            r#"{"role":"admin","active":1}"#,
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(json_bytes(&json)["role"], "admin");

    // member (ya admin) puede borrar tareas tras reactivarse
    let member_token = login(&router, "gest@tivit.com", "member123").await;
    let created = create_task(&router, &token, "Para borrar").await;
    let task_id = created["id"].as_str().unwrap().to_string();
    let (status, _) = send(
        &router,
        Request::builder()
            .method("DELETE")
            .uri(format!("/api/tasks/{task_id}"))
            .header("cookie", &member_token)
            .body(Body::empty())
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::NO_CONTENT, "admin puede borrar tareas");

    let _ = std::fs::remove_file(&db_path);
}

#[tokio::test]
async fn rbac_usuarios() {
    let (router, db_path) = setup().await;
    let token = login(&router, ADMIN_EMAIL, ADMIN_PASSWORD).await;
    let created = create_task(&router, &token, "A borrar").await;
    let task_id = created["id"].as_str().unwrap().to_string();

    // admin crea un member
    let (status, _) = send(
        &router,
        Request::builder()
            .method("POST")
            .uri("/api/users")
            .header("cookie", &token)
            .header("content-type", "application/json")
            .body(Body::from(
                r#"{"name":"Miembro","email":"miembro@tivit.com","password":"member123"}"#,
            ))
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);

    // email duplicado → 409
    let (status, _) = send(
        &router,
        Request::builder()
            .method("POST")
            .uri("/api/users")
            .header("cookie", &token)
            .header("content-type", "application/json")
            .body(Body::from(
                r#"{"name":"Miembro2","email":"miembro@tivit.com","password":"member123"}"#,
            ))
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::CONFLICT);

    let member_token = login(&router, "miembro@tivit.com", "member123").await;

    // member no puede crear usuarios
    let (status, _) = send(
        &router,
        Request::builder()
            .method("POST")
            .uri("/api/users")
            .header("cookie", &member_token)
            .header("content-type", "application/json")
            .body(Body::from(
                r#"{"name":"X","email":"x@tivit.com","password":"xxxxx"}"#,
            ))
            .unwrap(),
    )
    .await;
    assert_eq!(
        status,
        StatusCode::FORBIDDEN,
        "member no puede crear usuarios"
    );

    // member no puede borrar tareas
    let (status, _) = send(
        &router,
        Request::builder()
            .method("DELETE")
            .uri(format!("/api/tasks/{task_id}"))
            .header("cookie", &member_token)
            .body(Body::empty())
            .unwrap(),
    )
    .await;
    assert_eq!(
        status,
        StatusCode::FORBIDDEN,
        "member no puede borrar tareas"
    );

    // admin sí puede borrar tareas
    let (status, _) = send(
        &router,
        Request::builder()
            .method("DELETE")
            .uri(format!("/api/tasks/{task_id}"))
            .header("cookie", &token)
            .body(Body::empty())
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::NO_CONTENT, "admin puede borrar tareas");

    let _ = std::fs::remove_file(&db_path);
}
