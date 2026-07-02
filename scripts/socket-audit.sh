#!/usr/bin/env bash
# client-socket-audit.sh
# Run from your MAIN/CLIENT repo root: bash scripts/socket-audit.sh
#
# Scans the whole repo for:
#   - socket.on(...) listeners in components/hooks
#   - socket.emit(...) calls from client -> server
#   - API calls (fetch / axios / React Query) that hit server routes
#   - custom socket hooks and how many times each is invoked
#
# Pair this output with server-socket-audit.sh's output to cross-reference.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
EXT="--include=*.ts --include=*.tsx --include=*.js --include=*.jsx"
BUILD_EXCLUDE='node_modules|dist|build|\.next|\.turbo|coverage'

sep() { echo "=========================================="; }

sep
echo "1. Socket LISTENERS registered on client (socket.on / socket?.on / s.on)"
sep
grep -rnoE '\b(socket|ws|io|s)\??\.on\(\s*["'"'"'][^"'"'"']+["'"'"']' $ROOT_DIR $EXT 2>/dev/null \
  | grep -vE "$BUILD_EXCLUDE" \
  | sed -E "s#.*\.on\(\s*[\"']([^\"']+)[\"'].*#\1#" \
  | sort -u

echo ""
sep
echo "2. Socket EMIT calls from client (socket.emit / socket?.emit / s.emit)"
sep
grep -rnoE '\b(socket|ws|io|s)\??\.emit\(\s*["'"'"'][^"'"'"']+["'"'"']' $ROOT_DIR $EXT 2>/dev/null \
  | grep -vE "$BUILD_EXCLUDE" \
  | sed -E "s#.*\.emit\(\s*[\"']([^\"']+)[\"'].*#\1#" \
  | sort -u

echo ""
sep
echo "3. Custom socket hooks — definitions"
sep
grep -rnE 'export (const|function) use[A-Za-z]*[Ss]ocket[A-Za-z]*' $ROOT_DIR $EXT 2>/dev/null \
  | grep -vE "$BUILD_EXCLUDE"

echo ""
sep
echo "4. Custom socket hooks — call sites (check for accidental multiple mounts)"
sep
grep -rnEo 'export (const|function) use[A-Za-z]*[Ss]ocket[A-Za-z]*' $ROOT_DIR $EXT 2>/dev/null \
  | sed -E 's/.*export (const|function) (use[A-Za-z]+).*/\2/' \
  | sort -u | while read -r hook; do
    echo "--- $hook ---"
    grep -rn "${hook}(" $ROOT_DIR $EXT 2>/dev/null \
      | grep -vE "${BUILD_EXCLUDE}|export (const|function) ${hook}"
    echo ""
done

echo ""
sep
echo "5. API calls via fetch()"
sep
grep -rnoE "fetch\(\s*[\`\"'][^\`\"']+[\`\"']" $ROOT_DIR $EXT 2>/dev/null \
  | grep -vE "$BUILD_EXCLUDE" \
  | sort -u

echo ""
sep
echo "6. API calls via axios"
sep
grep -rnoE "axios\.(get|post|put|patch|delete)\(\s*[\`\"'][^\`\"']+[\`\"']" $ROOT_DIR $EXT 2>/dev/null \
  | grep -vE "$BUILD_EXCLUDE" \
  | sort -u

echo ""
sep
echo "7. React Query hooks (useQuery / useMutation) — call sites"
sep
grep -rn 'useQuery(\|useMutation(' $ROOT_DIR $EXT 2>/dev/null \
  | grep -vE "$BUILD_EXCLUDE"

echo ""
sep
echo "8. Components/hooks importing 'socket' but with NO .on( or .emit( in the file"
echo "   (possible dead import / incomplete wiring)"
sep
grep -rlE "(import .*socket|from ['\"].*socket)" $ROOT_DIR $EXT 2>/dev/null \
  | grep -vE "$BUILD_EXCLUDE" | while read -r file; do
    if ! grep -qE '\.on\(|\.emit\(' "$file"; then
      echo "$file"
    fi
done

echo ""
sep
echo "9. Raw occurrences of specific event names anywhere in repo"
echo "   (catches constants/enums like SOCKET_EVENTS.LOCK_GRANTED)"
sep
for ev in "lock_denied" "lock_granted" "presence:remote-editing-start" "presence:remote-editing-stop" "presence:remote-editing-typing" "workspace:denied" "workspace-invitation" "workspace-invitation-response" "workspace:join"; do
  echo "--- $ev ---"
  grep -rln --exclude-dir={node_modules,dist,build,.next,.turbo,coverage,.git} -- "$ev" $ROOT_DIR $EXT 2>/dev/null
  echo ""
done

echo ""
echo "Done. Compare section 1 (client listeners) against server-side emits,"
echo "and section 2 (client emits) against server-side listeners/routes."
echo "Anything unmatched on either side needs manual inspection."