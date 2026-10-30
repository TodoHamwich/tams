// ── Profession traits ─────────────────────────────────────────────────────────
// Pure math (no Foundry globals) for profession rank and the Stamina / linked-resource
// multiplier gains each rank grants (user ruling 2026-10-30).
//
// Each rank number's reward is given ONCE per character, by whichever profession reached
// that rank first (`rankReachedAt`, stamped by TAMSItem._preUpdate; unstamped = earliest, then trait
// order). Other professions at that rank give nothing for it.
//
//   Type           Rank 1              Rank 2+ (+0.25 each)
//   basic          +0.25 Stamina       +0.25 Stamina
//   full           resource bar (1×)   resource until rank 5, then Stamina or resource (pick)
//   threeQuarter   resource bar (0.75×) resource until rank 4, then pick
//   half           resource bar (0.5×) resource until rank 3, then pick
//   quarter        resource bar (0.25×) pick from rank 2
//
// Resource bars themselves are created manually; the user sets their base multiplier
// (the bar) and these gains are added on top. The bar is kept even when another
// profession owns rank 1.

export const PROFESSION_TYPES = ["basic", "full", "threeQuarter", "half", "quarter"];

/** Profession roll bonus per rank (rulebook: Trainee +5 … Chief +50). */
export const PROFESSION_RANK_STEP = 5;
export const PROFESSION_MAX_RANK = 10;

const MULT_STEP = 0.25;
/** First rank at which a caster type may put its gain into Stamina instead of its resource. */
export const CASTER_PICK_START = { full: 5, threeQuarter: 4, half: 3, quarter: 2 };

export const isCasterType = type => type in CASTER_PICK_START;

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

/**
 * Where one rank's reward goes for a profession type.
 * @param {string} type
 * @param {number} rank
 * @param {Record<string, string>} picks  rank → "stamina" | "resource"
 * @returns {"stamina"|"resource"|null} null = rank 1 of a caster (the bar itself)
 */
export function rankRewardTarget(type, rank, picks = {}) {
  if (!isCasterType(type)) return "stamina";
  if (rank <= 1) return null;
  if (rank < CASTER_PICK_START[type]) return "resource";
  return picks?.[rank] === "stamina" ? "stamina" : "resource";
}

/**
 * Hand out each rank's reward to the profession that reached it first.
 * @param {{id: string, type: string, rank: number, reachedAt?: number[], picks?: Record<string, string>}[]} professions
 *   in trait order (the tiebreak when timestamps are equal or missing)
 * @returns {{staminaMult: number, resourceMult: Record<string, number>, owners: Record<number, string>}}
 */
export function distributeProfessionRewards(professions = []) {
  const result = { staminaMult: 0, resourceMult: {}, owners: {} };
  const maxRank = Math.max(0, ...professions.map(p => p.rank || 0));
  for (let r = 1; r <= maxRank; r++) {
    let owner = null, ownerTime = Infinity;
    for (const p of professions) {
      if ((p.rank || 0) < r) continue;
      const t = Number(p.reachedAt?.[r - 1]) || 0;
      if (owner === null || t < ownerTime) { owner = p; ownerTime = t; }
    }
    result.owners[r] = owner.id;
    const target = rankRewardTarget(owner.type || "basic", r, owner.picks);
    if (target === "stamina") result.staminaMult += MULT_STEP;
    else if (target === "resource")
      result.resourceMult[owner.id] = (result.resourceMult[owner.id] || 0) + MULT_STEP;
  }
  return result;
}

/**
 * Update a trait's first-reached timestamps (index = rank − 1) after a rank change.
 * New ranks get `now`; ranks given up are dropped so re-reaching them restamps.
 * Unstamped older ranks become 0 (= earliest).
 * @returns {number[]|null} the new array, or null when nothing changed
 */
export function stampRanksReached(reachedAt = [], oldRank, newRank, now) {
  if (oldRank === newRank) return null;
  return Array.from({ length: newRank }, (_, i) =>
    reachedAt?.[i] ?? (i + 1 > oldRank ? now : 0));
}
