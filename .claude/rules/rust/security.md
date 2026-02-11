# Rust Security

> This file extends [common/security.md](../common/security.md) with Rust specific content.

## Secret Management

```rust
// NEVER: Hardcoded secrets
let api_key = "sk-proj-xxxxx";

// ALWAYS: Environment variables
use std::env;

let api_key = env::var("OPENAI_API_KEY")
    .expect("OPENAI_API_KEY must be set");
```

Use `dotenvy` for local development and validate all required secrets at startup:

```rust
use dotenvy::dotenv;

pub struct Config {
    pub database_url: String,
    pub api_key: String,
    pub jwt_secret: String,
}

impl Config {
    pub fn from_env() -> Result<Self, AppError> {
        dotenv().ok(); // load .env in development only

        Ok(Self {
            database_url: env::var("DATABASE_URL")
                .map_err(|_| AppError::Config("DATABASE_URL not set"))?,
            api_key: env::var("API_KEY")
                .map_err(|_| AppError::Config("API_KEY not set"))?,
            jwt_secret: env::var("JWT_SECRET")
                .map_err(|_| AppError::Config("JWT_SECRET not set"))?,
        })
    }
}
```

Use `secrecy::Secret<String>` to prevent accidental logging of sensitive values:

```rust
use secrecy::{Secret, ExposeSecret};

pub struct Config {
    pub jwt_secret: Secret<String>,
}

// Secret is redacted in Debug/Display output
// Access the inner value explicitly:
let raw = config.jwt_secret.expose_secret();
```

## SQL Injection Prevention

Always use parameterized queries via `sqlx`:

```rust
// NEVER: String interpolation
let query = format!("SELECT * FROM users WHERE id = '{}'", id);

// ALWAYS: Parameterized queries
let user = sqlx::query_as!(User, "SELECT * FROM users WHERE id = $1", id)
    .fetch_optional(&pool)
    .await?;
```

## XSS Prevention

When rendering HTML, always escape user content:

```rust
use askama::Template; // Askama auto-escapes by default

#[derive(Template)]
#[template(path = "profile.html")]
struct ProfileTemplate {
    username: String, // auto-escaped in template
}
```

If building JSON APIs, ensure `Content-Type: application/json` headers are set and avoid embedding raw user input in HTML responses.

## Dependency Auditing

Audit dependencies regularly:

```bash
# Install and run cargo-audit
cargo install cargo-audit
cargo audit

# Deny known-vulnerable crates in CI
cargo audit --deny warnings
```

Add to `Cargo.toml` for supply-chain safety:

```toml
# Restrict unsafe code
[lints.rust]
unsafe_code = "forbid"
```

## Authentication & Authorization

Use middleware extractors to enforce auth on every handler:

```rust
use axum::{extract::FromRequestParts, http::request::Parts};

pub struct AuthenticatedUser {
    pub id: String,
    pub roles: Vec<String>,
}

#[async_trait]
impl<S: Send + Sync> FromRequestParts<S> for AuthenticatedUser {
    type Rejection = StatusCode;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let token = parts.headers
            .get("Authorization")
            .and_then(|v| v.to_str().ok())
            .and_then(|v| v.strip_prefix("Bearer "))
            .ok_or(StatusCode::UNAUTHORIZED)?;

        verify_jwt(token).await.map_err(|_| StatusCode::UNAUTHORIZED)
    }
}

// Handlers automatically require auth by including the extractor
async fn protected_route(user: AuthenticatedUser) -> impl IntoResponse {
    // user is guaranteed to be authenticated
}
```

## Agent Support

- Use **security-reviewer** skill for comprehensive security audits
