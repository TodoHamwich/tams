import { getHitLocation } from '../utils/combat.js';
import {
  computeRawStaminaMax, computeRawResourceMax, computeFatiguedMax,
  computeShortRestFatigueGain, computeLongRestFatigueHeal
} from '../utils/fatigue.js';
import {
  isLethal, hasCustomLethality, memberLethalUnit, memberCapacityFromLimb, rescaledLimbValue, dyingThreshold
} from '../utils/lethality.js';

const e = s => foundry.utils.escapeHTML(String(s ?? ""));

/**
 * The TAMS Actor document class.
 * Extends the core Actor class.
 */
/** Stamina multiplier incl. profession boosts (falls back to the manual mult on plain test data). */
function effStaminaMult(sys, manualMult = sys?.stamina?.mult) {
  return typeof sys?.staminaEffectiveMult === "function" ? sys.staminaEffectiveMult(manualMult) : (manualMult ?? 1);
}
/** Custom resource multiplier incl. its linked caster profession boost. */
function effResourceMult(sys, res) {
  return typeof sys?.resourceEffectiveMult === "function" ? sys.resourceEffectiveMult(res) : (res?.mult ?? 1);
}

export class TAMSActor extends Actor {
  /**
   * Apply damage to this actor across multiple hits/locations.
   * @param {object[]} hits Array of hit objects: { damage, location, armourPen }
   * @param {object} options Additional options
   * @param {boolean} [options.isAoE=false] Is this an AoE attack?
   * @param {number} [options.multiplier=1] For squads/hordes, how many members were hit by the AoE.
   * @returns {Promise<object>} Result including updates, itemUpdates, pendingChecks, and report.
   */
  async applyTAMSDamage(hits, { isAoE = false, multiplier = 1 } = {}) {
    const updates = {};
    const itemUpdates = {}; 
    const pendingChecks = [];
    const limbDamageReceived = {};
    const originalLimbStatus = {};
    const locationMap = {
      "Head": "head", "Thorax": "thorax", "Stomach": "stomach",
      "Left Arm": "leftArm", "Right Arm": "rightArm",
      "Left Leg": "leftLeg", "Right Leg": "rightLeg"
    };
    
    const limbKeys = ['head', 'thorax', 'stomach', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
    for (let key of limbKeys) {
        originalLimbStatus[key] = {
            value: this.system.limbs[key].value,
            injured: this.system.limbs[key].injured,
            criticallyInjured: this.system.limbs[key].criticallyInjured,
            max: this.system.limbs[key].max
        };
        limbDamageReceived[key] = 0;
    }

    let report = `<b>${e(this.name)}</b> ${game.i18n.localize("TAMS.TakingDamage")}:<br>`;
    const isSquadOrHorde = this.system.settings?.isNPC && (this.system.settings.npcType === "squad" || this.system.settings.npcType === "horde");
    const currentSquadSize = this.system.settings.squadSize || 1;
    const limbLosses = {};

    for (let i = 0; i < hits.length; i++) {
        const hit = hits[i];
        const incoming = Math.floor(hit.damage || 0);
        const armourPen = hit.armourPen || 0;
        const loc = hit.location;
        const limbKey = locationMap[loc];
        if (!limbKey) continue;
        const limb = this.system.limbs[limbKey];
        
        const isAltArmor = this.system.settings?.alternateArmour;
        const pendingArmor = updates[`system.limbs.${limbKey}.armor`];
        let armorValue = pendingArmor !== undefined ? pendingArmor : (limb.armor || 0);
        
        if (isAltArmor) {
            const pendingMax = updates[`system.limbs.${limbKey}.armorMax`];
            const curMax = pendingMax !== undefined ? pendingMax : (limb.armorMax || 0);
            if (curMax <= 0) armorValue = 0;
        }
        
        const otherArmor = limb.otherArmor || 0;
        const armor = Math.floor(armorValue + otherArmor);
        const effectiveArmor = Math.max(0, armor - armourPen);

        // Barrier absorbs incoming damage before armor
        let barrierLabel = "";
        let adjustedIncoming = incoming;
        if (!isSquadOrHorde && adjustedIncoming > 0) {
            const pendingTempDR = updates['system.tempDR'];
            const currentTempDR = pendingTempDR !== undefined ? pendingTempDR : (this.system.tempDR || 0);
            if (currentTempDR > 0) {
                const absorbed = Math.min(currentTempDR, adjustedIncoming);
                adjustedIncoming -= absorbed;
                updates['system.tempDR'] = currentTempDR - absorbed;
                barrierLabel = game.i18n.format("TAMS.Combat.TempDRAbsorbed", {absorbed, remaining: currentTempDR - absorbed});
            }
        }

        let effective = Math.max(0, adjustedIncoming - effectiveArmor);
        const blocked = Math.min(adjustedIncoming, effectiveArmor);
        let overflow = 0;

        let resistanceLabel = "";
        // Support a hit dealing damage split across multiple types (each independently subject
        // to resistances/immunities/vulnerabilities). Old-shape hits (a single damageType string)
        // are wrapped into a one-element array, so the loop below reproduces prior behavior
        // exactly when there's nothing to split.
        const damageComponents = hit.damageComponents?.length
            ? hit.damageComponents
            : [{damageType: hit.damageType || "", damage: hit.damage}];
        const totalComponentDamage = damageComponents.reduce((sum, c) => sum + Math.max(0, Math.floor(c.damage || 0)), 0);

        if (this.system.effectiveResistances?.length && totalComponentDamage > 0) {
            const resistanceLabels = [];
            let healedThisHit = false;
            let adjustedEffective = 0;
            let remainingShare = effective;

            for (let ci = 0; ci < damageComponents.length; ci++) {
                const compDamage = Math.max(0, Math.floor(damageComponents[ci].damage || 0));
                const isLast = ci === damageComponents.length - 1;
                // Proportional share of the post-armor `effective`; the last component absorbs
                // any rounding remainder so shares always sum exactly to `effective`.
                const share = isLast ? remainingShare : Math.round(effective * (compDamage / totalComponentDamage));
                remainingShare -= share;

                let compEffective = share;
                const damageType = damageComponents[ci].damageType || "";
                if (damageType) {
                    let match = this.system.effectiveResistances.find(
                        r => r.damageType === damageType
                          && (r.limbs ?? []).length > 0
                          && r.limbs.includes(limbKey)
                    );
                    if (!match) {
                        match = this.system.effectiveResistances.find(
                            r => r.damageType === damageType && (r.limbs ?? []).length === 0
                        );
                    }
                    if (match) {
                        const typeName = game.i18n.localize(`TAMS.DamageType.${match.damageType}`);
                        if (match.category === "immunity") {
                            compEffective = 0;
                            resistanceLabels.push(game.i18n.format("TAMS.Combat.Immune", {type: typeName}));
                        } else if (match.category === "resistance") {
                            const reduced = Math.min(compEffective, match.value);
                            compEffective = Math.max(0, compEffective - match.value);
                            resistanceLabels.push(game.i18n.format("TAMS.Combat.Resisted", {value: reduced, type: typeName}));
                        } else if (match.category === "vulnerability") {
                            compEffective = compEffective + match.value;
                            resistanceLabels.push(game.i18n.format("TAMS.Combat.Vulnerable", {value: match.value, type: typeName}));
                        } else if (match.category === "healing") {
                            const healAmount = compEffective + (match.value || 0);
                            const healLabel = game.i18n.format("TAMS.Combat.HealedFrom", {value: healAmount, type: typeName});
                            const currentHp = updates[`system.limbs.${limbKey}.value`] ?? limb.value;
                            updates[`system.limbs.${limbKey}.value`] = Math.min(limb.max, currentHp + healAmount);
                            report += `• ${game.i18n.format("TAMS.Checks.HealReport", {loc, amount: healAmount})}<br>`;
                            report += `  ↳ ${healLabel}<br>`;
                            healedThisHit = true;
                            continue;
                        }
                    }
                }
                adjustedEffective += compEffective;
            }

            // A healing component heals the limb and skips the rest of this hit's damage
            // entirely, matching the original single-type behavior's early exit.
            if (healedThisHit) continue;
            effective = adjustedEffective;
            resistanceLabel = resistanceLabels.join(", ");
        }

        if (isSquadOrHorde) {
            const indMax = limb.individualMax || Math.floor(this.system.stats.endurance.total * limb.mult);
            // One member's worth of damage per hit: a lethal limb with a raised threshold
            // needs threshold × indMax to drop a member, so the cap scales with it.
            const memberUnit = isLethal(limb) ? memberLethalUnit({ ...limb, individualMax: indMax }) : indMax;
            const limbCap = (isAoE ? multiplier : 1) * memberUnit;

            const currentLimbHpBeforeHit = updates[`system.limbs.${limbKey}.value`] ?? limb.value;

            const cappedEffective = Math.min(effective, limbCap);
            
            overflow = effective - cappedEffective;
            const totalDamageOfHit = effective; // Total damage after armor (includes overflow)
            effective = cappedEffective;

            // Track DCs for lost members in this hit
            if (!limbLosses[limbKey]) limbLosses[limbKey] = [];
            const newLimbHpAfterHit = currentLimbHpBeforeHit - effective;
            const limbForSize = { ...limb, individualMax: indMax };
            const lostInThisHit = isLethal(limb)
                ? memberCapacityFromLimb(limbForSize, currentLimbHpBeforeHit, currentSquadSize)
                  - memberCapacityFromLimb(limbForSize, newLimbHpAfterHit, currentSquadSize)
                : 0;
            
            if (lostInThisHit > 0) {
                const damageTakenAlready = limb.max - currentLimbHpBeforeHit;
                const totalDamageOnLimb = damageTakenAlready + totalDamageOfHit;
                const dc = totalDamageOnLimb;
                
                for (let j = 0; j < lostInThisHit; j++) {
                    limbLosses[limbKey].push(dc);
                }
            }
        }
        
        const currentHp = updates[`system.limbs.${limbKey}.value`] ?? limb.value;
        let newHp = Math.floor(currentHp) - effective;
        // Non-lethal squad/horde limbs keep tracking damage but bottom out at -max.
        if (isSquadOrHorde && !isLethal(limb)) newHp = Math.max(newHp, -limb.max);
        updates[`system.limbs.${limbKey}.value`] = newHp;
        
        limbDamageReceived[limbKey] += effective;

        let lossLabel = "";
        if (armorValue > 0 && (effective + overflow) < adjustedIncoming) {
            const key = isAltArmor ? `system.limbs.${limbKey}.armorMax` : `system.limbs.${limbKey}.armor`;
            const pending = updates[key];
            const currentVal = pending !== undefined ? pending : (isAltArmor ? limb.armorMax : limb.armor);
            const ahpLoss = adjustedIncoming >= armorValue * 2 ? 2 : 1;
            updates[key] = Math.max(0, (currentVal || 0) - ahpLoss);
            lossLabel = isAltArmor ? game.i18n.localize("TAMS.Checks.ArmorHPLost") : game.i18n.localize("TAMS.Checks.ArmorPointLost");
        }

        const penLabel = armourPen > 0 ? game.i18n.format("TAMS.Checks.ArmorPenetrated", {pen: armourPen}) : "";
        const overflowLabel = overflow > 0 ? game.i18n.format("TAMS.Checks.OverflowCapped", {overflow}) : "";
        const lossMsg = lossLabel ? `, ${lossLabel}` : "";
        report += `• ${game.i18n.format("TAMS.Checks.DamageReport", {loc, effective, blocked, penLabel, lossLabel: lossMsg, overflowLabel})}<br>`;
        if (barrierLabel) report += `  ↳ ${barrierLabel}<br>`;
        if (resistanceLabel) report += `  ↳ ${resistanceLabel}<br>`;

        const limbMax = originalLimbStatus[limbKey].max;
        if (newHp <= 0 && !originalLimbStatus[limbKey].injured && !updates[`system.limbs.${limbKey}.injured`]) {
            report += `<b style="color:#f39c12;">!!! ${game.i18n.format("TAMS.Checks.LimbInjuredAuto", {limb: e(limb.label)})} !!!</b><br>`;
            updates[`system.limbs.${limbKey}.injured`] = true;
        }
    }

    // Squad size reduction logic
    if (isSquadOrHorde) {
        let finalSquadSize = currentSquadSize;
        let bottleneckLimb = null;
        const limbKeys = ['head', 'thorax', 'stomach', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
        for (let lk of limbKeys) {
            const limb = this.system.limbs[lk];
            if (!limb) continue;
            const newLimbVal = updates[`system.limbs.${lk}.value`] ?? limb.value;
            const indMax = limb.individualMax || Math.floor(this.system.stats.endurance.total * limb.mult);
            const potentialSize = memberCapacityFromLimb({ ...limb, individualMax: indMax }, newLimbVal, currentSquadSize);
            if (potentialSize < finalSquadSize) {
                finalSquadSize = potentialSize;
                bottleneckLimb = lk;
            }
        }
        if (finalSquadSize < currentSquadSize) {
            const lostCount = currentSquadSize - finalSquadSize;
            const npcRank = this.system.settings.npcRank || "mook";
            const isMook = npcRank === "mook";
            if (isMook) {
                updates["system.settings.squadSize"] = finalSquadSize;
                report += `<b style="color:#c0392b;">!!! ${game.i18n.format("TAMS.Checks.SquadLostMembers", {name: e(this.name), lostCount, finalSquadSize})} !!!</b><br>`;
                
                // Ensure all limbs are capped to the new squad size
                const limbKeys = ['head', 'thorax', 'stomach', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
                for (let lk of limbKeys) {
                    const limb = this.system.limbs[lk];
                    if (!limb) continue;
                    const indMax = limb.individualMax || Math.floor(this.system.stats.endurance.total * limb.mult);
                    const currentVal = updates[`system.limbs.${lk}.value`] ?? limb.value;
                    updates[`system.limbs.${lk}.value`] = rescaledLimbValue({ ...limb, individualMax: indMax }, currentVal, finalSquadSize, currentSquadSize);
                }
            } else {
                report += `<b style="color:#c0392b;">!!! ${game.i18n.format("TAMS.Checks.SquadThreatenedMembers", {name: e(this.name), lostCount})} !!!</b><br>`;
            }
            
            if (!isMook) {
                const dcs = (bottleneckLimb && limbLosses[bottleneckLimb]) ? limbLosses[bottleneckLimb].slice(0, lostCount) : [];
                const dcsAttr = dcs.length > 0 ? ` data-dcs="${dcs.join(',')}"` : "";
                report += `<button class="tams-squad-crit-roll" data-actor-uuid="${this.uuid}" data-count="${lostCount}" data-name="${e(this.name)}"${dcsAttr}>${game.i18n.format("TAMS.Checks.RollForCriticalWounds", {count: lostCount})}</button><br>`;
            }
            if (finalSquadSize === 0 && isMook) {
                report += `<b style="color:#c0392b;">!!! ${game.i18n.format("TAMS.Checks.SquadDestroyed", {name: e(this.name)})} !!!</b><br>`;
            }
        }
    }

    // Final checks
    const finalUpdates = { ...updates };
    if (Object.keys(itemUpdates).length > 0) {
        finalUpdates.items = Object.values(itemUpdates);
    }
    await this.update(finalUpdates);

    // Calculate pending checks
    for (let [limbKey, damage] of Object.entries(limbDamageReceived)) {
        if (damage === 0 && !hits.some(h => locationMap[h.location] === limbKey && h.forceCrit)) continue;
        const original = originalLimbStatus[limbKey];
        const limb = this.system.limbs[limbKey];
        const currentVal = limb.value;
        if (isSquadOrHorde) continue;
        
        const autoInjuredThisHit = updates[`system.limbs.${limbKey}.injured`] === true && !original.injured;
        const limbHpAfterHit = this.system.limbs[limbKey].value;

        if (original.injured && damage > 0 && !original.criticallyInjured) {
            // Was already injured — escalate to crit check
            pendingChecks.push({ type: 'crit', loc: limb.label, dc: damage + (original.value < 0 ? Math.abs(original.value) : 0), limbKey });
        } else if (autoInjuredThisHit && !original.criticallyInjured) {
            // Single hit drove a healthy limb past -max: injured auto-set, queue crit check
            pendingChecks.push({ type: 'crit', loc: limb.label, dc: Math.max(10, damage + (original.value < 0 ? Math.abs(original.value) : 0)), limbKey });
        } else if (hits.some(h => locationMap[h.location] === limbKey && h.forceCrit === "1") && !original.criticallyInjured) {
            // Brutal tag forces a crit check regardless of HP
            pendingChecks.push({ type: 'crit', loc: limb.label, dc: Math.max(10, damage + (original.value < 0 ? Math.abs(original.value) : 0)), limbKey });
        }
    }

    // Survival Checks
    const totalHp = this.system.hp.value;
    const maxHp = this.system.hp.max;
    if (!isSquadOrHorde) {
        let survivalDC = 0;
        let reasons = [];
        let survivalNeeded = false;
        // Custom lethality (e.g. zombies): only lethal limbs past their threshold matter —
        // total HP never forces unconscious/survival checks.
        const customLethality = hasCustomLethality(this.system.limbs);

        if (!customLethality && totalHp <= -maxHp) {
            survivalNeeded = true;
            survivalDC = Math.abs(totalHp);
            reasons.push(`${game.i18n.localize("TAMS.Checks.ReasonTotalHPBelowNegMax")} (${totalHp} / -${maxHp})`);
        } else if (!customLethality && totalHp < 0) {
            pendingChecks.push({ 
                type: 'unconscious', 
                dc: Math.abs(totalHp), 
                reasons: [`${game.i18n.localize("TAMS.Checks.ReasonTotalHPNegative")} (${totalHp})`] 
            });
        }

        // Head/Thorax disabled → dying countdown instead of survival roll
        const existingCountdown = this.getFlag('tams', 'dyingCountdown');
        let dyingStarted = false;
        const dyingLimbKeys = customLethality
            ? limbKeys.filter(k => isLethal(this.system.limbs[k]))
            : ['head', 'thorax'];
        for (const key of dyingLimbKeys) {
            const limb = this.system.limbs[key];
            if (limb.value < dyingThreshold(limb) && !existingCountdown && !dyingStarted) {
                dyingStarted = true;
                const turnsLeft = Math.max(1, Math.floor(this.system.stats.endurance.total / 10));
                await this.toggleStatusEffect("unconscious", { active: true });
                await this.setFlag('tams', 'dyingCountdown', { turnsLeft, limbKey: key });
                const ownerIds = Object.entries(this.ownership ?? {})
                    .filter(([id, lvl]) => lvl >= 3 && id !== "default")
                    .map(([id]) => id);
                const whisperIds = [...new Set([...ownerIds, ...game.users.filter(u => u.isGM).map(u => u.id)])];
                await ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ actor: this }),
                    content: `<div class="tams-roll"><div class="tams-crit failure" style="font-size:1.1em;font-weight:bold;">${game.i18n.format("TAMS.Dying.Started", { name: e(this.name), limb: e(limb.label), turns: turnsLeft })}</div></div>`,
                    whisper: whisperIds
                });
            }
        }

        if (survivalNeeded) {
            pendingChecks.push({ type: 'survival', dc: survivalDC, reasons });
        }
    }

