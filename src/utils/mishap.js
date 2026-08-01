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

export function getMishapEntry(roll) {
    if (roll <= 0) return MISHAP_TABLE[0];
    return MISHAP_TABLE.find(e => roll >= e.min && roll <= e.max) ?? MISHAP_TABLE[MISHAP_TABLE.length - 1];
}

export function calculateMishapChance(effects, invokingTurns) {
    return Math.max(0, (effects * 25) - (invokingTurns * 25));
}

export function getMishapModifier(chance) {
    return Math.max(0, chance - 100);
}
