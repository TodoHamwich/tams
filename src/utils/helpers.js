
import { showCombinedInjuryDialog, getHitLocation } from './combat.js';
export { showCombinedInjuryDialog, getHitLocation };

/**
 * Update a message in the chat log.
 * @param {ChatMessage} message The message document.
 * @param {object} updateData Data to update.
 * @returns {Promise<ChatMessage>}
 */
export async function tamsUpdateMessage(message, updateData) {
  if (game.user.isGM || message.isAuthor) {
    try {
      return await message.update(updateData);
    } catch (err) {
      console.error("TAMS | Failed to update message", err);
    }
  }
  
  game.socket.emit("system.tams", {
    type: "updateMessage",
    messageId: message.id,
    updateData: updateData
  });
}

/**
 * Handle item transfer between actors.
 * @param {object} params
 * @param {object} params.itemData The item data to transfer.
 * @param {string} params.sourceActorUuid Source actor UUID.
 * @param {string} params.targetActorUuid Target actor UUID.
 * @param {string} [params.newLocation="stowed"] New location for the item.
 * @returns {Promise<Item|void>}
 */
export async function tamsHandleItemTransfer({itemData, sourceActorUuid, targetActorUuid, newLocation}) {
  let target = await fromUuid(targetActorUuid);
  if (!target) return;
  const targetActor = (target instanceof foundry.documents.BaseActor) ? target : target.actor;
  if (!targetActor) return;

  const sourceActor = sourceActorUuid ? await fromUuid(sourceActorUuid) : null;
  const itemsToCreate = [];
  const itemsToDelete = [];

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

  const actor = await Actor.create(actorData);
  if ( !actor ) return console.error("TAMS | Failed to create loot actor.");
  
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

  await actor.createEmbeddedDocuments("Item", itemsToCreate);
  
  // Delete from source
  for (let i of itemsToDelete) {
    try {
        await i.delete();
    } catch (err) {
        console.warn(`TAMS | Failed to delete source item ${i.name} after drop on map.`, err);
    }
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
  const tokens = canvas.tokens.getObjectsAt({x: data.x, y: data.y});
  const targetToken = tokens.find(t => t.actor && t.actor.uuid !== item.parent?.uuid);

  if (targetToken) {
    if (targetToken.actor.isOwner) {
        return tamsHandleItemTransfer({
            itemData: item.toObject(),
            sourceActorUuid: item.parent?.uuid,
            targetActorUuid: targetToken.actor.uuid,
            newLocation: "stowed"
        });
    } else {
        game.socket.emit("system.tams", {
            type: "transferItem",
            itemData: item.toObject(),
            sourceActorUuid: item.parent?.uuid,
            targetActorUuid: targetToken.actor.uuid,
            newLocation: "stowed"
        });
        ui.notifications.info(game.i18n.format("TAMS.Checks.Notifications.GivingItem", {item: item.name, target: targetToken.name}));
        return false;
    }
  }

  if (!game.user.isGM) {
      // Send to GM via socket
      game.socket.emit("system.tams", {
          type: "createLoot",
          lootData: data,
          x: data.x,
          y: data.y
      });
      ui.notifications.info(game.i18n.localize("TAMS.Checks.Notifications.RequestLootPile"));
      return;
  }

  return tamsHandleLootDrop(data, data.x, data.y);
});
