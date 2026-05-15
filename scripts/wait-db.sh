#!/bin/sh
# Aguarda o PostgreSQL estar pronto E o schema aplicado.
# Uso: ./scripts/wait-db.sh

MAX_ATTEMPTS=30
ATTEMPT=0

echo "⏳ Aguardando PostgreSQL aceitar conexões..."

until docker compose exec -T postgres pg_isready -U escala_louvor -d escala_louvor > /dev/null 2>&1; do
  ATTEMPT=$((ATTEMPT + 1))
  if [ "$ATTEMPT" -ge "$MAX_ATTEMPTS" ]; then
    echo "❌ Timeout: PostgreSQL não ficou pronto a tempo."
    exit 1
  fi
  sleep 1
done

echo "✅ PostgreSQL aceitando conexões. Aguardando schema..."

ATTEMPT=0
until docker compose exec -T postgres psql -U escala_louvor -d escala_louvor -c "SELECT 1 FROM users LIMIT 1" > /dev/null 2>&1; do
  ATTEMPT=$((ATTEMPT + 1))
  if [ "$ATTEMPT" -ge "$MAX_ATTEMPTS" ]; then
    echo "❌ Timeout: schema não foi aplicado a tempo."
    exit 1
  fi
  sleep 1
done

echo "✅ Banco pronto."
