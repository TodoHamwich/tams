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
    const path = target.dataset.path;
    const partyHonor = getPartyHonor();
    const current = partyHonor[path] ?? 0;
    const pathData = HONOR_PATHS[path];
    if (!pathData) return;

    new Dialog({
      title: `${game.i18n.localize(pathData.labelKey)} — ${game.i18n.localize("TAMS.Honor.EditScore")}`,
      content: `<div class="form-group" style="padding: 10px;">
        <label>${game.i18n.localize("TAMS.Honor.Score")} (-100 ${game.i18n.localize("TAMS.Honor.To")} 100)</label>
        <input type="number" name="score" value="${current}" min="-100" max="100" style="width: 80px; margin-left: 10px;"/>
      </div>`,
      buttons: {
        save: {
          icon: '<i class="fas fa-save"></i>',
          label: game.i18n.localize("TAMS.Save"),
          callback: async (html) => {
            const val = parseInt(html.find('[name="score"]').val());
            if (!isNaN(val)) {
              partyHonor[path] = Math.clamp(val, -100, 100);
              await setPartyHonor(partyHonor);
              this.render();
            }
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("TAMS.Cancel")
        }
      },
      default: "save"
    }).render(true);
  }
}
