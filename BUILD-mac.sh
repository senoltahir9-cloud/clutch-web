#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo ""
echo "ClutchApp macOS build"
echo "---------------------"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js bulunamadi. Mac uzerinde once Node.js kurun:"
  echo "https://nodejs.org"
  echo "veya Homebrew varsa: brew install node"
  exit 1
fi

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Bu script macOS uzerinde calistirilmalidir."
  echo "Windows'ta Mac paketi uretmek yerine GitHub Actions macOS build kullanin."
  exit 1
fi

export CSC_IDENTITY_AUTO_DISCOVERY=false

echo "Node: $(node --version)"
echo "npm:  $(npm --version)"
echo ""

echo "[1/3] Bagimliliklar yukleniyor..."
npm ci

echo ""
echo "[2/3] macOS DMG paketleri uretiliyor..."
npm run dist:mac

echo ""
echo "[3/3] Tamamlandi."
echo "Cikti dosyalari dist/ klasorunde:"
ls -lh dist/*.dmg 2>/dev/null || true

echo ""
echo "Mac'te kullanici DMG dosyasini acar, ClutchApp'i Applications klasorune surukler."
