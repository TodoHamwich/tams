/**
 * TAMS Item Maker — standalone dialog for creating any item type.
 * Launch via game.tams.openItemMaker(actor) or game.tams.openItemMaker().
 */
export class TAMSItemMaker extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {

  constructor(options = {}) {
    super(options);
    this._actor = options.actor ?? null;
    this._selectedType = "weapon";
    this._imgSrc = "icons/svg/item-bag.svg";
    this._name = "";
    this._formState = {
      weapon:       { size: "medium", isRanged: false, attackStat: "dexterity", damageStat: "strength", damageType: "piercing", hasArmourPen: false, armourPen: 0, fireRate: "1", ammoTotal: 0, tags: "" },
      skill:        { stat: "dexterity", bonus: 0 },
      ability:      { resource: "stamina", cost: 1, isAttack: false, attackStat: "dexterity", damageStat: "strength", damage: 0, damageType: "blunt" },
      equipment:    { quantity: 1, size: "medium" },
      armor:        { size: "medium", head: 0, thorax: 0, stomach: 0, leftArm: 0, rightArm: 0, leftLeg: 0, rightLeg: 0 },
      consumable:   { quantity: 1, size: "small", usesMax: 1 },
      tool:         { quantity: 1, size: "small" },
      shield:       { armorValue: 5, size: "medium" },
      questItem:    { quantity: 1, size: "small" },
      backpack:     { capacity: 10, modifier: 0.5 },
      trait:        { isProfession: false, profession: "" },
      statusEffect: { statusId: "", mechanicalSummary: "", durationRounds: 0 }
    };
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    id: "tams-item-maker",
    classes: ["tams", "item-maker"],
    position: { width: 540, height: "auto" },
    window: {
      title: "TAMS.ItemMaker.Title",
      resizable: true,
      icon: "fa-solid fa-hammer"
    },
    actions: {
      selectType:  TAMSItemMaker.prototype._onSelectType,
      createItem:  TAMSItemMaker.prototype._onCreateItem,
      editImage:   TAMSItemMaker.prototype._onEditImage,
      cancelMaker: TAMSItemMaker.prototype._onCancelMaker
    }
  };

  /** @override */
  static PARTS = {
    form: { template: "systems/tams/templates/item-maker.html" }
  };

  /** Open the item maker. Pass an Actor to create embedded items; omit for world items. */
  static open(actor = null) {
    new TAMSItemMaker({ actor }).render(true);
  }

  /* -------------------------------------------- */
  /*  Context                                     */
  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.selectedType  = this._selectedType;
    context.imgSrc        = this._imgSrc;
    context.itemName      = this._name;
    context.f             = this._formState[this._selectedType];

    context.itemTypes = [
      { type: "weapon",       label: "TYPES.Item.weapon",       icon: "fa-solid fa-sword" },
      { type: "skill",        label: "TYPES.Item.skill",        icon: "fa-solid fa-book-open" },
      { type: "ability",      label: "TYPES.Item.ability",      icon: "fa-solid fa-bolt" },
      { type: "equipment",    label: "TYPES.Item.equipment",    icon: "fa-solid fa-box" },
      { type: "armor",        label: "TYPES.Item.armor",        icon: "fa-solid fa-shirt" },
      { type: "consumable",   label: "TYPES.Item.consumable",   icon: "fa-solid fa-flask" },
      { type: "tool",         label: "TYPES.Item.tool",         icon: "fa-solid fa-wrench" },
      { type: "shield",       label: "TYPES.Item.shield",       icon: "fa-solid fa-shield-halved" },
      { type: "questItem",    label: "TYPES.Item.questItem",    icon: "fa-solid fa-scroll" },
      { type: "backpack",     label: "TYPES.Item.backpack",     icon: "fa-solid fa-bag-shopping" },
      { type: "trait",        label: "TYPES.Item.trait",        icon: "fa-solid fa-star" },
      { type: "statusEffect", label: "TYPES.Item.statusEffect", icon: "fa-solid fa-skull-crossbones" }
    ];

    context.statOptions = {
      "strength":     "TAMS.StatStrength",
      "dexterity":    "TAMS.StatDexterity",
      "endurance":    "TAMS.StatEndurance",
      "wisdom":       "TAMS.StatWisdom",
      "intelligence": "TAMS.StatIntelligence",
      "bravery":      "TAMS.StatBravery"
    };

    context.damageTypeOptions = {
      "":        "TAMS.DamageType.None",
      "blunt":   "TAMS.DamageType.blunt",
      "piercing":"TAMS.DamageType.piercing",
      "slashing":"TAMS.DamageType.slashing",
      "fire":    "TAMS.DamageType.fire",
      "magic":   "TAMS.DamageType.magic",
      "psychic": "TAMS.DamageType.psychic",
      "acid":    "TAMS.DamageType.acid"
    };

    context.sizeOptions = {
      "small":  "TAMS.SizeOptions.Small",
      "medium": "TAMS.SizeOptions.Medium",
      "large":  "TAMS.SizeOptions.Large"
    };

    context.fireRateOptions = {
      "1":    "TAMS.FireRateSingle",
      "3":    "TAMS.FireRateBurst",
      "auto": "TAMS.FireRateAuto"
    };

    const resources = { "stamina": "TAMS.Stamina" };
    if (this._actor) {
      (this._actor.system.customResources ?? []).forEach((res, i) => {
        resources[i.toString()] = res.name;
      });
    }
    context.resourceOptions = resources;

