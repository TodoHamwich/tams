import { tamsHandleItemTransfer, tamsHandleLootDrop } from './helpers.js';
import { allowedMessageUpdate, canDropLoot } from './socket-auth.js';
import { noteClaim } from './gm-claim.js';

/**
 * Handle a player's request on the system socket, on one GM's client only.
 * The sender comes from the second argument, which the Foundry server stamps with the socket's
 * logged-in user. Anything inside `data` is client-supplied and can be forged.
 * @param {object} data The request.
 * @param {string} senderId The user who sent it.
 */
export async function tamsHandleSocket(data, senderId) {
  if (!game.user.isGM) return;
  const primaryGM = game.users.activeGM;
  if (primaryGM && primaryGM.id !== game.user.id) return;

  const sender = game.users.get(senderId);
  if (!sender) return;

  // Only this GM's own other clients can claim. The server stamps the sender, so a player can't.
  if (data?.type === "gmClaim") {
    if (sender.id === game.user.id && typeof data.key === "string" && typeof data.clientId === "string") {
      noteClaim(data.key, data.clientId);
    }
    return;
  }

  if (data?.type === "updateMessage") {
    const message = game.messages.get(data.messageId);
    const update = allowedMessageUpdate(sender, message, data.updateData);
    if (update) return message.update(update);
  } else if (data?.type === "createLoot") {
    const uuid = data.lootData?.uuid;
    if (typeof uuid !== "string" || !Number.isFinite(data.x) || !Number.isFinite(data.y)) return;
    if (canDropLoot(sender, await fromUuid(uuid))) return tamsHandleLootDrop({ uuid }, data.x, data.y);
  } else if (data?.type === "transferItem") {
    return tamsHandleItemTransfer(data, sender);
  }
}
