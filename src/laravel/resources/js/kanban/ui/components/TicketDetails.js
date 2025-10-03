import escapeHtml from '../../utils/escapeHtml';
import { renderTaxonomyChip } from './TaxonomyChip';

/**
 * Build a DOM node that contains the ticket details section.
 * @param {object} params
 * @param {{ id: string, title: string, description?: string|null, author?: string|null, authorId?: string|null, taxonomies?: Record<string,string|null>, createdAt?: number }} params.ticket
 * @param {(key: string) => ({label: string, options: Array<{key:string, label:string}> }|undefined)} params.getTaxonomyMeta
 * @param {{ id: string, name: string }[]} [params.authors]
 * @returns {HTMLElement}
 */
export function buildTicketDetails({ ticket, getTaxonomyMeta, authors = [] }) {
  const wrap = document.createElement('div');
  const tx = ticket?.taxonomies || {};
  const txRows = Object.entries(tx).map(([k, v]) => {
    const chip = renderTaxonomyChip(k, v, getTaxonomyMeta?.(k));
    if (!chip) return '';
    const label = escapeHtml(String(getTaxonomyMeta?.(k)?.label || k));
    return `<div class="ticket-field ticket-taxo-${escapeHtml(String(k))}"><span class="field-label">${label}:</span><span class="field-value">${chip}</span></div>`;
  }).join('');

  const authorName = (ticket?.authorId ? (authors.find(a => a.id === ticket.authorId)?.name) : null) || ticket?.author || null;
  wrap.innerHTML = `
      <div class="ticket-details">
        <div class="ticket-field ticket-author">
          <span class="field-label">Auteur:</span>
          <span class="field-value">${authorName ? escapeHtml(String(authorName)) : '-'}</span>
        </div>
        ${txRows}
        <div class="ticket-field ticket-created">
          <span class="field-label">Créé le:</span>
          <span class="field-value">${escapeHtml(new Date(ticket?.createdAt || Date.now()).toLocaleString())}</span>
        </div>
        ${ticket?.description ? `
          <div class="ticket-field ticket-description">
            <span class="field-label">Description:</span>
            <div class="field-value">${escapeHtml(String(ticket.description))}</div>
          </div>
        ` : ''}
      </div>
    `;
  return wrap;
}
