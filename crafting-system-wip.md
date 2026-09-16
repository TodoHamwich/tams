# Crafting System — WIP Design Doc

Status: rulebook design in progress. This is a **game rules** doc — no Foundry
implementation details (schema, UI, code) belong here until the rules themselves are settled.

---

## Core concept: Item Quality

Every item has a **Quality** value (`C-Q`, "Current Quality") that crafting raises over time.

- Every new project starts at Quality 0 — raw, unworked material, not itself a tier. The first
  successful roll (always a crit, see below) moves it into Low Quality.
- Quality tiers:
  | Tier | Range |
  |---|---|
  | Low Quality | 1 – 20 |
  | Normal Quality | 21 – 60 |
  | High Quality | 61 – 120 |
  | Masterwork | 120+ |

## Crafting action

Crafting is one of the Safe/Unsafe downtime actions. Each **crafting action**:

1. The player rolls their Craft skill against the item's **current Quality (C-Q)**.
   - **Skill**: per-craft-type skills (e.g. "Craft (Blacksmithing)", "Craft (Alchemy)"), the same
     way weapon skills are split by specific weapon ("Melee Weapon (X)" / "Ranged Weapon (X)").
     Every craftable item belongs to a craft category that determines which skill applies.
   - **Crit**: same crit standard used elsewhere in the system — Roll Total at least 2× the
     target number (here, 2× C-Q). **Confirmed edge case**: on a fresh project C-Q starts at 0,
     so 2×0 = 0 and literally any roll qualifies — the first roll on any project is always a
     crit. This is intentional, not a bug to fix.
2. Compare Roll Total to C-Q:
   - **Success** (roll beats C-Q): C-Q increases by **half the skill's Familiarity, rounded
     down**. On a **crit**, C-Q increases by the **full** Familiarity instead.
   - **Failure** (roll does not beat C-Q): C-Q doesn't change, but the **full Roll Total**
     (capped 1d100 + familiarity + tool bonus + any prior carry-over) is added to a
     **carried-over bonus** on that item, applied to the *next* crafting roll. This bonus
     **stacks uncapped** across consecutive failures — repeated failures make the eventual
     success increasingly likely/guaranteed.

## Starting a project: materials and the action cap

There is only **one** crafting flow — every crafted item is a project started from materials.
A pre-existing/store-bought item **cannot be improved directly**; it must be **remade** (a new
project) to raise its Quality. Pre-existing items are assumed to be built from **Standard
(Normal)** grade materials by default.

**Remaking scraps the old item for a partial discount — scaled by grade match, not the item's
static price.** Scrapping an old item yields materials equivalent to its own *current Quality
tier* (Low/Standard/High/Masterwork — the same tier its C-Q currently sits in, degradation from
failed repairs included). That scrap discounts the **new** project's materials cost as a
percentage of the new grade's cost:

