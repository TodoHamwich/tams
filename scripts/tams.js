/**
 * Data Models
 */
class TAMSCharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      stats: new fields.SchemaField({
        strength: new fields.SchemaField({ value: new fields.NumberField({initial: 10}), label: new fields.StringField({initial: "TAMS.StatStrength"}) }),
        dexterity: new fields.SchemaField({ value: new fields.NumberField({initial: 10}), label: new fields.StringField({initial: "TAMS.StatDexterity"}) }),
        endurance: new fields.SchemaField({ value: new fields.NumberField({initial: 10}), label: new fields.StringField({initial: "TAMS.StatEndurance"}) }),
        wisdom: new fields.SchemaField({ value: new fields.NumberField({initial: 10}), label: new fields.StringField({initial: "TAMS.StatWisdom"}) }),
        intelligence: new fields.SchemaField({ value: new fields.NumberField({initial: 10}), label: new fields.StringField({initial: "TAMS.StatIntelligence"}) }),
        bravery: new fields.SchemaField({ value: new fields.NumberField({initial: 10}), label: new fields.StringField({initial: "TAMS.StatBravery"}) })
      }),
      limbs: new fields.SchemaField({
        head: new fields.SchemaField({ value: new fields.NumberField({initial: 5, min: 0}), max: new fields.NumberField({initial: 5, min: 0}), mult: new fields.NumberField({initial: 0.5}), armor: new fields.NumberField({initial: 0, min: 0, max: 40}), armorMax: new fields.NumberField({initial: 0, min: 0, max: 40}), label: new fields.StringField({initial: "Head"}) }),
        thorax: new fields.SchemaField({ value: new fields.NumberField({initial: 10, min: 0}), max: new fields.NumberField({initial: 10, min: 0}), mult: new fields.NumberField({initial: 1.0}), armor: new fields.NumberField({initial: 0, min: 0, max: 40}), armorMax: new fields.NumberField({initial: 0, min: 0, max: 40}), label: new fields.StringField({initial: "Thorax"}) }),
        stomach: new fields.SchemaField({ value: new fields.NumberField({initial: 7, min: 0}), max: new fields.NumberField({initial: 7, min: 0}), mult: new fields.NumberField({initial: 0.75}), armor: new fields.NumberField({initial: 0, min: 0, max: 40}), armorMax: new fields.NumberField({initial: 0, min: 0, max: 40}), label: new fields.StringField({initial: "Stomach"}) }),
        leftArm: new fields.SchemaField({ value: new fields.NumberField({initial: 7, min: 0}), max: new fields.NumberField({initial: 7, min: 0}), mult: new fields.NumberField({initial: 0.75}), armor: new fields.NumberField({initial: 0, min: 0, max: 40}), armorMax: new fields.NumberField({initial: 0, min: 0, max: 40}), label: new fields.StringField({initial: "Left Arm"}) }),
        rightArm: new fields.SchemaField({ value: new fields.NumberField({initial: 7, min: 0}), max: new fields.NumberField({initial: 7, min: 0}), mult: new fields.NumberField({initial: 0.75}), armor: new fields.NumberField({initial: 0, min: 0, max: 40}), armorMax: new fields.NumberField({initial: 0, min: 0, max: 40}), label: new fields.StringField({initial: "Right Arm"}) }),
        leftLeg: new fields.SchemaField({ value: new fields.NumberField({initial: 7, min: 0}), max: new fields.NumberField({initial: 7, min: 0}), mult: new fields.NumberField({initial: 0.75}), armor: new fields.NumberField({initial: 0, min: 0, max: 40}), armorMax: new fields.NumberField({initial: 0, min: 0, max: 40}), label: new fields.StringField({initial: "Left Leg"}) }),
        rightLeg: new fields.SchemaField({ value: new fields.NumberField({initial: 7, min: 0}), max: new fields.NumberField({initial: 7, min: 0}), mult: new fields.NumberField({initial: 0.75}), armor: new fields.NumberField({initial: 0, min: 0, max: 40}), armorMax: new fields.NumberField({initial: 0, min: 0, max: 40}), label: new fields.StringField({initial: "Right Leg"}) })
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
    const end = this.stats.endurance.value;
    for ( let limb of Object.values(this.limbs) ) {
      limb.max = Math.floor(end * limb.mult);
      limb.value = Math.clamp(limb.value, 0, limb.max);
      limb.armor = Math.clamp(limb.armor, 0, 40);
      limb.armorMax = Math.clamp(limb.armorMax, 0, 40);
    }
    this.stamina.max = Math.floor(end * this.stamina.mult);
    this.stamina.value = Math.clamp(this.stamina.value, 0, this.stamina.max);
    for ( let res of this.customResources ) {
      const statValue = this.stats[res.stat]?.value || 0;
      res.max = Math.floor((statValue * res.mult) + res.bonus);
      res.value = Math.clamp(res.value, 0, res.max);
    }
  }
}

