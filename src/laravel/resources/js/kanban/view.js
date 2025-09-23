import Sortable from 'sortablejs';

export class KanbanView {
    constructor(root, state) {
        this.root = root;
        this.state = state;
        this.sortables = new Map();
        this.render();
    }
    #colIdFromList(el) { return el?.closest('.col')?.dataset.colId; }
    render() {
        this.root.innerHTML = '';
        for (const col of this.state.columns) {
            const section = document.createElement('section');
            section.className = 'col';
            section.dataset.colId = col.id;
            section.innerHTML = `
                <div class="col-header">
                    <div class="col-title">${col.name}</div>
                    <div class="count">${col.tickets.length}</div>
                </div>
                <div class="list" id="list-${col.id}"></div>
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
                    // Fired on destination list for cross-column moves
                    const ticketId = evt.item.dataset.id;
            const toColId = this.#colIdFromList(evt.to);
                    const toIndex = evt.newIndex;
                    await this.state.moveTicket(ticketId, toColId, toIndex);
                    this.updateCounts();
                },
                onUpdate: async (evt) => {
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
                await this.state.addTicket(col.id, ticket);
                // Find the just-added ticket (at index 0)
                const added = this.state.columns.find(c => c.id === col.id)?.tickets[0] ?? ticket;
                list.prepend(this.createCardElement(added));
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
        const wrap = document.createElement('div');
        wrap.className = 'card';
        wrap.dataset.id = ticket.id;
        wrap.innerHTML = `
            <div class="card-title">${this.#escape(ticket.title)}</div>
            <div class="card-meta">
                <span>${new Date(ticket.createdAt).toLocaleDateString()}</span>
                ${ticket.label ? `<span class="label ${ticket.label}">${ticket.label.toUpperCase()}</span>` : ''}
            </div>
        `;
        return wrap;
    }
    #escape(s) { return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
}
