#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT/build/MarkUp.app"

cd "$ROOT/web"
if [ ! -d node_modules ]; then
  npm install
fi
npm run build

cd "$ROOT"
swift build -c release

rm -rf "$APP_DIR"
mkdir -p "$APP_DIR/Contents/MacOS" "$APP_DIR/Contents/Resources/Web"

cp "$ROOT/.build/release/MarkUp" "$APP_DIR/Contents/MacOS/MarkUp"
cp "$ROOT/Resources/Info.plist" "$APP_DIR/Contents/Info.plist"
cp "$ROOT/Resources/AppIcon.icns" "$APP_DIR/Contents/Resources/AppIcon.icns"
cp -R "$ROOT/web/dist/." "$APP_DIR/Contents/Resources/Web/"

chmod +x "$APP_DIR/Contents/MacOS/MarkUp"
echo "$APP_DIR"
