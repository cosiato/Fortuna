# Changelog

All notable changes to Fortuna will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).



## [0.1.10] - 2026-02-16

### Changed

- add gentle pulse animation to empty section add buttons
- **entities**: replace add company icon with '+' text

## [0.1.9] - 2026-02-16

### Added

- **updater**: add client-side update notification with download progress
- **release**: add full release automation script and update version bumping command

## [0.1.3] - 2026-02-15

Initial public release. Versions prior to 0.1.3 were pre-releases.

### Added

- **Asset management** - Track stocks, crypto, fiat, real estate, and custom assets with live price fetching (Yahoo Finance, CoinGecko)
- **Vault system** - Bank accounts and wallets with country-based organization
- **Cash flow tracking** - Recurring income/expense flows with daily, weekly, monthly, and yearly frequencies
- **Vault flow diagrams** - Interactive React Flow visualization of cash inflows and outflows per vault
- **Balance projection charts** - Forward-looking vault balance projection based on recurring cash flows
- **Net worth chart** - Historical net worth tracking via automated snapshots with 5-min coalescing
- **Entity system** - Multi-entity asset management (personal, companies) with cascade delete
- **50 supported currencies** - Fullscreen currency picker grouped by continent with live exchange rates
- **Cryptocurrency support** - Searchable top-200 coin selector with logos and live prices
- **PIN lock screen** - App lock/unlock with secure PIN hashing and keyboard shortcut
- **Settings dialog** - Currency preference, locale selection, PIN management, and data reset
- **Onboarding flow** - First-time user walkthrough with screenshots and step navigation
- **Internationalization** - Full i18n support for English, French, Spanish, and Portuguese
- **Animated UI** - Slot-machine number roller, animated flow edges, glow effects, and smooth tab transitions
- **Form validation** - Client-side Zod schemas with localized error messages
- **Activity logging** - Mutation tracking for asset changes
- **Auto-update** - In-app updates via tauri-plugin-updater
- **Cross-platform builds** - macOS (with code signing), Windows, and Linux via GitHub Actions release workflow
