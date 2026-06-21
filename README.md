# Todo's Advanced Modular System (TAMS)

A custom system for Foundry VTT.

## Features
- Capped 1d100 rolls with familiarity bonuses
- Limb-based health (7 body regions) with per-limb armor
- Damage types, resistances, immunities, and vulnerabilities
- Cover system
- Squad & horde NPC types with pooled HP
- Upgrade Points (UP) tracking with per-scene pools
- Scene tab: UP pool + used-this-scene tracker for skills and abilities
- Dynamic custom resources
- Weapon tags (Heavy, Two-Handed, Light)
- Group checks: GM initiates, players join via chat card
- Loot containers with drag-and-drop item transfer
- Downtime tracker
- Travel Pace Calculator
- Inventory in weight or slot mode (world setting)
- 7 visual themes: Default, Dark, Parchment, Grimdark, Cyberpunk, Gothic, Tactical

## Installation
Paste the manifest URL into the "Install System" dialog in Foundry VTT Setup:

`https://github.com/TodoHamwich/tams/releases/latest/download/system.json`

## Development

### Commands
```bash
npm install          # Install dependencies
npm run build        # Compile SCSS + bundle JS → scripts/tams.js
npm run sass         # Compile SCSS only → styles/tams.css
npm test             # Run Vitest
./link-to-foundry.sh # Symlink repo into Foundry Data/systems/tams
```

### Source structure
```
src/tams.js               # Entry point: hooks, settings, registrations
src/models/               # DataModels (character, items)
src/documents/            # TAMSActor, TAMSItem
src/applications/         # ApplicationV2 sheets
  actor-sheet.js          #   Player character
  npc-sheet.js            #   NPC / squad / horde
  item-sheet.js           #   Item editor
  loot-sheet.js           #   Loot container
  downtime-sheet.js       #   Downtime tracker
  travel-pace.js          #   Travel Pace Calculator
src/utils/
  helpers.js              #   Chat helpers, item transfer
  combat.js               #   Hit location, group check, chat listeners
  inventory.js            #   Encumbrance (weight & slot modes)
templates/                # Handlebars templates (one per sheet)
styles/src/               # SCSS partials
lang/en.json              # All player-facing strings (TAMS.* keys)
```

### Running locally
1. Install Node v18+
2. `npm install`
3. `npm run build`
4. `npm test`
5. Run `./link-to-foundry.sh`, then start Foundry and enable the TAMS system
