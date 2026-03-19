import { TAMSCharacterData } from './models/character.js';
import { TAMSWeaponData, TAMSSkillData, TAMSEquipmentData, TAMSArmorData, TAMSConsumableData, TAMSToolData, TAMSQuestItemData, TAMSBackpackData, TAMSAbilityData, TAMSTraitData } from './models/item.js';
import { TAMSActor } from './documents/actor.js';
import { TAMSItem } from './documents/item.js';
import { TAMSActorSheet } from './applications/actor-sheet.js';
import { TAMSLootSheet } from './applications/loot-sheet.js';
import { TAMSItemSheet } from './applications/item-sheet.js';
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

  CONFIG.Actor.dataModels.character = TAMSCharacterData;
  CONFIG.Item.dataModels.weapon = TAMSWeaponData;
  CONFIG.Item.dataModels.skill = TAMSSkillData;
  CONFIG.Item.dataModels.ability = TAMSAbilityData;
  CONFIG.Item.dataModels.equipment = TAMSEquipmentData;
  CONFIG.Item.dataModels.armor = TAMSArmorData;
  CONFIG.Item.dataModels.consumable = TAMSConsumableData;
  CONFIG.Item.dataModels.tool = TAMSToolData;
  CONFIG.Item.dataModels.questItem = TAMSQuestItemData;
  CONFIG.Item.dataModels.backpack = TAMSBackpackData;
  CONFIG.Item.dataModels.trait = TAMSTraitData;

  // v12: Ensure types are also in systemDataModels if needed
  CONFIG.Item.systemDataModels = CONFIG.Item.dataModels;
  CONFIG.Actor.systemDataModels = CONFIG.Actor.dataModels;

  CONFIG.Actor.documentClass = TAMSActor;
  CONFIG.Item.documentClass = TAMSItem;

  foundry.documents.collections.Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);
  foundry.documents.collections.Actors.registerSheet("tams", TAMSActorSheet, { makeDefault: true });
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

  Hooks.on("renderChatMessage", tamsRenderChatMessage);
});
