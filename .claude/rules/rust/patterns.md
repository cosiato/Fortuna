# Rust Patterns

> This file extends [common/patterns.md](../common/patterns.md) with Rust specific content.

## API Response Format

```rust
use serde::Serialize;

#[derive(Serialize)]
pub struct ApiResponse<T: Serialize> {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub meta: Option<PaginationMeta>,
}

#[derive(Serialize)]
pub struct PaginationMeta {
    pub total: u64,
    pub page: u32,
    pub limit: u32,
}

impl<T: Serialize> ApiResponse<T> {
    pub fn ok(data: T) -> Self {
        Self { success: true, data: Some(data), error: None, meta: None }
    }

    pub fn err(message: impl Into<String>) -> Self {
        Self { success: false, data: None, error: Some(message.into()), meta: None }
    }

    pub fn paginated(data: T, meta: PaginationMeta) -> Self {
        Self { success: true, data: Some(data), error: None, meta: Some(meta) }
    }
}
```

## Repository Pattern

```rust
use async_trait::async_trait;

#[async_trait]
pub trait Repository<T, C, U>: Send + Sync {
    async fn find_all(&self, filters: Option<Filters>) -> Result<Vec<T>, AppError>;
    async fn find_by_id(&self, id: &str) -> Result<Option<T>, AppError>;
    async fn create(&self, data: C) -> Result<T, AppError>;
    async fn update(&self, id: &str, data: U) -> Result<T, AppError>;
    async fn delete(&self, id: &str) -> Result<(), AppError>;
}

// Concrete implementation
pub struct PostgresUserRepo {
    pool: sqlx::PgPool,
}

#[async_trait]
impl Repository<User, CreateUser, UpdateUser> for PostgresUserRepo {
    async fn find_by_id(&self, id: &str) -> Result<Option<User>, AppError> {
        sqlx::query_as!(User, "SELECT * FROM users WHERE id = $1", id)
            .fetch_optional(&self.pool)
            .await
            .map_err(AppError::Database)
    }
    // ... other methods
}
```

## Builder Pattern

Use the builder pattern for complex struct construction:

```rust
#[derive(Default)]
pub struct RequestBuilder {
    url: String,
    headers: Vec<(String, String)>,
    timeout_ms: Option<u64>,
    retries: u32,
}

impl RequestBuilder {
    pub fn new(url: impl Into<String>) -> Self {
        Self { url: url.into(), retries: 3, ..Default::default() }
    }

    pub fn header(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.headers.push((key.into(), value.into()));
        self
    }

    pub fn timeout(mut self, ms: u64) -> Self {
        self.timeout_ms = Some(ms);
        self
    }

    pub fn build(self) -> Result<Request, AppError> {
        // validate and construct
        Ok(Request { /* ... */ })
    }
}
```

## Newtype & Type-State Patterns

Prevent misuse at compile time:

```rust
// Newtype: prevent mixing up IDs
pub struct UserId(pub String);
pub struct OrderId(pub String);

// Type-state: enforce valid transitions
pub struct Order<S> {
    id: OrderId,
    _state: std::marker::PhantomData<S>,
}

pub struct Draft;
pub struct Confirmed;
pub struct Shipped;

impl Order<Draft> {
    pub fn confirm(self) -> Order<Confirmed> {
        Order { id: self.id, _state: std::marker::PhantomData }
    }
}

impl Order<Confirmed> {
    pub fn ship(self) -> Order<Shipped> {
        Order { id: self.id, _state: std::marker::PhantomData }
    }
}
```

## Extractor Pattern (Axum)

Leverage framework extractors for clean handler signatures:

```rust
use axum::{extract::{Path, State, Json}, http::StatusCode};

async fn get_user(
    State(repo): State<Arc<dyn UserRepository>>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<User>>, StatusCode> {
    let user = repo.find_by_id(&id).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    match user {
        Some(u) => Ok(Json(ApiResponse::ok(u))),
        None => Ok(Json(ApiResponse::err("User not found"))),
    }
}
```
