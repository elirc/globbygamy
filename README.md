# GlobGame

Globs is a daily hierarchical merge puzzle game built with Next.js, JavaScript, Prisma, and PostgreSQL.

## High-level architecture

### Runtime flow
1. User opens `/` and the server page requests daily puzzle data.
2. Puzzle resolver attempts Postgres lookup through Prisma.
3. If DB data exists, it is transformed to game payload format.
4. If DB is unavailable or no matching puzzle exists, app falls back to in-repo sample puzzle.
5. Client game engine runs merges, hints, undo, completion, and local persistence.

### Component boundaries
- `src/app/page.js`
  - Entry page. Loads puzzle data and renders game UI.
- `src/app/api/puzzles/daily/route.js`
  - Public API endpoint for daily puzzle payload.
- `src/lib/puzzles/resolveDailyPuzzle.js`
  - DB-first puzzle resolver with fallback logic.
- `src/lib/puzzles/payload.js`
  - Converts puzzle/group records into client runtime payload.
- `src/components/globs/GameClient.js`
  - Main UI and interaction layer.
- `src/lib/game/engine.js`
  - Core merge/upgrade rules.
- `src/lib/game/reducer.js`
  - State transitions and action handling.
- `src/lib/game/storage.js`
  - `localStorage` session save/restore.
- `src/lib/prisma.js`
  - Shared Prisma client singleton.

### Data model (Prisma)
- `Puzzle`
  - Top-level puzzle metadata (`locale`, `size`, `type`, `date`, publish state).
- `PuzzleGroup`
  - Hierarchical group tree per puzzle (`level`, `members`, `themeLabel`, parent relation).
- `GameResult`
  - Completion/stats record model for future scoreboard and streak features.

Schema file: `prisma/schema.prisma`.

## Database setup (PostgreSQL)

### Option A: local Postgres with Docker (quickest)
```bash
docker run --name globgame-postgres ^
  -e POSTGRES_USER=postgres ^
  -e POSTGRES_PASSWORD=postgres ^
  -e POSTGRES_DB=globgame ^
  -p 5432:5432 ^
  -d postgres:16
```

### Option B: existing Postgres instance
Use your own host/db/user/password and set `DATABASE_URL` accordingly.

### Configure env
PowerShell:
```bash
Copy-Item .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/globgame?schema=public"
```

### Initialize schema and seed data
```bash
npm install
npm run prisma:generate
npm run db:push
npm run prisma:seed
```

If `prisma:seed` fails with authentication errors, your Postgres credentials in `.env` are incorrect.

## Run application
```bash
npm run dev
```
Open `http://localhost:3000`.

## Useful routes
- Game UI: `/`
- Daily puzzle API: `/api/puzzles/daily`
- Daily puzzle API with filters: `/api/puzzles/daily?locale=en-US&size=mini&date=2026-02-18`

## Current implementation status
- Playable daily mini puzzle.
- Merge validation, upgrades, mistakes, hints, undo, sort/shuffle, color tags.
- Completion screen and share text generation.
- Local session persistence.
- DB-first puzzle loading with fallback sample.

## Notes
- If Postgres is not running/configured, gameplay still works through fallback sample data.
- Current seed includes mini puzzle data only.
- Reviewed implementation roadmap: `docs/globs-plan-v2.md`.
