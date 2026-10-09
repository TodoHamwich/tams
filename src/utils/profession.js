// ── Profession traits ─────────────────────────────────────────────────────────
// Pure math (no Foundry globals) for profession rank and the Stamina / linked-resource
// multiplier boosts each profession type grants.
//
//   Type           Linked resource mult      Stamina mult
//   basic          —                         +0.25 × rank
//   full           +0.25 × (rank − 1)        +0.25 × (rank − 3), from rank 4
//   half           +0.25 × (rank − 1)        +0.25 × (rank − 2), from rank 3
//   threeQuarter   +0.25 × (rank − 1)        +0.25 × (rank − 2), from rank 3
//
// Resource bars themselves are created manually; the user sets their base multiplier
// (Full 1 / Half 0.5 / Three-Quarter 0.75) and these boosts are added on top.

export const PROFESSION_TYPES = ["basic", "full", "half", "threeQuarter"];

/** Profession roll bonus per rank (rulebook: Trainee +5 … Chief +50). */
export const PROFESSION_RANK_STEP = 5;
export const PROFESSION_MAX_RANK = 10;

const MULT_STEP = 0.25;
/** First rank at which a caster type starts gaining Stamina multiplier. */
const CASTER_STAMINA_START = { full: 4, half: 3, threeQuarter: 3 };

/**
 * Rank of a profession trait, read 1:1 from its "All Profession Rolls" modifier(s).
 * @param {{target: string, value: number}[]} modifiers
 * @returns {number} 0–10
 */
export function professionRank(modifiers = []) {
  const bonus = modifiers
    .filter(m => m.target === "allProfessionRolls")
    .reduce((sum, m) => sum + (Number(m.value) || 0), 0);
  return Math.max(0, Math.min(PROFESSION_MAX_RANK, Math.floor(bonus / PROFESSION_RANK_STEP)));
}

export function professionStaminaMultBonus(type, rank) {
  if (!rank || rank <= 0) return 0;
  if (type === "basic" || !CASTER_STAMINA_START[type]) return MULT_STEP * rank;
  return MULT_STEP * Math.max(0, rank - CASTER_STAMINA_START[type] + 1);
}

export function professionResourceMultBonus(type, rank) {
  if (!CASTER_STAMINA_START[type] || !rank || rank <= 0) return 0;
  return MULT_STEP * (rank - 1);
}
