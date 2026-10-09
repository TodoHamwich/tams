// ── Ability validation ────────────────────────────────────────────────────────
// Pure checks (no Foundry globals) that flag misconfigured abilities on the sheet.
// "error" = the ability is broken or missing something major; "warning" = it still
// works but probably not the way the author intended.

/** Ability tags that put an ability on a mishap table. */
export const MISHAP_TAGS = ["magic", "spell", "psychic", "alchemy", "divine"];

/** Lower-cased, trimmed tag list from an ability's comma-separated `tags` string. */
export function abilityTags(system) {
  return system?.tags ? system.tags.split(",").map(t => t.trim().toLowerCase()) : [];
}

/** Number of effects the Mishap Check counts for a calculator-enabled ability. */
export function mishapEffectCount(calculator) {
  const c = calculator ?? {};
  return (c.effects || 0)
    + Math.floor((c.rollBonus || 0) / 5)
    + (c.ignoreArmor || 0);
}

/**
 * @param {object} system  An ability item's system data (TAMSAbilityData instance or plain object).
 * @param {object} [ctx]
 * @param {boolean} [ctx.onActor=false]        Whether the item is owned by an actor.
 * @param {object[]} [ctx.customResources=[]]  The owning actor's customResources.
 * @param {string[]|null} [ctx.statusIds=null] Known status-effect ids (null = skip the check).
 * @returns {{level: "error"|"warning", key: string}[]} Errors first, then warnings.
 */
export function getAbilityIssues(system, { onActor = false, customResources = [], statusIds = null } = {}) {
  if (!system) return [];
  const issues = [];
  const error = key => issues.push({ level: "error", key });
  const warning = key => issues.push({ level: "warning", key });
  const calc = system.calculator ?? {};
  const components = system.damageComponents ?? [];

  if (system.isAttack && !system.useWeaponDamage) {
    const hasType = !!system.damageType || components.some(c => c.damageType);
    if (!hasType) error("noDamageType");
    if (onActor || components.length) {
      if ((system.calculatedDamage ?? 0) <= 0) error("zeroDamage");
    }
  }

  if (onActor && !system.isApex && system.resource && system.resource !== "stamina") {
    const idx = parseInt(system.resource);
    if (isNaN(idx) || !customResources[idx]) error("missingResource");
  }

  if (!calc.enabled && !system.isApex && !system.isPassive
      && !((system.uses?.max ?? 0) > 0) && !((system.cost ?? 0) > 0)) {
    error("zeroCost");
  }

  if (system.isPassive && !system.passiveBonus) error("passiveNoBonus");

  if (calc.enabled && abilityTags(system).some(t => MISHAP_TAGS.includes(t))
      && mishapEffectCount(calc) <= 0) {
    warning("mishapNoEffects");
  }

  if (system.inflictsStatusId && Array.isArray(statusIds) && !statusIds.includes(system.inflictsStatusId)) {
    warning("unknownStatus");
  }

  if (calc.enabled && Math.floor(system.rawCalculatedCost ?? 1) < 1) warning("calcCostBelowOne");

  return issues;
}
