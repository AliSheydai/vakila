#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  وکلا (Vakila) — runner با تجربهٔ کاربری بهتر
#  Development: Postgres در Docker + Next watch + migrate
#  Production:  کل استک در کانتینر
# ─────────────────────────────────────────────────────────────
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${ROOT_DIR}/services/app"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.yml"
APP_PORT="${APP_PORT:-4000}"
COMPOSE_PROJECT="vokala"

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
else
  BOLD="" DIM="" RESET="" RED="" GREEN="" YELLOW="" BLUE="" MAGENTA="" CYAN=""
fi

icon_ok="✓"
icon_fail="✗"
icon_info="›"
icon_warn="!"
icon_spin="…"

banner() {
  clear 2>/dev/null || true
  cat <<EOF
${CYAN}${BOLD}
 ██╗   ██╗ █████╗ ██╗  ██╗██╗██╗      █████╗
 ██║   ██║██╔══██╗██║ ██╔╝██║██║     ██╔══██╗
 ██║   ██║███████║█████╔╝ ██║██║     ███████║
 ╚██╗ ██╔╝██╔══██║██╔═██╗ ██║██║     ██╔══██║
  ╚████╔╝ ██║  ██║██║  ██╗██║███████╗██║  ██║
   ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚══════╝╚═╝  ╚═╝
${RESET}${DIM}  سامانه مدیریت وکالت  ·  Postgres + OTP + Realtime${RESET}

EOF
}

say()   { printf "%s%s%s %s\n" "${BLUE}" "${icon_info}" "${RESET}" "$*"; }
ok()    { printf "%s%s%s %s\n" "${GREEN}" "${icon_ok}" "${RESET}" "$*"; }
warn()  { printf "%s%s%s %s\n" "${YELLOW}" "${icon_warn}" "${RESET}" "$*"; }
fail()  { printf "%s%s%s %s\n" "${RED}" "${icon_fail}" "${RESET}" "$*" >&2; }
header(){ printf "\n%s%s%s\n" "${BOLD}${MAGENTA}" "── $* ──" "${RESET}"; }
step()  { printf "  %s%s%s %s\n" "${DIM}" "${icon_spin}" "${RESET}" "$*"; }

pause() {
  echo
  read -r -p "${DIM}Enter برای ادامه…${RESET}" _
}

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "دستور لازم پیدا نشد: ${BOLD}$1${RESET}"
    return 1
  fi
}

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose -f "${COMPOSE_FILE}" --project-name "${COMPOSE_PROJECT}" "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f "${COMPOSE_FILE}" -p "${COMPOSE_PROJECT}" "$@"
  else
    fail "Docker Compose در دسترس نیست"
    return 1
  fi
}

ensure_env() {
  if [[ ! -f "${ROOT_DIR}/.env" && -f "${ROOT_DIR}/.env.example" ]]; then
    warn "فایل .env ریشه نبود — از .env.example کپی شد"
    cp "${ROOT_DIR}/.env.example" "${ROOT_DIR}/.env"
  fi
  if [[ ! -f "${APP_DIR}/.env" && -f "${APP_DIR}/.env.example" ]]; then
    warn "فایل services/app/.env نبود — از .env.example کپی شد"
    cp "${APP_DIR}/.env.example" "${APP_DIR}/.env"
    say "قبل از production، ${APP_DIR}/.env را ویرایش کنید"
  fi
}

