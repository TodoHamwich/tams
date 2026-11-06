// Applying, ending and counting down temporary buffs. The rules are in buffs.js; this file does
// the Foundry side. Countdowns run on the primary GM's client, which can update every holder.

import {
  activeBuffEntries, advanceBuffs, applyBuffPlan, carryToClock, crashFor, createBuffEntry, formatBuffTime,
  planBuffApplication, stepClock, stepRounds,
} from './buffs.js';
import { MAGIC_ITEM_TYPES } from './magic-items.js';

const e = s => foundry.utils.escapeHTML(String(s ?? ""));
const t = (key, data) => data ? game.i18n.format(`TAMS.Buff.${key}`, data) : game.i18n.localize(`TAMS.Buff.${key}`);
const copy = list => foundry.utils.duplicate(list ?? []);
const isPrimaryGM = () => game.user.isGM && game.users.activeGM?.id === game.user.id;

let advanceQueue = Promise.resolve();

function ownerAndGmIds(actor) {
  const owners = Object.entries(actor.ownership ?? {}).filter(([id, level]) => level >= 3 && id !== "default").map(([id]) => id);
  return [...new Set([...owners, ...game.users.filter(u => u.isGM).map(u => u.id)])];
}

/** The running combat involving either actor, as buffs need it, or null. */
function runningCombat(casterUuid, actor) {
  // Not game.combat: that's only the encounter this user is viewing.
  const inIt = combat => combat.combatants.some(c => c.actor?.uuid === casterUuid || c.actor?.uuid === actor?.uuid);
  const combat = game.combats.find(c => c.started && inIt(c));
  return combat ? { id: combat.id, round: combat.round } : null;
}

/** Every buff on an actor, including those on its items. */
function allBuffsOn(actor) {
  return [...(actor.system.buffs ?? []), ...actor.items.contents.flatMap(i => i.system.buffs ?? [])];
}

async function chooseFrom({ title, label, options }) {
  if (options.length === 1) return options[0].id;
  const select = options.map(o => `<option value="${e(o.id)}">${e(o.name)}</option>`).join("");
  return foundry.applications.api.DialogV2.wait({
    window: { title },
    content: `<div class="form-group"><label>${e(label)}</label><select id="tams-buff-choice">${select}</select></div>`,
    rejectClose: false,
    buttons: [
      { action: "ok", label: t("Apply"), default: true, callback: (event, button) => button.form.querySelector("#tams-buff-choice").value },
      { action: "cancel", label: game.i18n.localize("TAMS.Cancel"), callback: () => null },
    ],
  });
}

/** Pick who receives a buff: from the selected tokens if any, otherwise the user's characters. */
async function chooseRecipient() {
  const owned = actor => actor?.type === "character" && actor.isOwner;
  const selected = [...new Set((canvas?.tokens?.controlled ?? []).map(token => token.actor))].filter(owned);
  const actors = selected.length ? selected : game.actors.filter(owned);
  if (!actors.length) {
    ui.notifications.warn(t("NoCharacter"));
    return null;
  }
  const id = await chooseFrom({ title: t("ApplyTitle"), label: t("ChooseCharacter"), options: actors.map(a => ({ id: a.uuid, name: a.name })) });
  return actors.find(a => a.uuid === id) ?? null;
}

/** Pick which of the recipient's weapons or items a buff goes on. */
async function chooseItem(actor, attachTo) {
  const types = attachTo === "weapon" ? ["weapon"] : MAGIC_ITEM_TYPES;
  const items = actor.items.filter(i => types.includes(i.type));
  if (!items.length) {
    ui.notifications.warn(t(attachTo === "weapon" ? "NoWeapon" : "NoItem", { name: actor.name }));
    return null;
  }
  const id = await chooseFrom({
    title: t("ApplyTitle"), label: t(attachTo === "weapon" ? "ChooseWeapon" : "ChooseItem"),
    options: items.map(i => ({ id: i.id, name: i.displayName ?? i.name })),
  });
  return actor.items.get(id) ?? null;
}

/**
 * Apply the buff on a chat card. Anyone can use a card any number of times.
 * @param {ChatMessage} message
 */
