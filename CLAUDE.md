## Project Overview

We are building Fortuna, an offline personal wealth management desktop app with a gamified, RPG-inspired visual identity. Think "Hades meets fintech" - dark, atmospheric, with progression systems.

Use the following tech stack:

- Tauri v2 (Rust backend + Vite frontend)
- React 19 with TypeScript
- TailwindCSS
- SQLite for local database (via rusqlite in Rust)
- Recharts library for charts
- Shadcn for UI components
- Framer Motion for animations
- Iconify with Solar icon set (linear variant)

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
- Input validation in Rust commands

### 3. Testing

- TDD: Write tests first
- 80% minimum coverage
- Unit tests for utilities, APIs wrapper
- Integration tests for Tauri commands

### 4. Security

- Validate all user inputs
- Parameterized queries only (Rust handles this)

## File Structure

```
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
|       |-- entities.rs           # Entity CRUD
|       |-- snapshots.rs          # Snapshot CRUD
src/
|-- main.tsx                      # React entry point
|-- App.tsx                       # Main dashboard component
|-- globals.css                   # Global styles
|-- components/                   # Reusable UI components
|   |-- ui/                       # Shadcn UI primitives
|   |   |-- accordion.tsx
|   |   |-- badge.tsx
|   |   |-- button.tsx
|   |   |-- card.tsx
|   |   |-- command.tsx
|   |   |-- dialog.tsx
|   |   |-- input.tsx
|   |   |-- label.tsx
|   |   |-- popover.tsx
|   |   |-- select.tsx
|   |   |-- table.tsx
|   |   |-- tabs.tsx
|   |-- AccountCard.tsx           # Card for displaying accounts
|   |-- AccountForm.tsx           # Form for adding/editing accounts
|   |-- AnimatedFlowEdge.tsx      # Animated edge for React Flow diagram
|   |-- AssetForm.tsx             # Form for adding/editing assets
|   |-- AssetTile.tsx             # Tile for displaying assets
|   |-- CashFlowForm.tsx          # Form for adding/editing cash flows
|   |-- CashFlowNode.tsx          # React Flow node for cash flow entries
|   |-- CountrySelector.tsx       # Country picker with flags
|   |-- CryptoSelector.tsx        # Cryptocurrency picker with search
|   |-- CurrencySelector.tsx      # Currency picker dropdown
|   |-- EntityForm.tsx            # Form for adding/editing entities
|   |-- EntitySelector.tsx        # Entity tabs for switching views
|   |-- NetWorthChart.tsx         # Net worth over time chart
|   |-- VaultDetailView.tsx       # Expanded vault view with flows and projection
|   |-- VaultFlowDiagram.tsx      # React Flow diagram for vault cash flows
|   |-- VaultFlowNode.tsx         # React Flow node for central vault
|   |-- VaultProjectionChart.tsx  # Balance projection chart for vaults
|-- lib/                          # Utility libraries
|   |-- api.ts                    # Tauri IPC wrapper functions
|   |-- cashFlowCategories.ts     # Cash flow category definitions and helpers
|   |-- cashFlowProjection.ts     # Balance projection logic for cash flows
|   |-- countries.ts              # Country data and utilities
|   |-- cryptocurrencies.ts       # Cryptocurrency data and utilities
|   |-- currency.ts               # Currency formatting and exchange rates
|   |-- prices.ts                 # Price fetching (Yahoo Finance, CoinGecko)
|   |-- utils.ts                  # General utilities (cn helper)
|-- types/                        # TypeScript definitions
|   |-- database.ts               # Database entity types
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

# Type check
npm run build

# Lint
npm run lint
```

## General Style

- Dark theme by default
- Border radius: 12px for cards, 8px for buttons (slightly rounder, more game-like)
- Cards should have subtle gradient borders or glow effects on hover
- Use gold sparingly but impactfully: progress bars, key metrics, CTAs
- Progress bars should look chunky and segmented (like XP bars)
- Add subtle animations: pulse on positive numbers, glow on achievements
- Consider adding a slight vignette or gradient overlay on the main background

## Gamification Concepts to Keep in Mind

- The UI should feel rewarding and progression-oriented.

| Finance Concept      | Game Equivalent        |
| -------------------- | ---------------------- |
| Net worth            | Power Level / Total XP |
| Assets               | Inventory items        |
| Bank Accounts        | Vaults                 |
| Savings goals        | Quests                 |
| Monthly budget       | Daily challenges       |
| Reaching a milestone | Achievement unlocked   |
| Portfolio diversity  | Skill tree             |
| Income streams       | Passive buffs          |
