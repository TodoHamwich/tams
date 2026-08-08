import { HONOR_PATHS, getHonorTier, getPartyHonor, setPartyHonor } from '../utils/honor.js';

export class TAMSPartyHonorApp extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "tams-party-honor",
    classes: ["tams", "party-honor"],
    position: { width: 480, height: "auto" },
    window: {
      title: "TAMS.Honor.PartyHonor",
      icon: "fas fa-shield-alt"
    },
    actions: {
      adjustScore: TAMSPartyHonorApp.prototype._onAdjustScore
    }
  };

  static PARTS = {
    form: { template: "systems/tams/templates/party-honor.html" }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const partyHonor = getPartyHonor();
    context.paths = Object.entries(HONOR_PATHS).map(([id, pathData]) => {
      const score = partyHonor[id] ?? 0;
      return { id, score, labelKey: pathData.labelKey, tier: getHonorTier(score, id) };
    });
    context.isGM = game.user.isGM;
    return context;
  }

  async _onAdjustScore(event, target) {
    if (!game.user.isGM) return;
    const path = target.dataset.path;
    const partyHonor = getPartyHonor();
    const current = partyHonor[path] ?? 0;
    const pathData = HONOR_PATHS[path];
    if (!pathData) return;

    foundry.applications.api.DialogV2.wait({
      window: { title: `${game.i18n.localize(pathData.labelKey)} — ${game.i18n.localize("TAMS.Honor.EditScore")}` },
      content: `<div class="form-group" style="padding: 10px;">
        <label>${game.i18n.localize("TAMS.Honor.Score")} (-100 ${game.i18n.localize("TAMS.Honor.To")} 100)</label>
        <input type="number" name="score" value="${current}" min="-100" max="100" style="width: 80px; margin-left: 10px;"/>
      </div>`,
      rejectClose: false,
      buttons: [
        { action: "save", icon: "fa-solid fa-save", label: game.i18n.localize("TAMS.Save"), default: true, callback: async (event, button, dialog) => {
            const val = parseInt(dialog.element.querySelector('[name="score"]').value);
            if (!isNaN(val)) {
              partyHonor[path] = Math.clamp(val, -100, 100);
              await setPartyHonor(partyHonor);
              this.render();
            }
          }
        },
        { action: "cancel", icon: "fa-solid fa-times", label: game.i18n.localize("TAMS.Cancel") }
      ]
    });
  }
}
