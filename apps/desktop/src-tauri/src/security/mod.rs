const MASK_PREFIX: &str = "plain:";

pub fn encrypt_secret(value: &str) -> String {
    format!("{MASK_PREFIX}{value}")
}

pub fn decrypt_secret(value: &str) -> String {
    value.strip_prefix(MASK_PREFIX).unwrap_or(value).to_string()
}
