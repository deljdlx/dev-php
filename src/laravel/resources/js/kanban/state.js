import Column from './models/Column';
import Ticket from './models/Ticket';
import { sanitizeTaxonomies, legacyToTaxonomies, ALLOWED_TAXONOMIES } from './utils/taxonomies';

class KanbanState {
    /**
     * @param {object} dataSource - must implement getColumns() and save(columns)
     * @param {{ persist?: (columns: any[], state: KanbanState, context?: any) => Promise<void> }} [options]
     */
    constructor(dataSource, options = {}) {
        this.dataSource = dataSource;
        this.columns = [];
    this.board = { taxonomies: Object.fromEntries(Object.entries(ALLOWED_TAXONOMIES).map(([k, set]) => [k, new Set(set)])) };
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
    getTaxonomyOptions(key) {
        const meta = this.board?.taxonomies?.[key];
        if (!meta) return [];
        const opts = meta.options || [];
        return Array.isArray(opts) ? opts : [];
    }
    getTaxonomyMeta(key) {
        const meta = this.board?.taxonomies?.[key];
        if (!meta) return { label: key, options: [] };
    return { label: meta.label || key, options: Array.isArray(meta.options) ? meta.options : [] };
    }
    getAllowedMap() {
        // Build a map key -> Set(options) for sanitization
        const src = this.board?.taxonomies || {};
        const out = {};
        for (const [k, v] of Object.entries(src)) {
            const keys = (Array.isArray(v?.options) ? v.options : []).map(o => o.key);
            out[k] = new Set(keys);
        }
        return out;
    }
    getTaxonomyKeys() {
        return Object.keys(this.board?.taxonomies || {});
    }
    async loadColumns() {
    this.logger?.debug('state.loadColumns()');
        // Load board meta first if available
        if (typeof this.dataSource.getBoardMeta === 'function') {
            const board = await this.dataSource.getBoardMeta();
            // normalize taxonomies to { key: {label, options[]} }
            const tx = {};
            for (const [k, v] of Object.entries(board?.taxonomies || {})) {
                const arr = Array.isArray(v?.options) ? v.options : [];
                tx[k] = { label: v.label || k, options: arr };
            }
            this.board = { taxonomies: tx };
        }
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
            col.tickets = tickets.map(t => {
        const allowed = this.getAllowedMap();
        const tx = t.taxonomies ? sanitizeTaxonomies(t.taxonomies, allowed) : legacyToTaxonomies(t, allowed);
                return new Ticket({ ...t, taxonomies: tx });
            });
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
            // When only getColumns() exists, try to get board meta explicitly
            if (typeof this.dataSource.getBoardMeta === 'function') {
                const board = await this.dataSource.getBoardMeta();
                const tx = {};
                for (const [k, v] of Object.entries(board?.taxonomies || {})) {
                    const arr = Array.isArray(v?.options) ? v.options : [];
                    tx[k] = { label: v.label || k, options: arr };
                }
                this.board = { taxonomies: tx };
            }
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
    const allowed = this.getAllowedMap();
    const toAdd = ticket && ticket.id ? ticket : new Ticket({ ...(ticket || {}), taxonomies: sanitizeTaxonomies(ticket?.taxonomies || legacyToTaxonomies(ticket || {}, allowed), allowed) });
        col.tickets.unshift(toAdd);
    await this.persist({ op: 'addTicket', columnId, ticket: (typeof toAdd.toJSON === 'function' ? toAdd.toJSON() : toAdd) });
    }
    async reset(newData) {
        // newData can be columns[] or { board, columns }
        this.logger?.debug('state.reset()');
        if (Array.isArray(newData)) {
            this.columns = newData.map(c => c instanceof Column ? c : new Column(c));
        } else if (newData && typeof newData === 'object') {
            const board = newData.board;
            if (board && board.taxonomies) {
                // Normalize incoming board meta to { key: {label, options:[{key,label}] } }
                const tx = {};
                for (const [k, v] of Object.entries(board.taxonomies)) {
                    const label = v?.label || k;
                    const arr = Array.isArray(v?.options) ? v.options : (Array.isArray(v) ? v : []);
                    const options = arr.map(o => (typeof o === 'object' && o && 'key' in o) ? o : { key: String(o), label: String(o) });
                    tx[k] = { label, options };
                }
                this.board = { taxonomies: tx };
                if (typeof board.backgroundImage === 'string' && board.backgroundImage) {
                    this.board.backgroundImage = board.backgroundImage;
                }
                if (typeof this.dataSource.setBoardMeta === 'function') {
                    await this.dataSource.setBoardMeta(this.board);
                }
            }
            this.columns = (newData.columns || []).map(c => c instanceof Column ? c : new Column(c));
        } else {
            this.columns = [];
        }
        await this.persist({ op: 'reset' });
    }
}
export default KanbanState;