- **Exact grade match** (remaking at the same grade as the old item's current tier): **25% off**.
- **Each step you remake at a *higher* grade** than the old item's tier: **−25 percentage points**
  per step, floored at **0%** (so remaking even one grade above what the scrap can supply kills
  the discount entirely — mismatched materials don't partially apply).
- **Each step you remake at a *lower* grade** than the old item's tier: **+25 percentage points**
  per step, uncapped (a Masterwork item scrapped down into a Low-grade remake is **100% off** —
  the surplus material more than covers it).

This deliberately kills the earlier flawed version of this rule, where the discount was a flat
25% of the item's unchanging catalog price regardless of its actual Quality — that let a
throwaway Low Quality item scrap for the same discount as a painstakingly-built Masterwork one.
Tying it to current tier and grade match means the discount reflects what the scrap is actually
worth right now.

- Materials are bought/gathered at one of the same four quality grades: **Low, Standard, High,
  Masterwork**. Cost to acquire is the finished item's normal listed price, multiplied by grade —
  reusing the same multiplier table already used for tool grades elsewhere in the catalog. Buying
  is the baseline path and always works standalone, with no other system required:

  | Material grade | Cost multiplier |
  |---|---|
  | Low | ×0.25 |
  | Standard | ×1 |
  | High | ×3 |
  | Masterwork | ×8 |
- The material grade sets a **flat maximum number of craft actions** allowed on that project:

  | Material grade | Max craft actions |
  |---|---|
  | Low | 3 |
  | Standard | 6 |
  | High | 9 |
  | Masterwork | 15 |

- **Every roll counts against the cap** — success or failure, each attempt consumes one of the
  project's max actions (bad luck can burn through cheap materials with zero progress).
- Once the max actions are used up, the item is **permanently finished** at whatever C-Q it
  reached — no further rolls on that project, ever. To go further, the item must be remade from
  scratch with a fresh (ideally higher-grade) batch of materials.

This creates the intended tension: cheap materials are cheap but may not grant enough actions to
ever push an item into the tier where **Quality bonuses actually apply** (see below) — a Low or
Standard-grade project can easily run out of actions while the item is still sitting in Low or
Normal Quality, producing perfectly ordinary, unbonused gear.

**Gathering is a separate, optional source for the same materials** — see
`exploration-system-wip.md` ("Material gathering"). The link is meant to stay modular: gathered
materials should slot into the same four-grade table above (a thin translation, not a second
grading scheme), so crafting works fully with buying alone if exploration isn't in play, and
exploration's finds are still worth something even if this crafting system isn't in play.

## Quality bonuses only apply above Normal Quality

**Universal rule, all item types**: an item's Quality bonus (attack bonus, AV/AHP split, potency,
tool check bonus, etc. — see table below) does not apply at all while the item is Low or Normal
Quality (C-Q 1–60). It only takes effect once the item is pushed into **High Quality (61+)**.
Low/Normal Quality items function as ordinary, un-upgraded gear — reaching High Quality or
Masterwork is what crafting is actually *for*.

## Quality's mechanical effect, per item type

All 8 physical/gear item types get a Quality field. `skill`, `ability`, `trait`, `statusEffect`,
`race`, `questItem` do **not** (not physical crafted goods).

Bonuses are **flat per tier**, not a continuous formula — a C-Q of 65 and a C-Q of 119 grant the
exact same bonus, since both are "High Quality." Nothing applies below C-Q 61 (see above).

| Type | High Quality (61-120) | Masterwork (120+) | Notes |
|---|---|---|---|
| `weapon` | +3 attack roll | +10 attack roll | Matches the existing "Greatsword +10 Attack" catalog item as the Masterwork anchor. |
| `ammo` | +3 attack roll | +10 attack roll | Same scale as weapon. |
| `armor` | 5-point pool | +5 more (10 total) | Crafter splits each pool between AV and AHP the moment the item crosses that tier threshold, and the split is **locked in immediately** — not revisited later. Crossing into Masterwork grants a separate, independently-allocated 5-point pool on top of the High Quality one. |
| `shield` | 5-point pool | +5 more (10 total) | Same pool size and locked-in-per-tier timing as armor, split between block value and durability. |
| `consumable` | +25% effect potency | +50% effect potency | Percentage of whatever the item's base effect already is. |
| `tool` | +3 to checks using it | +10 to checks using it | Same scale as weapon/ammo. No special feedback-loop rule needed — since bonuses are flat-per-tier, a Masterwork tool's own bonus is already capped at +10 regardless of C-Q, so it can't help bootstrap anything "better than Masterwork." Using a good tool to craft other good gear in its own category (weapons, armor, etc.) is the intended point, not a runaway spiral. |
| `equipment` | +25% to existing bonus | +50% to existing bonus | Same percentage scale as consumable; no effect if the item grants no passive bonus to begin with. |
| `backpack` | +3 capacity | +10 capacity | Flat slots/weight added, same scale as weapon/tool. |

## Craft categories

Craft skills are keyed to **raw material / trade**, not to item type — reusing the Artisan
Tools already in the item catalog ("TAMS Items V3.txt") one-for-one as the craft skill list:

- Alchemy (Alchemist's supplies)
- Blacksmithing (Blacksmith's tools)
- Cartography (Cartographer's tools)
- Cooking (Cook's utensils)
- Glassblowing (Glassblower's tools)
- Jewelcraft (Jeweler's tools)
- Leatherworking (Leatherworker's tools)
- Masonry (Mason's tools)
- Painting (Painter's supplies)
- Pottery (Potter's tools)
- Weaving (Weaver's tools)
- Woodworking (Carpenter's tools *or* Woodcarver's tools — collapsed into one skill; the
  catalog's two separate tool items both satisfy it)

Each corresponds to a `"Craft (X)"` skill, matching the pattern used for weapon familiarity
skills. **Owning the matching Artisan Tool item is a hard prerequisite** — no tool, no roll.

**Tool grade gives a flat bonus to the crafting roll**, reusing the existing tool-quality table
already in the item catalog (the one right above the Artisan Tools price list):

| Tool grade | Roll bonus |
|---|---|
| Makeshift | −5 |
| Basic | +0 |
| Quality | +5 |
| Masterwork | +10 |

This is separate from the *project's* material grade (Low/Standard/High/Masterwork, which sets
the action cap) — the tool bonus applies to every roll made with that tool, regardless of what
material grade the current project is using.

**Composite items use one primary material.** A sword is Blacksmithing even though it has a
grip; a bow is Woodworking even though it needs sinew/string. Each individual *item* (not item
*type*) declares which one Craft category is its primary — a steel shield is Blacksmithing, a
wooden shield is Woodworking, studded leather armor is Leatherworking, padded cloth armor is
Weaving, and so on. There's no fixed weapon→skill or armor→skill mapping; it depends on what the
specific item is actually made of.

---

## Armor creation

### Material → skill mapping

The Craft skill used is determined by what the armor is primarily made of — same rule as weapons:

| Primary material | Craft skill |
|---|---|
| Cloth, padded | Weaving |
| Leather, hide, studded leather | Leatherworking |
| Metal (chain, scale, ring, plate) | Blacksmithing |

### Two separate grades

Armor creation involves two distinct "grade" choices that are easy to confuse:

**Design Grade** — chosen at the start of the project. Sets what AV and AHP you are designing
the piece to have, up to the grade's maximum:

| Design Grade | Max AV | Max AHP |
|---|---|---|
| Low | 10 | 10 |
| Normal | 25 | 25 |
| High | 40 | 40 |

**Material Grade** — also chosen at the start. Sets the action cap and materials cost multiplier,
exactly as in the standard crafting rules (Low = 3 actions / ×0.25, Standard = 6 / ×1,
High = 9 / ×3, Masterwork = 15 / ×8). Material Grade does **not** constrain Design Grade —
a blacksmith refines impurities out through forging, so Low-grade iron can produce High Design
Grade plate. It just means fewer actions to get there.

### Designing the piece

Choose the target AV and AHP values for the armor, both within the Design Grade's maximum. These
are the **Normal Quality baseline** — what the item will have if the project closes at Normal
Quality C-Q (21–60).

### Materials cost

There is no fixed catalog price for a custom armor design, so the base materials cost uses the
following formula:

> **Base cost (in Copper) = AV × AHP × Design Grade constant**

| Design Grade | Constant |
|---|---|
| Low | 0.75 |
| Normal | 1.0 |
| High | 1.5 |

This gives the **Standard-grade materials cost**. Multiply by the Material Grade multiplier for
other grades (×0.25 / ×1 / ×3 / ×8).

*Example: High Grade breastplate, AV 20, AHP 22, Standard materials.*
*20 × 22 × 1.5 = 660 Copper = 2 Gold 15 Silver (at 1G = 20S = 240C).*

### Quality modifiers

The C-Q tier the project closes at determines a point pool that modifies the designed AV and AHP.
The crafter chooses how to split the pool between the two stats at the moment each threshold
is crossed (or at project close, for Low Quality). Split decisions are locked in immediately and
cannot be changed later.

| C-Q Tier | Pool |
|---|---|
| Low Quality (1–20) | −5 (subtract from AV and/or AHP) |
| Normal Quality (21–60) | no change |
| High Quality (61–120) | +5 (add to AV and/or AHP) |
| Masterwork (120+) | +10 total (replaces the High Quality split) |

Quality bonuses **can push final stats above the Design Grade maximum** — masterwork craftsmanship
exceeds the typical ceiling for its grade. Quality penalties cannot push a stat below 0.

*Example: Low Grade helmet designed at AV 8, AHP 7. Project closes at High Quality. Crafter
allocates the +5 as +3 AV, +2 AHP. Final piece: AV 11, AHP 9 — exceeding the Low Grade max of
10 AV.*

---

---

## Alchemy

Alchemy follows the standard crafting flow — roll vs C-Q, familiarity, carry-over failure bonus,
material grade action cap — with the mishap system layered on top.

### Recipe effects and base mishap chance

Every alchemical recipe has a number of **effects**, determined by the ability rules (same as any
other ability). The base mishap chance for the recipe is:

> **Base mishap chance = effects × 15%**

*Example: a Potion of Greater Healing restores 60 HP. Healing costs 1 per 5 HP, so cost = 12
effects. Base mishap chance = 12 × 15% = 180% (80% modifier added to the mishap roll).*

### Batch crafting

A single alchemy project can produce more than one unit. Batch sizes follow the sequence:
**1, 2, 4, 6, 8, 10…** (1, then multiples of 2). Each step up from the previous batch size adds
**+50%** to the total mishap chance before any reduction:

| Batch size | Mishap added |
|---|---|
| 1 | +0% |
| 2 | +50% |
| 4 | +100% |
| 6 | +150% |
| 8 | +200% |

Batch size is chosen at the start of the project and cannot be changed mid-brew.

*Example: brewing a batch of 4 Greater Healing Potions — 180% base + 100% batch = 280% total
(180% modifier to the roll) before any reduction from crafting actions.*

### Reducing mishap chance

Every craft action spent on the project reduces the accumulated mishap chance, regardless of
whether the roll succeeds or fails:

- **Normal success or failure:** −15%
- **Critical success:** −30%

The crafter can choose when to finalise the brew — at any point up to the action cap — allowing
them to keep spending actions to bring the mishap chance lower before committing.

### Finalising the brew

When the crafter finalises:

- If mishap chance is **0% or below**: brew completes cleanly. No mishap roll.
- If mishap chance is **1–100%**: roll on the Alchemy Mishap Table.
- If mishap chance **exceeds 100%**: roll on the Alchemy Mishap Table with the excess added as a
  modifier (e.g. 160% remaining = roll + 60).

Tier 1 results (1–100) still produce the item, with side effects. Tier 2+ results may produce
altered, dangerous, or failed brews. See the Alchemy Mishap Table for full outcomes.

### Quality and potency

The C-Q tier the project closes at determines potency, same as any consumable:

- **High Quality (C-Q 61+):** +25% to the brew's base effect
- **Masterwork (C-Q 120+):** +50% to the brew's base effect

Critical successes do double duty: they raise C-Q by full Familiarity (instead of half) **and**
reduce mishap chance by 30% (instead of 15%).

### Materials cost

Use the **Materials** column from the item catalog as the Standard-grade (×1) reference cost.
Apply the standard material grade multipliers (×0.25 / ×1 / ×3 / ×8) for other grades.

---

## Status

Armor creation: complete.
Alchemy: complete.
Magic Item creation: pending.

Foundry implementation (data model, sheet UI, downtime integration) is a separate later pass.
