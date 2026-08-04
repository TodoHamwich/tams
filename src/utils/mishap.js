export const MISHAP_TABLE = [
    // Tier 1: Narrative (01–100) — spell always fires, purely flavour
    { min: 1,   max: 5,   tier: 1, name: "Hiccups",                 effect: "Caster hiccups uncontrollably for the next minute." },
    { min: 6,   max: 10,  tier: 1, name: "Squeaky Voice",            effect: "Caster's voice rises three octaves for a few minutes." },
    { min: 11,  max: 15,  tier: 1, name: "Sparkler",                 effect: "Harmless colourful sparks shower from the caster's fingertips." },
    { min: 16,  max: 20,  tier: 1, name: "Wrong Smell",              effect: "The area briefly smells strongly of something absurd (wet dog, burnt toast, lavender)." },
    { min: 21,  max: 25,  tier: 1, name: "Static Cling",             effect: "Caster's hair stands on end and clothes cling oddly for the scene." },
    { min: 26,  max: 30,  tier: 1, name: "Overenthusiastic Gesture", effect: "The somatic gesture comes out unexpectedly grand and theatrical, drawing every eye in the room." },
    { min: 31,  max: 35,  tier: 1, name: "Sneezing Fit",             effect: "Caster sneezes three times in a row immediately after casting." },
    { min: 36,  max: 40,  tier: 1, name: "Mismatched Words",         effect: "The incantation comes out in the wrong order — vaguely insulting to anyone who speaks the language." },
    { min: 41,  max: 45,  tier: 1, name: "Butterflies",              effect: "A small cloud of illusory butterflies bursts from the casting hand and dissolves after a few seconds." },
    { min: 46,  max: 50,  tier: 1, name: "Wobbly Knees",             effect: "The caster's knees buckle comically for a moment." },
    { min: 51,  max: 55,  tier: 1, name: "Ash Puff",                 effect: "A small, harmless puff of soot covers the caster's face and hands." },
    { min: 56,  max: 60,  tier: 1, name: "Echoing Voice",            effect: "The caster's voice echoes oddly for the next few sentences they speak." },
    { min: 61,  max: 65,  tier: 1, name: "Singed Eyebrows",          effect: "Caster's eyebrows (or equivalent) are singed off. Grow back in 1d4 days." },
    { min: 66,  max: 70,  tier: 1, name: "Squeaky Boots",            effect: "Every step the caster takes for the rest of the scene produces an embarrassing squeak." },
    { min: 71,  max: 75,  tier: 1, name: "Tongue-Tied",              effect: "Caster can only mumble for 1 round — no mechanical effect, purely descriptive." },
    { min: 76,  max: 80,  tier: 1, name: "Static Shock",             effect: "Anyone who touches the caster in the next minute gets a small zap and a dirty look." },
    { min: 81,  max: 85,  tier: 1, name: "Ridiculous Odour",         effect: "Caster smells overwhelmingly of the last thing they ate, for the rest of the day." },
    { min: 86,  max: 90,  tier: 1, name: "Minor Humiliation",        effect: "The spell fires with an unmistakably undignified noise or flourish that everyone nearby definitely noticed." },
    { min: 91,  max: 95,  tier: 1, name: "Butterfingers",            effect: "Caster fumbles whatever's in their other hand — a small dropped item, no mechanical loss." },
    { min: 96,  max: 100, tier: 1, name: "Everyone's Looking",       effect: "Every creature within earshot turns to stare after an unmistakably awkward spectacle." },

    // Tier 2: Real Effects (101–200) — alternating positive/negative every 10
    { min: 101, max: 110, tier: 2, positive: true,  name: "Echoing Surge",        effect: "Spell fires at full effect, and fires again at half effect at the caster's next turn, retargeted by the caster." },
    { min: 111, max: 120, tier: 2, positive: false, name: "Catastrophic Backlash", effect: "Spell fails entirely. Caster takes (cost × 10) to the Thorax, bypassing all armour and damage resistances. The caster may spend resource — each resource spent reduces this damage by 10." },
    { min: 121, max: 130, tier: 2, positive: true,  name: "Overwhelming Surge",   effect: "Spell fires at double all numerical values. No downside." },
    { min: 131, max: 140, tier: 2, positive: false, name: "Magical Reversal",     effect: "Spell fails to reach its intended target and strikes the caster instead at full effect, as if they were the original target." },
    { min: 141, max: 150, tier: 2, positive: true,  name: "Temporal Boost",       effect: "Spell fires normally. Caster gains an additional activation this round." },
    { min: 151, max: 160, tier: 2, positive: false, name: "Reality Rupture",      effect: "Spell detonates at the caster's position. All creatures within 5m (including the caster) take (cost × 10) damage. Each resource spent reduces this damage by 10 for all affected. Spell's original effect fails." },
    { min: 161, max: 170, tier: 2, positive: true,  name: "Arcane Mastery",       effect: "Spell fires normally. Caster's next 2 spell rolls automatically succeed at maximum effect." },
    { min: 171, max: 180, tier: 2, positive: false, name: "Planar Bleed",         effect: "A rift tears open at the point of casting. A hostile creature from another plane emerges (GM scales to party threat level). Rift seals after 1 round. Spell fails." },
    { min: 181, max: 190, tier: 2, positive: true,  name: "Wild Boon",            effect: "Spell fires normally and is duplicated in full at a second valid target/location of the caster's choosing." },
    { min: 191, max: 200, tier: 2, positive: false, name: "Cascade Failure",      effect: "Roll twice more on this 101–200 band (re-roll results of 191+). Apply both results simultaneously. Original spell fails." },

    // Tier 3: Extreme (201–250)
    { min: 201, max: 210, tier: 3, name: "Mana Cataclysm",   effect: "All creatures within 10m take (cost × 20) damage bypassing armour. Caster takes double this amount. Each resource spent reduces damage by 10 for all affected (caster's doubled portion reduced by 20). Make a Survival Check if brought to 0 HP. Spell fails." },
    { min: 211, max: 220, tier: 3, name: "Temporal Fracture", effect: "All creatures in the encounter revert to their positions at the start of the previous round. HP, Stamina, and Mana remain at their values at the moment of the mishap. Spell fails. Can only trigger once per combat." },
    { min: 221, max: 230, tier: 3, name: "Anti-Magic Pulse",  effect: "A 20m radius anti-magic zone erupts from the caster for 1d4+1 rounds. All ongoing magical effects are suppressed. Caster takes damage equal to all Stamina/Mana spent this combat, bypassing armour. Each resource spent reduces this damage by 10." },
    { min: 231, max: 240, tier: 3, name: "The Rending",       effect: "The spell detonates in a 30m radius. All creatures within take (cost × 30) damage bypassing armour. Each resource spent reduces damage by 10 for all affected. Terrain is permanently altered. Spell fails." },
    { min: 241, max: 250, tier: 3, name: "Apotheosis Failed", effect: "Every limb takes (cost × 15) damage, bypassing all armour. Each resource spent reduces damage by 10. Make a Survival Check for each limb brought to 0 HP." },

    // Tier 4: Gone From Existence (250+) — fates worse than death
    { min: 250, max: 250,      tier: 4, name: "Annihilation",         effect: "The caster is erased from existence entirely — body, soul, and all traces. Those who knew them retain the memory of a person but cannot explain why. Possessions scatter. By the standards of this tier, this is the fortunate result." },
    { min: 251, max: 265,      tier: 4, name: "Soul Shatter",         effect: "The soul is fragmented across multiple planes. The body remains alive but empty. Each fragment experiences its host plane, typically in perpetuity. Recovery requires a separate quest to each plane to retrieve and reunite the pieces; no known single ritual can achieve this." },
    { min: 266, max: 280,      tier: 4, name: "The Eternal Moment",   effect: "The caster's consciousness is trapped reliving the exact moment of the mishap forever, while their body stands frozen — indestructible and perfectly preserved. They are aware of every second passing. Only divine intervention or a time-governing entity can release them." },
    { min: 281, max: 295,      tier: 4, name: "Vessel",               effect: "An ancient extraplanar entity takes full and permanent control of the body. The caster is a helpless passenger — fully conscious, watching through their own eyes. The entity departs when finished, always taking something irreplaceable with it." },
    { min: 296, max: 310,      tier: 4, name: "The Living Wound",     effect: "The caster becomes a permanent conscious conduit for uncontrolled magical energy. They cannot die, heal, or rest, and experience constant agony as raw magic tears through them. The surrounding area warps over time. There is no cure." },
    { min: 311, max: Infinity, tier: 4, name: "The Rending (Event)",  effect: "The mishap becomes a named event in the history of the world. Reality within a 1-kilometre radius is permanently and irrevocably altered. The caster is transformed into something that cannot be categorised. This result has happened before. There are ruins named after it." },
];

