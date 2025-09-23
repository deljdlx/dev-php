import { describe, it, expect } from 'vitest';
import KanbanState from '../state';
import Column from '../models/Column';
import Ticket from '../models/Ticket';

class MemoryDS {
  constructor(columns = []) { this.columns = columns; }
  async getColumns() { return this.columns.map(c => new Column(c)); }
  async save(cols) { this.columns = cols.map(c => (typeof c.toJSON === 'function' ? c.toJSON() : c)); }
}

describe('KanbanState', () => {
  it('adds and moves tickets and persists', async () => {
    const ds = new MemoryDS([
      { id: 'todo', name: 'À faire', tickets: [] },
      { id: 'doing', name: 'En cours', tickets: [] },
    ]);
    const state = new KanbanState(ds);
    await state.load();

    await state.addTicket('todo', { title: 'T1' });
    expect(state.columns[0].tickets.length).toBe(1);

    const id = state.columns[0].tickets[0].id;
    await state.moveTicket(id, 'doing', 0);
    expect(state.columns[0].tickets.length).toBe(0);
    expect(state.columns[1].tickets[0].id).toBe(id);
  });
});
