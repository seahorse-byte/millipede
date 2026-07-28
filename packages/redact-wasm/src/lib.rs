use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use wasm_bindgen::prelude::*;

fn token(label: &str, value: &str) -> String {
    let mut hasher = DefaultHasher::new();
    value.hash(&mut hasher);
    format!("[{}:{:06x}]", label, hasher.finish() & 0xffffff)
}

fn looks_like_email(word: &str) -> bool {
    let parts: Vec<&str> = word.split('@').collect();
    parts.len() == 2 && !parts[0].is_empty() && parts[1].contains('.')
}

fn looks_like_phone(word: &str) -> bool {
    let digits = word.chars().filter(|c| c.is_ascii_digit()).count();
    digits >= 10 && digits <= word.len()
}

#[wasm_bindgen]
pub fn redact_pii_deterministic(input: &str) -> String {
    input
        .split_whitespace()
        .map(|word| {
            if looks_like_email(word) {
                token("EMAIL", word)
            } else if looks_like_phone(word) {
                token("PHONE", word)
            } else {
                word.to_string()
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn redacts_email_deterministically() {
        let first = redact_pii_deterministic("Contact alice@example.com today");
        let second = redact_pii_deterministic("Contact alice@example.com today");
        assert_eq!(first, second);
        assert!(!first.contains("alice@example.com"));
        assert!(first.contains("[EMAIL:"));
    }
}
