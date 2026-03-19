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
      types: ["weapon", "skill", "ability", "equipment", "armor", "consumable", "tool", "questItem", "backpack", "trait"]
    }, {inplace: false});
  }
}
