import { tamsUpdateMessage, tamsHandleItemTransfer, getHitLocation, showCombinedInjuryDialog } from '../utils/helpers.js';

/**
 * The TAMS Actor Sheet Application.
 * Extends the ActorSheetV2 class introduced in Foundry V12.
 */
export class TAMSActorSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
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
        itemCreate: TAMSActorSheet.prototype._onItemCreate,
        itemEdit: TAMSActorSheet.prototype._onItemEdit,
        itemDelete: TAMSActorSheet.prototype._onItemDelete,
        roll: TAMSActorSheet.prototype._onRoll,
        resourceAdd: TAMSActorSheet.prototype._onResourceAdd,
        resourceDelete: TAMSActorSheet.prototype._onResourceDelete,
        itemUseCharge: TAMSActorSheet.prototype._onItemUseCharge,
        itemRecharge: TAMSActorSheet.prototype._onItemRecharge,
        setTab: TAMSActorSheet.prototype._onSetTab,
        updateItemField: TAMSActorSheet.prototype._onUpdateItemField,
        editImage: TAMSActorSheet.prototype._onEditImage,
        fullHeal: TAMSActorSheet.prototype._onFullHeal,
        itemGive: TAMSActorSheet.prototype._onItemGive,
        itemExport: TAMSActorSheet.prototype._onItemExport,
        toggleLimbMultipliers: TAMSActorSheet.prototype._onToggleLimbMultipliers
      }
    }, { inplace: false });
  }

  /** @override */
  get title() {
    const actor = this.document;
    const isUnlinkedToken = actor.isToken && !actor.token?.actorLink;
    return isUnlinkedToken ? `[Token] ${actor.name}` : actor.name;
  }

  static PARTS = {
    form: {
      template: "systems/tams/templates/actor-sheet.html"
    }
  };

  /** @override */
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

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    this._activeTab ??= "stats";

    // Base context properties
    context.actor = this.document;
    context.system = this.document.system;
    context.activeTab = this._activeTab;
    context.editable = this.isEditable;
    context.owner = this.document.isOwner;

    // Collapsible state
    if (this._limbMultipliersCollapsed === undefined) this._limbMultipliersCollapsed = true;
    context.limbMultipliersCollapsed = this._limbMultipliersCollapsed;

    // Derived context data
    this._preparePercentages(context);
    this._prepareItemCollections(context);
    this._prepareSelectOptions(context);
    this._prepareCurrencyData(context);
    this._prepareLimbArmorOptions(context);

    return context;
  }

  /**
   * Calculate percentage values for bars and resources.
   * @param {object} context The context object to modify.
   * @protected
   */
  _preparePercentages(context) {
    const system = this.document.system;
    context.staminaPercentage = Math.clamp((system.stamina.value / (system.stamina.max || 1)) * 100, 0, 100);
    context.hpPercentage = Math.clamp((system.hp.value / (system.hp.max || 1)) * 100, 0, 100);
    context.capacityPercentage = Math.clamp((system.inventory.usedCapacity / (system.inventory.maxCapacity || 1)) * 100, 0, 100);

    context.customResourceData = system.customResources.map(res => {
      return {
        ...res,
        percentage: Math.clamp((res.value / (res.max || 1)) * 100, 0, 100)
      };
    });
  }

  /**
   * Prepare item collections and groupings for the sheet.
   * @param {object} context The context object to modify.
   * @protected
   */
  _prepareItemCollections(context) {
    const weapons = [];
    const equippedWeapons = [];
    const skills = [];
    const abilities = [];
    const inventoryArmor = [];
    const inventoryConsumables = [];
    const inventoryTools = [];
    const inventoryQuestItems = [];
    const inventoryMisc = [];
    const inventoryWeapons = [];
    const inventoryBackpacks = [];
    const traits = [];
    const allItems = [];

    const hasBackpack = !!this.document.system.inventory.hasBackpack;

    for (let i of this.document.items) {
      let isGreyedOut = false;
      if (i.system.location === "backpack") {
        isGreyedOut = !hasBackpack;
      } else if (i.system.location && i.system.location !== "stowed" && i.system.location !== "hand") {
        const container = this.document.items.get(i.system.location);
        if (container && container.type === "backpack") {
          isGreyedOut = !container.system.equipped;
        }
      }

      const itemData = {
        id: i.id,
        uuid: i.uuid,
        name: i.name,
        img: i.img,
        system: i.system,
        type: i.type,
        isGreyedOut: isGreyedOut,
        isEquipped: (i.type === 'weapon' && i.system.location === 'hand') || (['armor', 'backpack'].includes(i.type) && i.system.equipped)
      };

      allItems.push(itemData);

      if (i.type === 'weapon') {
        weapons.push(itemData);
        if (i.system.location === 'hand') equippedWeapons.push(itemData);
        else inventoryWeapons.push(itemData);
      }
      else if (i.type === 'skill') skills.push(itemData);
      else if (i.type === 'ability') abilities.push(itemData);
      else if (i.type === 'armor') inventoryArmor.push(itemData);
      else if (i.type === 'consumable') inventoryConsumables.push(itemData);
      else if (i.type === 'tool') inventoryTools.push(itemData);
      else if (i.type === 'questItem') inventoryQuestItems.push(itemData);
      else if (i.type === 'backpack') inventoryBackpacks.push(itemData);
      else if (i.type === 'trait') traits.push(itemData);
      else if (i.type === 'equipment') inventoryMisc.push(itemData);
    }

    // --- Unified Inventory Grouping ---
    const equippedSection = { id: "hand", label: "Equipped / In Hand", items: [], type: "status" };
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
    const stowedSection = { id: "stowed", label: "Loose / Stowed", items: [], type: "status" };

    for (const item of allItems) {
      if (["skill", "ability", "trait"].includes(item.type)) continue;
      if (item.isEquipped && item.type !== 'backpack') {
        equippedSection.items.push(item);
      } else if (item.system.location && item.system.location !== "stowed" && item.system.location !== "hand") {
        let loc = item.system.location;
        if (loc === "backpack") {
          const firstBP = inventoryBackpacks.find(bp => bp.system.equipped);
          if (firstBP && containerSectionMap[firstBP.id]) containerSectionMap[firstBP.id].items.push(item);
          else stowedSection.items.push(item);
        } else if (containerSectionMap[loc]) {
          containerSectionMap[loc].items.push(item);
        } else {
          stowedSection.items.push(item);
        }
      } else if (item.type !== 'backpack') {
        stowedSection.items.push(item);
      }
    }

    const rawSections = [equippedSection, ...Object.values(containerSectionMap), stowedSection];
    const typeLabels = { weapon: "Weapons", armor: "Armor", consumable: "Consumables", tool: "Tools", questItem: "Quest Items", equipment: "Miscellaneous" };
    const typeOrder = ["Weapons", "Armor", "Consumables", "Tools", "Quest Items", "Miscellaneous"];

    for (const s of rawSections) {
      const groups = {};
      for (const item of s.items) {
        const label = typeLabels[item.type] || "Other";
        if (!groups[label]) groups[label] = { label, items: [] };
        groups[label].items.push(item);
      }
      s.categories = Object.values(groups).sort((a, b) => {
        let indexA = typeOrder.indexOf(a.label);
        let indexB = typeOrder.indexOf(b.label);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      });
    }

    context.inventorySections = rawSections.filter(s => s.items.length > 0 || s.type === "container");
    context.weapons = weapons;
    context.inventoryWeapons = inventoryWeapons;
    context.inventoryArmor = inventoryArmor;
    context.inventoryConsumables = inventoryConsumables;
    context.inventoryTools = inventoryTools;
    context.inventoryQuestItems = inventoryQuestItems;
    context.inventoryBackpacks = inventoryBackpacks;
    context.inventoryMisc = inventoryMisc;
    context.skills = skills;
    context.abilities = abilities;
    context.traits = traits;
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
    context.themeOptions = { "default": "TAMS.ThemeDefault", "dark": "TAMS.ThemeDark", "parchment": "TAMS.ThemeParchment" };
    context.npcTypeOptions = { "individual": "TAMS.NPCTypeIndividual", "squad": "TAMS.NPCTypeSquad", "horde": "TAMS.NPCTypeHorde" };
    context.npcRankOptions = { "mook": "TAMS.NPCRankMook", "elite": "TAMS.NPCRankElite", "boss": "TAMS.NPCRankBoss" };
    context.limbOptions = {
      "none": "TAMS.CalculatorOptions.None", "head": "TAMS.HitLocations.Head", "thorax": "TAMS.HitLocations.Thorax", "stomach": "TAMS.HitLocations.Stomach",
      "leftArm": "TAMS.HitLocations.LeftArm", "rightArm": "TAMS.HitLocations.RightArm", "leftLeg": "TAMS.HitLocations.LeftLeg", "rightLeg": "TAMS.HitLocations.RightLeg"
    };
    context.sizeOptions = { "small": "TAMS.SizeOptions.Small", "medium": "TAMS.SizeOptions.Medium", "large": "TAMS.SizeOptions.Large" };

    const locationOptions = { "hand": "TAMS.LocationOptions.Hand", "stowed": "TAMS.LocationOptions.Stowed", "backpack": "TAMS.LocationOptions.BackpackLegacy" };
    for (const bp of context.inventoryBackpacks || []) {
        locationOptions[bp.id] = game.i18n.format("TAMS.LocationOptions.InContainer", {name: bp.name});
    }
    context.locationOptions = locationOptions;
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
            currencyNames = JSON.parse(currencySettingsRaw).map(c => c.name);
        } else {
            currencyNames = currencySettingsRaw.split(",").map(s => s.trim()).filter(s => s);
        }
    } catch(e) {
        currencyNames = currencySettingsRaw.split(",").map(s => s.trim()).filter(s => s);
    }

    const enabledCurrencies = this.document.system.settings.enabledCurrencies || {};
    context.allCurrencyNames = currencyNames;
    context.currencies = currencyNames.map(name => ({
        name: name,
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
    const armorItems = this.document.items.filter(i => i.type === "armor");
    context.limbArmorOptions = {};
    for (const limbKey of Object.keys(this.document.system.limbs)) {
        context.limbArmorOptions[limbKey] = { "": "None" };
        for (const armor of armorItems) {
            if (armor.system.limbs[limbKey]?.max > 0) {
                context.limbArmorOptions[limbKey][armor.id] = armor.name;
            }
        }
    }

    // Additional inventory data
    context.inventory = {
        ...this.document.system.inventory,
        usedMedium: (this.document.system.inventory.usedCapacity / 10).toFixed(1).replace(/\.0$/, ""),
        maxMedium: (this.document.system.inventory.maxCapacity / 10).toFixed(1).replace(/\.0$/, "")
    };
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
      type: type
    };
    
    try {
      return await this.document.createEmbeddedDocuments("Item", [itemData]);
    } catch (err) {
      console.error(`TAMS | Failed to create item:`, err);
      ui.notifications.error(game.i18n.format("TAMS.Checks.Notifications.ItemCreationFailed", {type}));
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
    const itemId = target.dataset.itemId || target.closest(".item")?.dataset.itemId;
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
    const itemId = target.dataset.itemId || target.closest(".item")?.dataset.itemId;
    const item = this.document.items.get(itemId);
    if (!item) return;

    if (event.shiftKey) {
      return item.delete();
    }

    const confirmed = await Dialog.confirm({
      title: game.i18n.localize("TAMS.DeleteConfirmTitle"),
      content: game.i18n.format("TAMS.DeleteConfirmContent", {name: item.name}),
      yes: () => true,
      no: () => false,
      defaultYes: false
    });

    if (confirmed) {
      item.delete();
    }
  }

  /**
   * Handle giving an item to another actor.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onItemGive(event, target) {
    const itemId = target.dataset.itemId || target.closest(".item")?.dataset.itemId;
    const item = this.document.items.get(itemId);
    if (!item) return;

    // Find potential recipients (characters on current scene)
    const tokens = canvas.tokens.placeables.filter(t => t.actor && t.actor.id !== this.document.id && t.actor.type === "character");
    
    if (tokens.length === 0) {
        return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NoCharactersFound"));
    }

    // Sort tokens by distance to this actor's token if possible
    const myToken = this.document.token?.object || canvas.tokens.controlled.find(t => t.actor?.id === this.document.id);
    if (myToken) {
        tokens.sort((a, b) => {
            const distA = canvas.grid.measureDistance(myToken.center, a.center);
            const distB = canvas.grid.measureDistance(myToken.center, b.center);
            return distA - distB;
        });
    }

    const options = tokens.map(t => `<option value="${t.actor.uuid}">${t.name}${t.actor.isToken ? ` (${game.i18n.localize("TAMS.Loot")})` : ""}</option>`).join("");
    const content = `
        <div class="form-group">
            <p>${game.i18n.localize('TAMS.GiveItem')}: <b>${item.name}</b></p>
            <label>${game.i18n.localize('TAMS.Recipient')}</label>
            <select name="recipientUuid" style="width: 100%; margin-bottom: 10px;">
                ${options}
            </select>
        </div>
    `;

    new Dialog({
        title: `${game.i18n.localize('TAMS.GiveItem')}: ${item.name}`,
        content: content,
        buttons: {
            give: {
                icon: '<i class="fas fa-gift"></i>',
                label: game.i18n.localize('TAMS.Give'),
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
                        ui.notifications.info(game.i18n.format("TAMS.Checks.Notifications.GivingItem", {item: item.name, target: targetActor.name}));
                    }
                }
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: game.i18n.localize('TAMS.Cancel')
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
    const itemId = target.dataset.itemId || target.closest(".item")?.dataset.itemId;
    const item = this.document.items.get(itemId);
    if (!item) return;

    if (!game.user.can("ITEM_CREATE")) {
      return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NoSidebarPermission"));
    }

    const itemData = item.toObject();
    delete itemData._id;
    delete itemData.folder;
    
    // Reset state for world-level item
    if (itemData.system.location) itemData.system.location = "stowed";
    if (itemData.system.equipped !== undefined) itemData.system.equipped = false;

    try {
      await Item.create(itemData);
      ui.notifications.info(game.i18n.format("TAMS.Checks.Notifications.ItemExported", {item: item.name}));
    } catch (err) {
      console.error("TAMS | Export failed", err);
      ui.notifications.error(game.i18n.format("TAMS.Checks.Notifications.ItemExportFailed", {item: item.name}));
    }
  }

  /**
   * Handle using a charge from an item.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onItemUseCharge(event, target) {
    const itemId = target.dataset.itemId || target.closest(".item")?.dataset.itemId;
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
      ui.notifications.warn(game.i18n.format("TAMS.Checks.Notifications.NoChargesLeft", {item: item.name}));
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
    const itemId = target.dataset.itemId || target.closest(".item")?.dataset.itemId;
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
            ui.notifications.warn(game.i18n.format("TAMS.Checks.Notifications.NotEnoughStaminaRecharge", {item: item.name, cost: totalCost, current: actor.system.stamina.value}));
            return;
          }
          await actor.update({ "system.stamina.value": actor.system.stamina.value - totalCost });
        } else {
          const resIndex = parseInt(resourceId);
          if (!isNaN(resIndex) && actor.system.customResources[resIndex]) {
            const res = actor.system.customResources[resIndex];
            if (res.value < totalCost) {
              ui.notifications.warn(game.i18n.format("TAMS.Checks.Notifications.NotEnoughResourceRecharge", {resource: res.name, item: item.name, cost: totalCost, current: res.value}));
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

    const resourceName = resourceId === "stamina" ? game.i18n.localize("TAMS.Stamina") : (this.document.system.customResources[parseInt(resourceId)]?.name || game.i18n.localize("TAMS.Resource"));
    const costInfo = (!isApex && cost > 0) ? `<p style="margin: 5px 0;">${game.i18n.format("TAMS.RechargeCostPerCharge", {cost, resource: resourceName})}</p>` : "";
    const content = `
      <div class="form-group">
        <label>${game.i18n.localize("TAMS.RechargeContent")}</label>
        <input type="number" name="amount" value="${max - value}" min="0" max="${max - value}"/>
      </div>
      ${costInfo}
    `;

    new Dialog({
      title: game.i18n.format("TAMS.RechargeTitle", {name: item.name}),
      content: content,
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
          label: game.i18n.localize('TAMS.Cancel')
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
   * Handle fully healing the actor.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onFullHeal(event, target) {
    const updates = {};
    for (const [id, limb] of Object.entries(this.document.system.limbs)) {
      updates[`system.limbs.${id}.value`] = limb.max;
      updates[`system.limbs.${id}.injured`] = false;
      updates[`system.limbs.${id}.criticallyInjured`] = false;
    }
    await this.document.update(updates);
    ui.notifications.info(game.i18n.format("TAMS.Checks.Notifications.ActorFullyHealed", {name: this.document.name}));
  }

  /** @override */
  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);
    if ( data.type !== "Item" ) return super._onDrop(event);
    
    const item = await Item.fromDropData(data);
    if ( !item ) return;

    // 1. Handle dropping ON a specific item or section
    const targetEl = event.target.closest(".item[data-item-id], .inventory-section[data-section-id]");
    let newLocation = "";

    if ( targetEl ) {
        const targetSectionId = targetEl.dataset.sectionId;
        const targetItemId = targetEl.dataset.itemId;

        if ( targetSectionId ) {
            if ( targetSectionId === "hand" ) newLocation = "hand";
            else if ( targetSectionId === "stowed" ) newLocation = "stowed";
            else newLocation = targetSectionId; // Backpack ID
        } else if ( targetItemId ) {
            const targetItem = this.document.items.get(targetItemId);
            if ( targetItem?.type === "backpack" && item.id !== targetItem.id ) {
                newLocation = targetItem.id;
            } else if ( targetItem ) {
                newLocation = targetItem.system.location || "stowed";
            }
        }
    }
    
    // 2. Determine if it's the same actor
    const isSameActor = item.parent?.uuid === this.document.uuid;

    if ( isSameActor ) {
        await item.update({"system.location": newLocation});
        return; 
    }
    
    // 3. Create the item on the target actor (Cross-actor move)
    if ( !this.document.isOwner ) {
        game.socket.emit("system.tams", {
            type: "transferItem",
            itemData: item.toObject(),
            sourceActorUuid: item.parent?.uuid,
            targetActorUuid: this.document.uuid,
            newLocation: newLocation
        });
        ui.notifications.info(game.i18n.format("TAMS.Checks.Notifications.RequestTransfer", {item: item.name, name: this.document.name}));
        return;
    }

    return tamsHandleItemTransfer({
        itemData: item.toObject(),
        sourceActorUuid: item.parent?.uuid,
        targetActorUuid: this.document.uuid,
        newLocation: newLocation
    });
  }

  /** @override */
  _onDragStart(event) {
    const li = event.currentTarget;
    if ( event.target.classList.contains("content-link") ) return;

    const itemId = li.dataset.itemId;
    const item = this.document.items.get(itemId);
    if ( item ) {
        const dragData = item.toDragData();
        if ( dragData ) {
            const jsonData = JSON.stringify(dragData);
            event.dataTransfer.setData("text/plain", jsonData);
            event.dataTransfer.setData("application/json", jsonData);
            return; // STOP! Do not call super for items.
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
    const dataset = target.dataset;
    const item = dataset.itemId ? this.document.items.get(dataset.itemId) : null;

    // Resolve the first targeted token (if any)
    const tToken = [...(game?.user?.targets ?? [])][0] ?? null;
    const tName = tToken?.name ?? null;
    const tActorId = tToken?.actor?.id ?? null;
    const tTokenId = tToken?.id ?? null;

    let label = dataset.label || '';
    if (item && (item.type === 'weapon' || (item.type === 'ability' && item.system.isAttack))) {
        if (tName) label = `${label} -> ${tName}`;
    }
    let statValue = isNaN(parseInt(dataset.statValue)) ? 0 : parseInt(dataset.statValue);
    let statMod = (parseInt(dataset.statMod) || 0) + (parseInt(dataset.traitBonus) || 0);
    let familiarity = parseInt(dataset.familiarity) || 0;
    let bonus = 0;
    let statId = dataset.statId;

    const bonusSources = [];
    const statModSources = [];
    const traits = this.document.items.filter(i => i.type === 'trait');

    const addStatModSources = (sId) => {
        statModSources.length = 0;
        const s = this.document.system.stats[sId];
        if (!s) return;
        if (s.mod !== 0) statModSources.push({ label: game.i18n.localize("TAMS.StatMod"), value: s.mod });
        for (const trait of traits) {
            const val = trait.system.modifiers
                .filter(m => m.target === `stats.${sId}`)
                .reduce((acc, m) => acc + m.value, 0);
            if (val !== 0) statModSources.push({ label: trait.name, value: val });
        }
        const backpackPen = this.document.system.backpackPenalties;
        if (backpackPen && (sId === 'strength' || sId === 'dexterity')) {
            const val = backpackPen[sId];
            if (val !== 0) statModSources.push({ label: game.i18n.localize("TAMS.BackpackPenalty"), value: val });
        }
    };

    // Add Trait Roll Bonus
    const traitRollBonus = (this.document.system.traitRollBonus || 0);
    if (traitRollBonus !== 0) {
        bonus += traitRollBonus;
        for (const trait of traits) {
            const val = trait.system.modifiers.filter(m => m.target === 'allRolls').reduce((acc, m) => acc + m.value, 0);
            if (val !== 0) bonusSources.push({ label: trait.name, value: val });
        }
    }

    // Add Profession Bonuses
    if (item && item.system.tags) {
        const tags = item.system.tags.split(",").map(t => t.trim().toLowerCase());
        for (const trait of traits) {
            if (trait.system.isProfession && trait.system.profession) {
                const prof = trait.system.profession.trim().toLowerCase();
                if (tags.includes(prof)) {
                    const val = trait.system.modifiers.filter(m => m.target === 'allProfessionRolls').reduce((acc, m) => acc + m.value, 0);
                    if (val !== 0) {
                        bonus += val;
                        bonusSources.push({ label: `${trait.name} (${trait.system.profession})`, value: val });
                    }
                }
            }
        }
    }

    // Add Accurate Tag Bonus
    if (item && item.system.tags) {
        const tags = item.system.tags.split(",").map(t => t.trim().toLowerCase());
        if (tags.includes("accurate")) {
            bonus += 5;
            bonusSources.push({ label: game.i18n.localize("TAMS.WeaponTags.Accurate"), value: 5 });
        }
    }

    if (!item && statId === 'dodge') {
        const dex = this.document.system.stats.dexterity;
        familiarity = 0;
        bonus = 0;
        statValue = dex.value;
        statMod = dex.mod;
        addStatModSources('dexterity');
    } else if (!item && statId) {
        addStatModSources(statId);
    }

    if (!item) {
        if (statId !== 'dodge') familiarity = 0; // Pure stat rolls don't include familiarity
    }

    if (item && item.type === 'weapon') {
        const str = this.document.system.stats.strength;
        const dex = this.document.system.stats.dexterity;
        
        let usesDex = false;
        if (item.system.attackStat && item.system.attackStat !== 'default') {
            statId = item.system.attackStat;
        } else {
            if (item.system.isRanged) {
                usesDex = !item.system.isThrown;
            } else {
                usesDex = !!item.system.isLight;
            }
            statId = usesDex ? 'dexterity' : 'strength';
        }

        const stat = this.document.system.stats[statId];
        statValue = stat.value;
        addStatModSources(statId);
        statMod = statModSources.reduce((acc, s) => acc + s.value, 0);
        label = `Attacking with ${item.name}`;

    }

    if (item && item.type === 'skill') {
        const name = item.name;
        label = name;
        statId = item.system.stat;
        const itemBonus = parseInt(item.system.bonus) || 0;
        if (itemBonus !== 0) {
            bonus += itemBonus;
            bonusSources.push({ label: game.i18n.localize("TAMS.ItemBonus"), value: itemBonus });
        }
        addStatModSources(statId);
        const stat = this.document.system.stats[statId];
        statValue = stat ? stat.value : 0;
        statMod = statModSources.reduce((acc, s) => acc + s.value, 0);
        if (name.includes("(") && name.includes(")")) {
            const confirmed = await new Promise(resolve => {
                new Dialog({
                    title: game.i18n.localize("TAMS.SkillCheckTitle"),
                    content: `<p>${game.i18n.format("TAMS.SkillCheckSpecificPrompt", {name})}</p>`,
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

    if (item && item.type === 'ability') {
        familiarity = parseInt(item.system.familiarity) || 0;
        const itemBonus = parseInt(item.system.bonus) || 0;
        if (itemBonus !== 0) {
            bonus += itemBonus;
            bonusSources.push({ label: game.i18n.localize("TAMS.ItemBonus"), value: itemBonus });
        }
        if (item.system.isAttack) {
            statId = item.system.attackStat;
            addStatModSources(statId);
            const stat = this.document.system.stats[statId];
            statValue = stat ? stat.value : 0;
            statMod = statModSources.reduce((acc, s) => acc + s.value, 0);
            label = game.i18n.format("TAMS.UsingAbilityLabel", {name: item.name});

        } else {
            statId = item.system.capStat || "strength";
            addStatModSources(statId);
            const stat = this.document.system.stats[statId];
            statValue = stat ? stat.value : 0;
            statMod = statModSources.reduce((acc, s) => acc + s.value, 0);
        }
        const cost = item.system.calculator?.enabled ? item.system.calculatedCost : (parseInt(item.system.cost) || 0);
        const usesMax = parseInt(item.system.uses.max) || 0;
        const usesVal = parseInt(item.system.uses.value) || 0;
        const isLimited = usesMax > 0;

        if (event.shiftKey && isLimited) {
            const missing = usesMax - usesVal;
            const actor = this.document;
            const resources = [{id: "stamina", name: "Stamina", value: actor.system.stamina.value}];
            actor.system.customResources.forEach((res, idx) => {
                resources.push({id: idx.toString(), name: res.name, value: res.value});
            });
            const resourceKey = item.system.resource;
            const options = resources.map(r => `<option value="${r.id}" ${r.id === resourceKey ? 'selected' : ''}>${r.name} (${r.value} ${game.i18n.localize("TAMS.AvailableShort")})</option>`).join('');

            new Dialog({
                title: game.i18n.format("TAMS.RefillUses", {name: item.name}),
                content: `
                    <div class="form-group">
                        <label>${game.i18n.format("TAMS.AmountToRefill", {max: missing})}</label>
                        <input type="number" id="refill-amount" value="${missing}" min="1" max="${missing}"/>
                    </div>
                    <div class="form-group">
                        <label>${game.i18n.localize("TAMS.ResourceToSpendLabel")}</label>
                        <select id="refill-resource">${options}</select>
                    </div>
                    <p>${game.i18n.format("TAMS.CostPerUse", {cost})}</p>
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
                            const res = resources.find(r => r.id === resId);
                            if (res.value < totalCost) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NotEnoughToBoost"));
                            
                            if (resId === 'stamina') {
                                await actor.update({"system.stamina.value": res.value - totalCost});
                            } else {
                                const idx = parseInt(resId);
                                const customResources = foundry.utils.duplicate(actor.system.customResources);
                                customResources[idx].value -= totalCost;
                                await actor.update({"system.customResources": customResources});
                            }
                            await item.update({"system.uses.value": usesVal + amount});
                            ui.notifications.info(game.i18n.format("TAMS.Checks.Notifications.RefilledUses", {amount, item: item.name}));
                        }
                    },
                    cancel: { label: game.i18n.localize("TAMS.Cancel") }
                },
                default: "refill"
            }).render(true);
            return;
        }

        if (isLimited) {
            if (usesVal <= 0) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NoUsesLeft"));
            await item.update({"system.uses.value": usesVal - 1});
        } else if (!item.system.isApex && cost > 0) {
            const resourceKey = item.system.resource;
            if (resourceKey === 'stamina') {
                const current = this.document.system.stamina.value;
                if (current < cost) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NotEnoughStamina"));
                await this.document.update({"system.stamina.value": current - cost});
            } else {
                const idx = parseInt(resourceKey);
                const res = this.document.system.customResources[idx];
                if (res) {
                    if (res.value < cost) {
                        const remaining = cost - res.value;
                        const stamina = this.document.system.stamina.value;
                        if (stamina < remaining) return ui.notifications.warn(game.i18n.format("TAMS.Checks.Notifications.NotEnoughResOrStamina", {resource: res.name}));
                        
                        const useBoth = await new Promise(resolve => {
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
                        resources[idx].value -= cost;
                        await this.document.update({"system.customResources": resources});
                    }
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
    let rawResult = roll.total;
    let rerolled = false;
    let isJammed = false;

    if (item && item.system.tags) {
        const tags = item.system.tags.split(",").map(t => t.trim().toLowerCase());
        if (tags.includes("reliable") && rawResult <= 4) {
            const reroll = await new Roll("1d100").evaluate();
            rawResult = reroll.total;
            rerolled = true;
        }
        if (tags.includes("unreliable") && rawResult <= 4) {
            isJammed = true;
        }
    }

    const effectiveStat = statValue + statMod;
    const cappedResult = Math.min(rawResult, effectiveStat);
    
    // Apply Backpack penalties
    const backpackPen = this.document.system.backpackPenalties;
    if (backpackPen) {
        if (item && (item.type === 'weapon' || (item.type === 'ability' && item.system.isAttack))) {
            const pen = (backpackPen.attack || 0);
            if (pen !== 0) {
                bonus += pen;
                bonusSources.push({ label: game.i18n.localize("TAMS.BackpackPenalty"), value: pen });
            }
        }
        if (statId === 'dodge') {
            const pen = (backpackPen.dodge || 0);
            if (pen !== 0) {
                bonus += pen;
                bonusSources.push({ label: game.i18n.localize("TAMS.BackpackPenalty"), value: pen });
            }
        }
    }

    // --- Squad / Horde Logic ---
    const settings = this.document.system.settings;
    const isSquadOrHorde = settings.isNPC && (settings.npcType === "squad" || settings.npcType === "horde");
    const squadSize = settings.squadSize || 1;
    let squadBonus = 0;
    let maxSquadTargets = 1;

    if (item && (item.type === 'weapon' || (item.type === 'ability' && item.system.isAttack))) {
        const isRangedAttack = item.type === 'weapon' ? !!item.system.isRanged : (item.system.calculator?.range > 10);
        if (isSquadOrHorde) {
            maxSquadTargets = isRangedAttack ? Math.floor(squadSize / 2) : squadSize;
            maxSquadTargets = Math.max(1, maxSquadTargets);

            const actualTargets = [...game.user.targets].slice(0, maxSquadTargets);
            const numTargetsCount = actualTargets.length > 0 ? actualTargets.length : (tToken ? 1 : 0);
            if (numTargetsCount > 0 && numTargetsCount < maxSquadTargets) {
                squadBonus = (maxSquadTargets - numTargetsCount) * 5;
            }
        }
    }
    // ----------------------------

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
    } else if (statId === 'bravery') {
        const targetValue = effectiveStat + familiarity + bonus;
        success = rawResult <= targetValue;
        resultText = success ? "SUCCESS" : "FAILURE";
        resultClass = success ? "success" : "failure";
        critInfo = `<div class="tams-crit ${resultClass}">${resultText}</div>`;
    } else if (difficulty > 0) {
        const actor = this.document;
        const canBoost = actor.type === 'character';

        if (dcTotal >= (difficulty * 2)) {
            critInfo = `<div class="tams-crit success">${game.i18n.format('TAMS.CritSuccess', {total: dcTotal, difficulty})}</div>`;
        } else if (dcTotal >= difficulty) {
            critInfo = `<div class="tams-success">${game.i18n.format('TAMS.SuccessVsDiff', {difficulty})}</div>`;
        } else {
            critInfo = `
                <div class="tams-failure">${game.i18n.format('TAMS.FailureVsDiff', {difficulty})}</div>
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
                ` : ''}
            `;
        }
    }

    let damageInfo = "";
    if (item && (item.type === 'weapon' || (item.type === 'ability' && item.system.isAttack))) {
        let damage = item.system.calculatedDamage;
        const isRanged = item.type === 'weapon' ? !!item.system.isRanged : (item.system.calculator?.range > 10);

        const isCrit = difficulty > 0 && dcTotal >= (difficulty * 2);
        let forceCrit = false;
        if (item && item.system.tags) {
            const tags = item.system.tags.split(",").map(t => t.trim().toLowerCase());
            if (isCrit && tags.includes("vicious")) {
                damage = Math.floor(damage * 1.5);
            }
            if (tags.includes("brutal")) {
                forceCrit = true;
            }
        }
        
        let multiVal = 1;
        if (item.type === 'weapon') {
            if (item.system.fireRate === '3') multiVal = 3;
            else if (item.system.fireRate === 'auto') multiVal = 10;
            else if (item.system.fireRate === 'custom') multiVal = item.system.fireRateCustom || 1;
            
            if (item.system.consumeAmmo) {
                const currentAmmo = item.system.ammo?.current || 0;
                if (currentAmmo < multiVal) {
                    if (currentAmmo <= 0) {
                        return ui.notifications.warn(game.i18n.format("TAMS.Checks.Notifications.NoChargesLeft", {item: item.name}));
                    }
                    ui.notifications.info(game.i18n.format("TAMS.Checks.NotEnoughAmmo", {count: currentAmmo}));
                    multiVal = currentAmmo;
                }
                await item.update({"system.ammo.current": Math.max(0, currentAmmo - multiVal)});
            }
        } else if (item.type === 'ability') {
            multiVal = item.system.multiAttack || 1;
        }

        const targetLimb = (item.type === 'ability' && item.system.calculator?.enabled) ? item.system.calculator.targetLimb : 'none';

        let armourPen = 0;
        if (item.type === 'weapon' && item.system.hasArmourPen) {
            armourPen = item.system.armourPenetration || 0;
        } else if (item.type === 'ability') {
            armourPen = item.system.armourPenetration || 0;
        }

        const isAoE = !!item.system.isAoE || (item.system.calculator?.enabled && (item.system.calculator.aoeRadius > 0 || item.system.calculator.targetType === 'aoe'));
        let targets = isAoE ? [...game.user.targets] : (tToken ? [tToken] : []);

        if (isSquadOrHorde) {
            targets = [...game.user.targets].slice(0, maxSquadTargets);
            if (targets.length === 0 && tToken) targets = [tToken];
        }

        if (targets.length > 0) {
            let hitLocation;
            if (item.type === 'ability' && item.system.calculator?.enabled && item.system.calculator?.targetLimb && item.system.calculator.targetLimb !== 'none') {
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

            const pcs = targets.filter(t => !t.actor?.system?.settings?.isNPC);
            const npcs = targets.filter(t => !!t.actor?.system?.settings?.isNPC);

            damageInfo = `<div class="tams-targets-container">`;

            // Process PCs
            for (const targetToken of pcs) {
                const targetActor = targetToken.actor;
                const targetName = targetToken.name;
                const targetTokenId = targetToken.id;
                const targetActorId = targetActor?.id;

                const tHits = [];
                for (let i = 0; i < multiVal; i++) {
                    tHits.push((i === 0 && !isAoE) ? hitLocation : await getHitLocation());
                }

                damageInfo += `
                    <div class="tams-target-block" style="border: 1px solid #7a7971; padding: 5px; margin-bottom: 5px; background: rgba(0,0,0,0.05);">
                        <div class="roll-row"><span>Target:</span><span class="roll-value">${targetName}</span></div>
                        <div class="roll-row"><b>Damage: ${damage}</b></div>
                        <div class="roll-row"><b>Hit Locations: ${tHits.join(", ")}</b></div>
                        <div class="roll-row"><b>Max Hits: ${multiVal}</b></div>
                        <div class="roll-row" style="gap:6px; flex-wrap: wrap;">
                          <button class="tams-take-damage" 
                                  data-damage="${damage}" 
                                  data-armour-pen="${armourPen}" 
                                  data-locations='${JSON.stringify(tHits)}' 
                                  data-target-limb="${targetLimb}"
                                  data-is-aoe="${isAoE ? '1' : '0'}"
                                  data-force-crit="${forceCrit ? '1' : '0'}"
                                  data-target-token-id="${targetTokenId || ''}"
                                  data-target-actor-id="${targetActorId || ''}"
                                  data-target-actor-uuid="${targetActor?.uuid || ''}">Apply Damage</button>
                          <button class="tams-dodge" 
                                  data-raw="${rawResult}" 
                                  data-total="${finalTotal}" 
                                  data-multi="${multiVal}" 
                                  data-location="${hitLocation}" 
                                  data-damage="${damage}" 
                                  data-armour-pen="${armourPen}" 
                                  data-is-ranged="${isRanged ? '1' : '0'}" 
                                  data-is-aoe="${isAoE ? '1' : '0'}"
                                  data-target-limb="${targetLimb}"
                                  data-target-token-id="${targetTokenId || ''}"
                                  data-target-actor-id="${targetActorId || ''}"
                                  data-target-actor-uuid="${targetActor?.uuid || ''}">Dodge</button>
                          <button class="tams-retaliate" 
                                  data-raw="${rawResult}" 
                                  data-total="${finalTotal}" 
                                  data-multi="${multiVal}" 
                                  data-location="${hitLocation}" 
                                  data-damage="${damage}" 
                                  data-armour-pen="${armourPen}" 
                                  data-is-ranged="${isRanged ? '1' : '0'}" 
                                  data-is-aoe="${isAoE ? '1' : '0'}"
                                  data-target-limb="${targetLimb}"
                                  data-target-token-id="${targetTokenId || ''}"
                                  data-target-actor-id="${targetActorId || ''}"
                                  data-target-actor-uuid="${targetActor?.uuid || ''}">Retaliate</button>
                          <button class="tams-behind-toggle" style="background: #444; color: white;">Behind</button>
                          <button class="tams-unaware-toggle" style="background: #444; color: white;">Unaware</button>
                        </div>
                    </div>
                `;
            }

    // Process NPCs grouped
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
            const targetActorId = targetActor?.id;

            const tHits = [];
            for (let i = 0; i < multiVal; i++) {
                tHits.push((i === 0 && !isAoE) ? hitLocation : await getHitLocation());
            }

            damageInfo += `
                <div class="tams-npc-row" style="display: flex; flex-direction: column; background: rgba(255,255,255,0.2); padding: 2px 4px; border-radius: 2px; margin-bottom: 2px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: bold; font-size: 0.85em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 120px;" title="${targetName}">${targetName}</span>
                        <div class="tams-npc-buttons" style="display: flex; gap: 2px;">
                            <button class="tams-take-damage" title="Apply Damage"
                                    data-damage="${damage}" data-armour-pen="${armourPen}" data-locations='${JSON.stringify(tHits)}' data-target-limb="${targetLimb}"
                                    data-is-aoe="${isAoE ? '1' : '0'}"
                                    data-target-token-id="${targetTokenId || ''}" data-target-actor-id="${targetActorId || ''}" 
                                    data-target-actor-uuid="${targetActor?.uuid || ''}"
                                    style="padding: 0 5px; line-height: 1.4; font-size: 0.8em; min-width: 24px;">A</button>
                            <button class="tams-dodge" title="Dodge"
                                    data-raw="${rawResult}" data-total="${finalTotal}" data-multi="${multiVal}" data-locations='${JSON.stringify(tHits)}' data-damage="${damage}" data-armour-pen="${armourPen}" data-is-ranged="${isRanged ? '1' : '0'}" data-is-aoe="${isAoE ? '1' : '0'}" data-target-limb="${targetLimb}"
                                    data-target-token-id="${targetTokenId || ''}" data-target-actor-id="${targetActorId || ''}"
                                    data-target-actor-uuid="${targetActor?.uuid || ''}"
                                    style="padding: 0 5px; line-height: 1.4; font-size: 0.8em; min-width: 24px;">D</button>
                            <button class="tams-retaliate" title="Retaliate"
                                    data-raw="${rawResult}" data-total="${finalTotal}" data-multi="${multiVal}" data-locations='${JSON.stringify(tHits)}' data-damage="${damage}" data-armour-pen="${armourPen}" data-is-ranged="${isRanged ? '1' : '0'}" data-is-aoe="${isAoE ? '1' : '0'}" data-target-limb="${targetLimb}"
                                    data-target-token-id="${targetTokenId || ''}" data-target-actor-id="${targetActorId || ''}"
                                    data-target-actor-uuid="${targetActor?.uuid || ''}"
                                    style="padding: 0 5px; line-height: 1.4; font-size: 0.8em; min-width: 24px;">R</button>
                            <button class="tams-behind-toggle" title="Behind" style="padding: 0 5px; line-height: 1.4; font-size: 0.8em; min-width: 24px; background: #444; color: white;">B</button>
                            <button class="tams-unaware-toggle" title="Unaware" style="padding: 0 5px; line-height: 1.4; font-size: 0.8em; min-width: 24px; background: #444; color: white;">U</button>
                        </div>
                    </div>
                    <div style="font-size: 0.75em; color: #555;">Locs: ${tHits.join(", ")}</div>
                </div>
            `;
        }
        damageInfo += `</div></div>`;
    }

            damageInfo += `</div>`;
        } else {
            // No tokens targeted, just show damage info without buttons or with generic ones if possible
            damageInfo = `
                <div class="roll-row"><b>Damage: ${damage}</b></div>
                <div class="roll-row"><b>Max Hits: ${multiVal}</b></div>
                <p><small>No tokens targeted.</small></p>
            `;
        }
    }

    const descriptionHtml = (item && (item.type === 'ability' || item.type === 'skill') && item.system.description)
        ? `<div class="roll-description">${item.system.description}</div>`
        : "";

    const messageContent = `
      <div class="tams-roll">
        <h3 class="roll-label">${label}</h3>
        ${descriptionHtml}
        ${damageInfo}
        <div class="roll-row"><span>Raw Dice Result:</span><span class="roll-value">${rawResult}</span></div>
        ${statId === 'bravery' ? 
            `<div class="roll-row"><small>Target (Bravery):</small><span>${statValue}${familiarity ? ' + ' + familiarity : ''}${bonus ? ' + ' + bonus : ''}</span></div>` :
            `<div class="roll-row"><small>Stat Cap (${statValue}${statMod >= 0 ? '+' : ''}${statMod}):</small><span>${cappedResult}</span></div>
             ${statModSources.length > 0 ? statModSources.map(s => `<div class="roll-row-detail"><small>${s.label}:</small><span>${s.value >= 0 ? '+' : ''}${s.value}</span></div>`).join('') : ''}
             ${familiarity > 0 ? `<div class="roll-row"><small>Familiarity:</small><span>+${familiarity}</span></div>` : ''}
             ${bonus !== 0 ? `<div class="roll-row"><small>Bonus:</small><span>${bonus >= 0 ? '+' : ''}${bonus}</span></div>` : ''}
             ${bonusSources.length > 0 ? bonusSources.map(s => `<div class="roll-row-detail"><small>${s.label}:</small><span>${s.value >= 0 ? '+' : ''}${s.value}</span></div>`).join('') : ''}
             ${squadBonus > 0 ? `<div class="roll-row"><small>Squad Bonus:</small><span>+${squadBonus}</span></div>` : ''}`
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
    const resources = [...(this.document.system.customResources || [])];
    resources.push({ 
      name: "New Resource", 
      nameSecondary: "Secondary",
      value: 0, 
      max: 0, 
      stat: "endurance", 
      mult: 1.0, 
      bonus: 0, 
      customValue: 10,
      color: "#3498db",
      isOpposed: false,
      colorSecondary: "#e74c3c"
    });
    return this.document.update({"system.customResources": resources});
  }

  /**
   * Handle deleting a custom resource.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onResourceDelete(event, target) {
    const index = target.dataset.index;
    const resources = [...(this.document.system.customResources || [])];
    resources.splice(index, 1);
    return this.document.update({"system.customResources": resources});
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
}
