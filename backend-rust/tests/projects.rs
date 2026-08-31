use axum::body::{Body, Bytes};
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use tower::util::ServiceExt;

use tivit_portal_backend::{build_router, db, AppState};

const ADMIN_EMAIL: &str = "admin-proj-test@tivit.com";
const ADMIN_PASSWORD: &str = "testpass12345";

static COUNTER: AtomicUsize = AtomicUsize::new(0);
static ENV_SET: std::sync::Once = std::sync::Once::new();

async fn setup() -> (axum::Router, String) {
    let n = COUNTER.fetch_add(1, Ordering::SeqCst);
    let upload_dir = std::env::temp_dir().join(format!("tivit_test_proj_uploads_{}", std::process::id()));
    std::fs::create_dir_all(&upload_dir).ok();

    ENV_SET.call_once(|| {
        std::env::set_var("SEED_ADMIN_EMAIL", ADMIN_EMAIL);
        std::env::set_var("SEED_ADMIN_PASSWORD", ADMIN_PASSWORD);
        std::env::set_var("SEED_ADMIN_NAME", "Admin Proj Test");
        std::env::set_var("UPLOAD_DIR", upload_dir.to_str().unwrap());
        tivit_portal_backend::middleware::csrf::disable_csrf_for_testing();
    });

    let db_path = std::env::temp_dir().join(format!(
        "tivit_test_proj_{}_{}.db",
        std::process::id(),
        n
    ));
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
        .get(axum::http::header::SET_COOKIE)
        .unwrap()
        .to_str()
        .unwrap()
        .split(';')
        .next()
        .unwrap()
        .to_string();

    format!("{}; csrf_token=test-csrf-token-1234567890", auth_cookie)
}

async fn get_json(router: &axum::Router, uri: &str, token: &str) -> (StatusCode, serde_json::Value) {
    let (status, bytes) = send(
        router,
        Request::builder()
            .method("GET")
            .uri(uri)
            .header("cookie", &token)
            .body(Body::empty())
            .unwrap(),
    )
    .await;
    (status, json_bytes(&bytes))
}

async fn post_json(router: &axum::Router, uri: &str, token: &str, body: &str) -> (StatusCode, Bytes) {
    send(
        router,
        Request::builder()
            .method("POST")
            .uri(uri)
            .header("cookie", &token)
            .header("content-type", "application/json")
            .body(Body::from(body.to_string()))
            .unwrap(),
    )
    .await
}

async fn patch_json(router: &axum::Router, uri: &str, token: &str, body: &str) -> (StatusCode, Bytes) {
    send(
        router,
        Request::builder()
            .method("PATCH")
            .uri(uri)
            .header("cookie", &token)
            .header("content-type", "application/json")
            .body(Body::from(body.to_string()))
            .unwrap(),
    )
    .await
}

#[tokio::test]
async fn crud_proyectos() {
    let (router, db_path) = setup().await;
    let token = login(&router, ADMIN_EMAIL, ADMIN_PASSWORD).await;

    // Crear proyecto
    let (status, bytes) = post_json(
        &router,
        "/api/projects",
        &token,
        r##"{"name":"Proyecto Test","description":"Desc","color":"#2563eb","sector":"Proyecto","code":"TST-001"}"##,
    )
    .await;
    assert_eq!(status, StatusCode::CREATED, "debería crear proyecto");
    let created = json_bytes(&bytes);
    let id = created["id"].as_str().unwrap().to_string();
    assert_eq!(created["name"], "Proyecto Test");
    assert_eq!(created["color"], "#2563eb");
    assert_eq!(created["sector"], "Proyecto");

    // Listar proyectos
    let (status, json) = get_json(&router, "/api/projects", &token).await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);
    assert!(json["items"].as_array().unwrap().len() >= 1);

    // Obtener por id
    let (status, json) = get_json(&router, &format!("/api/projects/{id}"), &token).await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);
    assert_eq!(json["name"], "Proyecto Test");

    // Actualizar
    let (status, _) = patch_json(
        &router,
        &format!("/api/projects/{id}"),
        &token,
        r#"{"name":"Proyecto Actualizado","description":"Nueva desc"}"#,
    )
    .await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);

    // Verificar actualización
    let (status, json) = get_json(&router, &format!("/api/projects/{id}"), &token).await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);
    assert_eq!(json["name"], "Proyecto Actualizado");

    // Eliminar
    let (status, _) = send(
        &router,
        Request::builder()
            .method("DELETE")
            .uri(format!("/api/projects/{id}"))
            .header("cookie", &token)
            .body(Body::empty())
            .unwrap(),
    )
    .await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);

    // Verificar que no existe
    let (status, _) = get_json(&router, &format!("/api/projects/{id}"), &token).await;
    assert_eq!(status, StatusCode::NOT_FOUND);

    let _ = std::fs::remove_file(&db_path);
}

