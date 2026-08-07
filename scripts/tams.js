var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const SIZE_WEIGHTS = { small: 1, medium: 10, large: 50 };
const LARGE_SLOTS_DEFAULT = 2;
const LARGE_SLOTS_MIN = 2;
const LARGE_SLOTS_MAX = 10;
const SMALL_STACK_PER_SLOT = 10;
function clampLargeSlots(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return LARGE_SLOTS_DEFAULT;
  return Math.min(LARGE_SLOTS_MAX, Math.max(LARGE_SLOTS_MIN, Math.round(n)));
}
function unitWeight(size) {
  return SIZE_WEIGHTS[size] ?? 0;
}
function stackSlots(size, quantity, largeSlots = LARGE_SLOTS_DEFAULT) {
  const qty = Math.max(0, Number(quantity) || 0);
  if (qty === 0) return 0;
  switch (size) {
    case "small":
      return Math.ceil(qty / SMALL_STACK_PER_SLOT);
    case "medium":
      return qty;
    case "large":
      return qty * clampLargeSlots(largeSlots);
    default:
      return 0;
  }
}
function resolveCarryChain(item, itemsById) {
  var _a, _b, _c;
  const get = (id) => typeof (itemsById == null ? void 0 : itemsById.get) === "function" ? itemsById.get(id) : itemsById == null ? void 0 : itemsById[id];
  let location = (_a = item == null ? void 0 : item.system) == null ? void 0 : _a.location;
  let immediateContainer = null;
  let guard = 0;
  while (location && location !== "stowed" && location !== "hand" && location !== "backpack") {
    const container2 = get(location);
    if (!container2 || container2.type !== "backpack") break;
    if (guard === 0) immediateContainer = container2;
    if (!((_b = container2.system) == null ? void 0 : _b.equipped)) return { carried: false, container: immediateContainer };
    location = (_c = container2.system) == null ? void 0 : _c.location;
    if (++guard > 25) break;
  }
  return { carried: true, container: immediateContainer };
}
function computeEncumbrance(items, {
  itemsById,
  endurance = 0,
  mode = "weight",
  equippedBackpackId = "",
  largeSlots = LARGE_SLOTS_DEFAULT
} = {}) {
  var _a, _b, _c, _d;
  const get = (id) => typeof (itemsById == null ? void 0 : itemsById.get) === "function" ? itemsById.get(id) : itemsById == null ? void 0 : itemsById[id];
  const allBackpackIds = /* @__PURE__ */ new Set();
  for (const it of items) if (it.type === "backpack") allBackpackIds.add(it.id);
  let used = 0;
  for (const item of items) {
    const system = item.system || {};
    const location = system.location;
    const carried = location === "stowed" || location === "hand" || location === "backpack" || allBackpackIds.has(location);
    if (!carried) continue;
    const quantity = Math.max(0, Number(system.quantity) || 0);
    let cost = mode === "slots" ? stackSlots(system.size, quantity, system.slots ?? largeSlots) : unitWeight(system.size) * quantity;
    if (location === "backpack") {
      const bp = equippedBackpackId ? get(equippedBackpackId) : null;
      if (bp && ((_a = bp.system) == null ? void 0 : _a.equipped)) {
        if (mode === "weight") cost *= bp.system.modifier ?? 0.5;
      }
    } else if (allBackpackIds.has(location) && item.id !== equippedBackpackId) {
      const { carried: chainCarried, container: container2 } = resolveCarryChain(item, itemsById);
      if (!chainCarried) {
        cost = 0;
      } else if (mode === "weight" && container2 && container2.type === "backpack") {
        cost *= ((_b = container2.system) == null ? void 0 : _b.modifier) ?? 0.5;
      }
    }
    used += cost;
  }
  let max;
  if (mode === "slots") {
    max = Math.max(0, Math.floor(5 + endurance));
    const bp = equippedBackpackId ? get(equippedBackpackId) : null;
    if (bp && ((_c = bp.system) == null ? void 0 : _c.equipped)) max += bp.system.capacity || 0;
  } else {
    const baseCapacity = Math.max(0, Math.floor(endurance / 10)) * 100;
    const bp = equippedBackpackId ? get(equippedBackpackId) : null;
    const backpackExtra = bp && ((_d = bp.system) == null ? void 0 : _d.equipped) ? (bp.system.capacity || 0) * 10 : 0;
    max = baseCapacity + backpackExtra;
  }
  return { used, max, isEncumbered: used > max, mode };
}
function computeArmorRepair({ value, max, rollTotal, alternate = false }) {
  const divisor = alternate ? 10 : 5;
  const curMax = Math.max(0, Number(max) || 0);
  const curVal = Math.max(0, Number(value) || 0);
  const missing = Math.max(0, curMax - curVal);
  const difficulty = divisor * missing;
  const total = Number(rollTotal) || 0;
  const shortfall = Math.max(0, difficulty - total);
  let maxLost = Math.ceil(shortfall / divisor);
  if (maxLost > missing) maxLost = missing;
  const newMax = Math.max(0, curMax - maxLost);
  const newValue = newMax;
  return {
    missing,
    divisor,
    difficulty,
    shortfall,
    maxLost,
    newMax,
    newValue,
    success: shortfall === 0
  };
}
const SIZE_HP_MULT = { tiny: 0.5, small: 0.75, normal: 1, large: 1.5, huge: 2, giant: 2.5 };
const SIZE_ORDER = ["tiny", "small", "normal", "large", "huge", "giant"];
function getCapacityMode() {
  try {
    return game.settings.get("tams", "capacityMode") || "weight";
  } catch (e2) {
    return "weight";
  }
}
function getLargeSlots() {
  try {
    return game.settings.get("tams", "largeItemSlots") || 2;
  } catch (e2) {
    return 2;
  }
}
class StatModifier extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      value: new fields.NumberField({ initial: 10, integer: true }),
      mod: new fields.NumberField({ initial: 0, integer: true }),
      traitBonus: new fields.NumberField({ initial: 0, integer: true }),
      label: new fields.StringField()
    };
  }
  /**
   * The total value of the stat (base + mod + traitBonus).
   * @type {number}
   */
  get total() {
    return this.value + (this.mod || 0) + (this.traitBonus || 0);
  }
}
function sameLimbScope(a, b) {
  const aL = a.limbs ?? [], bL = b.limbs ?? [];
  if (aL.length !== bL.length) return false;
  if (aL.length === 0) return true;
  const bSet = new Set(bL);
  return aL.every((l) => bSet.has(l));
}
class TAMSCharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      stats: new fields.SchemaField({
        strength: new fields.EmbeddedDataField(StatModifier, { initial: { label: "TAMS.StatStrength" } }),
        dexterity: new fields.EmbeddedDataField(StatModifier, { initial: { label: "TAMS.StatDexterity" } }),
        endurance: new fields.EmbeddedDataField(StatModifier, { initial: { label: "TAMS.StatEndurance" } }),
        wisdom: new fields.EmbeddedDataField(StatModifier, { initial: { label: "TAMS.StatWisdom" } }),
        intelligence: new fields.EmbeddedDataField(StatModifier, { initial: { label: "TAMS.StatIntelligence" } }),
        bravery: new fields.EmbeddedDataField(StatModifier, { initial: { label: "TAMS.StatBravery" } })
      }),
      limbs: new fields.SchemaField({
        head: new fields.SchemaField({ value: new fields.NumberField({ initial: 5 }), max: new fields.NumberField({ initial: 5 }), mult: new fields.NumberField({ initial: 0.5 }), armor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), armorMax: new fields.NumberField({ initial: 0, min: 0, max: 40 }), otherArmor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), label: new fields.StringField({ initial: "Head" }), injured: new fields.BooleanField({ initial: false }), criticallyInjured: new fields.BooleanField({ initial: false }), equippedArmorId: new fields.StringField({ initial: "" }) }),
        thorax: new fields.SchemaField({ value: new fields.NumberField({ initial: 10 }), max: new fields.NumberField({ initial: 10 }), mult: new fields.NumberField({ initial: 1 }), armor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), armorMax: new fields.NumberField({ initial: 0, min: 0, max: 40 }), otherArmor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), label: new fields.StringField({ initial: "Thorax" }), injured: new fields.BooleanField({ initial: false }), criticallyInjured: new fields.BooleanField({ initial: false }), equippedArmorId: new fields.StringField({ initial: "" }) }),
        stomach: new fields.SchemaField({ value: new fields.NumberField({ initial: 7 }), max: new fields.NumberField({ initial: 7 }), mult: new fields.NumberField({ initial: 0.75 }), armor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), armorMax: new fields.NumberField({ initial: 0, min: 0, max: 40 }), otherArmor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), label: new fields.StringField({ initial: "Stomach" }), injured: new fields.BooleanField({ initial: false }), criticallyInjured: new fields.BooleanField({ initial: false }), equippedArmorId: new fields.StringField({ initial: "" }) }),
        leftArm: new fields.SchemaField({ value: new fields.NumberField({ initial: 7 }), max: new fields.NumberField({ initial: 7 }), mult: new fields.NumberField({ initial: 0.75 }), armor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), armorMax: new fields.NumberField({ initial: 0, min: 0, max: 40 }), otherArmor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), label: new fields.StringField({ initial: "Left Arm" }), injured: new fields.BooleanField({ initial: false }), criticallyInjured: new fields.BooleanField({ initial: false }), equippedArmorId: new fields.StringField({ initial: "" }) }),
        rightArm: new fields.SchemaField({ value: new fields.NumberField({ initial: 7 }), max: new fields.NumberField({ initial: 7 }), mult: new fields.NumberField({ initial: 0.75 }), armor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), armorMax: new fields.NumberField({ initial: 0, min: 0, max: 40 }), otherArmor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), label: new fields.StringField({ initial: "Right Arm" }), injured: new fields.BooleanField({ initial: false }), criticallyInjured: new fields.BooleanField({ initial: false }), equippedArmorId: new fields.StringField({ initial: "" }) }),
        leftLeg: new fields.SchemaField({ value: new fields.NumberField({ initial: 7 }), max: new fields.NumberField({ initial: 7 }), mult: new fields.NumberField({ initial: 0.75 }), armor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), armorMax: new fields.NumberField({ initial: 0, min: 0, max: 40 }), otherArmor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), label: new fields.StringField({ initial: "Left Leg" }), injured: new fields.BooleanField({ initial: false }), criticallyInjured: new fields.BooleanField({ initial: false }), equippedArmorId: new fields.StringField({ initial: "" }) }),
        rightLeg: new fields.SchemaField({ value: new fields.NumberField({ initial: 7 }), max: new fields.NumberField({ initial: 7 }), mult: new fields.NumberField({ initial: 0.75 }), armor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), armorMax: new fields.NumberField({ initial: 0, min: 0, max: 40 }), otherArmor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), label: new fields.StringField({ initial: "Right Leg" }), injured: new fields.BooleanField({ initial: false }), criticallyInjured: new fields.BooleanField({ initial: false }), equippedArmorId: new fields.StringField({ initial: "" }) })
      }),
      inventory: new fields.SchemaField({
        usedCapacity: new fields.NumberField({ initial: 0 }),
        maxCapacity: new fields.NumberField({ initial: 0 }),
        usedSlots: new fields.NumberField({ initial: 0 }),
        maxSlots: new fields.NumberField({ initial: 0 }),
        hasBackpack: new fields.BooleanField({ initial: false }),
        isEncumbered: new fields.BooleanField({ initial: false }),
        equippedBackpackId: new fields.StringField({ initial: "" }),
        color: new fields.StringField({ initial: "#f1c40f" })
      }),
      hp: new fields.SchemaField({
        value: new fields.NumberField({ initial: 0 }),
        max: new fields.NumberField({ initial: 0 }),
        color: new fields.StringField({ initial: "#e74c3c" })
      }),
      tempDR: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
      stamina: new fields.SchemaField({
        value: new fields.NumberField({ initial: 10, min: 0 }),
        max: new fields.NumberField({ initial: 10, min: 0 }),
        mult: new fields.NumberField({ initial: 1 }),
        color: new fields.StringField({ initial: "#66bb6a" })
      }),
      customResources: new fields.ArrayField(new fields.SchemaField({
        name: new fields.StringField({ initial: "New Resource" }),
        nameSecondary: new fields.StringField({ initial: "Secondary" }),
        value: new fields.NumberField({ initial: 0, min: 0 }),
        max: new fields.NumberField({ initial: 0, min: 0 }),
        stat: new fields.StringField({ initial: "endurance" }),
        mult: new fields.NumberField({ initial: 1 }),
        bonus: new fields.NumberField({ initial: 0 }),
        customValue: new fields.NumberField({ initial: 10, min: 0 }),
        color: new fields.StringField({ initial: "#3498db" }),
        isOpposed: new fields.BooleanField({ initial: false }),
        colorSecondary: new fields.StringField({ initial: "#e74c3c" })
      })),
      theme: new fields.StringField({ initial: "default" }),
      physicalNotes: new fields.StringField({ initial: "" }),
      traits: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" }),
      behindMult: new fields.NumberField({ initial: 0.5, min: 0, step: 0.05 }),
      settings: new fields.SchemaField({
        alternateArmour: new fields.BooleanField({ initial: false }),
        isNPC: new fields.BooleanField({ initial: false }),
        npcType: new fields.StringField({ initial: "individual" }),
        npcRank: new fields.StringField({ initial: "mook" }),
        squadSize: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
        creatureSize: new fields.StringField({ initial: "normal" }),
        effectiveHPSize: new fields.StringField({ initial: "" }),
        effectiveStealthSize: new fields.StringField({ initial: "" }),
        effectiveCombatSize: new fields.StringField({ initial: "" }),
        enabledCurrencies: new fields.ObjectField({ initial: {} })
      }),
      upgradePoints: new fields.SchemaField({
        stats: new fields.NumberField({ initial: 0 }),
        weapons: new fields.NumberField({ initial: 0 }),
        skills: new fields.NumberField({ initial: 0 }),
        abilities: new fields.NumberField({ initial: 0 }),
        traits: new fields.NumberField({ initial: 0 })
      }),
      currencies: new fields.ObjectField({ initial: {} }),
      downtime: new fields.SchemaField({
        days: new fields.NumberField({ initial: 0, min: 0 }),
        daysRemaining: new fields.NumberField({ initial: 0, min: 0 }),
        isSafe: new fields.BooleanField({ initial: true }),
        isTended: new fields.BooleanField({ initial: false }),
        isBedRest: new fields.BooleanField({ initial: false }),
        notes: new fields.HTMLField({ initial: "" }),
        trackers: new fields.SchemaField({
          ability: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
          skill: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
          weapon: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
          statistic: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
          crafting: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
          resting: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
          healing: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
          working: new fields.NumberField({ initial: 0, integer: true, min: 0 })
        })
      }),
      resistances: new fields.ArrayField(new fields.SchemaField({
        damageType: new fields.StringField({ initial: "" }),
        category: new fields.StringField({ initial: "resistance" }),
        value: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
        limbs: new fields.ArrayField(new fields.StringField({ initial: "" }), { initial: [] })
      })),
      honor: new fields.SchemaField({
        valor: new fields.NumberField({ initial: 0, integer: true, min: -100, max: 100 }),
        justice: new fields.NumberField({ initial: 0, integer: true, min: -100, max: 100 }),
        devotion: new fields.NumberField({ initial: 0, integer: true, min: -100, max: 100 }),
        renown: new fields.NumberField({ initial: 0, integer: true, min: -100, max: 100 })
      })
    };
  }
  /** @override */
  prepareDerivedData() {
    this._prepareTraitModifiers();
    this._prepareLimbMaxHP();
    this._prepareArmorSync();
    this._prepareTotalHP();
    this._prepareStamina();
    this._prepareCustomResources();
    this._prepareInventoryCapacity();
    this._prepareDowntime();
  }
  /**
   * Iterate over traits and calculate bonuses for stats and rolls.
   * @protected
   */
  _prepareTraitModifiers() {
    var _a;
    const statKeys = ["strength", "dexterity", "endurance", "wisdom", "intelligence", "bravery"];
    for (const key of statKeys) {
      if (this.stats[key]) this.stats[key].traitBonus = 0;
    }
    this.traitRollBonus = 0;
    this.traitHPExtra = 0;
    this.traitStaminaExtra = 0;
    this.traitProfessionBonuses = {};
    this.abilityPassiveBonuses = {};
    this.abilityTypeBonus = { all: 0, weapon: 0, skill: 0, ability: 0 };
    const traits = this.parent.items.filter((i) => i.type === "trait" || i.type === "race");
    for (const trait of traits) {
      const system = trait.system;
      for (const mod of system.modifiers) {
        if (mod.target.startsWith("stats.")) {
          const statKey = mod.target.split(".")[1];
          if (this.stats[statKey]) {
            this.stats[statKey].traitBonus += mod.value;
          }
        } else if (mod.target === "hp.max") {
          this.traitHPExtra += mod.value;
        } else if (mod.target === "stamina.max") {
          this.traitStaminaExtra += mod.value;
        } else if (mod.target === "allRolls") {
          this.traitRollBonus += mod.value;
        } else if (mod.target === "allProfessionRolls") {
          if (system.isProfession && system.profession) {
            const p = system.profession.trim().toLowerCase();
            this.traitProfessionBonuses[p] = (this.traitProfessionBonuses[p] || 0) + mod.value;
          }
        }
      }
    }
    const baseSize = this.settings.creatureSize || "normal";
    const bestSize = (a, b) => SIZE_ORDER.indexOf(a) >= SIZE_ORDER.indexOf(b) ? a : b;
    let hpSize = this.settings.effectiveHPSize || baseSize;
    let stealthSize = this.settings.effectiveStealthSize || baseSize;
    let combatSize = this.settings.effectiveCombatSize || baseSize;
    for (const item of this.parent.items) {
      if (item.type !== "trait" && item.type !== "ability" && item.type !== "race") continue;
      const s = item.system;
      if (s.sizeGrantHP) hpSize = bestSize(hpSize, s.sizeGrantHP);
      if (s.sizeGrantStealth) stealthSize = bestSize(stealthSize, s.sizeGrantStealth);
      if (s.sizeGrantCombat) combatSize = bestSize(combatSize, s.sizeGrantCombat);
    }
    this.effectiveHPSize = hpSize;
    this.effectiveStealthSize = stealthSize;
    this.effectiveCombatSize = combatSize;
    this.injuryCheckBonus = 0;
    this.effectiveResistances = (this.resistances ?? []).map((r) => ({ ...r, limbs: [...r.limbs ?? []] }));
    for (const item of this.parent.items) {
      if (item.type !== "race") continue;
      this.injuryCheckBonus += item.system.injuryCheckBonus || 0;
      for (const r of item.system.resistances || []) {
        if (!r.damageType) continue;
        const existing = this.effectiveResistances.find(
          (e2) => e2.damageType === r.damageType && sameLimbScope(e2, r)
        );
        if (existing) {
          existing.value = Math.max(existing.value, r.value);
        } else {
          this.effectiveResistances.push({ ...r, limbs: [...r.limbs ?? []] });
        }
      }
    }
    for (const item of this.parent.items) {
      if (item.type !== "ability") continue;
      if (!item.system.isPassive || !item.system.passiveEnabled) continue;
      const val = item.system.passiveBonus || 0;
      if (!val) continue;
      const tag = (_a = item.system.passiveTag) == null ? void 0 : _a.trim().toLowerCase();
      if (tag) {
        this.abilityPassiveBonuses[tag] = (this.abilityPassiveBonuses[tag] || 0) + val;
      } else {
        const rollType = item.system.passiveRollType || "all";
        if (rollType in this.abilityTypeBonus) this.abilityTypeBonus[rollType] += val;
      }
    }
  }
  /**
   * Recompute max HP for each limb based on Endurance and NPC settings.
   * @protected
   */
  _prepareLimbMaxHP() {
    const end = this.stats.endurance.total;
    const settings = this.settings;
    const isSquadOrHorde = settings.isNPC && (settings.npcType === "squad" || settings.npcType === "horde");
    const squadSize = settings.squadSize || 1;
    const sizeMult = SIZE_HP_MULT[this.effectiveHPSize || settings.creatureSize] ?? 1;
    const limbKeys = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
    for (const key of limbKeys) {
      const limb = this.limbs[key];
      if (!limb) continue;
      const individualMax = Math.floor(end * limb.mult * sizeMult);
      limb.max = isSquadOrHorde ? individualMax * squadSize : individualMax;
      limb.individualMax = individualMax;
    }
  }
  /**
   * Sync equipped armor values to limb armor properties.
   * @protected
   */
  _prepareArmorSync() {
    const limbKeys = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
    for (const key of limbKeys) {
      const limb = this.limbs[key];
      if (!limb) continue;
      limb.hasEquippedArmor = false;
      if (limb.equippedArmorId) {
        const armor = this.parent.items.get(limb.equippedArmorId);
        if (armor && armor.type === "armor" && armor.system.equipped) {
          limb.hasEquippedArmor = true;
        }
      }
    }
  }
  /**
   * Aggregate total HP from individual limb values.
   * @protected
   */
  _prepareTotalHP() {
    let totalHp = 0;
    let totalMaxHp = 0;
    const limbKeys = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
    for (const key of limbKeys) {
      const limb = this.limbs[key];
      if (!limb) continue;
      totalHp += Number(limb.value) || 0;
      totalMaxHp += Number(limb.max) || 0;
    }
    this.hp.value = totalHp;
    this.hp.max = totalMaxHp + (this.traitHPExtra || 0);
  }
  /**
   * Calculate stamina maximum based on Endurance.
   * @protected
   */
  _prepareStamina() {
    const end = this.stats.endurance.total;
    const baseStamina = Math.max(1, end);
    this.stamina.max = Math.floor(baseStamina * (this.stamina.mult || 1)) + (this.traitStaminaExtra || 0);
  }
  /**
   * Update maximum values for custom resources.
   * @protected
   */
  _prepareCustomResources() {
    var _a;
    for (const res of this.customResources) {
      const statVal = res.stat === "custom" ? res.customValue ?? 10 : ((_a = this.stats[res.stat]) == null ? void 0 : _a.total) || 0;
      res.max = Math.floor(statVal * (res.mult || 1)) + (res.bonus || 0);
    }
  }
  /**
   * Calculate used and maximum inventory capacity.
   * @protected
   */
  _prepareInventoryCapacity() {
    var _a;
    const end = this.stats.endurance.total;
    const equippedBackpacks = this.parent.items.filter((i) => i.type === "backpack" && i.system.equipped);
    this.inventory.hasBackpack = equippedBackpacks.length > 0;
    this.inventory.equippedBackpackId = ((_a = equippedBackpacks[0]) == null ? void 0 : _a.id) || "";
    const mode = getCapacityMode();
    const largeSlots = getLargeSlots();
    const options = {
      itemsById: this.parent.items,
      endurance: end,
      equippedBackpackId: this.inventory.equippedBackpackId,
      largeSlots
    };
    const weight = computeEncumbrance(this.parent.items, { ...options, mode: "weight" });
    this.inventory.usedCapacity = weight.used;
    this.inventory.maxCapacity = weight.max;
    if (mode === "slots") {
      const slots = computeEncumbrance(this.parent.items, { ...options, mode: "slots" });
      this.inventory.usedSlots = slots.used;
      this.inventory.maxSlots = slots.max;
      this.inventory.isEncumbered = slots.isEncumbered;
    } else {
      this.inventory.usedSlots = 0;
      this.inventory.maxSlots = 0;
      this.inventory.isEncumbered = weight.isEncumbered;
    }
    this.backpackPenalties = { strength: 0, dexterity: 0, dodge: 0, attack: 0, movement: 0 };
    for (const backpack of equippedBackpacks) {
      const pen = backpack.system.penalties;
      if (pen && pen.active) {
        this.backpackPenalties.strength += pen.strength || 0;
        this.backpackPenalties.dexterity += pen.dexterity || 0;
        this.backpackPenalties.dodge += pen.dodge || 0;
        this.backpackPenalties.attack += pen.attack || 0;
        this.backpackPenalties.movement += pen.movement || 0;
      }
    }
  }
  /**
   * Calculate downtime days remaining.
   * @protected
   */
  _prepareDowntime() {
    const downtime = this.downtime;
    if (!downtime) return;
    const trackers = downtime.trackers || {};
    const usedDays = Object.values(trackers).reduce((sum, val) => sum + (Number(val) || 0), 0);
    downtime.daysRemaining = Math.max(0, downtime.days - usedDays);
  }
}
class TAMSWeaponData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      familiarity: new fields.NumberField({ initial: 0, nullable: true }),
      usedInScene: new fields.BooleanField({ initial: false }),
      quantity: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
      size: new fields.StringField({ initial: "medium" }),
      location: new fields.StringField({ initial: "hand" }),
      slots: new fields.NumberField({ initial: 2, integer: true, min: 1 }),
      equipped: new fields.BooleanField({ initial: false }),
      isHeavy: new fields.BooleanField({ initial: false }),
      isTwoHanded: new fields.BooleanField({ initial: false }),
      isLight: new fields.BooleanField({ initial: false }),
      isRanged: new fields.BooleanField({ initial: false }),
      isThrown: new fields.BooleanField({ initial: false }),
      hasArmourPen: new fields.BooleanField({ initial: false }),
      armourPenetration: new fields.NumberField({ initial: 0, integer: true, min: 0, nullable: true }),
      rangedDamage: new fields.NumberField({ initial: 0, nullable: true }),
      ammo: new fields.SchemaField({
        current: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
        total: new fields.NumberField({ initial: 0, integer: true, min: 0 })
      }),
      ammoItemId: new fields.StringField({ initial: "custom" }),
      magazineCapacity: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
      rangeCategory: new fields.StringField({ initial: "" }),
      firearmType: new fields.StringField({ initial: "" }),
      misfireThreshold: new fields.NumberField({ initial: 4, integer: true, min: 0, max: 100 }),
      fireRate: new fields.StringField({ initial: "1" }),
      fireRateCustom: new fields.NumberField({ initial: 1, nullable: true }),
      attackStat: new fields.StringField({ initial: "default" }),
      damageStat: new fields.StringField({ initial: "default" }),
      consumeAmmo: new fields.BooleanField({ initial: false }),
      special: new fields.StringField({ initial: "" }),
      isAoE: new fields.BooleanField({ initial: false }),
      damageType: new fields.StringField({ initial: "" }),
      inflictsStatusId: new fields.StringField({ initial: "" }),
      tags: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" })
    };
  }
  /**
   * The calculated damage of the weapon, derived from actor stats if melee.
   * @type {number}
   */
  get calculatedDamage() {
    var _a, _b;
    if (this.isRanged) return Math.floor(this.rangedDamage || 0);
    const actor = (_a = this.parent) == null ? void 0 : _a.actor;
    if (!actor) return 0;
    let statKey = "strength";
    if (this.damageStat && this.damageStat !== "default") {
      statKey = this.damageStat;
    } else if (this.attackStat && this.attackStat !== "default") {
      statKey = this.attackStat;
    } else {
      statKey = this.isLight ? "dexterity" : "strength";
    }
    const statValue = ((_b = actor.system.stats[statKey]) == null ? void 0 : _b.total) || 0;
    let mult = 0.5;
    if (this.isHeavy) mult += 0.25;
    if (this.isTwoHanded) mult += 0.25;
    return Math.floor(statValue * mult);
  }
}
class TAMSSkillData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      familiarity: new fields.NumberField({ initial: 0, nullable: true }),
      usedInScene: new fields.BooleanField({ initial: false }),
      bonus: new fields.NumberField({ initial: 0, nullable: true }),
      stat: new fields.StringField({ initial: "strength" }),
      tags: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" })
    };
  }
}
class TAMSEquipmentData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      quantity: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
      size: new fields.StringField({ initial: "small" }),
      location: new fields.StringField({ initial: "stowed" }),
      slots: new fields.NumberField({ initial: 2, integer: true, min: 1 }),
      tags: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" })
    };
  }
}
class TAMSArmorData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      quantity: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
      size: new fields.StringField({ initial: "large" }),
      location: new fields.StringField({ initial: "stowed" }),
      slots: new fields.NumberField({ initial: 2, integer: true, min: 1 }),
      equipped: new fields.BooleanField({ initial: false }),
      limbs: new fields.SchemaField({
        head: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }), max: new fields.NumberField({ initial: 0 }) }),
        thorax: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }), max: new fields.NumberField({ initial: 0 }) }),
        stomach: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }), max: new fields.NumberField({ initial: 0 }) }),
        leftArm: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }), max: new fields.NumberField({ initial: 0 }) }),
        rightArm: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }), max: new fields.NumberField({ initial: 0 }) }),
        leftLeg: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }), max: new fields.NumberField({ initial: 0 }) }),
        rightLeg: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }), max: new fields.NumberField({ initial: 0 }) })
      }),
      tags: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" })
    };
  }
}
class TAMSAmmoData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      quantity: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
      size: new fields.StringField({ initial: "small" }),
      location: new fields.StringField({ initial: "stowed" }),
      slots: new fields.NumberField({ initial: 1, integer: true, min: 1 }),
      uses: new fields.SchemaField({
        value: new fields.NumberField({ initial: 0 }),
        max: new fields.NumberField({ initial: 0 })
      }),
      misfireRisk: new fields.BooleanField({ initial: false }),
      isSlug: new fields.BooleanField({ initial: false }),
      tags: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" })
    };
  }
}
class TAMSConsumableData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      quantity: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
      size: new fields.StringField({ initial: "small" }),
      location: new fields.StringField({ initial: "stowed" }),
      slots: new fields.NumberField({ initial: 2, integer: true, min: 1 }),
      uses: new fields.SchemaField({
        value: new fields.NumberField({ initial: 0 }),
        max: new fields.NumberField({ initial: 0 })
      }),
      tags: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" })
    };
  }
}
class TAMSToolData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      quantity: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
      size: new fields.StringField({ initial: "medium" }),
      location: new fields.StringField({ initial: "stowed" }),
      slots: new fields.NumberField({ initial: 2, integer: true, min: 1 }),
      tags: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" })
    };
  }
}
class TAMSShieldData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      armorValue: new fields.NumberField({ initial: 5, integer: true, min: 0 }),
      equipped: new fields.BooleanField({ initial: false }),
      quantity: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
      size: new fields.StringField({ initial: "medium" }),
      location: new fields.StringField({ initial: "hand" }),
      slots: new fields.NumberField({ initial: 2, integer: true, min: 1 }),
      tags: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" })
    };
  }
}
class TAMSQuestItemData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      quantity: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
      size: new fields.StringField({ initial: "small" }),
      location: new fields.StringField({ initial: "stowed" }),
      slots: new fields.NumberField({ initial: 2, integer: true, min: 1 }),
      tags: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" })
    };
  }
}
class TAMSBackpackData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      quantity: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
      size: new fields.StringField({ initial: "medium" }),
      location: new fields.StringField({ initial: "stowed" }),
      slots: new fields.NumberField({ initial: 2, integer: true, min: 1 }),
      equipped: new fields.BooleanField({ initial: false }),
      capacity: new fields.NumberField({ initial: 10, integer: true, min: 0 }),
      modifier: new fields.NumberField({ initial: 0.5, step: 0.1, min: 0 }),
      penalties: new fields.SchemaField({
        active: new fields.BooleanField({ initial: false }),
        strength: new fields.NumberField({ initial: 0, integer: true }),
        dexterity: new fields.NumberField({ initial: 0, integer: true }),
        dodge: new fields.NumberField({ initial: 0, integer: true }),
        attack: new fields.NumberField({ initial: 0, integer: true }),
        movement: new fields.NumberField({ initial: 0, integer: true })
      }),
      tags: new fields.StringField({ initial: "" }),
      sizeGrantHP: new fields.StringField({ initial: "" }),
      sizeGrantStealth: new fields.StringField({ initial: "" }),
      sizeGrantCombat: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" })
    };
  }
}
class TAMSAbilityData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      familiarity: new fields.NumberField({ initial: 0, nullable: true }),
      usedInScene: new fields.BooleanField({ initial: false }),
      bonus: new fields.NumberField({ initial: 0, nullable: true }),
      cost: new fields.NumberField({ initial: 0, nullable: true }),
      resource: new fields.StringField({ initial: "stamina" }),
      isApex: new fields.BooleanField({ initial: false }),
      isReaction: new fields.BooleanField({ initial: false }),
      uses: new fields.SchemaField({
        value: new fields.NumberField({ initial: 0 }),
        max: new fields.NumberField({ initial: 0 })
      }),
      isAttack: new fields.BooleanField({ initial: false }),
      useWeaponDamage: new fields.BooleanField({ initial: false }),
      damage: new fields.NumberField({ initial: 0, nullable: true }),
      armourPenetration: new fields.NumberField({ initial: 0, integer: true, min: 0, nullable: true }),
      attackStat: new fields.StringField({ initial: "strength" }),
      capStat: new fields.StringField({ initial: "strength" }),
      damageStat: new fields.StringField({ initial: "strength" }),
      damageMult: new fields.NumberField({ initial: 0.5, step: 0.05, nullable: true }),
      damageBonus: new fields.NumberField({ initial: 0, nullable: true }),
      multiAttack: new fields.NumberField({ initial: 1, nullable: true }),
      isAoE: new fields.BooleanField({ initial: false }),
      damageType: new fields.StringField({ initial: "" }),
      inflictsStatusId: new fields.StringField({ initial: "" }),
      hasSave: new fields.BooleanField({ initial: false }),
      saveAgainst: new fields.StringField({ initial: "dexterity" }),
      tags: new fields.StringField({ initial: "" }),
      castTime: new fields.StringField({ initial: "immediate" }),
      description: new fields.HTMLField({ initial: "" }),
      sizeGrantHP: new fields.StringField({ initial: "" }),
      sizeGrantStealth: new fields.StringField({ initial: "" }),
      sizeGrantCombat: new fields.StringField({ initial: "" }),
      ifStatement: new fields.StringField({ initial: "" }),
      ifCost: new fields.NumberField({ initial: 0, integer: true, nullable: true }),
      calculator: new fields.SchemaField({
        enabled: new fields.BooleanField({ initial: false }),
        isUtility: new fields.BooleanField({ initial: false }),
        effects: new fields.NumberField({ initial: 0, integer: true, nullable: true }),
        guaranteedMax: new fields.BooleanField({ initial: false }),
        detriments: new fields.NumberField({ initial: 0, integer: true, nullable: true }),
        movementDoubleOwn: new fields.BooleanField({ initial: false }),
        movementHalveEnemy: new fields.BooleanField({ initial: false }),
        movementFlat: new fields.NumberField({ initial: 0, integer: true, nullable: true }),
        rollBonus: new fields.NumberField({ initial: 0, integer: true, nullable: true }),
        ignoreArmor: new fields.NumberField({ initial: 0, integer: true, nullable: true }),
        targetingMode: new fields.StringField({ initial: "normal" }),
        bodyPart: new fields.StringField({ initial: "none" }),
        targetLimb: new fields.StringField({ initial: "none" }),
        fireRate: new fields.StringField({ initial: "single" }),
        multiAttackHits: new fields.NumberField({ initial: 0, integer: true, nullable: true }),
        damageStatFraction: new fields.StringField({ initial: "0" }),
        stun: new fields.StringField({ initial: "none" }),
        healing: new fields.NumberField({ initial: 0, integer: true, nullable: true }),
        drType: new fields.StringField({ initial: "none" }),
        drValue: new fields.NumberField({ initial: 0, integer: true, nullable: true }),
        bypassDodge: new fields.BooleanField({ initial: false }),
        bypassRetaliation: new fields.BooleanField({ initial: false }),
        targetType: new fields.StringField({ initial: "single" }),
        aoeRadius: new fields.NumberField({ initial: 0, integer: true, nullable: true }),
        range: new fields.NumberField({ initial: 0, integer: true, nullable: true }),
        duration: new fields.StringField({ initial: "instant" }),
        isStackable: new fields.BooleanField({ initial: false }),
        tagAccurate: new fields.BooleanField({ initial: false }),
        tagReliable: new fields.BooleanField({ initial: false }),
        tagUnreliable: new fields.BooleanField({ initial: false }),
        tagVicious: new fields.BooleanField({ initial: false }),
        tagBrutal: new fields.BooleanField({ initial: false }),
        tagTransformation: new fields.BooleanField({ initial: false }),
        tagOther: new fields.NumberField({ initial: 0, integer: true, nullable: true }),
        statIncrease: new fields.NumberField({ initial: 0, integer: true, nullable: true })
      }),
      rechargeType: new fields.StringField({ initial: "rest" }),
      isPassive: new fields.BooleanField({ initial: false }),
      passiveEnabled: new fields.BooleanField({ initial: true }),
      passiveBonus: new fields.NumberField({ initial: 0, nullable: true }),
      passiveTag: new fields.StringField({ initial: "" }),
      passiveRollType: new fields.StringField({ initial: "all" })
    };
  }
  /**
   * The calculated damage of the ability, derived from actor stats if applicable.
   * @type {number}
   */
  get calculatedDamage() {
    var _a, _b;
    if (!this.isAttack) return 0;
    const actor = (_a = this.parent) == null ? void 0 : _a.actor;
    if (!actor) return 0;
    if (this.damageStat === "custom") {
      return (this.damage || 0) + (this.damageBonus || 0);
    }
    const damageStatValue = ((_b = actor.system.stats[this.damageStat]) == null ? void 0 : _b.total) || 0;
    return Math.floor(damageStatValue * this.damageMult) + this.damageBonus + (this.damage || 0);
  }
  /**
   * The calculated resource cost of the ability, derived from calculator fields.
   * @type {number}
   */
  get calculatedCost() {
    const c = this.calculator;
    let cost = 0;
    cost += (c.effects || 0) * 1;
    if (c.guaranteedMax) cost += 2;
    cost -= (c.detriments || 0) * 1;
    if (c.movementDoubleOwn) cost += 2;
    if (c.movementHalveEnemy) cost += 4;
    cost += (c.movementFlat || 0) * 2;
    cost += Math.floor((c.rollBonus || 0) / 5) * 1;
    cost += Math.floor((c.statIncrease || 0) / 5) * 1;
    if (c.ignoreArmor > 0) {
      cost += 1;
      if (c.ignoreArmor > 1) cost += (c.ignoreArmor - 1) * 2;
    }
    if (c.bodyPart !== "none") cost += 2;
    if (c.targetLimb !== "none") cost += 4;
    if (c.fireRate === "burst") cost += 2;
    else if (c.fireRate === "auto") cost += 4;
    cost += (c.multiAttackHits || 0) * 2;
    const dsf = parseFloat(c.damageStatFraction) || 0;
    if (dsf > 0) cost += dsf / 0.25 * 1;
    if (c.stun === "crit") cost += 1;
    else if (c.stun === "guaranteed") cost += 2;
    cost += (c.healing || 0) * 1;
    if (c.drType !== "none") cost += (c.drValue || 0) * 1;
    if (c.bypassDodge) cost *= 2;
    if (c.bypassRetaliation) cost *= 2;
    if (c.isUtility && c.targetType === "multiple") {
      cost *= 1.5;
    } else if (c.targetType === "multiple") {
      cost *= 2;
    }
    if (c.aoeRadius >= 1) {
      cost += 2;
      if (c.aoeRadius > 3) cost += c.aoeRadius - 3;
    }
    if (c.isUtility) {
      if (c.range >= 100 && c.range < 1e3) cost += 1;
      else if (c.range >= 1e3 && c.range < 1e4) cost += 2;
      else if (c.range >= 1e4) cost += 3;
    } else {
      if (c.range > 10 && c.range <= 25) cost += 1;
      else if (c.range > 25 && c.range <= 50) cost += 2;
      else if (c.range > 50 && c.range <= 75) cost += 3;
      else if (c.range > 75 && c.range <= 100) cost += 4;
      else if (c.range > 100) {
        cost += 4;
        cost += Math.floor((c.range - 100) / 50);
      }
    }
    if (c.isUtility) {
      if (c.duration === "utility1") cost += 1;
      else if (c.duration === "utility2") cost += 2;
      else if (c.duration === "utility3") cost += 3;
      else if (c.duration === "utility4") cost += 4;
    } else {
      if (c.duration === "1round") cost += 1;
      else if (c.duration === "2rounds") cost += 2;
      else if (c.duration === "3rounds") cost += 4;
    }
    if (c.isStackable) cost *= 2;
    if (c.tagAccurate) cost += 1;
    if (c.tagReliable) cost += 1;
    if (c.tagUnreliable) cost -= 1;
    if (c.tagVicious) cost += 1;
    if (c.tagBrutal) cost += 2;
    cost += (c.tagOther || 0) * 1;
    return Math.max(1, Math.floor(cost));
  }
  prepareDerivedData() {
    var _a;
    if ((_a = this.calculator) == null ? void 0 : _a.enabled) {
      this.cost = this.calculatedCost;
    }
  }
}
class TAMSStatusEffectData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      statusId: new fields.StringField({ initial: "" }),
      mechanicalSummary: new fields.StringField({ initial: "" }),
      durationRounds: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
      description: new fields.HTMLField({ initial: "" })
    };
  }
}
class TAMSRaceData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      passiveTraits: new fields.ArrayField(new fields.SchemaField({
        name: new fields.StringField({ initial: "" }),
        description: new fields.StringField({ initial: "" })
      })),
      grantedAbilities: new fields.ArrayField(new fields.ObjectField()),
      modifiers: new fields.ArrayField(new fields.SchemaField({
        target: new fields.StringField({ initial: "stats.strength.value" }),
        value: new fields.NumberField({ initial: 0 }),
        type: new fields.StringField({ initial: "add" })
      })),
      size: new fields.StringField({ initial: "normal" }),
      sizeGrantHP: new fields.StringField({ initial: "" }),
      sizeGrantStealth: new fields.StringField({ initial: "" }),
      sizeGrantCombat: new fields.StringField({ initial: "" }),
      injuryCheckBonus: new fields.NumberField({ initial: 0, integer: true }),
      resistances: new fields.ArrayField(new fields.SchemaField({
        damageType: new fields.StringField({ initial: "" }),
        category: new fields.StringField({ initial: "resistance" }),
        value: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
        limbs: new fields.ArrayField(new fields.StringField({ initial: "" }), { initial: [] })
      })),
      tags: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" })
    };
  }
}
class TAMSTraitData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      isProfession: new fields.BooleanField({ initial: false }),
      profession: new fields.StringField({ initial: "" }),
      modifiers: new fields.ArrayField(new fields.SchemaField({
        target: new fields.StringField({ initial: "stats.strength.value" }),
        value: new fields.NumberField({ initial: 0 }),
        type: new fields.StringField({ initial: "add" })
      })),
      tags: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" })
    };
  }
}
const MISHAP_TABLE = [
  // Tier 1: Narrative (01–100) — spell always fires, purely flavour
  { min: 1, max: 5, tier: 1, name: "Hiccups", effect: "Caster hiccups uncontrollably for the next minute." },
  { min: 6, max: 10, tier: 1, name: "Squeaky Voice", effect: "Caster's voice rises three octaves for a few minutes." },
  { min: 11, max: 15, tier: 1, name: "Sparkler", effect: "Harmless colourful sparks shower from the caster's fingertips." },
  { min: 16, max: 20, tier: 1, name: "Wrong Smell", effect: "The area briefly smells strongly of something absurd (wet dog, burnt toast, lavender)." },
  { min: 21, max: 25, tier: 1, name: "Static Cling", effect: "Caster's hair stands on end and clothes cling oddly for the scene." },
  { min: 26, max: 30, tier: 1, name: "Overenthusiastic Gesture", effect: "The somatic gesture comes out unexpectedly grand and theatrical, drawing every eye in the room." },
  { min: 31, max: 35, tier: 1, name: "Sneezing Fit", effect: "Caster sneezes three times in a row immediately after casting." },
  { min: 36, max: 40, tier: 1, name: "Mismatched Words", effect: "The incantation comes out in the wrong order — vaguely insulting to anyone who speaks the language." },
  { min: 41, max: 45, tier: 1, name: "Butterflies", effect: "A small cloud of illusory butterflies bursts from the casting hand and dissolves after a few seconds." },
  { min: 46, max: 50, tier: 1, name: "Wobbly Knees", effect: "The caster's knees buckle comically for a moment." },
  { min: 51, max: 55, tier: 1, name: "Ash Puff", effect: "A small, harmless puff of soot covers the caster's face and hands." },
  { min: 56, max: 60, tier: 1, name: "Echoing Voice", effect: "The caster's voice echoes oddly for the next few sentences they speak." },
  { min: 61, max: 65, tier: 1, name: "Singed Eyebrows", effect: "Caster's eyebrows (or equivalent) are singed off. Grow back in 1d4 days." },
  { min: 66, max: 70, tier: 1, name: "Squeaky Boots", effect: "Every step the caster takes for the rest of the scene produces an embarrassing squeak." },
  { min: 71, max: 75, tier: 1, name: "Tongue-Tied", effect: "Caster can only mumble for 1 round — no mechanical effect, purely descriptive." },
  { min: 76, max: 80, tier: 1, name: "Static Shock", effect: "Anyone who touches the caster in the next minute gets a small zap and a dirty look." },
  { min: 81, max: 85, tier: 1, name: "Ridiculous Odour", effect: "Caster smells overwhelmingly of the last thing they ate, for the rest of the day." },
  { min: 86, max: 90, tier: 1, name: "Minor Humiliation", effect: "The spell fires with an unmistakably undignified noise or flourish that everyone nearby definitely noticed." },
  { min: 91, max: 95, tier: 1, name: "Butterfingers", effect: "Caster fumbles whatever's in their other hand — a small dropped item, no mechanical loss." },
  { min: 96, max: 100, tier: 1, name: "Everyone's Looking", effect: "Every creature within earshot turns to stare after an unmistakably awkward spectacle." },
  // Tier 2: Real Effects (101–200) — alternating positive/negative every 10
  { min: 101, max: 110, tier: 2, positive: true, name: "Echoing Surge", effect: "Spell fires at full effect, and fires again at half effect at the caster's next turn, retargeted by the caster." },
  { min: 111, max: 120, tier: 2, positive: false, name: "Catastrophic Backlash", effect: "Spell fails entirely. Caster takes (cost × 10) to the Thorax, bypassing all armour and damage resistances. The caster may spend resource — each resource spent reduces this damage by 10." },
  { min: 121, max: 130, tier: 2, positive: true, name: "Overwhelming Surge", effect: "Spell fires at double all numerical values. No downside." },
  { min: 131, max: 140, tier: 2, positive: false, name: "Magical Reversal", effect: "Spell fails to reach its intended target and strikes the caster instead at full effect, as if they were the original target." },
  { min: 141, max: 150, tier: 2, positive: true, name: "Temporal Boost", effect: "Spell fires normally. Caster gains an additional activation this round." },
  { min: 151, max: 160, tier: 2, positive: false, name: "Reality Rupture", effect: "Spell detonates at the caster's position. All creatures within 5m (including the caster) take (cost × 10) damage. Each resource spent reduces this damage by 10 for all affected. Spell's original effect fails." },
  { min: 161, max: 170, tier: 2, positive: true, name: "Arcane Mastery", effect: "Spell fires normally. Caster's next 2 spell rolls automatically succeed at maximum effect." },
  { min: 171, max: 180, tier: 2, positive: false, name: "Planar Bleed", effect: "A rift tears open at the point of casting. A hostile creature from another plane emerges (GM scales to party threat level). Rift seals after 1 round. Spell fails." },
  { min: 181, max: 190, tier: 2, positive: true, name: "Wild Boon", effect: "Spell fires normally and is duplicated in full at a second valid target/location of the caster's choosing." },
  { min: 191, max: 200, tier: 2, positive: false, name: "Cascade Failure", effect: "Roll twice more on this 101–200 band (re-roll results of 191+). Apply both results simultaneously. Original spell fails." },
  // Tier 3: Extreme (201–250)
  { min: 201, max: 210, tier: 3, name: "Mana Cataclysm", effect: "All creatures within 10m take (cost × 20) damage bypassing armour. Caster takes double this amount. Each resource spent reduces damage by 10 for all affected (caster's doubled portion reduced by 20). Make a Survival Check if brought to 0 HP. Spell fails." },
  { min: 211, max: 220, tier: 3, name: "Temporal Fracture", effect: "All creatures in the encounter revert to their positions at the start of the previous round. HP, Stamina, and Mana remain at their values at the moment of the mishap. Spell fails. Can only trigger once per combat." },
  { min: 221, max: 230, tier: 3, name: "Anti-Magic Pulse", effect: "A 20m radius anti-magic zone erupts from the caster for 1d4+1 rounds. All ongoing magical effects are suppressed. Caster takes damage equal to all Stamina/Mana spent this combat, bypassing armour. Each resource spent reduces this damage by 10." },
  { min: 231, max: 240, tier: 3, name: "The Rending", effect: "The spell detonates in a 30m radius. All creatures within take (cost × 30) damage bypassing armour. Each resource spent reduces damage by 10 for all affected. Terrain is permanently altered. Spell fails." },
  { min: 241, max: 250, tier: 3, name: "Apotheosis Failed", effect: "Every limb takes (cost × 15) damage, bypassing all armour. Each resource spent reduces damage by 10. Make a Survival Check for each limb brought to 0 HP." },
  // Tier 4: Gone From Existence (250+) — fates worse than death
  { min: 250, max: 250, tier: 4, name: "Annihilation", effect: "The caster is erased from existence entirely — body, soul, and all traces. Those who knew them retain the memory of a person but cannot explain why. Possessions scatter. By the standards of this tier, this is the fortunate result." },
  { min: 251, max: 265, tier: 4, name: "Soul Shatter", effect: "The soul is fragmented across multiple planes. The body remains alive but empty. Each fragment experiences its host plane, typically in perpetuity. Recovery requires a separate quest to each plane to retrieve and reunite the pieces; no known single ritual can achieve this." },
  { min: 266, max: 280, tier: 4, name: "The Eternal Moment", effect: "The caster's consciousness is trapped reliving the exact moment of the mishap forever, while their body stands frozen — indestructible and perfectly preserved. They are aware of every second passing. Only divine intervention or a time-governing entity can release them." },
  { min: 281, max: 295, tier: 4, name: "Vessel", effect: "An ancient extraplanar entity takes full and permanent control of the body. The caster is a helpless passenger — fully conscious, watching through their own eyes. The entity departs when finished, always taking something irreplaceable with it." },
  { min: 296, max: 310, tier: 4, name: "The Living Wound", effect: "The caster becomes a permanent conscious conduit for uncontrolled magical energy. They cannot die, heal, or rest, and experience constant agony as raw magic tears through them. The surrounding area warps over time. There is no cure." },
  { min: 311, max: Infinity, tier: 4, name: "The Rending (Event)", effect: "The mishap becomes a named event in the history of the world. Reality within a 1-kilometre radius is permanently and irrevocably altered. The caster is transformed into something that cannot be categorised. This result has happened before. There are ruins named after it." }
];
const DIVINE_MISHAP_TABLE = {
  tierNames: {
    1: "Purely Narrative",
    2: "Real Effects",
    3: "Extreme",
    4: "The Cost of Being Heard"
  },
  entries: [
    // Tier 1: Purely Narrative (01–100)
    { min: 1, max: 5, tier: 1, name: "Trembling Light", effect: "The power manifests as usual but flickers once, visibly, before stabilising." },
    { min: 6, max: 10, tier: 1, name: "Cold Channel", effect: "The caster's focus or hands grow briefly cold instead of warm during the channelling." },
    { min: 11, max: 15, tier: 1, name: "Audible", effect: "The invocation produces a faint resonant hum audible to everyone within 5m." },
    { min: 16, max: 20, tier: 1, name: "Off-Colour", effect: "The visual manifestation appears in an unexpected colour — still clearly divine, just different." },
    { min: 21, max: 25, tier: 1, name: "Echo of Doubt", effect: "For a half-second, the caster is completely certain the ability won't work. It does." },
    { min: 26, max: 30, tier: 1, name: "Watched", effect: "A clear, calm sense of being observed during the casting. It passes the moment the ability resolves." },
    { min: 31, max: 35, tier: 1, name: "Scent", effect: "The ability carries an unusual scent — incense, rain, iron, or something specific to the caster's tradition." },
    { min: 36, max: 40, tier: 1, name: "Misplaced Reverence", effect: "A nearby creature instinctively bows or averts their gaze during the channelling, without knowing why." },
    { min: 41, max: 45, tier: 1, name: "Weight", effect: "An uncharacteristic heaviness for a moment, then nothing. The ability works." },
    { min: 46, max: 50, tier: 1, name: "Delay", effect: "The ability triggers half a second late. No mechanical effect; everyone noticed." },
    { min: 51, max: 55, tier: 1, name: "Visible Breath", effect: "The caster's breath becomes visible as mist for the round, regardless of temperature." },
    { min: 56, max: 60, tier: 1, name: "Second Voice", effect: "The invocation is briefly accompanied by a second voice saying the same words." },
    { min: 61, max: 65, tier: 1, name: "Stillness", effect: "Every flame or moving light source within 10m stills completely for 1 second." },
    { min: 66, max: 70, tier: 1, name: "Gravity", effect: "Small loose objects within 2m orient briefly toward the caster during the invocation." },
    { min: 71, max: 75, tier: 1, name: "Marked", effect: "A visible symbol appears on the caster's skin for the rest of the round, then fades." },
    { min: 76, max: 80, tier: 1, name: "Displaced Sound", effect: "The sound of the invocation comes from slightly the wrong direction." },
    { min: 81, max: 85, tier: 1, name: "Ambient Response", effect: "The environment reacts — birds go quiet, wind stills, animals look toward the caster." },
    { min: 86, max: 90, tier: 1, name: "Excessive Sincerity", effect: "The ability works but the caster delivers it with an intensity everyone nearby finds slightly unsettling." },
    { min: 91, max: 95, tier: 1, name: "Interference", effect: "A brief ripple passes through all ongoing effects in the area before the ability fires cleanly." },
    { min: 96, max: 100, tier: 1, name: "Grand Entrance", effect: "The ability fires normally but with significantly more dramatic visual presentation than warranted." },
    // Tier 2: Real Effects (101–200) — alternating positive/negative every 10
    { min: 101, max: 110, tier: 2, positive: true, name: "Divine Echo", effect: "Ability fires at full effect, then fires again at half effect at the caster's next turn, retargeted by the caster." },
    { min: 111, max: 120, tier: 2, positive: false, name: "Rebuke", effect: "Ability fails. The power turns inward — caster takes (cost × 10) to the Thorax, bypassing armour. The caster may spend resource after the mishap roll — each resource spent reduces this damage by 10." },
    { min: 121, max: 130, tier: 2, positive: true, name: "Surging Conviction", effect: "Ability fires at double all numerical values. No downside." },
    { min: 131, max: 140, tier: 2, positive: false, name: "Misaligned", effect: "Ability fires at full effect but strikes the caster instead of the intended target, as if they were the original target." },
    { min: 141, max: 150, tier: 2, positive: true, name: "Granted Action", effect: "Ability fires normally. Caster gains an additional activation this round." },
    { min: 151, max: 160, tier: 2, positive: false, name: "Holy Discharge", effect: "The ability detonates at the caster's position. All creatures within 5m (including the caster) take (cost × 10) damage. The caster may spend resource after the mishap roll — each resource spent reduces this damage by 10 for all affected. Ability fails." },
    { min: 161, max: 170, tier: 2, positive: true, name: "Unwavering Faith", effect: "Ability fires normally. Caster's next 2 divine ability rolls automatically succeed at maximum effect." },
    { min: 171, max: 180, tier: 2, positive: false, name: "The Wrong Ear", effect: "The invocation is heard by something that opposes what the caster serves. A hostile entity arrives, drawn by the prayer (GM scales to party threat level). Ability fails." },
    { min: 181, max: 190, tier: 2, positive: true, name: "Overflowing Grace", effect: "Ability fires normally and is duplicated in full at a second valid target of the caster's choosing." },
    { min: 191, max: 200, tier: 2, positive: false, name: "Cascading Doubt", effect: "Roll twice more on this 101–200 band (re-roll 191+). Apply both simultaneously. Original ability fails." },
    // Tier 3: Extreme (201–250)
    { min: 201, max: 210, tier: 3, name: "Righteous Detonation", effect: "The divine energy discharges in a 10m radius. All creatures within take (cost × 20) damage. Caster takes double. The caster may spend resource after the mishap roll — each resource spent reduces this damage by 10 for all affected (the caster's doubled portion is reduced by 20 per resource spent). Make a Survival Check if brought to 0 HP. Ability fails." },
    { min: 211, max: 220, tier: 3, name: "Weight of Judgement", effect: "Every creature within 20m is compelled for 1d4 rounds to act in accordance with their own stated values. Creatures who act against their professed nature during this time take (cost × 10) damage. Ability fires normally." },
    { min: 221, max: 230, tier: 3, name: "Silence of the Faithful", effect: "A 15m radius zone erupts from the caster — no divine abilities may be channelled within it for 1d4+1 rounds, all ongoing divine effects suspended. Caster takes (cost × 10) to the Thorax. The caster may spend resource after the mishap roll — each resource spent reduces this damage by 10." },
    { min: 231, max: 240, tier: 3, name: "Crisis of Conviction", effect: "The caster is overtaken by complete involuntary doubt. For 1d4 rounds they cannot use any divine ability and must pass a Bravery check to take any action that invokes their code or deity." },
    { min: 241, max: 250, tier: 3, name: "Marked for Attention", effect: "The ability fails. The power discharges inward — every limb takes (cost × 10) damage bypassing armour. The caster may spend resource after the mishap roll — each resource spent reduces this damage by 10. Make a Survival Check for each limb brought to 0 HP or below." },
    // Tier 4: The Cost of Being Heard (250+)
    { min: 250, max: 250, tier: 4, name: "The Silence", effect: "The power simply stops. Not anger, not punishment — just absence where something once was. The caster is completely functional. Their divine abilities no longer work. There is no explanation and no sign it will return." },
    { min: 251, max: 265, tier: 4, name: "Claimed", effect: "Something heard the invocation before the intended recipient could respond, and answered. The caster's power works perfectly — it is simply coming from somewhere else now. The caster may or may not be able to tell the difference. Whatever answered can." },
    { min: 266, max: 280, tier: 4, name: "Perfect Obedience", effect: "The caster is granted absolute, permanent clarity of what their code or deity demands of them in every moment. They cannot act against it — not from lack of desire, but because the person capable of choosing otherwise no longer exists. They remain functional, even content. The individual who entered this combat is gone." },
    { min: 281, max: 295, tier: 4, name: "Vessel", effect: "The caster becomes a direct, unfiltered conduit. The power moves through them constantly without direction or consent. They glow. They heal those nearby. They cannot touch anything without leaving a mark. This does not stop." },
    { min: 296, max: 310, tier: 4, name: "Devoted", effect: "The caster's commitment deepens past what a person can healthily sustain. They cannot prioritise anything above their code or deity — not survival, not allies, not themselves. They are perfectly content. They are completely unreachable." },
    { min: 311, max: Infinity, tier: 4, name: "The Answer", effect: "The invocation was answered completely and without reservation. Whatever the caster serves is now fully, physically, permanently present. It has not left. It has its own ideas about what comes next. The GM determines its nature. The campaign has changed." }
  ]
};
const ALCHEMY_MISHAP_TABLE = {
  tierNames: {
    1: "Produced with Side Effects",
    2: "Real Effects",
    3: "Brew Fails — Dangerous",
    4: "Not Everything Can Be Neutralised"
  },
  entries: [
    // Tier 1: Produced with Side Effects (01–100)
    { min: 1, max: 5, tier: 1, name: "Delayed Onset", effect: "Takes effect 1 round later than it should." },
    { min: 6, max: 10, tier: 1, name: "Noxious", effect: "Unpleasant in delivery — foul to drink, stinging to touch, acrid when airborne." },
    { min: 11, max: 15, tier: 1, name: "Glowing", effect: "The brew and its target glow faintly for the duration of the effect." },
    { min: 16, max: 20, tier: 1, name: "Wrong Smell", effect: "The target emits a strong, distinct smell for the duration of the effect." },
    { min: 21, max: 25, tier: 1, name: "Half Duration", effect: "Full potency but lasts half as long as intended." },
    { min: 26, max: 30, tier: 1, name: "Unstable", effect: "Must be used within the next hour or degrades into an inert substance." },
    { min: 31, max: 35, tier: 1, name: "Skin Deep", effect: "Causes a temporary harmless change to the target's skin tone or hair colour for its duration." },
    { min: 36, max: 40, tier: 1, name: "Audible", effect: "Makes a distinct noise on use — a hiss, pop, or resonant hum." },
    { min: 41, max: 45, tier: 1, name: "Extended Duration", effect: "Full potency but lasts twice as long." },
    { min: 46, max: 50, tier: 1, name: "Contagious Touch", effect: "For the first round after use, anyone the target touches is mildly affected at half potency for 1 round." },
    { min: 51, max: 55, tier: 1, name: "Reduced Yield", effect: "Only a single dose is produced regardless of batch size." },
    { min: 56, max: 60, tier: 1, name: "Half Potency", effect: "Full duration but at half the intended effect." },
    { min: 61, max: 65, tier: 1, name: "Sediment", effect: "Must be shaken or stirred before use or the first dose is inert." },
    { min: 66, max: 70, tier: 1, name: "Temperature", effect: "Target experiences an intense but harmless sensation of heat or cold for 1 round after use." },
    { min: 71, max: 75, tier: 1, name: "Wrong Sense", effect: "The effect is accompanied by an unexpected sensory experience on the target — sound instead of light, heat instead of pressure. The intended effect is still correct." },
    { min: 76, max: 80, tier: 1, name: "Sticky", effect: "Takes effect 2 rounds late but lingers 1 round longer than normal." },
    { min: 81, max: 85, tier: 1, name: "Photosensitive", effect: "Degrades immediately if exposed to direct light. Must be used in dim conditions or is ruined on the spot." },
    { min: 86, max: 90, tier: 1, name: "Reactive", effect: "Interacts visibly with any other alchemical substance within 1m, producing harmless but dramatic visual effects." },
    { min: 91, max: 95, tier: 1, name: "Extra Dose", effect: "An additional dose is produced but has a 50% chance of being inert, determined when used." },
    { min: 96, max: 100, tier: 1, name: "Wrong Form", effect: "Produced in an unexpected physical form — solid instead of liquid, gas instead of gel. Full potency, awkward delivery." },
    // Tier 2: Real Effects (101–200) — alternating positive/negative every 10
    { min: 101, max: 110, tier: 2, positive: true, name: "Exceptional Yield", effect: "Brew succeeds at full potency and produces 3 doses instead of 1." },
    { min: 111, max: 120, tier: 2, positive: false, name: "Contaminated", effect: "Brew works as intended but is also harmful to handle. The user takes (effects × 5) Acid damage on application, bypassing armour." },
    { min: 121, max: 130, tier: 2, positive: true, name: "Doubled Potency", effect: "Brew succeeds at double strength and double duration. No extra cost." },
    { min: 131, max: 140, tier: 2, positive: false, name: "Reversed", effect: "Brew is produced and looks correct but does the exact opposite of its intended function in every respect." },
    { min: 141, max: 150, tier: 2, positive: true, name: "Accidental Discovery", effect: "Brew produces its intended effect plus a second minor beneficial effect equivalent to a 1-effect ability. GM determines what." },
    { min: 151, max: 160, tier: 2, positive: false, name: "Unstable Compound", effect: "Brew is produced but detonates if significantly disturbed — dropped, struck in combat, or roughly handled. Explosion deals (effects × 5) Fire damage to everything within 3m. The carrier is not exempt." },
    { min: 161, max: 170, tier: 2, positive: true, name: "Perfect Formula", effect: "Brew succeeds at full potency. The alchemist fully internalises the recipe — all future brews of this type have no mishap chance." },
    { min: 171, max: 180, tier: 2, positive: false, name: "Contagion", effect: "Brew works as intended but becomes transmissible through touch for its duration. Anyone touching the target must pass an Endurance check or contract a half-potency version of the effect." },
    { min: 181, max: 190, tier: 2, positive: true, name: "Sympathetic Batch", effect: "Brew succeeds at full potency and automatically produces one additional dose that takes effect on a willing target of the alchemist's choice within sight, at half potency." },
    { min: 191, max: 200, tier: 2, positive: false, name: "Chain Reaction", effect: "Roll twice more on this 101–200 band (re-roll 191+). Apply both simultaneously." },
    // Tier 3: Brew Fails — Dangerous (201–250)
    { min: 201, max: 210, tier: 3, name: "Detonation", effect: "The mixture ignites violently. Everything within 5m takes (effects × 10) Fire damage; everything within 10m takes half. The workspace is destroyed." },
    { min: 211, max: 220, tier: 3, name: "Plague Brew", effect: "The brew mutates into an airborne contagion. All creatures within 20m must pass an Endurance check or contract a debilitating illness — GM determines symptoms, 1d4 days of rest to recover." },
    { min: 221, max: 230, tier: 3, name: "Corrosive Burst", effect: "The brew dissolves outward in a 5m radius Acid wave dealing (effects × 8) damage to all within. Surfaces and equipment in the area are permanently corroded." },
    { min: 231, max: 240, tier: 3, name: "Marked", effect: "The fumes permanently alter the alchemist's biology in a minor but irreversible way. GM determines the nature of the change. The alchemist is otherwise unharmed." },
    { min: 241, max: 250, tier: 3, name: "Internal Reaction", effect: "The brew reacts with the alchemist's own biology on contact. Every limb takes (effects × 8) damage bypassing all armour. Make a Survival Check for each limb brought to 0 HP or below." },
    // Tier 4: Not Everything Can Be Neutralised (250+)
    { min: 250, max: 250, tier: 4, name: "Reduction", effect: "The alchemist is reduced to their component biological materials, arranged very neatly. The materials are, individually, fine." },
    { min: 251, max: 265, tier: 4, name: "Transmutation", effect: "The alchemist's body is slowly converted to a different substance over the course of a week. The process is visible, gradual, and cannot be stopped. At the end: still aware. No longer biological." },
    { min: 266, max: 280, tier: 4, name: "The Perfect Formula", effect: "The alchemist has discovered something extraordinary and knows it with certainty. Sleep, food, and other people become secondary. The formula is real and remarkable. The alchemist will never willingly stop working on it." },
    { min: 281, max: 295, tier: 4, name: "Dissolution", effect: "The alchemist begins breaking down chemically over the following months — gradually, without pain, and with no known treatment. They remain fully conscious throughout." },
    { min: 296, max: 310, tier: 4, name: "The Substance", effect: "The alchemist has produced something that cannot be destroyed, contained, or understood. It has no known effect. It persists and grows slowly. The alchemist is compelled to keep adding to it. Neither they nor anyone else knows why." },
    { min: 311, max: Infinity, tier: 4, name: "The Reaction That Does Not Stop", effect: "The brew triggers a self-perpetuating reaction in local matter. The alchemist is the catalyst and cannot leave the affected radius. The radius is growing — slowly, measurably. The GM determines what the reaction produces. It is not destructive. It is not safe. It is simply ongoing." }
  ]
};
const PSYCHIC_MISHAP_TABLE = {
  tierNames: {
    1: "Purely Narrative",
    2: "Real Effects",
    3: "Extreme",
    4: "Past the Point of Thought"
  },
  entries: [
    // Tier 1: Purely Narrative (01–100)
    { min: 1, max: 5, tier: 1, name: "Nosebleed", effect: "Minor strain manifests physically. The caster's nose bleeds for a round." },
    { min: 6, max: 10, tier: 1, name: "Surface Thoughts", effect: "The caster accidentally broadcasts their current surface thoughts to anyone within 5m." },
    { min: 11, max: 15, tier: 1, name: "Static", effect: "A brief visual or auditory static overlays the caster's perception for a moment." },
    { min: 16, max: 20, tier: 1, name: "Déjà Vu", effect: "Everyone within 10m experiences an intense, simultaneous moment of déjà vu." },
    { min: 21, max: 25, tier: 1, name: "Phantom Touch", effect: "The caster briefly feels physical sensations from a random nearby creature." },
    { min: 26, max: 30, tier: 1, name: "Involuntary Glow", effect: "The caster's eyes glow faintly during the activation." },
    { min: 31, max: 35, tier: 1, name: "Memory Flash", effect: "A single inconsequential memory from a nearby creature flashes through the caster's mind uninvited." },
    { min: 36, max: 40, tier: 1, name: "Pressure", effect: "Everyone nearby briefly feels pressure behind their eyes, as if being watched from inside." },
    { min: 41, max: 45, tier: 1, name: "Ambient Hum", effect: "A low-frequency hum radiates from the caster for 1 round, audible up to 5m." },
    { min: 46, max: 50, tier: 1, name: "Emotional Bleed", effect: "The caster involuntarily feels the dominant emotion of the nearest creature for a moment." },
    { min: 51, max: 55, tier: 1, name: "Levitation Twitch", effect: "Small loose objects within 1m briefly float an inch before dropping." },
    { min: 56, max: 60, tier: 1, name: "Remote Sense", effect: "The caster momentarily perceives through the senses of a nearby creature for about 1 second." },
    { min: 61, max: 65, tier: 1, name: "Afterimage", effect: "The target leaves a brief psionic echo in the caster's vision for 1 round." },
    { min: 66, max: 70, tier: 1, name: "Involuntary Empathy", effect: "The caster knows exactly how every visible creature is currently feeling for 1 round." },
    { min: 71, max: 75, tier: 1, name: "Mental Echo", effect: "The caster hears the last thing a nearby creature thought, word for word, once." },
    { min: 76, max: 80, tier: 1, name: "Overtuned", effect: "The caster can hear conversations in adjacent rooms or around corners for 1 round." },
    { min: 81, max: 85, tier: 1, name: "Temporal Blip", effect: "The caster loses half a second of awareness. Nothing they could have prevented occurs." },
    { min: 86, max: 90, tier: 1, name: "Social Leak", effect: "The caster involuntarily mimics a gesture or expression from whoever they are mentally focused on." },
    { min: 91, max: 95, tier: 1, name: "Power Surge", effect: "The ability fires with a visible corona of psionic energy — impressive, adds nothing." },
    { min: 96, max: 100, tier: 1, name: "Feedback Squeal", effect: "A brief high-pitched tone audible only to psychically sensitive creatures radiates from the caster." },
    // Tier 2: Real Effects (101–200) — alternating positive/negative every 10
    { min: 101, max: 110, tier: 2, positive: true, name: "Psionic Echo", effect: "Ability fires at full effect, then fires again at half effect at the caster's next turn, retargeted by the caster." },
    { min: 111, max: 120, tier: 2, positive: false, name: "Mindburn", effect: "Ability fails. The strain turns inward — caster takes (cost × 10) Psychic damage to the Head, bypassing armour. The caster may spend resource after the mishap roll — each resource spent reduces this damage by 10." },
    { min: 121, max: 130, tier: 2, positive: true, name: "Amplified Signal", effect: "Ability fires at double all numerical values. No downside." },
    { min: 131, max: 140, tier: 2, positive: false, name: "Involuntary Reversal", effect: "Ability fires at full effect but strikes the caster instead of the intended target, as if they were the original target." },
    { min: 141, max: 150, tier: 2, positive: true, name: "Mental Clarity", effect: "Ability fires normally. Caster gains an additional activation this round." },
    { min: 151, max: 160, tier: 2, positive: false, name: "Neural Overload", effect: "The ability detonates at the caster's position. All creatures within 5m (including the caster) take (cost × 10) Psychic damage. The caster may spend resource after the mishap roll — each resource spent reduces this damage by 10 for all affected. Ability fails." },
    { min: 161, max: 170, tier: 2, positive: true, name: "Psionic Mastery", effect: "Ability fires normally. Caster's next 2 psychic ability rolls automatically succeed at maximum effect." },
    { min: 171, max: 180, tier: 2, positive: false, name: "Broadcast", effect: "The caster involuntarily transmits everything they are currently experiencing — sensory and emotional — to every creature within 20m for 1d4 rounds. They cannot filter or stop it. Ability fails." },
    { min: 181, max: 190, tier: 2, positive: true, name: "Expanded Reach", effect: "Ability fires normally and is duplicated in full at a second valid target of the caster's choosing." },
    { min: 191, max: 200, tier: 2, positive: false, name: "Cascade Meltdown", effect: "Roll twice more on this 101–200 band (re-roll 191+). Apply both simultaneously. Original ability fails." },
    // Tier 3: Extreme (201–250)
    { min: 201, max: 210, tier: 3, name: "Psionic Detonation", effect: "Uncontrolled psychic force erupts in a 10m radius. All creatures take (cost × 20) Psychic damage to the Head, bypassing armour. Caster takes double. The caster may spend resource after the mishap roll — each resource spent reduces this damage by 10 for all affected (the caster's doubled portion is reduced by 20 per resource spent). Make a Survival Check if brought to 0 HP. Ability fails." },
    { min: 211, max: 220, tier: 3, name: "Mind Fracture", effect: "The caster's psychic sense shatters outward. All creatures within 20m hear each other's surface thoughts in full for 1d4 rounds — no creature can successfully deceive another during this time. Caster takes (cost × 10) Psychic damage to the Head, bypassing armour. The caster may spend resource after the mishap roll — each resource spent reduces this damage by 10. Ability fires normally." },
    { min: 221, max: 230, tier: 3, name: "Psychic Void", effect: "A 15m radius zone of mental silence erupts from the caster. No psychic abilities may be used within it for 1d4+1 rounds; all ongoing psychic effects are immediately suppressed. Caster takes (cost × 10) to the Head. The caster may spend resource after the mishap roll — each resource spent reduces this damage by 10." },
    { min: 231, max: 240, tier: 3, name: "Consciousness Inversion", effect: "The caster's awareness is projected outward while their body acts on pure instinct. For 1d4 rounds, the GM controls the caster's body; the caster observes helplessly from outside it. Ability fails." },
    { min: 241, max: 250, tier: 3, name: "Identity Bleed", effect: "The caster's sense of self partially merges with every creature they have targeted with a psychic ability this combat. They experience all of these minds simultaneously. They retain their own identity, but will never be entirely alone in their thoughts again. Ability fails." },
    // Tier 4: Past the Point of Thought (250+)
    { min: 250, max: 250, tier: 4, name: "Ego Death", effect: "The caster's personality, memories, and identity are permanently erased. The body remains fully functional, inhabited by no one. No known method can restore what was there." },
    { min: 251, max: 265, tier: 4, name: "Gestalt", effect: "The caster's mind expands to absorb the consciousness of every creature within 50m. All become one shared mind. The caster's original identity is the most diluted. The collective has no intention of separating." },
    { min: 266, max: 280, tier: 4, name: "Eternal Broadcast", effect: "The caster becomes a permanent involuntary psychic beacon. Every thought is transmitted at full intensity to every psychically sensitive creature within 1km. They cannot stop it. They cannot sleep. Every private moment is public. Forever." },
    { min: 281, max: 295, tier: 4, name: "The Passenger", effect: "An entity that was apparently waiting for exactly this opportunity takes up residence in the caster's mind. The caster is still there. The entity does not leave. It occasionally makes observations." },
    { min: 296, max: 310, tier: 4, name: "Unravelling", effect: "The boundary between the caster and the minds around them begins to dissolve. Each day, a piece of someone else's identity replaces something of their own. Within a month, nothing original remains. The process is gradual enough to be fully conscious throughout." },
    { min: 311, max: Infinity, tier: 4, name: "The Open Wound", effect: "The caster's mind tears open a permanent two-way connection to whatever lies beyond consciousness. Things come through. The caster cannot close it. They do not come all at once. They are patient." }
  ]
};
const TAG_TO_TABLE = {
  divine: DIVINE_MISHAP_TABLE,
  psychic: PSYCHIC_MISHAP_TABLE,
  alchemy: ALCHEMY_MISHAP_TABLE
};
function getMishapTable(tag) {
  return TAG_TO_TABLE[tag] ?? null;
}
function getMishapEntry(roll, entries = MISHAP_TABLE) {
  if (roll <= 0) return entries[0];
  return entries.find((e2) => roll >= e2.min && roll <= e2.max) ?? entries[entries.length - 1];
}
function calculateMishapChance(effects, invokingTurns) {
  return effects * 15 - invokingTurns * 50;
}
function getMishapModifier(chance) {
  return Math.max(0, chance - 100);
}
const e = (s) => foundry.utils.escapeHTML(String(s ?? ""));
async function tamsUpdateMessage(message, updateData) {
  if (game.user.isGM || message.isAuthor) {
    try {
      return await message.update(updateData);
    } catch (err) {
      console.error("TAMS | Failed to update message", err);
    }
  }
  game.socket.emit("system.tams", {
    type: "updateMessage",
    messageId: message.id,
    userId: game.user.id,
    updateData
  });
}
async function getHitLocation(rollValue = null) {
  const raw = rollValue ?? (await new Roll("1d100").evaluate()).total;
  if (raw >= 96) return "Head";
  if (raw >= 56) return "Thorax";
  if (raw >= 41) return "Stomach";
  if (raw >= 31) return "Left Arm";
  if (raw >= 21) return "Right Arm";
  if (raw >= 11) return "Left Leg";
  return "Right Leg";
}
async function showCombinedInjuryDialog(target, pendingChecks) {
  let content = `<div class="tams-injury-dialog">
        <p><b>${target.name}</b> ${game.i18n.localize("TAMS.Checks.MustMakeChecks")}:</p>`;
  pendingChecks.forEach((check, i) => {
    if (check.type === "injured") {
      content += `
                <div class="check-row" style="border-bottom: 1px solid #ccc; padding: 5px 0; display: flex; justify-content: space-between; align-items: center;">
                    <label><b>${game.i18n.format("TAMS.Checks.InjuryCheck", { loc: check.loc })}</b> (DC ${check.dc})</label>
                    <button class="roll-check" data-index="${i}" style="width: 120px; font-size: 11px;">${game.i18n.localize("TAMS.Checks.RollVsInjury")}</button>
                </div>`;
    } else if (check.type === "crit") {
      content += `
                <div class="check-row" style="border-bottom: 1px solid #ccc; padding: 5px 0; display: flex; justify-content: space-between; align-items: center;">
                    <label><b>${game.i18n.format("TAMS.Checks.CritCheck", { loc: check.loc })}</b> (DC ${check.dc})</label>
                    <button class="roll-check" data-index="${i}" style="width: 120px; font-size: 11px;">${game.i18n.localize("TAMS.Checks.RollVsCrit")}</button>
                </div>`;
    } else if (check.type === "unconscious") {
      content += `
                <div class="check-row" style="background: rgba(52, 152, 219, 0.1); padding: 5px; margin-top: 5px; border: 1px solid #3498db; border-radius: 4px;">
                    <label><b>${game.i18n.localize("TAMS.Checks.UnconsciousCheck")}</b> (DC ${check.dc})</label>
                    <p style="font-size: 0.8em; margin: 2px 0;">${check.reasons.join("<br>")}</p>
                    <button class="roll-check" data-index="${i}" style="width: 100%; margin-top: 5px; background: #2980b9; color: white; font-size: 12px;">${game.i18n.localize("TAMS.Checks.RollStayAwake")}</button>
                </div>`;
    } else if (check.type === "survival") {
      content += `
                <div class="check-row" style="background: rgba(231, 76, 60, 0.1); padding: 5px; margin-top: 5px; border: 1px solid #e74c3c; border-radius: 4px;">
                    <label><b>${game.i18n.localize("TAMS.Checks.SurvivalCheck")}</b> (DC ${check.dc})</label>
                    <p style="font-size: 0.8em; margin: 2px 0;">${check.reasons.join("<br>")}</p>
                    <button class="roll-check" data-index="${i}" style="width: 100%; margin-top: 5px; background: #4a0000; color: white; font-size: 12px;">${game.i18n.localize("TAMS.Checks.RollSurvival")}</button>
                </div>`;
    } else if (check.type === "morale") {
      content += `
                <div class="check-row" style="background: rgba(52, 73, 94, 0.15); padding: 5px; margin-top: 5px; border: 1px solid #34495e; border-radius: 4px;">
                    <label><b>${game.i18n.localize("TAMS.Checks.MoraleCheck")}</b> — ${check.statusName ?? check.statusId} (DC ${check.dc})</label>
                    <button class="roll-check" data-index="${i}" style="width: 100%; margin-top: 5px; background: #34495e; color: white; font-size: 12px;">${game.i18n.localize("TAMS.Checks.RollMorale")}</button>
                </div>`;
    }
  });
  content += `</div>`;
  new Dialog({
    title: game.i18n.format("TAMS.Checks.InjuriesAndSurvival", { name: target.name }),
    content,
    buttons: { close: { label: game.i18n.localize("TAMS.Checks.Close") } },
    render: (html) => {
      html.find(".roll-check").click(async (ev) => {
        const btn = ev.currentTarget;
        const idx = parseInt(btn.dataset.index);
        const check = pendingChecks[idx];
        const statCap = check.type === "morale" ? target.system.stats.bravery.total : target.system.stats.endurance.total;
        let bonus = 0;
        if (check.type === "injured" || check.type === "crit") {
          bonus += target.system.injuryCheckBonus || 0;
        }
        const roll = await new Roll("1d100").evaluate();
        const raw = roll.total;
        const capped = Math.min(raw, statCap);
        const total = capped + bonus;
        const success = total >= check.dc;
        let report = "";
        if (check.type === "injured") {
          report = `
                        <div class="tams-roll">
                            <h3 class="roll-label" style="color: #f39c12;">${game.i18n.format("TAMS.Checks.EnduranceCheckInjury", { loc: check.loc })}</h3>
                            <div class="roll-row"><span>${game.i18n.localize("TAMS.Checks.Dice")}</span><span>${raw}</span></div>
                            <div class="roll-row"><span>${game.i18n.format("TAMS.Checks.Capped", { end: statCap })}</span><span>${capped}</span></div>
                            ${bonus ? `<div class="roll-row"><span>${game.i18n.localize("TAMS.Checks.RacialBonus")}</span><span>+${bonus}</span></div>` : ""}
                            <div class="roll-total">${game.i18n.format("TAMS.Checks.TotalVsDC", { total, dc: check.dc })}</div>
                            ${success ? `<div class="tams-success">${game.i18n.localize("TAMS.Checks.SuccessNotInjured")}</div>` : `<div class="tams-crit failure">${game.i18n.localize("TAMS.Checks.FailedInjured")}</div>`}
                        </div>
                    `;
          if (!success) {
            await target.update({ [`system.limbs.${check.limbKey}.injured`]: true });
          }
        } else if (check.type === "crit") {
          report = `
                        <div class="tams-roll">
                            <h3 class="roll-label">${game.i18n.format("TAMS.Checks.EnduranceCheck", { loc: check.loc })}</h3>
                            <div class="roll-row"><span>${game.i18n.localize("TAMS.Checks.Dice")}</span><span>${raw}</span></div>
                            <div class="roll-row"><span>${game.i18n.format("TAMS.Checks.Capped", { end: statCap })}</span><span>${capped}</span></div>
                            ${bonus ? `<div class="roll-row"><span>${game.i18n.localize("TAMS.Checks.RacialBonus")}</span><span>+${bonus}</span></div>` : ""}
                            <div class="roll-total">${game.i18n.format("TAMS.Checks.TotalVsDC", { total, dc: check.dc })}</div>
                            ${success ? `<div class="tams-success">${game.i18n.localize("TAMS.Checks.Success")}</div>` : `<div class="tams-crit failure">${game.i18n.localize("TAMS.Checks.FailedCrit")}</div>`}
                        </div>
                    `;
          if (!success) {
            await target.update({ [`system.limbs.${check.limbKey}.criticallyInjured`]: true });
          }
        } else if (check.type === "unconscious") {
          report = `
                        <div class="tams-roll" data-actor-uuid="${target.uuid}" data-actor-id="${target.id}" data-dc="${check.dc}" data-raw="${raw}" data-end="${statCap}" data-reasons='${JSON.stringify(check.reasons)}'>
                            <h3 class="roll-label" style="color: #2980b9;">${game.i18n.format("TAMS.Checks.UnconsciousCheckLabel", { name: target.name })}</h3>
                            <div class="roll-row"><span>${game.i18n.localize("TAMS.Checks.Dice")}</span><span>${raw}</span></div>
                            <div class="roll-row"><span>${game.i18n.format("TAMS.Checks.Capped", { end: statCap })}</span><span>${capped}</span></div>
                            <div class="roll-boost-container"></div>
                            <div class="roll-total">${game.i18n.format("TAMS.Checks.TotalVsDC", { total: capped, dc: check.dc })}</div>
                            ${success ? `<div class="tams-success" style="font-size:1.1em; font-weight:bold;">${game.i18n.localize("TAMS.Checks.RemainsConscious")}</div>` : `<div class="tams-crit failure" style="font-size:1.1em;">${game.i18n.localize("TAMS.Checks.FallsUnconscious")}</div>`}
                            <div class="roll-contest-hint"><small>${game.i18n.format("TAMS.Checks.Reasons", { reasons: check.reasons.join(", ") })}</small></div>
                            <div class="roll-row" style="margin-top: 5px;">
                                <button class="tams-boost-unconscious">${game.i18n.localize("TAMS.Checks.SpendResourceToBoost")}</button>
                            </div>
                        </div>
                    `;
        } else if (check.type === "morale") {
          report = `
                        <div class="tams-roll">
                            <h3 class="roll-label" style="color: #34495e;">${game.i18n.format("TAMS.Checks.MoraleCheckLabel", { name: target.name })}</h3>
                            <div class="roll-row"><span>${game.i18n.localize("TAMS.Checks.Dice")}</span><span>${raw}</span></div>
                            <div class="roll-row"><span>${game.i18n.format("TAMS.Checks.Capped", { end: statCap })}</span><span>${capped}</span></div>
                            <div class="roll-total">${game.i18n.format("TAMS.Checks.TotalVsDC", { total: capped, dc: check.dc })}</div>
                            ${success ? `<div class="tams-success" style="font-size:1.1em; font-weight:bold;">${game.i18n.format("TAMS.Checks.MoraleRecovery", { name: target.name })}</div>` : `<div class="tams-crit failure" style="font-size:1.1em;">${game.i18n.format("TAMS.Checks.MoraleStillAffected", { name: target.name, status: check.statusName ?? check.statusId })}</div>`}
                        </div>
                    `;
          if (success) {
            await target.toggleStatusEffect(check.statusId, { active: false });
          }
        } else {
          report = `
                        <div class="tams-roll" data-actor-uuid="${target.uuid}" data-actor-id="${target.id}" data-dc="${check.dc}" data-raw="${raw}" data-end="${statCap}">
                            <h3 class="roll-label" style="color: #8b0000;">${game.i18n.format("TAMS.Checks.SurvivalCheckLabel", { name: target.name })}</h3>
                            <div class="roll-row"><span>${game.i18n.localize("TAMS.Checks.Dice")}</span><span>${raw}</span></div>
                            <div class="roll-row"><span>${game.i18n.format("TAMS.Checks.Capped", { end: statCap })}</span><span>${capped}</span></div>
                            <div class="roll-boost-container"></div>
                            <div class="roll-total">${game.i18n.format("TAMS.Checks.TotalVsDC", { total: capped, dc: check.dc })}</div>
                            ${success ? `<div class="tams-success" style="font-size:1.2em; font-weight:bold;">${game.i18n.localize("TAMS.Checks.Survived")}</div>` : `<div class="tams-crit failure" style="font-size:1.2em;">${game.i18n.localize("TAMS.Checks.FatalInjury")}</div>`}
                            <div class="roll-row" style="margin-top: 5px;">
                                <button class="tams-boost-survival">${game.i18n.localize("TAMS.Checks.SpendResourceToBoost")}</button>
                            </div>
                        </div>
                    `;
        }
        ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: target }), content: report });
        btn.disabled = true;
        const passKey = { crit: "TAMS.Checks.CritAvoided", unconscious: "TAMS.Checks.Conscious", survival: "TAMS.Checks.SurvivalPass", morale: "TAMS.Checks.MoralePass" }[check.type];
        const failKey = { crit: "TAMS.Checks.CritWound", unconscious: "TAMS.Checks.Unconscious", survival: "TAMS.Checks.SurvivalFail", morale: "TAMS.Checks.MoraleFail" }[check.type];
        btn.innerText = success ? game.i18n.localize(passKey) : game.i18n.localize(failKey);
        btn.style.background = success ? "#2e7d32" : "#c62828";
      });
    }
  }).render(true);
}
function buildContestedCheckContent(initiatorName, label, initiatorTotal, initiatorRaw, contests) {
  const contestRows = contests.map((c) => {
    const win = c.total > initiatorTotal;
    const tie = c.total === initiatorTotal;
    const badge = tie ? `<span style="color:#888;">[TIE]</span>` : win ? `<span style="color:#2e7d32; font-weight:bold;">[WIN]</span>` : `<span style="color:#c0392b; font-weight:bold;">[LOSS]</span>`;
    return `<div class="roll-row" style="border-bottom:1px solid #eee; padding:2px 0;">
      <span style="flex:1;"><b>${c.actorName}</b> — ${c.label}</span>
      <span>${c.total} <small style="color:#888;">(raw: ${c.raw})</small> ${badge}</span>
    </div>`;
  }).join("");
  return `<div class="tams-roll tams-contested-check">
    <h3 class="roll-label">${game.i18n.format("TAMS.ContestedCheck.Title", { label })}</h3>
    <div class="roll-row" style="border-bottom:1px solid #eee; padding:2px 0;">
      <span style="flex:1;"><b>${initiatorName}</b> — ${label}</span>
      <span><b>${initiatorTotal}</b> <small style="color:#888;">(raw: ${initiatorRaw})</small></span>
    </div>
    ${contestRows}
    <div class="roll-row" style="margin-top:6px;">
      <button class="tams-contest-check-roll">${game.i18n.localize("TAMS.ContestedCheck.Contest")}</button>
    </div>
  </div>`;
}
async function tamsCreateContestedCheck(actor, label, total, raw, _roll, statId) {
  const content = buildContestedCheckContent(actor.name, label, total, raw, []);
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    flags: {
      tams: {
        isContestedCheck: true,
        initiatorId: actor.id,
        initiatorName: actor.name,
        label,
        initiatorTotal: total,
        initiatorRaw: raw,
        statId: statId ?? "strength",
        contests: []
      }
    }
  });
}
async function tamsHandleContestedCheckPending(msg) {
  var _a, _b, _c, _d;
  if (!((_b = (_a = msg.flags) == null ? void 0 : _a.tams) == null ? void 0 : _b.contestedCheckPending)) return;
  if (!game.user.isGM) return;
  const { targetMessageId, entry } = msg.flags.tams;
  const targetMsg = game.messages.get(targetMessageId);
  if (!targetMsg) return;
  const flags = (_c = targetMsg.flags) == null ? void 0 : _c.tams;
  if (!(flags == null ? void 0 : flags.isContestedCheck)) return;
  if ((_d = flags.contests) == null ? void 0 : _d.some((c) => c.actorId === entry.actorId)) return;
  const newContests = [...flags.contests ?? [], entry];
  await targetMsg.update({
    content: buildContestedCheckContent(flags.initiatorName, flags.label, flags.initiatorTotal, flags.initiatorRaw, newContests),
    "flags.tams.contests": newContests
  });
  await msg.delete();
}
function buildGroupCheckContent(label, difficulty, results) {
  const difficultyRow = difficulty > 0 ? `<div class="roll-row"><span>${game.i18n.localize("TAMS.GroupCheck.Difficulty")}:</span><span>${difficulty}</span></div>` : "";
  const resultsHtml = results.map((r) => {
    const passFailHtml = difficulty > 0 ? ` <b style="color:${r.success ? "#2e7d32" : "#c0392b"}">[${r.success ? game.i18n.localize("TAMS.GroupCheck.Pass") : game.i18n.localize("TAMS.GroupCheck.Fail")}]</b>` : "";
    const rollDisplay = r.raw !== void 0 && r.raw !== r.total ? `${r.raw} → ${r.total}` : `${r.total}`;
    return `<div class="roll-row"><span>${r.actorName}: <em>${r.skillName}</em></span><span class="roll-value">${rollDisplay}${passFailHtml}</span></div>`;
  }).join("");
  return `<div class="tams-roll tams-group-check">
    <h3 class="roll-label">${game.i18n.format("TAMS.GroupCheck.Title", { label })}</h3>
    ${difficultyRow}
    <hr>
    <div class="tams-group-check-results">${resultsHtml}</div>
    <div class="roll-row" style="margin-top:4px;"><button class="tams-group-check-roll">${game.i18n.localize("TAMS.GroupCheck.Join")}</button></div>
  </div>`;
}
async function tamsHandleGroupCheckPending(msg) {
  var _a, _b, _c, _d;
  if (!((_b = (_a = msg.flags) == null ? void 0 : _a.tams) == null ? void 0 : _b.groupCheckPending)) return;
  const { targetMessageId, entry, label, difficulty } = msg.flags.tams;
  const groupMsg = game.messages.get(targetMessageId);
  if (!groupMsg) {
    await msg.delete();
    return;
  }
  const existing = ((_d = (_c = groupMsg.flags) == null ? void 0 : _c.tams) == null ? void 0 : _d.results) ?? [];
  if (typeof entry.total !== "number" || typeof entry.raw !== "number" || entry.raw < 1 || entry.raw > 100 || Math.abs(entry.total) > 300) {
    console.warn("TAMS | groupCheck entry rejected: implausible roll values", entry);
    await msg.delete();
    return;
  }
  if (!existing.some((r) => r.actorId === entry.actorId)) {
    const newResults = [...existing, entry];
    await groupMsg.update({
      content: buildGroupCheckContent(label, difficulty, newResults),
      "flags.tams.results": newResults
    });
  }
  await msg.delete();
}
async function tamsCallGroupCheck() {
  var _a, _b, _c, _d;
  if (!game.user.isGM) return;
  const selectedTokens = (((_a = canvas == null ? void 0 : canvas.tokens) == null ? void 0 : _a.controlled) ?? []).filter((t) => t.actor);
  const skillNames = /* @__PURE__ */ new Set();
  for (const token of selectedTokens) {
    for (const item of token.actor.items) {
      if (item.type === "skill") skillNames.add(item.name);
    }
  }
  const statDefs = [
    { id: "stat:strength", label: game.i18n.localize("TAMS.StatStrength") },
    { id: "stat:dexterity", label: game.i18n.localize("TAMS.StatDexterity") },
    { id: "stat:endurance", label: game.i18n.localize("TAMS.StatEndurance") },
    { id: "stat:wisdom", label: game.i18n.localize("TAMS.StatWisdom") },
    { id: "stat:intelligence", label: game.i18n.localize("TAMS.StatIntelligence") },
    { id: "stat:bravery", label: game.i18n.localize("TAMS.StatBravery") }
  ];
  const statOptions = statDefs.map((s) => `<option value="${s.id}">${s.label}</option>`).join("");
  const skillOptions = [...skillNames].sort().map((n) => `<option value="skill:${n}">${n}</option>`).join("");
  const skillGroup = skillOptions ? `<optgroup label="${game.i18n.localize("TAMS.Skills")}">${skillOptions}</optgroup>` : "";
  const config = await new Promise((resolve) => {
    new Dialog({
      title: game.i18n.localize("TAMS.GroupCheck.CallForCheck"),
      content: `
        <div class="form-group">
          <label>${game.i18n.localize("TAMS.GroupCheck.Label")}</label>
          <input type="text" id="gc-label" placeholder="${game.i18n.localize("TAMS.GroupCheck.LabelPlaceholder")}"/>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("TAMS.GroupCheck.WhatToRoll")}</label>
          <select id="gc-roll">
            <optgroup label="${game.i18n.localize("TAMS.GroupCheck.Stats")}">${statOptions}</optgroup>
            ${skillGroup}
          </select>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("TAMS.GroupCheck.Difficulty")}</label>
          <input type="number" id="gc-difficulty" value="0" min="0"/>
        </div>
        ${selectedTokens.length > 0 ? `<p><small>${game.i18n.format("TAMS.GroupCheck.RollingFor", { count: selectedTokens.length })}</small></p>` : ""}
      `,
      buttons: {
        roll: {
          label: game.i18n.localize("TAMS.GroupCheck.RollAll"),
          callback: (html) => resolve({
            label: html.find("#gc-label").val().trim(),
            rollChoice: html.find("#gc-roll").val(),
            difficulty: parseInt(html.find("#gc-difficulty").val()) || 0
          })
        },
        cancel: { label: game.i18n.localize("TAMS.Cancel"), callback: () => resolve(null) }
      },
      default: "roll",
      close: () => resolve(null)
    }).render(true);
  });
  if (!config) return;
  const { rollChoice, difficulty } = config;
  const isStatRoll = rollChoice.startsWith("stat:");
  const statId = isStatRoll ? rollChoice.slice(5) : null;
  const skillName = !isStatRoll ? rollChoice.slice(6) : null;
  const rollLabel = config.label || (isStatRoll ? (_b = statDefs.find((s) => s.id === rollChoice)) == null ? void 0 : _b.label : skillName) || "";
  let fallbackStatId = "strength";
  if (!isStatRoll) {
    for (const token of selectedTokens) {
      const ref = token.actor.items.find((i) => i.type === "skill" && i.name.toLowerCase() === skillName.toLowerCase());
      if (ref) {
        fallbackStatId = ref.system.stat;
        break;
      }
    }
  }
  const results = [];
  for (const token of selectedTokens) {
    const actor = token.actor;
    if (isStatRoll) {
      const stat = actor.system.stats[statId];
      const effectiveStat = stat ? stat.value + (stat.mod || 0) : 0;
      const roll = await new Roll("1d100").evaluate();
      const raw = roll.total;
      const total = Math.min(raw, effectiveStat);
      results.push({
        actorId: actor.id,
        actorName: token.name,
        skillName: ((_c = statDefs.find((s) => s.id === rollChoice)) == null ? void 0 : _c.label) ?? statId,
        total,
        raw,
        success: difficulty > 0 ? total >= difficulty : null
      });
    } else {
      const skill = actor.items.find((i) => i.type === "skill" && i.name.toLowerCase() === skillName.toLowerCase());
      if (skill) {
        const sId = skill.system.stat;
        const stat = actor.system.stats[sId];
        const statValue = stat ? stat.value : 0;
        const statMod = stat ? stat.mod || 0 : 0;
        const fam = parseInt(skill.system.familiarity) || 0;
        const bonus = parseInt(skill.system.bonus) || 0;
        const roll = await new Roll("1d100").evaluate();
        const raw = roll.total;
        const capped = Math.min(raw, statValue + statMod);
        const total = capped + fam + bonus;
        await skill.update({ "system.usedInScene": true });
        results.push({
          actorId: actor.id,
          actorName: token.name,
          skillName: skill.name,
          total,
          raw,
          success: difficulty > 0 ? total >= difficulty : null
        });
      } else {
        const stat = actor.system.stats[fallbackStatId];
        const effectiveStat = stat ? stat.value + (stat.mod || 0) : 0;
        const roll = await new Roll("1d100").evaluate();
        const raw = roll.total;
        const total = Math.min(raw, effectiveStat);
        const statLabel = ((_d = statDefs.find((s) => s.id === `stat:${fallbackStatId}`)) == null ? void 0 : _d.label) ?? fallbackStatId;
        results.push({
          actorId: actor.id,
          actorName: token.name,
          skillName: statLabel,
          total,
          raw,
          success: difficulty > 0 ? total >= difficulty : null
        });
      }
    }
  }
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ alias: game.user.name }),
    content: buildGroupCheckContent(rollLabel, difficulty, results),
    flags: { tams: { isGroupCheck: true, label: rollLabel, difficulty, rollChoice, fallbackStatId, results } }
  });
}
const LIMB_KEYS = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
const DOT_GROUPS = [
  {
    tiers: [
      { id: "severe-bleeding", damage: 6, msgKey: "TAMS.TurnStart.SevereBleedingDamage" },
      { id: "bleeding", damage: 2, msgKey: "TAMS.TurnStart.BleedingDamage" }
    ],
    getLimb: () => "thorax",
    outKey: "TAMS.TurnStart.BledOut"
  },
  {
    tiers: [
      { id: "engulfed", damage: 8, msgKey: "TAMS.TurnStart.EngulfedDamage" },
      { id: "on-fire", damage: 3, msgKey: "TAMS.TurnStart.FireDamage" }
    ],
    getLimb: () => "head",
    outKey: "TAMS.TurnStart.BurnedOut"
  },
  {
    tiers: [
      { id: "severely-poisoned", damage: 5, msgKey: "TAMS.TurnStart.SeverePoisonDamage" },
      { id: "poisoned", damage: 2, msgKey: "TAMS.TurnStart.PoisonDamage" }
    ],
    getLimb: () => "thorax",
    outKey: "TAMS.TurnStart.PoisonedOut"
  },
  {
    tiers: [
      { id: "severely-irradiated", damage: 3, msgKey: "TAMS.TurnStart.SevereRadiationDamage", extraCheck: true },
      { id: "irradiated", damage: 1, msgKey: "TAMS.TurnStart.RadiationDamage" }
    ],
    getLimb: () => "thorax",
    outKey: "TAMS.TurnStart.RadiatedOut"
  },
  {
    tiers: [
      { id: "severe-acid-burn", damage: 5, msgKey: "TAMS.TurnStart.SevereAcidDamage" },
      { id: "acid-burn", damage: 2, msgKey: "TAMS.TurnStart.AcidDamage" }
    ],
    // Target the arm with lower current HP (most exposed)
    getLimb: (limbs) => {
      var _a, _b;
      const la = ((_a = limbs.leftArm) == null ? void 0 : _a.value) ?? Infinity;
      const ra = ((_b = limbs.rightArm) == null ? void 0 : _b.value) ?? Infinity;
      return la <= ra ? "leftArm" : "rightArm";
    },
    outKey: "TAMS.TurnStart.AcidOut"
  }
];
function getWhisperIds(actor) {
  const ownerIds = Object.entries(actor.ownership ?? {}).filter(([id, lvl]) => lvl >= 3 && id !== "default").map(([id]) => id);
  const gmIds = game.users.filter((u) => u.isGM).map((u) => u.id);
  return [.../* @__PURE__ */ new Set([...ownerIds, ...gmIds])];
}
async function tamsOnTurnStart(actor) {
  var _a, _b;
  if (!actor || actor.type !== "character") return;
  const dyingCountdown = actor.getFlag("tams", "dyingCountdown");
  if (dyingCountdown) {
    const turnsLeft = dyingCountdown.turnsLeft - 1;
    if (turnsLeft <= 0) {
      await actor.setFlag("tams", "dyingCountdown", null);
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `<div class="tams-roll"><div class="tams-crit failure" style="font-size:1.2em;font-weight:bold;">${game.i18n.format("TAMS.Dying.Death", { name: actor.name })}</div></div>`,
        whisper: getWhisperIds(actor)
      });
    } else {
      await actor.setFlag("tams", "dyingCountdown", { ...dyingCountdown, turnsLeft });
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `<div class="tams-roll"><div class="tams-crit failure">${game.i18n.format("TAMS.Dying.Countdown", { name: actor.name, turns: turnsLeft })}</div></div>`,
        whisper: getWhisperIds(actor)
      });
    }
  }
  const reactionUses = actor.getFlag("tams", "reactionUses") ?? {};
  if (Object.keys(reactionUses).length > 0) {
    await actor.setFlag("tams", "reactionUses", {});
  }
  const statusTracking = actor.getFlag("tams", "statusTracking") ?? {};
  if (Object.keys(statusTracking).length > 0 && game.combat) {
    const updatedTracking = { ...statusTracking };
    let trackingChanged = false;
    for (const [statusId, roundApplied] of Object.entries(statusTracking)) {
      const statusItem = actor.items.find((i) => i.type === "statusEffect" && i.system.statusId === statusId);
      if (statusItem && statusItem.system.durationRounds > 0 && game.combat.round >= roundApplied + statusItem.system.durationRounds) {
        await actor.toggleStatusEffect(statusId, { active: false });
        delete updatedTracking[statusId];
        trackingChanged = true;
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: `<div class="tams-roll"><div class="roll-row">${game.i18n.format("TAMS.StatusEffect.Expired", { name: actor.name, status: statusItem.name })}</div></div>`,
          whisper: getWhisperIds(actor)
        });
      }
    }
    if (trackingChanged) await actor.setFlag("tams", "statusTracking", updatedTracking);
  }
  const statuses = actor.statuses ?? /* @__PURE__ */ new Set();
  const allPendingChecks = [];
  const activeDotTiers = [];
  for (const group of DOT_GROUPS) {
    const tier = group.tiers.find((t) => statuses.has(t.id));
    if (!tier) continue;
    activeDotTiers.push({ ...tier, limbKey: group.getLimb(actor.system.limbs), outKey: group.outKey });
  }
  if (activeDotTiers.length > 0) {
    const limbDamage = {};
    for (const tier of activeDotTiers) {
      limbDamage[tier.limbKey] = (limbDamage[tier.limbKey] ?? 0) + tier.damage;
    }
    const limbNewValues = Object.fromEntries(
      Object.entries(limbDamage).map(([k, dmg]) => {
        var _a2;
        return [k, (((_a2 = actor.system.limbs[k]) == null ? void 0 : _a2.value) ?? 0) - dmg];
      })
    );
    const newTotalHp = LIMB_KEYS.reduce(
      (sum, k) => {
        var _a2;
        return sum + (limbNewValues[k] ?? ((_a2 = actor.system.limbs[k]) == null ? void 0 : _a2.value) ?? 0);
      },
      0
    );
    await actor.update(
      Object.fromEntries(Object.entries(limbNewValues).map(([k, v]) => [`system.limbs.${k}.value`, v]))
    );
    for (const tier of activeDotTiers) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `<div class="tams-roll"><div class="tams-crit failure">${game.i18n.format(tier.msgKey, { name: actor.name, damage: tier.damage })}</div></div>`
      });
    }
    if (activeDotTiers.find((t) => t.id === "severely-irradiated") && newTotalHp > 0) {
      allPendingChecks.push({
        type: "survival",
        dc: 30,
        reasons: [game.i18n.localize("TAMS.TurnStart.RadiationCheckReason")]
      });
    }
    if (newTotalHp <= 0) {
      await actor.toggleStatusEffect("unconscious", { active: true });
      let runningHp = LIMB_KEYS.reduce((sum, k) => {
        var _a2;
        return sum + (((_a2 = actor.system.limbs[k]) == null ? void 0 : _a2.value) ?? 0) + (limbDamage[k] ?? 0);
      }, 0);
      let outKey = activeDotTiers[0].outKey;
      for (const tier of activeDotTiers) {
        runningHp -= tier.damage;
        if (runningHp <= 0) {
          outKey = tier.outKey;
          break;
        }
      }
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `<div class="tams-roll"><div class="tams-crit failure" style="font-size:1.1em;font-weight:bold;">${game.i18n.format(outKey, { name: actor.name })}</div></div>`
      });
      const dc = Math.max(1, Math.abs(newTotalHp));
      allPendingChecks.push({
        type: "survival",
        dc,
        reasons: [game.i18n.localize("TAMS.TurnStart.KnockedOutReason")]
      });
    }
  }
  if (statuses.has("stunned")) {
    const whisper = getWhisperIds(actor);
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="tams-roll"><div class="tams-crit failure" style="font-size:1.1em;">${game.i18n.format("TAMS.TurnStart.StunnedReminder", { name: actor.name })}</div></div>`,
      whisper
    });
    await actor.toggleStatusEffect("stunned", { active: false });
  }
  if (statuses.has("frozen")) {
    const def = (_a = CONFIG.statusEffects) == null ? void 0 : _a.find((e2) => e2.id === "frozen");
    allPendingChecks.push({
      type: "morale",
      statusId: "frozen",
      statusName: def ? game.i18n.localize(def.name) : "Frozen",
      dc: 25
    });
  }
  if (statuses.has("fleeing")) {
    const def = (_b = CONFIG.statusEffects) == null ? void 0 : _b.find((e2) => e2.id === "fleeing");
    allPendingChecks.push({
      type: "morale",
      statusId: "fleeing",
      statusName: def ? game.i18n.localize(def.name) : "Fleeing",
      dc: 20
    });
  }
  const injuredLimbs = [], critLimbs = [];
  for (const key of LIMB_KEYS) {
    const limb = actor.system.limbs[key];
    if (!limb) continue;
    if (limb.criticallyInjured) critLimbs.push(limb.label);
    else if (limb.injured) injuredLimbs.push(limb.label);
  }
  const skipStatuses = /* @__PURE__ */ new Set(["encumbered", "stunned", "frozen", "fleeing"]);
  const activeStatusNames = [...statuses].filter((s) => !skipStatuses.has(s)).map((s) => {
    var _a2;
    const def = (_a2 = CONFIG.statusEffects) == null ? void 0 : _a2.find((e2) => e2.id === s);
    return def ? game.i18n.localize(def.name) : s;
  });
  if (injuredLimbs.length || critLimbs.length || activeStatusNames.length) {
    let content = `<div class="tams-roll"><h3 class="roll-label">${e(actor.name)}</h3>`;
    if (critLimbs.length)
      content += `<div class="tams-crit failure">${game.i18n.format("TAMS.TurnStart.CritReminder", { limbs: critLimbs.join(", ") })}</div>`;
    if (injuredLimbs.length)
      content += `<div class="roll-row"><span style="color:#f39c12;font-weight:bold;">${game.i18n.format("TAMS.TurnStart.InjuryReminder", { limbs: injuredLimbs.join(", ") })}</span></div>`;
    if (activeStatusNames.length)
      content += `<div class="roll-row"><span>${game.i18n.format("TAMS.TurnStart.StatusReminder", { statuses: activeStatusNames.join(", ") })}</span></div>`;
    content += `</div>`;
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content,
      whisper: getWhisperIds(actor)
    });
  }
  if (allPendingChecks.length > 0) showCombinedInjuryDialog(actor, allPendingChecks);
}
const TEMP_COMBAT_STATUSES = /* @__PURE__ */ new Set(["stunned", "fleeing", "frozen"]);
async function tamsOnCombatEnd(combat) {
  var _a;
  const gmIds = game.users.filter((u) => u.isGM).map((u) => u.id);
  const rows = [];
  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (!actor || actor.type !== "character") continue;
    const cleared = [];
    for (const id of TEMP_COMBAT_STATUSES) {
      if ((_a = actor.statuses) == null ? void 0 : _a.has(id)) {
        await actor.toggleStatusEffect(id, { active: false });
        cleared.push(id);
      }
    }
    if (actor.getFlag("tams", "dyingCountdown")) await actor.setFlag("tams", "dyingCountdown", null);
    const reactionUses = actor.getFlag("tams", "reactionUses") ?? {};
    if (Object.keys(reactionUses).length > 0) await actor.setFlag("tams", "reactionUses", {});
    const totalHp = LIMB_KEYS.reduce((sum, k) => {
      var _a2;
      return sum + (((_a2 = actor.system.limbs[k]) == null ? void 0 : _a2.value) ?? 0);
    }, 0);
    const persistentStatuses = [...actor.statuses ?? []].filter((s) => !TEMP_COMBAT_STATUSES.has(s) && s !== "encumbered").map((s) => {
      var _a2;
      const def = (_a2 = CONFIG.statusEffects) == null ? void 0 : _a2.find((e2) => e2.id === s);
      return def ? game.i18n.localize(def.name) : s;
    });
    let row = `<div style="margin: 4px 0; padding: 4px; border-bottom: 1px solid #444;">`;
    row += `<b>${e(actor.name)}</b> — HP: ${totalHp}`;
    if (persistentStatuses.length)
      row += `<br><span style="color:#e67e22;">${persistentStatuses.join(", ")}</span>`;
    if (cleared.length) {
      const clearedNames = cleared.map((id) => {
        var _a2;
        const def = (_a2 = CONFIG.statusEffects) == null ? void 0 : _a2.find((e2) => e2.id === id);
        return def ? game.i18n.localize(def.name) : id;
      });
      row += `<br><span style="color:#2e7d32;">${game.i18n.localize("TAMS.CombatEnd.Cleared")}: ${clearedNames.join(", ")}</span>`;
    }
    row += `</div>`;
    rows.push(row);
  }
  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (!actor || actor.type !== "character") continue;
    const updates = [];
    for (const item of actor.items) {
      if (item.type === "ability" && item.system.rechargeType === "combat" && item.system.uses.max > 0 && item.system.uses.value < item.system.uses.max) {
        updates.push({ _id: item.id, "system.uses.value": item.system.uses.max });
      }
    }
    if (updates.length > 0) await actor.updateEmbeddedDocuments("Item", updates);
  }
  if (rows.length === 0) return;
  const content = `
        <div class="tams-roll">
            <h3 class="roll-label">${game.i18n.localize("TAMS.CombatEnd.Title")}</h3>
            ${rows.join("")}
        </div>`;
  ChatMessage.create({ content, whisper: gmIds });
}
async function tamsRenderChatMessage(message, html, data) {
  const root = html instanceof jQuery ? html[0] : html;
  root.querySelectorAll(".tams-roll").forEach((container2) => {
    container2.querySelectorAll(".tams-behind-toggle").forEach((btn) => {
      btn.style.background = container2.classList.contains("behind-attack") ? "#2e7d32" : "#444";
    });
    container2.querySelectorAll(".tams-unaware-toggle").forEach((btn) => {
      btn.style.background = container2.classList.contains("unaware-defender") ? "#2e7d32" : "#444";
    });
  });
  root.querySelectorAll(".tams-group-check-roll").forEach((btn) => {
    var _a, _b;
    const actor = game.user.character ?? game.actors.find((a) => a.isOwner && a.type === "character");
    const existing = ((_b = (_a = message.flags) == null ? void 0 : _a.tams) == null ? void 0 : _b.results) ?? [];
    if (!actor) {
      btn.style.display = "none";
      return;
    }
    if (existing.some((r) => r.actorId === actor.id)) {
      btn.disabled = true;
      btn.textContent = game.i18n.localize("TAMS.GroupCheck.AlreadyRolled");
      return;
    }
    btn.textContent = game.i18n.format("TAMS.GroupCheck.JoinAs", { name: actor.name });
    btn.addEventListener("click", async (ev) => {
      var _a2, _b2, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
      ev.preventDefault();
      const currentActor = game.user.character ?? game.actors.find((a) => a.isOwner && a.type === "character");
      if (!currentActor) return ui.notifications.warn(game.i18n.localize("TAMS.GroupCheck.NoCharacter"));
      const currentExisting = ((_b2 = (_a2 = message.flags) == null ? void 0 : _a2.tams) == null ? void 0 : _b2.results) ?? [];
      if (currentExisting.some((r) => r.actorId === currentActor.id)) {
        return ui.notifications.info(game.i18n.localize("TAMS.GroupCheck.AlreadyRolled"));
      }
      const gmRollChoice = ((_d = (_c = message.flags) == null ? void 0 : _c.tams) == null ? void 0 : _d.rollChoice) ?? "stat:strength";
      const statLabels = {
        strength: game.i18n.localize("TAMS.StatStrength"),
        dexterity: game.i18n.localize("TAMS.StatDexterity"),
        endurance: game.i18n.localize("TAMS.StatEndurance"),
        wisdom: game.i18n.localize("TAMS.StatWisdom"),
        intelligence: game.i18n.localize("TAMS.StatIntelligence"),
        bravery: game.i18n.localize("TAMS.StatBravery")
      };
      const statDefs = Object.entries(statLabels).map(([id, label2]) => ({ id: `stat:${id}`, label: label2 }));
      const actorSkills = currentActor.items.filter((i) => i.type === "skill").sort((a, b) => a.name.localeCompare(b.name)).map((i) => ({ id: `skill:${i.name}`, label: i.name }));
      const statOptions = statDefs.map(
        (s) => `<option value="${s.id}" ${gmRollChoice === s.id ? "selected" : ""}>${s.label}</option>`
      ).join("");
      const skillOptions = actorSkills.map(
        (s) => `<option value="${s.id}" ${gmRollChoice === s.id ? "selected" : ""}>${s.label}</option>`
      ).join("");
      const skillGroup = skillOptions ? `<optgroup label="${game.i18n.localize("TAMS.Skills")}">${skillOptions}</optgroup>` : "";
      const chosenRollChoice = await new Promise((resolve) => {
        new Dialog({
          title: game.i18n.localize("TAMS.GroupCheck.JoinTitle"),
          content: `<div class="form-group">
              <label>${game.i18n.localize("TAMS.GroupCheck.WhatToRoll")}</label>
              <select id="gc-player-roll">
                <optgroup label="${game.i18n.localize("TAMS.GroupCheck.Stats")}">${statOptions}</optgroup>
                ${skillGroup}
              </select>
            </div>`,
          buttons: {
            roll: { label: game.i18n.localize("TAMS.GroupCheck.RollAll"), callback: (html2) => resolve(html2.find("#gc-player-roll").val()) },
            cancel: { label: game.i18n.localize("TAMS.Cancel"), callback: () => resolve(null) }
          },
          default: "roll",
          close: () => resolve(null)
        }).render(true);
      });
      if (!chosenRollChoice) return;
      const isStatRoll = chosenRollChoice.startsWith("stat:");
      let total, raw, skillDisplayName;
      if (isStatRoll) {
        const sId = chosenRollChoice.slice(5);
        const stat = currentActor.system.stats[sId];
        const effectiveStat = stat ? stat.value + (stat.mod || 0) : 0;
        const roll = await new Roll("1d100").evaluate();
        raw = roll.total;
        total = Math.min(raw, effectiveStat);
        skillDisplayName = statLabels[sId] ?? sId;
      } else {
        const skillName = chosenRollChoice.slice(6);
        const skill = currentActor.items.find((i) => i.type === "skill" && i.name.toLowerCase() === skillName.toLowerCase());
        if (skill) {
          const sId = skill.system.stat;
          const stat = currentActor.system.stats[sId];
          const statValue = stat ? stat.value : 0;
          const statMod = stat ? stat.mod || 0 : 0;
          const fam = parseInt(skill.system.familiarity) || 0;
          const bonus = parseInt(skill.system.bonus) || 0;
          const roll = await new Roll("1d100").evaluate();
          raw = roll.total;
          const capped = Math.min(raw, statValue + statMod);
          total = capped + fam + bonus;
          skillDisplayName = skill.name;
          await skill.update({ "system.usedInScene": true });
        } else {
          const sId = gmRollChoice.startsWith("stat:") ? gmRollChoice.slice(5) : ((_f = (_e = message.flags) == null ? void 0 : _e.tams) == null ? void 0 : _f.fallbackStatId) ?? "strength";
          const stat = currentActor.system.stats[sId];
          const effectiveStat = stat ? stat.value + (stat.mod || 0) : 0;
          const roll = await new Roll("1d100").evaluate();
          raw = roll.total;
          total = Math.min(raw, effectiveStat);
          skillDisplayName = statLabels[sId] ?? sId;
        }
      }
      const difficulty = ((_h = (_g = message.flags) == null ? void 0 : _g.tams) == null ? void 0 : _h.difficulty) ?? 0;
      const label = ((_j = (_i = message.flags) == null ? void 0 : _i.tams) == null ? void 0 : _j.label) ?? "";
      const existing2 = ((_l = (_k = message.flags) == null ? void 0 : _k.tams) == null ? void 0 : _l.results) ?? [];
      if (existing2.some((r) => r.actorId === currentActor.id)) {
        return ui.notifications.info(game.i18n.localize("TAMS.GroupCheck.AlreadyRolled"));
      }
      const newEntry = {
        actorId: currentActor.id,
        actorName: currentActor.name,
        skillName: skillDisplayName,
        total,
        raw,
        success: difficulty > 0 ? total >= difficulty : null
      };
      const newResults = [...existing2, newEntry];
      if (game.user.isGM || message.isAuthor) {
        await message.update({
          content: buildGroupCheckContent(label, difficulty, newResults),
          "flags.tams.results": newResults
        });
      } else {
        const gmIds = game.users.filter((u) => u.isGM).map((u) => u.id);
        await ChatMessage.create({
          whisper: gmIds,
          content: "",
          speaker: ChatMessage.getSpeaker({ actor: currentActor }),
          flags: {
            tams: {
              groupCheckPending: true,
              targetMessageId: message.id,
              entry: newEntry,
              label,
              difficulty
            }
          }
        });
        ui.notifications.info(game.i18n.localize("TAMS.GroupCheck.Submitted"));
      }
    });
  });
  root.querySelectorAll(".tams-contest-check-roll").forEach((btn) => {
    var _a, _b, _c, _d;
    const flags = (_a = message.flags) == null ? void 0 : _a.tams;
    if (!(flags == null ? void 0 : flags.isContestedCheck)) return;
    if (game.user.isGM) {
      btn.textContent = game.i18n.localize("TAMS.ContestedCheck.Contest");
    } else {
      const actor = ((_c = (_b = canvas.tokens) == null ? void 0 : _b.controlled[0]) == null ? void 0 : _c.actor) ?? game.user.character ?? game.actors.find((a) => a.isOwner && a.type === "character");
      if (!actor) {
        btn.style.display = "none";
        return;
      }
      if (actor.id === flags.initiatorId) {
        btn.disabled = true;
        btn.textContent = game.i18n.localize("TAMS.ContestedCheck.YourRoll");
        return;
      }
      if ((_d = flags.contests) == null ? void 0 : _d.some((c) => c.actorId === actor.id)) {
        btn.disabled = true;
        btn.textContent = game.i18n.localize("TAMS.ContestedCheck.AlreadyContested");
        return;
      }
      btn.textContent = game.i18n.format("TAMS.ContestedCheck.ContestAs", { name: actor.name });
    }
    btn.addEventListener("click", async (ev) => {
      var _a2, _b2, _c2, _d2;
      ev.preventDefault();
      const currentFlags = (_a2 = message.flags) == null ? void 0 : _a2.tams;
      let currentActor;
      if (game.user.isGM) {
        const contested = new Set(((currentFlags == null ? void 0 : currentFlags.contests) ?? []).map((c) => c.actorId));
        const eligible = game.actors.filter((a) => a.type === "character" && a.id !== (currentFlags == null ? void 0 : currentFlags.initiatorId) && !contested.has(a.id));
        if (!eligible.length) return ui.notifications.warn(game.i18n.localize("TAMS.ContestedCheck.NoCharacter"));
        const actorOptions = eligible.map((a) => `<option value="${a.id}">${a.name}</option>`).join("");
        currentActor = await new Promise((resolve) => {
          new Dialog({
            title: game.i18n.localize("TAMS.ContestedCheck.DialogTitle"),
            content: `<div class="form-group">
                <label>${game.i18n.localize("TAMS.ContestedCheck.ChooseActor")}</label>
                <select id="cc-actor-choice">${actorOptions}</select>
              </div>`,
            buttons: {
              ok: { label: game.i18n.localize("TAMS.ContestedCheck.Roll"), callback: (html2) => resolve(game.actors.get(html2.find("#cc-actor-choice").val())) },
              cancel: { label: game.i18n.localize("TAMS.Cancel"), callback: () => resolve(null) }
            },
            default: "ok",
            close: () => resolve(null)
          }).render(true);
        });
      } else {
        currentActor = ((_c2 = (_b2 = canvas.tokens) == null ? void 0 : _b2.controlled[0]) == null ? void 0 : _c2.actor) ?? game.user.character ?? game.actors.find((a) => a.isOwner && a.type === "character");
      }
      if (!currentActor) return ui.notifications.warn(game.i18n.localize("TAMS.ContestedCheck.NoCharacter"));
      if ((_d2 = currentFlags == null ? void 0 : currentFlags.contests) == null ? void 0 : _d2.some((c) => c.actorId === currentActor.id)) {
        return ui.notifications.info(game.i18n.localize("TAMS.ContestedCheck.AlreadyContested"));
      }
      const suggestedStatId = (currentFlags == null ? void 0 : currentFlags.statId) ?? "strength";
      const statLabels = {
        strength: game.i18n.localize("TAMS.StatStrength"),
        dexterity: game.i18n.localize("TAMS.StatDexterity"),
        endurance: game.i18n.localize("TAMS.StatEndurance"),
        wisdom: game.i18n.localize("TAMS.StatWisdom"),
        intelligence: game.i18n.localize("TAMS.StatIntelligence"),
        bravery: game.i18n.localize("TAMS.StatBravery")
      };
      const statOptions = Object.entries(statLabels).map(
        ([id, lbl]) => `<option value="stat:${id}" ${suggestedStatId === id ? "selected" : ""}>${lbl}</option>`
      ).join("");
      const actorSkills = currentActor.items.filter((i) => i.type === "skill").sort((a, b) => a.name.localeCompare(b.name));
      const skillOptions = actorSkills.map((s) => `<option value="skill:${s.name}">${s.name}</option>`).join("");
      const skillGroup = skillOptions ? `<optgroup label="${game.i18n.localize("TAMS.Skills")}">${skillOptions}</optgroup>` : "";
      const chosenRollChoice = await new Promise((resolve) => {
        new Dialog({
          title: game.i18n.localize("TAMS.ContestedCheck.DialogTitle"),
          content: `<div class="form-group">
              <label>${game.i18n.localize("TAMS.ContestedCheck.WhatToRoll")}</label>
              <select id="cc-roll-choice">
                <optgroup label="${game.i18n.localize("TAMS.GroupCheck.Stats")}">${statOptions}</optgroup>
                ${skillGroup}
              </select>
            </div>`,
          buttons: {
            roll: { label: game.i18n.localize("TAMS.ContestedCheck.Roll"), callback: (html2) => resolve(html2.find("#cc-roll-choice").val()) },
            cancel: { label: game.i18n.localize("TAMS.Cancel"), callback: () => resolve(null) }
          },
          default: "roll",
          close: () => resolve(null)
        }).render(true);
      });
      if (!chosenRollChoice) return;
      let total, raw, skillDisplayName;
      if (chosenRollChoice.startsWith("stat:")) {
        const sId = chosenRollChoice.slice(5);
        const stat = currentActor.system.stats[sId];
        const effectiveStat = stat ? stat.value + (stat.mod || 0) + (stat.traitBonus || 0) : 0;
        const contestRoll = await new Roll("1d100").evaluate();
        raw = contestRoll.total;
        total = sId === "bravery" ? effectiveStat - raw : Math.min(raw, effectiveStat);
        skillDisplayName = statLabels[sId] ?? sId;
      } else {
        const skillName = chosenRollChoice.slice(6);
        const skill = currentActor.items.find((i) => i.type === "skill" && i.name.toLowerCase() === skillName.toLowerCase());
        if (skill) {
          const sId = skill.system.stat;
          const stat = currentActor.system.stats[sId];
          const statValue = stat ? stat.value : 0;
          const statMod = stat ? (stat.mod || 0) + (stat.traitBonus || 0) : 0;
          const fam = parseInt(skill.system.familiarity) || 0;
          const bonus = parseInt(skill.system.bonus) || 0;
          const contestRoll = await new Roll("1d100").evaluate();
          raw = contestRoll.total;
          total = sId === "bravery" ? statValue + statMod + fam + bonus - raw : Math.min(raw, statValue + statMod) + fam + bonus;
          skillDisplayName = skill.name;
          await skill.update({ "system.usedInScene": true });
        } else {
          const stat = currentActor.system.stats[suggestedStatId];
          const effectiveStat = stat ? stat.value + (stat.mod || 0) : 0;
          const contestRoll = await new Roll("1d100").evaluate();
          raw = contestRoll.total;
          total = Math.min(raw, effectiveStat);
          skillDisplayName = statLabels[suggestedStatId] ?? suggestedStatId;
        }
      }
      const { initiatorName, label, initiatorTotal, initiatorRaw, contests: existing } = currentFlags;
      if (existing == null ? void 0 : existing.some((c) => c.actorId === currentActor.id)) {
        return ui.notifications.info(game.i18n.localize("TAMS.ContestedCheck.AlreadyContested"));
      }
      const newEntry = { actorId: currentActor.id, actorName: currentActor.name, label: skillDisplayName, total, raw };
      const newContests = [...existing ?? [], newEntry];
      if (game.user.isGM || message.isAuthor) {
        await message.update({
          content: buildContestedCheckContent(initiatorName, label, initiatorTotal, initiatorRaw, newContests),
          "flags.tams.contests": newContests
        });
      } else {
        const gmIds = game.users.filter((u) => u.isGM).map((u) => u.id);
        await ChatMessage.create({
          whisper: gmIds,
          content: "",
          speaker: ChatMessage.getSpeaker({ actor: currentActor }),
          flags: { tams: { contestedCheckPending: true, targetMessageId: message.id, entry: newEntry } }
        });
        ui.notifications.info(game.i18n.localize("TAMS.ContestedCheck.Submitted"));
      }
    });
  });
  root.querySelectorAll(".tams-save-button").forEach((btn) => {
    btn.addEventListener("click", async (ev) => {
      var _a, _b, _c, _d, _e;
      ev.preventDefault();
      const saveAgainst = btn.dataset.saveAgainst;
      const abilityName = btn.dataset.abilityName ?? "";
      const msgId = (_a = btn.closest("[data-message-id]")) == null ? void 0 : _a.dataset.messageId;
      const originMsg = game.messages.get(msgId);
      const dc = ((_c = (_b = originMsg == null ? void 0 : originMsg.flags) == null ? void 0 : _b.tams) == null ? void 0 : _c.saveDC) ?? parseInt(btn.dataset.dc);
      const actor = ((_e = (_d = canvas.tokens) == null ? void 0 : _d.controlled[0]) == null ? void 0 : _e.actor) ?? game.user.character ?? game.actors.find((a) => a.isOwner && a.type === "character");
      if (!actor || !actor.isOwner) return ui.notifications.warn(game.i18n.localize("TAMS.Save.NoActor"));
      const STAT_KEYS = /* @__PURE__ */ new Set(["strength", "dexterity", "endurance", "wisdom", "intelligence", "bravery"]);
      const statLabels = {
        strength: game.i18n.localize("TAMS.StatStrength"),
        dexterity: game.i18n.localize("TAMS.StatDexterity"),
        endurance: game.i18n.localize("TAMS.StatEndurance"),
        wisdom: game.i18n.localize("TAMS.StatWisdom"),
        intelligence: game.i18n.localize("TAMS.StatIntelligence"),
        bravery: game.i18n.localize("TAMS.StatBravery")
      };
      const roll = await new Roll("1d100").evaluate();
      const raw = roll.total;
      let total, saveLabel;
      if (STAT_KEYS.has(saveAgainst)) {
        const stat = actor.system.stats[saveAgainst];
        const statValue = stat ? stat.value + (stat.mod || 0) + (stat.traitBonus || 0) : 0;
        total = Math.min(raw, statValue);
        saveLabel = statLabels[saveAgainst] ?? saveAgainst;
      } else {
        const skill = actor.items.find((i) => i.type === "skill" && i.name.toLowerCase() === saveAgainst.toLowerCase());
        if (skill) {
          const sId = skill.system.stat;
          const stat = actor.system.stats[sId];
          const statValue = stat ? stat.value + (stat.mod || 0) + (stat.traitBonus || 0) : 0;
          const fam = parseInt(skill.system.familiarity) || 0;
          const bonus = parseInt(skill.system.bonus) || 0;
          total = Math.min(raw, statValue) + fam + bonus;
          saveLabel = skill.name;
          await skill.update({ "system.usedInScene": true });
        } else {
          total = raw;
          saveLabel = saveAgainst;
        }
      }
      const success = total >= dc;
      const report = `
          <div class="tams-roll">
            <h3 class="roll-label">${e(actor.name)}: ${game.i18n.format("TAMS.Save.Title", { ability: e(abilityName) })}</h3>
            <div class="roll-row"><span>${game.i18n.localize("TAMS.Checks.Dice")}</span><span>${raw}</span></div>
            <div class="roll-row"><span>${e(saveLabel)} ${game.i18n.localize("TAMS.Save.CheckLabel")}</span><span>${total}</span></div>
            <div class="roll-total">${game.i18n.format("TAMS.Checks.TotalVsDC", { total, dc })}</div>
            ${success ? `<div class="tams-success">${game.i18n.localize("TAMS.Save.Success")}</div>` : `<div class="tams-crit failure">${game.i18n.localize("TAMS.Save.Failure")}</div>`}
          </div>
        `;
      await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: report });
    });
  });
  root.querySelectorAll(".tams-take-damage").forEach((el) => el.addEventListener("click", async (ev) => {
    var _a, _b;
    ev.preventDefault();
    const btn = ev.currentTarget;
    const damageBase = parseInt(btn.dataset.damage);
    const armourPen = parseInt(btn.dataset.armourPen) || 0;
    const multiLocations = btn.dataset.locations ? JSON.parse(btn.dataset.locations) : null;
    const locations = multiLocations || (btn.dataset.location ? [btn.dataset.location] : []);
    let target = null;
    const targetTokenId = btn.dataset.targetTokenId;
    const targetActorId = btn.dataset.targetActorId;
    const targetActorUuid = btn.dataset.targetActorUuid;
    if (targetActorUuid) target = fromUuidSync(targetActorUuid);
    if (!target && targetTokenId) {
      const token = canvas.tokens.get(targetTokenId);
      if (token) target = token.actor;
    }
    if (!target && targetActorId) target = game.actors.get(targetActorId);
    if (!target) target = ((_a = canvas.tokens.controlled[0]) == null ? void 0 : _a.actor) ?? null;
    if (!target) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.SelectTargetDamage"));
    const locationMap = {
      "Head": "head",
      "Thorax": "thorax",
      "Stomach": "stomach",
      "Left Arm": "leftArm",
      "Right Arm": "rightArm",
      "Left Leg": "leftLeg",
      "Right Leg": "rightLeg"
    };
    const isAoEHit = btn.dataset.isAoe === "1";
    const forceCrit = btn.dataset.forceCrit === "1";
    const isSquadOrHorde = ((_b = target.system.settings) == null ? void 0 : _b.isNPC) && (target.system.settings.npcType === "squad" || target.system.settings.npcType === "horde");
    let initialMultiplier = 1;
    let squadHtml = "";
    if (isAoEHit && isSquadOrHorde) {
      const typeLabel = target.system.settings.npcType.toUpperCase();
      const currentSize = target.system.settings.squadSize || 1;
      initialMultiplier = target.system.settings.npcType === "squad" ? Math.min(2, currentSize) : Math.min(4, currentSize);
      squadHtml = `
            <div class="form-group" style="margin-bottom: 10px;">
                <label>${game.i18n.format("TAMS.Combat.TargetsHitInSquad", { type: typeLabel, max: currentSize })}</label>
                <input type="number" id="aoe-targets-hit" value="${initialMultiplier}" min="1" max="${currentSize}"/>
                <p style="color: #d35400; font-size: 0.85em;"><i>${game.i18n.localize("TAMS.Combat.EachHitMultipliedHint")}</i></p>
            </div>
          `;
    }
    const defaultDmg = damageBase * initialMultiplier;
    const coverHtml = `
        <div class="form-group" style="margin-bottom: 10px; border-bottom: 1px solid #666; padding-bottom: 10px;">
            <label>${game.i18n.localize("TAMS.Combat.Cover")}</label>
            <div class="flexrow">
                <select id="cover-select">
                    <option value="0">${game.i18n.localize("TAMS.None")}</option>
                    <option value="10">${game.i18n.localize("TAMS.Combat.CoverLight")}</option>
                    <option value="20">${game.i18n.localize("TAMS.Combat.CoverMedium")}</option>
                    <option value="30">${game.i18n.localize("TAMS.Combat.CoverHeavy")}</option>
                    <option value="custom">${game.i18n.localize("TAMS.Combat.CoverCustom")}</option>
                </select>
                <input type="number" id="cover-custom" value="0" style="display:none; width: 60px; margin-left: 5px;"/>
            </div>
        </div>
      `;
    let dialogContent = `<p>${game.i18n.format("TAMS.Combat.ApplyingHitsTo", { count: locations.length, name: target.name })}</p>${squadHtml}${coverHtml}`;
    locations.forEach((loc, i) => {
      const limbKey = locationMap[loc];
      const limb = target.system.limbs[limbKey];
      const armor = Math.floor((limb == null ? void 0 : limb.armor) || 0);
      const armorMax = Math.floor((limb == null ? void 0 : limb.armorMax) || 0);
      dialogContent += `
            <div class="form-group" style="margin-bottom: 5px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">
                <label>${game.i18n.format("TAMS.Combat.HitLabel", { index: i + 1, location: loc })}</label>
                <div class="flexrow">
                    <span>${game.i18n.localize("TAMS.Combat.DmgShort")} </span><input type="number" class="hit-dmg" data-index="${i}" value="${defaultDmg}" style="width: 50px;"/>
                    <span>${game.i18n.localize("TAMS.Combat.ArmorShort")} ${armor}/${armorMax}</span>
                    <label style="flex: 0 0 auto; margin-left: 10px;">
                        <input type="checkbox" class="hit-in-cover" data-index="${i}"> ${game.i18n.localize("TAMS.Combat.InCover")}
                    </label>
                </div>
            </div>`;
    });
    new Dialog({
      title: game.i18n.format("TAMS.Checks.ApplyDamageTo", { name: target.name }),
      content: dialogContent,
      render: (html2) => {
        const updateDamage = () => {
          const multiplier = isAoEHit && isSquadOrHorde ? parseInt(html2.find("#aoe-targets-hit").val()) || 1 : 1;
          const coverSelect = html2.find("#cover-select").val();
          let coverVal = 0;
          if (coverSelect === "custom") {
            html2.find("#cover-custom").show();
            coverVal = parseInt(html2.find("#cover-custom").val()) || 0;
          } else {
            html2.find("#cover-custom").hide();
            coverVal = parseInt(coverSelect) || 0;
          }
          html2.find(".hit-dmg").each(function() {
            const idx = $(this).data("index");
            const isCovered = html2.find(`.hit-in-cover[data-index="${idx}"]`).is(":checked");
            let effectiveBaseDmg = damageBase;
            if (isCovered) {
              effectiveBaseDmg = Math.max(0, effectiveBaseDmg - coverVal);
            }
            $(this).val(effectiveBaseDmg * multiplier);
          });
        };
        html2.find("#aoe-targets-hit, #cover-select, #cover-custom").on("input change", updateDamage);
        html2.find(".hit-in-cover").on("change", updateDamage);
      },
      buttons: {
        apply: {
          label: game.i18n.localize("TAMS.Checks.ApplyAllHits"),
          callback: async (html2) => {
            var _a2;
            const multiplier = isAoEHit && isSquadOrHorde ? parseInt(html2.find("#aoe-targets-hit").val()) || 1 : 1;
            const dmgInputs = html2.find(".hit-dmg");
            const hits = [];
            for (let i = 0; i < locations.length; i++) {
              const totalIncoming = Math.floor(parseFloat(dmgInputs[i].value) || 0);
              const subHits = isAoEHit && isSquadOrHorde ? multiplier : 1;
              let remainingDmg = totalIncoming;
              for (let m = 0; m < subHits; m++) {
                const incoming = Math.floor(remainingDmg / (subHits - m));
                remainingDmg -= incoming;
                if (incoming <= 0 && m > 0) continue;
                const loc = isAoEHit && isSquadOrHorde && (m > 0 || i > 0) ? await getHitLocation() : locations[i];
                hits.push({ location: loc, damage: incoming, armourPen, damageType: btn.dataset.damageType || "", forceCrit: forceCrit ? "1" : "0" });
              }
            }
            const { pendingChecks, report } = await target.applyDamage(hits, { isAoE: isAoEHit, multiplier });
            ChatMessage.create({ content: report });
            if (pendingChecks.length > 0) showCombinedInjuryDialog(target, pendingChecks);
            const inflictsStatusId = message.getFlag("tams", "inflictsStatusId");
            if (inflictsStatusId && hits.length > 0) {
              await target.toggleStatusEffect(inflictsStatusId, { active: true });
              const currentTracking = await target.getFlag("tams", "statusTracking") ?? {};
              await target.setFlag("tams", "statusTracking", {
                ...currentTracking,
                [inflictsStatusId]: ((_a2 = game.combat) == null ? void 0 : _a2.round) ?? 0
              });
            }
          }
        }
      },
      default: "apply"
    }).render(true);
  }));
  root.querySelectorAll(".tams-apply-if-cost").forEach((el) => el.addEventListener("click", async (ev) => {
    ev.preventDefault();
    const btn = ev.currentTarget;
    const cost = parseInt(btn.dataset.cost) || 0;
    const resourceKey = btn.dataset.resource || "stamina";
    const actorUuid = btn.dataset.actorUuid;
    const label = btn.dataset.label;
    if (!actorUuid) return;
    const actor = await fromUuid(actorUuid);
    if (!actor) return;
    if (!actor.isOwner) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NoPermission"));
    if (resourceKey === "stamina") {
      const current = actor.system.stamina.value;
      if (current < cost) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NotEnoughStamina"));
      await actor.update({ "system.stamina.value": current - cost });
    } else {
      const idx = parseInt(resourceKey);
      const res = actor.system.customResources[idx];
      if (res) {
        if (res.value < cost) {
          const remaining = cost - res.value;
          const stamina = actor.system.stamina.value;
          if (stamina < remaining) return ui.notifications.warn(game.i18n.format("TAMS.Checks.Notifications.NotEnoughResOrStamina", { resource: res.name }));
          const useBoth = await new Promise((resolve) => {
            new Dialog({
              title: game.i18n.localize("TAMS.Combat.InsufficientResources"),
              content: `<p>${game.i18n.format("TAMS.Combat.InsufficientResourcesContent", { val: res.value, res: res.name, rem: remaining })}</p>`,
              buttons: {
                yes: { label: game.i18n.localize("TAMS.Yes"), callback: () => resolve(true) },
                no: { label: game.i18n.localize("TAMS.No"), callback: () => resolve(false) }
              },
              default: "yes",
              close: () => resolve(false)
            }).render(true);
          });
          if (!useBoth) return;
          const resources = foundry.utils.duplicate(actor.system.customResources);
          resources[idx].value = 0;
          await actor.update({
            "system.customResources": resources,
            "system.stamina.value": stamina - remaining
          });
        } else {
          const resources = foundry.utils.duplicate(actor.system.customResources);
          resources[idx].value -= cost;
          await actor.update({ "system.customResources": resources });
        }
      }
    }
    ui.notifications.info(`Applied cost for: ${label}`);
    btn.disabled = true;
    btn.innerText = "Applied";
  }));
  root.querySelectorAll(".tams-mishap-check").forEach((el) => el.addEventListener("click", async (ev) => {
    var _a, _b;
    ev.preventDefault();
    const btn = ev.currentTarget;
    const actorUuid = btn.dataset.actorUuid;
    let totalEffects = parseInt(btn.dataset.effects);
    const castTime = btn.dataset.castTime ?? "immediate";
    const mishapTag = btn.dataset.mishapTag ?? "magic";
    const mishapTableObj = getMishapTable(mishapTag);
    const mishapEntries = mishapTableObj ? mishapTableObj.entries : MISHAP_TABLE;
    const actor = actorUuid ? await fromUuid(actorUuid) : null;
    const effectsRow = totalEffects < 0 ? `<div class="form-group"><label>${game.i18n.localize("TAMS.Mishap.EffectsPrompt")}</label><input type="number" id="mishap-effects" value="1" min="0"/></div>` : `<input type="hidden" id="mishap-effects" value="${totalEffects}"/>`;
    const oneTurnChecked = castTime === "1turn" ? "checked" : "";
    const result = await new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize("TAMS.Mishap.DialogTitle"),
        content: `${effectsRow}
                    <div class="form-group"><label>${game.i18n.localize("TAMS.Mishap.OneTurnCast")} (−100%)</label><input type="checkbox" id="mishap-oneturn" ${oneTurnChecked}/></div>
                    <div class="form-group"><label>${game.i18n.localize("TAMS.Mishap.TurnsPrompt")} (−50% each)</label><input type="number" id="mishap-turns" value="0" min="0"/></div>
                    <div class="form-group"><label>${game.i18n.localize("TAMS.CalculatorOptions.ReducedMishap")} (+2 cost, −60%)</label><input type="checkbox" id="mishap-reduced"/></div>`,
        buttons: {
          roll: { label: game.i18n.localize("TAMS.Mishap.RollButton"), callback: (html2) => resolve({ effects: parseInt(html2.find("#mishap-effects").val()) || 0, oneTurn: html2.find("#mishap-oneturn").is(":checked"), turns: parseInt(html2.find("#mishap-turns").val()) || 0, reduced: html2.find("#mishap-reduced").is(":checked") }) },
          cancel: { label: game.i18n.localize("TAMS.Cancel"), callback: () => resolve(null) }
        },
        default: "roll"
      }).render(true);
    });
    if (!result) return;
    totalEffects = result.effects;
    const invokingTurns = result.turns;
    let chance = calculateMishapChance(totalEffects, invokingTurns);
    if (result.oneTurn) chance -= 100;
    if (result.reduced) chance -= 60;
    chance = Math.max(0, chance);
    const chanceParts = [`${totalEffects} effects × 15% = ${totalEffects * 15}%`];
    if (invokingTurns > 0) chanceParts.push(`${invokingTurns} invoking × −50% = −${invokingTurns * 50}%`);
    if (result.oneTurn) chanceParts.push(`1 Turn cast: −100%`);
    if (result.reduced) chanceParts.push(`Reduced Mishap: −60%`);
    chanceParts.push(`<b>Final: ${chance}%</b>`);
    const chanceBreakdown = chanceParts.join(" | ");
    if (chance <= 0) {
      ChatMessage.create({
        speaker: actor ? ChatMessage.getSpeaker({ actor }) : {},
        content: `<div class="tams-roll"><h3 class="roll-label">${game.i18n.localize("TAMS.Mishap.Title")}</h3><div class="roll-row"><small>${chanceBreakdown}</small></div><div class="roll-row">${game.i18n.localize("TAMS.Mishap.NoChance")}</div></div>`
      });
      return;
    }
    if (chance < 100) {
      const occurrenceRoll = await new Roll("1d100").evaluate();
      if (occurrenceRoll.total > chance) {
        ChatMessage.create({
          speaker: actor ? ChatMessage.getSpeaker({ actor }) : {},
          content: `<div class="tams-roll"><h3 class="roll-label">${game.i18n.localize("TAMS.Mishap.Title")}</h3><div class="roll-row"><small>${chanceBreakdown}</small></div><div class="roll-row">${game.i18n.format("TAMS.Mishap.NoProcDisplay", { roll: occurrenceRoll.total, chance })}</div></div>`,
          rolls: [occurrenceRoll]
        });
        btn.disabled = true;
        btn.innerText = game.i18n.localize("TAMS.Mishap.Rolled");
        return;
      }
    }
    const modifier = getMishapModifier(chance);
    const roll = await new Roll(`1d100 + ${modifier}`).evaluate();
    const rollTotal = roll.total;
    const entry = getMishapEntry(rollTotal, mishapEntries);
    const tierColors = { 1: "#2e7d32", 2: "#e65100", 3: "#b71c1c", 4: "#4a148c" };
    const tierNames = mishapTableObj ? mishapTableObj.tierNames : {
      1: game.i18n.localize("TAMS.Mishap.Tier1"),
      2: game.i18n.localize("TAMS.Mishap.Tier2"),
      3: game.i18n.localize("TAMS.Mishap.Tier3"),
      4: game.i18n.localize("TAMS.Mishap.Tier4")
    };
    const tierColor = tierColors[entry.tier] ?? "#333";
    const tierName = tierNames[entry.tier] ?? `Tier ${entry.tier}`;
    const positiveTag = entry.positive === true ? ` <span style="color:#2e7d32;">(+)</span>` : entry.positive === false ? ` <span style="color:#b71c1c;">(-)</span>` : "";
    const content = `
            <div class="tams-roll">
                <h3 class="roll-label" style="color:${tierColor};">${game.i18n.localize("TAMS.Mishap.Title")}</h3>
                <div class="roll-row"><small>${chanceBreakdown}</small></div>
                ${modifier > 0 ? `<div class="roll-row"><small>Roll modifier: +${modifier} (chance exceeded 100%)</small></div>` : ""}
                <div class="roll-row"><span>Roll:</span><span class="roll-value">${((_b = (_a = roll.dice[0]) == null ? void 0 : _a.results[0]) == null ? void 0 : _b.result) ?? "?"} ${modifier > 0 ? `+ ${modifier}` : ""} = ${rollTotal}</span></div>
                <hr>
                <div class="roll-total" style="color:${tierColor};">${e(tierName)}${positiveTag}: <b>${e(entry.name)}</b></div>
                <div class="roll-description" style="margin-top:4px;">${e(entry.effect)}</div>
            </div>
        `;
    ChatMessage.create({
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : {},
      content,
      rolls: [roll]
    });
    btn.disabled = true;
    btn.innerText = game.i18n.localize("TAMS.Mishap.Rolled");
  }));
  root.querySelectorAll(".tams-apply-downtime").forEach((el) => el.addEventListener("click", async (ev) => {
    ev.preventDefault();
    const btn = ev.currentTarget;
    const days = parseInt(btn.dataset.days) || 0;
    const actors = canvas.tokens.controlled.map((t) => t.actor).filter((a) => a);
    if (actors.length === 0) {
      return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.SelectTokensDowntime"));
    }
    let count = 0;
    for (let actor of actors) {
      if (actor.system.downtime !== void 0) {
        await actor.update({ "system.downtime.days": days });
        count++;
      }
    }
    ui.notifications.info(game.i18n.format("TAMS.Checks.Notifications.DowntimeApplied", { days, count }));
  }));
  root.querySelectorAll(".tams-dodge").forEach((el) => el.addEventListener("click", async (ev) => {
    var _a;
    ev.preventDefault();
    const btn = ev.currentTarget;
    const attackerRaw = parseInt(btn.dataset.raw);
    const attackerTotal = parseInt(btn.dataset.total);
    const attackerMulti = parseInt(btn.dataset.multi) || 1;
    const attackerDamage = parseInt(btn.dataset.damage) || 0;
    const attackerArmourPen = parseInt(btn.dataset.armourPen) || 0;
    const attackerDamageType = btn.dataset.damageType || "";
    const firstLocation = btn.dataset.location;
    const attackerLocations = btn.dataset.locations ? JSON.parse(btn.dataset.locations) : firstLocation ? [firstLocation] : [];
    const targetLimb = btn.dataset.targetLimb;
    const isAoEFromData = btn.dataset.isAoe === "1";
    const container2 = btn.closest(".tams-roll");
    const isBehind = (container2 == null ? void 0 : container2.classList.contains("behind-attack")) || false;
    const isUnaware = (container2 == null ? void 0 : container2.classList.contains("unaware-defender")) || false;
    let actor = null;
    const targetTokenId = btn.dataset.targetTokenId;
    const targetActorId = btn.dataset.targetActorId;
    if (targetTokenId) {
      const token = canvas.tokens.get(targetTokenId);
      if (token) actor = token.actor;
    }
    if (!actor && targetActorId) actor = game.actors.get(targetActorId);
    if (!actor) actor = ((_a = canvas.tokens.controlled[0]) == null ? void 0 : _a.actor) ?? null;
    if (!actor) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.SelectTargetDodge"));
    const dex = actor.system.stats.dexterity;
    let cap = dex.total;
    if (isBehind) cap = Math.floor(cap * (actor.system.behindMult ?? 0.5));
    if (isUnaware) cap = Math.floor(cap * 0.5);
    const roll = await new Roll("1d100").evaluate();
    const raw = roll.total;
    const capped = Math.min(raw, cap);
    const total = capped;
    let critInfo = "";
    if (raw >= attackerRaw * 2) {
      critInfo = `<div class="tams-crit success">${game.i18n.format("TAMS.Combat.CriticalDodge", { name: e(actor.name) })}</div>`;
    } else if (attackerRaw >= raw * 2) {
      critInfo = `<div class="tams-crit failure">${game.i18n.format("TAMS.Combat.CriticalHitTaken", { name: e(actor.name) })}</div>`;
    }
    let hitsScored = 0;
    let damageInfo = "";
    if (attackerTotal > total) {
      hitsScored = Math.min(1 + Math.floor((attackerTotal - total) / 5), attackerMulti);
      const locations = [];
      const limbOptions = { "head": "Head", "thorax": "Thorax", "stomach": "Stomach", "leftArm": "Left Arm", "rightArm": "Right Arm", "leftLeg": "Left Leg", "rightLeg": "Right Leg" };
      for (let i = 0; i < hitsScored; i++) {
        locations.push(attackerLocations[i] || (targetLimb && targetLimb !== "none" ? limbOptions[targetLimb] : await getHitLocation()));
      }
      damageInfo = `
            <div class="roll-row"><b>${game.i18n.localize("TAMS.Combat.HitsTaken")} ${hitsScored} / ${attackerMulti}</b></div>
            <div class="roll-row"><small>${game.i18n.localize("TAMS.Location")}: ${locations.join(", ")}</small></div>
            <div class="roll-row" style="margin-top: 5px;">
                <button class="tams-take-damage" data-damage="${attackerDamage}" data-armour-pen="${attackerArmourPen}" data-damage-type="${attackerDamageType}" data-locations='${JSON.stringify(locations)}' data-is-aoe="${isAoEFromData ? "1" : "0"}">${game.i18n.localize("TAMS.Combat.TakeDamage")}</button>
            </div>
          `;
      if (!critInfo) critInfo = `<div class="tams-failure">${game.i18n.format("TAMS.Combat.DodgeFailed", { total: attackerTotal })}</div>`;
    } else {
      if (!critInfo) critInfo = `<div class="tams-success">${game.i18n.format("TAMS.Combat.DodgeSuccess", { total: attackerTotal })}</div>`;
    }
    const msg = `
        <div class="tams-roll" data-actor-uuid="${actor.uuid}" data-actor-id="${actor.id}" data-attacker-total="${attackerTotal}" data-attacker-raw="${attackerRaw}" data-attacker-multi="${attackerMulti}" data-attacker-damage="${attackerDamage}" data-attacker-armour-pen="${attackerArmourPen}" data-attacker-damage-type="${attackerDamageType}" data-first-location="${attackerLocations[0] || ""}" data-target-limb="${targetLimb}" data-raw="${raw}" data-capped="${capped}" data-unaware="${isUnaware ? "1" : "0"}" data-is-aoe="${isAoEFromData ? "1" : "0"}">
          <h3 class="roll-label">${game.i18n.format("TAMS.Combat.DodgeWith", { name: e(actor.name) })} ${isBehind ? "(Behind)" : ""} ${isUnaware ? "(Unaware)" : ""}</h3>
          <div class="roll-crit-info">${critInfo}</div>
          <div class="roll-hits-info">${damageInfo}</div>
          <div class="roll-row"><span>${game.i18n.localize("TAMS.Combat.RawDiceResult")}</span><span class="roll-value">${raw}</span></div>
          <div class="roll-row"><small>${game.i18n.format("TAMS.Combat.StatCapLabel", { name: "Dex", value: cap })}</small><span>${capped}</span></div>
          <div class="roll-boost-container"></div>
          <hr>
          <div class="roll-total">${game.i18n.localize("TAMS.Total")}: <b>${total}</b></div>
          ${attackerTotal > total && actor.type === "character" ? `
            <div class="roll-row" style="margin-top: 5px;">
                <button class="tams-boost-dodge">${game.i18n.localize("TAMS.Checks.SpendResourceToBoost")}</button>
            </div>
          ` : ""}
          <div class="roll-contest-hint">
            <small><b>${game.i18n.localize("TAMS.Combat.ContestLabel")}</b> Total vs Attacker Total (${attackerTotal})</small><br>
            <small><b>${game.i18n.localize("TAMS.Combat.CritCheckLabel")}</b> Raw vs Attacker Raw (${attackerRaw})</small>
          </div>
        </div>`;
    ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: msg, rolls: [roll] });
  }));
  root.querySelectorAll(".tams-boost-dodge").forEach((el) => el.addEventListener("click", async (ev) => {
    var _a;
    ev.preventDefault();
    const btn = ev.currentTarget;
    const container2 = btn.closest(".tams-roll");
    const attackerTotal = parseInt(container2.dataset.attackerTotal);
    const actorId = container2.dataset.actorId;
    const actorUuid = container2.dataset.actorUuid;
    const raw = parseInt(container2.dataset.raw);
    const capped = parseInt(container2.dataset.capped);
    const actor = fromUuidSync(actorUuid) || game.actors.get(actorId);
    if (!actor || !actor.isOwner) return;
    const isUnawareFromData = container2.dataset.unaware === "1";
    const pointsNeeded = Math.max(0, Math.ceil((attackerTotal - capped) / 5));
    const resources = [{ id: "stamina", name: game.i18n.localize("TAMS.Stamina"), value: actor.system.stamina.value }];
    actor.system.customResources.forEach((res, idx) => {
      resources.push({ id: idx.toString(), name: res.name, value: res.value });
    });
    const options = resources.map((r) => `<option value="${r.id}">${r.name} (${r.value} ${game.i18n.localize("TAMS.AvailableShort")})</option>`).join("");
    const spending = await new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize("TAMS.Combat.BoostDodgeTitle"),
        content: `
            <div class="form-group"><label>${game.i18n.localize("TAMS.Combat.Resource")}</label><select id="res-type">${options}</select></div>
            <div class="form-group">
                <label>${game.i18n.localize("TAMS.Combat.PointsSpentMax10")}</label>
                <input type="number" id="res-points" value="${Math.min(pointsNeeded, 10)}" min="0" max="10"/>
                <p><small>${game.i18n.localize("TAMS.Combat.BoostDodgeHint")}</small></p>
                <p><i>${pointsNeeded > 0 ? game.i18n.format("TAMS.Combat.MinToDodge", { points: pointsNeeded }) : game.i18n.localize("TAMS.Combat.AlreadyDodged")}</i></p>
            </div>
            <div class="form-group">
                <label>${game.i18n.localize("TAMS.Combat.UnawareCheckbox")}</label>
                <input type="checkbox" id="unaware" ${isUnawareFromData ? "checked" : ""}/>
            </div>`,
        buttons: {
          go: { label: game.i18n.localize("TAMS.Combat.ApplyBoost"), callback: (html2) => {
            const resId2 = html2.find("#res-type").val();
            const res = resources.find((r) => r.id === resId2);
            let requestedPoints = Math.clamp(parseInt(html2.find("#res-points").val()) || 0, 0, 10);
            if (requestedPoints > res.value) requestedPoints = res.value;
            resolve({ resId: resId2, points: requestedPoints, unaware: html2.find("#unaware").is(":checked") });
          } },
          cancel: { label: game.i18n.localize("TAMS.Cancel"), callback: () => resolve(null) }
        },
        default: "go"
      }).render(true);
    });
    if (!spending) return;
    const { resId, points, unaware } = spending;
    const bonus = points * 5;
    if (points > 0) {
      if (resId === "stamina") {
        await actor.update({ "system.stamina.value": actor.system.stamina.value - points });
      } else {
        const idx = parseInt(resId);
        const customResources = foundry.utils.duplicate(actor.system.customResources);
        customResources[idx].value -= points;
        await actor.update({ "system.customResources": customResources });
      }
    }
    let finalCapped = capped;
    if (unaware) finalCapped = Math.floor(finalCapped * 0.5);
    const total = finalCapped + bonus;
    let critInfo = "";
    let hitsScored = 0;
    let damageInfo = "";
    const attackerMulti = parseInt(container2.dataset.attackerMulti) || 1;
    const attackerRaw = parseInt(container2.dataset.attackerRaw);
    const attackerDamage = parseInt(container2.dataset.attackerDamage) || 0;
    const attackerArmourPen = parseInt(container2.dataset.attackerArmourPen) || 0;
    const attackerDamageType = container2.dataset.attackerDamageType || "";
    const firstLocation = container2.dataset.firstLocation;
    const targetLimb = container2.dataset.targetLimb;
    const isAoEFromData = container2.dataset.isAoe === "1";
    if (raw >= attackerRaw * 2) {
      critInfo = `<div class="tams-crit success">${game.i18n.format("TAMS.Combat.CriticalDodge", { name: e(actor.name) })}</div>`;
    } else if (attackerRaw >= raw * 2) {
      critInfo = `<div class="tams-crit failure">${game.i18n.format("TAMS.Combat.CriticalHitTaken", { name: e(actor.name) })}</div>`;
    }
    if (attackerTotal > total) {
      hitsScored = Math.min(1 + Math.floor((attackerTotal - total) / 5), attackerMulti);
      const locations = [firstLocation];
      const limbOptions = { "head": "Head", "thorax": "Thorax", "stomach": "Stomach", "leftArm": "Left Arm", "rightArm": "Right Arm", "leftLeg": "Left Leg", "rightLeg": "Right Leg" };
      for (let i = 1; i < hitsScored; i++) {
        locations.push(targetLimb && targetLimb !== "none" ? limbOptions[targetLimb] : await getHitLocation());
      }
      damageInfo = `
            <div class="roll-row"><b>${game.i18n.localize("TAMS.Combat.HitsTaken")} ${hitsScored} / ${attackerMulti}</b></div>
            <div class="roll-row"><small>${game.i18n.localize("TAMS.Location")}: ${locations.join(", ")}</small></div>
            <div class="roll-row" style="margin-top: 5px;">
                <button class="tams-take-damage" data-damage="${attackerDamage}" data-armour-pen="${attackerArmourPen}" data-damage-type="${attackerDamageType}" data-locations='${JSON.stringify(locations)}' data-is-aoe="${isAoEFromData ? "1" : "0"}">${game.i18n.localize("TAMS.Combat.TakeDamage")}</button>
            </div>
          `;
      if (!critInfo) critInfo = `<div class="tams-failure">${game.i18n.format("TAMS.Combat.DodgeFailed", { total: attackerTotal })}</div>`;
    } else {
      if (!critInfo) critInfo = `<div class="tams-success">${game.i18n.format("TAMS.Combat.DodgeSuccess", { total: attackerTotal })}</div>`;
    }
    const boostHtml = `<div class="roll-row"><small>${game.i18n.localize("TAMS.Combat.BoostLabel")}</small><span>+${bonus}</span></div>`;
    if (unaware) {
      const labelEl = container2.querySelector(".roll-label");
      if (!labelEl.innerText.includes("(Unaware)")) labelEl.innerText += " (Unaware)";
      container2.querySelectorAll(".roll-row")[1].innerHTML = `<span>${game.i18n.format("TAMS.Combat.StatCapLabel", { name: "Unaware", value: finalCapped })}</span><span>${finalCapped}</span>`;
    }
    container2.querySelector(".roll-boost-container").innerHTML = boostHtml;
    container2.querySelector(".roll-total b").innerText = total;
    container2.querySelector(".roll-hits-info").innerHTML = damageInfo;
    container2.querySelector(".roll-crit-info").innerHTML = critInfo;
    const messageId = (_a = btn.closest(".chat-message")) == null ? void 0 : _a.dataset.messageId;
    btn.remove();
    const message2 = game.messages.get(messageId);
    if (message2) await tamsUpdateMessage(message2, { content: container2.outerHTML });
  }));
  root.querySelectorAll(".tams-retaliate").forEach((el) => el.addEventListener("click", async (ev) => {
    var _a, _b, _c, _d;
    ev.preventDefault();
    const btn = ev.currentTarget;
    const attackerRaw = parseInt(btn.dataset.raw);
    const attackerTotal = parseInt(btn.dataset.total);
    const attackerMulti = parseInt(btn.dataset.multi) || 1;
    const attackerDamage = parseInt(btn.dataset.damage) || 0;
    const attackerArmourPen = parseInt(btn.dataset.armourPen) || 0;
    const attackerDamageType = btn.dataset.damageType || "";
    const isRanged = btn.dataset.isRanged === "1";
    const firstLocation = btn.dataset.location;
    const attackerLocations = btn.dataset.locations ? JSON.parse(btn.dataset.locations) : firstLocation ? [firstLocation] : [];
    const attackerTargetLimb = btn.dataset.targetLimb;
    const isAoEFromData = btn.dataset.isAoe === "1";
    const attackerName = btn.dataset.attackerName || "";
    const container2 = btn.closest(".tams-roll");
    const isBehind = (container2 == null ? void 0 : container2.classList.contains("behind-attack")) || false;
    const isUnaware = (container2 == null ? void 0 : container2.classList.contains("unaware-defender")) || false;
    let actor = null;
    const targetTokenId = btn.dataset.targetTokenId;
    const targetActorId = btn.dataset.targetActorId;
    if (targetTokenId) {
      const token = canvas.tokens.get(targetTokenId);
      if (token) actor = token.actor;
    }
    if (!actor && targetActorId) actor = game.actors.get(targetActorId);
    if (!actor) actor = ((_a = canvas.tokens.controlled[0]) == null ? void 0 : _a.actor) ?? null;
    if (!actor) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.SelectTargetRetaliate"));
    const weapons = actor.items.filter((i) => i.type === "weapon" || i.type === "ability" && i.system.isReaction && i.system.isAttack);
    if (!weapons.length) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NoValidWeapons"));
    const options = weapons.map((w) => `<option value="${w.id}">${w.name} (${w.type === "ability" ? "Ability" : "Weapon"}, Fam ${w.system.familiarity || 0})</option>`).join("");
    let chosenId = await new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize("TAMS.Combat.ChooseWeaponRetaliate"),
        content: `<div class="form-group"><label>${game.i18n.localize("TAMS.Weapon")}</label><select id="ret-weapon">${options}</select></div>`,
        buttons: { go: { label: game.i18n.localize("TAMS.Combat.RetaliateButton"), callback: (html2) => resolve(html2.find("#ret-weapon").val()) } },
        default: "go"
      }).render(true);
    });
    const weapon = actor.items.get(chosenId);
    if (!weapon) return;
    if (weapon.type === "ability") {
      const cost = parseInt(weapon.system.cost) || 0;
      if (!weapon.system.isApex && cost > 0) {
        const resourceKey = weapon.system.resource;
        if (resourceKey === "stamina") {
          if (actor.system.stamina.value < cost) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NotEnoughStamina"));
          await actor.update({ "system.stamina.value": actor.system.stamina.value - cost });
        } else {
          const idx = parseInt(resourceKey);
          const res = actor.system.customResources[idx];
          if (res) {
            if (res.value < cost) {
              const remaining = cost - res.value;
              if (actor.system.stamina.value < remaining) return ui.notifications.warn(game.i18n.format("TAMS.Checks.Notifications.NotEnoughResOrStamina", { resource: res.name }));
              const useBoth = await new Promise((resolve) => {
                new Dialog({
                  title: game.i18n.localize("TAMS.Combat.InsufficientResources"),
                  content: `<p>${game.i18n.format("TAMS.Combat.InsufficientResourcesContent", { val: res.value, res: res.name, rem: remaining })}</p>`,
                  buttons: { yes: { label: game.i18n.localize("TAMS.Yes"), callback: () => resolve(true) }, no: { label: game.i18n.localize("TAMS.No"), callback: () => resolve(false) } },
                  default: "yes",
                  close: () => resolve(false)
                }).render(true);
              });
              if (!useBoth) return;
              const resources = foundry.utils.duplicate(actor.system.customResources);
              resources[idx].value = 0;
              await actor.update({ "system.customResources": resources, "system.stamina.value": actor.system.stamina.value - remaining });
            } else {
              const resources = foundry.utils.duplicate(actor.system.customResources);
              resources[idx].value -= cost;
              await actor.update({ "system.customResources": resources });
            }
          }
        }
      }
    }
    let cap = 0;
    let balancedBonus = 0;
    if (weapon.type === "weapon") {
      let statId = weapon.system.attackStat;
      if (statId === "default" || !statId) {
        statId = weapon.system.isRanged && !weapon.system.isThrown || weapon.system.isLight ? "dexterity" : "strength";
      }
      cap = ((_b = actor.system.stats[statId]) == null ? void 0 : _b.total) || 0;
      if (weapon.system.tags.toLowerCase().includes("balanced") && !weapon.system.isRanged) {
        balancedBonus = 10;
      }
    } else {
      const capStat = weapon.system.capStat || weapon.system.attackStat;
      cap = ((_c = actor.system.stats[capStat]) == null ? void 0 : _c.total) || 0;
    }
    if (isBehind) cap = Math.floor(cap * (actor.system.behindMult ?? 0.5));
    if (isUnaware) cap = Math.floor(cap * 0.5);
    const fam = Math.floor(weapon.system.familiarity || 0) + balancedBonus;
    const roll = await new Roll("1d100").evaluate();
    let raw = roll.total;
    const originalRaw = raw;
    let rerolled = false;
    const tags = (weapon.system.tags || "").split(",").map((t) => t.trim().toLowerCase());
    if (tags.includes("reliable") && raw <= 4) {
      const reroll = await new Roll("1d100").evaluate();
      raw = reroll.total;
      rerolled = true;
    }
    let profBonus = 0;
    const actorTraits = actor.items.filter((i) => i.type === "trait");
    for (const trait of actorTraits) {
      if (trait.system.isProfession && trait.system.profession) {
        const prof = trait.system.profession.trim().toLowerCase();
        if (tags.includes(prof)) {
          profBonus += trait.system.modifiers.filter((m) => m.target === "allProfessionRolls").reduce((acc, m) => acc + m.value, 0);
        }
      }
    }
    const abilityPassiveBonuses = actor.system.abilityPassiveBonuses || {};
    for (const [tag, val] of Object.entries(abilityPassiveBonuses)) {
      if (tags.includes(tag) && val !== 0) profBonus += val;
    }
    const abilityTypeBonus = actor.system.abilityTypeBonus || {};
    if (abilityTypeBonus.all) profBonus += abilityTypeBonus.all;
    if (weapon.type !== "all" && abilityTypeBonus[weapon.type]) profBonus += abilityTypeBonus[weapon.type];
    if (tags.includes("accurate")) profBonus += 5;
    if (weapon.type === "weapon") {
      const wNameLower = weapon.name.toLowerCase();
      const expectedBroad = weapon.system.isRanged ? "ranged weapon" : "melee weapon";
      for (const skill of actor.items.filter((i) => i.type === "skill")) {
        const broadPart = skill.name.split("(")[0].trim().toLowerCase();
        if (broadPart !== expectedBroad) continue;
        const parenMatch = skill.name.match(/\(([^)]+)\)/);
        if (!parenMatch) continue;
        const specific = parenMatch[1].trim().toLowerCase();
        const isSpecificMatch = wNameLower.includes(specific) || tags.includes(specific);
        const rawSkillFam = parseInt(skill.system.familiarity) || 0;
        const appliedFam = isSpecificMatch ? rawSkillFam : Math.floor(rawSkillFam / 2);
        if (appliedFam !== 0) profBonus += appliedFam;
      }
    }
    const capped = Math.min(raw, cap);
    const total = capped + fam + profBonus;
    const threshold = isRanged ? 20 : 10;
    const isMutual = Math.abs(attackerTotal - total) <= threshold;
    if (isAoEFromData && isRanged) return ui.notifications.warn(game.i18n.localize("TAMS.Combat.RetaliateNoAoE"));
    let critInfo = "";
    if (raw >= attackerRaw * 2) critInfo = `<div class="tams-crit success">${game.i18n.format("TAMS.Combat.CriticalRetaliation", { name: e(actor.name) })}</div>`;
    else if (attackerRaw >= raw * 2) critInfo = `<div class="tams-crit failure">${game.i18n.format("TAMS.Combat.CriticalHitTaken", { name: e(actor.name) })}</div>`;
    let multiVal = weapon.type === "weapon" ? weapon.system.fireRate === "3" ? 3 : weapon.system.fireRate === "auto" ? 10 : weapon.system.fireRate === "custom" ? weapon.system.fireRateCustom : 1 : weapon.system.multiAttack || 1;
    const damage = weapon.system.calculatedDamage;
    const armourPen = weapon.type === "weapon" && weapon.system.hasArmourPen ? weapon.system.armourPenetration || 0 : weapon.system.armourPenetration || 0;
    const defenderTargetLimb = weapon.type === "ability" && ((_d = weapon.system.calculator) == null ? void 0 : _d.enabled) ? weapon.system.calculator.targetLimb : "none";
    let hitsScored = total >= attackerTotal || isMutual ? Math.min(1 + Math.floor(Math.max(0, total - attackerTotal) / 5), multiVal) : 0;
    let retLocations = [];
    const limbOptions = { "head": "Head", "thorax": "Thorax", "stomach": "Stomach", "leftArm": "Left Arm", "rightArm": "Right Arm", "leftLeg": "Left Leg", "rightLeg": "Right Leg" };
    for (let i = 0; i < hitsScored; i++) {
      retLocations.push(defenderTargetLimb && defenderTargetLimb !== "none" ? limbOptions[defenderTargetLimb] : await getHitLocation(i === 0 ? raw : null));
    }
    let defenseDamageInfo = "";
    let defenseLocations = [];
    if (isMutual || attackerTotal > total) {
      const hitsTaken = Math.min(1 + Math.floor(Math.max(0, attackerTotal - total) / 5), attackerMulti);
      for (let i = 0; i < hitsTaken; i++) {
        defenseLocations.push(attackerLocations[i] || (attackerTargetLimb && attackerTargetLimb !== "none" ? limbOptions[attackerTargetLimb] : await getHitLocation()));
      }
      defenseDamageInfo = `
            <div class="roll-row"><b style="color:${isMutual ? "orange" : "red"};">${isMutual ? game.i18n.format("TAMS.Combat.MutualHit", { threshold }) : game.i18n.localize("TAMS.Combat.FailedToBeatAttack")}</b></div>
            <div class="roll-row"><b>${game.i18n.localize("TAMS.Combat.HitsTaken")} ${hitsTaken} / ${attackerMulti}</b></div>
            <div class="roll-row"><small>${game.i18n.localize("TAMS.Location")}: ${defenseLocations.join(", ")}</small></div>
            <div class="roll-row" style="margin-bottom: 10px;">
                <button class="tams-take-damage" data-damage="${attackerDamage}" data-armour-pen="${attackerArmourPen}" data-damage-type="${attackerDamageType}" data-locations='${JSON.stringify(defenseLocations)}' data-is-aoe="${isAoEFromData ? "1" : "0"}">${actor.name ? `Apply Hits to ${e(actor.name)}` : game.i18n.localize("TAMS.Combat.ApplyHitsToDefender")}</button>
            </div>
          `;
      if (!isMutual && !critInfo) critInfo = `<div class="tams-failure">${game.i18n.format("TAMS.Combat.RetaliateFailed", { total: attackerTotal })}</div>`;
    } else if (!critInfo) {
      critInfo = `<div class="tams-success">${game.i18n.format("TAMS.Combat.RetaliateSuccess", { total: attackerTotal })}</div>`;
    }
    const isRetAoE = !!weapon.system.isAoE;
    const retDamageType = weapon.system.damageType || "";
    const applyToAttackerLabel = attackerName ? `Apply Hits to ${e(attackerName)}` : game.i18n.localize("TAMS.Checks.ApplyAllHits");
    const retButtons = hitsScored > 0 && !isMutual ? `
          <button class="tams-take-damage" data-damage="${damage}" data-armour-pen="${armourPen}" data-damage-type="${retDamageType}" data-locations='${JSON.stringify(retLocations)}' data-is-aoe="${isRetAoE ? "1" : "0"}">${applyToAttackerLabel}</button>
          <button class="tams-dodge" data-raw="${raw}" data-total="${total}" data-multi="${multiVal}" data-location="${retLocations[0]}" data-damage="${damage}" data-armour-pen="${armourPen}" data-damage-type="${retDamageType}" data-is-ranged="${isRanged ? "1" : "0"}" data-is-aoe="${isRetAoE ? "1" : "0"}" data-target-limb="${defenderTargetLimb}">${game.i18n.localize("TAMS.Dodge")}</button>
          <button class="tams-retaliate" data-raw="${raw}" data-total="${total}" data-multi="${multiVal}" data-location="${retLocations[0]}" data-damage="${damage}" data-armour-pen="${armourPen}" data-damage-type="${retDamageType}" data-is-ranged="${isRanged ? "1" : "0"}" data-is-aoe="${isRetAoE ? "1" : "0"}" data-target-limb="${defenderTargetLimb}" data-attacker-name="${e(actor.name)}">${game.i18n.localize("TAMS.Combat.RetaliateButton")}</button>
          <button class="tams-behind-toggle" style="background: #444; color: white;">B</button>
          <button class="tams-unaware-toggle" style="background: #444; color: white;">U</button>
      ` : isMutual ? `<button class="tams-take-damage" data-damage="${damage}" data-armour-pen="${armourPen}" data-damage-type="${retDamageType}" data-locations='${JSON.stringify(retLocations)}' data-is-aoe="${isRetAoE ? "1" : "0"}">${applyToAttackerLabel}</button>` : "";
    const retAbilityDescHtml = weapon.type === "ability" && weapon.system.description ? `<div class="roll-description">${await TextEditor.enrichHTML(weapon.system.description, { secrets: false, async: true })}</div>` : "";
    const msg = `
        <div class="tams-roll" data-attacker-raw="${raw}" data-attacker-total="${total}" data-attacker-multi="${multiVal}" data-armour-pen="${armourPen}" data-attacker-damage-type="${retDamageType}" data-is-ranged="${isRanged ? "1" : "0"}" data-target-limb="${defenderTargetLimb}" data-orig-attacker-raw="${attackerRaw}" data-orig-attacker-total="${attackerTotal}" data-orig-attacker-multi="${attackerMulti}" data-orig-attacker-damage="${attackerDamage}" data-orig-attacker-armour-pen="${attackerArmourPen}" data-orig-first-location="${firstLocation}" data-orig-target-limb="${attackerTargetLimb}" data-is-aoe="${isRetAoE ? "1" : "0"}">
          <h3 class="roll-label">${game.i18n.format("TAMS.Combat.RetaliationWith", { name: e(actor.name), weapon: e(weapon.name) })} ${isBehind ? "(Behind)" : ""} ${isUnaware ? "(Unaware)" : ""}</h3>
          ${retAbilityDescHtml}
          ${rerolled ? `<div class="roll-row reliable-reroll" style="color: #2c3e50; font-style: italic; font-size: 0.9em; margin-bottom: 4px;">
              ${game.i18n.format("TAMS.Checks.Notifications.ReliableReroll", { original: originalRaw })}
          </div>` : ""}
          ${defenseDamageInfo}
          <hr>
          <div class="roll-row"><b>${game.i18n.localize("TAMS.Combat.DmgShort")} ${damage}</b></div>
          <div class="roll-row"><b>${game.i18n.localize("TAMS.Combat.HitsTaken")} ${hitsScored} / ${multiVal}</b></div>
          <div class="roll-row"><b>${game.i18n.localize("TAMS.Location")}: ${retLocations[0] || "-"}</b></div>
          ${retLocations.length > 1 ? `<div class="roll-row"><small>Additional: ${retLocations.slice(1).join(", ")}</small></div>` : ""}
          <div class="roll-row" style="gap:6px; flex-wrap: wrap; justify-content: flex-start;">${retButtons}</div>
          <div class="roll-row"><span>${game.i18n.localize("TAMS.Combat.RawDiceResult")}</span><span class="roll-value">${raw}</span></div>
          <div class="roll-row"><small>${game.i18n.format("TAMS.Combat.StatCapLabel", { name: "Cap", value: cap })}</small><span>${capped}</span></div>
          <div class="roll-row"><small>${game.i18n.localize("TAMS.Familiarity")}:</small><span>+${fam}</span></div>
          ${profBonus !== 0 ? `<div class="roll-row"><small>${game.i18n.localize("TAMS.Bonus")}:</small><span>+${profBonus}</span></div>` : ""}
          <hr>
          <div class="roll-total">${game.i18n.localize("TAMS.Total")}: <b>${total}</b></div>
          ${critInfo}
          <div class="roll-contest-hint">
            <small><b>${game.i18n.localize("TAMS.Combat.ContestLabel")}</b> Total vs Attacker Total (${attackerTotal})</small><br>
            <small><b>${game.i18n.localize("TAMS.Combat.CritCheckLabel")}</b> Raw vs Attacker Raw (${attackerRaw})</small>
          </div>
        </div>`;
    ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: msg, rolls: [roll] });
  }));
  root.querySelectorAll(".tams-boost-unconscious").forEach((el) => el.addEventListener("click", async (ev) => {
    var _a;
    ev.preventDefault();
    const btn = ev.currentTarget;
    const container2 = btn.closest(".tams-roll");
    const actor = fromUuidSync(container2.dataset.actorUuid) || game.actors.get(container2.dataset.actorId);
    if (!actor || !actor.isOwner) return;
    const dc = parseInt(container2.dataset.dc), raw = parseInt(container2.dataset.raw), end = parseInt(container2.dataset.end);
    const capped = Math.min(raw, end), pointsNeeded = Math.max(0, Math.ceil((dc - capped) / 5));
    const resources = [{ id: "stamina", name: game.i18n.localize("TAMS.Stamina"), value: actor.system.stamina.value }];
    actor.system.customResources.forEach((res, idx) => resources.push({ id: idx.toString(), name: res.name, value: res.value }));
    const options = resources.map((r) => `<option value="${r.id}">${e(r.name)} (${r.value} ${game.i18n.localize("TAMS.AvailableShort")})</option>`).join("");
    const spending = await new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize("TAMS.Combat.BoostUnconsciousTitle"),
        content: `
                    <div class="form-group"><label>${game.i18n.localize("TAMS.Combat.Resource")}</label><select id="res-type">${options}</select></div>
                    <div class="form-group">
                        <label>${game.i18n.localize("TAMS.Combat.PointsSpentMax10")}</label>
                        <input type="number" id="res-points" value="${Math.min(pointsNeeded, 10)}" min="0" max="10"/>
                        <p><small>${game.i18n.localize("TAMS.Combat.BoostDodgeHint")}</small></p>
                    </div>`,
        buttons: {
          go: { label: game.i18n.localize("TAMS.Combat.ApplyBoost"), callback: (html2) => {
            const resId2 = html2.find("#res-type").val();
            const res = resources.find((r) => r.id === resId2);
            let pts2 = Math.clamp(parseInt(html2.find("#res-points").val()) || 0, 0, 10);
            if (pts2 > res.value) pts2 = res.value;
            resolve({ resId: resId2, pts: pts2 });
          } },
          cancel: { label: game.i18n.localize("TAMS.Cancel"), callback: () => resolve(null) }
        },
        default: "go"
      }).render(true);
    });
    if (!spending) return;
    const { resId, pts } = spending;
    const bonus = pts * 5, total = capped + bonus, success = total >= dc;
    if (pts > 0) {
      if (resId === "stamina") await actor.update({ "system.stamina.value": actor.system.stamina.value - pts });
      else {
        const customResources = foundry.utils.duplicate(actor.system.customResources);
        customResources[parseInt(resId)].value -= pts;
        await actor.update({ "system.customResources": customResources });
      }
    }
    const resName = resources.find((r) => r.id === resId).name;
    container2.querySelector(".roll-boost-container").innerHTML = `<div class="roll-row"><span>Boost (${e(resName)}):</span><span>+${bonus}</span></div>`;
    container2.querySelector(".roll-total b").innerText = total;
    const statusDiv = container2.querySelector(".tams-success, .tams-crit.failure");
    if (statusDiv) {
      statusDiv.className = success ? "tams-success" : "tams-crit failure";
      statusDiv.innerText = success ? game.i18n.localize("TAMS.Combat.RemainsConscious") : game.i18n.localize("TAMS.Combat.FallsUnconscious");
    }
    const messageId = (_a = btn.closest(".chat-message")) == null ? void 0 : _a.dataset.messageId;
    btn.remove();
    const message2 = game.messages.get(messageId);
    if (message2) await tamsUpdateMessage(message2, { content: container2.outerHTML });
  }));
  root.querySelectorAll(".tams-boost-survival").forEach((el) => el.addEventListener("click", async (ev) => {
    var _a;
    ev.preventDefault();
    const btn = ev.currentTarget;
    const container2 = btn.closest(".tams-roll");
    const actor = fromUuidSync(container2.dataset.actorUuid) || game.actors.get(container2.dataset.actorId);
    if (!actor || !actor.isOwner) return;
    const dc = parseInt(container2.dataset.dc), raw = parseInt(container2.dataset.raw), end = parseInt(container2.dataset.end);
    const capped = Math.min(raw, end), pointsNeeded = Math.max(0, Math.ceil((dc - capped) / 5));
    const resources = [{ id: "stamina", name: game.i18n.localize("TAMS.Stamina"), value: actor.system.stamina.value }];
    actor.system.customResources.forEach((res, idx) => resources.push({ id: idx.toString(), name: res.name, value: res.value }));
    const options = resources.map((r) => `<option value="${r.id}">${e(r.name)} (${r.value} ${game.i18n.localize("TAMS.AvailableShort")})</option>`).join("");
    const spending = await new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize("TAMS.Combat.BoostSurvivalTitle"),
        content: `
                    <div class="form-group"><label>${game.i18n.localize("TAMS.Combat.Resource")}</label><select id="res-type">${options}</select></div>
                    <div class="form-group">
                        <label>${game.i18n.localize("TAMS.Combat.PointsSpentMax10")}</label>
                        <input type="number" id="res-points" value="${Math.min(pointsNeeded, 10)}" min="0" max="10"/>
                        <p><small>${game.i18n.localize("TAMS.Combat.BoostDodgeHint")}</small></p>
                    </div>`,
        buttons: {
          go: { label: game.i18n.localize("TAMS.Combat.ApplyBoost"), callback: (html2) => {
            const resId2 = html2.find("#res-type").val();
            const res = resources.find((r) => r.id === resId2);
            let pts2 = Math.clamp(parseInt(html2.find("#res-points").val()) || 0, 0, 10);
            if (pts2 > res.value) pts2 = res.value;
            resolve({ resId: resId2, pts: pts2 });
          } },
          cancel: { label: game.i18n.localize("TAMS.Cancel"), callback: () => resolve(null) }
        },
        default: "go"
      }).render(true);
    });
    if (!spending) return;
    const { resId, pts } = spending;
    const bonus = pts * 5, total = capped + bonus, success = total >= dc;
    if (pts > 0) {
      if (resId === "stamina") await actor.update({ "system.stamina.value": actor.system.stamina.value - pts });
      else {
        const customResources = foundry.utils.duplicate(actor.system.customResources);
        customResources[parseInt(resId)].value -= pts;
        await actor.update({ "system.customResources": customResources });
      }
    }
    const resName = resources.find((r) => r.id === resId).name;
    container2.querySelector(".roll-boost-container").innerHTML = `<div class="roll-row"><span>Boost (${e(resName)}):</span><span>+${bonus}</span></div>`;
    container2.querySelector(".roll-total b").innerText = total;
    const statusDiv = container2.querySelector(".tams-success, .tams-crit.failure");
    if (statusDiv) {
      statusDiv.className = success ? "tams-success" : "tams-crit failure";
      statusDiv.innerText = success ? game.i18n.localize("TAMS.Checks.Survived") : game.i18n.localize("TAMS.Checks.FatalInjury");
    }
    const messageId = (_a = btn.closest(".chat-message")) == null ? void 0 : _a.dataset.messageId;
    btn.remove();
    const message2 = game.messages.get(messageId);
    if (message2) await tamsUpdateMessage(message2, { content: container2.outerHTML });
  }));
  root.querySelectorAll(".tams-boost-roll").forEach((el) => el.addEventListener("click", async (ev) => {
    var _a;
    ev.preventDefault();
    const btn = ev.currentTarget;
    const actor = fromUuidSync(btn.dataset.actorUuid) || game.actors.get(btn.dataset.actorId);
    if (!actor || !actor.isOwner) return;
    const difficulty = parseInt(btn.dataset.difficulty);
    const currentTotal = parseInt(btn.dataset.total);
    const pointsNeeded = Math.max(0, Math.ceil((difficulty - currentTotal) / 5));
    const resources = [{ id: "stamina", name: game.i18n.localize("TAMS.Stamina"), value: actor.system.stamina.value }];
    actor.system.customResources.forEach((res, idx) => resources.push({ id: idx.toString(), name: res.name, value: res.value }));
    const options = resources.map((r) => `<option value="${r.id}">${e(r.name)} (${r.value} ${game.i18n.localize("TAMS.AvailableShort")})</option>`).join("");
    const spending = await new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize("TAMS.BoostRollTitle"),
        content: `
                    <div class="form-group"><label>${game.i18n.localize("TAMS.Combat.Resource")}</label><select id="res-type">${options}</select></div>
                    <div class="form-group">
                        <label>${game.i18n.localize("TAMS.Combat.PointsSpent")}</label>
                        <input type="number" id="res-points" value="${pointsNeeded}" min="0"/>
                        <p><small>${game.i18n.localize("TAMS.Combat.BoostLabel")} (+5/pt)</small></p>
                    </div>`,
        buttons: {
          go: { label: game.i18n.localize("TAMS.Combat.ApplyBoost"), callback: (html2) => {
            const resId2 = html2.find("#res-type").val();
            const res = resources.find((r) => r.id === resId2);
            let pts2 = parseInt(html2.find("#res-points").val()) || 0;
            if (pts2 > res.value) pts2 = res.value;
            resolve({ resId: resId2, pts: pts2 });
          } },
          cancel: { label: game.i18n.localize("TAMS.Cancel"), callback: () => resolve(null) }
        },
        default: "go"
      }).render(true);
    });
    if (!spending) return;
    const { resId, pts } = spending;
    const bonus = pts * 5;
    const newTotal = currentTotal + bonus;
    const success = newTotal >= difficulty;
    if (pts > 0) {
      if (resId === "stamina") await actor.update({ "system.stamina.value": actor.system.stamina.value - pts });
      else {
        const customResources = foundry.utils.duplicate(actor.system.customResources);
        customResources[parseInt(resId)].value -= pts;
        await actor.update({ "system.customResources": customResources });
      }
    }
    const resName = resources.find((r) => r.id === resId).name;
    const boostContainer = container.querySelector(".roll-boost-container");
    if (boostContainer) {
      boostContainer.innerHTML = `<div class="roll-row"><span>Boost (${e(resName)}):</span><span>+${bonus}</span></div>`;
    }
    const totalEl = container.querySelector(".roll-total b");
    if (totalEl) totalEl.innerText = newTotal;
    const statusDiv = container.querySelector(".tams-failure, .tams-success");
    if (statusDiv) {
      statusDiv.className = success ? "tams-success" : "tams-failure";
      statusDiv.innerHTML = success ? game.i18n.format("TAMS.SuccessVsDiffBoosted", { difficulty, amount: bonus }) : game.i18n.format("TAMS.FailureVsDiff", { difficulty });
    }
    const messageId = (_a = btn.closest(".chat-message")) == null ? void 0 : _a.dataset.messageId;
    btn.remove();
    const message2 = game.messages.get(messageId);
    if (message2) await tamsUpdateMessage(message2, { content: container.outerHTML });
  }));
  root.querySelectorAll(".tams-block").forEach((el) => el.addEventListener("click", async (ev) => {
    var _a;
    ev.preventDefault();
    const btn = ev.currentTarget;
    const actorUuid = btn.dataset.targetActorUuid;
    const actor = actorUuid ? await fromUuid(actorUuid) : (_a = canvas.tokens.controlled[0]) == null ? void 0 : _a.actor;
    if (!actor) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.SelectTargetDodge"));
    const shield = actor.items.find((i) => i.type === "shield" && i.system.equipped);
    if (!shield) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NoShield"));
    const locations = JSON.parse(btn.dataset.locations);
    const content = `
            <p>${game.i18n.format("TAMS.Combat.ChooseLimbToBlock", { name: shield.name, armor: shield.system.armorValue })}</p>
            <select id="block-loc">
                ${locations.map((loc, i) => `<option value="${i}">${loc}</option>`).join("")}
            </select>`;
    new Dialog({
      title: game.i18n.localize("TAMS.Combat.ShieldBlock"),
      content,
      buttons: {
        block: {
          label: game.i18n.localize("TAMS.Combat.BlockHit"),
          callback: async (html2) => {
            const idx = parseInt(html2.find("#block-loc").val());
            const locationToBlock = locations[idx];
            const damage = parseInt(btn.dataset.damage);
            const armourPen = parseInt(btn.dataset.armourPen) || 0;
            const damageType = btn.dataset.damageType || "";
            const shieldArmor = shield.system.armorValue;
            const report = `
                            <div class="tams-roll">
                                <h3 class="roll-label">${game.i18n.format("TAMS.Combat.ShieldBlockWith", { name: actor.name, shield: shield.name })}</h3>
                                <div class="tams-success">${game.i18n.format("TAMS.Combat.BlockReport", { location: locationToBlock, armor: shieldArmor })}</div>
                                <div class="roll-row" style="margin-top: 5px;">
                                    <button class="tams-take-damage"
                                            data-damage="${damage}"
                                            data-armour-pen="${armourPen - shieldArmor}"
                                            data-damage-type="${damageType}"
                                            data-locations='${JSON.stringify([locationToBlock])}'
                                            data-target-actor-uuid="${actor.uuid}">${game.i18n.localize("TAMS.Combat.TakeDamage")}</button>
                                </div>
                            </div>`;
            ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: report });
          }
        },
        cancel: { label: game.i18n.localize("TAMS.Cancel") }
      },
      default: "block"
    }).render(true);
  }));
  ["behind", "unaware"].forEach((type) => {
    root.querySelectorAll(`.tams-${type}-toggle`).forEach((el) => el.addEventListener("click", async (ev) => {
      var _a;
      ev.preventDefault();
      const btn = ev.currentTarget, container2 = btn.closest(".tams-roll");
      container2.classList.toggle(`${type === "behind" ? "behind-attack" : "unaware-defender"}`);
      btn.style.background = container2.classList.contains(`${type === "behind" ? "behind-attack" : "unaware-defender"}`) ? "#2e7d32" : "#444";
      const messageId = (_a = btn.closest(".chat-message")) == null ? void 0 : _a.dataset.messageId, message2 = game.messages.get(messageId);
      if (message2) await tamsUpdateMessage(message2, { content: container2.outerHTML });
    }));
  });
  root.querySelectorAll(".tams-squad-crit-roll").forEach((el) => el.addEventListener("click", async (ev) => {
    ev.preventDefault();
    const btn = ev.currentTarget, actor = fromUuidSync(btn.dataset.actorUuid) || game.actors.get(btn.dataset.actorId);
    if (!actor) return;
    const count = parseInt(btn.dataset.count), end = actor.system.stats.endurance.total;
    const dcsAttr = btn.dataset.dcs;
    let dcs = dcsAttr ? dcsAttr.split(",").map(Number) : [];
    let dc = 0;
    if (dcs.length === 0) {
      dc = await new Promise((resolve) => {
        new Dialog({
          title: game.i18n.localize("TAMS.Combat.CritDC"),
          content: `<div class="form-group"><label>${game.i18n.localize("TAMS.Combat.EnterDC")}</label><input type="number" id="dc" value="0"/></div>`,
          buttons: { roll: { label: game.i18n.localize("TAMS.Combat.Roll"), callback: (html2) => resolve(parseInt(html2.find("#dc").val()) || 0) }, cancel: { label: game.i18n.localize("TAMS.Cancel"), callback: () => resolve(null) } },
          default: "roll"
        }).render(true);
      });
      if (dc === null) return;
    }
    let rollResults = [], successCount = 0;
    for (let i = 0; i < count; i++) {
      const currentDc = dcs.length > 0 ? dcs[i] ?? dcs[dcs.length - 1] : dc;
      const raw = (await new Roll("1d100").evaluate()).total, capped = Math.min(raw, end), success = capped >= currentDc;
      if (success) successCount++;
      rollResults.push({ raw, capped, success, dc: currentDc });
    }
    const failureCount = count - successCount;
    const isMook = (actor.system.settings.npcRank || "mook") === "mook";
    const updates = {};
    let needsUpdate = false;
    const currentSize = actor.system.settings.squadSize;
    const newSize = isMook ? currentSize + successCount : currentSize - failureCount;
    if (newSize !== currentSize) {
      updates["system.settings.squadSize"] = newSize;
      needsUpdate = true;
    }
    if (successCount > 0) {
      const limbKeys = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
      for (let key of limbKeys) {
        const limb = actor.system.limbs[key];
        if (!limb) continue;
        const indMax = Math.floor(end * limb.mult);
        const currentVal = updates[`system.limbs.${key}.value`] ?? limb.value;
        updates[`system.limbs.${key}.value`] = currentVal + successCount * indMax;
      }
      needsUpdate = true;
    }
    if (needsUpdate) {
      const limbKeys = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
      for (let key of limbKeys) {
        const limb = actor.system.limbs[key];
        if (!limb) continue;
        const indMax = Math.floor(end * limb.mult);
        const maxForNewSize = newSize * indMax;
        const currentVal = updates[`system.limbs.${key}.value`] ?? limb.value;
        const totalDamage = limb.max - currentVal;
        const remainderDamage = totalDamage % indMax;
        if (currentVal > 0) {
          updates[`system.limbs.${key}.value`] = maxForNewSize - remainderDamage;
        } else {
          updates[`system.limbs.${key}.value`] = Math.max(currentVal, -maxForNewSize);
        }
      }
    }
    if (needsUpdate) await actor.update(updates);
    const displayDc = dcs.length > 0 ? dcs.every((d) => d === dcs[0]) ? dcs[0] : game.i18n.localize("TAMS.Combat.Variable") : dc;
    let resultsHtml = `<div class="tams-roll"><h3 class="roll-label">${game.i18n.format("TAMS.Combat.SquadCritChecks", { name: btn.dataset.name })}</h3><div class="roll-row"><span>Checks:</span><span>${count}</span></div><div class="roll-row"><span>Endurance:</span><span>${end}</span></div><div class="roll-row"><span>Target DC:</span><span>${displayDc}</span></div><hr><div class="squad-crit-list" style="max-height: 200px; overflow-y: auto;">`;
    rollResults.forEach((r, i) => {
      resultsHtml += `<div class="roll-row" style="border-bottom: 1px solid #eee; font-size: 0.9em; padding: 2px 0;"><span style="flex: 1;">${game.i18n.format("TAMS.Combat.SquadCritCheckRow", { i: i + 1, raw: r.raw, capped: r.capped })} (DC ${r.dc})</span><span style="color: ${r.success ? "#2e7d32" : "#c0392b"}; font-weight: bold; min-width: 50px; text-align: right;">${r.success ? game.i18n.localize("TAMS.Combat.Pass") : game.i18n.localize("TAMS.Combat.Fail")}</span></div>`;
    });
    resultsHtml += `</div>`;
    if (successCount > 0) {
      resultsHtml += `<div class="roll-row" style="color: #2e7d32; font-weight: bold; margin-top: 5px; border-top: 1px solid #2e7d32; padding-top: 3px;">${game.i18n.format("TAMS.Combat.SquadMembersRestored", { count: successCount })}</div>`;
    }
    if (!isMook && failureCount > 0) {
      resultsHtml += `<div class="roll-row" style="color: #c0392b; font-weight: bold; margin-top: 5px; border-top: 1px solid #c0392b; padding-top: 3px;">${game.i18n.format("TAMS.Combat.SquadMembersLost", { count: failureCount })}</div>`;
    }
    resultsHtml += `</div>`;
    ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: resultsHtml });
    btn.disabled = true;
    btn.innerText = game.i18n.localize("TAMS.Combat.ChecksRolled");
  }));
}
class TAMSActor extends Actor {
  /**
   * Apply damage to this actor across multiple hits/locations.
   * @param {object[]} hits Array of hit objects: { damage, location, armourPen }
   * @param {object} options Additional options
   * @param {boolean} [options.isAoE=false] Is this an AoE attack?
   * @param {number} [options.multiplier=1] For squads/hordes, how many members were hit by the AoE.
   * @returns {Promise<object>} Result including updates, itemUpdates, pendingChecks, and report.
   */
  async applyDamage(hits, { isAoE = false, multiplier = 1 } = {}) {
    var _a, _b, _c;
    const updates = {};
    const itemUpdates = {};
    const pendingChecks = [];
    const limbDamageReceived = {};
    const originalLimbStatus = {};
    const locationMap = {
      "Head": "head",
      "Thorax": "thorax",
      "Stomach": "stomach",
      "Left Arm": "leftArm",
      "Right Arm": "rightArm",
      "Left Leg": "leftLeg",
      "Right Leg": "rightLeg"
    };
    const limbKeys = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
    for (let key of limbKeys) {
      originalLimbStatus[key] = {
        value: this.system.limbs[key].value,
        injured: this.system.limbs[key].injured,
        criticallyInjured: this.system.limbs[key].criticallyInjured,
        max: this.system.limbs[key].max
      };
      limbDamageReceived[key] = 0;
    }
    let report = `<b>${this.name}</b> ${game.i18n.localize("TAMS.TakingDamage")}:<br>`;
    const isSquadOrHorde = ((_a = this.system.settings) == null ? void 0 : _a.isNPC) && (this.system.settings.npcType === "squad" || this.system.settings.npcType === "horde");
    const currentSquadSize = this.system.settings.squadSize || 1;
    const limbLosses = {};
    for (let i = 0; i < hits.length; i++) {
      const hit = hits[i];
      const incoming = Math.floor(hit.damage || 0);
      const armourPen = hit.armourPen || 0;
      const loc = hit.location;
      const limbKey = locationMap[loc];
      if (!limbKey) continue;
      const limb = this.system.limbs[limbKey];
      const isAltArmor = (_b = this.system.settings) == null ? void 0 : _b.alternateArmour;
      const pendingArmor = updates[`system.limbs.${limbKey}.armor`];
      let armorValue = pendingArmor !== void 0 ? pendingArmor : limb.armor || 0;
      if (isAltArmor) {
        const pendingMax = updates[`system.limbs.${limbKey}.armorMax`];
        const curMax = pendingMax !== void 0 ? pendingMax : limb.armorMax || 0;
        if (curMax <= 0) armorValue = 0;
      }
      const otherArmor = limb.otherArmor || 0;
      const armor = Math.floor(armorValue + otherArmor);
      const effectiveArmor = Math.max(0, armor - armourPen);
      let barrierLabel = "";
      let adjustedIncoming = incoming;
      if (!isSquadOrHorde && adjustedIncoming > 0) {
        const pendingTempDR = updates["system.tempDR"];
        const currentTempDR = pendingTempDR !== void 0 ? pendingTempDR : this.system.tempDR || 0;
        if (currentTempDR > 0) {
          const absorbed = Math.min(currentTempDR, adjustedIncoming);
          adjustedIncoming -= absorbed;
          updates["system.tempDR"] = currentTempDR - absorbed;
          barrierLabel = game.i18n.format("TAMS.Combat.TempDRAbsorbed", { absorbed, remaining: currentTempDR - absorbed });
        }
      }
      let effective = Math.max(0, adjustedIncoming - effectiveArmor);
      const blocked = Math.min(adjustedIncoming, effectiveArmor);
      let overflow = 0;
      let resistanceLabel = "";
      const damageType = hit.damageType || "";
      if (damageType && ((_c = this.system.effectiveResistances) == null ? void 0 : _c.length)) {
        let match = this.system.effectiveResistances.find(
          (r) => r.damageType === damageType && (r.limbs ?? []).length > 0 && r.limbs.includes(limbKey)
        );
        if (!match) {
          match = this.system.effectiveResistances.find(
            (r) => r.damageType === damageType && (r.limbs ?? []).length === 0
          );
        }
        if (match) {
          const typeName = game.i18n.localize(`TAMS.DamageType.${match.damageType}`);
          if (match.category === "immunity") {
            effective = 0;
            resistanceLabel = game.i18n.format("TAMS.Combat.Immune", { type: typeName });
          } else if (match.category === "resistance") {
            const reduced = Math.min(effective, match.value);
            effective = Math.max(0, effective - match.value);
            resistanceLabel = game.i18n.format("TAMS.Combat.Resisted", { value: reduced, type: typeName });
          } else if (match.category === "vulnerability") {
            effective = effective + match.value;
            resistanceLabel = game.i18n.format("TAMS.Combat.Vulnerable", { value: match.value, type: typeName });
          } else if (match.category === "healing") {
            const healAmount = effective + (match.value || 0);
            resistanceLabel = game.i18n.format("TAMS.Combat.HealedFrom", { value: healAmount, type: typeName });
            const currentHp2 = updates[`system.limbs.${limbKey}.value`] ?? limb.value;
            updates[`system.limbs.${limbKey}.value`] = Math.min(limb.max, currentHp2 + healAmount);
            report += `• ${game.i18n.format("TAMS.Checks.HealReport", { loc, amount: healAmount })}<br>`;
            report += `  ↳ ${resistanceLabel}<br>`;
            continue;
          }
        }
      }
      if (isSquadOrHorde) {
        const indMax = limb.individualMax || Math.floor(this.system.stats.endurance.total * limb.mult);
        const limbCap = (isAoE ? multiplier : 1) * indMax;
        const currentLimbHpBeforeHit = updates[`system.limbs.${limbKey}.value`] ?? limb.value;
        const cappedEffective = Math.min(effective, limbCap);
        overflow = effective - cappedEffective;
        const totalDamageOfHit = effective;
        effective = cappedEffective;
        if (!limbLosses[limbKey]) limbLosses[limbKey] = [];
        const newLimbHpAfterHit = currentLimbHpBeforeHit - effective;
        const oldSize = Math.max(0, Math.ceil(currentLimbHpBeforeHit / indMax));
        const newSize = Math.max(0, Math.ceil(newLimbHpAfterHit / indMax));
        const lostInThisHit = oldSize - newSize;
        if (lostInThisHit > 0) {
          const damageTakenAlready = limb.max - currentLimbHpBeforeHit;
          const totalDamageOnLimb = damageTakenAlready + totalDamageOfHit;
          const dc = totalDamageOnLimb;
          for (let j = 0; j < lostInThisHit; j++) {
            limbLosses[limbKey].push(dc);
          }
        }
      }
      const currentHp = updates[`system.limbs.${limbKey}.value`] ?? limb.value;
      const newHp = Math.floor(currentHp) - effective;
      updates[`system.limbs.${limbKey}.value`] = newHp;
      limbDamageReceived[limbKey] += effective;
      let lossLabel = "";
      if (armorValue > 0 && effective + overflow < adjustedIncoming) {
        const key = isAltArmor ? `system.limbs.${limbKey}.armorMax` : `system.limbs.${limbKey}.armor`;
        const pending = updates[key];
        const currentVal = pending !== void 0 ? pending : isAltArmor ? limb.armorMax : limb.armor;
        updates[key] = Math.max(0, (currentVal || 0) - 1);
        lossLabel = isAltArmor ? game.i18n.localize("TAMS.Checks.ArmorHPLost") : game.i18n.localize("TAMS.Checks.ArmorPointLost");
      }
      const penLabel = armourPen > 0 ? game.i18n.format("TAMS.Checks.ArmorPenetrated", { pen: armourPen }) : "";
      const overflowLabel = overflow > 0 ? game.i18n.format("TAMS.Checks.OverflowCapped", { overflow }) : "";
      const lossMsg = lossLabel ? `, ${lossLabel}` : "";
      report += `• ${game.i18n.format("TAMS.Checks.DamageReport", { loc, effective, blocked, penLabel, lossLabel: lossMsg, overflowLabel })}<br>`;
      if (barrierLabel) report += `  ↳ ${barrierLabel}<br>`;
      if (resistanceLabel) report += `  ↳ ${resistanceLabel}<br>`;
      const limbMax = originalLimbStatus[limbKey].max;
      if (newHp <= -limbMax && !originalLimbStatus[limbKey].injured && !updates[`system.limbs.${limbKey}.injured`]) {
        report += `<b style="color:#f39c12;">!!! ${game.i18n.format("TAMS.Checks.LimbInjuredAuto", { limb: limb.label })} !!!</b><br>`;
        updates[`system.limbs.${limbKey}.injured`] = true;
      }
    }
    if (isSquadOrHorde) {
      let finalSquadSize = currentSquadSize;
      let bottleneckLimb = null;
      const limbKeys2 = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
      for (let lk of limbKeys2) {
        const limb = this.system.limbs[lk];
        if (!limb) continue;
        const newLimbVal = updates[`system.limbs.${lk}.value`] ?? limb.value;
        const indMax = limb.individualMax || Math.floor(this.system.stats.endurance.total * limb.mult);
        const potentialSize = Math.max(0, Math.ceil(newLimbVal / indMax));
        if (potentialSize < finalSquadSize) {
          finalSquadSize = potentialSize;
          bottleneckLimb = lk;
        }
      }
      if (finalSquadSize < currentSquadSize) {
        const lostCount = currentSquadSize - finalSquadSize;
        const npcRank = this.system.settings.npcRank || "mook";
        const isMook = npcRank === "mook";
        if (isMook) {
          updates["system.settings.squadSize"] = finalSquadSize;
          report += `<b style="color:#c0392b;">!!! ${game.i18n.format("TAMS.Checks.SquadLostMembers", { name: this.name, lostCount, finalSquadSize })} !!!</b><br>`;
          const limbKeys3 = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
          for (let lk of limbKeys3) {
            const limb = this.system.limbs[lk];
            if (!limb) continue;
            const indMax = limb.individualMax || Math.floor(this.system.stats.endurance.total * limb.mult);
            const newMax = finalSquadSize * indMax;
            const currentVal = updates[`system.limbs.${lk}.value`] ?? limb.value;
            const totalDamage = limb.max - currentVal;
            const remainderDamage = totalDamage % indMax;
            if (currentVal > 0) {
              updates[`system.limbs.${lk}.value`] = newMax - remainderDamage;
            } else {
              updates[`system.limbs.${lk}.value`] = Math.max(currentVal, -newMax);
            }
          }
        } else {
          report += `<b style="color:#c0392b;">!!! ${game.i18n.format("TAMS.Checks.SquadThreatenedMembers", { name: this.name, lostCount })} !!!</b><br>`;
        }
        if (!isMook) {
          const dcs = bottleneckLimb && limbLosses[bottleneckLimb] ? limbLosses[bottleneckLimb].slice(0, lostCount) : [];
          const dcsAttr = dcs.length > 0 ? ` data-dcs="${dcs.join(",")}"` : "";
          report += `<button class="tams-squad-crit-roll" data-actor-uuid="${this.uuid}" data-count="${lostCount}" data-name="${this.name}"${dcsAttr}>${game.i18n.format("TAMS.Checks.RollForCriticalWounds", { count: lostCount })}</button><br>`;
        }
        if (finalSquadSize === 0 && isMook) {
          report += `<b style="color:#c0392b;">!!! ${game.i18n.format("TAMS.Checks.SquadDestroyed", { name: this.name })} !!!</b><br>`;
        }
      }
    }
    const finalUpdates = { ...updates };
    if (Object.keys(itemUpdates).length > 0) {
      finalUpdates.items = Object.values(itemUpdates);
    }
    await this.update(finalUpdates);
    for (let [limbKey, damage] of Object.entries(limbDamageReceived)) {
      if (damage === 0 && !hits.some((h) => locationMap[h.location] === limbKey && h.forceCrit)) continue;
      const original = originalLimbStatus[limbKey];
      const limb = this.system.limbs[limbKey];
      limb.value;
      if (isSquadOrHorde) continue;
      const autoInjuredThisHit = updates[`system.limbs.${limbKey}.injured`] === true && !original.injured;
      const limbHpAfterHit = this.system.limbs[limbKey].value;
      if (original.injured && damage > 0 && !original.criticallyInjured) {
        pendingChecks.push({ type: "crit", loc: limb.label, dc: damage + (original.value < 0 ? Math.abs(original.value) : 0), limbKey });
      } else if (autoInjuredThisHit && !original.criticallyInjured) {
        pendingChecks.push({ type: "crit", loc: limb.label, dc: Math.max(10, damage + (original.value < 0 ? Math.abs(original.value) : 0)), limbKey });
      } else if (hits.some((h) => locationMap[h.location] === limbKey && h.forceCrit === "1") && !original.criticallyInjured) {
        pendingChecks.push({ type: "crit", loc: limb.label, dc: Math.max(10, damage + (original.value < 0 ? Math.abs(original.value) : 0)), limbKey });
      } else if (limbHpAfterHit <= 0 && !original.injured && damage > 0) {
        pendingChecks.push({ type: "injured", loc: limb.label, dc: damage, limbKey });
      }
    }
    const totalHp = this.system.hp.value;
    const maxHp = this.system.hp.max;
    if (!isSquadOrHorde) {
      let survivalDC = 0;
      let reasons = [];
      let survivalNeeded = false;
      if (totalHp <= -maxHp) {
        survivalNeeded = true;
        survivalDC = Math.abs(totalHp);
        reasons.push(`${game.i18n.localize("TAMS.Checks.ReasonTotalHPBelowNegMax")} (${totalHp} / -${maxHp})`);
      } else if (totalHp < 0) {
        pendingChecks.push({
          type: "unconscious",
          dc: Math.abs(totalHp),
          reasons: [`${game.i18n.localize("TAMS.Checks.ReasonTotalHPNegative")} (${totalHp})`]
        });
      }
      const existingCountdown = this.getFlag("tams", "dyingCountdown");
      let dyingStarted = false;
      for (const key of ["head", "thorax"]) {
        const limb = this.system.limbs[key];
        if (limb.value < -limb.max && !existingCountdown && !dyingStarted) {
          dyingStarted = true;
          const turnsLeft = Math.max(1, Math.floor(this.system.stats.endurance.total / 10));
          await this.toggleStatusEffect("unconscious", { active: true });
          await this.setFlag("tams", "dyingCountdown", { turnsLeft, limbKey: key });
          const ownerIds = Object.entries(this.ownership ?? {}).filter(([id, lvl]) => lvl >= 3 && id !== "default").map(([id]) => id);
          const whisperIds = [.../* @__PURE__ */ new Set([...ownerIds, ...game.users.filter((u) => u.isGM).map((u) => u.id)])];
          await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            content: `<div class="tams-roll"><div class="tams-crit failure" style="font-size:1.1em;font-weight:bold;">${game.i18n.format("TAMS.Dying.Started", { name: this.name, limb: limb.label, turns: turnsLeft })}</div></div>`,
            whisper: whisperIds
          });
        }
      }
      if (survivalNeeded) {
        pendingChecks.push({ type: "survival", dc: survivalDC, reasons });
      }
    }
    return { pendingChecks, report };
  }
  /** @override */
  async _preUpdate(updateData, options, user) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    const res = await super._preUpdate(updateData, options, user);
    if (res === false) return false;
    const limbKeys = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
    for (const key of limbKeys) {
      const armorIdPath = `system.limbs.${key}.equippedArmorId`;
      if (foundry.utils.hasProperty(updateData, armorIdPath)) {
        const newArmorId = foundry.utils.getProperty(updateData, armorIdPath);
        const oldArmorId = this.system.limbs[key].equippedArmorId;
        if (newArmorId !== oldArmorId) {
          if (newArmorId) {
            const armorItem = this.items.get(newArmorId);
            if (armorItem && armorItem.type === "armor") {
              foundry.utils.setProperty(updateData, `system.limbs.${key}.armor`, ((_a = armorItem.system.limbs[key]) == null ? void 0 : _a.value) || 0);
              foundry.utils.setProperty(updateData, `system.limbs.${key}.armorMax`, ((_b = armorItem.system.limbs[key]) == null ? void 0 : _b.max) || 0);
            }
          } else {
            foundry.utils.setProperty(updateData, `system.limbs.${key}.armor`, 0);
            foundry.utils.setProperty(updateData, `system.limbs.${key}.armorMax`, 0);
          }
        }
      }
    }
    const stats = this.system.stats;
    const settings = this.system.settings;
    const oldSquadSize = settings.squadSize || 1;
    const isSquadOrHorde = settings.isNPC && (settings.npcType === "squad" || settings.npcType === "horde");
    const hasEndValue = foundry.utils.hasProperty(updateData, "system.stats.endurance.value");
    const hasEndMod = foundry.utils.hasProperty(updateData, "system.stats.endurance.mod");
    const hasSquadSize = foundry.utils.hasProperty(updateData, "system.settings.squadSize");
    if (hasEndValue || hasEndMod || hasSquadSize) {
      const traitBonus = stats.endurance.traitBonus || 0;
      const oldEnd = stats.endurance.total;
      const newEnd = (hasEndValue ? foundry.utils.getProperty(updateData, "system.stats.endurance.value") : stats.endurance.value) + (hasEndMod ? foundry.utils.getProperty(updateData, "system.stats.endurance.mod") : stats.endurance.mod || 0) + traitBonus;
      const newSquadSize = hasSquadSize ? foundry.utils.getProperty(updateData, "system.settings.squadSize") : oldSquadSize;
      if (newEnd !== oldEnd || newSquadSize !== oldSquadSize) {
        const limbKeys2 = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
        for (const key of limbKeys2) {
          const limb = this.system.limbs[key];
          if (!limb) continue;
          const currentPath = `system.limbs.${key}.value`;
          if (foundry.utils.hasProperty(updateData, currentPath)) continue;
          const oldIndMax = Math.floor(oldEnd * limb.mult);
          const newIndMax = Math.floor(newEnd * limb.mult);
          const oldMax = isSquadOrHorde ? oldIndMax * oldSquadSize : oldIndMax;
          const newMax = isSquadOrHorde ? newIndMax * newSquadSize : newIndMax;
          const deltaMax = newMax - oldMax;
          if (deltaMax !== 0) {
            foundry.utils.setProperty(updateData, currentPath, limb.value + deltaMax);
          }
        }
      }
    }
    {
      const ALL_STATS = ["strength", "dexterity", "endurance", "wisdom", "intelligence", "bravery"];
      const warnings = [];
      const customResources = foundry.utils.duplicate(this.system.customResources ?? []);
      let customResourcesChanged = false;
      for (const statKey of ALL_STATS) {
        const hasVal = foundry.utils.hasProperty(updateData, `system.stats.${statKey}.value`);
        const hasMod = foundry.utils.hasProperty(updateData, `system.stats.${statKey}.mod`);
        if (!hasVal && !hasMod) continue;
        const traitBonus = ((_c = stats[statKey]) == null ? void 0 : _c.traitBonus) || 0;
        const oldTotal = ((_d = stats[statKey]) == null ? void 0 : _d.total) ?? 0;
        const newTotal = (hasVal ? foundry.utils.getProperty(updateData, `system.stats.${statKey}.value`) : ((_e = stats[statKey]) == null ? void 0 : _e.value) ?? 0) + (hasMod ? foundry.utils.getProperty(updateData, `system.stats.${statKey}.mod`) : ((_f = stats[statKey]) == null ? void 0 : _f.mod) || 0) + traitBonus;
        const statDelta = newTotal - oldTotal;
        if (statDelta === 0) continue;
        if (statKey === "endurance") {
          const staminaPath = "system.stamina.value";
          if (!foundry.utils.hasProperty(updateData, staminaPath)) {
            const mult = ((_g = this.system.stamina) == null ? void 0 : _g.mult) ?? 1;
            const staminaDelta = Math.floor(statDelta * mult);
            if (staminaDelta !== 0) {
              const newStamina = this.system.stamina.value + staminaDelta;
              if (newStamina < 0) {
                const deficit = Math.abs(newStamina);
                const pay = await this._offerHPPaymentForStamina(deficit);
                if (pay) {
                  foundry.utils.setProperty(updateData, staminaPath, 0);
                  const limbUpdates = this._computeLimbHPPayment(deficit);
                  for (const [k, v] of Object.entries(limbUpdates))
                    foundry.utils.setProperty(updateData, k, v);
                } else {
                  foundry.utils.setProperty(updateData, staminaPath, newStamina);
                  warnings.push(`${this.name} — ${game.i18n.localize("TAMS.Stamina")}: ${newStamina}`);
                }
              } else {
                foundry.utils.setProperty(updateData, staminaPath, newStamina);
              }
            }
          }
        }
        for (const [idx, res2] of customResources.entries()) {
          if (res2.stat !== statKey || res2.stat === "custom") continue;
          const resDelta = Math.floor(statDelta * (res2.mult ?? 1));
          if (resDelta === 0) continue;
          const rawVal = (customResources[idx].value ?? 0) + resDelta;
          if (rawVal < 0) {
            const deficit = Math.abs(rawVal);
            const pay = await this._offerStaminaPayment(res2.name, deficit);
            if (pay) {
              customResources[idx].value = 0;
              const staminaPath = "system.stamina.value";
              const currentStamina = foundry.utils.getProperty(updateData, staminaPath) ?? this.system.stamina.value;
              foundry.utils.setProperty(updateData, staminaPath, currentStamina - deficit);
            } else {
              customResources[idx].value = rawVal;
              warnings.push(`${this.name} — ${res2.name}: ${rawVal}`);
            }
          } else {
            customResources[idx].value = rawVal;
          }
          customResourcesChanged = true;
        }
      }
      if (foundry.utils.hasProperty(updateData, "system.stamina.mult") && !foundry.utils.hasProperty(updateData, "system.stamina.value")) {
        const newMult = foundry.utils.getProperty(updateData, "system.stamina.mult");
        const oldMult = ((_h = this.system.stamina) == null ? void 0 : _h.mult) ?? 1;
        if (newMult !== oldMult) {
          const endTotal = this.system.stats.endurance.total;
          const delta = Math.floor(endTotal * newMult) - Math.floor(endTotal * oldMult);
          if (delta !== 0)
            foundry.utils.setProperty(updateData, "system.stamina.value", this.system.stamina.value + delta);
        }
      }
      for (let idx = 0; idx < customResources.length; idx++) {
        const multPath = `system.customResources.${idx}.mult`;
        if (!foundry.utils.hasProperty(updateData, multPath)) continue;
        const origRes = this.system.customResources[idx];
        const newMult = foundry.utils.getProperty(updateData, multPath);
        const oldMult = origRes.mult ?? 1;
        if (newMult === oldMult || origRes.stat === "custom") continue;
        const statVal = ((_i = this.system.stats[origRes.stat]) == null ? void 0 : _i.total) || 0;
        const delta = Math.floor(statVal * newMult) - Math.floor(statVal * oldMult);
        if (delta === 0) continue;
        customResources[idx].value = (customResources[idx].value ?? 0) + delta;
        customResources[idx].mult = newMult;
        delete updateData[multPath];
        customResourcesChanged = true;
      }
      if (customResourcesChanged)
        foundry.utils.setProperty(updateData, "system.customResources", customResources);
      if (warnings.length) {
        const gmIds = ((_j = game.users) == null ? void 0 : _j.filter((u) => u.isGM).map((u) => u.id)) ?? [];
        ChatMessage.create({
          whisper: gmIds,
          content: `<div class="tams-roll">${warnings.map((w) => `<div class="tams-crit failure">⚠ ${w} (insufficient resources)</div>`).join("")}</div>`
        });
      }
    }
    return res;
  }
  /**
   * Adjust all limb current HP values when endurance total changes by a delta.
   * Called after trait items are added or removed.
   * @param {number} endDelta - The change in endurance total (positive = added, negative = removed)
   */
  async _adjustLimbHPForEnduranceDelta(endDelta) {
    var _a, _b;
    if (endDelta === 0) return;
    const currentTotal = this.system.stats.endurance.total;
    const oldTotal = currentTotal - endDelta;
    const isSquadOrHorde = ((_a = this.system.settings) == null ? void 0 : _a.isNPC) && (this.system.settings.npcType === "squad" || this.system.settings.npcType === "horde");
    const squadSize = ((_b = this.system.settings) == null ? void 0 : _b.squadSize) || 1;
    const updates = {};
    const limbKeys = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
    for (const key of limbKeys) {
      const limb = this.system.limbs[key];
      if (!limb) continue;
      const oldIndMax = Math.floor(oldTotal * limb.mult);
      const newIndMax = Math.floor(currentTotal * limb.mult);
      const oldMax = isSquadOrHorde ? oldIndMax * squadSize : oldIndMax;
      const newMax = isSquadOrHorde ? newIndMax * squadSize : newIndMax;
      const delta = newMax - oldMax;
      if (delta !== 0) {
        updates[`system.limbs.${key}.value`] = limb.value + delta;
      }
    }
    if (Object.keys(updates).length > 0) {
      await this.update(updates);
    }
  }
  _computeLimbHPPayment(deficit) {
    const PAYMENT_LIMB_ORDER = ["leftArm", "rightArm", "leftLeg", "rightLeg", "stomach", "thorax"];
    const total = 5 * deficit;
    const base = Math.floor(total / PAYMENT_LIMB_ORDER.length);
    const remainder = total % PAYMENT_LIMB_ORDER.length;
    const updates = {};
    PAYMENT_LIMB_ORDER.forEach((key, i) => {
      var _a;
      const dmg = base + (i < remainder ? 1 : 0);
      if (dmg > 0)
        updates[`system.limbs.${key}.value`] = (((_a = this.system.limbs[key]) == null ? void 0 : _a.value) ?? 0) - dmg;
    });
    return updates;
  }
  async _offerHPPaymentForStamina(deficit) {
    const hpCost = 5 * deficit;
    return new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize("TAMS.HPPayment.Title"),
        content: `<p>${game.i18n.format("TAMS.HPPayment.Prompt", { amount: deficit, hp: hpCost })}</p>`,
        buttons: {
          yes: { label: game.i18n.localize("TAMS.HPPayment.Pay"), callback: () => resolve(true) },
          no: { label: game.i18n.localize("TAMS.HPPayment.Decline"), callback: () => resolve(false) }
        },
        default: "no",
        close: () => resolve(false)
      }).render(true);
    });
  }
  async _offerStaminaPayment(resourceName, deficit) {
    return new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize("TAMS.StaminaPayment.Title"),
        content: `<p>${game.i18n.format("TAMS.StaminaPayment.Prompt", { resource: resourceName, amount: deficit })}</p>`,
        buttons: {
          yes: { label: game.i18n.localize("TAMS.StaminaPayment.Pay"), callback: () => resolve(true) },
          no: { label: game.i18n.localize("TAMS.StaminaPayment.Decline"), callback: () => resolve(false) }
        },
        default: "no",
        close: () => resolve(false)
      }).render(true);
    });
  }
  /**
   * Adjust stamina and custom resource current values when stat totals change
   * due to trait additions/removals.
   * @param {object} statDeltas - Map of statKey → delta (positive = gained, negative = lost)
   */
  async _adjustResourcesForStatDeltas(statDeltas) {
    var _a, _b;
    const updates = {};
    const warnings = [];
    for (const [statKey, statDelta] of Object.entries(statDeltas)) {
      if (statDelta === 0) continue;
      if (statKey === "endurance") {
        const mult = ((_a = this.system.stamina) == null ? void 0 : _a.mult) ?? 1;
        const delta = Math.floor(statDelta * mult);
        if (delta !== 0) {
          const newVal = this.system.stamina.value + delta;
          if (newVal < 0) {
            const deficit = Math.abs(newVal);
            const pay = await this._offerHPPaymentForStamina(deficit);
            if (pay) {
              updates["system.stamina.value"] = 0;
              const limbUpdates = this._computeLimbHPPayment(deficit);
              Object.assign(updates, limbUpdates);
            } else {
              updates["system.stamina.value"] = newVal;
              warnings.push(`${this.name} — ${game.i18n.localize("TAMS.Stamina")}: ${newVal}`);
            }
          } else {
            updates["system.stamina.value"] = newVal;
          }
        }
      }
      const customResources = foundry.utils.duplicate(this.system.customResources ?? []);
      let changed = false;
      for (const [idx, res] of customResources.entries()) {
        if (res.stat !== statKey || res.stat === "custom") continue;
        const delta = Math.floor(statDelta * (res.mult ?? 1));
        if (delta === 0) continue;
        const rawVal = (customResources[idx].value ?? 0) + delta;
        if (rawVal < 0) {
          const deficit = Math.abs(rawVal);
          const pay = await this._offerStaminaPayment(res.name, deficit);
          if (pay) {
            customResources[idx].value = 0;
            const newStamina = (updates["system.stamina.value"] ?? this.system.stamina.value) - deficit;
            updates["system.stamina.value"] = newStamina;
            if (newStamina < 0)
              warnings.push(`${this.name} — ${game.i18n.localize("TAMS.Stamina")}: ${newStamina}`);
          } else {
            customResources[idx].value = rawVal;
            warnings.push(`${this.name} — ${res.name}: ${rawVal}`);
          }
        } else {
          customResources[idx].value = rawVal;
        }
        changed = true;
      }
      if (changed) updates["system.customResources"] = customResources;
    }
    if (Object.keys(updates).length) await this.update(updates);
    if (warnings.length) {
      const gmIds = ((_b = game.users) == null ? void 0 : _b.filter((u) => u.isGM).map((u) => u.id)) ?? [];
      await ChatMessage.create({
        whisper: gmIds,
        content: `<div class="tams-roll">${warnings.map((w) => `<div class="tams-crit failure">⚠ ${w} (insufficient resources)</div>`).join("")}</div>`
      });
    }
  }
  /** @override */
  async _onCreateDescendantDocuments(parent, collection, documents, data, options, userId) {
    var _a, _b;
    await super._onCreateDescendantDocuments(parent, collection, documents, data, options, userId);
    if (collection !== "items" || game.userId !== userId) return;
    let endDelta = 0;
    const statDeltas = {};
    for (const doc of documents) {
      if (doc.type !== "trait") continue;
      for (const mod of ((_a = doc.system) == null ? void 0 : _a.modifiers) || []) {
        const match = (_b = mod.target) == null ? void 0 : _b.match(/^stats\.(\w+)$/);
        if (!match) continue;
        const key = match[1];
        const val = mod.value || 0;
        if (key === "endurance") endDelta += val;
        statDeltas[key] = (statDeltas[key] || 0) + val;
      }
    }
    if (endDelta !== 0) await this._adjustLimbHPForEnduranceDelta(endDelta);
    if (Object.values(statDeltas).some((v) => v !== 0)) await this._adjustResourcesForStatDeltas(statDeltas);
  }
  /** @override */
  async _onDeleteDescendantDocuments(parent, collection, documents, ids, options, userId) {
    var _a, _b;
    await super._onDeleteDescendantDocuments(parent, collection, documents, ids, options, userId);
    if (collection !== "items" || game.userId !== userId) return;
    let endDelta = 0;
    const statDeltas = {};
    for (const doc of documents) {
      if (doc.type !== "trait") continue;
      for (const mod of ((_a = doc.system) == null ? void 0 : _a.modifiers) || []) {
        const match = (_b = mod.target) == null ? void 0 : _b.match(/^stats\.(\w+)$/);
        if (!match) continue;
        const key = match[1];
        const val = mod.value || 0;
        if (key === "endurance") endDelta -= val;
        statDeltas[key] = (statDeltas[key] || 0) - val;
      }
    }
    if (endDelta !== 0) await this._adjustLimbHPForEnduranceDelta(endDelta);
    if (Object.values(statDeltas).some((v) => v !== 0)) await this._adjustResourcesForStatDeltas(statDeltas);
  }
  async _onDropItem(event, data) {
    const item = await Item.fromDropData(data);
    if ((item == null ? void 0 : item.type) === "statusEffect" && item.system.statusId) {
      await this.toggleStatusEffect(item.system.statusId, { active: true });
      return false;
    }
    return super._onDropItem(event, data);
  }
}
class TAMSItem extends Item {
  /**
   * System-defined item types.
   * @type {object}
   */
  static get metadata() {
    return foundry.utils.mergeObject(super.metadata, {
      types: ["weapon", "skill", "ability", "equipment", "armor", "consumable", "tool", "shield", "questItem", "backpack", "trait", "statusEffect", "ammo", "race"]
    }, { inplace: false });
  }
}
async function tamsHandleItemTransfer({ itemData, sourceActorUuid, targetActorUuid, newLocation }, sender = null) {
  let target = await fromUuid(targetActorUuid);
  if (!target) return;
  const targetActor = target instanceof foundry.documents.BaseActor ? target : target.actor;
  if (!targetActor) return;
  const _sourceFull = sourceActorUuid ? await fromUuid(sourceActorUuid) : null;
  const sourceActor = _sourceFull ? _sourceFull instanceof foundry.documents.BaseActor ? _sourceFull : _sourceFull.actor : null;
  const itemsToCreate = [];
  const itemsToDelete = [];
  const mainItemData = foundry.utils.duplicate(itemData);
  mainItemData.system.location = newLocation;
  if (mainItemData.system.equipped !== void 0) mainItemData.system.equipped = false;
  const originalId = mainItemData._id;
  delete mainItemData._id;
  itemsToCreate.push(mainItemData);
  let sourceItem = null;
  if (sourceActor && originalId) {
    sourceItem = sourceActor.items.get(originalId);
    if (sourceItem) itemsToDelete.push(sourceItem);
  }
  if (sender) {
    if (sourceActor && !sourceActor.testUserPermission(sender, "OWNER")) {
      console.warn(`TAMS | transferItem rejected: ${sender.name} does not own source actor`);
      return;
    }
    if (sourceItem) {
      const canonical = sourceItem.toObject();
      delete canonical._id;
      canonical.system.location = newLocation;
      if (canonical.system.equipped !== void 0) canonical.system.equipped = false;
      itemsToCreate[0] = canonical;
    }
  }
  if (sourceItem && sourceItem.type === "backpack" && sourceItem.system.equipped) {
    const contents = sourceActor.items.filter((i) => i.system.location === "backpack" || i.system.location === sourceItem.id);
    for (let i of contents) {
      const contentData = i.toObject();
      delete contentData._id;
      contentData.system.location = "stowed";
      itemsToCreate.push(contentData);
      itemsToDelete.push(i);
    }
  }
  const created = await targetActor.createEmbeddedDocuments("Item", itemsToCreate);
  if (created.length && itemsToDelete.length) {
    const canDelete = sourceActor && sourceActor.isOwner;
    if (canDelete || game.user.isGM) {
      await sourceActor.deleteEmbeddedDocuments("Item", itemsToDelete.map((i) => i.id));
    }
  }
  return created;
}
async function tamsHandleLootDrop(data, x, y) {
  var _a, _b, _c, _d;
  let item;
  if (data.uuid) item = await fromUuid(data.uuid);
  else if (data.data) item = data.data;
  if (!item) return;
  const actorData = {
    name: `${game.i18n.localize("TAMS.Loot")}: ${item.name || ((_a = item.data) == null ? void 0 : _a.name)}`,
    type: "character",
    img: item.img || ((_b = item.data) == null ? void 0 : _b.img) || "icons/svg/item-bag.svg",
    prototypeToken: {
      name: `${game.i18n.localize("TAMS.Loot")}: ${item.name || ((_c = item.data) == null ? void 0 : _c.name)}`,
      texture: { src: item.img || ((_d = item.data) == null ? void 0 : _d.img) || "icons/svg/item-bag.svg" },
      width: 0.5,
      height: 0.5,
      actorLink: false
    },
    system: {
      settings: {
        isNPC: true,
        npcType: "individual"
      }
    },
    flags: {
      core: {
        sheetClass: "tams.TAMSLootSheet"
      }
    },
    ownership: {
      default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
    }
  };
  const actor = await Actor.create(actorData);
  if (!actor) return console.error("TAMS | Failed to create loot actor.");
  const itemsToCreate = [];
  const itemsToDelete = [];
  const mainItemData = typeof item.toObject === "function" ? item.toObject() : item;
  itemsToCreate.push(mainItemData);
  if (item instanceof Item && item.actor) itemsToDelete.push(item);
  if (item instanceof Item && item.type === "backpack" && item.actor && item.system.equipped) {
    const sourceActor = item.actor;
    const backpackContents = sourceActor.items.filter((i) => i.system.location === "backpack" || i.system.location === item.id);
    for (let i of backpackContents) {
      const contentData = i.toObject();
      contentData.system.location = "stowed";
      itemsToCreate.push(contentData);
      itemsToDelete.push(i);
    }
  }
  await actor.createEmbeddedDocuments("Item", itemsToCreate);
  for (let i of itemsToDelete) {
    try {
      await i.delete();
    } catch (err) {
      console.warn(`TAMS | Failed to delete source item ${i.name} after drop on map.`, err);
    }
  }
  const tokenDocument = await actor.getTokenDocument({ x, y });
  return canvas.scene.createEmbeddedDocuments("Token", [tokenDocument.toObject()]);
}
Hooks.on("dropCanvasData", async (canvas2, data) => {
  var _a, _b;
  if (data.type !== "Item") return;
  const item = await Item.fromDropData(data);
  if (!item) return;
  const tokens = canvas2.tokens.getObjectsAt({ x: data.x, y: data.y });
  const targetToken = tokens.find((t) => {
    var _a2;
    return t.actor && t.actor.uuid !== ((_a2 = item.parent) == null ? void 0 : _a2.uuid);
  });
  if (targetToken) {
    if (targetToken.actor.isOwner) {
      return tamsHandleItemTransfer({
        itemData: item.toObject(),
        sourceActorUuid: (_a = item.parent) == null ? void 0 : _a.uuid,
        targetActorUuid: targetToken.actor.uuid,
        newLocation: "stowed"
      });
    } else {
      game.socket.emit("system.tams", {
        type: "transferItem",
        itemData: item.toObject(),
        sourceActorUuid: (_b = item.parent) == null ? void 0 : _b.uuid,
        targetActorUuid: targetToken.actor.uuid,
        newLocation: "stowed",
        userId: game.user.id
      });
      ui.notifications.info(game.i18n.format("TAMS.Checks.Notifications.GivingItem", { item: item.name, target: targetToken.name }));
      return false;
    }
  }
  if (!game.user.isGM) {
    game.socket.emit("system.tams", {
      type: "createLoot",
      lootData: data,
      x: data.x,
      y: data.y
    });
    ui.notifications.info(game.i18n.localize("TAMS.Checks.Notifications.RequestLootPile"));
    return;
  }
  return tamsHandleLootDrop(data, data.x, data.y);
});
const HONOR_PATHS = {
  valor: {
    labelKey: "TAMS.Honor.Path.Valor",
    tiers: [
      { min: 91, labelKey: "TAMS.Honor.Tier.Valor.Lionheart", glossKey: "TAMS.Honor.Gloss.Valor.Lionheart" },
      { min: 76, labelKey: "TAMS.Honor.Tier.Valor.Valiant", glossKey: "TAMS.Honor.Gloss.Valor.Valiant" },
      { min: 51, labelKey: "TAMS.Honor.Tier.Valor.Brave", glossKey: "TAMS.Honor.Gloss.Valor.Brave" },
      { min: 26, labelKey: "TAMS.Honor.Tier.Valor.Steadfast", glossKey: "TAMS.Honor.Gloss.Valor.Steadfast" },
      { min: 0, labelKey: "TAMS.Honor.Tier.Common", glossKey: "TAMS.Honor.Gloss.Common" },
      { min: -25, labelKey: "TAMS.Honor.Tier.Valor.Timid", glossKey: "TAMS.Honor.Gloss.Valor.Timid" },
      { min: -50, labelKey: "TAMS.Honor.Tier.Valor.Craven", glossKey: "TAMS.Honor.Gloss.Valor.Craven" },
      { min: -75, labelKey: "TAMS.Honor.Tier.Valor.Dastard", glossKey: "TAMS.Honor.Gloss.Valor.Dastard" },
      { min: -100, labelKey: "TAMS.Honor.Tier.Valor.Runagate", glossKey: "TAMS.Honor.Gloss.Valor.Runagate" }
    ]
  },
  justice: {
    labelKey: "TAMS.Honor.Path.Justice",
    tiers: [
      { min: 91, labelKey: "TAMS.Honor.Tier.Justice.Great", glossKey: "TAMS.Honor.Gloss.Justice.Great" },
      { min: 76, labelKey: "TAMS.Honor.Tier.Justice.Righteous", glossKey: "TAMS.Honor.Gloss.Justice.Righteous" },
      { min: 51, labelKey: "TAMS.Honor.Tier.Justice.Just", glossKey: "TAMS.Honor.Gloss.Justice.Just" },
      { min: 26, labelKey: "TAMS.Honor.Tier.Justice.Upright", glossKey: "TAMS.Honor.Gloss.Justice.Upright" },
      { min: 0, labelKey: "TAMS.Honor.Tier.Common", glossKey: "TAMS.Honor.Gloss.Common" },
      { min: -25, labelKey: "TAMS.Honor.Tier.Justice.Suspect", glossKey: "TAMS.Honor.Gloss.Justice.Suspect" },
      { min: -50, labelKey: "TAMS.Honor.Tier.Justice.Corrupt", glossKey: "TAMS.Honor.Gloss.Justice.Corrupt" },
      { min: -75, labelKey: "TAMS.Honor.Tier.Justice.Unjust", glossKey: "TAMS.Honor.Gloss.Justice.Unjust" },
      { min: -100, labelKey: "TAMS.Honor.Tier.Justice.Tyrant", glossKey: "TAMS.Honor.Gloss.Justice.Tyrant" }
    ]
  },
  devotion: {
    labelKey: "TAMS.Honor.Path.Devotion",
    tiers: [
      { min: 91, labelKey: "TAMS.Honor.Tier.Devotion.Sainted", glossKey: "TAMS.Honor.Gloss.Devotion.Sainted" },
      { min: 76, labelKey: "TAMS.Honor.Tier.Devotion.Devoted", glossKey: "TAMS.Honor.Gloss.Devotion.Devoted" },
      { min: 51, labelKey: "TAMS.Honor.Tier.Devotion.Pious", glossKey: "TAMS.Honor.Gloss.Devotion.Pious" },
      { min: 26, labelKey: "TAMS.Honor.Tier.Devotion.Faithful", glossKey: "TAMS.Honor.Gloss.Devotion.Faithful" },
      { min: 0, labelKey: "TAMS.Honor.Tier.Common", glossKey: "TAMS.Honor.Gloss.Common" },
      { min: -25, labelKey: "TAMS.Honor.Tier.Devotion.Lapsed", glossKey: "TAMS.Honor.Gloss.Devotion.Lapsed" },
      { min: -50, labelKey: "TAMS.Honor.Tier.Devotion.Faithless", glossKey: "TAMS.Honor.Gloss.Devotion.Faithless" },
      { min: -75, labelKey: "TAMS.Honor.Tier.Devotion.Heretic", glossKey: "TAMS.Honor.Gloss.Devotion.Heretic" },
      { min: -100, labelKey: "TAMS.Honor.Tier.Devotion.Accursed", glossKey: "TAMS.Honor.Gloss.Devotion.Accursed" }
    ]
  },
  renown: {
    labelKey: "TAMS.Honor.Path.Renown",
    tiers: [
      { min: 91, labelKey: "TAMS.Honor.Tier.Renown.Magnificent", glossKey: "TAMS.Honor.Gloss.Renown.Magnificent" },
      { min: 76, labelKey: "TAMS.Honor.Tier.Renown.Renowned", glossKey: "TAMS.Honor.Gloss.Renown.Renowned" },
      { min: 51, labelKey: "TAMS.Honor.Tier.Renown.Honored", glossKey: "TAMS.Honor.Gloss.Renown.Honored" },
      { min: 26, labelKey: "TAMS.Honor.Tier.Renown.Worthy", glossKey: "TAMS.Honor.Gloss.Renown.Worthy" },
      { min: 0, labelKey: "TAMS.Honor.Tier.Common", glossKey: "TAMS.Honor.Gloss.Common" },
      { min: -25, labelKey: "TAMS.Honor.Tier.Renown.Disgraced", glossKey: "TAMS.Honor.Gloss.Renown.Disgraced" },
      { min: -50, labelKey: "TAMS.Honor.Tier.Renown.Infamous", glossKey: "TAMS.Honor.Gloss.Renown.Infamous" },
      { min: -75, labelKey: "TAMS.Honor.Tier.Renown.Villainous", glossKey: "TAMS.Honor.Gloss.Renown.Villainous" },
      { min: -100, labelKey: "TAMS.Honor.Tier.Renown.Damned", glossKey: "TAMS.Honor.Gloss.Renown.Damned" }
    ]
  }
};
function getHonorTier(score, path) {
  const pathData = HONOR_PATHS[path];
  if (!pathData) return null;
  for (const tier of pathData.tiers) {
    if (score >= tier.min) return tier;
  }
  return pathData.tiers[pathData.tiers.length - 1];
}
function isHonorEnabled() {
  try {
    return game.settings.get("tams", "honorSystem") === true;
  } catch {
    return false;
  }
}
function getPartyHonor() {
  try {
    return JSON.parse(game.settings.get("tams", "partyHonor"));
  } catch {
    return { valor: 0, justice: 0, devotion: 0, renown: 0 };
  }
}
function setPartyHonor(data) {
  return game.settings.set("tams", "partyHonor", JSON.stringify(data));
}
const SIZE_STEPS = { tiny: -2, small: -1, normal: 0, large: 1, huge: 2, giant: 3 };
const _TAMSActorSheet = class _TAMSActorSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  /** @override */
  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
      tag: "form",
      classes: ["tams", "sheet", "actor"],
      position: { width: 600, height: 800 },
      window: { resizable: true, scrollable: [".tab", ".inventory-scroll"] },
      form: { submitOnChange: true, closeOnSubmit: false },
      dragDrop: [{ dragSelector: ".item[data-item-id]", dropSelector: null }],
      actions: {
        itemCreate: _TAMSActorSheet.prototype._onItemCreate,
        itemEdit: _TAMSActorSheet.prototype._onItemEdit,
        itemDelete: _TAMSActorSheet.prototype._onItemDelete,
        roll: _TAMSActorSheet.prototype._onRoll,
        resourceAdd: _TAMSActorSheet.prototype._onResourceAdd,
        resourceDelete: _TAMSActorSheet.prototype._onResourceDelete,
        itemUseCharge: _TAMSActorSheet.prototype._onItemUseCharge,
        itemRecharge: _TAMSActorSheet.prototype._onItemRecharge,
        setTab: _TAMSActorSheet.prototype._onSetTab,
        updateItemField: _TAMSActorSheet.prototype._onUpdateItemField,
        editImage: _TAMSActorSheet.prototype._onEditImage,
        fullHeal: _TAMSActorSheet.prototype._onFullHeal,
        itemGive: _TAMSActorSheet.prototype._onItemGive,
        itemExport: _TAMSActorSheet.prototype._onItemExport,
        toggleLimbMultipliers: _TAMSActorSheet.prototype._onToggleLimbMultipliers,
        itemEquip: _TAMSActorSheet.prototype._onItemEquip,
        itemStow: _TAMSActorSheet.prototype._onItemStow,
        itemQtyDelta: _TAMSActorSheet.prototype._onItemQtyDelta,
        itemRepair: _TAMSActorSheet.prototype._onItemRepair,
        toggleItemDetails: _TAMSActorSheet.prototype._onToggleItemDetails,
        setInventorySort: _TAMSActorSheet.prototype._onSetInventorySort,
        setInventoryFilter: _TAMSActorSheet.prototype._onSetInventoryFilter,
        resistanceAdd: _TAMSActorSheet.prototype._onResistanceAdd,
        resistanceDelete: _TAMSActorSheet.prototype._onResistanceDelete,
        resistanceLimbToggle: _TAMSActorSheet.prototype._onResistanceLimbToggle,
        barrierAdd: _TAMSActorSheet.prototype._onBarrierAdd,
        barrierClear: _TAMSActorSheet.prototype._onBarrierClear,
        sceneReset: _TAMSActorSheet.prototype._onSceneReset,
        callGroupCheck: _TAMSActorSheet.prototype._onCallGroupCheck,
        itemSendDescription: _TAMSActorSheet.prototype._onItemSendDescription,
        honorEdit: _TAMSActorSheet.prototype._onHonorEdit,
        raceRemove: _TAMSActorSheet.prototype._onRaceRemove
      }
    }, { inplace: false });
  }
  /** @override */
  get title() {
    var _a;
    const actor = this.document;
    const isUnlinkedToken = actor.isToken && !((_a = actor.token) == null ? void 0 : _a.actorLink);
    return isUnlinkedToken ? `[Token] ${actor.name}` : actor.name;
  }
  /** @override */
  async _preRender(context, options) {
    var _a;
    await super._preRender(context, options);
    this._savedScrollPositions = {};
    for (const el of ((_a = this.element) == null ? void 0 : _a.querySelectorAll("[data-scroll-id]")) ?? []) {
      this._savedScrollPositions[el.dataset.scrollId] = el.scrollTop;
    }
  }
  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    if (this._savedScrollPositions) {
      for (const el of this.element.querySelectorAll("[data-scroll-id]")) {
        const saved = this._savedScrollPositions[el.dataset.scrollId];
        if (saved !== void 0) el.scrollTop = saved;
      }
      this._savedScrollPositions = null;
    }
    const theme = this.document.system.theme || "default";
    this.element.classList.remove("theme-default", "theme-dark", "theme-parchment", "theme-grimdark", "theme-cyberpunk", "theme-gothic", "theme-tactical");
    this.element.classList.add(`theme-${theme}`);
    this.element.querySelectorAll('input[data-action="updateItemField"], select[data-action="updateItemField"]').forEach((el) => {
      el.addEventListener("change", async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        await this._onUpdateItemField(ev, ev.currentTarget);
      });
    });
    const searchInput = this.element.querySelector("input.inventory-search");
    if (searchInput) {
      searchInput.addEventListener("input", (ev) => {
        this._inventorySearch = ev.currentTarget.value;
        clearTimeout(this._inventorySearchTimer);
        this._inventorySearchTimer = setTimeout(() => this.render(), 250);
      });
    }
    this.element.querySelectorAll("select.inventory-sort").forEach((el) => {
      el.addEventListener("change", (ev) => this._onSetInventorySort(ev, ev.currentTarget));
    });
    this.element.querySelectorAll("select.inventory-filter").forEach((el) => {
      el.addEventListener("change", (ev) => this._onSetInventoryFilter(ev, ev.currentTarget));
    });
    this.element.querySelectorAll(".tams-remove-status").forEach((btn) => {
      btn.addEventListener("click", async (ev) => {
        const statusId = ev.currentTarget.dataset.statusId;
        await this.document.toggleStatusEffect(statusId, { active: false });
      });
    });
    this.element.querySelectorAll(".item[data-item-id]").forEach((el) => {
      el.addEventListener("dragover", (ev) => {
        ev.preventDefault();
        el.classList.add("drag-over");
      });
      el.addEventListener("dragleave", () => el.classList.remove("drag-over"));
      el.addEventListener("drop", () => el.classList.remove("drag-over"));
    });
  }
  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    this._activeTab ?? (this._activeTab = "stats");
    context.actor = this.document;
    context.system = this.document.system;
    context.user = game.user;
    context.activeTab = this._activeTab;
    context.editable = this.isEditable;
    context.owner = this.document.isOwner;
    if (this._limbMultipliersCollapsed === void 0) this._limbMultipliersCollapsed = true;
    context.limbMultipliersCollapsed = this._limbMultipliersCollapsed;
    this._preparePercentages(context);
    this._prepareItemCollections(context);
    this._prepareSelectOptions(context);
    this._prepareCurrencyData(context);
    this._prepareLimbArmorOptions(context);
    this._prepareHonorData(context);
    const skipDisplay = /* @__PURE__ */ new Set(["encumbered"]);
    context.activeStatuses = [...this.document.statuses ?? []].filter((id) => !skipDisplay.has(id)).map((id) => {
      var _a, _b;
      const def = ((_a = CONFIG.statusEffects) == null ? void 0 : _a.find((e2) => e2.id === id)) ?? {};
      const itemRef = (_b = game.items) == null ? void 0 : _b.find((i) => i.type === "statusEffect" && i.system.statusId === id);
      return {
        id,
        name: def.name ? game.i18n.localize(def.name) : id,
        icon: def.img ?? "icons/svg/skull.svg",
        mechanicalSummary: (itemRef == null ? void 0 : itemRef.system.mechanicalSummary) ?? ""
      };
    });
    return context;
  }
  /**
   * Calculate percentage values for bars and resources.
   * @param {object} context The context object to modify.
   * @protected
   */
  _preparePercentages(context) {
    const system = this.document.system;
    context.staminaPercentage = Math.clamp(system.stamina.value / (system.stamina.max || 1) * 100, 0, 100);
    context.hpPercentage = Math.clamp(system.hp.value / (system.hp.max || 1) * 100, 0, 100);
    context.barrierPct = Math.clamp(system.tempDR / (system.hp.max || 1) * 100, 0, context.hpPercentage);
    context.barrierLeft = context.hpPercentage - context.barrierPct;
    context.capacityPercentage = Math.clamp(system.inventory.usedCapacity / (system.inventory.maxCapacity || 1) * 100, 0, 100);
    context.customResourceData = system.customResources.map((res) => {
      return {
        ...res,
        percentage: Math.clamp(res.value / (res.max || 1) * 100, 0, 100)
      };
    });
  }
  /**
   * Prepare item collections and groupings for the sheet.
   * @param {object} context The context object to modify.
   * @protected
   */
  _prepareItemCollections(context) {
    var _a, _b;
    const weapons = [];
    const equippedWeapons = [];
    const skills = [];
    const abilities = [];
    const inventoryArmor = [];
    const inventoryConsumables = [];
    const inventoryAmmo = [];
    const inventoryTools = [];
    const inventoryQuestItems = [];
    const inventoryMisc = [];
    const inventoryWeapons = [];
    const inventoryBackpacks = [];
    const traits = [];
    const allItems = [];
    const hasBackpack = !!this.document.system.inventory.hasBackpack;
    this._expandedItems ?? (this._expandedItems = /* @__PURE__ */ new Set());
    const limbKeys = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
    const limbLabels = this.document.system.limbs;
    for (let i of [...this.document.items].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))) {
      let isGreyedOut = false;
      let effectiveLocation = i.system.location;
      if (effectiveLocation === "backpack") {
        if (!hasBackpack) {
          isGreyedOut = false;
        } else {
          const firstBP = this.document.items.find((bp) => bp.type === "backpack" && bp.system.equipped);
          isGreyedOut = !firstBP;
        }
      } else if (effectiveLocation && effectiveLocation !== "stowed" && effectiveLocation !== "hand") {
        const container2 = this.document.items.get(effectiveLocation);
        if (container2 && container2.type === "backpack") {
          isGreyedOut = !container2.system.equipped;
        }
      }
      let armorZones = null;
      if (i.type === "armor") {
        armorZones = [];
        for (const key of limbKeys) {
          const zone = (_a = i.system.limbs) == null ? void 0 : _a[key];
          if (!zone || (zone.max || 0) <= 0) continue;
          armorZones.push({
            key,
            label: ((_b = limbLabels[key]) == null ? void 0 : _b.label) || key,
            value: zone.value || 0,
            max: zone.max || 0,
            missing: Math.max(0, (zone.max || 0) - (zone.value || 0))
          });
        }
      }
      const itemData = {
        id: i.id,
        uuid: i.uuid,
        name: i.name,
        img: i.img,
        system: i.system,
        type: i.type,
        isGreyedOut,
        isEquipped: i.type === "weapon" && i.system.location === "hand" || ["armor", "backpack", "shield"].includes(i.type) && i.system.equipped,
        canEquip: ["weapon", "armor", "shield", "backpack"].includes(i.type),
        isArmor: i.type === "armor",
        armorZones,
        expanded: this._expandedItems.has(i.id)
      };
      allItems.push(itemData);
      if (i.type === "weapon") {
        weapons.push(itemData);
        if (i.system.equipped) equippedWeapons.push(itemData);
        else inventoryWeapons.push(itemData);
      } else if (i.type === "skill") skills.push(itemData);
      else if (i.type === "ability") abilities.push(itemData);
      else if (i.type === "armor" || i.type === "shield") inventoryArmor.push(itemData);
      else if (i.type === "ammo") inventoryAmmo.push(itemData);
      else if (i.type === "consumable") inventoryConsumables.push(itemData);
      else if (i.type === "tool") inventoryTools.push(itemData);
      else if (i.type === "questItem") inventoryQuestItems.push(itemData);
      else if (i.type === "backpack") inventoryBackpacks.push(itemData);
      else if (i.type === "trait") traits.push(itemData);
      else if (i.type === "race") ;
      else if (i.type === "equipment") inventoryMisc.push(itemData);
    }
    const ammoItems = inventoryAmmo;
    for (const weapon of weapons) {
      if (!weapon.system.isRanged) continue;
      const linkedId = weapon.system.ammoItemId;
      weapon.ammoOptions = ammoItems.map((a) => ({
        id: a.id,
        name: a.name,
        current: a.system.uses.value,
        max: a.system.uses.max,
        selected: a.id === linkedId
      }));
      weapon.linkedAmmo = linkedId && linkedId !== "custom" ? ammoItems.find((a) => a.id === linkedId) || null : null;
    }
    const equippedSection = { id: "hand", label: game.i18n.localize("TAMS.Inventory.SectionEquipped"), items: [], type: "status" };
    const containerSectionMap = {};
    for (const bp of inventoryBackpacks) {
      containerSectionMap[bp.id] = {
        id: bp.id,
        label: bp.name,
        items: [],
        type: "container",
        item: bp,
        isEquipped: bp.system.equipped,
        capacity: bp.system.capacity,
        modifier: bp.system.modifier
      };
    }
    const stowedSection = { id: "stowed", label: game.i18n.localize("TAMS.Inventory.SectionStowed"), items: [], type: "status" };
    for (const item of allItems) {
      if (["skill", "ability", "trait"].includes(item.type)) continue;
      if (item.isEquipped && item.type !== "backpack") {
        equippedSection.items.push(item);
      } else if (item.system.location && item.system.location !== "stowed" && item.system.location !== "hand") {
        let loc = item.system.location;
        if (loc === "backpack") {
          const firstBP = inventoryBackpacks.find((bp) => bp.system.equipped);
          if (firstBP && containerSectionMap[firstBP.id]) containerSectionMap[firstBP.id].items.push(item);
          else stowedSection.items.push(item);
        } else if (containerSectionMap[loc]) {
          containerSectionMap[loc].items.push(item);
        } else {
          stowedSection.items.push(item);
        }
      } else if (item.type !== "backpack") {
        stowedSection.items.push(item);
      }
    }
    const rawSections = [equippedSection, ...Object.values(containerSectionMap), stowedSection];
    const typeLabels = { weapon: "Weapons", armor: "Armor", ammo: "Ammunition", consumable: "Consumables", tool: "Tools", questItem: "Quest Items", equipment: "Miscellaneous" };
    const typeOrder = ["Weapons", "Armor", "Ammunition", "Consumables", "Tools", "Quest Items", "Miscellaneous"];
    const sortKey = this._inventorySort || "name";
    const filterType = this._inventoryFilter || "all";
    const search = (this._inventorySearch || "").trim().toLowerCase();
    const sizeRank = { small: 0, medium: 1, large: 2 };
    const matchesFilters = (item) => {
      if (filterType !== "all" && item.type !== filterType) return false;
      if (search && !item.name.toLowerCase().includes(search)) return false;
      return true;
    };
    const sortItems = (items) => items.sort((a, b) => {
      switch (sortKey) {
        case "type":
          return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
        case "size":
          return (sizeRank[a.system.size] ?? 0) - (sizeRank[b.system.size] ?? 0) || a.name.localeCompare(b.name);
        case "quantity":
          return (b.system.quantity || 0) - (a.system.quantity || 0) || a.name.localeCompare(b.name);
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });
    for (const s of rawSections) {
      const groups = {};
      for (const item of s.items) {
        if (!matchesFilters(item)) continue;
        const label = typeLabels[item.type] || "Other";
        if (!groups[label]) groups[label] = { label, items: [] };
        groups[label].items.push(item);
      }
      for (const g of Object.values(groups)) sortItems(g.items);
      s.categories = Object.values(groups).sort((a, b) => {
        let indexA = typeOrder.indexOf(a.label);
        let indexB = typeOrder.indexOf(b.label);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      });
      s.visibleCount = s.categories.reduce((n, c) => n + c.items.length, 0);
    }
    context.inventorySort = sortKey;
    context.inventoryFilter = filterType;
    context.inventorySearch = this._inventorySearch || "";
    context.inventorySortOptions = {
      name: "TAMS.Inventory.SortName",
      type: "TAMS.Inventory.SortType",
      size: "TAMS.Inventory.SortSize",
      quantity: "TAMS.Inventory.SortQuantity"
    };
    context.inventoryFilterOptions = {
      all: "TAMS.Inventory.FilterAll",
      weapon: "TAMS.Weapon",
      armor: "TAMS.Armor",
      shield: "TAMS.Shield",
      ammo: "TAMS.Ammo",
      consumable: "TAMS.Consumable",
      tool: "TAMS.Tool",
      questItem: "TAMS.QuestItem",
      backpack: "TAMS.Container",
      equipment: "TAMS.Misc"
    };
    context.inventorySections = rawSections.filter((s) => s.visibleCount > 0 || s.type === "container");
    context.weapons = weapons;
    context.equippedWeapons = equippedWeapons;
    context.inventoryWeapons = inventoryWeapons;
    context.inventoryArmor = inventoryArmor;
    context.inventoryAmmo = inventoryAmmo;
    context.inventoryConsumables = inventoryConsumables;
    context.inventoryTools = inventoryTools;
    context.inventoryQuestItems = inventoryQuestItems;
    context.inventoryBackpacks = inventoryBackpacks;
    context.inventoryMisc = inventoryMisc;
    context.skills = skills;
    context.abilities = abilities;
    context.traits = traits;
    const raceDoc = this.document.items.find((i) => i.type === "race") ?? null;
    context.raceItem = raceDoc ? { id: raceDoc.id, name: raceDoc.name, img: raceDoc.img, system: raceDoc.system } : null;
    const sceneItems = [
      ...weapons.map((i) => ({ ...i, sceneType: game.i18n.localize("TAMS.Weapon") })),
      ...skills.map((i) => ({ ...i, sceneType: game.i18n.localize("TAMS.Skill") })),
      ...abilities.map((i) => ({ ...i, sceneType: game.i18n.localize("TAMS.Ability") }))
    ].sort((a, b) => (b.system.usedInScene ? 1 : 0) - (a.system.usedInScene ? 1 : 0) || a.name.localeCompare(b.name));
    context.sceneItems = sceneItems;
  }
  /**
   * Prepare options for select fields.
   * @param {object} context The context object to modify.
   * @protected
   */
  _prepareSelectOptions(context) {
    context.statOptions = {
      "strength": "TAMS.StatStrength",
      "dexterity": "TAMS.StatDexterity",
      "endurance": "TAMS.StatEndurance",
      "wisdom": "TAMS.StatWisdom",
      "intelligence": "TAMS.StatIntelligence",
      "bravery": "TAMS.StatBravery",
      "custom": "TAMS.StatCustom"
    };
    context.themeOptions = { "default": "TAMS.ThemeDefault", "dark": "TAMS.ThemeDark", "parchment": "TAMS.ThemeParchment", "grimdark": "TAMS.ThemeGrimdark", "cyberpunk": "TAMS.ThemeCyberpunk", "gothic": "TAMS.ThemeGothic", "tactical": "TAMS.ThemeTactical" };
    context.npcTypeOptions = { "individual": "TAMS.NPCTypeIndividual", "squad": "TAMS.NPCTypeSquad", "horde": "TAMS.NPCTypeHorde" };
    context.npcRankOptions = { "mook": "TAMS.NPCRankMook", "elite": "TAMS.NPCRankElite", "boss": "TAMS.NPCRankBoss" };
    context.creatureSizeOptions = { "tiny": "TAMS.CreatureSizeOptions.Tiny", "small": "TAMS.CreatureSizeOptions.Small", "normal": "TAMS.CreatureSizeOptions.Normal", "large": "TAMS.CreatureSizeOptions.Large", "huge": "TAMS.CreatureSizeOptions.Huge", "giant": "TAMS.CreatureSizeOptions.Giant" };
    context.limbOptions = {
      "none": "TAMS.CalculatorOptions.None",
      "head": "TAMS.HitLocations.Head",
      "thorax": "TAMS.HitLocations.Thorax",
      "stomach": "TAMS.HitLocations.Stomach",
      "leftArm": "TAMS.HitLocations.LeftArm",
      "rightArm": "TAMS.HitLocations.RightArm",
      "leftLeg": "TAMS.HitLocations.LeftLeg",
      "rightLeg": "TAMS.HitLocations.RightLeg"
    };
    context.sizeOptions = { "small": "TAMS.SizeOptions.Small", "medium": "TAMS.SizeOptions.Medium", "large": "TAMS.SizeOptions.Large" };
    context.damageTypeOptions = {
      "": "TAMS.DamageType.None",
      "blunt": "TAMS.DamageType.blunt",
      "piercing": "TAMS.DamageType.piercing",
      "slashing": "TAMS.DamageType.slashing",
      "fire": "TAMS.DamageType.fire",
      "magic": "TAMS.DamageType.magic",
      "psychic": "TAMS.DamageType.psychic",
      "acid": "TAMS.DamageType.acid",
      "divine": "TAMS.DamageType.divine"
    };
    const locationOptions = { "hand": "TAMS.LocationOptions.Hand", "stowed": "TAMS.LocationOptions.Stowed", "backpack": "TAMS.LocationOptions.Backpack" };
    for (const bp of context.inventoryBackpacks || []) {
      locationOptions[bp.id] = game.i18n.format("TAMS.LocationOptions.InContainer", { name: bp.name });
    }
    context.locationOptions = locationOptions;
    const LIMB_KEYS2 = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
    const LIMB_I18N = {
      head: "TAMS.HitLocations.Head",
      thorax: "TAMS.HitLocations.Thorax",
      stomach: "TAMS.HitLocations.Stomach",
      leftArm: "TAMS.HitLocations.LeftArm",
      rightArm: "TAMS.HitLocations.RightArm",
      leftLeg: "TAMS.HitLocations.LeftLeg",
      rightLeg: "TAMS.HitLocations.RightLeg"
    };
    const LIMB_ABBREV = {
      head: "TAMS.Race.LimbAbbrev.Head",
      thorax: "TAMS.Race.LimbAbbrev.Thorax",
      stomach: "TAMS.Race.LimbAbbrev.Stomach",
      leftArm: "TAMS.Race.LimbAbbrev.LeftArm",
      rightArm: "TAMS.Race.LimbAbbrev.RightArm",
      leftLeg: "TAMS.Race.LimbAbbrev.LeftLeg",
      rightLeg: "TAMS.Race.LimbAbbrev.RightLeg"
    };
    context.enrichedResistances = (this.document.system.resistances ?? []).map((res, index) => {
      const active = new Set(res.limbs ?? []);
      return {
        ...res,
        index,
        isGlobal: active.size === 0,
        limbButtons: LIMB_KEYS2.map((key) => ({
          key,
          active: active.has(key),
          i18nKey: LIMB_I18N[key],
          abbrevKey: LIMB_ABBREV[key]
        }))
      };
    });
  }
  /**
   * Prepare currency data and settings.
   * @param {object} context The context object to modify.
   * @protected
   */
  _prepareCurrencyData(context) {
    const currencySettingsRaw = game.settings.get("tams", "currencies") || "";
    let currencyNames = [];
    try {
      if (currencySettingsRaw.trim().startsWith("[")) {
        currencyNames = JSON.parse(currencySettingsRaw).map((c) => c.name);
      } else {
        currencyNames = currencySettingsRaw.split(",").map((s) => s.trim()).filter((s) => s);
      }
    } catch (e2) {
      currencyNames = currencySettingsRaw.split(",").map((s) => s.trim()).filter((s) => s);
    }
    const enabledCurrencies = this.document.system.settings.enabledCurrencies || {};
    context.allCurrencyNames = currencyNames;
    context.currencies = currencyNames.map((name) => ({
      name,
      value: this.document.system.currencies[name] || 0,
      enabled: enabledCurrencies[name] !== false
    }));
  }
  /**
   * Prepare armor options for each limb.
   * @param {object} context The context object to modify.
   * @protected
   */
  _prepareLimbArmorOptions(context) {
    var _a, _b;
    const armorItems = this.document.items.filter((i) => i.type === "armor");
    context.limbArmorOptions = {};
    const limbKeys = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
    for (const limbKey of limbKeys) {
      context.limbArmorOptions[limbKey] = { "": "None" };
      const currentArmorId = (_a = this.document.system.limbs[limbKey]) == null ? void 0 : _a.equippedArmorId;
      for (const armor of armorItems) {
        if (((_b = armor.system.limbs[limbKey]) == null ? void 0 : _b.max) > 0 || armor.id === currentArmorId) {
          context.limbArmorOptions[limbKey][armor.id] = armor.name;
        }
      }
    }
    let capacityMode = "weight";
    try {
      capacityMode = game.settings.get("tams", "capacityMode") || "weight";
    } catch (e2) {
    }
    const inv = this.document.system.inventory;
    context.inventory = {
      ...inv,
      usedMedium: (inv.usedCapacity / 10).toFixed(1).replace(/\.0$/, ""),
      maxMedium: (inv.maxCapacity / 10).toFixed(1).replace(/\.0$/, ""),
      capacityMode
    };
    context.capacityMode = capacityMode;
    context.isSlotMode = capacityMode === "slots";
    if (capacityMode === "slots") {
      context.capacityPercentage = Math.clamp(inv.usedSlots / (inv.maxSlots || 1) * 100, 0, 100);
    }
  }
  _prepareHonorData(context) {
    context.honorEnabled = isHonorEnabled();
    if (!context.honorEnabled) return;
    const honor = this.document.system.honor ?? {};
    context.honorPaths = Object.entries(HONOR_PATHS).map(([id, pathData]) => {
      const score = honor[id] ?? 0;
      const currentTier = getHonorTier(score, id);
      const ci = pathData.tiers.indexOf(currentTier);
      const mkTier = (tier, i) => ({
        labelKey: tier.labelKey,
        glossKey: tier.glossKey,
        active: i <= 4 ? ci <= i : ci >= i,
        // honor: ci<=i; dishonor: ci>=i
        current: ci === i
      });
      const honorTiers = pathData.tiers.slice(0, 4).map((t, i) => mkTier(t, i));
      const dishonorTiers = pathData.tiers.slice(5).map((t, j) => mkTier(t, j + 5));
      const HONOR_HI = [100, 90, 75, 50];
      const hFill = (s, n) => {
        const lo = pathData.tiers[n].min, hi = HONOR_HI[n];
        if (s < lo) return 0;
        if (s >= hi) return 1;
        return (s - lo) / (hi - lo);
      };
      const dFill = (s, n) => {
        const ai = 8 - n, lo = pathData.tiers[ai].min, hi = pathData.tiers[ai - 1].min - 1;
        if (s > hi) return 0;
        if (s <= lo) return 1;
        return (hi - s) / (hi - lo);
      };
      const fills = [0, 1, 2, 3].map(
        (n) => parseFloat((score >= 0 ? hFill(score, n) : dFill(score, n)).toFixed(3))
      );
      return {
        id,
        score,
        labelKey: pathData.labelKey,
        honorTiers,
        dishonorTiers,
        ht0: honorTiers[0],
        ht1: honorTiers[1],
        ht2: honorTiers[2],
        ht3: honorTiers[3],
        dt0: dishonorTiers[0],
        dt1: dishonorTiers[1],
        dt2: dishonorTiers[2],
        dt3: dishonorTiers[3],
        common: { ...mkTier(pathData.tiers[4], 4), labelKey: "TAMS.Honor.Tier.Common", glossKey: "TAMS.Honor.Gloss.Common" },
        seg: {
          h0: ci <= 0,
          h1: ci <= 1,
          h2: ci <= 2,
          h3: ci <= 3,
          d0: ci >= 5,
          d1: ci >= 6,
          d2: ci >= 7,
          d3: ci >= 8,
          fill0: fills[0],
          fill1: fills[1],
          fill2: fills[2],
          fill3: fills[3]
        }
      };
    });
    context.canEditHonor = game.user.isGM || this.document.isOwner;
  }
  /**
   * Handle creating a new item on the actor.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onItemCreate(event, target) {
    const type = target.dataset.type;
    const itemData = {
      name: `New ${type.capitalize()}`,
      type
    };
    try {
      return await this.document.createEmbeddedDocuments("Item", [itemData]);
    } catch (err) {
      console.error(`TAMS | Failed to create item:`, err);
      ui.notifications.error(game.i18n.format("TAMS.Checks.Notifications.ItemCreationFailed", { type }));
      throw err;
    }
  }
  /**
   * Handle editing an existing item.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onItemEdit(event, target) {
    var _a;
    const itemId = target.dataset.itemId || ((_a = target.closest(".item")) == null ? void 0 : _a.dataset.itemId);
    const item = this.document.items.get(itemId);
    if (item) item.sheet.render(true);
  }
  /**
   * Handle deleting an existing item.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onItemDelete(event, target) {
    var _a;
    const itemId = target.dataset.itemId || ((_a = target.closest(".item")) == null ? void 0 : _a.dataset.itemId);
    const item = this.document.items.get(itemId);
    if (!item) return;
    if (event.shiftKey) {
      return item.delete();
    }
    const confirmed = await Dialog.confirm({
      title: game.i18n.localize("TAMS.DeleteConfirmTitle"),
      content: game.i18n.format("TAMS.DeleteConfirmContent", { name: item.name }),
      yes: () => true,
      no: () => false,
      defaultYes: false
    });
    if (confirmed) {
      item.delete();
    }
  }
  /**
   * Handle removing the slotted race from the actor.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onRaceRemove(event, target) {
    const existing = this.document.items.filter((i) => i.type === "race");
    const granted = this.document.items.filter((i) => i.getFlag("tams", "raceGranted"));
    const toDelete = [...existing.map((i) => i.id), ...granted.map((i) => i.id)];
    if (toDelete.length) await this.document.deleteEmbeddedDocuments("Item", toDelete);
  }
  /**
   * Handle giving an item to another actor.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onItemGive(event, target) {
    var _a, _b;
    const itemId = target.dataset.itemId || ((_a = target.closest(".item")) == null ? void 0 : _a.dataset.itemId);
    const item = this.document.items.get(itemId);
    if (!item) return;
    const tokens = canvas.tokens.placeables.filter((t) => t.actor && t.actor.id !== this.document.id && t.actor.type === "character");
    if (tokens.length === 0) {
      return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NoCharactersFound"));
    }
    const myToken = ((_b = this.document.token) == null ? void 0 : _b.object) || canvas.tokens.controlled.find((t) => {
      var _a2;
      return ((_a2 = t.actor) == null ? void 0 : _a2.id) === this.document.id;
    });
    if (myToken) {
      tokens.sort((a, b) => {
        const distA = canvas.grid.measureDistance(myToken.center, a.center);
        const distB = canvas.grid.measureDistance(myToken.center, b.center);
        return distA - distB;
      });
    }
    const options = tokens.map((t) => `<option value="${t.actor.uuid}">${t.name}${t.actor.isToken ? ` (${game.i18n.localize("TAMS.Loot")})` : ""}</option>`).join("");
    const content = `
        <div class="form-group">
            <p>${game.i18n.localize("TAMS.GiveItem")}: <b>${item.name}</b></p>
            <label>${game.i18n.localize("TAMS.Recipient")}</label>
            <select name="recipientUuid" style="width: 100%; margin-bottom: 10px;">
                ${options}
            </select>
        </div>
    `;
    new Dialog({
      title: `${game.i18n.localize("TAMS.GiveItem")}: ${item.name}`,
      content,
      buttons: {
        give: {
          icon: '<i class="fas fa-gift"></i>',
          label: game.i18n.localize("TAMS.Give"),
          callback: async (html) => {
            const recipientUuid = html.find('[name="recipientUuid"]').val();
            const targetActor = await fromUuid(recipientUuid);
            if (!targetActor) return;
            if (targetActor.isOwner) {
              tamsHandleItemTransfer({
                itemData: item.toObject(),
                sourceActorUuid: this.document.uuid,
                targetActorUuid: recipientUuid,
                newLocation: "stowed"
              });
            } else {
              game.socket.emit("system.tams", {
                type: "transferItem",
                itemData: item.toObject(),
                sourceActorUuid: this.document.uuid,
                targetActorUuid: recipientUuid,
                newLocation: "stowed"
              });
              ui.notifications.info(game.i18n.format("TAMS.Checks.Notifications.GivingItem", { item: item.name, target: targetActor.name }));
            }
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("TAMS.Cancel")
        }
      },
      default: "give"
    }).render(true);
  }
  /**
   * Handle exporting an item to the sidebar.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onItemExport(event, target) {
    var _a;
    const itemId = target.dataset.itemId || ((_a = target.closest(".item")) == null ? void 0 : _a.dataset.itemId);
    const item = this.document.items.get(itemId);
    if (!item) return;
    if (!game.user.can("ITEM_CREATE")) {
      return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NoSidebarPermission"));
    }
    const itemData = item.toObject();
    delete itemData._id;
    delete itemData.folder;
    if (itemData.system.location) itemData.system.location = "stowed";
    if (itemData.system.equipped !== void 0) itemData.system.equipped = false;
    try {
      await Item.create(itemData);
      ui.notifications.info(game.i18n.format("TAMS.Checks.Notifications.ItemExported", { item: item.name }));
    } catch (err) {
      console.error("TAMS | Export failed", err);
      ui.notifications.error(game.i18n.format("TAMS.Checks.Notifications.ItemExportFailed", { item: item.name }));
    }
  }
  /**
   * Post an item's description to chat.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onItemSendDescription(event, target) {
    var _a;
    const itemId = target.dataset.itemId || ((_a = target.closest(".item")) == null ? void 0 : _a.dataset.itemId);
    const item = this.document.items.get(itemId);
    if (!item) return;
    const enrichedDesc = item.system.description ? await TextEditor.enrichHTML(item.system.description, { secrets: false, async: true }) : `<em>${game.i18n.localize("TAMS.NoDescription")}</em>`;
    const content = `
      <div class="tams-item-description">
        <div class="item-desc-header" style="display:flex; align-items:center; gap:8px; margin-bottom:6px; border-bottom:1px solid rgba(0,0,0,0.2); padding-bottom:4px;">
          <img src="${foundry.utils.escapeHTML(item.img)}" width="32" height="32" style="border-radius:3px;"/>
          <strong style="font-size:1.1em;">${foundry.utils.escapeHTML(item.name)}</strong>
        </div>
        ${enrichedDesc}
      </div>`;
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      content
    });
  }
  /**
   * Handle using a charge from an item.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onItemUseCharge(event, target) {
    var _a;
    const itemId = target.dataset.itemId || ((_a = target.closest(".item")) == null ? void 0 : _a.dataset.itemId);
    const item = this.document.items.get(itemId);
    if (!item) return;
    let { value, max } = item.system.uses || { value: 0, max: 0 };
    let quantity = item.system.quantity;
    if (value > 0) {
      value -= 1;
    } else if (quantity > 0) {
      quantity -= 1;
      value = Math.max(0, max - 1);
    } else {
      ui.notifications.warn(game.i18n.format("TAMS.Checks.Notifications.NoChargesLeft", { item: item.name }));
      return;
    }
    await item.update({
      "system.uses.value": value,
      "system.quantity": quantity
    });
  }
  /**
   * Handle recharging an item using resources.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onItemRecharge(event, target) {
    var _a, _b;
    const itemId = target.dataset.itemId || ((_a = target.closest(".item")) == null ? void 0 : _a.dataset.itemId);
    const item = this.document.items.get(itemId);
    if (!item) return;
    const { value, max } = item.system.uses || { value: 0, max: 0 };
    const cost = item.system.cost || 0;
    const resourceId = item.system.resource;
    const isApex = item.system.isApex;
    const doRecharge = async (amount) => {
      amount = parseInt(amount) || 0;
      if (amount <= 0) return;
      const actualAmount = Math.min(amount, max - value);
      if (actualAmount <= 0) return;
      if (!isApex && cost > 0) {
        const totalCost = actualAmount * cost;
        const actor = this.document;
        if (resourceId === "stamina") {
          if (actor.system.stamina.value < totalCost) {
            ui.notifications.warn(game.i18n.format("TAMS.Checks.Notifications.NotEnoughStaminaRecharge", { item: item.name, cost: totalCost, current: actor.system.stamina.value }));
            return;
          }
          await actor.update({ "system.stamina.value": actor.system.stamina.value - totalCost });
        } else {
          const resIndex = parseInt(resourceId);
          if (!isNaN(resIndex) && actor.system.customResources[resIndex]) {
            const res = actor.system.customResources[resIndex];
            if (res.value < totalCost) {
              ui.notifications.warn(game.i18n.format("TAMS.Checks.Notifications.NotEnoughResourceRecharge", { resource: res.name, item: item.name, cost: totalCost, current: res.value }));
              return;
            }
            await actor.update({ [`system.customResources.${resIndex}.value`]: res.value - totalCost });
          }
        }
      }
      await item.update({ "system.uses.value": value + actualAmount });
    };
    if (event.shiftKey) {
      return doRecharge(max - value);
    }
    const resourceName = resourceId === "stamina" ? game.i18n.localize("TAMS.Stamina") : ((_b = this.document.system.customResources[parseInt(resourceId)]) == null ? void 0 : _b.name) || game.i18n.localize("TAMS.Resource");
    const costInfo = !isApex && cost > 0 ? `<p style="margin: 5px 0;">${game.i18n.format("TAMS.RechargeCostPerCharge", { cost, resource: resourceName })}</p>` : "";
    const content = `
      <div class="form-group">
        <label>${game.i18n.localize("TAMS.RechargeContent")}</label>
        <input type="number" name="amount" value="${max - value}" min="0" max="${max - value}"/>
      </div>
      ${costInfo}
    `;
    new Dialog({
      title: game.i18n.format("TAMS.RechargeTitle", { name: item.name }),
      content,
      buttons: {
        recharge: {
          icon: '<i class="fas fa-bolt"></i>',
          label: game.i18n.localize("TAMS.Recharge"),
          callback: (html) => {
            const amount = html.find('[name="amount"]').val();
            doRecharge(amount);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("TAMS.Cancel")
        }
      },
      default: "recharge"
    }).render(true);
  }
  /**
   * Handle updating an item's field directly from the sheet.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onUpdateItemField(event, target) {
    const itemId = target.dataset.itemId;
    const field = target.dataset.field;
    let value = target.value;
    if (target.type === "number") value = parseFloat(value);
    if (target.type === "checkbox") value = target.checked;
    const item = this.document.items.get(itemId);
    if (item) await item.update({ [field]: value });
  }
  /**
   * Resolve the item id from a clicked control or its containing row.
   * @param {HTMLElement} target The clicked element.
   * @returns {string|undefined} The resolved item id.
   * @protected
   */
  _resolveItemId(target) {
    var _a;
    return target.dataset.itemId || ((_a = target.closest(".item")) == null ? void 0 : _a.dataset.itemId);
  }
  /**
   * Check whether the configured equip (hand) limit has been reached.
   * @param {string} kind The slot kind being filled (currently only "hand").
   * @returns {boolean} True when the limit is enforced and already reached.
   * @protected
   */
  _equipLimitReached(kind) {
    var _a;
    let enforce = false;
    let maxHands = 2;
    try {
      enforce = game.settings.get("tams", "enforceEquipLimit");
      maxHands = game.settings.get("tams", "maxHands") || 2;
    } catch (e2) {
    }
    if (!enforce) return false;
    if (kind === "hand") {
      let used = 0;
      for (const it of this.document.items) {
        if (it.type === "weapon" && it.system.location === "hand") used += it.system.isTwoHanded ? 2 : 1;
        else if (it.type === "shield" && it.system.equipped) used += 1;
      }
      if (used >= maxHands) {
        (_a = ui.notifications) == null ? void 0 : _a.warn(game.i18n.format("TAMS.Checks.Notifications.HandsFull", { max: maxHands }));
        return true;
      }
    }
    return false;
  }
  /**
   * Quick-action: toggle whether an item is equipped / held in hand.
   * @param {Event} event The originating event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onItemEquip(event, target) {
    const item = this.document.items.get(this._resolveItemId(target));
    if (!item) return;
    if (item.type === "weapon") {
      const toHand = item.system.location !== "hand";
      if (toHand && this._equipLimitReached("hand")) return;
      return item.update({ "system.location": toHand ? "hand" : "stowed" });
    }
    if (["armor", "shield", "backpack"].includes(item.type)) {
      const equip = !item.system.equipped;
      if (equip && item.type === "shield" && this._equipLimitReached("hand")) return;
      return item.update({ "system.equipped": equip });
    }
  }
  /**
   * Quick-action: stow an item back to the loose pile (unequip / remove from bag).
   * @param {Event} event The originating event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onItemStow(event, target) {
    const item = this.document.items.get(this._resolveItemId(target));
    if (!item) return;
    const updates = { "system.location": "stowed" };
    if (foundry.utils.hasProperty(item, "system.equipped")) updates["system.equipped"] = false;
    return item.update(updates);
  }
  /**
   * Quick-action: increment/decrement an item's quantity.
   * @param {Event} event The originating event.
   * @param {HTMLElement} target The clickable element carrying `data-delta`.
   * @protected
   */
  async _onItemQtyDelta(event, target) {
    const item = this.document.items.get(this._resolveItemId(target));
    if (!item) return;
    const delta = parseInt(target.dataset.delta) || 0;
    const qty = Math.max(0, (Number(item.system.quantity) || 0) + delta);
    return item.update({ "system.quantity": qty });
  }
  /**
   * Toggle the inline detail/edit panel for an inventory row.
   * @param {Event} event The originating event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  _onToggleItemDetails(event, target) {
    const itemId = this._resolveItemId(target);
    if (!itemId) return;
    this._expandedItems ?? (this._expandedItems = /* @__PURE__ */ new Set());
    if (this._expandedItems.has(itemId)) this._expandedItems.delete(itemId);
    else this._expandedItems.add(itemId);
    this.render();
  }
  /**
   * Set the active inventory sort key.
   * @param {Event} event The originating event.
   * @param {HTMLElement} target The select element.
   * @protected
   */
  _onSetInventorySort(event, target) {
    this._inventorySort = target.value || "name";
    this.render();
  }
  /**
   * Set the active inventory type filter.
   * @param {Event} event The originating event.
   * @param {HTMLElement} target The select element.
   * @protected
   */
  _onSetInventoryFilter(event, target) {
    this._inventoryFilter = target.value || "all";
    this.render();
  }
  /**
   * Handle an armor repair check. Each covered zone with missing points rolls
   * its own check; falling short permanently reduces that zone's max armor.
   * @param {Event} event The originating event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onItemRepair(event, target) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    const item = this.document.items.get(this._resolveItemId(target));
    if (!item || item.type !== "armor") return;
    const skills = this.document.items.filter((i) => i.type === "skill");
    let optionsHtml = `<option value="int">${game.i18n.localize("TAMS.StatIntelligence")}</option>`;
    for (const s of skills) optionsHtml += `<option value="${s.id}">${s.name}</option>`;
    const choice = await new Promise((resolve) => {
      new Dialog({
        title: game.i18n.format("TAMS.Repair.Title", { name: item.name }),
        content: `<div class="form-group"><label>${game.i18n.localize("TAMS.Repair.SelectSkill")}</label><select name="skill" style="width:100%">${optionsHtml}</select></div>`,
        buttons: {
          repair: { icon: '<i class="fas fa-hammer"></i>', label: game.i18n.localize("TAMS.Repair.Action"), callback: (html) => resolve(html.find('[name="skill"]').val()) },
          cancel: { icon: '<i class="fas fa-times"></i>', label: game.i18n.localize("TAMS.Cancel"), callback: () => resolve(null) }
        },
        default: "repair"
      }).render(true);
    });
    if (!choice) return;
    let checkLabel;
    let checkValue;
    if (choice === "int") {
      checkLabel = game.i18n.localize("TAMS.StatIntelligence");
      checkValue = ((_a = this.document.system.stats.intelligence) == null ? void 0 : _a.total) || 0;
    } else {
      const skill = this.document.items.get(choice);
      checkLabel = (skill == null ? void 0 : skill.name) || game.i18n.localize("TAMS.Skill");
      const statKey = ((_b = skill == null ? void 0 : skill.system) == null ? void 0 : _b.stat) || "intelligence";
      checkValue = (((_c = this.document.system.stats[statKey]) == null ? void 0 : _c.total) || 0) + (((_d = skill == null ? void 0 : skill.system) == null ? void 0 : _d.familiarity) || 0) + (((_e = skill == null ? void 0 : skill.system) == null ? void 0 : _e.bonus) || 0);
    }
    const alternate = !!((_f = this.document.system.settings) == null ? void 0 : _f.alternateArmour);
    const limbKeys = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
    const itemUpdates = {};
    const actorUpdates = {};
    let report = `<div class="tams-roll"><h3 class="roll-label">${game.i18n.format("TAMS.Repair.Title", { name: item.name })}</h3>`;
    report += `<div class="roll-row"><small>${game.i18n.localize("TAMS.Repair.Using")}:</small><span>${checkLabel} (${checkValue})</span></div>`;
    let repaired = false;
    for (const key of limbKeys) {
      const zone = (_g = item.system.limbs) == null ? void 0 : _g[key];
      if (!zone || (zone.max || 0) <= 0) continue;
      const missing = Math.max(0, (zone.max || 0) - (zone.value || 0));
      if (missing <= 0) continue;
      repaired = true;
      const roll = await new Roll("1d100").evaluate();
      const capped = Math.min(roll.total, checkValue);
      const result = computeArmorRepair({ value: zone.value, max: zone.max, rollTotal: capped, alternate });
      itemUpdates[`system.limbs.${key}.value`] = result.newValue;
      itemUpdates[`system.limbs.${key}.max`] = result.newMax;
      if (((_h = this.document.system.limbs[key]) == null ? void 0 : _h.equippedArmorId) === item.id) {
        actorUpdates[`system.limbs.${key}.armor`] = result.newValue;
        actorUpdates[`system.limbs.${key}.armorMax`] = result.newMax;
      }
      const label = ((_i = this.document.system.limbs[key]) == null ? void 0 : _i.label) || key;
      report += `<div class="roll-row"><b>${label}</b><span>${game.i18n.format("TAMS.Repair.ZoneResult", { roll: capped, difficulty: result.difficulty })}</span></div>`;
      report += `<div class="roll-row-detail"><small>${result.success ? game.i18n.localize("TAMS.Repair.FullyRepaired") : game.i18n.format("TAMS.Repair.MaxLost", { lost: result.maxLost, newMax: result.newMax })}</small></div>`;
    }
    if (!repaired) {
      (_j = ui.notifications) == null ? void 0 : _j.info(game.i18n.localize("TAMS.Repair.NothingToRepair"));
      return;
    }
    report += `</div>`;
    await item.update(itemUpdates);
    if (Object.keys(actorUpdates).length > 0) await this.document.update(actorUpdates);
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this.document }), content: report });
  }
  /**
   * Handle changing the actor or item image.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onEditImage(event, target) {
    const attr = target.dataset.edit || "img";
    const current = foundry.utils.getProperty(this.document, attr);
    const fp = new FilePicker({
      type: "image",
      current,
      callback: (path) => {
        this.document.update({ [attr]: path });
      },
      top: this.position.top + 40,
      left: this.position.left + 10
    });
    return fp.browse();
  }
  /**
   * Handle fully healing the actor.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onFullHeal(event, target) {
    const updates = {};
    const limbKeys = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
    for (const id of limbKeys) {
      const limb = this.document.system.limbs[id];
      if (!limb) continue;
      updates[`system.limbs.${id}.value`] = limb.max;
      updates[`system.limbs.${id}.injured`] = false;
      updates[`system.limbs.${id}.criticallyInjured`] = false;
    }
    await this.document.update(updates);
    ui.notifications.info(game.i18n.format("TAMS.Checks.Notifications.ActorFullyHealed", { name: this.document.name }));
  }
  /** @override */
  _canDragDrop(selector) {
    return this.isEditable;
  }
  /** @override */
  async _onDrop(event) {
    var _a, _b, _c, _d;
    const data = TextEditor.getDragEventData(event);
    if (data.type !== "Item") return super._onDrop(event);
    let item;
    try {
      item = await Item.fromDropData(data);
    } catch (err) {
      if (data.uuid) {
        const parts = data.uuid.split(".");
        if (parts[0] === "Item") {
          item = game.items.get(parts[1]) ?? null;
        } else if (parts[0] === "Compendium" && parts.length >= 5) {
          const packId = `${parts[1]}.${parts[2]}`;
          const docId = parts[4];
          const pack = game.packs.get(packId);
          if (pack) {
            try {
              const docs = await pack.getDocuments();
              item = docs.find((d) => d.id === docId) ?? null;
            } catch (e2) {
            }
          }
        }
      }
      if (!item) {
        console.error("TAMS | _onDrop: could not resolve item", err);
        return;
      }
    }
    if (item.type === "race") {
      if (!this.document.isOwner) return;
      if (((_a = item.parent) == null ? void 0 : _a.uuid) === this.document.uuid) return;
      const existing = this.document.items.filter((i) => i.type === "race");
      const previouslyGranted = this.document.items.filter((i) => i.getFlag("tams", "raceGranted"));
      const toDelete = [...existing.map((i) => i.id), ...previouslyGranted.map((i) => i.id)];
      if (toDelete.length) await this.document.deleteEmbeddedDocuments("Item", toDelete);
      const raceData = item.toObject();
      delete raceData._id;
      await this.document.createEmbeddedDocuments("Item", [raceData]);
      const grantedAbilities = item.system.grantedAbilities ?? [];
      if (grantedAbilities.length) {
        const toCreate = grantedAbilities.map((a) => {
          const d = foundry.utils.duplicate(a);
          delete d._id;
          foundry.utils.setProperty(d, "flags.tams.raceGranted", true);
          return d;
        });
        await this.document.createEmbeddedDocuments("Item", toCreate);
      }
      return;
    }
    const targetEl = event.target.closest(".item[data-item-id], .inventory-section[data-section-id]");
    let newLocation = "";
    if (targetEl) {
      const targetSectionId = targetEl.dataset.sectionId;
      const targetItemId = targetEl.dataset.itemId;
      if (targetSectionId) {
        if (targetSectionId === "hand") newLocation = "hand";
        else if (targetSectionId === "stowed") newLocation = "stowed";
        else newLocation = targetSectionId;
      } else if (targetItemId) {
        const targetItem = this.document.items.get(targetItemId);
        if ((targetItem == null ? void 0 : targetItem.type) === "backpack" && item.id !== targetItem.id) {
          newLocation = targetItem.id;
        } else if (targetItem) {
          newLocation = targetItem.system.location || "stowed";
        }
      }
    }
    const isSameActor = ((_b = item.parent) == null ? void 0 : _b.uuid) === this.document.uuid;
    if (isSameActor && ["skill", "ability", "weapon"].includes(item.type) && (targetEl == null ? void 0 : targetEl.dataset.itemId)) {
      const targetItemId = targetEl.dataset.itemId;
      if (targetItemId !== item.id) {
        const targetItem = this.document.items.get(targetItemId);
        if (targetItem && targetItem.type === item.type) {
          const ordered = [...this.document.items].filter((i) => i.type === item.type).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
          const withoutDragged = ordered.filter((i) => i.id !== item.id);
          const targetIdx = withoutDragged.findIndex((i) => i.id === targetItem.id);
          const targetBounds = targetEl.getBoundingClientRect();
          const insertAfter = event.clientY > targetBounds.top + targetBounds.height / 2;
          withoutDragged.splice(insertAfter ? targetIdx + 1 : targetIdx, 0, item);
          const updates = withoutDragged.map((i, idx) => ({ _id: i.id, sort: (idx + 1) * 1e5 }));
          await this.document.updateEmbeddedDocuments("Item", updates);
          return;
        }
      }
    }
    if (isSameActor) {
      await item.update({ "system.location": newLocation });
      return;
    }
    if (!this.document.isOwner) {
      game.socket.emit("system.tams", {
        type: "transferItem",
        userId: game.user.id,
        itemData: item.toObject(),
        sourceActorUuid: (_c = item.parent) == null ? void 0 : _c.uuid,
        targetActorUuid: this.document.uuid,
        newLocation
      });
      ui.notifications.info(game.i18n.format("TAMS.Checks.Notifications.RequestTransfer", { item: item.name, name: this.document.name }));
      return;
    }
    try {
      return await tamsHandleItemTransfer({
        itemData: item.toObject(),
        sourceActorUuid: (_d = item.parent) == null ? void 0 : _d.uuid,
        targetActorUuid: this.document.uuid,
        newLocation
      });
    } catch (err) {
      console.error("TAMS | _onDrop: tamsHandleItemTransfer failed", err);
      ui.notifications.error(`TAMS: Failed to add item "${item.name}" — see console for details.`);
    }
  }
  /** @override */
  _onDragStart(event) {
    const li = event.currentTarget;
    if (event.target.classList.contains("content-link")) return;
    const itemId = li.dataset.itemId;
    const item = this.document.items.get(itemId);
    if (item) {
      const dragData = item.toDragData();
      if (dragData) {
        const jsonData = JSON.stringify(dragData);
        event.dataTransfer.setData("text/plain", jsonData);
        event.dataTransfer.setData("application/json", jsonData);
        return;
      }
    }
    return super._onDragStart(event);
  }
  /**
   * Handle rolling a stat or skill check.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onRoll(event, target) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w;
    const dataset = target.dataset;
    const item = dataset.itemId ? this.document.items.get(dataset.itemId) : null;
    const tToken = [...((_a = game == null ? void 0 : game.user) == null ? void 0 : _a.targets) ?? []][0] ?? null;
    const tName = (tToken == null ? void 0 : tToken.name) ?? null;
    ((_b = tToken == null ? void 0 : tToken.actor) == null ? void 0 : _b.id) ?? null;
    (tToken == null ? void 0 : tToken.id) ?? null;
    let label = dataset.label || "";
    if (item && (item.type === "weapon" || item.type === "ability" && item.system.isAttack)) {
      if (tName) label = `${label} -> ${tName}`;
    }
    let statValue = isNaN(parseInt(dataset.statValue)) ? 0 : parseInt(dataset.statValue);
    let statMod = (parseInt(dataset.statMod) || 0) + (parseInt(dataset.traitBonus) || 0);
    let familiarity = parseInt(dataset.familiarity) || 0;
    let bonus = 0;
    let statId = dataset.statId;
    const bonusSources = [];
    const statModSources = [];
    const traits = this.document.items.filter((i) => i.type === "trait");
    const addStatModSources = (sId) => {
      statModSources.length = 0;
      const s = this.document.system.stats[sId];
      if (!s) return;
      if (s.mod !== 0) statModSources.push({ label: game.i18n.localize("TAMS.StatMod"), value: s.mod });
      for (const trait of traits) {
        const val = trait.system.modifiers.filter((m) => m.target === `stats.${sId}`).reduce((acc, m) => acc + m.value, 0);
        if (val !== 0) statModSources.push({ label: trait.name, value: val });
      }
      const backpackPen2 = this.document.system.backpackPenalties;
      if (backpackPen2 && (sId === "strength" || sId === "dexterity")) {
        const val = backpackPen2[sId];
        if (val !== 0) statModSources.push({ label: game.i18n.localize("TAMS.BackpackPenalty"), value: val });
      }
    };
    const traitRollBonus = this.document.system.traitRollBonus || 0;
    if (traitRollBonus !== 0) {
      bonus += traitRollBonus;
      for (const trait of traits) {
        const val = trait.system.modifiers.filter((m) => m.target === "allRolls").reduce((acc, m) => acc + m.value, 0);
        if (val !== 0) bonusSources.push({ label: trait.name, value: val });
      }
    }
    if (item && item.system.tags) {
      const tags = item.system.tags.split(",").map((t) => t.trim().toLowerCase());
      for (const trait of traits) {
        if (trait.system.isProfession && trait.system.profession) {
          const prof = trait.system.profession.trim().toLowerCase();
          if (tags.includes(prof)) {
            const val = trait.system.modifiers.filter((m) => m.target === "allProfessionRolls").reduce((acc, m) => acc + m.value, 0);
            if (val !== 0) {
              bonus += val;
              bonusSources.push({ label: `${trait.name} (${trait.system.profession})`, value: val });
            }
          }
        }
      }
    }
    if ((_c = item == null ? void 0 : item.system) == null ? void 0 : _c.tags) {
      const tags = item.system.tags.split(",").map((t) => t.trim().toLowerCase());
      const abilityPassiveBonuses = this.document.system.abilityPassiveBonuses || {};
      for (const [tag, val] of Object.entries(abilityPassiveBonuses)) {
        if (tags.includes(tag) && val !== 0) {
          bonus += val;
          bonusSources.push({ label: game.i18n.format("TAMS.AbilityPassiveTag", { tag }), value: val });
        }
      }
    }
    {
      const abilityTypeBonus = this.document.system.abilityTypeBonus || {};
      const rollType = (item == null ? void 0 : item.type) ?? null;
      if (abilityTypeBonus.all) {
        bonus += abilityTypeBonus.all;
        bonusSources.push({ label: game.i18n.localize("TAMS.AbilityPassiveAll"), value: abilityTypeBonus.all });
      }
      if (rollType && rollType !== "all" && abilityTypeBonus[rollType]) {
        bonus += abilityTypeBonus[rollType];
        bonusSources.push({ label: game.i18n.localize(`TAMS.AbilityPassive_${rollType}`), value: abilityTypeBonus[rollType] });
      }
    }
    if (item && item.system.tags) {
      const tags = item.system.tags.split(",").map((t) => t.trim().toLowerCase());
      if (tags.includes("accurate")) {
        bonus += 5;
        bonusSources.push({ label: game.i18n.localize("TAMS.WeaponTags.Accurate"), value: 5 });
      }
    }
    if (!item && statId) {
      addStatModSources(statId);
    }
    if (!item) {
      familiarity = 0;
    }
    if (item && item.type === "weapon") {
      this.document.system.stats.strength;
      this.document.system.stats.dexterity;
      let usesDex = false;
      if (item.system.attackStat && item.system.attackStat !== "default") {
        statId = item.system.attackStat;
      } else {
        if (item.system.isRanged) {
          usesDex = !item.system.isThrown;
        } else {
          usesDex = !!item.system.isLight;
        }
        statId = usesDex ? "dexterity" : "strength";
      }
      const stat = this.document.system.stats[statId];
      statValue = stat.value;
      addStatModSources(statId);
      statMod = statModSources.reduce((acc, s) => acc + s.value, 0);
      label = `Attacking with ${item.name}`;
      const wNameLower = item.name.toLowerCase();
      const wTags = item.system.tags ? item.system.tags.split(",").map((t) => t.trim().toLowerCase()) : [];
      const expectedBroad = item.system.isRanged ? "ranged weapon" : "melee weapon";
      for (const skill of this.document.items.filter((i) => i.type === "skill")) {
        const broadPart = skill.name.split("(")[0].trim().toLowerCase();
        if (broadPart !== expectedBroad) continue;
        const parenMatch = skill.name.match(/\(([^)]+)\)/);
        if (!parenMatch) continue;
        const specific = parenMatch[1].trim().toLowerCase();
        const isSpecificMatch = wNameLower.includes(specific) || wTags.includes(specific);
        const rawSkillFam = parseInt(skill.system.familiarity) || 0;
        const appliedFam = isSpecificMatch ? rawSkillFam : Math.floor(rawSkillFam / 2);
        if (appliedFam !== 0) {
          bonus += appliedFam;
          bonusSources.push({ label: item.system.isRanged ? "Ranged Weapon Skill" : "Melee Weapon Skill", value: appliedFam });
        }
      }
    }
    if (item && item.type === "skill") {
      const name = item.name;
      label = name;
      statId = item.system.stat;
      const itemBonus = parseInt(item.system.bonus) || 0;
      if (itemBonus !== 0) {
        bonus += itemBonus;
        bonusSources.push({ label: game.i18n.localize("TAMS.ItemBonus"), value: itemBonus });
      }
      const skillNameLower = name.toLowerCase();
      if (skillNameLower.includes("stealth") || skillNameLower.includes("sneak")) {
        const sizeStep = SIZE_STEPS[this.document.system.effectiveStealthSize ?? "normal"] ?? 0;
        if (sizeStep < 0) {
          const stealthBonus = Math.abs(sizeStep) * 10;
          bonus += stealthBonus;
          bonusSources.push({ label: game.i18n.localize("TAMS.SizeStealthBonus"), value: stealthBonus });
        }
      }
      addStatModSources(statId);
      const stat = this.document.system.stats[statId];
      statValue = stat ? stat.value : 0;
      statMod = statModSources.reduce((acc, s) => acc + s.value, 0);
      if (name.includes("(") && name.includes(")")) {
        const confirmed = await new Promise((resolve) => {
          new Dialog({
            title: game.i18n.localize("TAMS.SkillCheckTitle"),
            content: `<p>${game.i18n.format("TAMS.SkillCheckSpecificPrompt", { name })}</p>`,
            buttons: {
              yes: { label: game.i18n.localize("TAMS.YesFullFam"), callback: () => resolve(true) },
              no: { label: game.i18n.localize("TAMS.NoHalfFam"), callback: () => resolve(false) }
            },
            default: "yes"
          }).render(true);
        });
        if (!confirmed) familiarity = Math.floor(familiarity / 2);
      }
    }
    if (item && item.type === "ability") {
      familiarity = parseInt(item.system.familiarity) || 0;
      const itemBonus = parseInt(item.system.bonus) || 0;
      if (itemBonus !== 0) {
        bonus += itemBonus;
        bonusSources.push({ label: game.i18n.localize("TAMS.ItemBonus"), value: itemBonus });
      }
      if ((_d = item.system.calculator) == null ? void 0 : _d.enabled) {
        const calcRollBonus = parseInt(item.system.calculator.rollBonus) || 0;
        if (calcRollBonus !== 0) {
          bonus += calcRollBonus;
          bonusSources.push({ label: game.i18n.localize("TAMS.CalculatorOptions.RollBonus"), value: calcRollBonus });
        }
      }
      if (item.system.isAttack) {
        statId = item.system.attackStat;
        addStatModSources(statId);
        const stat = this.document.system.stats[statId];
        statValue = stat ? stat.value : 0;
        statMod = statModSources.reduce((acc, s) => acc + s.value, 0);
        label = game.i18n.format("TAMS.UsingAbilityLabel", { name: item.name });
        const abilityTags = item.system.tags ? item.system.tags.split(",").map((t) => t.trim().toLowerCase()) : [];
        const isRangedAbility = abilityTags.includes("ranged");
        const isMeleeAbility = abilityTags.includes("melee");
        if (isRangedAbility || isMeleeAbility) {
          const expectedBroad = isRangedAbility ? "ranged weapon" : "melee weapon";
          for (const skill of this.document.items.filter((i) => i.type === "skill")) {
            const broadPart = skill.name.split("(")[0].trim().toLowerCase();
            if (broadPart !== expectedBroad) continue;
            const parenMatch = skill.name.match(/\(([^)]+)\)/);
            if (!parenMatch) continue;
            const specific = parenMatch[1].trim().toLowerCase();
            const isSpecificMatch = abilityTags.includes(specific);
            const rawSkillFam = parseInt(skill.system.familiarity) || 0;
            const appliedFam = isSpecificMatch ? rawSkillFam : Math.floor(rawSkillFam / 2);
            if (appliedFam !== 0) {
              bonus += appliedFam;
              bonusSources.push({ label: isRangedAbility ? "Ranged Weapon Skill" : "Melee Weapon Skill", value: appliedFam });
            }
          }
        }
      } else {
        statId = item.system.capStat || "strength";
        addStatModSources(statId);
        const stat = this.document.system.stats[statId];
        statValue = stat ? stat.value : 0;
        statMod = statModSources.reduce((acc, s) => acc + s.value, 0);
      }
      const cost = parseInt(item.system.cost) || 0;
      const usesMax = parseInt(item.system.uses.max) || 0;
      const usesVal = parseInt(item.system.uses.value) || 0;
      const isLimited = usesMax > 0;
      if (event.shiftKey && isLimited) {
        const missing = usesMax - usesVal;
        const actor = this.document;
        const resources = [{ id: "stamina", name: "Stamina", value: actor.system.stamina.value }];
        actor.system.customResources.forEach((res, idx) => {
          resources.push({ id: idx.toString(), name: res.name, value: res.value });
        });
        const resourceKey = item.system.resource;
        const options = resources.map((r) => `<option value="${r.id}" ${r.id === resourceKey ? "selected" : ""}>${r.name} (${r.value} ${game.i18n.localize("TAMS.AvailableShort")})</option>`).join("");
        new Dialog({
          title: game.i18n.format("TAMS.RefillUses", { name: item.name }),
          content: `
                    <div class="form-group">
                        <label>${game.i18n.format("TAMS.AmountToRefill", { max: missing })}</label>
                        <input type="number" id="refill-amount" value="${missing}" min="1" max="${missing}"/>
                    </div>
                    <div class="form-group">
                        <label>${game.i18n.localize("TAMS.ResourceToSpendLabel")}</label>
                        <select id="refill-resource">${options}</select>
                    </div>
                    <p>${game.i18n.format("TAMS.CostPerUse", { cost })}</p>
                    <p><i>${game.i18n.localize("TAMS.CostMultiplierHint")}</i></p>
                `,
          buttons: {
            refill: {
              label: game.i18n.localize("TAMS.Refill"),
              callback: async (html) => {
                const amount = parseInt(html.find("#refill-amount").val()) || 0;
                const resId = html.find("#refill-resource").val();
                if (amount <= 0) return;
                const totalCost = amount * cost;
                const res = resources.find((r) => r.id === resId);
                if (res.value < totalCost) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NotEnoughToBoost"));
                if (resId === "stamina") {
                  await actor.update({ "system.stamina.value": res.value - totalCost });
                } else {
                  const idx = parseInt(resId);
                  const customResources = foundry.utils.duplicate(actor.system.customResources);
                  customResources[idx].value -= totalCost;
                  await actor.update({ "system.customResources": customResources });
                }
                await item.update({ "system.uses.value": usesVal + amount });
                ui.notifications.info(game.i18n.format("TAMS.Checks.Notifications.RefilledUses", { amount, item: item.name }));
              }
            },
            cancel: { label: game.i18n.localize("TAMS.Cancel") }
          },
          default: "refill"
        }).render(true);
        return;
      }
      let effectiveCost = cost;
      if (item.system.isReaction && cost > 0 && !isLimited) {
        const reactionUses = this.document.getFlag("tams", "reactionUses") ?? {};
        const useCount = (reactionUses[item.id] ?? 0) + 1;
        effectiveCost = cost * useCount;
        await this.document.setFlag("tams", "reactionUses", { ...reactionUses, [item.id]: useCount });
      }
      if (isLimited) {
        if (usesVal <= 0) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NoUsesLeft"));
        await item.update({ "system.uses.value": usesVal - 1 });
      } else if (!item.system.isApex && effectiveCost > 0) {
        const resourceKey = item.system.resource;
        if (resourceKey === "stamina") {
          const current = this.document.system.stamina.value;
          if (current < effectiveCost) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NotEnoughStamina"));
          await this.document.update({ "system.stamina.value": current - effectiveCost });
        } else {
          const idx = parseInt(resourceKey);
          const res = this.document.system.customResources[idx];
          if (res) {
            if (res.value < effectiveCost) {
              const remaining = effectiveCost - res.value;
              const stamina = this.document.system.stamina.value;
              if (stamina < remaining) return ui.notifications.warn(game.i18n.format("TAMS.Checks.Notifications.NotEnoughResOrStamina", { resource: res.name }));
              const useBoth = await new Promise((resolve) => {
                new Dialog({
                  title: "Insufficient Resources",
                  content: `<p>You only have ${res.value} ${res.name}. Spend ${res.value} ${res.name} and ${remaining} Stamina to use this ability?</p>`,
                  buttons: {
                    yes: { label: "Yes", callback: () => resolve(true) },
                    no: { label: "No", callback: () => resolve(false) }
                  },
                  default: "yes",
                  close: () => resolve(false)
                }).render(true);
              });
              if (!useBoth) return;
              const resources = foundry.utils.duplicate(this.document.system.customResources);
              resources[idx].value = 0;
              await this.document.update({
                "system.customResources": resources,
                "system.stamina.value": stamina - remaining
              });
            } else {
              const resources = foundry.utils.duplicate(this.document.system.customResources);
              resources[idx].value -= effectiveCost;
              await this.document.update({ "system.customResources": resources });
            }
          }
        }
      }
    }
    let difficulty = 0;
    if (event.shiftKey) {
      difficulty = await new Promise((resolve) => {
        new Dialog({
          title: "Roll Parameters",
          content: `<div class="form-group"><label>Difficulty / Target Result</label><input type="number" id="diff" value="0"/></div>`,
          buttons: {
            roll: { label: "Roll", callback: (html) => resolve(parseInt(html.find("#diff").val()) || 0) }
          },
          default: "roll"
        }).render(true);
      });
    }
    const isMaxRoll = dataset.isMaxRoll === "true";
    const effectiveStat = statValue + statMod;
    if ((item == null ? void 0 : item.type) === "weapon" && item.system.firearmType === "matchlock" && item.system.consumeAmmo) {
      const ammoId = item.system.ammoItemId ?? "custom";
      if (ammoId && ammoId !== "custom") {
        const ammoItem = this.document.items.get(ammoId);
        if (ammoItem == null ? void 0 : ammoItem.system.misfireRisk) {
          const threshold = item.system.misfireThreshold ?? 4;
          const misfireRoll = (await new Roll("1d100").evaluate()).total;
          if (misfireRoll <= threshold) {
            const currentAmmo = ((_e = ammoItem.system.uses) == null ? void 0 : _e.value) || 0;
            if (currentAmmo > 0) await ammoItem.update({ "system.uses.value": currentAmmo - 1 });
            await ChatMessage.create({
              content: `<div class="tams-roll tams-misfire"><strong>⚠️ ${game.i18n.localize("TAMS.Firearm.MisfireLabel")}</strong> — ${game.i18n.format("TAMS.Firearm.MisfireResult", { weapon: item.name, roll: misfireRoll, threshold })}</div>`,
              speaker: ChatMessage.getSpeaker({ actor: this.document })
            });
            return;
          }
        }
      }
    }
    let roll, rawResult, originalResult, rerolled = false, isJammed = false;
    if (isMaxRoll) {
      roll = await new Roll(`${effectiveStat}`).evaluate();
      rawResult = effectiveStat;
      originalResult = rawResult;
    } else {
      roll = await new Roll("1d100").evaluate();
      rawResult = roll.total;
      originalResult = rawResult;
      if (item && item.system.tags) {
        const tags = item.system.tags.split(",").map((t) => t.trim().toLowerCase());
        if (tags.includes("reliable") && rawResult <= 4) {
          const reroll = await new Roll("1d100").evaluate();
          rawResult = reroll.total;
          rerolled = true;
        }
        if (tags.includes("unreliable") && rawResult <= 4) {
          isJammed = true;
        }
      }
    }
    const cappedResult = isMaxRoll ? effectiveStat : Math.min(rawResult, effectiveStat);
    const backpackPen = this.document.system.backpackPenalties;
    if (backpackPen) {
      if (item && (item.type === "weapon" || item.type === "ability" && item.system.isAttack)) {
        const pen = backpackPen.attack || 0;
        if (pen !== 0) {
          bonus += pen;
          bonusSources.push({ label: game.i18n.localize("TAMS.BackpackPenalty"), value: pen });
        }
      }
    }
    const isAttackRoll = item && (item.type === "weapon" || item.type === "ability" && item.system.isAttack);
    if (!isAttackRoll && statId === "strength") {
      const attackerSize = SIZE_STEPS[this.document.system.effectiveCombatSize ?? "normal"] ?? 0;
      const targets = [...game.user.targets];
      if (targets.length > 0) {
        const targetSize = SIZE_STEPS[((_g = (_f = targets[0].actor) == null ? void 0 : _f.system) == null ? void 0 : _g.effectiveCombatSize) ?? "normal"] ?? 0;
        const sizeDiff = attackerSize - targetSize;
        if (sizeDiff !== 0) {
          const sizeBonus = sizeDiff * 10;
          bonus += sizeBonus;
          bonusSources.push({ label: game.i18n.localize("TAMS.SizeBonus"), value: sizeBonus });
        }
      }
    }
    const settings = this.document.system.settings;
    const isSquadOrHorde = settings.isNPC && (settings.npcType === "squad" || settings.npcType === "horde");
    const squadSize = settings.squadSize || 1;
    let squadBonus = 0;
    let maxSquadTargets = 1;
    if (item && (item.type === "weapon" || item.type === "ability" && item.system.isAttack)) {
      item.type === "weapon" ? !!item.system.isRanged : ((_h = item.system.calculator) == null ? void 0 : _h.range) > 10;
      if (isSquadOrHorde) {
        maxSquadTargets = squadSize;
        maxSquadTargets = Math.max(1, maxSquadTargets);
        const actualTargets = [...game.user.targets].slice(0, maxSquadTargets);
        const numTargetsCount = actualTargets.length > 0 ? actualTargets.length : tToken ? 1 : 0;
        if (numTargetsCount > 0 && numTargetsCount < maxSquadTargets) {
          squadBonus = (maxSquadTargets - numTargetsCount) * 5;
        }
      }
    }
    const finalTotal = cappedResult + familiarity + bonus + squadBonus;
    let dcTotal = finalTotal;
    let critInfo = "";
    let success = true;
    let resultText = "";
    let resultClass = "";
    if (isJammed) {
      success = false;
      resultText = "JAMMED";
      resultClass = "failure";
      critInfo = `<div class="tams-crit failure">${game.i18n.localize("TAMS.Checks.Jammed")}</div>`;
    } else if (statId === "bravery") {
      const targetValue = effectiveStat + familiarity + bonus;
      success = rawResult <= targetValue;
      resultText = success ? "SUCCESS" : "FAILURE";
      resultClass = success ? "success" : "failure";
      critInfo = `<div class="tams-crit ${resultClass}">${resultText}</div>`;
    } else if (difficulty > 0) {
      const actor = this.document;
      const canBoost = actor.type === "character";
      if (dcTotal >= difficulty * 2) {
        critInfo = `<div class="tams-crit success">${game.i18n.format("TAMS.CritSuccess", { name: this.document.name })}</div>`;
      } else if (dcTotal >= difficulty) {
        critInfo = `<div class="tams-success">${game.i18n.format("TAMS.SuccessVsDiff", { difficulty })}</div>`;
      } else {
        critInfo = `
                <div class="tams-failure">${game.i18n.format("TAMS.FailureVsDiff", { difficulty })}</div>
                <div class="roll-boost-container"></div>
                ${canBoost ? `
                    <div class="roll-row">
                        <button class="tams-boost-roll" 
                                data-difficulty="${difficulty}" 
                                data-total="${dcTotal}" 
                                data-actor-uuid="${actor.uuid}"
                                data-actor-id="${actor.id}">
                            ${game.i18n.localize("TAMS.Checks.SpendResourceToBoost")}
                        </button>
                    </div>
                ` : ""}
            `;
      }
    }
    let damageInfo = "";
    if (item && (item.type === "weapon" || item.type === "ability" && item.system.isAttack)) {
      let damage = item.system.calculatedDamage;
      let weaponOverride = null;
      if (item.type === "ability" && item.system.useWeaponDamage) {
        const weapons = this.document.items.filter((i) => i.type === "weapon");
        if (weapons.length === 0) {
          return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NoWeaponsForAbility"));
        }
        if (weapons.length === 1) {
          weaponOverride = weapons[0];
        } else {
          const opts = weapons.map((w) => `<option value="${w.id}">${w.name} (${w.system.calculatedDamage} ${game.i18n.localize("TAMS.Dmg")})</option>`).join("");
          weaponOverride = await new Promise((resolve) => {
            new Dialog({
              title: game.i18n.format("TAMS.ChooseWeaponForAbility", { name: item.name }),
              content: `<div class="form-group"><label>${game.i18n.localize("TAMS.Weapon")}</label><select id="tams-weapon-picker">${opts}</select></div>`,
              buttons: {
                ok: { label: game.i18n.localize("TAMS.Confirm"), callback: (html) => resolve(weapons.find((w) => w.id === html.find("#tams-weapon-picker").val())) },
                cancel: { label: game.i18n.localize("TAMS.Cancel"), callback: () => resolve(null) }
              },
              default: "ok",
              close: () => resolve(null)
            }).render(true);
          });
          if (!weaponOverride) return;
        }
        damage = weaponOverride.system.calculatedDamage;
      }
      const isRanged = item.type === "weapon" ? !!item.system.isRanged : weaponOverride ? !!weaponOverride.system.isRanged : ((_i = item.system.calculator) == null ? void 0 : _i.range) > 10;
      const isCrit = difficulty > 0 && dcTotal >= difficulty * 2;
      let forceCrit = false;
      if (item && item.system.tags) {
        const tags = item.system.tags.split(",").map((t) => t.trim().toLowerCase());
        if (isCrit && tags.includes("vicious")) {
          damage = Math.floor(damage * 1.5);
        }
        if (tags.includes("brutal")) {
          forceCrit = true;
        }
      }
      let multiVal = 1;
      if (item.type === "weapon") {
        if (item.system.fireRate === "3") multiVal = 3;
        else if (item.system.fireRate === "auto") multiVal = 10;
        else if (item.system.fireRate === "custom") multiVal = item.system.fireRateCustom || 1;
        if (item.system.consumeAmmo) {
          const ammoItemId = item.system.ammoItemId ?? "custom";
          if (!ammoItemId) {
            return ui.notifications.warn(game.i18n.format("TAMS.Checks.Notifications.NoAmmoSelected", { item: item.name }));
          }
          if (ammoItemId === "custom") {
            const currentAmmo = ((_j = item.system.ammo) == null ? void 0 : _j.current) || 0;
            if (currentAmmo < multiVal) {
              if (currentAmmo <= 0) {
                return ui.notifications.warn(game.i18n.format("TAMS.Checks.Notifications.NoChargesLeft", { item: item.name }));
              }
              ui.notifications.info(game.i18n.format("TAMS.Checks.NotEnoughAmmo", { count: currentAmmo }));
              multiVal = currentAmmo;
            }
            await item.update({ "system.ammo.current": Math.max(0, currentAmmo - multiVal) });
          } else {
            const ammoItem = this.document.items.get(ammoItemId);
            if (!ammoItem) {
              return ui.notifications.warn(game.i18n.format("TAMS.Checks.Notifications.NoAmmoSelected", { item: item.name }));
            }
            const currentAmmo = ((_k = ammoItem.system.uses) == null ? void 0 : _k.value) || 0;
            if (currentAmmo < multiVal) {
              if (currentAmmo <= 0) {
                return ui.notifications.warn(game.i18n.format("TAMS.Checks.Notifications.NoChargesLeft", { item: ammoItem.name }));
              }
              ui.notifications.info(game.i18n.format("TAMS.Checks.NotEnoughAmmo", { count: currentAmmo }));
              multiVal = currentAmmo;
            }
            await ammoItem.update({ "system.uses.value": Math.max(0, currentAmmo - multiVal) });
          }
        }
      } else if (item.type === "ability") {
        multiVal = item.system.multiAttack || 1;
      }
      const targetLimb = item.type === "ability" && ((_l = item.system.calculator) == null ? void 0 : _l.enabled) ? item.system.calculator.targetLimb : "none";
      let armourPen = 0;
      if (item.type === "weapon" && item.system.hasArmourPen) {
        armourPen = item.system.armourPenetration || 0;
      } else if (item.type === "ability") {
        if (weaponOverride) {
          armourPen = (weaponOverride.system.hasArmourPen ? weaponOverride.system.armourPenetration || 0 : 0) + (item.system.armourPenetration || 0);
        } else {
          armourPen = item.system.armourPenetration || 0;
        }
      }
      const damageType = (weaponOverride ? weaponOverride.system.damageType : item.system.damageType) || "";
      const isAoE = !!item.system.isAoE || ((_m = item.system.calculator) == null ? void 0 : _m.enabled) && (item.system.calculator.aoeRadius > 0 || item.system.calculator.targetType === "aoe");
      let targets = isAoE ? [...game.user.targets] : tToken ? [tToken] : [];
      if (isSquadOrHorde) {
        targets = [...game.user.targets].slice(0, maxSquadTargets);
        if (targets.length === 0 && tToken) targets = [tToken];
      }
      if (targets.length > 0) {
        let hitLocation;
        if (item.type === "ability" && ((_n = item.system.calculator) == null ? void 0 : _n.enabled) && ((_o = item.system.calculator) == null ? void 0 : _o.targetLimb) && item.system.calculator.targetLimb !== "none") {
          const limbKey = item.system.calculator.targetLimb;
          const limbOptions = {
            "head": "Head",
            "thorax": "Thorax",
            "stomach": "Stomach",
            "leftArm": "Left Arm",
            "rightArm": "Right Arm",
            "leftLeg": "Left Leg",
            "rightLeg": "Right Leg"
          };
          hitLocation = limbOptions[limbKey] || "Thorax";
        } else {
          hitLocation = await getHitLocation(rawResult);
        }
        const pcs = targets.filter((t) => {
          var _a2, _b2, _c2;
          return !((_c2 = (_b2 = (_a2 = t.actor) == null ? void 0 : _a2.system) == null ? void 0 : _b2.settings) == null ? void 0 : _c2.isNPC);
        });
        const npcs = targets.filter((t) => {
          var _a2, _b2, _c2;
          return !!((_c2 = (_b2 = (_a2 = t.actor) == null ? void 0 : _a2.system) == null ? void 0 : _b2.settings) == null ? void 0 : _c2.isNPC);
        });
        const RANGE_BANDS = {
          pistol: { close: 50, medium: 75 },
          shotgun: { close: 5, medium: 15 },
          slug: { close: 100, medium: 150 },
          lightRifle: { close: 200, medium: 300 },
          mediumRifle: { close: 300, medium: 500 },
          heavyRifle: { close: 500, medium: 800 }
        };
        const _rangedWeapon = isRanged && item.type === "weapon" && item.system.rangeCategory;
        const attackerToken = _rangedWeapon ? ((_p = this.document.token) == null ? void 0 : _p.object) || canvas.tokens.controlled.find((t) => {
          var _a2;
          return ((_a2 = t.actor) == null ? void 0 : _a2.id) === this.document.id;
        }) : null;
        const isShotgun = item.type === "weapon" && item.system.rangeCategory === "shotgun";
        const _linkedAmmoId = item.type === "weapon" ? item.system.ammoItemId ?? "custom" : "custom";
        const isSlugAmmo = isShotgun && _linkedAmmoId !== "custom" ? !!((_q = this.document.items.get(_linkedAmmoId)) == null ? void 0 : _q.system.isSlug) : false;
        const effectiveRangeCategory = isShotgun && isSlugAmmo ? "slug" : item.system.rangeCategory || "";
        const rangeBands = RANGE_BANDS[effectiveRangeCategory] ?? null;
        damageInfo = `<div class="tams-targets-container">`;
        for (const targetToken of pcs) {
          const targetActor = targetToken.actor;
          const targetName = targetToken.name;
          const targetTokenId = targetToken.id;
          const targetActorId = targetActor == null ? void 0 : targetActor.id;
          const tHits = [];
          for (let i = 0; i < multiVal; i++) {
            tHits.push(i === 0 && !isAoE ? hitLocation : await getHitLocation());
          }
          let targetDamage = damage;
          let rangeInfo = "";
          if (attackerToken && rangeBands) {
            const dist = ((_r = canvas == null ? void 0 : canvas.grid) == null ? void 0 : _r.measureDistance(attackerToken.center, targetToken.center)) ?? 0;
            const distM = Math.round(dist);
            if (dist <= rangeBands.close) {
              rangeInfo = `${distM}m`;
            } else if (dist <= rangeBands.medium) {
              targetDamage = Math.floor(targetDamage * 2 / 3);
              rangeInfo = `${distM}m (2/3)`;
            } else {
              targetDamage = Math.floor(targetDamage / 3);
              rangeInfo = `${distM}m (1/3)`;
            }
            if (isSlugAmmo) rangeInfo += " [Slug]";
          }
          damageInfo += `
                    <div class="tams-target-block" style="border: 1px solid #7a7971; padding: 5px; margin-bottom: 5px; background: rgba(0,0,0,0.05);">
                        <div class="roll-row"><span>Target:</span><span class="roll-value">${targetName}</span></div>
                        <div class="roll-row"><b>Damage: ${targetDamage}${rangeInfo ? ` — ${rangeInfo}` : ""}</b></div>
                        <div class="roll-row"><b>Hit Locations: ${tHits.join(", ")}</b></div>
                        <div class="roll-row"><b>Max Hits: ${multiVal}</b></div>
                        <div class="roll-row" style="gap:6px; flex-wrap: wrap; justify-content: flex-start;">
                          <button class="tams-take-damage"
                                  data-damage="${targetDamage}"
                                  data-armour-pen="${armourPen}"
                                  data-damage-type="${damageType}"
                                  data-locations='${JSON.stringify(tHits)}'
                                  data-target-limb="${targetLimb}"
                                  data-is-aoe="${isAoE ? "1" : "0"}"
                                  data-force-crit="${forceCrit ? "1" : "0"}"
                                  data-target-token-id="${targetTokenId || ""}"
                                  data-target-actor-id="${targetActorId || ""}"
                                  data-target-actor-uuid="${(targetActor == null ? void 0 : targetActor.uuid) || ""}">Apply Damage</button>
                          <button class="tams-dodge"
                                  data-raw="${rawResult}"
                                  data-total="${finalTotal}"
                                  data-multi="${multiVal}"
                                  data-location="${hitLocation}"
                                  data-damage="${targetDamage}"
                                  data-armour-pen="${armourPen}"
                                  data-damage-type="${damageType}"
                                  data-is-ranged="${isRanged ? "1" : "0"}"
                                  data-is-aoe="${isAoE ? "1" : "0"}"
                                  data-target-limb="${targetLimb}"
                                  data-target-token-id="${targetTokenId || ""}"
                                  data-target-actor-id="${targetActorId || ""}"
                                  data-target-actor-uuid="${(targetActor == null ? void 0 : targetActor.uuid) || ""}">Dodge</button>
                          <button class="tams-retaliate"
                                  data-raw="${rawResult}"
                                  data-total="${finalTotal}"
                                  data-multi="${multiVal}"
                                  data-location="${hitLocation}"
                                  data-damage="${targetDamage}"
                                  data-armour-pen="${armourPen}"
                                  data-damage-type="${damageType}"
                                  data-is-ranged="${isRanged ? "1" : "0"}"
                                  data-is-aoe="${isAoE ? "1" : "0"}"
                                  data-target-limb="${targetLimb}"
                                  data-target-token-id="${targetTokenId || ""}"
                                  data-target-actor-id="${targetActorId || ""}"
                                  data-target-actor-uuid="${(targetActor == null ? void 0 : targetActor.uuid) || ""}"
                                  data-attacker-name="${this.document.name}">Retaliate</button>
                          <button class="tams-block"
                                  data-raw="${rawResult}"
                                  data-total="${finalTotal}"
                                  data-multi="${multiVal}"
                                  data-locations='${JSON.stringify(tHits)}'
                                  data-damage="${targetDamage}"
                                  data-armour-pen="${armourPen}"
                                  data-damage-type="${damageType}"
                                  data-target-actor-uuid="${(targetActor == null ? void 0 : targetActor.uuid) || ""}">Block</button>
                          <button class="tams-behind-toggle" style="background: #444; color: white;">Behind</button>
                          <button class="tams-unaware-toggle" style="background: #444; color: white;">Unaware</button>
                        </div>
                    </div>
                `;
        }
        if (npcs.length > 0) {
          damageInfo += `
            <div class="tams-npc-group" style="border: 1px solid #7a7971; padding: 5px; margin-top: 5px; background: rgba(0,0,0,0.1);">
                <div class="roll-row" style="border-bottom: 1px solid #7a7971; margin-bottom: 3px;"><b>--- NPCs ---</b></div>
                <div class="tams-npc-list" style="display: flex; flex-direction: column; gap: 2px; margin-top: 4px;">
        `;
          for (const targetToken of npcs) {
            const targetActor = targetToken.actor;
            const targetName = targetToken.name;
            const targetTokenId = targetToken.id;
            const targetActorId = targetActor == null ? void 0 : targetActor.id;
            const tHits = [];
            for (let i = 0; i < multiVal; i++) {
              tHits.push(i === 0 && !isAoE ? hitLocation : await getHitLocation());
            }
            let targetDamage = damage;
            let rangeInfo = "";
            if (attackerToken && rangeBands) {
              const dist = ((_s = canvas == null ? void 0 : canvas.grid) == null ? void 0 : _s.measureDistance(attackerToken.center, targetToken.center)) ?? 0;
              const distM = Math.round(dist);
              if (dist <= rangeBands.close) {
                rangeInfo = `${distM}m`;
              } else if (dist <= rangeBands.medium) {
                targetDamage = Math.floor(targetDamage * 2 / 3);
                rangeInfo = `${distM}m (2/3)`;
              } else {
                targetDamage = Math.floor(targetDamage / 3);
                rangeInfo = `${distM}m (1/3)`;
              }
              if (isSlugAmmo) rangeInfo += " [Slug]";
            }
            damageInfo += `
                <div class="tams-npc-row" style="display: flex; flex-direction: column; background: rgba(255,255,255,0.2); padding: 2px 4px; border-radius: 2px; margin-bottom: 2px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: bold; font-size: 0.85em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 120px;" title="${targetName}">${targetName}</span>
                        <div class="tams-npc-buttons" style="display: flex; gap: 2px;">
                            <button class="tams-take-damage" title="Apply Damage"
                                    data-damage="${targetDamage}" data-armour-pen="${armourPen}" data-damage-type="${damageType}" data-locations='${JSON.stringify(tHits)}' data-target-limb="${targetLimb}"
                                    data-is-aoe="${isAoE ? "1" : "0"}"
                                    data-target-token-id="${targetTokenId || ""}" data-target-actor-id="${targetActorId || ""}"
                                    data-target-actor-uuid="${(targetActor == null ? void 0 : targetActor.uuid) || ""}"
                                    style="padding: 0 5px; line-height: 1.4; font-size: 0.8em; min-width: 24px;">A</button>
                            <button class="tams-dodge" title="Dodge"
                                    data-raw="${rawResult}" data-total="${finalTotal}" data-multi="${multiVal}" data-locations='${JSON.stringify(tHits)}' data-damage="${targetDamage}" data-armour-pen="${armourPen}" data-damage-type="${damageType}" data-is-ranged="${isRanged ? "1" : "0"}" data-is-aoe="${isAoE ? "1" : "0"}" data-target-limb="${targetLimb}"
                                    data-target-token-id="${targetTokenId || ""}" data-target-actor-id="${targetActorId || ""}"
                                    data-target-actor-uuid="${(targetActor == null ? void 0 : targetActor.uuid) || ""}"
                                    style="padding: 0 5px; line-height: 1.4; font-size: 0.8em; min-width: 24px;">D</button>
                            <button class="tams-retaliate" title="Retaliate"
                                    data-raw="${rawResult}" data-total="${finalTotal}" data-multi="${multiVal}" data-locations='${JSON.stringify(tHits)}' data-damage="${targetDamage}" data-armour-pen="${armourPen}" data-damage-type="${damageType}" data-is-ranged="${isRanged ? "1" : "0"}" data-is-aoe="${isAoE ? "1" : "0"}" data-target-limb="${targetLimb}"
                                    data-target-token-id="${targetTokenId || ""}" data-target-actor-id="${targetActorId || ""}"
                                    data-target-actor-uuid="${(targetActor == null ? void 0 : targetActor.uuid) || ""}"
                                    data-attacker-name="${this.document.name}"
                                    style="padding: 0 5px; line-height: 1.4; font-size: 0.8em; min-width: 24px;">R</button>
                            <button class="tams-block" title="Block"
                                    data-raw="${rawResult}" data-total="${finalTotal}" data-multi="${multiVal}" data-locations='${JSON.stringify(tHits)}' data-damage="${targetDamage}" data-armour-pen="${armourPen}" data-damage-type="${damageType}"
                                    data-target-actor-uuid="${(targetActor == null ? void 0 : targetActor.uuid) || ""}"
                                    style="padding: 0 5px; line-height: 1.4; font-size: 0.8em; min-width: 24px;">Sh</button>
                            <button class="tams-behind-toggle" title="Behind" style="padding: 0 5px; line-height: 1.4; font-size: 0.8em; min-width: 24px; background: #444; color: white;">B</button>
                            <button class="tams-unaware-toggle" title="Unaware" style="padding: 0 5px; line-height: 1.4; font-size: 0.8em; min-width: 24px; background: #444; color: white;">U</button>
                        </div>
                    </div>
                    <div style="font-size: 0.75em; color: #555;">Locs: ${tHits.join(", ")} | Dmg: ${targetDamage}${rangeInfo ? ` (${rangeInfo})` : ""}</div>
                </div>
            `;
          }
          damageInfo += `</div></div>`;
        }
        damageInfo += `</div>`;
      } else {
        damageInfo = `
                <div class="roll-row"><b>Damage: ${damage}</b></div>
                <div class="roll-row"><b>Max Hits: ${multiVal}</b></div>
                <p><small>No tokens targeted.</small></p>
            `;
      }
    }
    const rawDesc = item && (item.type === "ability" || item.type === "skill") ? item.system.description || "" : "";
    const descriptionHtml = rawDesc ? `<div class="roll-description">${await TextEditor.enrichHTML(rawDesc, { secrets: false, async: true })}</div>` : "";
    let ifButtonHtml = "";
    if (item && item.type === "ability" && item.system.ifStatement && item.system.ifCost) {
      const ifStatement = item.system.ifStatement;
      const ifCost = item.system.ifCost;
      const ifResource = item.system.resource || "stamina";
      ifButtonHtml = `
            <div class="roll-row" style="margin-top: 5px;">
                <button class="tams-apply-if-cost"
                        data-cost="${ifCost}"
                        data-resource="${ifResource}"
                        data-actor-uuid="${this.document.uuid}"
                        data-label="${ifStatement}">
                    ${game.i18n.format("TAMS.ApplyIFCost", { cost: ifCost })}
                </button>
            </div>
            <div class="roll-row-detail" style="margin-bottom: 5px;"><small>${ifStatement}</small></div>
        `;
    }
    let saveButtonHtml = "";
    if (item && item.type === "ability" && item.system.hasSave) {
      const saveAgainst = item.system.saveAgainst || "dexterity";
      const statLabelsForSave = {
        strength: game.i18n.localize("TAMS.StatStrength"),
        dexterity: game.i18n.localize("TAMS.StatDexterity"),
        endurance: game.i18n.localize("TAMS.StatEndurance"),
        wisdom: game.i18n.localize("TAMS.StatWisdom"),
        intelligence: game.i18n.localize("TAMS.StatIntelligence"),
        bravery: game.i18n.localize("TAMS.StatBravery")
      };
      const saveLabel = statLabelsForSave[saveAgainst] ?? saveAgainst;
      saveButtonHtml = `
            <div class="roll-row" style="margin-top: 5px;">
                <button class="tams-save-button"
                        data-save-against="${foundry.utils.escapeHTML(String(saveAgainst))}"
                        data-dc="${finalTotal}"
                        data-ability-name="${foundry.utils.escapeHTML(String(item.name))}">
                    ${game.i18n.format("TAMS.Save.ButtonLabel", { stat: saveLabel, dc: finalTotal })}
                </button>
            </div>
        `;
    }
    let mishapButtonHtml = "";
    if (item && item.type === "ability") {
      const abilityTags = item.system.tags ? item.system.tags.split(",").map((t) => t.trim().toLowerCase()) : [];
      const isMagicAbility = abilityTags.some((t) => ["magic", "spell", "psychic", "alchemy", "divine"].includes(t));
      if (isMagicAbility) {
        let totalEffects = -1;
        if ((_t = item.system.calculator) == null ? void 0 : _t.enabled) {
          const _c2 = item.system.calculator;
          totalEffects = (_c2.effects || 0) + Math.floor((_c2.rollBonus || 0) / 5) + (_c2.ignoreArmor || 0);
        }
        const castTime = item.system.castTime || "immediate";
        const mishapTagPriority = ["divine", "psychic", "alchemy", "magic", "spell"];
        const mishapTag = mishapTagPriority.find((t) => abilityTags.includes(t)) ?? "magic";
        mishapButtonHtml = `
                <div class="roll-row" style="margin-top: 5px;">
                    <button class="tams-mishap-check"
                            data-effects="${totalEffects}"
                            data-cast-time="${castTime}"
                            data-mishap-tag="${mishapTag}"
                            data-actor-uuid="${this.document.uuid}">
                        ${game.i18n.localize("TAMS.Mishap.ButtonLabel")}
                    </button>
                </div>
            `;
      }
    }
    const messageContent = `
      <div class="tams-roll">
        <h3 class="roll-label">${foundry.utils.escapeHTML(label)}</h3>
        ${descriptionHtml}
        ${ifButtonHtml}
        ${mishapButtonHtml}
        ${saveButtonHtml}
        ${damageInfo}
        ${rerolled ? `<div class="roll-row reliable-reroll" style="color: #2c3e50; font-style: italic; font-size: 0.9em; margin-bottom: 4px;">
            ${game.i18n.format("TAMS.Checks.Notifications.ReliableReroll", { original: originalResult })}
        </div>` : ""}
        <div class="roll-row"><span>Raw Dice Result:</span><span class="roll-value">${isMaxRoll ? `MAX (${rawResult})` : rawResult}</span></div>
        ${statId === "bravery" ? `<div class="roll-row"><small>Target (Bravery):</small><span>${statValue}${familiarity ? " + " + familiarity : ""}${bonus ? " + " + bonus : ""}</span></div>` : `<div class="roll-row"><small>Stat Cap (${statValue}${statMod >= 0 ? "+" : ""}${statMod}):</small><span>${cappedResult}</span></div>
             ${statModSources.length > 0 ? statModSources.map((s) => `<div class="roll-row-detail"><small>${s.label}:</small><span>${s.value >= 0 ? "+" : ""}${s.value}</span></div>`).join("") : ""}
             ${familiarity > 0 ? `<div class="roll-row"><small>Familiarity:</small><span>+${familiarity}</span></div>` : ""}
             ${bonus !== 0 ? `<div class="roll-row"><small>Bonus:</small><span>${bonus >= 0 ? "+" : ""}${bonus}</span></div>` : ""}
             ${bonusSources.length > 0 ? bonusSources.map((s) => `<div class="roll-row-detail"><small>${s.label}:</small><span>${s.value >= 0 ? "+" : ""}${s.value}</span></div>`).join("") : ""}
             ${squadBonus > 0 ? `<div class="roll-row"><small>Squad Bonus:</small><span>+${squadBonus}</span></div>` : ""}`}
        <hr>
        <div class="roll-total">${statId === "bravery" ? "Target to beat" : "Total"}: <b>${statId === "bravery" ? effectiveStat + familiarity + bonus : finalTotal}</b></div>
        ${isMaxRoll ? `<div class="tams-crit success" style="font-style:italic;">${game.i18n.localize("TAMS.GuaranteedMaxNote")}</div>` : critInfo}
        <div class="roll-contest-hint">
            ${statId === "bravery" ? `<br><small>Bravery checks are roll-under. Success if Roll <= Target.</small>` : isMaxRoll ? `<br><small>${game.i18n.localize("TAMS.GuaranteedMaxHint")}</small>` : `<br><small><b>Crit Check (Contested):</b> Attacker Raw Dice (${rawResult}) vs 2x Defender Raw Dice.</small>
                       <br><small><b>Crit Check (Static):</b> Total (${finalTotal}) vs 2x Difficulty.</small>`}
        </div>
      </div>
    `;
    if (event.altKey) {
      const contestTotal = statId === "bravery" ? effectiveStat + familiarity + bonus - rawResult : finalTotal;
      await tamsCreateContestedCheck(this.document, label, contestTotal, rawResult, roll, statId);
    } else {
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.document }),
        content: messageContent,
        rolls: [roll],
        flags: {
          tams: {
            inflictsStatusId: ((_u = item == null ? void 0 : item.system) == null ? void 0 : _u.inflictsStatusId) || "",
            attackerActorId: this.document.id,
            attackerWeaponId: (item == null ? void 0 : item.id) || "",
            hasSave: ((_v = item == null ? void 0 : item.system) == null ? void 0 : _v.hasSave) ?? false,
            saveAgainst: ((_w = item == null ? void 0 : item.system) == null ? void 0 : _w.saveAgainst) ?? "",
            saveDC: finalTotal
          }
        }
      });
    }
    if (item && ["weapon", "skill", "ability"].includes(item.type)) {
      item.update({ "system.usedInScene": true });
    }
  }
  /**
   * Handle toggling the limb multipliers section.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  _onToggleLimbMultipliers(event, target) {
    this._limbMultipliersCollapsed = !this._limbMultipliersCollapsed;
    this.render();
  }
  /**
   * Handle adding a new custom resource.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onResourceAdd(event, target) {
    const resources = [...this.document.system.customResources || []];
    resources.push({
      name: "New Resource",
      nameSecondary: "Secondary",
      value: 0,
      max: 0,
      stat: "endurance",
      mult: 1,
      bonus: 0,
      customValue: 10,
      color: "#3498db",
      isOpposed: false,
      colorSecondary: "#e74c3c"
    });
    return this.document.update({ "system.customResources": resources });
  }
  /**
   * Handle deleting a custom resource.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onResourceDelete(event, target) {
    const index = target.dataset.index;
    const resources = [...this.document.system.customResources || []];
    resources.splice(index, 1);
    return this.document.update({ "system.customResources": resources });
  }
  async _onBarrierAdd(event, target) {
    return this.document.update({ "system.tempDR": 10 });
  }
  async _onBarrierClear(event, target) {
    return this.document.update({ "system.tempDR": 0 });
  }
  async _onResistanceAdd(event, target) {
    const resistances = [...this.document.system.resistances || []];
    resistances.push({ damageType: "", category: "resistance", value: 0, limbs: [] });
    return this.document.update({ "system.resistances": resistances });
  }
  async _onResistanceDelete(event, target) {
    const index = parseInt(target.dataset.index);
    const resistances = [...this.document.system.resistances || []];
    resistances.splice(index, 1);
    return this.document.update({ "system.resistances": resistances });
  }
  async _onResistanceLimbToggle(event, target) {
    const index = parseInt(target.closest("[data-index]").dataset.index);
    const limbKey = target.dataset.limbKey;
    const resistances = foundry.utils.duplicate(this.document.system.resistances || []);
    const entry = resistances[index];
    if (!entry) return;
    const limbs = [...entry.limbs ?? []];
    const pos = limbs.indexOf(limbKey);
    if (pos === -1) limbs.push(limbKey);
    else limbs.splice(pos, 1);
    resistances[index] = { ...entry, limbs };
    return this.document.update({ "system.resistances": resistances });
  }
  /**
   * Handle tab switching.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  _onSetTab(event, target) {
    this._activeTab = target.dataset.tab;
    this.render();
  }
  async _onSceneReset(event, target) {
    const updates = this.document.items.filter((i) => ["weapon", "skill", "ability"].includes(i.type) && i.system.usedInScene).map((i) => ({ _id: i.id, "system.usedInScene": false }));
    if (updates.length) await this.document.updateEmbeddedDocuments("Item", updates);
  }
  async _onCallGroupCheck(event, target) {
    game.tams.groupCheck();
  }
  async _onHonorEdit(event, target) {
    var _a;
    const path = target.dataset.path;
    const pathData = HONOR_PATHS[path];
    if (!pathData) return;
    const current = ((_a = this.document.system.honor) == null ? void 0 : _a[path]) ?? 0;
    new Dialog({
      title: `${game.i18n.localize(pathData.labelKey)} — ${game.i18n.localize("TAMS.Honor.EditScore")}`,
      content: `<div class="form-group" style="padding: 10px;">
        <label>${game.i18n.localize("TAMS.Honor.Score")} (-100 ${game.i18n.localize("TAMS.Honor.To")} 100)</label>
        <input type="number" name="score" value="${current}" min="-100" max="100" style="width: 80px; margin-left: 10px;"/>
      </div>`,
      buttons: {
        save: {
          icon: '<i class="fas fa-save"></i>',
          label: game.i18n.localize("TAMS.Save"),
          callback: async (html) => {
            const val = parseInt(html.find('[name="score"]').val());
            if (!isNaN(val)) {
              await this.document.update({ [`system.honor.${path}`]: Math.clamp(val, -100, 100) });
            }
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("TAMS.Cancel")
        }
      },
      default: "save"
    }).render(true);
  }
};
__publicField(_TAMSActorSheet, "PARTS", {
  form: {
    template: "systems/tams/templates/actor-sheet.html"
  }
});
let TAMSActorSheet = _TAMSActorSheet;
const _TAMSDowntimeSheet = class _TAMSDowntimeSheet extends TAMSActorSheet {
  /** @override */
  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
      classes: ["tams", "sheet", "actor", "downtime"],
      position: { width: 500, height: 650 },
      window: { resizable: true, scrollable: [".downtime-scroll"] },
      actions: {
        outputDowntime: _TAMSDowntimeSheet.prototype._onOutputDowntime,
        resetDowntime: _TAMSDowntimeSheet.prototype._onResetDowntime,
        sendAwardToChat: _TAMSDowntimeSheet.prototype._onSendAwardToChat,
        completeDowntime: _TAMSDowntimeSheet.prototype._onCompleteDowntime
      }
    }, { inplace: false });
  }
  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    return context;
  }
  /**
   * Handle outputting downtime trackers to chat.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onOutputDowntime(event, target) {
    const actor = this.document;
    const downtime = actor.system.downtime;
    const trackers = downtime.trackers;
    const isSafe = downtime.isSafe;
    const labels = {
      ability: "TAMS.DowntimeTrackerAbility",
      skill: "TAMS.DowntimeTrackerSkill",
      weapon: "TAMS.DowntimeTrackerWeapon",
      statistic: "TAMS.DowntimeTrackerStatistic",
      crafting: "TAMS.DowntimeTrackerCrafting",
      resting: "TAMS.DowntimeTrackerResting",
      healing: "TAMS.DowntimeTrackerHealing",
      working: "TAMS.DowntimeTrackerWorking"
    };
    let content = `
      <div class="tams-roll">
        <h3 class="roll-label">${game.i18n.localize("TAMS.DowntimeTracking")}: ${actor.name}</h3>
        <div class="roll-row">
          <span>${game.i18n.localize("TAMS.DowntimeDays")}:</span>
          <span class="roll-value">${downtime.days}</span>
        </div>
        <div class="roll-row">
          <span>${game.i18n.localize("TAMS.DowntimeIsSafe")}:</span>
          <span class="roll-value">${isSafe ? game.i18n.localize("TAMS.DowntimeSafe") : game.i18n.localize("TAMS.DowntimeUnsafe")}</span>
        </div>
        <hr>
    `;
    let hasTrackers = false;
    for (const [key, value] of Object.entries(trackers)) {
      if (value > 0) {
        hasTrackers = true;
        content += `
          <div class="roll-row">
            <span>${game.i18n.localize(labels[key])}:</span>
            <span class="roll-value">${value} ${game.i18n.localize("TAMS.Days")}</span>
          </div>
        `;
      }
    }
    if (!hasTrackers) {
      content += `<p><i>No downtime activities tracked.</i></p>`;
    }
    if (downtime.notes) {
      content += `<hr><div class="roll-description">${downtime.notes}</div>`;
    }
    content += `</div>`;
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content
    });
  }
  /**
   * Handle resetting all downtime trackers to 0.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onResetDowntime(event, target) {
    const confirmed = await Dialog.confirm({
      title: game.i18n.localize("TAMS.DowntimeReset"),
      content: `<p>Are you sure you want to reset all downtime trackers to 0 for ${this.document.name}?</p>`,
      yes: () => true,
      no: () => false,
      defaultYes: false
    });
    if (confirmed) {
      const updates = {};
      for (const key of Object.keys(this.document.system.downtime.trackers)) {
        updates[`system.downtime.trackers.${key}`] = 0;
      }
      await this.document.update(updates);
    }
  }
  /**
   * Send a downtime award button to chat.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  /**
   * Apply healing from downtime and reset all trackers.
   */
  async _onCompleteDowntime(event, target) {
    const actor = this.document;
    const downtime = actor.system.downtime;
    const healingDays = downtime.trackers.healing ?? 0;
    const confirmed = await Dialog.confirm({
      title: game.i18n.localize("TAMS.Downtime.CompleteDowntime"),
      content: `<p>${game.i18n.format("TAMS.Downtime.CompleteDowntimeConfirm", { name: actor.name })}</p>`,
      yes: () => true,
      no: () => false,
      defaultYes: false
    });
    if (!confirmed) return;
    const updates = {};
    if (healingDays > 0) {
      const healPerDay = 1 + (downtime.isSafe ? 1 : 0) + (downtime.isTended ? 1 : 0) + (downtime.isTended && downtime.isBedRest ? 1 : 0);
      const totalHeal = healPerDay * healingDays;
      for (const [key, limb] of Object.entries(actor.system.limbs)) {
        const healed = Math.min(limb.max, limb.value + totalHeal);
        updates[`system.limbs.${key}.value`] = healed;
      }
    }
    for (const key of Object.keys(downtime.trackers)) {
      updates[`system.downtime.trackers.${key}`] = 0;
    }
    updates["system.downtime.days"] = 0;
    updates["system.downtime.isTended"] = false;
    updates["system.downtime.isBedRest"] = false;
    await actor.update(updates);
    const abilityUpdates = [];
    for (const item of actor.items) {
      if (item.type === "ability" && item.system.rechargeType === "rest" && item.system.uses.max > 0 && item.system.uses.value < item.system.uses.max) {
        abilityUpdates.push({ _id: item.id, "system.uses.value": item.system.uses.max });
      }
    }
    if (abilityUpdates.length > 0) await actor.updateEmbeddedDocuments("Item", abilityUpdates);
    ui.notifications.info(game.i18n.format("TAMS.Downtime.CompleteDowntimeDone", { name: actor.name }));
  }
  async _onSendAwardToChat(event, target) {
    const input = target.parentElement.querySelector(".award-days");
    const days = parseInt(input.value) || 0;
    const content = `
      <div class="tams-roll">
        <h3 class="roll-label">${game.i18n.localize("TAMS.DowntimeAwardTitle")}</h3>
        <p>${game.i18n.format("TAMS.DowntimeAwardDescription", { days })}</p>
        <button class="tams-apply-downtime" data-days="${days}">
            ${game.i18n.localize("TAMS.DowntimeApplyAward")}
        </button>
      </div>
    `;
    await ChatMessage.create({
      user: game.user.id,
      content,
      speaker: ChatMessage.getSpeaker({ actor: this.document })
    });
  }
};
__publicField(_TAMSDowntimeSheet, "PARTS", {
  form: {
    template: "systems/tams/templates/downtime-sheet.html"
  }
});
let TAMSDowntimeSheet = _TAMSDowntimeSheet;
class TAMSLootSheet extends TAMSActorSheet {
  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
      classes: ["tams", "sheet", "actor", "loot"],
      position: { width: 500, height: 400 }
    }, { inplace: false });
  }
}
__publicField(TAMSLootSheet, "PARTS", {
  form: {
    template: "systems/tams/templates/loot-sheet.html"
  }
});
class TAMSNPCSheet extends TAMSActorSheet {
  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
      classes: ["tams", "sheet", "actor", "npc"],
      position: { width: 610, height: 760 }
    }, { inplace: false });
  }
  async _onFirstRender(context, options) {
    var _a;
    await ((_a = super._onFirstRender) == null ? void 0 : _a.call(this, context, options));
    if (!this.document.system.settings.isNPC) {
      await this.document.update({ "system.settings.isNPC": true });
    }
  }
}
__publicField(TAMSNPCSheet, "PARTS", {
  form: {
    template: "systems/tams/templates/npc-sheet.html"
  }
});
const _TAMSItemSheet = class _TAMSItemSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2) {
  /** @override */
  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
      tag: "form",
      classes: ["tams", "sheet", "item"],
      position: { width: 560, height: 750 },
      window: { resizable: true, scrollable: [".sheet-body"] },
      form: { submitOnChange: true, closeOnSubmit: false },
      actions: {
        editImage: _TAMSItemSheet.prototype._onEditImage,
        modifierCreate: _TAMSItemSheet.prototype._onModifierCreate,
        modifierDelete: _TAMSItemSheet.prototype._onModifierDelete,
        passiveTraitCreate: _TAMSItemSheet.prototype._onPassiveTraitCreate,
        passiveTraitDelete: _TAMSItemSheet.prototype._onPassiveTraitDelete,
        grantedAbilityDelete: _TAMSItemSheet.prototype._onGrantedAbilityDelete,
        raceResistanceCreate: _TAMSItemSheet.prototype._onRaceResistanceCreate,
        raceResistanceDelete: _TAMSItemSheet.prototype._onRaceResistanceDelete,
        raceResistanceLimbToggle: _TAMSItemSheet.prototype._onRaceResistanceLimbToggle,
        tagToggle: _TAMSItemSheet.prototype._onTagToggle,
        toggleSection: _TAMSItemSheet.prototype._onToggleSection
      }
    }, { inplace: false });
  }
  /** @override */
  get title() {
    return this.document.name;
  }
  /** @override */
  async _prepareContext(options) {
    var _a;
    const context = await super._prepareContext(options);
    context.item = this.document;
    context.document = this.document;
    context.system = this.document.system;
    context.editable = this.isEditable;
    context.owner = this.document.isOwner;
    context.statOptions = {
      "strength": "TAMS.StatStrength",
      "dexterity": "TAMS.StatDexterity",
      "endurance": "TAMS.StatEndurance",
      "wisdom": "TAMS.StatWisdom",
      "intelligence": "TAMS.StatIntelligence",
      "bravery": "TAMS.StatBravery",
      "custom": "TAMS.StatCustom"
    };
    const statOptionsNoCustom = foundry.utils.duplicate(context.statOptions);
    delete statOptionsNoCustom["custom"];
    context.statOptionsNoCustom = statOptionsNoCustom;
    context.weaponStatOptions = {
      "default": "TAMS.Default",
      ...context.statOptions
    };
    delete context.weaponStatOptions["custom"];
    context.limbOptions = {
      "none": "TAMS.CalculatorOptions.None",
      "head": "TAMS.HitLocations.Head",
      "thorax": "TAMS.HitLocations.Thorax",
      "stomach": "TAMS.HitLocations.Stomach",
      "leftArm": "TAMS.HitLocations.LeftArm",
      "rightArm": "TAMS.HitLocations.RightArm",
      "leftLeg": "TAMS.HitLocations.LeftLeg",
      "rightLeg": "TAMS.HitLocations.RightLeg"
    };
    context.sizeOptions = {
      "small": "TAMS.SizeOptions.Small",
      "medium": "TAMS.SizeOptions.Medium",
      "large": "TAMS.SizeOptions.Large"
    };
    const locationOptions = {
      "stowed": "TAMS.LocationOptions.Stowed",
      "backpack": "TAMS.LocationOptions.Backpack",
      "hand": "TAMS.LocationOptions.Hand"
    };
    if (this.document.actor) {
      const backpacks = this.document.actor.items.filter((i) => i.type === "backpack");
      for (const bp of backpacks) {
        locationOptions[bp.id] = game.i18n.format("TAMS.LocationOptions.InContainer", { name: bp.name });
      }
    }
    context.locationOptions = locationOptions;
    context.damageTypeOptions = {
      "": "TAMS.DamageType.None",
      "blunt": "TAMS.DamageType.blunt",
      "piercing": "TAMS.DamageType.piercing",
      "slashing": "TAMS.DamageType.slashing",
      "fire": "TAMS.DamageType.fire",
      "magic": "TAMS.DamageType.magic",
      "psychic": "TAMS.DamageType.psychic",
      "acid": "TAMS.DamageType.acid",
      "divine": "TAMS.DamageType.divine"
    };
    context.passiveRollTypeOptions = {
      "all": "TAMS.PassiveRollType.All",
      "weapon": "TAMS.PassiveRollType.Weapon",
      "skill": "TAMS.PassiveRollType.Skill",
      "ability": "TAMS.PassiveRollType.Ability"
    };
    context.creatureSizeOptions = {
      "tiny": "TAMS.CreatureSizeOptions.Tiny",
      "small": "TAMS.CreatureSizeOptions.Small",
      "normal": "TAMS.CreatureSizeOptions.Normal",
      "large": "TAMS.CreatureSizeOptions.Large",
      "huge": "TAMS.CreatureSizeOptions.Huge",
      "giant": "TAMS.CreatureSizeOptions.Giant"
    };
    context.modifierTargetOptions = {
      "stats.strength.value": "TAMS.StatStrength",
      "stats.dexterity.value": "TAMS.StatDexterity",
      "stats.endurance.value": "TAMS.StatEndurance",
      "stats.wisdom.value": "TAMS.StatWisdom",
      "stats.intelligence.value": "TAMS.StatIntelligence",
      "stats.bravery.value": "TAMS.StatBravery",
      "hp.max": "TAMS.TotalHPMax",
      "stamina.max": "TAMS.StaminaMax",
      "allRolls": "TAMS.ModifierAllRolls",
      "allProfessionRolls": "TAMS.ModifierAllProfessionRolls"
    };
    if (this.document.type === "weapon") {
      const tags = ["accurate", "reliable", "unreliable", "vicious", "brutal", "balanced", "compact", "reach", "silent"];
      const activeTags = (this.document.system.tags || "").split(",").map((t) => t.trim().toLowerCase());
      context.weaponTags = tags.map((t) => ({
        id: t,
        label: game.i18n.localize(`TAMS.WeaponTags.${t.charAt(0).toUpperCase() + t.slice(1)}`),
        active: activeTags.includes(t)
      }));
      const EARLY_TYPES = /* @__PURE__ */ new Set(["matchlock", "flintlock", "wheellock", "blunderbuss"]);
      context.isEarlyFirearm = EARLY_TYPES.has(this.document.system.firearmType);
      context.isModernFirearm = !!this.document.system.firearmType && !context.isEarlyFirearm;
    }
    if (this.document.type === "race") {
      const LIMB_KEYS2 = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
      const LIMB_I18N = {
        head: "TAMS.HitLocations.Head",
        thorax: "TAMS.HitLocations.Thorax",
        stomach: "TAMS.HitLocations.Stomach",
        leftArm: "TAMS.HitLocations.LeftArm",
        rightArm: "TAMS.HitLocations.RightArm",
        leftLeg: "TAMS.HitLocations.LeftLeg",
        rightLeg: "TAMS.HitLocations.RightLeg"
      };
      const LIMB_ABBREV = {
        head: "TAMS.Race.LimbAbbrev.Head",
        thorax: "TAMS.Race.LimbAbbrev.Thorax",
        stomach: "TAMS.Race.LimbAbbrev.Stomach",
        leftArm: "TAMS.Race.LimbAbbrev.LeftArm",
        rightArm: "TAMS.Race.LimbAbbrev.RightArm",
        leftLeg: "TAMS.Race.LimbAbbrev.LeftLeg",
        rightLeg: "TAMS.Race.LimbAbbrev.RightLeg"
      };
      context.enrichedResistances = (this.document.system.resistances || []).map((res, index) => {
        const active = new Set(res.limbs ?? []);
        return {
          ...res,
          index,
          isGlobal: active.size === 0,
          limbButtons: LIMB_KEYS2.map((key) => ({
            key,
            active: active.has(key),
            i18nKey: LIMB_I18N[key],
            abbrevKey: LIMB_ABBREV[key]
          }))
        };
      });
    }
    context.rechargeTypeOptions = {
      "combat": "TAMS.Ability.RechargeOnCombat",
      "rest": "TAMS.Ability.RechargeOnRest",
      "never": "TAMS.Ability.RechargeNever"
    };
    if (this.document.type === "ability") {
      const calculator = this.document.system.calculator || {};
      const selectedTargetingMode = calculator.targetingMode || (calculator.targetLimb !== "none" ? "specific" : calculator.bodyPart !== "none" ? "group" : "normal");
      const resources = { "stamina": "TAMS.Stamina" };
      if (this.document.actor) {
        this.document.actor.system.customResources.forEach((res, index) => {
          resources[index.toString()] = res.name;
        });
      }
      context.resourceOptions = resources;
      context.selectedTargetingMode = selectedTargetingMode;
      context.calculatorOptions = {
        targetingModes: {
          "normal": "TAMS.CalculatorOptions.TargetingModeNormal",
          "group": "TAMS.CalculatorOptions.TargetingModeGroup",
          "specific": "TAMS.CalculatorOptions.TargetingModeSpecific"
        },
        bodyParts: {
          "none": "TAMS.CalculatorOptions.None",
          "head": "TAMS.CalculatorOptions.Head",
          "thorax": "TAMS.CalculatorOptions.Thorax",
          "stomach": "TAMS.CalculatorOptions.Stomach",
          "arms": "TAMS.CalculatorOptions.Arms",
          "legs": "TAMS.CalculatorOptions.Legs"
        },
        fireRates: {
          "single": "TAMS.CalculatorOptions.Single",
          "burst": "TAMS.CalculatorOptions.BurstSemi",
          "auto": "TAMS.CalculatorOptions.FullAuto"
        },
        stunOptions: {
          "none": "TAMS.CalculatorOptions.None",
          "crit": "TAMS.CalculatorOptions.OnCrit",
          "guaranteed": "TAMS.CalculatorOptions.Guaranteed"
        },
        drTypes: {
          "none": "TAMS.CalculatorOptions.None",
          "flat": "TAMS.CalculatorOptions.FlatReduction",
          "specific": "TAMS.CalculatorOptions.SpecificLimbReduction"
        },
        targetTypes: {
          "single": "TAMS.CalculatorOptions.SingleEntity",
          "multiple": "TAMS.CalculatorOptions.MultipleTargets"
        },
        durations: {
          "instant": "TAMS.CalculatorOptions.Instant",
          "1round": "TAMS.CalculatorOptions.Round1",
          "2rounds": "TAMS.CalculatorOptions.Round2",
          "3rounds": "TAMS.CalculatorOptions.Round3",
          "utility1": "TAMS.CalculatorOptions.Utility1",
          "utility2": "TAMS.CalculatorOptions.Utility2",
          "utility3": "TAMS.CalculatorOptions.Utility3",
          "utility4": "TAMS.CalculatorOptions.Utility4"
        },
        damageFractions: {
          "0": "TAMS.CalculatorOptions.DamageFractionNone",
          "0.25": "0.25",
          "0.5": "0.50",
          "0.75": "0.75",
          "1.0": "1.00",
          "1.25": "1.25",
          "1.5": "1.50"
        }
      };
    }
    const sePresets = {};
    for (const se of CONFIG.statusEffects ?? []) {
      if (!se.tams) continue;
      sePresets[se.id] = se.name ?? se.label ?? se.id;
    }
    const currentStatusId = this.document.system.inflictsStatusId ?? "";
    const isKnownPreset = currentStatusId === "" || !!sePresets[currentStatusId];
    context.statusEffectOptions = {
      "": "TAMS.None",
      ...sePresets,
      "custom": "TAMS.StatusEffect.Custom"
    };
    context.inflictsStatusPresetValue = isKnownPreset ? currentStatusId : "custom";
    context.inflictsStatusIsCustom = !isKnownPreset && currentStatusId !== "";
    const SAVE_STAT_KEYS = /* @__PURE__ */ new Set(["strength", "dexterity", "endurance", "wisdom", "intelligence", "bravery"]);
    const currentSaveAgainst = this.document.system.saveAgainst ?? "dexterity";
    context.saveAgainstOptions = {
      "strength": "TAMS.StatStrength",
      "dexterity": "TAMS.StatDexterity",
      "endurance": "TAMS.StatEndurance",
      "wisdom": "TAMS.StatWisdom",
      "intelligence": "TAMS.StatIntelligence",
      "bravery": "TAMS.StatBravery",
      "custom": "TAMS.SaveAgainst.CustomSkill"
    };
    context.saveAgainstPresetValue = SAVE_STAT_KEYS.has(currentSaveAgainst) ? currentSaveAgainst : "custom";
    context.saveAgainstIsCustom = !SAVE_STAT_KEYS.has(currentSaveAgainst);
    if (this.document.type === "ability") {
      const sys = this.document.system;
      if (this._sectionOpen === void 0) {
        this._sectionOpen = {
          uses: ((_a = sys.uses) == null ? void 0 : _a.max) > 0,
          conditionalCost: !!sys.ifStatement,
          sizeGrants: !!(sys.sizeGrantHP || sys.sizeGrantStealth || sys.sizeGrantCombat)
        };
      }
      context.sectionOpen = this._sectionOpen;
    }
    return context;
  }
  /** @override */
  async _preRender(context, options) {
    var _a;
    await super._preRender(context, options);
    this._savedScrollPositions = {};
    for (const el of ((_a = this.element) == null ? void 0 : _a.querySelectorAll("[data-scroll-id]")) ?? []) {
      this._savedScrollPositions[el.dataset.scrollId] = el.scrollTop;
    }
  }
  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    if (this._savedScrollPositions) {
      for (const el of this.element.querySelectorAll("[data-scroll-id]")) {
        const saved = this._savedScrollPositions[el.dataset.scrollId];
        if (saved !== void 0) el.scrollTop = saved;
      }
      this._savedScrollPositions = null;
    }
    this.element.querySelectorAll(".inflicts-status-preset").forEach((select) => {
      select.addEventListener("change", (event) => {
        const value = event.target.value;
        const picker = event.target.closest(".status-effect-picker");
        const customInput = picker == null ? void 0 : picker.querySelector(".inflicts-status-custom");
        if (!customInput) return;
        if (value === "custom") {
          customInput.style.display = "";
          customInput.focus();
        } else {
          customInput.style.display = "none";
          customInput.value = value;
          this.document.update({ "system.inflictsStatusId": value });
        }
      });
    });
    this.element.querySelectorAll(".save-against-preset").forEach((select) => {
      select.addEventListener("change", (event) => {
        const value = event.target.value;
        const picker = event.target.closest(".save-against-picker");
        const customInput = picker == null ? void 0 : picker.querySelector(".save-against-custom");
        if (!customInput) return;
        if (value === "custom") {
          customInput.style.display = "";
          customInput.focus();
        } else {
          customInput.style.display = "none";
          customInput.value = value;
          this.document.update({ "system.saveAgainst": value });
        }
      });
    });
  }
  /** @override */
  async _onDrop(event) {
    if (this.document.type !== "race") return;
    const data = TextEditor.getDragEventData(event);
    if (data.type !== "Item") return;
    let item;
    try {
      item = await Item.fromDropData(data);
    } catch (e2) {
      return;
    }
    if (!item || item.type !== "ability") {
      return ui.notifications.warn(game.i18n.localize("TAMS.Race.GrantedAbilityOnly"));
    }
    const abilityData = item.toObject();
    const abilities = foundry.utils.duplicate(this.document.system.grantedAbilities || []);
    abilities.push(abilityData);
    await this.document.update({ "system.grantedAbilities": abilities });
  }
  /**
   * Handle editing an image in the item sheet.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onEditImage(event, target) {
    const attr = target.dataset.edit || "img";
    const current = foundry.utils.getProperty(this.document, attr);
    const fp = new FilePicker({
      type: "image",
      current,
      callback: (path) => {
        this.document.update({ [attr]: path });
      },
      top: this.position.top + 40,
      left: this.position.left + 10
    });
    return fp.browse();
  }
  /**
   * Handle creating a new modifier on the item.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onModifierCreate(event, target) {
    const modifiers = foundry.utils.duplicate(this.document.system.modifiers || []);
    modifiers.push({ target: "stats.strength.value", value: 0, type: "add" });
    await this.document.update({ "system.modifiers": modifiers });
  }
  /**
   * Handle deleting an existing modifier from the item.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onModifierDelete(event, target) {
    const index = parseInt(target.closest(".modifier-row").dataset.index);
    const modifiers = foundry.utils.duplicate(this.document.system.modifiers || []);
    modifiers.splice(index, 1);
    await this.document.update({ "system.modifiers": modifiers });
  }
  async _onGrantedAbilityDelete(event, target) {
    var _a;
    const index = parseInt(target.dataset.index ?? ((_a = target.closest(".granted-ability-row")) == null ? void 0 : _a.dataset.index));
    const abilities = foundry.utils.duplicate(this.document.system.grantedAbilities || []);
    abilities.splice(index, 1);
    await this.document.update({ "system.grantedAbilities": abilities });
  }
  async _onRaceResistanceCreate(event, target) {
    const resistances = foundry.utils.duplicate(this.document.system.resistances || []);
    resistances.push({ damageType: "", category: "resistance", value: 0, limbs: [] });
    await this.document.update({ "system.resistances": resistances });
  }
  async _onRaceResistanceDelete(event, target) {
    const index = parseInt(target.closest("[data-index]").dataset.index);
    const resistances = foundry.utils.duplicate(this.document.system.resistances || []);
    resistances.splice(index, 1);
    await this.document.update({ "system.resistances": resistances });
  }
  async _onRaceResistanceLimbToggle(event, target) {
    const index = parseInt(target.closest("[data-index]").dataset.index);
    const limbKey = target.dataset.limbKey;
    const resistances = foundry.utils.duplicate(this.document.system.resistances || []);
    const entry = resistances[index];
    if (!entry) return;
    const limbs = [...entry.limbs ?? []];
    const pos = limbs.indexOf(limbKey);
    if (pos === -1) limbs.push(limbKey);
    else limbs.splice(pos, 1);
    resistances[index] = { ...entry, limbs };
    await this.document.update({ "system.resistances": resistances });
  }
  async _onPassiveTraitCreate(event, target) {
    const traits = foundry.utils.duplicate(this.document.system.passiveTraits || []);
    traits.push({ name: "", description: "" });
    await this.document.update({ "system.passiveTraits": traits });
  }
  async _onPassiveTraitDelete(event, target) {
    const index = parseInt(target.closest(".passive-trait-row").dataset.index);
    const traits = foundry.utils.duplicate(this.document.system.passiveTraits || []);
    traits.splice(index, 1);
    await this.document.update({ "system.passiveTraits": traits });
  }
  /**
   * Handle toggling a tag on the weapon.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onTagToggle(event, target) {
    const tag = target.dataset.tag;
    const currentTags = this.document.system.tags || "";
    let tagsArray = currentTags ? currentTags.split(",").map((t) => t.trim().toLowerCase()) : [];
    if (tagsArray.includes(tag.toLowerCase())) {
      tagsArray = tagsArray.filter((t) => t.toLowerCase() !== tag.toLowerCase());
    } else {
      tagsArray.push(tag.toLowerCase());
    }
    await this.document.update({ "system.tags": tagsArray.filter((t) => t).join(", ") });
  }
  /**
   * Handle toggling a collapsible ability section.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  _onToggleSection(event, target) {
    var _a;
    if (!this._sectionOpen) this._sectionOpen = {};
    const section = ((_a = target.closest("[data-section]")) == null ? void 0 : _a.dataset.section) ?? target.dataset.section;
    this._sectionOpen[section] = !this._sectionOpen[section];
    this.render();
  }
  /** @override */
  _prepareSubmitData(event, form, formData) {
    var _a;
    const data = super._prepareSubmitData(event, form, formData);
    if (this.document.type !== "ability") return data;
    const mode = foundry.utils.getProperty(data, "system.calculator.targetingMode") ?? ((_a = this.document.system.calculator) == null ? void 0 : _a.targetingMode) ?? "normal";
    if (mode === "normal") {
      foundry.utils.setProperty(data, "system.calculator.bodyPart", "none");
      foundry.utils.setProperty(data, "system.calculator.targetLimb", "none");
    } else if (mode === "group") {
      foundry.utils.setProperty(data, "system.calculator.targetLimb", "none");
    } else if (mode === "specific") {
      foundry.utils.setProperty(data, "system.calculator.bodyPart", "none");
    }
    return data;
  }
};
__publicField(_TAMSItemSheet, "PARTS", {
  form: {
    template: "systems/tams/templates/item-sheet.html"
  }
});
let TAMSItemSheet = _TAMSItemSheet;
const _TAMSTravelPaceApp = class _TAMSTravelPaceApp extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this.distanceKm = 0;
    this.fmHours = 0;
    this.daysBetweenRest = 0;
    this.warmMealsEnabled = false;
    this.warmMealsValue = 0;
    this.cookUuid = "";
    this.cookDC = 10;
    this.warmMealsResults = [];
    this.membersState = {};
    this.members = [];
    this._focusSelector = null;
  }
  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.distanceKm = this.distanceKm;
    context.fmHours = this.fmHours;
    context.daysBetweenRest = this.daysBetweenRest;
    context.warmMealsEnabled = this.warmMealsEnabled;
    context.warmMealsValue = this.warmMealsValue;
    context.cookUuid = this.cookUuid;
    context.cookDC = this.cookDC;
    const mileToKm = 1.60934;
    const memberData = this.members.map((uuid) => {
      var _a, _b;
      const actor = fromUuidSync(uuid);
      if (!actor) return null;
      const state = this.membersState[uuid] || { speed: null, isMounted: false };
      const endurance = ((_b = (_a = actor.system.stats) == null ? void 0 : _a.endurance) == null ? void 0 : _b.value) || 0;
      const end10 = Math.floor(endurance / 10);
      const defaultSpeed = state.isMounted ? 40 : 20;
      const currentSpeed = state.speed !== null && state.speed !== "" ? parseFloat(state.speed) : defaultSpeed;
      const baseSpeedKmPerDay = currentSpeed * mileToKm;
      const adjustedSpeedKmPerDay = baseSpeedKmPerDay * (8 + this.fmHours) / 8;
      return {
        actor,
        uuid,
        state,
        end10,
        currentSpeed,
        baseSpeedKmPerDay,
        adjustedSpeedKmPerDay,
        defaultSpeed
      };
    }).filter((m) => m !== null);
    context.partyCookOptions = memberData.reduce((acc, m) => {
      acc[m.uuid] = m.actor.name;
      return acc;
    }, {});
    const partySpeedKmPerDay = memberData.length > 0 ? Math.min(...memberData.map((m) => m.adjustedSpeedKmPerDay)) : 0;
    const totalTravelDays = partySpeedKmPerDay > 0 ? this.distanceKm / partySpeedKmPerDay : 0;
    let totalElapsedDays = totalTravelDays;
    if (this.daysBetweenRest > 0 && totalTravelDays > 0) {
      const numRests = Math.floor((totalTravelDays - 1e-6) / this.daysBetweenRest);
      totalElapsedDays += numRests;
    }
    context.timeBreakdown = this._formatTime(totalElapsedDays);
    const mealValGlobal = this.warmMealsEnabled ? parseFloat(this.warmMealsValue) || 0 : 0;
    context.members = memberData.map((m) => {
      const staminaPerDay = [];
      let totalStamina = 0;
      if (totalTravelDays > 0) {
        let travelDayCount = 0;
        let daysInCycle = 0;
        const fullTravelDays = Math.floor(totalTravelDays);
        const totalElapsedDaysToIterate = Math.ceil(totalElapsedDays);
        for (let e2 = 1; e2 <= totalElapsedDaysToIterate; e2++) {
          if (this.daysBetweenRest > 0 && travelDayCount > 0 && travelDayCount % this.daysBetweenRest === 0 && daysInCycle === this.daysBetweenRest) {
            staminaPerDay.push(0);
            daysInCycle = 0;
            continue;
          }
          travelDayCount++;
          daysInCycle++;
          const hasWarmMeal = this.warmMealsEnabled && this.cookUuid && (this.warmMealsResults.length >= travelDayCount ? this.warmMealsResults[travelDayCount - 1] : true);
          const currentMealVal = hasWarmMeal ? parseFloat(this.warmMealsValue) || 0 : 0;
          const bonus = m.end10 + currentMealVal;
          if (travelDayCount <= fullTravelDays) {
            const dailyAccumulatedFM = daysInCycle * this.fmHours;
            const cost = Math.ceil(Math.max(0, dailyAccumulatedFM - bonus));
            staminaPerDay.push(cost);
            totalStamina += cost;
          } else if (travelDayCount > fullTravelDays && travelDayCount <= Math.ceil(totalTravelDays)) {
            const lastDayFraction = totalTravelDays - fullTravelDays;
            if (lastDayFraction > 0) {
              const totalTravelHoursPerDay = 8 + this.fmHours;
              const lastDayHours = lastDayFraction * totalTravelHoursPerDay;
              const lastDayFM = Math.max(0, lastDayHours - 8);
              const dailyAccumulatedFM = (daysInCycle - 1) * this.fmHours + lastDayFM;
              const cost = Math.ceil(Math.max(0, dailyAccumulatedFM - bonus));
              staminaPerDay.push(cost);
              totalStamina += cost;
            }
          }
        }
      }
      let staminaCons = "0";
      let staminaPerRest = 0;
      if (this.daysBetweenRest > 0) {
        for (let d = 1; d <= this.daysBetweenRest; d++) {
          const dailyAccumulatedFM = d * this.fmHours;
          staminaPerRest += Math.ceil(Math.max(0, dailyAccumulatedFM - (m.end10 + mealValGlobal)));
        }
      }
      if (totalStamina > 0) {
        if (staminaPerDay.length <= 5) {
          staminaCons = staminaPerDay.join(", ");
        } else {
          const first = staminaPerDay[0];
          const last = staminaPerDay[staminaPerDay.length - 1];
          staminaCons = `${first} ... ${last} (${game.i18n.localize("TAMS.Total")}: ${totalStamina})`;
        }
      }
      return {
        uuid: m.uuid,
        name: m.actor.name,
        img: m.actor.img,
        speed: m.state.speed,
        isMounted: m.state.isMounted,
        defaultSpeed: m.defaultSpeed,
        currentSpeed: m.currentSpeed,
        staminaCons,
        staminaPerRest,
        staminaPerDay,
        totalStamina,
        end10: m.end10
      };
    });
    return context;
  }
  _formatTime(totalDays) {
    if (totalDays === 0 || isNaN(totalDays)) return null;
    let days = Math.floor(totalDays);
    let fractionalDay = totalDays - days;
    const travelHoursPerDay = 8 + this.fmHours;
    let hours = Math.round(fractionalDay * travelHoursPerDay);
    if (hours >= travelHoursPerDay) {
      days += 1;
      hours -= travelHoursPerDay;
    }
    let months = Math.floor(days / 30);
    days %= 30;
    let weeks = Math.floor(days / 7);
    days %= 7;
    return { months, weeks, days, hours };
  }
  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    const html = this.element;
    html.addEventListener("focusin", (event) => {
      this._storeFocus(event.target);
    }, true);
    html.querySelectorAll("input, select, textarea").forEach((input) => {
      input.addEventListener("input", (event) => {
        const action = input.dataset.action;
        if (action === "updateValue") this._onUpdateValue(event, input, false);
        else if (action === "updateMember") this._onUpdateMember(event, input, false);
      });
      input.addEventListener("change", (event) => {
        const action = input.dataset.action;
        if (action === "updateValue") this._onUpdateValue(event, input, true);
        else if (action === "updateMember") this._onUpdateMember(event, input, true);
        else if (action === "toggleValue") this._onToggleValue(event, input, true);
      });
    });
    if (this._focusSelector) {
      const el = this.element.querySelector(this._focusSelector);
      if (el) {
        el.focus();
        const supportsSelection = el.type && ["text", "search", "url", "tel", "password"].includes(el.type);
        if (supportsSelection && el.setSelectionRange && this._selectionRange) {
          el.setSelectionRange(this._selectionRange[0], this._selectionRange[1]);
        }
      }
      this._focusSelector = null;
      this._selectionRange = null;
    }
  }
  /* -------------------------------------------- */
  /*  Action Handlers                             */
  /* -------------------------------------------- */
  _onUpdateValue(event, target, render = true) {
    const field = target.dataset.field;
    if (target.type === "number") {
      this[field] = target.value === "" ? 0 : parseFloat(target.value) || 0;
    } else {
      this[field] = target.value;
    }
    if (render) {
      this._storeFocus();
      this.render();
    }
  }
  _onToggleValue(event, target, render = true) {
    const field = target.dataset.field;
    this[field] = target.checked;
    if (render) {
      this._storeFocus();
      this.render();
    }
  }
  _onUpdateMember(event, target, render = true) {
    const actorUuid = target.closest(".member").dataset.actorUuid;
    const field = target.dataset.field;
    if (!this.membersState[actorUuid]) {
      this.membersState[actorUuid] = { speed: null, isMounted: false };
    }
    if (target.type === "checkbox") {
      this.membersState[actorUuid][field] = target.checked;
    } else {
      this.membersState[actorUuid][field] = target.value;
    }
    if (render) {
      this._storeFocus();
      this.render();
    }
  }
  async _onAddMember(event, target) {
    const tokens = canvas.tokens.controlled;
    if (tokens.length === 0) {
      ui.notifications.warn(game.i18n.localize("TAMS.Notifications.SelectTokensForTravel"));
      return;
    }
    let added = false;
    for (let t of tokens) {
      if (t.actor && !this.members.includes(t.actor.uuid)) {
        this.members.push(t.actor.uuid);
        this.membersState[t.actor.uuid] = { speed: null, isMounted: false };
        added = true;
      }
    }
    if (added) this.render();
  }
  _onRemoveMember(event, target) {
    const actorUuid = target.closest(".member").dataset.actorUuid;
    this.members = this.members.filter((uuid) => uuid !== actorUuid);
    delete this.membersState[actorUuid];
    if (this.cookUuid === actorUuid) this.cookUuid = "";
    this.render();
  }
  async _onMakeCookChecks(event, target) {
    if (!this.warmMealsEnabled) return;
    if (!this.cookUuid) {
      ui.notifications.warn(game.i18n.localize("TAMS.Notifications.SelectCook"));
      return;
    }
    const cookActor = fromUuidSync(this.cookUuid);
    if (!cookActor) {
      ui.notifications.warn(game.i18n.localize("TAMS.Notifications.SelectCook"));
      return;
    }
    if (this.members.length === 0) {
      ui.notifications.warn(game.i18n.localize("TAMS.Notifications.NoMembersForCook"));
      return;
    }
    if (this.distanceKm <= 0) {
      ui.notifications.warn(game.i18n.localize("TAMS.Notifications.EnterDistance"));
      return;
    }
    const mileToKm = 1.60934;
    const memberSpeeds = this.members.map((uuid) => {
      const state = this.membersState[uuid] || { speed: null, isMounted: false };
      const defaultSpeed = state.isMounted ? 40 : 20;
      return state.speed !== null && state.speed !== "" ? parseFloat(state.speed) : defaultSpeed;
    });
    const partySpeedMiles = memberSpeeds.length > 0 ? Math.min(...memberSpeeds) : 0;
    const adjustedSpeedKmPerDay = partySpeedMiles * mileToKm * (8 + this.fmHours) / 8;
    const totalTravelDays = adjustedSpeedKmPerDay > 0 ? Math.ceil(this.distanceKm / adjustedSpeedKmPerDay) : 0;
    if (totalTravelDays <= 0) return;
    const results = [];
    const dc = this.cookDC || 10;
    const rollSummary = [];
    const skill = cookActor.items.find((i) => {
      if (i.type !== "skill") return false;
      const tags = (i.system.tags || "").split(",").map((t) => t.trim().toLowerCase());
      return tags.includes("cooking");
    });
    const wisdom = cookActor.system.stats.wisdom;
    let statId = "wisdom";
    let statValue = wisdom.value;
    let statMod = wisdom.mod;
    let familiarity = 0;
    let bonus = 0;
    if (skill) {
      statId = skill.system.stat;
      const stat = cookActor.system.stats[statId];
      statValue = stat.value;
      statMod = stat.mod;
      familiarity = parseInt(skill.system.familiarity) || 0;
      bonus = parseInt(skill.system.bonus) || 0;
    }
    for (let d = 1; d <= totalTravelDays; d++) {
      const roll = await new Roll("1d100").evaluate();
      const rawResult = roll.total;
      const cappedResult = Math.min(rawResult, statValue + statMod);
      const total = cappedResult + familiarity + bonus;
      const success = total >= dc;
      results.push(success);
      rollSummary.push(`Day ${d}: ${total} (Roll: ${rawResult}) - ${success ? "Success" : "Failure"}`);
    }
    this.warmMealsResults = results;
    const content = `
      <div class="tams-roll">
        <h3 class="roll-label">${game.i18n.localize("TAMS.MakeCookChecks")}: ${cookActor.name}</h3>
        <p><small>${game.i18n.format("TAMS.CookCheckDescription", { dc })}</small></p>
        <ul style="list-style: none; padding: 0; font-size: 0.9em;">
          ${rollSummary.map((s) => `<li>${s}</li>`).join("")}
        </ul>
      </div>
    `;
    ChatMessage.create({
      user: game.user.id,
      content,
      speaker: ChatMessage.getSpeaker({ actor: cookActor })
    });
    this.render();
  }
  _storeFocus(target = null) {
    var _a;
    target = target || document.activeElement;
    if (!target || !((_a = this.element) == null ? void 0 : _a.contains(target))) return;
    const field = target.dataset.field;
    if (!field) return;
    const member = target.closest(".member");
    if (member) {
      const uuid = member.dataset.actorUuid;
      this._focusSelector = `.member[data-actor-uuid="${uuid}"] [data-field="${field}"]`;
    } else {
      this._focusSelector = `[data-field="${field}"]`;
    }
    const supportsSelection = target.type && ["text", "search", "url", "tel", "password"].includes(target.type);
    if (supportsSelection && target.setSelectionRange) {
      this._selectionRange = [target.selectionStart, target.selectionEnd];
    } else {
      this._selectionRange = null;
    }
  }
  async _onOutputToChat(event, target) {
    const context = await this._prepareContext();
    const { timeBreakdown, members } = context;
    let timeParts = [];
    if (timeBreakdown) {
      if (timeBreakdown.months) timeParts.push(`${timeBreakdown.months} ${game.i18n.localize("TAMS.Months")}`);
      if (timeBreakdown.weeks) timeParts.push(`${timeBreakdown.weeks} ${game.i18n.localize("TAMS.Weeks")}`);
      if (timeBreakdown.days) timeParts.push(`${timeBreakdown.days} ${game.i18n.localize("TAMS.Days")}`);
      if (timeBreakdown.hours) timeParts.push(`${timeBreakdown.hours} ${game.i18n.localize("TAMS.Hours")}`);
    }
    const timeString = timeParts.length > 0 ? timeParts.join(", ") : `0 ${game.i18n.localize("TAMS.Hours")}`;
    let staminaInfo = members.map((m) => {
      const dayBreakdown = m.staminaPerDay.map((cost, i) => cost > 0 ? `${game.i18n.localize("TAMS.Day")} ${i + 1}: ${cost}` : null).filter((d) => d !== null);
      let info = `<li><strong>${m.name}</strong>: ${m.totalStamina} ${game.i18n.localize("TAMS.Stamina")}</li>`;
      if (dayBreakdown.length > 0) {
        info += `<li style="list-style: none; margin-left: 10px; font-size: 0.85em;">${dayBreakdown.join(", ")}</li>`;
      }
      if (m.staminaPerRest) {
        info += `<li style="list-style: none; margin-left: 10px; font-size: 0.8em;">(${game.i18n.localize("TAMS.StaminaPerRest")}: ${m.staminaPerRest})</li>`;
      }
      return info;
    }).join("");
    const content = `
      <div class="tams-roll travel-pace-card">
        <h3 class="roll-label">${game.i18n.localize("TAMS.TravelResults")}</h3>
        <div class="roll-row">
          <span>${game.i18n.localize("TAMS.TravelTimeResult")}:</span>
          <span>${timeString}</span>
        </div>
        <hr>
        <div class="roll-description"><strong>${game.i18n.localize("TAMS.StaminaConsumption")}:</strong></div>
        <ul style="list-style: none; padding: 0; margin: 0;">${staminaInfo}</ul>
      </div>
    `;
    ChatMessage.create({
      user: game.user.id,
      content,
      speaker: ChatMessage.getSpeaker()
    });
  }
};
/** @override */
__publicField(_TAMSTravelPaceApp, "DEFAULT_OPTIONS", {
  tag: "div",
  id: "tams-travel-pace",
  classes: ["tams", "travel-pace"],
  position: { width: 400, height: "auto" },
  window: {
    title: "TAMS.TravelPaceMenu",
    resizable: true,
    icon: "icons/svg/walk.svg"
  },
  actions: {
    addMember: _TAMSTravelPaceApp.prototype._onAddMember,
    removeMember: _TAMSTravelPaceApp.prototype._onRemoveMember,
    makeCookChecks: _TAMSTravelPaceApp.prototype._onMakeCookChecks,
    outputToChat: _TAMSTravelPaceApp.prototype._onOutputToChat
  }
});
/** @override */
__publicField(_TAMSTravelPaceApp, "PARTS", {
  form: {
    template: "systems/tams/templates/travel-pace.html"
  }
});
let TAMSTravelPaceApp = _TAMSTravelPaceApp;
const _TAMSItemMaker = class _TAMSItemMaker extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this._actor = options.actor ?? null;
    this._selectedType = "weapon";
    this._imgSrc = "icons/svg/item-bag.svg";
    this._name = "";
    this._formState = {
      weapon: { size: "medium", isRanged: false, attackStat: "dexterity", damageStat: "strength", damageType: "piercing", hasArmourPen: false, armourPen: 0, fireRate: "1", ammoTotal: 0, tags: "" },
      skill: { stat: "dexterity", bonus: 0 },
      ability: { resource: "stamina", cost: 1, isAttack: false, attackStat: "dexterity", damageStat: "strength", damage: 0, damageType: "blunt" },
      equipment: { quantity: 1, size: "medium" },
      armor: { size: "medium", head: 0, thorax: 0, stomach: 0, leftArm: 0, rightArm: 0, leftLeg: 0, rightLeg: 0 },
      consumable: { quantity: 1, size: "small", usesMax: 1 },
      tool: { quantity: 1, size: "small" },
      shield: { armorValue: 5, size: "medium" },
      questItem: { quantity: 1, size: "small" },
      backpack: { capacity: 10, modifier: 0.5 },
      trait: { isProfession: false, profession: "" },
      statusEffect: { statusId: "", mechanicalSummary: "", durationRounds: 0 }
    };
  }
  /** Open the item maker. Pass an Actor to create embedded items; omit for world items. */
  static open(actor = null) {
    new _TAMSItemMaker({ actor }).render(true);
  }
  /* -------------------------------------------- */
  /*  Context                                     */
  /* -------------------------------------------- */
  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.selectedType = this._selectedType;
    context.imgSrc = this._imgSrc;
    context.itemName = this._name;
    context.f = this._formState[this._selectedType];
    context.itemTypes = [
      { type: "weapon", label: "TYPES.Item.weapon", icon: "fa-solid fa-sword" },
      { type: "skill", label: "TYPES.Item.skill", icon: "fa-solid fa-book-open" },
      { type: "ability", label: "TYPES.Item.ability", icon: "fa-solid fa-bolt" },
      { type: "equipment", label: "TYPES.Item.equipment", icon: "fa-solid fa-box" },
      { type: "armor", label: "TYPES.Item.armor", icon: "fa-solid fa-shirt" },
      { type: "consumable", label: "TYPES.Item.consumable", icon: "fa-solid fa-flask" },
      { type: "tool", label: "TYPES.Item.tool", icon: "fa-solid fa-wrench" },
      { type: "shield", label: "TYPES.Item.shield", icon: "fa-solid fa-shield-halved" },
      { type: "questItem", label: "TYPES.Item.questItem", icon: "fa-solid fa-scroll" },
      { type: "backpack", label: "TYPES.Item.backpack", icon: "fa-solid fa-bag-shopping" },
      { type: "trait", label: "TYPES.Item.trait", icon: "fa-solid fa-star" },
      { type: "statusEffect", label: "TYPES.Item.statusEffect", icon: "fa-solid fa-skull-crossbones" }
    ];
    context.statOptions = {
      "strength": "TAMS.StatStrength",
      "dexterity": "TAMS.StatDexterity",
      "endurance": "TAMS.StatEndurance",
      "wisdom": "TAMS.StatWisdom",
      "intelligence": "TAMS.StatIntelligence",
      "bravery": "TAMS.StatBravery"
    };
    context.damageTypeOptions = {
      "": "TAMS.DamageType.None",
      "blunt": "TAMS.DamageType.blunt",
      "piercing": "TAMS.DamageType.piercing",
      "slashing": "TAMS.DamageType.slashing",
      "fire": "TAMS.DamageType.fire",
      "magic": "TAMS.DamageType.magic",
      "psychic": "TAMS.DamageType.psychic",
      "acid": "TAMS.DamageType.acid",
      "divine": "TAMS.DamageType.divine"
    };
    context.sizeOptions = {
      "small": "TAMS.SizeOptions.Small",
      "medium": "TAMS.SizeOptions.Medium",
      "large": "TAMS.SizeOptions.Large"
    };
    context.fireRateOptions = {
      "1": "TAMS.FireRateSingle",
      "3": "TAMS.FireRateBurst",
      "auto": "TAMS.FireRateAuto"
    };
    const resources = { "stamina": "TAMS.Stamina" };
    if (this._actor) {
      (this._actor.system.customResources ?? []).forEach((res, i) => {
        resources[i.toString()] = res.name;
      });
    }
    context.resourceOptions = resources;
    const sePresets = {};
    for (const se of CONFIG.statusEffects ?? []) {
      sePresets[se.id] = se.label ?? se.id;
    }
    context.statusEffectOptions = { "": "TAMS.None", ...sePresets, "custom": "TAMS.StatusEffect.Custom" };
    return context;
  }
  /* -------------------------------------------- */
  /*  Render                                      */
  /* -------------------------------------------- */
  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    const nameInput = this.element.querySelector(".item-maker-name");
    if (nameInput) {
      nameInput.addEventListener("input", (e2) => {
        this._name = e2.target.value;
      });
    }
    this.element.querySelectorAll("[data-field]").forEach((el) => {
      const save = () => {
        const field = el.dataset.field;
        let value;
        if (el.type === "checkbox") value = el.checked;
        else if (el.type === "number") value = parseFloat(el.value) || 0;
        else value = el.value;
        this._formState[this._selectedType][field] = value;
      };
      el.addEventListener("input", save);
      el.addEventListener("change", save);
    });
    this.element.querySelectorAll("[data-rerender]").forEach((el) => {
      el.addEventListener("change", () => {
        const field = el.dataset.field;
        this._formState[this._selectedType][field] = el.checked;
        this.render();
      });
    });
  }
  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */
  async _onCancelMaker(event, target) {
    this.close();
  }
  async _onSelectType(event, target) {
    this._selectedType = target.dataset.type;
    this.render();
  }
  async _onEditImage(event, target) {
    const fp = new FilePicker({
      type: "image",
      current: this._imgSrc,
      callback: (path) => {
        this._imgSrc = path;
        this.render();
      }
    });
    fp.browse();
  }
  async _onCreateItem(event, target) {
    const s = this._formState[this._selectedType];
    const type = this._selectedType;
    const typeName = game.i18n.localize(`TYPES.Item.${type}`);
    const name = this._name.trim() || game.i18n.format("TAMS.ItemMaker.DefaultName", { type: typeName });
    const systemData = this._buildSystemData(type, s);
    const itemData = { name, type, img: this._imgSrc, system: systemData };
    if (this._actor) {
      await this._actor.createEmbeddedDocuments("Item", [itemData]);
    } else {
      await Item.create(itemData);
    }
    ui.notifications.info(game.i18n.format("TAMS.ItemMaker.Created", { name }));
    this.close();
  }
  /* -------------------------------------------- */
  /*  Helpers                                     */
  /* -------------------------------------------- */
  _buildSystemData(type, s) {
    switch (type) {
      case "weapon": {
        const data = {
          size: s.size ?? "medium",
          isRanged: !!s.isRanged,
          attackStat: s.attackStat ?? "dexterity",
          damageStat: s.damageStat ?? "strength",
          damageType: s.damageType ?? "piercing",
          hasArmourPen: !!s.hasArmourPen,
          armourPenetration: parseFloat(s.armourPen) || 0,
          tags: s.tags ?? ""
        };
        if (s.isRanged) {
          data.fireRate = s.fireRate ?? "1";
          data.ammo = { current: parseInt(s.ammoTotal) || 0, total: parseInt(s.ammoTotal) || 0 };
          data.isRanged = true;
        }
        return data;
      }
      case "skill":
        return { stat: s.stat ?? "dexterity", bonus: parseInt(s.bonus) || 0 };
      case "ability": {
        const data = {
          resource: s.resource ?? "stamina",
          cost: parseFloat(s.cost) || 1,
          isAttack: !!s.isAttack
        };
        if (s.isAttack) {
          data.attackStat = s.attackStat ?? "dexterity";
          data.damageStat = s.damageStat ?? "strength";
          data.damage = parseFloat(s.damage) || 0;
          data.damageType = s.damageType ?? "blunt";
        }
        return data;
      }
      case "equipment":
      case "tool":
      case "questItem":
        return { quantity: parseInt(s.quantity) || 1, size: s.size ?? "medium" };
      case "armor":
        return {
          size: s.size ?? "medium",
          limbs: {
            head: { value: parseInt(s.head) || 0, max: parseInt(s.head) || 0 },
            thorax: { value: parseInt(s.thorax) || 0, max: parseInt(s.thorax) || 0 },
            stomach: { value: parseInt(s.stomach) || 0, max: parseInt(s.stomach) || 0 },
            leftArm: { value: parseInt(s.leftArm) || 0, max: parseInt(s.leftArm) || 0 },
            rightArm: { value: parseInt(s.rightArm) || 0, max: parseInt(s.rightArm) || 0 },
            leftLeg: { value: parseInt(s.leftLeg) || 0, max: parseInt(s.leftLeg) || 0 },
            rightLeg: { value: parseInt(s.rightLeg) || 0, max: parseInt(s.rightLeg) || 0 }
          }
        };
      case "consumable":
        return { quantity: parseInt(s.quantity) || 1, size: s.size ?? "small", uses: { value: parseInt(s.usesMax) || 1, max: parseInt(s.usesMax) || 1 } };
      case "shield":
        return { armorValue: parseInt(s.armorValue) || 5, size: s.size ?? "medium" };
      case "backpack":
        return { capacity: parseInt(s.capacity) || 10, modifier: parseFloat(s.modifier) || 0.5 };
      case "trait":
        return { isProfession: !!s.isProfession, profession: s.profession ?? "" };
      case "statusEffect":
        return { statusId: s.statusId ?? "", mechanicalSummary: s.mechanicalSummary ?? "", durationRounds: parseInt(s.durationRounds) || 0 };
      default:
        return {};
    }
  }
};
/** @override */
__publicField(_TAMSItemMaker, "DEFAULT_OPTIONS", {
  id: "tams-item-maker",
  classes: ["tams", "item-maker"],
  position: { width: 540, height: "auto" },
  window: {
    title: "TAMS.ItemMaker.Title",
    resizable: true,
    icon: "fa-solid fa-hammer"
  },
  actions: {
    selectType: _TAMSItemMaker.prototype._onSelectType,
    createItem: _TAMSItemMaker.prototype._onCreateItem,
    editImage: _TAMSItemMaker.prototype._onEditImage,
    cancelMaker: _TAMSItemMaker.prototype._onCancelMaker
  }
});
/** @override */
__publicField(_TAMSItemMaker, "PARTS", {
  form: { template: "systems/tams/templates/item-maker.html" }
});
let TAMSItemMaker = _TAMSItemMaker;
const _TAMSPartyHonorApp = class _TAMSPartyHonorApp extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const partyHonor = getPartyHonor();
    context.paths = Object.entries(HONOR_PATHS).map(([id, pathData]) => {
      const score = partyHonor[id] ?? 0;
      return { id, score, labelKey: pathData.labelKey, tier: getHonorTier(score, id) };
    });
    context.isGM = game.user.isGM;
    return context;
  }
  async _onAdjustScore(event, target) {
    if (!game.user.isGM) return;
    const path = target.dataset.path;
    const partyHonor = getPartyHonor();
    const current = partyHonor[path] ?? 0;
    const pathData = HONOR_PATHS[path];
    if (!pathData) return;
    new Dialog({
      title: `${game.i18n.localize(pathData.labelKey)} — ${game.i18n.localize("TAMS.Honor.EditScore")}`,
      content: `<div class="form-group" style="padding: 10px;">
        <label>${game.i18n.localize("TAMS.Honor.Score")} (-100 ${game.i18n.localize("TAMS.Honor.To")} 100)</label>
        <input type="number" name="score" value="${current}" min="-100" max="100" style="width: 80px; margin-left: 10px;"/>
      </div>`,
      buttons: {
        save: {
          icon: '<i class="fas fa-save"></i>',
          label: game.i18n.localize("TAMS.Save"),
          callback: async (html) => {
            const val = parseInt(html.find('[name="score"]').val());
            if (!isNaN(val)) {
              partyHonor[path] = Math.clamp(val, -100, 100);
              await setPartyHonor(partyHonor);
              this.render();
            }
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("TAMS.Cancel")
        }
      },
      default: "save"
    }).render(true);
  }
};
__publicField(_TAMSPartyHonorApp, "DEFAULT_OPTIONS", {
  id: "tams-party-honor",
  classes: ["tams", "party-honor"],
  position: { width: 480, height: "auto" },
  window: {
    title: "TAMS.Honor.PartyHonor",
    icon: "fas fa-shield-alt"
  },
  actions: {
    adjustScore: _TAMSPartyHonorApp.prototype._onAdjustScore
  }
});
__publicField(_TAMSPartyHonorApp, "PARTS", {
  form: { template: "systems/tams/templates/party-honor.html" }
});
let TAMSPartyHonorApp = _TAMSPartyHonorApp;
Hooks.once("init", async function() {
  var _a, _b, _c, _d;
  console.log("TAMS | Initializing Todo's Advanced Modular System");
  game.socket.on("system.tams", (data) => {
    var _a2;
    if (data.type === "updateMessage" && game.user.isGM) {
      const message = game.messages.get(data.messageId);
      if (message && ((_a2 = message.author) == null ? void 0 : _a2.id) === data.userId) message.update(data.updateData);
    } else if (data.type === "createLoot" && game.user.isGM) {
      tamsHandleLootDrop(data.lootData, data.x, data.y);
    } else if (data.type === "transferItem" && game.user.isGM) {
      const sender = game.users.get(data.userId);
      if (sender) tamsHandleItemTransfer(data, sender);
    }
  });
  game.settings.register("tams", "currencies", {
    name: "TAMS.Currencies",
    hint: "TAMS.SettingsCurrenciesHint",
    scope: "world",
    config: true,
    type: String,
    default: "Gold, Silver, Copper"
  });
  game.settings.register("tams", "capacityMode", {
    name: "TAMS.Settings.CapacityMode",
    hint: "TAMS.Settings.CapacityModeHint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      weight: "TAMS.Settings.CapacityModeWeight",
      slots: "TAMS.Settings.CapacityModeSlots"
    },
    default: "weight",
    requiresReload: true
  });
  game.settings.register("tams", "largeItemSlots", {
    name: "TAMS.Settings.LargeItemSlots",
    hint: "TAMS.Settings.LargeItemSlotsHint",
    scope: "world",
    config: true,
    type: Number,
    range: { min: 2, max: 10, step: 1 },
    default: 2
  });
  game.settings.register("tams", "honorSystem", {
    name: "TAMS.Settings.HonorSystem",
    hint: "TAMS.Settings.HonorSystemHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
  game.settings.register("tams", "partyHonor", {
    name: "TAMS.Honor.PartyHonor",
    scope: "world",
    config: false,
    type: String,
    default: '{"valor":0,"justice":0,"devotion":0,"renown":0}'
  });
  game.settings.register("tams", "enforceEquipLimit", {
    name: "TAMS.Settings.EnforceEquipLimit",
    hint: "TAMS.Settings.EnforceEquipLimitHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
  game.settings.register("tams", "maxHands", {
    name: "TAMS.Settings.MaxHands",
    hint: "TAMS.Settings.MaxHandsHint",
    scope: "world",
    config: true,
    type: Number,
    range: { min: 1, max: 6, step: 1 },
    default: 2
  });
  CONFIG.Actor.dataModels.character = TAMSCharacterData;
  CONFIG.Actor.dataModels.downtime = TAMSCharacterData;
  CONFIG.Item.dataModels.weapon = TAMSWeaponData;
  CONFIG.Item.dataModels.skill = TAMSSkillData;
  CONFIG.Item.dataModels.ability = TAMSAbilityData;
  CONFIG.Item.dataModels.equipment = TAMSEquipmentData;
  CONFIG.Item.dataModels.armor = TAMSArmorData;
  CONFIG.Item.dataModels.ammo = TAMSAmmoData;
  CONFIG.Item.dataModels.consumable = TAMSConsumableData;
  CONFIG.Item.dataModels.tool = TAMSToolData;
  CONFIG.Item.dataModels.shield = TAMSShieldData;
  CONFIG.Item.dataModels.questItem = TAMSQuestItemData;
  CONFIG.Item.dataModels.backpack = TAMSBackpackData;
  CONFIG.Item.dataModels.trait = TAMSTraitData;
  CONFIG.Item.dataModels.statusEffect = TAMSStatusEffectData;
  CONFIG.Item.dataModels.race = TAMSRaceData;
  CONFIG.Item.systemDataModels = CONFIG.Item.dataModels;
  CONFIG.Actor.systemDataModels = CONFIG.Actor.dataModels;
  CONFIG.Actor.documentClass = TAMSActor;
  CONFIG.Item.documentClass = TAMSItem;
  game.tams = {
    travelPace: () => {
      if (!game.tams._travelPaceApp) {
        game.tams._travelPaceApp = new TAMSTravelPaceApp();
      }
      game.tams._travelPaceApp.render(true, { focus: true });
    },
    groupCheck: () => tamsCallGroupCheck(),
    openItemMaker: (actor = null) => TAMSItemMaker.open(actor),
    partyHonor: () => {
      if (!game.tams._partyHonorApp) {
        game.tams._partyHonorApp = new TAMSPartyHonorApp();
      }
      game.tams._partyHonorApp.render(true, { focus: true });
    }
  };
  foundry.documents.collections.Actors.unregisterSheet("core", (_b = (_a = foundry.appv1) == null ? void 0 : _a.sheets) == null ? void 0 : _b.ActorSheet);
  foundry.documents.collections.Actors.registerSheet("tams", TAMSActorSheet, { makeDefault: true });
  foundry.documents.collections.Actors.registerSheet("tams", TAMSDowntimeSheet, {
    types: ["downtime"],
    makeDefault: true,
    label: "TAMS.DowntimeSheet"
  });
  foundry.documents.collections.Actors.registerSheet("tams", TAMSDowntimeSheet, {
    types: ["character"],
    makeDefault: false,
    label: "TAMS.DowntimeSheet"
  });
  foundry.documents.collections.Actors.registerSheet("tams", TAMSLootSheet, {
    types: ["character"],
    makeDefault: false,
    label: "TAMS.LootSheet"
  });
  foundry.documents.collections.Actors.registerSheet("tams", TAMSNPCSheet, {
    types: ["character"],
    makeDefault: false,
    label: "TAMS.NPCSheet"
  });
  foundry.documents.collections.Items.unregisterSheet("core", (_d = (_c = foundry.appv1) == null ? void 0 : _c.sheets) == null ? void 0 : _d.ItemSheet);
  foundry.documents.collections.Items.registerSheet("tams", TAMSItemSheet, { makeDefault: true });
  Handlebars.registerHelper("eq", (a, b) => a === b);
  Handlebars.registerHelper("gt", (a, b) => a > b);
  Handlebars.registerHelper("lt", (a, b) => a < b);
  Handlebars.registerHelper("gte", (a, b) => a >= b);
  Handlebars.registerHelper("lte", (a, b) => a <= b);
  Handlebars.registerHelper("or", (...args) => {
    args.pop();
    return args.some((v) => !!v);
  });
  Handlebars.registerHelper("and", (...args) => {
    args.pop();
    return args.every((v) => !!v);
  });
  Handlebars.registerHelper("not", (a) => !a);
  Handlebars.registerHelper("subtract", (a, b) => (Number(a) || 0) - (Number(b) || 0));
  Handlebars.registerHelper("add", (a, b) => (Number(a) || 0) + (Number(b) || 0));
  Handlebars.registerHelper("index", (arr, i) => arr == null ? void 0 : arr[i]);
  Handlebars.registerHelper("capitalize", (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  });
  Handlebars.registerHelper("upperCase", (str) => {
    if (!str) return "";
    return str.toUpperCase();
  });
  Hooks.on("renderChatMessage", tamsRenderChatMessage);
  Hooks.on("createChatMessage", async (msg) => {
    if (!game.user.isGM) return;
    await tamsHandleGroupCheckPending(msg);
    await tamsHandleContestedCheckPending(msg);
  });
  Hooks.on("renderChatLog", (app, html) => {
    if (!game.user.isGM) return;
    const root = html instanceof jQuery ? html[0] : html;
    const controls = root.querySelector("#chat-controls") ?? root.querySelector(".control-buttons") ?? root.querySelector("#chat-form");
    if (!controls) return;
    if (root.querySelector(".tams-call-group-check")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tams-call-group-check";
    btn.title = game.i18n.localize("TAMS.GroupCheck.CallForCheck");
    btn.innerHTML = `<i class="fas fa-users-cog"></i> ${game.i18n.localize("TAMS.GroupCheck.CallForCheck")}`;
    btn.addEventListener("click", () => tamsCallGroupCheck());
    controls.prepend(btn);
  });
  const tamsStatusEffects = [
    // Existing
    { id: "encumbered", name: "TAMS.Encumbered", img: "icons/svg/anchor.svg", icon: "icons/svg/anchor.svg", tams: true },
    { id: "bleeding", name: "TAMS.Status.Bleeding", img: "icons/svg/blood.svg", icon: "icons/svg/blood.svg", tams: true },
    { id: "severe-bleeding", name: "TAMS.Status.SevereBleeding", img: "icons/svg/blood.svg", icon: "icons/svg/blood.svg", tams: true },
    // Category 1 — Combat Conditions
    { id: "stunned", name: "TAMS.Status.Stunned", img: "icons/svg/daze.svg", icon: "icons/svg/daze.svg", tams: true },
    { id: "prone", name: "TAMS.Status.Prone", img: "icons/svg/falling.svg", icon: "icons/svg/falling.svg", tams: true },
    { id: "suppressed", name: "TAMS.Status.Suppressed", img: "icons/svg/anchor.svg", icon: "icons/svg/anchor.svg", tams: true },
    { id: "blinded", name: "TAMS.Status.Blinded", img: "icons/svg/blind.svg", icon: "icons/svg/blind.svg", tams: true },
    { id: "deafened", name: "TAMS.Status.Deafened", img: "icons/svg/deaf.svg", icon: "icons/svg/deaf.svg", tams: true },
    // Category 2 — Ongoing Damage (severity tiers)
    { id: "on-fire", name: "TAMS.Status.OnFire", img: "icons/svg/fire.svg", icon: "icons/svg/fire.svg", tams: true },
    { id: "engulfed", name: "TAMS.Status.Engulfed", img: "icons/svg/fire.svg", icon: "icons/svg/fire.svg", tams: true },
    { id: "poisoned", name: "TAMS.Status.Poisoned", img: "icons/svg/poison.svg", icon: "icons/svg/poison.svg", tams: true },
    { id: "severely-poisoned", name: "TAMS.Status.SeverelyPoisoned", img: "icons/svg/poison.svg", icon: "icons/svg/poison.svg", tams: true },
    { id: "irradiated", name: "TAMS.Status.Irradiated", img: "icons/svg/skull.svg", icon: "icons/svg/skull.svg", tams: true },
    { id: "severely-irradiated", name: "TAMS.Status.SeverelyIrradiated", img: "icons/svg/skull.svg", icon: "icons/svg/skull.svg", tams: true },
    { id: "acid-burn", name: "TAMS.Status.AcidBurn", img: "icons/svg/blood.svg", icon: "icons/svg/blood.svg", tams: true },
    { id: "severe-acid-burn", name: "TAMS.Status.SevereAcidBurn", img: "icons/svg/blood.svg", icon: "icons/svg/blood.svg", tams: true },
    // Category 3 — Morale / Mental
    { id: "fleeing", name: "TAMS.Status.Fleeing", img: "icons/svg/falling.svg", icon: "icons/svg/falling.svg", tams: true },
    { id: "frozen", name: "TAMS.Status.Frozen", img: "icons/svg/frozen.svg", icon: "icons/svg/frozen.svg", tams: true },
    { id: "charmed", name: "TAMS.Status.Charmed", img: "icons/svg/sleep.svg", icon: "icons/svg/sleep.svg", tams: true },
    { id: "confused", name: "TAMS.Status.Confused", img: "icons/svg/daze.svg", icon: "icons/svg/daze.svg", tams: true },
    // Category 4 — Limb-Specific
    { id: "broken-arm", name: "TAMS.Status.BrokenArm", img: "icons/svg/blood.svg", icon: "icons/svg/blood.svg", tams: true },
    { id: "broken-leg", name: "TAMS.Status.BrokenLeg", img: "icons/svg/blood.svg", icon: "icons/svg/blood.svg", tams: true }
  ];
  for (const effect of tamsStatusEffects) {
    if (Array.isArray(CONFIG.statusEffects) && !CONFIG.statusEffects.some((e2) => e2.id === effect.id)) {
      CONFIG.statusEffects.push(effect);
    }
  }
  const tamsSyncEncumbrance = (actor) => {
    var _a2, _b2, _c2, _d2;
    if (!actor || actor.type !== "character") return;
    if (!actor.isOwner) return;
    if (typeof actor.toggleStatusEffect !== "function") return;
    const encumbered = !!((_b2 = (_a2 = actor.system) == null ? void 0 : _a2.inventory) == null ? void 0 : _b2.isEncumbered);
    const hasStatus = ((_d2 = (_c2 = actor.statuses) == null ? void 0 : _c2.has) == null ? void 0 : _d2.call(_c2, "encumbered")) ?? false;
    if (encumbered !== hasStatus) {
      actor.toggleStatusEffect("encumbered", { active: encumbered });
    }
  };
  Hooks.on("updateActor", (actor) => tamsSyncEncumbrance(actor));
  Hooks.on("createItem", (item) => {
    if (item.parent) tamsSyncEncumbrance(item.parent);
  });
  Hooks.on("updateItem", (item) => {
    if (item.parent) tamsSyncEncumbrance(item.parent);
  });
  Hooks.on("deleteItem", (item) => {
    var _a2, _b2;
    if (!item.parent) return;
    tamsSyncEncumbrance(item.parent);
    if (item.type !== "armor") return;
    const actor = item.parent;
    const limbKeys = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
    const updates = {};
    for (const key of limbKeys) {
      if (((_b2 = (_a2 = actor.system.limbs) == null ? void 0 : _a2[key]) == null ? void 0 : _b2.equippedArmorId) === item.id) {
        updates[`system.limbs.${key}.equippedArmorId`] = "";
        updates[`system.limbs.${key}.armor`] = 0;
        updates[`system.limbs.${key}.armorMax`] = 0;
      }
    }
    if (Object.keys(updates).length > 0) actor.update(updates);
  });
  Hooks.once("ready", () => {
    for (const actor of game.actors) tamsSyncEncumbrance(actor);
  });
});
Hooks.on("updateCombat", async (combat, changed) => {
  if (!game.user.isGM) return;
  if (!("turn" in changed)) return;
  const combatant = combat.combatant;
  if (!(combatant == null ? void 0 : combatant.actor)) return;
  await tamsOnTurnStart(combatant.actor);
});
Hooks.on("deleteCombat", async (combat) => {
  if (!game.user.isGM) return;
  await tamsOnCombatEnd(combat);
});
//# sourceMappingURL=tams.js.map
