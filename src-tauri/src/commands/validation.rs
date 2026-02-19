pub fn validate_name(name: &str) -> Result<(), String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("Name cannot be empty".to_string());
    }
    if trimmed.len() > 255 {
        return Err("Name is too long (max 255 characters)".to_string());
    }
    Ok(())
}
