#!/usr/bin/env bash
# Runs ON the Namecheap server (sent over SSH by the deploy workflow).
#   remote.sh switch   <app dir> <cpanel|vps>   new release in <app dir>.new → live; previous kept as <app dir>.prev
#   remote.sh rollback <app dir> <cpanel|vps>   swap back to <app dir>.prev
set -euo pipefail
ACTION="$1"; APP="${2%/}"; MODE="$3"

restart() {
  if [ "$MODE" = "vps" ]; then
    cd "$APP" && pm2 startOrReload ecosystem.config.cjs --update-env && pm2 save >/dev/null
  else
    # cPanel (Passenger): touching tmp/restart.txt starts the new code on the next request.
    mkdir -p "$APP/tmp" && touch "$APP/tmp/restart.txt"
  fi
}

case "$ACTION" in
  switch)
    [ -f "$APP.new/server.js" ] || { echo "upload missing: $APP.new" >&2; exit 1; }
    # Anything the hosting panel keeps in the app folder (e.g. cPanel's .htaccess or logs) carries over.
    if [ -d "$APP" ]; then
      for f in .htaccess stderr.log; do [ -e "$APP/$f" ] && cp -p "$APP/$f" "$APP.new/" || true; done
    fi
    rm -rf "$APP.prev"
    [ -d "$APP" ] && mv "$APP" "$APP.prev"
    mv "$APP.new" "$APP"
    restart
    echo "live: $(cat "$APP/REVISION")"
    ;;
  rollback)
    [ -d "$APP.prev" ] || { echo "no previous release to go back to" >&2; exit 1; }
    mv "$APP" "$APP.bad" && mv "$APP.prev" "$APP" && mv "$APP.bad" "$APP.prev"
    restart
    echo "rolled back to: $(cat "$APP/REVISION")"
    ;;
  *) echo "unknown action $ACTION" >&2; exit 1 ;;
esac
