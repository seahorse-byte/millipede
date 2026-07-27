#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="$SCRIPT_DIR/dev"
DAYS=825

mkdir -p "$OUT"
cd "$OUT"

echo "Generating Millipede dev PKI in $OUT"

openssl genrsa -out ca-key.pem 4096
openssl req -x509 -new -nodes -key ca-key.pem -sha256 -days "$DAYS" \
  -subj "/CN=Millipede Dev CA" -out ca.pem

issue() {
  local name="$1"
  local cn="$2"
  openssl genrsa -out "${name}-key.pem" 2048
  openssl req -new -key "${name}-key.pem" \
    -subj "/CN=${cn}" -out "${name}.csr"
  cat > "${name}.ext" <<EOF
subjectAltName = DNS:localhost, DNS:${cn}, IP:127.0.0.1
EOF
  openssl x509 -req -in "${name}.csr" -CA ca.pem -CAkey ca-key.pem \
    -CAcreateserial -out "${name}.pem" -days "$DAYS" -sha256 \
    -extfile "${name}.ext"
  rm "${name}.csr" "${name}.ext"
}

issue gateway "millipede-gateway"
issue ingestion "millipede-ingestion"
issue analyzer "millipede-analyzer"

cat > README.txt <<'EOF'
Dev mTLS certificates for Millipede Stage 2 (local only).

Files:
  ca.pem              Trust anchor
  gateway.pem/key     Gateway HTTPS + client cert to backends
  ingestion.pem/key   Ingestion mTLS server
  analyzer.pem/key    Analyzer mTLS server

Regenerate: bash infra/certs/generate-dev-certs.sh
EOF

echo "Done. Trust anchor: $OUT/ca.pem"