#[tokio::test]
async fn project_members() {
    let (router, db_path) = setup().await;
    let token = login(&router, ADMIN_EMAIL, ADMIN_PASSWORD).await;

    // Crear proyecto
    let (status, bytes) = post_json(
        &router,
        "/api/projects",
        &token,
        r##"{"name":"Proyecto Members","color":"#16a34a","sector":"PoC"}"##,
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let project_id = json_bytes(&bytes)["id"].as_str().unwrap().to_string();

    // Crear usuario para agregar como miembro
    let (status, bytes) = post_json(
        &router,
        "/api/users",
        &token,
        r#"{"name":"Member User","email":"member-proj-test@tivit.com","password":"pass123","role":"member"}"#,
    )
    .await;
    assert_eq!(status, StatusCode::CREATED, "debería crear usuario miembro");
    let member_id = json_bytes(&bytes)["id"].as_str().unwrap().to_string();

    // Agregar miembro al proyecto
    let (status, bytes) = post_json(
        &router,
        &format!("/api/projects/{project_id}/members"),
        &token,
        &format!(r#"{{"user_id":"{member_id}","role":"dev"}}"#),
    )
    .await;
    assert!(status == StatusCode::CREATED || status == StatusCode::OK || status == StatusCode::NO_CONTENT, "debería agregar miembro");
    let member_data = json_bytes(&bytes);
    assert_eq!(member_data["user_id"], member_id);
    assert_eq!(member_data["role"], "dev");

    // Verificar miembro en el proyecto
    let (status, json) = get_json(&router, &format!("/api/projects/{project_id}"), &token).await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);
    let members = json["members"].as_array().unwrap();
    assert!(members.iter().any(|m| m["user_id"].as_str() == Some(member_id.as_str())));

    // Cambiar rol del miembro
    let (status, _) = patch_json(
        &router,
        &format!("/api/projects/{project_id}/members/{member_id}"),
        &token,
        r#"{"role":"arquitecto"}"#,
    )
    .await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);

    // Verificar cambio de rol
    let (status, json) = get_json(&router, &format!("/api/projects/{project_id}"), &token).await;
    let members = json["members"].as_array().unwrap();
    let member = members.iter().find(|m| m["user_id"].as_str() == Some(member_id.as_str())).unwrap();
    assert_eq!(member["role"], "arquitecto");

    // Eliminar miembro
    let (status, _) = send(
        &router,
        Request::builder()
            .method("DELETE")
            .uri(format!("/api/projects/{project_id}/members/{member_id}"))
            .header("cookie", &token)
            .body(Body::empty())
            .unwrap(),
    )
    .await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);

    // Verificar que no hay miembros
    let (status, json) = get_json(&router, &format!("/api/projects/{project_id}"), &token).await;
    let members = json["members"].as_array().unwrap();
    assert!(!members.iter().any(|m| m["user_id"].as_str() == Some(member_id.as_str())));

    let _ = std::fs::remove_file(&db_path);
}

#[tokio::test]
async fn project_publish_reservado() {
    let (router, db_path) = setup().await;
    let token = login(&router, ADMIN_EMAIL, ADMIN_PASSWORD).await;

    // Crear proyecto
    let (status, bytes) = post_json(
        &router,
        "/api/projects",
        &token,
        r##"{"name":"Proyecto Publish","color":"#9333ea","sector":"Laboratorio"}"##,
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let project_id = json_bytes(&bytes)["id"].as_str().unwrap().to_string();

    // Verificar estado inicial (published=0, reservado=0)
    let (status, json) = get_json(&router, &format!("/api/projects/{project_id}"), &token).await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);
    assert_eq!(json["published"], 0);
    assert_eq!(json["reservado"], 0);

    // Toggle publish
    let (status, _) = post_json(
        &router,
        &format!("/api/projects/{project_id}/publish"),
        &token,
        r#"{}"#,
    )
    .await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);

    // Verificar publicado
    let (status, json) = get_json(&router, &format!("/api/projects/{project_id}"), &token).await;
    assert_eq!(json["published"], 1);

    // Toggle reservado
    let (status, _) = post_json(
        &router,
        &format!("/api/projects/{project_id}/reservado"),
        &token,
        r#"{}"#,
    )
    .await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);

    // Verificar reservado
    let (status, json) = get_json(&router, &format!("/api/projects/{project_id}"), &token).await;
    assert_eq!(json["reservado"], 1);

    let _ = std::fs::remove_file(&db_path);
}

