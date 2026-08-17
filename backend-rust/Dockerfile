FROM rust:1.88-slim-bookworm AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY Cargo.toml ./
COPY migrations ./migrations

RUN mkdir -p src && \
    echo 'fn main() { println!("placeholder"); }' > src/main.rs && \
    echo '' > src/lib.rs && \
    cargo build --release && \
    rm -rf src

COPY src ./src

RUN cargo build --release

COPY tests ./tests

RUN cargo test --release

FROM debian:bookworm-slim AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libsqlite3-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/tivit-portal-backend /usr/local/bin/tivit-portal-backend
COPY --from=builder /app/migrations /app/migrations

RUN mkdir -p /app/data/uploads

ENV PORT=3000
ENV DATABASE_URL=sqlite:///app/data/portal.db
ENV UPLOAD_DIR=/app/data/uploads

EXPOSE 3000

CMD ["tivit-portal-backend"]