/**
 * Data Models
 */
class StatModifier extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      value: new fields.NumberField({initial: 10, integer: true}),
      mod: new fields.NumberField({initial: 0, integer: true}),
      label: new fields.StringField()
    };
  }

  get total() {
    return this.value + (this.mod || 0);
  }
}

class TAMSCharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      stats: new fields.SchemaField({
        strength: new fields.EmbeddedDataField(StatModifier, {initial: {label: "TAMS.StatStrength"}}),
        dexterity: new fields.EmbeddedDataField(StatModifier, {initial: {label: "TAMS.StatDexterity"}}),
        endurance: new fields.EmbeddedDataField(StatModifier, {initial: {label: "TAMS.StatEndurance"}}),
        wisdom: new fields.EmbeddedDataField(StatModifier, {initial: {label: "TAMS.StatWisdom"}}),
        intelligence: new fields.EmbeddedDataField(StatModifier, {initial: {label: "TAMS.StatIntelligence"}}),
        bravery: new fields.EmbeddedDataField(StatModifier, {initial: {label: "TAMS.StatBravery"}})
      }),
      limbs: new fields.SchemaField({
        head: new fields.SchemaField({ value: new fields.NumberField({initial: 5}), max: new fields.NumberField({initial: 5}), mult: new fields.NumberField({initial: 0.5}), armor: new fields.NumberField({initial: 0, min: 0, max: 40}), armorMax: new fields.NumberField({initial: 0, min: 0, max: 40}), label: new fields.StringField({initial: "Head"}), injured: new fields.BooleanField({initial: false}), criticallyInjured: new fields.BooleanField({initial: false}) }),
        thorax: new fields.SchemaField({ value: new fields.NumberField({initial: 10}), max: new fields.NumberField({initial: 10}), mult: new fields.NumberField({initial: 1.0}), armor: new fields.NumberField({initial: 0, min: 0, max: 40}), armorMax: new fields.NumberField({initial: 0, min: 0, max: 40}), label: new fields.StringField({initial: "Thorax"}), injured: new fields.BooleanField({initial: false}), criticallyInjured: new fields.BooleanField({initial: false}) }),
        stomach: new fields.SchemaField({ value: new fields.NumberField({initial: 7}), max: new fields.NumberField({initial: 7}), mult: new fields.NumberField({initial: 0.75}), armor: new fields.NumberField({initial: 0, min: 0, max: 40}), armorMax: new fields.NumberField({initial: 0, min: 0, max: 40}), label: new fields.StringField({initial: "Stomach"}), injured: new fields.BooleanField({initial: false}), criticallyInjured: new fields.BooleanField({initial: false}) }),
        leftArm: new fields.SchemaField({ value: new fields.NumberField({initial: 7}), max: new fields.NumberField({initial: 7}), mult: new fields.NumberField({initial: 0.75}), armor: new fields.NumberField({initial: 0, min: 0, max: 40}), armorMax: new fields.NumberField({initial: 0, min: 0, max: 40}), label: new fields.StringField({initial: "Left Arm"}), injured: new fields.BooleanField({initial: false}), criticallyInjured: new fields.BooleanField({initial: false}) }),
        rightArm: new fields.SchemaField({ value: new fields.NumberField({initial: 7}), max: new fields.NumberField({initial: 7}), mult: new fields.NumberField({initial: 0.75}), armor: new fields.NumberField({initial: 0, min: 0, max: 40}), armorMax: new fields.NumberField({initial: 0, min: 0, max: 40}), label: new fields.StringField({initial: "Right Arm"}), injured: new fields.BooleanField({initial: false}), criticallyInjured: new fields.BooleanField({initial: false}) }),
        leftLeg: new fields.SchemaField({ value: new fields.NumberField({initial: 7}), max: new fields.NumberField({initial: 7}), mult: new fields.NumberField({initial: 0.75}), armor: new fields.NumberField({initial: 0, min: 0, max: 40}), armorMax: new fields.NumberField({initial: 0, min: 0, max: 40}), label: new fields.StringField({initial: "Left Leg"}), injured: new fields.BooleanField({initial: false}), criticallyInjured: new fields.BooleanField({initial: false}) }),
        rightLeg: new fields.SchemaField({ value: new fields.NumberField({initial: 7}), max: new fields.NumberField({initial: 7}), mult: new fields.NumberField({initial: 0.75}), armor: new fields.NumberField({initial: 0, min: 0, max: 40}), armorMax: new fields.NumberField({initial: 0, min: 0, max: 40}), label: new fields.StringField({initial: "Right Leg"}), injured: new fields.BooleanField({initial: false}), criticallyInjured: new fields.BooleanField({initial: false}) })
      }),
      hp: new fields.SchemaField({
        value: new fields.NumberField({initial: 0}),
        max: new fields.NumberField({initial: 0})
      }),
      stamina: new fields.SchemaField({
        value: new fields.NumberField({initial: 10, min: 0}),
        max: new fields.NumberField({initial: 10, min: 0}),
        mult: new fields.NumberField({initial: 1.0}),
        color: new fields.StringField({initial: "#66bb6a"})
      }),
      customResources: new fields.ArrayField(new fields.SchemaField({
        name: new fields.StringField({initial: "New Resource"}),
        value: new fields.NumberField({initial: 0, min: 0}),
        max: new fields.NumberField({initial: 0, min: 0}),
        stat: new fields.StringField({initial: "endurance"}),
        mult: new fields.NumberField({initial: 1.0}),
        bonus: new fields.NumberField({initial: 0}),
        color: new fields.StringField({initial: "#3498db"})
      })),
      theme: new fields.StringField({initial: "default"}),
      physicalNotes: new fields.StringField({initial: ""}),
      traits: new fields.StringField({initial: ""}),
      description: new fields.HTMLField({initial: ""}),
      behindMult: new fields.NumberField({initial: 0.5, min: 0, step: 0.05}),
      settings: new fields.SchemaField({
        alternateArmour: new fields.BooleanField({initial: false})
      }),
      upgradePoints: new fields.SchemaField({
        stats: new fields.NumberField({initial: 0}),
        weapons: new fields.NumberField({initial: 0}),
        skills: new fields.NumberField({initial: 0}),
        abilities: new fields.NumberField({initial: 0})
      }),
      specialSkills: new fields.SchemaField({
        dodge: new fields.SchemaField({ value: new fields.NumberField({initial: 0}) }),
        retaliation: new fields.SchemaField({ value: new fields.NumberField({initial: 0}) }),
        perception: new fields.SchemaField({ value: new fields.NumberField({initial: 0}) })
      })
    };
  }

  prepareDerivedData() {
    const end = this.stats.endurance.total;
    let totalHp = 0;
    let totalMaxHp = 0;

    // 1) Recompute max
    for (const limb of Object.values(this.limbs)) {
      limb.max = Math.floor(end * limb.mult);
    }

    // 2) Use base manual armor (Inventory mechanics disabled for now)
    for (const [lk, limb] of Object.entries(this.limbs)) {
      limb.armor = this._source.limbs[lk]?.armor || 0;
      limb.armorMax = this._source.limbs[lk]?.armorMax || 0;
      limb.hasEquippedArmor = false;

      limb.armor = Math.clamp(limb.armor, 0, 40);
      limb.armorMax = Math.clamp(limb.armorMax, 0, 40);
      totalHp += limb.value;
      totalMaxHp += limb.max;
    }

    this.hp.value = totalHp;
    this.hp.max = totalMaxHp;
    this.stamina.max = Math.floor(end * this.stamina.mult);
    this.stamina.value = Math.clamp(this.stamina.value, 0, this.stamina.max);
    for ( let res of this.customResources ) {
      const stat = this.stats[res.stat];
      const statValue = stat ? stat.total : 0;
      res.max = Math.floor((statValue * res.mult) + res.bonus);
      res.value = Math.clamp(res.value, 0, res.max);
    }
  }
}

class TAMSWeaponData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      familiarity: new fields.NumberField({initial: 0, nullable: true}),
      equipped: new fields.BooleanField({initial: false}),
      isHeavy: new fields.BooleanField({initial: false}),
      isTwoHanded: new fields.BooleanField({initial: false}),
      isLight: new fields.BooleanField({initial: false}),
      isRanged: new fields.BooleanField({initial: false}),
      isThrown: new fields.BooleanField({initial: false}),
      rangedDamage: new fields.NumberField({initial: 0, nullable: true}),
      fireRate: new fields.StringField({initial: "1"}),
      fireRateCustom: new fields.NumberField({initial: 1, nullable: true}),
      special: new fields.StringField({initial: ""}),
      description: new fields.HTMLField({initial: ""})
    };
  }

  get calculatedDamage() {
    // If ranged, damage is player-set and not derived from stats
    if (this.isRanged) return Math.floor(this.rangedDamage || 0);
    const actor = this.parent?.actor;
    if ( !actor ) return 0;
    const str = actor.system.stats.strength.total;
    let mult = 0.5;
    if (this.isHeavy) mult += 0.25;
    if (this.isTwoHanded) mult += 0.25;
    return Math.floor(str * mult);
  }
}

class TAMSSkillData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      familiarity: new fields.NumberField({initial: 0, nullable: true}),
      upgradePoints: new fields.NumberField({initial: 0, nullable: true}),
      stat: new fields.StringField({initial: "strength"}),
      tags: new fields.StringField({initial: ""}),
      description: new fields.HTMLField({initial: ""})
    };
  }
}

class TAMSEquipmentData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      quantity: new fields.NumberField({initial: 1, integer: true, min: 0, nullable: true}),
      weight: new fields.NumberField({initial: 0, step: 0.1, min: 0, nullable: true}),
      carried: new fields.BooleanField({initial: true}),
      equipped: new fields.BooleanField({initial: false}),
      isArmor: new fields.BooleanField({initial: false}),
      armorValue: new fields.NumberField({initial: 0, integer: true, min: 0, nullable: true}),
      armorMax: new fields.NumberField({initial: 0, integer: true, min: 0, nullable: true}),
      limb: new fields.StringField({initial: "none"}),
      tags: new fields.StringField({initial: ""}),
      description: new fields.HTMLField({initial: ""})
    };
  }
}

