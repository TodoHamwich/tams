
import { showCombinedInjuryDialog, getHitLocation, hitLocationOn, tamsUpdateMessage, tamsApplyRollMode } from './combat.js';
import { canTransferItem, canDropLoot } from './socket-auth.js';
export { showCombinedInjuryDialog, getHitLocation, hitLocationOn, tamsUpdateMessage, tamsApplyRollMode };

/**
 * Move one item up or down within a displayed list and renumber the list's sort values.
 * @param {string[]} ids Item ids in their displayed order.
 * @param {string} id The item to move.
 * @param {-1|1} dir -1 = up, 1 = down.
 * @returns {{_id: string, sort: number}[]} Sort updates, or [] if the item can't move.
 */
export function moveInOrder(ids, id, dir) {
  const from = ids.indexOf(id);
  const to = from + dir;
  if (from === -1 || to < 0 || to >= ids.length) return [];
  const order = [...ids];
  [order[from], order[to]] = [order[to], order[from]];
  return order.map((_id, idx) => ({ _id, sort: (idx + 1) * 100000 }));
}

/**
 * Hazardous Area tiers (rulebook "Hazardous Areas"): damage to one limb, plus how many other
 * limbs it spreads to if the creature is still inside at the end of the activation.
 */
export const HAZARD_TIERS = {
  light:  { damage: 5,  spread: 1 },
  heavy:  { damage: 10, spread: 1 },
  deadly: { damage: 15, spread: 2 },
};

/**
 * Squad attack: possible attacks are half the squad's size (ranged) or its full size (melee).
 * Each possible attack left without a target gives the squad +5 (no targets = every attack unused).
 * @param {number} squadSize Current squad size.
 * @param {boolean} isRanged Whether the attack is ranged.
 * @param {number} numTargets Number of targeted tokens.
 * @returns {{maxTargets: number, bonus: number}}
 */
export function computeSquadAttackBonus(squadSize, isRanged, numTargets) {
  const maxTargets = isRanged ? Math.max(1, Math.ceil(squadSize / 2)) : Math.max(1, squadSize);
  const bonus = Math.max(0, maxTargets - numTargets) * 5;
  return { maxTargets, bonus };
}

/**
 * Take items off an actor before copying them elsewhere. A GM logged in on two clients handles
 * every socket request twice, and both copies pass the active-GM check because they are the same
 * user. The server only lets one of them delete an item, so whoever deletes it gets to copy it.
 * @param {Actor} actor The source actor.
 * @param {Item[]} items The items to take.
 * @returns {Promise<Set<string>>} Ids of the items this client deleted.
 */
async function claimItems(actor, items) {
  if (!items.length) return new Set();
  try {
    const deleted = await actor.deleteEmbeddedDocuments("Item", items.map(i => i.id));
    return new Set(deleted.map(i => i.id));
  } catch (err) {
    console.warn("TAMS | Items were already taken, probably by another client of this GM.", err);
    return new Set();
  }
}

/**
 * Handle item transfer between actors.
 * @param {object} params
 * @param {object} [params.itemData] The item data to transfer (local calls only).
 * @param {string} [params.itemId] The source item's id (socket calls, where client item data is never trusted).
 * @param {string} params.sourceActorUuid Source actor UUID.
 * @param {string} params.targetActorUuid Target actor UUID.
 * @param {string} [params.newLocation="stowed"] New location for the item.
 * @param {User|null} [sender] The authenticated requesting user, when called from the socket handler.
 * @returns {Promise<Item|void>}
 */
