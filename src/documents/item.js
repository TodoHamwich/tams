import { publicItemName, identityVisible } from '../utils/magic-items.js';

/**
 * The TAMS Item document class.
 * Extends the core Item class.
 */
export class TAMSItem extends Item {
  /**
   * System-defined item types.
   * @type {object}
   */
  static get metadata() {
    return foundry.utils.mergeObject(super.metadata, {
      types: ["weapon", "skill", "ability", "equipment", "armor", "consumable", "tool", "shield", "questItem", "backpack", "trait", "statusEffect", "ammo", "race"]
    }, {inplace: false});
  }

  /** Whether the current user may see this item's true name, description and magic effects. */
  get isIdentityVisible() {
    return identityVisible(this.system?.magic, game.user?.isGM);
  }

  /**
   * Name everyone may see — the unidentified name for unidentified magic items.
   * Use for chat cards and anything else shown to all players.
   */
  get publicName() {
    return publicItemName(this, game.i18n.localize("TAMS.Magic.UnidentifiedItem"));
  }

  /** Name for the current viewer: the true name for the GM, the public name otherwise. */
  get displayName() {
    return game.user?.isGM ? this.name : this.publicName;
  }

  /** Description everyone may see — the unidentified description for unidentified magic items. */
  get publicDescription() {
    const magic = this.system?.magic;
    if (magic && magic.identified === false) return magic.unidentifiedDescription ?? "";
    return this.system?.description ?? "";
  }

  /** The magic item whose ability this is, if it was granted by one. */
  get magicGrantSource() {
    const key = this.getFlag?.("tams", "magicGrant");
    if (!key || !this.actor) return null;
    return this.actor.items.get(key.split(":")[0]) ?? null;
  }
}
