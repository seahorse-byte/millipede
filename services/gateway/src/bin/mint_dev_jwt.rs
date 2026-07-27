use millipede_gateway::mint_dev_token;

fn main() {
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "millipede-dev-secret".into());
    println!("{}", mint_dev_token(&secret));
}
