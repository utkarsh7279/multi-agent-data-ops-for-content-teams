#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v ollama >/dev/null 2>&1; then
  echo "Ollama is not installed. Run: npm run setup:free"
  exit 1
fi

if ! pgrep -x ollama >/dev/null 2>&1; then
  echo "Starting Ollama server..."
  ollama serve >/tmp/ollama.log 2>&1 &
fi

echo "Starting Next.js dev server and local worker poller..."
npm run dev &
DEV_PID=$!

cleanup() {
  if kill -0 "$DEV_PID" >/dev/null 2>&1; then
    kill "$DEV_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

node scripts/worker-poller.mjs