    return { pendingChecks, report };
  }

  /** @override */
  async _preUpdate(updateData, options, user) {
    const res = await super._preUpdate(updateData, options, user);
    if ( res === false ) return false;

    // --- Armor Set Once Logic ---
    const limbKeys = ['head', 'thorax', 'stomach', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
    for (const key of limbKeys) {
        const armorIdPath = `system.limbs.${key}.equippedArmorId`;
        if (foundry.utils.hasProperty(updateData, armorIdPath)) {
            const newArmorId = foundry.utils.getProperty(updateData, armorIdPath);
            const oldArmorId = this.system.limbs[key].equippedArmorId;
            if (newArmorId !== oldArmorId) {
                if (newArmorId) {
                    const armorItem = this.items.get(newArmorId);
                    if (armorItem && armorItem.type === "armor") {
                        // Copy values from the armor item to the limb
                        foundry.utils.setProperty(updateData, `system.limbs.${key}.armor`, armorItem.system.limbs[key]?.value || 0);
                        foundry.utils.setProperty(updateData, `system.limbs.${key}.armorMax`, armorItem.system.limbs[key]?.max || 0);
                    }
                } else {
                    // Reset to 0 if "None" is selected
                    foundry.utils.setProperty(updateData, `system.limbs.${key}.armor`, 0);
                    foundry.utils.setProperty(updateData, `system.limbs.${key}.armorMax`, 0);
                }
            }
        }
    }
    // ----------------------------

    // Dying countdown: if the limb that triggered it gets healed back above
    // the -max threshold, clear the stale countdown — otherwise tamsOnTurnStart
    // keeps ticking it down and posting "is dying" messages after recovery.
    {
      const dyingCountdown = this.getFlag('tams', 'dyingCountdown');
      if (dyingCountdown) {
        const valuePath = `system.limbs.${dyingCountdown.limbKey}.value`;
        if (foundry.utils.hasProperty(updateData, valuePath)) {
          const maxPath = `system.limbs.${dyingCountdown.limbKey}.max`;
          const pendingValue = foundry.utils.getProperty(updateData, valuePath);
          const pendingMax = foundry.utils.hasProperty(updateData, maxPath)
            ? foundry.utils.getProperty(updateData, maxPath)
            : this.system.limbs[dyingCountdown.limbKey].max;
          const trackedLimb = this.system.limbs[dyingCountdown.limbKey];
          if (pendingValue >= dyingThreshold({ ...trackedLimb, max: pendingMax })) {
            await this.setFlag('tams', 'dyingCountdown', null);
            if (this.statuses?.has('unconscious')) {
              await this.toggleStatusEffect('unconscious', { active: false });
            }
          }
        }
      }
    }

    // Check for endurance or squad size changes to adjust HP accordingly
    const stats = this.system.stats;
    const settings = this.system.settings;
    const oldSquadSize = settings.squadSize || 1;
    const isSquadOrHorde = settings.isNPC && (settings.npcType === "squad" || settings.npcType === "horde");

    const hasEndValue = foundry.utils.hasProperty(updateData, "system.stats.endurance.value");
    const hasEndMod = foundry.utils.hasProperty(updateData, "system.stats.endurance.mod");
    const hasSquadSize = foundry.utils.hasProperty(updateData, "system.settings.squadSize");

    if (hasEndValue || hasEndMod || hasSquadSize) {
      const traitBonus = stats.endurance.traitBonus || 0;
      const oldEnd = stats.endurance.total;
      const newEnd = (hasEndValue ? foundry.utils.getProperty(updateData, "system.stats.endurance.value") : stats.endurance.value) +
                     (hasEndMod ? foundry.utils.getProperty(updateData, "system.stats.endurance.mod") : (stats.endurance.mod || 0)) +
                     traitBonus;

      const newSquadSize = hasSquadSize ? foundry.utils.getProperty(updateData, "system.settings.squadSize") : oldSquadSize;

      if (newEnd !== oldEnd || newSquadSize !== oldSquadSize) {
        const limbKeys = ['head', 'thorax', 'stomach', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
        for (const key of limbKeys) {
          const limb = this.system.limbs[key];
          if (!limb) continue;

          // Only adjust if the value itself isn't being manually updated
          const currentPath = `system.limbs.${key}.value`;
          if (foundry.utils.hasProperty(updateData, currentPath)) continue;

          const oldIndMax = Math.floor(oldEnd * limb.mult);
          const newIndMax = Math.floor(newEnd * limb.mult);

          const oldMax = isSquadOrHorde ? (oldIndMax * oldSquadSize) : oldIndMax;
          const newMax = isSquadOrHorde ? (newIndMax * newSquadSize) : newIndMax;

          const deltaMax = newMax - oldMax;
          if (deltaMax !== 0) {
            foundry.utils.setProperty(updateData, currentPath, limb.value + deltaMax);
          }
        }
      }
    }

    // Adjust stamina and custom resource current values when any stat changes directly.
    {
      const ALL_STATS = ["strength", "dexterity", "endurance", "wisdom", "intelligence", "bravery"];
      const warnings = [];
      // Start from the stored array with any pending per-field edits (name, stat,
      // …) layered on top — if anything below writes the whole array back, it
      // must not clobber the other fields the form submitted alongside it.
      const pendingResources = foundry.utils.getProperty(updateData, "system.customResources");
      const customResources = Array.isArray(pendingResources)
        ? foundry.utils.duplicate(pendingResources)
        : foundry.utils.duplicate(this.system.customResources ?? []);
      if (pendingResources && !Array.isArray(pendingResources) && typeof pendingResources === "object") {
        for (const [idx, changes] of Object.entries(pendingResources)) {
          if (customResources[idx] && changes && typeof changes === "object")
            foundry.utils.mergeObject(customResources[idx], changes);
        }
      }
      for (const [key, val] of Object.entries(updateData)) {
        const m = key.match(/^system\.customResources\.(\d+)\.(.+)$/);
        if (m && customResources[m[1]]) foundry.utils.setProperty(customResources[m[1]], m[2], val);
      }
      let customResourcesChanged = false;

      for (const statKey of ALL_STATS) {
        const hasVal = foundry.utils.hasProperty(updateData, `system.stats.${statKey}.value`);
        const hasMod = foundry.utils.hasProperty(updateData, `system.stats.${statKey}.mod`);
        if (!hasVal && !hasMod) continue;

        const traitBonus = stats[statKey]?.traitBonus || 0;
        const oldTotal = stats[statKey]?.total ?? 0;
        const newTotal = (hasVal ? foundry.utils.getProperty(updateData, `system.stats.${statKey}.value`) : (stats[statKey]?.value ?? 0))
                       + (hasMod ? foundry.utils.getProperty(updateData, `system.stats.${statKey}.mod`)  : (stats[statKey]?.mod  || 0))
                       + traitBonus;
        const statDelta = newTotal - oldTotal;
        if (statDelta === 0) continue;

        // Stamina is linked to endurance
        if (statKey === "endurance") {
          const staminaPath = "system.stamina.value";
          if (!foundry.utils.hasProperty(updateData, staminaPath)) {
            const mult = effStaminaMult(this.system);
            const staminaDelta = Math.floor(statDelta * mult);
            if (staminaDelta !== 0) {
              const newStamina = this.system.stamina.value + staminaDelta;
              if (newStamina < 0) {
                const deficit = Math.abs(newStamina);
                const pay = await this._offerHPPaymentForStamina(deficit);
                if (pay) {
                  foundry.utils.setProperty(updateData, staminaPath, 0);
                  const limbUpdates = this._computeLimbHPPayment(deficit);
                  for (const [k, v] of Object.entries(limbUpdates))
                    foundry.utils.setProperty(updateData, k, v);
                } else {
                  foundry.utils.setProperty(updateData, staminaPath, newStamina);
                  warnings.push(`${this.name} — ${game.i18n.localize("TAMS.Stamina")}: ${newStamina}`);
                }
              } else {
                foundry.utils.setProperty(updateData, staminaPath, newStamina);
              }
            }
          }
        }

        // Custom resources linked to this stat
        for (const [idx, res] of customResources.entries()) {
          if (res.stat !== statKey || res.stat === "custom") continue;
          const resDelta = Math.floor(statDelta * effResourceMult(this.system, res));
          if (resDelta === 0) continue;
          const rawVal = (customResources[idx].value ?? 0) + resDelta;
          customResources[idx].value = rawVal;
          if (rawVal < 0) warnings.push(`${this.name} — ${res.name}: ${rawVal}`);
          customResourcesChanged = true;
        }
      }

      // Stamina mult change: adjust stamina.value by the delta in max
      if (foundry.utils.hasProperty(updateData, "system.stamina.mult") &&
          !foundry.utils.hasProperty(updateData, "system.stamina.value")) {
        const newMult = foundry.utils.getProperty(updateData, "system.stamina.mult");
        const oldMult = this.system.stamina?.mult ?? 1;
        if (newMult !== oldMult) {
          const endTotal = this.system.stats.endurance.total;
          const delta = Math.floor(endTotal * effStaminaMult(this.system, newMult)) - Math.floor(endTotal * effStaminaMult(this.system, oldMult));
          if (delta !== 0)
            foundry.utils.setProperty(updateData, "system.stamina.value", this.system.stamina.value + delta);
        }
      }

      // Custom resource mult changes: adjust value by the delta in max
      for (let idx = 0; idx < customResources.length; idx++) {
        const multPath = `system.customResources.${idx}.mult`;
        if (!foundry.utils.hasProperty(updateData, multPath)) continue;
        const origRes = this.system.customResources[idx];
        const newMult = foundry.utils.getProperty(updateData, multPath);
        const oldMult = origRes.mult ?? 1;
        if (newMult === oldMult || origRes.stat === "custom") continue;
        const statVal = this.system.stats[origRes.stat]?.total || 0;
        const delta = Math.floor(statVal * effResourceMult(this.system, { ...origRes, mult: newMult }))
                    - Math.floor(statVal * effResourceMult(this.system, origRes));
        if (delta === 0) continue;
        customResources[idx].value = (customResources[idx].value ?? 0) + delta;
        customResources[idx].mult = newMult;
        delete updateData[multPath];
        customResourcesChanged = true;
      }

      // Fatigue edited directly (e.g. via the sheet's Fatigue input): clamp the
      // current value down if it now exceeds the newly-lowered max. The sheet's
      // form resubmits every field on change, so `updateData` may already carry
      // a (stale, unclamped) value alongside the new fatigue — use whichever
      // value is actually pending, not just the previously-stored one.
      if (foundry.utils.hasProperty(updateData, "system.stamina.fatigue")) {
        const newFatigue = foundry.utils.getProperty(updateData, "system.stamina.fatigue");
        const pendingMult = foundry.utils.hasProperty(updateData, "system.stamina.mult")
          ? foundry.utils.getProperty(updateData, "system.stamina.mult")
          : this.system.stamina.mult;
        const rawMax = computeRawStaminaMax(stats.endurance.total, effStaminaMult(this.system, pendingMult), this.system.traitStaminaExtra);
        const newMax = computeFatiguedMax(rawMax, newFatigue);
        const pendingValue = foundry.utils.hasProperty(updateData, "system.stamina.value")
          ? foundry.utils.getProperty(updateData, "system.stamina.value")
          : this.system.stamina.value;
        if (pendingValue > newMax) {
          foundry.utils.setProperty(updateData, "system.stamina.value", newMax);
        }
      }

      for (let idx = 0; idx < customResources.length; idx++) {
        const fatiguePath = `system.customResources.${idx}.fatigue`;
        if (!foundry.utils.hasProperty(updateData, fatiguePath)) continue;
        const orig = customResources[idx];
        const newFatigue = foundry.utils.getProperty(updateData, fatiguePath);
        const statVal = orig.stat === "custom" ? (orig.customValue ?? 10) : (stats[orig.stat]?.total || 0);
        const rawMax = computeRawResourceMax(statVal, effResourceMult(this.system, orig), orig.bonus);
        const newMax = computeFatiguedMax(rawMax, newFatigue);
        const valuePath = `system.customResources.${idx}.value`;
        const pendingValue = foundry.utils.hasProperty(updateData, valuePath)
          ? foundry.utils.getProperty(updateData, valuePath)
          : (customResources[idx].value ?? 0);
        customResources[idx].fatigue = newFatigue;
        customResources[idx].value = pendingValue > newMax ? newMax : pendingValue;
        delete updateData[fatiguePath];
        delete updateData[valuePath];
        customResourcesChanged = true;
      }

      if (customResourcesChanged)
        foundry.utils.setProperty(updateData, "system.customResources", customResources);

      if (warnings.length) {
        const gmIds = game.users?.filter(u => u.isGM).map(u => u.id) ?? [];
        ChatMessage.create({
          whisper: gmIds,
          content: `<div class="tams-roll">${warnings.map(w => `<div class="tams-crit failure">⚠ ${w} (insufficient resources)</div>`).join("")}</div>`
        });
      }
    }

    return res;
  }

  /**
   * Adjust all limb current HP values when endurance total changes by a delta.
   * Called after trait items are added or removed.
   * @param {number} endDelta - The change in endurance total (positive = added, negative = removed)
   */
  async _adjustLimbHPForEnduranceDelta(endDelta) {
    if (endDelta === 0) return;
    const currentTotal = this.system.stats.endurance.total;
    const oldTotal = currentTotal - endDelta;
    const isSquadOrHorde = this.system.settings?.isNPC &&
      (this.system.settings.npcType === "squad" || this.system.settings.npcType === "horde");
    const squadSize = this.system.settings?.squadSize || 1;

    const updates = {};
    const limbKeys = ['head', 'thorax', 'stomach', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
    for (const key of limbKeys) {
      const limb = this.system.limbs[key];
      if (!limb) continue;
      const oldIndMax = Math.floor(oldTotal * limb.mult);
      const newIndMax = Math.floor(currentTotal * limb.mult);
      const oldMax = isSquadOrHorde ? (oldIndMax * squadSize) : oldIndMax;
      const newMax = isSquadOrHorde ? (newIndMax * squadSize) : newIndMax;
      const delta = newMax - oldMax;
      if (delta !== 0) {
        updates[`system.limbs.${key}.value`] = limb.value + delta;
      }
    }
    if (Object.keys(updates).length > 0) {
      await this.update(updates);
    }
  }

  _computeLimbHPPayment(deficit) {
    const PAYMENT_LIMB_ORDER = ["leftArm", "rightArm", "leftLeg", "rightLeg", "stomach", "thorax"];
    const total = 5 * deficit;
    const base = Math.floor(total / PAYMENT_LIMB_ORDER.length);
    const remainder = total % PAYMENT_LIMB_ORDER.length;
    const updates = {};
    PAYMENT_LIMB_ORDER.forEach((key, i) => {
      const dmg = base + (i < remainder ? 1 : 0);
      if (dmg > 0)
        updates[`system.limbs.${key}.value`] = (this.system.limbs[key]?.value ?? 0) - dmg;
    });
    return updates;
  }

  async _offerHPPaymentForStamina(deficit) {
    const hpCost = 5 * deficit;
    const result = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("TAMS.HPPayment.Title") },
      content: `<p>${game.i18n.format("TAMS.HPPayment.Prompt", { amount: deficit, hp: hpCost })}</p>`,
      yes: { label: game.i18n.localize("TAMS.HPPayment.Pay"), default: false },
      no: { label: game.i18n.localize("TAMS.HPPayment.Decline"), default: true },
      rejectClose: false
    });
    return result === true;
  }

  /**
   * Adjust stamina and custom resource current values when stat totals change
   * due to trait additions/removals.
   * @param {object} statDeltas - Map of statKey → delta (positive = gained, negative = lost)
   */
  async _adjustResourcesForStatDeltas(statDeltas) {
    const updates = {};
    const warnings = [];

    for (const [statKey, statDelta] of Object.entries(statDeltas)) {
      if (statDelta === 0) continue;

      if (statKey === "endurance") {
        const mult = effStaminaMult(this.system);
        const delta = Math.floor(statDelta * mult);
        if (delta !== 0) {
          const newVal = this.system.stamina.value + delta;
          if (newVal < 0) {
            const deficit = Math.abs(newVal);
            const pay = await this._offerHPPaymentForStamina(deficit);
            if (pay) {
              updates["system.stamina.value"] = 0;
              const limbUpdates = this._computeLimbHPPayment(deficit);
              Object.assign(updates, limbUpdates);
            } else {
              updates["system.stamina.value"] = newVal;
              warnings.push(`${this.name} — ${game.i18n.localize("TAMS.Stamina")}: ${newVal}`);
            }
          } else {
            updates["system.stamina.value"] = newVal;
          }
        }
      }

      const customResources = foundry.utils.duplicate(this.system.customResources ?? []);
      let changed = false;
      for (const [idx, res] of customResources.entries()) {
        if (res.stat !== statKey || res.stat === "custom") continue;
        const delta = Math.floor(statDelta * effResourceMult(this.system, res));
        if (delta === 0) continue;
        const rawVal = (customResources[idx].value ?? 0) + delta;
        customResources[idx].value = rawVal;
        if (rawVal < 0) warnings.push(`${this.name} — ${res.name}: ${rawVal}`);
        changed = true;
      }
      if (changed) updates["system.customResources"] = customResources;
    }

    if (Object.keys(updates).length) await this.update(updates);

    if (warnings.length) {
      const gmIds = game.users?.filter(u => u.isGM).map(u => u.id) ?? [];
      await ChatMessage.create({
        whisper: gmIds,
        content: `<div class="tams-roll">${warnings.map(w => `<div class="tams-crit failure">⚠ ${w} (insufficient resources)</div>`).join("")}</div>`
      });
    }
  }

  /**
   * Build/extend a partial update object that spends `amount` from a resource
   * (Stamina, or a customResources entry), tracking spentSinceRest for Fatigue.
   * Synchronous — does not call update() itself, so multiple calls can be merged
   * into one actor.update() (e.g. a split spend across a custom resource and Stamina).
   * @param {"stamina"|number|string} resourceKey "stamina", or a customResources index.
   * @param {number} amount Amount to spend (should be > 0).
   * @param {object} [updates={}] Partial update object to extend and return.
   * @returns {object} The extended updates object.
   */
  applyResourceSpend(resourceKey, amount, updates = {}) {
    if (!amount || amount <= 0) return updates;

    if (resourceKey === "stamina") {
      const current = updates["system.stamina.value"] ?? this.system.stamina.value;
      const spent = updates["system.stamina.spentSinceRest"] ?? (this.system.stamina.spentSinceRest ?? 0);
      updates["system.stamina.value"] = Math.max(0, current - amount);
      updates["system.stamina.spentSinceRest"] = spent + amount;
      return updates;
    }

    const idx = parseInt(resourceKey);
    const customResources = updates["system.customResources"] ?? foundry.utils.duplicate(this.system.customResources ?? []);
    if (!customResources[idx]) return updates;
    customResources[idx].value = Math.max(0, (customResources[idx].value ?? 0) - amount);
    customResources[idx].spentSinceRest = (customResources[idx].spentSinceRest ?? 0) + amount;
    updates["system.customResources"] = customResources;
    return updates;
  }

  /**
   * Take a Short Rest: refill every resource's current value to its (Fatigue-reduced)
   * max, and gain Fatigue on any resource that had spending since the last Short Rest.
   * @returns {Promise<{resources: {name: string, fatigueGained: number, refillAmount: number, newMax: number}[]}>}
   */
  async takeShortRest() {
    const sys = this.system;
    const updates = {};
    const resources = [];

    const staminaSpent = sys.stamina.spentSinceRest ?? 0;
    const staminaGain = computeShortRestFatigueGain(staminaSpent);
    const staminaNewFatigue = (sys.stamina.fatigue ?? 0) + staminaGain;
    const staminaRawMax = computeRawStaminaMax(sys.stats.endurance.total, effStaminaMult(sys), sys.traitStaminaExtra);
    const staminaNewMax = computeFatiguedMax(staminaRawMax, staminaNewFatigue);
    updates["system.stamina.fatigue"] = staminaNewFatigue;
    updates["system.stamina.spentSinceRest"] = 0;
    updates["system.stamina.value"] = staminaNewMax;
    resources.push({
      name: game.i18n.localize("TAMS.Stamina"),
      fatigueGained: staminaGain,
      refillAmount: Math.max(0, staminaNewMax - sys.stamina.value),
      newMax: staminaNewMax
    });

    const customResources = foundry.utils.duplicate(sys.customResources ?? []);
    customResources.forEach((res, idx) => {
      const spent = res.spentSinceRest ?? 0;
      const gain = computeShortRestFatigueGain(spent);
      const newFatigue = (res.fatigue ?? 0) + gain;
      const statVal = res.stat === "custom" ? (res.customValue ?? 10) : (sys.stats[res.stat]?.total || 0);
      const rawMax = computeRawResourceMax(statVal, effResourceMult(sys, res), res.bonus);
      const newMax = computeFatiguedMax(rawMax, newFatigue);
      customResources[idx].fatigue = newFatigue;
      customResources[idx].spentSinceRest = 0;
      customResources[idx].value = newMax;
      resources.push({
        name: res.name,
        fatigueGained: gain,
        refillAmount: Math.max(0, newMax - res.value),
        newMax
      });
    });
    updates["system.customResources"] = customResources;

    await this.update(updates);
    return { resources };
  }

  /**
   * Take a Long Rest: heal Fatigue on every resource via a bundled dinner+sleep tick.
   * Uncapped — the GM decides how often the party gets to rest.
   * @returns {Promise<{resources: {name: string, fatigueHealed: number, newFatigue: number}[]}>}
   */
  async takeLongRest() {
    const sys = this.system;
    const updates = {};
    const resources = [];

    const staminaHeal = computeLongRestFatigueHeal(sys.stats.endurance.total);
    if (staminaHeal > 0 && (sys.stamina.fatigue ?? 0) > 0) {
      const newFatigue = Math.max(0, sys.stamina.fatigue - staminaHeal);
      const actualHeal = sys.stamina.fatigue - newFatigue;
      const rawMax = computeRawStaminaMax(sys.stats.endurance.total, effStaminaMult(sys), sys.traitStaminaExtra);
      const newMax = computeFatiguedMax(rawMax, newFatigue);
      updates["system.stamina.fatigue"] = newFatigue;
      // Backfill current value by the amount of Fatigue healed — losing Fatigue raises the
      // ceiling, and the character should feel that as regained resource, not just headroom.
      updates["system.stamina.value"] = Math.min(newMax, (sys.stamina.value ?? 0) + actualHeal);
      resources.push({
        name: game.i18n.localize("TAMS.Stamina"),
        fatigueHealed: actualHeal,
        newFatigue
      });
    }

    const customResources = foundry.utils.duplicate(sys.customResources ?? []);
    let crChanged = false;
    customResources.forEach((res, idx) => {
      if ((res.fatigue ?? 0) <= 0) return;
      const governingStat = res.stat === "custom" ? (res.customValue ?? 0) : (sys.stats[res.stat]?.total ?? 0);
      const heal = computeLongRestFatigueHeal(governingStat);
      if (heal <= 0) return;
      const newFatigue = Math.max(0, res.fatigue - heal);
      const actualHeal = res.fatigue - newFatigue;
      const rawMax = computeRawResourceMax(governingStat, effResourceMult(sys, res), res.bonus);
      const newMax = computeFatiguedMax(rawMax, newFatigue);
      customResources[idx].fatigue = newFatigue;
      customResources[idx].value = Math.min(newMax, (res.value ?? 0) + actualHeal);
      crChanged = true;
      resources.push({ name: res.name, fatigueHealed: actualHeal, newFatigue });
    });
    if (crChanged) updates["system.customResources"] = customResources;

    if (resources.length === 0) {
      return { resources: [] };
    }

    await this.update(updates);
    return { resources };
  }

  /** @override */
  async _onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    await super._onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId);
    if (embeddedName !== "Item" || game.userId !== userId) return;

    let endDelta = 0;
    const statDeltas = {};
    for (const doc of documents) {
      if (doc.type !== "trait") continue;
      for (const mod of (doc.system?.modifiers || [])) {
        const match = mod.target?.match(/^stats\.(\w+)$/);
        if (!match) continue;
        const key = match[1];
        const val = mod.value || 0;
        if (key === "endurance") endDelta += val;
        statDeltas[key] = (statDeltas[key] || 0) + val;
      }
    }
    if (endDelta !== 0) await this._adjustLimbHPForEnduranceDelta(endDelta);
    if (Object.values(statDeltas).some(v => v !== 0)) await this._adjustResourcesForStatDeltas(statDeltas);
  }

  /** @override */
  async _onDeleteEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    await super._onDeleteEmbeddedDocuments(embeddedName, documents, result, options, userId);
    if (embeddedName !== "Item" || game.userId !== userId) return;

    let endDelta = 0;
    const statDeltas = {};
    for (const doc of documents) {
      if (doc.type !== "trait") continue;
      for (const mod of (doc.system?.modifiers || [])) {
        const match = mod.target?.match(/^stats\.(\w+)$/);
        if (!match) continue;
        const key = match[1];
        const val = mod.value || 0;
        if (key === "endurance") endDelta -= val;
        statDeltas[key] = (statDeltas[key] || 0) - val;
      }
    }
    if (endDelta !== 0) await this._adjustLimbHPForEnduranceDelta(endDelta);
    if (Object.values(statDeltas).some(v => v !== 0)) await this._adjustResourcesForStatDeltas(statDeltas);
  }

  async _onDropItem(event, data) {
    const item = await Item.fromDropData(data);
    if (item?.type === "statusEffect" && item.system.statusId) {
      await this.toggleStatusEffect(item.system.statusId, { active: true });
      return false;
    }
    return super._onDropItem(event, data);
  }
}
