#!/usr/bin/env bash
# Build Dibs on THIS machine (your laptop) and run it on a server that never builds anything.
#
#   scripts/ship.sh ubuntu@1.2.3.4              (or: SERVER=ubuntu@1.2.3.4 scripts/ship.sh)
#
# What it does, in order:
#   1. asks the server which CPU it has, so the image is built for that (a Mac with an M-chip building for an
#      Intel server needs this; Docker emulates the other CPU, which is slower but works)
#   2. builds the image here
#   3. sends it over ssh (no registry, no account needed) and loads it on the server
#   4. copies docker-compose.yml, nginx.conf and the database schema next to it
#   5. first time: stops and tells you to fill in .env on the server. Later: restarts the app on the new image.
#
# Needs here: Docker (with buildx) and ssh. Needs on the server: Docker with the compose plugin, and your ssh login.
# Options (environment variables):
#   REMOTE_DIR=dibs        folder on the server, relative to the login's home (default dibs)
#   DIBS_IMAGE=dibs:latest image name
#   PLATFORM=linux/amd64   skip the CPU check (linux/amd64 for Intel/AMD servers, linux/arm64 for Graviton)
#   SSH_OPTS="-i ~/.ssh/key.pem"   extra ssh options (the same ones you use to log in)
#   BUILD_FLAGS="..."      extra flags for docker buildx build, e.g. "--network host --progress plain"
#   SKIP_BUILD=1           do not build; send the image that is already on this machine
#   DRY_RUN=1              only print what would run
set -euo pipefail
cd "$(dirname "$0")/.."

SERVER="${1:-${SERVER:-}}"
[ -n "$SERVER" ] || { sed -n '2,19p' "$0" | sed 's/^# \{0,1\}//'; exit 1; }
REMOTE_DIR="${REMOTE_DIR:-dibs}"
IMAGE="${DIBS_IMAGE:-dibs:latest}"
SSH_OPTS="${SSH_OPTS:-}"

run() { echo "+ $*"; [ "${DRY_RUN:-}" = "1" ] || "$@"; }
say() { printf '\n== %s\n' "$*"; }
ssh_() { # shellcheck disable=SC2086
  ssh $SSH_OPTS "$SERVER" "$@"; }

if [ -z "${PLATFORM:-}" ]; then
  say "Asking $SERVER which CPU it has"
  if [ "${DRY_RUN:-}" = "1" ]; then ARCH="x86_64"; else ARCH="$(ssh_ uname -m)"; fi
  case "$ARCH" in
    x86_64|amd64) PLATFORM="linux/amd64" ;;
    aarch64|arm64) PLATFORM="linux/arm64" ;;
    *) echo "Unknown server CPU '$ARCH'. Set PLATFORM=linux/amd64 or linux/arm64 and run again."; exit 1 ;;
  esac
fi
echo "Building for $PLATFORM"

say "1/4 Building the image here"
if [ "${SKIP_BUILD:-}" = "1" ]; then
  echo "Skipping the build: using the $IMAGE already on this machine"
else
  # shellcheck disable=SC2086
  run docker buildx build --platform "$PLATFORM" ${BUILD_FLAGS:-} -t "$IMAGE" --load .
fi

say "2/4 Sending it to $SERVER (roughly 100 MB compressed)"
PREVIOUS="${IMAGE%%:*}:previous"
if [ "${DRY_RUN:-}" = "1" ]; then
  echo "+ ssh $SERVER 'docker tag $IMAGE $PREVIOUS' (keeps the version now running, for a rollback)"
  echo "+ docker save $IMAGE | gzip | ssh $SERVER 'gunzip | docker load'"
else
  # keep whatever is running now, so it can come back with:
  #   docker tag $PREVIOUS $IMAGE && docker compose up -d --no-build
  ssh_ "docker image inspect '$IMAGE' >/dev/null 2>&1 && docker tag '$IMAGE' '$PREVIOUS' && echo 'Kept the current version as $PREVIOUS' || true" </dev/null
  docker save "$IMAGE" | gzip | ssh_ 'gunzip | docker load'
fi

say "3/4 Copying the compose file, nginx.conf and schema"
if [ "${DRY_RUN:-}" = "1" ]; then
  echo "+ tar czf - docker-compose.yml deploy/nginx.conf supabase/schema.sql .env.example | ssh $SERVER 'mkdir -p $REMOTE_DIR && tar xzf - -C $REMOTE_DIR'"
else
  tar czf - docker-compose.yml deploy/nginx.conf supabase/schema.sql .env.example | ssh_ "mkdir -p '$REMOTE_DIR' && tar xzf - -C '$REMOTE_DIR'"
fi

say "4/4 Starting it"
if [ "${DRY_RUN:-}" = "1" ]; then
  echo "+ ssh $SERVER (if $REMOTE_DIR/.env is missing: create it from .env.example and stop; else docker compose up -d --no-build)"
  exit 0
fi
ssh_ "cd '$REMOTE_DIR' && if [ ! -f .env ]; then cp .env.example .env; echo CREATED; else echo EXISTS; fi" | {
  read -r state
  if [ "$state" = "CREATED" ]; then
    cat <<MSG

The image is on the server. One thing left: the server has no settings yet.

  ssh ${SSH_OPTS:+$SSH_OPTS }$SERVER
  cd $REMOTE_DIR && nano .env          # set APP_URL, POSTGRES_PASSWORD and one vision key
  docker compose up -d --no-build

nginx on the server does HTTPS and forwards to the app on 127.0.0.1:3000; its config is deploy/nginx.conf
(see "nginx in front" in docs/DEPLOY.md).

Next time, just run scripts/ship.sh again: it keeps your .env and restarts the app on the new image.
MSG
    exit 0
  fi
  ssh_ "cd '$REMOTE_DIR' && DIBS_IMAGE='$IMAGE' docker compose up -d --no-build && docker image prune -f >/dev/null && docker compose ps" </dev/null
  echo; echo "Done. Check: curl https://\$(your domain)/api/health"
}
