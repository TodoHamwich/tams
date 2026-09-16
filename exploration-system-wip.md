# Wilderness/Urban Exploration System — WIP Design Doc

Status: rulebook design in progress. This is a **game rules** doc — no Foundry
implementation details (schema, UI, code) belong here until the rules themselves are settled.

Scope: one unified exploration system — a shared core mechanic with wilderness-specific and
urban-specific modifiers/tables layered on top, rather than two separate systems.

---

## Core concept: the exploration hour

**Design goal: no dead-end failures.** A failed roll must never just mean "nothing happens, try
again" (e.g. the classic "you walk in a circle"). Every outcome — success or failure — has to
move something forward: progress, a complication, a discovery, a cost. Failure should be
*interesting*, not a stall.

**Structure:** exploration time is broken into **hours**, and each hour is split into **4
quarter-hour segments**. In each segment, every player gets **one action**. This is the
fundamental unit the rest of the system hangs off — terrain, hazards, resource pressure, and
material gathering all resolve in terms of "what happened this segment," not one big
roll-per-hour.

**Each player chooses their own action every segment** — not a single shared action for the whole
party. Four players in one segment can mean four different rolls (one scouts, one forages, one
navigates, one rests), each resolving independently.

**Movement is the default, not an action.** The party is always assumed to be advancing toward
their target for the segment — no roll, no action spent — unless the action a player chose for
that segment explicitly halts movement (see "Movement" in the action menu below). There is
no dead roll that can stop the party cold; the only way movement doesn't happen this segment is
that someone deliberately chose to do something else instead.

**Terrain/district context can shift mid-hour.** The 4 segments aren't locked to one context for
the whole hour — default movement can carry the party across a boundary (open plain into forest,
one district into the next), and the *next* segment resolves in the new context with its own DCs.
The GM still sets DCs ahead of time (per terrain/district type, not live per segment), so a
boundary crossing means switching to a different pre-set DC block, not improvising one on the
spot. Drifting off the intended line — e.g. from a Navigate/Chart fumble — is what sends a segment
into *unintended* terrain/district instead of the expected one.

## The exploration check

### DCs are set ahead of time

The GM sets the DC for each action **in advance** — per hour, per stretch of route, per district
— rather than deriving it live from a formula at the table. (Terrain/district tables below exist
to help the GM *pick* those DCs consistently, not to replace GM judgment.)

### The roll itself: capped, not additive

TAMS rolls are **d100 capped by the controlling Stat**, not a flat d100 — this is the core
"capped-roll" mechanic the whole system is built on (see the rulebook's Skill Check example:
Strength 30, raw roll of 50, result is capped to 30, +10 Familiarity = Total 40). So:

> **Total = min(raw d100, Stat) + Familiarity (+ other bonuses)**

Total is what's compared to the DC for pass/fail.

### Resolution: two independent axes

Because the Stat caps the raw roll before Familiarity is even added, a high raw roll does **not**
guarantee a high Total — a low Stat can cap a great roll down hard, and a high Familiarity can
carry a poor roll up past the cap. That's exactly why crit/fumble is judged on the **raw d100
against the DC**, separately from Total against the DC:

| Tier | Condition |
|---|---|
| **Crit (on the die)** | raw d100 ≥ 2 × DC |
| **Fumble (on the die)** | raw d100 ≤ DC / 2 |
| **Pass** | Total ≥ DC |
| **Fail** | Total < DC |

All four combinations are real, not edge cases:

- **Crit + Pass** — best case: great roll, and the Stat/Familiarity backed it up.
- **Crit + Fail** — rolled well above what the DC needed, but a low Stat capped it down before
  Familiarity could push the Total over the line. Feels like "gave it everything, wasn't built
  for this."
