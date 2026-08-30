# Stamina System — WIP Design Doc

Status: Fatigue's core loop (Short Rest / Long Rest, minus the cook's roll) is implemented in
Foundry — see "Status" at the bottom. This remains a **game rules** doc; the Foundry
implementation details live in the code, not here.

This doc is currently an **audit of the status quo**, not a design — nothing below is a decision.
It exists so the rework conversation has an accurate starting point instead of re-deriving current
behavior from scratch, and so no placeholder mechanic gets mistaken for a confirmed rule the way
Fatigue briefly did in `exploration-system-wip.md` (see that doc's Resource pressure section).

---

## Current rules (rulebook)

From `rulebooks/TAMS New Rulebook .txt`:

- **Pool = Endurance, 1:1.** "The Stamina Resource is equal to the characters Endurance Stat. [If
  you have 30 Endurance, you have 30 Stamina.]" (line 126). No independent max stat in the
  rulebook text — Stamina *is* Endurance.
- **Spend:**
  - Abilities cost Stamina unless stated otherwise. Ability cost math starts at 0 and must build
    up to at least 1 (lines 257, 260).
  - Reload: −1 reload turn per 1 Stamina spent (line 378).
  - Up-casting an ability: pay in extra Stamina *or* extra cast time (crafter's choice) —
    +2/5m range, +2/1m AoE, +2 for a non-damage effect, +2 (+1 stacking) for a damage effect;
    cast-time cost is the same schedule except a damage effect costs +4 turns instead (lines
    577–586).
- **Regen:**
  - A "rest" restores Stamina equal to the **10's digit of Endurance** — `floor(END / 10)`
    (line 670).
  - The downtime "Resting" activity doubles the regen rate (line 642); repair-while-resting rules
    are marked "To Be Made Soon" in the rulebook itself.
  - A warm meal, once per day, grants a bonus equal to half the cook's Familiarity (line 673).
  - Sleeping 6–8 hrs and resting in a safe area are both listed as regen triggers (lines 672, 674),
    but the rulebook doesn't spell out whether they're separate regen events or descriptions of the
    same "rest."
- **NPCs:** Mooks have no Stamina at all — their one shared ability uses limited uses instead of a
  cost. Elites *do* have Stamina, and use it to dodge more effectively and retaliate multiple
  times. Bosses are built like PCs (lines 822, 1038–1043).

## Current rules (implementation)

From `src/models/character.js` and `src/documents/actor.js`:

- Schema: `system.stamina = { value, max, mult (default 1.0), color }`.
- `max` is **not** a direct Endurance mirror: `_prepareStamina()` computes
  `stamina.max = floor(max(1, endurance) × mult) + traitStaminaExtra`, where trait items can add a
  flat bonus via a `stamina.max` modifier target (`character.js:356-359`).
- Endurance-linked auto-adjustment: in `TAMSActor`'s pre-update logic, any change to Endurance
  shifts `stamina.value` by `floor(delta × mult)` to keep it in sync (`actor.js:413-438`). If that
  shift would push `value` below 0, the actor is offered a dialog to pay the deficit out of HP
  instead (`_offerHPPaymentForStamina` → `_computeLimbHPPayment`), or to accept the negative value
  with a chat warning.
- Stat-linked custom resources use the same deficit-payment pattern, but pay the deficit out of
  **Stamina** rather than HP (`_offerStaminaPayment`, `actor.js:440-462`).
- Changing `stamina.mult` directly adjusts `stamina.value` by the resulting delta in max
  (`actor.js:465-476`).
- Item Maker (`item-maker.js`) defaults new abilities to `resource: "stamina", cost: 1`.
- Travel Pace Calculator (`travel-pace.js`) has its own, separate Stamina-consumption model for
  overland travel — daily cost, rest-day discount, per-member breakdown. It does not read from or
  write to `system.stamina` on the actor; it's a standalone estimate tool.
- Correction to an earlier version of this audit: the actor sheet already had a `.tams-rest-stamina`
  button implementing the rulebook's `floor(END/10)`-per-rest regen formula (line 670) — it wasn't
  actually unimplemented. That button has since been repurposed into the new Short Rest action (see
  "Status" below), so the old behavior no longer exists as its own thing.

## Resolved: `mult` is accurate, not drift

The schema's `mult` field (Stamina scales as `floor(endurance × mult) + traitStaminaExtra`, not a
pure 1:1 mirror of Endurance) is confirmed intentional — the rulebook's "Stamina = Endurance"
line is the unmodified baseline (`mult = 1.0`), and `mult`/`traitStaminaExtra` are the hooks
future traits/races use to scale it. No change needed here; this is settled, not an open question.

## This rework's focus: Fatigue

