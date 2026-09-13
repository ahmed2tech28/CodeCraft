#!/usr/bin/env bash
# ==============================================================================
# CodeCraft Healthcheck Script
# ==============================================================================
set -e

PORT="${PORT:-3001}"
HOST="${HOST:-localhost}"

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://${HOST}:${PORT}/api/health")

if [ "$RESPONSE" -eq 200 ]; then
  echo "CodeCraft Server is healthy (HTTP 200)"
  exit 0
else
  echo "CodeCraft Server healthcheck failed with HTTP status: $RESPONSE"
  exit 1
fi
