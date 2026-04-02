import { vi } from 'vitest';

global.foundry = {
  abstract: {
    DataModel: class {
      constructor(data = {}, options = {}) {
        Object.assign(this, data);
        this.parent = options.parent || null;
      }
      static defineSchema() { return {}; }
      prepareData() {}
      prepareDerivedData() {}
    },
    TypeDataModel: class {
      constructor(data = {}, options = {}) {
        Object.assign(this, data);
        this.parent = options.parent || null;
      }
      static defineSchema() { return {}; }
      prepareData() {}
      prepareDerivedData() {}
    }
  },
  data: {
    fields: {
      StringField: class { constructor(options = {}) { this.options = options; } },
      NumberField: class { constructor(options = {}) { this.options = options; } },
      BooleanField: class { constructor(options = {}) { this.options = options; } },
      SchemaField: class { constructor(fields, options = {}) { this.fields = fields; this.options = options; } },
      EmbeddedDataField: class { constructor(model, options = {}) { this.model = model; this.options = options; } },
      ArrayField: class { constructor(element, options = {}) { this.element = element; this.options = options; } },
      HTMLField: class { constructor(options = {}) { this.options = options; } },
      ObjectField: class { constructor(options = {}) { this.options = options; } }
    }
  },
  utils: {
    hasProperty: (obj, path) => {
      if (!obj) return false;
      if (path in obj) return true;
      const parts = path.split('.');
      let current = obj;
      for (const part of parts) {
        if (current === null || typeof current !== 'object' || !(part in current)) return false;
        current = current[part];
      }
      return true;
    },
    getProperty: (obj, path) => {
      if (!obj) return undefined;
      if (path in obj) return obj[path];
      const parts = path.split('.');
      let current = obj;
      for (const part of parts) {
        if (current === null || typeof current !== 'object') return undefined;
        current = current[part];
      }
      return current;
    },
    setProperty: (obj, path, value) => {
      if (path in obj) {
          obj[path] = value;
          return true;
      }
      const parts = path.split('.');
      let current = obj;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!(part in current)) current[part] = {};
        current = current[part];
      }
      current[parts[parts.length - 1]] = value;
      return true;
    }
  }
};

global.game = {
  i18n: {
    localize: (key) => key,
    format: (key, data) => key
  }
};

global.Hooks = {
  on: vi.fn(),
  once: vi.fn(),
  call: vi.fn(),
  callAll: vi.fn()
};

global.Roll = class {
  constructor(formula) {
    this.formula = formula;
    this.total = 50; // Default
  }
  async evaluate() {
    return this;
  }
};

global.Actor = class {
  constructor(data) {
    this.name = data.name || "Test Actor";
    this.system = data.system || {};
    this.items = data.items || [];
    this.update = vi.fn(async (data) => {
      for (const [path, value] of Object.entries(data)) {
        const parts = path.split('.');
        let target = this;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!target[parts[i]]) target[parts[i]] = {};
          target = target[parts[i]];
        }
        target[parts[parts.length - 1]] = value;
      }
      return data;
    });
  }
  async _preUpdate() { return true; }
};

global.Item = class {
  constructor(data) {
    this.name = data.name || "Test Item";
    this.type = data.type || "base";
    this.system = data.system || {};
  }
};
