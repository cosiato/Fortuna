# Rust Coding Style

> This file extends [common/coding-style.md](../common/coding-style.md) with Rust specific content.

## Immutability

Leverage Rust's ownership system — variables are immutable by default:

```rust
// WRONG: Unnecessary mutation
fn update_user(user: &mut User, name: String) {
    user.name = name; // MUTATION!
}

// CORRECT: Return a new value
fn update_user(user: &User, name: String) -> User {
    User {
        name,
        ..user.clone()
    }
}
```

Use `mut` only when genuinely required (e.g., builders, accumulators in tight loops). Prefer functional iterator chains over mutable loop variables:

```rust
// WRONG: Mutable accumulator
let mut results = Vec::new();
for item in items {
    if item.is_valid() {
        results.push(item.transform());
    }
}

// CORRECT: Functional chain
let results: Vec<_> = items
    .iter()
    .filter(|item| item.is_valid())
    .map(|item| item.transform())
    .collect();
```

## Error Handling

Use `Result` and the `?` operator — never `unwrap()` or `expect()` in production code:

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("Validation failed: {0}")]
    Validation(String),
    #[error("Not found: {entity} with id {id}")]
    NotFound { entity: &'static str, id: String },
}

async fn find_user(id: &str) -> Result<User, AppError> {
    let user = db::query_user(id)
        .await?
        .ok_or_else(|| AppError::NotFound {
            entity: "User",
            id: id.to_string(),
        })?;
    Ok(user)
}
```

- Define domain-specific error enums with `thiserror`
- Use `anyhow::Result` in application code and binaries
- Use typed errors (`thiserror`) in library code
- Add context to errors with `.map_err()` or `anyhow::Context`
- Reserve `unwrap()` / `expect()` for tests and provably-safe cases only

## Input Validation

Use strong types and the `validator` crate at system boundaries:

```rust
use validator::Validate;

#[derive(Debug, Validate, Deserialize)]
pub struct CreateUserRequest {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 1, max = 100))]
    pub name: String,
    #[validate(range(min = 0, max = 150))]
    pub age: u8,
}

fn handle_request(input: CreateUserRequest) -> Result<(), AppError> {
    input.validate().map_err(|e| AppError::Validation(e.to_string()))?;
    // proceed with validated data
    Ok(())
}
```

Prefer newtypes to enforce invariants at compile time:

```rust
pub struct EmailAddress(String);

impl EmailAddress {
    pub fn new(value: &str) -> Result<Self, AppError> {
        if value.contains('@') && value.len() <= 254 {
            Ok(Self(value.to_string()))
        } else {
            Err(AppError::Validation("Invalid email".into()))
        }
    }
}
```

## Console Output

- No `println!` or `dbg!` in production code
- Use `tracing` (preferred) or `log` crate for structured logging
- Gate verbose output behind tracing levels (`debug!`, `trace!`)

```rust
use tracing::{info, error, instrument};

#[instrument(skip(db))]
async fn process_order(order_id: &str, db: &Db) -> Result<(), AppError> {
    info!(order_id, "Processing order");
    // ...
    error!(order_id, error = %e, "Order processing failed");
}
```
