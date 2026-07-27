Dev mTLS certificates for Millipede Stage 2 (local only).

Files:
  ca.pem              Trust anchor
  gateway.pem/key     Gateway HTTPS + client cert to backends
  ingestion.pem/key   Ingestion mTLS server
  analyzer.pem/key    Analyzer mTLS server

Regenerate: bash infra/certs/generate-dev-certs.sh
