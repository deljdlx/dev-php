/**
 * PopupModalAdapter: adapte l'utilitaire Popup existant au contrat ModalService.
 * open({ title, body, footer, onClose }) -> { close() }
 */
import Popup from '../Popup';

export default class PopupModalAdapter {
  /**
   * @param {{ title?: string, body?: HTMLElement|string, footer?: HTMLElement|string, onClose?: () => void }} options
   * @returns {{ close: () => void }}
   */
  open(options = {}) {
    const popup = new Popup();
    const { title = '', body = '', footer = null, onClose = null } = options || {};

    const wrap = document.createElement('div');
    if (body instanceof HTMLElement) {
      wrap.appendChild(body);
    } else if (body != null) {
      wrap.innerHTML = String(body);
    }
    if (footer) {
      const footerEl = document.createElement('div');
      if (footer instanceof HTMLElement) footerEl.appendChild(footer);
      else footerEl.innerHTML = String(footer);
      footerEl.style.marginTop = '8px';
      wrap.appendChild(footerEl);
    }

    popup.open({ title, content: () => wrap, onClose });

    return {
      close: () => popup.close()
    };
  }
}