load_root_env() {
  if [[ -f "${ROOT_DIR}/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "${ROOT_DIR}/.env"
    set +a
    APP_PORT="${APP_PORT:-4000}"
  fi
}

pkg_install() {
  header "نصب وابستگی‌ها"
  need_cmd pnpm || need_cmd npm || { fail "pnpm یا npm لازم است"; return 1; }
  cd "${APP_DIR}"
  if command -v pnpm >/dev/null 2>&1 && [[ -f pnpm-lock.yaml ]]; then
    pnpm install || pnpm install --no-frozen-lockfile
  elif command -v npm >/dev/null 2>&1; then
    npm install
  else
    pnpm install
  fi
  ok "وابستگی‌ها آماده است"
}

wait_postgres() {
  local tries=30
  step "انتظار برای آماده شدن Postgres…"
  for ((i=1; i<=tries; i++)); do
    if compose exec -T postgres pg_isready -U "${POSTGRES_USER:-vakila}" -d "${POSTGRES_DB:-vakila}" >/dev/null 2>&1; then
      ok "Postgres آماده است"
      return 0
    fi
    sleep 1
  done
  fail "Postgres در زمان مقرر آماده نشد"
  return 1
}

start_postgres() {
  header "پایگاه‌داده (Docker)"
  need_cmd docker || exit 1
  ensure_env
  load_root_env
  step "بالا آوردن کانتینر Postgres…"
  compose up -d postgres
  wait_postgres
}

run_migrations() {
  header "Migrationها"
  cd "${APP_DIR}"
  if [[ ! -d "${APP_DIR}/node_modules" ]]; then
    pkg_install
  fi
  if command -v pnpm >/dev/null 2>&1; then
    pnpm migrate
  else
    npm run migrate
  fi
  ok "Migrationها اعمال شدند"
}

run_dev() {
  banner
  header "حالت Development"
  say "Postgres در Docker + Next.js watch + WebSocket"
  say "آدرس: ${CYAN}http://localhost:${APP_PORT}${RESET}"
  echo
  ensure_env
  load_root_env
  need_cmd docker || exit 1
  need_cmd pnpm || need_cmd npm || exit 1

  if [[ ! -d "${APP_DIR}/node_modules" ]]; then
    pkg_install
  fi

  start_postgres
  run_migrations

  header "سرور توسعه"
  ok "در حال اجرا… (Ctrl+C برای توقف Next — Postgres روشن می‌ماند)"
  echo
  cd "${APP_DIR}"
  if command -v pnpm >/dev/null 2>&1; then
    exec pnpm dev
  else
    exec npm run dev
  fi
}

run_prod() {
  banner
  header "حالت Production (کانتینرها)"
  need_cmd docker || exit 1
  ensure_env
  load_root_env

  say "ساخت و اجرای استک کامل…"
  echo
  compose up -d --build
  echo
  ok "استک بالا آمد"
  say "برنامه:  ${CYAN}http://localhost:${APP_PORT}${RESET}"
  say "لاگ:     ${DIM}./run.sh logs${RESET}"
  say "توقف:    ${DIM}./run.sh stop${RESET}"
  echo
  compose ps
}

stop_all() {
  banner
  header "توقف سرویس‌ها"
  need_cmd docker || exit 1
  compose down
  ok "همه کانتینرها متوقف شدند"
}

show_logs() {
  need_cmd docker || exit 1
  header "لاگ کانتینرها (Ctrl+C خروج)"
  compose logs -f --tail=120
}

show_status() {
  banner
  header "وضعیت"
  if command -v docker >/dev/null 2>&1; then
    if compose ps 2>/dev/null | grep -q .; then
      compose ps
    else
      warn "سرویس compose در حال اجرا نیست"
    fi
  else
    warn "Docker نصب نیست"
  fi
  echo
  if [[ -d "${APP_DIR}/node_modules" ]]; then
    ok "Dev deps: node_modules موجود است"
  else
    warn "Dev deps: هنوز نصب نشده (./run.sh install)"
  fi
  if [[ -f "${APP_DIR}/.env" ]]; then
    ok "Env برنامه: services/app/.env"
  else
    warn "Env برنامه موجود نیست"
  fi
}

build_only() {
  banner
  header "ساخت ایمیج Production"
  need_cmd docker || exit 1
  ensure_env
  compose build
  ok "ایمیج ساخته شد"
}

migrate_only() {
  banner
  ensure_env
  load_root_env
  start_postgres
  run_migrations
}

print_menu() {
  banner
  printf "  %s1%s  Development   %s— Postgres + migrate + hot reload%s\n" "${GREEN}${BOLD}" "${RESET}" "${DIM}" "${RESET}"
  printf "  %s2%s  Production    %s— کل استک در Docker%s\n" "${GREEN}${BOLD}" "${RESET}" "${DIM}" "${RESET}"
  printf "  %s3%s  Stop          %s— توقف همه کانتینرها%s\n" "${YELLOW}${BOLD}" "${RESET}" "${DIM}" "${RESET}"
  printf "  %s4%s  Status        %s— وضعیت سرویس‌ها%s\n" "${CYAN}${BOLD}" "${RESET}" "${DIM}" "${RESET}"
  printf "  %s5%s  Logs          %s— دنبال کردن لاگ%s\n" "${CYAN}${BOLD}" "${RESET}" "${DIM}" "${RESET}"
  printf "  %s6%s  Install       %s— نصب وابستگی‌ها%s\n" "${BLUE}${BOLD}" "${RESET}" "${DIM}" "${RESET}"
  printf "  %s7%s  Migrate       %s— فقط Postgres + migration%s\n" "${BLUE}${BOLD}" "${RESET}" "${DIM}" "${RESET}"
  printf "  %s8%s  Build image   %s— docker compose build%s\n" "${BLUE}${BOLD}" "${RESET}" "${DIM}" "${RESET}"
  printf "  %s0%s  Exit\n" "${RED}${BOLD}" "${RESET}"
  echo
  printf "  %sنکته:%s اولین کاربر ثبت‌نام‌شده = وکیل مدیرکل%s\n" "${DIM}" "${RESET}" "${RESET}"
  echo
}

interactive() {
  while true; do
    print_menu
    read -r -p "  ${BOLD}انتخاب [0-8]:${RESET} " choice
    case "${choice}" in
      1) run_dev ;;
      2) run_prod; pause ;;
      3) stop_all; pause ;;
      4) show_status; pause ;;
      5) show_logs ;;
      6) pkg_install; pause ;;
      7) migrate_only; pause ;;
      8) build_only; pause ;;
      0|q|Q) echo; ok "خداحافظ"; exit 0 ;;
      *) warn "گزینه نامعتبر"; sleep 1 ;;
    esac
  done
}

usage() {
  cat <<EOF
${BOLD}Usage:${RESET} ./run.sh [command]

  ${GREEN}dev${RESET}         Development: Postgres + migrate + Next watch
  ${GREEN}prod${RESET}        Production containers
  ${GREEN}stop${RESET}        Stop containers
  ${GREEN}status${RESET}      Service status
  ${GREEN}logs${RESET}        Follow logs
  ${GREEN}install${RESET}     Install dependencies
  ${GREEN}migrate${RESET}     Postgres up + run migrations
  ${GREEN}build${RESET}       Build images only
  ${GREEN}help${RESET}        Show help

  بدون آرگومان → منوی تعاملی

${DIM}Env: APP_PORT, DATABASE_URL, FERZZ_TOKEN, SESSION_SECRET (services/app/.env)${RESET}
EOF
}

main() {
  local cmd="${1:-}"
  case "${cmd}" in
    "")        interactive ;;
    dev|development) run_dev ;;
    prod|production|up) run_prod ;;
    stop|down) stop_all ;;
    status|ps) show_status ;;
    logs)      show_logs ;;
    install)   pkg_install ;;
    migrate)   migrate_only ;;
    build)     build_only ;;
    help|-h|--help) usage ;;
    *)
      fail "دستور ناشناخته: ${cmd}"
      usage
      exit 1
      ;;
  esac
}

main "$@"
