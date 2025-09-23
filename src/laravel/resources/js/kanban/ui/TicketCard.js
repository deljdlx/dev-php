import formatTicketDate from '../utils/formatDate';
import escapeHtml from '../utils/escapeHtml';
import sanitizeLabel from '../utils/sanitizeLabel';

/**
 * TicketCard: agnostic UI component for rendering a ticket card element.
 * - No state or datasource dependency
 * - Accepts callbacks for interactions
 */
class TicketCard {
  /**
   * @param {{
   *   id: string,
   *   title: string,
   *   label?: 'blue'|'green'|'orange'|null,
   *   createdAt?: number
   * }} ticket
   * @param {{
   *   onClick?: (id: string, el: HTMLElement) => void,
   *   onRemove?: (id: string, el: HTMLElement) => void
   * }} [opts]
   */
  constructor(ticket, opts = {}) {
    this.ticket = { ...ticket, label: sanitizeLabel(ticket.label) };
    this.onClick = opts.onClick;
    this.onRemove = opts.onRemove;
  }

  /** Create the DOM element for the ticket card */
  render() {
    const el = document.createElement('div');
    el.className = 'card';
    el.dataset.id = this.ticket.id;
    el.setAttribute('role', 'listitem');
    el.setAttribute('aria-label', this.ticket.title);

    const labelHtml = this.ticket.label
      ? `<span class="label ${this.ticket.label}">${escapeHtml(String(this.ticket.label).toUpperCase())}</span>`
      : '';

    el.innerHTML = `
      <div class="card-title">${escapeHtml(this.ticket.title)}</div>
      <div class="card-meta">
        <span>${formatTicketDate(this.ticket.createdAt)}</span>
        ${labelHtml}
      </div>
    `;

    if (this.onClick) {
      el.addEventListener('click', () => this.onClick?.(this.ticket.id, el));
    }

    return el;
  }
}

export default TicketCard;
