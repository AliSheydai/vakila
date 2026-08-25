#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  Vokala — monorepo runner (development / production)
# ─────────────────────────────────────────────────────────────
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${ROOT_DIR}/services/app"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.yml"
APP_PORT="${APP_PORT:-3000}"

# ── Colors / style ──────────────────────────────────────────
if [[ -t 1 ]] && command -v tput >/dev/null 2>&1; then
  BOLD="$(tput bold)"
  DIM="$(tput dim)"
  RESET="$(tput sgr0)"
  RED="$(tput setaf 1)"
  GREEN="$(tput setaf 2)"
  YELLOW="$(tput setaf 3)"
  BLUE="$(tput setaf 4)"
  MAGENTA="$(tput setaf 5)"
  CYAN="$(tput setaf 6)"
  WHITE="$(tput setaf 7)"
else
  BOLD="" DIM="" RESET="" RED="" GREEN="" YELLOW="" BLUE="" MAGENTA="" CYAN="" WHITE=""
fi

icon_ok="✓"
icon_fail="✗"
icon_info="›"
icon_warn="!"

banner() {
  clear 2>/dev/null || true
  cat <<EOF
${CYAN}${BOLD}
 ██╗   ██╗ ██████╗ ██╗  ██╗ █████╗ ██╗      █████╗
 ██║   ██║██╔═══██╗██║ ██╔╝██╔══██╗██║     ██╔══██╗
 ██║   ██║██║   ██║█████╔╝ ███████║██║     ███████║
 ╚██╗ ██╔╝██║   ██║██╔═██╗ ██╔══██║██║     ██╔══██║
  ╚████╔╝ ╚██████╔╝██║  ██╗██║  ██║███████╗██║  ██║
   ╚═══╝   ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
${RESET}${DIM}  monorepo runner  ·  microservices ready${RESET}

EOF
}

say()   { printf "%s%s%s %s\n" "${BLUE}" "${icon_info}" "${RESET}" "$*"; }
ok()    { printf "%s%s%s %s\n" "${GREEN}" "${icon_ok}" "${RESET}" "$*"; }
warn()  { printf "%s%s%s %s\n" "${YELLOW}" "${icon_warn}" "${RESET}" "$*"; }
fail()  { printf "%s%s%s %s\n" "${RED}" "${icon_fail}" "${RESET}" "$*" >&2; }
header(){ printf "\n%s%s%s\n" "${BOLD}${MAGENTA}" "── $* ──" "${RESET}"; }

pause() {
  echo
  read -r -p "${DIM}Press Enter to continue…${RESET}" _
}

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "Required command not found: ${BOLD}$1${RESET}"
    return 1
  fi
}

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose -f "${COMPOSE_FILE}" "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f "${COMPOSE_FILE}" "$@"
  else
    fail "Docker Compose is not available"
    return 1
  fi
}

ensure_app_env() {
  if [[ ! -f "${APP_DIR}/.env" && -f "${APP_DIR}/.env.example" ]]; then
    warn "No .env found — copying from .env.example"
    cp "${APP_DIR}/.env.example" "${APP_DIR}/.env"
    say "Edit ${APP_DIR}/.env before deploying to production"
  fi
}

pkg_install() {
  header "Installing dependencies"
  need_cmd pnpm || need_cmd npm || { fail "Install pnpm or npm first"; return 1; }
  cd "${APP_DIR}"
  if command -v pnpm >/dev/null 2>&1; then
    if [[ -f pnpm-lock.yaml ]]; then
      pnpm install --frozen-lockfile || pnpm install
    else
      pnpm install
    fi
  else
    npm install
  fi
  ok "Dependencies ready"
}

run_dev() {
  banner
  header "Development mode"
  say "Service: ${BOLD}services/app${RESET} (Next.js)"
  say "URL:     ${CYAN}http://localhost:${APP_PORT}${RESET}"
  echo
  ensure_app_env
  need_cmd pnpm || need_cmd npm || exit 1

  if [[ ! -d "${APP_DIR}/node_modules" ]]; then
    pkg_install
  fi

  cd "${APP_DIR}"
  ok "Starting Next.js dev server…"
  echo
  if command -v pnpm >/dev/null 2>&1; then
    exec pnpm exec next dev -p "${APP_PORT}"
  else
    exec npx next dev -p "${APP_PORT}"
  fi
}

