import Sortable from 'sortablejs';
import TicketCard from './ui/TicketCard';
import Popup from './ui/Popup';
import openCreateTicketPopup from './ui/createTicket';

/** @typedef {import('./models/KanbanState').default} KanbanState */

/**
 * KanbanView (Vue principale)
 * - Affiche les colonnes et les cartes
 * - Délègue la persistance et la logique métier à KanbanState
 * - Reçoit un logger optionnel
 */
export class KanbanView {
  /**
   * @param {HTMLElement} root
   * @param {KanbanState} state
   * @param {{ debug?: Function } | null} [logger]
   * @param {{ modal?: { open: Function } }} [services]
   */
  constructor(root, state, logger = null, services = {}) {
    this.root = root;
    this.state = state;
    this.sortables = new Map();
    this.logger = logger;
    this.popup = new Popup();
    // Injected services (DI): modal is optional; fallback remains this.popup for compatibility
    this.services = { modal: services?.modal || null };
    this.render();
  }


  /**
   * @return {KanbanState}
   */
  getState() {
    return this.state;
  }


  dispose() {
    for (const s of this.sortables.values()) {
      try { s?.destroy?.(); } catch { }
    }
    this.sortables.clear();
    try { this.popup?.close?.(); } catch { }
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
    return new TicketCard(
      this,
      ticket, {
      allowedMap: this.state.getAllowedMap?.(),
      authors: Array.isArray(this.state.board?.authors) ? this.state.board.authors : [],
      modal: this.services.modal, // pass injected modal service to the card
      onClick: (id, el, data) => {
        this.onClick(id, el, data);
      },
      onRemove: async (id, el) => {
        try {
          await this.state.removeTicket(id);
          el?.remove();
          this.updateCounts();
        } catch (e) {
          this.logger?.debug?.('removeTicket.error', e);
        }
      }
    }).render();
  }
}
