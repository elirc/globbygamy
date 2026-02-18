# Globs Plan v2 (Reviewed + Execution-Ready)

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