export async function applyBuffFromMessage(message) {
  const snapshot = message.getFlag("tams", "buff");
  if (!snapshot) return;
  const actor = await chooseRecipient();
  if (!actor) return;
  const onCharacter = snapshot.attachTo === "character";
  const item = onCharacter ? null : await chooseItem(actor, snapshot.attachTo);
  if (!onCharacter && !item) return;

  const holder = item ?? actor;
  const list = copy(holder.system.buffs);
  const plan = planBuffApplication(snapshot, list, allBuffsOn(actor));
  if (plan.action === "refuse") {
    const stats = plan.stats.map(s => game.i18n.localize(`TAMS.Stat${s.charAt(0).toUpperCase()}${s.slice(1)}`)).join(", ");
    ui.notifications.warn(t("StatRefused", { name: actor.name, stats }));
    return;
  }
  const entry = createBuffEntry(snapshot, {
    id: foundry.utils.randomID(), combat: runningCombat(snapshot.casterUuid, actor), now: game.time.worldTime,
  });
  await holder.update({ "system.buffs": applyBuffPlan(list, entry, plan) });
  const key = plan.action === "refresh" ? "Refreshed" : "Applied";
  const data = { buff: e(snapshot.name), name: e(actor.name), item: e(item?.displayName ?? item?.name ?? "") };
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="tams-roll">${t(item ? `${key}Item` : key, data)}</div>`,
  });
}

/**
 * End a buff early, from the sheet. A stat increase still leaves its penalty, and only the GM can
 * remove a penalty.
 * @param {Actor} actor
 * @param {{buffId: string, itemId: ?string}} which
 */
export async function removeBuff(actor, { buffId, itemId = null }) {
  const holder = itemId ? actor.items.get(itemId) : actor;
  const entry = holder?.system.buffs?.find(b => b.id === buffId);
  if (!entry || !actor.isOwner || (entry.isCrash && !game.user.isGM)) return;
  await holder.update({ "system.buffs": copy(holder.system.buffs).filter(b => b.id !== buffId) });
  const crash = crashFor(entry, {
    id: foundry.utils.randomID(), combat: runningCombat(entry.casterUuid, actor), now: game.time.worldTime,
  });
  if (crash) await actor.update({ "system.buffs": [...copy(actor.system.buffs), crash] });
  await announceEnded(actor, [entry], crash ? [crash] : []);
}

async function announceEnded(actor, ended, crashes) {
  const lines = ended.map(b => t(b.isCrash ? "PenaltyEnded" : "Ended", { buff: e(b.name), name: e(actor.name) }));
  for (const crash of crashes) {
    const amount = crash.modifiers.map(m => m.value).join(", ");
    lines.push(t("PenaltyStarted", { buff: e(crash.name), name: e(actor.name), amount }));
  }
  if (!lines.length) return;
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="tams-roll">${lines.join("<br>")}</div>`,
    whisper: ownerAndGmIds(actor),
  });
}

/** Actors whose buffs need counting: the world's, plus unlinked tokens in play. */
function buffHolders() {
  const actors = new Map(game.actors.map(a => [a.uuid, a]));
  const tokens = [...(game.scenes?.active?.tokens ?? []), ...game.combats.contents.flatMap(c => c.combatants.contents.map(x => x.token))];
  for (const token of tokens) {
    const actor = token?.actor;
    if (actor && !actors.has(actor.uuid)) actors.set(actor.uuid, actor);
  }
  return [...actors.values()].filter(a => a.system?.buffs);
}

/**
 * Run a step over every buff in the world, ending what it ends and starting any penalties.
 * @param {(entry: object) => object|null} step
 */
function advanceAll(step) {
  // A turn change also moves the clock, so two runs can overlap and overwrite each other's lists.
  advanceQueue = advanceQueue.then(() => runAdvance(step)).catch(err => console.error("TAMS | buff countdown failed", err));
  return advanceQueue;
}

async function runAdvance(step) {
  const now = game.time.worldTime;
  for (const actor of buffHolders()) {
    const ended = [];
    for (const item of actor.items) {
      if (!item.system.buffs?.length) continue;
      const result = advanceBuffs(copy(item.system.buffs), step);
      if (result.changed) await item.update({ "system.buffs": result.kept });
      ended.push(...result.ended);
    }
    const own = advanceBuffs(copy(actor.system.buffs), step);
    ended.push(...own.ended);
    const crashes = ended
      .map(entry => crashFor(entry, { id: foundry.utils.randomID(), combat: runningCombat(entry.casterUuid, actor), now }))
      .filter(Boolean);
    if (own.changed || crashes.length) await actor.update({ "system.buffs": [...own.kept, ...crashes] });
    await announceEnded(actor, ended, crashes);
  }
  for (const item of game.items ?? []) {
    if (!item.system.buffs?.length) continue;
    const result = advanceBuffs(copy(item.system.buffs), step);
    if (result.changed) await item.update({ "system.buffs": result.kept });
  }
}