    // Status effect preset options (for ability/weapon inflictsStatus)
    const sePresets = {};
    for (const se of (CONFIG.statusEffects ?? [])) {
      sePresets[se.id] = se.label ?? se.id;
    }
    context.statusEffectOptions = { "": "TAMS.None", ...sePresets, "custom": "TAMS.StatusEffect.Custom" };

    return context;
  }

  /* -------------------------------------------- */
  /*  Render                                      */
  /* -------------------------------------------- */

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);

    // Track name input
    const nameInput = this.element.querySelector(".item-maker-name");
    if (nameInput) {
      nameInput.addEventListener("input", e => { this._name = e.target.value; });
    }

    // Track all data-field inputs → persist to _formState so type switching preserves values
    this.element.querySelectorAll("[data-field]").forEach(el => {
      const save = () => {
        const field = el.dataset.field;
        let value;
        if (el.type === "checkbox") value = el.checked;
        else if (el.type === "number") value = parseFloat(el.value) || 0;
        else value = el.value;
        this._formState[this._selectedType][field] = value;
      };
      el.addEventListener("input",  save);
      el.addEventListener("change", save);
    });

    // Re-render when isRanged or isAttack toggles (controls visible sub-sections)
    this.element.querySelectorAll("[data-rerender]").forEach(el => {
      el.addEventListener("change", () => {
        const field = el.dataset.field;
        this._formState[this._selectedType][field] = el.checked;
        this.render();
      });
    });
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  async _onCancelMaker(event, target) {
    this.close();
  }

  async _onSelectType(event, target) {
    this._selectedType = target.dataset.type;
    this.render();
  }

  async _onEditImage(event, target) {
    const fp = new FilePicker({
      type: "image",
      current: this._imgSrc,
      callback: path => { this._imgSrc = path; this.render(); }
    });
    fp.browse();
  }

  async _onCreateItem(event, target) {
    const s = this._formState[this._selectedType];
    const type = this._selectedType;

    const typeName = game.i18n.localize(`TYPES.Item.${type}`);
    const name = this._name.trim() || game.i18n.format("TAMS.ItemMaker.DefaultName", { type: typeName });

    const systemData = this._buildSystemData(type, s);
    const itemData = { name, type, img: this._imgSrc, system: systemData };

    if (this._actor) {
      await this._actor.createEmbeddedDocuments("Item", [itemData]);
    } else {
      await Item.create(itemData);
    }

    ui.notifications.info(game.i18n.format("TAMS.ItemMaker.Created", { name }));
    this.close();
  }

  /* -------------------------------------------- */
  /*  Helpers                                     */
  /* -------------------------------------------- */

  _buildSystemData(type, s) {
    switch (type) {
      case "weapon": {
        const data = {
          size:             s.size ?? "medium",
          isRanged:         !!s.isRanged,
          attackStat:       s.attackStat ?? "dexterity",
          damageStat:       s.damageStat ?? "strength",
          damageType:       s.damageType ?? "piercing",
          hasArmourPen:     !!s.hasArmourPen,
          armourPenetration: parseFloat(s.armourPen) || 0,
          tags:             s.tags ?? ""
        };
        if (s.isRanged) {
          data.fireRate = s.fireRate ?? "1";
          data.ammo = { current: parseInt(s.ammoTotal) || 0, total: parseInt(s.ammoTotal) || 0 };
          data.isRanged = true;
        }
        return data;
      }
      case "skill":
        return { stat: s.stat ?? "dexterity", bonus: parseInt(s.bonus) || 0 };

      case "ability": {
        const data = {
          resource:  s.resource ?? "stamina",
          cost:      parseFloat(s.cost) || 1,
          isAttack:  !!s.isAttack
        };
        if (s.isAttack) {
          data.attackStat = s.attackStat ?? "dexterity";
          data.damageStat = s.damageStat ?? "strength";
          data.damage     = parseFloat(s.damage) || 0;
          data.damageType = s.damageType ?? "blunt";
        }
        return data;
      }
      case "equipment":
      case "tool":
      case "questItem":
        return { quantity: parseInt(s.quantity) || 1, size: s.size ?? "medium" };

      case "armor":
        return {
          size: s.size ?? "medium",
          limbs: {
            head:     { value: parseInt(s.head)     || 0, max: parseInt(s.head)     || 0 },
            thorax:   { value: parseInt(s.thorax)   || 0, max: parseInt(s.thorax)   || 0 },
            stomach:  { value: parseInt(s.stomach)  || 0, max: parseInt(s.stomach)  || 0 },
            leftArm:  { value: parseInt(s.leftArm)  || 0, max: parseInt(s.leftArm)  || 0 },
            rightArm: { value: parseInt(s.rightArm) || 0, max: parseInt(s.rightArm) || 0 },
            leftLeg:  { value: parseInt(s.leftLeg)  || 0, max: parseInt(s.leftLeg)  || 0 },
            rightLeg: { value: parseInt(s.rightLeg) || 0, max: parseInt(s.rightLeg) || 0 }
          }
        };

      case "consumable":
        return { quantity: parseInt(s.quantity) || 1, size: s.size ?? "small", uses: { value: parseInt(s.usesMax) || 1, max: parseInt(s.usesMax) || 1 } };

      case "shield":
        return { armorValue: parseInt(s.armorValue) || 5, size: s.size ?? "medium" };

      case "backpack":
        return { capacity: parseInt(s.capacity) || 10, modifier: parseFloat(s.modifier) || 0.5 };

      case "trait":
        return { isProfession: !!s.isProfession, profession: s.profession ?? "" };

      case "statusEffect":
        return { statusId: s.statusId ?? "", mechanicalSummary: s.mechanicalSummary ?? "", durationRounds: parseInt(s.durationRounds) || 0 };

      default:
        return {};
    }
  }
}
