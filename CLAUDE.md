## Project Overview

We are building Fortuna, an offline personal wealth management app with a gamified, RPG-inspired visual identity. Think "Hades meets fintech" — dark, atmospheric, with progression systems.

Use the following tech stack:

- Next.js 16
- TailwindCSS
- SQLite for local database
- Prisma ORM and Prisma Client
- Recharts library for charts
- Shadcn for UI components
- TypeScript
- Framer Motion for animations
- Iconify with Solar icon set (linear variant)

## Critical Rules

### 1. Code Organization

- Many small files over few large files
- High cohesion, low coupling
- 200-400 lines typical, 800 max per file
- Organize by feature/domain, not by type

### 2. Code Style

- No console.log in production code
- Proper error handling with try/catch
- Input validation with Zod or similar

### 3. Testing

- TDD: Write tests first
- 80% minimum coverage
- Unit tests for utilities
- Integration tests for APIs

### 4. Security

- No hardcoded secrets
- Environment variables for sensitive data
- Validate all user inputs
- Parameterized queries only
- CSRF protection enabled

## File Structure

```
data/                             # SQLite database files
|-- fortuna.db                    # Main database file
prisma/                           # Database schema & migrations
|-- schema.prisma                 # Prisma data model
|-- migrations/                   # Database migrations
public/                           # Static assets to be served
src/
|-- app/                          # Next.js app router
|   |-- fonts/                    # Custom fonts (Geist)
|   |-- api/                      # API routes
|   |   |-- accounts/             # Account CRUD endpoints
|   |   |   |-- route.ts          # GET/POST /api/accounts
|   |   |   |-- [id]/route.ts     # PUT/DELETE /api/accounts/:id
|   |   |-- assets/               # Asset CRUD endpoints
|   |   |   |-- route.ts          # GET/POST /api/assets
|   |   |   |-- [id]/route.ts     # PUT/DELETE /api/assets/:id
|   |   |-- entities/             # Entity CRUD endpoints
|   |   |   |-- route.ts          # GET/POST /api/entities
|   |   |   |-- [id]/route.ts     # GET/PUT/DELETE /api/entities/:id
|   |   |-- exchange-rates/       # Currency exchange rates
|   |   |-- prices/               # Asset price fetching
|   |   |-- snapshots/            # Portfolio snapshots
|   |-- page.tsx                  # Dashboard home page
|   |-- layout.tsx                # Root layout
|   |-- globals.css               # Global styles
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
|   |-- AssetForm.tsx             # Form for adding/editing assets
|   |-- AssetTile.tsx             # Tile for displaying assets
|   |-- CountrySelector.tsx       # Country picker with flags
|   |-- CryptoSelector.tsx        # Cryptocurrency picker with search
|   |-- CurrencySelector.tsx      # Currency picker dropdown
|   |-- EntityForm.tsx            # Form for adding/editing entities
|   |-- EntitySelector.tsx        # Entity tabs for switching views
|   |-- NetWorthChart.tsx         # Net worth over time chart
|-- hooks/                        # Custom React hooks
|-- lib/                          # Utility libraries
|   |-- countries.ts              # Country data and utilities
|   |-- cryptocurrencies.ts       # Cryptocurrency data and utilities
|   |-- currency.ts               # Currency formatting utilities
|   |-- db.ts                     # Database connection (SQLite)
|   |-- prices.ts                 # Price fetching logic
|   |-- utils.ts                  # General utilities (cn helper)
|-- types/                        # TypeScript definitions
|-- config/                       # Configuration files
|   |-- cryptocurrencies.json     # Top 200 cryptocurrencies data
|-- generated/                    # Auto-generated Prisma types
|   |-- prisma/                   # Prisma client types
```

## Key Patterns

### API Response Format

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
```

### Error Handling

```typescript
try {
  const result = await operation()
  return { success: true, data: result }
} catch (error) {
  console.error("Operation failed:", error)
  return { success: false, error: "User-friendly message" }
}
```

## Environment Variables

```bash
# Required
DATABASE_URL=
API_KEY=

# Optional
DEBUG=false
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

| Finance Concept       | Game Equivalent        |
| --------------------- | ---------------------- |
| Net worth             | Power Level / Total XP |
| Assets                | Inventory items        |
| Bank Accounts         | Vaults                 |
| Savings goals         | Quests                 |
| Monthly budget        | Daily challenges       |
| Reaching a milestone  | Achievement unlocked   |
| Portfolio diversity   | Skill tree             |
| Income streams        | Passive buffs          |