export async function tamsHandleItemTransfer({itemData, itemId, sourceActorUuid, targetActorUuid, newLocation}, sender = null) {
  let target = await fromUuid(targetActorUuid);
  if (!target) return;
  const targetActor = (target instanceof foundry.documents.BaseActor) ? target : target.actor;
  if (!targetActor) return;

  const _sourceFull = sourceActorUuid ? await fromUuid(sourceActorUuid) : null;
  const sourceActor = _sourceFull ? ((_sourceFull instanceof foundry.documents.BaseActor) ? _sourceFull : _sourceFull.actor) : null;
  const itemsToCreate = [];
  const itemsToDelete = [];

  // Socket request: the sender must own the source actor, and the item comes from the source
  // actor itself, never from the request.
  if (sender) {
      const requested = sourceActor?.items.get(itemId);
      if (!canTransferItem(sender, sourceActor, requested)) {
          console.warn(`TAMS | transferItem rejected for ${sender.name}`);
          return;
      }
      itemData = requested.toObject();
  }

  // Main item
  const mainItemData = foundry.utils.duplicate(itemData);
  mainItemData.system.location = newLocation;
  if (mainItemData.system.equipped !== undefined) mainItemData.system.equipped = false;
  
  // Identify original ID for deletion
  const originalId = mainItemData._id;
  // If moving cross-actor, we want a new ID on the target, but createEmbeddedDocuments handles this if we don't provide it 
  // or it just overwrites. Better to delete it to be safe if it's a new actor.
  delete mainItemData._id; 
  
  itemsToCreate.push(mainItemData);

  // Source item for backpack contents
  let sourceItem = null;
  if (sourceActor && originalId) {
      sourceItem = sourceActor.items.get(originalId);
      if (sourceItem) itemsToDelete.push(sourceItem);
  }

  // Backpack contents: If it's an EQUIPPED backpack, move all items in it too
  if (sourceItem && sourceItem.type === "backpack" && sourceItem.system.equipped) {
      const contents = sourceActor.items.filter(i => i.system.location === "backpack" || i.system.location === sourceItem.id);
      for (let i of contents) {
          const contentData = i.toObject();
          delete contentData._id;
          contentData.system.location = "stowed"; // Reset to stowed on target
          itemsToCreate.push(contentData);
          itemsToDelete.push(i);
      }
  }

  // Socket request: delete first, so a second client of the same GM can't copy it too.
  if (sender) {
      const originals = itemsToDelete.map(i => i.toObject());
      const claimed = await claimItems(sourceActor, itemsToDelete);
      if (!claimed.has(originalId)) return;
      const toCreate = itemsToCreate.filter((_, i) => claimed.has(itemsToDelete[i].id));
      try {
          return await targetActor.createEmbeddedDocuments("Item", toCreate);
      } catch (err) {
          await sourceActor.createEmbeddedDocuments("Item", originals.filter(o => claimed.has(o._id)), { keepId: true });
          throw err;
      }
  }

  const created = await targetActor.createEmbeddedDocuments("Item", itemsToCreate);
  if (created.length && itemsToDelete.length) {
      // Only delete if we have ownership of source
      const canDelete = sourceActor && sourceActor.isOwner;
      if (canDelete || game.user.isGM) {
          await sourceActor.deleteEmbeddedDocuments("Item", itemsToDelete.map(i => i.id));
      }
  }
  return created;
}

/**
 * Handle dropping loot onto the canvas.
 * @param {object} data The actor data for the loot.
 * @param {number} x X coordinate.
 * @param {number} y Y coordinate.
 * @returns {Promise<TokenDocument>}
 */