export const DIVINE_MISHAP_TABLE = {
    tierNames: {
        1: "Purely Narrative",
        2: "Real Effects",
        3: "Extreme",
        4: "The Cost of Being Heard",
    },
    entries: [
        // Tier 1: Purely Narrative (01–100)
        { min: 1,   max: 5,   tier: 1, name: "Trembling Light",       effect: "The power manifests as usual but flickers once, visibly, before stabilising." },
        { min: 6,   max: 10,  tier: 1, name: "Cold Channel",           effect: "The caster's focus or hands grow briefly cold instead of warm during the channelling." },
        { min: 11,  max: 15,  tier: 1, name: "Audible",                effect: "The invocation produces a faint resonant hum audible to everyone within 5m." },
        { min: 16,  max: 20,  tier: 1, name: "Off-Colour",             effect: "The visual manifestation appears in an unexpected colour — still clearly divine, just different." },
        { min: 21,  max: 25,  tier: 1, name: "Echo of Doubt",          effect: "For a half-second, the caster is completely certain the ability won't work. It does." },
        { min: 26,  max: 30,  tier: 1, name: "Watched",                effect: "A clear, calm sense of being observed during the casting. It passes the moment the ability resolves." },
        { min: 31,  max: 35,  tier: 1, name: "Scent",                  effect: "The ability carries an unusual scent — incense, rain, iron, or something specific to the caster's tradition." },
        { min: 36,  max: 40,  tier: 1, name: "Misplaced Reverence",    effect: "A nearby creature instinctively bows or averts their gaze during the channelling, without knowing why." },
        { min: 41,  max: 45,  tier: 1, name: "Weight",                 effect: "An uncharacteristic heaviness for a moment, then nothing. The ability works." },
        { min: 46,  max: 50,  tier: 1, name: "Delay",                  effect: "The ability triggers half a second late. No mechanical effect; everyone noticed." },
        { min: 51,  max: 55,  tier: 1, name: "Visible Breath",         effect: "The caster's breath becomes visible as mist for the round, regardless of temperature." },
        { min: 56,  max: 60,  tier: 1, name: "Second Voice",           effect: "The invocation is briefly accompanied by a second voice saying the same words." },
        { min: 61,  max: 65,  tier: 1, name: "Stillness",              effect: "Every flame or moving light source within 10m stills completely for 1 second." },
        { min: 66,  max: 70,  tier: 1, name: "Gravity",                effect: "Small loose objects within 2m orient briefly toward the caster during the invocation." },
        { min: 71,  max: 75,  tier: 1, name: "Marked",                 effect: "A visible symbol appears on the caster's skin for the rest of the round, then fades." },
        { min: 76,  max: 80,  tier: 1, name: "Displaced Sound",        effect: "The sound of the invocation comes from slightly the wrong direction." },
        { min: 81,  max: 85,  tier: 1, name: "Ambient Response",       effect: "The environment reacts — birds go quiet, wind stills, animals look toward the caster." },
        { min: 86,  max: 90,  tier: 1, name: "Excessive Sincerity",    effect: "The ability works but the caster delivers it with an intensity everyone nearby finds slightly unsettling." },
        { min: 91,  max: 95,  tier: 1, name: "Interference",           effect: "A brief ripple passes through all ongoing effects in the area before the ability fires cleanly." },
        { min: 96,  max: 100, tier: 1, name: "Grand Entrance",         effect: "The ability fires normally but with significantly more dramatic visual presentation than warranted." },

        // Tier 2: Real Effects (101–200) — alternating positive/negative every 10
        { min: 101, max: 110, tier: 2, positive: true,  name: "Divine Echo",          effect: "Ability fires at full effect, then fires again at half effect at the caster's next turn, retargeted by the caster." },
        { min: 111, max: 120, tier: 2, positive: false, name: "Rebuke",               effect: "Ability fails. The power turns inward — caster takes (cost × 10) to the Thorax, bypassing armour. The caster may spend resource after the mishap roll — each resource spent reduces this damage by 10." },
        { min: 121, max: 130, tier: 2, positive: true,  name: "Surging Conviction",   effect: "Ability fires at double all numerical values. No downside." },
        { min: 131, max: 140, tier: 2, positive: false, name: "Misaligned",           effect: "Ability fires at full effect but strikes the caster instead of the intended target, as if they were the original target." },
        { min: 141, max: 150, tier: 2, positive: true,  name: "Granted Action",       effect: "Ability fires normally. Caster gains an additional activation this round." },
        { min: 151, max: 160, tier: 2, positive: false, name: "Holy Discharge",       effect: "The ability detonates at the caster's position. All creatures within 5m (including the caster) take (cost × 10) damage. The caster may spend resource after the mishap roll — each resource spent reduces this damage by 10 for all affected. Ability fails." },
        { min: 161, max: 170, tier: 2, positive: true,  name: "Unwavering Faith",     effect: "Ability fires normally. Caster's next 2 divine ability rolls automatically succeed at maximum effect." },
        { min: 171, max: 180, tier: 2, positive: false, name: "The Wrong Ear",        effect: "The invocation is heard by something that opposes what the caster serves. A hostile entity arrives, drawn by the prayer (GM scales to party threat level). Ability fails." },
        { min: 181, max: 190, tier: 2, positive: true,  name: "Overflowing Grace",    effect: "Ability fires normally and is duplicated in full at a second valid target of the caster's choosing." },
        { min: 191, max: 200, tier: 2, positive: false, name: "Cascading Doubt",      effect: "Roll twice more on this 101–200 band (re-roll 191+). Apply both simultaneously. Original ability fails." },

        // Tier 3: Extreme (201–250)
        { min: 201, max: 210, tier: 3, name: "Righteous Detonation",   effect: "The divine energy discharges in a 10m radius. All creatures within take (cost × 20) damage. Caster takes double. The caster may spend resource after the mishap roll — each resource spent reduces this damage by 10 for all affected (the caster's doubled portion is reduced by 20 per resource spent). Make a Survival Check if brought to 0 HP. Ability fails." },
        { min: 211, max: 220, tier: 3, name: "Weight of Judgement",    effect: "Every creature within 20m is compelled for 1d4 rounds to act in accordance with their own stated values. Creatures who act against their professed nature during this time take (cost × 10) damage. Ability fires normally." },
        { min: 221, max: 230, tier: 3, name: "Silence of the Faithful", effect: "A 15m radius zone erupts from the caster — no divine abilities may be channelled within it for 1d4+1 rounds, all ongoing divine effects suspended. Caster takes (cost × 10) to the Thorax. The caster may spend resource after the mishap roll — each resource spent reduces this damage by 10." },
        { min: 231, max: 240, tier: 3, name: "Crisis of Conviction",   effect: "The caster is overtaken by complete involuntary doubt. For 1d4 rounds they cannot use any divine ability and must pass a Bravery check to take any action that invokes their code or deity." },
        { min: 241, max: 250, tier: 3, name: "Marked for Attention",   effect: "The ability fails. The power discharges inward — every limb takes (cost × 10) damage bypassing armour. The caster may spend resource after the mishap roll — each resource spent reduces this damage by 10. Make a Survival Check for each limb brought to 0 HP or below." },

        // Tier 4: The Cost of Being Heard (250+)
        { min: 250, max: 250,      tier: 4, name: "The Silence",          effect: "The power simply stops. Not anger, not punishment — just absence where something once was. The caster is completely functional. Their divine abilities no longer work. There is no explanation and no sign it will return." },
        { min: 251, max: 265,      tier: 4, name: "Claimed",              effect: "Something heard the invocation before the intended recipient could respond, and answered. The caster's power works perfectly — it is simply coming from somewhere else now. The caster may or may not be able to tell the difference. Whatever answered can." },
        { min: 266, max: 280,      tier: 4, name: "Perfect Obedience",    effect: "The caster is granted absolute, permanent clarity of what their code or deity demands of them in every moment. They cannot act against it — not from lack of desire, but because the person capable of choosing otherwise no longer exists. They remain functional, even content. The individual who entered this combat is gone." },
        { min: 281, max: 295,      tier: 4, name: "Vessel",               effect: "The caster becomes a direct, unfiltered conduit. The power moves through them constantly without direction or consent. They glow. They heal those nearby. They cannot touch anything without leaving a mark. This does not stop." },
        { min: 296, max: 310,      tier: 4, name: "Devoted",              effect: "The caster's commitment deepens past what a person can healthily sustain. They cannot prioritise anything above their code or deity — not survival, not allies, not themselves. They are perfectly content. They are completely unreachable." },
        { min: 311, max: Infinity, tier: 4, name: "The Answer",           effect: "The invocation was answered completely and without reservation. Whatever the caster serves is now fully, physically, permanently present. It has not left. It has its own ideas about what comes next. The GM determines its nature. The campaign has changed." },
    ],
};

