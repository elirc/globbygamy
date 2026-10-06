# Globs Plan v2 (Reviewed + Execution-Ready)

> **Status note (2026-10-06):** This plan is a frozen record. Plan vs. code at `main` @ `063c3b1` (the only commit, 2026-02-18):
>
> | Plan item | Status | Where |
> | --- | --- | --- |
> | Playable daily mini puzzle | Built | `src/app/page.js`, `src/components/globs/GameClient.js` |
> | Merge engine: level/group checks, upgrades, mistakes, hints, sort, color tags, undo | Built | `applyMerge`, `consumeHint`, `sortTiles`, `toggleTileColor`, `undo` in `src/lib/game/engine.js` |
> | Win detection + share text | Built | `makeShareText` and the *Copy Share* button in `GameClient.js` |
> | Local persistence | Built | `src/lib/game/storage.js` (one `localStorage` key per puzzle), restored through `HYDRATE` |
> | Prisma schema + seed | Built | `prisma/schema.prisma` (`Puzzle`, `PuzzleGroup`, `GameResult`) and `prisma/seed.js` (one mini puzzle dated 2026-02-18) |
> | `GET /api/puzzles/daily`, DB-first with fallback | Built | `src/app/api/puzzles/daily/route.js` calls `resolveDailyPuzzle.js`. The fallback only matches the sample puzzle's own date (see README "Notes"). |
> | Payload contract | Matches | `buildPuzzlePayload` in `src/lib/puzzles/payload.js` returns exactly the fields below. Tiles are shuffled with a seed. |
> | Reducer actions | Matches | All nine actions are handled in `src/lib/game/reducer.js`. |
> | Phases 1-5 (server merge validation, big puzzles, results/streaks, generation queue, auth/billing) | Not started | No other API routes exist. `GameResult` is never written. `size=big` is accepted by `normalizeSize`, but no big puzzle is seeded or sampled. |
>
> The repo has no automated tests.

## What was strong in the original plan
- Core puzzle loop and merge rules are clearly defined.
- Data model captures hierarchy (`Puzzle` -> `PuzzleGroup`) and growth path.
- Delivery was phased and realistic for a production feature set.

## Gaps corrected in this revision
1. Scope was too broad for an initial build.
- Original scope bundled gameplay, auth, billing, AI generation, admin, and analytics.
- Revision defines an MVP slice that is playable immediately and still scales to the full roadmap.

2. Validation strategy needed a practical first step.
- Original proposal included encrypted labels and hash-based anti-cheat in v1.
- Revision starts with client-visible group metadata for speed, then hardens to server validation in Phase 2.

3. Runtime contracts were underspecified.
- Original plan described entities but not the exact payload/reducer contract.
- Revision locks a concrete payload shape and reducer action set.

4. Undo and persistence lacked implementation detail.
- Revision specifies undo snapshots and localStorage serialization boundaries.

## MVP definition (implemented in this repo)
- Next.js app with a playable daily mini puzzle.
- Merge engine with level checks, group checks, upgrades, mistakes, hints, sort, color tags, undo.
- Win detection and share text generation.
- Local persistence for resume/reload.
- PostgreSQL-ready Prisma schema and seed data.
- `GET /api/puzzles/daily` with DB-first lookup and local fallback puzzle.

## Runtime contract (MVP)

### Daily puzzle payload
```json
{
  "puzzleId": "string",
  "locale": "en-US",
  "size": "mini",
  "date": "YYYY-MM-DD",
  "title": "string",
  "groups": [
    {
      "token": "string",
      "level": 0,
      "parentToken": "string|null",
      "themeLabel": "string",
      "emojiHint": "string|null",
      "totalLeafCount": 4
    }
  ],
  "tiles": [
    {
      "id": "string",
      "leafId": "string",
      "level": 0,
      "label": "string",
      "groupToken": "string"
    }
  ]
}
```

### State actions
- `SELECT_TILE`
- `ATTEMPT_MERGE`
- `TOGGLE_COLOR`
- `SORT_ALPHA`
- `SHUFFLE`
- `USE_HINT`
- `UNDO`
- `HYDRATE`
- `CLEAR_FEEDBACK`

## Next implementation phases
1. Add server-authoritative merge endpoint for anti-cheat.
2. Add big puzzle support in seed + UI controls.
3. Add results submission API + streaks.
4. Add generation pipeline job table + admin queue.
5. Add auth and subscription gating after gameplay metrics stabilize.