export async function tamsHandleLootDrop(data, x, y) {
  let item;
  if (data.uuid) item = await fromUuid(data.uuid);
  else if (data.data) item = data.data;
  
  if (!item) return;

  // Items to move
  const itemsToCreate = [];
  const itemsToDelete = [];

  // Add the main item
  const mainItemData = (typeof item.toObject === 'function') ? item.toObject() : item;
  itemsToCreate.push(mainItemData);
  
  // If it's a Document, we might want to delete it from its parent
  if (item instanceof Item && item.actor) itemsToDelete.push(item);

  // If it's an EQUIPPED backpack, move all items in it too
  if (item instanceof Item && item.type === "backpack" && item.actor && item.system.equipped) {
    const sourceActor = item.actor;
    // Find items in legacy "backpack" location OR items pointing to this specific backpack ID
    const backpackContents = sourceActor.items.filter(i => i.system.location === "backpack" || i.system.location === item.id);
    for (let i of backpackContents) {
      const contentData = i.toObject();
      // Reset location to legacy "backpack" or stowed so they appear correctly on the new loot actor
      // (Since IDs will change on the new actor, we can't easily preserve the specific container link without multiple steps)
      contentData.system.location = "stowed"; 
      itemsToCreate.push(contentData);
      itemsToDelete.push(i);
    }
  }

  // Delete first, so a second client of the same GM can't drop it too.
  const sourceActor = item instanceof Item ? item.actor : null;
  const originals = itemsToDelete.map(i => i.toObject());
  const claimed = await claimItems(sourceActor, itemsToDelete);
  if (itemsToDelete.length && !claimed.has(item.id)) return;
  const toCreate = itemsToDelete.length ? itemsToCreate.filter((_, i) => claimed.has(itemsToDelete[i].id)) : itemsToCreate;

  // Create a new actor for the loot
  const actorData = {
    name: `${game.i18n.localize("TAMS.Loot")}: ${item.name || item.data?.name}`,
    type: "character",
    img: item.img || item.data?.img || "icons/svg/item-bag.svg",
    prototypeToken: {
        name: `${game.i18n.localize("TAMS.Loot")}: ${item.name || item.data?.name}`,
        texture: { src: item.img || item.data?.img || "icons/svg/item-bag.svg" },
        width: 0.5,
        height: 0.5,
        actorLink: false
    },
    system: {
      settings: {
        isNPC: true,
        npcType: "individual"
      }
    },
    flags: {
      core: {
        sheetClass: "tams.TAMSLootSheet"
      }
    },
    ownership: {
      default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
    }
  };

  let actor;
  try {
    actor = await Actor.create(actorData);
    if ( !actor ) throw new Error("Failed to create loot actor.");
    await actor.createEmbeddedDocuments("Item", toCreate);
  } catch (err) {
    console.error("TAMS | Failed to create loot.", err);
    await actor?.delete();
    if (sourceActor) await sourceActor.createEmbeddedDocuments("Item", originals.filter(o => claimed.has(o._id)), { keepId: true });
    return;
  }

  // Create token
  const tokenDocument = await actor.getTokenDocument({ x, y });
  return canvas.scene.createEmbeddedDocuments("Token", [tokenDocument.toObject()]);
}

Hooks.on("dropCanvasData", async (canvas, data) => {
  if (data.type !== "Item") return;
  
  const item = await Item.fromDropData(data);
  if (!item) return;

  // Find if dropped on a token
  const targetToken = canvas.tokens.placeables.find(t => t.actor && t.actor.uuid !== item.parent?.uuid && t.bounds.contains(data.x, data.y));

  if (targetToken) {
    if (targetToken.actor.isOwner) {
        return tamsHandleItemTransfer({
            itemData: item.toObject(),
            sourceActorUuid: item.parent?.uuid,
            targetActorUuid: targetToken.actor.uuid,
            newLocation: "stowed"
        });
    } else {
        if (!game.user.isGM && !canTransferItem(game.user, item.parent, item)) {
            ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.TransferNotAllowed"));
            return false;
        }
        game.socket.emit("system.tams", {
            type: "transferItem",
            itemId: item.id,
            sourceActorUuid: item.parent?.uuid,
            targetActorUuid: targetToken.actor.uuid,
            newLocation: "stowed"
        });
        ui.notifications.info(game.i18n.format("TAMS.Checks.Notifications.GivingItem", {item: item.name, target: targetToken.name}));
        return false;
    }
  }

  if (!game.user.isGM) {
      if (!canDropLoot(game.user, item)) {
          ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.TransferNotAllowed"));
          return;
      }
      // Send to GM via socket
      game.socket.emit("system.tams", {
          type: "createLoot",
          lootData: { uuid: item.uuid },
          x: data.x,
          y: data.y
      });
      ui.notifications.info(game.i18n.localize("TAMS.Checks.Notifications.RequestLootPile"));
      return;
  }

  return tamsHandleLootDrop(data, data.x, data.y);
});
