/**
 * Extend the base Actor document to calculate derived values
 * @extends {Actor}
 */
class TAMSActor extends Actor {
  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    const system = this.system;

    // Calculate limb max HP based on Endurance
    const end = system.stats.endurance.value;
    const str = system.stats.strength.value;

    for (let [id, limb] of Object.entries(system.limbs)) {
      limb.max = Math.floor(end * limb.mult);
    }

    // Calculate stamina max
    system.stamina.max = Math.floor(end * system.stamina.mult);

    // Calculate custom resources max
    for (let res of (system.customResources || [])) {
       const statValue = system.stats[res.stat]?.value || 0;
       res.max = Math.floor(statValue * res.mult) + (res.bonus || 0);
    }

    // Calculate Weapon & Ability Damage
    for (let item of this.items) {
      if (item.type === 'weapon') {
        let mult = 0.5;
        const tags = (item.system.tags || "").toLowerCase();
        if (tags.includes("heavy")) mult += 0.25;
        if (tags.includes("two handed") || tags.includes("two-handed")) mult += 0.25;
        
        item.system.calculatedDamage = Math.floor(str * mult);
      } else if (item.type === 'ability' && item.system.isAttack) {
        const damageStatValue = system.stats[item.system.damageStat]?.value || 0;
        const mult = item.system.damageMult || 0;
        const bonus = item.system.damageBonus || 0;
        item.system.calculatedDamage = Math.floor(damageStatValue * mult) + bonus;
      }
    }
  }
}

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
class TAMSActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["tams", "sheet", "actor"],
      template: "systems/tams/templates/actor-sheet.html",
      width: 650,
      height: 800,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "stats" }]
    });
  }

  /** @override */
  getData() {
    const context = super.getData();
    const actorData = this.actor.toObject(false);

    context.actor = actorData;
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Set owner and editable for the editor helper
    context.owner = this.actor.isOwner;
    context.editable = this.editable;

    // Prepare items
    this._prepareItems(context);

    return context;
  }

  _prepareItems(context) {
    const weapons = [];
    const skills = [];
    const abilities = [];

    for (let i of context.items) {
      i.img = i.img || 'icons/svg/item-bag.svg';
      if (i.type === 'weapon') weapons.push(i);
      else if (i.type === 'skill') skills.push(i);
      else if (i.type === 'ability') abilities.push(i);
    }

    context.weapons = weapons;
    context.skills = skills;
    context.abilities = abilities;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
    });

    // Rollable elements
    html.find('.rollable').click(this._onRoll.bind(this));

    // Resource Management
    html.find('.resource-add').click(this._onResourceAdd.bind(this));
    html.find('.resource-delete').click(this._onResourceDelete.bind(this));
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;
    const itemData = {
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type: type,
      system: {}
    };
    return await this.actor.createEmbeddedDocuments("Item", [itemData]);
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const item = dataset.itemId ? this.actor.items.get(dataset.itemId) : null;

    let label = dataset.label ? `Rolling ${dataset.label}` : '';
    let statValue = parseInt(dataset.statValue) || 100;
    let familiarity = parseInt(dataset.familiarity) || 0;

    // Logic for Weapons
    if (item && item.type === 'weapon') {
        const tags = (item.system.tags || "").toLowerCase();
        const str = this.actor.system.stats.strength.value;
        const dex = this.actor.system.stats.dexterity.value;
        // Light weapons can use Dex for the cap
        statValue = tags.includes("light") ? dex : str;
        label = `Attacking with ${item.name}`;
    }

    // Logic for Skills with specifiers: Type(Specifier)
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

    // Logic for Abilities: Subtract Cost & Attack Config
    if (item && item.type === 'ability') {
        if (item.system.isAttack) {
            statValue = this.actor.system.stats[item.system.attackStat]?.value || 100;
            label = `Using Ability: ${item.name}`;
        }

        const cost = parseInt(item.system.cost) || 0;
        if (!item.system.isApex && cost > 0) {
            const resourceKey = item.system.resource; // 'stamina' or index of customResources
            if (resourceKey === 'stamina') {
                const current = this.actor.system.stamina.value;
                if (current < cost) return ui.notifications.warn("Not enough Stamina!");
                await this.actor.update({"system.stamina.value": current - cost});
            } else {
                const idx = parseInt(resourceKey);
                const res = this.actor.system.customResources[idx];
                if (res) {
                    if (res.value < cost) return ui.notifications.warn(`Not enough ${res.name}!`);
                    const resources = duplicate(this.actor.system.customResources);
                    resources[idx].value -= cost;
                    await this.actor.update({"system.customResources": resources});
                }
            }
        }
    }

    // Shift-click to enter a Difficulty or Target Result
    let difficulty = 0;
    if (event.shiftKey) {
        const d = await new Promise(resolve => {
            new Dialog({
                title: "Roll Parameters",
                content: `<div class="form-group"><label>Difficulty / Target Result</label><input type="number" id="diff" value="0"/></div>`,
                buttons: {
                    roll: {
                        label: "Roll",
                        callback: (html) => resolve(parseInt(html.find("#diff").val()) || 0)
                    }
                },
                default: "roll"
            }).render(true);
        });
        difficulty = d;
    }

    // Core mechanic: 1d100, result capped by stat, then add familiarity
    let roll = await new Roll("1d100").evaluate({async: true});
    let rawResult = roll.total;
    let cappedResult = Math.min(rawResult, statValue);
    let finalTotal = cappedResult + familiarity;

    // Crit Logic:
    // 1. Vs Difficulty: Crit if finalTotal >= 2 * difficulty
    // 2. Contested: Attacker Dice vs Defender Dice comparison (shown in chat)
    
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

    // Show Damage if it's an attack
    let damageInfo = "";
    let hitLocation = "";
    if (item && (item.type === 'weapon' || (item.type === 'ability' && item.system.isAttack))) {
        damageInfo = `<div class="roll-row"><b>Damage: ${item.system.calculatedDamage}</b></div>`;
        
        // Hit Location Logic
        if (rawResult >= 96) hitLocation = "Head";
        else if (rawResult >= 56) hitLocation = "Thorax";
        else if (rawResult >= 41) hitLocation = "Stomach";
        else if (rawResult >= 31) hitLocation = "Left Arm";
        else if (rawResult >= 21) hitLocation = "Right Arm";
        else if (rawResult >= 11) hitLocation = "Left Leg";
        else hitLocation = "Right Leg";

        damageInfo += `<div class="roll-row"><b>Hit Location: ${hitLocation}</b></div>`;
        damageInfo += `<button class="tams-take-damage" data-damage="${item.system.calculatedDamage}" data-location="${hitLocation}">Apply Damage</button>`;
    }

    let messageContent = `
      <div class="tams-roll">
        <h3 class="roll-label">${label}</h3>
        ${damageInfo}
        <div class="roll-row">
            <span>Raw Dice Result:</span>
            <span class="roll-value">${rawResult}</span>
        </div>
        <div class="roll-row">
            <small>Stat Cap (${statValue}):</small>
            <span>${cappedResult}</span>
        </div>
        <div class="roll-row">
            <small>Familiarity:</small>
            <span>+${familiarity}</span>
        </div>
        <hr>
        <div class="roll-total">
            Total: <b>${finalTotal}</b>
        </div>
        ${critInfo}
        <div class="roll-contest-hint">
            <br><small><b>Crit Check (Contested):</b> Attacker Raw Dice (${rawResult}) vs 2x Defender Raw Dice.</small>
            <br><small><b>Crit Check (Static):</b> Total (${finalTotal}) vs 2x Difficulty.</small>
        </div>
      </div>
    `;

    ChatMessage.create({
      user: game.user._id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: messageContent,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      roll: roll
    });
  }

  async _onResourceAdd(event) {
    event.preventDefault();
    const resources = this.actor.system.customResources || [];
    resources.push({
      name: "New Resource",
      value: 0,
      max: 0,
      stat: "endurance",
      mult: 1.0,
      bonus: 0
    });
    return this.actor.update({"system.customResources": resources});
  }

  async _onResourceDelete(event) {
    event.preventDefault();
    const index = event.currentTarget.dataset.index;
    const resources = this.actor.system.customResources || [];
    resources.splice(index, 1);
    return this.actor.update({"system.customResources": resources});
  }
}

