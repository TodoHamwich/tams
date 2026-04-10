/**
 * The TAMS Travel Pace Application.
 * Allows GMs and Players to calculate travel distance based on party speed and pace.
 */
export class TAMSTravelPaceApp extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  constructor(options={}) {
    super(options);
    this.distanceKm = 0;
    this.fmHours = 0;
    this.daysBetweenRest = 0;
    this.warmMealsEnabled = false;
    this.warmMealsValue = 0;
    this.cookUuid = "";
    this.cookDC = 10;
    this.warmMealsResults = [];
    this.membersState = {}; // { actorUuid: { speed: null, isMounted: false } }
    this.members = []; // Array of actor UUIDs
    this._focusSelector = null;
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    tag: "div",
    id: "tams-travel-pace",
    classes: ["tams", "travel-pace"],
    position: { width: 400, height: "auto" },
    window: {
      title: "TAMS.TravelPaceMenu",
      resizable: true,
      icon: "icons/svg/walk.svg"
    },
    actions: {
      addMember: TAMSTravelPaceApp.prototype._onAddMember,
      removeMember: TAMSTravelPaceApp.prototype._onRemoveMember,
      makeCookChecks: TAMSTravelPaceApp.prototype._onMakeCookChecks,
      outputToChat: TAMSTravelPaceApp.prototype._onOutputToChat
    }
  };

  /** @override */
  static PARTS = {
    form: {
      template: "systems/tams/templates/travel-pace.html"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    
    context.distanceKm = this.distanceKm;
    context.fmHours = this.fmHours;
    context.daysBetweenRest = this.daysBetweenRest;
    context.warmMealsEnabled = this.warmMealsEnabled;
    context.warmMealsValue = this.warmMealsValue;
    context.cookUuid = this.cookUuid;
    context.cookDC = this.cookDC;
    
    const mileToKm = 1.60934;
    const memberData = this.members.map(uuid => {
      const actor = fromUuidSync(uuid);
      if (!actor) return null;
      const state = this.membersState[uuid] || { speed: null, isMounted: false };
      
      const endurance = actor.system.stats?.endurance?.value || 0;
      const end10 = Math.floor(endurance / 10);
      
      const defaultSpeed = state.isMounted ? 40 : 20;
      const currentSpeed = state.speed !== null && state.speed !== "" ? parseFloat(state.speed) : defaultSpeed;
      const baseSpeedKmPerDay = currentSpeed * mileToKm;
      const adjustedSpeedKmPerDay = baseSpeedKmPerDay * (8 + this.fmHours) / 8;

      return {
        actor,
        uuid,
        state,
        end10,
        currentSpeed,
        baseSpeedKmPerDay,
        adjustedSpeedKmPerDay,
        defaultSpeed
      };
    }).filter(m => m !== null);

    context.partyCookOptions = memberData.reduce((acc, m) => {
      acc[m.uuid] = m.actor.name;
      return acc;
    }, {});

    // Party speed is the slowest adjusted speed
    const partySpeedKmPerDay = memberData.length > 0 
      ? Math.min(...memberData.map(m => m.adjustedSpeedKmPerDay)) 
      : 0;
    
    const totalTravelDays = partySpeedKmPerDay > 0 ? (this.distanceKm / partySpeedKmPerDay) : 0;
    let totalElapsedDays = totalTravelDays;
    if (this.daysBetweenRest > 0 && totalTravelDays > 0) {
      const numRests = Math.floor((totalTravelDays - 0.000001) / this.daysBetweenRest);
      totalElapsedDays += numRests;
    }
    context.timeBreakdown = this._formatTime(totalElapsedDays);

    const mealValGlobal = this.warmMealsEnabled ? (parseFloat(this.warmMealsValue) || 0) : 0;

    context.members = memberData.map(m => {
      const staminaPerDay = [];
      let totalStamina = 0;

      if (totalTravelDays > 0) {
        let travelDayCount = 0;
        let daysInCycle = 0;
        const fullTravelDays = Math.floor(totalTravelDays);
        const totalElapsedDaysToIterate = Math.ceil(totalElapsedDays);

        for (let e = 1; e <= totalElapsedDaysToIterate; e++) {
          // Check if this is a rest day
          if (this.daysBetweenRest > 0 && travelDayCount > 0 && travelDayCount % this.daysBetweenRest === 0 && daysInCycle === this.daysBetweenRest) {
            staminaPerDay.push(0); // Rest day
            daysInCycle = 0;
            continue;
          }

          // Travel day
          travelDayCount++;
          daysInCycle++;

          const hasWarmMeal = this.warmMealsEnabled && this.cookUuid && (this.warmMealsResults.length >= travelDayCount ? this.warmMealsResults[travelDayCount - 1] : true);
          const currentMealVal = hasWarmMeal ? (parseFloat(this.warmMealsValue) || 0) : 0;
          const bonus = m.end10 + currentMealVal;

          if (travelDayCount <= fullTravelDays) {
            const dailyAccumulatedFM = daysInCycle * this.fmHours;
            const cost = Math.ceil(Math.max(0, dailyAccumulatedFM - bonus));
            staminaPerDay.push(cost);
            totalStamina += cost;
          } else if (travelDayCount > fullTravelDays && travelDayCount <= Math.ceil(totalTravelDays)) {
            // Partial last day
            const lastDayFraction = totalTravelDays - fullTravelDays;
            if (lastDayFraction > 0) {
              const totalTravelHoursPerDay = 8 + this.fmHours;
              const lastDayHours = lastDayFraction * totalTravelHoursPerDay;
              const lastDayFM = Math.max(0, lastDayHours - 8);
              
              const dailyAccumulatedFM = ((daysInCycle - 1) * this.fmHours) + lastDayFM;
              const cost = Math.ceil(Math.max(0, dailyAccumulatedFM - bonus));
              staminaPerDay.push(cost);
              totalStamina += cost;
            }
          }
        }
      }

      let staminaCons = "0";
      let staminaPerRest = 0;
      if (this.daysBetweenRest > 0) {
        for (let d = 1; d <= this.daysBetweenRest; d++) {
          const dailyAccumulatedFM = d * this.fmHours;
          staminaPerRest += Math.ceil(Math.max(0, dailyAccumulatedFM - (m.end10 + mealValGlobal)));
        }
      }

      if (totalStamina > 0) {
        if (staminaPerDay.length <= 5) {
          staminaCons = staminaPerDay.join(", ");
        } else {
          const first = staminaPerDay[0];
          const last = staminaPerDay[staminaPerDay.length - 1];
          staminaCons = `${first} ... ${last} (${game.i18n.localize("TAMS.Total")}: ${totalStamina})`;
        }
      }

      return {
        uuid: m.uuid,
        name: m.actor.name,
        img: m.actor.img,
        speed: m.state.speed,
        isMounted: m.state.isMounted,
        defaultSpeed: m.defaultSpeed,
        currentSpeed: m.currentSpeed,
        staminaCons,
        staminaPerRest,
        staminaPerDay,
        totalStamina,
        end10: m.end10
      };
    });

    return context;
  }

  _formatTime(totalDays) {
    if (totalDays === 0 || isNaN(totalDays)) return null;
    
    let days = Math.floor(totalDays);
    let fractionalDay = totalDays - days;
    const travelHoursPerDay = 8 + this.fmHours;
    let hours = Math.round(fractionalDay * travelHoursPerDay);
    
    if (hours >= travelHoursPerDay) {
      days += 1;
      hours -= travelHoursPerDay;
    }
    
    let months = Math.floor(days / 30);
    days %= 30;
    let weeks = Math.floor(days / 7);
    days %= 7;
    
    return { months, weeks, days, hours };
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    
    const html = this.element;
    // Add event listeners for focus tracking
    html.addEventListener('focusin', (event) => {
        this._storeFocus(event.target);
    }, true);

    // Add event listeners for inputs
    html.querySelectorAll('input, select, textarea').forEach(input => {
      // Real-time state update (no render)
      input.addEventListener('input', (event) => {
        const action = input.dataset.action;
        if (action === 'updateValue') this._onUpdateValue(event, input, false);
        else if (action === 'updateMember') this._onUpdateMember(event, input, false);
      });

      // Committed change (trigger render)
      input.addEventListener('change', (event) => {
        const action = input.dataset.action;
        if (action === 'updateValue') this._onUpdateValue(event, input, true);
        else if (action === 'updateMember') this._onUpdateMember(event, input, true);
        else if (action === 'toggleValue') this._onToggleValue(event, input, true);
      });
    });

    if (this._focusSelector) {
        const el = this.element.querySelector(this._focusSelector);
        if (el) {
            el.focus();
            // Only apply selection range if the input supports it and we have a range
            const supportsSelection = el.type && ["text", "search", "url", "tel", "password"].includes(el.type);
            if (supportsSelection && el.setSelectionRange && this._selectionRange) {
                el.setSelectionRange(this._selectionRange[0], this._selectionRange[1]);
            }
        }
        this._focusSelector = null;
        this._selectionRange = null;
    }
  }

  /* -------------------------------------------- */
  /*  Action Handlers                             */
  /* -------------------------------------------- */

  _onUpdateValue(event, target, render = true) {
    const field = target.dataset.field;
    if (target.type === "number") {
      this[field] = target.value === "" ? 0 : (parseFloat(target.value) || 0);
    } else {
      this[field] = target.value;
    }
    if (render) {
        this._storeFocus();
        this.render();
    }
  }

  _onToggleValue(event, target, render = true) {
    const field = target.dataset.field;
    this[field] = target.checked;
    if (render) {
        this._storeFocus();
        this.render();
    }
  }

  _onUpdateMember(event, target, render = true) {
    const actorUuid = target.closest(".member").dataset.actorUuid;
    const field = target.dataset.field;
    if (!this.membersState[actorUuid]) {
      this.membersState[actorUuid] = { speed: null, isMounted: false };
    }
    
    if (target.type === "checkbox") {
      this.membersState[actorUuid][field] = target.checked;
    } else {
      this.membersState[actorUuid][field] = target.value;
    }
    if (render) {
        this._storeFocus();
        this.render();
    }
  }

  async _onAddMember(event, target) {
    const tokens = canvas.tokens.controlled;
    if (tokens.length === 0) {
      ui.notifications.warn(game.i18n.localize("TAMS.Notifications.SelectTokensForTravel"));
      return;
    }
    
    let added = false;
    for (let t of tokens) {
      if (t.actor && !this.members.includes(t.actor.uuid)) {
        this.members.push(t.actor.uuid);
        this.membersState[t.actor.uuid] = { speed: null, isMounted: false };
        added = true;
      }
    }
    if (added) this.render();
  }

  _onRemoveMember(event, target) {
    const actorUuid = target.closest(".member").dataset.actorUuid;
    this.members = this.members.filter(uuid => uuid !== actorUuid);
    delete this.membersState[actorUuid];
    if (this.cookUuid === actorUuid) this.cookUuid = "";
    this.render();
  }

  async _onMakeCookChecks(event, target) {
    if (!this.warmMealsEnabled) return;

    if (!this.cookUuid) {
      ui.notifications.warn(game.i18n.localize("TAMS.Notifications.SelectCook"));
      return;
    }
    const cookActor = fromUuidSync(this.cookUuid);
    if (!cookActor) {
      ui.notifications.warn(game.i18n.localize("TAMS.Notifications.SelectCook"));
      return;
    }

    if (this.members.length === 0) {
      ui.notifications.warn(game.i18n.localize("TAMS.Notifications.NoMembersForCook"));
      return;
    }

    if (this.distanceKm <= 0) {
      ui.notifications.warn(game.i18n.localize("TAMS.Notifications.EnterDistance"));
      return;
    }

    // Recalculate days
    const mileToKm = 1.60934;
    const memberSpeeds = this.members.map(uuid => {
      const state = this.membersState[uuid] || { speed: null, isMounted: false };
      const defaultSpeed = state.isMounted ? 40 : 20;
      return state.speed !== null && state.speed !== "" ? parseFloat(state.speed) : defaultSpeed;
    });
    const partySpeedMiles = memberSpeeds.length > 0 ? Math.min(...memberSpeeds) : 0;
    const adjustedSpeedKmPerDay = (partySpeedMiles * mileToKm) * (8 + this.fmHours) / 8;
    const totalTravelDays = adjustedSpeedKmPerDay > 0 ? Math.ceil(this.distanceKm / adjustedSpeedKmPerDay) : 0;

    if (totalTravelDays <= 0) return;

    const results = [];
    const dc = this.cookDC || 10;
    const rollSummary = [];

    // Find Cooking skill by "Cooking" tag
    const skill = cookActor.items.find(i => {
      if (i.type !== "skill") return false;
      const tags = (i.system.tags || "").split(",").map(t => t.trim().toLowerCase());
      return tags.includes("cooking");
    });
    const wisdom = cookActor.system.stats.wisdom;
    
    let statId = "wisdom";
    let statValue = wisdom.value;
    let statMod = wisdom.mod;
    let familiarity = 0;
    let bonus = 0;

    if (skill) {
      statId = skill.system.stat;
      const stat = cookActor.system.stats[statId];
      statValue = stat.value;
      statMod = stat.mod;
      familiarity = parseInt(skill.system.familiarity) || 0;
      bonus = parseInt(skill.system.bonus) || 0;
    }

    for (let d = 1; d <= totalTravelDays; d++) {
      const roll = await new Roll("1d100").evaluate();
      const rawResult = roll.total;
      const cappedResult = Math.min(rawResult, statValue + statMod);
      const total = cappedResult + familiarity + bonus;
      const success = total >= dc;
      results.push(success);
      rollSummary.push(`Day ${d}: ${total} (Roll: ${rawResult}) - ${success ? "Success" : "Failure"}`);
    }

    this.warmMealsResults = results;
    
    const content = `
      <div class="tams-roll">
        <h3 class="roll-label">${game.i18n.localize("TAMS.MakeCookChecks")}: ${cookActor.name}</h3>
        <p><small>${game.i18n.format("TAMS.CookCheckDescription", {dc})}</small></p>
        <ul style="list-style: none; padding: 0; font-size: 0.9em;">
          ${rollSummary.map(s => `<li>${s}</li>`).join("")}
        </ul>
      </div>
    `;
    ChatMessage.create({
      user: game.user.id,
      content: content,
      speaker: ChatMessage.getSpeaker({ actor: cookActor })
    });

    this.render();
  }

  _storeFocus(target = null) {
    target = target || document.activeElement;
    if ( !target || !this.element?.contains(target) ) return;
    const field = target.dataset.field;
    if ( !field ) return;

    const member = target.closest(".member");
    if (member) {
        const uuid = member.dataset.actorUuid;
        this._focusSelector = `.member[data-actor-uuid="${uuid}"] [data-field="${field}"]`;
    } else {
        this._focusSelector = `[data-field="${field}"]`;
    }
    
    // Only store selection range if the input type supports it
    const supportsSelection = target.type && ["text", "search", "url", "tel", "password"].includes(target.type);
    if (supportsSelection && target.setSelectionRange) {
        this._selectionRange = [target.selectionStart, target.selectionEnd];
    } else {
        this._selectionRange = null;
    }
  }

  async _onOutputToChat(event, target) {
    const context = await this._prepareContext();
    const { timeBreakdown, members } = context;
    
    let timeParts = [];
    if (timeBreakdown) {
      if (timeBreakdown.months) timeParts.push(`${timeBreakdown.months} ${game.i18n.localize("TAMS.Months")}`);
      if (timeBreakdown.weeks) timeParts.push(`${timeBreakdown.weeks} ${game.i18n.localize("TAMS.Weeks")}`);
      if (timeBreakdown.days) timeParts.push(`${timeBreakdown.days} ${game.i18n.localize("TAMS.Days")}`);
      if (timeBreakdown.hours) timeParts.push(`${timeBreakdown.hours} ${game.i18n.localize("TAMS.Hours")}`);
    }
    const timeString = timeParts.length > 0 ? timeParts.join(", ") : `0 ${game.i18n.localize("TAMS.Hours")}`;

    let staminaInfo = members.map(m => {
      const dayBreakdown = m.staminaPerDay
        .map((cost, i) => cost > 0 ? `${game.i18n.localize("TAMS.Day")} ${i + 1}: ${cost}` : null)
        .filter(d => d !== null);

      let info = `<li><strong>${m.name}</strong>: ${m.totalStamina} ${game.i18n.localize("TAMS.Stamina")}</li>`;
      if (dayBreakdown.length > 0) {
        info += `<li style="list-style: none; margin-left: 10px; font-size: 0.85em;">${dayBreakdown.join(", ")}</li>`;
      }
      if (m.staminaPerRest) {
        info += `<li style="list-style: none; margin-left: 10px; font-size: 0.8em;">(${game.i18n.localize("TAMS.StaminaPerRest")}: ${m.staminaPerRest})</li>`;
      }
      return info;
    }).join("");

    const content = `
      <div class="tams-roll travel-pace-card">
        <h3 class="roll-label">${game.i18n.localize("TAMS.TravelResults")}</h3>
        <div class="roll-row">
          <span>${game.i18n.localize("TAMS.TravelTimeResult")}:</span>
          <span>${timeString}</span>
        </div>
        <hr>
        <div class="roll-description"><strong>${game.i18n.localize("TAMS.StaminaConsumption")}:</strong></div>
        <ul style="list-style: none; padding: 0; margin: 0;">${staminaInfo}</ul>
      </div>
    `;

    ChatMessage.create({
      user: game.user.id,
      content: content,
      speaker: ChatMessage.getSpeaker()
    });
  }
}
