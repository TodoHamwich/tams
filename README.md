# Todo's Advanced Modular System (TAMS)

A custom system for Foundry VTT.

## Features
- **Capped 1d100 Rolls:** 1d100maxStat + Familiarity.
- **Limb-Based Health:** Tracks 7 body regions with unique health multipliers and armor.
- **Dynamic Resource Pools:** Add custom resources that scale with stats.
- **Weapon Tags:** Automated damage calculation for Heavy, Two-Handed, and Light weapons.
- **Visual Themes:** Default, Dark, and Parchment styles.

## Installation
To install the system, paste the following manifest URL into the "Install System" dialog in the Foundry VTT Setup menu:

`https://github.com/TodoHamwich/tams/releases/latest/download/system.json`

## Development
This system is built using HTML, CSS, and JavaScript. 
- `scripts/tams.js`: Logic and roll handling.
- `styles/tams.css`: Sheet styling and themes.
- `templates/`: Handlebars templates for Actor and Item sheets.
