// Lightweight models to encapsulate taxonomy logic without changing external APIs

export class Taxonomy {
  constructor(key, label, options) {
    this.key = String(key);
    this.label = typeof label === 'string' && label.trim() ? label : this.key;
    const arr = Array.isArray(options) ? options : [];
    // Normalize into { key, label }
    this.options = arr.map(o => (typeof o === 'object' && o && 'key' in o)
      ? { key: String(o.key), label: String(o.label ?? o.key) }
      : { key: String(o), label: String(o) }
    );
    // Fast lookup set
    this._allowed = new Set(this.options.map(o => o.key));
  }

  has(valueKey) { return this._allowed.has(String(valueKey)); }
  getLabelFor(valueKey) {
    const k = String(valueKey);
    const opt = this.options.find(o => o.key === k);
    return opt ? opt.label : k;
  }
  getOptions() { return this.options.slice(); }
  toJSON() { return { label: this.label, options: this.getOptions() }; }
}

export class Taxonomies {
  constructor(record) {
    const src = record && typeof record === 'object' ? record : {};
    this._map = new Map();
    for (const [key, meta] of Object.entries(src)) {
      const label = (meta && typeof meta.label === 'string') ? meta.label : key;
      const options = (meta && Array.isArray(meta.options)) ? meta.options : [];
      this._map.set(key, new Taxonomy(key, label, options));
    }
  }

  keys() { return Array.from(this._map.keys()); }
  get(key) { return this._map.get(key) || null; }
  getMeta(key) {
    const t = this.get(key);
    return t ? { label: t.label, options: t.getOptions() } : { label: String(key), options: [] };
  }
  getOptions(key) { return this.getMeta(key).options; }
  allowedMap() {
    const out = {};
    for (const [k, t] of this._map.entries()) out[k] = new Set(t.getOptions().map(o => o.key));
    return out;
  }
  toJSON() {
    const out = {};
    for (const [k, t] of this._map.entries()) out[k] = t.toJSON();
    return out;
  }
}
