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
        tagToggle: TAMSItemSheet.prototype._onTagToggle,
        toggleSection: TAMSItemSheet.prototype._onToggleSection
      }
    }, { inplace: false });
  }

  /** @override */
  get title() {
    return this.document.name;
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

    if (this.document.type === 'weapon') {
        const tags = ["accurate", "reliable", "unreliable", "vicious", "brutal", "balanced", "compact", "reach", "silent"];
        const activeTags = (this.document.system.tags || "").split(",").map(t => t.trim().toLowerCase());
        context.weaponTags = tags.map(t => ({
            id: t,
            label: game.i18n.localize(`TAMS.WeaponTags.${t.charAt(0).toUpperCase() + t.slice(1)}`),
            active: activeTags.includes(t)
        }));
    }

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
    if (this.document.type !== 'race') return;
    const data = TextEditor.getDragEventData(event);
    if (data.type !== 'Item') return;

    let item;
    try { item = await Item.fromDropData(data); } catch(e) { return; }
    if (!item || item.type !== 'ability') {
      return ui.notifications.warn(game.i18n.localize("TAMS.Race.GrantedAbilityOnly"));
    }

    const abilityData = item.toObject();
    const abilities = foundry.utils.duplicate(this.document.system.grantedAbilities || []);
    abilities.push(abilityData);
    await this.document.update({ 'system.grantedAbilities': abilities });
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

