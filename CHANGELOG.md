# Changelog

All notable changes to Fortuna will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).








## [0.3.1] - 2026-02-19

### Fixed

- **ui**: restrict drag region to main content area
- **tauri**: update coingecko CSP domain and NSIS install mode

### Changed

- **rust**: remove unused ActivityLogEntry struct

## [0.3.0] - 2026-02-18

### Added

- add cash flow frequency options (none, quarterly, trimester, semester)
- **ui**: add collapsible sidebar components and hook
- **i18n**: add dashboard and indicator translation keys
- **ui**: add dashboard indicator components
- **ui**: add entity header with slot machine total value
- **assets**: add crypto staking support
- **ui**: add EmptyStateCard and dashboard empty states
- **settings**: add database export and import commands
- **settings**: add restore from backup UI
- **i18n**: add restore backup translations
- **dashboard**: add pagination to entities and top assets cards
- **release**: add Azure credentials to release workflow and create relic configuration

### Fixed

- **tauri**: adjust traffic lights and enable window dragging
- **ui**: add isolate to accordion and year to projection labels
- locale-aware projection labels and update currency test count
- **rust**: harden import/export with integrity and size checks
- **security**: tighten CSP by removing wildcard coingecko subdomain
- **test**: add missing afterEach import in useSnapshotRecorder test

### Changed

- **ui**: replace emoji flags with SVG CountryFlag component
- **ui**: extract CurrencyCombobox from inline Select pickers
- **tauri**: use overlay title bar with macOS traffic light positioning
- **ui**: replace header layout with sidebar navigation
- **ui**: split App into dashboard and entity views with sidebar nav
- **ui**: extract dashboard utils and simplify chart layout
- remove unused API methods, components, and icons
- extract helpers in useAppData
- **tauri**: use transaction API for entity cascade delete
- **ui**: reduce collapsed sidebar width
- **settings**: replace dialog with dedicated settings page
- **assets**: improve staking form UX and rename cooldown label
- **settings**: extract shared PIN verification with rate limiting
- **sidebar**: replace add-company icon with text and adjust label alignment
- **settings**: simplify about and data section layouts
- **dashboard**: reduce font weight on currency values
- **onboarding**: expand layout and increase spacing
- **i18n**: replace fantasy wording with clear onboarding copy
- **rust**: extract validate_name and remove unused commands
- **dashboard**: extract ASSET_CATEGORY_KEYS and memoize computations
- **sidebar**: change dashboard icon to eye and clean imports

## [0.2.0] - 2026-02-17

### Fixed

- **ci**: restore macOS and Windows targets in release workflow

## [0.1.12] - 2026-02-17

### Fixed

- **ui**: portal currency picker overlay to fix z-index

### Changed

- **ui**: launch window maximized on macOS
- **ui**: use fixed viewport layout with sticky header and custom scrollbar

## [0.1.11] - 2026-02-16

### Fixed

- **UpdateNotification**: move useTranslation hook before early return
- **updater**: relaunch immediately after downloadAndInstall

### Changed

- **i18n**: remove dead update translation keys

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
