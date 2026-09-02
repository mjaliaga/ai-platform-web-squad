use redis::aio::ConnectionManager;
use redis::{AsyncCommands, RedisResult};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

#[derive(Clone)]
pub struct RedisRateLimiter {
    manager: ConnectionManager,
    window: Duration,
    max_attempts: usize,
}

impl RedisRateLimiter {
    pub async fn new(redis_url: &str, window: Duration, max_attempts: usize) -> RedisResult<Self> {
        let client = redis::Client::open(redis_url)?;
        let manager = ConnectionManager::new(client).await?;
        Ok(Self {
            manager,
            window,
            max_attempts,
        })
    }

    pub async fn allow(&self, key: &str) -> bool {
        let mut conn = self.manager.clone();
        let now = chrono::Utc::now().timestamp_millis();
        let window_start = now - self.window.as_millis() as i64;
        let redis_key = format!("ratelimit:{}", key);

        let zrem: RedisResult<()> = conn.zrembyscore(&redis_key, 0, window_start).await;
        if let Err(e) = zrem {
            tracing::warn!(target: "ratelimit", key = %key, error = %e, "Redis zrembyscore failed — fail-closed denying request");
            return false;
        }

        let count: usize = match conn.zcard(&redis_key).await {
            Ok(c) => c,
            Err(e) => {
                tracing::warn!(target: "ratelimit", key = %key, error = %e, "Redis zcard failed — fail-closed denying request");
                return false;
            }
        };

        if count >= self.max_attempts {
            return false;
        }

        let zadd: RedisResult<()> = conn.zadd(&redis_key, now.to_string(), now).await;
        if let Err(e) = zadd {
            tracing::warn!(target: "ratelimit", key = %key, error = %e, "Redis zadd failed — fail-closed denying request");
            return false;
        }
        let exp: RedisResult<()> = conn.expire(&redis_key, self.window.as_secs() as i64).await;
        if let Err(e) = exp {
            tracing::warn!(target: "ratelimit", key = %key, error = %e, "Redis expire failed");
            // expire failure is not critical, allow
        }

        true
    }

    pub async fn reset(&self, key: &str) {
        let mut conn = self.manager.clone();
        let redis_key = format!("ratelimit:{}", key);
        let _: () = conn.del(redis_key).await.unwrap_or_default();
    }
}

#[derive(Clone)]
pub struct InMemoryRateLimiter {
    window: Duration,
    max_attempts: usize,
    attempts: Arc<Mutex<HashMap<String, Vec<Instant>>>>,
}

impl InMemoryRateLimiter {
    pub fn new(window: Duration, max_attempts: usize) -> Self {
        Self {
            window,
            max_attempts,
            attempts: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn allow(&self, key: &str) -> bool {
        let now = Instant::now();
        let mut map = self.attempts.lock().unwrap_or_else(|e| e.into_inner());
        // Evicción periódica: si map crece demasiado (>10k keys), limpiar entradas expiradas globalmente
        if map.len() > 10_000 {
            let expired_keys: Vec<String> = map
                .iter()
                .filter(|(_, v)| v.iter().all(|t| now.duration_since(*t) >= self.window))
                .map(|(k, _)| k.clone())
                .collect();
            for k in expired_keys {
                map.remove(&k);
            }
            // Si aún grande, truncar a 8k más recientes (evitar DoS memoria)
            if map.len() > 10_000 {
                let keys_to_remove: Vec<String> = map.keys().take(map.len() - 8000).cloned().collect();
                for k in keys_to_remove {
                    map.remove(&k);
                }
            }
        }
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

#[derive(Clone)]
pub enum RateLimiterBackend {
    Redis(RedisRateLimiter),
    InMemory(InMemoryRateLimiter),
}

impl RateLimiterBackend {
    pub async fn allow(&self, key: &str) -> bool {
        match self {
            RateLimiterBackend::Redis(r) => r.allow(key).await,
            RateLimiterBackend::InMemory(m) => m.allow(key),
        }
    }

    pub async fn reset(&self, key: &str) {
        match self {
            RateLimiterBackend::Redis(r) => r.reset(key).await,
            RateLimiterBackend::InMemory(m) => m.reset(key),
        }
    }
}

pub async fn create_rate_limiter(
    redis_url: Option<&str>,
    window: Duration,
    max_attempts: usize,
) -> RateLimiterBackend {
    if let Some(url) = redis_url {
        if let Ok(limiter) = RedisRateLimiter::new(url, window, max_attempts).await {
            tracing::info!("Using Redis-backed rate limiter");
            return RateLimiterBackend::Redis(limiter);
        }
        tracing::warn!("Failed to connect to Redis, falling back to in-memory rate limiter");
    }
    tracing::info!("Using in-memory rate limiter");
    RateLimiterBackend::InMemory(InMemoryRateLimiter::new(window, max_attempts))
}
