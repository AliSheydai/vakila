# Shadcn Admin Dashboard

Admin Dashboard UI crafted with Shadcn and Vite. Built with responsiveness and accessibility in mind.

![alt text](services/app/public/images/shadcn-admin.png)

[![Sponsored by Clerk](https://img.shields.io/badge/Sponsored%20by-Clerk-5b6ee1?logo=clerk)](https://go.clerk.com/GttUAaK)

I've been creating dashboard UIs at work and for my personal projects. I always wanted to make a reusable collection of dashboard UI for future projects; and here it is now. While I've created a few custom components, some of the code is directly adapted from ShadcnUI examples.

> This is not a starter project (template) though. I'll probably make one in the future.

## Features

- Light/dark mode
- Responsive
- Accessible
- With built-in Sidebar component
- Global search command
- 10+ pages
- Extra custom components
- RTL support

<details>
<summary>Customized Components (click to expand)</summary>

This project uses Shadcn UI components, but some have been slightly modified for better RTL (Right-to-Left) support and other improvements. These customized components differ from the original Shadcn UI versions.

If you want to update components using the Shadcn CLI (e.g., `npx shadcn@latest add <component>`), it's generally safe for non-customized components. For the listed customized ones, you may need to manually merge changes to preserve the project's modifications and avoid overwriting RTL support or other updates.

> If you don't require RTL support, you can safely update the 'RTL Updated Components' via the Shadcn CLI, as these changes are primarily for RTL compatibility. The 'Modified Components' may have other customizations to consider.

### Modified Components

- scroll-area
- sonner
- separator

### RTL Updated Components

- alert-dialog
- calendar
- command
- dialog
- dropdown-menu
- select
- table
- sheet
- sidebar
- switch

**Notes:**

- **Modified Components**: These have general updates, potentially including RTL adjustments.
- **RTL Updated Components**: These have specific changes for RTL language support (e.g., layout, positioning).
- For implementation details, check the source files in `src/components/ui/`.
- All other Shadcn UI components in the project are standard and can be safely updated via the CLI.

</details>

## Tech Stack

**UI:** [ShadcnUI](https://ui.shadcn.com) (TailwindCSS + RadixUI)

**Build Tool:** [Vite](https://vitejs.dev/)

**Routing:** [TanStack Router](https://tanstack.com/router/latest)

**Type Checking:** [TypeScript](https://www.typescriptlang.org/)

**Linting/Formatting:** [ESLint](https://eslint.org/) & [Prettier](https://prettier.io/)

**Icons:** [Lucide Icons](https://lucide.dev/icons/), [Tabler Icons](https://tabler.io/icons) (Brand icons only)

**Auth (partial):** [Clerk](https://go.clerk.com/GttUAaK)

## Project structure (monorepo)

```
vakila/
├── Dockerfile              # production image for services/app
├── docker-compose.yml      # Postgres, RustFS, LiveKit, coturn, app
├── .env.example            # root env (ports, DB, RustFS)
├── run.sh                  # interactive runner (dev / prod)
├── infra/                  # livekit.yaml, coturn.conf
└── services/
    └── app/                # Next.js app + API
        └── .env.example    # app secrets (SESSION, SMS, LiveKit, …)
```

## Run Locally

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Node.js + [pnpm](https://pnpm.io/) (or npm)
- On Windows: **Git Bash** or **WSL** (`run.sh` is a bash script)

### One-time setup

```bash
# from repo root
cp .env.example .env
cp services/app/.env.example services/app/.env

# edit secrets if needed (SESSION_SECRET, FERZZ_*, passwords)
# keep DATABASE_URL / POSTGRES_* passwords in sync between both files

./run.sh install
```

App runs on **http://localhost:4000** by default (port `3000` is often reserved on Windows).

### Everyday commands (`./run.sh`)

```bash
./run.sh              # interactive menu
./run.sh install      # install deps in services/app
./run.sh dev          # Postgres + RustFS + migrate + Next hot reload
./run.sh migrate      # Postgres + RustFS up, then DB migrations only
./run.sh prod         # full stack in Docker (build + up)
./run.sh stop         # stop all compose containers
./run.sh status       # container / env status
./run.sh logs         # follow container logs
./run.sh build        # build production image only
./run.sh help         # usage
```

**`./run.sh dev` does:**

1. Starts **Postgres** + **RustFS** via Docker  
2. Runs **migrations** (`pnpm migrate`)  
3. Starts the Next.js server with watch (`pnpm dev`)

Ctrl+C stops the Next server; Postgres and RustFS keep running until `./run.sh stop`.

### Video calls (LiveKit) in development

`dev` does **not** start LiveKit/coturn. For video features:

```bash
docker compose up -d livekit coturn
```

See `infra/DEPLOY_VIDEO.md` for production video setup.

### Manual (without `run.sh`)

```bash
# infra
docker compose up -d postgres rustfs-perms rustfs
# optional video:
# docker compose up -d livekit coturn

# app
cd services/app
pnpm install
pnpm migrate
pnpm dev
```

Production without the runner:

```bash
docker compose up -d --build
```

### Useful URLs

| Service        | URL / port                          |
|----------------|-------------------------------------|
| App            | http://localhost:4000               |
| Postgres       | localhost:5432                      |
| RustFS API     | http://localhost:9000               |
| RustFS console | http://localhost:9001               |
| LiveKit        | ws://localhost:7880                 |

## Sponsoring this project ❤️

If you find this project helpful or use this in your own work, consider [sponsoring me](https://github.com/sponsors/satnaing) to support development and maintenance. You can [buy me a coffee](https://buymeacoffee.com/satnaing) as well. Don’t worry, every penny helps. Thank you! 🙏

For questions or sponsorship inquiries, feel free to reach out at [satnaingdev@gmail.com](mailto:satnaingdev@gmail.com).

### Current Sponsor

- [Clerk](https://go.clerk.com/GttUAaK) - authentication and user management for the modern web

## Author

Crafted with 🤍 by [@satnaing](https://github.com/satnaing)

## License

Licensed under the [MIT License](https://choosealicense.com/licenses/mit/)
