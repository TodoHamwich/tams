export const HONOR_PATHS = {
  valor: {
    labelKey: "TAMS.Honor.Path.Valor",
    tiers: [
      { min: 91,   labelKey: "TAMS.Honor.Tier.Valor.Lionheart", glossKey: "TAMS.Honor.Gloss.Valor.Lionheart" },
      { min: 76,   labelKey: "TAMS.Honor.Tier.Valor.Valiant",   glossKey: "TAMS.Honor.Gloss.Valor.Valiant"   },
      { min: 51,   labelKey: "TAMS.Honor.Tier.Valor.Brave",     glossKey: "TAMS.Honor.Gloss.Valor.Brave"     },
      { min: 26,   labelKey: "TAMS.Honor.Tier.Valor.Steadfast", glossKey: "TAMS.Honor.Gloss.Valor.Steadfast" },
      { min: 0,    labelKey: "TAMS.Honor.Tier.Common",          glossKey: "TAMS.Honor.Gloss.Common"          },
      { min: -25,  labelKey: "TAMS.Honor.Tier.Valor.Timid",     glossKey: "TAMS.Honor.Gloss.Valor.Timid"     },
      { min: -50,  labelKey: "TAMS.Honor.Tier.Valor.Craven",    glossKey: "TAMS.Honor.Gloss.Valor.Craven"    },
      { min: -75,  labelKey: "TAMS.Honor.Tier.Valor.Dastard",   glossKey: "TAMS.Honor.Gloss.Valor.Dastard"   },
      { min: -100, labelKey: "TAMS.Honor.Tier.Valor.Runagate",  glossKey: "TAMS.Honor.Gloss.Valor.Runagate"  },
    ]
  },
  justice: {
    labelKey: "TAMS.Honor.Path.Justice",
    tiers: [
      { min: 91,   labelKey: "TAMS.Honor.Tier.Justice.Great",     glossKey: "TAMS.Honor.Gloss.Justice.Great"     },
      { min: 76,   labelKey: "TAMS.Honor.Tier.Justice.Righteous", glossKey: "TAMS.Honor.Gloss.Justice.Righteous" },
      { min: 51,   labelKey: "TAMS.Honor.Tier.Justice.Just",      glossKey: "TAMS.Honor.Gloss.Justice.Just"      },
      { min: 26,   labelKey: "TAMS.Honor.Tier.Justice.Upright",   glossKey: "TAMS.Honor.Gloss.Justice.Upright"   },
      { min: 0,    labelKey: "TAMS.Honor.Tier.Common",            glossKey: "TAMS.Honor.Gloss.Common"            },
      { min: -25,  labelKey: "TAMS.Honor.Tier.Justice.Suspect",   glossKey: "TAMS.Honor.Gloss.Justice.Suspect"   },
      { min: -50,  labelKey: "TAMS.Honor.Tier.Justice.Corrupt",   glossKey: "TAMS.Honor.Gloss.Justice.Corrupt"   },
      { min: -75,  labelKey: "TAMS.Honor.Tier.Justice.Unjust",    glossKey: "TAMS.Honor.Gloss.Justice.Unjust"    },
      { min: -100, labelKey: "TAMS.Honor.Tier.Justice.Tyrant",    glossKey: "TAMS.Honor.Gloss.Justice.Tyrant"    },
    ]
  },
  devotion: {
    labelKey: "TAMS.Honor.Path.Devotion",
    tiers: [
      { min: 91,   labelKey: "TAMS.Honor.Tier.Devotion.Sainted",   glossKey: "TAMS.Honor.Gloss.Devotion.Sainted"   },
      { min: 76,   labelKey: "TAMS.Honor.Tier.Devotion.Devoted",   glossKey: "TAMS.Honor.Gloss.Devotion.Devoted"   },
      { min: 51,   labelKey: "TAMS.Honor.Tier.Devotion.Pious",     glossKey: "TAMS.Honor.Gloss.Devotion.Pious"     },
      { min: 26,   labelKey: "TAMS.Honor.Tier.Devotion.Faithful",  glossKey: "TAMS.Honor.Gloss.Devotion.Faithful"  },
      { min: 0,    labelKey: "TAMS.Honor.Tier.Common",             glossKey: "TAMS.Honor.Gloss.Common"             },
      { min: -25,  labelKey: "TAMS.Honor.Tier.Devotion.Lapsed",    glossKey: "TAMS.Honor.Gloss.Devotion.Lapsed"    },
      { min: -50,  labelKey: "TAMS.Honor.Tier.Devotion.Faithless", glossKey: "TAMS.Honor.Gloss.Devotion.Faithless" },
      { min: -75,  labelKey: "TAMS.Honor.Tier.Devotion.Heretic",   glossKey: "TAMS.Honor.Gloss.Devotion.Heretic"   },
      { min: -100, labelKey: "TAMS.Honor.Tier.Devotion.Accursed",  glossKey: "TAMS.Honor.Gloss.Devotion.Accursed"  },
    ]
  },
  renown: {
    labelKey: "TAMS.Honor.Path.Renown",
    tiers: [
      { min: 91,   labelKey: "TAMS.Honor.Tier.Renown.Magnificent", glossKey: "TAMS.Honor.Gloss.Renown.Magnificent" },
      { min: 76,   labelKey: "TAMS.Honor.Tier.Renown.Renowned",    glossKey: "TAMS.Honor.Gloss.Renown.Renowned"    },
      { min: 51,   labelKey: "TAMS.Honor.Tier.Renown.Honored",     glossKey: "TAMS.Honor.Gloss.Renown.Honored"     },
      { min: 26,   labelKey: "TAMS.Honor.Tier.Renown.Worthy",      glossKey: "TAMS.Honor.Gloss.Renown.Worthy"      },
      { min: 0,    labelKey: "TAMS.Honor.Tier.Common",             glossKey: "TAMS.Honor.Gloss.Common"             },
      { min: -25,  labelKey: "TAMS.Honor.Tier.Renown.Disgraced",   glossKey: "TAMS.Honor.Gloss.Renown.Disgraced"   },
      { min: -50,  labelKey: "TAMS.Honor.Tier.Renown.Infamous",    glossKey: "TAMS.Honor.Gloss.Renown.Infamous"    },
      { min: -75,  labelKey: "TAMS.Honor.Tier.Renown.Villainous",  glossKey: "TAMS.Honor.Gloss.Renown.Villainous"  },
      { min: -100, labelKey: "TAMS.Honor.Tier.Renown.Damned",      glossKey: "TAMS.Honor.Gloss.Renown.Damned"      },
    ]
  }
};

export function getHonorTier(score, path) {
  const pathData = HONOR_PATHS[path];
  if (!pathData) return null;
  for (const tier of pathData.tiers) {
    if (score >= tier.min) return tier;
  }
  return pathData.tiers[pathData.tiers.length - 1];
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
