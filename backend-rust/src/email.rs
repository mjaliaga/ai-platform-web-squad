use serde_json::json;

/// Envía email vía Brevo (ex Sendinblue). Si BREVO_API_KEY no está seteada, hace no-op con log.
/// Requiere: BREVO_API_KEY, opcional BREVO_SENDER_EMAIL/NAMES, BREVO_SENDER_NAME
pub async fn send_brevo_email(to_email: &str, to_name: &str, subject: &str, html_content: &str) {
    let api_key = match std::env::var("BREVO_API_KEY") {
        Ok(k) if !k.trim().is_empty() => k,
        _ => {
            tracing::info!(
                target: "email",
                to = %to_email,
                subject = %subject,
                "BREVO_API_KEY no configurada — email no enviado (solo log + in-app notification)"
            );
            return;
        }
    };

    let sender_email = std::env::var("BREVO_SENDER_EMAIL").unwrap_or_else(|_| "noreply@tivit.com".to_string());
    let sender_name = std::env::var("BREVO_SENDER_NAME").unwrap_or_else(|_| "TIVIT Portal".to_string());

    let payload = json!({
        "sender": { "name": sender_name, "email": sender_email },
        "to": [{ "email": to_email, "name": to_name }],
        "subject": subject,
        "htmlContent": html_content
    });

    // Cliente reqwest con timeout corto para no bloquear request principal
    let client = match reqwest::Client::builder().timeout(std::time::Duration::from_secs(10)).build() {
        Ok(c) => c,
        Err(e) => {
            tracing::warn!(target: "email", error = %e, "No se pudo crear cliente reqwest");
            return;
        }
    };

    let res = client
        .post("https://api.brevo.com/v3/smtp/email")
        .header("accept", "application/json")
        .header("content-type", "application/json")
        .header("api-key", api_key)
        .json(&payload)
        .send()
        .await;

    match res {
        Ok(r) if r.status().is_success() => {
            tracing::info!(target: "email", to = %to_email, subject = %subject, "Email Brevo enviado OK");
        }
        Ok(r) => {
            let status = r.status();
            let body = r.text().await.unwrap_or_default();
            tracing::warn!(target: "email", to = %to_email, status = %status, body = %body, "Brevo respondió error");
        }
        Err(e) => {
            tracing::warn!(target: "email", to = %to_email, error = %e, "Error enviando email Brevo");
        }
    }
}

/// Helper para notificar ticket (in-app + email)
pub async fn notify_ticket(
    db: &sqlx::SqlitePool,
    assignee_id: &str,
    reporter_id: &str,
    ticket_id: &str,
    ticket_code: &str,
    ticket_title: &str,
    project_name: &str,
    level: i64,
    action: &str, // "created", "escalated", "status_changed"
) {
    // In-app notification (reusa tabla notifications)
    let message = match action {
        "created" => format!("Nuevo ticket {} (Nivel {}) para proyecto {}: {}", ticket_code, level, project_name, ticket_title),
        "escalated" => format!("Ticket {} escalado a Nivel {}: {}", ticket_code, level, ticket_title),
        "status_changed" => format!("Ticket {} cambió de estado: {}", ticket_code, ticket_title),
        _ => format!("Ticket {}: {}", ticket_code, ticket_title),
    };
    // No fallar si notificación falla
    let _ = crate::routes::notifications::create_notification(
        db,
        assignee_id,
        "ticket",
        Some(ticket_id),
        Some(reporter_id),
        &message,
    )
    .await;

    // Email via Brevo al assignee
    // Buscar datos del assignee
    let assignee = sqlx::query_as::<_, (String, String, String)>(
        "SELECT id, name, email FROM users WHERE id = ? AND deleted_at IS NULL"
    )
    .bind(assignee_id)
    .fetch_optional(db)
    .await
    .ok()
    .flatten();

    if let Some((_, name, email)) = assignee {
        let subject = match action {
            "created" => format!("[Ticket {}] Nuevo ticket Nivel {} - {}", ticket_code, level, project_name),
            "escalated" => format!("[Ticket {}] Escalado a Nivel {} - {}", ticket_code, level, project_name),
            _ => format!("[Ticket {}] {}", ticket_code, ticket_title),
        };
        let html = format!(
            r#"<html><body>
            <h2>{}</h2>
            <p><strong>Proyecto:</strong> {}</p>
            <p><strong>Título:</strong> {}</p>
            <p><strong>Código:</strong> {}</p>
            <p><strong>Nivel:</strong> {}</p>
            <p><strong>Acción:</strong> {}</p>
            <p><a href="{}/portal/tickets/{}">Ver ticket en el portal</a></p>
            </body></html>"#,
            subject, project_name, ticket_title, ticket_code, level, action,
            std::env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:8080".to_string()),
            ticket_id
        );
        send_brevo_email(&email, &name, &subject, &html).await;
    }
}