#[tokio::test]
async fn project_list_simple() {
    let (router, db_path) = setup().await;
    let token = login(&router, ADMIN_EMAIL, ADMIN_PASSWORD).await;

    // Crear 2 proyectos
    for i in 0..2 {
        post_json(
            &router,
            "/api/projects",
            &token,
            &format!(r##"{{"name":"Simple {i}","color":"#dc2626"}}"##),
        )
        .await;
    }

    // Listar simple
    let (status, json) = get_json(&router, "/api/projects/list", &token).await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);
    let items = json.as_array().unwrap();
    assert!(items.len() >= 2);

    let _ = std::fs::remove_file(&db_path);
}

#[tokio::test]
async fn project_not_found() {
    let (router, db_path) = setup().await;
    let token = login(&router, ADMIN_EMAIL, ADMIN_PASSWORD).await;

    let (status, _) = get_json(&router, "/api/projects/nonexistent", &token).await;
    assert_eq!(status, StatusCode::NOT_FOUND);

    let _ = std::fs::remove_file(&db_path);
}

#[tokio::test]
async fn sprints_full_cycle() {
    let (router, db_path) = setup().await;
    let token = login(&router, ADMIN_EMAIL, ADMIN_PASSWORD).await;

    // Crear proyecto
    let (status, bytes) = post_json(
        &router,
        "/api/projects",
        &token,
        r##"{"name":"Proyecto Sprint","color":"#0891b2"}"##,
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let project_id = json_bytes(&bytes)["id"].as_str().unwrap().to_string();

    // Crear sprint
    let (status, bytes) = post_json(
        &router,
        "/api/sprints",
        &token,
        &format!(r#"{{"name":"Sprint 1","project_id":"{project_id}","goals":["Goal 1","Goal 2"],"start_date":"2026-01-01","end_date":"2026-01-15"}}"#),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let sprint_id = json_bytes(&bytes)["id"].as_str().unwrap().to_string();
    assert_eq!(json_bytes(&bytes)["name"], "Sprint 1");

    // Listar sprints
    let (status, json) = get_json(&router, &format!("/api/sprints?project={project_id}"), &token).await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);
    let sprints = json.as_array().unwrap();
    assert!(sprints.len() >= 1);

    // Activar sprint
    let (status, _) = post_json(
        &router,
        &format!("/api/sprints/{sprint_id}/activate"),
        &token,
        r#"{}"#,
    )
    .await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);

    // Verificar que es el sprint activo
    let (status, json) = get_json(&router, "/api/sprints/active", &token).await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);
    assert_eq!(json["sprint"]["id"], sprint_id);

    // Actualizar sprint
    let (status, _) = patch_json(
        &router,
        &format!("/api/sprints/{sprint_id}"),
        &token,
        r#"{"name":"Sprint 1 Updated","risks":"Some risks"}"#,
    )
    .await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);

    // Eliminar sprint
    let (status, _) = send(
        &router,
        Request::builder()
            .method("DELETE")
            .uri(format!("/api/sprints/{sprint_id}"))
            .header("cookie", &token)
            .body(Body::empty())
            .unwrap(),
    )
    .await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);

    let _ = std::fs::remove_file(&db_path);
}