export const ALCHEMY_MISHAP_TABLE = {
    tierNames: {
        1: "Produced with Side Effects",
        2: "Real Effects",
        3: "Brew Fails — Dangerous",
        4: "Not Everything Can Be Neutralised",
    },
    entries: [
        // Tier 1: Produced with Side Effects (01–100)
        { min: 1,   max: 5,   tier: 1, name: "Delayed Onset",         effect: "Takes effect 1 round later than it should." },
        { min: 6,   max: 10,  tier: 1, name: "Noxious",               effect: "Unpleasant in delivery — foul to drink, stinging to touch, acrid when airborne." },
        { min: 11,  max: 15,  tier: 1, name: "Glowing",               effect: "The brew and its target glow faintly for the duration of the effect." },
        { min: 16,  max: 20,  tier: 1, name: "Wrong Smell",           effect: "The target emits a strong, distinct smell for the duration of the effect." },
        { min: 21,  max: 25,  tier: 1, name: "Half Duration",         effect: "Full potency but lasts half as long as intended." },
        { min: 26,  max: 30,  tier: 1, name: "Unstable",              effect: "Must be used within the next hour or degrades into an inert substance." },
        { min: 31,  max: 35,  tier: 1, name: "Skin Deep",             effect: "Causes a temporary harmless change to the target's skin tone or hair colour for its duration." },
        { min: 36,  max: 40,  tier: 1, name: "Audible",               effect: "Makes a distinct noise on use — a hiss, pop, or resonant hum." },
        { min: 41,  max: 45,  tier: 1, name: "Extended Duration",     effect: "Full potency but lasts twice as long." },
        { min: 46,  max: 50,  tier: 1, name: "Contagious Touch",      effect: "For the first round after use, anyone the target touches is mildly affected at half potency for 1 round." },
        { min: 51,  max: 55,  tier: 1, name: "Reduced Yield",         effect: "Only a single dose is produced regardless of batch size." },
        { min: 56,  max: 60,  tier: 1, name: "Half Potency",          effect: "Full duration but at half the intended effect." },
        { min: 61,  max: 65,  tier: 1, name: "Sediment",              effect: "Must be shaken or stirred before use or the first dose is inert." },
        { min: 66,  max: 70,  tier: 1, name: "Temperature",           effect: "Target experiences an intense but harmless sensation of heat or cold for 1 round after use." },
        { min: 71,  max: 75,  tier: 1, name: "Wrong Sense",           effect: "The effect is accompanied by an unexpected sensory experience on the target — sound instead of light, heat instead of pressure. The intended effect is still correct." },
        { min: 76,  max: 80,  tier: 1, name: "Sticky",                effect: "Takes effect 2 rounds late but lingers 1 round longer than normal." },
        { min: 81,  max: 85,  tier: 1, name: "Photosensitive",        effect: "Degrades immediately if exposed to direct light. Must be used in dim conditions or is ruined on the spot." },
        { min: 86,  max: 90,  tier: 1, name: "Reactive",              effect: "Interacts visibly with any other alchemical substance within 1m, producing harmless but dramatic visual effects." },
        { min: 91,  max: 95,  tier: 1, name: "Extra Dose",            effect: "An additional dose is produced but has a 50% chance of being inert, determined when used." },
        { min: 96,  max: 100, tier: 1, name: "Wrong Form",            effect: "Produced in an unexpected physical form — solid instead of liquid, gas instead of gel. Full potency, awkward delivery." },

        // Tier 2: Real Effects (101–200) — alternating positive/negative every 10
        { min: 101, max: 110, tier: 2, positive: true,  name: "Exceptional Yield",    effect: "Brew succeeds at full potency and produces 3 doses instead of 1." },
        { min: 111, max: 120, tier: 2, positive: false, name: "Contaminated",         effect: "Brew works as intended but is also harmful to handle. The user takes (effects × 5) Acid damage on application, bypassing armour." },
        { min: 121, max: 130, tier: 2, positive: true,  name: "Doubled Potency",      effect: "Brew succeeds at double strength and double duration. No extra cost." },
        { min: 131, max: 140, tier: 2, positive: false, name: "Reversed",             effect: "Brew is produced and looks correct but does the exact opposite of its intended function in every respect." },
        { min: 141, max: 150, tier: 2, positive: true,  name: "Accidental Discovery", effect: "Brew produces its intended effect plus a second minor beneficial effect equivalent to a 1-effect ability. GM determines what." },
        { min: 151, max: 160, tier: 2, positive: false, name: "Unstable Compound",    effect: "Brew is produced but detonates if significantly disturbed — dropped, struck in combat, or roughly handled. Explosion deals (effects × 5) Fire damage to everything within 3m. The carrier is not exempt." },
        { min: 161, max: 170, tier: 2, positive: true,  name: "Perfect Formula",      effect: "Brew succeeds at full potency. The alchemist fully internalises the recipe — all future brews of this type have no mishap chance." },
        { min: 171, max: 180, tier: 2, positive: false, name: "Contagion",            effect: "Brew works as intended but becomes transmissible through touch for its duration. Anyone touching the target must pass an Endurance check or contract a half-potency version of the effect." },
        { min: 181, max: 190, tier: 2, positive: true,  name: "Sympathetic Batch",    effect: "Brew succeeds at full potency and automatically produces one additional dose that takes effect on a willing target of the alchemist's choice within sight, at half potency." },
        { min: 191, max: 200, tier: 2, positive: false, name: "Chain Reaction",       effect: "Roll twice more on this 101–200 band (re-roll 191+). Apply both simultaneously." },

        // Tier 3: Brew Fails — Dangerous (201–250)
        { min: 201, max: 210, tier: 3, name: "Detonation",            effect: "The mixture ignites violently. Everything within 5m takes (effects × 10) Fire damage; everything within 10m takes half. The workspace is destroyed." },
        { min: 211, max: 220, tier: 3, name: "Plague Brew",           effect: "The brew mutates into an airborne contagion. All creatures within 20m must pass an Endurance check or contract a debilitating illness — GM determines symptoms, 1d4 days of rest to recover." },
        { min: 221, max: 230, tier: 3, name: "Corrosive Burst",       effect: "The brew dissolves outward in a 5m radius Acid wave dealing (effects × 8) damage to all within. Surfaces and equipment in the area are permanently corroded." },
        { min: 231, max: 240, tier: 3, name: "Marked",                effect: "The fumes permanently alter the alchemist's biology in a minor but irreversible way. GM determines the nature of the change. The alchemist is otherwise unharmed." },
        { min: 241, max: 250, tier: 3, name: "Internal Reaction",     effect: "The brew reacts with the alchemist's own biology on contact. Every limb takes (effects × 8) damage bypassing all armour. Make a Survival Check for each limb brought to 0 HP or below." },

        // Tier 4: Not Everything Can Be Neutralised (250+)
        { min: 250, max: 250,      tier: 4, name: "Reduction",                      effect: "The alchemist is reduced to their component biological materials, arranged very neatly. The materials are, individually, fine." },
        { min: 251, max: 265,      tier: 4, name: "Transmutation",                  effect: "The alchemist's body is slowly converted to a different substance over the course of a week. The process is visible, gradual, and cannot be stopped. At the end: still aware. No longer biological." },
        { min: 266, max: 280,      tier: 4, name: "The Perfect Formula",            effect: "The alchemist has discovered something extraordinary and knows it with certainty. Sleep, food, and other people become secondary. The formula is real and remarkable. The alchemist will never willingly stop working on it." },
        { min: 281, max: 295,      tier: 4, name: "Dissolution",                    effect: "The alchemist begins breaking down chemically over the following months — gradually, without pain, and with no known treatment. They remain fully conscious throughout." },
        { min: 296, max: 310,      tier: 4, name: "The Substance",                  effect: "The alchemist has produced something that cannot be destroyed, contained, or understood. It has no known effect. It persists and grows slowly. The alchemist is compelled to keep adding to it. Neither they nor anyone else knows why." },
        { min: 311, max: Infinity, tier: 4, name: "The Reaction That Does Not Stop", effect: "The brew triggers a self-perpetuating reaction in local matter. The alchemist is the catalyst and cannot leave the affected radius. The radius is growing — slowly, measurably. The GM determines what the reaction produces. It is not destructive. It is not safe. It is simply ongoing." },
    ],
};

