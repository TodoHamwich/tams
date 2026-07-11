import { TAMSCharacterData } from './models/character.js';
import { TAMSWeaponData, TAMSSkillData, TAMSEquipmentData, TAMSArmorData, TAMSConsumableData, TAMSToolData, TAMSShieldData, TAMSQuestItemData, TAMSBackpackData, TAMSAbilityData, TAMSTraitData, TAMSStatusEffectData } from './models/item.js';
import { TAMSActor } from './documents/actor.js';
import { TAMSItem } from './documents/item.js';
import { TAMSActorSheet } from './applications/actor-sheet.js';
import { TAMSDowntimeSheet } from './applications/downtime-sheet.js';
import { TAMSLootSheet } from './applications/loot-sheet.js';
import { TAMSNPCSheet } from './applications/npc-sheet.js';
import { TAMSItemSheet } from './applications/item-sheet.js';
import { TAMSTravelPaceApp } from './applications/travel-pace.js';
import { TAMSItemMaker } from './applications/item-maker.js';
import { tamsUpdateMessage, tamsHandleItemTransfer, tamsHandleLootDrop } from './utils/helpers.js';
import { tamsRenderChatMessage, tamsCallGroupCheck, tamsHandleGroupCheckPending, tamsHandleContestedCheckPending, tamsOnTurnStart, tamsOnCombatEnd } from './utils/combat.js';

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
  CONFIG.Item.dataModels.statusEffect = TAMSStatusEffectData;

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
    },
    groupCheck: () => tamsCallGroupCheck(),
    openItemMaker: (actor = null) => TAMSItemMaker.open(actor)
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
  foundry.documents.collections.Actors.registerSheet("tams", TAMSNPCSheet, {
    types: ["character"],
    makeDefault: false,
    label: "TAMS.NPCSheet"
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

  /** Subtract b from a */
  Handlebars.registerHelper('subtract', (a, b) => (Number(a) || 0) - (Number(b) || 0));
  Handlebars.registerHelper('add', (a, b) => (Number(a) || 0) + (Number(b) || 0));
  
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

  Hooks.on("createChatMessage", async (msg) => {
    if (!game.user.isGM) return;
    await tamsHandleGroupCheckPending(msg);
    await tamsHandleContestedCheckPending(msg);
  });

  Hooks.on("renderChatLog", (app, html) => {
    if (!game.user.isGM) return;
    const root = (html instanceof jQuery) ? html[0] : html;
    const controls = root.querySelector("#chat-controls")
      ?? root.querySelector(".control-buttons")
      ?? root.querySelector("#chat-form");
    if (!controls) return;
    if (root.querySelector(".tams-call-group-check")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tams-call-group-check";
    btn.title = game.i18n.localize("TAMS.GroupCheck.CallForCheck");
    btn.innerHTML = `<i class="fas fa-users-cog"></i> ${game.i18n.localize("TAMS.GroupCheck.CallForCheck")}`;
    btn.addEventListener("click", () => tamsCallGroupCheck());
    controls.prepend(btn);
  });

  // --- Custom status effects ---
  const tamsStatusEffects = [
    // Existing
    { id: "encumbered",           name: "TAMS.Encumbered",                  img: "icons/svg/anchor.svg",  icon: "icons/svg/anchor.svg" },
    { id: "bleeding",             name: "TAMS.Status.Bleeding",             img: "icons/svg/blood.svg",   icon: "icons/svg/blood.svg" },
    { id: "severe-bleeding",      name: "TAMS.Status.SevereBleeding",       img: "icons/svg/blood.svg",   icon: "icons/svg/blood.svg" },
    // Category 1 — Combat Conditions
    { id: "stunned",              name: "TAMS.Status.Stunned",              img: "icons/svg/daze.svg",    icon: "icons/svg/daze.svg" },
    { id: "prone",                name: "TAMS.Status.Prone",                img: "icons/svg/falling.svg", icon: "icons/svg/falling.svg" },
    { id: "suppressed",           name: "TAMS.Status.Suppressed",           img: "icons/svg/anchor.svg",  icon: "icons/svg/anchor.svg" },
    { id: "blinded",              name: "TAMS.Status.Blinded",              img: "icons/svg/blind.svg",   icon: "icons/svg/blind.svg" },
    { id: "deafened",             name: "TAMS.Status.Deafened",             img: "icons/svg/deaf.svg",    icon: "icons/svg/deaf.svg" },
    // Category 2 — Ongoing Damage (severity tiers)
    { id: "on-fire",              name: "TAMS.Status.OnFire",               img: "icons/svg/fire.svg",    icon: "icons/svg/fire.svg" },
    { id: "engulfed",             name: "TAMS.Status.Engulfed",             img: "icons/svg/fire.svg",    icon: "icons/svg/fire.svg" },
    { id: "poisoned",             name: "TAMS.Status.Poisoned",             img: "icons/svg/poison.svg",  icon: "icons/svg/poison.svg" },
    { id: "severely-poisoned",    name: "TAMS.Status.SeverelyPoisoned",     img: "icons/svg/poison.svg",  icon: "icons/svg/poison.svg" },
    { id: "irradiated",           name: "TAMS.Status.Irradiated",           img: "icons/svg/skull.svg",   icon: "icons/svg/skull.svg" },
    { id: "severely-irradiated",  name: "TAMS.Status.SeverelyIrradiated",   img: "icons/svg/skull.svg",   icon: "icons/svg/skull.svg" },
    { id: "acid-burn",            name: "TAMS.Status.AcidBurn",             img: "icons/svg/blood.svg",   icon: "icons/svg/blood.svg" },
    { id: "severe-acid-burn",     name: "TAMS.Status.SevereAcidBurn",       img: "icons/svg/blood.svg",   icon: "icons/svg/blood.svg" },
    // Category 3 — Morale / Mental
    { id: "fleeing",              name: "TAMS.Status.Fleeing",              img: "icons/svg/falling.svg", icon: "icons/svg/falling.svg" },
    { id: "frozen",               name: "TAMS.Status.Frozen",               img: "icons/svg/frozen.svg",  icon: "icons/svg/frozen.svg" },
    { id: "charmed",              name: "TAMS.Status.Charmed",              img: "icons/svg/sleep.svg",   icon: "icons/svg/sleep.svg" },
    { id: "confused",             name: "TAMS.Status.Confused",             img: "icons/svg/daze.svg",    icon: "icons/svg/daze.svg" },
    // Category 4 — Limb-Specific
    { id: "broken-arm",           name: "TAMS.Status.BrokenArm",            img: "icons/svg/blood.svg",   icon: "icons/svg/blood.svg" },
    { id: "broken-leg",           name: "TAMS.Status.BrokenLeg",            img: "icons/svg/blood.svg",   icon: "icons/svg/blood.svg" },
  ];
  for (const effect of tamsStatusEffects) {
    if (Array.isArray(CONFIG.statusEffects) && !CONFIG.statusEffects.some(e => e.id === effect.id)) {
      CONFIG.statusEffects.push(effect);
    }
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

// --- Turn-start automation ---
Hooks.on("updateCombat", async (combat, changed) => {
  if (!game.user.isGM) return;
  if (!("turn" in changed)) return;
  const combatant = combat.combatant;
  if (!combatant?.actor) return;
  await tamsOnTurnStart(combatant.actor);
});

// --- End-of-combat cleanup ---
Hooks.on("deleteCombat", async (combat) => {
  if (!game.user.isGM) return;
  await tamsOnCombatEnd(combat);
});
