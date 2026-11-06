// Schema fragments for temporary buffs. See src/utils/buffs.js for the rules.

function effectFields(fields) {
  return {
    modifiers: new fields.ArrayField(new fields.SchemaField({
      target: new fields.StringField({ initial: "stats.strength.value" }),
      value: new fields.NumberField({ initial: 0 }),
    }), { initial: [] }),
    resistances: new fields.ArrayField(new fields.SchemaField({
      damageType: new fields.StringField({ initial: "" }),
      category: new fields.StringField({ initial: "resistance" }),
      value: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
      limbs: new fields.ArrayField(new fields.StringField({ initial: "" }), { initial: [] }),
    }), { initial: [] }),
    bonusDamage: new fields.ArrayField(new fields.SchemaField({
      damageType: new fields.StringField({ initial: "" }),
      amount: new fields.NumberField({ initial: 0, nullable: true }),
    }), { initial: [] }),
    onHitStatusIds: new fields.ArrayField(new fields.StringField({ initial: "" }), { initial: [] }),
    armourPenetration: new fields.NumberField({ initial: 0, integer: true, min: 0, nullable: true }),
  };
}

/** What an ability gives when it is used: `system.buff` on ability items. */
export function abilityBuffField(fields) {
  return new fields.SchemaField({
    enabled: new fields.BooleanField({ initial: false }),
    attachTo: new fields.StringField({ initial: "character" }),
    duration: new fields.StringField({ initial: "1round" }),
    stackable: new fields.BooleanField({ initial: false }),
    ...effectFields(fields),
  });
}

/** Buffs currently attached to an actor or item: `system.buffs`. */
export function activeBuffsField(fields) {
  return new fields.ArrayField(new fields.SchemaField({
    id: new fields.StringField({ initial: "" }),
    key: new fields.StringField({ initial: "" }),
    name: new fields.StringField({ initial: "" }),
    casterName: new fields.StringField({ initial: "" }),
    casterUuid: new fields.StringField({ initial: "" }),
    isCrash: new fields.BooleanField({ initial: false }),
    stackable: new fields.BooleanField({ initial: false }),
    baseRounds: new fields.NumberField({ initial: null, nullable: true, integer: true }),
    baseSeconds: new fields.NumberField({ initial: null, nullable: true, integer: true }),
    roundsLeft: new fields.NumberField({ initial: null, nullable: true, integer: true }),
    expiresAt: new fields.NumberField({ initial: null, nullable: true }),
    combatId: new fields.StringField({ initial: "" }),
    appliedRound: new fields.NumberField({ initial: null, nullable: true, integer: true }),
    lastTickRound: new fields.NumberField({ initial: null, nullable: true, integer: true }),
    ...effectFields(fields),
  }), { initial: [] });
}
