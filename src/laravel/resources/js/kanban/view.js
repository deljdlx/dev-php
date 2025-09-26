import Sortable from 'sortablejs';
import TicketCard from './ui/TicketCard';
import Popup from './ui/Popup';
import escapeHtml from './utils/escapeHtml';
import openCreateTicketPopup from './ui/createTicket';

export class KanbanView {
    constructor(root, state, logger = null) {
        this.root = root;
        this.state = state;
        this.sortables = new Map();
        this.logger = logger;
    this.popup = new Popup();
        this.render();
    }
    dispose() {
        for (const s of this.sortables.values()) {
            try { s?.destroy?.(); } catch {}
        }
        this.sortables.clear();
        try { this.popup?.close?.(); } catch {}
        this.root.innerHTML = '';
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
                openCreateTicketPopup({ view: this, state: this.state, logger: this.logger, columnId: col.id });
            });
        }
    }
    updateCounts() {
        for (const el of this.root.querySelectorAll('.col')) {
            const list = el.querySelector('.list');
            if (!list) continue;
            let visible = 0;
            const cards = list.querySelectorAll('.card');
            for (const card of cards) {
                // Count only visible cards (filtered ones hidden via display:none won't have offsetParent)
                if (card.offsetParent !== null) visible++;
            }
            el.querySelector('.count').textContent = String(visible);
        }
    }
    createCardElement(ticket) {
        return new TicketCard(ticket, {
            allowedMap: this.state.getAllowedMap?.(),
                authors: Array.isArray(this.state.board?.authors) ? this.state.board.authors : [],
            onClick: (id, el, data) => {
                this.logger?.debug('ticket.click', { id });
                this.popup.open({
                    title: data?.title || 'Ticket',
                    content: () => {
                        const wrap = document.createElement('div');
                        const buildTaxoField = (key, valKey) => {
                            if (valKey == null || valKey === '') return '';
                            const meta = this.state.getTaxonomyMeta?.(key);
                            const optionLabel = meta?.options?.find?.(o => o.key === valKey)?.label ?? valKey;

                            if (key === 'label') {
                                return `<span class=\"label ${valKey}\">${escapeHtml(String(optionLabel))}</span>`;
                            }
                            if (key === 'category') {
                                return `<span class=\"category cat-${valKey}\">${escapeHtml(String(optionLabel))}</span>`;
                            }
                            if (key === 'complexity') {
                                return `<span class=\"complexity complexity-${String(valKey).toLowerCase()}\">${escapeHtml(String(optionLabel))}</span>`;
                            }
                            return `<span class=\"taxo-chip taxo-${escapeHtml(String(key))} taxo-${escapeHtml(String(key))}-${escapeHtml(String(valKey))}\">${escapeHtml(String(optionLabel))}</span>`;
                        };
                        const tx = data?.taxonomies || {};
                        const txRows = Object.entries(tx).map(([k, v]) => {
                            const chip = buildTaxoField(k, v);
                            if (!chip) return '';
                            const label = escapeHtml(String(this.state.getTaxonomyMeta?.(k)?.label || k));
                            return `<div class=\"ticket-field ticket-taxo-${escapeHtml(String(k))}\"><span class=\"field-label\">${label}:</span><span class=\"field-value\">${chip}</span></div>`;
                        }).join('');
                        const authors = Array.isArray(this.state.board?.authors) ? this.state.board.authors : [];
                        const authorName = (data?.authorId ? (authors.find(a => a.id === data.authorId)?.name) : null) || data?.author || null;
                        wrap.innerHTML = `
                            <div class=\"ticket-details\">
                                <div class=\"ticket-field ticket-author\">
                                    <span class=\"field-label\">Auteur:</span>
                                    <span class=\"field-value\">${authorName ? escapeHtml(String(authorName)) : '-'}</span>
                                </div>
                                ${txRows}
                                <div class=\"ticket-field ticket-created\">
                                    <span class=\"field-label\">Créé le:</span>
                                    <span class=\"field-value\">${escapeHtml(new Date(data?.createdAt||Date.now()).toLocaleString())}</span>
                                </div>
                                ${data?.description ? `
                                    <div class=\"ticket-field ticket-description\">
                                        <span class=\"field-label\">Description:</span>
                                        <div class=\"field-value\">${escapeHtml(String(data.description))}</div>
                                    </div>
                                ` : ''}
                            </div>
                        `;
                        return wrap;
                    }
                });
            }
        }).render();
    }
}
