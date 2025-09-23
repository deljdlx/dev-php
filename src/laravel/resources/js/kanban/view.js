import Sortable from 'sortablejs';

export class KanbanView {
    constructor(root, state) {
        this.root = root;
        this.state = state;
        this.sortables = new Map();
        this.render();
    }
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
                onEnd: (evt) => {
                    const ticketId = evt.item.dataset.id;
                    const toColId = section.dataset.colId;
                    const toIndex = evt.newIndex;
                    this.state.moveTicket(ticketId, toColId, toIndex);
                    this.updateCounts();
                }
            });
            this.sortables.set(col.id, sortable);

            section.querySelector('[data-add]')?.addEventListener('click', () => {
                const title = prompt('Titre de la carte:');
                if (!title) return;
                const labels = [null, 'blue', 'green', 'orange'];
                const ticket = { id: undefined, title, label: labels[Math.floor(Math.random()*labels.length)], createdAt: Date.now() };
                this.state.addTicket(col.id, ticket);
                list.prepend(this.createCardElement(ticket));
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