- **Fumble + Pass** — a bad roll, but sheer Familiarity carried the Total past the DC anyway
  (raw is small enough that the Stat cap didn't even apply — capping only bites when raw > Stat).
  Feels like "barely tried, expertise did the work."
- **Fumble + Fail** — the worst outcome; see the no-dead-end floor below for what this can and
  can't mean per action.

### The no-dead-end floor

Failure is allowed to mean **nothing found** — that's fine, not a violation of the design goal,
because the segment's time/resource cost is itself the consequence (see Resource pressure). The
floor is about *rolls*, not about action choice: no **Fumble** result on any action reduces
movement below what that action already implied going in — a Fumble on a full-pace action never
demotes it to reduced/none, and a Fumble on a Reduced/None-pace action doesn't need to punish
movement further, since the action itself already spent that. What the floor rules out is a roll
being the *reason* movement stops — only a deliberate action choice (or bad terrain) does that.

### Movement this segment

One shared multiplier scale drives both terrain and action choice, and it **stacks
multiplicatively**:

| Tier | Multiplier |
|---|---|
| Full | ×1 |
| Reduced | ×0.5 |
| None | ×0 |

Two independent things apply this scale to a segment's movement distance off the Travel Pace
baseline (see "Interactions with existing systems" below):

- **Terrain** sets a tier for everyone this segment (rough ground, dense streets, etc. — see
  Wilderness/Urban terrain tables, pending). Difficult terrain is typically Reduced; a terrain
  entry would only be None for something that outright blocks movement (e.g. impassable without a
  specific tool/ability).
- **Action choice** (see the menu below) sets a per-player tier on top of terrain's.

Reductions **stack multiplicatively, not additively**: Reduced terrain (×0.5) combined with a
Reduced action like Lay Low (×0.5) is ×0.25 — quarter pace, not "two reductions cancel toward
zero" or "minus two steps."

### Falling behind and regrouping

Movement is resolved **per player**, not forced to a single party-wide pace. A player whose
combined tier this segment is slower than the rest of the group simply **falls behind** by
default — the party doesn't automatically wait. Any other player can voluntarily match a slower
teammate by choosing to Reduce or stop their own movement too, keeping the group together at the
cost of everyone's progress. Staying together is a choice the party makes each segment, not an
assumption the system makes for them.

### Action menu (shared — wilderness and urban both use this list)

Terrain/district tables don't add new actions; they set DCs and flavor the fail/crit-fail result
(see Wilderness and Urban below). "Movement" marks that action's own pace multiplier, before
terrain is applied on top.

| Action | Movement | Typical skill | Crit Success | Success | Failure | Fumble |
|---|---|---|---|---|---|---|
| **Scout Ahead** | Full — ranges ahead while the party keeps advancing | `Perception`/`Survival(tracking)` | See it AND stay unnoticed | See what's coming next segment before it hits | Get the info, but noisily — spotted in return | See nothing useful, and got spotted for the trouble |
| **Forage/Gather** | None | `Survival` or relevant `Craft(X)` | Bonus yield | Full yield of food/water/materials | Reduced yield | Nothing found — acceptable per the floor above |
| **Navigate/Chart** | Full | `Survival` or `Craft(Cartography)` | Locks position + reveals a shortcut/POI | Locks in position for the rest of the hour | Not more lost, but the segment's spent for it | Misreads position — the segment's movement drifts off the intended line (see "context can shift mid-hour" above) |
| **Search a Point of Interest** | None | `Investigation`/`Perception` | Best version of the find | Find loot/lore/a shortcut | Partial or compromised find (trapped, incomplete) | Nothing found |
| **Lay Low / Avoid** | Reduced — moving carefully/quietly costs pace | `Stealth` | Avoid it and gain the drop on it | Preemptively dodge a spotted hazard entirely | Hazard still triggers, but on your terms | Hazard triggers on its terms — worst framing of the encounter |
| **Rest/Tend Wounds** | None | `Medicine` or none | Full recovery, no resource cost | Recover fatigue/HP per medical aid rules | Reduced recovery, still costs the time/rations | No recovery, still costs the time/rations |
| **Aid Another** | Matches the ally's action | assist mechanic — see below | — | Boosts a teammate's roll this segment | — | — |

**Aid Another's bonus:** if the helper has the **same skill** the teammate is rolling, the
teammate's Total gets the helper's **full Familiarity** in it as a bonus; if the helper doesn't
have that exact skill, it's **half** their Familiarity in whatever they *do* have that's plausibly
related (GM's call on relevance). This mirrors the existing full-for-exact-match/half-for-
broad-category rule weapon familiarity already uses (see CLAUDE.md's "Weapon familiarity from
skills") — same shape of rule, reused rather than invented fresh. A helper with nothing remotely
applicable contributes nothing; Aid Another still costs them their action/movement for the
segment regardless.

### Hazards & encounters (shared mechanic)

**Placed ahead of time, not live-rolled.** Same principle as DCs: hazard frequency (from the
terrain/district table) tells the GM how many of the hour's **4 segments** get a hazard placed in
them during prep — no percentage roll needed each segment:

| Hazard frequency | Segments (of 4) with a hazard placed |
|---|---|
| Low | 1 |
| Medium | 2 |
| High | 3 |

**Hidden until revealed or triggered.** A placed hazard stays hidden from the players until one of
two things happens:

- A **successful Scout Ahead** the segment before reveals it in advance, letting the party respond
  — usually with Lay Low, but any action is still a valid (if less-informed) choice.
- Nobody scouted it, or Scout failed, and its segment arrives — it **triggers automatically** with
  no warning. This is the main way a Fumble-adjacent "spotted in return" result on Scout Ahead
  becomes costly: the party missed their one shot at advance notice for that hazard.

**Triggering interrupts the segment.** Whatever action a player had chosen for a segment where a
hazard triggers gets pre-empted by resolving the encounter — combat, a skill challenge, a
delay — using TAMS's existing systems (combat rules, checks) rather than a new resolution
mechanic invented here. This doc only owns *placement* and *reveal*, not encounter resolution
itself.

**Severity** is rolled once the hazard triggers or is revealed (d100), on a shared tier scale —
Wilderness and Urban both use it, they just fill it with different content:

| Tier | Roll | Flavor |
|---|---|---|
| Minor | 01–60 | Costs time/resources; no real threat |
| Moderate | 61–90 | A genuine problem — worth a fight, a challenge, or a resource hit |
| Severe | 91–100 | Serious threat — hands off to full combat/check resolution |

<!-- Content TBD, separate authoring pass: actual per-terrain/per-district encounter tables (what
a Moderate hazard specifically *is* in Wetland vs. Slums) aren't part of this design pass — same
way crafting-system-wip.md left "Magic Item creation: pending" as a later authoring task. -->

## Wilderness

### Terrain

Each category sets three things for the shared action menu — it doesn't add new actions, only
context: a **movement tier** (Full/Reduced/None, stacking with action choice per "Movement this
segment" above), a **DC band** (below), and a **hazard frequency** (feeds the Hazards & encounters
table below).

### DC scale

Three anchor DCs, usable for any exploration check, not just terrain — the GM picks whichever fits
the specific action/segment, and can shift up or down from these by judgment (a Scout Ahead roll
in light fog might be Normal+5, for instance — these are defaults, not hard limits):

| Band | DC |
|---|---|
| Easy | 15 |
| Normal | 30 |
| Hard | 45 |

| Terrain | Movement | DC band | Hazard frequency | Notes |
|---|---|---|---|---|
| **Open/Plains** | Full | Easy (15) | Low | Long sightlines — Scout Ahead is more reliable here, little cover for anything to sneak up |
| **Forest/Woodland** | Reduced | Normal (30) | Medium | Undergrowth/deadfall slow movement; concealment cuts both ways for Scout/Lay Low |
| **Hills/Mountains** | Reduced | Normal–Hard (30–45) | Medium | Elevation change; falls/exposure are the flavor for a bad Advance-adjacent segment |
| **Wetland/Swamp** | Reduced | Hard (45) | High | Slowest and most hazard-dense baseline terrain; a Fumble here should hit harder than elsewhere |
| **Desert/Wasteland** | Full (hardpan) or Reduced (dunes) | Normal–Hard (30–45) | Medium | Difficulty leans on Resource pressure (water) more than raw movement |
| **Arctic/Tundra** | Reduced | Hard (45) | Medium–High | Difficulty also leans on Resource pressure — likely cold/exposure once Fatigue is confirmed (see Resource pressure below), not locked in yet |
| **Ruins/Overgrown** | Reduced | Normal–Hard (30–45) | High | Reclaimed structures — best terrain for Search a Point of Interest, worst for Navigate/Chart (no reliable landmarks) |

### Hazards & encounters

Uses the shared placement/reveal/severity mechanic above. Wilderness content skews
environmental/creature — the "Severe" tier especially. Actual entries per terrain: TBD.

### Navigation & getting lost

A Navigate/Chart fumble doesn't cost extra segments/hours by itself — that would be the "walk in
a circle, try again" trap this whole system is built to avoid. Instead, the *next* segment's
default movement carries the party into **real but unintended terrain**: an adjacent terrain type
the GM picks (e.g. meant to cross Open/Plains, actually drifted into the edge of Forest/Woodland),
with its own DC band and hazard frequency. Being lost is self-punishing through what that terrain
actually contains, not through a bolt-on penalty.

**Staying lost vs. correcting.** Once drifted, the party keeps moving through the unintended
terrain each subsequent segment until someone chooses Navigate/Chart again and **succeeds** —
that's what gets them back on the intended line. There's no separate "you're now Lost" status to
track; being lost just means the terrain context and the intended route have quietly diverged, and
a successful Navigate/Chart is what reconciles them.

## Urban

### District/zone types

Same shape as Wilderness terrain, same shared DC scale (Easy 15 / Normal 30 / Hard 45, GM-
adjustable) — a district sets movement tier, DC band, and hazard frequency for the action menu,
same as terrain does. One difference: "hazard" in a district is usually **being noticed** rather
than physical danger — a patrol, a nosy shopkeeper, a pickpocket clocking you — so Lay Low and
Scout Ahead carry more weight here than in most wilderness terrain, where the hazard column skews
toward creatures/environment. Sewers/Undercroft and Ruins are the exceptions — no authority
presence in either, so their hazard flavor is physical danger, same as wilderness.

| District | Movement | DC band | Hazard frequency | Notes |
|---|---|---|---|---|
| **Main Streets/Market** | Full | Easy (15) | Medium | Crowds mean low physical danger but high chance of a minor social hazard (pickpocket, nosy vendor); hard to Scout Ahead through the noise |
| **Residential/Backstreets** | Full | Normal (30) | Low–Medium | Quiet — easy to move, but an out-of-place party draws suspicion faster than in a crowd |
| **Docks/Warehouse** | Reduced | Normal (30) | Medium–High | Cargo/crate clutter slows movement; rough crowd, smuggling activity |
| **Slums/Undercity** | Reduced | Hard (45) | High | Maze-like, decayed — worst terrain for Navigate/Chart, most crime-flavored hazard |
| **Noble/Government Quarter** | Full | Normal–Hard (30–45) | High (authority, not violence) | Wide, well-kept streets — easy to *move*, hard to move *unnoticed*; hazard here means guards/patrols/questioning, not danger |
| **Sewers/Undercroft** | Reduced | Hard (45) | Medium | The one aboveground-adjacent district that plays like wilderness underground — vermin, structural hazards, physical danger returns as the flavor |
| **Ruins** | Reduced | Hard (45) | High (physical danger, not social) | Collapsed/abandoned quarter — no authority presence, so low "noticed" risk, but unstable structures and squatters/looters make it the second physical-danger district alongside Sewers. Best district for Search a Point of Interest (salvage, history), worst for Navigate/Chart (streets erased, no reliable landmarks) |

### Hazards & encounters

Uses the shared placement/reveal/severity mechanic above (see "Hazards & encounters (shared
mechanic)" under The exploration check). Urban content splits into two flavors per the note in
District/zone types: "noticed" encounters (Market, Backstreets, Noble Quarter — crowds, patrols,
social friction) vs. physical-danger encounters (Docks, Slums, Sewers/Undercroft, Ruins). Actual
entries per district: TBD.

### Navigation & getting lost

Same structure as Wilderness — a fumble drifts the *next* segment into an adjacent **district**
the GM picks, not a time penalty. The urban flavor is what makes a wrong turn actually sting: since
most districts' hazard is about being noticed rather than physical danger, drifting from somewhere
low-scrutiny (Backstreets) into somewhere high-scrutiny (Noble Quarter) means the party is now
somewhere they don't belong, with that district's DC/hazard applying to them immediately — a
lost tourist wandering into the palace district is its own complication, no extra roll required to
make it interesting. Correcting back requires a **successful** Navigate/Chart, same as Wilderness.

## Resource pressure

**Tracked via TAMS's existing customResources system** (`src/models/character.js`), not a new
hardcoded schema — GM/players define resource bars (Rations, Water, etc.) the same way any other
dynamic resource already works on the sheet.

| Resource | Baseline consumption | What terrain changes |
|---|---|---|
| **Rations** | 1 per person per day (ticks once per travel day, not per hour/segment) | Unaffected by terrain — this is about food supply, not the environment |
| **Water** | 1 per person per day | **Desert/Wasteland**: ticks per *hour* instead of per day — the terrain's promised extra bite from "Terrain" above |
| **Light source** | 1 unit per hour, only in darkness (Sewers/Undercroft, other lightless terrain) | N/A — presence/absence of light is the terrain property, not a modifier |

**Fatigue: Maybe, not confirmed.** There's a separate Stamina rework in progress elsewhere in the
system; once that lands, Fatigue may become a real tracked resource here (Arctic/Tundra was
pencilled in for the same "+1/hour, extra bite" treatment Desert gets for Water). Until that
rework settles, treat Fatigue as absent from this doc rather than assume the mechanic above.

**Recovery.** Rations/Water reset when resupplied in a settlement or via a successful Forage/Gather
(see Material gathering below). (Fatigue recovery via Rest/Tend Wounds: revisit once Fatigue is
confirmed.)

**Running out is a hazard, not a new punishment system.** Hitting 0 on any tracked resource feeds
straight into the existing Minor/Moderate/Severe severity scale from Hazards & encounters — e.g.
Minor (a debuff to checks from thirst/hunger), Moderate (HP loss), Severe (a real
crisis) — rather than inventing a separate exhaustion mechanic. Exact severity-per-resource
mapping: TBD.

## Material gathering

Tie-in to `crafting-system-wip.md`, kept modular: crafting's standalone buy-at-a-grade path
(`crafting-system-wip.md`, "Starting a project") doesn't go away — gathering is an
ALTERNATIVE/supplemental source, not a replacement. A table with no crafting system in play still
gets full value from exploration (loot, encounters, navigation), and a table with no exploration
system in play can still craft normally by buying.

**Trigger: the Forage/Gather action.** Its outcome tier maps directly onto crafting's existing
Low/Standard/High/Masterwork material grades — a thin translation layer, not a new parallel
grading scheme:

| Forage/Gather result | Material grade found |
|---|---|
| Crit Success | High |
| Success | Standard |
| Failure | Low |
| Fumble | Nothing (per the no-dead-end floor — acceptable, not a violation) |

Masterwork-grade raw material is deliberately **not** reachable through routine Forage — narratively
you don't stumble onto a masterwork vein while foraging, you *discover* it. That's a Search a
Point of Interest find instead (a rare/notable location, GM's call), keeping Masterwork material
tied to the same "found something special" weight it has everywhere else in the crafting doc.

**Which craft category, by terrain** (illustrative, not exhaustive — GM fills in gaps for a
specific item/location):

| Terrain | Craft categories available to Forage |
|---|---|
| Open/Plains | Weaving (wild fiber), Cooking (game, edible plants) |
| Forest/Woodland | Woodworking (timber), Leatherworking (game hides), Alchemy (herbs, fungi) |
| Hills/Mountains | Blacksmithing (ore), Masonry (stone), Jewelcraft (raw gems) |
| Wetland/Swamp | Alchemy (rare reagents, fungi, venom), Cooking (fish, game) |
| Desert/Wasteland | Glassblowing (sand), Jewelcraft (desert geodes) |
| Arctic/Tundra | Leatherworking (thick furs/hides), Cooking (game) |
| Ruins/Overgrown | Masonry (cut-stone salvage), Jewelcraft (buried valuables) — leans more toward Search a Point of Interest than routine Forage |

Urban districts don't map to raw-material categories the same way — a city doesn't grow ore. Urban
"gathering" is really **salvage**, and probably belongs to Docks/Warehouse (cargo), Slums/Undercity
(scrap), Sewers/Undercroft (Alchemy reagents), and Ruins (Masonry/Jewelcraft, same as wilderness
Ruins) rather than a full terrain-style table of its own. Exact urban entries: TBD.

## Interactions with existing systems

**Segment movement distance = Travel Pace Calculator's existing speed, not a new number.**
`src/applications/travel-pace.js` already defines each party member's own speed in miles/day
(default 20 mi/day on foot, 40 mi/day mounted, adjusted for forced-march hours). A quarter-hour
segment's Full-pace movement distance is just that member's own daily speed ÷ 32 segments/day
(8-hour travel day × 4 segments/hour) — no separate exploration-specific pace to keep in sync.
Terrain/action tiers (see "Movement this segment" above) multiply this same per-player,
per-segment figure rather than defining their own base pace.

Note: the long-distance calculator takes the *party's slowest member* as the group pace, since it
assumes the party travels together over days. The exploration-hour system doesn't force that
assumption — each player's segment movement is figured from their own speed, and the party only
ends up moving at its slowest member's pace when players choose to stay together (see "Falling
behind and regrouping" above).

<!-- Downtime actions, the mishap system (src/utils/mishap.js) — note where this system reuses or
diverges from them. (crafting-system-wip.md tie-in is covered under Material gathering above.) -->

---

## Status

Core mechanic: defined (1 hour = 4 quarter-hour segments, 1 action per player per segment, chosen
independently; movement is a free default, not a rollable action, resolved per player and scaled
by a shared Full ×1 / Reduced ×0.5 / None ×0 tier that terrain and action choice both use and
stack multiplicatively — never reduced by a bad roll; no dead-end failures). Falling behind is the
default when a player's tier is slower than the group; regrouping is a voluntary choice each
segment. Shared action menu and check resolution (GM-set DCs; Total = capped-roll + Familiarity
decides Pass/Fail; raw d100 vs DC decides Crit/Fumble, independently): drafted, see above.
Aid Another's bonus resolved: full Familiarity if the helper has the exact skill, half if not
(reuses the existing weapon-familiarity exact-match/broad-category rule).
Shared hazard/encounter mechanic: defined (hazard frequency = how many of the hour's 4 segments
have a hazard placed ahead of time; hidden until a successful Scout Ahead reveals it or it
triggers unwarned; triggering hands off to existing combat/check resolution; severity is a shared
Minor/Moderate/Severe roll table) — see "Hazards & encounters (shared mechanic)" above. Actual
per-terrain/per-district encounter content is a separate authoring pass, not yet started.
Wilderness rules: terrain categories drafted (7 types: movement tier, DC band, hazard frequency —
see above), using a fixed Easy/Normal/Hard = 15/30/45 DC scale (GM-adjustable) that any
exploration check can reuse, not just terrain. Getting-lost drafted: a Navigate/Chart fumble
drifts the next segment into unintended (but real) terrain rather than costing extra time;
correcting back requires a successful Navigate/Chart.
Urban rules: district types drafted (7 types, same shape/DC scale as Wilderness terrain; hazard
reframed as "being noticed" rather than physical danger for most districts, except
Sewers/Undercroft and Ruins which stay danger-flavored — see above). Getting-lost drafted: same
structure as Wilderness, drifting into an unintended district instead.
Resource pressure: drafted — reuses TAMS's existing customResources system (no new schema).
Rations/Water tick per day; Desert doubles Water's tick rate to per-hour. Fatigue is a **Maybe**,
not confirmed — pending a separate Stamina rework in progress elsewhere; Arctic's extra bite is
pencilled in against Fatigue once that lands, not locked in yet. Hitting 0 on a resource feeds the
shared Minor/Moderate/Severe hazard severity scale rather than a
new punishment mechanic; exact severity mapping TBD.
Material gathering: drafted — triggered by the Forage/Gather action, whose outcome tier maps
directly to crafting's Low/Standard/High grades (Masterwork reserved for Search a Point of
Interest finds, not routine Forage). Terrain→craft-category table drafted for Wilderness
(illustrative, not exhaustive); Urban framed as salvage rather than a full parallel table, exact
entries TBD.

Foundry implementation (data model, sheet UI, downtime integration) is a separate later pass.
