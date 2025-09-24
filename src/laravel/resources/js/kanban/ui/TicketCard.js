import formatTicketDate from '../utils/formatDate';
import escapeHtml from '../utils/escapeHtml';
import sanitizeLabel from '../utils/sanitizeLabel';
import sanitizeCategory from '../utils/sanitizeCategory';

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
    this.ticket = { ...ticket, label: sanitizeLabel(ticket.label), category: sanitizeCategory(ticket.category) };
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

      console.group('%cTicketCard.js :: 42 =============================', 'color: #626228; font-size: 1rem');
      console.log('ticket:', this.ticket);
      console.groupEnd();


    const categoryHtml = this.ticket.category
      ? `<span class="category cat-${this.ticket.category}">${escapeHtml(String(this.ticket.category))}</span>`
      : '';

    const descHtml = this.ticket.description ? `<div class="card-desc">${escapeHtml(this.ticket.description)}</div>` : '';

  el.innerHTML = `
      <div class="card-title">${escapeHtml(this.ticket.title)}</div>
      ${descHtml}
      <div class="card-meta">
    <span>${formatTicketDate(this.ticket.createdAt)}</span>
    ${this.ticket.author ? `<span class="author">${escapeHtml(this.ticket.author)}</span>` : ''}
        ${labelHtml}
        ${categoryHtml}
      </div>
    `;

    if (this.onClick) {
      el.addEventListener('click', () => this.onClick?.(this.ticket.id, el));
    }

    return el;
  }
}

export default TicketCard;
