import Column from './models/Column';
import Ticket from './models/Ticket';
import sanitizeLabel from './utils/sanitizeLabel';
import sanitizeCategory from './utils/sanitizeCategory';
import sanitizeComplexity from './utils/sanitizeComplexity';

class KanbanState {
    /**
     * @param {object} dataSource - must implement getColumns() and save(columns)
     * @param {{ persist?: (columns: any[], state: KanbanState, context?: any) => Promise<void> }} [options]
     */
    constructor(dataSource, options = {}) {
        this.dataSource = dataSource;
        this.columns = [];
        // Default persistence calls the data source as before; can be overridden via options or setPersist()
    this.#persistHandler = options.persist || (async (columns) => {
            await this.dataSource.save(columns);
        });
    this.#persistDebounceMs = options.persistDebounceMs ?? 0;
        this.logger = options.logger;
    }
    /** @type {(columns: any[], state: KanbanState, context?: any) => Promise<void>} */
    #persistHandler;
    /** Allow overriding persistence strategy at runtime */
    setPersist(handler) { if (typeof handler === 'function') this.#persistHandler = handler; }
    async load() { // backward-compat convenience
    this.logger?.debug('state.load()');
    await this.loadAll();
    }
    async loadColumns() {
    this.logger?.debug('state.loadColumns()');
        const meta = await (this.dataSource.getColumnsMeta?.() ?? this.dataSource.getColumns());
        // normalize to Column[] with empty tickets
        this.columns = meta.map(c => new Column({ id: c.id, name: c.name, tickets: [] }));
    }
    async loadTickets(columnId) {
    this.logger?.debug('state.loadTickets()', columnId);
        if (!this.columns.length) await this.loadColumns();
        const col = this.columns.find(c => c.id === columnId);
        if (!col) return;
        const tickets = await (this.dataSource.getTicketsByColumnId?.(columnId));
        if (Array.isArray(tickets)) {
            col.tickets = tickets.map(t => new Ticket({ ...t, label: sanitizeLabel(t.label), category: sanitizeCategory(t.category), complexity: sanitizeComplexity(t.complexity) }));
        }
    }
    async loadAll() {
    this.logger?.debug('state.loadAll()');
        // If dataSource supports meta + per-column tickets, use it; else fallback to full snapshot
        if (this.dataSource.getColumnsMeta && this.dataSource.getTicketsByColumnId) {
            await this.loadColumns();
            for (const c of this.columns) {
                await this.loadTickets(c.id);
            }
        } else {
            this.columns = await this.dataSource.getColumns();
        }
    }
    #persistTimer = null;
    #persistDebounceMs = 0;
    async persist(context) {
        this.logger?.debug('state.persist()', context);
        if (!this.#persistDebounceMs) {
            await this.#persistHandler(this.columns, this, context);
            return;
        }
        if (this.#persistTimer) clearTimeout(this.#persistTimer);
        await new Promise((resolve) => {
            this.#persistTimer = setTimeout(async () => {
                this.#persistTimer = null;
                await this.#persistHandler(this.columns, this, context);
                resolve();
            }, this.#persistDebounceMs);
        });
    }
    /** @private */
    #findTicket(ticketId) {
        for (const col of this.columns) {
            const idx = col.tickets.findIndex(t => t.id === ticketId);
            if (idx !== -1) return { ticket: col.tickets[idx], col, idx };
        }
        return null;
    }
    async moveTicket(ticketId, toColumnId, toIndex) {
    if (!ticketId || !toColumnId || toIndex == null) return;
    this.logger?.debug('state.moveTicket()', { ticketId, toColumnId, toIndex });
        let found = null, fromCol = null, fromIdx = -1;
        for (const col of this.columns) {
            const idx = col.tickets.findIndex(t => t.id === ticketId);
            if (idx !== -1) { found = col.tickets[idx]; fromCol = col; fromIdx = idx; break; }
        }
        if (!found) return;
        fromCol.tickets.splice(fromIdx, 1);
        const toCol = this.columns.find(c => c.id === toColumnId);
        if (!toCol) return;
        const clampedIndex = Math.max(0, Math.min(toIndex, toCol.tickets.length));
        toCol.tickets.splice(clampedIndex, 0, found);
    await this.persist({ op: 'moveTicket', ticketId, toColumnId, toIndex });
    }
    async addTicket(columnId, ticket) {
    if (!columnId) return;
    this.logger?.debug('state.addTicket()', { columnId, ticket });
        const col = this.columns.find(c => c.id === columnId);
        if (!col) return;
    const toAdd = ticket && ticket.id ? ticket : new Ticket({ ...(ticket || {}), label: sanitizeLabel(ticket?.label), category: sanitizeCategory(ticket?.category), complexity: sanitizeComplexity(ticket?.complexity) });
        col.tickets.unshift(toAdd);
    await this.persist({ op: 'addTicket', columnId, ticket: (typeof toAdd.toJSON === 'function' ? toAdd.toJSON() : toAdd) });
    }
    async reset(newCols) {
    this.logger?.debug('state.reset()');
        this.columns = (newCols || []).map(c => c instanceof Column ? c : new Column(c));
    await this.persist({ op: 'reset' });
    }
}
export default KanbanState;
