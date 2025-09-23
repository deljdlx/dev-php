import Sortable from 'sortablejs';
import TicketCard from './ui/TicketCard';

export class KanbanView {
    constructor(root, state, logger = null) {
        this.root = root;
        this.state = state;
        this.sortables = new Map();
        this.logger = logger;
        this.render();
    }
    #colIdFromList(el) { return el?.closest('.col')?.dataset.colId; }
    render() {
        this.root.innerHTML = '';
        for (const col of this.state.columns) {
            const section = document.createElement('section');
            section.className = 'col';
            section.dataset.colId = col.id;
            section.setAttribute('role', 'region');
            section.setAttribute('aria-labelledby', `col-title-${col.id}`);
            section.innerHTML = `
                <div class="col-header">
                    <div class="col-title" id="col-title-${col.id}">${col.name}</div>
                    <div class="count" aria-live="polite" aria-atomic="true">${col.tickets.length}</div>
                </div>
                <div class="list" id="list-${col.id}" role="list" aria-describedby="col-title-${col.id}"></div>
                <button class="btn" data-add="${col.id}" style="width:100%; margin-top:8px;">+ Ajouter</button>
            `;
            this.root.appendChild(section);

            const list = section.querySelector('.list');
            for (const t of col.tickets) list.appendChild(this.createCardElement(t));

        const sortable = new Sortable(list, {
                group: 'kanban',
                animation: 150,
                ghostClass: 'ghost',
                dragClass: 'drag-hint',
                onAdd: async (evt) => {
                    this.logger?.debug('view.onAdd', { item: evt.item?.dataset?.id, to: this.#colIdFromList(evt.to), newIndex: evt.newIndex });
                    // Fired on destination list for cross-column moves
                    const ticketId = evt.item.dataset.id;
            const toColId = this.#colIdFromList(evt.to);
                    const toIndex = evt.newIndex;
                    await this.state.moveTicket(ticketId, toColId, toIndex);
                    this.updateCounts();
                },
                onUpdate: async (evt) => {
                    this.logger?.debug('view.onUpdate', { item: evt.item?.dataset?.id, to: this.#colIdFromList(evt.to), newIndex: evt.newIndex });
                    // Fired on same-column reorders
                    const ticketId = evt.item.dataset.id;
            const toColId = this.#colIdFromList(evt.to);
                    const toIndex = evt.newIndex;
                    await this.state.moveTicket(ticketId, toColId, toIndex);
                    this.updateCounts();
                }
            });
            this.sortables.set(col.id, sortable);

            section.querySelector('[data-add]')?.addEventListener('click', async () => {
                const title = prompt('Titre de la carte:');
                if (!title) return;
                const labels = [null, 'blue', 'green', 'orange'];
                const ticket = { id: undefined, title, label: labels[Math.floor(Math.random()*labels.length)], createdAt: Date.now() };
                this.logger?.debug('view.addTicket', { columnId: col.id, ticket });
                await this.state.addTicket(col.id, ticket);
                // Find the just-added ticket (at index 0)
                const added = this.state.columns.find(c => c.id === col.id)?.tickets[0] ?? ticket;
                const el = this.createCardElement(added);
                list.prepend(el);
                // place focus on the added card for keyboard users
                el.setAttribute('tabindex', '-1');
                el.focus({ preventScroll: true });
                this.updateCounts();
            });
        }
    }
    updateCounts() {
        for (const el of this.root.querySelectorAll('.col')) {
            const colId = el.dataset.colId;
            const count = this.state.columns.find(c => c.id === colId)?.tickets.length ?? 0;
            el.querySelector('.count').textContent = String(count);
        }
    }
    createCardElement(ticket) {
        return new TicketCard(ticket).render();
    }
}
