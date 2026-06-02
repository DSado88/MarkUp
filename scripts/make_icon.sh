#!/usr/bin/env bash
set -euo pipefail

# Regenerate AppIcon.icns from AppIcon.svg.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SVG="$ROOT/Resources/AppIcon.svg"
ICNS="$ROOT/Resources/AppIcon.icns"

MASTER="$(mktemp -d)/icon_master.png"
ISET="$(mktemp -d)/AppIcon.iconset"
mkdir -p "$ISET"

# Render a 1024 master from the SVG via Quick Look, then size down.
qlmanage -t -s 1024 -o "$(dirname "$MASTER")" "$SVG" >/dev/null 2>&1
sips -z 1024 1024 "$(dirname "$MASTER")/AppIcon.svg.png" --out "$MASTER" >/dev/null

gen() { sips -z "$1" "$1" "$MASTER" --out "$ISET/$2" >/dev/null; }
gen 16   icon_16x16.png
gen 32   icon_16x16@2x.png
gen 32   icon_32x32.png
gen 64   icon_32x32@2x.png
gen 128  icon_128x128.png
gen 256  icon_128x128@2x.png
gen 256  icon_256x256.png
gen 512  icon_256x256@2x.png
gen 512  icon_512x512.png
gen 1024 icon_512x512@2x.png

iconutil -c icns "$ISET" -o "$ICNS"
echo "$ICNS"
