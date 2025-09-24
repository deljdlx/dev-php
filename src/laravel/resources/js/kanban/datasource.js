import Column from './models/Column';
import { ALLOWED_TAXONOMIES } from './utils/taxonomies';

/**
 * DemoDataSource: loads columns from localStorage when available,
 * otherwise uses a factory to generate demo data and persists it.
 */
export class DemoDataSource {
  constructor(factory, storageKey = 'demo.kanban.v1', logger = null) {
    this.factory = factory;
    this.storageKey = storageKey;
    this.logger = logger;
  }
  #read() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }
  async #ensureSeed() {
    const existing = this.#read();
    if (existing && Array.isArray(existing.columns)) {
      // Backfill board meta if missing
      if (!existing.board || !existing.board.taxonomies) {
        existing.board = { taxonomies: Object.fromEntries(Object.entries(ALLOWED_TAXONOMIES).map(([k, set]) => [k, Array.from(set)])) };
        localStorage.setItem(this.storageKey, JSON.stringify(existing));
      }
      return existing;
    }
    // Seed using factory; supports both legacy Array and new Object shape
    const seededFromFactory = this.factory?.();
    let data;
    if (Array.isArray(seededFromFactory)) {
      data = {
        board: { taxonomies: Object.fromEntries(Object.entries(ALLOWED_TAXONOMIES).map(([k, set]) => [k, Array.from(set)])) },
        columns: seededFromFactory,
      };
    } else if (seededFromFactory && typeof seededFromFactory === 'object') {
      const board = seededFromFactory.board || { taxonomies: Object.fromEntries(Object.entries(ALLOWED_TAXONOMIES).map(([k, set]) => [k, Array.from(set)])) };
      data = { board, columns: seededFromFactory.columns || [] };
    } else {
      data = { board: { taxonomies: Object.fromEntries(Object.entries(ALLOWED_TAXONOMIES).map(([k, set]) => [k, Array.from(set)])) }, columns: [] };
    }
    // Persist seed
    localStorage.setItem(this.storageKey, JSON.stringify({ board: data.board, columns: data.columns.map(c => (typeof c.toJSON === 'function' ? c.toJSON() : c)) }));
    this.logger?.debug('Seeded board + columns from factory');
    return data;
  }
  // Legacy full-columns loader (still available if needed)
  async getColumns() {
    const data = await this.#ensureSeed();
  this.logger?.debug('getColumns ->', data.columns);
    return data.columns.map(c => Column.fromJSON(c));
  }
  // New: board meta (taxonomies etc.)
  async getBoardMeta() {
    const data = await this.#ensureSeed();
    const meta = data.board || { taxonomies: Object.fromEntries(Object.entries(ALLOWED_TAXONOMIES).map(([k, set]) => [k, Array.from(set)])) };
    this.logger?.debug('getBoardMeta ->', meta);
    return meta;
  }
  // New: only columns meta (id, name)
  async getColumnsMeta() {
    const data = await this.#ensureSeed();
  this.logger?.debug('getColumnsMeta ->', data.columns.map(c => ({ id: c.id, name: c.name })));
    return data.columns.map(c => ({ id: c.id, name: c.name }));
  }
  // New: tickets for a given column
  async getTicketsByColumnId(columnId) {
    const data = await this.#ensureSeed();
    const col = data.columns.find(c => c.id === columnId);
  this.logger?.debug('getTicketsByColumnId', columnId, '->', col?.tickets);
    return Array.isArray(col?.tickets) ? col.tickets : [];
  }
  async save(columns) {
    // Persist as plain DTOs and preserve board meta
    const existing = (this.#read() || {});
    const dto = {
      board: existing.board || { taxonomies: Object.fromEntries(Object.entries(ALLOWED_TAXONOMIES).map(([k, set]) => [k, Array.from(set)])) },
      columns: columns.map(c => (typeof c.toJSON === 'function' ? c.toJSON() : c)),
    };
    localStorage.setItem(this.storageKey, JSON.stringify(dto));
    this.logger?.debug('save board+columns', dto);
  }
  async setBoardMeta(board) {
    const existing = (this.#read() || {});
    const dto = {
      board: board || existing.board,
      columns: existing.columns || [],
    };
    localStorage.setItem(this.storageKey, JSON.stringify(dto));
    this.logger?.debug('setBoardMeta', dto.board);
  }
}
