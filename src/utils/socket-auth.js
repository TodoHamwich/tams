/**
 * Permission rules for requests players send to the GM over the system socket (no Foundry globals).
 * The sheets use the same rules up front, so a refused request gets a warning instead of silence.
 */

/**
 * A user may hand over an item only if it's really on an actor they own. Any actor may receive it:
 * giving to an actor you don't own is what the request exists for.
 * @param {User} sender
 * @param {Actor|null|undefined} sourceActor
 * @param {Item|null|undefined} item The item as found on sourceActor.
 * @returns {boolean}
 */
export function canTransferItem(sender, sourceActor, item) {
  return !!sourceActor && !!item && sourceActor.testUserPermission(sender, "OWNER");
}

/**
 * A user may turn an item into a loot pile only if they own it (embedded items inherit their actor's
 * ownership). Compendium entries are refused: dropping one would copy it out for every player.
 * @param {User} sender
 * @param {Document|null|undefined} item What the dropped UUID resolved to.
 * @returns {boolean}
 */
export function canDropLoot(sender, item) {
  return item?.documentName === "Item" && !item.pack && item.testUserPermission(sender, "OWNER");
}

/**
 * A user may only change the text of their own message; author, whisper and roll fields stay put.
 * @param {User} sender
 * @param {ChatMessage|null|undefined} message
 * @param {object} updateData
 * @returns {{content: string}|null} The update to apply, or null if refused.
 */
export function allowedMessageUpdate(sender, message, updateData) {
  if (!message || message.author?.id !== sender.id) return null;
  return typeof updateData?.content === "string" ? { content: updateData.content } : null;
}
