import { TAMSActorSheet } from './actor-sheet.js';

/**
 * A simplified actor sheet specifically for Downtime tracking.
 */
export class TAMSDowntimeSheet extends TAMSActorSheet {
  /** @override */
  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
      classes: ["tams", "sheet", "actor", "downtime"],
      position: { width: 500, height: 650 },
      window: { resizable: true, scrollable: [".downtime-scroll"] },
      actions: {
        outputDowntime: TAMSDowntimeSheet.prototype._onOutputDowntime,
        resetDowntime: TAMSDowntimeSheet.prototype._onResetDowntime,
        sendAwardToChat: TAMSDowntimeSheet.prototype._onSendAwardToChat
      }
    }, { inplace: false });
  }

  static PARTS = {
    form: {
      template: "systems/tams/templates/downtime-sheet.html"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    return context;
  }

  /**
   * Handle outputting downtime trackers to chat.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onOutputDowntime(event, target) {
    const actor = this.document;
    const downtime = actor.system.downtime;
    const trackers = downtime.trackers;
    const isSafe = downtime.isSafe;

    const labels = {
      ability: "TAMS.DowntimeTrackerAbility",
      skill: "TAMS.DowntimeTrackerSkill",
      weapon: "TAMS.DowntimeTrackerWeapon",
      statistic: "TAMS.DowntimeTrackerStatistic",
      crafting: "TAMS.DowntimeTrackerCrafting",
      resting: "TAMS.DowntimeTrackerResting",
      healing: "TAMS.DowntimeTrackerHealing",
      working: "TAMS.DowntimeTrackerWorking"
    };

    let content = `
      <div class="tams-roll">
        <h3 class="roll-label">${game.i18n.localize('TAMS.DowntimeTracking')}: ${actor.name}</h3>
        <div class="roll-row">
          <span>${game.i18n.localize('TAMS.DowntimeDays')}:</span>
          <span class="roll-value">${downtime.days}</span>
        </div>
        <div class="roll-row">
          <span>${game.i18n.localize('TAMS.DowntimeIsSafe')}:</span>
          <span class="roll-value">${isSafe ? game.i18n.localize('TAMS.DowntimeSafe') : game.i18n.localize('TAMS.DowntimeUnsafe')}</span>
        </div>
        <hr>
    `;

    let hasTrackers = false;
    for (const [key, value] of Object.entries(trackers)) {
      if (value > 0) {
        hasTrackers = true;
        content += `
          <div class="roll-row">
            <span>${game.i18n.localize(labels[key])}:</span>
            <span class="roll-value">${value} ${game.i18n.localize('TAMS.Days')}</span>
          </div>
        `;
      }
    }

    if (!hasTrackers) {
      content += `<p><i>No downtime activities tracked.</i></p>`;
    }

    if (downtime.notes) {
      content += `<hr><div class="roll-description">${downtime.notes}</div>`;
    }

    content += `</div>`;

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      content: content
    });
  }

  /**
   * Handle resetting all downtime trackers to 0.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onResetDowntime(event, target) {
    const confirmed = await Dialog.confirm({
      title: game.i18n.localize("TAMS.DowntimeReset"),
      content: `<p>Are you sure you want to reset all downtime trackers to 0 for ${this.document.name}?</p>`,
      yes: () => true,
      no: () => false,
      defaultYes: false
    });

    if (confirmed) {
      const updates = {};
      for (const key of Object.keys(this.document.system.downtime.trackers)) {
        updates[`system.downtime.trackers.${key}`] = 0;
      }
      await this.document.update(updates);
    }
  }

  /**
   * Send a downtime award button to chat.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onSendAwardToChat(event, target) {
    const input = target.parentElement.querySelector(".award-days");
    const days = parseInt(input.value) || 0;
    
    const content = `
      <div class="tams-roll">
        <h3 class="roll-label">${game.i18n.localize('TAMS.DowntimeAwardTitle')}</h3>
        <p>${game.i18n.format('TAMS.DowntimeAwardDescription', {days})}</p>
        <button class="tams-apply-downtime" data-days="${days}">
            ${game.i18n.localize('TAMS.DowntimeApplyAward')}
        </button>
      </div>
    `;

    await ChatMessage.create({
      user: game.user.id,
      content: content,
      speaker: ChatMessage.getSpeaker({ actor: this.document })
    });
  }
}
