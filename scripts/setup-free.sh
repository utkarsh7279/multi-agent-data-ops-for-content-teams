#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v ollama >/dev/null 2>&1; then
  echo "Ollama is not installed. Install from https://ollama.com or run: brew install --cask ollama"
  exit 1
fi

if ! pgrep -x ollama >/dev/null 2>&1; then
  echo "Starting Ollama server..."
  ollama serve >/tmp/ollama.log 2>&1 &
fi

echo "Ensuring llama3.1:8b model is available..."
ollama pull llama3.1:8b

if [[ ! -f .env.local ]]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example"
fi

if ! grep -q '^SUPABASE_URL=' .env.local || ! grep -q '^SUPABASE_SERVICE_KEY=' .env.local; then
  echo "Please fill SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local"
fi

echo "Installing npm dependencies..."
npm install

echo "Free setup complete."
