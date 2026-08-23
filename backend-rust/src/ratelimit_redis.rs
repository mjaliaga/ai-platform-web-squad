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

        let _: () = conn.zrembyscore(&redis_key, 0, window_start).await.unwrap_or_default();

        let count: usize = conn.zcard(&redis_key).await.unwrap_or(0);

        if count >= self.max_attempts {
            return false;
        }

        let _: () = conn.zadd(&redis_key, now.to_string(), now).await.unwrap_or_default();
        let _: () = conn.expire(&redis_key, self.window.as_secs() as i64).await.unwrap_or_default();

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
