# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

TAMS (Todo's Advanced Modular System) is a custom game system for Foundry VTT. It implements a d100 capped-roll ruleset with limb-based health, armor penetration, squad/horde NPCs, and a modular item system.

## Commands

```bash
npm install          # Install dependencies
npm run build        # Compile SCSS + bundle JS via Vite → scripts/tams.js
npm run sass         # Compile SCSS only → styles/tams.css
npm run sass:watch   # Watch SCSS
npm test             # Run Vitest once
npm run test:watch   # Watch tests
./link-to-foundry.sh # Symlink repo into ~/.local/share/FoundryVTT/Data/systems/tams
```

Run a single test file:
```bash
npx vitest run tests/damage.test.js
```

## Architecture

### Layer model

```
src/tams.js           → Foundry init hook: registers settings, sheets, DataModels,
                        Handlebars helpers, socket handler, encumbrance sync
src/models/           → TypeDataModel subclasses (pure data schema + derivation)
  character.js        → TAMSCharacterData (stats, limbs, inventory, resources…)
  item.js             → One DataModel per item type (weapon, skill, ability, armor…)
src/documents/        → Document classes (extend Foundry's Actor/Item)
  actor.js            → TAMSActor — applyDamage() is the single entry point for
                        all damage resolution (armor, alt-armor, squad cap, checks)
  item.js             → TAMSItem
src/applications/     → ApplicationV2 UI sheets
  actor-sheet.js      → Main character sheet + all inline actions
  item-sheet.js       → Item editor
  loot-sheet.js       → Loot-container sheet
  downtime-sheet.js   → Downtime tracker
  travel-pace.js      → Travel Pace Calculator utility app
src/utils/
  helpers.js          → Sheet/action helpers, chat message builders, item transfer
  combat.js           → getHitLocation(), showCombinedInjuryDialog(), renderChatMessage
  inventory.js        → computeEncumbrance() used by the character DataModel
templates/            → Handlebars templates (one per sheet)
styles/src/           → SCSS partials (_variables, _base, _actor-sheet, etc.)
lang/en.json          → All player-facing strings under TAMS.* keys
system.json           → Foundry system manifest
template.json         → Legacy data template (schema is now in DataModels)
```

### Key design facts

- **No Foundry globals in tests.** `tests/setup.js` mocks `foundry`, `game`, `Hooks`, `Roll`, `Actor`, and `Item` so Vitest runs in Node without a live Foundry server.
- **Damage is centralized.** All damage paths (chat buttons, AoE, etc.) call `TAMSActor.applyDamage(hits, options)` which handles armor, alternate armor, squad/horde capping, and queues injury/unconscious/survival checks.
- **i18n everywhere.** Templates use `{{localize 'TAMS.Key'}}`, JS uses `game.i18n.localize/format`. Add new strings to `lang/en.json` under `TAMS.*`.
- **Build outputs are committed.** `scripts/tams.js` (Vite bundle) and `styles/tams.css` (compiled SCSS) are checked in so Foundry can load them without a build step.
- **Inventory capacity** has two modes (`weight` / `slots`) controlled by the `tams.capacityMode` world setting. Logic lives in `src/utils/inventory.js`.

### Socket flow

The `system.tams` socket (registered in `src/tams.js`) handles three message types, all routed to the GM client: `updateMessage`, `createLoot` (loot drop on canvas), and `transferItem`.

## Working rules

### Build
- Run `npm install` first in any fresh environment — `node_modules` is not committed.
- Run `npm run build` after any JS or SCSS change before testing in Foundry. The committed output files (`scripts/tams.js`, `styles/tams.css`) are what Foundry actually runs.
- SCSS-only changes can use `npm run sass` instead of a full build.
- The SCSS build emits deprecation warnings about `@import` and `darken()` (Dart Sass 3.0 deprecations) — these are harmless and not errors.

### Damage logic
- All damage resolution (armor reduction, squad cap, overflow, injury thresholds) belongs in `TAMSActor.applyDamage()`. Never duplicate or bypass this in other code paths.

### Localization
- Every player-facing string goes in `lang/en.json` under a `TAMS.*` key. No hardcoded strings in JS or templates.

### Tests
- Only pure logic can be tested — tests run in Node with mocked Foundry globals, no UI or socket behavior.
- When adding new logic that calls Foundry globals, add the corresponding stub to `tests/setup.js` or tests will silently fail.

### Adding a new item type
All four of these must be updated together:
1. DataModel in `src/models/item.js`
2. Registration in `src/tams.js` (`CONFIG.Item.dataModels`)
3. Handlebars template in `templates/`
4. Handling in `src/applications/item-sheet.js`

### Data schema
`src/models/` is the source of truth for data schema. `template.json` is legacy and mostly ignored at runtime.
