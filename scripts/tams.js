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
        head: new fields.SchemaField({ value: new fields.NumberField({initial: 5}), max: new fields.NumberField({initial: 5}), mult: new fields.NumberField({initial: 0.5}), armor: new fields.NumberField({initial: 0}), label: new fields.StringField({initial: "Head"}) }),
        thorax: new fields.SchemaField({ value: new fields.NumberField({initial: 10}), max: new fields.NumberField({initial: 10}), mult: new fields.NumberField({initial: 1.0}), armor: new fields.NumberField({initial: 0}), label: new fields.StringField({initial: "Thorax"}) }),
        stomach: new fields.SchemaField({ value: new fields.NumberField({initial: 7}), max: new fields.NumberField({initial: 7}), mult: new fields.NumberField({initial: 0.75}), armor: new fields.NumberField({initial: 0}), label: new fields.StringField({initial: "Stomach"}) }),
        leftArm: new fields.SchemaField({ value: new fields.NumberField({initial: 7}), max: new fields.NumberField({initial: 7}), mult: new fields.NumberField({initial: 0.75}), armor: new fields.NumberField({initial: 0}), label: new fields.StringField({initial: "Left Arm"}) }),
        rightArm: new fields.SchemaField({ value: new fields.NumberField({initial: 7}), max: new fields.NumberField({initial: 7}), mult: new fields.NumberField({initial: 0.75}), armor: new fields.NumberField({initial: 0}), label: new fields.StringField({initial: "Right Arm"}) }),
        leftLeg: new fields.SchemaField({ value: new fields.NumberField({initial: 7}), max: new fields.NumberField({initial: 7}), mult: new fields.NumberField({initial: 0.75}), armor: new fields.NumberField({initial: 0}), label: new fields.StringField({initial: "Left Leg"}) }),
        rightLeg: new fields.SchemaField({ value: new fields.NumberField({initial: 7}), max: new fields.NumberField({initial: 7}), mult: new fields.NumberField({initial: 0.75}), armor: new fields.NumberField({initial: 0}), label: new fields.StringField({initial: "Right Leg"}) })
      }),
      stamina: new fields.SchemaField({
        value: new fields.NumberField({initial: 10}),
        max: new fields.NumberField({initial: 10}),
        mult: new fields.NumberField({initial: 1.0})
      }),
      customResources: new fields.ArrayField(new fields.SchemaField({
        name: new fields.StringField({initial: "New Resource"}),
        value: new fields.NumberField({initial: 0}),
        max: new fields.NumberField({initial: 0}),
        stat: new fields.StringField({initial: "endurance"}),
        mult: new fields.NumberField({initial: 1.0}),
        bonus: new fields.NumberField({initial: 0})
      })),
      theme: new fields.StringField({initial: "default"}),
      physicalNotes: new fields.StringField({initial: ""}),
      traits: new fields.StringField({initial: ""}),
      description: new fields.HTMLField({initial: ""}),
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
    }
    this.stamina.max = Math.floor(end * this.stamina.mult);
    for ( let res of this.customResources ) {
      const statValue = this.stats[res.stat]?.value || 0;
      res.max = Math.floor((statValue * res.mult) + res.bonus);
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
class TAMSActorSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["tams", "sheet", "actor"],
      template: "systems/tams/templates/actor-sheet.html",
      width: 650,
      height: 800,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "stats" }]
    });
  }

  async getData(options) {
    const context = await super.getData(options);
    context.actor = this.actor;
    context.system = this.actor.system;
    context.owner = this.actor.isOwner;
    context.editable = this.editable;

    context.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(this.actor.system.description || "", {
      async: true,
      secrets: this.actor.isOwner,
      relativeTo: this.actor
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

    for (let i of this.actor.items) {
      if (i.type === 'weapon') weapons.push(i);
      else if (i.type === 'skill') skills.push(i);
      else if (i.type === 'ability') abilities.push(i);
    }

    context.weapons = weapons;
    context.skills = skills;
    context.abilities = abilities;

    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    if (!this.options.editable) return;

    html.find('.item-create').click(this._onItemCreate.bind(this));
    html.find('.item-edit').click(ev => {
      ev.preventDefault();
      const li = ev.currentTarget.closest(".item");
      const item = this.actor.items.get(li.dataset.itemId);
      if (item) item.sheet.render(true);
    });
    html.find('.item-delete').click(ev => {
      ev.preventDefault();
      const li = ev.currentTarget.closest(".item");
      const item = this.actor.items.get(li.dataset.itemId);
      if (item) item.delete();
    });
    html.find('.rollable').click(this._onRoll.bind(this));
    html.find('.resource-add').click(this._onResourceAdd.bind(this));
    html.find('.resource-delete').click(this._onResourceDelete.bind(this));
  }

  async _onItemCreate(event) {
    event.preventDefault();
    const type = event.currentTarget.dataset.type;
    const itemData = {
      name: `New ${type.capitalize()}`,
      type: type,
      system: {}
    };
    return await this.actor.createEmbeddedDocuments("Item", [itemData]);
  }

  async _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const item = dataset.itemId ? this.actor.items.get(dataset.itemId) : null;

    let label = dataset.label ? `Rolling ${dataset.label}` : '';
    let statValue = parseInt(dataset.statValue) || 100;
    let familiarity = parseInt(dataset.familiarity) || 0;

    if (item && item.type === 'weapon') {
        const str = this.actor.system.stats.strength.value;
        const dex = this.actor.system.stats.dexterity.value;
        let usesDex = false;
        if (item.system.isRanged) {
            usesDex = !item.system.isThrown;
        } else {
            usesDex = !!item.system.isLight;
        }
        statValue = usesDex ? dex : str;
        label = `Attacking with ${item.name}`;
    }

    if (item && item.type === 'skill') {
        const name = item.name;
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
            statValue = this.actor.system.stats[item.system.attackStat]?.value || 100;
            label = `Using Ability: ${item.name}`;
        }
        const cost = parseInt(item.system.cost) || 0;
        if (!item.system.isApex && cost > 0) {
            const resourceKey = item.system.resource;
            if (resourceKey === 'stamina') {
                const current = this.actor.system.stamina.value;
                if (current < cost) return ui.notifications.warn("Not enough Stamina!");
                await this.actor.update({"system.stamina.value": current - cost});
            } else {
                const idx = parseInt(resourceKey);
                const res = this.actor.system.customResources[idx];
                if (res) {
                    if (res.value < cost) return ui.notifications.warn(`Not enough ${res.name}!`);
                    const resources = foundry.utils.duplicate(this.actor.system.customResources);
                    resources[idx].value -= cost;
                    await this.actor.update({"system.customResources": resources});
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
    if (difficulty > 0) {
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
        let hitLocation = "";
        if (rawResult >= 96) hitLocation = "Head";
        else if (rawResult >= 56) hitLocation = "Thorax";
        else if (rawResult >= 41) hitLocation = "Stomach";
        else if (rawResult >= 31) hitLocation = "Left Arm";
        else if (rawResult >= 21) hitLocation = "Right Arm";
        else if (rawResult >= 11) hitLocation = "Left Leg";
        else hitLocation = "Right Leg";

        damageInfo = `
            <div class="roll-row"><b>Damage: ${damage}</b></div>
            <div class="roll-row"><b>Hit Location: ${hitLocation}</b></div>
            <div class="roll-row" style="gap:6px;">
              <button class="tams-take-damage" data-damage="${damage}" data-location="${hitLocation}">Apply Damage</button>
              <button class="tams-dodge" data-raw="${rawResult}">Dodge</button>
              <button class="tams-retaliate">Retaliate</button>
            </div>
        `;
    }

    const messageContent = `
      <div class="tams-roll">
        <h3 class="roll-label">${label}</h3>
        ${damageInfo}
        <div class="roll-row"><span>Raw Dice Result:</span><span class="roll-value">${rawResult}</span></div>
        <div class="roll-row"><small>Stat Cap (${statValue}):</small><span>${cappedResult}</span></div>
        <div class="roll-row"><small>Familiarity:</small><span>+${familiarity}</span></div>
        <hr>
        <div class="roll-total">Total: <b>${finalTotal}</b></div>
        ${critInfo}
        <div class="roll-contest-hint">
            <br><small><b>Crit Check (Contested):</b> Attacker Raw Dice (${rawResult}) vs 2x Defender Raw Dice.</small>
            <br><small><b>Crit Check (Static):</b> Total (${finalTotal}) vs 2x Difficulty.</small>
        </div>
      </div>
    `;

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: messageContent,
      rolls: [roll],
      type: CONST.CHAT_MESSAGE_TYPES.ROLL
    });
  }

  async _onResourceAdd(event) {
    event.preventDefault();
    const resources = [...(this.actor.system.customResources || [])];
    resources.push({ name: "New Resource", value: 0, max: 0, stat: "endurance", mult: 1.0, bonus: 0 });
    return this.actor.update({"system.customResources": resources});
  }

  async _onResourceDelete(event) {
    event.preventDefault();
    const index = event.currentTarget.dataset.index;
    const resources = [...(this.actor.system.customResources || [])];
    resources.splice(index, 1);
    return this.actor.update({"system.customResources": resources});
  }
}

class TAMSItemSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["tams", "sheet", "item"],
      template: "systems/tams/templates/item-sheet.html",
      width: 500,
      height: 700
    });
  }

  async getData(options) {
    const context = await super.getData(options);
    context.item = this.item;
    context.system = this.item.system;
    context.actor = this.item.actor;
    context.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(this.item.system.description || "", {
      async: true,
      secrets: this.item.isOwner,
      relativeTo: this.item
    });

    context.statOptions = {
      "strength": "TAMS.StatStrength",
      "dexterity": "TAMS.StatDexterity",
      "endurance": "TAMS.StatEndurance",
      "wisdom": "TAMS.StatWisdom",
      "intelligence": "TAMS.StatIntelligence",
      "bravery": "TAMS.StatBravery"
    };

    if (this.item.type === 'ability' && this.item.actor) {
        const resources = { "stamina": "Stamina" };
        this.item.actor.system.customResources.forEach((res, index) => {
            resources[index.toString()] = res.name;
        });
        context.resourceOptions = resources;
    }
    context.owner = this.item.isOwner;
    context.editable = this.editable;
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

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("tams", TAMSActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("tams", TAMSItemSheet, { makeDefault: true });

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

Hooks.on("renderChatMessage", (message, html, data) => {
    html.find(".tams-take-damage").click(async ev => {
      ev.preventDefault();
      const btn = ev.currentTarget;
      const damage = parseInt(btn.dataset.damage);
      const location = btn.dataset.location;
      
      const target = canvas.tokens.controlled[0]?.actor;
      if (!target) return ui.notifications.warn("Please select a token to apply damage to.");

      const locationMap = {
        "Head": "head", "Thorax": "thorax", "Stomach": "stomach",
        "Left Arm": "leftArm", "Right Arm": "rightArm",
        "Left Leg": "leftLeg", "Right Leg": "rightLeg"
      };
      const limbKey = locationMap[location];
      const limb = target.system.limbs[limbKey];
      const armor = Math.floor(limb.armor || 0);

      new Dialog({
        title: `Apply Damage to ${target.name}`,
        content: `
          <div class=\"form-group\"><label>Incoming Damage:</label><input type=\"number\" id=\"dmg\" value=\"${damage}\"/></div>
          <div class=\"form-group\"><label>Location:</label><span>${location} (Armor: ${armor})</span></div>
        `,
        buttons: {
          apply: { label: "Apply", callback: async (html) => {
              const finalDmg = Math.floor(parseFloat(html.find("#dmg").val()) || 0);
              const effectiveDmg = Math.max(0, finalDmg - armor);
              const newHp = Math.max(0, Math.floor(limb.value) - effectiveDmg);
              await target.update({[`system.limbs.${limbKey}.value`]: newHp});
              ChatMessage.create({ content: `<b>${target.name}</b> took ${effectiveDmg} damage to the ${location} (${armor} armor blocked).` });
            }
          }
        },
        default: "apply"
      }).render(true);
    });

    // Dodge action
    html.find('.tams-dodge').click(async ev => {
      ev.preventDefault();
      const actor = canvas.tokens.controlled[0]?.actor;
      if (!actor) return ui.notifications.warn('Select a token to Dodge.');
      const statValue = Math.floor(actor.system.specialSkills.dodge.value || 0);
      const roll = await new Roll('1d100').evaluate();
      const raw = roll.total;
      const capped = Math.min(raw, statValue);
      const total = capped; // no familiarity for special skill
      const msg = `
        <div class="tams-roll">
          <h3 class="roll-label">Dodge — ${actor.name}</h3>
          <div class="roll-row"><span>Raw Dice Result:</span><span class="roll-value">${raw}</span></div>
          <div class="roll-row"><small>Stat Cap (${statValue}):</small><span>${capped}</span></div>
          <hr>
          <div class="roll-total">Total: <b>${total}</b></div>
          <div class="roll-contest-hint"><small>Use Raw Dice to check crit (Attacker vs Defender).</small></div>
        </div>`;
      ChatMessage.create({ speaker: ChatMessage.getSpeaker({actor}), content: msg, rolls: [roll], type: CONST.CHAT_MESSAGE_TYPES.ROLL });
    });

    // Retaliate action
    html.find('.tams-retaliate').click(async ev => {
      ev.preventDefault();
      const actor = canvas.tokens.controlled[0]?.actor;
      if (!actor) return ui.notifications.warn('Select a token to Retaliate.');
      const weapons = actor.items.filter(i => i.type === 'weapon');
      if (!weapons.length) return ui.notifications.warn('Selected actor has no weapons.');

      const options = weapons.map(w => `<option value="${w.id}">${w.name} (Fam ${w.system.familiarity||0})</option>`).join('');
      let chosenId = await new Promise(resolve => {
        new Dialog({
          title: 'Choose Weapon to Retaliate',
          content: `<div class=\"form-group\"><label>Weapon</label><select id=\"ret-weapon\">${options}</select></div>`,
          buttons: { go: { label: 'Roll', callback: html => resolve(html.find('#ret-weapon').val()) } },
          default: 'go'
        }).render(true);
      });
      const weapon = actor.items.get(chosenId);
      if (!weapon) return;

      const str = actor.system.stats.strength.value;
      const dex = actor.system.stats.dexterity.value;
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

      let hitLocation = '';
      if (raw >= 96) hitLocation = 'Head';
      else if (raw >= 56) hitLocation = 'Thorax';
      else if (raw >= 41) hitLocation = 'Stomach';
      else if (raw >= 31) hitLocation = 'Left Arm';
      else if (raw >= 21) hitLocation = 'Right Arm';
      else if (raw >= 11) hitLocation = 'Left Leg';
      else hitLocation = 'Right Leg';
      const damage = weapon.system.calculatedDamage;

      const msg = `
        <div class="tams-roll">
          <h3 class="roll-label">Retaliation — ${actor.name} with ${weapon.name}</h3>
          <div class="roll-row"><b>Damage: ${damage}</b></div>
          <div class="roll-row"><b>Hit Location: ${hitLocation}</b></div>
          <div class="roll-row" style="gap:6px;">
            <button class="tams-take-damage" data-damage="${damage}" data-location="${hitLocation}">Apply Damage</button>
          </div>
          <div class="roll-row"><span>Raw Dice Result:</span><span class="roll-value">${raw}</span></div>
          <div class="roll-row"><small>Stat Cap (${cap}):</small><span>${capped}</span></div>
          <div class="roll-row"><small>Familiarity:</small><span>+${fam}</span></div>
          <hr>
          <div class="roll-total">Total: <b>${total}</b></div>
          <div class="roll-contest-hint"><small>Use Raw Dice to check crit (Attacker doubles Defender).</small></div>
        </div>`;
      ChatMessage.create({ speaker: ChatMessage.getSpeaker({actor}), content: msg, rolls: [roll], type: CONST.CHAT_MESSAGE_TYPES.ROLL });
    });
});
