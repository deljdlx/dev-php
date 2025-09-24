import formatTicketDate from '../utils/formatDate';
import escapeHtml from '../utils/escapeHtml';
import { sanitizeTaxonomies, legacyToTaxonomies } from '../utils/taxonomies';

/**
 * TicketCard: agnostic UI component for rendering a ticket card element.
 * - No state or datasource dependency
 * - Accepts callbacks for interactions
 * - Can receive an allowedMap to sanitize taxonomies against board meta
 */
class TicketCard {
  /**
   * @param {Object} ticket
   * @param {string} ticket.id
   * @param {string} ticket.title
   * @param {(string|null)} [ticket.description]
   * @param {(string|null)} [ticket.author]
   * @param {Object<string, (string|null)>} [ticket.taxonomies]
   * @param {number} [ticket.createdAt]
   * @param {(string|null)} [ticket.label] Legacy support
   * @param {(string|null)} [ticket.category] Legacy support
   * @param {(string|null)} [ticket.complexity] Legacy support
   * @param {Object} [opts]
   * @param {(id: string, el: HTMLElement) => void} [opts.onClick]
   * @param {(id: string, el: HTMLElement) => void} [opts.onRemove]
   * @param {Object<string, Set<string>>} [opts.allowedMap] Map of taxonomyKey -> Set of allowed option keys
   */
  constructor(ticket, opts = {}) {
   const tx = sanitizeTaxonomies(ticket?.taxonomies || legacyToTaxonomies(ticket || {}), opts.allowedMap);
  this.ticket = { ...ticket, taxonomies: tx };
    this.onClick = opts.onClick;
    this.onRemove = opts.onRemove;
  }

  /** Create and return the DOM element for the ticket card */
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
      const valKey = String(v);
      // Known taxo keys keep their legacy classes
      if (key === 'label') chips.push(`<span class="label ${valKey}">${escapeHtml(valKey.toUpperCase())}</span>`);
      else if (key === 'category') chips.push(`<span class="category cat-${valKey}">${escapeHtml(valKey)}</span>`);
      else if (key === 'complexity') chips.push(`<span class="complexity complexity-${valKey.toLowerCase()}">${escapeHtml(valKey.toUpperCase())}</span>`);
      else chips.push(`<span class="taxo-chip taxo-${escapeHtml(key)} taxo-${escapeHtml(key)}-${escapeHtml(valKey)}">${escapeHtml(valKey)}</span>`);
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