class TAMSAbilityData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      familiarity: new fields.NumberField({initial: 0, nullable: true}),
      upgradePoints: new fields.NumberField({initial: 0, nullable: true}),
      bonus: new fields.NumberField({initial: 0, nullable: true}),
      cost: new fields.NumberField({initial: 0, nullable: true}),
      resource: new fields.StringField({initial: "stamina"}),
      isApex: new fields.BooleanField({initial: false}),
      isReaction: new fields.BooleanField({initial: false}),
      uses: new fields.SchemaField({
        value: new fields.NumberField({initial: 0}),
        max: new fields.NumberField({initial: 0})
      }),
      isAttack: new fields.BooleanField({initial: false}),
      damage: new fields.NumberField({initial: 0, nullable: true}),
      attackStat: new fields.StringField({initial: "strength"}),
      damageStat: new fields.StringField({initial: "strength"}),
      damageMult: new fields.NumberField({initial: 0.5, step: 0.05, nullable: true}),
      damageBonus: new fields.NumberField({initial: 0, nullable: true}),
      multiAttack: new fields.NumberField({initial: 1, nullable: true}),
      tags: new fields.StringField({initial: ""}),
      description: new fields.HTMLField({initial: ""}),
      calculator: new fields.SchemaField({
        enabled: new fields.BooleanField({initial: false}),
        isUtility: new fields.BooleanField({initial: false}),
        effects: new fields.NumberField({initial: 0, integer: true, nullable: true}),
        guaranteedMax: new fields.NumberField({initial: 0, integer: true, nullable: true}),
        detriments: new fields.NumberField({initial: 0, integer: true, nullable: true}),
        movementDoubleOwn: new fields.BooleanField({initial: false}),
        movementHalveEnemy: new fields.BooleanField({initial: false}),
        movementFlat: new fields.NumberField({initial: 0, integer: true, nullable: true}),
        rollBonus: new fields.NumberField({initial: 0, integer: true, nullable: true}),
        ignoreArmor: new fields.NumberField({initial: 0, integer: true, nullable: true}),
        bodyPart: new fields.StringField({initial: "none"}),
        fireRate: new fields.StringField({initial: "single"}),
        multiAttackHits: new fields.NumberField({initial: 0, integer: true, nullable: true}),
        damageStatFraction: new fields.NumberField({initial: 0, step: 0.25, nullable: true}),
        stun: new fields.StringField({initial: "none"}),
        healing: new fields.NumberField({initial: 0, integer: true, nullable: true}),
        drType: new fields.StringField({initial: "none"}),
        drValue: new fields.NumberField({initial: 0, integer: true, nullable: true}),
        bypassDodge: new fields.BooleanField({initial: false}),
        bypassRetaliation: new fields.BooleanField({initial: false}),
        targetType: new fields.StringField({initial: "single"}),
        aoeRadius: new fields.NumberField({initial: 0, integer: true, nullable: true}),
        range: new fields.NumberField({initial: 0, integer: true, nullable: true}),
        duration: new fields.StringField({initial: "instant"}),
        isStackable: new fields.BooleanField({initial: false})
      })
    };
  }

  get calculatedDamage() {
    if ( !this.isAttack ) return 0;
    const actor = this.parent?.actor;
    if ( !actor ) return 0;
    
    if (this.damageStat === "custom") {
      return (this.damage || 0) + (this.damageBonus || 0);
    }

    const damageStatValue = actor.system.stats[this.damageStat]?.total || 0;
    return Math.floor(damageStatValue * this.damageMult) + this.damageBonus + (this.damage || 0);
  }

  get calculatedCost() {
    const c = this.calculator;
    let cost = 0;

    // Part 1: Effects
    cost += (c.effects || 0) * 1;
    cost += (c.guaranteedMax || 0) * 2;
    cost -= (c.detriments || 0) * 1;
    // Detriments to a minimum of 1? The rule says "the cost is lowered by 1 (To a minimum of 1)". 
    // Usually this means the final cost can't be below 1.
    
    if (c.movementDoubleOwn) cost += 2;
    if (c.movementHalveEnemy) cost += 4;
    cost += (c.movementFlat || 0) * 2;

    cost += Math.floor((c.rollBonus || 0) / 5) * 1;
    cost += Math.floor((c.ignoreArmor || 0) / 5) * 1;

    if (c.bodyPart === "head") {
      cost += 2;
      cost *= 2;
    } else if (c.bodyPart === "thorax" || c.bodyPart === "stomach") {
      cost += 3;
    } else if (c.bodyPart === "arms" || c.bodyPart === "legs") {
      cost += 2;
    }

    if (c.fireRate === "burst") cost += 2;
    else if (c.fireRate === "auto") cost += 4;

    cost += (c.multiAttackHits || 0) * 2;

    if (c.damageStatFraction > 0) {
      cost += Math.floor(c.damageStatFraction / 0.25);
    }

    if (c.stun === "crit") cost += 1;
    else if (c.stun === "guaranteed") cost += 5;

    cost += Math.floor((c.healing || 0) / 5);

    if (c.drType === "flat" && c.drValue > 0) {
      let drCost = 2;
      let val = 5;
      while (val < c.drValue) {
        drCost *= 2;
        val += 5;
      }
      cost += drCost;
    } else if (c.drType === "specific" && c.drValue > 0) {
      let drCost = 0;
      let increment = 1;
      let val = 0;
      while (val < c.drValue) {
        drCost += increment;
        val += 5;
        increment++;
      }
      cost += drCost;
    }

    if (c.bypassDodge) cost *= 2;
    if (c.bypassRetaliation) cost *= 2;

    // Part 2: Targets
    if (c.isUtility && c.targetType === "multiple") {
      cost *= 1.5;
    } else if (c.targetType === "multiple") {
      cost *= 2;
    }

    if (c.aoeRadius >= 1) {
      cost += 2;
      if (c.aoeRadius > 3) cost += (c.aoeRadius - 3);
    }

    // Part 3: Range
    if (c.isUtility) {
      if (c.range >= 100 && c.range < 1000) cost += 1;
      else if (c.range >= 1000 && c.range < 10000) cost += 2;
      else if (c.range >= 10000) cost += 3;
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

    // Part 4: Duration
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

    return Math.max(1, Math.floor(cost));
  }

  prepareDerivedData() {
    if (this.calculator?.enabled) {
      this.cost = this.calculatedCost;
    }
  }
}

/**
 * Documents
 */
class TAMSActor extends Actor {}
class TAMSItem extends Item {}

/**
 * Sheets
 */
class TAMSActorSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
      tag: "form",
      classes: ["tams", "sheet", "actor"],
      position: { width: 600, height: 800 },
      window: { resizable: true },
      form: { submitOnChange: true, closeOnSubmit: false },
      actions: {
        itemCreate: TAMSActorSheet.prototype._onItemCreate,
        itemEdit: TAMSActorSheet.prototype._onItemEdit,
        itemDelete: TAMSActorSheet.prototype._onItemDelete,
        roll: TAMSActorSheet.prototype._onRoll,
        resourceAdd: TAMSActorSheet.prototype._onResourceAdd,
        resourceDelete: TAMSActorSheet.prototype._onResourceDelete,
        setTab: TAMSActorSheet.prototype._onSetTab,
        updateItemField: TAMSActorSheet.prototype._onUpdateItemField
      }
    }, { inplace: false });
  }

  /** @override */
  get title() {
    return this.document.name;
  }

  static PARTS = {
    form: {
      template: "systems/tams/templates/actor-sheet.html"
    }
  };

  _onRender(context, options) {
    super._onRender(context, options);
    const theme = this.document.system.theme || "default";
    this.element.classList.remove("theme-default", "theme-dark", "theme-parchment");
    this.element.classList.add(`theme-${theme}`);

    // Fix for inline item updates (Familiarity, fire rate, etc on the tab)
    this.element.querySelectorAll('input[data-action="updateItemField"], select[data-action="updateItemField"]').forEach(el => {
      el.addEventListener('change', async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        await this._onUpdateItemField(ev, ev.currentTarget);
      });
    });
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    
    // Manual tab management
    this._activeTab ??= "stats";
    
    // Add custom context
    context.actor = this.document;
    context.document = this.document;
    context.system = this.document.system;
    context.activeTab = this._activeTab;
    context.editable = this.isEditable;
    context.owner = this.document.isOwner;
    context.staminaPercentage = Math.clamp((this.document.system.stamina.value / (this.document.system.stamina.max || 1)) * 100, 0, 100);
    context.hpPercentage = Math.clamp((this.document.system.hp.value / (this.document.system.hp.max || 1)) * 100, 0, 100);
    
    // Calculate percentages for custom resources
    context.customResourceData = this.document.system.customResources.map(res => {
      return {
        ...res,
        percentage: Math.clamp((res.value / (res.max || 1)) * 100, 0, 100)
      };
    });

    context.statOptions = {
      "strength": "TAMS.StatStrength",
      "dexterity": "TAMS.StatDexterity",
      "endurance": "TAMS.StatEndurance",
      "wisdom": "TAMS.StatWisdom",
      "intelligence": "TAMS.StatIntelligence",
      "bravery": "TAMS.StatBravery",
      "custom": "Custom"
    };
    context.themeOptions = {
      "default": "Default",
      "dark": "Dark",
      "parchment": "Parchment"
    };
    context.limbOptions = {
      "none": "None",
      "head": "Head",
      "thorax": "Thorax",
      "stomach": "Stomach",
      "leftArm": "Left Arm",
      "rightArm": "Right Arm",
      "leftLeg": "Left Leg",
      "rightLeg": "Right Leg"
    };

    const weapons = [];
    const equippedWeapons = [];
    const skills = [];
    const abilities = [];
    const inventoryArmor = [];
    const inventoryMisc = [];
    const inventoryWeapons = [];

    let carryWeight = 0;

    for (let i of this.document.items) {
      if (i.type === 'weapon') {
        weapons.push(i);
        if (i.system.equipped) equippedWeapons.push(i);
        else inventoryWeapons.push(i);
      }
      else if (i.type === 'skill') skills.push(i);
      else if (i.type === 'ability') abilities.push(i);
      else if (i.type === 'equipment') {
        if (i.system.isArmor) inventoryArmor.push(i);
        else inventoryMisc.push(i);
        
        const qty = Number(i.system.quantity ?? 1) || 0;
        const wgt = Number(i.system.weight ?? 0) || 0;
        const carried = !!i.system.carried;
        if (carried) carryWeight += qty * wgt;
      }
    }

    const end = this.document.system.stats.endurance.total || 0;
    const carryCapacity = Math.max(0, Math.floor(end * 5));

    context.weapons = weapons; // Revert to show all weapons
    context.inventoryWeapons = inventoryWeapons;
    context.inventoryArmor = inventoryArmor;
    context.inventoryMisc = inventoryMisc;
    context.allWeapons = weapons;
    context.skills = skills;
    context.abilities = abilities;
    context.carryWeight = 0; // Disabled
    context.carryCapacity = carryCapacity;
    context.encumbered = false; // Disabled

    return context;
  }

  async _onItemCreate(event, target) {
    const type = target.dataset.type;
    console.log(`TAMS | Creating item of type: ${type}`);
    console.log(`TAMS | Valid Item Types:`, this.document.constructor.metadata.types);
    
    const itemData = {
      name: `New ${type.capitalize()}`,
      type: type
    };
    
    try {
      return await this.document.createEmbeddedDocuments("Item", [itemData]);
    } catch (err) {
      console.error(`TAMS | Failed to create item:`, err);
      ui.notifications.error(`Failed to create item of type ${type}. See console for details.`);
      throw err;
    }
  }

  async _onItemEdit(event, target) {
    const li = target.closest(".item");
    const item = this.document.items.get(li.dataset.itemId);
    if (item) item.sheet.render(true);
  }

  async _onItemDelete(event, target) {
    const li = target.closest(".item");
    const item = this.document.items.get(li.dataset.itemId);
    if (item) item.delete();
  }

  async _onUpdateItemField(event, target) {
    const itemId = target.dataset.itemId;
    const field = target.dataset.field;
    let value = target.value;
    if (target.type === "number") value = parseFloat(value);
    if (target.type === "checkbox") value = target.checked;
    const item = this.document.items.get(itemId);
    if (item) await item.update({ [field]: value });
  }

  async _onRoll(event, target) {
    const dataset = target.dataset;
    const item = dataset.itemId ? this.document.items.get(dataset.itemId) : null;

    let label = dataset.label || '';
    let statValue = parseInt(dataset.statValue) || 100;
    let statMod = parseInt(dataset.statMod) || 0;
    let familiarity = parseInt(dataset.familiarity) || 0;
    let statId = dataset.statId;

    if (!item) familiarity = 0; // Pure stat rolls don't include familiarity

    if (item && item.type === 'weapon') {
        const str = this.document.system.stats.strength;
        const dex = this.document.system.stats.dexterity;
        let usesDex = false;
        if (item.system.isRanged) {
            usesDex = !item.system.isThrown;
        } else {
            usesDex = !!item.system.isLight;
        }
        const stat = usesDex ? dex : str;
        statValue = stat.value;
        statMod = stat.mod;
        statId = usesDex ? 'dexterity' : 'strength';
        label = `Attacking with ${item.name}`;
    }

    if (item && item.type === 'skill') {
        const name = item.name;
        label = name;
        statId = item.system.stat;
        const stat = this.document.system.stats[statId];
        statValue = stat ? stat.value : 100;
        statMod = stat ? (stat.mod || 0) : 0;
        if (name.includes("(") && name.includes(")")) {
            const confirmed = await new Promise(resolve => {
                new Dialog({
                    title: "Skill Check",
                    content: `<p>Is this for the specific specialty <b>${name}</b>?</p>`,
                    buttons: {
                        yes: { label: "Yes (Full Fam)", callback: () => resolve(true) },
                        no: { label: "No (Half Fam)", callback: () => resolve(false) }
                    },
                    default: "yes"
                }).render(true);
            });
            if (!confirmed) familiarity = Math.floor(familiarity / 2);
        }
    }

    if (item && item.type === 'ability') {
        if (item.system.isAttack) {
            statId = item.system.attackStat;
            const stat = this.document.system.stats[statId];
            statValue = stat ? stat.value : 100;
            statMod = stat ? (stat.mod || 0) : 0;
            label = `Using Ability: ${item.name}`;
        }
        const cost = parseInt(item.system.cost) || 0;
        if (!item.system.isApex && cost > 0) {
            const resourceKey = item.system.resource;
            if (resourceKey === 'stamina') {
                const current = this.document.system.stamina.value;
                if (current < cost) return ui.notifications.warn("Not enough Stamina!");
                await this.document.update({"system.stamina.value": current - cost});
            } else {
                const idx = parseInt(resourceKey);
                const res = this.document.system.customResources[idx];
                if (res) {
                    if (res.value < cost) return ui.notifications.warn(`Not enough ${res.name}!`);
                    const resources = foundry.utils.duplicate(this.document.system.customResources);
                    resources[idx].value -= cost;
                    await this.document.update({"system.customResources": resources});
                }
            }
        }
    }

    let difficulty = 0;
    if (event.shiftKey) {
        difficulty = await new Promise(resolve => {
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

    const roll = await new Roll("1d100").evaluate();
    const rawResult = roll.total;
    const effectiveStat = statValue + statMod;
    const cappedResult = Math.min(rawResult, effectiveStat);
    const bonus = parseInt(item?.system?.bonus) || 0;
    const finalTotal = cappedResult + familiarity + bonus;

    let critInfo = "";
    let success = true;
    let resultText = "";
    let resultClass = "";

    if (statId === 'bravery') {
        const targetValue = effectiveStat + familiarity + bonus;
        success = rawResult <= targetValue;
        resultText = success ? "SUCCESS" : "FAILURE";
        resultClass = success ? "success" : "failure";
        critInfo = `<div class="tams-crit ${resultClass}">${resultText}</div>`;
    } else if (difficulty > 0) {
        if (finalTotal >= (difficulty * 2)) {
            critInfo = `<div class="tams-crit success">CRITICAL SUCCESS! (Total ${finalTotal} >= 2x Diff ${difficulty})</div>`;
        } else if (finalTotal >= difficulty) {
            critInfo = `<div class="tams-success">Success vs Diff ${difficulty}</div>`;
        } else {
            critInfo = `<div class="tams-failure">Failure vs Diff ${difficulty}</div>`;
        }
    }

    let damageInfo = "";
    if (item && (item.type === 'weapon' || (item.type === 'ability' && item.system.isAttack))) {
        const damage = item.system.calculatedDamage;
        const isRanged = item.type === 'weapon' ? !!item.system.isRanged : (item.system.calculator?.range > 10);
        let multiVal = 1;
        if (item.type === 'weapon' && item.system.isRanged) {
            if (item.system.fireRate === '3') multiVal = 3;
            else if (item.system.fireRate === 'auto') multiVal = 10;
            else if (item.system.fireRate === 'custom') multiVal = item.system.fireRateCustom || 1;
        } else if (item.type === 'ability') {
            multiVal = item.system.multiAttack || 1;
        }

        const hitLocation = await getHitLocation(rawResult);

        damageInfo = `
            <div class="roll-row"><b>Damage: ${damage}</b></div>
            <div class="roll-row"><b>Hit Location: ${hitLocation}</b></div>
            <div class="roll-row"><b>Max Hits: ${multiVal}</b></div>
            <div class="roll-row" style="gap:6px; flex-wrap: wrap;">
              <button class="tams-take-damage" data-damage="${damage}" data-location="${hitLocation}">Apply Damage</button>
              <button class="tams-dodge" data-raw="${rawResult}" data-total="${finalTotal}" data-multi="${multiVal}" data-location="${hitLocation}" data-damage="${damage}" data-is-ranged="${isRanged ? '1' : '0'}">Dodge</button>
              <button class="tams-retaliate" data-raw="${rawResult}" data-total="${finalTotal}" data-multi="${multiVal}" data-location="${hitLocation}" data-damage="${damage}" data-is-ranged="${isRanged ? '1' : '0'}">Retaliate</button>
              <button class="tams-behind-toggle" style="background: #444; color: white;">Behind</button>
              <button class="tams-unaware-toggle" style="background: #444; color: white;">Unaware</button>
            </div>
        `;
    }

    const messageContent = `
      <div class="tams-roll">
        <h3 class="roll-label">${label}</h3>
        ${damageInfo}
        <div class="roll-row"><span>Raw Dice Result:</span><span class="roll-value">${rawResult}</span></div>
        ${statId === 'bravery' ? 
            `<div class="roll-row"><small>Target (Bravery):</small><span>${statValue}${familiarity ? ' + ' + familiarity : ''}${bonus ? ' + ' + bonus : ''}</span></div>` :
            `<div class="roll-row"><small>Stat Cap (${statValue}${statMod >= 0 ? '+' : ''}${statMod}):</small><span>${cappedResult}</span></div>
             ${familiarity > 0 ? `<div class="roll-row"><small>Familiarity:</small><span>+${familiarity}</span></div>` : ''}
             ${bonus !== 0 ? `<div class="roll-row"><small>Bonus:</small><span>${bonus >= 0 ? '+' : ''}${bonus}</span></div>` : ''}`
        }
        <hr>
        <div class="roll-total">${statId === 'bravery' ? 'Target to beat' : 'Total'}: <b>${statId === 'bravery' ? (effectiveStat + familiarity + bonus) : finalTotal}</b></div>
        ${critInfo}
        <div class="roll-contest-hint">
            ${statId === 'bravery' ? 
                `<br><small>Bravery checks are roll-under. Success if Roll <= Target.</small>` :
                `<br><small><b>Crit Check (Contested):</b> Attacker Raw Dice (${rawResult}) vs 2x Defender Raw Dice.</small>
                 <br><small><b>Crit Check (Static):</b> Total (${finalTotal}) vs 2x Difficulty.</small>`
            }
        </div>
      </div>
    `;

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      content: messageContent,
      rolls: [roll]
    });
  }

  async _onResourceAdd(event, target) {
    const resources = [...(this.document.system.customResources || [])];
    resources.push({ name: "New Resource", value: 0, max: 0, stat: "endurance", mult: 1.0, bonus: 0, color: "#3498db" });
    return this.document.update({"system.customResources": resources});
  }

  async _onResourceDelete(event, target) {
    const index = target.dataset.index;
    const resources = [...(this.document.system.customResources || [])];
    resources.splice(index, 1);
    return this.document.update({"system.customResources": resources});
  }

  _onSetTab(event, target) {
    this._activeTab = target.dataset.tab;
    this.render();
  }
}

