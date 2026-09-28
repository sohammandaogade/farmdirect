#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "--- Installing frontend dependencies ---"
cd frontend
npm install
echo "--- Building React SPA ---"
npm run build
cd ..

echo "--- Installing Python dependencies ---"
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "--- Build Completed Successfully! ---"