/** Count round-based buffs when a combat's turn changes. */
export async function tamsBuffsOnTurn(combat) {
  if (!isPrimaryGM() || !combat.started) return;
  const activeUuid = combat.combatant?.actor?.uuid;
  const canAct = uuid => combat.combatants.some(c => c.actor?.uuid === uuid && !c.isDefeated && c.actor.system?.lifeState !== "dead");
  await advanceAll(entry => stepRounds(entry, {
    combatId: combat.id, round: combat.round, isCasterTurn: entry.casterUuid === activeUuid, casterCanAct: canAct(entry.casterUuid),
  }));
}

/** Move rounds left onto the clock when a combat ends. */
export async function tamsBuffsOnCombatEnd(combat) {
  if (!isPrimaryGM()) return;
  const now = game.time.worldTime;
  await advanceAll(entry => entry.combatId === combat.id ? carryToClock(entry, now) : entry);
}

/** End clock-based buffs that have run out, and carry over rounds from combats that are gone. */
export async function tamsBuffsOnClock() {
  if (!isPrimaryGM()) return;
  const now = game.time.worldTime;
  await advanceAll(entry => {
    const stale = entry.roundsLeft !== null && !game.combats.has(entry.combatId);
    return stepClock(stale ? carryToClock(entry, now) : entry, now);
  });
}

/**
 * Rows for the buff list on the actor sheet.
 * @param {Actor} actor
 * @returns {object[]}
 */
export function buffRowsFor(actor) {
  const now = game.time.worldTime;
  const active = new Set(activeBuffEntries(actor.system.buffs, actor.items, actor.items).map(b => b.id));
  const row = (entry, item = null) => ({
    id: entry.id,
    itemId: item?.id ?? "",
    name: entry.name,
    itemName: item?.displayName ?? item?.name ?? "",
    isCrash: entry.isCrash,
    casterName: entry.casterName,
    inactive: !active.has(entry.id),
    canRemove: actor.isOwner && (!entry.isCrash || game.user.isGM),
    remaining: entry.roundsLeft !== null
      ? t("RoundsLeft", { rounds: entry.roundsLeft })
      : t("TimeLeft", { time: formatBuffTime((entry.expiresAt ?? now) - now) }),
    effects: effectSummary(entry),
  });
  return [
    ...(actor.system.buffs ?? []).map(b => row(b)),
    ...actor.items.contents.flatMap(i => (i.system.buffs ?? []).map(b => row(b, i))),
  ];
}

const MODIFIER_LABELS = {
  "stats.strength.value": "TAMS.StatStrength", "stats.dexterity.value": "TAMS.StatDexterity",
  "stats.endurance.value": "TAMS.StatEndurance", "stats.wisdom.value": "TAMS.StatWisdom",
  "stats.intelligence.value": "TAMS.StatIntelligence", "stats.bravery.value": "TAMS.StatBravery",
  "hp.max": "TAMS.TotalHPMax", "stamina.max": "TAMS.StaminaMax", "allRolls": "TAMS.ModifierAllRolls",
  "itemAttacks": "TAMS.Magic.ItemAttacks",
};

function effectSummary(entry) {
  const signed = n => `${n >= 0 ? "+" : ""}${n}`;
  const damageType = type => game.i18n.localize(`TAMS.DamageType.${type}`);
  const parts = [
    ...entry.modifiers.map(m => `${signed(m.value)} ${game.i18n.localize(MODIFIER_LABELS[m.target] ?? m.target)}`),
    ...entry.resistances.map(r => `${game.i18n.localize(`TAMS.${r.category.charAt(0).toUpperCase()}${r.category.slice(1)}`)} ${r.value ? `${r.value} ` : ""}${damageType(r.damageType)}`),
    ...entry.bonusDamage.map(d => `${signed(d.amount)} ${damageType(d.damageType)}`),
    ...(entry.armourPenetration ? [`${signed(entry.armourPenetration)} ${game.i18n.localize("TAMS.ArmourPenetration")}`] : []),
    ...entry.onHitStatusIds.map(id => game.i18n.localize(CONFIG.statusEffects?.find(s => s.id === id)?.name ?? id)),
  ];
  return parts.join(", ");
}
