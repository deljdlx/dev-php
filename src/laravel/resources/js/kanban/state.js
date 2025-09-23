import { Column, Ticket } from './models';

export class KanbanState {
    constructor(storageKey = 'demo.kanban') {
        this.storageKey = storageKey;
        this.columns = [];
    }
    load(initialFactory) {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
            try {
                const data = JSON.parse(raw);
                this.columns = data.columns.map(c => new Column(c));
                return;
            } catch (_) {}
        }
        this.columns = initialFactory();
        this.persist();
    }
    persist() {
        localStorage.setItem(this.storageKey, JSON.stringify({ columns: this.columns }));
    }
    moveTicket(ticketId, toColumnId, toIndex) {
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
        this.persist();
    }
    addTicket(columnId, ticket) {
        const col = this.columns.find(c => c.id === columnId);
        if (!col) return;
        col.tickets.unshift(ticket);
        this.persist();
    }
    reset(newCols) {
        this.columns = newCols;
        this.persist();
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