/**
 * Helper: Roll hit location
 */
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

/**
 * Helper: Show consolidated injury dialog
 */
async function showCombinedInjuryDialog(target, pendingChecks) {
    let content = `<div class="tams-injury-dialog">
        <p><b>${target.name}</b> must make the following checks:</p>`;

    pendingChecks.forEach((check, i) => {
        if (check.type === 'injured') {
            content += `
                <div class="check-row" style="background: rgba(241, 196, 15, 0.1); padding: 5px; margin-top: 5px; border: 1px solid #f39c12; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                    <label><b>INJURY CHECK: ${check.loc}</b> (DC ${check.dc})</label>
                    <button class="roll-check" data-index="${i}" style="width: 120px; font-size: 11px; background: #f39c12; color: white;">Roll Endurance</button>
                </div>`;
        } else if (check.type === 'crit') {
            content += `
                <div class="check-row" style="border-bottom: 1px solid #ccc; padding: 5px 0; display: flex; justify-content: space-between; align-items: center;">
                    <label><b>Crit Check: ${check.loc}</b> (DC ${check.dc})</label>
                    <button class="roll-check" data-index="${i}" style="width: 120px; font-size: 11px;">Roll Endurance</button>
                </div>`;
        } else if (check.type === 'unconscious') {
            content += `
                <div class="check-row" style="background: rgba(52, 152, 219, 0.1); padding: 5px; margin-top: 5px; border: 1px solid #3498db; border-radius: 4px;">
                    <label><b>UNCONSCIOUS CHECK</b> (DC ${check.dc})</label>
                    <p style="font-size: 0.8em; margin: 2px 0;">${check.reasons.join("<br>")}</p>
                    <button class="roll-check" data-index="${i}" style="width: 100%; margin-top: 5px; background: #2980b9; color: white; font-size: 12px;">Roll to Stay Awake</button>
                </div>`;
        } else if (check.type === 'survival') {
            content += `
                <div class="check-row" style="background: rgba(231, 76, 60, 0.1); padding: 5px; margin-top: 5px; border: 1px solid #e74c3c; border-radius: 4px;">
                    <label><b>SURVIVAL CHECK</b> (DC ${check.dc})</label>
                    <p style="font-size: 0.8em; margin: 2px 0;">${check.reasons.join("<br>")}</p>
                    <button class="roll-check" data-index="${i}" style="width: 100%; margin-top: 5px; background: #4a0000; color: white; font-size: 12px;">Roll for Survival</button>
                </div>`;
        }
    });
    content += `</div>`;

    new Dialog({
        title: `Injuries & Survival - ${target.name}`,
        content: content,
        buttons: { close: { label: "Close" } },
        render: (html) => {
            html.find('.roll-check').click(async ev => {
                const btn = ev.currentTarget;
                const idx = parseInt(btn.dataset.index);
                const check = pendingChecks[idx];
                const end = target.system.stats.endurance.total;
                
                let bonus = 0;
                let resourceSpent = null;

                // No pre-roll boost for unconscious anymore, handled after roll

                const roll = await new Roll("1d100").evaluate();
                const raw = roll.total;
                const capped = Math.min(raw, end);
                const total = capped + bonus;
                const success = total >= check.dc;

                let report = "";
                if (check.type === 'injured') {
                    report = `
                        <div class="tams-roll">
                            <h3 class="roll-label" style="color: #f39c12;">Endurance Check (Injury): ${check.loc}</h3>
                            <div class="roll-row"><span>Dice:</span><span>${raw}</span></div>
                            <div class="roll-row"><span>Capped (End ${end}):</span><span>${capped}</span></div>
                            <div class="roll-total">Total: <b>${capped}</b> vs DC <b>${check.dc}</b></div>
                            ${success ? '<div class="tams-success">Success! Not Injured</div>' : '<div class="tams-crit failure" style="background:#fff4cc; color:#856404; border-color:#ffeeba;">FAILED! Limb is Injured</div>'}
                        </div>
                    `;
                    if (!success) {
                        await target.update({[`system.limbs.${check.limbKey}.injured`]: true});
                    }
                } else if (check.type === 'crit') {
                    report = `
                        <div class="tams-roll">
                            <h3 class="roll-label">Endurance Check: ${check.loc}</h3>
                            <div class="roll-row"><span>Dice:</span><span>${raw}</span></div>
                            <div class="roll-row"><span>Capped (End ${end}):</span><span>${capped}</span></div>
                            <div class="roll-total">Total: <b>${capped}</b> vs DC <b>${check.dc}</b></div>
                            ${success ? '<div class="tams-success">Success!</div>' : '<div class="tams-crit failure">FAILED! Limb Critically Injured</div>'}
                        </div>
                    `;
                    if (!success) {
                        await target.update({[`system.limbs.${check.limbKey}.criticallyInjured`]: true});
                    }
                } else if (check.type === 'unconscious') {
                    report = `
                        <div class="tams-roll" data-actor-id="${target.id}" data-dc="${check.dc}" data-raw="${raw}" data-end="${end}" data-reasons='${JSON.stringify(check.reasons)}'>
                            <h3 class="roll-label" style="color: #2980b9;">Unconscious Check: ${target.name}</h3>
                            <div class="roll-row"><span>Dice:</span><span>${raw}</span></div>
                            <div class="roll-row"><span>Capped (End ${end}):</span><span>${capped}</span></div>
                            <div class="roll-boost-container"></div>
                            <div class="roll-total">Total: <b>${capped}</b> vs DC <b>${check.dc}</b></div>
                            ${success ? '<div class="tams-success" style="font-size:1.1em; font-weight:bold;">REMAINS CONSCIOUS</div>' : '<div class="tams-crit failure" style="font-size:1.1em;">FALLS UNCONSCIOUS</div>'}
                            <div class="roll-contest-hint"><small>Reasons: ${check.reasons.join(", ")}</small></div>
                            <div class="roll-row" style="margin-top: 5px;">
                                <button class="tams-boost-unconscious">Spend Resource to Boost (+5/pt)</button>
                            </div>
                        </div>
                    `;
                } else {
                    report = `
                        <div class="tams-roll">
                            <h3 class="roll-label" style="color: #8b0000;">Survival Check: ${target.name}</h3>
                            <div class="roll-row"><span>Dice:</span><span>${raw}</span></div>
                            <div class="roll-row"><span>Capped (End ${end}):</span><span>${capped}</span></div>
                            <div class="roll-total">Total: <b>${capped}</b> vs DC <b>${check.dc}</b></div>
                            ${success ? '<div class="tams-success" style="font-size:1.2em; font-weight:bold;">SURVIVED!</div>' : '<div class="tams-crit failure" style="font-size:1.2em;">FATAL INJURY / DECEASED</div>'}
                            <div class="roll-contest-hint"><small>Reasons: ${check.reasons.join(", ")}</small></div>
                        </div>
                    `;
                }
                ChatMessage.create({ speaker: ChatMessage.getSpeaker({actor: target}), content: report, rolls: [roll] });
                btn.disabled = true;
                btn.innerText = success ? "Passed" : "Failed";
                btn.style.background = success ? "#2e7d32" : "#c62828";
            });
        }
    }).render(true);
}

class TAMSItemSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2) {
  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
      tag: "form",
      classes: ["tams", "sheet", "item"],
      position: { width: 500, height: 700 },
      window: { resizable: true },
      form: { submitOnChange: true, closeOnSubmit: false },
      actions: { }
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
      "custom": "Custom"
    };
    context.limbOptions = {
      "none": "None",
      "head": "Head",
      "thorax": "Thorax",
      "stomach": "Stomach",
      "leftArm": "Left Arm",
      "rightArm": "Right Arm",
      "leftLeg": "Left Leg",
      "rightLeg": "Right Leg"
    };

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
                "none": "None",
                "head": "Head (+2 then x2)",
                "thorax": "Thorax/Stomach (+3)",
                "stomach": "Thorax/Stomach (+3)",
                "arms": "Arms/Legs (+2)",
                "legs": "Arms/Legs (+2)"
            },
            fireRates: {
                "single": "Single (+0)",
                "burst": "Burst/Semi (+2)",
                "auto": "Full Auto (+4)"
            },
            stunOptions: {
                "none": "None",
                "crit": "On Crit (+1)",
                "guaranteed": "Guaranteed (+5)"
            },
            drTypes: {
                "none": "None",
                "flat": "Flat Reduction",
                "specific": "Specific Limb Reduction"
            },
            targetTypes: {
                "single": "Single Entity (1x)",
                "multiple": "Multiple Targets (2x/1.5x)"
            },
            durations: {
                "instant": "Instant (+0)",
                "1round": "1 Round (+1)",
                "2rounds": "2 Rounds (+2)",
                "3rounds": "3 Rounds (+4)",
                "utility1": "Utility: <1h (+1)",
                "utility2": "Utility: 2-3h (+2)",
                "utility3": "Utility: 4-6h (+3)",
                "utility4": "Utility: 6-8h (+4)"
            },
            damageFractions: {
                "0": "None",
                "0.25": "0.25 Stat (+1)",
                "0.5": "0.50 Stat (+2)",
                "0.75": "0.75 Stat (+3)",
                "1.0": "1.00 Stat (+4)",
                "1.25": "1.25 Stat (+5)",
                "1.5": "1.50 Stat (+6)"
            }
        };
    }
    return context;
  }
}

