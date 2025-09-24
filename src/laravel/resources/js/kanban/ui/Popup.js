/**
 * Lightweight reusable Popup/Modal utility.
 * Usage:
 *  const popup = new Popup();
 *  popup.open({ title: 'Details', content: nodeOrHtmlOrFn, onClose: () => {} });
 */

import escapeHtml from '../utils/escapeHtml';

export default class Popup {
  constructor() {
    this.overlay = null;
    this.container = null;
    this.onClose = null;
    this._escHandler = (e) => { if (e.key === 'Escape') this.close(); };
  }

  open({ title = '', content, closeOnBackdrop = true, onClose = null } = {}) {
    if (this.overlay) this.close();
    this.onClose = onClose;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'presentation');

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    const header = document.createElement('div');
    header.className = 'modal-header';
    const h = document.createElement('div');
    h.className = 'modal-title';
    h.textContent = String(title || '');
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.setAttribute('aria-label', 'Fermer');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => this.close());
    header.appendChild(h);
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'modal-body';
    if (typeof content === 'function') {
      const node = content();
      if (node instanceof HTMLElement) body.appendChild(node); else body.innerHTML = String(node ?? '');
    } else if (content instanceof HTMLElement) {
      body.appendChild(content);
    } else if (content != null) {
      body.innerHTML = String(content);
    }

    modal.appendChild(header);
    modal.appendChild(body);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    this.overlay = overlay;
    this.container = modal;

    if (closeOnBackdrop) {
      overlay.addEventListener('click', (e) => { if (e.target === overlay) this.close(); });
    }
    document.addEventListener('keydown', this._escHandler);

    // focus handling
    closeBtn.focus({ preventScroll: true });
  }

  close() {
    if (!this.overlay) return;
    document.removeEventListener('keydown', this._escHandler);
    this.overlay.remove();
    this.overlay = null;
    this.container = null;
    try { this.onClose?.(); } catch {}
    this.onClose = null;
  }
}
