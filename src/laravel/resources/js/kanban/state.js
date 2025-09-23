import { Column, Ticket } from './models';

export class KanbanState {
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
    async moveTicket(ticketId, toColumnId, toIndex) {
        let found = null, fromCol = null, fromIdx = -1;
        for (const col of this.columns) {
            const idx = col.tickets.findIndex(t => t.id === ticketId);
            if (idx !== -1) { found = col.tickets[idx]; fromCol = col; fromIdx = idx; break; }
        }
        if (!found) return;
        fromCol.tickets.splice(fromIdx, 1);
        const toCol = this.columns.find(c => c.id === toColumnId);
        if (!toCol) return;
        toCol.tickets.splice(toIndex, 0, found);
        await this.persist();
    }
    async addTicket(columnId, ticket) {
        const col = this.columns.find(c => c.id === columnId);
        if (!col) return;
        const toAdd = ticket && ticket.id ? ticket : new Ticket(ticket || {});
        col.tickets.unshift(toAdd);
        await this.persist();
    }
    async reset(newCols) {
        this.columns = newCols;
        await this.persist();
    }
}

export function demoFactory() {
    const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];
    const sampleTitles = [
        'Configurer CI GitHub', 'Corriger bug pagination', 'Design page profil',
        'Intégrer Stripe', 'Refacto service mail', 'Rédiger docs API', 'Revue sécurité'
    ];
    const mk = (n) => Array.from({length:n}, () => new Ticket({
        title: pick(sampleTitles) + ' #' + Math.floor(Math.random()*900+100),
        label: pick([null,'blue','green','orange'])
    }));
    return [
        new Column({ id:'todo',   name:'À faire',     tickets: mk(4) }),
        new Column({ id:'doing',  name:'En cours',    tickets: mk(3) }),
        new Column({ id:'review', name:'En revue',    tickets: mk(2) }),
        new Column({ id:'done',   name:'Terminé',     tickets: mk(3) }),
    ];
}