export const PSYCHIC_MISHAP_TABLE = {
    tierNames: {
        1: "Purely Narrative",
        2: "Real Effects",
        3: "Extreme",
        4: "Past the Point of Thought",
    },
    entries: [
        // Tier 1: Purely Narrative (01–100)
        { min: 1,   max: 5,   tier: 1, name: "Nosebleed",             effect: "Minor strain manifests physically. The caster's nose bleeds for a round." },
        { min: 6,   max: 10,  tier: 1, name: "Surface Thoughts",      effect: "The caster accidentally broadcasts their current surface thoughts to anyone within 5m." },
        { min: 11,  max: 15,  tier: 1, name: "Static",                effect: "A brief visual or auditory static overlays the caster's perception for a moment." },
        { min: 16,  max: 20,  tier: 1, name: "Déjà Vu",               effect: "Everyone within 10m experiences an intense, simultaneous moment of déjà vu." },
        { min: 21,  max: 25,  tier: 1, name: "Phantom Touch",         effect: "The caster briefly feels physical sensations from a random nearby creature." },
        { min: 26,  max: 30,  tier: 1, name: "Involuntary Glow",      effect: "The caster's eyes glow faintly during the activation." },
        { min: 31,  max: 35,  tier: 1, name: "Memory Flash",          effect: "A single inconsequential memory from a nearby creature flashes through the caster's mind uninvited." },
        { min: 36,  max: 40,  tier: 1, name: "Pressure",              effect: "Everyone nearby briefly feels pressure behind their eyes, as if being watched from inside." },
        { min: 41,  max: 45,  tier: 1, name: "Ambient Hum",           effect: "A low-frequency hum radiates from the caster for 1 round, audible up to 5m." },
        { min: 46,  max: 50,  tier: 1, name: "Emotional Bleed",       effect: "The caster involuntarily feels the dominant emotion of the nearest creature for a moment." },
        { min: 51,  max: 55,  tier: 1, name: "Levitation Twitch",     effect: "Small loose objects within 1m briefly float an inch before dropping." },
        { min: 56,  max: 60,  tier: 1, name: "Remote Sense",          effect: "The caster momentarily perceives through the senses of a nearby creature for about 1 second." },
        { min: 61,  max: 65,  tier: 1, name: "Afterimage",            effect: "The target leaves a brief psionic echo in the caster's vision for 1 round." },
        { min: 66,  max: 70,  tier: 1, name: "Involuntary Empathy",   effect: "The caster knows exactly how every visible creature is currently feeling for 1 round." },
        { min: 71,  max: 75,  tier: 1, name: "Mental Echo",           effect: "The caster hears the last thing a nearby creature thought, word for word, once." },
        { min: 76,  max: 80,  tier: 1, name: "Overtuned",             effect: "The caster can hear conversations in adjacent rooms or around corners for 1 round." },
        { min: 81,  max: 85,  tier: 1, name: "Temporal Blip",         effect: "The caster loses half a second of awareness. Nothing they could have prevented occurs." },
        { min: 86,  max: 90,  tier: 1, name: "Social Leak",           effect: "The caster involuntarily mimics a gesture or expression from whoever they are mentally focused on." },
        { min: 91,  max: 95,  tier: 1, name: "Power Surge",           effect: "The ability fires with a visible corona of psionic energy — impressive, adds nothing." },
        { min: 96,  max: 100, tier: 1, name: "Feedback Squeal",       effect: "A brief high-pitched tone audible only to psychically sensitive creatures radiates from the caster." },

        // Tier 2: Real Effects (101–200) — alternating positive/negative every 10
        { min: 101, max: 110, tier: 2, positive: true,  name: "Psionic Echo",          effect: "Ability fires at full effect, then fires again at half effect at the caster's next turn, retargeted by the caster." },
        { min: 111, max: 120, tier: 2, positive: false, name: "Mindburn",              effect: "Ability fails. The strain turns inward — caster takes (cost × 10) Psychic damage to the Head, bypassing armour. The caster may spend resource after the mishap roll — each resource spent reduces this damage by 10." },
        { min: 121, max: 130, tier: 2, positive: true,  name: "Amplified Signal",      effect: "Ability fires at double all numerical values. No downside." },
        { min: 131, max: 140, tier: 2, positive: false, name: "Involuntary Reversal",  effect: "Ability fires at full effect but strikes the caster instead of the intended target, as if they were the original target." },
        { min: 141, max: 150, tier: 2, positive: true,  name: "Mental Clarity",        effect: "Ability fires normally. Caster gains an additional activation this round." },
        { min: 151, max: 160, tier: 2, positive: false, name: "Neural Overload",       effect: "The ability detonates at the caster's position. All creatures within 5m (including the caster) take (cost × 10) Psychic damage. The caster may spend resource after the mishap roll — each resource spent reduces this damage by 10 for all affected. Ability fails." },
        { min: 161, max: 170, tier: 2, positive: true,  name: "Psionic Mastery",       effect: "Ability fires normally. Caster's next 2 psychic ability rolls automatically succeed at maximum effect." },
        { min: 171, max: 180, tier: 2, positive: false, name: "Broadcast",             effect: "The caster involuntarily transmits everything they are currently experiencing — sensory and emotional — to every creature within 20m for 1d4 rounds. They cannot filter or stop it. Ability fails." },
        { min: 181, max: 190, tier: 2, positive: true,  name: "Expanded Reach",        effect: "Ability fires normally and is duplicated in full at a second valid target of the caster's choosing." },
        { min: 191, max: 200, tier: 2, positive: false, name: "Cascade Meltdown",      effect: "Roll twice more on this 101–200 band (re-roll 191+). Apply both simultaneously. Original ability fails." },

        // Tier 3: Extreme (201–250)
        { min: 201, max: 210, tier: 3, name: "Psionic Detonation",    effect: "Uncontrolled psychic force erupts in a 10m radius. All creatures take (cost × 20) Psychic damage to the Head, bypassing armour. Caster takes double. The caster may spend resource after the mishap roll — each resource spent reduces this damage by 10 for all affected (the caster's doubled portion is reduced by 20 per resource spent). Make a Survival Check if brought to 0 HP. Ability fails." },
        { min: 211, max: 220, tier: 3, name: "Mind Fracture",         effect: "The caster's psychic sense shatters outward. All creatures within 20m hear each other's surface thoughts in full for 1d4 rounds — no creature can successfully deceive another during this time. Caster takes (cost × 10) Psychic damage to the Head, bypassing armour. The caster may spend resource after the mishap roll — each resource spent reduces this damage by 10. Ability fires normally." },
        { min: 221, max: 230, tier: 3, name: "Psychic Void",          effect: "A 15m radius zone of mental silence erupts from the caster. No psychic abilities may be used within it for 1d4+1 rounds; all ongoing psychic effects are immediately suppressed. Caster takes (cost × 10) to the Head. The caster may spend resource after the mishap roll — each resource spent reduces this damage by 10." },
        { min: 231, max: 240, tier: 3, name: "Consciousness Inversion", effect: "The caster's awareness is projected outward while their body acts on pure instinct. For 1d4 rounds, the GM controls the caster's body; the caster observes helplessly from outside it. Ability fails." },
        { min: 241, max: 250, tier: 3, name: "Identity Bleed",        effect: "The caster's sense of self partially merges with every creature they have targeted with a psychic ability this combat. They experience all of these minds simultaneously. They retain their own identity, but will never be entirely alone in their thoughts again. Ability fails." },

        // Tier 4: Past the Point of Thought (250+)
        { min: 250, max: 250,      tier: 4, name: "Ego Death",            effect: "The caster's personality, memories, and identity are permanently erased. The body remains fully functional, inhabited by no one. No known method can restore what was there." },
        { min: 251, max: 265,      tier: 4, name: "Gestalt",              effect: "The caster's mind expands to absorb the consciousness of every creature within 50m. All become one shared mind. The caster's original identity is the most diluted. The collective has no intention of separating." },
        { min: 266, max: 280,      tier: 4, name: "Eternal Broadcast",    effect: "The caster becomes a permanent involuntary psychic beacon. Every thought is transmitted at full intensity to every psychically sensitive creature within 1km. They cannot stop it. They cannot sleep. Every private moment is public. Forever." },
        { min: 281, max: 295,      tier: 4, name: "The Passenger",        effect: "An entity that was apparently waiting for exactly this opportunity takes up residence in the caster's mind. The caster is still there. The entity does not leave. It occasionally makes observations." },
        { min: 296, max: 310,      tier: 4, name: "Unravelling",          effect: "The boundary between the caster and the minds around them begins to dissolve. Each day, a piece of someone else's identity replaces something of their own. Within a month, nothing original remains. The process is gradual enough to be fully conscious throughout." },
        { min: 311, max: Infinity, tier: 4, name: "The Open Wound",       effect: "The caster's mind tears open a permanent two-way connection to whatever lies beyond consciousness. Things come through. The caster cannot close it. They do not come all at once. They are patient." },
    ],
};

const TAG_TO_TABLE = {
    divine:  DIVINE_MISHAP_TABLE,
    psychic: PSYCHIC_MISHAP_TABLE,
    alchemy: ALCHEMY_MISHAP_TABLE,
};

export function getMishapTable(tag) {
    return TAG_TO_TABLE[tag] ?? null;
}

export function getMishapEntry(roll, entries = MISHAP_TABLE) {
    if (roll <= 0) return entries[0];
    return entries.find(e => roll >= e.min && roll <= e.max) ?? entries[entries.length - 1];
}

export function calculateMishapChance(effects, invokingTurns) {
    return (effects * 15) - (invokingTurns * 50);
}

export function getMishapModifier(chance) {
    return Math.max(0, chance - 100);
}