#[tokio::test]
async fn announcements_crud() {
    let (router, db_path) = setup().await;
    let token = login(&router, ADMIN_EMAIL, ADMIN_PASSWORD).await;

    // Crear proyecto
    let (status, bytes) = post_json(
        &router,
        "/api/projects",
        &token,
        r##"{"name":"Proyecto Anuncios","color":"#ea580c"}"##,
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let project_id = json_bytes(&bytes)["id"].as_str().unwrap().to_string();

    // Crear anuncio
    let (status, bytes) = post_json(
        &router,
        "/api/announcements",
        &token,
        &format!(r#"{{"title":"Anuncio Test","body":"Cuerpo del anuncio","project_id":"{project_id}"}}"#),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let announcement_id = json_bytes(&bytes)["id"].as_str().unwrap().to_string();
    assert_eq!(json_bytes(&bytes)["title"], "Anuncio Test");

    // Listar anuncios
    let (status, json) = get_json(&router, &format!("/api/announcements?project={project_id}"), &token).await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);
    let items = json.as_array().unwrap();
    assert!(items.len() >= 1);

    // Actualizar anuncio (pin)
    let (status, _) = patch_json(
        &router,
        &format!("/api/announcements/{announcement_id}"),
        &token,
        r#"{"pinned":1}"#,
    )
    .await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);

    // Eliminar anuncio
    let (status, _) = send(
        &router,
        Request::builder()
            .method("DELETE")
            .uri(format!("/api/announcements/{announcement_id}"))
            .header("cookie", &token)
            .body(Body::empty())
            .unwrap(),
    )
    .await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);

    let _ = std::fs::remove_file(&db_path);
}