The actual scope of the Stamina rework is a **Fatigue** mechanic: a temporary reduction to a
resource's *max*, separate from spending the resource itself. Per `exploration-system-wip.md`'s
Resource pressure section, Fatigue was pencilled in there as a **Maybe**, tentatively pegged to
Arctic/Tundra's extra resource bite, explicitly pending this rework — that's context for how it
might eventually plug in, not a constraint on what it has to be. Revisit that section once this
is settled (see "Known dependency" below).

Two rest tiers drive Fatigue — a short one that causes it, and a longer one that heals it. Neither
exists in the rulebook today; both are new concepts introduced by this rework. "Short Rest" and
"Long Rest" below are working labels for this doc, not established rulebook terms.

### Gaining Fatigue: the Short Rest

A **Short Rest** — roughly 15 minutes of non-strenuous activity, typically taken right after
combat — refills current Stamina back up to its (possibly already-reduced) max, and is the moment
Fatigue is calculated and applied:

> **Fatigue gained = max(1, floor(Stamina spent since the last Short Rest ÷ 10))**

Same `floor(X/10)` shape as the rulebook's existing rest-regen formula (line 670), with a floor of
1 so any spending at all costs at least 1 Fatigue — 1–19 spent → 1, 20–29 → 2, 30–39 → 3, etc.
Spending 0 since the last Short Rest → 0 Fatigue.

**Fatigue stacks.** Each Short Rest adds its tally on top of whatever Fatigue the character
already has, rather than replacing it — a character who keeps fighting without a proper Long Rest
watches their Stamina ceiling erode fight after fight.

### Recovering Fatigue: the Long Rest (Safe / Unsafe)

Fatigue does **not** heal on a Short Rest — only a longer rest heals it, and only through two
specific triggers, each independent of the other:

- **Warm dinner** — eating a warm, cooked meal.
- **Sleep** — at least 4 continuous hours, or 8 hours total if broken up/non-continuous.

Each trigger independently restores missing max (i.e. heals Fatigue) on **every stat-linked
resource**, generalized — not Stamina-specific. The formula reuses the same stat-based shape
throughout this doc:

> **Fatigue healed (per trigger) = floor(governing stat ÷ 10)**, at minimum

*Example: Stamina is governed by Endurance, so eating a warm dinner heals `floor(END/10)` Fatigue
on Stamina. A Mana resource governed by Intelligence heals `floor(INT/10)` Fatigue on Mana from
the same dinner, same night's sleep — same triggers, evaluated per resource against that
resource's own governing stat.*

Doing both dinner and sleep in the same rest window heals both ticks; doing only one heals only
that one.

**Unsafe conditions:** one rest window per 24 hours. Within that window, one shot at the dinner
trigger and one shot at the sleep trigger — confirmed no double-dipping either one (can't eat two
dinners for two ticks).

**Safe conditions:** the day auto-splits into three separate 8-hour rest windows instead of one
24-hour window, granted automatically (not declared or rolled for). Each of the 3 windows is its
own **full, independent** rest opportunity — its own shot at the dinner trigger and its own shot
at the sleep trigger, same formula as Unsafe. That's up to 6 Fatigue-healing ticks a day under Safe
(3× dinner + 3× sleep) versus 2 under Unsafe (1× dinner + 1× sleep). These windows don't interfere
with downtime.