Hooks.once("init", async function() {
  console.log("TAMS | Initializing Todo's Advanced Modular System");

  CONFIG.Actor.dataModels.character = TAMSCharacterData;
  CONFIG.Item.dataModels.weapon = TAMSWeaponData;
  CONFIG.Item.dataModels.skill = TAMSSkillData;
  CONFIG.Item.dataModels.ability = TAMSAbilityData;
  CONFIG.Item.dataModels.equipment = TAMSEquipmentData;

  // v12: Ensure types are also in systemDataModels if needed
  CONFIG.Item.systemDataModels = CONFIG.Item.dataModels;
  CONFIG.Actor.systemDataModels = CONFIG.Actor.dataModels;

  CONFIG.Actor.documentClass = TAMSActor;
  CONFIG.Item.documentClass = TAMSItem;

  foundry.documents.collections.Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);
  foundry.documents.collections.Actors.registerSheet("tams", TAMSActorSheet, { makeDefault: true });
  foundry.documents.collections.Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet);
  foundry.documents.collections.Items.registerSheet("tams", TAMSItemSheet, { makeDefault: true });

  // Register Handlebars Helpers
  Handlebars.registerHelper('eq', function (a, b) {
    return a === b;
  });
  Handlebars.registerHelper('or', function (a, b) {
    return a || b;
  });
  Handlebars.registerHelper('and', function (a, b) {
    return a && b;
  });
  Handlebars.registerHelper('not', function (a) {
    return !a;
  });
  Handlebars.registerHelper('capitalize', function (str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  });
});

