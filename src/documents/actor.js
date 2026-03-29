import { getHitLocation } from '../utils/combat.js';

/**
 * The TAMS Actor document class.
 * Extends the core Actor class.
 */
export class TAMSActor extends Actor {
  /**
   * Apply damage to this actor across multiple hits/locations.
   * @param {object[]} hits Array of hit objects: { damage, location, armourPen }
   * @param {object} options Additional options
   * @param {boolean} [options.isAoE=false] Is this an AoE attack?
   * @param {number} [options.multiplier=1] For squads/hordes, how many members were hit by the AoE.
   * @returns {Promise<object>} Result including updates, itemUpdates, pendingChecks, and report.
   */
  async applyDamage(hits, { isAoE = false, multiplier = 1 } = {}) {
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
    
    for (let key of Object.keys(this.system.limbs)) {
        originalLimbStatus[key] = {
            value: this.system.limbs[key].value,
            injured: this.system.limbs[key].injured,
            criticallyInjured: this.system.limbs[key].criticallyInjured,
            max: this.system.limbs[key].max
        };
        limbDamageReceived[key] = 0;
    }

    let report = `<b>${this.name}</b> ${game.i18n.localize("TAMS.TakingDamage")}:<br>`;
    const isSquadOrHorde = this.system.settings?.isNPC && (this.system.settings.npcType === "squad" || this.system.settings.npcType === "horde");
    const currentSquadSize = this.system.settings.squadSize || 1;
    const accumulatedLimbDamage = {};
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
        let armor = 0;
        let armorItems = [];
        if (limb.hasEquippedArmor) {
            const it = this.items.get(limb.equippedArmorId);
            if (it && it.type === 'armor') {
                armorItems = [it];
                const pendingVal = itemUpdates[it.id]?.[`system.limbs.${limbKey}.value`];
                const curVal = (pendingVal !== undefined ? pendingVal : (it.system.limbs[limbKey]?.value || 0));
                if (isAltArmor) {
                    const pendingMax = itemUpdates[it.id]?.[`system.limbs.${limbKey}.max`];
                    const curMax = (pendingMax !== undefined ? pendingMax : (it.system.limbs[limbKey]?.max || 0));
                    if (curMax > 0) armor = curVal;
                } else {
                    armor = curVal;
                }
            }
        } else {
            const pendingVal = updates[`system.limbs.${limbKey}.armor`];
            const curVal = pendingVal !== undefined ? pendingVal : (limb.armor || 0);
            if (isAltArmor) {
                const pendingMax = updates[`system.limbs.${limbKey}.armorMax`];
                const curMax = pendingMax !== undefined ? pendingMax : (limb.armorMax || 0);
                if (curMax > 0) armor = curVal;
            } else {
                armor = curVal;
            }
        }
        armor = Math.floor(armor);
        const effectiveArmor = Math.max(0, armor - armourPen);
        
        let effective = Math.max(0, incoming - effectiveArmor);
        const blocked = Math.min(incoming, effectiveArmor);
        let overflow = 0;

        if (isSquadOrHorde) {
            const indMax = limb.individualMax || Math.floor(this.system.stats.endurance.total * limb.mult);
            const limbCap = (isAoE ? multiplier : 1) * indMax; 
            if (!accumulatedLimbDamage[limbKey]) accumulatedLimbDamage[limbKey] = 0;

            const currentLimbHpBeforeHit = updates[`system.limbs.${limbKey}.value`] ?? limb.value;

            const remainingCap = Math.max(0, limbCap - accumulatedLimbDamage[limbKey]);
            const cappedEffective = Math.min(effective, remainingCap);
            
            overflow = effective - cappedEffective;
            const totalDamageOfHit = effective; // Total damage after armor (includes overflow)
            effective = cappedEffective;
            accumulatedLimbDamage[limbKey] += effective;

            // Track DCs for lost members in this hit
            if (!limbLosses[limbKey]) limbLosses[limbKey] = [];
            const newLimbHpAfterHit = currentLimbHpBeforeHit - effective;
            const oldSize = Math.max(0, Math.ceil(currentLimbHpBeforeHit / indMax));
            const newSize = Math.max(0, Math.ceil(newLimbHpAfterHit / indMax));
            const lostInThisHit = oldSize - newSize;
            
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
        const newHp = Math.floor(currentHp) - effective;
        updates[`system.limbs.${limbKey}.value`] = newHp;
        
        limbDamageReceived[limbKey] += effective;

        let lossLabel = "";
        if (armor > 0 && (effective + overflow) < incoming) {
            if (limb.hasEquippedArmor) {
                const itemToDamage = armorItems.find(it => {
                    const pending = isAltArmor ? itemUpdates[it.id]?.[`system.limbs.${limbKey}.max`] : itemUpdates[it.id]?.[`system.limbs.${limbKey}.value`];
                    const val = pending !== undefined ? pending : (isAltArmor ? it.system.limbs[limbKey]?.max : it.system.limbs[limbKey]?.value);
                    return (val || 0) > 0;
                });
                if (itemToDamage) {
                    const key = isAltArmor ? `system.limbs.${limbKey}.max` : `system.limbs.${limbKey}.value`;
                    const pending = itemUpdates[itemToDamage.id]?.[key];
                    const currentVal = pending !== undefined ? pending : (isAltArmor ? itemToDamage.system.limbs[limbKey]?.max : itemToDamage.system.limbs[limbKey]?.value);
                    itemUpdates[itemToDamage.id] = { 
                        ...(itemUpdates[itemToDamage.id] || {}),
                        _id: itemToDamage.id, 
                        [key]: Math.max(0, currentVal - 1) 
                    };
                }
            } else {
                const key = isAltArmor ? `system.limbs.${limbKey}.armorMax` : `system.limbs.${limbKey}.armor`;
                const pending = updates[key];
                const currentVal = pending !== undefined ? pending : (isAltArmor ? limb.armorMax : limb.armor);
                updates[key] = Math.max(0, (currentVal || 0) - 1);
            }
            lossLabel = isAltArmor ? game.i18n.localize("TAMS.Checks.ArmorHPLost") : game.i18n.localize("TAMS.Checks.ArmorPointLost");
        }

        const penLabel = armourPen > 0 ? game.i18n.format("TAMS.Checks.ArmorPenetrated", {pen: armourPen}) : "";
        const overflowLabel = overflow > 0 ? game.i18n.format("TAMS.Checks.OverflowCapped", {overflow}) : "";
        const lossMsg = lossLabel ? `, ${lossLabel}` : "";
        report += `• ${game.i18n.format("TAMS.Checks.DamageReport", {loc, effective, blocked, penLabel, lossLabel: lossMsg, overflowLabel})}<br>`;

        if (newHp <= -limb.max) {
            if (!limb.injured && !updates[`system.limbs.${limbKey}.injured`]) {
                report += `<b style="color:#f39c12;">!!! ${game.i18n.format("TAMS.Checks.LimbInjuredAuto", {limb: limb.label})} !!!</b><br>`;
            }
            updates[`system.limbs.${limbKey}.injured`] = true;
        }
    }

    // Squad size reduction logic
    if (isSquadOrHorde) {
        let finalSquadSize = currentSquadSize;
        let bottleneckLimb = null;
        for (let [lk, limb] of Object.entries(this.system.limbs)) {
            const newLimbVal = updates[`system.limbs.${lk}.value`] ?? limb.value;
            const indMax = limb.individualMax || Math.floor(this.system.stats.endurance.total * limb.mult);
            const potentialSize = Math.max(0, Math.ceil(newLimbVal / indMax));
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
                report += `<b style="color:#c0392b;">!!! ${game.i18n.format("TAMS.Checks.SquadLostMembers", {name: this.name, lostCount, finalSquadSize})} !!!</b><br>`;
                
                // Ensure all limbs are capped to the new squad size
                for (let [lk, limb] of Object.entries(this.system.limbs)) {
                    const indMax = limb.individualMax || Math.floor(this.system.stats.endurance.total * limb.mult);
                    const newMax = finalSquadSize * indMax;
                    const currentVal = updates[`system.limbs.${lk}.value`] ?? limb.value;
                    if (Math.abs(currentVal) > newMax) {
                        updates[`system.limbs.${lk}.value`] = Math.min(Math.max(currentVal, -newMax), newMax);
                    }
                }
            } else {
                report += `<b style="color:#c0392b;">!!! ${game.i18n.format("TAMS.Checks.SquadThreatenedMembers", {name: this.name, lostCount})} !!!</b><br>`;
            }
            
            if (!isMook) {
                const dcs = (bottleneckLimb && limbLosses[bottleneckLimb]) ? limbLosses[bottleneckLimb].slice(0, lostCount) : [];
                const dcsAttr = dcs.length > 0 ? ` data-dcs="${dcs.join(',')}"` : "";
                report += `<button class="tams-squad-crit-roll" data-actor-id="${this.id}" data-count="${lostCount}" data-name="${this.name}"${dcsAttr}>${game.i18n.format("TAMS.Checks.RollForCriticalWounds", {count: lostCount})}</button><br>`;
            }
            if (finalSquadSize === 0 && isMook) {
                report += `<b style="color:#c0392b;">!!! ${game.i18n.format("TAMS.Checks.SquadDestroyed", {name: this.name})} !!!</b><br>`;
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
        
        if (currentVal <= 0 && currentVal > -limb.max && !original.injured && !limb.injured) {
            pendingChecks.push({ type: 'injured', loc: limb.label, dc: damage + (original.value < 0 ? Math.abs(original.value) : 0), limbKey });
        }
        if (currentVal <= -limb.max && !original.criticallyInjured && original.value > -limb.max) {
            pendingChecks.push({ type: 'crit', loc: limb.label, dc: damage + (original.value < 0 ? Math.abs(original.value) : 0), limbKey });
        } else if (hits.some(h => locationMap[h.location] === limbKey && h.forceCrit === "1")) {
            // Brutal tag: force critical wound check
            if (!original.criticallyInjured) {
                pendingChecks.push({ 
                    type: 'crit', 
                    loc: limb.label, 
                    dc: Math.max(10, damage + (original.value < 0 ? Math.abs(original.value) : 0)), 
                    limbKey 
                });
            }
        }
    }

    // Survival Checks
    const totalHp = this.system.hp.value;
    const maxHp = this.system.hp.max;
    if (!isSquadOrHorde) {
        let survivalDC = 0;
        let reasons = [];
        let survivalNeeded = false;

        if (totalHp <= -maxHp) {
            survivalNeeded = true;
            survivalDC = Math.abs(totalHp);
            reasons.push(`${game.i18n.localize("TAMS.Checks.ReasonTotalHPBelowNegMax")} (${totalHp} / -${maxHp})`);
        } else if (totalHp < 0) {
            pendingChecks.push({ 
                type: 'unconscious', 
                dc: Math.abs(totalHp), 
                reasons: [`${game.i18n.localize("TAMS.Checks.ReasonTotalHPNegative")} (${totalHp})`] 
            });
        }

        // Head/Thorax checks
        const checkLethal = (key) => {
            const limb = this.system.limbs[key];
            if (limb.value < -limb.max) {
                survivalNeeded = true;
                const dc = Math.abs(limb.value);
                if (dc > survivalDC) survivalDC = dc;
                reasons.push(`${limb.label} ${game.i18n.localize("TAMS.Checks.ReasonLimbBeyondNegMax")} (${limb.value} / -${limb.max})`);
            }
        };
        checkLethal('head');
        checkLethal('thorax');

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

    // Check if endurance changed
    const hasValue = foundry.utils.hasProperty(updateData, "system.stats.endurance.value");
    const hasMod = foundry.utils.hasProperty(updateData, "system.stats.endurance.mod");

    if (hasValue || hasMod) {
      const stats = this.system.stats;
      const oldVal = stats.endurance.value;
      const oldMod = stats.endurance.mod;
      const oldEnd = oldVal + (oldMod || 0);

      const newVal = hasValue ? foundry.utils.getProperty(updateData, "system.stats.endurance.value") : oldVal;
      const newMod = hasMod ? foundry.utils.getProperty(updateData, "system.stats.endurance.mod") : (oldMod || 0);
      const newEnd = newVal + newMod;

      if (newEnd !== oldEnd) {
        const deltaEnd = newEnd - oldEnd;
        const limbs = this.system.limbs;
        for (const [key, limb] of Object.entries(limbs)) {
          // Calculate the delta in max HP for this limb
          const oldMax = Math.floor(oldEnd * limb.mult);
          const newMax = Math.floor(newEnd * limb.mult);
          const deltaMax = newMax - oldMax;

          if (deltaMax !== 0) {
            const currentPath = `system.limbs.${key}.value`;
            const currentVal = foundry.utils.hasProperty(updateData, currentPath) 
                ? foundry.utils.getProperty(updateData, currentPath) 
                : limb.value;
            
            foundry.utils.setProperty(updateData, currentPath, currentVal + deltaMax);
          }
        }
      }
    }
    return res;
  }
}