run_prod() {
  banner
  header "Production mode (containers)"
  need_cmd docker || exit 1
  ensure_app_env

  say "Building & starting stack…"
  echo
  compose up -d --build
  echo
  ok "Stack is up"
  say "App:     ${CYAN}http://localhost:${APP_PORT}${RESET}"
  say "Logs:    ${DIM}./run.sh logs${RESET}"
  say "Stop:    ${DIM}./run.sh stop${RESET}"
  echo
  compose ps
}

stop_prod() {
  banner
  header "Stopping containers"
  need_cmd docker || exit 1
  compose down
  ok "All services stopped"
}

show_logs() {
  need_cmd docker || exit 1
  header "Container logs (Ctrl+C to exit)"
  compose logs -f --tail=100
}

show_status() {
  banner
  header "Status"
  if command -v docker >/dev/null 2>&1; then
    if compose ps 2>/dev/null | grep -q .; then
      compose ps
    else
      warn "No compose services running"
    fi
  else
    warn "Docker not installed — cannot show container status"
  fi
  echo
  if [[ -d "${APP_DIR}/node_modules" ]]; then
    ok "Dev deps: node_modules present in services/app"
  else
    warn "Dev deps: not installed yet (./run.sh install)"
  fi
}

build_only() {
  banner
  header "Build production image"
  need_cmd docker || exit 1
  compose build
  ok "Image built"
}

print_menu() {
  banner
  printf "  %s1%s  Development   %s— local Next.js (hot reload)%s\n" "${GREEN}${BOLD}" "${RESET}" "${DIM}" "${RESET}"
  printf "  %s2%s  Production    %s— Docker containers%s\n" "${GREEN}${BOLD}" "${RESET}" "${DIM}" "${RESET}"
  printf "  %s3%s  Stop          %s— stop all containers%s\n" "${YELLOW}${BOLD}" "${RESET}" "${DIM}" "${RESET}"
  printf "  %s4%s  Status        %s— services & health%s\n" "${CYAN}${BOLD}" "${RESET}" "${DIM}" "${RESET}"
  printf "  %s5%s  Logs          %s— follow container logs%s\n" "${CYAN}${BOLD}" "${RESET}" "${DIM}" "${RESET}"
  printf "  %s6%s  Install       %s— install app dependencies%s\n" "${BLUE}${BOLD}" "${RESET}" "${DIM}" "${RESET}"
  printf "  %s7%s  Build image   %s— docker compose build%s\n" "${BLUE}${BOLD}" "${RESET}" "${DIM}" "${RESET}"
  printf "  %s0%s  Exit\n" "${RED}${BOLD}" "${RESET}"
  echo
  printf "  %sStructure:%s  services/app  (+ future microservices)\n" "${DIM}" "${RESET}"
  echo
}

interactive() {
  while true; do
    print_menu
    read -r -p "  ${BOLD}Choose [0-7]:${RESET} " choice
    case "${choice}" in
      1) run_dev ;;
      2) run_prod; pause ;;
      3) stop_prod; pause ;;
      4) show_status; pause ;;
      5) show_logs ;;
      6) pkg_install; pause ;;
      7) build_only; pause ;;
      0|q|Q) echo; ok "Bye"; exit 0 ;;
      *) warn "Invalid option"; sleep 1 ;;
    esac
  done
}

usage() {
  cat <<EOF
${BOLD}Usage:${RESET} ./run.sh [command]

  ${GREEN}dev${RESET}         Start Next.js in development mode
  ${GREEN}prod${RESET}        Build & run production containers
  ${GREEN}stop${RESET}        Stop containers
  ${GREEN}status${RESET}      Show service status
  ${GREEN}logs${RESET}        Follow container logs
  ${GREEN}install${RESET}     Install dependencies (services/app)
  ${GREEN}build${RESET}       Build Docker images only
  ${GREEN}help${RESET}        Show this help

  No arguments → interactive menu

${DIM}Env: APP_PORT (default 3000)${RESET}
EOF
}

main() {
  local cmd="${1:-}"
  case "${cmd}" in
    "")        interactive ;;
    dev|development) run_dev ;;
    prod|production|up) run_prod ;;
    stop|down) stop_prod ;;
    status|ps) show_status ;;
    logs)      show_logs ;;
    install)   pkg_install ;;
    build)     build_only ;;
    help|-h|--help) usage ;;
    *)
      fail "Unknown command: ${cmd}"
      usage
      exit 1
      ;;
  esac
}

main "$@"
