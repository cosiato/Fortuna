# Tauri Application - Project CLAUDE.md

## Project Overview

We are building Fortuna, an offline personal wealth management desktop app with a gamified, RPG-inspired visual identity. Think "Hades meets fintech" - dark, atmospheric, with progression systems.

Use the following tech stack:

- Tauri v2 (Rust backend + Vite frontend)
- React 19 with TypeScript
- TailwindCSS
- SQLite for local database (via rusqlite in Rust)
- Recharts library for charts
- React Flow for nodes and flows
- Shadcn for UI components
- Framer Motion for animations
- Iconify with Solar icon set (linear variant)
- i18next + react-i18next for multilingual support (en, fr, es, pt)

## Critical Rules

### 1. Code Organization

- Many small files over few large files
- High cohesion, low coupling
- 200-400 lines typical, 800 max per file
- Organize by feature/domain, not by type
- keep CLAUDE.md file udpated when adding / deleting / renaming files

### 2. Code Style

- No console.log or console.error in production code
- Proper error handling with try/catch
- Input validation with Zod or similar

### 3. Testing

- Apply TDD: Write tests first
- Always achieve 80% minimum coverage
- Always do unit tests for utilities, APIs wrapper
- Always do integration tests for Tauri commands

### 4. Security

- Do not use hardcoded secrets
- Use environment variables for sensitive data
- Validate all user inputs
- Parameterized queries only (Rust handles this)
- CSRF protection enabled

## File Structure