class TAMSWeaponData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      familiarity: new fields.NumberField({initial: 0}),
      isHeavy: new fields.BooleanField({initial: false}),
      isTwoHanded: new fields.BooleanField({initial: false}),
      isLight: new fields.BooleanField({initial: false}),
      isRanged: new fields.BooleanField({initial: false}),
      isThrown: new fields.BooleanField({initial: false}),
      rangedDamage: new fields.NumberField({initial: 0}),
      fireRate: new fields.StringField({initial: "1"}),
      fireRateCustom: new fields.NumberField({initial: 1}),
      special: new fields.StringField({initial: ""}),
      description: new fields.HTMLField({initial: ""})
    };
  }

  get calculatedDamage() {
    // If ranged, damage is player-set and not derived from stats
    if (this.isRanged) return Math.floor(this.rangedDamage || 0);
    const actor = this.parent?.actor;
    if ( !actor ) return 0;
    const str = actor.system.stats.strength.value;
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
      familiarity: new fields.NumberField({initial: 0}),
      upgradePoints: new fields.NumberField({initial: 0}),
      stat: new fields.StringField({initial: "strength"}),
      tags: new fields.StringField({initial: ""}),
      description: new fields.HTMLField({initial: ""})
    };
  }
}

class TAMSAbilityData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      familiarity: new fields.NumberField({initial: 0}),
      upgradePoints: new fields.NumberField({initial: 0}),
      cost: new fields.NumberField({initial: 0, nullable: true}),
      resource: new fields.StringField({initial: "stamina"}),
      isApex: new fields.BooleanField({initial: false}),
      uses: new fields.SchemaField({
        value: new fields.NumberField({initial: 0}),
        max: new fields.NumberField({initial: 0})
      }),
      isAttack: new fields.BooleanField({initial: false}),
      attackStat: new fields.StringField({initial: "strength"}),
      damageStat: new fields.StringField({initial: "strength"}),
      damageMult: new fields.NumberField({initial: 0.5, step: 0.05}),
      damageBonus: new fields.NumberField({initial: 0}),
      multiAttack: new fields.NumberField({initial: 1}),
      tags: new fields.StringField({initial: ""}),
      description: new fields.HTMLField({initial: ""})
    };
  }

  get calculatedDamage() {
    if ( !this.isAttack ) return 0;
    const actor = this.parent?.actor;
    if ( !actor ) return 0;
    const damageStatValue = actor.system.stats[this.damageStat]?.value || 0;
    return Math.floor(damageStatValue * this.damageMult) + this.damageBonus;
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
      position: { width: 650, height: 800 },
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

    const weapons = [];
    const skills = [];
    const abilities = [];

    for (let i of this.document.items) {
      if (i.type === 'weapon') weapons.push(i);
      else if (i.type === 'skill') skills.push(i);
      else if (i.type === 'ability') abilities.push(i);
    }

    context.weapons = weapons;
    context.skills = skills;
    context.abilities = abilities;

    return context;
  }

  async _onItemCreate(event, target) {
    const type = target.dataset.type;
    const itemData = {
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type: type,
      system: {}
    };
    return await this.document.createEmbeddedDocuments("Item", [itemData]);
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
    if (target.type === "number") value = parseInt(value);
    const item = this.document.items.get(itemId);
    if (item) await item.update({ [field]: value });
  }

  async _onRoll(event, target) {
    const dataset = target.dataset;
    const item = dataset.itemId ? this.document.items.get(dataset.itemId) : null;

    let label = dataset.label || '';
    let statValue = parseInt(dataset.statValue) || 100;
    let familiarity = parseInt(dataset.familiarity) || 0;
    let statId = dataset.statId;

    if (item && item.type === 'weapon') {
        const str = this.document.system.stats.strength.value;
        const dex = this.document.system.stats.dexterity.value;
        let usesDex = false;
        if (item.system.isRanged) {
            usesDex = !item.system.isThrown;
        } else {
            usesDex = !!item.system.isLight;
        }
        statValue = usesDex ? dex : str;
        statId = usesDex ? 'dexterity' : 'strength';
        label = `Attacking with ${item.name}`;
    }

    if (item && item.type === 'skill') {
        const name = item.name;
        label = name;
        statId = item.system.stat;
        statValue = this.document.system.stats[statId]?.value || 100;
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
            statValue = this.document.system.stats[statId]?.value || 100;
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
    const cappedResult = Math.min(rawResult, statValue);
    const finalTotal = cappedResult + familiarity;

    let critInfo = "";
    let success = true;
    let resultText = "";
    let resultClass = "";

    if (statId === 'bravery') {
        const targetValue = statValue + familiarity;
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
              <button class="tams-dodge" data-raw="${rawResult}" data-total="${finalTotal}" data-multi="${multiVal}" data-location="${hitLocation}" data-damage="${damage}">Dodge</button>
              <button class="tams-retaliate" data-raw="${rawResult}" data-total="${finalTotal}" data-multi="${multiVal}" data-location="${hitLocation}" data-damage="${damage}">Retaliate</button>
              <button class="tams-behind-toggle" style="background: #444; color: white;">Toggle Behind Attack</button>
            </div>
        `;
    }

    const messageContent = `
      <div class="tams-roll">
        <h3 class="roll-label">${label}</h3>
        ${damageInfo}
        <div class="roll-row"><span>Raw Dice Result:</span><span class="roll-value">${rawResult}</span></div>
        ${statId === 'bravery' ? 
            `<div class="roll-row"><small>Target (Bravery):</small><span>${statValue}${familiarity ? ' + ' + familiarity : ''}</span></div>` :
            `<div class="roll-row"><small>Stat Cap (${statValue}):</small><span>${cappedResult}</span></div>
             <div class="roll-row"><small>Familiarity:</small><span>+${familiarity}</span></div>`
        }
        <hr>
        <div class="roll-total">${statId === 'bravery' ? 'Target to beat' : 'Total'}: <b>${statId === 'bravery' ? (statValue + familiarity) : finalTotal}</b></div>
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
      "bravery": "TAMS.StatBravery"
    };

    if (this.document.type === 'ability' && this.document.actor) {
        const resources = { "stamina": "Stamina" };
        this.document.actor.system.customResources.forEach((res, index) => {
            resources[index.toString()] = res.name;
        });
        context.resourceOptions = resources;
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
  Handlebars.registerHelper('capitalize', function (str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  });
});

Hooks.on("renderChatMessageHTML", (message, html, data) => {
    html.querySelector(".tams-take-damage")?.addEventListener("click", async ev => {
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
              let report = `<b>${target.name}</b> taking damage:<br>`;
              
              const dmgInputs = html.find(".hit-dmg");
              for (let i = 0; i < locations.length; i++) {
                  const loc = locations[i];
                  const limbKey = locationMap[loc];
                  
                  // Use updated armor/HP value if multiple hits to same limb
                  const currentArmor = updates[`system.limbs.${limbKey}.armor`] ?? target.system.limbs[limbKey].armor;
                  const armor = Math.floor(currentArmor || 0);
                  
                  const incoming = Math.floor(parseFloat(dmgInputs[i].value) || 0);
                  const effective = Math.max(0, incoming - armor);
                  
                  const currentHp = updates[`system.limbs.${limbKey}.value`] ?? target.system.limbs[limbKey].value;
                  const newHp = Math.max(0, Math.floor(currentHp) - effective);
                  updates[`system.limbs.${limbKey}.value`] = newHp;
                  
                  if (armor > 0 && effective < incoming) {
                      updates[`system.limbs.${limbKey}.armor`] = Math.max(0, armor - 1);
                      report += `• ${loc}: ${effective} damage (${armor} armor blocked, 1 armor point lost)<br>`;
                  } else {
                      report += `• ${loc}: ${effective} damage (${armor} armor blocked)<br>`;
                  }
              }
              await target.update(updates);
              ChatMessage.create({ content: report });
            }
          }
        },
        default: "apply"
      }).render(true);
    });

    // Dodge action
    html.querySelector('.tams-dodge')?.addEventListener("click", async ev => {
      ev.preventDefault();
      const btn = ev.currentTarget;
      const attackerRaw = parseInt(btn.dataset.raw);
      const attackerTotal = parseInt(btn.dataset.total);
      const attackerMulti = parseInt(btn.dataset.multi) || 1;
      const attackerDamage = parseInt(btn.dataset.damage) || 0;
      const firstLocation = btn.dataset.location;
      const container = btn.closest(".tams-roll");
      const isBehind = container?.classList.contains("behind-attack") || false;
      
      const actor = canvas.tokens.controlled[0]?.actor;
      if (!actor) return ui.notifications.warn('Select a token to Dodge.');
      
      let dexVal = Math.floor(actor.system.stats.dexterity.value || 0);
      if (isBehind) {
          const behindMult = actor.system.behindMult ?? 0.5;
          dexVal = Math.floor(dexVal * behindMult);
      }

      const roll = await new Roll('1d100').evaluate();
      const raw = roll.total;
      const capped = Math.min(raw, dexVal);
      const total = capped;

      let critInfo = "";
      let hitsScored = 0;
      let damageInfo = "";
      let locations = [];

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
                <button class="tams-take-damage" data-damage="${attackerDamage}" data-locations='${JSON.stringify(locations)}'>Apply All Damage</button>
            </div>
          `;

          if (attackerRaw >= (raw * 2)) {
              critInfo = `<div class="tams-crit failure">CRITICAL HIT TAKEN! (Attacker Raw ${attackerRaw} >= 2x Raw ${raw})</div>`;
          } else {
              critInfo = `<div class="tams-failure">Dodge Failed vs Total ${attackerTotal}</div>`;
          }
      } else {
          // Defender wins
          hitsScored = 0;
          if (raw >= (attackerRaw * 2)) {
              critInfo = `<div class="tams-crit success">CRITICAL DODGE! (Total ${total} >= ${attackerTotal} AND Raw ${raw} >= 2x Attacker ${attackerRaw})</div>`;
          } else {
              critInfo = `<div class="tams-success">Dodge Success vs Total ${attackerTotal}</div>`;
          }
      }

      const msg = `
        <div class="tams-roll" data-attacker-raw="${attackerRaw}" data-attacker-total="${attackerTotal}" data-attacker-multi="${attackerMulti}" data-attacker-damage="${attackerDamage}" data-actor-id="${actor.id}" data-raw="${raw}" data-capped="${capped}" data-behind="${isBehind ? '1' : '0'}" data-first-location="${firstLocation}">
          <h3 class="roll-label">Dodge — ${actor.name} ${isBehind ? '(From Behind)' : ''}</h3>
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
    });

    // Boost Dodge action
    html.querySelector('.tams-boost-dodge')?.addEventListener("click", async ev => {
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
                <input type="checkbox" id="unaware"/>
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
                <button class="tams-take-damage" data-damage="${attackerDamage}" data-locations='${JSON.stringify(locations)}'>Apply All Damage</button>
            </div>
          `;

          if (attackerRaw >= (raw * 2)) {
              critInfo = `<div class="tams-crit failure">CRITICAL HIT TAKEN! (Attacker Raw ${attackerRaw} >= 2x Raw ${raw})</div>`;
          } else {
              critInfo = `<div class="tams-failure">Dodge Failed vs Total ${attackerTotal}</div>`;
          }
      } else {
          hitsScored = 0;
          if (raw >= (attackerRaw * 2)) {
              critInfo = `<div class="tams-crit success">CRITICAL DODGE! (Total ${total} >= ${attackerTotal} AND Raw ${raw} >= 2x Attacker ${attackerRaw})</div>`;
          } else {
              critInfo = `<div class="tams-success">Dodge Success vs Total ${attackerTotal}</div>`;
          }
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
    });

    // Retaliate action
    html.querySelector('.tams-retaliate')?.addEventListener("click", async ev => {
      ev.preventDefault();
      const btn = ev.currentTarget;
      const attackerRaw = parseInt(btn.dataset.raw);
      const attackerTotal = parseInt(btn.dataset.total);
      const attackerMulti = parseInt(btn.dataset.multi) || 1;
      const attackerDamage = parseInt(btn.dataset.damage) || 0;
      const firstLocation = btn.dataset.location;
      const container = btn.closest(".tams-roll");
      const isBehind = container?.classList.contains("behind-attack") || false;

      const actor = canvas.tokens.controlled[0]?.actor;
      if (!actor) return ui.notifications.warn('Select a token to Retaliate.');
      const weapons = actor.items.filter(i => i.type === 'weapon');
      if (!weapons.length) return ui.notifications.warn('Selected actor has no weapons.');

      const options = weapons.map(w => `<option value="${w.id}">${w.name} (Fam ${w.system.familiarity||0})</option>`).join('');
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

      let str = actor.system.stats.strength.value;
      let dex = actor.system.stats.dexterity.value;
      
      if (isBehind) {
          const behindMult = actor.system.behindMult ?? 0.5;
          str = Math.floor(str * behindMult);
          dex = Math.floor(dex * behindMult);
      }

      let usesDex = false;
      if (weapon.system.isRanged) {
          usesDex = !weapon.system.isThrown;
      } else {
          usesDex = !!weapon.system.isLight;
      }
      const cap = usesDex ? dex : str;
      const fam = Math.floor(weapon.system.familiarity || 0);
      const roll = await new Roll('1d100').evaluate();
      const raw = roll.total;
      const capped = Math.min(raw, cap);
      const total = capped + fam;

      let critInfo = "";
      let hitsScoredCounter = 0;
      let counterDamageInfo = "";
      let counterLocations = [];

      let defenseDamageInfo = "";
      let defenseLocations = [];

      // Check defender success/failure against incoming attack
      if (attackerTotal > total) {
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
          if (attackerRaw >= (raw * 2)) {
              critInfo = `<div class="tams-crit failure">CRITICAL HIT TAKEN! (Attacker Raw ${attackerRaw} >= 2x Raw ${raw})</div>`;
          } else {
              critInfo = `<div class="tams-failure">Retaliate Failed vs Total ${attackerTotal}</div>`;
          }
      } else {
          if (raw >= (attackerRaw * 2)) {
              critInfo = `<div class="tams-crit success">CRITICAL RETALIATION! (Total ${total} >= ${attackerTotal} AND Raw ${raw} >= 2x Attacker ${attackerRaw})</div>`;
          } else {
              critInfo = `<div class="tams-success">Retaliate Success vs Total ${attackerTotal}</div>`;
          }
      }

      let hitLocation = await getHitLocation(raw);
      const damage = weapon.system.calculatedDamage;

      let multiVal = 1;
      if (weapon.system.isRanged) {
          if (weapon.system.fireRate === '3') multiVal = 3;
          else if (weapon.system.fireRate === 'auto') multiVal = 10;
          else if (weapon.system.fireRate === 'custom') multiVal = weapon.system.fireRateCustom || 1;
      }

      const msg = `
        <div class="tams-roll" data-attacker-raw="${raw}" data-attacker-total="${total}" data-attacker-multi="${multiVal}">
          <h3 class="roll-label">Retaliation — ${actor.name} with ${weapon.name} ${isBehind ? '(From Behind)' : ''}</h3>
          
          ${defenseDamageInfo}
          <hr>
          
          <div class="roll-row"><b>Damage: ${damage}</b></div>
          <div class="roll-row"><b>Hit Location: ${hitLocation}</b></div>
          <div class="roll-row"><b>Max Hits: ${multiVal}</b></div>
          <div class="roll-row" style="gap:6px; flex-wrap: wrap;">
            <button class="tams-take-damage" data-damage="${damage}" data-location="${hitLocation}">Apply Damage</button>
            <button class="tams-dodge" data-raw="${raw}" data-total="${total}" data-multi="${multiVal}" data-location="${hitLocation}" data-damage="${damage}">Dodge</button>
            <button class="tams-retaliate" data-raw="${raw}" data-total="${total}" data-multi="${multiVal}" data-location="${hitLocation}" data-damage="${damage}">Retaliate</button>
            <button class="tams-behind-toggle" style="background: #444; color: white;">Toggle Behind Attack</button>
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
    });

    // Behind toggle action
    html.querySelector('.tams-behind-toggle')?.addEventListener("click", async ev => {
        ev.preventDefault();
        const btn = ev.currentTarget;
        const container = btn.closest(".tams-roll");
        container.classList.toggle("behind-attack");
        if (container.classList.contains("behind-attack")) {
            btn.innerText = "Behind Attack: ON";
            btn.style.background = "#2e7d32";
        } else {
            btn.innerText = "Toggle Behind Attack";
            btn.style.background = "#444";
        }
    });
});
