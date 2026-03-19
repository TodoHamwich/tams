import { TAMSActorSheet } from './actor-sheet.js';

/**
 * The TAMS Loot Sheet Application.
 * Extends the TAMSActorSheet to provide a specialized view for lootable actors.
 */
export class TAMSLootSheet extends TAMSActorSheet {
  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
      classes: ["tams", "sheet", "actor", "loot"],
      position: { width: 500, height: 400 }
    }, { inplace: false });
  }

  static PARTS = {
    form: {
      template: "systems/tams/templates/loot-sheet.html"
    }
  };
}

