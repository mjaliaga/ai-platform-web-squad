// Deprecated: InMemory limiter. Use ratelimit_redis::RateLimiterBackend instead. Kept for reference.
#[allow(dead_code)]
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{Duration, Instant};

/// Rate limiter en memoria, pensado para un único proceso (deploy de una sola
/// instancia). Protege el endpoint de login contra fuerza bruta por email.
pub struct RateLimiter {
    window: Duration,
    max_attempts: usize,
    attempts: Mutex<HashMap<String, Vec<Instant>>>,
}

impl RateLimiter {
    pub fn new(window: Duration, max_attempts: usize) -> Self {
        Self {
            window,
            max_attempts,
            attempts: Mutex::new(HashMap::new()),
        }
    }

    /// Devuelve `true` si el intento está permitido y lo registra.
    /// `false` si se superó el límite dentro de la ventana.
    pub fn allow(&self, key: &str) -> bool {
        let now = Instant::now();
        let mut map = self.attempts.lock().unwrap();
        let entry = map.entry(key.to_string()).or_default();
        entry.retain(|t| now.duration_since(*t) < self.window);
        if entry.len() >= self.max_attempts {
            return false;
        }
        entry.push(now);
        true
    }

    pub fn reset(&self, key: &str) {
        if let Ok(mut map) = self.attempts.lock() {
            map.remove(key);
        }
    }
}
