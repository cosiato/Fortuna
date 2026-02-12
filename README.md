# Fortuna

[![Release](https://img.shields.io/github/v/release/cosiato/Fortuna?style=flat-square)](https://github.com/cosiato/Fortuna/releases)
[![Build](https://img.shields.io/github/actions/workflow/status/cosiato/Fortuna/release.yml?style=flat-square&label=build)](https://github.com/cosiato/Fortuna/actions/workflows/release.yml)
[![Tauri](https://img.shields.io/badge/tauri-v2-24C8D8?style=flat-square&logo=tauri&logoColor=white)](https://v2.tauri.app)
[![React](https://img.shields.io/badge/react-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/typescript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Rust](https://img.shields.io/badge/rust-2021-DEA584?style=flat-square&logo=rust&logoColor=white)](https://www.rust-lang.org)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-858585?style=flat-square)]()

Offline-first personal wealth management desktop app with a gamified, RPG-inspired visual identity.

Track assets, bank accounts, cash flows, and net worth -- all data stays on your machine.

## Features

- **Asset tracking** -- stocks, crypto, real estate, cash, and custom assets with live price fetching
- **Bank accounts** -- multi-currency vaults with country metadata
- **Cash flow management** -- recurring inflows/outflows with projection charts
- **Net worth snapshots** -- automatic recording with historical chart
- **Multi-entity support** -- manage finances for individuals and companies
- **Activity log** -- audit trail for all asset mutations
- **Onboarding flow** -- guided first-time setup
- **Offline-first** -- no account required, no cloud sync, everything stored locally in SQLite

## Tech Stack

| Layer    | Technology                                  |
| -------- | ------------------------------------------- |
| Desktop  | Tauri v2 (Rust backend + Vite frontend)     |
| Frontend | React 19, TypeScript, TailwindCSS           |
| UI       | Shadcn, Framer Motion, Recharts, React Flow |
| Icons    | Iconify (Solar linear set)                  |
| Database | SQLite (rusqlite)                           |
| Prices   | Yahoo Finance, CoinGecko                    |

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- Tauri v2 system dependencies -- see the [Tauri prerequisites guide](https://v2.tauri.app/start/prerequisites/)

## Getting Started

```bash
# Clone the repository
git clone https://github.com/<owner>/fortuna.git
cd fortuna

# Install frontend dependencies
npm install

# Start the development app (Vite + Tauri)
npm run tauri dev
```

The app opens a native window at 1200x800. Hot-reload is enabled for the frontend; Rust changes trigger a recompile.

## Scripts

| Command                     | Description                         |
| --------------------------- | ----------------------------------- |
| `npm run tauri dev`         | Start the app in development mode   |
| `npm run tauri build`       | Build a production release          |
| `npm run build`             | Type-check and build the frontend   |
| `npm run lint`              | Lint TypeScript/React files         |
| `npm run test`              | Run tests in watch mode             |
| `npm run test:run`          | Run tests once                      |
| `npm run test:coverage`     | Run tests with coverage report      |

## Project Structure

```
src-tauri/                    # Tauri backend (Rust)
  src/
    main.rs                   # Entry point
    lib.rs                    # App setup and command registration
    database.rs               # SQLite schema and initialization
    commands/                 # Tauri IPC commands
      accounts.rs             # Account CRUD
      activity_log.rs         # Activity log queries
      assets.rs               # Asset CRUD
      cash_flows.rs           # Cash flow CRUD
      entities.rs             # Entity CRUD
      snapshots.rs            # Snapshot CRUD

src/                          # React frontend
  App.tsx                     # Main dashboard
  components/                 # UI components
    ui/                       # Shadcn primitives
    onboarding/               # First-time user flow
  hooks/                      # Custom React hooks
  lib/                        # Utilities (API layer, formatting, validation)
  types/                      # TypeScript type definitions
  config/                     # Static data (cryptocurrency list)
```

## Inspecting the Database

Fortuna stores all data in a local SQLite file named `fortuna.db`. The file is created automatically on first launch inside the Tauri app data directory:

| OS      | Path                                                            |
| ------- | --------------------------------------------------------------- |
| macOS   | `~/Library/Application Support/com.fortuna.app/fortuna.db`      |
| Windows | `C:\Users\<user>\AppData\Roaming\com.fortuna.app\fortuna.db`   |
| Linux   | `~/.local/share/com.fortuna.app/fortuna.db`                     |

### Opening with DB Browser for SQLite

1. Download and install [DB Browser for SQLite](https://sqlitebrowser.org/dl/)
2. Open DB Browser and click **Open Database**
3. Navigate to the `fortuna.db` path listed above for your OS
4. Browse the tables (`entities`, `assets`, `accounts`, `snapshots`, `cash_flows`, `activity_log`, `settings`) in the **Browse Data** tab
5. Run custom queries in the **Execute SQL** tab

> **Note:** Close Fortuna before opening the database in DB Browser to avoid file lock conflicts.

## Building for Production

```bash
# macOS (Apple Silicon)
npm run tauri:build:mac

# macOS (Intel)
npm run tauri:build:mac-intel

# Windows
npm run tauri:build:windows
```

Release builds are also automated via GitHub Actions -- push a `v*` tag to trigger cross-platform builds and a draft GitHub Release.

## License

Copyright 2025-2026 Thomas Cosialls. All rights reserved.
