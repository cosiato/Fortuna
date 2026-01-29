## Project Overview

We are building an offline weath management tracker.
Use the following tech stack:

- Next.js 16
- TailwindCss
- SQLite for local database
- Prisma ORM and Prisma Client
- Recharts library for charts
- Shadcn for UI components
- Typescript
- Framer motion for animations
- Three.js for 3D elements

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
public/                           # Static assets to be served
src/
|-- app/                          # Next.js app router
|   |-- fonts/                    # Custom fonts (Geist)
|   |-- api/                      # API routes
|   |   |-- assets/               # Asset CRUD endpoints
|   |   |   |-- route.ts          # GET/POST /api/assets
|   |   |   |-- [id]/route.ts     # PUT/DELETE /api/assets/:id
|   |   |-- exchange-rates/       # Currency exchange rates
|   |   |-- prices/               # Asset price fetching
|   |   |-- snapshots/            # Portfolio snapshots
|   |-- assets/                   # Assets management page
|   |-- page.tsx                  # Dashboard home page
|   |-- layout.tsx                # Root layout
|   |-- globals.css               # Global styles
|-- components/                   # Reusable UI components
|   |-- ui/                       # Shadcn UI primitives
|   |   |-- badge.tsx
|   |   |-- button.tsx
|   |   |-- card.tsx
|   |   |-- dialog.tsx
|   |   |-- input.tsx
|   |   |-- label.tsx
|   |   |-- select.tsx
|   |   |-- table.tsx
|   |-- AssetForm.tsx             # Form for adding/editing assets
|   |-- AssetList.tsx             # Table of user assets
|   |-- CurrencySelector.tsx      # Currency picker dropdown
|   |-- NetWorthChart.tsx         # Net worth over time chart
|   |-- PortfolioBreakdown.tsx    # Portfolio allocation view
|-- hooks/                        # Custom React hooks
|-- lib/                          # Utility libraries
|   |-- currency.ts               # Currency formatting utilities
|   |-- db.ts                     # Database connection (SQLite)
|   |-- prices.ts                 # Price fetching logic
|   |-- utils.ts                  # General utilities (cn helper)
|-- types/                        # TypeScript definitions
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

## Design System

Theme: Elegant, Roman-inspired, modern fintech

Colors (use Tailwind classes, not raw hex):

- primary: deep night blue
- accent: antique gold (use sparingly)
- background: off-white marble
- success/destructive: for gains/losses

Typography:

- Headings: Playfair Display (serif)
- Body/UI: Inter

Style:

- Border radius: 8px cards, 6px buttons
- Soft shadows, minimal gold accents
