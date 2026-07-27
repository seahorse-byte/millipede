use jsonwebtoken::{encode, EncodingKey, Header};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,
    pub scope: String,
    pub exp: usize,
}

pub fn mint_dev_token(secret: &str) -> String {
    let exp = jsonwebtoken::get_current_timestamp() as usize + 60 * 60 * 24;
    let claims = Claims {
        sub: "manager-dev".into(),
        scope: "team_radar:manager".into(),
        exp,
    };
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .expect("mint jwt")
}
