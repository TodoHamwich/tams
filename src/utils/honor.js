// Tier thresholds are style-independent — only the flavor naming (labelKey/glossKey) varies by
// style. Position 4 is always "Common" (the shared, un-styled baseline at score 0), positions
// 0-3 are the honor side (most to least extreme), positions 5-8 are the dishonor side (least to
// most extreme). See getHonorTierLabelKeys() for how a position maps to an i18n key.
export const HONOR_PATHS = {
  valor: {
    labelKey: "TAMS.Honor.Path.Valor",
    tiers: [
      { min: 91 }, { min: 76 }, { min: 51 }, { min: 26 }, { min: 0 },
      { min: -25 }, { min: -50 }, { min: -75 }, { min: -100 }
    ]
  },
  justice: {
    labelKey: "TAMS.Honor.Path.Justice",
    tiers: [
      { min: 91 }, { min: 76 }, { min: 51 }, { min: 26 }, { min: 0 },
      { min: -25 }, { min: -50 }, { min: -75 }, { min: -100 }
    ]
  },
  devotion: {
    labelKey: "TAMS.Honor.Path.Devotion",
    tiers: [
      { min: 91 }, { min: 76 }, { min: 51 }, { min: 26 }, { min: 0 },
      { min: -25 }, { min: -50 }, { min: -75 }, { min: -100 }
    ]
  },
  renown: {
    labelKey: "TAMS.Honor.Path.Renown",
    tiers: [
      { min: 91 }, { min: 76 }, { min: 51 }, { min: 26 }, { min: 0 },
      { min: -25 }, { min: -50 }, { min: -75 }, { min: -100 }
    ]
  }
};

// Naming styles for honor tiers — an independent per-actor choice from the visual Theme, since
// the two don't map 1:1 (e.g. a Cyberpunk-themed sheet might still want Grimdark honor names).
export const HONOR_STYLES = {
  fantasy:   "TAMS.Honor.Style.Fantasy",
  modern:    "TAMS.Honor.Style.Modern",
  cyberpunk: "TAMS.Honor.Style.Cyberpunk",
  scifi:     "TAMS.Honor.Style.Scifi",
  grimdark:  "TAMS.Honor.Style.Grimdark"
};

const STYLE_KEY = { fantasy: "Fantasy", modern: "Modern", cyberpunk: "Cyberpunk", scifi: "Scifi", grimdark: "Grimdark" };
const PATH_KEY = { valor: "Valor", justice: "Justice", devotion: "Devotion", renown: "Renown" };

/**
 * Resolve the i18n keys for one tier position of one path, under a given naming style.
 * Position 4 (Common) always resolves to the shared, style-independent key.
 * @param {string} pathId "valor"|"justice"|"devotion"|"renown"
 * @param {number} index 0-8 position in that path's tiers array
 * @param {string} [style="fantasy"] one of HONOR_STYLES' keys
 * @returns {{labelKey: string, glossKey: string}}
 */
export function getHonorTierLabelKeys(pathId, index, style = "fantasy") {
  if (index === 4) return { labelKey: "TAMS.Honor.Tier.Common", glossKey: "TAMS.Honor.Gloss.Common" };
  const s = STYLE_KEY[style] ?? "Fantasy";
  const p = PATH_KEY[pathId] ?? pathId;
  return {
    labelKey: `TAMS.Honor.Tier.${s}.${p}.T${index}`,
    glossKey: `TAMS.Honor.Gloss.${s}.${p}.T${index}`
  };
}

export function getHonorTier(score, path, style = "fantasy") {
  const pathData = HONOR_PATHS[path];
  if (!pathData) return null;
  for (let i = 0; i < pathData.tiers.length; i++) {
    if (score >= pathData.tiers[i].min) {
      return { ...pathData.tiers[i], index: i, ...getHonorTierLabelKeys(path, i, style) };
    }
  }
  const lastIndex = pathData.tiers.length - 1;
  return { ...pathData.tiers[lastIndex], index: lastIndex, ...getHonorTierLabelKeys(path, lastIndex, style) };
}

export function isHonorEnabled() {
  try {
    return game.settings.get("tams", "honorSystem") === true;
  } catch {
    return false;
  }
}

export function getPartyHonor() {
  try {
    return JSON.parse(game.settings.get("tams", "partyHonor"));
  } catch {
    return { valor: 0, justice: 0, devotion: 0, renown: 0 };
  }
}

export function setPartyHonor(data) {
  return game.settings.set("tams", "partyHonor", JSON.stringify(data));
}
