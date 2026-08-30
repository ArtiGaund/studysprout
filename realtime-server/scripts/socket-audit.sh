#!/usr/bin/env bash
# server-socket-audit.sh
# Run from SERVER repo root: bash scripts/socket-audit.sh
#
# Scans the whole repo (not one hardcoded file) for:
#   - HTTP routes (Express/Fastify style + Nest decorators)
#   - socket.io / ws emit calls
#   - socket.io / ws listener registrations (socket.on / io.on)
#   - custom emit*() wrapper functions and where they're defined

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
EXT="--include=*.ts --include=*.tsx --include=*.js --include=*.mjs"

sep() { echo "=========================================="; }

sep
echo "1. HTTP routes registered (Express/Fastify style)"
sep
grep -rnE '\.(get|post|put|patch|delete)\(\s*["'"'"']' $ROOT_DIR $EXT 2>/dev/null \
  | grep -vE 'node_modules|dist|build' \
  | sed -E 's#.*\.(get|post|put|patch|delete)\(\s*["'"'"']([^"'"'"']+)["'"'"'].*#\1 \2#' \
  | sort -u

echo ""
sep
echo "2. HTTP routes registered (NestJS decorators)"
sep
grep -rnE '@(Get|Post|Put|Patch|Delete)\(' $ROOT_DIR $EXT 2>/dev/null \
  | grep -vE 'node_modules|dist|build' \
  | sort -u

echo ""
sep
echo "3. Socket EMIT calls (io.emit / socket.emit / .to(...).emit)"
sep
grep -rnoE '(io|socket|namespace|nsp)(\.to\([^)]*\))?\.emit\(\s*["'"'"'][^"'"'"']+["'"'"']' $ROOT_DIR $EXT 2>/dev/null \
  | grep -vE 'node_modules|dist|build' \
  | sed -E "s#.*emit\(\s*[\"']([^\"']+)[\"'].*#\1#" \
  | sort -u

echo ""
sep
echo "4. Socket LISTENERS registered (socket.on / io.on)"
sep
grep -rnoE '(io|socket)\.on\(\s*["'"'"'][^"'"'"']+["'"'"']' $ROOT_DIR $EXT 2>/dev/null \
  | grep -vE 'node_modules|dist|build' \
  | sed -E "s#.*\.on\(\s*[\"']([^\"']+)[\"'].*#\1#" \
  | sort -u

echo ""
sep
echo "5. Custom emit*() wrapper functions (definitions)"
sep
grep -rnE 'export (const|function) emit[A-Za-z]+' $ROOT_DIR $EXT 2>/dev/null \
  | grep -vE 'node_modules|dist|build'

echo ""
sep
echo "6. Where each emit*() wrapper is actually called"
sep
grep -rEo 'export (const|function) emit[A-Za-z]+' $ROOT_DIR $EXT 2>/dev/null \
  | sed -E 's/.*export (const|function) (emit[A-Za-z]+).*/\2/' \
  | sort -u | while read -r fn; do
    count=$(grep -rl "$fn(" $ROOT_DIR $EXT 2>/dev/null | grep -vE 'node_modules|dist|build' | wc -l)
    echo "$fn -> referenced in $count file(s)"
done

echo ""
sep
echo "7. Raw event name string literals near 'emit' or 'on(' (catch-all safety net)"
sep
grep -rnoE '["'"'"'][a-zA-Z0-9_:-]+["'"'"']\s*,?\s*(?=)' $ROOT_DIR $EXT 2>/dev/null \
  | grep -iE 'emit|socket\.on|io\.on' \
  | grep -vE 'node_modules|dist|build' \
  | sort -u | head -100

echo ""
echo "Done. Cross-check section 3 (emits) vs section 4 (listeners) vs client-side"
echo "listeners/emits from client-socket-audit.sh. Anything emitted server-side"
echo "with no matching client listener (or vice versa) needs manual inspection."