**Cook's roll:** if the meal is prepared by a cook, they roll `Craft (Cooking)` (using `Cook's
utensils`, an existing Artisan Tool — same Tool Quality Grade bonus as any other craft skill:
`Makeshift −5 / Basic +0 / Quality +5 / Masterwork +10`) against a DC set by the ingredient grade
used. Success can push the dinner tick's amount above the `floor(stat/10)` minimum, and a crit on
that roll doubles the missing-resource amount restored.

Ingredient grade reuses crafting's existing Material Grade table (`crafting-system-wip.md`,
"Starting a project: materials") for cost, but **better ingredients make the roll easier, not
harder** — the DC is the same reused Easy/Normal/Hard(/+1 step) scale from
`exploration-system-wip.md`, assigned in reverse:

| Ingredient grade | Cost multiplier (reused as-is from crafting) | DC |
|---|---|---|
| Low | ×0.25 | 60 (hardest) |
| Standard | ×1 | 45 |
| High | ×3 | 30 |
| Masterwork | ×8 | 15 (easiest) |

Paying more for better ingredients buys reliability on the cook's roll, not just a bigger
potential payoff.

Not yet specified: the exact success-margin → bonus-amount formula (how much a roll beats the DC
by translates into how much it exceeds the `floor(stat/10)` minimum). **TBD.**

### Open questions

- **Success-margin → bonus-amount formula** for the cook's roll — how much beating the DC
  translates into exceeding the `floor(stat/10)` minimum. **TBD.**
- **What else Fatigue affects.** So far Fatigue only reduces a resource's own max (Stamina, Mana,
  etc.) via the Short Rest formula above. Whether it also does anything else (a roll debuff, a
  separate consequence track) hasn't come up — treat it as *only* a max-resource reduction unless
  stated otherwise.

## Unimplemented rulebook mechanics

These exist as rulebook text but have no corresponding code path today — worth deciding whether
the rework should implement them as-is, revise them, or drop them:

- Reload-for-Stamina buyout (line 378).
- Ability up-casting via extra Stamina or extra cast time (lines 577–586).
- The doubled downtime-rest regen rate and the warm-meal-familiarity regen bonus (lines 642, 673)
  — superseded by the Long Rest dinner/sleep formula below, not implemented as separately
  described in the rulebook text.
- Elite-NPC Stamina use for extra dodges/retaliation (line 1043) — squad/horde and NPC rank
  logic already lives in `applyDamage()` per `CLAUDE.md`; this would need to hook in there or in
  the NPC sheet.

## Known dependency

`exploration-system-wip.md`'s Resource pressure section has Fatigue marked as a **Maybe**, pencilled
in for Arctic/Tundra's extra resource bite, explicitly pending this rework. Once Stamina's shape is
settled here, revisit that section to confirm or drop Fatigue — don't let it default to "confirmed"
just because this doc now exists.

---

## Status

Audit complete. Current rulebook rule (1:1 with Endurance baseline) and current implementation
(`mult`-scaled, trait-extendable — confirmed intentional, not drift) are documented above.
Unimplemented rulebook mechanics (reload buyout, up-casting, rest regen formula, Elite NPC use)
are listed as open items, not yet decided for keep/revise/drop, and are not part of this rework's
scope unless they turn out to interact with Fatigue.

**Fatigue: core loop drafted.** Two new rest tiers (Short Rest, Long Rest) drive it:
- Short Rest (~15 min, post-combat) refills current Stamina and applies
  `max(1, floor(spent/10))` Fatigue, which **stacks** across repeated Short Rests.
- Long Rest (Safe/Unsafe) heals Fatigue via two independent triggers — warm dinner, sleep
  (4hrs continuous / 8hrs broken) — each healing `floor(governing stat/10)` per resource,
  generalized to every stat-linked resource (Mana/INT, etc.), not just Stamina/Endurance.
  Unsafe = 1 rest window/24hrs, one shot at each trigger (2 ticks/day total). Safe = 3 full
  independent 8hr rest windows/day, automatic, each with its own dinner+sleep shot (up to 6
  ticks/day total), doesn't interfere with downtime. Cook's roll (`Craft (Cooking)` + Cook's
  utensils tool-grade bonus, vs. ingredient-grade DC — better ingredients = easier, reusing
  crafting's Material Grade cost table with the DC scale reversed) can push the dinner tick above
  the floor minimum; crit doubles the amount restored.
- Open: the cook's-roll success-margin → bonus-amount formula; whether Fatigue does anything
  beyond reducing resource max.

**Foundry implementation: done, except the cook's roll (deliberately deferred).**
- `src/utils/fatigue.js` — pure, tested math: raw-max formulas, `computeFatiguedMax`,
  `computeShortRestFatigueGain` (`max(1, floor(spent/10))`), `computeLongRestTickHeal`/
  `computeLongRestFatigueHeal` (dinner+sleep bundled).
- `src/models/character.js` — `stamina.fatigue`/`stamina.spentSinceRest`, the same two fields on
  every `customResources` entry, and a new top-level `restSafe` boolean (default `false`/Unsafe —
  independent of `downtime.isSafe`, which stays scoped to the separate multi-day Downtime
  tracker). `_prepareStamina`/`_prepareCustomResources` now subtract Fatigue from the raw max.
- `src/documents/actor.js` — `applyResourceSpend()` (centralized spend helper all existing
  Stamina/customResource-spending call sites now route through, tracking `spentSinceRest`),
  `takeShortRest()`, `takeLongRest()` (rolling-24h use-count cap: 1 Unsafe / 3 Safe, via a
  `flags.tams.longRestUses` timestamp array — no literal 8-hour-window modeling).
- `src/applications/actor-sheet.js` / `templates/actor-sheet.html` — the old `.tams-rest-stamina`
  button (which did the old regen-only behavior) is now `.tams-short-rest`; a new `.tams-long-rest`
  button and a Safe/Unsafe checkbox sit in a toolbar above the resources list; each resource shows
  a Fatigue badge next to its max (visible as its own number, not just baked into a smaller max).
- **Cook's roll is not implemented** — dinner tick is always exactly `floor(stat/10)`, no roll, no
  ingredient-grade DC, no crit-doubling. Deliberately deferred until the success-margin→bonus
  formula (still TBD above) is settled; the scaffold described in "Recovering Fatigue" above is
  ready to build against once it is.

`crafting-system-wip.md` and `exploration-system-wip.md` remain rules-only, Foundry
implementation pending, per their own Status sections.
