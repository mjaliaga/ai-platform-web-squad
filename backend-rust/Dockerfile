FROM rust:1.88-slim-bookworm AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Build the real binary directly (sin placeholder). Es más simple y robusto.
COPY backend-rust/Cargo.toml backend-rust/Cargo.lock ./
COPY backend-rust/migrations ./migrations
COPY backend-rust/src ./src
COPY backend-rust/tests ./tests

RUN cargo build --release --bin tivit-portal-backend --bin seed_content && \
    ls -la target/release/tivit-portal-backend target/release/seed_content

FROM debian:bookworm-slim AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libsqlite3-0 \
    curl \
    tini \
    && rm -rf /var/lib/apt/lists/*

# SEC-005: Run as a non-root user.
RUN groupadd -r -g 10001 appuser \
    && useradd -r -u 10001 -g appuser -d /app -s /usr/sbin/nologin appuser \
    && mkdir -p /app/data/uploads /app/media \
    && chown -R appuser:appuser /app

COPY --from=builder /app/target/release/tivit-portal-backend /usr/local/bin/tivit-portal-backend
COPY --from=builder /app/target/release/seed_content /usr/local/bin/seed_content
COPY --from=builder /app/migrations /app/migrations

# Copy frontend data files for seed_content
COPY frontend/src/data/items.json /app/seed-data/items.json
COPY frontend/src/data/casosExito.js /app/seed-data/casosExito.js
COPY frontend/src/data/poc.js /app/seed-data/poc.js
COPY frontend/src/data/almaviva.js /app/seed-data/almaviva.js
COPY frontend/src/data/xms.js /app/seed-data/xms.js

RUN chown -R appuser:appuser /app/seed-data /usr/local/bin/tivit-portal-backend /usr/local/bin/seed_content

ENV PORT=3000
ENV DATABASE_URL=sqlite:///app/data/portal.db
ENV UPLOAD_DIR=/app/data/uploads
ENV MEDIA_DIR=/app/media
ENV SEED_DATA_DIR=/app/seed-data

EXPOSE 3000

COPY backend-rust/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER appuser

# Use tini for proper signal forwarding (graceful shutdown on SIGTERM).
ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/docker-entrypoint.sh"]