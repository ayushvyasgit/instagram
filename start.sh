#!/bin/bash

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Installing backend dependencies..."
cd "$ROOT_DIR/backend" && npm i

echo "==> Installing frontend dependencies..."
cd "$ROOT_DIR/frontend" && npm i --legacy-peer-deps

echo "==> Building and starting all services via Docker Compose..."
cd "$ROOT_DIR" && docker-compose -f docker-compose.production.yml up --build
