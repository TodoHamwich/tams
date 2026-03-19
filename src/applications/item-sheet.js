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
      position: { width: 500, height: 700 },
      window: { resizable: true, scrollable: [".sheet-body"] },
      form: { submitOnChange: true, closeOnSubmit: false },
      actions: {
        editImage: TAMSItemSheet.prototype._onEditImage,
        modifierCreate: TAMSItemSheet.prototype._onModifierCreate,
        modifierDelete: TAMSItemSheet.prototype._onModifierDelete,
        tagToggle: TAMSItemSheet.prototype._onTagToggle
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
        "backpack": "TAMS.LocationOptions.BackpackLegacy",
        "hand": "TAMS.LocationOptions.Hand"
    };
    if (this.document.actor) {
        const backpacks = this.document.actor.items.filter(i => i.type === "backpack");
        for (const bp of backpacks) {
            locationOptions[bp.id] = game.i18n.format("TAMS.LocationOptions.InContainer", {name: bp.name});
        }
    }
    context.locationOptions = locationOptions;
    
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

    if (this.document.type === 'ability') {
        const resources = { "stamina": "Stamina" };
        if (this.document.actor) {
            this.document.actor.system.customResources.forEach((res, index) => {
                resources[index.toString()] = res.name;
            });
        }
        context.resourceOptions = resources;

        context.calculatorOptions = {
            bodyParts: {
                "none": "TAMS.CalculatorOptions.None",
                "head": "TAMS.CalculatorOptions.Head",
                "thorax": "TAMS.CalculatorOptions.ThoraxStomach",
                "stomach": "TAMS.CalculatorOptions.ThoraxStomach",
                "arms": "TAMS.CalculatorOptions.ArmsLegs",
                "legs": "TAMS.CalculatorOptions.ArmsLegs"
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
    return context;
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
}

