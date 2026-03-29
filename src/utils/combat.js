/**
 * Update a message in the chat log.
 * @param {ChatMessage} message The message document.
 * @param {object} updateData Data to update.
 * @returns {Promise<ChatMessage>}
 */
export async function tamsUpdateMessage(message, updateData) {
  if (game.user.isGM || message.isAuthor) {
    try {
      return await message.update(updateData);
    } catch (err) {
      console.error("TAMS | Failed to update message", err);
    }
  }
  
  game.socket.emit("system.tams", {
    type: "updateMessage",
    messageId: message.id,
    updateData: updateData
  });
}

/**
 * Helper: Roll hit location.
 * @param {number|null} rollValue Optional roll value (1-100).
 * @returns {Promise<string>} The hit location name.
 */
export async function getHitLocation(rollValue = null) {
    const raw = rollValue ?? (await new Roll("1d100").evaluate()).total;
    if (raw >= 96) return "Head";
    if (raw >= 56) return "Thorax";
    if (raw >= 41) return "Stomach";
    if (raw >= 31) return "Left Arm";
    if (raw >= 21) return "Right Arm";
    if (raw >= 11) return "Left Leg";
    return "Right Leg";
}

/**
 * Helper: Show consolidated injury dialog.
 * @param {Actor} target The actor document.
 * @param {object[]} pendingChecks List of checks to perform.
 * @returns {Promise<void>}
 */
export async function showCombinedInjuryDialog(target, pendingChecks) {
    let content = `<div class="tams-injury-dialog">
        <p><b>${target.name}</b> ${game.i18n.localize("TAMS.Checks.MustMakeChecks")}:</p>`;

    pendingChecks.forEach((check, i) => {
        if (check.type === 'injured') {
            content += `
                <div class="check-row" style="background: rgba(241, 196, 15, 0.1); padding: 5px; margin-top: 5px; border: 1px solid #f39c12; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                    <label><b>${game.i18n.format("TAMS.Checks.InjuryCheck", {loc: check.loc})}</b> (DC ${check.dc})</label>
                    <button class="roll-check" data-index="${i}" style="width: 120px; font-size: 11px; background: #f39c12; color: white;">${game.i18n.localize("TAMS.Checks.RollEndurance")}</button>
                </div>`;
        } else if (check.type === 'crit') {
            content += `
                <div class="check-row" style="border-bottom: 1px solid #ccc; padding: 5px 0; display: flex; justify-content: space-between; align-items: center;">
                    <label><b>${game.i18n.format("TAMS.Checks.CritCheck", {loc: check.loc})}</b> (DC ${check.dc})</label>
                    <button class="roll-check" data-index="${i}" style="width: 120px; font-size: 11px;">${game.i18n.localize("TAMS.Checks.RollEndurance")}</button>
                </div>`;
        } else if (check.type === 'unconscious') {
            content += `
                <div class="check-row" style="background: rgba(52, 152, 219, 0.1); padding: 5px; margin-top: 5px; border: 1px solid #3498db; border-radius: 4px;">
                    <label><b>${game.i18n.localize("TAMS.Checks.UnconsciousCheck")}</b> (DC ${check.dc})</label>
                    <p style="font-size: 0.8em; margin: 2px 0;">${check.reasons.join("<br>")}</p>
                    <button class="roll-check" data-index="${i}" style="width: 100%; margin-top: 5px; background: #2980b9; color: white; font-size: 12px;">${game.i18n.localize("TAMS.Checks.RollStayAwake")}</button>
                </div>`;
        } else if (check.type === 'survival') {
            content += `
                <div class="check-row" style="background: rgba(231, 76, 60, 0.1); padding: 5px; margin-top: 5px; border: 1px solid #e74c3c; border-radius: 4px;">
                    <label><b>${game.i18n.localize("TAMS.Checks.SurvivalCheck")}</b> (DC ${check.dc})</label>
                    <p style="font-size: 0.8em; margin: 2px 0;">${check.reasons.join("<br>")}</p>
                    <button class="roll-check" data-index="${i}" style="width: 100%; margin-top: 5px; background: #4a0000; color: white; font-size: 12px;">${game.i18n.localize("TAMS.Checks.RollSurvival")}</button>
                </div>`;
        }
    });
    content += `</div>`;

    new Dialog({
        title: game.i18n.format("TAMS.Checks.InjuriesAndSurvival", {name: target.name}),
        content: content,
        buttons: { close: { label: game.i18n.localize("TAMS.Checks.Close") } },
        render: (html) => {
            html.find('.roll-check').click(async ev => {
                const btn = ev.currentTarget;
                const idx = parseInt(btn.dataset.index);
                const check = pendingChecks[idx];
                const end = target.system.stats.endurance.total;
                
                let bonus = 0;
                let resourceSpent = null;

                const roll = await new Roll("1d100").evaluate();
                const raw = roll.total;
                const capped = Math.min(raw, end);
                const total = capped + bonus;
                const success = total >= check.dc;

                let report = "";
                if (check.type === 'injured') {
                    report = `
                        <div class="tams-roll">
                            <h3 class="roll-label" style="color: #f39c12;">${game.i18n.format("TAMS.Checks.EnduranceCheckInjury", {loc: check.loc})}</h3>
                            <div class="roll-row"><span>${game.i18n.localize("TAMS.Checks.Dice")}</span><span>${raw}</span></div>
                            <div class="roll-row"><span>${game.i18n.format("TAMS.Checks.Capped", {end: end})}</span><span>${capped}</span></div>
                            <div class="roll-total">${game.i18n.format("TAMS.Checks.TotalVsDC", {total: capped, dc: check.dc})}</div>
                            ${success ? `<div class="tams-success">${game.i18n.localize("TAMS.Checks.SuccessNotInjured")}</div>` : `<div class="tams-crit failure" style="background:#fff4cc; color:#856404; border-color:#ffeeba;">${game.i18n.localize("TAMS.Checks.FailedInjured")}</div>`}
                        </div>
                    `;
                    if (!success) {
                        await target.update({[`system.limbs.${check.limbKey}.injured`]: true});
                    }
                } else if (check.type === 'crit') {
                    report = `
                        <div class="tams-roll">
                            <h3 class="roll-label">${game.i18n.format("TAMS.Checks.EnduranceCheck", {loc: check.loc})}</h3>
                            <div class="roll-row"><span>${game.i18n.localize("TAMS.Checks.Dice")}</span><span>${raw}</span></div>
                            <div class="roll-row"><span>${game.i18n.format("TAMS.Checks.Capped", {end: end})}</span><span>${capped}</span></div>
                            <div class="roll-total">${game.i18n.format("TAMS.Checks.TotalVsDC", {total: capped, dc: check.dc})}</div>
                            ${success ? `<div class="tams-success">${game.i18n.localize("TAMS.Checks.Success")}</div>` : `<div class="tams-crit failure">${game.i18n.localize("TAMS.Checks.FailedCrit")}</div>`}
                        </div>
                    `;
                    if (!success) {
                        await target.update({[`system.limbs.${check.limbKey}.criticallyInjured`]: true});
                    }
                } else if (check.type === 'unconscious') {
                    report = `
                        <div class="tams-roll" data-actor-uuid="${target.uuid}" data-actor-id="${target.id}" data-dc="${check.dc}" data-raw="${raw}" data-end="${end}" data-reasons='${JSON.stringify(check.reasons)}'>
                            <h3 class="roll-label" style="color: #2980b9;">${game.i18n.format("TAMS.Checks.UnconsciousCheckLabel", {name: target.name})}</h3>
                            <div class="roll-row"><span>${game.i18n.localize("TAMS.Checks.Dice")}</span><span>${raw}</span></div>
                            <div class="roll-row"><span>${game.i18n.format("TAMS.Checks.Capped", {end: end})}</span><span>${capped}</span></div>
                            <div class="roll-boost-container"></div>
                            <div class="roll-total">${game.i18n.format("TAMS.Checks.TotalVsDC", {total: capped, dc: check.dc})}</div>
                            ${success ? `<div class="tams-success" style="font-size:1.1em; font-weight:bold;">${game.i18n.localize("TAMS.Checks.RemainsConscious")}</div>` : `<div class="tams-crit failure" style="font-size:1.1em;">${game.i18n.localize("TAMS.Checks.FallsUnconscious")}</div>`}
                            <div class="roll-contest-hint"><small>${game.i18n.format("TAMS.Checks.Reasons", {reasons: check.reasons.join(", ")})}</small></div>
                            <div class="roll-row" style="margin-top: 5px;">
                                <button class="tams-boost-unconscious">${game.i18n.localize("TAMS.Checks.SpendResourceToBoost")}</button>
                            </div>
                        </div>
                    `;
                } else {
                    report = `
                        <div class="tams-roll">
                            <h3 class="roll-label" style="color: #8b0000;">${game.i18n.format("TAMS.Checks.SurvivalCheckLabel", {name: target.name})}</h3>
                            <div class="roll-row"><span>${game.i18n.localize("TAMS.Checks.Dice")}</span><span>${raw}</span></div>
                            <div class="roll-row"><span>${game.i18n.format("TAMS.Checks.Capped", {end: end})}</span><span>${capped}</span></div>
                            <div class="roll-total">${game.i18n.format("TAMS.Checks.TotalVsDC", {total: capped, dc: check.dc})}</div>
                            ${success ? `<div class="tams-success" style="font-size:1.2em; font-weight:bold;">${game.i18n.localize("TAMS.Checks.Survived")}</div>` : `<div class="tams-crit failure" style="font-size:1.2em;">${game.i18n.localize("TAMS.Checks.FatalInjury")}</div>`}
                        </div>
                    `;
                }
                
                ChatMessage.create({ speaker: ChatMessage.getSpeaker({actor: target}), content: report });
                
                btn.disabled = true;
                btn.innerText = success ? game.i18n.localize("TAMS.Checks.Pass") : game.i18n.localize("TAMS.Checks.Fail");
                btn.style.background = success ? "#2e7d32" : "#c62828";
            });
        }
    }).render(true);
}

