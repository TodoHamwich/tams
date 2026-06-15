# TAMS Project Quick Reference

Use this file as a fast “where to look” guide when discussing or changing the system.

## What this project is
- **TAMS** = custom Foundry VTT system.
- Core focus: d100 capped-roll gameplay, limb-based damage/armor, resources, and modular sheets/utilities.

## Start here first
- `README.md` → high-level features, dev commands, structure overview.
- `SYSTEM_FEATURES.txt` → detailed gameplay/system behavior reference.

## Core runtime entry points
- `src\tams.js`
  - System bootstrap/hooks/registrations/settings.
- `src\documents\actor.js`
  - Main actor logic, including centralized damage flow (`applyDamage(...)`).
- `src\documents\item.js`
  - Item document behavior.

## Main code map
- `src\applications\`
  - `actor-sheet.js` → Actor sheet UI/actions.
  - `item-sheet.js` → Item sheet UI/actions.
  - `loot-sheet.js` → Loot sheet behavior.
  - `downtime-sheet.js` → Downtime UI.
  - `travel-pace.js` → Travel Pace utility app.
- `src\models\`
  - `character.js` and `item.js` data models.
- `src\utils\`
  - `helpers.js` → reusable utility/helpers/chat-related helpers.
  - `combat.js` → combat UI helpers (`getHitLocation`, `showCombinedInjuryDialog`).

## Templates and styling
- `templates\` → Handlebars templates for sheets and travel pace tool.
- `styles\src\` → SCSS partials (`_base`, `_actor-sheet`, `_item-sheet`, etc.).
- `styles\tams.scss` → SCSS entry.
- `styles\tams.css` → compiled CSS output.

## Localization and config
- `lang\en.json` → all player-facing text (`TAMS.*` keys).
- `system.json` / `template.json` → system metadata + data template definitions.

## Tests and validation
- `tests\`
  - `damage.test.js`, `character.test.js`, `items.test.js`, `helpers.test.js`.
  - `setup.js` test setup utilities.

## Common dev commands
- Install deps: `npm install`
- Build: `npm run build`
- Test: `npm test`
- SCSS only: `npm run sass`

## Useful discussion checklist (when reviewing changes)
- What gameplay rule is being changed? (`SYSTEM_FEATURES.txt`)
- Which layer is affected?
  - Data model (`src\models\`)
  - Document logic (`src\documents\`)
  - UI/app layer (`src\applications\`, `templates\`)
  - Utility/combat helper (`src\utils\`)
  - Localization (`lang\en.json`)
- Are tests needed or existing tests updated in `tests\`?
