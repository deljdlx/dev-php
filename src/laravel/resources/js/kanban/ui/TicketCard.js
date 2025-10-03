import formatTicketDate from '../utils/formatDate';
import escapeHtml from '../utils/escapeHtml';
import { sanitizeTaxonomies, legacyToTaxonomies } from '../utils/taxonomies';

import { KanbanView } from '../KanbanView';
import { KanbanState } from '../models/KanbanState';

/**
 * TicketCard: agnostic UI component for rendering a ticket card element.
 * - No state or datasource dependency
 * - Accepts callbacks for interactions
 * - Can receive an allowedMap to sanitize taxonomies against board meta
 */
class TicketCard {
  /**
   * @param {KanbanView} board
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


  /**
   * @type  {KanbanView}
   */
  board = null;

  /**
   * @type {KanbanState}
   */
  state = null;

  constructor(board, ticket, opts = {}) {
    this.board = board;
    this.state = board.getState();
    this.popup = board.popup;
    this.opts = opts;


    const tx = sanitizeTaxonomies(ticket?.taxonomies || legacyToTaxonomies(ticket || {}), opts.allowedMap);
    this.ticket = { ...ticket, taxonomies: tx };
    this.onRemove = opts.onRemove;
  }


  buildTaxoField(key, valKey) {
    if (valKey == null || valKey === '') return '';

    const meta = this.getTaxonomyMeta?.(key);
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
  }

  getTaxonomyMeta(key) {
    return this.board.getState().getTaxonomyMeta?.(key);
  }



  onClick(id, el, data) {


    console.group('%cTicketCard.js :: 36 =============================', 'color: #612426; font-size: 1rem');
    console.log('id', id);
    console.groupEnd();

    this.logger?.debug('ticket.click', { id });
    this.popup.open({
      title: data?.title || 'Ticket',
      content: () => {
        const wrap = document.createElement('div');
        const tx = data?.taxonomies || {};
        const txRows = Object.entries(tx).map(([k, v]) => {
          const chip = this.buildTaxoField(k, v);
          if (!chip) return '';
          const label = escapeHtml(String(this.getTaxonomyMeta?.(k)?.label || k));
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
                        <span class=\"field-value\">${escapeHtml(new Date(data?.createdAt || Date.now()).toLocaleString())}</span>
                    </div>
                    ${data?.description ? `
                        <div class=\"ticket-field ticket-description\">\n                                        <span class=\"field-label\">Description:</span>\n                                        <div class=\"field-value\">${escapeHtml(String(data.description))}</div>\n                                    </div>
                    ` : ''}
                </div>
                <div class=\"tf-actions\" style=\"margin-top: 8px;\">
                  <button type=\"button\" class=\"btn btn-danger\" data-delete>Supprimer</button>
                </div>
            `;
        setTimeout(() => {
          const del = wrap.querySelector('[data-delete]');
          del?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openDeleteConfirm(el);
          });
        });
        return wrap;
      }
    });
  }


  openDeleteConfirm(el) {
    const id = this.ticket.id;
    const title = this.ticket.title;
    this.popup.open({
      title: 'Supprimer ce ticket ?',
      content: () => {
        const wrap = document.createElement('div');
        wrap.innerHTML = `
          <div style="display:grid; gap:12px;">
            <p>Êtes-vous sûr de vouloir supprimer «\u00A0${escapeHtml(String(title))}\u00A0» ?</p>
            <p style="color: var(--kanban-muted); font-size: 12px;">Cette action est irréversible.</p>
            <div style="display:flex; gap:8px; justify-content:flex-end;">
              <button class="btn" data-cancel>Annuler</button>
              <button class="btn btn-danger" data-confirm>Supprimer</button>
            </div>
          </div>
        `;
        setTimeout(() => {
          const cancel = wrap.querySelector('[data-cancel]');
          const confirm = wrap.querySelector('[data-confirm]');
          cancel?.addEventListener('click', () => this.popup.close());
          confirm?.addEventListener('click', async () => {
            try {
              await this.onRemove?.(id, el, this.ticket);
            } finally {
              this.popup.close();
            }
          });
        });
        return wrap;
      }
    });
  }




  /** Create and return the DOM element for the ticket card */
  render() {
    const el = document.createElement('div');
    el.className = 'card';
    el.dataset.id = this.ticket.id;
    el.setAttribute('role', 'listitem');
    el.setAttribute('aria-label', this.ticket.title);

    // Propagate taxonomy tags onto the card container (classes + data-attributes)
    const tx = this.ticket.taxonomies || {};
    const sanitize = (s) => String(s).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const txKeys = Object.keys(tx);
    if (txKeys.length) el.classList.add('has-taxonomies');
    for (const [k, v] of Object.entries(tx)) {
      const keySafe = sanitize(k);
      if (keySafe) el.classList.add(`taxo-key-${keySafe}`);
      if (v != null && v !== '') {
        const valSafe = sanitize(v);
        el.setAttribute(`data-taxo-${keySafe}`, String(v));
        if (keySafe && valSafe) el.classList.add(`taxo-${keySafe}-${valSafe}`);
      } else {
        el.setAttribute(`data-taxo-${keySafe}`, '');
      }
    }

    // Build dynamic taxonomy chips with backward-compatible classes for known keys
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

    // author rendering: prefer entity name via authorId, fallback to legacy author string
    const authors = Array.isArray(this?.opts?.authors) ? this.opts.authors : (Array.isArray(window.__kanbanAuthors) ? window.__kanbanAuthors : []);
    const authorName = (this.ticket.authorId ? (authors.find(a => a.id === this.ticket.authorId)?.name) : null) || this.ticket.author || null;

    el.innerHTML = `
      <div class="card-title">${escapeHtml(this.ticket.title)}</div>
      <div class="card-actions">
        <button type="button" class="btn btn-icon btn-danger card-delete" aria-label="Supprimer" title="Supprimer">🗑</button>
      </div>
      ${descHtml}
      <div class="card-meta">
    <span>${formatTicketDate(this.ticket.createdAt)}</span>
  ${authorName ? `<span class="author">${escapeHtml(authorName)}</span>` : ''}
    ${chips.join(' ')}
      </div>
    `;

    el.addEventListener('click', () => this.onClick?.(this.ticket.id, el, this.ticket));
    const delBtn = el.querySelector('.card-delete');
    delBtn?.addEventListener('click', (e) => { e.stopPropagation(); this.openDeleteConfirm(el); });

    return el;
  }
}

export default TicketCard;
