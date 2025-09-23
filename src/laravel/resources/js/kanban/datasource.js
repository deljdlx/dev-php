import { Column } from './models';

/**
 * DemoDataSource: loads columns from localStorage when available,
 * otherwise uses a factory to generate demo data and persists it.
 */
export class DemoDataSource {
  constructor(factory, storageKey = 'demo.kanban.v1') {
    this.factory = factory;
    this.storageKey = storageKey;
  }
  #read() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }
  async #ensureSeed() {
    const existing = this.#read();
    if (existing && Array.isArray(existing.columns)) return existing;
    const seeded = { columns: this.factory() };
    await this.save(seeded.columns);
    return seeded;
  }
  // Legacy full-columns loader (still available if needed)
  async getColumns() {
    const data = await this.#ensureSeed();
    return data.columns.map(c => Column.fromJSON(c));
  }
  // New: only columns meta (id, name)
  async getColumnsMeta() {
    const data = await this.#ensureSeed();
    return data.columns.map(c => ({ id: c.id, name: c.name }));
  }
  // New: tickets for a given column
  async getTicketsByColumnId(columnId) {
    const data = await this.#ensureSeed();
    const col = data.columns.find(c => c.id === columnId);
    return Array.isArray(col?.tickets) ? col.tickets : [];
  }
  async save(columns) {
    // Persist as plain DTOs
    const dto = { columns: columns.map(c => (typeof c.toJSON === 'function' ? c.toJSON() : c)) };
    localStorage.setItem(this.storageKey, JSON.stringify(dto));
  }
}
