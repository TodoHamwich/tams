import { TAMSActorSheet } from './actor-sheet.js';

export class TAMSNPCSheet extends TAMSActorSheet {
  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
      classes: ["tams", "sheet", "actor", "npc"],
      position: { width: 610, height: 760 },
    }, { inplace: false });
  }

  static PARTS = {
    form: {
      template: "systems/tams/templates/npc-sheet.html"
    }
  };

  async _onFirstRender(context, options) {
    await super._onFirstRender?.(context, options);
    if (!this.document.system.settings.isNPC) {
      await this.document.update({ "system.settings.isNPC": true });
    }
  }
}
