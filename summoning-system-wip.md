# Summoning — design sketch (not yet implemented)

Design intent for abilities that bring a second controllable creature into a fight (5e's
"Summon X" spell family, and any future TAMS-native summon ability). Reconciled 2026-09-16 against
`TAMS Rulebook(2).md`'s "Companions / Summoned Creatures / PC Controlled Troops" section (line
954-977), which already specifies most of this — see
`Dungeons of Drakkenheim TAMS Version/rulebook-code-audit.md` item 0 for how the first draft of
this doc got it wrong before that section was checked. Rules-only; nothing here is implemented in
code. See `Dungeons of Drakkenheim TAMS Version/drakkenheim-tams/npc-conversion-gaps.md` item 18
for the conversion-rule context.

## What's actually an engine gap vs. what isn't

Handing control of the summoned creature's token to a player is **not** a TAMS engine gap — Foundry
already supports granting a player Owner permission on any Actor/token natively. No custom
spawn/hand-off code is needed. The real open work is the *rules* below: how the summon behaves
mechanically once it exists.

## The summoned creature

A pre-built, real TAMS actor — converted normally through the same creature-conversion rules as
any other NPC (rank-based stats, stat-derived damage, etc. — see `drakkenheim-tams/CLAUDE.md`), not
a formula that scales a generic template by spell level the way 5e does. For a spell whose 5e text
scales by slot level (e.g. Summon Dragon), convert one baseline stat block at whatever rank fits
the ability's expected cost/level, and note in the ability's description that the GM can swap in a
different prebuilt variant for a stronger/weaker version rather than deriving a scaling formula.

Per the rulebook's Companion rules: don't have more than half the party size in "complex" summoned
NPCs (a summon needing a full PC-style sheet rather than a simple NPC sheet) unless the GM has
specifically planned for it.

## Activation economy — two modes, per the rulebook's Companions/Summoned Creatures rules

TAMS combat runs on **Activations**, not initiative order: Players always get 2 activations per
round; Mooks get 1, Elites get 2, Bosses get many (rulebook line 673-680) — this is already how
`drakkenheim-tams/CLAUDE.md`'s rank rules work, no drift there. A Summoned Creature works as either
of two explicit modes (rulebook: "Summoned Creatures either work like Simple Companions, or like
Allied NPC's"):

- **Simple Companion mode**: the summon gets a flat **1 activation per round**, regardless of its
  own stat block's rank — same discount as any other Companion/pet, there to keep combat fast. The
  summoner can spend one of their own 2 activations to **command** it: this directs what the
  companion's single activation does that round (attack a specific target, move somewhere
  specific) rather than the GM/default AI deciding — it does **not** grant the companion a second
  activation. Uncommanded, the companion still acts (default AI / GM discretion), mirroring 5e's
  "if you issue no commands, it just Dodges."
- **Allied NPC mode**: no discount — the summon just uses its own stat block's normal rank-based
  activation count (Mook 1 / Elite 2 / Boss many), acting as a fully independent NPC ally in the
  activation order rather than a simplified pet.

**Choosing a mode for a 5e conversion is a per-summon judgment call, not a fixed rule** — default
low-level/minor summons (1st-3rd level spell, a small/weak creature) to Simple Companion mode for
speed of play; default a high-level or named/unique summon (7th+ level, Summon Dragon-tier) to
Allied NPC mode, since it's meant to be a real combat presence, not a background pet. Note the
chosen mode in the ability's description.

## Control

- Player-cast: the GM grants the summoner's player Owner permission on the summon's token/actor for
  the duration; the player controls its actions directly.
- NPC-cast: the GM just controls it themselves, no handoff needed.

## Duration & end conditions

Set the summoning ability's `calculator.duration` using the existing utility tiers
(Short/Medium/Long/Extended — same mapping already used for Concentration in
`drakkenheim-tams/CLAUDE.md`). The summon is removed when any of:
- the ability's duration expires,
- the summoned creature is reduced to 0 HP (per its own normal limb thresholds),
- the summoner is incapacitated or killed.

No lingering effects on removal — clean despawn.

## Cost

Cost the summoning ability per the normal spell-level-to-Stamina-cost table, single upfront cost —
no ongoing maintenance cost by default. If a specific ability is meant to allow stacking multiple
simultaneous summons, use the existing `calculator.isStackable` mechanism (doubles cost) rather
than inventing a new maintenance-cost field.

## Open questions (not yet answered)

- Equipment/loot: summons generally shouldn't carry lootable gear — confirm this is always true or
  only true by default.
- Does an Allied NPC-mode summon count against the "half party size in complex NPCs" cap the same
  way a regular Companion would, or is that cap Companion-specific?