```
.github/
|-- workflows/
|   |-- release.yml               # CI/CD: cross-platform build + GitHub Release
scripts/
|-- bump-version.mjs              # Version bumping script
|-- generate-icons.mjs            # Extracts used Solar icons into src/lib/icons.ts
src-tauri/                        # Tauri backend (Rust)
|-- Cargo.toml                    # Rust dependencies
|-- tauri.conf.json               # Tauri configuration
|-- capabilities/                 # Tauri security capabilities
|   |-- default.json
|-- icons/                        # App icons
|-- src/
|   |-- main.rs                   # Entry point
|   |-- lib.rs                    # App setup and command registration
|   |-- database.rs               # SQLite initialization
|   |-- commands/                 # Tauri IPC commands
|       |-- mod.rs                # Command exports
|       |-- accounts.rs           # Account CRUD
|       |-- activity_log.rs       # Activity log helper + query commands
|       |-- assets.rs             # Asset CRUD (logs mutations to activity_log)
|       |-- cash_flows.rs         # Cash flow CRUD (recurring income/expenses)
|       |-- entities.rs           # Entity CRUD (includes transactional cascade delete)
|       |-- settings.rs           # Settings (currency/locale preferences, PIN)
|       |-- snapshots.rs          # Snapshot CRUD
src/
|-- main.tsx                      # React entry point
|-- App.tsx                       # Main dashboard component
|-- globals.css                   # Global styles
|-- components/                   # Reusable UI components
|   |-- ui/                       # Shadcn UI primitives
|   |   |-- accordion.tsx
|   |   |-- button.tsx
|   |   |-- card.tsx
|   |   |-- command.tsx
|   |   |-- dialog.tsx
|   |   |-- input.tsx
|   |   |-- label.tsx
|   |   |-- popover.tsx
|   |   |-- select.tsx
|   |   |-- sonner.tsx
|   |   |-- switch.tsx
|   |   |-- tabs.tsx
|   |   |-- tooltip.tsx
|   |-- AccountForm.tsx           # Form for adding/editing accounts
|   |-- AnimatedFlowEdge.tsx      # Animated edge for React Flow diagram
|   |-- AssetForm.tsx             # Form for adding/editing assets
|   |-- AssetTile.tsx             # Tile for displaying assets
|   |-- CashFlowForm.tsx          # Form for adding/editing cash flows
|   |-- CashFlowNode.tsx          # React Flow node for cash flow entries
|   |-- CountrySelector.tsx       # Country picker with flags
|   |-- CryptoSelector.tsx        # Cryptocurrency picker with search
|   |-- CurrencyPickerOverlay.tsx  # Fullscreen currency picker grouped by continent
|   |-- CurrencySelector.tsx      # Currency picker button (opens overlay)
|   |-- DeleteAccountDialog.tsx   # Confirmation dialog for vault deletion
|   |-- DeleteEntityDialog.tsx    # Confirmation dialog for entity deletion
|   |-- ResetAccountDialog.tsx    # Type-to-confirm dialog for wiping all data
|   |-- SettingsDialog.tsx        # Settings dialog with PIN management
|   |-- EntityForm.tsx            # Form for adding/editing entities
|   |-- EntitySelector.tsx        # Entity tabs for switching views
|   |-- LockScreen.tsx            # Full-screen PIN lock overlay
|   |-- SlotMachineNumber.tsx     # Animated digit roller for currency values
|   |-- UpdateNotification.tsx   # Floating notification for app updates (download + restart)
|   |-- NetWorthChart.tsx         # Net worth over time chart
|   |-- PinInput.tsx              # 4-digit PIN input component
|   |-- PlaceholderFlowEdge.tsx   # Dashed edge for placeholder flow nodes
|   |-- PlaceholderFlowNode.tsx   # "+Add inflow/outflow" placeholder node
|   |-- VaultFlowDiagram.tsx      # React Flow diagram for vault cash flows (inline per vault)
|   |-- VaultFlowNode.tsx         # React Flow node for central vault (with projection button)
|   |-- VaultProjectionChart.tsx  # Balance projection chart for vaults (inline in accordion)
|   |-- onboarding/              # First-time user onboarding flow
|       |-- OnboardingOverlay.tsx         # Root overlay with step navigation
|       |-- OnboardingStepLayout.tsx      # Shared layout for each step
|       |-- OnboardingStepAssets.tsx      # Step 1: Assets intro
|       |-- OnboardingStepVaults.tsx      # Step 2: Vaults intro
|       |-- OnboardingStepEntities.tsx    # Step 3: Entities intro
|       |-- OnboardingStepIndicator.tsx   # Progress dots + XP bar
|-- hooks/                        # Custom React hooks
|   |-- useAppData.ts             # App data fetching, prices, exchange rates, initialization
|   |-- useAssetCrud.ts           # Asset CRUD operations and form state
|   |-- useEntityCrud.ts          # Entity CRUD operations and form state
|   |-- useLanguage.ts            # Language management hook (syncs i18n + SQLite)
|   |-- useSnapshotRecorder.ts    # Debounced snapshot recording with 5-min backend coalescing
|   |-- useUpdater.ts            # Auto-update check, download, install, and relaunch
|   |-- useVaultCrud.ts           # Vault/account and cash flow CRUD operations and form state
|-- lib/                          # Utility libraries
|   |-- api.ts                    # Tauri IPC wrapper functions
|   |-- cashFlowCategories.ts     # Cash flow category definitions and helpers
|   |-- cashFlowProjection.ts     # Balance projection logic for cash flows
|   |-- countries.ts              # Country data and utilities
|   |-- cryptocurrencies.ts       # Cryptocurrency data and utilities
|   |-- currency.ts               # Currency formatting and exchange rates
|   |-- currencyConversion.ts     # Pure currency conversion utilities (toUsd, fromUsd, etc.)
|   |-- errorHandling.ts          # Toast-based error notification utility
|   |-- icons.ts                  # Auto-generated Solar icon bundle (via scripts/generate-icons.mjs)
|   |-- i18n.ts                   # i18next configuration and initialization
|   |-- prices.ts                 # Price fetching (Yahoo Finance, CoinGecko)
|   |-- utils.ts                  # General utilities (cn helper)
|   |-- validation.ts             # Zod schemas for form validation
|-- locales/                      # Translation files (en, fr, es, pt)
|   |-- en/                       # English (default/fallback)
|   |   |-- common.json           # Buttons, labels, navigation, footer
|   |   |-- assets.json           # Asset-related strings
|   |   |-- vaults.json           # Vault/account-related strings
|   |   |-- entities.json         # Entity-related strings
|   |   |-- settings.json         # Settings dialog, PIN management
|   |   |-- onboarding.json       # Onboarding flow
|   |   |-- dialogs.json          # Delete/reset confirmation dialogs
|   |   |-- errors.json           # Error toast messages
|   |   |-- validation.json       # Zod validation messages
|   |   |-- categories.json       # Cash flow category labels
|   |-- fr/                       # French (same structure)
|   |-- es/                       # Spanish (same structure)
|   |-- pt/                       # Portuguese (same structure)
|-- types/                        # TypeScript definitions
|   |-- database.ts               # Database entity types
|   |-- i18next.d.ts              # i18next type augmentation for strict key checking
|-- config/                       # Configuration files
|   |-- cryptocurrencies.json     # Top 200 cryptocurrencies data
public/                           # Static assets
|-- favicon.ico
index.html                        # Vite entry HTML
vite.config.ts                    # Vite configuration
tailwind.config.ts                # Tailwind configuration
```

## Key Patterns

### Tauri Command Invocation

```typescript
import { invoke } from "@tauri-apps/api/core"

// Call Rust commands via IPC
const assets = await invoke<Asset[]>("get_all_assets")
const newAsset = await invoke<Asset>("create_asset", { input: { name: "BTC", type: "crypto" } })
```

### API Layer (src/lib/api.ts)

```typescript
export const api = {
  assets: {
    getAll: () => invoke<Asset[]>("get_all_assets"),
    create: (input: CreateAssetInput) => invoke<Asset>("create_asset", { input }),
  },
  // ... other domains
}
```

### Error Handling (Rust)

```rust
#[tauri::command]
pub fn create_asset(db: State<DbConnection>, input: CreateAssetInput) -> Result<Asset, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    // ... operation
    Ok(asset)
}
```

## Development Commands

```bash
# Development (starts both Vite and Tauri)
npm run tauri dev

# Build for production
npm run tauri build

#Vitest
npm run test

# Type check
npm run build

# Lint
npm run lint
```
