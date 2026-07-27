use rustls::pki_types::{CertificateDer, PrivateKeyDer};
use rustls::RootCertStore;
use rustls::ServerConfig;
use rustls::client::WebPkiServerVerifier;
use rustls::server::WebPkiClientVerifier;
use rustls_pemfile::{certs, pkcs8_private_keys};
use std::fs::File;
use std::io::{BufReader, Error, ErrorKind, Result};
use std::path::{Path, PathBuf};
use std::sync::Arc;

pub fn certs_dir() -> PathBuf {
    std::env::var("MILLIPEDE_CERTS_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("infra/certs/dev"))
}

pub fn mtls_enabled() -> bool {
    matches!(
        std::env::var("MILLIPEDE_MTLS").as_deref(),
        Ok("1") | Ok("true") | Ok("TRUE")
    )
}

pub fn ensure_crypto_provider() {
    use std::sync::Once;
    static INIT: Once = Once::new();
    INIT.call_once(|| {
        rustls::crypto::aws_lc_rs::default_provider()
            .install_default()
            .expect("rustls crypto provider");
    });
}

pub fn load_certs(path: &Path) -> Result<Vec<CertificateDer<'static>>> {
    let file = File::open(path)?;
    let mut reader = BufReader::new(file);
    certs(&mut reader)
        .collect::<std::result::Result<Vec<_>, _>>()
        .map_err(|err| Error::new(ErrorKind::InvalidData, err))
}

pub fn load_key(path: &Path) -> Result<PrivateKeyDer<'static>> {
    let file = File::open(path)?;
    let mut reader = BufReader::new(file);
    let mut keys = pkcs8_private_keys(&mut reader)
        .collect::<std::result::Result<Vec<_>, _>>()
        .map_err(|err| Error::new(ErrorKind::InvalidData, err))?;
    keys.pop()
        .ok_or_else(|| Error::new(ErrorKind::InvalidData, "no private key found"))
        .map(PrivateKeyDer::from)
}

fn load_ca_roots(dir: &Path) -> Result<Arc<RootCertStore>> {
    let mut roots = RootCertStore::empty();
    for cert in load_certs(&dir.join("ca.pem"))? {
        roots
            .add(cert)
            .map_err(|err| Error::new(ErrorKind::InvalidData, err))?;
    }
    Ok(Arc::new(roots))
}

pub fn build_public_server_config(service_name: &str, dir: &Path) -> Result<Arc<ServerConfig>> {
    let cert_path = dir.join(format!("{service_name}.pem"));
    let key_path = dir.join(format!("{service_name}-key.pem"));
    let certs = load_certs(&cert_path)?;
    let key = load_key(&key_path)?;

    let config = ServerConfig::builder()
        .with_no_client_auth()
        .with_single_cert(certs, key)
        .map_err(|err| Error::new(ErrorKind::InvalidData, err))?;

    Ok(Arc::new(config))
}

pub fn build_mtls_server_config(service_name: &str, dir: &Path) -> Result<Arc<ServerConfig>> {
    let cert_path = dir.join(format!("{service_name}.pem"));
    let key_path = dir.join(format!("{service_name}-key.pem"));

    let certs = load_certs(&cert_path)?;
    let key = load_key(&key_path)?;
    let roots = load_ca_roots(dir)?;

    let client_verifier = WebPkiClientVerifier::builder(roots)
        .build()
        .map_err(|err| Error::new(ErrorKind::InvalidData, err))?;

    let config = ServerConfig::builder()
        .with_client_cert_verifier(client_verifier)
        .with_single_cert(certs, key)
        .map_err(|err| Error::new(ErrorKind::InvalidData, err))?;

    Ok(Arc::new(config))
}

pub fn build_client_config(client_name: &str, dir: &Path) -> Result<Arc<rustls::ClientConfig>> {
    let cert_path = dir.join(format!("{client_name}.pem"));
    let key_path = dir.join(format!("{client_name}-key.pem"));

    let certs = load_certs(&cert_path)?;
    let key = load_key(&key_path)?;
    let roots = load_ca_roots(dir)?;

    let verifier = WebPkiServerVerifier::builder(roots)
        .build()
        .map_err(|err| Error::new(ErrorKind::InvalidData, err))?;

    let config = rustls::ClientConfig::builder()
        .with_webpki_verifier(verifier)
        .with_client_auth_cert(certs, key)
        .map_err(|err| Error::new(ErrorKind::InvalidData, err))?;

    Ok(Arc::new(config))
}