/**
 * Handle rendering chat messages to attach listeners to TAMS-specific buttons.
 * @param {ChatMessage} message
 * @param {HTMLElement|jQuery} html
 * @param {object} data
 */
export async function tamsRenderChatMessage(message, html, data) {
    const root = (html instanceof jQuery) ? html[0] : html;
    
    // Style toggle buttons based on current container state
    root.querySelectorAll('.tams-roll').forEach(container => {
        container.querySelectorAll('.tams-behind-toggle').forEach(btn => {
            btn.style.background = container.classList.contains("behind-attack") ? "#2e7d32" : "#444";
        });
        container.querySelectorAll('.tams-unaware-toggle').forEach(btn => {
            btn.style.background = container.classList.contains("unaware-defender") ? "#2e7d32" : "#444";
        });
    });

    // Take Damage button
    root.querySelectorAll(".tams-take-damage").forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      const btn = ev.currentTarget;
      const damageBase = parseInt(btn.dataset.damage);
      const armourPen = parseInt(btn.dataset.armourPen) || 0;
      
      const multiLocations = btn.dataset.locations ? JSON.parse(btn.dataset.locations) : null;
      const locations = multiLocations || (btn.dataset.location ? [btn.dataset.location] : []);
      
      let target = null;
      const targetTokenId = btn.dataset.targetTokenId;
      const targetActorId = btn.dataset.targetActorId;
      const targetActorUuid = btn.dataset.targetActorUuid;
      
      if (targetActorUuid) target = fromUuidSync(targetActorUuid);
      if (!target && targetTokenId) {
          const token = canvas.tokens.get(targetTokenId);
          if (token) target = token.actor;
      }
      if (!target && targetActorId) target = game.actors.get(targetActorId);
      if (!target) target = canvas.tokens.controlled[0]?.actor ?? null;
      if (!target) target = [...(game?.user?.targets ?? [])][0]?.actor ?? null;

      if (!target) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.SelectTargetDamage"));

      const locationMap = {
        "Head": "head", "Thorax": "thorax", "Stomach": "stomach",
        "Left Arm": "leftArm", "Right Arm": "rightArm",
        "Left Leg": "leftLeg", "Right Leg": "rightLeg"
      };

      const isAoEHit = btn.dataset.isAoe === '1';
      const forceCrit = btn.dataset.forceCrit === '1';
      const isSquadOrHorde = target.system.settings?.isNPC && (target.system.settings.npcType === "squad" || target.system.settings.npcType === "horde");
      let initialMultiplier = 1;
      let squadHtml = "";
      if (isAoEHit && isSquadOrHorde) {
          const typeLabel = target.system.settings.npcType.toUpperCase();
          const currentSize = target.system.settings.squadSize || 1;
          initialMultiplier = target.system.settings.npcType === "squad" ? Math.min(2, currentSize) : Math.min(4, currentSize);
          squadHtml = `
            <div class="form-group" style="margin-bottom: 10px;">
                <label>${game.i18n.format("TAMS.Combat.TargetsHitInSquad", {type: typeLabel, max: currentSize})}</label>
                <input type="number" id="aoe-targets-hit" value="${initialMultiplier}" min="1" max="${currentSize}"/>
                <p style="color: #d35400; font-size: 0.85em;"><i>${game.i18n.localize("TAMS.Combat.EachHitMultipliedHint")}</i></p>
            </div>
          `;
      }
      const defaultDmg = damageBase * initialMultiplier;

      let dialogContent = `<p>${game.i18n.format("TAMS.Combat.ApplyingHitsTo", {count: locations.length, name: target.name})}</p>${squadHtml}`;
      locations.forEach((loc, i) => {
          const limbKey = locationMap[loc];
          const limb = target.system.limbs[limbKey];
          const armor = Math.floor(limb?.armor || 0);
          const armorMax = Math.floor(limb?.armorMax || 0);
          dialogContent += `
            <div class="form-group" style="margin-bottom: 5px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">
                <label>${game.i18n.format("TAMS.Combat.HitLabel", {index: i+1, location: loc})}</label>
                <div class="flexrow">
                    <span>${game.i18n.localize("TAMS.Combat.DmgShort")} </span><input type="number" class="hit-dmg" data-index="${i}" value="${defaultDmg}" style="width: 50px;"/>
                    <span>${game.i18n.localize("TAMS.Combat.ArmorShort")} ${armor}/${armorMax}</span>
                </div>
            </div>`;
      });

      new Dialog({
        title: game.i18n.format("TAMS.Checks.ApplyDamageTo", {name: target.name}),
        content: dialogContent,
        render: (html) => {
            html.find("#aoe-targets-hit").on("input", (ev) => {
                const multiplier = parseInt(ev.currentTarget.value) || 0;
                const newDmg = damageBase * multiplier;
                html.find(".hit-dmg").val(newDmg);
            });
        },
        buttons: {
        apply: { label: game.i18n.localize("TAMS.Checks.ApplyAllHits"), callback: async (html) => {
              const multiplier = (isAoEHit && isSquadOrHorde) ? (parseInt(html.find("#aoe-targets-hit").val()) || 1) : 1;
              const dmgInputs = html.find(".hit-dmg");
              const hits = [];
              
              for (let i = 0; i < locations.length; i++) {
                  const totalIncoming = Math.floor(parseFloat(dmgInputs[i].value) || 0);
                  const subHits = (isAoEHit && isSquadOrHorde) ? multiplier : 1;
                  let remainingDmg = totalIncoming;

                  for (let m = 0; m < subHits; m++) {
                      const incoming = Math.floor(remainingDmg / (subHits - m));
                      remainingDmg -= incoming;
                      if (incoming <= 0 && m > 0) continue; 

                      const loc = (isAoEHit && isSquadOrHorde && (m > 0 || i > 0)) ? await getHitLocation() : locations[i];
                      hits.push({ location: loc, damage: incoming, armourPen, forceCrit: forceCrit ? "1" : "0" });
                  }
              }

              const { pendingChecks, report } = await target.applyDamage(hits, { isAoE: isAoEHit, multiplier });
              ChatMessage.create({ content: report });
              if (pendingChecks.length > 0) showCombinedInjuryDialog(target, pendingChecks);
            }
          }
        },
        default: "apply"
      }).render(true);
    }));

    // Dodge button
    root.querySelectorAll('.tams-dodge').forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      const btn = ev.currentTarget;
      const attackerRaw = parseInt(btn.dataset.raw);
      const attackerTotal = parseInt(btn.dataset.total);
      const attackerMulti = parseInt(btn.dataset.multi) || 1;
      const attackerDamage = parseInt(btn.dataset.damage) || 0;
      const attackerArmourPen = parseInt(btn.dataset.armourPen) || 0;
      const firstLocation = btn.dataset.location;
      const attackerLocations = btn.dataset.locations ? JSON.parse(btn.dataset.locations) : (firstLocation ? [firstLocation] : []);
      const targetLimb = btn.dataset.targetLimb;
      const isAoEFromData = btn.dataset.isAoe === '1';
      const container = btn.closest(".tams-roll");
      const isBehind = container?.classList.contains("behind-attack") || false;
      const isUnaware = container?.classList.contains("unaware-defender") || false;

      let actor = null;
      const targetTokenId = btn.dataset.targetTokenId;
      const targetActorId = btn.dataset.targetActorId;
      if (targetTokenId) { const token = canvas.tokens.get(targetTokenId); if (token) actor = token.actor; }
      if (!actor && targetActorId) actor = game.actors.get(targetActorId);
      if (!actor) actor = canvas.tokens.controlled[0]?.actor ?? null;
      if (!actor) actor = [...(game?.user?.targets ?? [])][0]?.actor ?? null;

      if (!actor) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.SelectTargetDodge"));

      const dex = actor.system.stats.dexterity;
      let cap = dex.total;
      if (isBehind) cap = Math.floor(cap * (actor.system.behindMult ?? 0.5));
      if (isUnaware) cap = Math.floor(cap * 0.5);

      const roll = await new Roll('1d100').evaluate();
      const raw = roll.total;
      const capped = Math.min(raw, cap);
      const total = capped;

      let critInfo = "";
      if (raw >= (attackerRaw * 2)) {
          critInfo = `<div class="tams-crit success">${game.i18n.format("TAMS.Combat.CriticalDodge", {raw, attacker: attackerRaw})}</div>`;
      } else if (attackerRaw >= (raw * 2)) {
          critInfo = `<div class="tams-crit failure">${game.i18n.format("TAMS.Combat.CriticalHitTaken", {attacker: attackerRaw, raw})}</div>`;
      }

      let hitsScored = 0;
      let damageInfo = "";
      if (attackerTotal > total) {
          hitsScored = Math.min(1 + Math.floor((attackerTotal - total) / 5), attackerMulti);
          const locations = [];
          const limbOptions = { "head": "Head", "thorax": "Thorax", "stomach": "Stomach", "leftArm": "Left Arm", "rightArm": "Right Arm", "leftLeg": "Left Leg", "rightLeg": "Right Leg" };
          for (let i = 0; i < hitsScored; i++) {
              locations.push(attackerLocations[i] || (targetLimb && targetLimb !== 'none' ? limbOptions[targetLimb] : await getHitLocation()));
          }
          damageInfo = `
            <div class="roll-row"><b>${game.i18n.localize("TAMS.Combat.HitsTaken")} ${hitsScored} / ${attackerMulti}</b></div>
            <div class="roll-row"><small>${game.i18n.localize("TAMS.Location")}: ${locations.join(", ")}</small></div>
            <div class="roll-row" style="margin-top: 5px;">
                <button class="tams-take-damage" data-damage="${attackerDamage}" data-armour-pen="${attackerArmourPen}" data-locations='${JSON.stringify(locations)}' data-is-aoe="${isAoEFromData ? '1' : '0'}">${game.i18n.localize("TAMS.Combat.TakeDamage")}</button>
            </div>
          `;
          if (!critInfo) critInfo = `<div class="tams-failure">${game.i18n.format("TAMS.Combat.DodgeFailed", {total: attackerTotal})}</div>`;
      } else {
          if (!critInfo) critInfo = `<div class="tams-success">${game.i18n.format("TAMS.Combat.DodgeSuccess", {total: attackerTotal})}</div>`;
      }

      const msg = `
        <div class="tams-roll" data-actor-uuid="${actor.uuid}" data-actor-id="${actor.id}" data-attacker-total="${attackerTotal}" data-attacker-raw="${attackerRaw}" data-attacker-multi="${attackerMulti}" data-attacker-damage="${attackerDamage}" data-attacker-armour-pen="${attackerArmourPen}" data-first-location="${attackerLocations[0] || ""}" data-target-limb="${targetLimb}" data-raw="${raw}" data-capped="${capped}" data-unaware="${isUnaware ? '1' : '0'}" data-is-aoe="${isAoEFromData ? '1' : '0'}">
          <h3 class="roll-label">${game.i18n.format("TAMS.Combat.DodgeWith", {name: actor.name})} ${isBehind ? '(Behind)' : ''} ${isUnaware ? '(Unaware)' : ''}</h3>
          <div class="roll-crit-info">${critInfo}</div>
          <div class="roll-hits-info">${damageInfo}</div>
          <div class="roll-row"><span>${game.i18n.localize("TAMS.Combat.RawDiceResult")}</span><span class="roll-value">${raw}</span></div>
          <div class="roll-row"><small>${game.i18n.format("TAMS.Combat.StatCapLabel", {name: "Dex", value: cap})}</small><span>${capped}</span></div>
          <div class="roll-boost-container"></div>
          <hr>
          <div class="roll-total">${game.i18n.localize("TAMS.Total")}: <b>${total}</b></div>
          ${(attackerTotal > total && actor.type === 'character') ? `
            <div class="roll-row" style="margin-top: 5px;">
                <button class="tams-boost-dodge">${game.i18n.localize("TAMS.Checks.SpendResourceToBoost")}</button>
            </div>
          ` : ""}
          <div class="roll-contest-hint">
            <small><b>${game.i18n.localize("TAMS.Combat.ContestLabel")}</b> Total vs Attacker Total (${attackerTotal})</small><br>
            <small><b>${game.i18n.localize("TAMS.Combat.CritCheckLabel")}</b> Raw vs Attacker Raw (${attackerRaw})</small>
          </div>
        </div>`;

      ChatMessage.create({ speaker: ChatMessage.getSpeaker({actor}), content: msg, rolls: [roll] });
    }));

    // Dodge boost button (historical name: tams-boost-dodge)
    root.querySelectorAll('.tams-boost-dodge').forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      const btn = ev.currentTarget;
      const container = btn.closest(".tams-roll");
      const attackerTotal = parseInt(container.dataset.attackerTotal);
      const actorId = container.dataset.actorId;
      const actorUuid = container.dataset.actorUuid;
      const raw = parseInt(container.dataset.raw);
      const capped = parseInt(container.dataset.capped);
      
      const actor = fromUuidSync(actorUuid) || game.actors.get(actorId);
      if (!actor) return;

      const isUnawareFromData = container.dataset.unaware === '1';
      const pointsNeeded = Math.max(0, Math.ceil((attackerTotal - capped) / 5));

      const resources = [{id: "stamina", name: game.i18n.localize("TAMS.Stamina"), value: actor.system.stamina.value}];
      actor.system.customResources.forEach((res, idx) => {
          resources.push({id: idx.toString(), name: res.name, value: res.value});
      });
      const options = resources.map(r => `<option value="${r.id}">${r.name} (${r.value} ${game.i18n.localize("TAMS.AvailableShort")})</option>`).join('');

      const spending = await new Promise(resolve => {
        new Dialog({
          title: game.i18n.localize("TAMS.Combat.BoostDodgeTitle"),
          content: `
            <div class="form-group"><label>${game.i18n.localize("TAMS.Combat.Resource")}</label><select id="res-type">${options}</select></div>
            <div class="form-group">
                <label>${game.i18n.localize("TAMS.Combat.PointsSpentMax10")}</label>
                <input type="number" id="res-points" value="${Math.min(pointsNeeded, 10)}" min="0" max="10"/>
                <p><small>${game.i18n.localize("TAMS.Combat.BoostDodgeHint")}</small></p>
                <p><i>${pointsNeeded > 0 ? game.i18n.format("TAMS.Combat.MinToDodge", {points: pointsNeeded}) : game.i18n.localize("TAMS.Combat.AlreadyDodged")}</i></p>
            </div>
            <div class="form-group">
                <label>${game.i18n.localize("TAMS.Combat.UnawareCheckbox")}</label>
                <input type="checkbox" id="unaware" ${isUnawareFromData ? 'checked' : ''}/>
            </div>`,
          buttons: {
            go: { label: game.i18n.localize("TAMS.Combat.ApplyBoost"), callback: (html) => {
                const resId = html.find("#res-type").val();
                const res = resources.find(r => r.id === resId);
                let requestedPoints = Math.clamp(parseInt(html.find("#res-points").val()) || 0, 0, 10);
                if (requestedPoints > res.value) requestedPoints = res.value;
                resolve({ resId, points: requestedPoints, unaware: html.find("#unaware").is(":checked") });
            }},
            cancel: { label: game.i18n.localize("TAMS.Cancel"), callback: () => resolve(null) }
          },
          default: "go"
        }).render(true);
      });

      if (!spending) return;
      const { resId, points, unaware } = spending;
      const bonus = points * 5;

      if (points > 0) {
        if (resId === 'stamina') {
            await actor.update({"system.stamina.value": actor.system.stamina.value - points});
        } else {
            const idx = parseInt(resId);
            const customResources = foundry.utils.duplicate(actor.system.customResources);
            customResources[idx].value -= points;
            await actor.update({"system.customResources": customResources});
        }
      }

      let finalCapped = capped;
      if (unaware) finalCapped = Math.floor(finalCapped * 0.5);

      const total = finalCapped + bonus;
      let critInfo = "";
      let hitsScored = 0;
      let damageInfo = "";
      const attackerMulti = parseInt(container.dataset.attackerMulti) || 1;
      const attackerRaw = parseInt(container.dataset.attackerRaw);
      const attackerDamage = parseInt(container.dataset.attackerDamage) || 0;
      const attackerArmourPen = parseInt(container.dataset.attackerArmourPen) || 0;
      const firstLocation = container.dataset.firstLocation;
      const targetLimb = container.dataset.targetLimb;
      const isAoEFromData = container.dataset.isAoe === '1';

      if (raw >= (attackerRaw * 2)) {
          critInfo = `<div class="tams-crit success">${game.i18n.format("TAMS.Combat.CriticalDodge", {raw, attacker: attackerRaw})}</div>`;
      } else if (attackerRaw >= (raw * 2)) {
          critInfo = `<div class="tams-crit failure">${game.i18n.format("TAMS.Combat.CriticalHitTaken", {attacker: attackerRaw, raw})}</div>`;
      }

      if (attackerTotal > total) {
          hitsScored = Math.min(1 + Math.floor((attackerTotal - total) / 5), attackerMulti);
          const locations = [firstLocation];
          const limbOptions = { "head": "Head", "thorax": "Thorax", "stomach": "Stomach", "leftArm": "Left Arm", "rightArm": "Right Arm", "leftLeg": "Left Leg", "rightLeg": "Right Leg" };
          for (let i = 1; i < hitsScored; i++) {
              locations.push(targetLimb && targetLimb !== 'none' ? limbOptions[targetLimb] : await getHitLocation());
          }
          damageInfo = `
            <div class="roll-row"><b>${game.i18n.localize("TAMS.Combat.HitsTaken")} ${hitsScored} / ${attackerMulti}</b></div>
            <div class="roll-row"><small>${game.i18n.localize("TAMS.Location")}: ${locations.join(", ")}</small></div>
            <div class="roll-row" style="margin-top: 5px;">
                <button class="tams-take-damage" data-damage="${attackerDamage}" data-armour-pen="${attackerArmourPen}" data-locations='${JSON.stringify(locations)}' data-is-aoe="${isAoEFromData ? '1' : '0'}">${game.i18n.localize("TAMS.Combat.TakeDamage")}</button>
            </div>
          `;
          if (!critInfo) critInfo = `<div class="tams-failure">${game.i18n.format("TAMS.Combat.DodgeFailed", {total: attackerTotal})}</div>`;
      } else {
          if (!critInfo) critInfo = `<div class="tams-success">${game.i18n.format("TAMS.Combat.DodgeSuccess", {total: attackerTotal})}</div>`;
      }

      const boostHtml = `<div class="roll-row"><small>${game.i18n.localize("TAMS.Combat.BoostLabel")}</small><span>+${bonus}</span></div>`;
      if (unaware) {
          const labelEl = container.querySelector(".roll-label");
          if (!labelEl.innerText.includes("(Unaware)")) labelEl.innerText += " (Unaware)";
          container.querySelectorAll(".roll-row")[1].innerHTML = `<span>${game.i18n.format("TAMS.Combat.StatCapLabel", {name: "Unaware", value: finalCapped})}</span><span>${finalCapped}</span>`;
      }
      container.querySelector(".roll-boost-container").innerHTML = boostHtml;
      container.querySelector(".roll-total b").innerText = total;
      container.querySelector(".roll-hits-info").innerHTML = damageInfo;
      container.querySelector(".roll-crit-info").innerHTML = critInfo;
      const messageId = btn.closest(".chat-message")?.dataset.messageId;
      btn.remove();
      const message = game.messages.get(messageId);
      if (message) await tamsUpdateMessage(message, { content: container.outerHTML });
    }));

    // Retaliate button
    root.querySelectorAll('.tams-retaliate').forEach(el => el.addEventListener("click", async ev => {
      ev.preventDefault();
      const btn = ev.currentTarget;
      const attackerRaw = parseInt(btn.dataset.raw);
      const attackerTotal = parseInt(btn.dataset.total);
      const attackerMulti = parseInt(btn.dataset.multi) || 1;
      const attackerDamage = parseInt(btn.dataset.damage) || 0;
      const attackerArmourPen = parseInt(btn.dataset.armourPen) || 0;
      const isRanged = btn.dataset.isRanged === '1';
      const firstLocation = btn.dataset.location;
      const attackerLocations = btn.dataset.locations ? JSON.parse(btn.dataset.locations) : (firstLocation ? [firstLocation] : []);
      const attackerTargetLimb = btn.dataset.targetLimb;
      const isAoEFromData = btn.dataset.isAoe === '1';
      const container = btn.closest(".tams-roll");
      const isBehind = container?.classList.contains("behind-attack") || false;
      const isUnaware = container?.classList.contains("unaware-defender") || false;

      let actor = null;
      const targetTokenId = btn.dataset.targetTokenId;
      const targetActorId = btn.dataset.targetActorId;
      if (targetTokenId) { const token = canvas.tokens.get(targetTokenId); if (token) actor = token.actor; }
      if (!actor && targetActorId) actor = game.actors.get(targetActorId);
      if (!actor) actor = canvas.tokens.controlled[0]?.actor ?? null;
      if (!actor) actor = [...(game?.user?.targets ?? [])][0]?.actor ?? null;

      if (!actor) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.SelectTargetRetaliate"));
      const weapons = actor.items.filter(i => (i.type === 'weapon') || (i.type === 'ability' && i.system.isReaction && i.system.isAttack));
      if (!weapons.length) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NoValidWeapons"));

      const options = weapons.map(w => `<option value="${w.id}">${w.name} (${w.type === 'ability' ? 'Ability' : 'Weapon'}, Fam ${w.system.familiarity||0})</option>`).join('');
      let chosenId = await new Promise(resolve => {
        new Dialog({
          title: game.i18n.localize("TAMS.Combat.ChooseWeaponRetaliate"),
          content: `<div class="form-group"><label>${game.i18n.localize("TAMS.Weapon")}</label><select id="ret-weapon">${options}</select></div>`,
          buttons: { go: { label: game.i18n.localize("TAMS.Combat.RetaliateButton"), callback: html => resolve(html.find('#ret-weapon').val()) } },
          default: 'go'
        }).render(true);
      });
      const weapon = actor.items.get(chosenId);
      if (!weapon) return;

      if (weapon.type === 'ability') {
        const cost = parseInt(weapon.system.cost) || 0;
        if (!weapon.system.isApex && cost > 0) {
            const resourceKey = weapon.system.resource;
            if (resourceKey === 'stamina') {
                if (actor.system.stamina.value < cost) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NotEnoughStamina"));
                await actor.update({"system.stamina.value": actor.system.stamina.value - cost});
            } else {
                const idx = parseInt(resourceKey);
                const res = actor.system.customResources[idx];
                if (res) {
                    if (res.value < cost) {
                        const remaining = cost - res.value;
                        if (actor.system.stamina.value < remaining) return ui.notifications.warn(game.i18n.format("TAMS.Checks.Notifications.NotEnoughResOrStamina", {resource: res.name}));
                        const useBoth = await new Promise(resolve => {
                            new Dialog({
                                title: game.i18n.localize("TAMS.Combat.InsufficientResources"),
                                content: `<p>${game.i18n.format("TAMS.Combat.InsufficientResourcesContent", {val: res.value, res: res.name, rem: remaining})}</p>`,
                                buttons: { yes: { label: game.i18n.localize("TAMS.Yes"), callback: () => resolve(true) }, no: { label: game.i18n.localize("TAMS.No"), callback: () => resolve(false) } },
                                default: "yes", close: () => resolve(false)
                            }).render(true);
                        });
                        if (!useBoth) return;
                        const resources = foundry.utils.duplicate(actor.system.customResources);
                        resources[idx].value = 0;
                        await actor.update({ "system.customResources": resources, "system.stamina.value": actor.system.stamina.value - remaining });
                    } else {
                        const resources = foundry.utils.duplicate(actor.system.customResources);
                        resources[idx].value -= cost;
                        await actor.update({"system.customResources": resources});
                    }
                }
            }
        }
      }

      let cap = 0;
      let balancedBonus = 0;
      if (weapon.type === 'weapon') {
          cap = (weapon.system.isRanged && !weapon.system.isThrown) || weapon.system.isLight ? actor.system.stats.dexterity.total : actor.system.stats.strength.total;
          if (weapon.system.tags.toLowerCase().includes("balanced") && !weapon.system.isRanged) {
              balancedBonus = 10;
          }
      } else {
          cap = actor.system.stats[weapon.system.attackStat]?.total || 0;
      }
      if (isBehind) cap = Math.floor(cap * (actor.system.behindMult ?? 0.5));
      if (isUnaware) cap = Math.floor(cap * 0.5);

      const fam = Math.floor(weapon.system.familiarity || 0) + balancedBonus;
      const roll = await new Roll('1d100').evaluate();
      const raw = roll.total;
      const capped = Math.min(raw, cap);
      const total = capped + fam;
      const threshold = isRanged ? 20 : 10;
      const isMutual = Math.abs(attackerTotal - total) <= threshold;

      if (isAoEFromData) return ui.notifications.warn(game.i18n.localize("TAMS.Combat.RetaliateNoAoE"));

      let critInfo = "";
      if (raw >= (attackerRaw * 2)) critInfo = `<div class="tams-crit success">${game.i18n.format("TAMS.Combat.CriticalDodge", {raw, attacker: attackerRaw})}</div>`;
      else if (attackerRaw >= (raw * 2)) critInfo = `<div class="tams-crit failure">${game.i18n.format("TAMS.Combat.CriticalHitTaken", {attacker: attackerRaw, raw})}</div>`;

      let multiVal = weapon.type === 'weapon' ? (weapon.system.fireRate === '3' ? 3 : (weapon.system.fireRate === 'auto' ? 10 : (weapon.system.fireRate === 'custom' ? weapon.system.fireRateCustom : 1))) : (weapon.system.multiAttack || 1);
      const damage = weapon.system.calculatedDamage;
      const armourPen = (weapon.type === 'weapon' && weapon.system.hasArmourPen) ? (weapon.system.armourPenetration || 0) : (weapon.system.armourPenetration || 0);
      const defenderTargetLimb = (weapon.type === 'ability' && weapon.system.calculator?.enabled) ? weapon.system.calculator.targetLimb : 'none';

      let hitsScored = total >= attackerTotal || isMutual ? Math.min(1 + Math.floor(Math.max(0, total - attackerTotal) / 5), multiVal) : 0;
      let retLocations = [];
      const limbOptions = { "head": "Head", "thorax": "Thorax", "stomach": "Stomach", "leftArm": "Left Arm", "rightArm": "Right Arm", "leftLeg": "Left Leg", "rightLeg": "Right Leg" };
      for (let i = 0; i < hitsScored; i++) {
          retLocations.push(defenderTargetLimb && defenderTargetLimb !== 'none' ? limbOptions[defenderTargetLimb] : await getHitLocation(i === 0 ? raw : null));
      }

      let defenseDamageInfo = "";
      let defenseLocations = [];
      if (isMutual || attackerTotal > total) {
          const hitsTaken = Math.min(1 + Math.floor(Math.max(0, attackerTotal - total) / 5), attackerMulti);
          for (let i = 0; i < hitsTaken; i++) {
              defenseLocations.push(attackerLocations[i] || (attackerTargetLimb && attackerTargetLimb !== 'none' ? limbOptions[attackerTargetLimb] : await getHitLocation()));
          }
          defenseDamageInfo = `
            <div class="roll-row"><b style="color:${isMutual ? 'orange' : 'red'};">${isMutual ? game.i18n.format("TAMS.Combat.MutualHit", {threshold}) : game.i18n.localize("TAMS.Combat.FailedToBeatAttack")}</b></div>
            <div class="roll-row"><b>${game.i18n.localize("TAMS.Combat.HitsTaken")} ${hitsTaken} / ${attackerMulti}</b></div>
            <div class="roll-row"><small>${game.i18n.localize("TAMS.Location")}: ${defenseLocations.join(", ")}</small></div>
            <div class="roll-row" style="margin-bottom: 10px;">
                <button class="tams-take-damage" data-damage="${attackerDamage}" data-armour-pen="${attackerArmourPen}" data-locations='${JSON.stringify(defenseLocations)}' data-is-aoe="${isAoEFromData ? '1' : '0'}">${game.i18n.localize("TAMS.Combat.ApplyHitsToDefender")}</button>
            </div>
          `;
          if (!isMutual && !critInfo) critInfo = `<div class="tams-failure">${game.i18n.format("TAMS.Combat.RetaliateFailed", {total: attackerTotal})}</div>`;
      } else if (!critInfo) {
          critInfo = `<div class="tams-success">${game.i18n.format("TAMS.Combat.RetaliateSuccess", {total: attackerTotal})}</div>`;
      }

      const isRetAoE = !!weapon.system.isAoE;
      const retButtons = (hitsScored > 0 && !isMutual) ? `
          <button class="tams-take-damage" data-damage="${damage}" data-armour-pen="${armourPen}" data-locations='${JSON.stringify(retLocations)}' data-is-aoe="${isRetAoE ? '1' : '0'}">${game.i18n.localize("TAMS.Checks.ApplyAllHits")}</button>
          <button class="tams-dodge" data-raw="${raw}" data-total="${total}" data-multi="${multiVal}" data-location="${retLocations[0]}" data-damage="${damage}" data-armour-pen="${armourPen}" data-is-ranged="${isRanged ? '1' : '0'}" data-is-aoe="${isRetAoE ? '1' : '0'}" data-target-limb="${defenderTargetLimb}">${game.i18n.localize("TAMS.Dodge")}</button>
          <button class="tams-retaliate" data-raw="${raw}" data-total="${total}" data-multi="${multiVal}" data-location="${retLocations[0]}" data-damage="${damage}" data-armour-pen="${armourPen}" data-is-ranged="${isRanged ? '1' : '0'}" data-is-aoe="${isRetAoE ? '1' : '0'}" data-target-limb="${defenderTargetLimb}">${game.i18n.localize("TAMS.Combat.RetaliateButton")}</button>
          <button class="tams-behind-toggle" style="background: #444; color: white;">B</button>
          <button class="tams-unaware-toggle" style="background: #444; color: white;">U</button>
      ` : (isMutual ? `<button class="tams-take-damage" data-damage="${damage}" data-armour-pen="${armourPen}" data-locations='${JSON.stringify(retLocations)}' data-is-aoe="${isRetAoE ? '1' : '0'}">${game.i18n.localize("TAMS.Checks.ApplyAllHits")}</button>` : "");

      const msg = `
        <div class="tams-roll" data-attacker-raw="${raw}" data-attacker-total="${total}" data-attacker-multi="${multiVal}" data-armour-pen="${armourPen}" data-is-ranged="${isRanged ? '1' : '0'}" data-target-limb="${defenderTargetLimb}" data-orig-attacker-raw="${attackerRaw}" data-orig-attacker-total="${attackerTotal}" data-orig-attacker-multi="${attackerMulti}" data-orig-attacker-damage="${attackerDamage}" data-orig-attacker-armour-pen="${attackerArmourPen}" data-orig-first-location="${firstLocation}" data-orig-target-limb="${attackerTargetLimb}" data-is-aoe="${isRetAoE ? '1' : '0'}">
          <h3 class="roll-label">${game.i18n.format("TAMS.Combat.RetaliationWith", {name: actor.name, weapon: weapon.name})} ${isBehind ? '(Behind)' : ''} ${isUnaware ? '(Unaware)' : ''}</h3>
          ${(weapon.type === 'ability' && weapon.system.description) ? `<div class="roll-description">${weapon.system.description}</div>` : ""}
          ${defenseDamageInfo}
          <hr>
          <div class="roll-row"><b>${game.i18n.localize("TAMS.Combat.DmgShort")} ${damage}</b></div>
          <div class="roll-row"><b>${game.i18n.localize("TAMS.Combat.HitsTaken")} ${hitsScored} / ${multiVal}</b></div>
          <div class="roll-row"><b>${game.i18n.localize("TAMS.Location")}: ${retLocations[0] || "-"}</b></div>
          ${retLocations.length > 1 ? `<div class="roll-row"><small>Additional: ${retLocations.slice(1).join(", ")}</small></div>` : ""}
          <div class="roll-row" style="gap:6px; flex-wrap: wrap;">${retButtons}</div>
          <div class="roll-row"><span>${game.i18n.localize("TAMS.Combat.RawDiceResult")}</span><span class="roll-value">${raw}</span></div>
          <div class="roll-row"><small>${game.i18n.format("TAMS.Combat.StatCapLabel", {name: "Cap", value: cap})}</small><span>${capped}</span></div>
          <div class="roll-row"><small>${game.i18n.localize("TAMS.Familiarity")}:</small><span>+${fam}</span></div>
          <hr>
          <div class="roll-total">${game.i18n.localize("TAMS.Total")}: <b>${total}</b></div>
          ${critInfo}
          <div class="roll-contest-hint">
            <small><b>${game.i18n.localize("TAMS.Combat.ContestLabel")}</b> Total vs Attacker Total (${attackerTotal})</small><br>
            <small><b>${game.i18n.localize("TAMS.Combat.CritCheckLabel")}</b> Raw vs Attacker Raw (${attackerRaw})</small>
          </div>
        </div>`;
      ChatMessage.create({ speaker: ChatMessage.getSpeaker({actor}), content: msg, rolls: [roll] });
    }));

    // Boost Unconscious button
    root.querySelectorAll('.tams-boost-unconscious').forEach(el => el.addEventListener("click", async ev => {
        ev.preventDefault();
        const btn = ev.currentTarget;
        const container = btn.closest(".tams-roll");
        const actor = fromUuidSync(container.dataset.actorUuid) || game.actors.get(container.dataset.actorId);
        if (!actor) return;
        const dc = parseInt(container.dataset.dc), raw = parseInt(container.dataset.raw), end = parseInt(container.dataset.end);
        const capped = Math.min(raw, end), pointsNeeded = Math.max(0, Math.ceil((dc - capped) / 5));

        const resources = [{id: "stamina", name: game.i18n.localize("TAMS.Stamina"), value: actor.system.stamina.value}];
        actor.system.customResources.forEach((res, idx) => resources.push({id: idx.toString(), name: res.name, value: res.value}));
        const options = resources.map(r => `<option value="${r.id}">${r.name} (${r.value} ${game.i18n.localize("TAMS.AvailableShort")})</option>`).join('');

        const spending = await new Promise(resolve => {
            new Dialog({
                title: game.i18n.localize("TAMS.Combat.BoostUnconsciousTitle"),
                content: `
                    <div class="form-group"><label>${game.i18n.localize("TAMS.Combat.Resource")}</label><select id="res-type">${options}</select></div>
                    <div class="form-group">
                        <label>${game.i18n.localize("TAMS.Combat.PointsSpentMax10")}</label>
                        <input type="number" id="res-points" value="${Math.min(pointsNeeded, 10)}" min="0" max="10"/>
                        <p><small>${game.i18n.localize("TAMS.Combat.BoostDodgeHint")}</small></p>
                    </div>`,
                buttons: {
                    go: { label: game.i18n.localize("TAMS.Combat.ApplyBoost"), callback: (html) => {
                        const resId = html.find("#res-type").val();
                        const res = resources.find(r => r.id === resId);
                        let pts = Math.clamp(parseInt(html.find("#res-points").val()) || 0, 0, 10);
                        if (pts > res.value) pts = res.value;
                        resolve({ resId, pts });
                    }},
                    cancel: { label: game.i18n.localize("TAMS.Cancel"), callback: () => resolve(null) }
                },
                default: "go"
            }).render(true);
        });

        if (!spending) return;
        const { resId, pts } = spending;
        const bonus = pts * 5, total = capped + bonus, success = total >= dc;
        if (pts > 0) {
            if (resId === 'stamina') await actor.update({"system.stamina.value": actor.system.stamina.value - pts});
            else {
                const customResources = foundry.utils.duplicate(actor.system.customResources);
                customResources[parseInt(resId)].value -= pts;
                await actor.update({"system.customResources": customResources});
            }
        }

        const resName = resources.find(r => r.id === resId).name;
        container.querySelector(".roll-boost-container").innerHTML = `<div class="roll-row"><span>Boost (${resName}):</span><span>+${bonus}</span></div>`;
        container.querySelector(".roll-total b").innerText = total;
        const statusDiv = container.querySelector(".tams-success, .tams-crit.failure");
        if (statusDiv) {
            statusDiv.className = success ? "tams-success" : "tams-crit failure";
            statusDiv.innerText = success ? game.i18n.localize("TAMS.Combat.RemainsConscious") : game.i18n.localize("TAMS.Combat.FallsUnconscious");
        }
        const messageId = btn.closest(".chat-message")?.dataset.messageId;
        btn.remove();
        const message = game.messages.get(messageId);
        if (message) await tamsUpdateMessage(message, { content: container.outerHTML });
    }));

    // Boost Roll button (General DC Checks)
    root.querySelectorAll('.tams-boost-roll').forEach(el => el.addEventListener("click", async ev => {
        ev.preventDefault();
        const btn = ev.currentTarget;
        const actor = fromUuidSync(btn.dataset.actorUuid) || game.actors.get(btn.dataset.actorId);
        if (!actor) return;

        const difficulty = parseInt(btn.dataset.difficulty);
        const currentTotal = parseInt(btn.dataset.total);
        const pointsNeeded = Math.max(0, Math.ceil((difficulty - currentTotal) / 5));

        const resources = [{id: "stamina", name: game.i18n.localize("TAMS.Stamina"), value: actor.system.stamina.value}];
        actor.system.customResources.forEach((res, idx) => resources.push({id: idx.toString(), name: res.name, value: res.value}));
        const options = resources.map(r => `<option value="${r.id}">${r.name} (${r.value} ${game.i18n.localize("TAMS.AvailableShort")})</option>`).join('');

        const spending = await new Promise(resolve => {
            new Dialog({
                title: game.i18n.localize("TAMS.BoostRollTitle"),
                content: `
                    <div class="form-group"><label>${game.i18n.localize("TAMS.Combat.Resource")}</label><select id="res-type">${options}</select></div>
                    <div class="form-group">
                        <label>${game.i18n.localize("TAMS.Combat.PointsSpent")}</label>
                        <input type="number" id="res-points" value="${pointsNeeded}" min="0"/>
                        <p><small>${game.i18n.localize("TAMS.Combat.BoostLabel")} (+5/pt)</small></p>
                    </div>`,
                buttons: {
                    go: { label: game.i18n.localize("TAMS.Combat.ApplyBoost"), callback: (html) => {
                        const resId = html.find("#res-type").val();
                        const res = resources.find(r => r.id === resId);
                        let pts = parseInt(html.find("#res-points").val()) || 0;
                        if (pts > res.value) pts = res.value;
                        resolve({ resId, pts });
                    }},
                    cancel: { label: game.i18n.localize("TAMS.Cancel"), callback: () => resolve(null) }
                },
                default: "go"
            }).render(true);
        });

        if (!spending) return;
        const { resId, pts } = spending;
        const bonus = pts * 5;
        const newTotal = currentTotal + bonus;
        const success = newTotal >= difficulty;

        if (pts > 0) {
            if (resId === 'stamina') await actor.update({"system.stamina.value": actor.system.stamina.value - pts});
            else {
                const customResources = foundry.utils.duplicate(actor.system.customResources);
                customResources[parseInt(resId)].value -= pts;
                await actor.update({"system.customResources": customResources});
            }
        }

        const resName = resources.find(r => r.id === resId).name;
        const boostContainer = container.querySelector(".roll-boost-container");
        if (boostContainer) {
            boostContainer.innerHTML = `<div class="roll-row"><span>Boost (${resName}):</span><span>+${bonus}</span></div>`;
        }
        
        const totalEl = container.querySelector(".roll-total b");
        if (totalEl) totalEl.innerText = newTotal;

        const statusDiv = container.querySelector(".tams-failure, .tams-success");
        if (statusDiv) {
            statusDiv.className = success ? "tams-success" : "tams-failure";
            statusDiv.innerHTML = success 
                ? game.i18n.format('TAMS.SuccessVsDiffBoosted', {difficulty, amount: bonus})
                : game.i18n.format('TAMS.FailureVsDiff', {difficulty});
        }

        const messageId = btn.closest(".chat-message")?.dataset.messageId;
        btn.remove();
        const message = game.messages.get(messageId);
        if (message) await tamsUpdateMessage(message, { content: container.outerHTML });
    }));

    // Toggles (Behind/Unaware)
    ['behind', 'unaware'].forEach(type => {
        root.querySelectorAll(`.tams-${type}-toggle`).forEach(el => el.addEventListener("click", async ev => {
            ev.preventDefault();
            const btn = ev.currentTarget, container = btn.closest(".tams-roll");
            container.classList.toggle(`${type === 'behind' ? 'behind-attack' : 'unaware-defender'}`);
            btn.style.background = container.classList.contains(`${type === 'behind' ? 'behind-attack' : 'unaware-defender'}`) ? "#2e7d32" : "#444";
            const messageId = btn.closest(".chat-message")?.dataset.messageId, message = game.messages.get(messageId);
            if (message) await tamsUpdateMessage(message, { content: container.outerHTML });
        }));
    });

    // Squad Crit Roll
    root.querySelectorAll('.tams-squad-crit-roll').forEach(el => el.addEventListener("click", async ev => {
        ev.preventDefault();
        const btn = ev.currentTarget, actor = fromUuidSync(btn.dataset.actorUuid) || game.actors.get(btn.dataset.actorId);
        if (!actor) return;
        const count = parseInt(btn.dataset.count), end = actor.system.stats.endurance.total;

        const dcsAttr = btn.dataset.dcs;
        let dcs = dcsAttr ? dcsAttr.split(',').map(Number) : [];
        let dc = 0;

        if (dcs.length === 0) {
            dc = await new Promise(resolve => {
                new Dialog({
                    title: game.i18n.localize("TAMS.Combat.CritDC"),
                    content: `<div class="form-group"><label>${game.i18n.localize("TAMS.Combat.EnterDC")}</label><input type="number" id="dc" value="0"/></div>`,
                    buttons: { roll: { label: game.i18n.localize("TAMS.Combat.Roll"), callback: (html) => resolve(parseInt(html.find("#dc").val()) || 0) }, cancel: { label: game.i18n.localize("TAMS.Cancel"), callback: () => resolve(null) } },
                    default: "roll"
                }).render(true);
            });
            if (dc === null) return;
        }

        let rollResults = [], successCount = 0;
        for (let i = 0; i < count; i++) {
            const currentDc = dcs.length > 0 ? (dcs[i] ?? dcs[dcs.length - 1]) : dc;
            const raw = (await new Roll("1d100").evaluate()).total, capped = Math.min(raw, end), success = capped >= currentDc;
            if (success) successCount++;
            rollResults.push({ raw, capped, success, dc: currentDc });
        }

        const failureCount = count - successCount;
        const isMook = (actor.system.settings.npcRank || "mook") === "mook";
        const updates = {};
        let needsUpdate = false;

        const currentSize = actor.system.settings.squadSize;
        const newSize = isMook ? (currentSize + successCount) : (currentSize - failureCount);

        if (newSize !== currentSize) {
            updates["system.settings.squadSize"] = newSize;
            needsUpdate = true;
        }

        if (successCount > 0) {
            for (let [key, limb] of Object.entries(actor.system.limbs)) {
                const indMax = Math.floor(end * limb.mult);
                const currentVal = updates[`system.limbs.${key}.value`] ?? limb.value;
                updates[`system.limbs.${key}.value`] = currentVal + (successCount * indMax);
            }
            needsUpdate = true;
        }

        if (needsUpdate) {
            // Cap all limbs to the new squad size
            for (let [key, limb] of Object.entries(actor.system.limbs)) {
                const indMax = Math.floor(end * limb.mult);
                const maxForNewSize = newSize * indMax;
                const currentVal = updates[`system.limbs.${key}.value`] ?? limb.value;
                if (Math.abs(currentVal) > maxForNewSize) {
                    updates[`system.limbs.${key}.value`] = Math.min(Math.max(currentVal, -maxForNewSize), maxForNewSize);
                }
            }
        }

        if (needsUpdate) await actor.update(updates);

        const displayDc = dcs.length > 0 ? (dcs.every(d => d === dcs[0]) ? dcs[0] : game.i18n.localize("TAMS.Combat.Variable")) : dc;
        let resultsHtml = `<div class="tams-roll"><h3 class="roll-label">${game.i18n.format("TAMS.Combat.SquadCritChecks", {name: btn.dataset.name})}</h3><div class="roll-row"><span>Checks:</span><span>${count}</span></div><div class="roll-row"><span>Endurance:</span><span>${end}</span></div><div class="roll-row"><span>Target DC:</span><span>${displayDc}</span></div><hr><div class="squad-crit-list" style="max-height: 200px; overflow-y: auto;">`;
        rollResults.forEach((r, i) => { resultsHtml += `<div class="roll-row" style="border-bottom: 1px solid #eee; font-size: 0.9em; padding: 2px 0;"><span style="flex: 1;">${game.i18n.format("TAMS.Combat.SquadCritCheckRow", {i: i+1, raw: r.raw, capped: r.capped})} (DC ${r.dc})</span><span style="color: ${r.success ? '#2e7d32' : '#c0392b'}; font-weight: bold; min-width: 50px; text-align: right;">${r.success ? game.i18n.localize("TAMS.Combat.Pass") : game.i18n.localize("TAMS.Combat.Fail")}</span></div>`; });
        resultsHtml += `</div>`;
        
        if (successCount > 0) {
            resultsHtml += `<div class="roll-row" style="color: #2e7d32; font-weight: bold; margin-top: 5px; border-top: 1px solid #2e7d32; padding-top: 3px;">${game.i18n.format("TAMS.Combat.SquadMembersRestored", {count: successCount})}</div>`;
        }
        if (!isMook && failureCount > 0) {
            resultsHtml += `<div class="roll-row" style="color: #c0392b; font-weight: bold; margin-top: 5px; border-top: 1px solid #c0392b; padding-top: 3px;">${game.i18n.format("TAMS.Combat.SquadMembersLost", {count: failureCount})}</div>`;
        }
        resultsHtml += `</div>`;

        ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: resultsHtml });
        btn.disabled = true; btn.innerText = game.i18n.localize("TAMS.Combat.ChecksRolled");
    }));
}
