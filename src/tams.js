import { TAMSCharacterData } from './models/character.js';
import { TAMSWeaponData, TAMSSkillData, TAMSEquipmentData, TAMSArmorData, TAMSConsumableData, TAMSToolData, TAMSShieldData, TAMSQuestItemData, TAMSBackpackData, TAMSAbilityData, TAMSTraitData } from './models/item.js';
import { TAMSActor } from './documents/actor.js';
import { TAMSItem } from './documents/item.js';
import { TAMSActorSheet } from './applications/actor-sheet.js';
import { TAMSDowntimeSheet } from './applications/downtime-sheet.js';
import { TAMSLootSheet } from './applications/loot-sheet.js';
import { TAMSItemSheet } from './applications/item-sheet.js';
import { TAMSTravelPaceApp } from './applications/travel-pace.js';
import { tamsUpdateMessage, tamsHandleItemTransfer, tamsHandleLootDrop } from './utils/helpers.js';
import { tamsRenderChatMessage } from './utils/combat.js';

Hooks.once("init", async function() {
  console.log("TAMS | Initializing Todo's Advanced Modular System");

  // Register Socket
  game.socket.on("system.tams", data => {
    if (data.type === "updateMessage" && game.user.isGM) {
      const message = game.messages.get(data.messageId);
      if (message) message.update(data.updateData);
    } else if (data.type === "createLoot" && game.user.isGM) {
        tamsHandleLootDrop(data.lootData, data.x, data.y);
    } else if (data.type === "transferItem" && game.user.isGM) {
        tamsHandleItemTransfer(data);
    }
  });

  // Register System Settings
  game.settings.register("tams", "currencies", {
    name: "TAMS.Currencies",
    hint: "TAMS.SettingsCurrenciesHint",
    scope: "world",
    config: true,
    type: String,
    default: "Gold, Silver, Copper"
  });

  // Inventory: capacity mode (weight vs slots)
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

  // Inventory: default slot cost for large items (slot mode only)
  game.settings.register("tams", "largeItemSlots", {
    name: "TAMS.Settings.LargeItemSlots",
    hint: "TAMS.Settings.LargeItemSlotsHint",
    scope: "world",
    config: true,
    type: Number,
    range: { min: 2, max: 10, step: 1 },
    default: 2
  });

  // Inventory: enforce a maximum number of equipped/in-hand weapons & shields
  game.settings.register("tams", "enforceEquipLimit", {
    name: "TAMS.Settings.EnforceEquipLimit",
    hint: "TAMS.Settings.EnforceEquipLimitHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  // Inventory: number of hands available when the equip limit is enforced
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
  CONFIG.Item.dataModels.consumable = TAMSConsumableData;
  CONFIG.Item.dataModels.tool = TAMSToolData;
  CONFIG.Item.dataModels.shield = TAMSShieldData;
  CONFIG.Item.dataModels.questItem = TAMSQuestItemData;
  CONFIG.Item.dataModels.backpack = TAMSBackpackData;
  CONFIG.Item.dataModels.trait = TAMSTraitData;

  // v12: Ensure types are also in systemDataModels if needed
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
    }
  };

  foundry.documents.collections.Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);
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
  foundry.documents.collections.Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet);
  foundry.documents.collections.Items.registerSheet("tams", TAMSItemSheet, { makeDefault: true });

  // --- Handlebars Helpers ---
  
  /** Check if a equals b */
  Handlebars.registerHelper('eq', (a, b) => a === b);
  
  /** Check if a is greater than b */
  Handlebars.registerHelper('gt', (a, b) => a > b);
  
  /** Check if a is less than b */
  Handlebars.registerHelper('lt', (a, b) => a < b);
  
  /** Check if a is greater than or equal to b */
  Handlebars.registerHelper('gte', (a, b) => a >= b);
  
  /** Check if a is less than or equal to b */
  Handlebars.registerHelper('lte', (a, b) => a <= b);
  
  /** logical OR */
  Handlebars.registerHelper('or', (...args) => {
    args.pop();
    return args.some(v => !!v);
  });
  
  /** logical AND */
  Handlebars.registerHelper('and', (...args) => {
    args.pop();
    return args.every(v => !!v);
  });
  
  /** logical NOT */
  Handlebars.registerHelper('not', (a) => !a);
  
  /** Capitalize a string */
  Handlebars.registerHelper('capitalize', (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  });
  
  /** Uppercase a string */
  Handlebars.registerHelper('upperCase', (str) => {
    if (!str) return "";
    return str.toUpperCase();
  });

  Hooks.on("renderChatMessage", tamsRenderChatMessage);

  // --- Encumbrance status effect ---
  // Register a custom "encumbered" condition so it can be shown on tokens.
  const encumberedEffect = {
    id: "encumbered",
    name: "TAMS.Encumbered",
    label: "TAMS.Encumbered",
    img: "icons/svg/anchor.svg",
    icon: "icons/svg/anchor.svg"
  };
  if (Array.isArray(CONFIG.statusEffects) && !CONFIG.statusEffects.some(e => e.id === "encumbered")) {
    CONFIG.statusEffects.push(encumberedEffect);
  }

  /**
   * Keep the token "encumbered" status in sync with the actor's derived
   * encumbrance flag. Idempotent: only toggles when the state actually changes.
   * @param {Actor} actor The actor to synchronize.
   */
  const tamsSyncEncumbrance = (actor) => {
    if (!actor || actor.type !== "character") return;
    if (!actor.isOwner) return;
    if (typeof actor.toggleStatusEffect !== "function") return;
    const encumbered = !!actor.system?.inventory?.isEncumbered;
    const hasStatus = actor.statuses?.has?.("encumbered") ?? false;
    if (encumbered !== hasStatus) {
      actor.toggleStatusEffect("encumbered", { active: encumbered });
    }
  };

  Hooks.on("updateActor", (actor) => tamsSyncEncumbrance(actor));
  Hooks.on("createItem", (item) => { if (item.parent) tamsSyncEncumbrance(item.parent); });
  Hooks.on("updateItem", (item) => { if (item.parent) tamsSyncEncumbrance(item.parent); });
  Hooks.on("deleteItem", (item) => {
    if (!item.parent) return;
    tamsSyncEncumbrance(item.parent);
    if (item.type !== "armor") return;
    const actor = item.parent;
    const limbKeys = ['head', 'thorax', 'stomach', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
    const updates = {};
    for (const key of limbKeys) {
      if (actor.system.limbs?.[key]?.equippedArmorId === item.id) {
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
