FROM rust:1.88-slim-bookworm AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Build the real binary directly (sin placeholder). Es más simple y robusto.
COPY Cargo.toml Cargo.lock ./
COPY migrations ./migrations
COPY src ./src
COPY tests ./tests

RUN cargo build --release --bin tivit-portal-backend && \
    ls -la target/release/tivit-portal-backend

FROM debian:bookworm-slim AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libsqlite3-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/tivit-portal-backend /usr/local/bin/tivit-portal-backend
COPY --from=builder /app/migrations /app/migrations

RUN mkdir -p /app/data/uploads /app/media

ENV PORT=3000
ENV DATABASE_URL=sqlite:///app/data/portal.db
ENV UPLOAD_DIR=/app/data/uploads
ENV MEDIA_DIR=/app/media

EXPOSE 3000

CMD ["tivit-portal-backend"]