class TAMSItemSheet extends ItemSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["tams", "sheet", "item"],
      template: "systems/tams/templates/item-sheet.html",
      width: 500,
      height: 600
    });
  }

  /** @override */
  getData() {
    const context = super.getData();
    const itemData = this.item.toObject(false);

    context.item = itemData;
    context.system = itemData.system;
    context.flags = itemData.flags;

    // Set owner and editable for the editor helper
    context.owner = this.item.isOwner;
    context.editable = this.editable;

    return context;
  }
}

Hooks.once("init", async function() {
  console.log("TAMS | Initializing Todo's Advanced Modular System");

  CONFIG.Actor.documentClass = TAMSActor;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("tams", TAMSActorSheet, { makeDefault: true });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("tams", TAMSItemSheet, { makeDefault: true });

  // Chat Button Listener
  Hooks.on("renderChatMessage", (message, html, data) => {
    html.find(".tams-take-damage").click(async ev => {
      ev.preventDefault();
      const btn = ev.currentTarget;
      const damage = parseInt(btn.dataset.damage);
      const location = btn.dataset.location;
      
      // Get the controlled actor (the target)
      const target = canvas.tokens.controlled[0]?.actor;
      if (!target) return ui.notifications.warn("Please select a token to apply damage to.");

      // Map location string to system key
      const locationMap = {
        "Head": "head",
        "Thorax": "thorax",
        "Stomach": "stomach",
        "Left Arm": "leftArm",
        "Right Arm": "rightArm",
        "Left Leg": "leftLeg",
        "Right Leg": "rightLeg"
      };
      const limbKey = locationMap[location];
      const limb = target.system.limbs[limbKey];
      const armor = limb.armor || 0;

      // Ask for confirmation/adjustment
      new Dialog({
        title: `Apply Damage to ${target.name}`,
        content: `
          <div class="form-group">
            <label>Incoming Damage:</label>
            <input type="number" id="dmg" value="${damage}"/>
          </div>
          <div class="form-group">
            <label>Location:</label>
            <span>${location} (Armor: ${armor})</span>
          </div>
        `,
        buttons: {
          apply: {
            label: "Apply",
            callback: async (html) => {
              const finalDmg = parseInt(html.find("#dmg").val());
              const effectiveDmg = Math.max(0, finalDmg - armor);
              const newHp = Math.max(0, limb.value - effectiveDmg);
              
              const updateData = {};
              updateData[`system.limbs.${limbKey}.value`] = newHp;
              await target.update(updateData);
              
              ChatMessage.create({
                content: `<b>${target.name}</b> took ${effectiveDmg} damage to the ${location} (${armor} armor blocked).`
              });
            }
          }
        },
        default: "apply"
      }).render(true);
    });
  });
});
