/**
 * Build or extract compendium packs using the official foundryvtt-cli.
 *
 * Usage:
 *   node scripts/pack-packs.mjs pack    — compile packs/_src/* → packs/* (LevelDB)
 *   node scripts/pack-packs.mjs unpack  — extract packs/* (LevelDB) → packs/_src/*
 */

import { compilePack, extractPack } from '@foundryvtt/foundryvtt-cli';

const PACKS = [
  { name: 'macros',         src: 'packs/_src/macros',         db: 'packs/macros' },
  { name: 'status-effects', src: 'packs/_src/status-effects', db: 'packs/status-effects' },
];

const cmd = process.argv[2];
if (cmd !== 'pack' && cmd !== 'unpack') {
  console.error('Usage: node scripts/pack-packs.mjs <pack|unpack>');
  process.exit(1);
}

for (const pack of PACKS) {
  if (cmd === 'unpack') {
    console.log(`Unpacking ${pack.name}…`);
    await extractPack(pack.db, pack.src, { log: true, clean: true });
  } else {
    console.log(`Packing ${pack.name}…`);
    await compilePack(pack.src, pack.db, { log: true });
  }
}