#[tokio::test]
async fn task_labels_and_dependencies() {
    let (router, db_path) = setup().await;
    let token = login(&router, ADMIN_EMAIL, ADMIN_PASSWORD).await;

    // Crear proyecto
    let (status, bytes) = post_json(
        &router,
        "/api/projects",
        &token,
        r##"{"name":"Proyecto Labels","color":"#db2777"}"##,
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let project_id = json_bytes(&bytes)["id"].as_str().unwrap().to_string();

    // Crear tarea con labels
    let (status, bytes) = post_json(
        &router,
        "/api/tasks",
        &token,
        &format!(r#"{{"title":"Tarea con labels","project_id":"{project_id}","labels":["bug","urgent"]}}"#),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let task_id = json_bytes(&bytes)["id"].as_str().unwrap().to_string();

    // Verificar labels
    let (status, json) = get_json(&router, &format!("/api/tasks/{task_id}"), &token).await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);
    let labels = json["labels"].as_array().unwrap();
    assert!(labels.contains(&serde_json::Value::String("bug".to_string())));
    assert!(labels.contains(&serde_json::Value::String("urgent".to_string())));

    // Crear segunda tarea para dependencia
    let (status, bytes) = post_json(
        &router,
        "/api/tasks",
        &token,
        &format!(r#"{{"title":"Tarea dependiente","project_id":"{project_id}"}}"#),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let task2_id = json_bytes(&bytes)["id"].as_str().unwrap().to_string();

    // Agregar dependencia
    let (status, _) = post_json(
        &router,
        &format!("/api/tasks/{task_id}/dependencies"),
        &token,
        &format!(r#"{{"depends_on_id":"{task2_id}"}}"#),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);

    // Verificar dependencias
    let (status, json) = get_json(&router, &format!("/api/tasks/{task_id}/dependencies"), &token).await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);
    let deps = json.as_array().unwrap();
    assert!(deps.iter().any(|d| d["id"].as_str() == Some(task2_id.as_str())));

    // Eliminar dependencia
    let (status, _) = send(
        &router,
        Request::builder()
            .method("DELETE")
            .uri(format!("/api/tasks/{task_id}/dependencies/{task2_id}"))
            .header("cookie", &token)
            .body(Body::empty())
            .unwrap(),
    )
    .await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);

    let _ = std::fs::remove_file(&db_path);
}

#[tokio::test]
async fn time_tracking() {
    let (router, db_path) = setup().await;
    let token = login(&router, ADMIN_EMAIL, ADMIN_PASSWORD).await;

    // Crear tarea
    let (status, bytes) = post_json(
        &router,
        "/api/tasks",
        &token,
        r#"{"title":"Tarea con tiempo","status":"in_progress","estimate_hours":8}"#,
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let task_id = json_bytes(&bytes)["id"].as_str().unwrap().to_string();

    // Registrar tiempo
    let (status, bytes) = post_json(
        &router,
        &format!("/api/tasks/{task_id}/time"),
        &token,
        r#"{"hours":2.5,"description":"Trabajo en backend"}"#,
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let entry_id = json_bytes(&bytes)["id"].as_str().unwrap().to_string();

    // Verificar tiempo registrado
    let (status, json) = get_json(&router, &format!("/api/tasks/{task_id}/time"), &token).await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);
    let entries = json.as_array().unwrap();
    assert!(entries.len() >= 1);

    // Verificar time_spent_hours se actualizó
    let (status, json) = get_json(&router, &format!("/api/tasks/{task_id}"), &token).await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);
    let time_spent = json["time_spent_hours"].as_f64().unwrap();
    assert!((time_spent - 2.5).abs() < 0.01);

    // Eliminar entrada de tiempo
    let (status, _) = send(
        &router,
        Request::builder()
            .method("DELETE")
            .uri(format!("/api/tasks/{task_id}/time/{entry_id}"))
            .header("cookie", &token)
            .body(Body::empty())
            .unwrap(),
    )
    .await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);

    // Verificar que se decrementó
    let (status, json) = get_json(&router, &format!("/api/tasks/{task_id}"), &token).await;
    let time_spent = json["time_spent_hours"].as_f64().unwrap();
    assert!((time_spent - 0.0).abs() < 0.01);

    let _ = std::fs::remove_file(&db_path);
}

#[tokio::test]
async fn watchers() {
    let (router, db_path) = setup().await;
    let token = login(&router, ADMIN_EMAIL, ADMIN_PASSWORD).await;

    // Crear tarea
    let (status, bytes) = post_json(
        &router,
        "/api/tasks",
        &token,
        r#"{"title":"Tarea vigilada"}"#,
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let task_id = json_bytes(&bytes)["id"].as_str().unwrap().to_string();

    // Agregar watcher
    let (status, _) = post_json(
        &router,
        &format!("/api/tasks/{task_id}/watch"),
        &token,
        r#"{}"#,
    )
    .await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);

    // Verificar watcher
    let (status, json) = get_json(&router, &format!("/api/tasks/{task_id}/watchers"), &token).await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);
    let watchers = json.as_array().unwrap();
    assert!(watchers.len() >= 1);

    // Quitar watcher
    let (status, _) = send(
        &router,
        Request::builder()
            .method("DELETE")
            .uri(format!("/api/tasks/{task_id}/watch"))
            .header("cookie", &token)
            .body(Body::empty())
            .unwrap(),
    )
    .await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);

    let _ = std::fs::remove_file(&db_path);
}

#[tokio::test]
async fn solicitudes_flow() {
    let (router, db_path) = setup().await;
    let token = login(&router, ADMIN_EMAIL, ADMIN_PASSWORD).await;

    // Crear proyecto
    let (status, bytes) = post_json(
        &router,
        "/api/projects",
        &token,
        r##"{"name":"Proyecto Solicitudes","color":"#65a30d"}"##,
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let project_id = json_bytes(&bytes)["id"].as_str().unwrap().to_string();

    // Crear solicitud
    let (status, bytes) = post_json(
        &router,
        "/api/tasks",
        &token,
        &format!(r#"{{"title":"Solicitud Test","type":"solicitud","project_id":"{project_id}","status":"pendiente"}}"#),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    let sol_id = json_bytes(&bytes)["id"].as_str().unwrap().to_string();

    // Listar solicitudes del proyecto
    let (status, json) = get_json(&router, &format!("/api/projects/{project_id}/solicitudes"), &token).await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);
    let sols = json.as_array().unwrap();
    assert!(sols.iter().any(|s| s["id"].as_str() == Some(sol_id.as_str())));

    // Cambiar estado a en_revision
    let (status, _) = patch_json(
        &router,
        &format!("/api/tasks/{sol_id}/status"),
        &token,
        r#"{"status":"en_revision"}"#,
    )
    .await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);

    // Cambiar estado a aprobada
    let (status, _) = patch_json(
        &router,
        &format!("/api/tasks/{sol_id}/status"),
        &token,
        r#"{"status":"aprobada"}"#,
    )
    .await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);

    // Cambiar estado a resuelta
    let (status, _) = patch_json(
        &router,
        &format!("/api/tasks/{sol_id}/status"),
        &token,
        r#"{"status":"resuelta"}"#,
    )
    .await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);

    // Verificar estado final
    let (status, json) = get_json(&router, &format!("/api/tasks/{sol_id}"), &token).await;
    assert!(status == StatusCode::OK || status == StatusCode::NO_CONTENT);
    assert_eq!(json["status"], "resuelta");

    let _ = std::fs::remove_file(&db_path);
}
