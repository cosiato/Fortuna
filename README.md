<div align="center">
  <a href="https://github.com/cosiato/Fortuna">
    <img src="public/app-icon.png" alt="Fortuna" width="100" height="100" style="border-radius: 20px;">
  </a>

  <h3 align="center">Fortuna</h3>

  <p align="center">
    Offline personal wealth management with an RPG twist.
    <br />
    <br />
    <a href="https://github.com/cosiato/Fortuna/releases">Download</a>
    &middot;
    <a href="https://github.com/cosiato/Fortuna/issues">Report Bug</a>
    &middot;
    <a href="https://github.com/cosiato/Fortuna/issues">Request Feature</a>
  </p>
</div>

<div align="center">

[![Release](https://img.shields.io/github/v/release/cosiato/Fortuna?style=flat-square)](https://github.com/cosiato/Fortuna/releases)
[![Build](https://img.shields.io/github/actions/workflow/status/cosiato/Fortuna/release.yml?style=flat-square&label=build)](https://github.com/cosiato/Fortuna/actions/workflows/release.yml)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-858585?style=flat-square)]()
[![License](https://img.shields.io/badge/license-proprietary-blue?style=flat-square)]()

</div>

<br />

<!-- Add a screenshot here: ![Screenshot](public/screenshot.webp) -->

## About

**Fortuna** is an offline-first desktop app for tracking your personal wealth -- assets, bank accounts, cash flows, and net worth -- with a dark, gamified, RPG-inspired visual identity. Think "Hades meets fintech."

All your data stays on your machine. No account required, no cloud sync.

## Features

- **Asset tracking** -- Stocks, crypto, real estate, cash, and custom assets with live price fetching (Yahoo Finance, CoinGecko)
- **Bank accounts** -- Multi-currency vaults with country metadata and balance projection charts
- **Cash flow management** -- Recurring inflows/outflows with visual flow diagrams
- **Net worth snapshots** -- Automatic recording with historical chart
- **Multi-entity support** -- Manage finances for individuals and companies separately
- **Activity log** -- Full audit trail for every mutation
- **Multi-language** -- English, French, Spanish, and Portuguese
- **PIN lock** -- Optional PIN protection for privacy
- **Auto-updates** -- In-app update notifications with one-click install
- **Fully offline** -- SQLite database, no cloud dependencies

## Download

Grab the latest release for your platform:

| Platform | Link |
| --- | --- |
| macOS (Apple Silicon) | [Download .dmg](https://github.com/cosiato/Fortuna/releases/latest) |
| macOS (Intel) | [Download .dmg](https://github.com/cosiato/Fortuna/releases/latest) |
| Windows | [Download .exe](https://github.com/cosiato/Fortuna/releases/latest) |

Or browse all releases on the [Releases page](https://github.com/cosiato/Fortuna/releases).

## Tech Stack

| Layer    | Technology                              |
| -------- | --------------------------------------- |
| Desktop  | Tauri v2 (Rust + Vite)                  |
| Frontend | React 19, TypeScript, TailwindCSS       |
| UI       | Shadcn, Framer Motion, Recharts         |
| Database | SQLite (rusqlite)                       |
| Prices   | Yahoo Finance, CoinGecko                |

## Building from Source

Requires [Node.js](https://nodejs.org/) (LTS), [Rust](https://www.rust-lang.org/tools/install) (stable), and [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/).

```bash
git clone https://github.com/cosiato/Fortuna.git
cd Fortuna
npm install
npm run tauri dev
```

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'feat: add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a pull request

## License

Copyright 2025-2026 Thomas Cosialls. All rights reserved.
