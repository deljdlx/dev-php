import formatTicketDate from '../utils/formatDate';
import escapeHtml from '../utils/escapeHtml';
import { sanitizeTaxonomies, legacyToTaxonomies } from '../utils/taxonomies';

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
    const tx = sanitizeTaxonomies(ticket?.taxonomies || legacyToTaxonomies(ticket || {}));
    this.ticket = { ...ticket, taxonomies: tx, label: tx.label ?? null, category: tx.category ?? null, complexity: tx.complexity ?? null };
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

  // Build dynamic taxonomy chips with backward-compatible classes for known keys
  const tx = this.ticket.taxonomies || {};
  const chips = [];
  for (const [k, v] of Object.entries(tx)) {
    if (v == null || v === '') continue;
    const key = String(k);
    const val = String(v);
    if (key === 'label') chips.push(`<span class="label ${val}">${escapeHtml(val.toUpperCase())}</span>`);
    else if (key === 'category') chips.push(`<span class="category cat-${val}">${escapeHtml(val)}</span>`);
    else if (key === 'complexity') chips.push(`<span class="complexity complexity-${val.toLowerCase()}">${escapeHtml(val.toUpperCase())}</span>`);
    else chips.push(`<span class="taxo-chip taxo-${escapeHtml(key)} taxo-${escapeHtml(key)}-${escapeHtml(val)}">${escapeHtml(val)}</span>`);
  }

  const descHtml = this.ticket.description ? `<div class="card-desc">${escapeHtml(this.ticket.description)}</div>` : '';

  el.innerHTML = `
      <div class="card-title">${escapeHtml(this.ticket.title)}</div>
      ${descHtml}
      <div class="card-meta">
    <span>${formatTicketDate(this.ticket.createdAt)}</span>
  ${this.ticket.author ? `<span class="author">${escapeHtml(this.ticket.author)}</span>` : ''}
    ${chips.join(' ')}
      </div>
    `;

  el.addEventListener('click', () => this.onClick?.(this.ticket.id, el, this.ticket));

    return el;
  }
}

export default TicketCard;
