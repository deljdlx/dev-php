import NewTicketForm from './NewTicketForm';

/**
 * Open the create-ticket popup, handle submit, add to state and DOM.
 * @param {{ view: any, state: any, logger?: any, columnId?: string }} ctx
 */
export default function openCreateTicketPopup({ view, state, logger, columnId } = {}) {
  const form = NewTicketForm({
    getOptions: (k) => state.getTaxonomyOptions(k),
    getKeys: () => state.getTaxonomyKeys(),
    getMeta: (k) => state.getTaxonomyMeta(k),
  });

  view.popup.open({
    title: 'Créer un ticket',
    content: () => {
      setTimeout(() => {
        form.el.addEventListener('submit', async (e) => {
          e.preventDefault();
          if (!form.el.checkValidity?.() && form.el.reportValidity) {
            form.el.reportValidity();
            return;
          }
          const data = form.getData();
          const targetCol = columnId ? state.columns.find(c => c.id === columnId) : state.columns[0];
          if (!targetCol) return;
          const ticket = {
            id: undefined,
            title: data.title,
            description: data.description,
            author: data.author,
            taxonomies: data.taxonomies,
            createdAt: Date.now(),
          };
          logger?.debug?.('createTicket.submit', { columnId: targetCol.id, ticket });
          await state.addTicket(targetCol.id, ticket);
          const list = document.querySelector(`#list-${targetCol.id}`);
          const added = state.columns.find(c => c.id === targetCol.id)?.tickets[0] ?? ticket;
          const card = view.createCardElement(added);
          list?.prepend(card);
          card.setAttribute('tabindex', '-1');
          card.focus({ preventScroll: true });
          view.updateCounts();
          view.popup.close();
        }, { once: true });
      });
      return form.el;
    },
  });
}
