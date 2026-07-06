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

    let report = `<b>${this.name}</b> ${game.i18n.localize("TAMS.TakingDamage")}:<br>`;
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
        
        let effective = Math.max(0, incoming - effectiveArmor);
        const blocked = Math.min(incoming, effectiveArmor);
        let overflow = 0;

        let resistanceLabel = "";
        const damageType = hit.damageType || "";
        if (damageType && this.system.resistances?.length) {
            const match = this.system.resistances.find(r => r.damageType === damageType);
            if (match) {
                const typeName = game.i18n.localize(`TAMS.DamageType.${match.damageType}`);
                if (match.category === "immunity") {
                    effective = 0;
                    resistanceLabel = game.i18n.format("TAMS.Combat.Immune", {type: typeName});
                } else if (match.category === "resistance") {
                    const reduced = Math.min(effective, match.value);
                    effective = Math.max(0, effective - match.value);
                    resistanceLabel = game.i18n.format("TAMS.Combat.Resisted", {value: reduced, type: typeName});
                } else if (match.category === "vulnerability") {
                    effective = effective + match.value;
                    resistanceLabel = game.i18n.format("TAMS.Combat.Vulnerable", {value: match.value, type: typeName});
                }
            }
        }

        if (isSquadOrHorde) {
            const indMax = limb.individualMax || Math.floor(this.system.stats.endurance.total * limb.mult);
            const limbCap = (isAoE ? multiplier : 1) * indMax; 

            const currentLimbHpBeforeHit = updates[`system.limbs.${limbKey}.value`] ?? limb.value;

            const cappedEffective = Math.min(effective, limbCap);
            
            overflow = effective - cappedEffective;
            const totalDamageOfHit = effective; // Total damage after armor (includes overflow)
            effective = cappedEffective;

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
        if (armorValue > 0 && (effective + overflow) < incoming) {
            const key = isAltArmor ? `system.limbs.${limbKey}.armorMax` : `system.limbs.${limbKey}.armor`;
            const pending = updates[key];
            const currentVal = pending !== undefined ? pending : (isAltArmor ? limb.armorMax : limb.armor);
            updates[key] = Math.max(0, (currentVal || 0) - 1);
            lossLabel = isAltArmor ? game.i18n.localize("TAMS.Checks.ArmorHPLost") : game.i18n.localize("TAMS.Checks.ArmorPointLost");
        }

        const penLabel = armourPen > 0 ? game.i18n.format("TAMS.Checks.ArmorPenetrated", {pen: armourPen}) : "";
        const overflowLabel = overflow > 0 ? game.i18n.format("TAMS.Checks.OverflowCapped", {overflow}) : "";
        const lossMsg = lossLabel ? `, ${lossLabel}` : "";
        report += `• ${game.i18n.format("TAMS.Checks.DamageReport", {loc, effective, blocked, penLabel, lossLabel: lossMsg, overflowLabel})}<br>`;
        if (resistanceLabel) report += `  ↳ ${resistanceLabel}<br>`;

        if (newHp <= 0 && !original.injured && !updates[`system.limbs.${limbKey}.injured`]) {
            report += `<b style="color:#f39c12;">!!! ${game.i18n.format("TAMS.Checks.LimbInjuredAuto", {limb: limb.label})} !!!</b><br>`;
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
                const limbKeys = ['head', 'thorax', 'stomach', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
                for (let lk of limbKeys) {
                    const limb = this.system.limbs[lk];
                    if (!limb) continue;
                    const indMax = limb.individualMax || Math.floor(this.system.stats.endurance.total * limb.mult);
                    const newMax = finalSquadSize * indMax;
                    const currentVal = updates[`system.limbs.${lk}.value`] ?? limb.value;
                    const totalDamage = limb.max - currentVal;
                    const remainderDamage = totalDamage % indMax;

                    if (currentVal > 0) {
                        updates[`system.limbs.${lk}.value`] = newMax - remainderDamage;
                    } else {
                        updates[`system.limbs.${lk}.value`] = Math.max(currentVal, -newMax);
                    }
                }
            } else {
                report += `<b style="color:#c0392b;">!!! ${game.i18n.format("TAMS.Checks.SquadThreatenedMembers", {name: this.name, lostCount})} !!!</b><br>`;
            }
            
            if (!isMook) {
                const dcs = (bottleneckLimb && limbLosses[bottleneckLimb]) ? limbLosses[bottleneckLimb].slice(0, lostCount) : [];
                const dcsAttr = dcs.length > 0 ? ` data-dcs="${dcs.join(',')}"` : "";
                report += `<button class="tams-squad-crit-roll" data-actor-uuid="${this.uuid}" data-count="${lostCount}" data-name="${this.name}"${dcsAttr}>${game.i18n.format("TAMS.Checks.RollForCriticalWounds", {count: lostCount})}</button><br>`;
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
        
        if (original.injured && damage > 0 && !original.criticallyInjured) {
            pendingChecks.push({ type: 'crit', loc: limb.label, dc: damage + (original.value < 0 ? Math.abs(original.value) : 0), limbKey });
        } else if (hits.some(h => locationMap[h.location] === limbKey && h.forceCrit === "1")) {
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
      const customResources = foundry.utils.duplicate(this.system.customResources ?? []);
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
            const mult = this.system.stamina?.mult ?? 1;
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
          if (res.stat !== statKey || res.customValue) continue;
          const resDelta = Math.floor(statDelta * (res.mult ?? 1));
          if (resDelta === 0) continue;
          const rawVal = (customResources[idx].value ?? 0) + resDelta;
          if (rawVal < 0) {
            const deficit = Math.abs(rawVal);
            const pay = await this._offerStaminaPayment(res.name, deficit);
            if (pay) {
              customResources[idx].value = 0;
              const staminaPath = "system.stamina.value";
              const currentStamina = foundry.utils.getProperty(updateData, staminaPath) ?? this.system.stamina.value;
              foundry.utils.setProperty(updateData, staminaPath, currentStamina - deficit);
            } else {
              customResources[idx].value = rawVal;
              warnings.push(`${this.name} — ${res.name}: ${rawVal}`);
            }
          } else {
            customResources[idx].value = rawVal;
          }
          customResourcesChanged = true;
        }
      }

      if (customResourcesChanged && !foundry.utils.hasProperty(updateData, "system.customResources"))
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
    return new Promise(resolve => {
      new Dialog({
        title: game.i18n.localize("TAMS.HPPayment.Title"),
        content: `<p>${game.i18n.format("TAMS.HPPayment.Prompt", { amount: deficit, hp: hpCost })}</p>`,
        buttons: {
          yes: { label: game.i18n.localize("TAMS.HPPayment.Pay"),    callback: () => resolve(true)  },
          no:  { label: game.i18n.localize("TAMS.HPPayment.Decline"), callback: () => resolve(false) }
        },
        default: "no",
        close: () => resolve(false)
      }).render(true);
    });
  }

  async _offerStaminaPayment(resourceName, deficit) {
    return new Promise(resolve => {
      new Dialog({
        title: game.i18n.localize("TAMS.StaminaPayment.Title"),
        content: `<p>${game.i18n.format("TAMS.StaminaPayment.Prompt", { resource: resourceName, amount: deficit })}</p>`,
        buttons: {
          yes: { label: game.i18n.localize("TAMS.StaminaPayment.Pay"),    callback: () => resolve(true)  },
          no:  { label: game.i18n.localize("TAMS.StaminaPayment.Decline"), callback: () => resolve(false) }
        },
        default: "no",
        close: () => resolve(false)
      }).render(true);
    });
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
        const mult = this.system.stamina?.mult ?? 1;
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
        if (res.stat !== statKey || res.customValue) continue;
        const delta = Math.floor(statDelta * (res.mult ?? 1));
        if (delta === 0) continue;
        const rawVal = (customResources[idx].value ?? 0) + delta;
        if (rawVal < 0) {
          const deficit = Math.abs(rawVal);
          const pay = await this._offerStaminaPayment(res.name, deficit);
          if (pay) {
            customResources[idx].value = 0;
            const newStamina = (updates["system.stamina.value"] ?? this.system.stamina.value) - deficit;
            updates["system.stamina.value"] = newStamina;
            if (newStamina < 0)
              warnings.push(`${this.name} — ${game.i18n.localize("TAMS.Stamina")}: ${newStamina}`);
          } else {
            customResources[idx].value = rawVal;
            warnings.push(`${this.name} — ${res.name}: ${rawVal}`);
          }
        } else {
          customResources[idx].value = rawVal;
        }
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

  /** @override */
  async _onCreateDescendantDocuments(parent, collection, documents, data, options, userId) {
    await super._onCreateDescendantDocuments(parent, collection, documents, data, options, userId);
    if (collection !== "items" || game.userId !== userId) return;

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
  async _onDeleteDescendantDocuments(parent, collection, documents, ids, options, userId) {
    await super._onDeleteDescendantDocuments(parent, collection, documents, ids, options, userId);
    if (collection !== "items" || game.userId !== userId) return;

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
}