Hooks.on("renderChatMessageHTML", (message, html, data) => {
    html.querySelectorAll(".tams-take-damage").forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      const btn = ev.currentTarget;
      const damageBase = parseInt(btn.dataset.damage);
      const singleLocation = btn.dataset.location;
      const multiLocations = btn.dataset.locations ? JSON.parse(btn.dataset.locations) : null;
      
      const locations = multiLocations || [singleLocation];
      
      const target = canvas.tokens.controlled[0]?.actor;
      if (!target) return ui.notifications.warn("Please select a token to apply damage to.");

      const locationMap = {
        "Head": "head", "Thorax": "thorax", "Stomach": "stomach",
        "Left Arm": "leftArm", "Right Arm": "rightArm",
        "Left Leg": "leftLeg", "Right Leg": "rightLeg"
      };

      let dialogContent = `<p>Applying <b>${locations.length}</b> hits to <b>${target.name}</b>:</p>`;
      locations.forEach((loc, i) => {
          const limbKey = locationMap[loc];
          const limb = target.system.limbs[limbKey];
          const armor = Math.floor(limb?.armor || 0);
          const armorMax = Math.floor(limb?.armorMax || 0);
          dialogContent += `
            <div class="form-group" style="margin-bottom: 5px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">
                <label>Hit ${i+1}: ${loc}</label>
                <div class="flexrow">
                    <span>Dmg: </span><input type="number" class="hit-dmg" data-index="${i}" value="${damageBase}" style="width: 50px;"/>
                    <span>Armor: ${armor}/${armorMax}</span>
                </div>
            </div>`;
      });

      new Dialog({
        title: `Apply Damage to ${target.name}`,
        content: dialogContent,
        buttons: {
        apply: { label: "Apply All Hits", callback: async (html) => {
              const updates = {};
              const itemUpdates = {}; // Track armor item updates: { itemId: { _id, "system.armorValue" } }
              const pendingChecks = [];
              const limbDamageReceived = {};
              const originalLimbStatus = {};
              
              for (let key of Object.keys(target.system.limbs)) {
                  originalLimbStatus[key] = {
                      value: target.system.limbs[key].value,
                      injured: target.system.limbs[key].injured,
                      criticallyInjured: target.system.limbs[key].criticallyInjured,
                      max: target.system.limbs[key].max
                  };
                  limbDamageReceived[key] = 0;
              }

              let report = `<b>${target.name}</b> taking damage:<br>`;
              const dmgInputs = html.find(".hit-dmg");
              
              for (let i = 0; i < locations.length; i++) {
                  const loc = locations[i];
                  const limbKey = locationMap[loc];
                  const limb = target.system.limbs[limbKey];
                  
                  // 1) Calculate current armor (considering previous hits in this loop)
                  const isAltArmor = target.system.settings?.alternateArmour;
                  let armor = 0;
                  let armorItems = [];
                  if (limb.hasEquippedArmor) {
                      armorItems = target.items.filter(it => it.type === "equipment" && it.system.equipped && it.system.isArmor && it.system.limb === limbKey);
                      for (const it of armorItems) {
                          const pendingVal = itemUpdates[it.id]?.["system.armorValue"];
                          const curVal = (pendingVal !== undefined ? pendingVal : it.system.armorValue) || 0;
                          
                          if (isAltArmor) {
                              const pendingMax = itemUpdates[it.id]?.["system.armorMax"];
                              const curMax = (pendingMax !== undefined ? pendingMax : it.system.armorMax) || 0;
                              if (curMax > 0) armor += curVal;
                          } else {
                              armor += curVal;
                          }
                      }
                  } else {
                      const pendingVal = updates[`system.limbs.${limbKey}.armor`];
                      const curVal = pendingVal !== undefined ? pendingVal : (limb.armor || 0);
                      
                      if (isAltArmor) {
                          const pendingMax = updates[`system.limbs.${limbKey}.armorMax`];
                          const curMax = pendingMax !== undefined ? pendingMax : (limb.armorMax || 0);
                          if (curMax > 0) armor = curVal;
                          else armor = 0;
                      } else {
                          armor = curVal;
                      }
                  }
                  armor = Math.floor(armor);
                  
                  const incoming = Math.floor(parseFloat(dmgInputs[i].value) || 0);
                  const effective = Math.max(0, incoming - armor);
                  
                  const currentHp = updates[`system.limbs.${limbKey}.value`] ?? limb.value;
                  const newHp = Math.floor(currentHp) - effective;
                  updates[`system.limbs.${limbKey}.value`] = newHp;
                  
                  limbDamageReceived[limbKey] += effective;

                  if (armor > 0 && effective < incoming) {
                      // Armor lost! 
                      if (limb.hasEquippedArmor) {
                          // Find an item to damage (first one with armor remaining)
                          const itemToDamage = armorItems.find(it => {
                              if (isAltArmor) {
                                  const pending = itemUpdates[it.id]?.["system.armorMax"];
                                  const val = pending !== undefined ? pending : it.system.armorMax;
                                  return val > 0;
                              } else {
                                  const pending = itemUpdates[it.id]?.["system.armorValue"];
                                  const val = pending !== undefined ? pending : it.system.armorValue;
                                  return val > 0;
                              }
                          });
                          if (itemToDamage) {
                              if (isAltArmor) {
                                  const pending = itemUpdates[itemToDamage.id]?.["system.armorMax"];
                                  const currentVal = pending !== undefined ? pending : itemToDamage.system.armorMax;
                                  itemUpdates[itemToDamage.id] = { 
                                      ...(itemUpdates[itemToDamage.id] || {}),
                                      _id: itemToDamage.id, 
                                      "system.armorMax": Math.max(0, currentVal - 1) 
                                  };
                              } else {
                                  const pending = itemUpdates[itemToDamage.id]?.["system.armorValue"];
                                  const currentVal = pending !== undefined ? pending : itemToDamage.system.armorValue;
                                  itemUpdates[itemToDamage.id] = { 
                                      ...(itemUpdates[itemToDamage.id] || {}),
                                      _id: itemToDamage.id, 
                                      "system.armorValue": Math.max(0, currentVal - 1) 
                                  };
                              }
                          }
                      } else {
                          if (isAltArmor) {
                              const pending = updates[`system.limbs.${limbKey}.armorMax`];
                              const currentMax = pending !== undefined ? pending : (limb.armorMax || 0);
                              updates[`system.limbs.${limbKey}.armorMax`] = Math.max(0, currentMax - 1);
                          } else {
                              updates[`system.limbs.${limbKey}.armor`] = Math.max(0, armor - 1);
                          }
                      }
                      const lossLabel = isAltArmor ? "1 armor HP lost" : "1 armor point lost";
                      report += `• ${loc}: ${effective} damage (${armor} armor blocked, ${lossLabel})<br>`;
                  } else {
                      report += `• ${loc}: ${effective} damage (${armor} armor blocked)<br>`;
                  }

                  // Rule 2: Below -Max -> Automatic Injured
                  if (newHp <= -limb.max) {
                      updates[`system.limbs.${limbKey}.injured`] = true;
                  }
              }

              // Apply all updates atomically
              const finalUpdates = { ...updates };
              if (Object.keys(itemUpdates).length > 0) {
                  finalUpdates.items = Object.values(itemUpdates);
              }
              await target.update(finalUpdates);
              
              // Post-application checks
              for (let [limbKey, damage] of Object.entries(limbDamageReceived)) {
                  if (damage === 0) continue;
                  
                  const original = originalLimbStatus[limbKey];
                  const limb = target.system.limbs[limbKey];
                  const currentVal = limb.value; // After update
                  const isInjuredNow = limb.injured;
                  const isCritNow = limb.criticallyInjured;
                  
                  // Rule 1: Entering [0, -Max] while not Injured -> Check for Injured
                  if (currentVal <= 0 && currentVal > -limb.max && !original.injured && !isInjuredNow) {
                      const prevNegative = original.value < 0 ? Math.abs(original.value) : 0;
                      const dc = damage + prevNegative;
                      pendingChecks.push({
                          type: 'injured',
                          loc: limb.label,
                          dc: dc,
                          limbKey: limbKey
                      });
                  }

                  // Rule 2 & 3: Below -Max -> Check for Critical Injury
                  // Triggers if:
                  // - It was above -Max and dropped to/below -Max (Rule 2)
                  // - OR it was positive and dropped below -Max in one hit (Rule 3 - covered by same logic)
                  if (currentVal <= -limb.max && !original.criticallyInjured) {
                      // Only trigger if it wasn't already below -Max or if we want it to trigger on every hit while below -Max?
                      // Usually "Once its below its negative max" implies the moment it enters that state.
                      // If it was already below -Max, it wouldn't trigger again unless we check if it was previously ABOVE -Max.
                      if (original.value > -limb.max) {
                          const prevNegative = original.value < 0 ? Math.abs(original.value) : 0;
                          const dc = damage + prevNegative;
                          pendingChecks.push({
                              type: 'crit',
                              loc: limb.label,
                              dc: dc,
                              limbKey: limbKey
                          });
                      }
                  }
              }

              // Survival Checks
              let survivalNeeded = false;
              let survivalDC = 0;
              let reasons = [];

              const totalHp = target.system.hp.value;
              const maxHp = target.system.hp.max;

              if (totalHp <= -maxHp) {
                  survivalNeeded = true;
                  const dc = Math.abs(totalHp);
                  if (dc > survivalDC) survivalDC = dc;
                  reasons.push(`Total HP is below negative max (${totalHp} / ${-maxHp})`);
              } else if (totalHp < 0) {
                  pendingChecks.push({
                      type: 'unconscious',
                      dc: Math.abs(totalHp),
                      reasons: [`Total HP is negative (${totalHp})`]
                  });
              }

              // Head/Thorax checks - Trigger whenever below lethal threshold
              const checkLethal = (key) => {
                  const limb = target.system.limbs[key];
                  if (limb.value < -limb.max) {
                      survivalNeeded = true;
                      const dc = Math.abs(limb.value);
                      if (dc > survivalDC) survivalDC = dc;
                      reasons.push(`${limb.label} is beyond negative max (${limb.value}/${-limb.max})`);
                  }
              };

              checkLethal('head');
              checkLethal('thorax');

              if (survivalNeeded) {
                  pendingChecks.push({ type: 'survival', dc: survivalDC, reasons });
              }

              // Report automatic injuries
              for (let [key, val] of Object.entries(updates)) {
                  if (key.endsWith(".injured") && val === true) {
                      const limbKey = key.split('.')[2];
                      if (!originalLimbStatus[limbKey].injured) {
                          report += `<b style="color:#f39c12;">!!! ${target.system.limbs[limbKey].label} INJURED (Below negative Max HP) !!!</b><br>`;
                      }
                  }
              }

              ChatMessage.create({ content: report });

              if (pendingChecks.length > 0) {
                  showCombinedInjuryDialog(target, pendingChecks);
              }
            }
          }
        },
        default: "apply"
      }).render(true);
    }));

    // Dodge action
    html.querySelectorAll('.tams-dodge').forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      const btn = ev.currentTarget;
      const attackerRaw = parseInt(btn.dataset.raw);
      const attackerTotal = parseInt(btn.dataset.total);
      const attackerMulti = parseInt(btn.dataset.multi) || 1;
      const attackerDamage = parseInt(btn.dataset.damage) || 0;
      const isRanged = btn.dataset.isRanged === '1';
      const firstLocation = btn.dataset.location;
      const container = btn.closest(".tams-roll");
      const isBehind = container?.classList.contains("behind-attack") || false;
      const isUnaware = container?.classList.contains("unaware-defender") || false;
      
      const actor = canvas.tokens.controlled[0]?.actor;
      if (!actor) return ui.notifications.warn('Select a token to Dodge.');
      
      let dexVal = Math.floor(actor.system.stats.dexterity.total || 0);
      if (isBehind) {
          const behindMult = actor.system.behindMult ?? 0.5;
          dexVal = Math.floor(dexVal * behindMult);
      }
      if (isUnaware) {
          dexVal = Math.floor(dexVal * 0.5);
      }

      const roll = await new Roll('1d100').evaluate();
      const raw = roll.total;
      const capped = Math.min(raw, dexVal);
      const total = capped;

      let critInfo = "";
      let hitsScored = 0;
      let damageInfo = "";
      let locations = [];

      // Narrative crits
      if (raw >= (attackerRaw * 2)) {
          critInfo = `<div class="tams-crit success">CRITICAL DODGE! (Raw ${raw} >= 2x Attacker ${attackerRaw})</div>`;
      } else if (attackerRaw >= (raw * 2)) {
          critInfo = `<div class="tams-crit failure">CRITICAL HIT TAKEN! (Attacker Raw ${attackerRaw} >= 2x Raw ${raw})</div>`;
      }

      if (attackerTotal > total) {
          // Attacker wins
          hitsScored = 1 + Math.floor((attackerTotal - total) / 5);
          hitsScored = Math.min(hitsScored, attackerMulti);

          locations.push(firstLocation);
          for (let i = 1; i < hitsScored; i++) {
              locations.push(await getHitLocation());
          }

          damageInfo = `
            <div class="roll-row"><b>Hits: ${hitsScored} / ${attackerMulti}</b></div>
            <div class="roll-row"><small>Locations: ${locations.join(", ")}</small></div>
            <div class="roll-row" style="margin-top: 5px;">
                <button class="tams-take-damage" data-damage="${attackerDamage}" data-locations='${JSON.stringify(locations)}'>Apply Damage</button>
            </div>
          `;
          if (!critInfo) critInfo = `<div class="tams-failure">Dodge Failed vs Total ${attackerTotal}</div>`;
      } else {
          // Defender wins normally
          hitsScored = 0;
          if (!critInfo) critInfo = `<div class="tams-success">Dodge Success vs Total ${attackerTotal}</div>`;
      }

      const msg = `
        <div class="tams-roll" data-attacker-raw="${attackerRaw}" data-attacker-total="${attackerTotal}" data-attacker-multi="${attackerMulti}" data-attacker-damage="${attackerDamage}" data-actor-id="${actor.id}" data-raw="${raw}" data-capped="${capped}" data-behind="${isBehind ? '1' : '0'}" data-unaware="${isUnaware ? '1' : '0'}" data-first-location="${firstLocation}" data-is-ranged="${isRanged ? '1' : '0'}">
          <h3 class="roll-label">Dodge — ${actor.name} ${isBehind ? '(Behind)' : ''} ${isUnaware ? '(Unaware)' : ''}</h3>
          <div class="roll-row"><span>Raw Dice Result:</span><span class="roll-value">${raw}</span></div>
          <div class="roll-row"><small>Stat Cap (Dex ${dexVal}):</small><span>${capped}</span></div>
          <div class="roll-boost-container"></div>
          <hr>
          <div class="roll-total">Total: <b>${total}</b></div>
          <div class="roll-hits-info">${damageInfo}</div>
          <div class="roll-crit-info">${critInfo}</div>
          <div class="roll-contest-hint">
            <small><b>Contest:</b> Total vs Attacker Total (${attackerTotal})</small><br>
            <small><b>Crit Check:</b> Raw vs Attacker Raw (${attackerRaw})</small>
          </div>
          <div class="roll-row" style="margin-top: 5px;">
            <button class="tams-boost-dodge">Spend Resource to Boost (+5/pt)</button>
          </div>
        </div>`;
      ChatMessage.create({ speaker: ChatMessage.getSpeaker({actor}), content: msg, rolls: [roll] });
    }));

    // Boost Dodge action
    html.querySelectorAll('.tams-boost-dodge').forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      const btn = ev.currentTarget;
      const container = btn.closest(".tams-roll");
      const attackerRaw = parseInt(container.dataset.attackerRaw);
      const attackerTotal = parseInt(container.dataset.attackerTotal);
      const attackerMulti = parseInt(container.dataset.attackerMulti) || 1;
      const attackerDamage = parseInt(container.dataset.attackerDamage) || 0;
      const firstLocation = container.dataset.firstLocation;
      const actorId = container.dataset.actorId;
      const raw = parseInt(container.dataset.raw);
      const capped = parseInt(container.dataset.capped);
      
      const actor = game.actors.get(actorId);
      if (!actor) return;

      const isUnawareFromData = container.dataset.unaware === '1';

      const bonusNeeded = attackerTotal - capped;
      const pointsNeeded = Math.max(0, Math.ceil(bonusNeeded / 5));
      const pointsCapped = Math.min(pointsNeeded, 10);

      const resources = [{id: "stamina", name: "Stamina", value: actor.system.stamina.value}];
      actor.system.customResources.forEach((res, idx) => {
          resources.push({id: idx.toString(), name: res.name, value: res.value});
      });
      const options = resources.map(r => `<option value="${r.id}">${r.name} (${r.value} avail)</option>`).join('');

      const spending = await new Promise(resolve => {
        new Dialog({
          title: "Boost Dodge Result",
          content: `
            <div class="form-group"><label>Resource</label><select id="res-type">${options}</select></div>
            <div class="form-group">
                <label>Points Spent (Max 10)</label>
                <input type="number" id="res-points" value="${pointsCapped}" min="0" max="10"/>
                <p><small>Each point gives +5 to Dodge.</small></p>
                <p><i>${pointsNeeded > 0 ? `Minimum to dodge: <b>${pointsNeeded}</b>` : "Already Dodged!"}</i></p>
            </div>
            <div class="form-group">
                <label>Unaware? (Dex halved again)</label>
                <input type="checkbox" id="unaware" ${isUnawareFromData ? 'checked' : ''}/>
            </div>`,
          buttons: {
            go: { label: "Apply Boost", callback: (html) => {
                const resId = html.find("#res-type").val();
                const res = resources.find(r => r.id === resId);
                let requestedPoints = Math.clamp(parseInt(html.find("#res-points").val()) || 0, 0, 10);
                // Adjust to closest possible if not enough resource
                if (requestedPoints > res.value) requestedPoints = res.value;
                
                resolve({
                    resId: resId,
                    points: requestedPoints,
                    unaware: html.find("#unaware").is(":checked")
                });
            }},
            cancel: { label: "Cancel", callback: () => resolve(null) }
          },
          default: "go"
        }).render(true);
      });

      if (!spending) return;
      const { resId, points, unaware } = spending;
      const bonus = points * 5;

      if (points > 0) {
        if (resId === 'stamina') {
            const current = actor.system.stamina.value;
            if (current < points) return ui.notifications.warn("Not enough Stamina!");
            await actor.update({"system.stamina.value": current - points});
        } else {
            const idx = parseInt(resId);
            const res = actor.system.customResources[idx];
            if (res.value < points) return ui.notifications.warn(`Not enough ${res.name}!`);
            const customResources = foundry.utils.duplicate(actor.system.customResources);
            customResources[idx].value -= points;
            await actor.update({"system.customResources": customResources});
        }
      }

      let finalCapped = capped;
      if (unaware) {
          finalCapped = Math.floor(finalCapped * 0.5);
      }

      const total = finalCapped + bonus;
      let critInfo = "";
      let hitsScored = 0;
      let damageInfo = "";
      let locations = [];

      // Narrative crits
      if (raw >= (attackerRaw * 2)) {
          critInfo = `<div class="tams-crit success">CRITICAL DODGE! (Raw ${raw} >= 2x Attacker ${attackerRaw})</div>`;
      } else if (attackerRaw >= (raw * 2)) {
          critInfo = `<div class="tams-crit failure">CRITICAL HIT TAKEN! (Attacker Raw ${attackerRaw} >= 2x Raw ${raw})</div>`;
      }

      if (attackerTotal > total) {
          hitsScored = 1 + Math.floor((attackerTotal - total) / 5);
          hitsScored = Math.min(hitsScored, attackerMulti);
          
          locations.push(firstLocation);
          for (let i = 1; i < hitsScored; i++) {
              locations.push(await getHitLocation());
          }

          damageInfo = `
            <div class="roll-row"><b>Hits: ${hitsScored} / ${attackerMulti}</b></div>
            <div class="roll-row"><small>Locations: ${locations.join(", ")}</small></div>
            <div class="roll-row" style="margin-top: 5px;">
                <button class="tams-take-damage" data-damage="${attackerDamage}" data-locations='${JSON.stringify(locations)}'>Apply Damage</button>
            </div>
          `;

          if (!critInfo) critInfo = `<div class="tams-failure">Dodge Failed vs Total ${attackerTotal}</div>`;
      } else {
          hitsScored = 0;
          if (!critInfo) critInfo = `<div class="tams-success">Dodge Success vs Total ${attackerTotal}</div>`;
      }

      const boostHtml = `<div class="roll-row"><small>Boost (+5/pt):</small><span>+${bonus}</span></div>`;
      if (unaware) {
          container.querySelector(".roll-label").innerText += " (Unaware)";
          container.querySelectorAll(".roll-row")[1].innerHTML = `<span>Stat Cap (Unaware):</span><span>${finalCapped}</span>`;
      }
      container.querySelector(".roll-boost-container").innerHTML = boostHtml;
      container.querySelector(".roll-total b").innerText = total;
      container.querySelector(".roll-hits-info").innerHTML = damageInfo;
      container.querySelector(".roll-crit-info").innerHTML = critInfo;
      btn.remove();

      const messageId = btn.closest(".chat-message").dataset.messageId;
      const message = game.messages.get(messageId);
      if (message) message.update({ content: container.outerHTML });
    }));

    // Retaliate action
    html.querySelectorAll('.tams-retaliate').forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      const btn = ev.currentTarget;
      const attackerRaw = parseInt(btn.dataset.raw);
      const attackerTotal = parseInt(btn.dataset.total);
      const attackerMulti = parseInt(btn.dataset.multi) || 1;
      const attackerDamage = parseInt(btn.dataset.damage) || 0;
      const isRanged = btn.dataset.isRanged === '1';
      const firstLocation = btn.dataset.location;
      const container = btn.closest(".tams-roll");
      const isBehind = container?.classList.contains("behind-attack") || false;
      const isUnaware = container?.classList.contains("unaware-defender") || false;

      const actor = canvas.tokens.controlled[0]?.actor;
      if (!actor) return ui.notifications.warn('Select a token to Retaliate.');
      const weapons = actor.items.filter(i => {
        if (i.type === 'weapon') return true;
        if (i.type === 'ability' && i.system.isReaction && i.system.isAttack) return true;
        return false;
      });
      if (!weapons.length) return ui.notifications.warn('Selected actor has no valid weapons or reaction abilities.');

      const options = weapons.map(w => `<option value="${w.id}">${w.name} (${w.type === 'ability' ? 'Ability' : 'Weapon'}, Fam ${w.system.familiarity||0})</option>`).join('');
      let chosenId = await new Promise(resolve => {
        new Dialog({
          title: 'Choose Weapon to Retaliate',
          content: `<div class="form-group"><label>Weapon</label><select id="ret-weapon">${options}</select></div>`,
          buttons: { go: { label: 'Roll', callback: html => resolve(html.find('#ret-weapon').val()) } },
          default: 'go'
        }).render(true);
      });
      const weapon = actor.items.get(chosenId);
      if (!weapon) return;

      // Handle cost for abilities
      if (weapon.type === 'ability') {
        const cost = parseInt(weapon.system.cost) || 0;
        if (!weapon.system.isApex && cost > 0) {
            const resourceKey = weapon.system.resource;
            if (resourceKey === 'stamina') {
                const current = actor.system.stamina.value;
                if (current < cost) return ui.notifications.warn("Not enough Stamina!");
                await actor.update({"system.stamina.value": current - cost});
            } else {
                const idx = parseInt(resourceKey);
                const res = actor.system.customResources[idx];
                if (res) {
                    if (res.value < cost) return ui.notifications.warn(`Not enough ${res.name}!`);
                    const resources = foundry.utils.duplicate(actor.system.customResources);
                    resources[idx].value -= cost;
                    await actor.update({"system.customResources": resources});
                }
            }
        }
      }

      let str = actor.system.stats.strength.total;
      let dex = actor.system.stats.dexterity.total;
      
      if (isBehind) {
          const behindMult = actor.system.behindMult ?? 0.5;
          str = Math.floor(str * behindMult);
          dex = Math.floor(dex * behindMult);
      }
      if (isUnaware) {
          str = Math.floor(str * 0.5);
          dex = Math.floor(dex * 0.5);
      }

      let usesDex = false;
      let cap = 0;
      if (weapon.type === 'weapon') {
          if (weapon.system.isRanged) {
              usesDex = !weapon.system.isThrown;
          } else {
              usesDex = !!weapon.system.isLight;
          }
          cap = usesDex ? dex : str;
      } else if (weapon.type === 'ability') {
          const statId = weapon.system.attackStat;
          const stat = actor.system.stats[statId];
          cap = stat ? stat.total : 100;
          if (isBehind) {
              const behindMult = actor.system.behindMult ?? 0.5;
              cap = Math.floor(cap * behindMult);
          }
          if (isUnaware) {
              cap = Math.floor(cap * 0.5);
          }
      }
      const fam = Math.floor(weapon.system.familiarity || 0);
      const roll = await new Roll('1d100').evaluate();
      const raw = roll.total;
      const capped = Math.min(raw, cap);
      const total = capped + fam;

      let critInfo = "";
      let defenseDamageInfo = "";
      let defenseLocations = [];

      const threshold = isRanged ? 20 : 10;
      const diff = attackerTotal - total;
      const isMutual = Math.abs(diff) <= threshold;

      // Narrative crits
      if (raw >= (attackerRaw * 2)) {
          critInfo = `<div class="tams-crit success">CRITICAL RETALIATION! (Raw ${raw} >= 2x Attacker ${attackerRaw})</div>`;
      } else if (attackerRaw >= (raw * 2)) {
          critInfo = `<div class="tams-crit failure">CRITICAL HIT TAKEN! (Attacker Raw ${attackerRaw} >= 2x Raw ${raw})</div>`;
      }

      let multiVal = 1;
      if (weapon.type === 'weapon' && weapon.system.isRanged) {
          if (weapon.system.fireRate === '3') multiVal = 3;
          else if (weapon.system.fireRate === 'auto') multiVal = 10;
          else if (weapon.system.fireRate === 'custom') multiVal = weapon.system.fireRateCustom || 1;
      } else if (weapon.type === 'ability') {
          multiVal = weapon.system.multiAttack || 1;
      }

      const damage = weapon.system.calculatedDamage;

      // Calculate hits scored by defender (retaliation hits)
      let hitsScored = 0;
      if (isMutual) {
          hitsScored = Math.min(1 + Math.floor(Math.max(0, total - attackerTotal) / 5), multiVal);
      } else if (total > attackerTotal) {
          hitsScored = Math.min(1 + Math.floor((total - attackerTotal) / 5), multiVal);
      }

      // Prepare retaliation hit locations
      let retLocations = [];
      if (hitsScored > 0) {
          retLocations.push(await getHitLocation(raw));
          for (let i = 1; i < hitsScored; i++) {
              retLocations.push(await getHitLocation());
          }
      }

      // Check defender success/failure against incoming attack
      if (isMutual) {
          const hitsTaken = Math.min(1 + Math.floor(Math.max(0, attackerTotal - total) / 5), attackerMulti);
          defenseLocations.push(firstLocation);
          for (let i = 1; i < hitsTaken; i++) {
              defenseLocations.push(await getHitLocation());
          }
          defenseDamageInfo = `
            <div class="roll-row"><b style="color:orange;">Mutual Hit (Within ${threshold})</b></div>
            <div class="roll-row"><b>Hits Taken: ${hitsTaken} / ${attackerMulti}</b></div>
            <div class="roll-row"><small>Locations: ${defenseLocations.join(", ")}</small></div>
            <div class="roll-row" style="margin-bottom: 10px;">
                <button class="tams-take-damage" data-damage="${attackerDamage}" data-locations='${JSON.stringify(defenseLocations)}'>Apply Hits to Defender</button>
            </div>
          `;
      } else if (attackerTotal > total) {
          const hitsTaken = Math.min(1 + Math.floor((attackerTotal - total) / 5), attackerMulti);
          defenseLocations.push(firstLocation);
          for (let i = 1; i < hitsTaken; i++) {
              defenseLocations.push(await getHitLocation());
          }
          defenseDamageInfo = `
            <div class="roll-row"><b style="color:red;">Failed to beat Attack!</b></div>
            <div class="roll-row"><b>Hits Taken: ${hitsTaken} / ${attackerMulti}</b></div>
            <div class="roll-row"><small>Locations: ${defenseLocations.join(", ")}</small></div>
            <div class="roll-row" style="margin-bottom: 10px;">
                <button class="tams-take-damage" data-damage="${attackerDamage}" data-locations='${JSON.stringify(defenseLocations)}'>Apply Hits to Defender</button>
            </div>
          `;
          if (!critInfo) critInfo = `<div class="tams-failure">Retaliate Failed vs Total ${attackerTotal}</div>`;
      } else {
          if (!critInfo) critInfo = `<div class="tams-success">Retaliate Success vs Total ${attackerTotal}</div>`;
      }

      const retButtons = isMutual ? `
          <button class="tams-take-damage" data-damage="${damage}" data-locations='${JSON.stringify(retLocations)}'>Apply Damage</button>
      ` : (hitsScored > 0 ? `
          <button class="tams-take-damage" data-damage="${damage}" data-locations='${JSON.stringify(retLocations)}'>Apply Damage</button>
          <button class="tams-dodge" data-raw="${raw}" data-total="${total}" data-multi="${multiVal}" data-location="${retLocations[0]}" data-damage="${damage}" data-is-ranged="${isRanged ? '1' : '0'}">Dodge</button>
          <button class="tams-retaliate" data-raw="${raw}" data-total="${total}" data-multi="${multiVal}" data-location="${retLocations[0]}" data-damage="${damage}" data-is-ranged="${isRanged ? '1' : '0'}">Retaliate</button>
          <button class="tams-behind-toggle" style="background: #444; color: white;">Behind</button>
          <button class="tams-unaware-toggle" style="background: #444; color: white;">Unaware</button>
      ` : "");

      const msg = `
        <div class="tams-roll" data-attacker-raw="${raw}" data-attacker-total="${total}" data-attacker-multi="${multiVal}" data-is-ranged="${isRanged ? '1' : '0'}">
          <h3 class="roll-label">Retaliation — ${actor.name} with ${weapon.name} ${isBehind ? '(Behind)' : ''} ${isUnaware ? '(Unaware)' : ''}</h3>
          
          ${defenseDamageInfo}
          <hr>
          
          <div class="roll-row"><b>Damage: ${damage}</b></div>
          <div class="roll-row"><b>Hits Scored: ${hitsScored} / ${multiVal}</b></div>
          <div class="roll-row"><b>Hit Location: ${retLocations.length > 0 ? retLocations[0] : "-"}</b></div>
          ${retLocations.length > 1 ? `<div class="roll-row"><small>Additional Hits: ${retLocations.slice(1).join(", ")}</small></div>` : ""}
          <div class="roll-row"><b>Max Hits: ${multiVal}</b></div>
          <div class="roll-row" style="gap:6px; flex-wrap: wrap;">
            ${retButtons}
          </div>
          <div class="roll-row"><span>Raw Dice Result:</span><span class="roll-value">${raw}</span></div>
          <div class="roll-row"><small>Stat Cap (${cap}):</small><span>${capped}</span></div>
          <div class="roll-row"><small>Familiarity:</small><span>+${fam}</span></div>
          <hr>
          <div class="roll-total">Total: <b>${total}</b></div>
          ${critInfo}
          <div class="roll-contest-hint">
            <small><b>Contest:</b> Total vs Attacker Total (${attackerTotal})</small><br>
            <small><b>Crit Check:</b> Raw vs Attacker Raw (${attackerRaw})</small>
          </div>
        </div>`;
      ChatMessage.create({ speaker: ChatMessage.getSpeaker({actor}), content: msg, rolls: [roll] });
    }));

    // Boost Unconscious action
    html.querySelectorAll('.tams-boost-unconscious').forEach(el => el.addEventListener("click", async ev => {
        ev.preventDefault();
        const btn = ev.currentTarget;
        const container = btn.closest(".tams-roll");
        const actorId = container.dataset.actorId;
        const dc = parseInt(container.dataset.dc);
        const raw = parseInt(container.dataset.raw);
        const end = parseInt(container.dataset.end);

        const actor = game.actors.get(actorId);
        if (!actor) return;

        const capped = Math.min(raw, end);
        const bonusNeeded = dc - capped;
        const pointsNeeded = Math.max(0, Math.ceil(bonusNeeded / 5));
        const pointsCapped = Math.min(pointsNeeded, 10);

        const resources = [{id: "stamina", name: "Stamina", value: actor.system.stamina.value}];
        actor.system.customResources.forEach((res, idx) => {
            resources.push({id: idx.toString(), name: res.name, value: res.value});
        });
        const options = resources.map(r => `<option value="${r.id}">${r.name} (${r.value} avail)</option>`).join('');

        const spending = await new Promise(resolve => {
            new Dialog({
                title: "Boost Unconscious Check",
                content: `
                    <div class="form-group"><label>Resource</label><select id="res-type">${options}</select></div>
                    <div class="form-group">
                        <label>Points Spent (Max 10)</label>
                        <input type="number" id="res-points" value="${pointsCapped}" min="0" max="10"/>
                        <p><small>Each point gives +5 to the check.</small></p>
                        <p><i>${pointsNeeded > 0 ? `Minimum to stay awake: <b>${pointsNeeded}</b>` : "Already Awake!"}</i></p>
                    </div>`,
                buttons: {
                    go: { label: "Apply Boost", callback: (html) => {
                        const resId = html.find("#res-type").val();
                        const res = resources.find(r => r.id === resId);
                        let pts = Math.clamp(parseInt(html.find("#res-points").val()) || 0, 0, 10);
                        if (pts > res.value) pts = res.value;
                        resolve({ resId, pts });
                    }},
                    cancel: { label: "Cancel", callback: () => resolve(null) }
                },
                default: "go"
            }).render(true);
        });

        if (!spending) return;
        const { resId, pts } = spending;
        const bonus = pts * 5;

        if (pts > 0) {
            if (resId === 'stamina') {
                await actor.update({"system.stamina.value": actor.system.stamina.value - pts});
            } else {
                const idx = parseInt(resId);
                const customResources = foundry.utils.duplicate(actor.system.customResources);
                customResources[idx].value -= pts;
                await actor.update({"system.customResources": customResources});
            }
        }

        const total = capped + bonus;
        const success = total >= dc;
        const resName = resources.find(r => r.id === resId).name;

        const boostHtml = `<div class="roll-row"><span>Boost (${resName}):</span><span>+${bonus}</span></div>`;
        container.querySelector(".roll-boost-container").innerHTML = boostHtml;
        container.querySelector(".roll-total b").innerText = total;
        
        const statusDiv = container.querySelector(".tams-success, .tams-crit.failure");
        if (statusDiv) {
            statusDiv.className = success ? "tams-success" : "tams-crit failure";
            statusDiv.style.fontSize = "1.1em";
            statusDiv.style.fontWeight = success ? "bold" : "normal";
            statusDiv.innerText = success ? "REMAINS CONSCIOUS" : "FALLS UNCONSCIOUS";
        }
        btn.remove();

        const messageId = btn.closest(".chat-message").dataset.messageId;
        const message = game.messages.get(messageId);
        if (message) message.update({ content: container.outerHTML });
    }));

    // Behind toggle action
    html.querySelectorAll('.tams-behind-toggle').forEach(el => el.addEventListener("click", async ev => {
        ev.preventDefault();
        const btn = ev.currentTarget;
        const container = btn.closest(".tams-roll");
        container.classList.toggle("behind-attack");
        if (container.classList.contains("behind-attack")) {
            btn.style.background = "#2e7d32";
        } else {
            btn.style.background = "#444";
        }
    }));

    // Unaware toggle action
    html.querySelectorAll('.tams-unaware-toggle').forEach(el => el.addEventListener("click", async ev => {
        ev.preventDefault();
        const btn = ev.currentTarget;
        const container = btn.closest(".tams-roll");
        container.classList.toggle("unaware-defender");
        if (container.classList.contains("unaware-defender")) {
            btn.style.background = "#2e7d32";
        } else {
            btn.style.background = "#444";
        }
    }));
});
