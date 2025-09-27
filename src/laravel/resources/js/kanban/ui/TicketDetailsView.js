import escapeHtml from '../utils/escapeHtml';
import { buildTaxoChip } from './TaxonomyChipBuilder';

export default class TicketDetailsView {
  constructor({ getTaxonomyMeta, authors } = {}) {
    this.getTaxonomyMeta = getTaxonomyMeta;
    this.authors = Array.isArray(authors) ? authors : [];
  }

  render(ticketData) {
    const wrap = document.createElement('div');
    const tx = ticketData?.taxonomies || {};
    const txRows = Object.entries(tx).map(([k, v]) => {
      const chip = buildTaxoChip(k, v, this.getTaxonomyMeta);
      if (!chip) return '';
      const label = escapeHtml(String(this.getTaxonomyMeta?.(k)?.label || k));
      return `<div class="ticket-field ticket-taxo-${escapeHtml(String(k))}"><span class="field-label">${label}:</span><span class="field-value">${chip}</span></div>`;
    }).join('');
    const authorName = (ticketData?.authorId ? (this.authors.find(a => a.id === ticketData.authorId)?.name) : null) || ticketData?.author || null;
    wrap.innerHTML = `
      <div class="ticket-details">
        <div class="ticket-field ticket-author">
          <span class="field-label">Auteur:</span>
          <span class="field-value">${authorName ? escapeHtml(String(authorName)) : '-'}</span>
        </div>
        ${txRows}
        <div class="ticket-field ticket-created">
          <span class="field-label">Créé le:</span>
          <span class="field-value">${escapeHtml(new Date(ticketData?.createdAt||Date.now()).toLocaleString())}</span>
        </div>
        ${ticketData?.description ? `
          <div class="ticket-field ticket-description">
            <span class="field-label">Description:</span>
            <div class="field-value">${escapeHtml(String(ticketData.description))}</div>
          </div>
        ` : ''}
      </div>
    `;
    return wrap;
  }
}
