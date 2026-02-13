# Feed or Weed

A plant identification game that challenges you to tell the difference between a feast and a fiasco. Identify plants from your region across three difficulty modes, earn scores, and compete on a geographic leaderboard.

## How It Works

1. **Choose your region** -- the app detects your state via geolocation, or you pick manually
2. **Pick a difficulty** -- Easy, Medium, or Hard
3. **Play 3 rounds** -- each round shows a plant image; answer the primary question and an optional bonus
4. **See your score** -- per-round breakdown with speed bonuses
5. **Compete** -- scores post to a regional leaderboard; sign in to save yours permanently

### Difficulty Modes

| Mode | Name | Primary Question | Bonus | Max Score |
|------|------|-----------------|-------|-----------|
| Easy | That Friend You Want to Get Lost With | Edible/medicinal/neutral/poisonous? | Common name | 525 |
| Medium | The Know It All | Common name | Detail question (medicinal use, edible part, etc.) | 825 |
| Hard | Professional Plant Person | Common name + genus/species + category | Detail question | 2,325 |

### Scoring

- Speed bonus: full points if answered within 10s, linear decay to 0 at 30s
- No negative points for wrong answers

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [TanStack Start](https://tanstack.com/start) (React 19, file-based routing, SSR) |
| Backend | [Convex](https://convex.dev) (serverless database, real-time queries, actions) |
| Auth | [Clerk](https://clerk.com) (optional -- play anonymously, sign in to save scores) |
| Plant Data | [Flora API](https://floraapi.com) (30k+ US plant species, cached in Convex) |
| Styling | Tailwind CSS v4 + shadcn/ui components |
| Fonts | Fredoka (headings), Nunito (body) -- self-hosted via @fontsource |
| Testing | Vitest |

## Prerequisites

- Node.js 20+
- pnpm
- A [Convex](https://convex.dev) account
- A [Clerk](https://clerk.com) account
- A [Flora API](https://floraapi.com/register) key (Developer tier recommended for seeding; free tier sufficient once cache is populated)

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure Clerk

In the [Clerk Dashboard](https://dashboard.clerk.com):

- Enable sign-in methods: Google, Apple, email/password
- Create a JWT template named `convex` for Convex auth integration
- Copy your **Publishable Key** and **Frontend API URL** (the `*.clerk.accounts.dev` domain)

### 3. Configure environment variables

Create `.env.local` in the project root:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_CONVEX_URL=https://your-instance.convex.cloud
CONVEX_DEPLOYMENT=dev:your-instance
```

### 4. Set up Convex

```bash
# Initialize (if not already done)
npx convex dev --configure=existing --team <your-team> --project <your-project>

# Set server-side env vars
npx convex env set FLORA_API_KEY <your-flora-api-key>
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<your-clerk-instance>.clerk.accounts.dev
```

Keep `npx convex dev` running during development -- it watches for schema/function changes and redeploys automatically.

### 5. Seed plant data

The game requires plant data cached in Convex. Seed at least one region:

```bash
npx convex run plantSync:syncRegion '{"regionCode": "OR"}'
npx convex run plantSync:syncRegion '{"regionCode": "CA"}'
npx convex run plantSync:syncRegion '{"regionCode": "WA"}'
npx convex run plantSync:syncRegion '{"regionCode": "TX"}'
npx convex run plantSync:syncRegion '{"regionCode": "NY"}'
```

Each call fetches up to 50 species (default). Use `limit` and `offset` to paginate:

```bash
npx convex run plantSync:syncRegion '{"regionCode": "OR", "limit": 50, "offset": 50}'
```

### 6. Run the dev server

```bash
pnpm dev
```

App runs at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
convex/                     # Convex backend
  schema.ts                 # Database schema (5 tables)
  auth.config.ts            # Clerk JWT validation
  plants.ts                 # Plant query functions
  plantSync.ts              # Flora API seeding action
  games.ts                  # Game session logic + scoring
  leaderboard.ts            # Leaderboard queries
  users.ts                  # User profile management

src/
  routes/
    __root.tsx              # Root layout (providers, shell)
    index.tsx               # The game (select -> play -> results)
    leaderboard.tsx         # Full leaderboard page
    account.tsx             # User profile (protected)

  components/
    GameShell.tsx            # Top nav bar
    Footer.tsx               # Site footer
    game/
      ModeSelector.tsx       # Difficulty selection cards
      GameBoard.tsx          # Main game orchestrator
      PlantImage.tsx         # Plant image with skeleton loading
      AnswerOptions.tsx      # Answer button grid with feedback
      BonusQuestion.tsx      # Bonus question card
      RoundResult.tsx        # Per-round result reveal
      RoundIndicator.tsx     # Progress dots (1/3, 2/3, 3/3)
      ScoreDisplay.tsx       # Animated score counter
      GameResults.tsx        # End-of-game summary
    location/
      LocationPrompt.tsx     # Geolocation permission request
      LocationFallback.tsx   # Manual state picker
      RegionDisplay.tsx      # Region badge
    leaderboard/
      LeaderboardTable.tsx   # Ranked score list
      LeaderboardFilters.tsx # Region + difficulty dropdowns
      PlayerRankBadge.tsx    # Player rank indicator
    auth/
      SignInPrompt.tsx       # Post-game sign-in nudge
      AccountPage.tsx        # Profile + stats + game history

  hooks/
    useLocation.ts           # Geolocation + Census Bureau geocoding + cache
    useGamePrefetch.ts       # Image prefetch for next round

  lib/
    scoring.ts               # Scoring calculations (tested)
    states.ts                # US state codes + names
    utils.ts                 # Tailwind cn() helper
```

## Database Schema

| Table | Purpose |
|-------|---------|
| `plants` | Cached plant data from Flora API (images, category, nativity, region codes) |
| `gameSessions` | One doc per game with embedded 3-round array |
| `leaderboardEntries` | Denormalized for fast leaderboard reads |
| `userProfiles` | Clerk-linked profiles with aggregate stats |
| `plantSyncLog` | Flora API seeding run history |

## Scripts

```bash
pnpm dev          # Start dev server on port 3000
pnpm build        # Production build
pnpm test         # Run tests (Vitest)
pnpm lint         # Lint with Biome
pnpm format       # Format with Biome
pnpm check        # Biome check (lint + format)
```

## Auth Flow

Auth is optional. Players start anonymously with a `nanoid`-generated ID stored in `localStorage`. After signing in via Clerk, the `/account` route automatically:

1. Creates or updates the user profile in Convex
2. Claims all anonymous game sessions and leaderboard entries
3. Updates leaderboard display names to the real identity

## Flora API Usage

Plant data is cached in Convex to stay within Flora API free-tier limits (1,000 req/month). The `plantSync:syncRegion` action fetches species lists, detail pages, and images, then upserts them into the `plants` table. Once seeded, the game reads exclusively from the Convex cache.

The sync action uses these Flora API endpoints:
- `GET /v1/regions/{region_code}/species` -- list species in a state
- `GET /v1/species/{id}` -- species detail
- `GET /v1/species/{id}/images` -- image gallery
- `GET /v1/search?edible=true` -- check edibility
- `GET /v1/search?medicinal=true` -- check medicinal properties

## License

Private project.
