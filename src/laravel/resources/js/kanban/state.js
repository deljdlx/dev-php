import Column from './models/Column';
import Ticket from './models/Ticket';

class KanbanState {
    constructor(dataSource) {
        this.dataSource = dataSource; // must implement getColumns() and save(columns)
        this.columns = [];
    }
    async load() { // backward-compat convenience
        await this.loadAll();
    }
    async loadColumns() {
        const meta = await (this.dataSource.getColumnsMeta?.() ?? this.dataSource.getColumns());
        // normalize to Column[] with empty tickets
        this.columns = meta.map(c => new Column({ id: c.id, name: c.name, tickets: [] }));
    }
    async loadTickets(columnId) {
        if (!this.columns.length) await this.loadColumns();
        const col = this.columns.find(c => c.id === columnId);
        if (!col) return;
        const tickets = await (this.dataSource.getTicketsByColumnId?.(columnId));
        if (Array.isArray(tickets)) {
            col.tickets = tickets.map(t => new Ticket(t));
        }
    }
    async loadAll() {
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
    async persist() {
        await this.dataSource.save(this.columns);
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
        await this.persist();
    }
    async addTicket(columnId, ticket) {
        if (!columnId) return;
        const col = this.columns.find(c => c.id === columnId);
        if (!col) return;
        const toAdd = ticket && ticket.id ? ticket : new Ticket(ticket || {});
        col.tickets.unshift(toAdd);
        await this.persist();
    }
    async reset(newCols) {
        this.columns = (newCols || []).map(c => c instanceof Column ? c : new Column(c));
        await this.persist();
    }
}
export default KanbanState;
