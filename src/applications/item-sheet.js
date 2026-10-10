import { getAbilityIssues } from '../utils/ability-validation.js';
import { PROFESSION_TYPES, PROFESSION_MAX_RANK, PROFESSION_RANK_STEP } from '../utils/profession.js';
import { MAGIC_ITEM_TYPES, REQUIREMENT_TYPES, curseVisible } from '../utils/magic-items.js';

const LIMB_KEYS = ['head', 'thorax', 'stomach', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
const LIMB_I18N = {
  head: 'TAMS.HitLocations.Head', thorax: 'TAMS.HitLocations.Thorax',
  stomach: 'TAMS.HitLocations.Stomach', leftArm: 'TAMS.HitLocations.LeftArm',
  rightArm: 'TAMS.HitLocations.RightArm', leftLeg: 'TAMS.HitLocations.LeftLeg',
  rightLeg: 'TAMS.HitLocations.RightLeg'
};
const LIMB_ABBREV = {
  head: 'TAMS.Race.LimbAbbrev.Head', thorax: 'TAMS.Race.LimbAbbrev.Thorax',
  stomach: 'TAMS.Race.LimbAbbrev.Stomach', leftArm: 'TAMS.Race.LimbAbbrev.LeftArm',
  rightArm: 'TAMS.Race.LimbAbbrev.RightArm', leftLeg: 'TAMS.Race.LimbAbbrev.LeftLeg',
  rightLeg: 'TAMS.Race.LimbAbbrev.RightLeg'
};

/** Blank entry for each magic-effect list (see magicFields in src/models/item.js). */
const MAGIC_LIST_DEFAULTS = {
  modifiers: () => ({ target: "stats.strength.value", value: 0, curse: false }),
  resistances: () => ({ damageType: "", category: "resistance", value: 0, limbs: [], curse: false }),
  onHitStatusIds: () => "",
  bonusDamage: () => ({ damageType: "", amount: 0 }),
  requirements: () => ({ type: "stat", key: "strength", value: 0 }),
};

/**
 * The TAMS Item Sheet Application.
 * Extends ItemSheetV2 class.
 */
export class TAMSItemSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2) {
  /** @override */
  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
      tag: "form",
      classes: ["tams", "sheet", "item"],
      position: { width: 560, height: 750 },
      window: { resizable: true, scrollable: [".sheet-body"] },
      form: { submitOnChange: true, closeOnSubmit: false },
      actions: {
        editImage: TAMSItemSheet.prototype._onEditImage,
        modifierCreate: TAMSItemSheet.prototype._onModifierCreate,
        modifierDelete: TAMSItemSheet.prototype._onModifierDelete,
        passiveTraitCreate: TAMSItemSheet.prototype._onPassiveTraitCreate,
        passiveTraitDelete: TAMSItemSheet.prototype._onPassiveTraitDelete,
        grantedAbilityDelete: TAMSItemSheet.prototype._onGrantedAbilityDelete,
        raceResistanceCreate: TAMSItemSheet.prototype._onRaceResistanceCreate,
        raceResistanceDelete: TAMSItemSheet.prototype._onRaceResistanceDelete,
        raceResistanceLimbToggle: TAMSItemSheet.prototype._onRaceResistanceLimbToggle,
        damageComponentCreate: TAMSItemSheet.prototype._onDamageComponentCreate,
        damageComponentDelete: TAMSItemSheet.prototype._onDamageComponentDelete,
        updateDamageComponent: TAMSItemSheet.prototype._onUpdateDamageComponent,
        tagToggle: TAMSItemSheet.prototype._onTagToggle,
        toggleSection: TAMSItemSheet.prototype._onToggleSection,
        magicAdd: TAMSItemSheet.prototype._onMagicAdd,
        magicDelete: TAMSItemSheet.prototype._onMagicDelete,
        magicLimbToggle: TAMSItemSheet.prototype._onMagicLimbToggle
      }
    }, { inplace: false });
  }

  /** @override */
  get title() {
    return this.document.displayName ?? this.document.name;
  }

  static PARTS = {
    form: {
      template: "systems/tams/templates/item-sheet.html"
    }
  };

  /** @override */
  async _prepareContext(options) {
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
    context.gridSizeOptions = {
        "1x1": "TAMS.GridSizeOptions.1x1",
        "1x2": "TAMS.GridSizeOptions.1x2",
        "1x3": "TAMS.GridSizeOptions.1x3",
        "1x4": "TAMS.GridSizeOptions.1x4",
        "2x2": "TAMS.GridSizeOptions.2x2",
        "2x3": "TAMS.GridSizeOptions.2x3",
        "2x4": "TAMS.GridSizeOptions.2x4",
        "3x3": "TAMS.GridSizeOptions.3x3",
        "L": "TAMS.GridSizeOptions.L",
        "T": "TAMS.GridSizeOptions.T",
    };
    
    const locationOptions = {
        "stowed": "TAMS.LocationOptions.Stowed",
        "backpack": "TAMS.LocationOptions.Backpack",
        "hand": "TAMS.LocationOptions.Hand"
    };
    if (this.document.actor) {
        const backpacks = this.document.actor.items.filter(i => i.type === "backpack");
        for (const bp of backpacks) {
            locationOptions[bp.id] = game.i18n.format("TAMS.LocationOptions.InContainer", {name: bp.name});
        }
    }
    context.locationOptions = locationOptions;
    
    context.damageTypeOptions = {
      "":          "TAMS.DamageType.None",
      "blunt":     "TAMS.DamageType.blunt",
      "piercing":  "TAMS.DamageType.piercing",
      "slashing":  "TAMS.DamageType.slashing",
      "fire":      "TAMS.DamageType.fire",
      "lightning": "TAMS.DamageType.lightning",
      "cold":      "TAMS.DamageType.cold",
      "poison":    "TAMS.DamageType.poison",
      "sonic":     "TAMS.DamageType.sonic",
      "acid":      "TAMS.DamageType.acid",
      "magic":     "TAMS.DamageType.magic",
      "psychic":   "TAMS.DamageType.psychic",
      "divine":    "TAMS.DamageType.divine",
      "positive":  "TAMS.DamageType.positive",
      "negative":  "TAMS.DamageType.negative",
      "necrotic":  "TAMS.DamageType.necrotic",
      "radiant":   "TAMS.DamageType.radiant",
      "force":     "TAMS.DamageType.force",
      "thunder":   "TAMS.DamageType.thunder"
    };

    context.passiveRollTypeOptions = {
      "all":     "TAMS.PassiveRollType.All",
      "weapon":  "TAMS.PassiveRollType.Weapon",
      "skill":   "TAMS.PassiveRollType.Skill",
      "ability": "TAMS.PassiveRollType.Ability"
    };

    context.creatureSizeOptions = {
      "tiny":   "TAMS.CreatureSizeOptions.Tiny",
      "small":  "TAMS.CreatureSizeOptions.Small",
      "normal": "TAMS.CreatureSizeOptions.Normal",
      "large":  "TAMS.CreatureSizeOptions.Large",
      "huge":   "TAMS.CreatureSizeOptions.Huge",
      "giant":  "TAMS.CreatureSizeOptions.Giant"
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

    if (this.document.type === 'trait') {
        context.professionTypeOptions = Object.fromEntries(
          PROFESSION_TYPES.map(t => [t, `TAMS.ProfessionType.${t}`]));
        // The All Profession Rolls modifier doubles as the profession rank (1:1, +5 per rank).
        context.professionRankOptions = [
          { value: 0, label: "—" },
          ...Array.from({ length: PROFESSION_MAX_RANK }, (_, i) => {
            const rank = i + 1;
            return { value: rank * PROFESSION_RANK_STEP,
                     label: game.i18n.format("TAMS.ProfessionRankOption", {
                       rank, name: game.i18n.localize(`TAMS.ProfessionRank.${rank}`), bonus: rank * PROFESSION_RANK_STEP }) };
          })
        ];
        // Keep any off-step legacy value selectable so a save doesn't silently zero it.
        for (const m of this.document.system.modifiers ?? []) {
          if (m.target !== "allProfessionRolls") continue;
          if (!context.professionRankOptions.some(o => o.value === m.value))
            context.professionRankOptions.push({ value: m.value, label: `+${m.value}` });
        }
    }

    if (this.document.type === 'weapon') {
        const tags = ["accurate", "reliable", "unreliable", "vicious", "brutal", "balanced", "compact", "reach", "silent"];
        const activeTags = (this.document.system.tags || "").split(",").map(t => t.trim().toLowerCase());
        context.weaponTags = tags.map(t => {
            const cap = t.charAt(0).toUpperCase() + t.slice(1);
            return {
                id: t,
                label: game.i18n.localize(`TAMS.WeaponTags.${cap}`),
                hint: game.i18n.localize(`TAMS.WeaponTags.${cap}Hint`),
                active: activeTags.includes(t)
            };
        });
        const EARLY_TYPES = new Set(["matchlock", "flintlock", "wheellock", "blunderbuss"]);
        context.isEarlyFirearm = EARLY_TYPES.has(this.document.system.firearmType);
        context.isModernFirearm = !!this.document.system.firearmType && !context.isEarlyFirearm;

        context.enrichedDamageComponents = (this.document.system.damageComponents || []).map((c, index) => ({...c, index}));
    }

    if (this.document.type === 'race') {
        context.enrichedResistances = (this.document.system.resistances || []).map((res, index) => {
            const active = new Set(res.limbs ?? []);
            return {
                ...res, index,
                isGlobal: active.size === 0,
                limbButtons: LIMB_KEYS.map(key => ({
                    key, active: active.has(key),
                    i18nKey: LIMB_I18N[key],
                    abbrevKey: LIMB_ABBREV[key]
                }))
            };
        });
    }

    if (MAGIC_ITEM_TYPES.includes(this.document.type)) this._prepareMagicContext(context);

    context.rechargeTypeOptions = {
      "combat": "TAMS.Ability.RechargeOnCombat",
      "rest": "TAMS.Ability.RechargeOnRest",
      "never": "TAMS.Ability.RechargeNever"
    };

    if (this.document.type === 'ability') {
        const calculator = this.document.system.calculator || {};
        const selectedTargetingMode = calculator.targetingMode
            || (calculator.targetLimb !== "none" ? "specific" : (calculator.bodyPart !== "none" ? "group" : "normal"));

        const resources = { "stamina": "TAMS.Stamina" };
        if (this.document.actor) {
            this.document.actor.system.customResources.forEach((res, index) => {
                resources[index.toString()] = res.name;
            });
        }
        context.resourceOptions = resources;
        context.abilityIssues = getAbilityIssues(this.document.system, {
          onActor: !!this.document.actor,
          customResources: this.document.actor?.system.customResources ?? [],
          statusIds: (CONFIG.statusEffects ?? []).map(se => se.id)
        }).map(iss => ({ ...iss, text: game.i18n.localize(`TAMS.AbilityIssues.${iss.key}`) }));
        context.selectedTargetingMode = selectedTargetingMode;
        context.enrichedDamageComponents = (this.document.system.damageComponents || []).map((c, index) => ({...c, index}));

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
    for (const se of (CONFIG.statusEffects ?? [])) {
      if (!se.tams) continue;
      sePresets[se.id] = se.name ?? se.label ?? se.id;
    }
    const currentStatusId = this.document.system.inflictsStatusId ?? '';
    const isKnownPreset = currentStatusId === '' || !!sePresets[currentStatusId];
    context.statusEffectOptions = {
      '': 'TAMS.None',
      ...sePresets,
      'custom': 'TAMS.StatusEffect.Custom'
    };
    context.inflictsStatusPresetValue = isKnownPreset ? currentStatusId : 'custom';
    context.inflictsStatusIsCustom = !isKnownPreset && currentStatusId !== '';

    const SAVE_STAT_KEYS = new Set(["strength", "dexterity", "endurance", "wisdom", "intelligence", "bravery"]);
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

    if (this.document.type === 'ability') {
      const sys = this.document.system;
      if (this._sectionOpen === undefined) {
        this._sectionOpen = {
          uses: (sys.uses?.max > 0),
          conditionalCost: !!(sys.ifStatement),
          sizeGrants: !!(sys.sizeGrantHP || sys.sizeGrantStealth || sys.sizeGrantCombat)
        };
      }
      context.sectionOpen = this._sectionOpen;
    }

    return context;
  }

  /** @override */
  async _preRender(context, options) {
    await super._preRender(context, options);
    this._savedScrollPositions = {};
    for (const el of this.element?.querySelectorAll('[data-scroll-id]') ?? []) {
      this._savedScrollPositions[el.dataset.scrollId] = el.scrollTop;
    }
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    if (this._savedScrollPositions) {
      for (const el of this.element.querySelectorAll('[data-scroll-id]')) {
        const saved = this._savedScrollPositions[el.dataset.scrollId];
        if (saved !== undefined) el.scrollTop = saved;
      }
      this._savedScrollPositions = null;
    }
    this.element.querySelectorAll('.inflicts-status-preset').forEach(select => {
      select.addEventListener('change', event => {
        const value = event.target.value;
        const picker = event.target.closest('.status-effect-picker');
        const customInput = picker?.querySelector('.inflicts-status-custom');
        if (!customInput) return;
        if (value === 'custom') {
          customInput.style.display = '';
          customInput.focus();
        } else {
          customInput.style.display = 'none';
          customInput.value = value;
          this.document.update({ 'system.inflictsStatusId': value });
        }
      });
    });

    // Damage component fields (type/amount) — handled explicitly rather than via the
    // generic submitOnChange form pipeline (see _onUpdateDamageComponent).
    this.element.querySelectorAll('[data-action="updateDamageComponent"]').forEach(el => {
      el.addEventListener('change', async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        await this._onUpdateDamageComponent(ev, ev.currentTarget);
      });
    });

    this.element.querySelectorAll('[data-magic-list]').forEach(el => {
      el.addEventListener('change', async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const t = ev.currentTarget;
        t.dataset.list = t.dataset.magicList;
        await this._onUpdateMagicEntry(ev, t);
      });
    });

    this.element.querySelector('.magic-section-toggle')?.addEventListener('toggle', ev => {
      this._magicOpen = ev.currentTarget.open;
    });

    this.element.querySelectorAll('.save-against-preset').forEach(select => {
      select.addEventListener('change', event => {
        const value = event.target.value;
        const picker = event.target.closest('.save-against-picker');
        const customInput = picker?.querySelector('.save-against-custom');
        if (!customInput) return;
        if (value === 'custom') {
          customInput.style.display = '';
          customInput.focus();
        } else {
          customInput.style.display = 'none';
          customInput.value = value;
          this.document.update({ 'system.saveAgainst': value });
        }
      });
    });
  }

  /** @override */
  async _onDrop(event) {
    const isMagic = MAGIC_ITEM_TYPES.includes(this.document.type);
    if (this.document.type !== 'race' && !isMagic) return;
    if (isMagic && !game.user.isGM) return;
    const data = TextEditor.getDragEventData(event);
    if (data.type !== 'Item') return;

    let item;
    try { item = await Item.fromDropData(data); } catch(e) { return; }
    if (!item || item.type !== 'ability') {
      return ui.notifications.warn(game.i18n.localize("TAMS.Race.GrantedAbilityOnly"));
    }

    const abilityData = item.toObject();
    if (isMagic) {
      const granted = foundry.utils.duplicate(this.document.system.magic?.grantedAbilities ?? []);
      granted.push(abilityData);
      return this.document.update({ 'system.magic.grantedAbilities': granted });
    }
    const abilities = foundry.utils.duplicate(this.document.system.grantedAbilities || []);
    abilities.push(abilityData);
    await this.document.update({ 'system.grantedAbilities': abilities });
  }

  /**
   * Build the context for the Magic Effects section. Only the GM can edit it; players see it
   * read-only, without curse-flagged entries until the curse is revealed, and not at all while
   * the item is unidentified.
   * @param {object} context
   * @protected
   */
  _prepareMagicContext(context) {
    const magic = this.document.system.magic ?? {};
    const isGM = game.user.isGM;
    const showCurse = curseVisible(magic, isGM);
    const visible = (entry) => showCurse || !entry.curse;
    const indexed = (list) => (list ?? []).map((entry, index) => ({ entry, index }));

    context.isMagicType = true;
    context.isGM = isGM;
    context.magicEditable = isGM && this.isEditable;
    context.showMagicIdentity = this.document.isIdentityVisible;
    context.showCurse = showCurse;
    context.magicDisabled = context.magicEditable ? "" : "disabled";
    context.displayName = this.document.displayName;
    context.publicDescription = this.document.publicDescription;
    context.magicSectionOpen = this._magicOpen ?? (isGM || false);

    context.magicModifiers = indexed(magic.modifiers).filter(({ entry }) => visible(entry))
      .map(({ entry, index }) => ({ ...entry, index }));
    context.magicResistances = indexed(magic.resistances).filter(({ entry }) => visible(entry))
      .map(({ entry, index }) => {
        const active = new Set(entry.limbs ?? []);
        return {
          ...entry, index,
          isGlobal: active.size === 0,
          limbButtons: LIMB_KEYS.map(key => ({
            key, active: active.has(key), i18nKey: LIMB_I18N[key], abbrevKey: LIMB_ABBREV[key]
          }))
        };
      });
    context.magicStatuses = indexed(magic.onHitStatusIds).map(({ entry, index }) => ({ id: entry, index }));
    context.magicBonusDamage = indexed(magic.bonusDamage).map(({ entry, index }) => ({ ...entry, index }));
    context.magicRequirements = indexed(magic.requirements).map(({ entry, index }) => ({
      ...entry, index,
      isStat: entry.type === "stat",
      hasValue: entry.type === "stat" || entry.type === "profession"
    }));
    context.magicGrantedAbilities = (magic.grantedAbilities ?? []).map((a, index) => ({
      name: a.name, img: a.img, cost: a.system?.cost, index
    }));
    context.magicModifierTargetOptions = {
      ...context.modifierTargetOptions,
      itemAttacks: "TAMS.Magic.ItemAttacks"
    };
    context.requirementTypeOptions = Object.fromEntries(
      REQUIREMENT_TYPES.map(t => [t, `TAMS.Magic.RequirementType.${t}`]));
    context.statusIdOptions = (CONFIG.statusEffects ?? []).filter(se => se.tams)
      .map(se => ({ id: se.id, label: game.i18n.localize(se.name ?? se.label ?? se.id) }));

    // Unequippable types (ammo) ignore "requires equipped".
    context.magicCanRequireEquip = this.document.type !== "ammo";
    context.magicStatusApplies = ["weapon", "ammo"].includes(this.document.type);
  }

  /**
   * Add a blank entry to one of the magic-effect lists.
   * @param {Event} event
   * @param {HTMLElement} target Carries data-list.
   * @protected
   */
  async _onMagicAdd(event, target) {
    const list = target.dataset.list;
    if (!MAGIC_LIST_DEFAULTS[list] || !game.user.isGM) return;
    const entries = foundry.utils.duplicate(this.document.system.magic?.[list] ?? []);
    entries.push(MAGIC_LIST_DEFAULTS[list]());
    await this.document.update({ [`system.magic.${list}`]: entries });
  }

  /**
   * Remove one entry from a magic-effect list (incl. grantedAbilities).
   * @param {Event} event
   * @param {HTMLElement} target Carries data-list and data-index.
   * @protected
   */
  async _onMagicDelete(event, target) {
    const list = target.dataset.list;
    const index = parseInt(target.dataset.index ?? target.closest("[data-index]")?.dataset.index);
    if (!game.user.isGM || Number.isNaN(index)) return;
    const entries = foundry.utils.duplicate(this.document.system.magic?.[list] ?? []);
    if (index < 0 || index >= entries.length) return;
    entries.splice(index, 1);
    await this.document.update({ [`system.magic.${list}`]: entries });
  }

  /**
   * Toggle a limb on a magic resistance's limb scope.
   * @param {Event} event
   * @param {HTMLElement} target Carries data-limb-key; row carries data-index.
   * @protected
   */
  async _onMagicLimbToggle(event, target) {
    if (!game.user.isGM) return;
    const index = parseInt(target.closest("[data-index]").dataset.index);
    const limbKey = target.dataset.limbKey;
    const entries = foundry.utils.duplicate(this.document.system.magic?.resistances ?? []);
    const entry = entries[index];
    if (!entry) return;
    const limbs = new Set(entry.limbs ?? []);
    if (limbs.has(limbKey)) limbs.delete(limbKey); else limbs.add(limbKey);
    entry.limbs = [...limbs];
    await this.document.update({ "system.magic.resistances": entries });
  }

  /**
   * Persist an edit to one field of one magic-effect list entry. Same reason as
   * _onUpdateDamageComponent: array-of-schema fields don't survive the generic form submit.
   * @param {Event} event
   * @param {HTMLElement} target Carries data-list, data-index and data-field ("" for string lists).
   * @protected
   */
  async _onUpdateMagicEntry(event, target) {
    if (!game.user.isGM) return;
    const list = target.dataset.list;
    const index = parseInt(target.dataset.index);
    const field = target.dataset.field;
    if (!MAGIC_LIST_DEFAULTS[list] || Number.isNaN(index)) return;
    const entries = foundry.utils.duplicate(this.document.system.magic?.[list] ?? []);
    if (index < 0 || index >= entries.length) return;
    const value = target.type === "checkbox" ? target.checked
      : target.type === "number" ? (parseFloat(target.value) || 0)
      : target.value;
    if (field) {
      entries[index][field] = value;
      // A new requirement type wants a fresh key (a stat key vs. a name).
      if (list === "requirements" && field === "type") entries[index].key = value === "stat" ? "strength" : "";
    } else {
      entries[index] = value;
    }
    await this.document.update({ [`system.magic.${list}`]: entries });
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
      current: current,
      callback: path => {
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
    const index = parseInt(target.dataset.index ?? target.closest(".granted-ability-row")?.dataset.index);
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
    const limbs = [...(entry.limbs ?? [])];
    const pos = limbs.indexOf(limbKey);
    if (pos === -1) limbs.push(limbKey);
    else limbs.splice(pos, 1);
    resistances[index] = {...entry, limbs};
    await this.document.update({ "system.resistances": resistances });
  }

  async _onDamageComponentCreate(event, target) {
    const components = foundry.utils.duplicate(this.document.system.damageComponents || []);
    components.push({ damageType: "", amount: 0 });
    await this.document.update({ "system.damageComponents": components });
  }

  async _onDamageComponentDelete(event, target) {
    const index = parseInt(target.closest("[data-index]").dataset.index);
    const components = foundry.utils.duplicate(this.document.system.damageComponents || []);
    components.splice(index, 1);
    await this.document.update({ "system.damageComponents": components });
  }

  /**
   * Persist an edit to one field of one damage component.
   * Bypasses the generic submitOnChange form pipeline since system.damageComponents
   * is an ArrayField of SchemaFields — dotted array-index names into it don't reliably
   * survive the generic form submit (same class of issue as currency's ObjectField keys).
   * @param {Event} event The originating change event.
   * @param {HTMLElement} target The select/input element that changed.
   * @protected
   */
  async _onUpdateDamageComponent(event, target) {
    const index = parseInt(target.closest("[data-index]").dataset.index);
    const field = target.dataset.field;
    if (!field || Number.isNaN(index)) return;
    const components = foundry.utils.duplicate(this.document.system.damageComponents || []);
    if (!components[index]) return;
    components[index][field] = target.type === "number" ? (parseFloat(target.value) || 0) : target.value;
    await this.document.update({ "system.damageComponents": components });
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
    let tagsArray = currentTags ? currentTags.split(",").map(t => t.trim().toLowerCase()) : [];
    
    if (tagsArray.includes(tag.toLowerCase())) {
        tagsArray = tagsArray.filter(t => t.toLowerCase() !== tag.toLowerCase());
    } else {
        tagsArray.push(tag.toLowerCase());
    }
    
    await this.document.update({ "system.tags": tagsArray.filter(t => t).join(", ") });
  }

  /**
   * Handle toggling a collapsible ability section.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  _onToggleSection(event, target) {
    if (!this._sectionOpen) this._sectionOpen = {};
    const section = target.closest("[data-section]")?.dataset.section ?? target.dataset.section;
    this._sectionOpen[section] = !this._sectionOpen[section];
    this.render();
  }

  /** @override */
  _prepareSubmitData(event, form, formData) {
    const data = super._prepareSubmitData(event, form, formData);

    if (this.document.type !== "ability") return data;

    const mode = foundry.utils.getProperty(data, "system.calculator.targetingMode")
      ?? this.document.system.calculator?.targetingMode
      ?? "normal";

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
}

